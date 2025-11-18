# Transparency Ledger - OQT-1.0

## Overview

The OQT-1.0 Transparency Ledger is a blockchain-inspired immutable audit trail that records every significant event in the model lifecycle. It provides complete traceability, verification, and accountability for all training, updates, and data operations.

## Design Philosophy

### Core Principles

1. **Immutability**: Once written, ledger entries cannot be modified
2. **Verifiability**: All entries can be cryptographically verified
3. **Transparency**: Complete audit trail available to all stakeholders
4. **Accountability**: Every action has a clear responsible party
5. **Provenance**: Complete lineage of all data and model versions

## Architecture

### Block Structure

Each ledger block contains:

```json
{
  "block_id": 42,
  "timestamp": "2025-01-01T12:00:00Z",
  "previous_hash": "abc123...",
  "current_hash": "def456...",
  "event_type": "training",
  "data": {
    "model_version": "1.0.0",
    "training_samples": 10000,
    "fairness_metrics": {},
    "bias_metrics": {},
    "provenance": []
  },
  "signatures": {
    "data_hash": "ghi789...",
    "validator": "OQT-Training-Pipeline"
  }
}
```

### Event Types

1. **genesis**: Initial block (block 0)
2. **training**: Model training event
3. **update**: Model update (incremental learning)
4. **audit**: Manual or automated audit
5. **review**: Human review or approval
6. **data_collection**: Bulk data ingestion

## Hash Chain

### Block Hash Calculation

```
block_hash = SHA256(
  block_id || 
  timestamp || 
  previous_hash || 
  SHA256(data)
)
```

This creates an unbreakable chain where:
- Any modification changes the hash
- Changed hash breaks the chain linkage
- Tampering is immediately detectable

### Data Hash

```
data_hash = SHA256(
  JSON.stringify(data, sort_keys=true)
)
```

Stored separately to verify data integrity independent of chain linkage.

## Verification Procedures

### Chain Integrity Verification

```python
def verify_chain(blocks):
    for i, block in enumerate(blocks):
        # Verify block hash
        calculated_hash = calculate_block_hash(block)
        if block['current_hash'] != calculated_hash:
            return False, f"Block {i}: hash mismatch"
        
        # Verify data hash
        calculated_data_hash = calculate_data_hash(block['data'])
        if block['signatures']['data_hash'] != calculated_data_hash:
            return False, f"Block {i}: data hash mismatch"
        
        # Verify chain linkage (except genesis)
        if i > 0:
            if block['previous_hash'] != blocks[i-1]['current_hash']:
                return False, f"Block {i}: chain broken"
    
    return True, "All blocks verified"
```

### Individual Block Verification

```python
def verify_block(block):
    # Recalculate and compare hashes
    expected_hash = calculate_block_hash(block)
    expected_data_hash = calculate_data_hash(block['data'])
    
    return (
        block['current_hash'] == expected_hash and
        block['signatures']['data_hash'] == expected_data_hash
    )
```

## Usage

### Adding Blocks

```python
from transparency_ledger import TransparencyLedger

ledger = TransparencyLedger('/path/to/ledger')

# Add a training event
block = ledger.add_block(
    event_type='training',
    data={
        'model_version': '1.0.0',
        'training_samples': 10000,
        'fairness_metrics': {
            'demographic_parity': 0.95
        }
    },
    validator='training-system'
)
```

### Verifying Integrity

```python
verification = ledger.verify_chain()

if verification['valid']:
    print("Ledger is valid")
else:
    print(f"Errors: {verification['errors']}")
```

### Querying Blocks

```python
# Get all training events
training_blocks = ledger.get_blocks(event_type='training')

# Get recent 10 blocks
recent = ledger.get_blocks(limit=10)

# Get specific block
block = ledger.get_block(block_id=42)
```

### Exporting Audit Reports

```python
ledger.export_audit_report('/path/to/report.json')
```

## Audit Trail Best Practices

### 1. Regular Verification

Run integrity checks regularly:

```bash
# Daily verification cron job
0 2 * * * cd /path/to/ml/pipelines && python3 transparency_ledger.py --verify
```

### 2. Immutable Storage

- Store ledger on write-once media when possible
- Use append-only file systems
- Maintain encrypted backups
- Distribute copies to multiple locations

### 3. Event Documentation

Always include sufficient detail:

```python
block = ledger.add_block(
    event_type='training',
    data={
        'model_version': '1.0.1',
        'description': 'Retraining with expanded dataset',
        'training_samples': 15000,
        'dataset_changes': [
            'Added 5000 samples from source X',
            'Removed 200 low-quality samples'
        ],
        'fairness_metrics': {...},
        'performance_delta': {
            'accuracy': '+2.3%',
            'fairness': '+1.1%'
        },
        'reviewer': 'data-team-lead',
        'approval_id': 'APPROVAL-2025-001'
    }
)
```

### 4. Validator Identity

Use clear, traceable validator identities:

- `training-pipeline-v1.2.3` - Automated training
- `manual-review-john-doe` - Human review
- `audit-system-quarterly` - Scheduled audit
- `hotfix-emergency-team` - Emergency updates

### 5. Cross-References

Link related events:

```python
data = {
    'model_version': '1.0.2',
    'references': {
        'previous_version_block': 41,
        'dataset_preparation_block': 38,
        'fairness_audit_block': 40
    }
}
```

## Security and Integrity

### Cryptographic Guarantees

1. **Pre-image resistance**: Cannot find input for a given hash
2. **Collision resistance**: Cannot find two inputs with same hash
3. **Avalanche effect**: Small change → completely different hash

### Attack Resistance

**Modification Attack**: 
- Changing any data changes the hash
- Changed hash breaks chain linkage
- Detected immediately on verification

**Insertion Attack**:
- Cannot insert blocks without breaking chain
- Block IDs are sequential
- Previous hash must match

**Deletion Attack**:
- Missing block breaks chain
- Block count doesn't match
- Detected on verification

### Access Control

```javascript
// In production, implement role-based access
const permissions = {
  'read': ['public'],
  'write': ['training-pipeline', 'authorized-staff'],
  'audit': ['auditors', 'regulators', 'public'],
  'admin': ['system-admin']
};
```

## Integration with Model Pipeline

### Training Integration

```python
# In train_language_model.py

def train():
    # ... training code ...
    
    # Log to ledger
    ledger_data = {
        'model_version': version,
        'training_samples': len(train_data),
        'fairness_metrics': fairness_metrics,
        'provenance': [
            f'data_hash:{data_hash}',
            f'config_hash:{config_hash}'
        ]
    }
    
    block = ledger.add_block('training', ledger_data)
    
    # Store ledger reference in model metadata
    model.metadata['ledger_block'] = block['block_id']
```

### Update Integration

```python
# In realtime_update.py

def micro_update():
    # ... update code ...
    
    # Log update
    ledger_data = {
        'model_version': current_version,
        'update_type': 'incremental',
        'new_samples': len(new_data),
        'performance_delta': metrics_delta
    }
    
    ledger.add_block('update', ledger_data)
```

## Querying and Analytics

### Example Queries

```python
# Get all model versions
versions = [
    block['data']['model_version']
    for block in ledger.get_blocks(event_type='training')
]

# Track fairness over time
fairness_history = [
    {
        'timestamp': block['timestamp'],
        'demographic_parity': block['data']['fairness_metrics']['demographic_parity']
    }
    for block in ledger.get_blocks(event_type='training')
]

# Find when bias was detected
bias_events = [
    block for block in ledger.blocks
    if block['data'].get('bias_metrics', {}).get('bias_score', 0) > 0.3
]
```

### Audit Report Structure

```json
{
  "report_timestamp": "2025-01-01T00:00:00Z",
  "ledger_stats": {
    "total_blocks": 156,
    "genesis_timestamp": "2024-01-01T00:00:00Z",
    "latest_timestamp": "2025-01-01T00:00:00Z"
  },
  "verification": {
    "valid": true,
    "total_blocks": 156
  },
  "event_summary": {
    "genesis": 1,
    "training": 12,
    "update": 98,
    "audit": 24,
    "review": 21
  },
  "blocks": [...]
}
```

## Compliance and Regulatory

### EU AI Act Compliance

The ledger provides required documentation for:
- Risk management systems
- Data governance
- Transparency obligations
- Human oversight records
- Accuracy, robustness, and cybersecurity

### Audit Trail Requirements

Satisfies common requirements:
- Who: Validator identity in each block
- What: Event type and detailed data
- When: Timestamp in each block
- Why: Provenance and references
- How: Training config and methods

### Data Retention

```python
# Configure retention policy
RETENTION_POLICY = {
    'genesis': 'permanent',
    'training': 'permanent',
    'update': '7 years',
    'audit': 'permanent',
    'review': '10 years'
}
```

## Troubleshooting

### Verification Failures

**Symptom**: Ledger verification fails

**Causes**:
1. File corruption
2. Manual editing
3. System crash during write

**Solutions**:
1. Restore from backup
2. Rollback to last known good state
3. Re-verify individual blocks to find corruption point

### Performance Issues

**Symptom**: Slow ledger operations

**Solutions**:
1. Index frequently queried fields
2. Archive old blocks
3. Use database instead of JSON files for large ledgers

### Storage Growth

**Symptom**: Ledger file becoming very large

**Solutions**:
1. Implement block archiving
2. Compress old blocks
3. Use external storage for detailed data
4. Reference external data by hash

## Future Enhancements

- [ ] Distributed ledger across multiple nodes
- [ ] Public blockchain anchoring for extra verification
- [ ] Smart contract integration
- [ ] Real-time streaming API
- [ ] GraphQL query interface
- [ ] Machine-readable audit reports
- [ ] Automated compliance checking
- [ ] Integration with external audit systems
