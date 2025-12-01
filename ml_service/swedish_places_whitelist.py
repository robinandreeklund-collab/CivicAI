"""
Swedish Places Whitelist for ONESEEK Δ+
Vitlista för svenska städer och regioner som ALDRIG ska korrigeras

Laddar alla städer från config/swedish_cities.json
och regioner från config/swedish_regions.json

Author: ONESEEK Team
"""

import json
from pathlib import Path
from typing import Set

# Sökvägar till konfigurationsfiler
CONFIG_DIR = Path(__file__).parent.parent / "config"
CITIES_FILE = CONFIG_DIR / "swedish_cities.json"
REGIONS_FILE = CONFIG_DIR / "swedish_regions.json"

# Global vitlista för svenska platser
SWEDISH_PLACES: Set[str] = set()


def _load_swedish_places() -> Set[str]:
    """Ladda alla svenska städer och regioner till vitlistan."""
    places = set()
    
    # Ladda städer
    if CITIES_FILE.exists():
        try:
            with open(CITIES_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                cities = data.get("cities", {})
                for city in cities.keys():
                    # Lägg till i lowercase och med stor bokstav
                    places.add(city.lower())
                    places.add(city.capitalize())
                    # Hantera städer med ÅÄÖ
                    if any(c in city.lower() for c in 'åäö'):
                        places.add(city.lower())
                        places.add(city.title())
                print(f"🏙️ [WHITELIST] Loaded {len(cities)} Swedish cities")
        except Exception as e:
            print(f"⚠️ [WHITELIST] Could not load cities: {e}")
    
    # Ladda regioner
    if REGIONS_FILE.exists():
        try:
            with open(REGIONS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                regions = data.get("regions", {})
                for region_key, region_value in regions.items():
                    # Lägg till nyckeln (t.ex. "västra götaland")
                    places.add(region_key.lower())
                    places.add(region_key.capitalize())
                    places.add(region_key.title())
                    # Lägg till värdet (t.ex. "Västra Götaland")
                    if isinstance(region_value, str):
                        places.add(region_value.lower())
                        places.add(region_value)
                        # Lägg till individuella ord i regionsnamn
                        for word in region_value.split():
                            places.add(word.lower())
                            places.add(word)
                print(f"🗺️ [WHITELIST] Loaded {len(regions)} Swedish regions")
        except Exception as e:
            print(f"⚠️ [WHITELIST] Could not load regions: {e}")
    
    return places


# Vanliga svenska ord som aldrig ska korrigeras
COMMON_SWEDISH_WORDS = {
    "bor", "i", "på", "av", "och", "att", "det", "med", "för", "den", "som",
    "är", "var", "har", "hur", "vad", "när", "vem", "de", "du", "han", "hon",
    "vi", "ni", "jag", "sig", "sin", "om", "till", "kan", "ska", "vill",
    "ett", "en", "min", "din", "sin", "hans", "hennes", "deras", "våra",
    "hej", "tack", "ja", "nej", "inte", "nu", "då", "här", "där", "var",
    "idag", "igår", "imorgon", "väder", "vädret", "befolkning", "invånare",
}

# Initiera vitlistan vid import
SWEDISH_PLACES = _load_swedish_places()

# Slutgiltig vitlista: platser + vanliga ord
WHITELIST = SWEDISH_PLACES.union(COMMON_SWEDISH_WORDS)


def is_whitelisted(word: str) -> bool:
    """
    Kontrollera om ett ord är vitlistat (ska inte korrigeras).
    
    Args:
        word: Ordet att kontrollera
        
    Returns:
        True om ordet är vitlistat
    """
    # Rensa bort skiljetecken
    clean = word.strip(".,!?;:\"'()[]{}").lower()
    return clean in WHITELIST


def get_whitelist_stats() -> dict:
    """Hämta statistik om vitlistan."""
    return {
        "total_entries": len(WHITELIST),
        "places": len(SWEDISH_PLACES),
        "common_words": len(COMMON_SWEDISH_WORDS),
    }


def add_to_whitelist(word: str) -> bool:
    """
    Lägg till ett ord i vitlistan (temporärt, endast i minnet).
    
    Args:
        word: Ordet att lägga till
        
    Returns:
        True om ordet lades till
    """
    global WHITELIST
    WHITELIST.add(word.lower())
    WHITELIST.add(word.capitalize())
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("Swedish Places Whitelist")
    print("=" * 60)
    
    stats = get_whitelist_stats()
    print(f"\nStatistics:")
    print(f"  Total entries: {stats['total_entries']}")
    print(f"  Swedish places: {stats['places']}")
    print(f"  Common words: {stats['common_words']}")
    
    print(f"\nSample places:")
    sample = list(SWEDISH_PLACES)[:20]
    for place in sample:
        print(f"  - {place}")
    
    print(f"\nTest whitelisting:")
    test_words = ["Hjo", "hjo", "Stockholm", "göteborg", "Västra Götaland", "xyz123"]
    for word in test_words:
        result = is_whitelisted(word)
        print(f"  '{word}': {'✅ Whitelisted' if result else '❌ Not whitelisted'}")
