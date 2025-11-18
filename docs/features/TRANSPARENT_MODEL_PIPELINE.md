# Transparent Model Pipeline - OQT-1.0

## Overview

The OQT-1.0 (Open Quality Transformer) pipeline implements a fully transparent, auditable, and fair machine learning training system. Every step from data collection to model deployment is logged, traceable, and verifiable.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Collection Layer                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │ Chat Interface│   │   API       │   │   Batch      │    │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘    │
│         │                   │                   │            │
│         └───────────────────┼───────────────────┘            │
│                             ▼                                │
│                   ┌─────────────────┐                        │
│                   │  Ingest API     │                        │
│                   │  (routes/       │                        │
│                   │   ingest.js)    │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼─────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Data Preparation Pipeline                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  prepare_dataset.py                                   │  │
│  │  • Data classification                                │  │
│  │  • Quality assessment                                 │  │
│  │  • Fairness analysis (Fairlearn)                      │  │
│  │  • Consensus scoring                                  │  │
│  │  • Topic extraction                                   │  │
│  │  • Train/Val/Test split                               │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    Training Pipeline                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  train_language_model.py                              │  │
│  │  • Load prepared datasets                             │  │
│  │  • Model training (transformer-based)                 │  │
│  │  • Fairness-aware objectives                          │  │
│  │  • Multi-task learning                                │  │
│  │  • Model versioning                                   │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                Real-Time Update Pipeline                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  realtime_update.py                                   │  │
│  │  • Continuous monitoring                              │  │
│  │  • Incremental learning                               │  │
│  │  • Performance tracking                               │  │
│  │  • Automated retraining triggers                      │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                  Transparency Ledger                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  transparency_ledger.py                               │  │
│  │  • Immutable audit trail                              │  │
│  │  • Blockchain-inspired design                         │  │
│  │  • Cryptographic verification                         │  │
│  │  • Complete provenance tracking                       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Data Collection

**Endpoint:** `POST /api/ingest/interaction`

Every AI interaction is captured with:
- **Question**: User query
- **Responses**: All AI model responses
- **Provenance**: Source, session, user (anonymized)
- **Metadata**: Timestamps, tokens, latency
- **Analysis**: Consensus score, bias detection, sentiment

**Storage Format:** JSON files in `data/oqt-interactions/`

### 2. Data Preparation

**Script:** `ml/pipelines/prepare_dataset.py`

**Process:**
1. Load all interaction files
2. Calculate consensus scores between responses
3. Classify data quality
4. Analyze fairness metrics:
   - Demographic parity
   - Equal opportunity
   - Disparate impact
5. Extract topics and themes
6. Split into train/validation/test sets
7. Generate fairness report

**Output:**
- `ml/data/prepared/train.json`
- `ml/data/prepared/validation.json`
- `ml/data/prepared/test.json`
- `ml/data/prepared/fairness_report.json`

### 3. Model Training

**Script:** `ml/training/train_language_model.py`

**Process:**
1. Load prepared datasets
2. Configure training parameters
3. Train transformer model with fairness objectives
4. Calculate performance and fairness metrics
5. Save model version with metadata
6. Log to transparency ledger

**Output:**
- Model checkpoint
- `models/oqt-1.0/model_version_X_Y_Z.json`
- Ledger entry

### 4. Real-Time Updates

**Script:** `ml/pipelines/realtime_update.py`

**Process:**
1. Monitor for new interactions
2. Track unprocessed data
3. Trigger micro-batch updates when threshold reached
4. Calculate performance trends
5. Detect degradation or bias drift
6. Log updates to ledger

**Monitoring Metrics:**
- Average consensus score
- Bias detection rate
- Response quality
- Model performance trends

## Logging Strategy

### Interaction Logging

Every interaction is logged with:
```javascript
{
  id: "uuid",
  timestamp: "ISO 8601",
  question: "user question",
  responses: [/* AI responses with metadata */],
  provenance: {
    user_id: "anonymized",
    session_id: "session uuid",
    source: "chat|api|batch",
    ip_hash: "hashed IP"
  },
  analysis: {
    consensus_score: 0.85,
    bias_detected: false,
    sentiment: {},
    topics: ["politics", "technology"]
  }
}
```

### Training Logging

Every training run creates:
```json
{
  "version": "1.0.0",
  "timestamp": "2025-01-01T00:00:00Z",
  "training_config": {
    "dataset_size": 10000,
    "epochs": 3,
    "batch_size": 32,
    "learning_rate": 2e-5
  },
  "metrics": {
    "training_loss": 0.342,
    "validation_accuracy": 0.876,
    "fairness_score": 0.912
  },
  "fairness_metrics": {
    "demographic_parity": 0.945,
    "equal_opportunity": 0.928
  },
  "provenance": {
    "training_data_hash": "sha256:...",
    "ledger_block_id": 42,
    "trainer": "system"
  }
}
```

## Provenance Tracking

Every piece of data and model has complete provenance:

1. **Data Provenance**: Where did this data come from?
   - Source (chat/API/batch)
   - Session and user (anonymized)
   - Timestamp
   - IP hash (for security)

2. **Processing Provenance**: How was it processed?
   - Pipeline version
   - Processing timestamp
   - Quality scores
   - Transformations applied

3. **Model Provenance**: How was the model trained?
   - Training data hash
   - Configuration
   - Metrics achieved
   - Ledger block reference

## Fairness Guarantees

### Metrics Tracked

1. **Demographic Parity**
   - Equal positive prediction rates across groups
   - Target: ≥ 0.90

2. **Equal Opportunity**
   - Equal true positive rates across groups
   - Target: ≥ 0.90

3. **Disparate Impact**
   - Ratio of positive rates between groups
   - Target: ≥ 0.80

### Fairness-Aware Training

- Multi-objective loss function balancing accuracy and fairness
- Regular fairness audits during training
- Automated alerts when fairness metrics degrade
- Reweighting of underrepresented groups

## Quality Assurance

### Data Quality

- Minimum question length: 10 characters
- Minimum response length: 20 characters
- Valid JSON structure
- Non-empty required fields

### Model Quality

- Validation accuracy > 0.80
- Fairness score > 0.90
- Bias score < 0.20
- Consensus accuracy > 0.75

### Ledger Integrity

- Hash verification for all blocks
- Chain linkage verification
- Data integrity checks
- Automated auditing

## Usage

### Collect Data

```bash
# Data is automatically collected via API
curl -X POST http://localhost:3000/api/ingest/interaction \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is AI fairness?",
    "responses": [
      {
        "model": "gpt-4",
        "response_text": "AI fairness refers to..."
      }
    ]
  }'
```

### Prepare Dataset

```bash
cd ml/pipelines
python3 prepare_dataset.py
```

### Train Model

```bash
cd ml/training
python3 train_language_model.py --version 1.0.0
```

### Monitor Real-Time

```bash
cd ml/pipelines
python3 realtime_update.py --interval 60 --threshold 100
```

### Verify Ledger

```bash
cd ml/pipelines
python3 transparency_ledger.py --verify
```

## API Endpoints

### Ingest API

- `POST /api/ingest/interaction` - Collect new interaction
- `GET /api/ingest/stats` - Get collection statistics
- `GET /api/ingest/recent` - Get recent interactions

## Best Practices

1. **Always log provenance** - Every data point must have source information
2. **Regular fairness audits** - Run fairness checks after every N interactions
3. **Verify ledger integrity** - Check ledger hashes regularly
4. **Monitor bias drift** - Alert on increasing bias trends
5. **Version everything** - Models, data, configs all get versions
6. **Document changes** - All model updates logged with notes
7. **Anonymize users** - Never store identifying information
8. **Hash sensitive data** - IP addresses and other PII always hashed

## Troubleshooting

### No data collected
- Check if ingest API is running
- Verify data directory exists
- Check file permissions

### Fairness metrics low
- Review data distribution
- Check for biased training data
- Adjust fairness weights

### Ledger verification fails
- Check for file corruption
- Verify no manual edits
- Restore from backup if needed

### Model performance degrading
- Check for data drift
- Review recent updates
- Consider retraining from scratch

## Future Improvements

- [ ] Integration with production ML frameworks (PyTorch/TensorFlow)
- [ ] Distributed training support
- [ ] Advanced fairness techniques (adversarial debiasing)
- [ ] Real-time visualization dashboard
- [ ] Automated model deployment pipeline
- [ ] A/B testing framework
- [ ] Multi-model ensemble training
- [ ] Federated learning support
