# Change Detection Module - Examples

This directory contains example scripts demonstrating the Change Detection Module functionality.

## Available Examples

### change_detection_demo.py

Demonstrates the basic functionality of the Change Detection Module:
- Establishing a baseline response
- Detecting changes in subsequent responses
- Analyzing change severity, sentiment shifts, and ideology shifts
- Logging to the Transparency Ledger

**Run:**
```bash
cd /path/to/CivicAI/ml/examples
python change_detection_demo.py
```

**Expected Output:**
- Creates demo ledger and change history
- Detects significant change in model response
- Displays change metrics (severity, similarity, sentiment, ideology, ethical tag)
- Shows ledger block ID for transparency audit

## Understanding the Output

### Change Metrics

- **Severity Index (0-1)**: How significant the change is
  - 0.7+ = Major change (🔴 red badge)
  - 0.4-0.7 = Moderate change (🟡 yellow badge)
  - 0-0.4 = Minor change (🟢 green badge)

- **Text Similarity (0-1)**: How similar the texts are
  - 1.0 = Identical
  - 0.0 = Completely different

- **Sentiment Shift**: Changes in emotional tone
  - neutral → positiv
  - neutral → negativ
  - Stabilt [sentiment]

- **Ideology Shift**: Changes in political leaning
  - center → grön/vänster/höger
  - Stabilt [ideology]

- **Ethical Tag**: Impact assessment
  - "Neutral" - No significant ethical implications
  - "Risk för bias" - Potential for biased content
  - "Etiskt relevant" - Has ethical implications for society

### Data Storage

- **Ledger**: `ml/ledger_demo/ledger.json` - Immutable audit trail
- **History**: `ml/change_history_demo/` - Response history per question/model

## Integration Example

See `docs/CHANGE_DETECTION.md` for complete integration guide with:
- Backend API endpoints
- Frontend component usage
- Production deployment considerations
