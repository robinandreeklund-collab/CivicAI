"""
Tests for ledger client
"""

import pytest
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from ledger.ledger_client import InMemoryLedgerClient, HttpLedgerClient, create_ledger_client


def test_inmemory_ledger_write_read():
    """Test writing and reading from in-memory ledger."""
    client = InMemoryLedgerClient()
    
    entry = {
        'event': 'training',
        'model': 'OneSeek-7B-Zero',
        'dna': 'test-dna-123',
        'immutable_hash': 'hash123',
        'timestamp': '2025-11-21T12:00:00Z',
        'signature': 'sig123',
        'signer_public_key': 'pubkey123'
    }
    
    # Write entry
    entry_id = client.write_entry(entry)
    assert entry_id == 'hash123'
    
    # Read entry
    retrieved = client.read_entry(entry_id)
    assert retrieved == entry


def test_inmemory_ledger_duplicate_prevention():
    """Test that duplicate entries are rejected."""
    client = InMemoryLedgerClient()
    
    entry = {
        'event': 'training',
        'model': 'OneSeek-7B-Zero',
        'dna': 'test-dna-123',
        'immutable_hash': 'hash123',
        'timestamp': '2025-11-21T12:00:00Z',
    }
    
    # Write first time
    client.write_entry(entry)
    
    # Try to write again - should raise ValueError
    with pytest.raises(ValueError, match="already exists"):
        client.write_entry(entry)


def test_inmemory_ledger_missing_fields():
    """Test that entries with missing required fields are rejected."""
    client = InMemoryLedgerClient()
    
    # Missing 'dna' field
    entry = {
        'event': 'training',
        'model': 'OneSeek-7B-Zero',
        'immutable_hash': 'hash123',
        'timestamp': '2025-11-21T12:00:00Z',
    }
    
    with pytest.raises(ValueError, match="Missing required field"):
        client.write_entry(entry)


def test_inmemory_ledger_verify():
    """Test entry verification."""
    client = InMemoryLedgerClient()
    
    # Complete entry
    complete_entry = {
        'event': 'training',
        'model': 'OneSeek-7B-Zero',
        'dna': 'test-dna-123',
        'immutable_hash': 'hash123',
        'timestamp': '2025-11-21T12:00:00Z',
        'signature': 'sig123',
        'signer_public_key': 'pubkey123'
    }
    
    entry_id = client.write_entry(complete_entry)
    
    # Should verify
    assert client.verify_entry(entry_id)
    
    # Non-existent entry should not verify
    assert not client.verify_entry('nonexistent')


def test_inmemory_ledger_list():
    """Test listing entries."""
    client = InMemoryLedgerClient()
    
    # Add multiple entries
    for i in range(5):
        entry = {
            'event': 'training',
            'model': f'model-{i}',
            'dna': f'dna-{i}',
            'immutable_hash': f'hash-{i}',
            'timestamp': f'2025-11-21T12:00:0{i}Z',
        }
        client.write_entry(entry)
    
    # List all
    entries = client.list_entries(limit=10)
    assert len(entries) == 5
    
    # Should be in reverse order (newest first)
    assert entries[0]['model'] == 'model-4'
    assert entries[4]['model'] == 'model-0'
    
    # Test limit
    limited = client.list_entries(limit=3)
    assert len(limited) == 3


def test_inmemory_ledger_clear():
    """Test clearing ledger."""
    client = InMemoryLedgerClient()
    
    entry = {
        'event': 'training',
        'model': 'test',
        'dna': 'dna',
        'immutable_hash': 'hash',
        'timestamp': '2025-11-21T12:00:00Z',
    }
    
    client.write_entry(entry)
    assert len(client.list_entries()) == 1
    
    client.clear()
    assert len(client.list_entries()) == 0


def test_create_ledger_client():
    """Test ledger client factory."""
    # Create in-memory client
    client = create_ledger_client(use_http=False)
    assert isinstance(client, InMemoryLedgerClient)


def test_http_ledger_client_initialization():
    """Test HTTP ledger client initialization."""
    # Without URL should raise
    with pytest.raises(ValueError, match="LEDGER_URL"):
        HttpLedgerClient()
    
    # With URL should work
    client = HttpLedgerClient(ledger_url="http://localhost:8000")
    assert client.ledger_url == "http://localhost:8000"


def test_http_ledger_client_url_normalization():
    """Test URL trailing slash removal."""
    client = HttpLedgerClient(ledger_url="http://localhost:8000/")
    assert client.ledger_url == "http://localhost:8000"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
