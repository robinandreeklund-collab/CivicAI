"""
API Integrations for ONESEEK Δ+ v4.0

This module contains all external API integration functions for fetching
real-time data from Swedish government and public sources.

Created as part of ONESEEK Δ+ v4.0 to separate API logic from server.py.
Refactored in PR #102 to provide a unified API registry for all integrations.

Registry API:
- get_api_registry() - Get all registered API integrations
- get_api_integration(api_id) - Get a specific integration by ID
- call_api(api_id, query, entity) - Call an API with standardized interface
- get_api_stats() - Get request statistics per API
- toggle_api(api_id, enabled) - Enable/disable an API
- test_api(api_id) - Run a test request against an API
"""

import requests
from typing import Optional, Dict, Any, List, Callable
from datetime import datetime
from pathlib import Path
import json
import logging
import re
import os

# Try to import feedparser for RSS feeds
try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False

logger = logging.getLogger(__name__)


# =============================================================================
# API REQUEST STATISTICS
# =============================================================================
# Track request counts, success/failure rates, and last call timestamps per API

_api_stats: Dict[str, Dict[str, Any]] = {}


def _init_api_stats(api_id: str) -> None:
    """Initialize stats for an API if not present."""
    if api_id not in _api_stats:
        _api_stats[api_id] = {
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "last_call": None,
            "last_success": None,
            "last_error": None,
            "avg_response_time_ms": 0,
            "total_response_time_ms": 0
        }


def _record_api_call(api_id: str, success: bool, response_time_ms: float = 0, error: str = None) -> None:
    """Record an API call for statistics tracking."""
    _init_api_stats(api_id)
    stats = _api_stats[api_id]
    
    stats["total_requests"] += 1
    stats["last_call"] = datetime.now().isoformat()
    stats["total_response_time_ms"] += response_time_ms
    
    if stats["total_requests"] > 0:
        stats["avg_response_time_ms"] = stats["total_response_time_ms"] / stats["total_requests"]
    
    if success:
        stats["successful_requests"] += 1
        stats["last_success"] = datetime.now().isoformat()
    else:
        stats["failed_requests"] += 1
        stats["last_error"] = error or "Unknown error"


def get_api_stats() -> Dict[str, Dict[str, Any]]:
    """
    Get request statistics for all APIs.
    
    Returns:
        Dict mapping API IDs to their statistics
    """
    return _api_stats.copy()


def get_api_stats_for(api_id: str) -> Optional[Dict[str, Any]]:
    """
    Get request statistics for a specific API.
    
    Args:
        api_id: The API identifier
        
    Returns:
        Statistics dict or None if API not tracked
    """
    return _api_stats.get(api_id)


def reset_api_stats(api_id: str = None) -> None:
    """
    Reset API statistics.
    
    Args:
        api_id: Specific API to reset, or None to reset all
    """
    global _api_stats
    if api_id:
        if api_id in _api_stats:
            del _api_stats[api_id]
    else:
        _api_stats = {}


# =============================================================================
# API REGISTRY - UNIFIED INTEGRATION INTERFACE
# =============================================================================

class APIIntegration:
    """
    Represents a single API integration with standardized interface.
    
    Each integration has:
    - name: Human-readable name
    - api_id: Unique identifier
    - enabled: Whether the API is active
    - config: Configuration dict (url, timeout, etc.)
    - call_fn: Function to call the API
    - description: Description of what the API provides
    - triggers: Keywords that trigger this API
    """
    
    def __init__(
        self,
        api_id: str,
        name: str,
        call_fn: Callable,
        description: str = "",
        triggers: List[str] = None,
        config: Dict[str, Any] = None,
        enabled: bool = True,
        source: str = "",
        url: str = "",
        category: str = "general"
    ):
        self.api_id = api_id
        self.name = name
        self.call_fn = call_fn
        self.description = description
        self.triggers = triggers or []
        self.config = config or {}
        self.enabled = enabled
        self.source = source
        self.url = url
        self.category = category
    
    def call(self, query: str = None, entity: str = None, **kwargs) -> Optional[str]:
        """
        Call the API with standardized interface.
        
        Args:
            query: Search query or question
            entity: Specific entity (e.g., city name, person name)
            **kwargs: Additional parameters
            
        Returns:
            Formatted response string or None if failed
        """
        import time
        start_time = time.time()
        error_msg = None
        result = None
        
        try:
            result = self.call_fn(query=query, entity=entity, **kwargs)
            success = result is not None
        except Exception as e:
            success = False
            error_msg = str(e)
            logger.error(f"[{self.api_id}] API call failed: {e}")
        
        response_time_ms = (time.time() - start_time) * 1000
        _record_api_call(self.api_id, success, response_time_ms, error_msg)
        
        return result
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        stats = get_api_stats_for(self.api_id) or {}
        return {
            "api_id": self.api_id,
            "name": self.name,
            "description": self.description,
            "enabled": self.enabled,
            "triggers": self.triggers,
            "config": self.config,
            "source": self.source,
            "url": self.url,
            "category": self.category,
            "stats": stats
        }


# Global API registry
_api_registry: Dict[str, APIIntegration] = {}


def register_api(integration: APIIntegration) -> None:
    """Register an API integration in the registry."""
    _api_registry[integration.api_id] = integration
    _init_api_stats(integration.api_id)


# =============================================================================
# RIKSDAGEN API INTEGRATIONS
# =============================================================================

def fetch_riksdagen_ledamoter(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Fetch members of parliament (ledamöter) from Riksdagen's open data API.
    
    This function queries https://data.riksdagen.se/dokumentlista/?avd=ledamot&utformat=json
    to retrieve information about current and historical members of the Swedish Parliament.
    
    Args:
        query: Optional search query (name, party, constituency, etc.)
               If None, returns current ledamöter
        entity: Optional specific entity (person name, party name)
               If provided, used as the search query
        
    Returns:
        Formatted ledamot data with HTML source links, or None if failed
        
    Example queries:
        - "Ulf Kristersson" → specific person
        - "Moderaterna" → party members
        - "Stockholm" → ledamöter from Stockholm
        
    API documentation: https://www.dataportal.se/dataservice/98_3022
    """
    # Use entity if provided, otherwise fall back to query
    search_term = entity or query
    
    try:
        # Build the API URL
        base_url = "https://data.riksdagen.se/dokumentlista/"
        params = {
            "avd": "ledamot",
            "utformat": "json",
            "sort": "datum",
            "sortorder": "desc"
        }
        
        # Add search query if provided
        if search_term:
            params["sok"] = search_term
        
        # Make the API request
        response = requests.get(base_url, params=params, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            
            # Parse the ledamot data
            dokumentlista = data.get("dokumentlista", {})
            dokument = dokumentlista.get("dokument", [])
            
            if not dokument:
                # No results found
                if search_term:
                    return f"Inga ledamöter hittades för sökning: '{search_term}'\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
                return None
            
            # Format the results
            results = []
            source_links = []
            
            # Take up to 10 results
            for i, doc in enumerate(dokument[:10], 1):
                # Extract ledamot information
                titel = doc.get("titel", "Okänd ledamot")
                undertitel = doc.get("undertitel", "")
                datum = doc.get("datum", "")
                doc_id = doc.get("id", "")
                
                # Try to extract more details from subtitle
                parti = ""
                valkrets = ""
                if undertitel:
                    parts = undertitel.split(",")
                    if len(parts) >= 1:
                        parti = parts[0].strip()
                    if len(parts) >= 2:
                        valkrets = parts[1].strip()
                
                # Build result string
                result_line = f"• **{titel}**"
                if parti:
                    result_line += f" ({parti})"
                if valkrets:
                    result_line += f" – {valkrets}"
                if datum:
                    result_line += f" [Senast uppdaterad: {datum}]"
                results.append(result_line)
                
                # Build source link
                if doc_id:
                    link = f"https://www.riksdagen.se/sv/ledamoter-partier/ledamot/{doc_id}"
                    short_name = titel[:40] + "..." if len(titel) > 40 else titel
                    source_links.append(f'{i}. <a href="{link}">Riksdagen – {short_name}</a>')
            
            # Get metadata
            traffar = dokumentlista.get("@traffar", "0")
            
            # Build final response
            header = f"**Riksdagsledamöter"
            if search_term:
                header += f" (sökning: '{search_term}')"
            header += f"** (visar {min(10, len(dokument))} av {traffar} träffar):\n\n"
            
            result = header + "\n".join(results)
            
            # Add sources
            if source_links:
                result += "\n\n**Källor:**\n" + "\n".join(source_links[:5])
            else:
                result += "\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
            
            # Add API info
            result += f"\n\n_Data hämtad: {datetime.now().strftime('%Y-%m-%d %H:%M')} från Riksdagens öppna data_"
            
            return result
            
    except requests.exceptions.Timeout:
        return "Timeout vid anslutning till Riksdagens API.\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except requests.exceptions.RequestException as e:
        return f"Kunde inte nå Riksdagens API: {str(e)}\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except json.JSONDecodeError:
        return "Fel vid tolkning av data från Riksdagen.\n\n**Källa:** <a href=\"https://www.riksdagen.se/sv/ledamoter-partier/\">Riksdagen – Ledamöter och partier</a>"
    except Exception as e:
        return None


def fetch_riksdagen_ledamot_by_name(name: str) -> Optional[str]:
    """
    Fetch a specific member of parliament by name.
    
    Args:
        name: The name of the ledamot to search for
        
    Returns:
        Detailed information about the ledamot
    """
    return fetch_riksdagen_ledamoter(name)


def fetch_riksdagen_ledamoter_by_party(party: str) -> Optional[str]:
    """
    Fetch members of parliament by party.
    
    Args:
        party: Party name (e.g., "Moderaterna", "Socialdemokraterna")
        
    Returns:
        List of ledamöter in the specified party
    """
    return fetch_riksdagen_ledamoter(party)


def fetch_riksdagen_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
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


# =============================================================================
# SCB (STATISTICS SWEDEN) API INTEGRATIONS
# =============================================================================

def fetch_scb_population(location: str = None, query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Fetch real population data from SCB (Statistics Sweden) for a specific location.
    
    Args:
        location: City or municipality name (e.g., "Hjo", "Stockholm", "Skövde")
        
    Returns:
        Formatted population data string with actual numbers or None if failed
    """
    # Use entity or location parameter
    loc = entity or location
    if not loc:
        loc = "Sverige"
    
    try:
        kommun_url = "https://api.scb.se/OV0104/v1/doris/sv/ssd/BE/BE0101/BE0101A/BefolkningNy"
        
        try:
            r = requests.get(kommun_url, timeout=10)
            if r.status_code == 200:
                meta = r.json()
                variables = meta.get("variables", [])
                for var in variables:
                    if var.get("code") == "Region":
                        values = var.get("values", [])
                        value_texts = var.get("valueTexts", [])
                        
                        location_lower = loc.lower()
                        for i, text in enumerate(value_texts):
                            if location_lower in text.lower():
                                kommun_code = values[i]
                                kommun_name = text
                                
                                query_data = {
                                    "query": [
                                        {
                                            "code": "Region",
                                            "selection": {
                                                "filter": "item",
                                                "values": [kommun_code]
                                            }
                                        },
                                        {
                                            "code": "Tid",
                                            "selection": {
                                                "filter": "top",
                                                "values": ["1"]
                                            }
                                        }
                                    ],
                                    "response": {
                                        "format": "json"
                                    }
                                }
                                
                                pop_r = requests.post(kommun_url, json=query_data, timeout=15)
                                if pop_r.status_code == 200:
                                    pop_data = pop_r.json()
                                    data_values = pop_data.get("data", [])
                                    if data_values:
                                        latest = data_values[-1]
                                        year = latest.get("key", ["", ""])[1] if len(latest.get("key", [])) > 1 else "2024"
                                        population = latest.get("values", [0])[0]
                                        
                                        result = f"{kommun_name}: {int(population):,} invånare (31 dec {year})"
                                        result += f"\n\n**Källa:**\n"
                                        result += f'<a href="https://www.scb.se/hitta-statistik/statistik-efter-amne/befolkning/">SCB – Befolkningsstatistik</a>'
                                        return result
                                break
        except Exception:
            pass
        
        today = datetime.now().strftime("%Y-%m-%d")
        result = f"Befolkningsdata för {loc} (från SCB, hämtad {today})"
        result += f"\n\nFör exakt befolkningsdata, se SCB:s statistikdatabas."
        result += f"\n\n**Källa:**\n"
        result += f'<a href="https://www.scb.se/hitta-statistik/">SCB – Statistiska Centralbyrån</a>'
        return result
        
    except Exception:
        return None


def fetch_scb_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Fetch population/statistics data from SCB (Statistics Sweden) with source links.
    
    Args:
        query: Search query
        
    Returns:
        Formatted data string with HTML links or None if failed
    """
    try:
        url = "https://api.scb.se/OV0104/v1/doris/sv/ssd"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
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


# =============================================================================
# KRISINFORMATION API
# =============================================================================

def fetch_krisinformation(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
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
                latest = items[:3]
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


# =============================================================================
# TRAFIKVERKET API
# =============================================================================

# API key configuration
TRAFIKVERKET_API_KEY = os.getenv("TRAFIKVERKET_API_KEY")


def load_trafikverket_api_key():
    """Load Trafikverket API key from config if not in environment."""
    global TRAFIKVERKET_API_KEY
    
    if TRAFIKVERKET_API_KEY:
        return
    
    config_file = Path(__file__).parent.parent / "config" / "api_keys.json"
    if config_file.exists():
        try:
            data = json.loads(config_file.read_text(encoding="utf-8"))
            key = data.get("trafikverket_api_key", "")
            if key:
                TRAFIKVERKET_API_KEY = key
        except (json.JSONDecodeError, KeyError, TypeError):
            pass


load_trafikverket_api_key()


def fetch_trafikverket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Fetch traffic information from Trafikverket API.
    
    Args:
        query: Search query (road name, location, etc.)
        
    Returns:
        Traffic info string with HTML source links
    """
    global TRAFIKVERKET_API_KEY
    
    if not TRAFIKVERKET_API_KEY:
        result = "Trafikinformation för E4, E6, E18 och E20 – se aktuella olyckor och köer på trafiken.nu."
        result += "\n\n⚠️ **API-nyckel saknas** – Lägg till din Trafikverket API-nyckel i `config/api_keys.json`"
        result += "\n\n**Källor:**\n"
        result += '1. <a href="https://trafiken.nu">Trafiken.nu – Trafikinformation i realtid</a>\n'
        result += '2. <a href="https://www.trafikverket.se/trafikinformation/">Trafikverket – Trafikinformation</a>'
        return result
    
    try:
        api_url = "https://api.trafikinfo.trafikverket.se/v2/data.json"
        
        xml_request = f"""
        <REQUEST>
            <LOGIN authenticationkey="{TRAFIKVERKET_API_KEY}"/>
            <QUERY objecttype="Situation" schemaversion="1.5" limit="10">
                <FILTER>
                    <AND>
                        <EQ name="Deviation.MessageType" value="Olycka"/>
                    </AND>
                </FILTER>
                <INCLUDE>Deviation.Message</INCLUDE>
                <INCLUDE>Deviation.RoadNumber</INCLUDE>
                <INCLUDE>Deviation.CountyNo</INCLUDE>
                <INCLUDE>Deviation.LocationDescriptor</INCLUDE>
                <INCLUDE>Deviation.StartTime</INCLUDE>
                <INCLUDE>Deviation.EndTime</INCLUDE>
            </QUERY>
        </REQUEST>
        """
        
        response = requests.post(
            api_url,
            data=xml_request,
            headers={"Content-Type": "text/xml"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            situations = []
            if "RESPONSE" in data and "RESULT" in data["RESPONSE"]:
                for res in data["RESPONSE"]["RESULT"]:
                    if "Situation" in res:
                        for situation in res["Situation"][:5]:
                            if "Deviation" in situation:
                                for dev in situation["Deviation"]:
                                    msg = dev.get("Message", "Okänd händelse")
                                    road = dev.get("RoadNumber", "")
                                    loc = dev.get("LocationDescriptor", "")
                                    situations.append(f"• {road}: {msg} ({loc})")
            
            if situations:
                result = f"**Aktuella trafikstörningar ({datetime.now().strftime('%Y-%m-%d %H:%M')}):**\n\n"
                result += "\n".join(situations[:5])
                result += "\n\n**Källor:**\n"
                result += '1. <a href="https://api.trafikinfo.trafikverket.se">Trafikverket API</a>\n'
                result += '2. <a href="https://trafiken.nu">Trafiken.nu</a>'
                return result
            else:
                result = "Inga aktuella trafikstörningar rapporterade just nu.\n\n"
                result += "**Källor:**\n"
                result += '1. <a href="https://api.trafikinfo.trafikverket.se">Trafikverket API</a>\n'
                result += '2. <a href="https://trafiken.nu">Trafiken.nu</a>'
                return result
            
    except Exception as e:
        logger.error(f"[TRAFIKVERKET] Error fetching data: {e}")
    
    result = "Trafikinformation för E4, E6, E18 och E20 – se aktuella olyckor och köer på trafiken.nu."
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://trafiken.nu">Trafiken.nu – Trafikinformation i realtid</a>\n'
    result += '2. <a href="https://www.trafikverket.se/trafikinformation/">Trafikverket – Trafikinformation</a>'
    return result


# =============================================================================
# SAOL (SWEDISH DICTIONARY) API
# =============================================================================

def fetch_saol_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Fetch word data from SAOL (Svenska Akademiens Ordlista) with source links.
    
    Args:
        query: User query containing the word to look up
        
    Returns:
        Word definition, synonyms, and conjugation with HTML source links
    """
    try:
        word = entity or query or ""
        patterns = [
            r'vad betyder ordet\s+(\w+)',
            r'vad betyder\s+(\w+)',
            r'ordet\s+(\w+)',
            r'(\w+)\s+betydelse',
            r'synonym\s+till\s+(\w+)',
            r'synonymer\s+till\s+(\w+)',
        ]
        
        extracted_word = None
        for pattern in patterns:
            match = re.search(pattern, word, re.IGNORECASE)
            if match:
                extracted_word = match.group(1)
                break
        
        if not extracted_word:
            words = word.split()
            extracted_word = words[-1] if words else None
        
        if not extracted_word:
            return None
        
        result = f"**Ord:** {extracted_word}\n\n"
        result += f"Orddata från Svenska Akademiens Ordlista (SAOL). "
        result += f"För fullständig information om ordets betydelse, böjning och uttal, besök SAOL:s webbplats."
        result += '\n\n**Källor:**\n'
        result += f'1. <a href="https://svenska.se/saol/?sok={extracted_word}">SAOL – Svenska Akademiens Ordlista</a>\n'
        result += f'2. <a href="https://svenska.se/tre/?sok={extracted_word}">Svenska.se – Tre ordböcker</a>\n'
        result += '3. <a href="https://www.saob.se">SAOB – Svenska Akademiens Ordbok</a>'
        
        return result
    except Exception as e:
        logger.error(f"[SAOL] Error fetching word data: {e}")
        return None


# =============================================================================
# OPEN DATA PORTAL SEARCH
# =============================================================================

def fetch_open_data_search(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
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


# =============================================================================
# NEWS RSS FEEDS
# =============================================================================

def fetch_svt_news(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch latest news from SVT Nyheter RSS feed."""
    try:
        if not FEEDPARSER_AVAILABLE:
            return None
        
        feed = feedparser.parse("https://www.svt.se/nyheter/rss.xml")
        entries = feed.entries[:5]
        
        if not entries:
            return None
        
        news_items = []
        source_links = []
        for i, entry in enumerate(entries, 1):
            title = entry.get("title", "Okänd nyhet")
            link = entry.get("link", "https://www.svt.se/nyheter")
            published = entry.get("published", "")[:16] if entry.get("published") else ""
            news_items.append(f"• {title}" + (f" ({published})" if published else ""))
            source_links.append(f'{i}. <a href="{link}">SVT – {title[:50]}{"..." if len(title) > 50 else ""}</a>')
        
        result = "**Senaste nyheterna från SVT:**\n" + "\n".join(news_items)
        result += "\n\n**Källor:**\n" + "\n".join(source_links)
        return result
    except Exception:
        return None


def fetch_sr_ekot_news(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch latest news from SR Ekot (Sveriges Radio) RSS feed."""
    try:
        if not FEEDPARSER_AVAILABLE:
            return None
        
        feed = feedparser.parse("https://api.sr.se/api/rss/program/83")
        entries = feed.entries[:5]
        
        if not entries:
            return None
        
        news_items = []
        source_links = []
        for i, entry in enumerate(entries, 1):
            title = entry.get("title", "Okänd nyhet")
            link = entry.get("link", "https://sverigesradio.se/ekot")
            news_items.append(f"• {title}")
            source_links.append(f'{i}. <a href="{link}">SR Ekot – {title[:50]}{"..." if len(title) > 50 else ""}</a>')
        
        result = "**Senaste från Ekot (Sveriges Radio):**\n" + "\n".join(news_items)
        result += "\n\n**Källor:**\n" + "\n".join(source_links)
        return result
    except Exception:
        return None


def fetch_omni_news(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch latest news from Omni RSS feed."""
    try:
        if not FEEDPARSER_AVAILABLE:
            return None
        
        feed = feedparser.parse("https://omni.se/rss")
        entries = feed.entries[:5]
        
        if not entries:
            return None
        
        news_items = []
        source_links = []
        for i, entry in enumerate(entries, 1):
            title = entry.get("title", "Okänd nyhet")
            link = entry.get("link", "https://omni.se")
            news_items.append(f"• {title}")
            source_links.append(f'{i}. <a href="{link}">Omni – {title[:50]}{"..." if len(title) > 50 else ""}</a>')
        
        result = "**Senaste nyheterna från Omni:**\n" + "\n".join(news_items)
        result += "\n\n**Källor:**\n" + "\n".join(source_links)
        return result
    except Exception:
        return None


# =============================================================================
# OTHER GOVERNMENT APIS
# =============================================================================

def fetch_skolverket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch education data from Skolverket's open API."""
    try:
        url = "https://api.skolverket.se/syllabus/v1/subjects"
        r = requests.get(url, timeout=10, headers={"Accept": "application/json"})
        
        if r.status_code == 200:
            data = r.json()
            subjects = data[:10] if isinstance(data, list) else []
            
            if subjects:
                subject_list = []
                for subj in subjects[:5]:
                    name = subj.get("name", "Okänt ämne")
                    subject_list.append(f"• {name}")
                
                result = "**Ämnen i läroplanen (urval):**\n" + "\n".join(subject_list)
                result += "\n\n**Källor:**\n"
                result += '1. <a href="https://www.skolverket.se/undervisning/laroplaner-och-kursplaner">Skolverket – Läroplaner</a>\n'
                result += '2. <a href="https://www.skolverket.se/skolutveckling/statistik">Skolverket – Statistik</a>'
                return result
    except Exception:
        pass
    
    result = "Skolverket tillhandahåller läroplaner, kursplaner och utbildningsstatistik."
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.skolverket.se">Skolverket</a>\n'
    result += '2. <a href="https://www.skolverket.se/skolutveckling/statistik">Skolverket – Statistik</a>'
    return result


def fetch_arbetsformedlingen_jobs(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch job listings from Arbetsförmedlingen."""
    try:
        url = "https://jobsearch.api.jobtechdev.se/search"
        params = {"limit": 5}
        if query:
            params["q"] = query
        
        headers = {"Accept": "application/json"}
        r = requests.get(url, params=params, headers=headers, timeout=10)
        
        if r.status_code == 200:
            data = r.json()
            total = data.get("total", {}).get("value", 0)
            hits = data.get("hits", [])[:5]
            
            if hits:
                job_list = []
                source_links = []
                for i, job in enumerate(hits, 1):
                    title = job.get("headline", "Okänd tjänst")
                    employer = job.get("employer", {}).get("name", "Okänd arbetsgivare")
                    location = job.get("workplace_address", {}).get("municipality", "")
                    job_id = job.get("id", "")
                    
                    job_list.append(f"• {title} – {employer}" + (f" ({location})" if location else ""))
                    if job_id:
                        link = f"https://arbetsformedlingen.se/platsbanken/annonser/{job_id}"
                        source_links.append(f'{i}. <a href="{link}">{title[:40]}...</a>')
                
                result = f"**{total:,} lediga jobb** (visar 5):\n" + "\n".join(job_list)
                result += "\n\n**Källor:**\n" + "\n".join(source_links[:3])
                result += f'\n4. <a href="https://arbetsformedlingen.se/platsbanken">Platsbanken – Alla jobb</a>'
                return result
    except Exception:
        pass
    
    result = "Arbetsförmedlingens Platsbank innehåller tusentals lediga jobb."
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://arbetsformedlingen.se/platsbanken">Platsbanken</a>\n'
    result += '2. <a href="https://arbetsformedlingen.se">Arbetsförmedlingen</a>'
    return result


def fetch_nordpool_elpris(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch current electricity prices from Nord Pool."""
    today = datetime.now().strftime("%Y-%m-%d")
    
    result = f"**Elpriser Sverige ({today}):**\n"
    result += "Elområden i Sverige:\n"
    result += "• SE1 (Luleå) – Norra Sverige\n"
    result += "• SE2 (Sundsvall) – Mellansverige nord\n"
    result += "• SE3 (Stockholm) – Mellansverige syd\n"
    result += "• SE4 (Malmö) – Södra Sverige\n"
    result += "\n_Aktuella spotpriser uppdateras dagligen kl 13:00._"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.nordpoolgroup.com/en/Market-data1/Dayahead/Area-Prices/SE/Hourly/">Nord Pool – Spotpriser Sverige</a>\n'
    result += '2. <a href="https://www.energimyndigheten.se">Energimyndigheten</a>'
    return result


def fetch_socialstyrelsen_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch health statistics from Socialstyrelsen."""
    result = "Socialstyrelsen ansvarar för Sveriges hälso- och sjukvårdsstatistik."
    result += "\n\nTillgänglig statistik:\n"
    result += "• Vårdköer och väntetider\n"
    result += "• Dödsorsaksstatistik\n"
    result += "• Läkemedelsstatistik\n"
    result += "• COVID-19-statistik\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.socialstyrelsen.se/statistik-och-data/">Socialstyrelsen – Statistik</a>\n'
    result += '2. <a href="https://www.socialstyrelsen.se/statistik-och-data/statistik/statistik-om-halso-och-sjukvard/">Vård och hälsa</a>'
    return result


def fetch_folkhalsomyndigheten_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch public health data from Folkhälsomyndigheten."""
    result = "Folkhälsomyndigheten övervakar smittspridning och folkhälsa i Sverige."
    result += "\n\nAktuell information:\n"
    result += "• Smittläget (influensa, RS-virus, m.m.)\n"
    result += "• Vaccinationer\n"
    result += "• Hälsorapporter\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.folkhalsomyndigheten.se">Folkhälsomyndigheten</a>\n'
    result += '2. <a href="https://www.folkhalsomyndigheten.se/folkhalsorapportering-statistik/">Statistik och rapporter</a>'
    return result


def fetch_lantmateriet_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch geodata and property information from Lantmäteriet."""
    location_str = f" för {entity}" if entity else ""
    result = f"Lantmäteriet tillhandahåller kartor och fastighetsdata{location_str}."
    result += "\n\nTjänster:\n"
    result += "• Kartsök och koordinater\n"
    result += "• Fastighetsregister\n"
    result += "• Historiska flygbilder\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.lantmateriet.se">Lantmäteriet</a>\n'
    result += '2. <a href="https://minkarta.lantmateriet.se">Min karta</a>'
    return result


def fetch_bolagsverket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch company information from Bolagsverket."""
    result = "Bolagsverket hanterar registrering av företag och organisationer."
    result += "\n\nSök efter:\n"
    result += "• Aktiebolag och företag\n"
    result += "• Styrelser och revisorer\n"
    result += "• Årsredovisningar\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.bolagsverket.se">Bolagsverket</a>\n'
    result += '2. <a href="https://foretagsinfo.bolagsverket.se">Företagsinformation</a>'
    return result


def fetch_migrationsverket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch migration statistics from Migrationsverket."""
    result = "Migrationsverket publicerar statistik om:\n"
    result += "• Asylsökande per månad\n"
    result += "• Uppehållstillstånd\n"
    result += "• Medborgarskap\n"
    result += "• Handläggningstider\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.migrationsverket.se/Om-Migrationsverket/Statistik.html">Migrationsverket – Statistik</a>\n'
    result += '2. <a href="https://www.migrationsverket.se">Migrationsverket</a>'
    return result


def fetch_forsakringskassan_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch social insurance information from Försäkringskassan."""
    result = "Försäkringskassan hanterar socialförsäkringen i Sverige."
    result += "\n\nVanliga ersättningar:\n"
    result += "• Sjukpenning\n"
    result += "• Föräldrapenning\n"
    result += "• Barnbidrag\n"
    result += "• Bostadsbidrag\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.forsakringskassan.se">Försäkringskassan</a>\n'
    result += '2. <a href="https://www.forsakringskassan.se/privatpers">Privatperson – Alla ersättningar</a>'
    return result


def fetch_riksarkivet_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch archival information from Riksarkivet."""
    result = "Riksarkivet bevarar Sveriges historia och offentliga handlingar."
    result += "\n\nDigitala arkiv:\n"
    result += "• Folkräkningar\n"
    result += "• Kyrkoböcker\n"
    result += "• Historiska dokument\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.riksarkivet.se">Riksarkivet</a>\n'
    result += '2. <a href="https://sok.riksarkivet.se">Sök i arkiven</a>'
    return result


def fetch_kungliga_biblioteket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch library data from Kungliga Biblioteket."""
    result = "Kungliga Biblioteket är Sveriges nationalbibliotek."
    result += "\n\nDigitala resurser:\n"
    result += "• Svenska dagstidningar (1600-tal till idag)\n"
    result += "• Libris – Alla svenska bibliotek\n"
    result += "• E-böcker och ljudböcker\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.kb.se">Kungliga Biblioteket</a>\n'
    result += '2. <a href="https://libris.kb.se">Libris – Nationell bibliotekskatalog</a>'
    return result


def fetch_csn_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch study aid information from CSN."""
    current_year = datetime.now().year
    result = "CSN administrerar studiestöd och lån för studier."
    result += f"\n\nStudiemedel {current_year}:\n"
    result += "• Studiebidrag: ca 3 900 kr/mån\n"
    result += "• Studielån: upp till ca 8 000 kr/mån\n"
    result += "• Tilläggslån för äldre studenter\n"
    result += "\n_Beloppen kan ändras – se CSN för aktuella nivåer._"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.csn.se">CSN – Centrala studiestödsnämnden</a>\n'
    result += '2. <a href="https://www.csn.se/bidrag-och-lan">Bidrag och lån</a>'
    return result


def fetch_naturvardsverket_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch environmental data from Naturvårdsverket."""
    result = "Naturvårdsverket ansvarar för miljö- och naturvård."
    result += "\n\nMiljödata:\n"
    result += "• Luftkvalitet\n"
    result += "• Klimatutsläpp\n"
    result += "• Skyddade naturområden\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.naturvardsverket.se">Naturvårdsverket</a>\n'
    result += '2. <a href="https://www.naturvardsverket.se/data-och-statistik">Data och statistik</a>'
    return result


def fetch_luftkvalitet_smhi(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch air quality data from SMHI."""
    location_str = f" i {entity}" if entity else ""
    result = f"Luftkvalitetsindex{location_str}."
    result += "\n\nLuftkvalitet mäts på skalan 1-5:\n"
    result += "• 1 = Mycket god\n"
    result += "• 2 = God\n"
    result += "• 3 = Måttlig\n"
    result += "• 4 = Dålig\n"
    result += "• 5 = Mycket dålig\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.smhi.se/vader/halsa-och-komfort/luftmiljo">SMHI – Luftmiljö</a>\n'
    result += '2. <a href="https://www.naturvardsverket.se/data-och-statistik/luft/">Naturvårdsverket – Luftdata</a>'
    return result


def fetch_hemnet_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch housing market info from Hemnet."""
    location_str = f" i {entity}" if entity else ""
    result = f"Bostadsmarknaden{location_str}."
    result += "\n\nHemnet visar:\n"
    result += "• Bostäder till salu\n"
    result += "• Slutpriser\n"
    result += "• Prisstatistik per område\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.hemnet.se">Hemnet – Bostäder</a>\n'
    result += '2. <a href="https://www.hemnet.se/bostadsmarknaden">Hemnet – Slutpriser</a>'
    return result


def fetch_vinnova_data(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """Fetch innovation funding info from Vinnova."""
    result = "Vinnova finansierar innovation och forskning i Sverige."
    result += "\n\nAktuella utlysningar:\n"
    result += "• Forskningsprojekt\n"
    result += "• Innovationsbolag\n"
    result += "• Samverkansprojekt\n"
    result += "\n\n**Källor:**\n"
    result += '1. <a href="https://www.vinnova.se">Vinnova</a>\n'
    result += '2. <a href="https://www.vinnova.se/sok-finansiering">Sök finansiering</a>'
    return result


# =============================================================================
# LIBRIS XL API INTEGRATIONS (Kungliga Biblioteket)
# =============================================================================
# DEPRECATED: These functions are legacy code from the old API system.
# NEW SYSTEM: Use api/libris.py module with api_selector.py for modular API calls.
# These functions are kept for backward compatibility but should not be used for new features.
# =============================================================================

def fetch_libris_search(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    DEPRECATED: Use api/libris.py module instead.
    
    Search for books in Libris XL via Kungliga Biblioteket's xsearch API.
    
    Args:
        query: Search query (book title, author, etc.)
        entity: Entity for search (book title, author name)
        
    Returns:
        Formatted search results with links
    """
    logger.warning("[DEPRECATED] fetch_libris_search called. Use api/libris.py instead.")
    search_term = entity or query or "svenska klassiker"
    
    try:
        # Libris xsearch API
        url = f"https://libris.kb.se/xsearch?query={search_term}&format=json&n=5"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            # Get list of results
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            total = xsearch.get("records", 0)
            
            if not records:
                return f"Inga böcker hittades för '{search_term}'.\n\n**Källa:** <a href=\"https://libris.kb.se\">Libris – Nationell bibliotekskatalog</a>"
            
            result = f"**Bokresultat för '{search_term}'** (visar {min(5, len(records))} av {total} träffar):\n\n"
            
            for i, record in enumerate(records[:5], 1):
                title = record.get("title", "Okänd titel")
                creator = record.get("creator", "Okänd författare")
                date = record.get("date", "")
                identifier = record.get("identifier", "")
                
                result += f"**{i}. {title}**\n"
                result += f"   Författare: {creator}\n"
                if date:
                    result += f"   Utgivningsår: {date}\n"
                if identifier:
                    result += f"   ID: {identifier}\n"
                result += "\n"
            
            # Return without hardcoded source formatting - let AI personality handle it
            return result
            
    except requests.exceptions.Timeout:
        return "Timeout vid anslutning till Libris."
    except Exception as e:
        logger.error(f"[Libris Search] Error: {e}")
    
    # Fallback
    return f"""Bokresultat för '{search_term}':

Sök direkt i Libris för fullständig katalog: https://libris.kb.se"""


def fetch_libris_isbn(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    DEPRECATED: Use api/libris.py module instead.
    
    Look up book by ISBN from Libris XL.
    
    Args:
        query: ISBN number
        entity: ISBN number
        
    Returns:
        Book details for the ISBN
    """
    logger.warning("[DEPRECATED] fetch_libris_isbn called. Use api/libris.py instead.")
    isbn = entity or query or ""
    
    # Clean ISBN (remove dashes and spaces)
    isbn_clean = isbn.replace("-", "").replace(" ", "")
    
    if not isbn_clean or len(isbn_clean) < 10:
        return """ISBN-sökning: Ange ett giltigt ISBN-nummer (10 eller 13 siffror).
Exempel: 978-91-0-012345-6 eller 9100123456"""
    
    try:
        # Libris API for ISBN lookup
        url = f"https://libris.kb.se/xsearch?query=isbn:{isbn_clean}&format=json&n=1"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            
            if records:
                record = records[0]
                title = record.get("title", "Okänd titel")
                creator = record.get("creator", "Okänd författare")
                date = record.get("date", "")
                publisher = record.get("publisher", "")
                identifier = record.get("identifier", isbn)
                
                result = f"**{title}**\n\n"
                result += f"• **Författare:** {creator}\n"
                if date:
                    result += f"• **Utgivningsår:** {date}\n"
                if publisher:
                    result += f"• **Förlag:** {publisher}\n"
                result += f"• **ISBN:** {isbn}\n"
                
                # Return without hardcoded source formatting - let AI personality handle it
                return result
            
    except Exception as e:
        logger.error(f"[Libris ISBN] Error: {e}")
    
    return f"""ISBN: {isbn}

Kunde inte hitta bok med detta ISBN i Libris."""


def fetch_libris_sparql(query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    DEPRECATED: Use api/libris.py module instead.
    
    Query Libris XL via SPARQL for advanced searches.
    
    Args:
        query: SPARQL query or author/year search
        entity: Author name or year
        
    Returns:
        Query results
    """
    logger.warning("[DEPRECATED] fetch_libris_sparql called. Use api/libris.py instead.")
    search_term = entity or query or ""
    
    # For now, use xsearch as SPARQL requires complex queries
    # This can be expanded later with proper SPARQL support
    
    try:
        # Check if it's an author search
        url = f"https://libris.kb.se/xsearch?query=author:{search_term}&format=json&n=10"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            xsearch = data.get("xsearch", {})
            records = xsearch.get("list", [])
            total = xsearch.get("records", 0)
            
            if records:
                result = f"**Böcker av {search_term}** ({total} träffar):\n\n"
                
                for i, record in enumerate(records[:10], 1):
                    title = record.get("title", "Okänd titel")
                    date = record.get("date", "")
                    
                    result += f"{i}. **{title}**"
                    if date:
                        result += f" ({date})"
                    result += "\n"
                
                # Return without hardcoded source formatting - let AI personality handle it
                return result
                
    except Exception as e:
        logger.error(f"[Libris SPARQL] Error: {e}")
    
    return f"""Avancerad sökning: {search_term}

Libris SPARQL-endpoint för avancerade frågor: https://libris.kb.se/sparql"""


# =============================================================================
# SMART KEYWORD MATCHING FOR APIS
# =============================================================================

def get_matching_apis(category_config: Dict[str, Any], question: str) -> List[Dict[str, Any]]:
    """
    Get APIs from a category that have keywords matching the question.
    
    This enables smart parallel fetching - only APIs whose keywords match
    the user's question are called, reducing unnecessary API calls by 50-80%.
    
    Args:
        category_config: Category configuration from api_catalog
        question: User's question/query
        
    Returns:
        List of API configs whose keywords match the question
    """
    all_apis = category_config.get("apis", [])
    question_lower = question.lower()
    
    matching_apis = []
    
    for api in all_apis:
        api_keywords = api.get("keywords", [])
        
        # If API has no keywords, include it (backwards compatibility)
        if not api_keywords:
            matching_apis.append(api)
            continue
        
        # Check if any API keyword matches the question
        for keyword in api_keywords:
            if keyword.lower() in question_lower:
                matching_apis.append(api)
                break
    
    # If no APIs matched but we have APIs, return highest priority ones
    if not matching_apis and all_apis:
        # Sort by priority and return top 2
        sorted_apis = sorted(all_apis, key=lambda x: x.get("priority", 999))
        matching_apis = sorted_apis[:2]
    
    # Sort by priority
    matching_apis.sort(key=lambda x: x.get("priority", 999))
    
    return matching_apis


def reload_api_catalog() -> Dict[str, Any]:
    """
    Reload the API catalog from disk.
    
    This enables dynamic updates - changes to api_catalog.json
    take effect immediately without restart.
    
    Returns:
        Updated API catalog
    """
    try:
        catalog_path = Path(__file__).parent.parent / "config" / "api_catalog.json"
        if catalog_path.exists():
            with open(catalog_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                logger.info("[API Catalog] Reloaded from disk")
                return data.get("api_catalog", {})
    except Exception as e:
        logger.error(f"[API Catalog] Reload error: {e}")
    return {}


# =============================================================================
# GENERIC FETCH DISPATCHER
# =============================================================================

def fetch_open_data(api: dict, query: str = None, entity: str = None, **kwargs) -> Optional[str]:
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
    
    result = call_api(api_id, query=query, entity=entity)
    
    if result:
        return result
    
    # Fallback based on API ID
    if api_id == "scb":
        return fetch_scb_data(query=query)
    elif api_id == "krisinformation":
        return fetch_krisinformation()
    elif api_id == "riksdagen":
        return fetch_riksdagen_data(query=query)
    elif api_id == "trafikverket":
        return fetch_trafikverket_data(query=query)
    elif api_id == "opendata":
        return fetch_open_data_search(query=query)
    
    return fallback


# =============================================================================
# API CATALOG CONFIG LOADER
# =============================================================================

def load_api_catalog_config() -> Dict[str, Any]:
    """
    Load API catalog and active features from config/api_catalog.json.
    
    Returns:
        Dict with api_catalog, active_features, and system_prompt
    """
    config_file = Path(__file__).parent.parent / "config" / "api_catalog.json"
    
    if config_file.exists():
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load API catalog: {e}")
    
    return {
        "active_features": {
            "intent_engine": False,
            "typo_checker": False,
            "time_context": True
        },
        "api_catalog": {}
    }


def save_api_catalog_config(config: Dict[str, Any]) -> bool:
    """
    Save API catalog configuration to config/api_catalog.json.
    
    Args:
        config: The configuration dict to save
        
    Returns:
        True if successful, False otherwise
    """
    config_file = Path(__file__).parent.parent / "config" / "api_catalog.json"
    
    try:
        with open(config_file, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        logger.error(f"Failed to save API catalog: {e}")
        return False


# =============================================================================
# INITIALIZE API REGISTRY
# =============================================================================

def init_api_registry() -> None:
    """Initialize the API registry with all available integrations."""
    
    # Riksdagen APIs
    register_api(APIIntegration(
        api_id="riksdagen_ledamoter",
        name="Riksdagen Ledamöter",
        call_fn=fetch_riksdagen_ledamoter,
        description="Riksdagsledamöter, partier, valkretsar",
        triggers=["riksdagsledamot", "ledamot", "politiker", "parlamentsledamot"],
        source="Riksdagen",
        url="https://data.riksdagen.se",
        category="politik"
    ))
    
    register_api(APIIntegration(
        api_id="riksdagen_dokument",
        name="Riksdagen Dokument",
        call_fn=fetch_riksdagen_data,
        description="Voteringar, lagförslag, debatter",
        triggers=["röstade", "votering", "lagförslag", "debatt", "proposition", "motion"],
        source="Riksdagen",
        url="https://data.riksdagen.se",
        category="politik"
    ))
    
    # SCB APIs
    register_api(APIIntegration(
        api_id="scb_population",
        name="SCB Befolkning",
        call_fn=fetch_scb_population,
        description="Befolkningsstatistik per kommun",
        triggers=["befolkning", "invånare", "hur många bor", "folkmängd", "population"],
        source="SCB",
        url="https://api.scb.se",
        category="statistik"
    ))
    
    register_api(APIIntegration(
        api_id="scb_statistik",
        name="SCB Statistik",
        call_fn=fetch_scb_data,
        description="Allmän statistik från SCB",
        triggers=["statistik", "scb", "procent", "andel"],
        source="SCB",
        url="https://api.scb.se",
        category="statistik"
    ))
    
    # Krisinformation
    register_api(APIIntegration(
        api_id="krisinformation",
        name="Krisinformation",
        call_fn=fetch_krisinformation,
        description="Krislarm, VMA, beredskap",
        triggers=["kris", "krislarm", "vma", "varning", "nödläge", "beredskap"],
        source="Krisinformation.se",
        url="https://api.krisinformation.se",
        category="kris"
    ))
    
    # Trafikverket
    register_api(APIIntegration(
        api_id="trafikverket",
        name="Trafikverket",
        call_fn=fetch_trafikverket_data,
        description="Trafikinformation, olyckor, störningar",
        triggers=["trafik", "trafikinfo", "olycka", "kö", "e4", "e6", "e18", "e20", "motorväg"],
        source="Trafikverket",
        url="https://api.trafikinfo.trafikverket.se",
        category="trafik"
    ))
    
    # News RSS feeds
    register_api(APIIntegration(
        api_id="svt_nyheter",
        name="SVT Nyheter",
        call_fn=fetch_svt_news,
        description="Senaste nyheterna från SVT",
        triggers=["nyheter", "senaste nytt", "vad hände", "aktuellt"],
        source="SVT",
        url="https://www.svt.se/nyheter/rss.xml",
        category="nyheter"
    ))
    
    register_api(APIIntegration(
        api_id="sr_ekot",
        name="SR Ekot",
        call_fn=fetch_sr_ekot_news,
        description="Nyheter från Sveriges Radio Ekot",
        triggers=["ekot", "radio nyheter", "sr nyheter"],
        source="Sveriges Radio",
        url="https://api.sr.se/api/rss/program/83",
        category="nyheter"
    ))
    
    register_api(APIIntegration(
        api_id="omni",
        name="Omni Nyheter",
        call_fn=fetch_omni_news,
        description="Nyheter från Omni",
        triggers=["omni"],
        source="Omni",
        url="https://omni.se/rss",
        category="nyheter"
    ))
    
    # Government agencies
    register_api(APIIntegration(
        api_id="skolverket",
        name="Skolverket",
        call_fn=fetch_skolverket_data,
        description="Läroplaner, kursplaner, utbildningsstatistik",
        triggers=["skola", "skolverket", "utbildning", "läroplan", "betyg"],
        source="Skolverket",
        url="https://api.skolverket.se",
        category="utbildning"
    ))
    
    register_api(APIIntegration(
        api_id="arbetsformedlingen",
        name="Arbetsförmedlingen",
        call_fn=fetch_arbetsformedlingen_jobs,
        description="Lediga jobb och arbetsmarknadsstatistik",
        triggers=["lediga jobb", "arbetslöshet", "arbetsmarknad", "jobb", "platsbanken"],
        source="Arbetsförmedlingen",
        url="https://jobsearch.api.jobtechdev.se",
        category="arbetsmarknad"
    ))
    
    register_api(APIIntegration(
        api_id="nordpool_elpris",
        name="Nord Pool Elpriser",
        call_fn=fetch_nordpool_elpris,
        description="Elpriser för svenska elområden",
        triggers=["elpris", "energi", "elkostnad", "elområde", "se1", "se2", "se3", "se4"],
        source="Nord Pool",
        url="https://www.nordpoolgroup.com",
        category="energi"
    ))
    
    register_api(APIIntegration(
        api_id="socialstyrelsen",
        name="Socialstyrelsen",
        call_fn=fetch_socialstyrelsen_data,
        description="Hälso- och sjukvårdsstatistik",
        triggers=["vård", "vårdkö", "sjukvård", "socialstyrelsen", "dödsorsak"],
        source="Socialstyrelsen",
        url="https://www.socialstyrelsen.se",
        category="hälsa"
    ))
    
    register_api(APIIntegration(
        api_id="folkhalsomyndigheten",
        name="Folkhälsomyndigheten",
        call_fn=fetch_folkhalsomyndigheten_data,
        description="Smittläge och folkhälsostatistik",
        triggers=["smitta", "vaccination", "folkhälsa", "influensa"],
        source="Folkhälsomyndigheten",
        url="https://www.folkhalsomyndigheten.se",
        category="hälsa"
    ))
    
    register_api(APIIntegration(
        api_id="lantmateriet",
        name="Lantmäteriet",
        call_fn=fetch_lantmateriet_data,
        description="Kartor, fastighetsdata, geodata",
        triggers=["fastighet", "lantmäteriet", "karta", "koordinat", "geodata"],
        source="Lantmäteriet",
        url="https://www.lantmateriet.se",
        category="geodata"
    ))
    
    register_api(APIIntegration(
        api_id="bolagsverket",
        name="Bolagsverket",
        call_fn=fetch_bolagsverket_data,
        description="Företags- och bolagsinformation",
        triggers=["bolag", "företag", "styrelse", "organisationsnummer", "bolagsverket"],
        source="Bolagsverket",
        url="https://www.bolagsverket.se",
        category="företag"
    ))
    
    register_api(APIIntegration(
        api_id="migrationsverket",
        name="Migrationsverket",
        call_fn=fetch_migrationsverket_data,
        description="Migrationsstatistik, asyl, uppehållstillstånd",
        triggers=["migration", "asyl", "uppehållstillstånd", "visum", "migrationsverket"],
        source="Migrationsverket",
        url="https://www.migrationsverket.se",
        category="migration"
    ))
    
    register_api(APIIntegration(
        api_id="forsakringskassan",
        name="Försäkringskassan",
        call_fn=fetch_forsakringskassan_data,
        description="Socialförsäkring, bidrag, ersättningar",
        triggers=["försäkringskassan", "sjukpenning", "föräldrapenning", "barnbidrag", "bostadsbidrag"],
        source="Försäkringskassan",
        url="https://www.forsakringskassan.se",
        category="socialförsäkring"
    ))
    
    register_api(APIIntegration(
        api_id="riksarkivet",
        name="Riksarkivet",
        call_fn=fetch_riksarkivet_data,
        description="Historiska dokument, arkiv, folkräkningar",
        triggers=["arkiv", "riksarkivet", "historia", "folkräkning", "kyrkoböcker"],
        source="Riksarkivet",
        url="https://www.riksarkivet.se",
        category="arkiv"
    ))
    
    register_api(APIIntegration(
        api_id="kungliga_biblioteket",
        name="Kungliga Biblioteket",
        call_fn=fetch_kungliga_biblioteket_data,
        description="Nationalbibliotek, Libris, tidningar",
        triggers=["bibliotek", "libris", "kungliga biblioteket", "tidningar"],
        source="Kungliga Biblioteket",
        url="https://www.kb.se",
        category="kultur"
    ))
    
    register_api(APIIntegration(
        api_id="csn",
        name="CSN",
        call_fn=fetch_csn_data,
        description="Studiemedel, studiebidrag, studielån",
        triggers=["studiemedel", "csn", "studiebidrag", "studielån"],
        source="CSN",
        url="https://www.csn.se",
        category="utbildning"
    ))
    
    register_api(APIIntegration(
        api_id="naturvardsverket",
        name="Naturvårdsverket",
        call_fn=fetch_naturvardsverket_data,
        description="Miljödata, luftkvalitet, klimat",
        triggers=["miljö", "luftkvalitet", "klimat", "naturvårdsverket", "utsläpp"],
        source="Naturvårdsverket",
        url="https://www.naturvardsverket.se",
        category="miljö"
    ))
    
    register_api(APIIntegration(
        api_id="luftkvalitet",
        name="Luftkvalitet SMHI",
        call_fn=fetch_luftkvalitet_smhi,
        description="Luftkvalitetsindex för svenska städer",
        triggers=["luftkvalitet", "luftföroreningar", "partiklar"],
        source="SMHI",
        url="https://www.smhi.se",
        category="miljö"
    ))
    
    register_api(APIIntegration(
        api_id="hemnet",
        name="Hemnet",
        call_fn=fetch_hemnet_data,
        description="Bostäder till salu, slutpriser",
        triggers=["bostadspris", "bostadspriser", "hemnet", "hus till salu", "lägenheter"],
        source="Hemnet",
        url="https://www.hemnet.se",
        category="bostad"
    ))
    
    register_api(APIIntegration(
        api_id="vinnova",
        name="Vinnova",
        call_fn=fetch_vinnova_data,
        description="Innovation och forskningsfinansiering",
        triggers=["innovation", "vinnova", "forskningsbidrag"],
        source="Vinnova",
        url="https://www.vinnova.se",
        category="forskning"
    ))
    
    register_api(APIIntegration(
        api_id="saol",
        name="SAOL",
        call_fn=fetch_saol_data,
        description="Svenska ord, betydelser, synonymer",
        triggers=["vad betyder", "ord", "svenska ord", "ordlista", "betydelse", "synonym"],
        source="SAOL",
        url="https://svenska.se",
        category="språk"
    ))
    
    register_api(APIIntegration(
        api_id="dataportal",
        name="Dataportal.se",
        call_fn=fetch_open_data_search,
        description="Sök i alla svenska öppna data",
        triggers=["öppen data", "opendata", "dataportal", "offentlig förvaltning"],
        source="DIGG",
        url="https://www.dataportal.se",
        category="öppen_data"
    ))
    
    # === BÖCKER (Libris XL) ===
    register_api(APIIntegration(
        api_id="libris_search",
        name="Libris Sökning",
        call_fn=fetch_libris_search,
        description="Sök böcker i Libris via Kungliga Biblioteket",
        triggers=["bok", "böcker", "bibliotek", "libris", "läsa", "författare"],
        source="Libris XL",
        url="https://libris.kb.se/xsearch",
        category="böcker"
    ))
    
    register_api(APIIntegration(
        api_id="libris_isbn",
        name="Libris ISBN",
        call_fn=fetch_libris_isbn,
        description="Slå upp bok via ISBN-nummer",
        triggers=["isbn", "978", "91-", "bokens isbn"],
        source="Libris XL",
        url="https://libris.kb.se/api/isbn",
        category="böcker"
    ))
    
    register_api(APIIntegration(
        api_id="libris_sparql",
        name="Libris SPARQL",
        call_fn=fetch_libris_sparql,
        description="Avancerad sökning i Libris (författare, år, förlag)",
        triggers=["alla böcker av", "utgivna år", "författare", "förlag"],
        source="Libris XL",
        url="https://libris.kb.se/sparql",
        category="böcker"
    ))
    
    logger.info(f"[API Registry] Initialized with {len(_api_registry)} integrations")


# Flag to track if registry has been initialized
_registry_initialized = False


def ensure_registry_initialized() -> None:
    """Ensure the API registry is initialized (lazy initialization)."""
    global _registry_initialized
    if not _registry_initialized:
        init_api_registry()
        _registry_initialized = True


def get_api_registry() -> Dict[str, 'APIIntegration']:
    """
    Get all registered API integrations.
    
    Returns:
        Dict mapping API IDs to APIIntegration objects
    """
    ensure_registry_initialized()
    return _api_registry


def get_api_integration(api_id: str) -> Optional['APIIntegration']:
    """
    Get a specific API integration by ID.
    
    Args:
        api_id: The API identifier
        
    Returns:
        APIIntegration object or None if not found
    """
    ensure_registry_initialized()
    return _api_registry.get(api_id)


def call_api(api_id: str, query: str = None, entity: str = None, **kwargs) -> Optional[str]:
    """
    Call an API by ID with standardized interface.
    
    Args:
        api_id: The API identifier
        query: Search query or question
        entity: Specific entity
        **kwargs: Additional parameters
        
    Returns:
        Formatted response string or None if failed or disabled
    """
    ensure_registry_initialized()
    integration = _api_registry.get(api_id)
    if not integration:
        logger.warning(f"[API] Unknown API: {api_id}")
        return None
    
    if not integration.enabled:
        logger.debug(f"[API] {api_id} is disabled")
        return None
    
    return integration.call(query=query, entity=entity, **kwargs)


def toggle_api(api_id: str, enabled: bool = None) -> bool:
    """
    Toggle an API's enabled status.
    
    Args:
        api_id: The API identifier
        enabled: New status, or None to toggle
        
    Returns:
        New enabled status
    """
    ensure_registry_initialized()
    integration = _api_registry.get(api_id)
    if not integration:
        return False
    
    if enabled is None:
        integration.enabled = not integration.enabled
    else:
        integration.enabled = enabled
    
    return integration.enabled


def test_api(api_id: str, query: str = None, entity: str = None) -> Dict[str, Any]:
    """
    Run a test request against an API.
    
    Args:
        api_id: The API identifier
        query: Optional custom query to test with
        entity: Optional entity to test with
        
    Returns:
        Dict with test results including success, response, and timing
    """
    import time
    
    ensure_registry_initialized()
    integration = _api_registry.get(api_id)
    if not integration:
        return {
            "success": False,
            "error": f"API not found: {api_id}",
            "api_id": api_id
        }
    
    # Use custom query or default test query
    test_query = query or "test"
    test_entity = entity
    
    start_time = time.time()
    try:
        # Use integration.call() which records stats
        result = integration.call(query=test_query, entity=test_entity)
        response_time_ms = (time.time() - start_time) * 1000
        
        # Get updated stats
        stats = get_api_stats_for(api_id) or {}
        
        # Limit response size to prevent memory issues (max 50KB)
        max_response_size = 50 * 1024
        truncated = False
        full_response = result
        if result and len(result) > max_response_size:
            full_response = result[:max_response_size] + "\n\n[... Svar trunkerat, totalt {} tecken]".format(len(result))
            truncated = True
        
        return {
            "success": result is not None,
            "api_id": api_id,
            "name": integration.name,
            "url": integration.url,
            "response": full_response,  # Full response for markdown display (limited to 50KB)
            "response_preview": result[:500] if result else None,
            "response_length": len(result) if result else 0,
            "response_time_ms": round(response_time_ms, 2),
            "timestamp": datetime.now().isoformat(),
            "stats": stats,  # Include updated stats
            "truncated": truncated
        }
    except Exception as e:
        response_time_ms = (time.time() - start_time) * 1000
        # Record the failed call
        _record_api_call(api_id, False, response_time_ms, str(e))
        stats = get_api_stats_for(api_id) or {}
        
        return {
            "success": False,
            "api_id": api_id,
            "name": integration.name,
            "url": integration.url,
            "error": str(e),
            "response_time_ms": round(response_time_ms, 2),
            "timestamp": datetime.now().isoformat(),
            "stats": stats
        }


def get_registry_summary() -> Dict[str, Any]:
    """
    Get a summary of the API registry.
    
    Returns:
        Dict with counts and status information
    """
    ensure_registry_initialized()
    total = len(_api_registry)
    enabled = sum(1 for api in _api_registry.values() if api.enabled)
    
    categories = {}
    for api in _api_registry.values():
        cat = api.category
        if cat not in categories:
            categories[cat] = {"total": 0, "enabled": 0}
        categories[cat]["total"] += 1
        if api.enabled:
            categories[cat]["enabled"] += 1
    
    total_requests = sum(s.get("total_requests", 0) for s in _api_stats.values())
    successful_requests = sum(s.get("successful_requests", 0) for s in _api_stats.values())
    
    return {
        "total_apis": total,
        "enabled_apis": enabled,
        "disabled_apis": total - enabled,
        "categories": categories,
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "failed_requests": total_requests - successful_requests,
        "success_rate": round(successful_requests / total_requests * 100, 1) if total_requests > 0 else 0
    }


# =============================================================================
# EXPORT ALL FUNCTIONS
# =============================================================================

# =============================================================================
# BROWSE_PAGE - Web Content Fetching
# =============================================================================

def browse_page_with_bert(url: str, ratio: float = 0.3, min_length: int = 100) -> Optional[str]:
    """
    Fetch and extract text content from a web page, then summarize with BERT.
    
    This function fetches the ENTIRE page content (no character limit on input),
    then uses BERT extractive summarization to create a concise, relevant summary.
    This ensures the model receives high-quality summaries instead of raw HTML content.
    
    Args:
        url: The URL to fetch (may include anchor fragment like #K11P1)
        ratio: Compression ratio for BERT summarization (0.2-0.5 recommended, default 0.3)
        min_length: Minimum summary length in characters (default 100)
        
    Returns:
        BERT-summarized content or error message
    """
    try:
        # First, fetch the full page content WITHOUT character limit
        # browse_page with max_length=999999 fetches the entire content
        full_text = browse_page(url, max_length=999999)
        
        # Check if fetch failed
        if not full_text or full_text.startswith("Kunde inte") or full_text.startswith("Ett oväntat fel"):
            return full_text
        
        # Remove the "Innehållet fortsätter på webbplatsen" suffix if present
        full_text = re.sub(r'\.\.\.\n\n\[Innehållet fortsätter på webbplatsen\]$', '', full_text)
        
        # If text is very short, no need to summarize
        if len(full_text) < min_length * 2:
            logger.info(f"[browse_page_with_bert] Text too short to summarize ({len(full_text)} chars), returning as-is")
            return full_text
        
        logger.info(f"[browse_page_with_bert] Summarizing {len(full_text)} chars with BERT (ratio={ratio})")
        
        # Call BERT summarizer
        import subprocess
        import json as json_module
        from pathlib import Path
        
        # Path to bert_summarizer.py
        bert_script = Path(__file__).parent.parent / "backend" / "python_services" / "bert_summarizer.py"
        
        if not bert_script.exists():
            logger.warning(f"[browse_page_with_bert] BERT summarizer script not found at {bert_script}")
            # Fall back to truncated content
            return full_text[:3000] + "...\n\n[Innehållet fortsätter på webbplatsen]"
        
        # Prepare input for BERT summarizer
        input_data = {
            "text": full_text,
            "ratio": ratio,
            "min_length": min_length,
            "max_length": None  # No limit on output
        }
        
        # Call the BERT summarizer Python script
        try:
            result = subprocess.run(
                [sys.executable, str(bert_script)],
                input=json_module.dumps(input_data, ensure_ascii=False),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                output = json_module.loads(result.stdout)
                if output.get("success"):
                    summary = output.get("summary", "")
                    metadata = output.get("metadata", {})
                    logger.info(f"[browse_page_with_bert] BERT summarization successful: "
                              f"{metadata.get('original_length', 0)} → {metadata.get('summary_length', 0)} chars "
                              f"(compression: {metadata.get('compression_ratio', 0):.2%})")
                    return summary
                else:
                    logger.error(f"[browse_page_with_bert] BERT summarization failed: {output.get('error')}")
                    # Fall back to truncated content
                    return full_text[:3000] + "...\n\n[Innehållet fortsätter på webbplatsen]"
            else:
                logger.error(f"[browse_page_with_bert] BERT script failed: {result.stderr}")
                # Fall back to truncated content
                return full_text[:3000] + "...\n\n[Innehållet fortsätter på webbplatsen]"
                
        except subprocess.TimeoutExpired:
            logger.error(f"[browse_page_with_bert] BERT summarization timed out")
            return full_text[:3000] + "...\n\n[Innehållet fortsätter på webbplatsen]"
        except Exception as e:
            logger.error(f"[browse_page_with_bert] Error calling BERT summarizer: {e}")
            return full_text[:3000] + "...\n\n[Innehållet fortsätter på webbplatsen]"
        
    except Exception as e:
        logger.error(f"[browse_page_with_bert] Unexpected error: {e}")
        return f"Ett oväntat fel uppstod vid hämtning och summering av {url}"


def browse_page(url: str, max_length: int = 3000) -> Optional[str]:
    """
    Fetch and extract text content from a web page.
    
    This function is used by personalities like Socionomen to fetch legislation
    texts, statistics, and official documents from government websites.
    
    Special handling for anchor fragments (e.g., #K11P1):
    - If URL contains anchor, attempts to extract only that specific HTML element
    - Falls back to full page content if anchor element not found
    
    Note: Uses regex-based HTML parsing for simplicity and minimal dependencies.
    For more robust parsing, consider upgrading to BeautifulSoup in the future.
    
    .. deprecated:: 
        Use browse_page_with_bert instead for better results.
        This function is kept for backward compatibility and as a fallback.
    
    Args:
        url: The URL to fetch (may include anchor fragment like #K11P1)
        max_length: Maximum length of returned text (default 3000 chars for paragraph-level content)
        
    Returns:
        Extracted text content or error message
    """
    import warnings
    warnings.warn(
        "browse_page is deprecated, use browse_page_with_bert instead",
        DeprecationWarning,
        stacklevel=2
    )
    try:
        from urllib.parse import urlparse
        
        logger.info(f"[browse_page] Fetching: {url}")
        
        # Parse URL to extract anchor fragment
        parsed_url = urlparse(url)
        anchor = parsed_url.fragment  # e.g., "K11P1" from "#K11P1"
        
        headers = {
            'User-Agent': 'CivicAI/1.0 (Compatible; OneSeek Bot)',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
        }
        
        # Note: HTTP GET ignores fragment (#...), so we fetch the full page
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = response.apparent_encoding or 'utf-8'
        
        text = response.text
        
        # If anchor present, try to extract only that element's content
        if anchor:
            # Remove script and style tags first (they might interfere with extraction)
            text_clean = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text_clean = re.sub(r'<style[^>]*>.*?</style>', '', text_clean, flags=re.DOTALL | re.IGNORECASE)
            
            # Find element with id matching anchor
            # Pattern matches: <section id="K4P1"...>content</section> or <div id="K4P1"...>content</div>
            # Uses non-greedy matching and captures all content including nested tags
            pattern = rf'<(section|div)[^>]*\s+id=["\']?{re.escape(anchor)}["\']?[^>]*>(.*?)</\1>'
            match = re.search(pattern, text_clean, flags=re.DOTALL | re.IGNORECASE)
            
            if match:
                # Extract only the content within the matching element
                html_content = match.group(2)
                logger.info(f"[browse_page] Found anchor #{anchor}, extracted {len(html_content)} chars of HTML")
                text = html_content
            else:
                # Anchor not found, log warning and use full page
                logger.warning(f"[browse_page] Anchor #{anchor} not found in HTML, using full page content")
                text = text_clean
        
        # Remove script and style tags (if not already done)
        if not anchor:
            text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', ' ', text)
        
        # Clean up whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Limit length
        if len(text) > max_length:
            text = text[:max_length] + "...\n\n[Innehållet fortsätter på webbplatsen]"
        
        logger.info(f"[browse_page] Successfully fetched {len(text)} characters from {url}")
        return text
        
    except requests.RequestException as e:
        logger.error(f"[browse_page] Error fetching {url}: {e}")
        return f"Kunde inte hämta innehåll från {url}. Fel: {str(e)}"
    except Exception as e:
        logger.error(f"[browse_page] Unexpected error for {url}: {e}")
        return f"Ett oväntat fel uppstod vid hämtning av {url}"


__all__ = [
    # Registry functions
    'APIIntegration',
    'get_api_registry',
    'get_api_integration',
    'call_api',
    'toggle_api',
    'test_api',
    'register_api',
    'get_registry_summary',
    
    # Statistics functions
    'get_api_stats',
    'get_api_stats_for',
    'reset_api_stats',
    
    # Config functions
    'load_api_catalog_config',
    'save_api_catalog_config',
    
    # Smart matching functions
    'get_matching_apis',
    'reload_api_catalog',
    
    # Libris XL integrations
    'fetch_libris_search',
    'fetch_libris_isbn',
    'fetch_libris_sparql',
    
    # Individual API functions
    'fetch_riksdagen_ledamoter',
    'fetch_riksdagen_ledamot_by_name',
    'fetch_riksdagen_ledamoter_by_party',
    'fetch_riksdagen_data',
    'fetch_scb_population',
    'fetch_scb_data',
    'fetch_krisinformation',
    'fetch_trafikverket_data',
    'fetch_saol_data',
    'fetch_open_data_search',
    
    # Web page fetching
    'browse_page',
    'browse_page_with_bert',
    'fetch_svt_news',
    'fetch_sr_ekot_news',
    'fetch_omni_news',
    'fetch_skolverket_data',
    'fetch_arbetsformedlingen_jobs',
    'fetch_nordpool_elpris',
    'fetch_socialstyrelsen_data',
    'fetch_folkhalsomyndigheten_data',
    'fetch_lantmateriet_data',
    'fetch_bolagsverket_data',
    'fetch_migrationsverket_data',
    'fetch_forsakringskassan_data',
    'fetch_riksarkivet_data',
    'fetch_kungliga_biblioteket_data',
    'fetch_csn_data',
    'fetch_naturvardsverket_data',
    'fetch_luftkvalitet_smhi',
    'fetch_hemnet_data',
    'fetch_vinnova_data',
    'fetch_open_data',
    
    # Browse functionality
    'browse_page',
]
