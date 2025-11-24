#!/usr/bin/env python3
"""
Log autonomy events to transparency ledger
"""

import json
import sys
import argparse
from pathlib import Path
import os

# Add parent directory to path to import TransparencyLedger
sys.path.insert(0, str(Path(__file__).parent))

from transparency_ledger import TransparencyLedger


def log_autonomy_event(event_json):
    """Log autonomy event to ledger"""
    
    try:
        event = json.loads(event_json)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON: {str(e)}"}), file=sys.stderr)
        sys.exit(1)
    
    # Determine ledger directory
    project_root = Path(__file__).parent.parent.parent
    ledger_dir = project_root / 'models' / 'oneseek-certified' / 'autonomy-ledger'
    
    # Initialize ledger
    ledger = TransparencyLedger(str(ledger_dir), quiet=True)
    
    # Determine event type
    event_type = event.get('event', event.get('status', 'autonomy_cycle'))
    
    # Add block to ledger
    block = ledger.add_block(
        event_type=event_type,
        data={
            'cycle_id': event.get('id'),
            'status': event.get('status'),
            'start_time': event.get('startTime'),
            'end_time': event.get('endTime'),
            'stages': event.get('stages', {}),
            'error': event.get('error'),
        },
        provenance=['autonomy_engine_v3.3']
    )
    
    print(json.dumps({
        "success": True,
        "block_id": block['block_id'],
        "ledger_path": str(ledger_dir),
    }), file=sys.stdout)


def main():
    parser = argparse.ArgumentParser(description='Log event to transparency ledger')
    parser.add_argument('--event', required=True, help='Event data as JSON string')
    
    args = parser.parse_args()
    
    log_autonomy_event(args.event)


if __name__ == '__main__':
    main()
