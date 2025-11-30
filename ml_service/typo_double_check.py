"""
Typo Double Check for ONESEEK Δ+
Dubbel stavfelssäkerhet: Regel-baserad + AI-baserad stavningskontroll

Funktionalitet:
- Regelbaserad kontroll med svenska ordlistor
- Fuzzy matching för förslag
- Loggar stavfel till dataset för träning
- Hybrid-autocorrect med AI-personlighet

Author: ONESEEK Team
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from difflib import SequenceMatcher, get_close_matches

# Paths
DATA_DIR = Path(__file__).parent.parent / "datasets"
TYPO_PAIRS_FILE = DATA_DIR / "typo_pairs_swedish.jsonl"
SWEDISH_WORDLIST_FILE = Path(__file__).parent.parent / "config" / "swedish_wordlist.txt"


@dataclass
class SpellingResult:
    """Resultat från stavningskontroll."""
    original: str
    corrected: str
    is_correct: bool
    suggestions: List[str]
    confidence: float
    method: str  # "rule", "fuzzy", "dictionary"


class SwedishDictionary:
    """
    Enkel svensk ordlista för stavningskontroll.
    Använder inbyggd ordlista + laddbar fil.
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
                print(f"[TYPO] Warning: Could not load wordlist: {e}")
        
        # Lägg till vanliga svenska ord som fallback
        common_words = {
            # Vanliga ord
            "och", "i", "att", "det", "som", "en", "på", "är", "av", "för",
            "med", "till", "den", "har", "de", "inte", "om", "ett", "men", "var",
            "jag", "du", "han", "hon", "vi", "ni", "kan", "ska", "vill", "måste",
            "hej", "tack", "ja", "nej", "vad", "hur", "när", "var", "vem", "varför",
            
            # Frågeord och prepositioner
            "vädret", "väder", "befolkning", "invånare", "nyheter", "aktuellt",
            "stockholm", "göteborg", "malmö", "uppsala", "linköping",
            
            # Månader och dagar
            "januari", "februari", "mars", "april", "maj", "juni",
            "juli", "augusti", "september", "oktober", "november", "december",
            "måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag",
            
            # Vanliga verb
            "är", "var", "vara", "har", "hade", "ha", "gör", "gjorde", "göra",
            "kommer", "kom", "komma", "går", "gick", "gå", "ser", "såg", "se",
            
            # Adjektiv
            "stor", "liten", "ny", "gammal", "bra", "dålig", "fin", "ful",
            "vacker", "rolig", "tråkig", "snabb", "långsam", "hög", "låg",
        }
        
        words.update(common_words)
        return words
    
    def check(self, word: str) -> bool:
        """Kontrollera om ord finns i ordlistan."""
        return word.lower() in self.words
    
    def suggest(self, word: str, max_suggestions: int = 5) -> List[str]:
        """Hitta liknande ord som förslag."""
        word_lower = word.lower()
        
        # Använd difflib för att hitta närmaste matchningar
        matches = get_close_matches(word_lower, self.words, n=max_suggestions, cutoff=0.6)
        return matches


class TypoLogger:
    """
    Loggar stavfel till dataset för framtida träning.
    """
    
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
        """
        Logga ett stavfel till dataset.
        
        Args:
            original: Det felstavade ordet
            corrected: Den korrekta stavningen
            context: Hela meningen för kontext
            source: Källan till felet
            
        Returns:
            True om loggning lyckades
        """
        try:
            entry = {
                "original": original,
                "corrected": corrected,
                "context": context,
                "source": source,
                "timestamp": self._get_timestamp()
            }
            
            with open(self.output_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
            return True
        except Exception as e:
            print(f"[TYPO] Error logging typo: {e}")
            return False
    
    def _get_timestamp(self) -> str:
        """Hämta aktuell tidsstämpel."""
        return datetime.now().isoformat()
    
    def get_logged_typos(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Hämta loggade stavfel."""
        typos = []
        try:
            with open(self.output_file, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        typos.append(json.loads(line))
                    if len(typos) >= limit:
                        break
        except Exception as e:
            print(f"[TYPO] Error reading typos: {e}")
        
        return typos


class TypoDoubleCheck:
    """
    Dubbel stavningskontroll för ONESEEK Δ+.
    
    Kombinerar:
    1. Regelbaserad kontroll med svensk ordlista
    2. Fuzzy matching för förslag
    3. Kontextuell analys
    """
    
    def __init__(self):
        self.dictionary = SwedishDictionary()
        self.logger = TypoLogger()
        self.common_typos = self._load_common_typos()
    
    def _load_common_typos(self) -> Dict[str, str]:
        """Ladda vanliga svenska stavfel."""
        return {
            # Vanliga fel
            "jga": "jag",
            "dne": "den",
            "ochc": "och",
            "detär": "det är",
            "hurär": "hur är",
            "vadär": "vad är",
            "stockhlom": "stockholm",
            "stokholm": "stockholm",
            "götborg": "göteborg",
            "malmø": "malmö",
            "uppsal": "uppsala",
            
            # Tangentbordsfel (QWERTY)
            "väddret": "vädret",
            "beflkning": "befolkning",
            "nhyeter": "nyheter",
            "temprratur": "temperatur",
            "invnare": "invånare",
            
            # Fonetiska fel
            "igår": "igår",  # Korrekt
            "igar": "igår",
            "imorrn": "imorgon",
            "imorron": "imorgon",
            
            # Dubbelbokstäver
            "meddelanda": "meddelande",
            "nnyhet": "nyhet",
            "vväder": "väder",
        }
    
    def check_word(self, word: str) -> SpellingResult:
        """
        Kontrollera stavning av ett enskilt ord.
        
        Args:
            word: Ordet att kontrollera
            
        Returns:
            SpellingResult med korrigering och förslag
        """
        word_lower = word.lower()
        
        # 1. Kontrollera om det är ett känt stavfel
        if word_lower in self.common_typos:
            corrected = self.common_typos[word_lower]
            return SpellingResult(
                original=word,
                corrected=corrected,
                is_correct=False,
                suggestions=[corrected],
                confidence=0.95,
                method="common_typo"
            )
        
        # 2. Kontrollera mot ordlista
        if self.dictionary.check(word_lower):
            return SpellingResult(
                original=word,
                corrected=word,
                is_correct=True,
                suggestions=[],
                confidence=1.0,
                method="dictionary"
            )
        
        # 3. Hitta förslag via fuzzy matching
        suggestions = self.dictionary.suggest(word_lower)
        
        if suggestions:
            best_suggestion = suggestions[0]
            # Beräkna likhet
            similarity = SequenceMatcher(None, word_lower, best_suggestion).ratio()
            
            return SpellingResult(
                original=word,
                corrected=best_suggestion,
                is_correct=False,
                suggestions=suggestions,
                confidence=similarity,
                method="fuzzy"
            )
        
        # 4. Okänt ord - kan vara namn eller term
        return SpellingResult(
            original=word,
            corrected=word,
            is_correct=True,  # Antar korrekt om inget förslag
            suggestions=[],
            confidence=0.5,
            method="unknown"
        )
    
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
        # Dela upp i ord (behåll skiljetecken)
        words = re.findall(r'\b\w+\b|\W+', text)
        
        results = []
        corrected_words = []
        errors_found = 0
        
        for word in words:
            # Hoppa över icke-alfanumeriska
            if not re.match(r'\w+', word):
                corrected_words.append(word)
                continue
            
            # Hoppa över siffror
            if word.isdigit():
                corrected_words.append(word)
                continue
            
            result = self.check_word(word)
            
            if not result.is_correct:
                errors_found += 1
                
                # Logga fel
                if log_errors and result.confidence > 0.7:
                    self.logger.log_typo(
                        original=word,
                        corrected=result.corrected,
                        context=text[:100]
                    )
            
            results.append(result)
            
            # Använd korrigerat eller original
            if auto_correct and not result.is_correct and result.confidence > 0.7:
                # Behåll versaler om ursprungliga ordet hade det
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
            "auto_corrected": auto_correct
        }
    
    def suggest_corrections(self, text: str) -> List[Dict[str, Any]]:
        """
        Ge korrigeringsförslag utan att ändra texten.
        
        Args:
            text: Texten att analysera
            
        Returns:
            Lista med förslag
        """
        result = self.check_text(text, auto_correct=False, log_errors=False)
        
        suggestions = []
        for word_result in result["word_results"]:
            if not word_result["is_correct"]:
                suggestions.append({
                    "original": word_result["original"],
                    "suggestion": word_result["corrected"],
                    "confidence": word_result["confidence"],
                    "alternatives": word_result["suggestions"]
                })
        
        return suggestions
    
    def add_to_dictionary(self, word: str) -> bool:
        """
        Lägg till ord i ordlistan.
        
        Args:
            word: Ordet att lägga till
            
        Returns:
            True om tillägg lyckades
        """
        self.dictionary.words.add(word.lower())
        
        # Spara till fil om möjligt
        try:
            with open(SWEDISH_WORDLIST_FILE, 'a', encoding='utf-8') as f:
                f.write(word.lower() + "\n")
            return True
        except Exception:
            return True  # Tillagt i minnet även om filskrivning misslyckades
    
    def add_common_typo(self, typo: str, correction: str) -> bool:
        """
        Lägg till vanligt stavfel.
        
        Args:
            typo: Det felstavade ordet
            correction: Korrekt stavning
            
        Returns:
            True om tillägg lyckades
        """
        self.common_typos[typo.lower()] = correction.lower()
        return True


# Global instance
_typo_checker: Optional[TypoDoubleCheck] = None


def get_typo_checker() -> TypoDoubleCheck:
    """Hämta global TypoDoubleCheck-instans."""
    global _typo_checker
    if _typo_checker is None:
        _typo_checker = TypoDoubleCheck()
    return _typo_checker


def check_spelling(text: str, auto_correct: bool = False) -> Dict[str, Any]:
    """
    Bekväm funktion för stavningskontroll.
    
    Args:
        text: Texten att kontrollera
        auto_correct: Om True, returnera korrigerad text
        
    Returns:
        Resultat med korrigeringar
    """
    checker = get_typo_checker()
    return checker.check_text(text, auto_correct=auto_correct)


if __name__ == "__main__":
    # Test
    checker = TypoDoubleCheck()
    
    test_texts = [
        "Hur är vädret i Stockhlom?",
        "Vad är beflkningen i Götborg?",
        "Jga vill veta mer om nhyeter",
        "Det regnar igar i Malmö",
        "Korrekt svenska mening utan fel",
    ]
    
    print("=" * 60)
    print("ONESEEK Δ+ Typo Double Check Test")
    print("=" * 60)
    
    for text in test_texts:
        result = checker.check_text(text, auto_correct=True)
        print(f"\nOriginal:  {result['original']}")
        print(f"Corrected: {result['corrected']}")
        print(f"Errors:    {result['errors_found']}")
        
        suggestions = checker.suggest_corrections(text)
        if suggestions:
            print(f"Suggestions: {suggestions}")
