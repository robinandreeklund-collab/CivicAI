#!/usr/bin/env python3
"""
Model Integrity Verification Script

Verifies:
1. DNA fingerprint matches stored DNA
2. Ledger entry is valid and matches
3. Dataset files match recorded hashes

Usage:
    python verify_integrity.py [model_dir]

Returns machine-readable JSON:
    {
        "dna": "VALID" | "INVALID",
        "ledger": "SYNCED" | "MISMATCH" | "UNSIGNED",
        "datasets": "UNCHANGED" | "MODIFIED" | "MISSING",
        "details": {...}
    }
"""

import json
import sys
import hashlib
from pathlib import Path
from typing import Dict, Any


def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hash."""
    return hashlib.sha256(data).hexdigest()


def canonical_json(obj: Any) -> bytes:
    """Canonical JSON serialization."""
    return json.dumps(
        obj,
        sort_keys=True,
        ensure_ascii=False,
        separators=(',', ':'),
        indent=None
    ).encode('utf-8')


def verify_signature(payload_bytes: bytes, signature_hex: str, public_key_hex: str) -> bool:
    """Verify Ed25519 signature."""
    try:
        import nacl.signing
        import nacl.exceptions
    except ImportError:
        print("Warning: pynacl not installed, skipping signature verification", file=sys.stderr)
        return None  # Cannot verify without library
    
    try:
        verify_key = nacl.signing.VerifyKey(bytes.fromhex(public_key_hex))
        signature = bytes.fromhex(signature_hex)
        verify_key.verify(payload_bytes, signature)
        return True
    except nacl.exceptions.BadSignatureError:
        return False
    except Exception as e:
        print(f"Signature verification error: {e}", file=sys.stderr)
        return False


def verify_model_integrity(model_dir: str) -> Dict[str, Any]:
    """
    Verify model integrity.
    
    Args:
        model_dir: Path to certified model directory
        
    Returns:
        Dict with verification results
    """
    model_path = Path(model_dir)
    
    # Check required files exist
    dna_file = model_path / "oneseek_dna.json"
    ledger_file = model_path / "ledger_proof.json"
    adapter_file = model_path / "adapter_model.bin"
    
    results = {
        "dna": "INVALID",
        "ledger": "UNSIGNED",
        "datasets": "UNKNOWN",
        "details": {}
    }
    
    # Check files exist
    if not dna_file.exists():
        results["details"]["error"] = f"DNA file not found: {dna_file}"
        return results
    
    if not ledger_file.exists():
        results["details"]["error"] = f"Ledger proof not found: {ledger_file}"
        return results
    
    if not adapter_file.exists():
        results["details"]["error"] = f"Adapter model not found: {adapter_file}"
        return results
    
    # Load DNA JSON
    try:
        with open(dna_file, 'r') as f:
            dna_data = json.load(f)
    except Exception as e:
        results["details"]["error"] = f"Failed to load DNA: {e}"
        return results
    
    # Load ledger proof
    try:
        with open(ledger_file, 'r') as f:
            ledger_data = json.load(f)
    except Exception as e:
        results["details"]["error"] = f"Failed to load ledger proof: {e}"
        return results
    
    # Verify DNA matches
    if dna_data.get('dna') == ledger_data.get('dna'):
        results["dna"] = "VALID"
        results["details"]["dna"] = dna_data['dna']
    else:
        results["dna"] = "INVALID"
        results["details"]["dna_mismatch"] = {
            "dna_file": dna_data.get('dna'),
            "ledger": ledger_data.get('dna')
        }
        return results
    
    # Verify ledger signature
    if ledger_data.get('signature') and ledger_data.get('signer_public_key'):
        # Reconstruct payload without signature fields for verification
        ledger_payload = {k: v for k, v in ledger_data.items() 
                         if k not in ['signature', 'signer_public_key']}
        payload_bytes = canonical_json(ledger_payload)
        
        signature_valid = verify_signature(
            payload_bytes,
            ledger_data['signature'],
            ledger_data['signer_public_key']
        )
        
        if signature_valid is None:
            results["ledger"] = "UNVERIFIED"
            results["details"]["ledger_note"] = "pynacl not installed"
        elif signature_valid:
            results["ledger"] = "SYNCED"
            results["details"]["signer_public_key"] = ledger_data['signer_public_key'][:16] + "..."
        else:
            results["ledger"] = "MISMATCH"
            results["details"]["ledger_error"] = "Invalid signature"
            return results
    else:
        results["ledger"] = "UNSIGNED"
        results["details"]["ledger_note"] = "No signature found"
    
    # Verify dataset hashes
    dataset_hashes = ledger_data.get('dataset_hashes', [])
    if dataset_hashes:
        all_match = True
        missing = []
        modified = []
        
        for dataset_info in dataset_hashes:
            dataset_path = Path(dataset_info['path'])
            expected_hash = dataset_info['hash']
            
            if not dataset_path.exists():
                missing.append(str(dataset_path))
                all_match = False
                continue
            
            # Compute actual hash
            try:
                with open(dataset_path, 'rb') as f:
                    actual_hash = compute_sha256(f.read())
                
                if actual_hash != expected_hash:
                    modified.append({
                        "path": str(dataset_path),
                        "expected": expected_hash[:16] + "...",
                        "actual": actual_hash[:16] + "..."
                    })
                    all_match = False
            except Exception as e:
                results["details"][f"dataset_error_{dataset_path.name}"] = str(e)
                all_match = False
        
        if all_match:
            results["datasets"] = "UNCHANGED"
            results["details"]["datasets_verified"] = len(dataset_hashes)
        elif missing:
            results["datasets"] = "MISSING"
            results["details"]["missing_datasets"] = missing
        else:
            results["datasets"] = "MODIFIED"
            results["details"]["modified_datasets"] = modified
    else:
        results["datasets"] = "UNKNOWN"
        results["details"]["dataset_note"] = "No dataset hashes in ledger"
    
    # Overall status
    if (results["dna"] == "VALID" and 
        results["ledger"] in ["SYNCED", "UNSIGNED", "UNVERIFIED"] and 
        results["datasets"] in ["UNCHANGED", "UNKNOWN"]):
        results["overall"] = "VALID"
    else:
        results["overall"] = "INVALID"
    
    return results


def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        model_dir = sys.argv[1]
    else:
        # Default to current directory
        model_dir = Path(__file__).parent
    
    print(f"Verifying model integrity: {model_dir}\n", file=sys.stderr)
    
    results = verify_model_integrity(model_dir)
    
    # Print machine-readable JSON
    print(json.dumps(results, indent=2))
    
    # Print summary to stderr
    print(f"\n{'='*60}", file=sys.stderr)
    print(f"Verification Results:", file=sys.stderr)
    print(f"  DNA:      {results['dna']}", file=sys.stderr)
    print(f"  Ledger:   {results['ledger']}", file=sys.stderr)
    print(f"  Datasets: {results['datasets']}", file=sys.stderr)
    print(f"  Overall:  {results.get('overall', 'UNKNOWN')}", file=sys.stderr)
    print(f"{'='*60}", file=sys.stderr)
    
    # Exit code: 0 if valid, 1 if invalid
    sys.exit(0 if results.get('overall') == 'VALID' else 1)


if __name__ == "__main__":
    main()
