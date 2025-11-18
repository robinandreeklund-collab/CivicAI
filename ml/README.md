# Machine Learning Pipelines - OpenSeek.AI

This directory contains ML pipelines and components for the OpenSeek.AI platform.

## Directory Structure

```
ml/
├── pipelines/           # ML processing pipelines
│   ├── change_detection.py      # Change detection & analysis
│   ├── transparency_ledger.py   # Blockchain-inspired audit trail
│   ├── prepare_dataset.py       # Dataset preparation
│   └── realtime_update.py       # Real-time model updates
├── training/            # Model training scripts
│   └── train_language_model.py
├── examples/            # Example scripts and demos
│   ├── change_detection_demo.py # Change detection demo
│   └── README.md
├── ledger/             # Transparency ledger data (gitignored)
├── change_history/     # Change detection history (gitignored)
└── README.md           # This file
```

## Key Components

### Change Detection Module (`pipelines/change_detection.py`)

**Purpose:** Automatically detect and analyze changes in AI model responses over time.

**Features:**
- Text similarity analysis (Jaccard similarity, upgradeable to embeddings)
- Sentiment shift detection
- Ideology shift detection
- Change Severity Index (0-1 scale)
- Bias Drift Tracking
- Explainability Delta (feature importance)
- Thematic Drift analysis
- Consensus Shift detection (multi-model)
- Ethical Impact Tagging

**Usage:**
```python
from pipelines.change_detection import ChangeDetectionModule

detector = ChangeDetectionModule(ledger_dir, history_dir)

change = detector.detect_change(
    question="Vad tycker du om klimatpolitik?",
    model="Grok",
    current_response="...",
    model_version="2025.11"
)

if change:
    print(f"Severity: {change['change_metrics']['severity_index']}")
    print(f"Ledger Block: {change['ledger_block_id']}")
```

**CLI:**
```bash
# Run test with mock data
python pipelines/change_detection.py --test

# Show change history
python pipelines/change_detection.py --history "Your question here"
```

**Documentation:** See `docs/CHANGE_DETECTION.md` for complete guide.

### Transparency Ledger (`pipelines/transparency_ledger.py`)

**Purpose:** Blockchain-inspired immutable audit trail for all ML operations.

**Features:**
- Cryptographic hash-linked blocks
- Multiple event types: training, update, audit, review, data_collection, change_detection
- Chain verification
- Audit report export

**Usage:**
```python
from pipelines.transparency_ledger import TransparencyLedger

ledger = TransparencyLedger(ledger_dir)

# Add event
block = ledger.add_block('change_detection', {
    'model': 'Grok',
    'severity_index': 0.78,
    'sentiment_shift': 'neutral → positiv',
    # ... more data
})

# Verify integrity
verification = ledger.verify_chain()
print(verification['valid'])  # True if chain is intact
```

**CLI:**
```bash
# Verify ledger
python pipelines/transparency_ledger.py --verify

# List all blocks
python pipelines/transparency_ledger.py --list

# Export audit report
python pipelines/transparency_ledger.py --export audit_report.json
```

## Examples

See `examples/` directory for demo scripts.

**Quick Start:**
```bash
cd ml/examples
python change_detection_demo.py
```

## Frontend Integration

The ML pipelines integrate with React frontend components:

- `ChangeDetectionPanel.jsx` - Display change analysis in chat
- `ReplayTimeline.jsx` - Timeline visualization of changes
- `NarrativeHeatmap.jsx` - Heatmap of narrative shifts
- `BiasDriftRadar.jsx` - Radar chart for bias tracking

See `frontend/src/components/` for implementation.

## Production Considerations

### Current Implementation (MVP)
- Keyword-based sentiment and ideology detection
- Jaccard similarity for text comparison
- File-based storage (JSON)

### Production Upgrades
- **Embeddings:** sentence-transformers for semantic similarity
- **ML Models:** BERT-based sentiment and ideology classifiers
- **Explainability:** SHAP/LIME for feature importance
- **Topic Modeling:** BERTopic or LDA for theme extraction
- **Database:** PostgreSQL/MongoDB for scalability
- **Caching:** Redis for performance
- **Async Processing:** Celery for background jobs

See `docs/CHANGE_DETECTION.md` for detailed upgrade path.

## Data Privacy

- Questions are hashed (SHA-256) before storage
- No personal information is retained
- All data is anonymized and aggregated
- Ledger provides transparency without compromising privacy

## Contributing

When adding new ML pipelines:

1. Follow existing code structure
2. Add type hints and docstrings
3. Include CLI interface for testing
4. Update this README
5. Add examples in `examples/`
6. Document in `docs/`

## License

Part of the OpenSeek.AI platform.
