"""
Ledger Client - Abstraction for immutable ledger storage

Provides two implementations:
- InMemoryLedgerClient: For testing and development
- HttpLedgerClient: For production ledger service
"""

import json
from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from datetime import datetime
import os


class LedgerClient(ABC):
    """Abstract base class for ledger clients."""
    
    @abstractmethod
    def write_entry(self, entry: Dict[str, Any]) -> str:
        """
        Write an entry to the ledger.
        
        Args:
            entry: Ledger entry dictionary
            
        Returns:
            str: Entry ID or hash
            
        Raises:
            ValueError: If entry with same immutable_hash already exists
        """
        pass
    
    @abstractmethod
    def read_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """
        Read an entry from the ledger.
        
        Args:
            entry_id: Entry ID or hash
            
        Returns:
            Optional[Dict]: Entry data or None if not found
        """
        pass
    
    @abstractmethod
    def verify_entry(self, entry_id: str) -> bool:
        """
        Verify entry signature and integrity.
        
        Args:
            entry_id: Entry ID or hash
            
        Returns:
            bool: True if entry is valid
        """
        pass
    
    @abstractmethod
    def list_entries(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        List recent ledger entries.
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List[Dict]: List of entries
        """
        pass


class InMemoryLedgerClient(LedgerClient):
    """
    In-memory ledger implementation for testing.
    
    Stores entries in memory with basic validation.
    """
    
    def __init__(self):
        self.entries = {}  # {entry_id: entry_data}
        self.entries_by_hash = {}  # {immutable_hash: entry_id}
        self.entry_order = []  # Ordered list of entry IDs
    
    def write_entry(self, entry: Dict[str, Any]) -> str:
        """Write entry to in-memory ledger."""
        # Validate required fields
        required_fields = ['event', 'model', 'dna', 'immutable_hash', 'timestamp']
        for field in required_fields:
            if field not in entry:
                raise ValueError(f"Missing required field: {field}")
        
        immutable_hash = entry['immutable_hash']
        
        # Check for duplicate (write-once semantics)
        if immutable_hash in self.entries_by_hash:
            raise ValueError(
                f"Entry with immutable_hash {immutable_hash} already exists"
            )
        
        # Use immutable_hash as entry_id
        entry_id = immutable_hash
        
        # Store entry
        self.entries[entry_id] = entry.copy()
        self.entries_by_hash[immutable_hash] = entry_id
        self.entry_order.append(entry_id)
        
        return entry_id
    
    def read_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Read entry from in-memory ledger."""
        return self.entries.get(entry_id)
    
    def verify_entry(self, entry_id: str) -> bool:
        """Verify entry exists and has required fields."""
        entry = self.read_entry(entry_id)
        if not entry:
            return False
        
        # Check required fields
        required_fields = ['event', 'model', 'dna', 'immutable_hash', 
                          'timestamp', 'signature', 'signer_public_key']
        return all(field in entry for field in required_fields)
    
    def list_entries(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List recent entries (newest first)."""
        recent_ids = self.entry_order[-limit:]
        recent_ids.reverse()  # Newest first
        return [self.entries[eid] for eid in recent_ids]
    
    def clear(self):
        """Clear all entries (for testing)."""
        self.entries.clear()
        self.entries_by_hash.clear()
        self.entry_order.clear()


class HttpLedgerClient(LedgerClient):
    """
    HTTP-based ledger client for production use.
    
    Connects to a remote ledger service via HTTP POST.
    """
    
    def __init__(self, ledger_url: Optional[str] = None):
        """
        Initialize HTTP ledger client.
        
        Args:
            ledger_url: Ledger service URL (or from LEDGER_URL env var)
        """
        self.ledger_url = ledger_url or os.environ.get('LEDGER_URL')
        if not self.ledger_url:
            raise ValueError(
                "LEDGER_URL must be provided or set in environment"
            )
        
        # Remove trailing slash
        self.ledger_url = self.ledger_url.rstrip('/')
    
    def write_entry(self, entry: Dict[str, Any]) -> str:
        """Write entry to remote ledger via HTTP POST."""
        try:
            import requests
        except ImportError:
            raise ImportError(
                "requests library required for HttpLedgerClient. "
                "Install with: pip install requests"
            )
        
        # Validate required fields
        required_fields = ['event', 'model', 'dna', 'immutable_hash', 'timestamp']
        for field in required_fields:
            if field not in entry:
                raise ValueError(f"Missing required field: {field}")
        
        # POST to ledger service
        response = requests.post(
            f"{self.ledger_url}/entries",
            json=entry,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        response.raise_for_status()
        
        # Return entry ID from response
        result = response.json()
        return result.get('entry_id', entry['immutable_hash'])
    
    def read_entry(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Read entry from remote ledger."""
        try:
            import requests
        except ImportError:
            raise ImportError(
                "requests library required for HttpLedgerClient"
            )
        
        response = requests.get(
            f"{self.ledger_url}/entries/{entry_id}",
            timeout=30
        )
        
        if response.status_code == 404:
            return None
        
        response.raise_for_status()
        return response.json()
    
    def verify_entry(self, entry_id: str) -> bool:
        """Verify entry via remote ledger."""
        try:
            import requests
        except ImportError:
            raise ImportError(
                "requests library required for HttpLedgerClient"
            )
        
        response = requests.get(
            f"{self.ledger_url}/entries/{entry_id}/verify",
            timeout=30
        )
        
        if response.status_code == 404:
            return False
        
        response.raise_for_status()
        result = response.json()
        return result.get('valid', False)
    
    def list_entries(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List recent entries from remote ledger."""
        try:
            import requests
        except ImportError:
            raise ImportError(
                "requests library required for HttpLedgerClient"
            )
        
        response = requests.get(
            f"{self.ledger_url}/entries",
            params={'limit': limit},
            timeout=30
        )
        
        response.raise_for_status()
        result = response.json()
        return result.get('entries', [])


def create_ledger_client(use_http: bool = False) -> LedgerClient:
    """
    Factory function to create appropriate ledger client.
    
    Args:
        use_http: If True, create HTTP client (requires LEDGER_URL)
                  If False, create in-memory client
    
    Returns:
        LedgerClient: Appropriate ledger client instance
    """
    if use_http:
        return HttpLedgerClient()
    else:
        return InMemoryLedgerClient()


# Example usage and tests
if __name__ == "__main__":
    # Test InMemoryLedgerClient
    print("Testing InMemoryLedgerClient...")
    client = InMemoryLedgerClient()
    
    # Create test entry
    test_entry = {
        'event': 'training',
        'model': 'OneSeek-7B-Zero',
        'dna': 'OneSeek-7B-Zero.v1.0.abc123.def456.789xyz',
        'dataset_hashes': ['hash1', 'hash2'],
        'final_weights': {'mistral-7b': 0.6, 'llama-2': 0.4},
        'immutable_hash': 'test_hash_12345',
        'timestamp': '2025-11-21T12:00:00Z',
        'signer_public_key': 'pubkey123',
        'signature': 'sig456'
    }
    
    # Write entry
    entry_id = client.write_entry(test_entry)
    print(f"✓ Wrote entry: {entry_id}")
    
    # Read entry
    retrieved = client.read_entry(entry_id)
    assert retrieved == test_entry
    print(f"✓ Read entry: {retrieved['event']}")
    
    # Verify entry
    is_valid = client.verify_entry(entry_id)
    assert is_valid
    print(f"✓ Verified entry: {is_valid}")
    
    # Test duplicate prevention
    try:
        client.write_entry(test_entry)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        print(f"✓ Duplicate prevention works: {e}")
    
    # List entries
    entries = client.list_entries()
    assert len(entries) == 1
    print(f"[OK] Listed entries: {len(entries)}")
    
    print("\n[SUCCESS] Ledger client tests passed!")
