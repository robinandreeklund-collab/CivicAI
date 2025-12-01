"""
Weather Cache Script for ONESEEK Δ+
Cron-script för att hämta väder var 15:e minut för alla svenska kommuner.
Sparar till cache/weather.json

Usage:
    python cache/weather_cache.py  # Kör en gång
    # Konfigureras sedan som cron-jobb var 15:e minut:
    # */15 * * * * python /path/to/cache/weather_cache.py

Author: ONESEEK Team
"""

import json
import os
import requests
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any

# Cache location
CACHE_DIR = Path(__file__).parent
WEATHER_CACHE_FILE = CACHE_DIR / "weather.json"

# Swedish municipalities with coordinates (subset of 290+ kommuner)
# Format: {"kommun_name": {"lat": float, "lon": float}}
SWEDISH_MUNICIPALITIES_FILE = Path(__file__).parent.parent / "config" / "swedish_cities.json"


def load_municipalities() -> Dict[str, Dict[str, float]]:
    """
    Ladda svenska kommuner och deras koordinater från config.
    
    Returns:
        Dict med kommunnamn som nyckel och koordinater som värde
    """
    if SWEDISH_MUNICIPALITIES_FILE.exists():
        try:
            with open(SWEDISH_MUNICIPALITIES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("cities", {})
        except (json.JSONDecodeError, KeyError):
            pass
    
    # Fallback: default kommuner
    return {
        "stockholm": {"lon": 18.07, "lat": 59.33},
        "göteborg": {"lon": 11.97, "lat": 57.71},
        "malmö": {"lon": 13.00, "lat": 55.61},
        "uppsala": {"lon": 17.64, "lat": 59.86},
        "linköping": {"lon": 15.62, "lat": 58.41},
        "västerås": {"lon": 16.54, "lat": 59.62},
        "örebro": {"lon": 15.21, "lat": 59.27},
        "helsingborg": {"lon": 12.69, "lat": 56.05},
        "norrköping": {"lon": 16.18, "lat": 58.59},
        "jönköping": {"lon": 14.16, "lat": 57.78},
        "lund": {"lon": 13.19, "lat": 55.70},
        "umeå": {"lon": 20.26, "lat": 63.83},
        "gävle": {"lon": 17.14, "lat": 60.67},
        "borås": {"lon": 12.94, "lat": 57.72},
        "eskilstuna": {"lon": 16.51, "lat": 59.37},
        "södertälje": {"lon": 17.63, "lat": 59.20},
        "karlstad": {"lon": 13.50, "lat": 59.40},
        "täby": {"lon": 18.07, "lat": 59.44},
        "växjö": {"lon": 14.81, "lat": 56.88},
        "halmstad": {"lon": 12.86, "lat": 56.67},
        "sundsvall": {"lon": 17.31, "lat": 62.39},
        "luleå": {"lon": 22.16, "lat": 65.58},
        "trollhättan": {"lon": 12.29, "lat": 58.28},
        "östersund": {"lon": 14.64, "lat": 63.18},
        "borlänge": {"lon": 15.44, "lat": 60.49},
        "falun": {"lon": 15.63, "lat": 60.61},
        "kalmar": {"lon": 16.36, "lat": 56.66},
        "kristianstad": {"lon": 14.16, "lat": 56.03},
        "skövde": {"lon": 13.85, "lat": 58.39},
        "karlskrona": {"lon": 15.59, "lat": 56.16},
    }


def fetch_smhi_weather(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """
    Hämta väderprognos från SMHI för given koordinat.
    
    Args:
        lat: Latitud
        lon: Longitud
        
    Returns:
        Väderdata eller None vid fel
    """
    try:
        url = f"https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/{lon}/lat/{lat}/data.json"
        response = requests.get(url, timeout=10)
        
        if response.status_code != 200:
            return None
        
        data = response.json()
        
        if "timeSeries" not in data or len(data["timeSeries"]) < 2:
            return None
        
        # Hämta nästa timmes prognos
        forecast = data["timeSeries"][1]["parameters"]
        
        result = {
            "valid_time": data["timeSeries"][1].get("validTime", ""),
            "parameters": {}
        }
        
        for param in forecast:
            name = param["name"]
            values = param["values"]
            if values:
                result["parameters"][name] = values[0]
        
        return result
        
    except Exception as e:
        print(f"[WEATHER-CACHE] Error fetching SMHI data: {e}")
        return None


def parse_weather_data(weather: Dict[str, Any]) -> Dict[str, Any]:
    """
    Tolka SMHI-parametrar till läsbar form.
    
    Args:
        weather: Rådata från SMHI
        
    Returns:
        Formaterad väderdata
    """
    params = weather.get("parameters", {})
    
    # Nederbördskategori beskrivningar
    pcat_texts = [
        "ingen nederbörd",
        "snö",
        "snö och regn",
        "regn",
        "duggregn",
        "fryst duggregn",
        "fryst regn"
    ]
    
    pcat = int(params.get("pcat", 0))
    pcat_text = pcat_texts[pcat] if 0 <= pcat < len(pcat_texts) else "okänd"
    
    return {
        "temperature": params.get("t"),  # Temperatur (°C)
        "wind_speed": params.get("ws"),  # Vindhastighet (m/s)
        "wind_direction": params.get("wd"),  # Vindriktning (°)
        "humidity": params.get("r"),  # Relativ luftfuktighet (%)
        "precipitation_category": pcat,
        "precipitation_text": pcat_text,
        "cloud_cover": params.get("tcc_mean"),  # Molnighet (0-8)
        "visibility": params.get("vis"),  # Sikt (km)
        "pressure": params.get("msl"),  # Lufttryck (hPa)
        "valid_time": weather.get("valid_time", "")
    }


def compute_cache_hash(data: Dict[str, Any]) -> str:
    """
    Beräkna SHA-256 hash för cachedata (blockchain-liknande verifiering).
    
    Args:
        data: Data att hasha
        
    Returns:
        SHA-256 hash som hex-sträng
    """
    json_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(json_str.encode('utf-8')).hexdigest()


def update_weather_cache() -> Dict[str, Any]:
    """
    Uppdatera väder-cache för alla svenska kommuner.
    
    Returns:
        Dict med uppdaterad cache-data
    """
    municipalities = load_municipalities()
    
    cache_data = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "municipalities": {},
        "metadata": {
            "source": "SMHI Open Data",
            "refresh_interval_minutes": 15,
            "total_municipalities": len(municipalities)
        }
    }
    
    success_count = 0
    error_count = 0
    
    print(f"[WEATHER-CACHE] Updating cache for {len(municipalities)} municipalities...")
    
    for name, coords in municipalities.items():
        try:
            raw_weather = fetch_smhi_weather(coords["lat"], coords["lon"])
            
            if raw_weather:
                parsed = parse_weather_data(raw_weather)
                cache_data["municipalities"][name] = {
                    "coordinates": coords,
                    "weather": parsed,
                    "fetched_at": datetime.now(timezone.utc).isoformat()
                }
                success_count += 1
            else:
                error_count += 1
                print(f"[WEATHER-CACHE] Failed to fetch: {name}")
                
        except Exception as e:
            error_count += 1
            print(f"[WEATHER-CACHE] Error for {name}: {e}")
    
    # Beräkna blockchain-hash för integritetskontroll
    cache_data["integrity_hash"] = compute_cache_hash(cache_data["municipalities"])
    cache_data["metadata"]["success_count"] = success_count
    cache_data["metadata"]["error_count"] = error_count
    
    print(f"[WEATHER-CACHE] Complete: {success_count} OK, {error_count} errors")
    
    return cache_data


def save_cache(data: Dict[str, Any]) -> bool:
    """
    Spara cache till JSON-fil.
    
    Args:
        data: Cache-data att spara
        
    Returns:
        True om sparning lyckades
    """
    try:
        # Skapa backup av befintlig cache
        if WEATHER_CACHE_FILE.exists():
            backup_file = CACHE_DIR / "weather.json.bak"
            import shutil
            shutil.copy(WEATHER_CACHE_FILE, backup_file)
        
        with open(WEATHER_CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"[WEATHER-CACHE] Saved to {WEATHER_CACHE_FILE}")
        return True
        
    except Exception as e:
        print(f"[WEATHER-CACHE] Error saving cache: {e}")
        return False


def load_cache() -> Optional[Dict[str, Any]]:
    """
    Ladda befintlig cache från fil.
    
    Returns:
        Cache-data eller None om fil saknas
    """
    if not WEATHER_CACHE_FILE.exists():
        return None
    
    try:
        with open(WEATHER_CACHE_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[WEATHER-CACHE] Error loading cache: {e}")
        return None


def get_weather_for_municipality(name: str) -> Optional[Dict[str, Any]]:
    """
    Hämta väder för en specifik kommun från cache.
    
    Args:
        name: Kommunnamn (case-insensitive)
        
    Returns:
        Väderdata eller None om ej i cache
    """
    cache = load_cache()
    if not cache:
        return None
    
    municipalities = cache.get("municipalities", {})
    return municipalities.get(name.lower())


def verify_cache_integrity(cache: Dict[str, Any]) -> bool:
    """
    Verifiera cache-integritet med blockchain-hash.
    
    Args:
        cache: Cache-data att verifiera
        
    Returns:
        True om hash matchar
    """
    stored_hash = cache.get("integrity_hash", "")
    computed_hash = compute_cache_hash(cache.get("municipalities", {}))
    return stored_hash == computed_hash


if __name__ == "__main__":
    import sys
    
    print("=" * 60)
    print("ONESEEK Δ+ Weather Cache Updater")
    print("=" * 60)
    
    # Uppdatera och spara cache
    cache_data = update_weather_cache()
    
    if save_cache(cache_data):
        print(f"\n✓ Cache uppdaterad: {cache_data['metadata']['success_count']} kommuner")
        print(f"✓ Integrity hash: {cache_data['integrity_hash'][:16]}...")
        sys.exit(0)
    else:
        print("\n✗ Kunde inte spara cache")
        sys.exit(1)
