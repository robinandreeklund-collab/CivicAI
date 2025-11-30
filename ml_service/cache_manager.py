"""
Cache Manager for ONESEEK Δ+
Hash-baserad cache med 7-dagars TTL och blockchain-hash

Funktionalitet:
- In-memory och fil-baserad cache
- TTL (Time-To-Live) support
- Blockchain-style hash-verifiering
- Admin-styrbar cache-hantering

Author: ONESEEK Team
"""

import json
import hashlib
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional, Any, List
from dataclasses import dataclass, asdict
import threading

# Configuration
CACHE_DIR = Path(__file__).parent.parent / "cache"
DEFAULT_TTL_DAYS = 7


@dataclass
class CacheEntry:
    """Representerar en cache-post."""
    key: str
    value: Any
    created_at: str
    expires_at: str
    content_hash: str
    access_count: int = 0
    last_accessed: Optional[str] = None


class CacheManager:
    """
    Hash-baserad cache-manager för ONESEEK Δ+.
    
    Funktioner:
    - In-memory cache med TTL
    - Fil-baserad persistence
    - Blockchain-style hash för integritet
    - Thread-safe operationer
    """
    
    def __init__(
        self,
        cache_dir: Optional[Path] = None,
        ttl_days: int = DEFAULT_TTL_DAYS,
        max_entries: int = 10000
    ):
        """
        Initialisera CacheManager.
        
        Args:
            cache_dir: Katalog för cache-filer
            ttl_days: Standardlivstid i dagar
            max_entries: Max antal poster i minnet
        """
        self.cache_dir = cache_dir or CACHE_DIR
        self.ttl_days = ttl_days
        self.max_entries = max_entries
        
        # In-memory cache
        self._cache: Dict[str, CacheEntry] = {}
        self._lock = threading.RLock()
        
        # Ensure cache directory exists
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Load existing cache
        self._load_from_disk()
    
    def _compute_hash(self, data: Any) -> str:
        """
        Beräkna SHA-256 hash för data.
        
        Args:
            data: Data att hasha
            
        Returns:
            SHA-256 hash som hex-sträng
        """
        if isinstance(data, dict):
            json_str = json.dumps(data, sort_keys=True, ensure_ascii=False)
        elif isinstance(data, str):
            json_str = data
        else:
            json_str = str(data)
        
        return hashlib.sha256(json_str.encode('utf-8')).hexdigest()
    
    def _compute_key_hash(self, key: str) -> str:
        """
        Beräkna hash för cache-nyckel (för filnamn).
        
        Args:
            key: Cache-nyckel
            
        Returns:
            Kort hash för filnamn
        """
        return hashlib.md5(key.encode('utf-8')).hexdigest()[:16]
    
    def _get_expiry_time(self, ttl_days: Optional[int] = None) -> datetime:
        """Beräkna utgångstid."""
        days = ttl_days if ttl_days is not None else self.ttl_days
        return datetime.now(timezone.utc) + timedelta(days=days)
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Kontrollera om entry har gått ut."""
        expires_at = datetime.fromisoformat(entry.expires_at.replace('Z', '+00:00'))
        return datetime.now(timezone.utc) > expires_at
    
    def set(
        self,
        key: str,
        value: Any,
        ttl_days: Optional[int] = None,
        persist: bool = True
    ) -> CacheEntry:
        """
        Sätt ett värde i cache.
        
        Args:
            key: Cache-nyckel
            value: Värdet att cacha
            ttl_days: Livstid i dagar (None = standardvärde)
            persist: Om True, spara till disk
            
        Returns:
            Den skapade CacheEntry
        """
        now = datetime.now(timezone.utc)
        expires_at = self._get_expiry_time(ttl_days)
        
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now.isoformat(),
            expires_at=expires_at.isoformat(),
            content_hash=self._compute_hash(value),
            access_count=0,
            last_accessed=None
        )
        
        with self._lock:
            self._cache[key] = entry
            
            # Rensa gamla entries om vi når maxgränsen
            if len(self._cache) > self.max_entries:
                self._evict_old_entries()
            
            if persist:
                self._persist_entry(entry)
        
        return entry
    
    def get(self, key: str, default: Any = None) -> Optional[Any]:
        """
        Hämta ett värde från cache.
        
        Args:
            key: Cache-nyckel
            default: Standardvärde om nyckeln saknas
            
        Returns:
            Cachat värde eller default
        """
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                # Försök ladda från disk
                entry = self._load_entry(key)
                if entry:
                    self._cache[key] = entry
            
            if entry is None:
                return default
            
            # Kontrollera utgång
            if self._is_expired(entry):
                self.delete(key)
                return default
            
            # Uppdatera access-statistik
            entry.access_count += 1
            entry.last_accessed = datetime.now(timezone.utc).isoformat()
            
            return entry.value
    
    def delete(self, key: str) -> bool:
        """
        Ta bort en entry från cache.
        
        Args:
            key: Cache-nyckel
            
        Returns:
            True om borttagning lyckades
        """
        with self._lock:
            if key in self._cache:
                del self._cache[key]
            
            # Ta bort från disk
            cache_file = self._get_cache_file(key)
            if cache_file.exists():
                cache_file.unlink()
                return True
        
        return False
    
    def exists(self, key: str) -> bool:
        """
        Kontrollera om nyckel finns och är giltig.
        
        Args:
            key: Cache-nyckel
            
        Returns:
            True om nyckeln finns och inte har gått ut
        """
        return self.get(key) is not None
    
    def verify_integrity(self, key: str) -> bool:
        """
        Verifiera integritet för en cache-post.
        
        Args:
            key: Cache-nyckel
            
        Returns:
            True om hash matchar innehållet
        """
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                return False
            
            computed_hash = self._compute_hash(entry.value)
            return computed_hash == entry.content_hash
    
    def clear(self) -> int:
        """
        Rensa hela cachen.
        
        Returns:
            Antal borttagna entries
        """
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            
            # Rensa disk-cache
            for cache_file in self.cache_dir.glob("*.cache"):
                cache_file.unlink()
            
            return count
    
    def cleanup_expired(self) -> int:
        """
        Ta bort utgångna entries.
        
        Returns:
            Antal borttagna entries
        """
        with self._lock:
            expired_keys = [
                key for key, entry in self._cache.items()
                if self._is_expired(entry)
            ]
            
            for key in expired_keys:
                self.delete(key)
            
            return len(expired_keys)
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Hämta cache-statistik.
        
        Returns:
            Dict med statistik
        """
        with self._lock:
            total_entries = len(self._cache)
            expired_count = sum(
                1 for entry in self._cache.values()
                if self._is_expired(entry)
            )
            total_accesses = sum(
                entry.access_count for entry in self._cache.values()
            )
            
            return {
                "total_entries": total_entries,
                "expired_entries": expired_count,
                "valid_entries": total_entries - expired_count,
                "total_accesses": total_accesses,
                "max_entries": self.max_entries,
                "ttl_days": self.ttl_days,
                "cache_dir": str(self.cache_dir)
            }
    
    def list_keys(self, pattern: Optional[str] = None) -> List[str]:
        """
        Lista alla cache-nycklar.
        
        Args:
            pattern: Filtrera på pattern (enkel substring-match)
            
        Returns:
            Lista med nycklar
        """
        with self._lock:
            keys = list(self._cache.keys())
            
            if pattern:
                keys = [k for k in keys if pattern in k]
            
            return keys
    
    def get_entry_info(self, key: str) -> Optional[Dict[str, Any]]:
        """
        Hämta metadata om en cache-entry.
        
        Args:
            key: Cache-nyckel
            
        Returns:
            Entry-metadata eller None
        """
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                return None
            
            return {
                "key": entry.key,
                "created_at": entry.created_at,
                "expires_at": entry.expires_at,
                "content_hash": entry.content_hash,
                "access_count": entry.access_count,
                "last_accessed": entry.last_accessed,
                "is_expired": self._is_expired(entry),
                "is_valid": self.verify_integrity(key)
            }
    
    def _get_cache_file(self, key: str) -> Path:
        """Få filnamn för cache-nyckel."""
        key_hash = self._compute_key_hash(key)
        return self.cache_dir / f"{key_hash}.cache"
    
    def _persist_entry(self, entry: CacheEntry) -> bool:
        """Spara entry till disk."""
        try:
            cache_file = self._get_cache_file(entry.key)
            
            data = asdict(entry)
            
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            return True
        except Exception as e:
            print(f"[CACHE] Error persisting entry: {e}")
            return False
    
    def _load_entry(self, key: str) -> Optional[CacheEntry]:
        """Ladda entry från disk."""
        try:
            cache_file = self._get_cache_file(key)
            
            if not cache_file.exists():
                return None
            
            with open(cache_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return CacheEntry(**data)
        except Exception as e:
            print(f"[CACHE] Error loading entry: {e}")
            return None
    
    def _load_from_disk(self) -> int:
        """Ladda alla cache-filer från disk."""
        loaded = 0
        
        try:
            for cache_file in self.cache_dir.glob("*.cache"):
                try:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    entry = CacheEntry(**data)
                    
                    # Hoppa över utgångna
                    if not self._is_expired(entry):
                        self._cache[entry.key] = entry
                        loaded += 1
                    else:
                        # Ta bort utgångna filer
                        cache_file.unlink()
                        
                except Exception as e:
                    print(f"[CACHE] Error loading {cache_file}: {e}")
        except Exception as e:
            print(f"[CACHE] Error scanning cache directory: {e}")
        
        if loaded > 0:
            print(f"[CACHE] Loaded {loaded} entries from disk")
        
        return loaded
    
    def _evict_old_entries(self, count: int = 100):
        """Ta bort gamla entries för att frigöra utrymme."""
        # Sortera efter sista åtkomst (äldst först)
        entries = sorted(
            self._cache.items(),
            key=lambda x: x[1].last_accessed or x[1].created_at
        )
        
        # Ta bort de äldsta
        for key, _ in entries[:count]:
            self.delete(key)


# Global instance
_cache_manager: Optional[CacheManager] = None


def get_cache_manager() -> CacheManager:
    """Hämta global CacheManager-instans."""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = CacheManager()
    return _cache_manager


def cache_get(key: str, default: Any = None) -> Any:
    """
    Bekväm funktion för att hämta från cache.
    
    Args:
        key: Cache-nyckel
        default: Standardvärde
        
    Returns:
        Cachat värde eller default
    """
    return get_cache_manager().get(key, default)


def cache_set(key: str, value: Any, ttl_days: Optional[int] = None) -> CacheEntry:
    """
    Bekväm funktion för att sätta i cache.
    
    Args:
        key: Cache-nyckel
        value: Värde att cacha
        ttl_days: Livstid i dagar
        
    Returns:
        CacheEntry
    """
    return get_cache_manager().set(key, value, ttl_days)


if __name__ == "__main__":
    # Test
    cm = CacheManager(cache_dir=Path("/tmp/oneseek_cache_test"))
    
    print("=" * 60)
    print("ONESEEK Δ+ Cache Manager Test")
    print("=" * 60)
    
    # Test set/get
    entry = cm.set("test_key", {"data": "test_value", "count": 42})
    print(f"\nSet entry:")
    print(f"  Key: {entry.key}")
    print(f"  Hash: {entry.content_hash[:16]}...")
    print(f"  Expires: {entry.expires_at}")
    
    # Test get
    value = cm.get("test_key")
    print(f"\nGet value: {value}")
    
    # Test integrity
    is_valid = cm.verify_integrity("test_key")
    print(f"Integrity check: {is_valid}")
    
    # Test stats
    stats = cm.get_stats()
    print(f"\nCache stats:")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    
    # Cleanup
    cm.clear()
    print(f"\nCache cleared")
