"""
Typo Checker for ONESEEK Δ+
Hybrid stavningskontroll: LanguageTool (primär) + lokal fallback

Ersätter typo_double_check.py med LanguageTool-integration.

Funktionalitet:
- LanguageTool för kontextmedveten stavningskontroll
- Lokal ordlista som fallback om servern är nere
- AI-personlig prompt för korrigeringsförslag
- Loggar stavfel till dataset för träning

Author: ONESEEK Team
"""

import json
import logging
from dataclasses import asdict, dataclass
from datetime import datetime
from difflib import SequenceMatcher, get_close_matches
from pathlib import Path
from typing import Any, Dict, List, Optional

# Setup logging
logger = logging.getLogger(__name__)

# Paths
DATA_DIR = Path(__file__).parent.parent / "datasets"
TYPO_PAIRS_FILE = DATA_DIR / "typo_pairs_swedish.jsonl"
SWEDISH_WORDLIST_FILE = Path(__file__).parent.parent / "config" / "swedish_wordlist.txt"

# Försök importera LanguageTool-klienten
try:
    from .language_tool import (
        check_text as lt_check_text,
        is_server_available as lt_is_available,
        get_server_status as lt_get_status
    )
    LANGUAGETOOL_AVAILABLE = True
except ImportError:
    try:
        from language_tool import (
            check_text as lt_check_text,
            is_server_available as lt_is_available,
            get_server_status as lt_get_status
        )
        LANGUAGETOOL_AVAILABLE = True
    except ImportError:
        LANGUAGETOOL_AVAILABLE = False
        lt_check_text = None
        lt_is_available = None
        lt_get_status = None


@dataclass
class SpellingResult:
    """Resultat från stavningskontroll."""
    original: str
    corrected: str
    is_correct: bool
    suggestions: List[str]
    confidence: float
    method: str  # "languagetool", "dictionary", "fuzzy", "whitelist"


class SwedishDictionary:
    """
    Enkel svensk ordlista för fallback-stavningskontroll.
    """
    
    def __init__(self):
        self.words = self._load_dictionary()
    
    def _load_dictionary(self) -> set:
        """Ladda ordlista."""
        words = set()
        
        # Ladda från fil om den finns
        if SWEDISH_WORDLIST_FILE.exists():
            try:
                with open(SWEDISH_WORDLIST_FILE, 'r', encoding='utf-8') as f:
                    for line in f:
                        word = line.strip().lower()
                        if word:
                            words.add(word)
            except Exception as e:
                logger.warning(f"Could not load wordlist: {e}")
        
        # Lägg till vanliga svenska ord som fallback
        common_words = {
            # Vanliga ord
            "och", "i", "att", "det", "som", "en", "på", "är", "av", "för",
            "med", "till", "den", "har", "de", "inte", "om", "ett", "men", "var",
            "jag", "du", "han", "hon", "vi", "ni", "kan", "ska", "vill", "måste",
            "hej", "tack", "ja", "nej", "vad", "hur", "när", "var", "vem", "varför",
            "bor", "finns", "ligger", "heter",
            "idag", "igår", "imorgon", "nu", "då",
            
            # Svenska orter
            "stockholm", "göteborg", "malmö", "uppsala", "linköping",
            "hjo", "tibro", "skara", "mariestad",
            
            # Väder
            "väder", "vädret", "regn", "sol", "snö", "temperatur",
            
            # Vanliga verb
            "är", "var", "vara", "har", "hade", "ha", "gör", "göra",
        }
        
        words.update(common_words)
        return words
    
    def check(self, word: str) -> bool:
        """Kontrollera om ord finns i ordlistan."""
        return word.lower() in self.words
    
    def suggest(self, word: str, max_suggestions: int = 5) -> List[str]:
        """Hitta liknande ord som förslag."""
        word_lower = word.lower()
        cutoff = 0.85 if len(word_lower) <= 4 else 0.8
        matches = get_close_matches(word_lower, self.words, n=max_suggestions, cutoff=cutoff)
        return matches


class TypoLogger:
    """Loggar stavfel till dataset för framtida träning."""
    
    def __init__(self, output_file: Optional[Path] = None):
        self.output_file = output_file or TYPO_PAIRS_FILE
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Skapa fil om den inte finns."""
        self.output_file.parent.mkdir(parents=True, exist_ok=True)
        if not self.output_file.exists():
            self.output_file.touch()
    
    def log_typo(self, original: str, corrected: str, context: str = "",
                 source: str = "user_input") -> bool:
        """Logga ett stavfel till dataset."""
        try:
            entry = {
                "original": original,
                "corrected": corrected,
                "context": context,
                "source": source,
                "timestamp": datetime.now().isoformat()
            }
            
            with open(self.output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
            return True
        except Exception as e:
            logger.warning(f"Error logging typo: {e}")
            return False


class TypoChecker:
    """
    Hybrid stavningskontroll för ONESEEK Δ+.
    
    Prioritetsordning:
    1. LanguageTool (om tillgänglig) - kontextmedveten
    2. Lokal ordlista - snabb fallback
    3. Fuzzy matching - sista utväg
    """
    
    # Absolut whitelist - dessa ord ska ALDRIG korrigeras
    WHITELIST = {
        "bor", "i", "och", "att", "det", "med", "på", "för", "av", "en", "ett",
        "är", "var", "har", "hur", "vad", "när", "var", "vem", "den", "de", "du",
        "han", "hon", "vi", "ni", "jag", "sig", "sin", "som", "om", "till", "kan",
        "hjo", "tibro", "skara", "mariestad",  # Svenska orter
    }
    
    # Vanliga svenska stavfel
    COMMON_TYPOS = {
        "väddret": "vädret",
        "imorn": "imorgon",
        "imorron": "imorgon",
        "stockhlom": "stockholm",
        "stokholm": "stockholm",
        "götborg": "göteborg",
        "beflkning": "befolkning",
        "invnare": "invånare",
        "nhyeter": "nyheter",
    }
    
    def __init__(self):
        self.dictionary = SwedishDictionary()
        self.logger = TypoLogger()
        self._languagetool_checked = False
        self._languagetool_available = False
    
    def _check_languagetool(self) -> bool:
        """Kontrollera om LanguageTool är tillgänglig."""
        if not self._languagetool_checked:
            self._languagetool_checked = True
            if LANGUAGETOOL_AVAILABLE and lt_is_available:
                self._languagetool_available = lt_is_available()
                if self._languagetool_available:
                    logger.info("✅ LanguageTool server is available")
                else:
                    logger.warning("⚠️ LanguageTool server is not available, using fallback")
            else:
                logger.warning("⚠️ LanguageTool module not available, using fallback")
        return self._languagetool_available
    
    def check_text(self, text: str, auto_correct: bool = False,
                   log_errors: bool = True) -> Dict[str, Any]:
        """
        Kontrollera stavning i en hel text.
        
        Args:
            text: Texten att kontrollera
            auto_correct: Om True, returnera korrigerad text
            log_errors: Om True, logga fel till dataset
            
        Returns:
            Dict med resultat och korrigeringar
        """
        if not text or not text.strip():
            return {
                "original": text,
                "corrected": text,
                "is_correct": True,
                "errors_found": 0,
                "word_results": [],
                "method": "empty"
            }
        
        # Försök med LanguageTool först
        if self._check_languagetool() and lt_check_text:
            try:
                lt_result = lt_check_text(text)
                
                if lt_result.get("server_available", False):
                    corrected = lt_result.get("corrected", text)
                    is_correct = lt_result.get("is_correct", True)
                    matches = lt_result.get("matches", [])
                    
                    # Logga fel om begärt
                    if log_errors and not is_correct:
                        for match in matches:
                            if match.get("replacements"):
                                original_word = text[match["offset"]:match["offset"] + match["length"]]
                                self.logger.log_typo(
                                    original=original_word,
                                    corrected=match["replacements"][0],
                                    context=text[:100],
                                    source="languagetool"
                                )
                    
                    return {
                        "original": text,
                        "corrected": corrected if auto_correct else text,
                        "is_correct": is_correct,
                        "errors_found": len(matches),
                        "word_results": [
                            {
                                "original": text[m["offset"]:m["offset"] + m["length"]],
                                "corrected": m["replacements"][0] if m["replacements"] else None,
                                "is_correct": False,
                                "suggestions": m["replacements"][:5],
                                "confidence": 0.95,
                                "method": "languagetool"
                            }
                            for m in matches
                        ],
                        "method": "languagetool"
                    }
            except Exception as e:
                logger.warning(f"LanguageTool check failed: {e}")
        
        # Fallback till lokal kontroll
        return self._check_text_local(text, auto_correct, log_errors)
    
    def _check_text_local(self, text: str, auto_correct: bool,
                          log_errors: bool) -> Dict[str, Any]:
        """Lokal stavningskontroll (fallback)."""
        import re
        
        words = re.findall(r'\b\w+\b|\W+', text)
        results = []
        corrected_words = []
        errors_found = 0
        
        for word in words:
            if not re.match(r'\w+', word):
                corrected_words.append(word)
                continue
            
            if word.isdigit():
                corrected_words.append(word)
                continue
            
            result = self._check_word(word)
            
            if not result.is_correct:
                errors_found += 1
                
                if log_errors and result.confidence > 0.7:
                    self.logger.log_typo(
                        original=word,
                        corrected=result.corrected,
                        context=text[:100]
                    )
            
            results.append(result)
            
            if auto_correct and not result.is_correct and result.confidence > 0.7:
                corrected = result.corrected
                if word[0].isupper():
                    corrected = corrected.capitalize()
                corrected_words.append(corrected)
            else:
                corrected_words.append(word)
        
        corrected_text = ''.join(corrected_words)
        
        return {
            "original": text,
            "corrected": corrected_text,
            "is_correct": errors_found == 0,
            "errors_found": errors_found,
            "word_results": [asdict(r) for r in results],
            "method": "local_fallback"
        }
    
    def _check_word(self, word: str) -> SpellingResult:
        """Kontrollera stavning av ett enskilt ord."""
        word_lower = word.lower()
        
        # Whitelist
        if word_lower in self.WHITELIST:
            return SpellingResult(
                original=word,
                corrected=word,
                is_correct=True,
                suggestions=[],
                confidence=1.0,
                method="whitelist"
            )
        
        # Korta ord
        if len(word) <= 2:
            return SpellingResult(
                original=word,
                corrected=word,
                is_correct=True,
                suggestions=[],
                confidence=1.0,
                method="too_short"
            )
        
        # Kända stavfel
        if word_lower in self.COMMON_TYPOS:
            corrected = self.COMMON_TYPOS[word_lower]
            return SpellingResult(
                original=word,
                corrected=corrected,
                is_correct=False,
                suggestions=[corrected],
                confidence=0.95,
                method="common_typo"
            )
        
        # Ordlista
        if self.dictionary.check(word_lower):
            return SpellingResult(
                original=word,
                corrected=word,
                is_correct=True,
                suggestions=[],
                confidence=1.0,
                method="dictionary"
            )
        
        # Egennamn (börjar med versal)
        if word[0].isupper():
            return SpellingResult(
                original=word,
                corrected=word,
                is_correct=True,
                suggestions=[],
                confidence=0.8,
                method="proper_noun"
            )
        
        # Fuzzy matching
        if len(word) > 4:
            suggestions = self.dictionary.suggest(word_lower)
            if suggestions:
                similarity = SequenceMatcher(None, word_lower, suggestions[0]).ratio()
                if similarity >= 0.85:
                    return SpellingResult(
                        original=word,
                        corrected=suggestions[0],
                        is_correct=False,
                        suggestions=suggestions,
                        confidence=similarity,
                        method="fuzzy"
                    )
        
        # Okänt ord
        return SpellingResult(
            original=word,
            corrected=word,
            is_correct=True,
            suggestions=[],
            confidence=0.5,
            method="unknown"
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Hämta status för typo checker."""
        lt_status = None
        if LANGUAGETOOL_AVAILABLE and lt_get_status:
            try:
                lt_status = lt_get_status()
            except Exception:
                lt_status = {"status": "error"}
        
        return {
            "languagetool_available": self._check_languagetool(),
            "languagetool_status": lt_status,
            "fallback_ready": True,
            "dictionary_words": len(self.dictionary.words),
            "common_typos": len(self.COMMON_TYPOS),
            "whitelist_words": len(self.WHITELIST)
        }


# Global instans
_typo_checker: Optional[TypoChecker] = None


def get_typo_checker() -> TypoChecker:
    """Hämta global TypoChecker-instans."""
    global _typo_checker
    if _typo_checker is None:
        _typo_checker = TypoChecker()
    return _typo_checker


def check_spelling(text: str, auto_correct: bool = False, debug: bool = False) -> Dict[str, Any]:
    """
    Bekväm funktion för stavningskontroll.
    
    Args:
        text: Texten att kontrollera
        auto_correct: Om True, returnera korrigerad text
        debug: Om True, visa detaljerad debug-info
        
    Returns:
        Resultat med korrigeringar
    """
    checker = get_typo_checker()
    result = checker.check_text(text, auto_correct=auto_correct)
    
    if debug:
        print(f"\n✏️ TYPO CHECKER DEBUG")
        print(f"   Method: {result.get('method', 'unknown')}")
        print(f"   Original: \"{text[:60]}{'...' if len(text) > 60 else ''}\"")
        print(f"   Corrected: \"{result.get('corrected', text)[:60]}\"")
        print(f"   Errors: {result.get('errors_found', 0)}")
    
    return result


def get_checker_status() -> Dict[str, Any]:
    """Hämta status för typo checker."""
    return get_typo_checker().get_status()


if __name__ == "__main__":
    print("=" * 60)
    print("ONESEEK Δ+ Typo Checker Test")
    print("=" * 60)
    
    checker = TypoChecker()
    
    # Visa status
    status = checker.get_status()
    print(f"\nStatus: {json.dumps(status, indent=2)}")
    
    # Testa stavningskontroll
    test_texts = [
        "Vad är väddret i Hjo imorn?",
        "Hur många bor i Stockhlom?",
        "Det regnar mycket igar.",
        "Detta är en korrekt svensk mening."
    ]
    
    for text in test_texts:
        result = checker.check_text(text, auto_correct=True)
        print(f"\n{'='*40}")
        print(f"Original:  {result['original']}")
        print(f"Corrected: {result['corrected']}")
        print(f"Method:    {result['method']}")
        print(f"Errors:    {result['errors_found']}")
