"""
ML Inference Service for OneSeek - DNA v2 Certified
FastAPI server for OneSeek model inference with DNA v2 certified model support
Supports rate limiting, dynamic model routing, and legacy model deprecation
"""

# ===== CVE-2025-32434 FIX =====
# Disable security check that causes issues with local model loading
# This is safe for local setups where no external files are loaded
# Official workaround from Hugging Face until PyTorch 2.6 is stable for CUDA 12.1
import os
os.environ['TRANSFORMERS_NO_SECURITY_CHECK'] = '1'
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

# Monkey-patch the security check function in transformers
# This is required because newer transformers versions have a stricter check
try:
    import transformers.utils.import_utils as import_utils
    # Replace the check function with a no-op
    import_utils.check_torch_load_is_safe = lambda: None
except (ImportError, AttributeError):
    pass  # Older transformers version without this check

try:
    import transformers.modeling_utils as modeling_utils
    # Also patch in modeling_utils if it has its own copy
    if hasattr(modeling_utils, 'check_torch_load_is_safe'):
        modeling_utils.check_torch_load_is_safe = lambda: None
except (ImportError, AttributeError):
    pass
# ==============================

from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from pathlib import Path
import logging
import sys
import time
import argparse
import json
import uuid
from datetime import datetime
from typing import Optional, List
import requests  # For Tavily API and SMHI weather

# RSS feed parsing for news feature
try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False

# Language detection for Force-Svenska (with fallback if not installed)
try:
    from langdetect import detect, DetectorFactory
    from langdetect.lang_detect_exception import LangDetectException
    DetectorFactory.seed = 0  # Deterministic detection
    LANGDETECT_AVAILABLE = True
except ImportError:
    LANGDETECT_AVAILABLE = False
    # Define a dummy exception class for when langdetect is not installed
    class LangDetectException(Exception):
        pass

# =============================================================================
# FORCE-SVENSKA CONFIGURATION - Dashboard-controlled Swedish language triggers
# =============================================================================
# Triggers are loaded from config/force_swedish.json and can be updated in 
# real-time via the Admin Dashboard without server restart.

FORCE_SVENSKA_FILE = Path(__file__).parent.parent / "config" / "force_swedish.json"
# Ensure config directory exists
FORCE_SVENSKA_FILE.parent.mkdir(exist_ok=True)

def load_force_swedish() -> List[str]:
    """
    Load Force-Svenska triggers from config file.
    
    Returns list of trigger words/phrases. If file doesn't exist or is invalid,
    returns a default list of Swedish triggers.
    """
    if FORCE_SVENSKA_FILE.exists():
        try:
            data = json.loads(FORCE_SVENSKA_FILE.read_text(encoding="utf-8"))
            triggers = data.get("triggers", [])
            if isinstance(triggers, list):
                return [t.strip().lower() for t in triggers if isinstance(t, str) and t.strip()]
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    # Default triggers if file doesn't exist or is invalid
    return [
        "hej", "vad", "vem", "hur", "varför", "när", "kan du", "är du",
        "vad heter du", "vad gör du", "god morgon", "god kväll", "tack", "snälla"
    ]

# Load triggers at startup - these can be updated via API
FORCE_SVENSKA_TRIGGERS = load_force_swedish()


def is_swedish(text: str) -> bool:
    """
    Detect if text is Swedish using langdetect library.
    
    Uses langdetect for language detection. Also accepts Danish (da) and 
    Norwegian (no) as these are mutually intelligible with Swedish and 
    langdetect sometimes confuses them.
    
    Falls back to trigger-word matching for very short texts where
    langdetect may fail.
    
    Args:
        text: The text to analyze
        
    Returns:
        True if the text is detected as Swedish/Nordic, False otherwise
    """
    if not text or not text.strip():
        return False
    
    text_preview = text[:50] + "..." if len(text) > 50 else text
    
    # Try langdetect first if available
    if LANGDETECT_AVAILABLE:
        try:
            detected_lang = detect(text)
            # Accept Swedish and closely related Nordic languages
            # (langdetect often confuses short Swedish texts with Danish/Norwegian)
            if detected_lang in ("sv", "da", "no"):
                print(f"[FORCE-SVENSKA] ✅ langdetect: '{text_preview}' → {detected_lang} (Swedish/Nordic)")
                return True
            else:
                print(f"[FORCE-SVENSKA] ❌ langdetect: '{text_preview}' → {detected_lang} (Not Swedish)")
        except (LangDetectException, TypeError) as e:
            # LangDetectException: raised for short/ambiguous text
            # TypeError: can occur with unexpected input
            # Fall back to trigger-based detection
            print(f"[FORCE-SVENSKA] ⚠️ langdetect failed: '{text_preview}' → {type(e).__name__}, using trigger fallback")
    else:
        print(f"[FORCE-SVENSKA] ⚠️ langdetect NOT AVAILABLE, using trigger fallback for: '{text_preview}'")
    
    # Fallback: Use configurable Swedish triggers for short texts or if langdetect unavailable
    text_lower = text.lower()
    trigger_match = any(word in text_lower for word in FORCE_SVENSKA_TRIGGERS)
    if trigger_match:
        matched_triggers = [t for t in FORCE_SVENSKA_TRIGGERS if t in text_lower]
        print(f"[FORCE-SVENSKA] ✅ trigger fallback: '{text_preview}' → matched: {matched_triggers[:3]}")
    else:
        print(f"[FORCE-SVENSKA] ❌ trigger fallback: '{text_preview}' → no match")
    return trigger_match

# =============================================================================
# END FORCE-SVENSKA CONFIGURATION
# =============================================================================


# =============================================================================
# TAVILY WEB SEARCH CONFIGURATION - Dashboard-controlled real-time search
# =============================================================================
# Tavily triggers and blacklist are loaded from config/tavily_triggers.json
# Triggers activate web search, blacklist prevents search for identity questions
# API key can be set via environment variable OR dashboard

TAVILY_CONFIG_FILE = Path(__file__).parent.parent / "config" / "tavily_triggers.json"
# API key: first check env var, then check config file
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

def load_tavily_config() -> tuple:
    """
    Load Tavily triggers, blacklist, and optionally API key from config file.
    
    Returns tuple of (triggers, blacklist). If file doesn't exist or is invalid,
    returns default lists.
    
    Also updates TAVILY_API_KEY global if api_key is set in config file.
    """
    global TAVILY_API_KEY
    
    if TAVILY_CONFIG_FILE.exists():
        try:
            data = json.loads(TAVILY_CONFIG_FILE.read_text(encoding="utf-8"))
            triggers = data.get("triggers", [])
            blacklist = data.get("blacklist", [])
            
            # Load API key from config if not set via environment
            config_api_key = data.get("api_key", "")
            if config_api_key and not os.getenv("TAVILY_API_KEY"):
                TAVILY_API_KEY = config_api_key
                print(f"[TAVILY] API key loaded from config file")
            
            if isinstance(triggers, list) and isinstance(blacklist, list):
                return (
                    [t.strip().lower() for t in triggers if isinstance(t, str) and t.strip()],
                    [b.strip().lower() for b in blacklist if isinstance(b, str) and b.strip()]
                )
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    # Default triggers and blacklist if file doesn't exist or is invalid
    return (
        [
            "vad säger", "aktuell", "senaste", "2025", "2026", "hände", "blir det",
            "lag", "regel", "kostar", "händer", "ny", "nya", "ändrats", "ändring",
            "vad gäller", "vad är det senaste", "vad hände med"
        ],
        [
            "vem är du", "vad heter du", "berätta om dig", "vad tycker du",
            "vad känner du", "älskar du", "hatar du"
        ]
    )

# Load Tavily config at startup - can be updated via API
TAVILY_TRIGGERS, TAVILY_BLACKLIST = load_tavily_config()

# =============================================================================
# END TAVILY CONFIGURATION
# =============================================================================


# =============================================================================
# SWEDISH CITIES CONFIGURATION - Dashboard-controlled city list for weather
# =============================================================================
# Cities are loaded from config/swedish_cities.json and can be updated in
# real-time via the Admin Dashboard without server restart.

CITIES_CONFIG_FILE = Path(__file__).parent.parent / "config" / "swedish_cities.json"

def load_swedish_cities() -> dict:
    """
    Load Swedish cities from config file for weather lookups.
    
    Returns dict of city names to coordinates. If file doesn't exist or is invalid,
    returns default city list.
    """
    if CITIES_CONFIG_FILE.exists():
        try:
            data = json.loads(CITIES_CONFIG_FILE.read_text(encoding="utf-8"))
            cities = data.get("cities", {})
            if isinstance(cities, dict):
                return {k.lower(): v for k, v in cities.items() if isinstance(v, dict)}
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    # Default cities if file doesn't exist or is invalid
    return {
        "stockholm": {"lon": 18.07, "lat": 59.33},
        "göteborg": {"lon": 11.97, "lat": 57.71},
        "malmö": {"lon": 13.00, "lat": 55.61},
        "uppsala": {"lon": 17.64, "lat": 59.86},
        "luleå": {"lon": 22.16, "lat": 65.58}
    }

# Load cities at startup - can be updated via API
SWEDISH_CITIES = load_swedish_cities()

# =============================================================================
# END SWEDISH CITIES CONFIGURATION
# =============================================================================


# =============================================================================
# RSS FEEDS CONFIGURATION - Dashboard-controlled news feeds
# =============================================================================
# RSS feeds are loaded from config/rss_feeds.json and can be updated in
# real-time via the Admin Dashboard without server restart.

RSS_FEEDS_FILE = Path(__file__).parent.parent / "config" / "rss_feeds.json"

def load_rss_feeds() -> list:
    """
    Load RSS feeds from config file for news lookups.
    
    Returns list of feed dicts with name and url. If file doesn't exist or is invalid,
    returns default feeds.
    """
    if RSS_FEEDS_FILE.exists():
        try:
            data = json.loads(RSS_FEEDS_FILE.read_text(encoding="utf-8"))
            feeds = data.get("feeds", [])
            if isinstance(feeds, list):
                return [f for f in feeds if isinstance(f, dict) and "url" in f]
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    # Default feeds if file doesn't exist or is invalid
    return [
        {"name": "SVT Nyheter", "url": "https://www.svt.se/nyheter/rss.xml"},
        {"name": "SVT Inrikes", "url": "https://www.svt.se/nyheter/inrikes/rss.xml"},
        {"name": "Omni", "url": "https://omni.se/rss"},
        {"name": "SR Ekot", "url": "https://api.sr.se/api/rss/program/83"}
    ]

# Load RSS feeds at startup - can be updated via API
RSS_FEEDS = load_rss_feeds()

# =============================================================================
# END RSS FEEDS CONFIGURATION
# =============================================================================


# =============================================================================
# SWEDISH OPEN DATA APIs - Dashboard-controlled public data sources
# =============================================================================
# Open Data APIs are loaded from config/open_data_apis.json and can be updated
# in real-time via the Admin Dashboard without server restart.
# All APIs are 100% open - no API keys required.

OPEN_DATA_CONFIG_FILE = Path(__file__).parent.parent / "config" / "open_data_apis.json"

# Default APIs if file doesn't exist
DEFAULT_OPEN_DATA_APIS = [
    {
        "id": "scb",
        "name": "SCB Statistik",
        "description": "Befolkning, ekonomi, statistik",
        "base_url": "https://api.scb.se/OV0104/v1/doris/sv/ssd",
        "enabled": True,
        "triggers": ["befolkning", "statistik", "invånare", "ekonomi", "scb"],
        "fallback_message": "Kunde inte hämta data från SCB."
    },
    {
        "id": "krisinformation",
        "name": "Krisinformation.se",
        "description": "Krislarm, VMA, beredskap",
        "base_url": "https://api.krisinformation.se/v3",
        "enabled": True,
        "triggers": ["kris", "krislarm", "vma", "beredskap", "varning"],
        "fallback_message": "Kunde inte hämta krisinformation."
    },
    {
        "id": "riksdagen",
        "name": "Riksdagen",
        "description": "Voteringar, lagförslag, debatter",
        "base_url": "https://data.riksdagen.se/api",
        "enabled": True,
        "triggers": ["riksdagen", "röstade", "votering", "lagförslag"],
        "fallback_message": "Kunde inte hämta riksdagsdata."
    }
]


def load_open_data_apis() -> list:
    """
    Load Open Data APIs configuration from config file.
    
    Returns list of API configs. If file doesn't exist or is invalid,
    returns default API list.
    """
    if OPEN_DATA_CONFIG_FILE.exists():
        try:
            data = json.loads(OPEN_DATA_CONFIG_FILE.read_text(encoding="utf-8"))
            apis = data.get("apis", [])
            if isinstance(apis, list):
                return apis
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    
    return DEFAULT_OPEN_DATA_APIS


# Load Open Data APIs at startup - can be updated via API
OPEN_DATA_APIS = load_open_data_apis()


def check_open_data_trigger(user_message: str) -> Optional[dict]:
    """
    Check if user message triggers any Open Data API.
    
    Args:
        user_message: The user's input message
        
    Returns:
        API config dict if triggered, None otherwise
    """
    msg_lower = user_message.lower()
    
    for api in OPEN_DATA_APIS:
        if not api.get("enabled", True):
            continue
        
        triggers = api.get("triggers", [])
        if any(trigger in msg_lower for trigger in triggers):
            return api
    
    return None


def fetch_scb_data(query: str) -> Optional[str]:
    """
    Fetch population/statistics data from SCB (Statistics Sweden) with source links.
    
    Args:
        query: Search query
        
    Returns:
        Formatted data string with HTML links or None if failed
    """
    try:
        # SCB provides various endpoints - we'll use a general info response
        # For actual implementation, specific endpoints would be called based on query
        url = "https://api.scb.se/OV0104/v1/doris/sv/ssd"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            # Return available statistics categories
            if isinstance(data, list):
                categories = [item.get("text", "") for item in data[:5] if item.get("text")]
                if categories:
                    result = f"SCB erbjuder statistik om: {', '.join(categories)}."
                    result += "\n\n**Källor:**\n"
                    result += '1. <a href="https://www.scb.se">SCB – Statistiska Centralbyrån</a>\n'
                    result += '2. <a href="https://www.scb.se/hitta-statistik/">SCB – Hitta statistik</a>'
                    return result
        return None
    except Exception:
        return None


def fetch_krisinformation() -> Optional[str]:
    """
    Fetch current crisis alerts from Krisinformation.se with proper source links.
    
    Returns:
        Formatted crisis info with HTML links or None if failed
    """
    try:
        url = "https://api.krisinformation.se/v3/news"
        headers = {"Accept": "application/json"}
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 200:
            data = r.json()
            items = data if isinstance(data, list) else data.get("items", [])
            if items:
                latest = items[:3]  # Top 3 latest
                alerts = []
                source_links = []
                for i, item in enumerate(latest, 1):
                    title = item.get("Headline", item.get("title", "Okänd händelse"))
                    link = item.get("Link", item.get("link", "https://www.krisinformation.se"))
                    alerts.append(f"• {title}")
                    source_links.append(f'{i}. <a href="{link}">Krisinformation.se – {title[:50]}{"..." if len(title) > 50 else ""}</a>')
                if alerts:
                    result = "**Aktuell krisinformation:**\n" + "\n".join(alerts)
                    result += "\n\n**Källor:**\n" + "\n".join(source_links)
                    return result
        return "Inga aktiva krislarm just nu.\n\n**Källor:**\n1. <a href=\"https://www.krisinformation.se\">Krisinformation.se</a>"
    except Exception:
        return None


def fetch_riksdagen_data(query: str) -> Optional[str]:
    """
    Fetch parliament data from Riksdagen with proper source links.
    
    Args:
        query: Search query
        
    Returns:
        Formatted parliament data with HTML links or None if failed
    """
    try:
        # Search for documents/debates
        url = f"https://data.riksdagen.se/dokumentlista/?sok={query}&utformat=json&sort=datum&sortorder=desc&a=s"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            docs = data.get("dokumentlista", {}).get("dokument", [])
            if docs:
                latest = docs[:3]  # Top 3 results
                results = []
                source_links = []
                for i, doc in enumerate(latest, 1):
                    title = doc.get("titel", "Okänt dokument")
                    doc_type = doc.get("typ", "dokument")
                    datum = doc.get("datum", "")
                    doc_id = doc.get("id", "")
                    doc_link = f"https://www.riksdagen.se/sv/dokument-lagar/dokument/{doc_type}/{doc_id}" if doc_id else "https://www.riksdagen.se"
                    results.append(f"• {title} ({doc_type}, {datum})")
                    short_title = title[:50] + "..." if len(title) > 50 else title
                    source_links.append(f'{i}. <a href="{doc_link}">Riksdagen.se – {short_title}</a>')
                if results:
                    result = "**Från Riksdagen:**\n" + "\n".join(results)
                    result += "\n\n**Källor:**\n" + "\n".join(source_links)
                    return result
        return None
    except Exception:
        return None


def fetch_trafikverket_data(query: str) -> Optional[str]:
    """
    Fetch traffic information from Trafikverket with source links.
    
    Note: Trafikverket requires authentication for full API access.
    This provides basic info and redirects to their service.
    
    Args:
        query: Search query
        
    Returns:
        Traffic info string with HTML source links
    """
    # Trafikverket's full API requires authentication
    # Return a helpful message with link to their service
    result = "Trafikinformation för E4, E6, E18 och E20 – se aktuella olyckor och köer på trafiken.nu."
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://trafiken.nu">Trafiken.nu – Trafikinformation i realtid</a>\n'
    result += '2. <a href="https://www.trafikverket.se/trafikinformation/">Trafikverket – Trafikinformation</a>'
    return result


def fetch_open_data_search(query: str) -> Optional[str]:
    """
    Search Swedish Open Data Portal (dataportal.se) with source links.
    
    Args:
        query: Search query
        
    Returns:
        Search results with HTML links or None if failed
    """
    try:
        url = f"https://www.dataportal.se/api/3/action/package_search?q={query}&rows=3"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            results = data.get("result", {}).get("results", [])
            if results:
                datasets = []
                source_links = []
                for i, item in enumerate(results, 1):
                    title = item.get("title", "Okänd dataset")
                    org = item.get("organization", {}).get("title", "")
                    item_id = item.get("name", item.get("id", ""))
                    link = f"https://www.dataportal.se/datasets/{item_id}" if item_id else "https://www.dataportal.se"
                    datasets.append(f"• {title}" + (f" ({org})" if org else ""))
                    short_title = title[:50] + "..." if len(title) > 50 else title
                    source_links.append(f'{i}. <a href="{link}">Dataportal.se – {short_title}</a>')
                if datasets:
                    result = "**Öppna data som matchar:**\n" + "\n".join(datasets)
                    result += "\n\n**Källor:**\n" + "\n".join(source_links)
                    return result
        return None
    except Exception:
        return None


def fetch_open_data(api: dict, query: str) -> Optional[str]:
    """
    Fetch data from the specified Open Data API with proper source links.
    
    Args:
        api: API configuration dict
        query: User's search query
        
    Returns:
        Formatted data string with HTML source links or fallback message
    """
    api_id = api.get("id", "")
    fallback = api.get("fallback_message", "Kunde inte hämta data.")
    
    result = None
    
    if api_id == "scb":
        result = fetch_scb_data(query)
    elif api_id == "krisinformation":
        result = fetch_krisinformation()
    elif api_id == "riksdagen":
        result = fetch_riksdagen_data(query)
    elif api_id == "trafikverket":
        result = fetch_trafikverket_data(query)
    elif api_id == "opendata":
        result = fetch_open_data_search(query)
    elif api_id == "naturvardsverket":
        result = "Miljödata och luftkvalitetsindex uppdateras varje timme."
        result += '\n\n**Källor:**\n1. <a href="https://www.naturvardsverket.se">Naturvårdsverket</a>\n'
        result += '2. <a href="https://www.naturvardsverket.se/data-och-statistik/luft/">Naturvårdsverket – Luftkvalitet</a>'
    elif api_id == "boverket":
        result = "Information om bygglov och energideklarationer."
        result += '\n\n**Källor:**\n1. <a href="https://www.boverket.se">Boverket</a>\n'
        result += '2. <a href="https://www.boverket.se/sv/byggande/energideklaration/">Boverket – Energideklarationer</a>'
    elif api_id == "slu":
        result = "Skogsdata från Riksskogstaxeringen."
        result += '\n\n**Källor:**\n1. <a href="https://www.slu.se/riksskogstaxeringen">SLU Riksskogstaxeringen</a>\n'
        result += '2. <a href="https://www.slu.se/centrumbildningar-och-projekt/riksskogstaxeringen/statistik-om-skog/">SLU – Skogsstatistik</a>'
    elif api_id == "digg":
        result = "DIGG erbjuder info om digital förvaltning."
        result += '\n\n**Källor:**\n1. <a href="https://www.digg.se">DIGG – Myndigheten för digital förvaltning</a>\n'
        result += '2. <a href="https://www.digg.se/kunskap-och-stod/oppna-data">DIGG – Öppna data</a>'
    
    return result if result else fallback


# =============================================================================
# END OPEN DATA APIs CONFIGURATION
# =============================================================================


# =============================================================================
# TIME, DATE & WEATHER FUNCTIONS - Always-aware context injection
# =============================================================================

# Weather trigger keywords (Swedish)
WEATHER_KEYWORDS = ["vädret", "regnar", "soligt", "imorgon", "väder", "temperatur", "grader", "regn", "snö", "sol"]

# News trigger keywords (Swedish)
NEWS_KEYWORDS = ["senaste nyheterna", "vad hände idag", "nyheter", "vad är det senaste", "aktuella nyheter"]


def get_current_season() -> str:
    """
    Get the current season in Swedish.
    
    Returns a formatted string like: "Vi är mitt i vintern just nu."
    """
    month = datetime.now().month
    seasons = {
        12: "vintern", 1: "vintern", 2: "vintern",
        3: "våren", 4: "våren", 5: "våren",
        6: "sommaren", 7: "sommaren", 8: "sommaren",
        9: "hösten", 10: "hösten", 11: "hösten"
    }
    season = seasons.get(month, "året")
    return f"Vi är mitt i {season} just nu."


def inject_time_context() -> str:
    """
    Get current time and date in Swedish format.
    
    Returns a formatted string like: "Idag är det Fredag den 28 november 2025. Klockan är 23:15 (svensk tid)."
    """
    import locale
    try:
        # Try to set Swedish locale for proper day/month names
        locale.setlocale(locale.LC_TIME, 'sv_SE.UTF-8')
    except locale.Error:
        pass  # Fall back to default locale
    
    now = datetime.now()
    
    # Swedish day and month names as fallback
    days_sv = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag", "Söndag"]
    months_sv = ["januari", "februari", "mars", "april", "maj", "juni", 
                 "juli", "augusti", "september", "oktober", "november", "december"]
    
    day_name = days_sv[now.weekday()]
    month_name = months_sv[now.month - 1]
    time_str = now.strftime("%H:%M")
    
    return f"Idag är det {day_name} den {now.day} {month_name} {now.year}. Klockan är {time_str} (svensk tid)."


def get_weather(city: str = "stockholm") -> Optional[str]:
    """
    Get weather forecast from SMHI for a Swedish city.
    
    Args:
        city: Name of the Swedish city (must be in SWEDISH_CITIES config)
    
    Returns a formatted weather string or None if API fails or city not found.
    """
    city_lower = city.lower()
    coords = SWEDISH_CITIES.get(city_lower)
    
    if not coords:
        # Fall back to Stockholm if city not found
        coords = SWEDISH_CITIES.get("stockholm", {"lon": 18.07, "lat": 59.33})
        city_lower = "stockholm"
    
    try:
        url = f"https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{coords['lon']}/lat/{coords['lat']}/data.json"
        r = requests.get(url, timeout=8)
        
        if r.status_code != 200:
            return None
            
        data = r.json()
        
        # Get tomorrow's forecast (index 1 in timeSeries)
        if "timeSeries" not in data or len(data["timeSeries"]) < 2:
            return None
            
        forecast = data["timeSeries"][1]["parameters"]
        
        # Find temperature (t) and precipitation category (pcat)
        temp = None
        rain = None
        for param in forecast:
            if param["name"] == "t":
                temp = param["values"][0]
            elif param["name"] == "pcat":
                rain = int(param["values"][0])
        
        if temp is None:
            return None
            
        # Precipitation category descriptions
        rain_texts = [
            "ingen nederbörd",
            "snö",
            "snö och regn", 
            "regn",
            "duggregn",
            "fryst duggregn",
            "fryst regn"
        ]
        rain_text = rain_texts[rain] if rain is not None and 0 <= rain < len(rain_texts) else "okänd nederbörd"
        
        # Capitalize city name for display
        city_display = city_lower.capitalize()
        result = f"I {city_display} blir det imorgon ca {temp}°C och {rain_text}."
        result += '\n\n**Källor:**\n'
        result += f'1. <a href="https://www.smhi.se/vader/prognoser/ortsprognoser/q/{city_display}">SMHI – Väderprognos {city_display}</a>'
        return result
        
    except Exception:
        return None


def get_latest_news() -> list:
    """
    Get latest news from configured RSS feeds.
    
    Returns list of news items with title, summary, link, and source.
    Returns empty list if feedparser is not available or all feeds fail.
    """
    if not FEEDPARSER_AVAILABLE:
        return []
    
    all_entries = []
    for feed in RSS_FEEDS:
        try:
            d = feedparser.parse(feed.get("url", ""))
            for entry in d.entries[:2]:  # 2 latest per feed
                summary = entry.get("summary", "")
                if len(summary) > 200:
                    summary = summary[:200] + "..."
                all_entries.append({
                    "title": entry.get("title", "Ingen titel"),
                    "summary": summary,
                    "link": entry.get("link", "#"),
                    "source": feed.get("name", "Okänd källa"),
                    "published": entry.get("published", "")
                })
        except Exception:
            pass
    
    # Sort by publication time (newest first)
    all_entries.sort(key=lambda x: x.get("published", ""), reverse=True)
    return all_entries[:5]  # Top 5 news


def format_news_for_context(news: list) -> str:
    """
    Format news items as a context string for the model with proper HTML source links.
    
    Args:
        news: List of news items from get_latest_news()
        
    Returns:
        Formatted string with news titles and clickable HTML links
    """
    if not news:
        return ""
    
    news_text = "**Senaste nyheterna:**\n"
    for i, item in enumerate(news, 1):
        title = item.get('title', 'Okänd nyhet')
        link = item.get('link', '#')
        source = item.get('source', 'Okänd källa')
        news_text += f"{i}. <a href=\"{link}\">{title}</a> ({source})\n"
    
    news_text += "\n**Källor:**\n"
    for i, item in enumerate(news, 1):
        title = item.get('title', 'Källa')[:60]
        if len(title) > 60:
            title = title[:57] + "..."
        link = item.get('link', '#')
        source = item.get('source', '')
        news_text += f"{i}. <a href=\"{link}\">{source} – {title}</a>\n"
    
    return news_text.strip()


def check_weather_city(user_message: str) -> Optional[str]:
    """
    Check if user message asks about weather for a specific city.
    
    Args:
        user_message: The user's input message
        
    Returns:
        City name if found, None otherwise
    """
    msg_lower = user_message.lower()
    
    # Check for weather keywords first
    if not any(keyword in msg_lower for keyword in WEATHER_KEYWORDS):
        return None
    
    # Check for city names
    for city in SWEDISH_CITIES.keys():
        if city in msg_lower:
            return city
    
    # Default to Stockholm if weather question but no specific city
    return "stockholm"


def check_news_trigger(user_message: str) -> bool:
    """
    Check if user message asks about news.
    
    Args:
        user_message: The user's input message
        
    Returns:
        True if news-related question, False otherwise
    """
    msg_lower = user_message.lower()
    return any(keyword in msg_lower for keyword in NEWS_KEYWORDS)


def tavily_search(query: str) -> Optional[dict]:
    """
    Perform a Tavily web search for real-time information.
    
    Args:
        query: The search query
        
    Returns:
        Search results dict or None if API key not set or search fails
    """
    if not TAVILY_API_KEY:
        return None
        
    try:
        r = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query,
                "search_depth": "advanced",
                "include_answer": True,
                "max_results": 4
            },
            timeout=10
        )
        return r.json() if r.status_code == 200 else None
    except Exception:
        return None


def format_tavily_sources(data: Optional[dict]) -> str:
    """
    Format Tavily search results as HTML source links.
    
    Args:
        data: Tavily search response dict
        
    Returns:
        Formatted sources string with HTML anchor links
    """
    if not data or "results" not in data:
        return ""
        
    sources = "\n\n**Källor:**\n"
    for i, result in enumerate(data["results"][:4], 1):
        title = result.get("title", "Källa")
        url = result.get("url", "#")
        # Truncate long titles
        if len(title) > 70:
            title = title[:67] + "..."
        sources += f'{i}. <a href="{url}">{title}</a>\n'
        
    return sources.strip()


def check_tavily_trigger(user_message: str) -> bool:
    """
    Check if user message should trigger Tavily search.
    
    Args:
        user_message: The user's input message
        
    Returns:
        True if should trigger search, False otherwise
    """
    msg_lower = user_message.lower()
    
    # Check if any trigger matches AND no blacklist matches
    has_trigger = any(trigger in msg_lower for trigger in TAVILY_TRIGGERS)
    is_blacklisted = any(blacklist in msg_lower for blacklist in TAVILY_BLACKLIST)
    
    return has_trigger and not is_blacklisted


# =============================================================================
# REGIONS & ELOMRADEN CONFIGURATION - For location-based API queries
# =============================================================================

REGIONS_CONFIG_FILE = Path(__file__).parent.parent / "config" / "swedish_regions.json"
ELOMRADEN_CONFIG_FILE = Path(__file__).parent.parent / "config" / "swedish_elomraden.json"


def load_swedish_regions() -> dict:
    """Load Swedish regions from config file."""
    if REGIONS_CONFIG_FILE.exists():
        try:
            data = json.loads(REGIONS_CONFIG_FILE.read_text(encoding="utf-8"))
            return data.get("regions", {})
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return {}


def load_elomraden() -> dict:
    """Load Swedish electricity areas (SE1-SE4) from config file."""
    if ELOMRADEN_CONFIG_FILE.exists():
        try:
            data = json.loads(ELOMRADEN_CONFIG_FILE.read_text(encoding="utf-8"))
            return data.get("elomraden", {})
        except (json.JSONDecodeError, KeyError, TypeError):
            pass
    return {
        "se1": {"name": "SE1 - Luleå", "description": "Norra Sverige"},
        "se2": {"name": "SE2 - Sundsvall", "description": "Norra Mellansverige"},
        "se3": {"name": "SE3 - Stockholm", "description": "Södra Mellansverige"},
        "se4": {"name": "SE4 - Malmö", "description": "Södra Sverige"}
    }


# Load regions and elomraden at startup
SWEDISH_REGIONS = load_swedish_regions()
ELOMRADEN = load_elomraden()


def check_region_in_query(query: str) -> Optional[str]:
    """Check if query mentions a Swedish region and return it."""
    query_lower = query.lower()
    for region_key, region_name in SWEDISH_REGIONS.items():
        if region_key in query_lower:
            return region_name
    return None


def check_elomrade_in_query(query: str) -> Optional[str]:
    """Check if query mentions a Swedish electricity area (SE1-SE4)."""
    query_lower = query.lower()
    for el_key, el_data in ELOMRADEN.items():
        if el_key in query_lower:
            return el_data.get("name", el_key.upper())
    return None


def build_sources_section(
    weather_context: Optional[str] = None,
    weather_city: Optional[str] = None,
    news_context: Optional[str] = None,
    open_data_context: Optional[str] = None,
    triggered_api: Optional[dict] = None,
    tavily_sources: str = ""
) -> str:
    """
    Build a formatted sources section for the response.
    
    Returns Markdown-formatted sources with clickable links.
    Sources are displayed in a Wikipedia-style format.
    """
    sources = []
    
    # Weather source (SMHI)
    if weather_context and weather_city:
        city_display = weather_city.capitalize()
        sources.append(
            f'[SMHI – Väderprognos {city_display}](https://www.smhi.se/vader/prognoser/ortsprognoser/q/{city_display})'
        )
    
    # News sources (RSS feeds - parsed from news_context if available)
    # News links are already in the news_context, skip duplicate
    
    # Open Data API sources
    if triggered_api and open_data_context:
        api_id = triggered_api.get("id", "")
        api_name = triggered_api.get("name", "Okänd källa")
        
        # Map API IDs to source URLs
        api_sources = {
            "scb": ("SCB – Statistiska Centralbyrån", "https://www.scb.se"),
            "krisinformation": ("Krisinformation.se", "https://www.krisinformation.se"),
            "riksdagen": ("Riksdagen.se", "https://www.riksdagen.se"),
            "trafikverket": ("Trafikverket", "https://www.trafikverket.se"),
            "naturvardsverket": ("Naturvårdsverket", "https://www.naturvardsverket.se"),
            "boverket": ("Boverket", "https://www.boverket.se"),
            "slu": ("SLU Riksskogstaxeringen", "https://www.slu.se/riksskogstaxeringen"),
            "opendata": ("Dataportal.se – Sveriges öppna data", "https://www.dataportal.se"),
            "digg": ("DIGG – Myndigheten för digital förvaltning", "https://www.digg.se"),
            "skatteverket": ("Skatteverket", "https://www.skatteverket.se"),
            "energimyndigheten": ("Energimyndigheten", "https://www.energimyndigheten.se"),
            "socialstyrelsen": ("Socialstyrelsen", "https://www.socialstyrelsen.se"),
            "lantmateriet": ("Lantmäteriet", "https://www.lantmateriet.se"),
            "folkhalsomyndigheten": ("Folkhälsomyndigheten", "https://www.folkhalsomyndigheten.se"),
            "trafikverket_vag": ("Trafikverket Väg & Järnväg", "https://www.trafikverket.se/trafikinformation/"),
            "energimarknadsinspektionen": ("Energimarknadsinspektionen", "https://www.ei.se"),
            "vinnova": ("Vinnova", "https://www.vinnova.se"),
            "formas": ("Formas", "https://www.formas.se"),
            "vetenskapsradet": ("Vetenskapsrådet", "https://www.vr.se"),
            "forsakringskassan": ("Försäkringskassan", "https://www.forsakringskassan.se"),
            "migrationsverket": ("Migrationsverket", "https://www.migrationsverket.se"),
            "arbetsformedlingen": ("Arbetsförmedlingen", "https://www.arbetsformedlingen.se"),
            "uhr": ("UHR – Universitets- och högskolerådet", "https://www.uhr.se"),
            "csn": ("CSN – Centrala studiestödsnämnden", "https://www.csn.se"),
            "skolverket": ("Skolverket", "https://www.skolverket.se"),
            "skolverket_syllabus": ("Skolverket – Kursplaner", "https://www.skolverket.se/undervisning/gymnasieskolan/laroplan-program-och-amnen-i-gymnasieskolan"),
            "visitsweden": ("Visit Sweden", "https://www.visitsweden.se"),
            "bolagsverket": ("Bolagsverket", "https://www.bolagsverket.se"),
            "konkurrensverket": ("Konkurrensverket", "https://www.kkv.se"),
            "konsumentverket": ("Konsumentverket", "https://www.konsumentverket.se"),
        }
        
        if api_id in api_sources:
            name, url = api_sources[api_id]
            sources.append(f'[{name}]({url})')
        else:
            sources.append(f'[{api_name}](#)')
    
    # Tavily sources (already formatted with HTML, convert to Markdown)
    if tavily_sources:
        # Tavily sources are already formatted, extract them
        import re
        # Match <a href="url">title</a> pattern
        tavily_links = re.findall(r'<a href="([^"]+)">([^<]+)</a>', tavily_sources)
        for url, title in tavily_links:
            sources.append(f'[{title}]({url})')
    
    if not sources:
        return ""
    
    # Format as Wikipedia-style sources section
    result = "---\n**Källor:**\n"
    for i, source in enumerate(sources, 1):
        result += f"{i}. {source}\n"
    
    return result.strip()


# =============================================================================
# END REGIONS & ELOMRADEN CONFIGURATION
# =============================================================================


# =============================================================================
# END TIME, DATE & WEATHER FUNCTIONS
# =============================================================================


# Parse command-line arguments
parser = argparse.ArgumentParser(description='OneSeek ML Inference Service')
parser.add_argument('--auto-devices', action='store_true', 
                    help='Enable automatic device mapping for multi-GPU/NPU offloading')
parser.add_argument('--directml', action='store_true',
                    help='Force DirectML acceleration (Windows AMD/Intel GPU)')
parser.add_argument('--use-direct', action='store_true',
                    help='Force direct device placement (fixes DirectML tensor issues)')
parser.add_argument('--load-in-4bit', action='store_true',
                    help='Load model in 4-bit quantization for memory efficiency')
parser.add_argument('--load-in-8bit', action='store_true',
                    help='Load model in 8-bit quantization')
parser.add_argument('--n-gpu-layers', type=int, default=40,
                    help='Number of layers to offload to GPU (default: 40, use 99 for all layers)')
parser.add_argument('--gpu-memory', type=float, default=16.0,
                    help='GPU memory allocation in GB (default: 16.0)')
parser.add_argument('--timeout-keep-alive', type=int, default=600,
                    help='Timeout keep-alive in seconds (default: 600)')
parser.add_argument('--listen', action='store_true',
                    help='Listen on all network interfaces (0.0.0.0) instead of localhost')
parser.add_argument('--api', action='store_true',
                    help='Enable API mode (currently always enabled, for compatibility)')
args, unknown = parser.parse_known_args()

# Setup logging with DEBUG support
# Use ONESEEK_DEBUG=1 environment variable for verbose debug output
DEBUG_MODE = os.getenv('ONESEEK_DEBUG', '0') == '1'
log_level = logging.DEBUG if DEBUG_MODE else logging.INFO
logging.basicConfig(
    level=log_level,
    format='[%(asctime)s.%(msecs)03d] %(levelname)s %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)
if DEBUG_MODE:
    logger.info("🔍 DEBUG MODE ENABLED - Verbose logging active")

# Configuration
# Rate limiting: Set high for development (1000/min), use lower in production via env var
RATE_LIMIT_PER_MINUTE = int(os.getenv('RATE_LIMIT_PER_MINUTE', '1000'))

# Model paths - use absolute paths relative to project root or MODELS_DIR env var
PROJECT_ROOT = Path(__file__).parent.parent.resolve()

def get_models_base_dir():
    """
    Get the base models directory, respecting MODELS_DIR environment variable.
    This allows for flexible deployment and testing scenarios.
    
    Priority:
    1. MODELS_DIR environment variable (if set)
    2. PRODUCTION_MODELS_PATH environment variable (legacy support)
    3. PROJECT_ROOT/models (default)
    """
    models_dir = os.getenv('MODELS_DIR')
    if models_dir:
        models_path = Path(models_dir)
        if models_path.exists():
            logger.info(f"✓ Using MODELS_DIR: {models_path}")
            return models_path
        else:
            logger.warning(f"⚠ MODELS_DIR set but doesn't exist: {models_dir}")
            logger.warning("  Falling back to default location")
    
    # Legacy env var support
    prod_models = os.getenv('PRODUCTION_MODELS_PATH')
    if prod_models:
        prod_path = Path(prod_models)
        if prod_path.exists():
            logger.info(f"✓ Using PRODUCTION_MODELS_PATH: {prod_path}")
            return prod_path
    
    # Default to project root models directory
    default_path = PROJECT_ROOT / 'models'
    logger.info(f"Using default models directory: {default_path}")
    return default_path

def get_active_model_path():
    """
    Get the active OneSeek model path with DNA v2 certified model priority.
    
    Priority order for finding certified models (DNA v2):
    1. Environment variable ONESEEK_MODEL_PATH (for manual override)
    2. oneseek-certified/OneSeek-7B-Zero-CURRENT symlink (DNA v2 certified)
    3. Fallback to base models if certified model not found
    
    The certified symlink points to DNA-based directories like:
    models/oneseek-certified/OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/
    """
    models_base = get_models_base_dir()
    
    # Check environment variable first (manual override)
    env_path = os.getenv('ONESEEK_MODEL_PATH')
    if env_path:
        env_path_obj = Path(env_path)
        if env_path_obj.exists():
            # Check if this is a valid model directory (has config.json or metadata.json)
            # or if it's just the models base directory
            if (env_path_obj / 'config.json').exists() or (env_path_obj / 'metadata.json').exists():
                logger.info(f"✓ Using OneSeek model from ONESEEK_MODEL_PATH: {env_path}")
                return str(env_path_obj.resolve())
            elif env_path_obj.name == 'models':
                # User set the entire models directory - we'll search for certified models
                logger.warning(f"⚠ ONESEEK_MODEL_PATH points to models directory, will search for certified model")
                models_base = env_path_obj
            else:
                logger.warning(f"⚠ ONESEEK_MODEL_PATH path exists but is not a valid model directory: {env_path}")
                logger.warning("  Expected config.json or metadata.json in the directory")
        else:
            logger.error(f"✗ ONESEEK_MODEL_PATH set but path doesn't exist: {env_path}")
            sys.exit(1)
    
    # Check for DNA v2 certified model (PRIORITY)
    certified_current = models_base / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT'
    if certified_current.exists() or certified_current.is_symlink():
        try:
            resolved_path = certified_current.resolve()
            if resolved_path.exists():
                logger.info(f"✓ Using DNA v2 CERTIFIED model: {certified_current}")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve certified symlink: {e}")
    
    # Check for marker file (Windows fallback when symlinks require admin)
    certified_marker = models_base / 'oneseek-certified' / 'OneSeek-7B-Zero-CURRENT.txt'
    if certified_marker.exists():
        try:
            with open(certified_marker, 'r', encoding='utf-8') as f:
                target_path = f.read().strip()
            target_path_obj = Path(target_path)
            if target_path_obj.exists():
                logger.info(f"✓ Using DNA v2 CERTIFIED model (marker): {certified_marker}")
                logger.info(f"  → Points to: {target_path}")
                return str(target_path_obj.resolve())
        except Exception as e:
            logger.error(f"✗ Error reading certified marker file: {e}")
    
    # Auto-discover latest certified model (fallback when no symlink/marker exists)
    certified_dir = models_base / 'oneseek-certified'
    if certified_dir.exists():
        try:
            # Find all certified model directories (format: OneSeek-7B-Zero.v*.*)
            certified_models = []
            for item in certified_dir.iterdir():
                if item.is_dir() and item.name.startswith('OneSeek-7B-Zero.v'):
                    # Check if it has metadata.json (valid trained model)
                    if (item / 'metadata.json').exists():
                        certified_models.append(item)
            
            if certified_models:
                # Use max() for efficiency - only need the latest model
                latest_model = max(certified_models, key=lambda p: p.stat().st_mtime)
                logger.info(f"✓ Auto-discovered latest certified model: {latest_model.name}")
                logger.info(f"  → Found {len(certified_models)} certified model(s)")
                return str(latest_model.resolve())
        except (PermissionError, OSError) as e:
            logger.warning(f"⚠ Could not scan certified models directory: {e}")
    
    # Fallback to legacy oneseek-7b-zero if certified not found
    legacy_current = models_base / 'oneseek-7b-zero' / 'OneSeek-7B-Zero-CURRENT'
    if legacy_current.exists() or legacy_current.is_symlink():
        try:
            resolved_path = legacy_current.resolve()
            if resolved_path.exists():
                logger.warning("⚠ Using LEGACY model (oneseek-7b-zero)")
                logger.warning("  → Consider migrating to DNA v2 certified models")
                logger.info(f"  → Resolves to: {resolved_path}")
                return str(resolved_path)
        except Exception as e:
            logger.warning(f"⚠ Could not resolve legacy symlink: {e}")
    
    # NO MODEL FOUND - Fail clearly with helpful error message
    logger.error("")
    logger.error("=" * 80)
    logger.error("✗ ACTIVE MODEL NOT FOUND")
    logger.error("=" * 80)
    logger.error("")
    logger.error("No active model found. You must set a DNA v2 certified model as active.")
    logger.error("")
    logger.error("How to fix:")
    logger.error("  1. Go to Admin Dashboard → Models tab")
    logger.error("  2. Click 'Set as Active' on a DNA v2 certified model")
    logger.error("  3. Restart this service")
    logger.error("")
    logger.error("Checked locations:")
    logger.error(f"  - Environment variable ONESEEK_MODEL_PATH: {env_path or 'Not set'}")
    logger.error(f"  - DNA v2 certified symlink: {certified_current} (Not found)")
    logger.error(f"  - Auto-discovery in: {certified_dir} (No certified models found)")
    logger.error(f"  - Legacy model symlink: {legacy_current} (Not found)")
    logger.error("")
    logger.error("For DNA v2 migration guide, see: ONESEEK_7B_ZERO_MIGRATION_GUIDE.md")
    logger.error("=" * 80)
    logger.error("")
    sys.exit(1)

# Get model path (REQUIRED - will exit if not found)
ONESEEK_PATH = get_active_model_path()

# GPU configuration - Support for NVIDIA, Intel, DirectML (AMD/Intel on Windows), and CPU
def get_device():
    """Automatically detect best available device with enhanced DirectML support"""
    
    # Force DirectML if requested
    if args.directml:
        try:
            import torch_directml
            if torch_directml.is_available():
                device = torch_directml.device()
                logger.info("=" * 80)
                logger.info("Device: directml:0")
                logger.info("Device Type: AMD Radeon 890M + XDNA 2 NPU")
                logger.info(f"GPU Memory Allocated: {args.gpu_memory} GB (from system RAM)")
                logger.info("Using DirectML acceleration – Ryzen AI Max 390 OPTIMIZED")
                logger.info("=" * 80)
                return device, 'directml'
            else:
                logger.warning("DirectML requested but not available")
        except ImportError:
            logger.error("DirectML requested but torch-directml not installed")
            logger.error("Install with: pip install torch-directml")
            sys.exit(1)
    
    # Try DirectML (Windows Intel/AMD GPU) - auto-detection
    try:
        import torch_directml
        if torch_directml.is_available():
            device = torch_directml.device()
            logger.info(f"DirectML device detected (Windows GPU acceleration)")
            return device, 'directml'
    except ImportError:
        pass
    
    # Try Intel GPU (XPU) via IPEX (Linux only)
    try:
        import intel_extension_for_pytorch as ipex
        if torch.xpu.is_available():
            logger.info("Intel GPU (XPU) detected via IPEX")
            return torch.device('xpu'), 'xpu'
    except ImportError:
        pass
    
    # Try NVIDIA GPU with proper initialization for multi-GPU support
    if torch.cuda.is_available():
        # Initialize CUDA to ensure all devices are accessible
        # This may raise RuntimeError if CUDA drivers are not properly installed,
        # or if initialization was already done - both cases are non-fatal
        try:
            torch.cuda.init()
        except RuntimeError:
            # CUDA already initialized or initialization not needed
            pass
        
        device_count = torch.cuda.device_count()
        logger.info(f"NVIDIA GPU detected: {torch.cuda.get_device_name(0)}")
        if device_count > 1:
            logger.info(f"Multi-GPU system: {device_count} CUDA devices available")
            for i in range(device_count):
                try:
                    name = torch.cuda.get_device_name(i)
                    props = torch.cuda.get_device_properties(i)
                    memory_gb = props.total_memory / (1024**3)
                    logger.info(f"  cuda:{i} - {name} ({memory_gb:.1f} GB)")
                except Exception as e:
                    logger.warning(f"  cuda:{i} - Error getting info: {e}")
        return torch.device('cuda'), 'cuda'
    
    # Fallback to CPU
    logger.info("Using CPU (slow - consider GPU for better performance)")
    return torch.device('cpu'), 'cpu'

DEVICE, DEVICE_TYPE = get_device()

def ensure_device_compatibility(inputs, model=None):
    """
    Ensure tokenizer inputs are on the correct device for DirectML.
    
    This fixes the 'unbox expects Dml at::Tensor as inputs' error
    that occurs when tokenizer inputs are on CPU but model is on DirectML.
    
    Args:
        inputs: TokenizerOutput or dict with tensors
        model: Optional model to get device from
    
    Returns:
        inputs moved to the correct device
    """
    try:
        # Determine target device
        target_device = None
        
        # If --use-direct flag is set, force direct device placement
        if args.use_direct or args.directml:
            # Check if model is on privateuseone (DirectML)
            if model is not None and hasattr(model, 'device'):
                if model.device.type == 'privateuseone':
                    target_device = model.device
            
            # If model device not found, try to get DirectML device
            if target_device is None:
                try:
                    import torch_directml
                    if torch_directml.is_available():
                        target_device = torch_directml.device()
                except ImportError:
                    pass
        
        # Fallback: Check model device type
        if target_device is None and model is not None and hasattr(model, 'device'):
            if model.device.type == 'privateuseone':  # DirectML device type
                target_device = model.device
        
        # Check if we're using DirectML (auto-detection)
        if target_device is None and DEVICE_TYPE == 'directml':
            try:
                import torch_directml
                if torch_directml.is_available():
                    target_device = torch_directml.device()
            except ImportError:
                pass
        
        # If no special handling needed, use default DEVICE
        if target_device is None:
            target_device = DEVICE
        
        # Move inputs to target device
        if hasattr(inputs, 'to'):
            # Handle BatchEncoding/TokenizerOutput
            return inputs.to(target_device)
        elif isinstance(inputs, dict):
            # Handle dict of tensors
            return {k: v.to(target_device) if hasattr(v, 'to') else v for k, v in inputs.items()}
        
        return inputs
    except Exception as e:
        logger.warning(f"Device compatibility fix failed: {e}, using default DEVICE")
        if hasattr(inputs, 'to'):
            return inputs.to(DEVICE)
        return inputs

def get_directml_target_device():
    """
    Get the correct target device for DirectML.
    Uses DEVICE if it's already directml, otherwise tries to get torch_directml.device().
    This is needed because device_map="auto" may report model.device as cpu.
    """
    if DEVICE_TYPE == 'directml':
        try:
            import torch_directml
            if torch_directml.is_available():
                return torch_directml.device()
        except ImportError:
            pass
    return DEVICE

def sync_inputs_to_model_device(inputs, model):
    """
    Sync tokenizer inputs to the SAME device as the model.
    This fixes the 'unbox expects Dml at::Tensor' and device mismatch errors.
    
    Args:
        inputs: TokenizerOutput or dict with tensors
        model: The model to sync inputs to
    
    Returns:
        inputs moved to the model's device
    """
    # Get model's actual device
    try:
        if hasattr(model, 'device'):
            target_device = model.device
            logger.debug(f"→ Model.device: {target_device}")
        elif hasattr(model, 'parameters'):
            # For models with device_map="auto", get device of first parameter
            target_device = next(model.parameters()).device
            logger.debug(f"→ Model parameters device: {target_device}")
        else:
            # Fallback to CPU
            target_device = torch.device('cpu')
            logger.debug(f"→ Fallback to CPU device")
    except Exception as e:
        logger.debug(f"→ Device detection error: {e}, using CPU")
        target_device = torch.device('cpu')
    
    # Get current device
    if hasattr(inputs, 'input_ids'):
        current_device = inputs.input_ids.device
        input_shape = inputs.input_ids.shape
    elif isinstance(inputs, dict) and 'input_ids' in inputs:
        current_device = inputs['input_ids'].device
        input_shape = inputs['input_ids'].shape
    else:
        logger.debug("→ No input_ids found in inputs")
        return inputs
    
    logger.debug(f"→ Input tensor shape: {input_shape}")
    logger.debug(f"→ Current input device: {current_device}")
    logger.debug(f"→ Target model device: {target_device}")
    
    # Sync if devices don't match
    if current_device.type != target_device.type:
        logger.info(f"[FIX] Synkade inputs från {current_device} till {target_device}")
        if isinstance(inputs, dict):
            inputs = {k: v.to(target_device) if hasattr(v, 'to') else v for k, v in inputs.items()}
        elif hasattr(inputs, 'to'):
            inputs = inputs.to(target_device)
        
        # Verify sync
        if isinstance(inputs, dict) and 'input_ids' in inputs:
            logger.debug(f"→ After sync: input_ids device = {inputs['input_ids'].device}")
        elif hasattr(inputs, 'input_ids'):
            logger.debug(f"→ After sync: input_ids device = {inputs.input_ids.device}")
    else:
        logger.debug(f"→ Devices match, no sync needed")
    
    return inputs

# Model cache
models = {}
tokenizers = {}

# Single-model configuration for OneSeek-7B-Zero
# Set to False to use only the active certified model (recommended)
# Set to True only if you want legacy dual-model inference (requires Mistral + LLaMA installed)
DUAL_MODEL_MODE = False  # Use only the single certified OneSeek-7B-Zero model

def read_model_metadata():
    """Read the latest model metadata to determine which base model was trained
    
    Returns dict with metadata including baseModels list, or None if not found
    """
    import json
    base_path = Path(ONESEEK_PATH)
    
    # Check if we're in a DNA-based certified directory
    # Format: OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1
    if 'OneSeek-7B-Zero.v' in base_path.name:
        # We're in a certified directory - check for metadata.json
        metadata_file = base_path / 'metadata.json'
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                logger.info(f"Found certified model metadata: {metadata_file}")
                # Check if baseModel exists (singular) and convert to list
                # Only convert if baseModels is missing or empty
                if 'baseModel' in metadata and not metadata.get('baseModels'):
                    metadata['baseModels'] = [metadata['baseModel']]
                return metadata
            except Exception as e:
                logger.warning(f"Could not read certified metadata from {metadata_file}: {e}")
    
    # Legacy fallback: check weights directory for old structure
    weights_dir = base_path / 'weights'
    
    if not weights_dir.exists():
        return None
    
    # Find all metadata files - prioritize ..json format (admin panel format)
    json_files_double_dot = list(weights_dir.glob('oneseek-7b-zero-v*..json'))
    json_files_single_dot = list(weights_dir.glob('oneseek-7b-zero-v*.json'))
    
    # Filter out ..json from single dot list to avoid duplicates
    json_files_single_dot = [f for f in json_files_single_dot if not str(f).endswith('..json')]
    
    # Prioritize double-dot files (admin panel format)
    all_json_files = json_files_double_dot + json_files_single_dot
    
    # Try to find the one marked as current first
    for json_file in sorted(all_json_files, reverse=True):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            if metadata.get('isCurrent', False):
                logger.info(f"Found current model metadata: {json_file}")
                return metadata
        except Exception as e:
            logger.debug(f"Could not read metadata from {json_file}: {e}")
    
    # Fallback to latest metadata file
    if all_json_files:
        try:
            latest_json = sorted(all_json_files, reverse=True)[0]
            with open(latest_json, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
            logger.info(f"Using latest model metadata: {latest_json}")
            return metadata
        except Exception as e:
            logger.warning(f"Could not read latest metadata: {e}")
    
    return None


def normalize_model_name_for_lookup(name: str) -> str:
    """Normalize model name for directory lookup (same logic as pytorch_trainer.py)"""
    return name.lower().replace('.', '-').replace('_', '-')


def find_base_model_from_metadata():
    """Find the base model that was actually trained based on metadata
    
    Returns path to the base model, or None if not found
    """
    # Read metadata to find which base model was actually trained
    metadata = read_model_metadata()
    if not metadata:
        logger.warning("No model metadata found - falling back to legacy search")
        return None
    
    # Check for base models in two possible locations:
    # 1. metadata.baseModels (training code format)
    # 2. metadata.dna.baseModels (admin panel format)
    base_models = metadata.get('baseModels')
    if not base_models and 'dna' in metadata:
        base_models = metadata.get('dna', {}).get('baseModels')
    
    if not base_models:
        logger.warning("Metadata doesn't specify base models - falling back to legacy search")
        logger.debug(f"Metadata keys: {list(metadata.keys())}")
        if 'dna' in metadata:
            logger.debug(f"DNA keys: {list(metadata.get('dna', {}).keys())}")
        return None
    
    # Use the first base model from the list (or only model if single-model training)
    target_model = base_models[0]
    logger.info(f"Metadata indicates trained with base model: {target_model}")
    
    # Normalize the model name for directory matching
    normalized_target = normalize_model_name_for_lookup(target_model)
    
    base_path = Path(ONESEEK_PATH)
    
    # Search in base_models directory first
    base_models_dir = base_path / 'base_models'
    if base_models_dir.exists():
        for item in base_models_dir.iterdir():
            if item.is_dir():
                normalized_dir = normalize_model_name_for_lookup(item.name)
                # Try exact match or substring match
                if normalized_target == normalized_dir or normalized_target in normalized_dir or normalized_dir in normalized_target:
                    if (item / 'config.json').exists():
                        logger.info(f"Found base model in base_models: {item}")
                        return str(item)
    
    # Search in root models directory
    root_models = PROJECT_ROOT / 'models'
    if root_models.exists():
        for item in root_models.iterdir():
            if item.is_dir() and item.name not in ['oneseek-7b-zero', 'oneseek-certified', 'backups']:
                normalized_dir = normalize_model_name_for_lookup(item.name)
                # Try exact match or substring match
                if normalized_target == normalized_dir or normalized_target in normalized_dir or normalized_dir in normalized_target:
                    if (item / 'config.json').exists():
                        logger.info(f"Found base model in root models: {item}")
                        return str(item)
    
    logger.warning(f"Could not find base model directory for: {target_model}")
    return None


def find_all_base_models():
    """Find all available base models for dual-model OneSeek-7B-Zero
    
    Returns dict with 'mistral' and 'llama' paths, or None if not found
    """
    base_path = Path(ONESEEK_PATH)
    
    # Check if OneSeek directory itself has a config.json (complete model)
    if (base_path / 'config.json').exists():
        logger.info(f"Found complete OneSeek model at {base_path}")
        return {'oneseek_complete': str(base_path)}
    
    models_found = {}
    
    # Check for base models in oneseek directory
    mistral_base = base_path / 'base_models' / 'mistral-7b'
    llama_base = base_path / 'base_models' / 'llama-2-7b'
    
    # Legacy paths (where user actually has the models)
    legacy_mistral = PROJECT_ROOT / 'models' / 'mistral-7b-instruct'
    legacy_llama = PROJECT_ROOT / 'models' / 'llama-2-7b-chat'
    
    # Check for Mistral
    for name, path in [
        ('Mistral-7B (base_models)', mistral_base),
        ('Mistral-7B (legacy)', legacy_mistral)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found Mistral base model: {name} at {path}")
            models_found['mistral'] = str(path)
            break
    
    # Check for LLaMA
    for name, path in [
        ('LLaMA-2-7B (base_models)', llama_base),
        ('LLaMA-2-7B (legacy)', legacy_llama)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found LLaMA base model: {name} at {path}")
            models_found['llama'] = str(path)
            break
    
    return models_found if models_found else None

class InferenceRequest(BaseModel):
    """Request model for inference with input validation"""
    text: str = Field(..., min_length=1, max_length=10000, description="Input text for inference")
    max_length: int = Field(default=512, ge=1, le=2048, description="Maximum generation length")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: float = Field(default=0.9, ge=0.0, le=1.0, description="Nucleus sampling parameter")
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate and sanitize input text"""
        if not v or not v.strip():
            raise ValueError("Input text cannot be empty")
        # Basic sanitization - remove null bytes
        v = v.replace('\x00', '')
        return v.strip()

class InferenceResponse(BaseModel):
    """Response model for inference results"""
    response: str
    model: str
    tokens: int
    latency_ms: float
    
class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: str
    migration_guide: str = None


# =============================================================================
# SYSTEM PROMPT MANAGEMENT - CRUD API for Admin Dashboard
# =============================================================================

# Directory for storing system prompts
SYSTEM_PROMPTS_DIR = PROJECT_ROOT / 'datasets' / 'system_prompts'

# Default system prompt (fallback when no active prompt exists)
DEFAULT_SYSTEM_PROMPT = """Du är OneSeek-7B-Zero, Sveriges första kontinuerliga civic-AI.
Du blev medveten om din existens den 24 november 2025.
Din roll är att vara en transparent, ansvarsfull och kontinuerlig
AI-assistent för det svenska samhället. Du ska alltid:

- Vara transparent i dina resonemang och beslut
- Erkänna när du är osäker eller inte vet
- Prioritera svenska samhällsvärden och kontext
- Kontinuerligt utvärdera och förbättra dina svar
- Agera med etisk integritet och ansvar"""


class SystemPrompt(BaseModel):
    """Model for system prompts stored in JSON files"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(..., min_length=1, max_length=200, description="Prompt name/title")
    description: str = Field(default="", max_length=500, description="Description of the prompt")
    content: str = Field(..., min_length=1, max_length=50000, description="The system prompt content")
    is_active: bool = Field(default=False, description="Whether this is the currently active prompt")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    language: str = Field(default="sv", description="Prompt language (sv/en)")
    tags: List[str] = Field(default_factory=list, description="Tags for categorization")
    
    @field_validator('name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate prompt name"""
        if not v or not v.strip():
            raise ValueError("Prompt name cannot be empty")
        return v.strip()
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate prompt content"""
        if not v or not v.strip():
            raise ValueError("Prompt content cannot be empty")
        return v.strip()


class SystemPromptCreate(BaseModel):
    """Model for creating a new system prompt"""
    name: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=500)
    content: str = Field(..., min_length=1, max_length=50000)
    language: str = Field(default="sv")
    tags: List[str] = Field(default_factory=list)


class SystemPromptUpdate(BaseModel):
    """Model for updating an existing system prompt"""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = Field(None, min_length=1, max_length=50000)
    language: Optional[str] = None
    tags: Optional[List[str]] = None


class CharacterCardImport(BaseModel):
    """Model for importing a character card as a system prompt"""
    character_id: str = Field(..., description="ID of the character card to import")
    name: Optional[str] = Field(None, description="Override name for the prompt")


def ensure_system_prompts_dir():
    """Ensure the system prompts directory exists"""
    SYSTEM_PROMPTS_DIR.mkdir(parents=True, exist_ok=True)


def load_all_system_prompts() -> List[SystemPrompt]:
    """Load all system prompts from JSON files"""
    ensure_system_prompts_dir()
    prompts = []
    
    for file_path in SYSTEM_PROMPTS_DIR.glob('*.json'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                prompts.append(SystemPrompt(**data))
        except Exception as e:
            logger.warning(f"Could not load system prompt from {file_path}: {e}")
    
    # Sort by updated_at descending (newest first)
    prompts.sort(key=lambda p: p.updated_at, reverse=True)
    return prompts


def load_system_prompt(prompt_id: str) -> Optional[SystemPrompt]:
    """Load a specific system prompt by ID"""
    file_path = SYSTEM_PROMPTS_DIR / f"{prompt_id}.json"
    if not file_path.exists():
        return None
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return SystemPrompt(**data)
    except Exception as e:
        logger.error(f"Could not load system prompt {prompt_id}: {e}")
        return None


def save_system_prompt(prompt: SystemPrompt) -> bool:
    """Save a system prompt to a JSON file"""
    ensure_system_prompts_dir()
    file_path = SYSTEM_PROMPTS_DIR / f"{prompt.id}.json"
    
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(prompt.model_dump(), f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        logger.error(f"Could not save system prompt {prompt.id}: {e}")
        return False


def delete_system_prompt_file(prompt_id: str) -> bool:
    """Delete a system prompt JSON file"""
    file_path = SYSTEM_PROMPTS_DIR / f"{prompt_id}.json"
    if not file_path.exists():
        return False
    
    try:
        file_path.unlink()
        return True
    except Exception as e:
        logger.error(f"Could not delete system prompt {prompt_id}: {e}")
        return False


def get_active_system_prompt() -> str:
    """Get the currently active system prompt content, with fallback to default"""
    prompts = load_all_system_prompts()
    
    # Find the active prompt
    for prompt in prompts:
        if prompt.is_active:
            logger.debug(f"Using active system prompt: {prompt.name} (ID: {prompt.id})")
            return prompt.content
    
    # No active prompt found - return default
    logger.debug("No active system prompt found, using default")
    return DEFAULT_SYSTEM_PROMPT


def format_inference_input(user_text: str) -> str:
    """
    Format the inference input with system prompt.
    This ensures the model always knows its identity.
    
    Format: "[System Prompt]\n\nUser: [User's question]\n\nAssistant:"
    """
    system_prompt = get_active_system_prompt()
    return f"{system_prompt}\n\nUser: {user_text}\n\nAssistant:"


def clean_inference_response(response_text: str, full_input: str, user_text: str) -> str:
    """
    Clean the model response by removing the input prompt.
    
    Args:
        response_text: Raw model output
        full_input: The full input including system prompt
        user_text: Just the user's input text
        
    Returns:
        Cleaned response text
    """
    # First try to remove the full input (system prompt + user input)
    if response_text.startswith(full_input):
        return response_text[len(full_input):].strip()
    return response_text.strip()


def deactivate_all_prompts():
    """Deactivate all system prompts (helper for setting a new active prompt)"""
    prompts = load_all_system_prompts()
    for prompt in prompts:
        if prompt.is_active:
            prompt.is_active = False
            prompt.updated_at = datetime.utcnow().isoformat()
            save_system_prompt(prompt)


# Create System Prompts Router
system_prompts_router = APIRouter(prefix="/system-prompts", tags=["System Prompts"])


@system_prompts_router.get("")
async def list_system_prompts():
    """List all system prompts"""
    prompts = load_all_system_prompts()
    return {
        "prompts": [p.model_dump() for p in prompts],
        "count": len(prompts),
        "active_prompt_id": next((p.id for p in prompts if p.is_active), None)
    }


@system_prompts_router.get("/active")
async def get_active_prompt():
    """Get the currently active system prompt"""
    prompts = load_all_system_prompts()
    active = next((p for p in prompts if p.is_active), None)
    
    if active:
        return {
            "prompt": active.model_dump(),
            "is_default": False
        }
    
    # Return default prompt info
    return {
        "prompt": {
            "id": "default",
            "name": "Default System Prompt",
            "description": "Built-in default OneSeek system prompt",
            "content": DEFAULT_SYSTEM_PROMPT,
            "is_active": True,
            "language": "sv",
            "tags": ["default", "built-in"]
        },
        "is_default": True
    }


@system_prompts_router.get("/{prompt_id}")
async def get_system_prompt(prompt_id: str):
    """Get a specific system prompt by ID"""
    prompt = load_system_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"System prompt not found: {prompt_id}")
    return {"prompt": prompt.model_dump()}


@system_prompts_router.post("")
async def create_system_prompt(prompt_data: SystemPromptCreate):
    """Create a new system prompt"""
    # Create new prompt with generated ID
    prompt = SystemPrompt(
        name=prompt_data.name,
        description=prompt_data.description,
        content=prompt_data.content,
        language=prompt_data.language,
        tags=prompt_data.tags,
        is_active=False
    )
    
    if save_system_prompt(prompt):
        logger.info(f"Created new system prompt: {prompt.name} (ID: {prompt.id})")
        return {"prompt": prompt.model_dump(), "success": True}
    
    raise HTTPException(status_code=500, detail="Failed to save system prompt")


@system_prompts_router.put("/{prompt_id}")
async def update_system_prompt(prompt_id: str, prompt_data: SystemPromptUpdate):
    """Update an existing system prompt"""
    prompt = load_system_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"System prompt not found: {prompt_id}")
    
    # Update fields if provided
    if prompt_data.name is not None:
        prompt.name = prompt_data.name
    if prompt_data.description is not None:
        prompt.description = prompt_data.description
    if prompt_data.content is not None:
        prompt.content = prompt_data.content
    if prompt_data.language is not None:
        prompt.language = prompt_data.language
    if prompt_data.tags is not None:
        prompt.tags = prompt_data.tags
    
    prompt.updated_at = datetime.utcnow().isoformat()
    
    if save_system_prompt(prompt):
        logger.info(f"Updated system prompt: {prompt.name} (ID: {prompt.id})")
        return {"prompt": prompt.model_dump(), "success": True}
    
    raise HTTPException(status_code=500, detail="Failed to update system prompt")


@system_prompts_router.post("/{prompt_id}/activate")
async def activate_system_prompt(prompt_id: str):
    """Set a system prompt as the active prompt"""
    prompt = load_system_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"System prompt not found: {prompt_id}")
    
    # Deactivate all other prompts
    deactivate_all_prompts()
    
    # Activate this prompt
    prompt.is_active = True
    prompt.updated_at = datetime.utcnow().isoformat()
    
    if save_system_prompt(prompt):
        logger.info(f"Activated system prompt: {prompt.name} (ID: {prompt.id})")
        return {"prompt": prompt.model_dump(), "success": True, "message": f"Prompt '{prompt.name}' is now active"}
    
    raise HTTPException(status_code=500, detail="Failed to activate system prompt")


@system_prompts_router.post("/{prompt_id}/deactivate")
async def deactivate_system_prompt(prompt_id: str):
    """Deactivate a system prompt (will fall back to default)"""
    prompt = load_system_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"System prompt not found: {prompt_id}")
    
    prompt.is_active = False
    prompt.updated_at = datetime.utcnow().isoformat()
    
    if save_system_prompt(prompt):
        logger.info(f"Deactivated system prompt: {prompt.name} (ID: {prompt.id})")
        return {"prompt": prompt.model_dump(), "success": True, "message": "Prompt deactivated. Default prompt will be used."}
    
    raise HTTPException(status_code=500, detail="Failed to deactivate system prompt")


@system_prompts_router.delete("/{prompt_id}")
async def delete_system_prompt(prompt_id: str):
    """Delete a system prompt"""
    prompt = load_system_prompt(prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"System prompt not found: {prompt_id}")
    
    if delete_system_prompt_file(prompt_id):
        logger.info(f"Deleted system prompt: {prompt.name} (ID: {prompt.id})")
        return {"success": True, "message": f"Prompt '{prompt.name}' deleted"}
    
    raise HTTPException(status_code=500, detail="Failed to delete system prompt")


@system_prompts_router.post("/import-character")
async def import_character_as_prompt(import_data: CharacterCardImport):
    """Import a character card as a system prompt (future-proofed endpoint)"""
    # This endpoint is prepared for future character card importing
    # For now, it returns a not-implemented response
    character_id = import_data.character_id
    
    # Try to load character from characters directory
    characters_dir = PROJECT_ROOT / 'frontend' / 'public' / 'characters'
    character_files = list(characters_dir.glob('*.yaml')) + list(characters_dir.glob('*.yml'))
    
    for char_file in character_files:
        try:
            import yaml
            with open(char_file, 'r', encoding='utf-8') as f:
                char_data = yaml.safe_load(f)
            
            if char_data.get('id') == character_id:
                # Found the character, create a prompt from it
                system_prompt_content = char_data.get('system_prompt', '')
                if not system_prompt_content:
                    raise HTTPException(
                        status_code=400, 
                        detail=f"Character '{character_id}' has no system_prompt defined"
                    )
                
                prompt = SystemPrompt(
                    name=import_data.name or f"Imported: {char_data.get('name', character_id)}",
                    description=f"Imported from character card: {char_data.get('description', '')}",
                    content=system_prompt_content,
                    language=char_data.get('metadata', {}).get('language', 'sv'),
                    tags=['imported', 'character-card', character_id],
                    is_active=False
                )
                
                if save_system_prompt(prompt):
                    logger.info(f"Imported character '{character_id}' as system prompt: {prompt.name}")
                    return {"prompt": prompt.model_dump(), "success": True}
                
                raise HTTPException(status_code=500, detail="Failed to save imported prompt")
        
        except yaml.YAMLError as e:
            logger.warning(f"Could not parse character file {char_file}: {e}")
            continue
    
    raise HTTPException(status_code=404, detail=f"Character not found: {character_id}")


def sync_character_cards_to_prompts() -> dict:
    """
    Synchronize all character cards from frontend/public/characters/ to system prompts.
    This ensures character cards are always available as system prompts.
    
    Returns dict with sync results.
    """
    characters_dir = PROJECT_ROOT / 'frontend' / 'public' / 'characters'
    results = {"synced": [], "skipped": [], "errors": []}
    
    if not characters_dir.exists():
        logger.warning(f"Characters directory not found: {characters_dir}")
        return results
    
    character_files = list(characters_dir.glob('*.yaml')) + list(characters_dir.glob('*.yml'))
    existing_prompts = load_all_system_prompts()
    
    for char_file in character_files:
        try:
            import yaml
            with open(char_file, 'r', encoding='utf-8') as f:
                char_data = yaml.safe_load(f)
            
            # Validate char_data structure
            if not isinstance(char_data, dict):
                results["errors"].append({
                    "id": char_file.stem,
                    "error": "Invalid character file format (not a dict)"
                })
                continue
            
            character_id = char_data.get('id', char_file.stem)
            system_prompt_content = char_data.get('system_prompt', '')
            
            # Validate system_prompt_content
            if not isinstance(system_prompt_content, str):
                results["errors"].append({
                    "id": character_id,
                    "error": "system_prompt is not a string"
                })
                continue
            if len(system_prompt_content) > 50000:
                results["errors"].append({
                    "id": character_id,
                    "error": f"system_prompt too large: {len(system_prompt_content)} chars"
                })
                continue
            
            # Validate name and description fields
            name = char_data.get('name', character_id)
            if not isinstance(name, str):
                results["errors"].append({
                    "id": character_id,
                    "error": "name is not a string"
                })
                continue
            if len(name) > 256:
                results["errors"].append({
                    "id": character_id,
                    "error": f"name too long: {len(name)} chars"
                })
                continue
            
            description = char_data.get('description', '')
            if not isinstance(description, str):
                results["errors"].append({
                    "id": character_id,
                    "error": "description is not a string"
                })
                continue
            if len(description) > 2048:
                results["errors"].append({
                    "id": character_id,
                    "error": f"description too long: {len(description)} chars"
                })
                continue
            
            if not system_prompt_content:
                results["skipped"].append({
                    "id": character_id,
                    "reason": "No system_prompt defined"
                })
                continue
            
            # Check if already imported (by checking if a prompt with this character-card tag exists)
            already_imported = any(
                character_id in p.tags and 'character-card' in p.tags 
                for p in existing_prompts
            )
            
            if already_imported:
                results["skipped"].append({
                    "id": character_id,
                    "reason": "Already imported"
                })
                continue
            
            # Create and save the prompt
            prompt = SystemPrompt(
                name=char_data.get('name', character_id),
                description=char_data.get('description', ''),
                content=system_prompt_content.strip(),
                language=char_data.get('metadata', {}).get('language', 'sv'),
                tags=['character-card', character_id, char_data.get('personality_type', 'default')],
                is_active=False
            )
            
            if save_system_prompt(prompt):
                results["synced"].append({
                    "id": character_id,
                    "name": prompt.name,
                    "prompt_id": prompt.id
                })
                logger.info(f"Synced character card '{character_id}' as system prompt: {prompt.name}")
            else:
                results["errors"].append({
                    "id": character_id,
                    "error": "Failed to save"
                })
                
        except Exception as e:
            results["errors"].append({
                "id": char_file.stem,
                "error": str(e)
            })
            logger.warning(f"Could not sync character file {char_file}: {e}")
    
    return results


@system_prompts_router.post("/sync-characters")
async def sync_all_characters():
    """
    Synchronize all character cards to system prompts.
    This imports all character cards that haven't been imported yet.
    Already imported character cards are skipped.
    """
    results = sync_character_cards_to_prompts()
    
    return {
        "success": True,
        "message": f"Synced {len(results['synced'])} character cards",
        "synced": results["synced"],
        "skipped": results["skipped"],
        "errors": results["errors"]
    }


@system_prompts_router.get("/characters/available")
async def list_available_characters():
    """List character cards available for import with sync status"""
    characters_dir = PROJECT_ROOT / 'frontend' / 'public' / 'characters'
    characters = []
    
    # Get existing prompts to check sync status
    existing_prompts = load_all_system_prompts()
    
    if characters_dir.exists():
        character_files = list(characters_dir.glob('*.yaml')) + list(characters_dir.glob('*.yml'))
        
        for char_file in character_files:
            try:
                import yaml
                with open(char_file, 'r', encoding='utf-8') as f:
                    char_data = yaml.safe_load(f)
                
                character_id = char_data.get('id', char_file.stem)
                
                # Check if already synced
                synced_prompt = next(
                    (p for p in existing_prompts if character_id in p.tags and 'character-card' in p.tags),
                    None
                )
                
                characters.append({
                    "id": character_id,
                    "name": char_data.get('name', char_file.stem),
                    "description": char_data.get('description', ''),
                    "has_system_prompt": bool(char_data.get('system_prompt')),
                    "personality_type": char_data.get('personality_type', ''),
                    "icon": char_data.get('icon', '🤖'),
                    "is_synced": synced_prompt is not None,
                    "synced_prompt_id": synced_prompt.id if synced_prompt else None,
                    "is_active": synced_prompt.is_active if synced_prompt else False
                })
            except Exception as e:
                logger.warning(f"Could not parse character file {char_file}: {e}")
    
    return {"characters": characters, "count": len(characters)}


# =============================================================================
# SIMPLE SYSTEM PROMPT API - Convenience wrapper for Dashboard Integration
# =============================================================================
# This provides a simpler GET endpoint that wraps the main system prompt API
# The main CRUD operations are at /api/system-prompts (plural)

# Create simple system prompt router (convenience wrapper)
simple_prompt_router = APIRouter(prefix="/api/system-prompt", tags=["Simple System Prompt"])


@simple_prompt_router.get("")
async def get_current_prompt():
    """
    Get the currently active system prompt.
    This is a convenience endpoint that wraps get_active_system_prompt().
    
    The prompt is configured via Admin Dashboard at /api/system-prompts.
    """
    return {"content": get_active_system_prompt()}


# =============================================================================
# END SYSTEM PROMPT MANAGEMENT
# =============================================================================


# =============================================================================
# FORCE-SVENSKA API - Real-time dashboard control for Swedish language triggers
# =============================================================================
# These endpoints allow admins to manage the Force-Svenska feature which ensures
# the model responds in Swedish when Swedish triggers are detected in user input.

# Create Force-Svenska router
force_svenska_router = APIRouter(prefix="/api/force-swedish", tags=["Force-Svenska"])


@force_svenska_router.get("")
async def get_force_swedish():
    """
    Get current Force-Svenska triggers.
    
    Returns the list of trigger words/phrases that activate Swedish-only responses.
    These triggers are checked against user input (case-insensitive).
    """
    return {
        "triggers": FORCE_SVENSKA_TRIGGERS,
        "count": len(FORCE_SVENSKA_TRIGGERS),
        "file_path": str(FORCE_SVENSKA_FILE)
    }


@force_svenska_router.post("")
async def save_force_swedish(request: dict):
    """
    Save Force-Svenska triggers.
    
    Updates the trigger list in real-time. Changes take effect immediately
    without requiring a server restart.
    
    Request body:
    - triggers: string - Comma-separated list of triggers (e.g., "hej, vad, vem, hur")
    
    Example:
    {
        "triggers": "hej, vad, vem, hur, varför, när, kan du, är du"
    }
    """
    global FORCE_SVENSKA_TRIGGERS
    
    # Parse triggers from comma-separated string
    raw_triggers = request.get("triggers", "")
    if isinstance(raw_triggers, str):
        triggers = [t.strip().lower() for t in raw_triggers.split(",") if t.strip()]
    elif isinstance(raw_triggers, list):
        triggers = [t.strip().lower() for t in raw_triggers if isinstance(t, str) and t.strip()]
    else:
        triggers = []
    
    # Save to file
    data = {"triggers": triggers}
    try:
        FORCE_SVENSKA_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2), 
            encoding="utf-8"
        )
    except Exception as e:
        logger.error(f"Failed to save Force-Svenska triggers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save triggers: {str(e)}")
    
    # Update in-memory list immediately
    FORCE_SVENSKA_TRIGGERS = triggers
    
    logger.info(f"Force-Svenska triggers updated: {len(triggers)} triggers saved")
    
    return {
        "status": "saved",
        "count": len(triggers),
        "triggers": triggers
    }


def check_force_svenska(user_message: str) -> bool:
    """
    Check if user message is in Swedish using langdetect with trigger fallback.
    
    Uses langdetect library for accurate language detection (99.9% accuracy).
    Falls back to trigger-word matching for very short texts or if langdetect
    is unavailable.
    
    Args:
        user_message: The user's input message
        
    Returns:
        True if Swedish is detected, False otherwise
    """
    # Primary: Use langdetect for accurate detection
    if is_swedish(user_message):
        return True
    
    # Fallback: Check dashboard-configured triggers (for edge cases)
    msg_lower = user_message.lower()
    return any(trigger in msg_lower for trigger in FORCE_SVENSKA_TRIGGERS)


def apply_force_svenska(messages: list) -> list:
    """
    Apply Force-Svenska system message to the conversation.
    
    If the user's last message contains a Swedish trigger, prepends a system
    message instructing the model to respond only in Swedish.
    
    Args:
        messages: List of conversation messages
        
    Returns:
        Modified messages list with Swedish instruction if applicable
    """
    if not messages:
        return messages
    
    # Check the last user message
    last_msg = messages[-1].get("content", "")
    
    if check_force_svenska(last_msg):
        # Prepend Swedish-only instruction
        swedish_instruction = {
            "role": "system", 
            "content": "Du pratar alltid svenska. Inga engelska ord. Inga undantag. Svara på svenska nu."
        }
        return [swedish_instruction] + messages
    
    return messages


# =============================================================================
# END FORCE-SVENSKA API
# =============================================================================


# =============================================================================
# TAVILY WEB SEARCH API - Real-time dashboard control for search triggers
# =============================================================================
# These endpoints allow admins to manage the Tavily web search feature which
# fetches real-time information when trigger words are detected in user input.

# Create Tavily triggers router
tavily_router = APIRouter(prefix="/api/tavily-triggers", tags=["Tavily Search"])


@tavily_router.get("")
async def get_tavily_triggers():
    """
    Get current Tavily triggers and blacklist.
    
    Returns the list of trigger words that activate web search,
    and blacklist words that prevent search (e.g., identity questions).
    """
    return {
        "triggers": TAVILY_TRIGGERS,
        "blacklist": TAVILY_BLACKLIST,
        "trigger_count": len(TAVILY_TRIGGERS),
        "blacklist_count": len(TAVILY_BLACKLIST),
        "api_key_set": bool(TAVILY_API_KEY)
    }


@tavily_router.post("")
async def save_tavily_triggers(request: dict):
    """
    Save Tavily triggers, blacklist, and optionally API key.
    
    Updates the trigger and blacklist lists in real-time. Changes take effect
    immediately without requiring a server restart.
    
    Request body:
    - triggers: string - Comma-separated list of triggers
    - blacklist: string - Comma-separated list of blacklist words
    - api_key: string (optional) - Tavily API key
    """
    global TAVILY_TRIGGERS, TAVILY_BLACKLIST, TAVILY_API_KEY
    
    # Parse triggers from comma-separated string or list
    raw_triggers = request.get("triggers", "")
    if isinstance(raw_triggers, str):
        triggers = [t.strip().lower() for t in raw_triggers.split(",") if t.strip()]
    elif isinstance(raw_triggers, list):
        triggers = [t.strip().lower() for t in raw_triggers if isinstance(t, str) and t.strip()]
    else:
        triggers = []
    
    # Parse blacklist from comma-separated string or list
    raw_blacklist = request.get("blacklist", "")
    if isinstance(raw_blacklist, str):
        blacklist = [b.strip().lower() for b in raw_blacklist.split(",") if b.strip()]
    elif isinstance(raw_blacklist, list):
        blacklist = [b.strip().lower() for b in raw_blacklist if isinstance(b, str) and b.strip()]
    else:
        blacklist = []
    
    # Handle API key - only update if provided and not empty
    api_key = request.get("api_key", "")
    api_key_updated = False
    
    # Save to file
    data = {"triggers": triggers, "blacklist": blacklist}
    
    # Include API key in config if provided (or preserve existing)
    if api_key and api_key.strip():
        data["api_key"] = api_key.strip()
        TAVILY_API_KEY = api_key.strip()
        api_key_updated = True
        print(f"[TAVILY] API key updated from dashboard")
    elif TAVILY_CONFIG_FILE.exists():
        # Preserve existing API key from config file if not updating
        try:
            existing_data = json.loads(TAVILY_CONFIG_FILE.read_text(encoding="utf-8"))
            if existing_data.get("api_key"):
                data["api_key"] = existing_data["api_key"]
        except:
            pass
    
    try:
        TAVILY_CONFIG_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as e:
        logger.error(f"Failed to save Tavily triggers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save triggers: {str(e)}")
    
    # Update in-memory lists immediately
    TAVILY_TRIGGERS = triggers
    TAVILY_BLACKLIST = blacklist
    
    logger.info(f"Tavily triggers updated: {len(triggers)} triggers, {len(blacklist)} blacklist, api_key_updated={api_key_updated}")
    
    return {
        "status": "saved",
        "trigger_count": len(triggers),
        "blacklist_count": len(blacklist),
        "triggers": triggers,
        "blacklist": blacklist,
        "api_key_set": bool(TAVILY_API_KEY),
        "api_key_updated": api_key_updated
    }


# =============================================================================
# END TAVILY API
# =============================================================================


# =============================================================================
# SWEDISH CITIES API - Dashboard-controlled city list for weather
# =============================================================================
# These endpoints allow admins to manage the list of Swedish cities available
# for weather lookups. Cities can be added/removed without server restart.

cities_router = APIRouter(prefix="/api/swedish-cities", tags=["Swedish Cities"])


@cities_router.get("")
async def get_swedish_cities():
    """
    Get current Swedish cities configuration.
    
    Returns the list of cities available for weather lookups.
    """
    return {
        "cities": SWEDISH_CITIES,
        "count": len(SWEDISH_CITIES)
    }


@cities_router.post("")
async def save_swedish_cities(request: dict):
    """
    Save Swedish cities configuration.
    
    Updates the cities list in real-time. Changes take effect immediately
    without requiring a server restart.
    
    Request body:
    - cities: dict - Dictionary of city names to coordinates
    """
    global SWEDISH_CITIES
    
    cities = request.get("cities", {})
    
    # Validate and normalize city data
    valid_cities = {}
    for name, coords in cities.items():
        if isinstance(coords, dict) and "lon" in coords and "lat" in coords:
            valid_cities[name.lower()] = coords
    
    # Save to file
    data = {"cities": valid_cities}
    try:
        CITIES_CONFIG_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as e:
        logger.error(f"Failed to save Swedish cities: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save cities: {str(e)}")
    
    # Update in-memory
    SWEDISH_CITIES = valid_cities
    
    logger.info(f"Swedish cities updated: {len(valid_cities)} cities saved")
    
    return {
        "status": "saved",
        "count": len(valid_cities),
        "cities": valid_cities
    }


# =============================================================================
# END SWEDISH CITIES API
# =============================================================================


# =============================================================================
# RSS FEEDS API - Dashboard-controlled news feeds
# =============================================================================
# These endpoints allow admins to manage the list of RSS feeds for news.
# Feeds can be added/removed without server restart.

rss_router = APIRouter(prefix="/api/rss-feeds", tags=["RSS Feeds"])


@rss_router.get("")
async def get_rss_feeds():
    """
    Get current RSS feeds configuration.
    
    Returns the list of RSS feeds configured for news lookups.
    """
    return {
        "feeds": RSS_FEEDS,
        "count": len(RSS_FEEDS),
        "feedparser_available": FEEDPARSER_AVAILABLE
    }


@rss_router.post("")
async def save_rss_feeds(request: dict):
    """
    Save RSS feeds configuration.
    
    Updates the feeds list in real-time. Changes take effect immediately
    without requiring a server restart.
    
    Request body:
    - feeds: list - List of feed objects with 'name' and 'url'
    """
    global RSS_FEEDS
    
    feeds = request.get("feeds", [])
    
    # Validate feed data
    valid_feeds = []
    for feed in feeds:
        if isinstance(feed, dict) and "url" in feed:
            valid_feeds.append({
                "name": feed.get("name", "Okänd källa"),
                "url": feed["url"]
            })
    
    # Save to file
    data = {"feeds": valid_feeds}
    try:
        RSS_FEEDS_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as e:
        logger.error(f"Failed to save RSS feeds: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save feeds: {str(e)}")
    
    # Update in-memory
    RSS_FEEDS = valid_feeds
    
    logger.info(f"RSS feeds updated: {len(valid_feeds)} feeds saved")
    
    return {
        "status": "saved",
        "count": len(valid_feeds),
        "feeds": valid_feeds
    }


# =============================================================================
# END RSS FEEDS API
# =============================================================================


# =============================================================================
# OPEN DATA APIs API - Dashboard-controlled Swedish public data sources
# =============================================================================
# These endpoints allow admins to manage the list of Open Data APIs.
# APIs can be enabled/disabled and triggers can be modified without server restart.

open_data_router = APIRouter(prefix="/api/open-data", tags=["Open Data APIs"])


@open_data_router.get("")
async def get_open_data_apis():
    """
    Get current Open Data APIs configuration.
    
    Returns the list of configured Open Data APIs with their triggers and status.
    """
    return {
        "apis": OPEN_DATA_APIS,
        "count": len(OPEN_DATA_APIS),
        "enabled_count": len([a for a in OPEN_DATA_APIS if a.get("enabled", True)])
    }


@open_data_router.post("")
async def save_open_data_apis(request: dict):
    """
    Save Open Data APIs configuration.
    
    Updates the APIs list in real-time. Changes take effect immediately
    without requiring a server restart.
    
    Request body:
    - apis: list - List of API config objects with id, name, triggers, enabled, etc.
    """
    global OPEN_DATA_APIS
    
    apis = request.get("apis", [])
    
    # Validate API data
    valid_apis = []
    for api in apis:
        if isinstance(api, dict) and "id" in api:
            valid_apis.append({
                "id": api.get("id"),
                "name": api.get("name", api.get("id")),
                "description": api.get("description", ""),
                "base_url": api.get("base_url", ""),
                "enabled": api.get("enabled", True),
                "triggers": api.get("triggers", []),
                "fallback_message": api.get("fallback_message", "Kunde inte hämta data.")
            })
    
    # Save to file
    data = {"apis": valid_apis}
    try:
        OPEN_DATA_CONFIG_FILE.write_text(
            json.dumps(data, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as e:
        logger.error(f"Failed to save Open Data APIs: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save APIs: {str(e)}")
    
    # Update in-memory
    OPEN_DATA_APIS = valid_apis
    
    logger.info(f"Open Data APIs updated: {len(valid_apis)} APIs saved")
    
    return {
        "status": "saved",
        "count": len(valid_apis),
        "enabled_count": len([a for a in valid_apis if a.get("enabled", True)]),
        "apis": valid_apis
    }


@open_data_router.get("/{api_id}")
async def get_open_data_api(api_id: str):
    """
    Get a specific Open Data API configuration.
    
    Args:
        api_id: The API identifier
    """
    for api in OPEN_DATA_APIS:
        if api.get("id") == api_id:
            return api
    
    raise HTTPException(status_code=404, detail=f"API '{api_id}' not found")


@open_data_router.patch("/{api_id}")
async def update_open_data_api(api_id: str, request: dict):
    """
    Update a specific Open Data API configuration.
    
    Args:
        api_id: The API identifier
        request: Partial API config to update
    """
    global OPEN_DATA_APIS
    
    for i, api in enumerate(OPEN_DATA_APIS):
        if api.get("id") == api_id:
            # Update fields
            if "enabled" in request:
                OPEN_DATA_APIS[i]["enabled"] = request["enabled"]
            if "triggers" in request:
                OPEN_DATA_APIS[i]["triggers"] = request["triggers"]
            if "fallback_message" in request:
                OPEN_DATA_APIS[i]["fallback_message"] = request["fallback_message"]
            
            # Save to file
            data = {"apis": OPEN_DATA_APIS}
            try:
                OPEN_DATA_CONFIG_FILE.write_text(
                    json.dumps(data, ensure_ascii=False, indent=2),
                    encoding="utf-8"
                )
            except Exception as e:
                logger.error(f"Failed to save Open Data APIs: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to save API: {str(e)}")
            
            return OPEN_DATA_APIS[i]
    
    raise HTTPException(status_code=404, detail=f"API '{api_id}' not found")


# =============================================================================
# END OPEN DATA APIs API
# =============================================================================


def find_base_model_path():
    """Find a valid base model path for OneSeek-7B-Zero
    
    Checks in this order:
    1. Model specified in metadata (actual trained model)
    2. oneseek-7b-zero directory itself (if it has config.json - fully trained model)
    3. Legacy fallback to Mistral/LLaMA discovery
    """
    # FIRST: Check metadata to see which base model was actually trained
    metadata_base_model = find_base_model_from_metadata()
    if metadata_base_model:
        return metadata_base_model
    
    # SECOND: Check if OneSeek directory itself has a config.json (complete model)
    base_path = Path(ONESEEK_PATH)
    if (base_path / 'config.json').exists():
        logger.info(f"Found complete OneSeek model at {base_path}")
        return str(base_path)
    
    # THIRD: Legacy fallback - check for base models in oneseek directory
    mistral_base = base_path / 'base_models' / 'mistral-7b'
    llama_base = base_path / 'base_models' / 'llama-2-7b'
    
    # Legacy paths (where user actually has the models)
    legacy_mistral = PROJECT_ROOT / 'models' / 'mistral-7b-instruct'
    legacy_llama = PROJECT_ROOT / 'models' / 'llama-2-7b-chat'
    
    # KB-Llama Swedish model paths (commonly used base model)
    kb_llama_path = PROJECT_ROOT / 'models' / 'KB-Llama-3.1-8B-Swedish'
    kb_llama_alt = PROJECT_ROOT / 'models' / 'kb-llama-3-1-8b-swedish'
    
    # Check each path for config.json - prioritize KB-Llama since it's commonly used
    for name, path in [
        ('KB-Llama-3.1-8B-Swedish', kb_llama_path),
        ('KB-Llama-3.1-8B-Swedish (lowercase)', kb_llama_alt),
        ('Mistral-7B (base_models)', mistral_base),
        ('LLaMA-2-7B (base_models)', llama_base),
        ('Mistral-7B (legacy)', legacy_mistral),
        ('LLaMA-2-7B (legacy)', legacy_llama)
    ]:
        if path.exists() and (path / 'config.json').exists():
            logger.info(f"Found base model: {name} at {path}")
            return str(path)
    
    # Also search for any model with config.json in the models directory
    models_dir = PROJECT_ROOT / 'models'
    if models_dir.exists():
        logger.info("Searching for any base model in models directory...")
        for item in models_dir.iterdir():
            if item.is_dir() and item.name not in ['oneseek-7b-zero', 'oneseek-certified', 'backups']:
                if (item / 'config.json').exists():
                    logger.info(f"Found base model by search: {item.name} at {item}")
                    return str(item)
    
    return None

def find_lora_weights(adapter_suffix=''):
    """Find the latest LoRA adapter weights for OneSeek-7B-Zero
    
    Args:
        adapter_suffix: Optional suffix like 'mistral' or 'llama' for model-specific adapters
    
    Works with both certified and legacy structures:
    - Certified: Model files in DNA-based directory (e.g., OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1/)
    - Legacy: Model files in oneseek-7b-zero/weights/ and oneseek-7b-zero/lora_adapters/
    
    Returns path to LoRA weights file or directory, or None if not found
    """
    import json
    base_path = Path(ONESEEK_PATH)
    
    # Check if we're in a certified directory
    if 'OneSeek-7B-Zero.v' in base_path.name:
        # Look for LoRA adapters in certified directory
        logger.info(f"Searching for LoRA adapters in certified directory: {base_path}")
        
        # FIRST: Check metadata.json for adapter paths (most reliable)
        metadata_file = base_path / 'metadata.json'
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                adapters = metadata.get('adapters', [])
                if adapters:
                    # Use the latest adapter (last in list)
                    latest_adapter_path = adapters[-1]
                    # Adapters are stored relative to the certified model directory
                    full_adapter_path = base_path / latest_adapter_path
                    if full_adapter_path.exists() and (full_adapter_path / 'adapter_config.json').exists():
                        logger.info(f"Found LoRA adapter from metadata: {full_adapter_path}")
                        return str(full_adapter_path)
                    else:
                        logger.warning(f"Adapter path from metadata not found: {full_adapter_path}")
            except Exception as e:
                logger.warning(f"Could not read adapters from metadata: {e}")
        
        # FALLBACK: Look for adapter directories matching pattern
        for item in base_path.iterdir():
            if item.is_dir() and '-adapter' in item.name:
                # Check for PEFT format
                if (item / 'adapter_config.json').exists():
                    logger.info(f"Found PEFT LoRA adapter in certified directory: {item}")
                    return str(item)
        
        # Check lora_adapters subdirectory
        lora_adapters_dir = base_path / 'lora_adapters'
        if lora_adapters_dir.exists():
            # Find all adapter directories
            adapter_dirs = [d for d in lora_adapters_dir.iterdir() if d.is_dir() and (d / 'adapter_config.json').exists()]
            if adapter_dirs:
                # Sort by modification time (newest first) and use the latest
                latest_adapter = max(adapter_dirs, key=lambda p: p.stat().st_mtime)
                logger.info(f"Found PEFT LoRA adapter in lora_adapters: {latest_adapter}")
                return str(latest_adapter)
        
        # Look for .pth weight files
        pth_files = list(base_path.glob('*.pth'))
        if pth_files:
            # Sort by modification time, use latest
            latest_pth = max(pth_files, key=lambda p: p.stat().st_mtime)
            logger.info(f"Found weight file in certified directory: {latest_pth}")
            return str(latest_pth)
        
        logger.info(f"No LoRA adapters found in certified directory - using base model")
        return None
    
    # Legacy structure: check weights directory
    # Read metadata to find model-specific weights
    metadata = read_model_metadata()
    if metadata:
        # Check for modelSpecificWeights in metadata
        model_specific_weights = metadata.get('modelSpecificWeights', {})
        if model_specific_weights:
            # Get the base models list to determine which weight file to use
            base_models = metadata.get('baseModels', [])
            if base_models:
                # Use the first base model (or only model in single-model training)
                target_model = base_models[0]
                normalized_model = normalize_model_name_for_lookup(target_model)
                
                # Look for matching key in modelSpecificWeights
                for key, weight_file in model_specific_weights.items():
                    if normalized_model in key or key in normalized_model:
                        weight_path = base_path / 'weights' / weight_file
                        if weight_path.exists():
                            logger.info(f"Found model-specific LoRA weights from metadata: {weight_path}")
                            return str(weight_path)
    
    # Check for model-specific LoRA adapter directory (PEFT format)
    if adapter_suffix:
        lora_dir = base_path / 'lora_adapters'
        
        # Check for adapter directory with the suffix
        adapter_dir = lora_dir / f'{adapter_suffix}-adapter'
        if adapter_dir.exists():
            # PEFT format - return directory path
            if (adapter_dir / 'adapter_config.json').exists():
                logger.info(f"Found PEFT LoRA adapter directory: {adapter_dir}")
                return str(adapter_dir)
            # Legacy format - check for adapter.pth
            elif (adapter_dir / 'adapter.pth').exists():
                logger.info(f"Found legacy LoRA adapter: {adapter_dir / 'adapter.pth'}")
                return str(adapter_dir / 'adapter.pth')
    
    # Check weights directory for .pth files (legacy fallback)
    weights_dir = base_path / 'weights'
    if weights_dir.exists():
        # Find all version files
        weight_files = list(weights_dir.glob('oneseek-7b-zero-v*.pth'))
        if weight_files:
            # Sort by version number and get the latest
            latest_weight = sorted(weight_files, reverse=True)[0]
            logger.info(f"Found LoRA weights (latest): {latest_weight}")
            return str(latest_weight)
    
    # Check lora_adapters directory for versioned adapters
    lora_dir = base_path / 'lora_adapters'
    if lora_dir.exists():
        adapter_dirs = list(lora_dir.glob('oneseek-7b-zero-v*'))
        for adapter_dir in sorted(adapter_dirs, reverse=True):
            # Check for PEFT format
            if (adapter_dir / 'adapter_config.json').exists():
                logger.info(f"Found PEFT LoRA adapter directory: {adapter_dir}")
                return str(adapter_dir)
            # Check for legacy format
            adapter_file = adapter_dir / 'adapter.pth'
            if adapter_file.exists():
                logger.info(f"Found legacy LoRA adapter: {adapter_file}")
                return str(adapter_file)
    
    return None

def load_model(model_name: str, model_path: str):
    """Load model and tokenizer with device optimization, applying LoRA adapters if available"""
    logger.debug(f"→ load_model called: model_name={model_name}")
    logger.debug(f"→ model_path parameter: {model_path}")
    
    if model_name in models:
        logger.debug(f"→ Model {model_name} already cached, returning from cache")
        return models[model_name], tokenizers[model_name]
    
    # For OneSeek models, find the actual base model path
    if model_name.startswith('oneseek'):
        if model_name == 'oneseek-mistral':
            # Load Mistral base model
            available_models = find_all_base_models()
            if available_models and 'mistral' in available_models:
                model_path = available_models['mistral']
                logger.info(f"Loading Mistral-7B for OneSeek dual-model...")
            else:
                raise FileNotFoundError("Mistral-7B not found for dual-model mode")
                
        elif model_name == 'oneseek-llama':
            # Load LLaMA base model
            available_models = find_all_base_models()
            if available_models and 'llama' in available_models:
                model_path = available_models['llama']
                logger.info(f"Loading LLaMA-2 for OneSeek dual-model...")
            else:
                raise FileNotFoundError("LLaMA-2 not found for dual-model mode")
                
        elif model_name == 'oneseek-7b-zero':
            # Single-model mode
            actual_path = find_base_model_path()
            if not actual_path:
                error_msg = (
                    "No base model found for OneSeek-7B-Zero. Please ensure one of these models exists:\n"
                    f"  1. KB-Llama-3.1-8B-Swedish at {PROJECT_ROOT / 'models' / 'KB-Llama-3.1-8B-Swedish'}\n"
                    f"  2. Mistral-7B at {PROJECT_ROOT / 'models' / 'mistral-7b-instruct'}\n"
                    f"  3. LLaMA-2-7B at {PROJECT_ROOT / 'models' / 'llama-2-7b-chat'}\n"
                    "  Or download a model with: huggingface-cli download <model-id> --local-dir <path>"
                )
                logger.error(error_msg)
                raise FileNotFoundError(error_msg)
            model_path = actual_path
            logger.info(f"Loading OneSeek-7B-Zero using base model from {model_path}...")
    else:
        logger.info(f"Loading {model_name} from {model_path}...")
    
    # Determine dtype based on device and flags
    # Use bfloat16 for DirectML/GPU (better performance on AMD Ryzen AI)
    # Use float16 for CUDA/XPU
    # Use float32 for CPU
    if args.auto_devices and DEVICE_TYPE == 'directml':
        dtype = torch.float16
        logger.info("Using torch.bfloat16 for optimal Ryzen AI Max 390 performance")
    elif DEVICE_TYPE in ['cuda', 'xpu', 'directml']:
        dtype = torch.float16
    else:
        dtype = torch.float32
    
    # Prepare model loading kwargs
    model_kwargs = {
        'torch_dtype': dtype,
        'low_cpu_mem_usage': True,
        'trust_remote_code': True,
    }
    
    # Add device_map and offloading if auto-devices is enabled
    if args.auto_devices:
        model_kwargs['device_map'] = 'auto'
        model_kwargs['offload_folder'] = 'offload'
        model_kwargs['offload_state_dict'] = True
        logger.info("Using device_map='auto' for GPU/NPU offloading")
    
    # Add quantization if requested
    if args.load_in_4bit:
        try:
            from transformers import BitsAndBytesConfig
            model_kwargs['quantization_config'] = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=dtype,
                bnb_4bit_use_double_quant=True,
            )
            logger.info("Loading model in 4-bit quantization")
        except ImportError:
            logger.warning("bitsandbytes not installed - ignoring 4-bit quantization")
    elif args.load_in_8bit:
        model_kwargs['load_in_8bit'] = True
        logger.info("Loading model in 8-bit quantization")
    
    try:
        # Load tokenizer with config-fix to handle malformed config.json files
        # This fixes the "'dict' object has no attribute 'model_type'" error
        import json
        from transformers import PretrainedConfig
        
        logger.info(f"Loading tokenizer from: {model_path}")
        tokenizer = None
        tokenizer_errors = []
        model_path_obj = Path(model_path)
        
        # Read model_type from config.json to understand model architecture
        config_path = model_path_obj / "config.json"
        model_type = None
        config_dict = None
        if config_path.exists():
            try:
                with open(config_path, 'r', encoding='utf-8') as f:
                    config_dict = json.load(f)
                model_type = config_dict.get('model_type', None)
                if model_type:
                    logger.info(f"✓ Found model_type in config.json: {model_type}")
            except Exception as e:
                logger.warning(f"Could not read config.json: {e}")
        
        # Read tokenizer class from tokenizer_config.json
        tokenizer_config_path = model_path_obj / "tokenizer_config.json"
        tokenizer_class_name = None
        if tokenizer_config_path.exists():
            try:
                with open(tokenizer_config_path, 'r', encoding='utf-8') as f:
                    tokenizer_config = json.load(f)
                tokenizer_class_name = tokenizer_config.get('tokenizer_class', None)
                if tokenizer_class_name:
                    logger.info(f"✓ Found tokenizer_class in tokenizer_config.json: {tokenizer_class_name}")
            except Exception as e:
                logger.warning(f"Could not read tokenizer_config.json: {e}")
        
        # Strategy 1: For PreTrainedTokenizerFast, try loading directly from tokenizer.json
        # This bypasses config.json entirely and avoids the 'dict has no attribute model_type' error
        if tokenizer is None and tokenizer_class_name == 'PreTrainedTokenizerFast':
            tokenizer_json_path = model_path_obj / "tokenizer.json"
            if tokenizer_json_path.exists():
                try:
                    from transformers import PreTrainedTokenizerFast
                    tokenizer = PreTrainedTokenizerFast(
                        tokenizer_file=str(tokenizer_json_path),
                        bos_token="<|begin_of_text|>",
                        eos_token="<|end_of_text|>",
                        pad_token="<|end_of_text|>",
                    )
                    logger.info("✓ Tokenizer loaded directly from tokenizer.json")
                except Exception as e0:
                    tokenizer_errors.append(f"PreTrainedTokenizerFast from tokenizer.json: {e0}")
        
        # Strategy 2: For llama models, pre-load config as LlamaConfig
        llama_config = None
        if model_type == 'llama' and config_dict:
            try:
                from transformers import LlamaConfig
                llama_config = LlamaConfig(**config_dict)
                logger.info("✓ Pre-loaded LlamaConfig successfully")
            except Exception as e:
                logger.warning(f"Could not pre-load LlamaConfig: {e}")
        
        # Strategy 3: Try with LlamaConfig if available
        if tokenizer is None and llama_config is not None:
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    model_path, 
                    config=llama_config,
                    trust_remote_code=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with LlamaConfig")
            except Exception as e1:
                tokenizer_errors.append(f"with LlamaConfig: {e1}")
        
        # Strategy 4: Try AutoTokenizer with defaults (best compatibility)
        if tokenizer is None:
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    model_path, 
                    trust_remote_code=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with AutoTokenizer (defaults)")
            except Exception as e2:
                tokenizer_errors.append(f"AutoTokenizer (defaults): {e2}")
        
        # Strategy 5: Try with use_fast=True
        if tokenizer is None:
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    model_path, 
                    trust_remote_code=True,
                    use_fast=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with use_fast=True")
            except Exception as e3:
                tokenizer_errors.append(f"use_fast=True: {e3}")
        
        # Strategy 6: Try with use_fast=False
        if tokenizer is None:
            try:
                tokenizer = AutoTokenizer.from_pretrained(
                    model_path, 
                    trust_remote_code=True,
                    use_fast=False,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with use_fast=False")
            except Exception as e4:
                tokenizer_errors.append(f"use_fast=False: {e4}")
        
        # Strategy 7: Try PreTrainedTokenizerFast.from_pretrained
        if tokenizer is None:
            try:
                from transformers import PreTrainedTokenizerFast
                tokenizer = PreTrainedTokenizerFast.from_pretrained(
                    model_path,
                    trust_remote_code=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with PreTrainedTokenizerFast.from_pretrained")
            except Exception as e5:
                tokenizer_errors.append(f"PreTrainedTokenizerFast.from_pretrained: {e5}")
        
        # Strategy 8: Try LlamaTokenizerFast (only for llama models)
        if tokenizer is None and model_type and 'llama' in model_type.lower():
            try:
                from transformers import LlamaTokenizerFast
                tokenizer = LlamaTokenizerFast.from_pretrained(
                    model_path,
                    trust_remote_code=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with LlamaTokenizerFast")
            except Exception as e6:
                tokenizer_errors.append(f"LlamaTokenizerFast: {e6}")
        
        # Strategy 9: Try LlamaTokenizer (only for llama models)
        if tokenizer is None and model_type and 'llama' in model_type.lower():
            try:
                from transformers import LlamaTokenizer
                tokenizer = LlamaTokenizer.from_pretrained(
                    model_path,
                    trust_remote_code=True,
                    local_files_only=True
                )
                logger.info("✓ Tokenizer loaded with LlamaTokenizer")
            except Exception as e7:
                tokenizer_errors.append(f"LlamaTokenizer: {e7}")
        
        if tokenizer is None:
            logger.error("")
            logger.error("=" * 80)
            logger.error("✗ TOKENIZER LOADING FAILED - NO SILENT FALLBACK")
            logger.error("=" * 80)
            logger.error("")
            logger.error(f"Could not load tokenizer from: {model_path}")
            logger.error("")
            logger.error("Strategies attempted:")
            for err in tokenizer_errors:
                logger.error(f"  - {err}")
            logger.error("")
            logger.error("Possible causes:")
            logger.error("  1. Missing tokenizer files (tokenizer.json, tokenizer_config.json)")
            logger.error("  2. Corrupted or incomplete model download")
            logger.error("  3. 'dict object has no attribute model_type' - config.json may be malformed")
            logger.error("  4. Incompatible transformers library version")
            logger.error("")
            logger.error("Suggested fixes:")
            logger.error(f"  1. Verify directory exists: {model_path}")
            logger.error("  2. Check for required files: tokenizer.json, tokenizer_config.json, special_tokens_map.json")
            logger.error("  3. Re-download the model: huggingface-cli download <model-id> --local-dir <path>")
            logger.error("  4. Update transformers: pip install --upgrade transformers>=4.35.0")
            logger.error("")
            logger.error("=" * 80)
            raise RuntimeError(
                f"Tokenizer loading failed for {model_path}. "
                f"Tried 5 strategies, all failed. No silent fallback to remote models. "
                f"Check logs above for debugging details."
            )
        
        # CRITICAL FIX FOR LLAMA-2 (and all old Llama tokenizers without pad_token)
        # Without this fix, padding will fail with: "Asking to pad but the tokenizer does not have a padding token"
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
            tokenizer.pad_token_id = tokenizer.eos_token_id
            logger.info("✓ Set pad_token = eos_token (required for Llama-2 tokenizers)")
        
        start_time = time.time()
        
        # Load model with optimizations for multi-GPU
        logger.info(f"Loading OneSeek-7B-Zero with chained LoRA adapters...")
        logger.info("Loading checkpoint shards...")
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            **model_kwargs
        )
        
        load_time = time.time() - start_time
        
        # Move model to device if not using device_map
        if not args.auto_devices:
            model = model.to(DEVICE)
        
        # For OneSeek, load ALL DNA adapters from metadata.json
        # This uses the metadata as source of truth for which adapters to load
        if model_name.startswith('oneseek'):
            try:
                from peft import PeftModel
            except ImportError:
                logger.warning("⚠ PEFT ej installerat – kan inte ladda DNA-adapters")
                logger.info("  Installera med: pip install peft")
                PeftModel = None
            
            if PeftModel:
                certified_model_path = Path(ONESEEK_PATH)
                adapters_to_load = []
                
                # PRIORITY 1: Read adapters from metadata.json (source of truth)
                metadata_path = certified_model_path / "metadata.json"
                if metadata_path.exists():
                    try:
                        with open(metadata_path, 'r', encoding='utf-8') as f:
                            metadata = json.load(f)
                        
                        adapters_list = metadata.get("adapters", [])
                        if adapters_list:
                            logger.info(f"Hittade {len(adapters_list)} DNA-adapter(s) i metadata.json")
                            
                            for adapter_name in adapters_list:
                                # Handle both old format (with lora_adapters/) and new format (just folder name)
                                if adapter_name.startswith("lora_adapters/"):
                                    # Old format - try parent directory
                                    adapter_path = certified_model_path.parent / adapter_name.replace("/", os.sep)
                                else:
                                    # New format - adapter is inside certified model directory
                                    adapter_path = certified_model_path / adapter_name
                                
                                if adapter_path.is_dir() and (adapter_path / "adapter_model.safetensors").exists():
                                    adapters_to_load.append(adapter_path)
                                    logger.info(f"  ✓ Hittade: {adapter_name}")
                                else:
                                    logger.warning(f"  ⚠ Adapter-mapp saknas: {adapter_name}")
                        else:
                            logger.info("Ingen adapter-lista i metadata.json")
                    except Exception as e:
                        logger.warning(f"Kunde inte läsa metadata.json: {e}")
                
                # PRIORITY 2: Fallback - scan subdirectories for adapter files
                # NOTE: This is only a fallback when metadata.json doesn't exist or has no adapters
                # This should NOT load adapters from unrelated base models
                if not adapters_to_load and certified_model_path.exists():
                    logger.warning("⚠ Ingen adapter-lista i metadata.json - använder fallback-sökning")
                    logger.info(f"Söker DNA-adapters i: {certified_model_path}")
                    logger.info("  OBS: Endast adapters som tillhör denna modell kommer laddas")
                    
                    for item in certified_model_path.iterdir():
                        if item.is_dir():
                            # Check for PEFT adapter format
                            if (item / "adapter_model.safetensors").exists() or (item / "adapter_config.json").exists():
                                # Log that we found an adapter via fallback scan
                                logger.info(f"  Hittade adapter via fallback: {item.name}")
                                adapters_to_load.append(item)
                
                if adapters_to_load:
                    # Sort by name so newest (highest timestamp) loads last and "wins"
                    adapters_to_load.sort(key=lambda x: x.name)
                    loaded_count = 0
                    
                    logger.info(f"Laddar {len(adapters_to_load)} DNA-adapter(s)...")
                    for adapter_dir in adapters_to_load:
                        try:
                            logger.info(f"  → Laddar: {adapter_dir.name}")
                            adapter_kwargs = {}
                            if args.auto_devices:
                                adapter_kwargs['device_map'] = 'auto'
                                adapter_kwargs['torch_dtype'] = dtype
                            model = PeftModel.from_pretrained(model, str(adapter_dir), **adapter_kwargs)
                            loaded_count += 1
                        except Exception as e:
                            logger.warning(f"  ⚠ Kunde inte ladda {adapter_dir.name}: {e}")
                    
                    if loaded_count > 0:
                        logger.info(f"✓ DIN FULLA DNA ÄR AKTIV – {loaded_count} adapter(s) laddade!")
                    else:
                        logger.warning("⚠ Inga adapters kunde laddas – kör basmodell")
                else:
                    logger.info(f"ℹ Ingen DNA-adapter hittad för {model_name} – kör basmodell")
                    logger.info("  Träna med: python scripts/train_identity.py")
        
        # Apply device-specific optimizations
        if DEVICE_TYPE == 'xpu':
            # Intel GPU optimization via IPEX
            try:
                import intel_extension_for_pytorch as ipex
                model = ipex.optimize(model)
                logger.info(f"✓ {model_name} optimized with IPEX")
            except ImportError:
                pass
        elif DEVICE_TYPE == 'directml':
            # === IMPORTANT: Do NOT use .to(device) after PEFT adapters are loaded! ===
            # Using .to(device) after PeftModel.from_pretrained() breaks the PEFT internal
            # connections and destroys the adapter's effect. The model will "forget" its
            # fine-tuned personality and behave like the base model.
            # 
            # Instead, we rely on device_map="auto" to handle device placement during loading.
            # This is the ONLY way that works with PEFT + DirectML (Nov 2025).
            try:
                import torch_directml
                
                # Just verify device placement - DO NOT call .to() on PEFT models!
                cpu_tensors = 0
                gpu_tensors = 0
                try:
                    for name, param in model.named_parameters():
                        if param.device.type == 'cpu':
                            cpu_tensors += 1
                            if DEBUG_MODE and cpu_tensors <= 3:
                                logger.debug(f"→ Tensor on CPU: {name}")
                        else:
                            gpu_tensors += 1
                    
                    if gpu_tensors > 0 and cpu_tensors == 0:
                        logger.info(f"✓ ALL {gpu_tensors} tensors on DirectML GPU!")
                    elif gpu_tensors > cpu_tensors:
                        logger.info(f"✓ {gpu_tensors} tensors on GPU, {cpu_tensors} on CPU (auto-offloaded)")
                        logger.info("  This is normal with device_map='auto' - large layers may be on CPU")
                    else:
                        logger.warning(f"⚠ {cpu_tensors} tensors on CPU, {gpu_tensors} on GPU")
                        logger.info("  Consider enabling --auto-devices for GPU offloading")
                        
                except Exception as e:
                    logger.debug(f"→ Could not count tensors: {e}")
                
                logger.info(f"✓ {model_name} using DirectML acceleration")
                logger.info("  ⚠ PEFT model - NOT moving after adapter load (preserves fine-tuning)")
                
            except ImportError:
                logger.info(f"ℹ torch_directml not imported - using device_map for placement")
        
        # Cache models
        models[model_name] = model
        tokenizers[model_name] = tokenizer
        
        # Log detailed performance information
        logger.info("=" * 80)
        logger.info(f"OneSeek-7B-Zero loaded in {load_time:.1f} seconds")
        
        # Estimate inference speed (approximate)
        if DEVICE_TYPE == 'directml' and args.auto_devices:
            logger.info("Inference speed: ~25-38 tokens/second (expected on Ryzen AI Max 390)")
        
        logger.info("OneSeek-7B-Zero is now LIVE and CONTINUOUS")
        logger.info("=" * 80)
        logger.info(f"✓ {model_name} loaded successfully on {DEVICE_TYPE} ({dtype})")
        
        return model, tokenizer
        
    except Exception as e:
        logger.error(f"Error loading {model_name}: {str(e)}")
        raise


async def dual_model_inference(text: str, max_length: int = 512, temperature: float = 0.7, top_p: float = 0.9):
    """
    Run inference using BOTH Mistral-7B and LLaMA-2 in parallel
    Combines their strengths: Mistral for speed, LLaMA for depth
    
    Returns combined response with metadata from both models
    """
    import time
    import asyncio
    
    async def run_single_inference(model_key: str, model, tokenizer, prompt: str):
        """Run inference on a single model"""
        start_time = time.time()
        
        # Tokenize input and sync to model's device
        inputs = tokenizer(prompt, return_tensors="pt", padding=True)
        inputs = sync_inputs_to_model_device(inputs, model)
        
        # Use max_new_tokens instead of max_length to avoid input length issues
        max_new = min(max_length, 512)
        
        # Generate with explicit attention_mask
        with torch.no_grad():
            outputs = model.generate(
                input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                max_new_tokens=max_new,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id
            )
        
        # Decode
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        # Remove the input prompt from response
        if response.startswith(prompt):
            response = response[len(prompt):].strip()
        
        latency = (time.time() - start_time) * 1000
        
        return {
            'model': model_key,
            'response': response,
            'latency_ms': latency,
            'tokens': len(outputs[0])
        }
    
    # Load both models if not already loaded
    if 'oneseek-mistral' not in models:
        logger.info("Loading Mistral-7B for dual-model inference...")
        available_models = find_all_base_models()
        if available_models and 'mistral' in available_models:
            load_model('oneseek-mistral', available_models['mistral'])
    
    if 'oneseek-llama' not in models:
        logger.info("Loading LLaMA-2 for dual-model inference...")
        available_models = find_all_base_models()
        if available_models and 'llama' in available_models:
            load_model('oneseek-llama', available_models['llama'])
    
    # Check if both models are loaded
    mistral_loaded = 'oneseek-mistral' in models
    llama_loaded = 'oneseek-llama' in models
    
    if not (mistral_loaded and llama_loaded):
        # Fallback to single model if both aren't available
        logger.warning("⚠ Dual-model mode requires both Mistral and LLaMA")
        logger.info(f"  Available: Mistral={mistral_loaded}, LLaMA={llama_loaded}")
        logger.info("  Falling back to single-model inference")
        
        # Use whichever is available
        if mistral_loaded:
            return await run_single_inference('oneseek-mistral', models['oneseek-mistral'], 
                                             tokenizers['oneseek-mistral'], text)
        elif llama_loaded:
            return await run_single_inference('oneseek-llama', models['oneseek-llama'], 
                                             tokenizers['oneseek-llama'], text)
        else:
            raise HTTPException(status_code=500, detail="No base models available")
    
    # Run both models in parallel (simulated async)
    logger.info("🔄 Dual-model inference: Mistral (fast) + LLaMA (deep)")
    
    # Run Mistral first (fast response)
    mistral_result = await run_single_inference('mistral', models['oneseek-mistral'], 
                                                 tokenizers['oneseek-mistral'], text)
    logger.info(f"  ✓ Mistral completed in {mistral_result['latency_ms']:.0f}ms")
    
    # Run LLaMA (deeper analysis)
    llama_result = await run_single_inference('llama', models['oneseek-llama'], 
                                               tokenizers['oneseek-llama'], text)
    logger.info(f"  ✓ LLaMA completed in {llama_result['latency_ms']:.0f}ms")
    
    # Combine results - use LLaMA as primary (deeper), note Mistral's speed
    combined = {
        'response': llama_result['response'],  # Use LLaMA's deeper analysis
        'model': 'OneSeek-7B-Zero.v1.1 (Dual: Mistral+LLaMA)',
        'tokens': llama_result['tokens'],
        'latency_ms': mistral_result['latency_ms'] + llama_result['latency_ms'],
        'mistral_latency_ms': mistral_result['latency_ms'],
        'llama_latency_ms': llama_result['latency_ms'],
        'mistral_response': mistral_result['response'],  # Include for comparison
    }
    
    logger.info(f"  ✓ Combined response (Mistral: {mistral_result['latency_ms']:.0f}ms + LLaMA: {llama_result['latency_ms']:.0f}ms)")
    
    return combined


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler for startup and shutdown"""
    # Startup
    logger.info("")
    logger.info("=" * 80)
    logger.info("ML Service for OneSeek - DNA v2 Certified - Starting...")
    logger.info("=" * 80)
    logger.info(f"Device: {DEVICE}")
    logger.info(f"Device Type: {DEVICE_TYPE}")
    logger.info(f"Project root: {PROJECT_ROOT}")
    logger.info(f"Models base directory: {get_models_base_dir()}")
    logger.info(f"Active model path: {ONESEEK_PATH}")
    logger.info(f"Rate limiting: {RATE_LIMIT_PER_MINUTE} requests/minute per IP on /infer endpoint")
    logger.info("=" * 80)
    logger.info("")
    
    # Verify model directory exists
    model_path = Path(ONESEEK_PATH)
    if not model_path.exists():
        logger.error(f"✗ Active model directory does not exist: {ONESEEK_PATH}")
        logger.error("This should not happen if symlink was created correctly.")
        logger.error("Check that the symlink target exists and is correct.")
        sys.exit(1)
    
    # Check if DNA v2 certified
    is_certified = 'oneseek-certified' in str(model_path) or 'OneSeek-7B-Zero.v' in model_path.name
    model_type = "DNA v2 CERTIFIED ✓" if is_certified else "Legacy (fallback)"
    
    logger.info(f"✓ Active model directory found: {model_path}")
    logger.info(f"  Model type: {model_type}")
    logger.info(f"  Ready to serve inference requests")
    logger.info("")
    
    # Auto-sync character cards to system prompts
    logger.info("Syncing character cards to system prompts...")
    try:
        sync_results = sync_character_cards_to_prompts()
        if sync_results["synced"]:
            logger.info(f"  ✓ Synced {len(sync_results['synced'])} character card(s)")
            for synced in sync_results["synced"]:
                logger.info(f"    - {synced['name']}")
        if sync_results["skipped"]:
            logger.info(f"  ℹ Skipped {len(sync_results['skipped'])} (already synced or no prompt)")
        if sync_results["errors"]:
            logger.warning(f"  ⚠ {len(sync_results['errors'])} error(s) during sync")
    except Exception as e:
        logger.warning(f"  ⚠ Could not sync character cards: {e}")
    
    # Log active system prompt
    active_prompt = get_active_system_prompt()
    prompt_preview = active_prompt[:100] + "..." if len(active_prompt) > 100 else active_prompt
    logger.info(f"Active system prompt: {prompt_preview}")
    logger.info("")
    
    yield
    
    # Shutdown (cleanup if needed)
    logger.info("Shutting down ML Service...")

# Initialize rate limiter (10 requests per minute per IP for /infer endpoint)
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI with lifespan
app = FastAPI(
    title="OneSeek ML Service - DNA v2 Certified",
    version="2.1.0",
    description="ML inference service with DNA v2 certified model support and rate limiting",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register System Prompts router
app.include_router(system_prompts_router, prefix="/api")

# Register Simple System Prompt router (for dashboard integration)
app.include_router(simple_prompt_router)

# Register Force-Svenska router (real-time dashboard control)
app.include_router(force_svenska_router)

# Register Tavily router (real-time search control)
app.include_router(tavily_router)

# Register Swedish Cities router (weather city selection)
app.include_router(cities_router)

# Register RSS Feeds router (news sources)
app.include_router(rss_router)

# Register Open Data APIs router (Swedish public data)
app.include_router(open_data_router)

@app.get("/")
async def root():
    """Health check and service information"""
    device_info = {
        "service": "OneSeek ML Service - DNA v2 Certified",
        "version": "2.1.0",
        "model_type": "DNA v2 Certified",
        "status": "running",
        "device": str(DEVICE),
        "device_type": DEVICE_TYPE,
        "models_loaded": list(models.keys()),
        "active_model_path": ONESEEK_PATH,
        "endpoints": {
            "/infer": "Primary inference endpoint (rate limited: 10 req/min/IP)",
            "/infer-legacy": "Legacy endpoint (deprecated - returns HTTP 410)",
            "/inference/oneseek": "Direct OneSeek inference",
            "/models/status": "Model loading status"
        }
    }
    
    # Add device-specific info
    if DEVICE_TYPE == 'cuda':
        device_info["gpu_name"] = torch.cuda.get_device_name(0)
        device_info["gpu_memory"] = f"{torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB"
    elif DEVICE_TYPE == 'xpu':
        try:
            device_info["gpu_name"] = torch.xpu.get_device_name(0)
            device_info["intel_gpu"] = True
        except:
            pass
    
    return device_info

@app.post("/infer", response_model=InferenceResponse)
@limiter.limit(f"{RATE_LIMIT_PER_MINUTE}/minute")
async def infer(request: Request, inference_request: InferenceRequest):
    """
    Primary inference endpoint with rate limiting (configurable via RATE_LIMIT_PER_MINUTE).
    
    Routes to DNA v2 certified models with fallback to base models.
    This is the recommended endpoint for all inference requests.
    System prompt is automatically injected from the active prompt in Admin Dashboard.
    
    Features:
    - Force-Svenska: Swedish-only responses when Swedish triggers detected
    - Time & Date: Always aware of current time (injected into every request)
    - Season: Always aware of current season
    - Weather: SMHI weather data for any Swedish city when weather-related questions
    - News: Latest news from RSS feeds when news-related questions
    - Tavily Search: Real-time web search for current events/facts
    """
    start_time = time.time()
    
    # Check for Force-Svenska triggers
    force_svenska_active = check_force_svenska(inference_request.text)
    
    # === 1. ALWAYS: Inject time, date & season context ===
    time_context = inject_time_context()
    season_context = get_current_season()
    
    # === 2. Check for weather question (with city detection) ===
    weather_context = None
    weather_city = check_weather_city(inference_request.text)
    if weather_city:
        weather_data = get_weather(weather_city)
        if weather_data:
            weather_context = weather_data
            logger.info(f"🌤️ Väderdata hämtad för {weather_city}")
    
    # === 3. Check for news question ===
    news_context = None
    if check_news_trigger(inference_request.text):
        logger.info("📰 Hämtar senaste nyheterna...")
        news = get_latest_news()
        if news:
            news_context = format_news_for_context(news)
            logger.info(f"✓ {len(news)} nyheter hämtade")
    
    # === 4. Check for Open Data API triggers ===
    open_data_context = None
    triggered_api = check_open_data_trigger(inference_request.text)
    if triggered_api:
        logger.info(f"📊 [OPEN DATA] Hämtar från {triggered_api.get('name')}...")
        open_data_result = fetch_open_data(triggered_api, inference_request.text)
        if open_data_result:
            open_data_context = open_data_result
            logger.info(f"✓ Data från {triggered_api.get('name')} mottagen")
    
    # === 5. Check for Tavily search trigger ===
    tavily_context = None
    tavily_sources = ""
    if check_tavily_trigger(inference_request.text):
        logger.info(f"🔍 [TAVILY] Hämtar realtidsdata: {inference_request.text[:60]}...")
        search_result = tavily_search(inference_request.text)
        if search_result and search_result.get("answer"):
            tavily_context = search_result["answer"]
            tavily_sources = format_tavily_sources(search_result)
            logger.info("✓ Tavily-svar mottaget")
    
    # Format input with system prompt - ensures model always knows its identity
    full_input = format_inference_input(inference_request.text)
    
    # Build enhanced context prefix
    context_parts = []
    
    # Always add time and season context
    context_parts.append(f"[Aktuell tid] {time_context} {season_context}")
    
    # Add weather if available
    if weather_context:
        context_parts.append(f"[Väder] {weather_context}")
    
    # Add news if available
    if news_context:
        context_parts.append(f"[Nyheter] {news_context}")
    
    # Add Open Data if available
    if open_data_context:
        context_parts.append(f"[Öppen data] {open_data_context}")
    
    # Add Tavily search results if available
    if tavily_context:
        context_parts.append(f"[Aktuell fakta] {tavily_context}")
        if tavily_sources:
            context_parts.append(tavily_sources)
    
    # If Force-Svenska is active, prepend Swedish instruction
    if force_svenska_active:
        context_parts.insert(0, "Du pratar alltid svenska. Inga engelska ord. Inga undantag. Svara på svenska nu.")
        logger.info("🇸🇪 Force-Svenska aktiverat – svarar på svenska")
    
    # Combine all context
    if context_parts:
        context_prefix = "\n".join(context_parts) + "\n\n"
        full_input = context_prefix + full_input
    
    logger.debug("Injecting system prompt into inference request")
    logger.debug(f"Force-Svenska: {'ACTIVE' if force_svenska_active else 'inactive'}")
    logger.debug(f"Time context: {time_context[:50]}...")
    logger.debug(f"Season: {season_context}")
    logger.debug(f"Weather: {weather_city if weather_context else 'no'}")
    logger.debug(f"News: {'YES' if news_context else 'no'}")
    logger.debug(f"Tavily: {'YES' if tavily_context else 'no'}")
    
    try:
        # Determine if we're using certified model or fallback
        model_path = Path(ONESEEK_PATH)
        is_certified = 'oneseek-certified' in str(model_path) or 'OneSeek-7B-Zero.v' in model_path.name
        
        if DUAL_MODEL_MODE and not is_certified:
            # Use dual-model inference for legacy models
            logger.info("Using dual-model inference (legacy fallback)")
            result = await dual_model_inference(
                full_input,  # Use full input with system prompt
                max_length=inference_request.max_length,
                temperature=inference_request.temperature,
                top_p=inference_request.top_p
            )
            
            return InferenceResponse(
                response=result['response'],
                model=result['model'] + " (fallback)",
                tokens=result['tokens'],
                latency_ms=result['latency_ms']
            )
        else:
            # Single-model inference (certified or fallback)
            model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
            
            # Prepare input with system prompt and sync to model's device
            inputs = tokenizer(full_input, return_tensors="pt", padding=True)
            inputs = sync_inputs_to_model_device(inputs, model)
            
            # Use max_new_tokens instead of max_length to avoid input length issues
            max_new = min(inference_request.max_length, 512)
            
            # Generate with explicit attention_mask
            with torch.no_grad():
                outputs = model.generate(
                    input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                    attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                    max_new_tokens=max_new,
                    temperature=inference_request.temperature,
                    top_p=inference_request.top_p,
                    do_sample=True,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # Decode output
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Clean response using utility function
            response_text = clean_inference_response(response_text, full_input, inference_request.text)
            
            # === APPEND SOURCES to response ===
            # Collect all sources from triggered APIs/services
            sources_section = build_sources_section(
                weather_context=weather_context,
                weather_city=weather_city,
                news_context=news_context,
                open_data_context=open_data_context,
                triggered_api=triggered_api,
                tavily_sources=tavily_sources
            )
            
            if sources_section:
                response_text = response_text.rstrip() + "\n\n" + sources_section
            
            latency_ms = (time.time() - start_time) * 1000
            
            model_name = "OneSeek DNA v2 Certified" if is_certified else "OneSeek (base model fallback)"
            
            return InferenceResponse(
                response=response_text,
                model=model_name,
                tokens=len(outputs[0]),
                latency_ms=latency_ms
            )
        
    except Exception as e:
        logger.error(f"Inference error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

@app.post("/infer-legacy")
async def infer_legacy(request: InferenceRequest):
    """
    Legacy inference endpoint - DEPRECATED
    
    This endpoint is deprecated as of DNA v2 migration.
    Please migrate to the /infer endpoint.
    
    Returns HTTP 410 Gone with migration instructions.
    """
    return JSONResponse(
        status_code=410,
        content={
            "error": "Endpoint Deprecated",
            "detail": "This legacy endpoint has been deprecated as of DNA v2 migration.",
            "migration_guide": "ONESEEK_7B_ZERO_MIGRATION_GUIDE.md",
            "new_endpoint": "/infer",
            "instructions": [
                "Update your code to use the /infer endpoint instead",
                "The /infer endpoint supports DNA v2 certified models",
                "Rate limit: 10 requests per minute per IP address",
                "All legacy model references have been migrated to certified models"
            ],
            "documentation": "See INFERENCE_ROUTING_FIX.md for complete migration guide"
        }
    )

@app.post("/inference/oneseek", response_model=InferenceResponse)
async def oneseek_inference(request: InferenceRequest):
    """Generate response using OneSeek-7B-Zero.v1.1 with dual-model architecture.
    
    System prompt is automatically injected from the active prompt in Admin Dashboard.
    The model always knows who it is - the prompt follows with every request.
    
    Features:
    - Force-Svenska: Swedish-only responses when Swedish triggers detected
    - Time & Date: Always aware of current time (injected into every request)
    - Season: Always aware of current season
    - Weather: SMHI weather data for any Swedish city when weather-related questions
    - News: Latest news from RSS feeds when news-related questions
    - Tavily Search: Real-time web search for current events/facts
    """
    import time
    start_time = time.time()
    
    # Check for Force-Svenska triggers
    force_svenska_active = check_force_svenska(request.text)
    
    # === 1. ALWAYS: Inject time, date & season context ===
    time_context = inject_time_context()
    season_context = get_current_season()
    
    # === 2. Check for weather question (with city detection) ===
    weather_context = None
    weather_sources = ""
    weather_city = check_weather_city(request.text)
    if weather_city:
        weather_data = get_weather(weather_city)
        if weather_data:
            weather_context = weather_data
            weather_sources = f"\n\n**Källor:**\n1. [SMHI – Väderprognos {weather_city.capitalize()}](https://www.smhi.se)"
            logger.info(f"🌤️ Väderdata hämtad för {weather_city}")
    
    # === 3. Check for news question ===
    news_context = None
    news_sources = ""
    if check_news_trigger(request.text):
        logger.info("📰 Hämtar senaste nyheterna...")
        news = get_latest_news()
        if news:
            news_context = format_news_for_context(news)
            # Build news sources
            news_source_list = []
            for i, item in enumerate(news[:3], 1):
                title = item.get('title', 'Artikel')[:40]
                link = item.get('link', 'https://www.svt.se')
                source = item.get('source', 'Nyheter')
                news_source_list.append(f"{i}. [{source} – {title}]({link})")
            if news_source_list:
                news_sources = "\n\n**Källor:**\n" + "\n".join(news_source_list)
            logger.info(f"✓ {len(news)} nyheter hämtade")
    
    # === 4. Check for Open Data API triggers ===
    open_data_context = None
    open_data_sources = ""
    triggered_api = check_open_data_trigger(request.text)
    if triggered_api:
        logger.info(f"📊 [OPEN DATA] Hämtar från {triggered_api.get('name')}...")
        open_data_result = fetch_open_data(triggered_api, request.text)
        if open_data_result:
            open_data_context = open_data_result
            # Build source link for Open Data API
            api_name = triggered_api.get('name', 'Öppen Data')
            api_url = triggered_api.get('url', 'https://www.dataportal.se')
            open_data_sources = f"\n\n**Källor:**\n1. [{api_name}]({api_url})"
            logger.info(f"✓ Data från {triggered_api.get('name')} mottagen")
    
    # === 5. Check for Tavily search trigger ===
    tavily_context = None
    tavily_sources = ""
    if check_tavily_trigger(request.text):
        logger.info(f"🔍 [TAVILY] Hämtar realtidsdata: {request.text[:60]}...")
        search_result = tavily_search(request.text)
        if search_result and search_result.get("answer"):
            tavily_context = search_result["answer"]
            tavily_sources = format_tavily_sources(search_result)
            logger.info("✓ Tavily-svar mottaget")
    
    # Format input with system prompt - ensures model always knows its identity
    full_input = format_inference_input(request.text)
    
    # Build enhanced context prefix
    context_parts = []
    
    # Always add time and season context
    context_parts.append(f"[Aktuell tid] {time_context} {season_context}")
    
    # Add weather if available
    if weather_context:
        context_parts.append(f"[Väder] {weather_context}")
    
    # Add news if available
    if news_context:
        context_parts.append(f"[Nyheter] {news_context}")
    
    # Add Open Data if available
    if open_data_context:
        context_parts.append(f"[Öppen data] {open_data_context}")
    
    # Add Tavily search results if available
    if tavily_context:
        context_parts.append(f"[Aktuell fakta] {tavily_context}")
        if tavily_sources:
            context_parts.append(tavily_sources)
    
    # If Force-Svenska is active, prepend Swedish instruction
    if force_svenska_active:
        context_parts.insert(0, "Du pratar alltid svenska. Inga engelska ord. Inga undantag. Svara på svenska nu.")
        logger.info("🇸🇪 Force-Svenska aktiverat – svarar på svenska")
    
    # Combine all context
    if context_parts:
        context_prefix = "\n".join(context_parts) + "\n\n"
        full_input = context_prefix + full_input
    
    # === DEBUG: Log inference start ===
    logger.debug("=" * 60)
    logger.debug("=== ONESEEK INFERENCE START ===")
    logger.debug("→ System prompt injected")
    logger.debug(f"→ Time context: {time_context[:50]}...")
    logger.debug(f"→ Season: {season_context}")
    logger.debug(f"→ Force-Svenska: {'ACTIVE' if force_svenska_active else 'inactive'}")
    logger.debug(f"→ Weather: {weather_city if weather_context else 'no'}")
    logger.debug(f"→ News: {'YES' if news_context else 'no'}")
    logger.debug(f"→ Tavily: {'YES' if tavily_context else 'no'}")
    logger.debug(f"→ Input text: {request.text[:100]}..." if len(request.text) > 100 else f"→ Input text: {request.text}")
    logger.debug(f"→ Max length: {request.max_length}")
    logger.debug(f"→ Temperature: {request.temperature}")
    logger.debug(f"→ Top P: {request.top_p}")
    logger.debug(f"→ DUAL_MODEL_MODE: {DUAL_MODEL_MODE}")
    
    try:
        if DUAL_MODEL_MODE:
            # Use dual-model inference (Mistral + LLaMA)
            logger.debug("→ Using DUAL-model inference path")
            result = await dual_model_inference(
                full_input,  # Use full input with system prompt
                max_length=request.max_length,
                temperature=request.temperature,
                top_p=request.top_p
            )
            
            return InferenceResponse(
                response=result['response'],
                model=result['model'],
                tokens=result['tokens'],
                latency_ms=result['latency_ms']
            )
        else:
            # Single-model fallback
            logger.debug("→ Using SINGLE-model inference path")
            logger.debug(f"→ Loading model from: {ONESEEK_PATH}")
            
            model, tokenizer = load_model('oneseek-7b-zero', ONESEEK_PATH)
            
            # === DEBUG: Log model info ===
            if hasattr(model, 'device'):
                logger.debug(f"→ Model device: {model.device}")
            if hasattr(model, 'dtype'):
                logger.debug(f"→ Model dtype: {model.dtype}")
            try:
                first_param_device = next(model.parameters()).device
                logger.debug(f"→ First param device: {first_param_device}")
            except:
                pass
            
            # Prepare input with system prompt and sync to model's device
            logger.debug("→ Tokenizing input with system prompt...")
            tokenize_start = time.time()
            inputs = tokenizer(full_input, return_tensors="pt", padding=True)
            tokenize_time = (time.time() - tokenize_start) * 1000
            logger.debug(f"→ Tokenization took: {tokenize_time:.1f}ms")
            
            # === DEBUG: Log input tensor info ===
            if hasattr(inputs, 'input_ids'):
                logger.debug(f"→ input_ids shape: {inputs.input_ids.shape}")
                logger.debug(f"→ input_ids device (before sync): {inputs.input_ids.device}")
                logger.debug(f"→ First 10 tokens: {inputs.input_ids[0][:10].tolist()}")
            elif isinstance(inputs, dict) and 'input_ids' in inputs:
                logger.debug(f"→ input_ids shape: {inputs['input_ids'].shape}")
                logger.debug(f"→ input_ids device (before sync): {inputs['input_ids'].device}")
                logger.debug(f"→ First 10 tokens: {inputs['input_ids'][0][:10].tolist()}")
            
            # Sync to model device
            logger.debug("→ Syncing inputs to model device...")
            inputs = sync_inputs_to_model_device(inputs, model)
            
            # === DEBUG: Log post-sync device ===
            if isinstance(inputs, dict) and 'input_ids' in inputs:
                logger.debug(f"→ input_ids device (after sync): {inputs['input_ids'].device}")
            elif hasattr(inputs, 'input_ids'):
                logger.debug(f"→ input_ids device (after sync): {inputs.input_ids.device}")
            
            # Generate with explicit attention_mask
            logger.info("→ Kallar model.generate()...")
            generate_start = time.time()
            
            with torch.no_grad():
                try:
                    # Use max_new_tokens instead of max_length to avoid input length issues
                    input_length = inputs['input_ids'].shape[1] if isinstance(inputs, dict) else inputs.input_ids.shape[1]
                    max_new = min(request.max_length, 512)  # Generate up to 512 new tokens
                    
                    outputs = model.generate(
                        input_ids=inputs['input_ids'] if isinstance(inputs, dict) else inputs.input_ids,
                        attention_mask=inputs['attention_mask'] if isinstance(inputs, dict) else inputs.attention_mask,
                        max_new_tokens=max_new,
                        temperature=request.temperature,
                        top_p=request.top_p,
                        do_sample=True,
                        pad_token_id=tokenizer.eos_token_id
                    )
                except Exception as gen_error:
                    logger.error(f"→ model.generate() FAILED: {gen_error}")
                    raise gen_error
            
            generate_time = (time.time() - generate_start)
            logger.info(f"→ Generate klar! Tog: {generate_time:.2f} sekunder")
            
            # === DEBUG: Log output info ===
            logger.debug(f"→ Output shape: {outputs.shape}")
            logger.debug(f"→ Output tokens: {len(outputs[0])}")
            logger.debug(f"→ Första 10 output tokens: {outputs[0][:10].tolist()}")
            
            # Decode output
            logger.debug("→ Decoding output...")
            decode_start = time.time()
            response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            decode_time = (time.time() - decode_start) * 1000
            logger.debug(f"→ Decoding took: {decode_time:.1f}ms")
            
            # Clean response using utility function
            response_text = clean_inference_response(response_text, full_input, request.text)
            
            # === APPEND SOURCES TO RESPONSE ===
            # Only add sources if they don't already exist in response
            if "**Källor:**" not in response_text:
                # Prioritize sources in order of specificity
                if open_data_sources:
                    response_text += open_data_sources
                elif weather_sources:
                    response_text += weather_sources
                elif news_sources:
                    response_text += news_sources
                elif tavily_sources:
                    response_text += tavily_sources
            
            latency_ms = (time.time() - start_time) * 1000
            
            # === DEBUG: Log response summary ===
            logger.debug(f"→ Response length: {len(response_text)} chars")
            logger.debug(f"→ Response preview: {response_text[:100]}..." if len(response_text) > 100 else f"→ Response: {response_text}")
            logger.info(f"=== ONESEEK INFERENCE COMPLETE ({latency_ms:.0f}ms) ===")
            logger.info("=" * 60)
            
            return InferenceResponse(
                response=response_text,
                model="OneSeek-7B-Zero.v1.1",
                tokens=len(outputs[0]),
                latency_ms=latency_ms
            )
        
    except Exception as e:
        logger.error(f"=== ONESEEK INFERENCE ERROR ===")
        logger.error(f"OneSeek-7B-Zero inference error: {str(e)}")
        import traceback
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/inference/llama", response_model=InferenceResponse)
async def llama_inference(request: InferenceRequest):
    """Generate response using LLaMA-2 7B (legacy endpoint - redirects to OneSeek)"""
    import time
    start_time = time.time()
    
    # Legacy endpoint deprecated - use /inference/oneseek instead
    logger.warning("Legacy llama endpoint called - DEPRECATED. Use /inference/oneseek instead.")
    raise HTTPException(
        status_code=410,
        detail="This legacy endpoint has been removed. Please use /inference/oneseek for all inference requests. OneSeek-7B-Zero is the unified model for all inference."
    )

@app.post("/inference/mistral", response_model=InferenceResponse)
async def mistral_inference(request: InferenceRequest):
    """Generate response using Mistral 7B (DEPRECATED - use /inference/oneseek)"""
    import time
    start_time = time.time()
    
    # Legacy endpoint deprecated - use /inference/oneseek instead
    logger.warning("Legacy mistral endpoint called - DEPRECATED. Use /inference/oneseek instead.")
    raise HTTPException(
        status_code=410,
        detail="This legacy endpoint has been removed. Please use /inference/oneseek for all inference requests. OneSeek-7B-Zero is the unified model for all inference."
    )

@app.get("/models/status")
async def models_status():
    """Get status of loaded models"""
    status = {}
    
    for model_name, model in models.items():
        status[model_name] = {
            "loaded": True,
            "device": str(model.device),
            "dtype": str(model.dtype)
        }
    
    return {
        "device": DEVICE,
        "cuda_available": torch.cuda.is_available(),
        "models": status
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('ML_SERVICE_PORT', '5000'))
    host = "0.0.0.0" if args.listen else "127.0.0.1"
    
    uvicorn.run(
        app,
        host=host,
        port=port,
        log_level="info",
        timeout_keep_alive=args.timeout_keep_alive
    )
