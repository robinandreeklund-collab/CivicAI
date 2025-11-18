#!/usr/bin/env python3
"""
OQT-1.0 Transparency Ledger
Blockchain-inspired immutable audit trail for model training and updates
"""

import json
import hashlib
import os
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

class TransparencyLedger:
    """Manages immutable audit trail for OQT-1.0"""
    
    def __init__(self, ledger_dir: str, quiet: bool = False):
        self.ledger_dir = Path(ledger_dir)
        self.ledger_dir.mkdir(parents=True, exist_ok=True)
        self.ledger_file = self.ledger_dir / 'ledger.json'
        self.blocks = []
        self.quiet = quiet
        self._load_ledger()
    
    def _load_ledger(self):
        """Load existing ledger from disk"""
        if self.ledger_file.exists():
            try:
                with open(self.ledger_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.blocks = data.get('blocks', [])
                if not self.quiet:
                    print(f"Loaded ledger with {len(self.blocks)} blocks", file=sys.stderr)
            except json.JSONDecodeError as e:
                # Ledger file is corrupted - back it up and start fresh
                import shutil
                backup_file = self.ledger_file.parent / f'ledger_corrupted_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json.bak'
                try:
                    shutil.copy(self.ledger_file, backup_file)
                    if not self.quiet:
                        print(f"WARNING: Ledger file corrupted (backed up to {backup_file.name}). Creating new ledger.", file=sys.stderr)
                except Exception:
                    if not self.quiet:
                        print(f"WARNING: Ledger file corrupted. Creating new ledger.", file=sys.stderr)
                # Remove corrupted file and create genesis block
                try:
                    if self.ledger_file.exists():
                        self.ledger_file.unlink()
                except Exception as unlink_err:
                    if not self.quiet:
                        print(f"WARNING: Could not delete corrupted ledger: {unlink_err}", file=sys.stderr)
                self._create_genesis_block()
            except Exception as e:
                # Any other error loading ledger
                if not self.quiet:
                    print(f"WARNING: Error loading ledger: {e}. Creating new ledger.", file=sys.stderr)
                self._create_genesis_block()
        else:
            # Create genesis block
            self._create_genesis_block()
    
    def _create_genesis_block(self):
        """Create the first block in the ledger"""
        genesis = {
            'block_id': 0,
            'timestamp': datetime.now().isoformat(),
            'previous_hash': '0' * 64,
            'current_hash': '',
            'event_type': 'genesis',
            'data': {
                'model_version': '0.0.0',
                'description': 'OQT-1.0 Transparency Ledger Genesis Block',
                'provenance': ['system_initialization']
            },
            'signatures': {
                'data_hash': '',
                'validator': 'system'
            }
        }
        
        # Calculate hash
        genesis['current_hash'] = self._calculate_block_hash(genesis)
        genesis['signatures']['data_hash'] = self._calculate_data_hash(genesis['data'])
        
        self.blocks.append(genesis)
        self._save_ledger()
        if not self.quiet:
            print("Created genesis block", file=sys.stderr)
    
    def _calculate_data_hash(self, data: Dict) -> str:
        """Calculate SHA-256 hash of data"""
        data_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(data_str.encode()).hexdigest()
    
    def _calculate_block_hash(self, block: Dict) -> str:
        """Calculate SHA-256 hash of entire block"""
        # Hash combines block_id, timestamp, previous_hash, and data_hash
        block_content = f"{block['block_id']}{block['timestamp']}{block['previous_hash']}"
        data_hash = self._calculate_data_hash(block['data'])
        block_content += data_hash
        return hashlib.sha256(block_content.encode()).hexdigest()
    
    def _save_ledger(self):
        """Save ledger to disk"""
        with open(self.ledger_file, 'w', encoding='utf-8') as f:
            json.dump({
                'blocks': self.blocks,
                'last_updated': datetime.now().isoformat(),
                'block_count': len(self.blocks)
            }, f, indent=2)
    
    def add_block(self, event_type: str, data: Dict, validator: str = 'system') -> Dict:
        """
        Add a new block to the ledger
        
        Args:
            event_type: Type of event (training, update, audit, review, data_collection)
            data: Event data
            validator: Identifier of who created this block
        
        Returns:
            The created block
        """
        # Get previous block
        previous_block = self.blocks[-1] if self.blocks else None
        
        if not previous_block:
            raise Exception("Cannot add block: no genesis block exists")
        
        # Create new block
        new_block = {
            'block_id': len(self.blocks),
            'timestamp': datetime.now().isoformat(),
            'previous_hash': previous_block['current_hash'],
            'current_hash': '',
            'event_type': event_type,
            'data': data,
            'signatures': {
                'data_hash': self._calculate_data_hash(data),
                'validator': validator
            }
        }
        
        # Calculate current hash
        new_block['current_hash'] = self._calculate_block_hash(new_block)
        
        # Add to chain
        self.blocks.append(new_block)
        self._save_ledger()
        
        if not self.quiet:
            print(f"Added block {new_block['block_id']}: {event_type}", file=sys.stderr)
        
        return new_block
    
    def verify_chain(self) -> Dict:
        """Verify integrity of the entire blockchain"""
        if not self.blocks:
            return {'valid': False, 'error': 'No blocks in ledger'}
        
        errors = []
        
        for i, block in enumerate(self.blocks):
            # Verify block hash
            calculated_hash = self._calculate_block_hash(block)
            if block['current_hash'] != calculated_hash:
                errors.append(f"Block {i}: Hash mismatch")
            
            # Verify data hash
            calculated_data_hash = self._calculate_data_hash(block['data'])
            if block['signatures']['data_hash'] != calculated_data_hash:
                errors.append(f"Block {i}: Data hash mismatch")
            
            # Verify chain linkage (except genesis)
            if i > 0:
                if block['previous_hash'] != self.blocks[i-1]['current_hash']:
                    errors.append(f"Block {i}: Chain linkage broken")
        
        if errors:
            return {
                'valid': False,
                'errors': errors,
                'verified_blocks': len(self.blocks) - len(errors)
            }
        
        return {
            'valid': True,
            'total_blocks': len(self.blocks),
            'message': 'All blocks verified successfully'
        }
    
    def get_blocks(self, 
                   event_type: Optional[str] = None,
                   limit: Optional[int] = None) -> List[Dict]:
        """
        Get blocks from the ledger
        
        Args:
            event_type: Filter by event type
            limit: Maximum number of blocks to return
        
        Returns:
            List of blocks
        """
        blocks = self.blocks
        
        if event_type:
            blocks = [b for b in blocks if b['event_type'] == event_type]
        
        if limit:
            blocks = blocks[-limit:]
        
        return blocks
    
    def get_block(self, block_id: int) -> Optional[Dict]:
        """Get a specific block by ID"""
        if 0 <= block_id < len(self.blocks):
            return self.blocks[block_id]
        return None
    
    def export_audit_report(self, output_file: str):
        """Export complete audit report"""
        verification = self.verify_chain()
        
        report = {
            'report_timestamp': datetime.now().isoformat(),
            'ledger_stats': {
                'total_blocks': len(self.blocks),
                'genesis_timestamp': self.blocks[0]['timestamp'] if self.blocks else None,
                'latest_timestamp': self.blocks[-1]['timestamp'] if self.blocks else None
            },
            'verification': verification,
            'event_summary': {},
            'blocks': self.blocks
        }
        
        # Count events by type
        for block in self.blocks:
            event_type = block['event_type']
            report['event_summary'][event_type] = report['event_summary'].get(event_type, 0) + 1
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2)
        
        print(f"Exported audit report to {output_file}")
        return report


def main():
    """Demo and testing"""
    import argparse
    
    parser = argparse.ArgumentParser(description='OQT-1.0 Transparency Ledger')
    parser.add_argument('--verify', action='store_true',
                        help='Verify ledger integrity')
    parser.add_argument('--add', type=str, choices=['training', 'update', 'audit', 'review', 'data_collection'],
                        help='Add a test block')
    parser.add_argument('--export', type=str,
                        help='Export audit report to file')
    parser.add_argument('--list', action='store_true',
                        help='List all blocks')
    
    args = parser.parse_args()
    
    # Configuration
    LEDGER_DIR = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'ledger'
    )
    
    ledger = TransparencyLedger(LEDGER_DIR)
    
    if args.verify:
        print("\nVerifying ledger integrity...")
        result = ledger.verify_chain()
        print(json.dumps(result, indent=2))
    
    if args.add:
        print(f"\nAdding test {args.add} block...")
        test_data = {
            'model_version': '1.0.0',
            'description': f'Test {args.add} event',
            'timestamp': datetime.now().isoformat()
        }
        
        if args.add == 'training':
            test_data.update({
                'training_samples': 1000,
                'fairness_metrics': {
                    'demographic_parity': 0.95,
                    'equal_opportunity': 0.93
                },
                'bias_metrics': {
                    'bias_score': 0.15
                }
            })
        
        block = ledger.add_block(args.add, test_data)
        print(f"Created block {block['block_id']}")
    
    if args.export:
        print(f"\nExporting audit report...")
        ledger.export_audit_report(args.export)
    
    if args.list:
        print(f"\nLedger Blocks ({len(ledger.blocks)} total):")
        print("=" * 80)
        for block in ledger.blocks:
            print(f"\nBlock {block['block_id']}:")
            print(f"  Type: {block['event_type']}")
            print(f"  Timestamp: {block['timestamp']}")
            print(f"  Hash: {block['current_hash'][:16]}...")
            print(f"  Validator: {block['signatures']['validator']}")
    
    if not any([args.verify, args.add, args.export, args.list]):
        # Default: show status
        print(f"\nTransparency Ledger Status:")
        print(f"  Total Blocks: {len(ledger.blocks)}")
        if ledger.blocks:
            print(f"  Genesis: {ledger.blocks[0]['timestamp']}")
            print(f"  Latest: {ledger.blocks[-1]['timestamp']}")
        
        verification = ledger.verify_chain()
        print(f"  Valid: {verification['valid']}")


if __name__ == '__main__':
    main()
