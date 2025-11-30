"""
Intent Engine for ONESEEK Δ+
Admin-styrbar semantisk Intent + Entity Engine med spaCy + sv_core_news_lg

Funktionalitet:
- Semantisk analys av användarfrågor
- Intent-klassificering (befolkning, väder, nyheter, etc.)
- Entity-extraktion (städer, datum, organisationer)
- Admin-konfigurerbar via intent_rules.json

Author: ONESEEK Team
"""

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict

# Try to import spaCy (optional dependency)
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    spacy = None

# Configuration paths
CONFIG_DIR = Path(__file__).parent.parent / "config"
INTENT_RULES_FILE = Path(__file__).parent / "intent_rules.json"


@dataclass
class Intent:
    """Representerar en klassificerad intent."""
    name: str
    confidence: float
    triggers: List[str]
    entities: Dict[str, Any]
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass 
class Entity:
    """Representerar en extraherad entitet."""
    text: str
    label: str
    start: int
    end: int
    confidence: float
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class IntentEngine:
    """
    Admin-styrbar Intent Engine för ONESEEK Δ+.
    
    Kombinerar:
    - Regelbaserad matching via intent_rules.json
    - spaCy NER för entity-extraktion (om tillgänglig)
    - Semantisk analys för intent-klassificering
    """
    
    def __init__(self, rules_file: Optional[Path] = None):
        """
        Initialisera Intent Engine.
        
        Args:
            rules_file: Sökväg till intent_rules.json
        """
        self.rules_file = rules_file or INTENT_RULES_FILE
        self.rules = self._load_rules()
        self.nlp = self._load_spacy()
        
    def _load_rules(self) -> Dict[str, Any]:
        """Ladda intent-regler från JSON-fil."""
        if self.rules_file.exists():
            try:
                with open(self.rules_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"[INTENT-ENGINE] Warning: Could not load rules: {e}")
        
        # Default rules
        return self._get_default_rules()
    
    def _get_default_rules(self) -> Dict[str, Any]:
        """Returnera default intent-regler med keywords-format (ONESEEK Δ+)."""
        return {
            "intents": {
                "befolkning": {
                    "keywords": ["befolkning", "invånare", "hur många bor", "invånarantal", "population", "folkmängd"],
                    "entities": ["LOC", "GPE"],
                    "api": "scb_population",
                    "weight": 1.0,
                    "priority": 1
                },
                "väder": {
                    "keywords": ["väder", "vädret", "temperatur", "regnar", "snöar", "soligt", "grader", "prognos", "blir det"],
                    "entities": ["LOC", "GPE", "DATE"],
                    "api": "weather_cache",
                    "weight": 0.95,
                    "priority": 1
                },
                "nyheter": {
                    "keywords": ["nyheter", "senaste nytt", "vad hände", "aktuellt", "händelser"],
                    "entities": ["DATE", "ORG", "EVENT"],
                    "api": "rss_feeds",
                    "weight": 0.9,
                    "priority": 2
                },
                "politik": {
                    "keywords": ["riksdag", "regering", "minister", "parti", "rösta", "val", "politik"],
                    "entities": ["PERSON", "ORG", "GPE"],
                    "api": "riksdagen",
                    "weight": 0.95,
                    "priority": 2
                },
                "statistik": {
                    "keywords": ["statistik", "scb", "procent", "andel", "antal", "ökning", "minskning"],
                    "entities": ["LOC", "DATE", "PERCENT"],
                    "api": "scb_statistics",
                    "weight": 0.95,
                    "priority": 2
                },
                "kris": {
                    "keywords": ["kris", "krislarm", "vma", "varning", "nödläge", "beredskap"],
                    "entities": ["LOC", "EVENT", "DATE"],
                    "api": "krisinformation",
                    "weight": 1.0,
                    "priority": 0  # Highest priority
                },
                "trafik": {
                    "keywords": ["trafik", "trafikinfo", "olycka", "kö", "väg", "e4", "e6", "motorväg"],
                    "entities": ["LOC", "FAC"],
                    "api": "trafikverket",
                    "weight": 0.9,
                    "priority": 2
                },
                "hälsa": {
                    "keywords": ["hälsa", "sjukvård", "vårdcentral", "sjukhus", "läkare", "vaccination"],
                    "entities": ["LOC", "ORG"],
                    "api": "1177",
                    "weight": 0.95,
                    "priority": 2
                },
                "identitet": {
                    "keywords": ["vem är du", "vad heter du", "vad är du", "berätta om dig", "oneseek"],
                    "entities": [],
                    "api": None,
                    "weight": 1.0,
                    "priority": 0,
                    "blacklist": True
                }
            },
            "entity_patterns": {
                "swedish_cities": [
                    "stockholm", "göteborg", "malmö", "uppsala", "linköping",
                    "västerås", "örebro", "helsingborg", "norrköping", "jönköping"
                ],
                "date_patterns": [
                    r"\d{4}-\d{2}-\d{2}",
                    "idag", "imorgon", "igår",
                    "nästa vecka", "förra veckan"
                ]
            },
            "metadata": {
                "version": "2.0.0",
                "language": "sv",
                "last_updated": None,
                "description": "ONESEEK Δ+ Intent Engine - ersätter gamla triggers"
            }
        }
    
    def _load_spacy(self):
        """Ladda spaCy modell om tillgänglig."""
        if not SPACY_AVAILABLE:
            print("[INTENT-ENGINE] spaCy not available, using rule-based matching only")
            return None
        
        try:
            # Försök ladda svenska modellen
            nlp = spacy.load("sv_core_news_lg")
            print("[INTENT-ENGINE] ✓ spaCy sv_core_news_lg loaded")
            return nlp
        except OSError:
            try:
                # Fallback till mindre modell
                nlp = spacy.load("sv_core_news_sm")
                print("[INTENT-ENGINE] ✓ spaCy sv_core_news_sm loaded (fallback)")
                return nlp
            except OSError:
                print("[INTENT-ENGINE] Warning: No Swedish spaCy model found")
                print("  Install with: python -m spacy download sv_core_news_lg")
                return None
    
    def reload_rules(self) -> bool:
        """
        Ladda om regler från fil (hot-reload för admin).
        
        Returns:
            True om laddning lyckades
        """
        try:
            self.rules = self._load_rules()
            return True
        except Exception as e:
            print(f"[INTENT-ENGINE] Error reloading rules: {e}")
            return False
    
    def extract_entities(self, text: str) -> List[Entity]:
        """
        Extrahera entiteter från text.
        
        Args:
            text: Användarinput
            
        Returns:
            Lista av extraherade entiteter
        """
        entities = []
        text_lower = text.lower()
        
        # spaCy NER om tillgänglig
        if self.nlp:
            doc = self.nlp(text)
            for ent in doc.ents:
                entities.append(Entity(
                    text=ent.text,
                    label=ent.label_,
                    start=ent.start_char,
                    end=ent.end_char,
                    confidence=0.9  # spaCy doesn't provide confidence, assume high
                ))
        
        # Regelbaserad entity-extraktion
        patterns = self.rules.get("entity_patterns", {})
        
        # Svenska städer
        for city in patterns.get("swedish_cities", []):
            if city in text_lower:
                idx = text_lower.find(city)
                entities.append(Entity(
                    text=city.capitalize(),
                    label="GPE",
                    start=idx,
                    end=idx + len(city),
                    confidence=0.95
                ))
        
        # Datum-mönster
        for pattern in patterns.get("date_patterns", []):
            for match in re.finditer(pattern, text_lower):
                entities.append(Entity(
                    text=match.group(),
                    label="DATE",
                    start=match.start(),
                    end=match.end(),
                    confidence=0.9
                ))
        
        return entities
    
    def classify_intent(self, text: str) -> Intent:
        """
        Klassificera intent från användartext.
        
        Args:
            text: Användarinput
            
        Returns:
            Klassificerad Intent
        """
        text_lower = text.lower()
        intents = self.rules.get("intents", {})
        
        best_intent = None
        best_score = 0.0
        best_keywords = []
        
        for intent_name, intent_config in intents.items():
            # Support both 'keywords' (new format) and 'triggers' (legacy)
            keywords = intent_config.get("keywords", intent_config.get("triggers", []))
            priority = intent_config.get("priority", 5)
            weight = intent_config.get("weight", 1.0)
            
            # Räkna matchande keywords
            matched_keywords = []
            for keyword in keywords:
                if keyword in text_lower:
                    matched_keywords.append(keyword)
            
            if matched_keywords:
                # Score baserat på antal träffar, prioritet och vikt
                match_score = len(matched_keywords) / len(keywords)
                priority_bonus = (10 - priority) / 10  # Högre prioritet = högre bonus
                score = (match_score * 0.6 + priority_bonus * 0.2) * weight
                
                if score > best_score:
                    best_score = score
                    best_intent = intent_name
                    best_keywords = matched_keywords
        
        # Extrahera entiteter
        entities = self.extract_entities(text)
        entity_dict = {}
        for ent in entities:
            if ent.label not in entity_dict:
                entity_dict[ent.label] = []
            entity_dict[ent.label].append(ent.to_dict())
        
        if best_intent:
            return Intent(
                name=best_intent,
                confidence=min(best_score, 0.99),
                triggers=best_keywords,
                entities=entity_dict
            )
        
        # Fallback: generell fråga
        return Intent(
            name="general",
            confidence=0.5,
            triggers=[],
            entities=entity_dict
        )
    
    def process(self, text: str) -> Dict[str, Any]:
        """
        Fullständig processering av användarinput.
        
        Args:
            text: Användarinput
            
        Returns:
            Dict med intent, entities och metadata
        """
        intent = self.classify_intent(text)
        entities = self.extract_entities(text)
        
        return {
            "input": text,
            "intent": intent.to_dict(),
            "entities": [e.to_dict() for e in entities],
            "language": "sv",
            "engine_version": self.rules.get("metadata", {}).get("version", "1.0.0")
        }
    
    def get_intent_for_api(self, intent_name: str) -> Optional[Dict[str, Any]]:
        """
        Hämta API-konfiguration för en intent.
        
        Args:
            intent_name: Namn på intent
            
        Returns:
            API-konfiguration eller None
        """
        intents = self.rules.get("intents", {})
        return intents.get(intent_name)
    
    def add_intent(self, name: str, triggers: List[str], priority: int = 5) -> bool:
        """
        Lägg till ny intent (admin-funktion).
        
        Args:
            name: Intent-namn
            triggers: Lista med trigger-ord
            priority: Prioritet (0 = högst)
            
        Returns:
            True om tillägg lyckades
        """
        if "intents" not in self.rules:
            self.rules["intents"] = {}
        
        self.rules["intents"][name] = {
            "triggers": triggers,
            "entities": [],
            "priority": priority
        }
        
        return self._save_rules()
    
    def update_intent(self, name: str, triggers: Optional[List[str]] = None, 
                     priority: Optional[int] = None) -> bool:
        """
        Uppdatera befintlig intent (admin-funktion).
        
        Args:
            name: Intent-namn
            triggers: Nya triggers (eller None för att behålla)
            priority: Ny prioritet (eller None för att behålla)
            
        Returns:
            True om uppdatering lyckades
        """
        intents = self.rules.get("intents", {})
        if name not in intents:
            return False
        
        if triggers is not None:
            intents[name]["triggers"] = triggers
        if priority is not None:
            intents[name]["priority"] = priority
        
        return self._save_rules()
    
    def delete_intent(self, name: str) -> bool:
        """
        Ta bort intent (admin-funktion).
        
        Args:
            name: Intent-namn
            
        Returns:
            True om borttagning lyckades
        """
        intents = self.rules.get("intents", {})
        if name not in intents:
            return False
        
        del intents[name]
        return self._save_rules()
    
    def _save_rules(self) -> bool:
        """Spara regler till fil."""
        try:
            self.rules["metadata"]["last_updated"] = datetime.now().isoformat()
            
            with open(self.rules_file, 'w', encoding='utf-8') as f:
                json.dump(self.rules, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[INTENT-ENGINE] Error saving rules: {e}")
            return False
    
    def list_intents(self) -> List[str]:
        """Lista alla tillgängliga intents."""
        return list(self.rules.get("intents", {}).keys())
    
    def get_stats(self) -> Dict[str, Any]:
        """Hämta statistik om engine."""
        intents = self.rules.get("intents", {})
        patterns = self.rules.get("entity_patterns", {})
        
        # Support both 'keywords' (new format) and 'triggers' (legacy)
        total_keywords = sum(
            len(i.get("keywords", i.get("triggers", []))) 
            for i in intents.values()
        )
        
        return {
            "total_intents": len(intents),
            "total_keywords": total_keywords,
            "entity_patterns": len(patterns),
            "spacy_available": self.nlp is not None,
            "spacy_model": self.nlp.meta.get("name") if self.nlp else None,
            "version": self.rules.get("metadata", {}).get("version", "unknown")
        }


# Global instance för enkel åtkomst
_engine_instance: Optional[IntentEngine] = None


def get_intent_engine() -> IntentEngine:
    """
    Hämta global IntentEngine-instans (singleton).
    
    Returns:
        IntentEngine-instans
    """
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = IntentEngine()
    return _engine_instance


def process_user_input(text: str) -> Dict[str, Any]:
    """
    Bekväm funktion för att processa användarinput.
    
    Args:
        text: Användarinput
        
    Returns:
        Processerat resultat
    """
    engine = get_intent_engine()
    return engine.process(text)


def generate_topic_hash(intent: str, entity: str = "") -> str:
    """
    ONESEEK Δ+: Generera en topic_hash baserat på intent och entity.
    Samma intent + entity → samma hash → samma tråd.
    
    Args:
        intent: Intent-namn (t.ex. "befolkning", "väder")
        entity: Entity-text (t.ex. "Hjo", "Stockholm")
        
    Returns:
        16-teckens SHA-256 hash
    """
    key = f"{intent.lower()}:{entity.lower().strip() if entity else 'general'}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def detect_intent_and_city(text: str) -> Dict[str, Any]:
    """
    ONESEEK Δ+: Bekväm funktion för att detektera intent och huvudentitet.
    
    Args:
        text: Användarinput
        
    Returns:
        Dict med intent, entity, confidence
    """
    result = process_user_input(text)
    
    # Extrahera huvudentitet (GPE eller LOC)
    entity = ""
    entities = result.get("entities", [])
    for ent in entities:
        if isinstance(ent, dict) and ent.get("label") in ["GPE", "LOC"]:
            entity = ent.get("text", "")
            break
    
    return {
        "intent": result.get("intent", {}).get("name", "general"),
        "entity": entity,
        "confidence": result.get("intent", {}).get("confidence", 0.5),
        "all_entities": entities
    }


if __name__ == "__main__":
    # Test
    engine = IntentEngine()
    
    test_queries = [
        "Hur många bor i Stockholm?",
        "Vad är vädret i Göteborg?",
        "Senaste nyheterna",
        "Vad röstade riksdagen om igår?",
        "Vem är du?",
    ]
    
    print("=" * 60)
    print("ONESEEK Δ+ Intent Engine Test")
    print("=" * 60)
    
    for query in test_queries:
        result = engine.process(query)
        print(f"\nQuery: {query}")
        print(f"Intent: {result['intent']['name']} ({result['intent']['confidence']:.2f})")
        print(f"Entities: {result['entities']}")
        
    # Test topic hash
    print("\n" + "=" * 60)
    print("Topic Hash Test")
    print("=" * 60)
    
    hash1 = generate_topic_hash("befolkning", "Hjo")
    hash2 = generate_topic_hash("befolkning", "hjo")
    print(f"befolkning:Hjo = {hash1}")
    print(f"befolkning:hjo = {hash2} (same: {hash1 == hash2})")
    
    print("\n" + "=" * 60)
    print("Engine Stats:")
    print(engine.get_stats())
