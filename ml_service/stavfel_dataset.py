"""
Stavfel Dataset Manager for ONESEEK Δ+
Hanterar sparande av stavfelspar till datasets/typo_pairs_swedish.jsonl

Funktionalitet:
- Spara stavfelspar med kontext
- Hämta statistik över dataset
- Export till olika format för träning
- Admin-granska och godkänna par

Author: ONESEEK Team
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

# Paths
DATASET_DIR = Path(__file__).parent.parent / "datasets"
TYPO_PAIRS_FILE = DATASET_DIR / "typo_pairs_swedish.jsonl"


@dataclass
class StavfelPair:
    """Representerar ett stavfelspar."""
    original: str
    corrected: str
    context: str
    source: str  # "user_input", "admin_review", "auto_detected"
    timestamp: str
    approved: bool = False
    confidence: float = 0.0


class StavfelDataset:
    """
    Hantera svenska stavfelspar för träning.
    
    Funktioner:
    - Spara nya par
    - Hämta alla par
    - Filtrera efter status
    - Export för träning
    """
    
    def __init__(self, file_path: Optional[Path] = None):
        self.file_path = file_path or TYPO_PAIRS_FILE
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Skapa fil och mapp om de inte finns."""
        self.file_path.parent.mkdir(parents=True, exist_ok=True)
        if not self.file_path.exists():
            self.file_path.touch()
    
    def save_pair(
        self,
        original: str,
        corrected: str,
        context: str = "",
        source: str = "user_input",
        confidence: float = 0.0
    ) -> bool:
        """
        Spara ett stavfelspar till dataset.
        
        Args:
            original: Det felstavade ordet
            corrected: Korrekt stavning
            context: Kontext (hela meningen)
            source: Källa (user_input, admin_review, auto_detected)
            confidence: Säkerhet på korrigeringen (0.0-1.0)
            
        Returns:
            True om sparning lyckades
        """
        # Validera input
        if not original or not corrected:
            return False
        
        # Hoppa över om original == corrected
        if original.lower().strip() == corrected.lower().strip():
            return False
        
        try:
            pair = StavfelPair(
                original=original.strip(),
                corrected=corrected.strip(),
                context=context[:500] if context else "",  # Max 500 tecken kontext
                source=source,
                timestamp=datetime.now().isoformat(),
                approved=False,
                confidence=round(confidence, 3)
            )
            
            with open(self.file_path, 'a', encoding='utf-8') as f:
                f.write(json.dumps(asdict(pair), ensure_ascii=False) + "\n")
            
            return True
        except Exception as e:
            print(f"[STAVFEL] Error saving pair: {e}")
            return False
    
    def get_all_pairs(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Hämta alla stavfelspar.
        
        Args:
            limit: Max antal par att returnera
            
        Returns:
            Lista med stavfelspar
        """
        pairs = []
        try:
            with open(self.file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        pairs.append(json.loads(line))
                    if len(pairs) >= limit:
                        break
        except Exception as e:
            print(f"[STAVFEL] Error reading pairs: {e}")
        
        return pairs
    
    def get_pending_review(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Hämta par som väntar på admin-granskning.
        
        Args:
            limit: Max antal par
            
        Returns:
            Lista med ogranskade par
        """
        all_pairs = self.get_all_pairs(limit=10000)
        pending = [p for p in all_pairs if not p.get("approved", False)]
        return pending[:limit]
    
    def get_approved(self, limit: int = 1000) -> List[Dict[str, Any]]:
        """
        Hämta godkända par (för träning).
        
        Args:
            limit: Max antal par
            
        Returns:
            Lista med godkända par
        """
        all_pairs = self.get_all_pairs(limit=10000)
        approved = [p for p in all_pairs if p.get("approved", False)]
        return approved[:limit]
    
    def approve_pair(self, original: str, corrected: str) -> bool:
        """
        Godkänn ett stavfelspar för träning.
        
        Args:
            original: Ursprungligt felstavat ord
            corrected: Korrigerat ord
            
        Returns:
            True om uppdatering lyckades
        """
        try:
            # Läs alla par
            all_pairs = self.get_all_pairs(limit=100000)
            
            # Hitta och uppdatera paret
            updated = False
            for pair in all_pairs:
                if pair.get("original") == original and pair.get("corrected") == corrected:
                    pair["approved"] = True
                    updated = True
                    break
            
            if not updated:
                return False
            
            # Skriv tillbaka alla par
            with open(self.file_path, 'w', encoding='utf-8') as f:
                for pair in all_pairs:
                    f.write(json.dumps(pair, ensure_ascii=False) + "\n")
            
            return True
        except Exception as e:
            print(f"[STAVFEL] Error approving pair: {e}")
            return False
    
    def reject_pair(self, original: str, corrected: str) -> bool:
        """
        Ta bort ett felaktigt stavfelspar.
        
        Args:
            original: Ursprungligt ord
            corrected: Korrigerat ord
            
        Returns:
            True om borttagning lyckades
        """
        try:
            # Läs alla par
            all_pairs = self.get_all_pairs(limit=100000)
            
            # Filtrera bort paret
            filtered = [
                p for p in all_pairs 
                if not (p.get("original") == original and p.get("corrected") == corrected)
            ]
            
            if len(filtered) == len(all_pairs):
                return False  # Paret hittades inte
            
            # Skriv tillbaka filtrerade par
            with open(self.file_path, 'w', encoding='utf-8') as f:
                for pair in filtered:
                    f.write(json.dumps(pair, ensure_ascii=False) + "\n")
            
            return True
        except Exception as e:
            print(f"[STAVFEL] Error rejecting pair: {e}")
            return False
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Hämta statistik över dataset.
        
        Returns:
            Dict med statistik
        """
        all_pairs = self.get_all_pairs(limit=100000)
        
        approved_count = sum(1 for p in all_pairs if p.get("approved", False))
        pending_count = len(all_pairs) - approved_count
        
        # Räkna per källa
        by_source = {}
        for pair in all_pairs:
            source = pair.get("source", "unknown")
            by_source[source] = by_source.get(source, 0) + 1
        
        # Räkna unika ord
        unique_originals = set(p.get("original", "").lower() for p in all_pairs)
        unique_corrected = set(p.get("corrected", "").lower() for p in all_pairs)
        
        return {
            "total_pairs": len(all_pairs),
            "approved": approved_count,
            "pending": pending_count,
            "unique_typos": len(unique_originals),
            "unique_corrections": len(unique_corrected),
            "by_source": by_source
        }
    
    def export_for_training(self, format: str = "jsonl") -> str:
        """
        Exportera godkända par för träning.
        
        Args:
            format: Export-format ("jsonl", "csv", "json")
            
        Returns:
            Filsökväg till exporterad fil
        """
        approved = self.get_approved(limit=100000)
        
        export_dir = DATASET_DIR / "exports"
        export_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        if format == "jsonl":
            export_path = export_dir / f"typo_training_{timestamp}.jsonl"
            with open(export_path, 'w', encoding='utf-8') as f:
                for pair in approved:
                    f.write(json.dumps({
                        "input": pair["original"],
                        "output": pair["corrected"]
                    }, ensure_ascii=False) + "\n")
        
        elif format == "csv":
            export_path = export_dir / f"typo_training_{timestamp}.csv"
            with open(export_path, 'w', encoding='utf-8') as f:
                f.write("original,corrected\n")
                for pair in approved:
                    f.write(f'"{pair["original"]}","{pair["corrected"]}"\n')
        
        elif format == "json":
            export_path = export_dir / f"typo_training_{timestamp}.json"
            with open(export_path, 'w', encoding='utf-8') as f:
                json.dump(approved, f, ensure_ascii=False, indent=2)
        
        else:
            raise ValueError(f"Okänt format: {format}")
        
        return str(export_path)
    
    def bulk_save(self, pairs: List[Dict[str, str]]) -> int:
        """
        Spara flera par på en gång.
        
        Args:
            pairs: Lista med {"original": ..., "corrected": ..., "context": ...}
            
        Returns:
            Antal sparade par
        """
        saved = 0
        for pair in pairs:
            if self.save_pair(
                original=pair.get("original", ""),
                corrected=pair.get("corrected", ""),
                context=pair.get("context", ""),
                source=pair.get("source", "bulk_import"),
                confidence=pair.get("confidence", 0.5)
            ):
                saved += 1
        
        return saved


# Global instance
_dataset: Optional[StavfelDataset] = None


def get_stavfel_dataset() -> StavfelDataset:
    """Hämta global StavfelDataset-instans."""
    global _dataset
    if _dataset is None:
        _dataset = StavfelDataset()
    return _dataset


def save_typo_pair(original: str, corrected: str, context: str = "", confidence: float = 0.0) -> bool:
    """
    Bekväm funktion för att spara ett stavfelspar.
    
    Args:
        original: Felstavat ord
        corrected: Korrekt stavning
        context: Kontext
        confidence: Säkerhet
        
    Returns:
        True om sparning lyckades
    """
    dataset = get_stavfel_dataset()
    return dataset.save_pair(original, corrected, context, "user_input", confidence)


if __name__ == "__main__":
    # Test
    dataset = StavfelDataset()
    
    print("=" * 60)
    print("ONESEEK Δ+ Stavfel Dataset Test")
    print("=" * 60)
    
    # Spara några testpar
    test_pairs = [
        ("stockhlom", "stockholm", "Hur är vädret i Stockhlom?"),
        ("götborg", "göteborg", "Vad händer i götborg?"),
        ("beflkning", "befolkning", "Hur stor är beflkningen?"),
    ]
    
    for original, corrected, context in test_pairs:
        success = dataset.save_pair(original, corrected, context, confidence=0.9)
        print(f"Sparade: {original} → {corrected} | OK: {success}")
    
    # Visa statistik
    print("\n" + "=" * 60)
    print("Dataset statistik:")
    print(dataset.get_stats())
