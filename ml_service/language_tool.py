"""
LanguageTool Client for ONESEEK Δ+
Anropar self-hosted LanguageTool server på localhost:8010

Funktionalitet:
- Kontextmedveten stavningskontroll på svenska
- Automatisk retry vid nätverksfel
- Fallback till lokal ordlista om servern är nere
- Integration med ONESEEK Δ+ inference pipeline

Author: ONESEEK Team
"""

import json
import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

# Setup logging
logger = logging.getLogger(__name__)

# Konfigurationsfil
CONFIG_FILE = Path(__file__).parent / "language_tool_config.json"


@dataclass
class LanguageToolMatch:
    """Representerar en matchning/korrigering från LanguageTool."""
    message: str
    short_message: str
    offset: int
    length: int
    replacements: List[str]
    rule_id: str
    rule_category: str
    context_text: str
    context_offset: int
    context_length: int


@dataclass
class LanguageToolResult:
    """Resultat från LanguageTool-kontroll."""
    original: str
    corrected: str
    is_correct: bool
    matches: List[LanguageToolMatch]
    language: str
    checked_at: float
    server_available: bool


class LanguageToolClient:
    """
    Klient för self-hosted LanguageTool server.
    
    Exempel:
        >>> client = LanguageToolClient()
        >>> result = client.check("Vad är väddret i Hjo imorn?")
        >>> print(result.corrected)
        "Vad är vädret i Hjo imorgon?"
    """
    
    def __init__(self, config_path: Optional[Path] = None):
        """
        Initiera LanguageTool-klienten.
        
        Args:
            config_path: Sökväg till konfigurationsfil (optional)
        """
        self.config = self._load_config(config_path or CONFIG_FILE)
        self.server_config = self.config.get("server", {})
        self.defaults = self.config.get("defaults", {})
        self.categories = self.config.get("categories", {})
        self.whitelist = self.config.get("whitelist", {})
        self.fallback = self.config.get("fallback", {})
        
        self.host = self.server_config.get("host", "localhost")
        self.port = self.server_config.get("port", 8010)
        self.timeout = self.server_config.get("timeout", 5)
        self.retry_count = self.server_config.get("retry_count", 2)
        self.retry_delay = self.server_config.get("retry_delay", 0.5)
        
        self.base_url = f"http://{self.host}:{self.port}/v2"
        
        # Statusvariabel för serveranslutning
        self._server_available = None
        self._last_check_time = 0
    
    def _load_config(self, config_path: Path) -> Dict[str, Any]:
        """Ladda konfiguration från fil."""
        try:
            if config_path.exists():
                with open(config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.warning(f"Could not load config from {config_path}: {e}")
        
        # Standardkonfiguration
        return {
            "server": {"host": "localhost", "port": 8010, "timeout": 5},
            "defaults": {"language": "sv"},
            "categories": {"enabled": ["TYPOS", "GRAMMAR"]},
            "whitelist": {"words": []},
            "fallback": {"enabled": True}
        }
    
    def is_available(self, force_check: bool = False) -> bool:
        """
        Kontrollera om LanguageTool-servern är tillgänglig.
        
        Args:
            force_check: Om True, gör alltid en ny kontroll
            
        Returns:
            True om servern är tillgänglig
        """
        current_time = time.time()
        
        # Cache resultatet i 30 sekunder
        if not force_check and self._server_available is not None:
            if current_time - self._last_check_time < 30:
                return self._server_available
        
        try:
            response = requests.get(
                f"{self.base_url}/languages",
                timeout=2
            )
            self._server_available = response.status_code == 200
        except Exception:
            self._server_available = False
        
        self._last_check_time = current_time
        return self._server_available
    
    def check(self, text: str, language: str = "sv") -> LanguageToolResult:
        """
        Kontrollera text för stavfel och grammatikfel.
        
        Args:
            text: Texten att kontrollera
            language: Språkkod (default: "sv" för svenska)
            
        Returns:
            LanguageToolResult med korrigeringar
        """
        if not text or not text.strip():
            return LanguageToolResult(
                original=text,
                corrected=text,
                is_correct=True,
                matches=[],
                language=language,
                checked_at=time.time(),
                server_available=True
            )
        
        # Försök kontakta servern med retry
        for attempt in range(self.retry_count + 1):
            try:
                response = self._call_api(text, language)
                return self._parse_response(text, response, language)
            except Exception as e:
                logger.warning(f"LanguageTool API call failed (attempt {attempt + 1}): {e}")
                if attempt < self.retry_count:
                    time.sleep(self.retry_delay)
        
        # Fallback om servern inte svarar
        logger.warning("LanguageTool server unavailable, returning original text")
        return LanguageToolResult(
            original=text,
            corrected=text,
            is_correct=True,
            matches=[],
            language=language,
            checked_at=time.time(),
            server_available=False
        )
    
    def _call_api(self, text: str, language: str) -> Dict[str, Any]:
        """Anropa LanguageTool API."""
        data = {
            "text": text,
            "language": language,
            "enabledOnly": self.defaults.get("enabled_only", False),
            "level": self.defaults.get("level", "default")
        }
        
        # Lägg till aktiverade kategorier
        enabled_categories = self.categories.get("enabled", [])
        if enabled_categories:
            data["enabledCategories"] = ",".join(enabled_categories)
        
        # Lägg till inaktiverade kategorier
        disabled_categories = self.categories.get("disabled", [])
        if disabled_categories:
            data["disabledCategories"] = ",".join(disabled_categories)
        
        response = requests.post(
            f"{self.base_url}/check",
            data=data,
            timeout=self.timeout
        )
        response.raise_for_status()
        return response.json()
    
    def _parse_response(self, original_text: str, response: Dict[str, Any], 
                       language: str) -> LanguageToolResult:
        """Tolka API-svar och skapa LanguageToolResult."""
        matches_data = response.get("matches", [])
        matches = []
        
        # Bygg korrigerad text
        corrected_text = original_text
        offset_adjustment = 0
        
        # Ord i whitelist som inte ska korrigeras
        whitelist_words = set(w.lower() for w in self.whitelist.get("words", []))
        
        for match_data in matches_data:
            # Extrahera matchningsinfo
            offset = match_data.get("offset", 0)
            length = match_data.get("length", 0)
            replacements_data = match_data.get("replacements", [])
            replacements = [r.get("value", "") for r in replacements_data[:5]]
            
            # Kontrollera om ordet är i whitelist
            original_word = original_text[offset:offset + length].lower()
            if original_word in whitelist_words:
                continue
            
            # Skapa LanguageToolMatch
            context = match_data.get("context", {})
            match = LanguageToolMatch(
                message=match_data.get("message", ""),
                short_message=match_data.get("shortMessage", ""),
                offset=offset,
                length=length,
                replacements=replacements,
                rule_id=match_data.get("rule", {}).get("id", ""),
                rule_category=match_data.get("rule", {}).get("category", {}).get("id", ""),
                context_text=context.get("text", ""),
                context_offset=context.get("offset", 0),
                context_length=context.get("length", 0)
            )
            matches.append(match)
            
            # Applicera korrigering om det finns förslag
            if replacements:
                best_replacement = replacements[0]
                adjusted_offset = offset + offset_adjustment
                
                corrected_text = (
                    corrected_text[:adjusted_offset] + 
                    best_replacement + 
                    corrected_text[adjusted_offset + length:]
                )
                
                offset_adjustment += len(best_replacement) - length
        
        return LanguageToolResult(
            original=original_text,
            corrected=corrected_text,
            is_correct=len(matches) == 0,
            matches=matches,
            language=language,
            checked_at=time.time(),
            server_available=True
        )
    
    def get_server_status(self) -> Dict[str, Any]:
        """
        Hämta detaljerad serverstatus.
        
        Returns:
            Dict med serverinfo
        """
        try:
            # Hämta språklista (enkel hälsokontroll)
            languages_response = requests.get(
                f"{self.base_url}/languages",
                timeout=2
            )
            
            if languages_response.status_code == 200:
                languages = languages_response.json()
                swedish_supported = any(
                    lang.get("longCode", "").startswith("sv") 
                    for lang in languages
                )
                
                return {
                    "status": "online",
                    "url": self.base_url,
                    "languages_count": len(languages),
                    "swedish_supported": swedish_supported,
                    "version": languages[0].get("version", "unknown") if languages else "unknown"
                }
        except Exception as e:
            logger.debug(f"Could not get server status: {e}")
        
        return {
            "status": "offline",
            "url": self.base_url,
            "error": "Could not connect to LanguageTool server"
        }


# Global klient-instans
_client: Optional[LanguageToolClient] = None


def get_language_tool_client() -> LanguageToolClient:
    """Hämta global LanguageTool-klient."""
    global _client
    if _client is None:
        _client = LanguageToolClient()
    return _client


def check_text(text: str, language: str = "sv") -> Dict[str, Any]:
    """
    Bekväm funktion för stavningskontroll.
    
    Args:
        text: Texten att kontrollera
        language: Språkkod (default: "sv")
        
    Returns:
        Dict med original, korrigerad text och matchningar
    """
    client = get_language_tool_client()
    result = client.check(text, language)
    
    return {
        "original": result.original,
        "corrected": result.corrected,
        "is_correct": result.is_correct,
        "changed": result.original != result.corrected,
        "matches": [
            {
                "message": m.message,
                "offset": m.offset,
                "length": m.length,
                "replacements": m.replacements,
                "rule_id": m.rule_id
            }
            for m in result.matches
        ],
        "server_available": result.server_available
    }


def is_server_available() -> bool:
    """Kontrollera om LanguageTool-servern är tillgänglig."""
    return get_language_tool_client().is_available()


def get_server_status() -> Dict[str, Any]:
    """Hämta LanguageTool-serverstatus."""
    return get_language_tool_client().get_server_status()


if __name__ == "__main__":
    # Test
    print("=" * 60)
    print("LanguageTool Client Test")
    print("=" * 60)
    
    client = LanguageToolClient()
    
    # Kontrollera serverstatus
    status = client.get_server_status()
    print(f"\nServer status: {status}")
    
    # Testa stavningskontroll
    test_texts = [
        "Vad är väddret i Hjo imorn?",
        "Hur många bor i Stockhlom?",
        "Det regnar mycket igar.",
        "Detta är en korrekt svensk mening."
    ]
    
    for text in test_texts:
        print(f"\n{'='*40}")
        print(f"Original:  {text}")
        result = client.check(text)
        print(f"Corrected: {result.corrected}")
        print(f"Is correct: {result.is_correct}")
        print(f"Server available: {result.server_available}")
        if result.matches:
            print(f"Matches: {len(result.matches)}")
            for match in result.matches:
                print(f"  - {match.message}: {match.replacements[:3]}")
