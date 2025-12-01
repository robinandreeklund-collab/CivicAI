"""
Confidence Calculator v2 for ONESEEK Δ+
Förtroende v2-algoritm med admin-konfigurerbar källviktning

Funktionalitet:
- Beräkna förtroende baserat på källviktning
- Admin-konfigurerbar via source_weights.json
- Freshness-faktor för datapunkter
- Multi-source aggregering

Author: ONESEEK Team
"""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

# Configuration
SOURCE_WEIGHTS_FILE = Path(__file__).parent / "source_weights.json"


@dataclass
class ConfidenceResult:
    """Resultat från förtroendeberäkning."""
    score: float  # 0.0 - 1.0
    level: str  # "high", "medium", "low"
    sources: List[str]
    factors: Dict[str, float]
    explanation: str


class ConfidenceCalculator:
    """
    Förtroende v2-beräknare för ONESEEK Δ+.
    
    Beräknar förtroende baserat på:
    - Källviktning (source_weights.json)
    - Reliability-nivå
    - Datatyp
    - Färskhet (freshness)
    """
    
    def __init__(self, weights_file: Optional[Path] = None):
        """
        Initialisera ConfidenceCalculator.
        
        Args:
            weights_file: Sökväg till source_weights.json
        """
        self.weights_file = weights_file or SOURCE_WEIGHTS_FILE
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Ladda viktningskonfiguration."""
        if self.weights_file.exists():
            try:
                with open(self.weights_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                print(f"[CONFIDENCE] Warning: Could not load weights: {e}")
        
        return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Returnera standardkonfiguration."""
        return {
            "sources": {
                "smhi": {"weight": 0.95, "reliability": "official"},
                "scb": {"weight": 0.98, "reliability": "official"},
                "riksdagen": {"weight": 0.98, "reliability": "official"},
                "krisinformation": {"weight": 0.99, "reliability": "official"},
                "svt": {"weight": 0.85, "reliability": "high"},
                "tavily": {"weight": 0.70, "reliability": "medium"},
            },
            "reliability_levels": {
                "official": {"trust_factor": 1.0},
                "high": {"trust_factor": 0.9},
                "medium": {"trust_factor": 0.75},
                "low": {"trust_factor": 0.5}
            },
            "data_type_weights": {
                "weather": 1.0,
                "population": 1.0,
                "crisis": 1.0,
                "news": 0.80,
                "web_search": 0.65
            },
            "confidence_calculation": {
                "freshness_decay": {
                    "hours_0_1": 1.0,
                    "hours_1_6": 0.95,
                    "hours_6_24": 0.85,
                    "days_1_7": 0.70,
                    "days_7_plus": 0.50
                }
            }
        }
    
    def reload_config(self) -> bool:
        """
        Ladda om konfiguration (hot-reload för admin).
        
        Returns:
            True om laddning lyckades
        """
        try:
            self.config = self._load_config()
            return True
        except Exception as e:
            print(f"[CONFIDENCE] Error reloading config: {e}")
            return False
    
    def get_source_weight(self, source_id: str) -> float:
        """
        Hämta viktning för en källa.
        
        Args:
            source_id: Källans ID (t.ex. "smhi", "scb")
            
        Returns:
            Viktning (0.0 - 1.0)
        """
        sources = self.config.get("sources", {})
        source = sources.get(source_id, {})
        return source.get("weight", 0.5)
    
    def get_reliability_factor(self, reliability_level: str) -> float:
        """
        Hämta trust-faktor för reliability-nivå.
        
        Args:
            reliability_level: "official", "high", "medium", "low"
            
        Returns:
            Trust-faktor (0.0 - 1.0)
        """
        levels = self.config.get("reliability_levels", {})
        level = levels.get(reliability_level, {})
        return level.get("trust_factor", 0.5)
    
    def get_data_type_weight(self, data_type: str) -> float:
        """
        Hämta viktning för datatyp.
        
        Args:
            data_type: Typ av data (t.ex. "weather", "news")
            
        Returns:
            Viktning (0.0 - 1.0)
        """
        types = self.config.get("data_type_weights", {})
        return types.get(data_type, 0.6)
    
    def calculate_freshness_factor(self, timestamp: Optional[datetime] = None) -> float:
        """
        Beräkna freshness-faktor baserat på datumstämpel.
        
        Args:
            timestamp: Tidpunkt för data (None = nu)
            
        Returns:
            Freshness-faktor (0.0 - 1.0)
        """
        if timestamp is None:
            return 1.0
        
        now = datetime.now(timezone.utc)
        
        # Konvertera till timezone-aware om nödvändigt
        if timestamp.tzinfo is None:
            timestamp = timestamp.replace(tzinfo=timezone.utc)
        
        age = now - timestamp
        hours = age.total_seconds() / 3600
        
        decay = self.config.get("confidence_calculation", {}).get("freshness_decay", {})
        
        if hours <= 1:
            return decay.get("hours_0_1", 1.0)
        elif hours <= 6:
            return decay.get("hours_1_6", 0.95)
        elif hours <= 24:
            return decay.get("hours_6_24", 0.85)
        elif hours <= 168:  # 7 dagar
            return decay.get("days_1_7", 0.70)
        else:
            return decay.get("days_7_plus", 0.50)
    
    def calculate(
        self,
        source_id: str,
        data_type: str = "general",
        timestamp: Optional[datetime] = None,
        additional_factors: Optional[Dict[str, float]] = None
    ) -> ConfidenceResult:
        """
        Beräkna förtroende för en datapunkt.
        
        Args:
            source_id: Källans ID
            data_type: Typ av data
            timestamp: Tidpunkt för data
            additional_factors: Extra faktorer att multiplicera med
            
        Returns:
            ConfidenceResult med beräknat förtroende
        """
        sources = self.config.get("sources", {})
        source = sources.get(source_id, {})
        
        # Hämta faktorer
        source_weight = source.get("weight", 0.5)
        reliability = source.get("reliability", "low")
        reliability_factor = self.get_reliability_factor(reliability)
        data_type_weight = self.get_data_type_weight(data_type)
        freshness_factor = self.calculate_freshness_factor(timestamp)
        
        # Beräkna total score
        score = source_weight * reliability_factor * data_type_weight * freshness_factor
        
        # Applicera extra faktorer
        factors = {
            "source_weight": source_weight,
            "reliability_factor": reliability_factor,
            "data_type_weight": data_type_weight,
            "freshness_factor": freshness_factor
        }
        
        if additional_factors:
            for key, value in additional_factors.items():
                score *= value
                factors[key] = value
        
        # Normalisera till 0.0 - 1.0
        score = max(0.0, min(1.0, score))
        
        # Bestäm nivå
        if score >= 0.8:
            level = "high"
        elif score >= 0.6:
            level = "medium"
        else:
            level = "low"
        
        # Skapa förklaring
        explanation = self._create_explanation(source_id, level, factors)
        
        return ConfidenceResult(
            score=round(score, 3),
            level=level,
            sources=[source_id],
            factors=factors,
            explanation=explanation
        )
    
    def calculate_multi_source(
        self,
        sources: List[Dict[str, Any]]
    ) -> ConfidenceResult:
        """
        Beräkna aggregerat förtroende från flera källor.
        
        Args:
            sources: Lista med källinformation
                [{"source_id": "smhi", "data_type": "weather", "weight": 1.0}, ...]
                
        Returns:
            Aggregerat ConfidenceResult
        """
        if not sources:
            return ConfidenceResult(
                score=0.0,
                level="low",
                sources=[],
                factors={},
                explanation="Inga källor angivna"
            )
        
        total_weight = 0.0
        weighted_score = 0.0
        all_factors = {}
        source_ids = []
        
        for source_info in sources:
            source_id = source_info.get("source_id", "unknown")
            data_type = source_info.get("data_type", "general")
            timestamp = source_info.get("timestamp")
            source_weight_modifier = source_info.get("weight", 1.0)
            
            result = self.calculate(source_id, data_type, timestamp)
            
            source_ids.append(source_id)
            all_factors[source_id] = result.factors
            
            # Viktad summa
            total_weight += source_weight_modifier
            weighted_score += result.score * source_weight_modifier
        
        # Beräkna medel
        final_score = weighted_score / total_weight if total_weight > 0 else 0.0
        final_score = max(0.0, min(1.0, final_score))
        
        # Bestäm nivå
        if final_score >= 0.8:
            level = "high"
        elif final_score >= 0.6:
            level = "medium"
        else:
            level = "low"
        
        explanation = f"Aggregerat förtroende från {len(sources)} källa(or): {', '.join(source_ids)}"
        
        return ConfidenceResult(
            score=round(final_score, 3),
            level=level,
            sources=source_ids,
            factors=all_factors,
            explanation=explanation
        )
    
    def _create_explanation(self, source_id: str, level: str, factors: Dict[str, float]) -> str:
        """Skapa förklaring på svenska."""
        source_name = self.config.get("sources", {}).get(source_id, {}).get("name", source_id)
        
        explanations = {
            "high": f"Hög tillförlitlighet: Data från {source_name} bedöms som mycket pålitlig.",
            "medium": f"Medel tillförlitlighet: Data från {source_name} bedöms som pålitlig men bör verifieras.",
            "low": f"Låg tillförlitlighet: Data från {source_name} bör verifieras mot andra källor."
        }
        
        return explanations.get(level, "Okänd tillförlitlighet")
    
    def get_source_info(self, source_id: str) -> Optional[Dict[str, Any]]:
        """
        Hämta information om en källa.
        
        Args:
            source_id: Källans ID
            
        Returns:
            Källinformation eller None
        """
        return self.config.get("sources", {}).get(source_id)
    
    def list_sources(self) -> List[str]:
        """Lista alla konfigurerade källor."""
        return list(self.config.get("sources", {}).keys())
    
    def update_source_weight(self, source_id: str, weight: float) -> bool:
        """
        Uppdatera viktning för en källa (admin-funktion).
        
        Args:
            source_id: Källans ID
            weight: Ny viktning (0.0 - 1.0)
            
        Returns:
            True om uppdatering lyckades
        """
        if source_id not in self.config.get("sources", {}):
            return False
        
        weight = max(0.0, min(1.0, weight))
        self.config["sources"][source_id]["weight"] = weight
        
        return self._save_config()
    
    def add_source(self, source_id: str, name: str, weight: float, 
                   reliability: str = "medium") -> bool:
        """
        Lägg till ny källa (admin-funktion).
        
        Args:
            source_id: Källans ID
            name: Visningsnamn
            weight: Viktning (0.0 - 1.0)
            reliability: "official", "high", "medium", "low"
            
        Returns:
            True om tillägg lyckades
        """
        if "sources" not in self.config:
            self.config["sources"] = {}
        
        self.config["sources"][source_id] = {
            "name": name,
            "weight": max(0.0, min(1.0, weight)),
            "reliability": reliability
        }
        
        return self._save_config()
    
    def _save_config(self) -> bool:
        """Spara konfiguration till fil."""
        try:
            self.config["metadata"] = self.config.get("metadata", {})
            self.config["metadata"]["last_updated"] = datetime.now().isoformat()
            
            with open(self.weights_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
            return True
        except Exception as e:
            print(f"[CONFIDENCE] Error saving config: {e}")
            return False


# Global instance
_calculator_instance: Optional[ConfidenceCalculator] = None


def get_confidence_calculator() -> ConfidenceCalculator:
    """Hämta global ConfidenceCalculator-instans."""
    global _calculator_instance
    if _calculator_instance is None:
        _calculator_instance = ConfidenceCalculator()
    return _calculator_instance


def calculate_confidence(
    source_id: str,
    data_type: str = "general",
    timestamp: Optional[datetime] = None
) -> ConfidenceResult:
    """
    Bekväm funktion för förtroendeberäkning.
    
    Args:
        source_id: Källans ID
        data_type: Typ av data
        timestamp: Tidpunkt för data
        
    Returns:
        ConfidenceResult
    """
    calculator = get_confidence_calculator()
    return calculator.calculate(source_id, data_type, timestamp)


if __name__ == "__main__":
    # Test
    calc = ConfidenceCalculator()
    
    test_sources = ["smhi", "scb", "riksdagen", "svt", "tavily"]
    
    print("=" * 60)
    print("ONESEEK Δ+ Confidence Calculator v2 Test")
    print("=" * 60)
    
    for source in test_sources:
        result = calc.calculate(source, data_type="general")
        print(f"\nKälla: {source}")
        print(f"  Score: {result.score}")
        print(f"  Level: {result.level}")
        print(f"  Explanation: {result.explanation}")
    
    # Multi-source test
    print("\n" + "=" * 60)
    print("Multi-source test:")
    
    multi_result = calc.calculate_multi_source([
        {"source_id": "smhi", "data_type": "weather"},
        {"source_id": "svt", "data_type": "news"},
    ])
    
    print(f"  Aggregated score: {multi_result.score}")
    print(f"  Level: {multi_result.level}")
    print(f"  Sources: {multi_result.sources}")
