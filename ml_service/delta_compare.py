"""
Delta Compare for ONESEEK Δ+
Semantisk Δ-jämförelse mellan intent + entitet

Funktionalitet:
- Jämför semantisk likhet mellan frågor
- Detektera förändringar i intent och entities
- Spåra svar över tid (Δ)
- Identifiera drift i modellens förståelse

Author: ONESEEK Team
"""

import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher

# Try to import intent engine
try:
    from .intent_engine import get_intent_engine, Intent
except ImportError:
    try:
        from intent_engine import get_intent_engine, Intent
    except ImportError:
        get_intent_engine = None
        Intent = None


@dataclass
class DeltaResult:
    """Resultat från Δ-jämförelse."""
    similarity_score: float  # 0.0 - 1.0
    intent_match: bool
    entity_overlap: float
    changes: Dict[str, Any]
    delta_type: str  # "identical", "similar", "different", "opposite"
    hash_current: str
    hash_previous: str


class DeltaCompare:
    """
    Semantisk Δ-jämförare för ONESEEK Δ+.
    
    Jämför:
    - Intent-klassificering
    - Extraherade entiteter
    - Semantisk textlikhet
    - Förändringar över tid
    """
    
    def __init__(self):
        """Initialisera DeltaCompare."""
        self.intent_engine = get_intent_engine() if get_intent_engine else None
        self.history = {}  # Cache för historik
    
    def compute_hash(self, data: Any) -> str:
        """
        Beräkna SHA-256 hash för data.
        
        Args:
            data: Data att hasha
            
        Returns:
            SHA-256 hash som hex-sträng
        """
        if isinstance(data, dict):
            json_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        else:
            json_str = str(data)
        
        return hashlib.sha256(json_str.encode('utf-8')).hexdigest()
    
    def compute_text_similarity(self, text1: str, text2: str) -> float:
        """
        Beräkna textlikhet mellan två strängar.
        
        Args:
            text1: Första texten
            text2: Andra texten
            
        Returns:
            Likhetsgrad (0.0 - 1.0)
        """
        if not text1 or not text2:
            return 0.0
        
        # Normalisera text
        text1_normalized = text1.lower().strip()
        text2_normalized = text2.lower().strip()
        
        # Använd SequenceMatcher för likhet
        return SequenceMatcher(None, text1_normalized, text2_normalized).ratio()
    
    def compute_entity_overlap(
        self, 
        entities1: List[Dict[str, Any]], 
        entities2: List[Dict[str, Any]]
    ) -> float:
        """
        Beräkna överlapp mellan entitetslistor.
        
        Args:
            entities1: Första entitetslistan
            entities2: Andra entitetslistan
            
        Returns:
            Överlappningsgrad (0.0 - 1.0)
        """
        if not entities1 and not entities2:
            return 1.0  # Båda tomma = perfekt match
        
        if not entities1 or not entities2:
            return 0.0  # En tom = ingen match
        
        # Extrahera entitetstext
        texts1 = {e.get("text", "").lower() for e in entities1}
        texts2 = {e.get("text", "").lower() for e in entities2}
        
        # Beräkna Jaccard-likhet
        intersection = len(texts1 & texts2)
        union = len(texts1 | texts2)
        
        return intersection / union if union > 0 else 0.0
    
    def compare_intents(self, intent1: Dict[str, Any], intent2: Dict[str, Any]) -> Tuple[bool, float]:
        """
        Jämför två intent-klassificeringar.
        
        Args:
            intent1: Första intent
            intent2: Andra intent
            
        Returns:
            Tuple med (exakt match, likhetsscore)
        """
        name1 = intent1.get("name", "unknown")
        name2 = intent2.get("name", "unknown")
        
        exact_match = name1 == name2
        
        # Beräkna likhet baserat på triggers
        triggers1 = set(intent1.get("triggers", []))
        triggers2 = set(intent2.get("triggers", []))
        
        if triggers1 and triggers2:
            intersection = len(triggers1 & triggers2)
            union = len(triggers1 | triggers2)
            trigger_similarity = intersection / union if union > 0 else 0.0
        else:
            trigger_similarity = 1.0 if exact_match else 0.0
        
        return exact_match, trigger_similarity
    
    def compare(
        self,
        current: Dict[str, Any],
        previous: Dict[str, Any]
    ) -> DeltaResult:
        """
        Utför fullständig Δ-jämförelse.
        
        Args:
            current: Aktuellt processerat resultat
            previous: Tidigare processerat resultat
            
        Returns:
            DeltaResult med jämförelseresultat
        """
        # Hämta intents
        intent1 = current.get("intent", {})
        intent2 = previous.get("intent", {})
        
        # Jämför intents
        intent_match, intent_similarity = self.compare_intents(intent1, intent2)
        
        # Hämta entities
        entities1 = current.get("entities", [])
        entities2 = previous.get("entities", [])
        
        # Beräkna entity overlap
        entity_overlap = self.compute_entity_overlap(entities1, entities2)
        
        # Beräkna textlikhet
        input1 = current.get("input", "")
        input2 = previous.get("input", "")
        text_similarity = self.compute_text_similarity(input1, input2)
        
        # Beräkna total similarity
        similarity_score = (
            intent_similarity * 0.4 +
            entity_overlap * 0.3 +
            text_similarity * 0.3
        )
        
        # Bestäm delta-typ
        if similarity_score >= 0.95:
            delta_type = "identical"
        elif similarity_score >= 0.7:
            delta_type = "similar"
        elif similarity_score >= 0.3:
            delta_type = "different"
        else:
            delta_type = "opposite"
        
        # Samla ändringar
        changes = {
            "intent_changed": not intent_match,
            "intent_current": intent1.get("name"),
            "intent_previous": intent2.get("name"),
            "entities_added": self._find_added_entities(entities1, entities2),
            "entities_removed": self._find_removed_entities(entities1, entities2),
            "text_similarity": round(text_similarity, 3)
        }
        
        # Beräkna hashar
        hash_current = self.compute_hash(current)
        hash_previous = self.compute_hash(previous)
        
        return DeltaResult(
            similarity_score=round(similarity_score, 3),
            intent_match=intent_match,
            entity_overlap=round(entity_overlap, 3),
            changes=changes,
            delta_type=delta_type,
            hash_current=hash_current,
            hash_previous=hash_previous
        )
    
    def _find_added_entities(
        self,
        current: List[Dict[str, Any]],
        previous: List[Dict[str, Any]]
    ) -> List[str]:
        """Hitta tillagda entiteter."""
        current_texts = {e.get("text", "").lower() for e in current}
        previous_texts = {e.get("text", "").lower() for e in previous}
        return list(current_texts - previous_texts)
    
    def _find_removed_entities(
        self,
        current: List[Dict[str, Any]],
        previous: List[Dict[str, Any]]
    ) -> List[str]:
        """Hitta borttagna entiteter."""
        current_texts = {e.get("text", "").lower() for e in current}
        previous_texts = {e.get("text", "").lower() for e in previous}
        return list(previous_texts - current_texts)
    
    def compare_responses(
        self,
        response1: str,
        response2: str,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Jämför två modellsvar.
        
        Args:
            response1: Första svaret
            response2: Andra svaret
            context: Kontextfråga (valfritt)
            
        Returns:
            Dict med jämförelseresultat
        """
        text_similarity = self.compute_text_similarity(response1, response2)
        
        # Beräkna längdskillnad
        len1 = len(response1)
        len2 = len(response2)
        length_ratio = min(len1, len2) / max(len1, len2) if max(len1, len2) > 0 else 1.0
        
        # Räkna gemensamma ord
        words1 = set(response1.lower().split())
        words2 = set(response2.lower().split())
        word_overlap = len(words1 & words2) / len(words1 | words2) if words1 | words2 else 0.0
        
        return {
            "text_similarity": round(text_similarity, 3),
            "length_ratio": round(length_ratio, 3),
            "word_overlap": round(word_overlap, 3),
            "response1_length": len1,
            "response2_length": len2,
            "hash1": self.compute_hash(response1),
            "hash2": self.compute_hash(response2),
            "context": context
        }
    
    def track_query(
        self,
        query_id: str,
        processed_result: Dict[str, Any],
        response: str
    ) -> Optional[DeltaResult]:
        """
        Spåra och jämför fråga över tid.
        
        Args:
            query_id: Unik identifierare för frågan
            processed_result: Processerat resultat från intent engine
            response: Modellens svar
            
        Returns:
            DeltaResult om tidigare data finns, annars None
        """
        current_data = {
            **processed_result,
            "response": response,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        # Kolla om vi har tidigare data
        previous_data = self.history.get(query_id)
        
        # Spara aktuell data
        self.history[query_id] = current_data
        
        if previous_data:
            return self.compare(current_data, previous_data)
        
        return None
    
    def get_drift_analysis(self, query_id: str) -> Optional[Dict[str, Any]]:
        """
        Analysera drift för en specifik fråga.
        
        Args:
            query_id: Unik identifierare för frågan
            
        Returns:
            Driftanalys eller None
        """
        if query_id not in self.history:
            return None
        
        current = self.history[query_id]
        
        return {
            "query_id": query_id,
            "last_seen": current.get("timestamp"),
            "current_intent": current.get("intent", {}).get("name"),
            "current_entities": [e.get("text") for e in current.get("entities", [])],
            "response_hash": self.compute_hash(current.get("response", ""))
        }
    
    def create_blockchain_entry(
        self,
        query: str,
        response: str,
        sources: List[str],
        confidence: float
    ) -> Dict[str, Any]:
        """
        Skapa ett blockchain-liknande entry för svar.
        
        Args:
            query: Användarens fråga
            response: Modellens svar
            sources: Använda källor
            confidence: Förtroendescore
            
        Returns:
            Entry med hash-kedja
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        entry = {
            "timestamp": timestamp,
            "query_hash": self.compute_hash(query),
            "response_hash": self.compute_hash(response),
            "sources": sources,
            "confidence": confidence
        }
        
        # Beräkna entry-hash (som inkluderar allt)
        entry["entry_hash"] = self.compute_hash(entry)
        
        return entry


# Global instance
_delta_compare: Optional[DeltaCompare] = None


def get_delta_compare() -> DeltaCompare:
    """Hämta global DeltaCompare-instans."""
    global _delta_compare
    if _delta_compare is None:
        _delta_compare = DeltaCompare()
    return _delta_compare


def compare_results(
    current: Dict[str, Any],
    previous: Dict[str, Any]
) -> DeltaResult:
    """
    Bekväm funktion för Δ-jämförelse.
    
    Args:
        current: Aktuellt resultat
        previous: Tidigare resultat
        
    Returns:
        DeltaResult
    """
    dc = get_delta_compare()
    return dc.compare(current, previous)


def create_response_hash(query: str, response: str) -> str:
    """
    Skapa blockchain-hash för ett svar.
    
    Args:
        query: Frågan
        response: Svaret
        
    Returns:
        SHA-256 hash
    """
    dc = get_delta_compare()
    data = {"query": query, "response": response}
    return dc.compute_hash(data)


if __name__ == "__main__":
    # Test
    dc = DeltaCompare()
    
    print("=" * 60)
    print("ONESEEK Δ+ Delta Compare Test")
    print("=" * 60)
    
    # Test textlikhet
    text1 = "Hur är vädret i Stockholm?"
    text2 = "Vad är vädret i Stockholm idag?"
    
    similarity = dc.compute_text_similarity(text1, text2)
    print(f"\nTextlikhet test:")
    print(f"  Text 1: {text1}")
    print(f"  Text 2: {text2}")
    print(f"  Likhet: {similarity:.2f}")
    
    # Test Δ-jämförelse
    current_result = {
        "input": "Hur är vädret i Stockholm?",
        "intent": {"name": "väder", "triggers": ["väder"]},
        "entities": [{"text": "Stockholm", "label": "GPE"}]
    }
    
    previous_result = {
        "input": "Vad är vädret i Göteborg?",
        "intent": {"name": "väder", "triggers": ["väder"]},
        "entities": [{"text": "Göteborg", "label": "GPE"}]
    }
    
    delta = dc.compare(current_result, previous_result)
    
    print(f"\nΔ-jämförelse test:")
    print(f"  Similarity: {delta.similarity_score}")
    print(f"  Intent match: {delta.intent_match}")
    print(f"  Entity overlap: {delta.entity_overlap}")
    print(f"  Delta type: {delta.delta_type}")
    print(f"  Changes: {delta.changes}")
    
    # Test blockchain hash
    entry = dc.create_blockchain_entry(
        query="Hur är vädret?",
        response="I Stockholm är det 15°C och soligt.",
        sources=["smhi"],
        confidence=0.95
    )
    
    print(f"\nBlockchain entry:")
    print(f"  Entry hash: {entry['entry_hash'][:16]}...")
    print(f"  Query hash: {entry['query_hash'][:16]}...")
    print(f"  Response hash: {entry['response_hash'][:16]}...")
