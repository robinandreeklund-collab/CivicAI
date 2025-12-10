"""
SMHI Öppna Data API Module
==========================

Komplett implementation av SMHI:s öppna API:er för väderdata.
Referens: https://opendata.smhi.se/apidocs/

Features:
- Punktprognoser (9 dagar)
- Analys (nuläge)
- Observationer
- Vädervarningar  
- Nederbördsradar
- Klimatdata

Author: CivicAI
Version: 1.0.0
Updated: 2025-12-10
"""

import requests
import json
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from pathlib import Path

logger = logging.getLogger(__name__)


class SMHIClient:
    """
    Client för SMHI Öppna Data API.
    
    Alla API:er är gratis och kräver ingen API-nyckel.
    Attribution: © SMHI (CC BY 4.0)
    """
    
    # Base URLs för olika API-kategorier
    FORECAST_BASE = "https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2"
    ANALYSIS_BASE = "https://opendata-download-metanalys.smhi.se/api/category/mesan2g/version/1"
    OBS_BASE = "https://opendata-download-metobs.smhi.se/api/version/latest"
    WARNINGS_BASE = "https://opendata-download-warnings.smhi.se/api/version/2"
    RADAR_BASE = "https://opendata-download-radar.smhi.se/api/version/latest"
    
    # Nederbördskategorier (pcat)
    PRECIPITATION_CATEGORIES = {
        0: "ingen nederbörd",
        1: "snö",
        2: "snö och regn",
        3: "regn",
        4: "duggregn",
        5: "fryst duggregn",
        6: "fryst regn"
    }
    
    # Observationsparametrar
    OBS_PARAMETERS = {
        1: "Lufttemperatur",
        2: "Lufttemperatur (min 1 dygn)",
        3: "Lufttemperatur (max 1 dygn)",
        4: "Vindhastighet",
        5: "Vindriktning",
        6: "Relativ luftfuktighet",
        7: "Nederbörd",
        39: "Lufttryck"
    }
    
    def __init__(self, timeout: int = 10):
        """
        Initiera SMHI-klient.
        
        Args:
            timeout: Timeout för HTTP-anrop i sekunder
        """
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'CivicAI/1.0 (SMHI Öppna Data Client)',
            'Accept': 'application/json'
        })
    
    def get_forecast(self, lon: float, lat: float, days_ahead: int = 1) -> Dict[str, Any]:
        """
        Hämta punktprognos för en specifik plats.
        
        Args:
            lon: Longitud (WGS84)
            lat: Latitud (WGS84)
            days_ahead: Antal dagar framåt (0 = idag, 1 = imorgon, etc.)
            
        Returns:
            Dict med väderprognos
        """
        try:
            url = f"{self.FORECAST_BASE}/geotype/point/lon/{lon}/lat/{lat}/data.json"
            logger.info(f"[SMHI] Hämtar prognos för lon={lon}, lat={lat}")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            # Hitta prognos för rätt tid
            target_time = datetime.now() + timedelta(days=days_ahead)
            
            # Extrahera timeseries
            timeseries = data.get('timeSeries', [])
            if not timeseries:
                return {"error": "Ingen prognosdata tillgänglig"}
            
            # Hitta närmaste tidpunkt
            forecast = self._find_closest_forecast(timeseries, target_time)
            
            if not forecast:
                return {"error": "Kunde inte hitta prognos för angiven tid"}
            
            # Parse väderdata
            weather_data = self._parse_forecast_parameters(forecast)
            
            return {
                "success": True,
                "location": {"lon": lon, "lat": lat},
                "valid_time": forecast.get('validTime'),
                "data": weather_data,
                "source": "SMHI Punktprognos",
                "attribution": "© SMHI (CC BY 4.0)"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[SMHI] API-fel: {e}")
            return {"error": f"Kunde inte hämta data från SMHI: {str(e)}"}
        except Exception as e:
            logger.error(f"[SMHI] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av SMHI-data: {str(e)}"}
    
    def get_current_weather(self, lon: float, lat: float) -> Dict[str, Any]:
        """
        Hämta aktuellt väder (analys/nuläge).
        
        Args:
            lon: Longitud (WGS84)
            lat: Latitud (WGS84)
            
        Returns:
            Dict med aktuellt väder
        """
        try:
            url = f"{self.ANALYSIS_BASE}/geotype/point/lon/{lon}/lat/{lat}/data.json"
            logger.info(f"[SMHI] Hämtar aktuellt väder för lon={lon}, lat={lat}")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            # Extrahera senaste analysen
            timeseries = data.get('timeSeries', [])
            if not timeseries:
                return {"error": "Ingen analysdata tillgänglig"}
            
            latest = timeseries[-1]  # Senaste tidpunkten
            weather_data = self._parse_forecast_parameters(latest)
            
            return {
                "success": True,
                "location": {"lon": lon, "lat": lat},
                "valid_time": latest.get('validTime'),
                "data": weather_data,
                "source": "SMHI Analys (MESAN)",
                "attribution": "© SMHI (CC BY 4.0)"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[SMHI] API-fel: {e}")
            return {"error": f"Kunde inte hämta data från SMHI: {str(e)}"}
        except Exception as e:
            logger.error(f"[SMHI] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av SMHI-data: {str(e)}"}
    
    def get_warnings(self) -> Dict[str, Any]:
        """
        Hämta aktuella vädervarningar för Sverige.
        
        Returns:
            Dict med vädervarningar
        """
        try:
            url = f"{self.WARNINGS_BASE}/warnings.json"
            logger.info("[SMHI] Hämtar vädervarningar")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            warnings = []
            for alert in data.get('alert', []):
                info = alert.get('info', [{}])[0]
                warnings.append({
                    "event": info.get('event'),
                    "headline": info.get('headline'),
                    "description": info.get('description'),
                    "severity": info.get('severity'),
                    "certainty": info.get('certainty'),
                    "area": info.get('area', {}).get('areaDesc')
                })
            
            return {
                "success": True,
                "count": len(warnings),
                "warnings": warnings,
                "source": "SMHI Vädervarningar",
                "attribution": "© SMHI (CC BY 4.0)"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[SMHI] API-fel: {e}")
            return {"error": f"Kunde inte hämta varningar från SMHI: {str(e)}"}
        except Exception as e:
            logger.error(f"[SMHI] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av SMHI-varningar: {str(e)}"}
    
    def get_latest_observations(self, parameter: int = 1, limit: int = 10) -> Dict[str, Any]:
        """
        Hämta senaste observationerna från SMHI:s stationer.
        
        Args:
            parameter: Parameter-ID (1 = temperatur, 7 = nederbörd, etc.)
            limit: Max antal stationer att returnera
            
        Returns:
            Dict med observationsdata
        """
        try:
            url = f"{self.OBS_BASE}/parameter/{parameter}/station-set/all/period/latest-hour/data.json"
            logger.info(f"[SMHI] Hämtar observationer för parameter {parameter}")
            
            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()
            data = response.json()
            
            stations = []
            for station in data.get('station', [])[:limit]:
                latest_value = station.get('value', [{}])[-1] if station.get('value') else {}
                stations.append({
                    "name": station.get('name'),
                    "key": station.get('key'),
                    "value": latest_value.get('value'),
                    "date": latest_value.get('date'),
                    "time": latest_value.get('time')
                })
            
            return {
                "success": True,
                "parameter": self.OBS_PARAMETERS.get(parameter, "Okänd parameter"),
                "count": len(stations),
                "stations": stations,
                "source": "SMHI Observationer",
                "attribution": "© SMHI (CC BY 4.0)"
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"[SMHI] API-fel: {e}")
            return {"error": f"Kunde inte hämta observationer från SMHI: {str(e)}"}
        except Exception as e:
            logger.error(f"[SMHI] Oväntat fel: {e}")
            return {"error": f"Internt fel vid bearbetning av SMHI-observationer: {str(e)}"}
    
    def format_weather_response(self, weather_data: Dict[str, Any], city_name: str = "platsen", 
                               time_desc: str = "") -> str:
        """
        Formatera väderdata till läsbar svensk text.
        
        Args:
            weather_data: Dict med väderdata från get_forecast() eller get_current_weather()
            city_name: Namn på staden/platsen
            time_desc: Tidsbeskrivning (t.ex. "imorgon", "nu")
            
        Returns:
            Formaterad textsträng
        """
        if not weather_data.get('success'):
            return weather_data.get('error', 'Okänt fel vid hämtning av väderdata')
        
        data = weather_data.get('data', {})
        
        temp = data.get('temperature')
        precip_cat = data.get('precipitation_category')
        precip_desc = self.PRECIPITATION_CATEGORIES.get(precip_cat, "")
        wind_speed = data.get('wind_speed')
        humidity = data.get('humidity')
        
        # Bygg textsvaret
        parts = []
        
        if temp is not None:
            temp_str = f"ca {round(temp)}°C"
        else:
            temp_str = "temperatur okänd"
        
        if time_desc:
            parts.append(f"I {city_name} {time_desc}: {temp_str}")
        else:
            parts.append(f"I {city_name}: {temp_str}")
        
        if precip_desc:
            parts.append(f"och {precip_desc}")
        
        details = []
        if wind_speed is not None:
            details.append(f"vind {round(wind_speed)} m/s")
        if humidity is not None:
            details.append(f"luftfuktighet {round(humidity)}%")
        
        if details:
            parts.append(f"({', '.join(details)})")
        
        result = " ".join(parts) + "."
        
        # Lägg till källa
        source = weather_data.get('source', 'SMHI')
        result += f"\n\n**Källa**: {source}"
        
        return result
    
    def _find_closest_forecast(self, timeseries: List[Dict], target_time: datetime) -> Optional[Dict]:
        """
        Hitta prognosen närmast angiven tid.
        
        Args:
            timeseries: Lista med prognoser
            target_time: Målti dpunkt
            
        Returns:
            Prognos-dict eller None
        """
        closest = None
        min_diff = None
        
        for forecast in timeseries:
            valid_time_str = forecast.get('validTime')
            if not valid_time_str:
                continue
            
            try:
                # Parse ISO 8601 format
                valid_time = datetime.fromisoformat(valid_time_str.replace('Z', '+00:00'))
                diff = abs((valid_time - target_time).total_seconds())
                
                if min_diff is None or diff < min_diff:
                    min_diff = diff
                    closest = forecast
            except Exception as e:
                logger.debug(f"[SMHI] Kunde inte parse tid: {valid_time_str} - {e}")
                continue
        
        return closest
    
    def _parse_forecast_parameters(self, forecast: Dict) -> Dict[str, Any]:
        """
        Parse parametrar från SMHI-prognos.
        
        Args:
            forecast: Prognos-dict från SMHI
            
        Returns:
            Dict med extraherade parametrar
        """
        params = {}
        
        for param in forecast.get('parameters', []):
            name = param.get('name')
            values = param.get('values', [])
            
            if not values:
                continue
            
            value = values[0]
            
            # Mappa parametrar
            if name == 't':  # Temperatur
                params['temperature'] = value
            elif name == 'pcat':  # Nederbördskategori
                params['precipitation_category'] = int(value)
            elif name == 'ws':  # Vindhastighet
                params['wind_speed'] = value
            elif name == 'wd':  # Vindriktning
                params['wind_direction'] = value
            elif name == 'r':  # Relativ luftfuktighet
                params['humidity'] = value
            elif name == 'pmean':  # Nederbörd (mm/h)
                params['precipitation'] = value
            elif name == 'tcc_mean':  # Molnighet (0-8)
                params['cloud_cover'] = value
            elif name == 'vis':  # Sikt (km)
                params['visibility'] = value
        
        return params


def load_swedish_cities() -> Dict[str, Dict[str, float]]:
    """
    Ladda svenska städer med koordinater från config.
    
    Returns:
        Dict med städer och deras koordinater
    """
    config_path = Path(__file__).parent.parent / 'config' / 'swedish_cities.json'
    
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('cities', {})
    except Exception as e:
        logger.error(f"[SMHI] Kunde inte ladda städer: {e}")
        # Fallback till några vanliga städer
        return {
            "stockholm": {"lon": 18.07, "lat": 59.33},
            "göteborg": {"lon": 11.97, "lat": 57.71},
            "malmö": {"lon": 13.00, "lat": 55.61},
            "uppsala": {"lon": 17.64, "lat": 59.86}
        }


def extract_city_from_query(query: str) -> Tuple[Optional[str], Optional[Dict[str, float]]]:
    """
    Extrahera stadsnamn och koordinater från användarfråga.
    
    Args:
        query: Användarens fråga
        
    Returns:
        Tuple med (stadsnamn, koordinater) eller (None, None)
    """
    cities = load_swedish_cities()
    query_lower = query.lower()
    
    for city_name, coords in cities.items():
        if city_name in query_lower:
            return city_name.capitalize(), coords
    
    return None, None


# Exempel på användning
if __name__ == "__main__":
    # Konfigurera logging
    logging.basicConfig(level=logging.INFO)
    
    # Skapa client
    client = SMHIClient()
    
    # Test 1: Hämta prognos för Stockholm imorgon
    print("=== Test 1: Prognos för Stockholm imorgon ===")
    forecast = client.get_forecast(lon=18.07, lat=59.33, days_ahead=1)
    if forecast.get('success'):
        response_text = client.format_weather_response(forecast, "Stockholm", "imorgon")
        print(response_text)
    else:
        print(f"Fel: {forecast.get('error')}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 2: Aktuellt väder i Göteborg
    print("=== Test 2: Aktuellt väder i Göteborg ===")
    current = client.get_current_weather(lon=11.97, lat=57.71)
    if current.get('success'):
        response_text = client.format_weather_response(current, "Göteborg", "just nu")
        print(response_text)
    else:
        print(f"Fel: {current.get('error')}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 3: Vädervarningar
    print("=== Test 3: Vädervarningar ===")
    warnings = client.get_warnings()
    if warnings.get('success'):
        if warnings['count'] > 0:
            print(f"Aktiva varningar: {warnings['count']}")
            for w in warnings['warnings'][:3]:
                print(f"- {w['headline']} ({w['area']})")
        else:
            print("Inga aktiva vädervarningar")
    else:
        print(f"Fel: {warnings.get('error')}")
    
    print("\n" + "="*50 + "\n")
    
    # Test 4: Extrahera stad från fråga
    print("=== Test 4: Extrahera stad från fråga ===")
    test_queries = [
        "Hur blir vädret i Malmö imorgon?",
        "Regnar det i Uppsala just nu?",
        "Temperatur i Stockholm"
    ]
    
    for query in test_queries:
        city, coords = extract_city_from_query(query)
        if city and coords:
            print(f"Fråga: '{query}'")
            print(f"→ Hittade stad: {city} (lon={coords['lon']}, lat={coords['lat']})")
        else:
            print(f"Fråga: '{query}'")
            print(f"→ Ingen stad hittad")
