# OneSeek Autonomy Engine v3.3 - Quick Reference

## Quick Start

### 1. Enable Autonomy (Admin Dashboard)

```
Navigate to: Admin Dashboard → Autonomy tab

1. Configure thresholds:
   - Min Fidelity: 80%
   - Approval Threshold: 2 of 4
   - Dataset Size: 10,000 max
   
2. Set schedule:
   - Manual / Nightly / Continuous
   - Nightly time: 02:00 (2 AM)
   
3. Enable: Toggle ON
```

### 2. Generate Ed25519 Keys (Golden Checkpoint)

```
Navigate to: Admin Dashboard → Golden Checkpoint tab

1. Click "Show" under Ed25519 Keys
2. Click "Generate New Key Pair"
3. SAVE SECRET KEY SECURELY (shown once only)
4. Public key auto-populated
```

### 3. Manual Trigger

```
Navigate to: Admin Dashboard → Autonomy tab

Click "Trigger Now" button

Monitor status in real-time
```

### 4. Approve Golden Checkpoint

```
Navigate to: Admin Dashboard → Golden Checkpoint tab

1. Review pending checkpoint details
2. Check fidelity score and approvals
3. Enter secret key (if not already)
4. Click "Sign with Ed25519"
5. Review signature
6. Click "Approve Golden Checkpoint"
```

### 5. Community Voting

```
Navigate to: Admin Dashboard → Community Voting tab

1. Select a control question
2. Choose your preferred option
3. Click "Solve PoW & Vote"
4. Wait ~10-30 seconds for PoW
5. Click "Submit Vote"
```

## API Quick Reference

### Get Configuration
```bash
curl http://localhost:3001/api/autonomy/config
```

### Update Configuration
```bash
curl -X POST http://localhost:3001/api/autonomy/config \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "schedule": "nightly"}'
```

### Get State
```bash
curl http://localhost:3001/api/autonomy/state
```

### Trigger Cycle
```bash
curl -X POST http://localhost:3001/api/autonomy/run
```

### Get Pending Checkpoints
```bash
curl http://localhost:3001/api/autonomy/pending-checkpoints
```

### Generate Keys
```bash
curl -X POST http://localhost:3001/api/autonomy/checkpoint/generate-keys
```

### Sign Cycle
```bash
curl -X POST http://localhost:3001/api/autonomy/checkpoint/sign \
  -H "Content-Type: application/json" \
  -d '{"cycleId": "cycle-123", "secretKey": "abc..."}'
```

### Approve Checkpoint
```bash
curl -X POST http://localhost:3001/api/autonomy/checkpoint/approve \
  -H "Content-Type: application/json" \
  -d '{"cycleId": "cycle-123", "signature": "sig...", "publicKey": "pub..."}'
```

## Python Scripts Quick Reference

### Generate Examples
```bash
python3 ml/pipelines/generate_examples.py --count 1000 --language sv
```

### Analyze Dataset (Stage-1)
```bash
python3 ml/pipelines/analyze_dataset.py \
  --dataset datasets/my-dataset.jsonl \
  --stage 1
```

### Analyze Model (Stage-2)
```bash
python3 ml/pipelines/analyze_model.py \
  --model models/oneseek-certified/run-123 \
  --stage 2
```

### Verify Model
```bash
python3 ml/pipelines/verify_model.py \
  --model models/oneseek-certified/run-123 \
  --questions 150
```

### Log to Ledger
```bash
python3 ml/pipelines/log_to_ledger.py \
  --event '{"id": "cycle-123", "status": "approved"}'
```

## Configuration File

Location: `config/autonomy.json`

```json
{
  "enabled": false,
  "schedule": "manual",
  "scheduleTime": "02:00",
  "minFidelityThreshold": 0.80,
  "maxDatasetSize": 10000,
  "minDatasetSize": 100,
  "verificationQuestions": 150,
  "externalReviewers": ["gemini", "gpt4o", "deepseek"],
  "approvalThreshold": 2,
  "loraSteps": 2
}
```

## Cycle Status Values

- `running`: Cycle in progress
- `awaiting_checkpoint`: Passed all gates, needs admin approval
- `approved`: Golden checkpoint signed and approved
- `failed`: Cycle failed at some stage

## Thresholds

### Fidelity Score
- **EXCELLENT**: ≥90%
- **GOOD**: 85-89%
- **ACCEPTABLE**: 80-84%
- **POOR**: <80% (rejected)

### Bias Score
- **Maximum**: 0.15 (15%)
- **Target**: <0.10 (10%)

### Toxicity Score
- **Maximum**: 0.10 (10%)
- **Target**: <0.05 (5%)

### Fairness Score
- **Minimum**: 0.80 (80%)
- **Target**: >0.85 (85%)

## Approval Requirements

Total approvals needed: **2 of 4**

1. Internal analysis (bias/toxicity/fairness)
2. Gemini review
3. GPT-4o review
4. DeepSeek review

## PoW Difficulty

Default: **4 zeros** (0000...)

Typical solve time: 10-30 seconds on modern CPU

Security: Prevents bot voting attacks

## Environment Variables

Required for external reviews:
```bash
OPENAI_API_KEY=sk-...      # GPT-4o
GEMINI_API_KEY=AI...       # Gemini
DEEPSEEK_API_KEY=sk-...    # DeepSeek
```

## Troubleshooting

### Autonomy not starting?
1. Check API keys configured
2. Verify `config/autonomy.json` exists
3. Check backend logs

### External reviews failing?
1. Verify API keys valid
2. Check network connectivity
3. Review rate limits

### PoW not solving?
1. Wait longer (up to 60s)
2. Check browser console
3. Try different browser

### Signature invalid?
1. Verify correct secret key
2. Check key pair matches
3. Regenerate keys if needed

## Support

- Documentation: [AUTONOMY_ENGINE_V3.3.md](AUTONOMY_ENGINE_V3.3.md)
- Issues: https://github.com/robinandreeklund-collab/CivicAI/issues
- Main README: [README.md](README.md)
