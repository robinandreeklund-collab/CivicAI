# OneSeek DNA v2 - Quick Reference Guide

## Installation

```bash
pip install pynacl pytest
```

## Generate Test Keys (Development Only)

```python
from src.training.dna import generate_test_keypair
generate_test_keypair('/path/to/keys')
```

**⚠️ WARNING:** Do NOT use test keys in production!

## Run Training

```python
from src.training.dynamic_trainer import run_adaptive_training
from src.ledger.ledger_client import InMemoryLedgerClient

config = {
    'models_dir': 'models',
    'dataset_paths': ['datasets/my_dataset.jsonl'],
    'epochs': 10,
    'learning_rate': 0.0001,
    'output_dir': 'models/oneseek-certified/run-001',
    'private_key_path': '/path/to/private_key.bin',
    'ledger_client': InMemoryLedgerClient(),
    'seed': 42
}

result = run_adaptive_training(config)
print(f"DNA: {result['dna']}")
```

## Verify Model

### Command Line
```bash
python models/oneseek-certified/verify_integrity.py /path/to/certified/model
```

### Admin API
```bash
curl -X POST http://localhost:3001/api/admin/models/verify \
  -H "Content-Type: application/json" \
  -d '{"model_path": "models/oneseek-certified/run-001"}'
```

## Run Tests

```bash
# All tests
pytest tests/ -v

# Specific test file
pytest tests/test_dna.py -v

# With coverage
pytest tests/ --cov=src --cov-report=term
```

## DNA Format

```
OneSeek-7B-Zero.v{VERSION}.{WEIGHTS}.{CATEGORIES}.{TIMESTAMP}

Example:
OneSeek-7B-Zero.v1.0.6b30afe8.4539991e.a16f0dd0
              │  │  │         │         └─ Timestamp hash (8 chars)
              │  │  │         └─────────── Dataset categories hash (8 chars)
              │  │  └───────────────────── Model weights hash (8 chars)
              │  └──────────────────────── Version (MAJOR.MICRO)
              └─────────────────────────── Model name
```

## Dataset Categories

**Canonical Tags:**
- `CivicID` ← civic, civicid, civic_id
- `Identity` ← identity, id
- `SwedID` ← swedish, swed, sv
- `Privacy` ← privacy, private, gdpr
- `Nordic` ← nordic, scandinavian
- `Fairness` ← fairness, fair, bias
- `Transparency` ← transparency
- `Ethics` ← ethics, ethical
- `Multilingual` ← multilingual
- `QA` ← qa, question, answer
- `Instruction` ← instruction, instruct
- `Conversational` ← chat, conversation, dialog

## Environment Variables

```bash
export MODELS_DIR=/path/to/models
export DATASET_PATH=/path/to/dataset.jsonl
export LEDGER_URL=https://ledger.example.com
export LEDGER_PRIVATE_KEY_PATH=/secure/path/to/key.bin
```

## Verification Status Codes

- `DNA: VALID` - Fingerprint matches
- `DNA: INVALID` - Tampering detected
- `Ledger: SYNCED` - Signature verified
- `Ledger: UNSIGNED` - No signature
- `Ledger: MISMATCH` - Invalid signature
- `Datasets: UNCHANGED` - Files match hashes
- `Datasets: MODIFIED` - Files changed
- `Datasets: MISSING` - Files not found

## Adaptive Weight Rules

- **Best model:** Weight × (1 + random(0.20, 0.50))
- **Worst model:** Weight × (1 - random(0.30, 0.50))
- **Auto-stop:** Loss change < 0.001 over 3 epochs

## Example Training Output

```
Epoch 1/10: loss=0.5074, weights={mistral:0.500, llama:0.500}
Epoch 2/10: loss=0.3237, weights={mistral:0.717, llama:0.283}
Epoch 3/10: loss=0.1548, weights={mistral:0.833, llama:0.167}
...
DNA: OneSeek-7B-Zero.v1.0.5505f080.c3a28ca9.471da0ae
Output: models/oneseek-certified/run-001/
  ├── adapter_model.bin
  ├── oneseek_dna.json
  ├── ledger_proof.json
  └── verify_integrity.py
```

## Common Issues

### Import Error: "No module named 'nacl'"
```bash
pip install pynacl
```

### Signature Verification Returns None
- pynacl not installed
- Install with: `pip install pynacl`

### Model Discovery Returns Empty List
- Check `models_dir` path exists
- Ensure models have `config.json` or `tokenizer_config.json`

### Verification Script Not Found
- Check if `models/oneseek-certified/verify_integrity.py` exists
- Script should be auto-copied during training

## Security Best Practices

✅ **DO:**
- Use HSM for production keys
- Rotate keys every 90 days
- Separate keys for dev/staging/prod
- Backup keys securely (encrypted)
- Use HTTPS for ledger service

❌ **DON'T:**
- Commit private keys to git
- Share keys via email/chat
- Use test keypairs in production
- Reuse keys across environments

## Quick Links

- Full Documentation: `OQT-1.0-README.md`
- Implementation Summary: `DNA_V2_IMPLEMENTATION_SUMMARY.md`
- Test Examples: `tests/test_*.py`
- CI Workflow: `.github/workflows/integration-tests.yml`
