# BERT Extractive Summarizer Integration

This document explains how the BERT Extractive Summarizer is integrated into OneSeek.AI to provide neutral, high-precision summaries of AI responses.

## Overview

The **Neutral sammanställning** (Synthesized Summary) now uses **BERT Extractive Summarization** to create maximally neutral summaries from multiple AI service responses.

### Why BERT?

1. **Extractive Approach**: Selects actual sentences from responses (no generation = no added bias)
2. **Semantic Understanding**: BERT's deep learning analyzes meaning, not just keywords
3. **High Precision**: Maintains factual accuracy by using verbatim text
4. **Neutral Tone**: No opinions added, purely extraction of key information

## How It Works

### Architecture

```
Node.js Backend (query_dispatcher.js)
    ↓
generateSynthesizedSummary() - utils/generateSummary.js
    ↓
generateBERTSummary() - services/bertSummarizer.js
    ↓
Python Child Process - python_services/bert_summarizer.py
    ↓
BERT Model (bert-extractive-summarizer library)
    ↓
Returns neutral summary ← ← ← ← ← ← ←
```

### Process Flow

1. **Collect Responses**: All AI service responses are collected
2. **Combine Text**: Responses are concatenated with markers
3. **BERT Analysis**: 
   - Analyzes semantic importance of each sentence
   - Scores sentences based on relevance to overall document
   - Considers position, informativeness, and coherence
4. **Extract Sentences**: Top-scoring sentences are selected
5. **Clean Output**: Markers removed, text formatted
6. **Fallback**: If BERT unavailable, uses keyword-based extraction

## Setup Instructions

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- At least 2GB RAM (for BERT model)

### Installation

1. **Install Python Dependencies**:
   ```bash
   cd backend/python_services
   pip install -r requirements.txt
   ```

2. **Verify Installation**:
   ```bash
   python3 bert_summarizer.py
   # Should wait for JSON input (Ctrl+C to exit)
   ```

3. **Configure Backend**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set:
   # PYTHON_ENABLED=true
   # PYTHON_PATH=python3  (or your preferred Python path)
   ```

### Testing

Test the BERT summarizer directly:

```bash
cd backend/python_services
echo '{"responses": ["Demokrati är ett styrelsesskick där folket har makt. Det handlar om rösträtt och fria val.", "Demokrati innebär folkstyre med politiska partier och val. Viktigt är även yttrandefrihet."], "question": "Vad är demokrati?", "min_length": 50, "max_length": 200}' | python3 bert_summarizer.py
```

Expected output:
```json
{
  "success": true,
  "summary": "Demokrati är ett styrelsesskick där folket har makt. Det handlar om rösträtt och fria val. Viktigt är även yttrandefrihet.",
  "metadata": {
    "original_length": 150,
    "summary_length": 120,
    "compression_ratio": 0.8,
    "num_responses": 2,
    "method": "BERT Extractive Summarization"
  }
}
```

## Configuration

### Parameters

- `min_length`: Minimum characters in summary (default: 100)
- `max_length`: Maximum characters in summary (default: 500)
- `ratio`: Compression ratio (auto-calculated: 20-40%)

### Environment Variables

- `PYTHON_ENABLED=true`: Enable BERT summarizer
- If false or unset, falls back to keyword-based summarization
- `PYTHON_PATH`: Path to Python executable (e.g., `/usr/bin/python3`, `python3`)
  - If not set, defaults to `python`
  - Allows using specific Python versions or virtual environments
  - Examples: `PYTHON_PATH=/usr/local/bin/python3.11` or `PYTHON_PATH=/path/to/venv/bin/python`

## Benefits

### Neutrality

- **No generation**: Only extracts existing sentences
- **No interpretation**: Preserves original wording
- **No bias injection**: Can't add opinions not in source

### Precision

- **Semantic analysis**: Understands context, not just keywords
- **Importance scoring**: Identifies most informative sentences
- **Coherent output**: Maintains logical flow

### Multi-source Handling

- **Fair representation**: Gives all AI services equal consideration
- **Diverse perspectives**: Can include points from different responses
- **Consensus detection**: Identifies common themes

## Fallback Behavior

If BERT is unavailable (Python not installed, dependencies missing, etc.):

1. System logs warning
2. Falls back to keyword-based extraction
3. Continues to function (degraded but working)
4. No user-facing errors

## Performance

- **First run**: ~2-5 seconds (model loading)
- **Subsequent runs**: ~1-2 seconds
- **Memory**: ~500MB-1GB for model
- **Timeout**: 30 seconds maximum

## Troubleshooting

### "Python process error"

Check Python installation:
```bash
python3 --version  # Should be 3.8+
```

### "Module 'summarizer' not found"

Install dependencies:
```bash
cd backend/python_services
pip install -r requirements.txt
```

### "Timeout" errors

Increase timeout in `services/bertSummarizer.js` (line with `setTimeout`)

### Slow performance

- First run loads model (normal)
- Check available RAM
- Consider using smaller model (modify python script)

## Development

### Modifying Summary Logic

Edit `python_services/bert_summarizer.py`:

- Change `ratio` calculation for different compression
- Modify `min_length`/`max_length` defaults
- Adjust sentence cleaning regex

### Testing Changes

Run directly with test data:
```bash
echo '{"responses": [...], "question": "..."}' | python3 bert_summarizer.py
```

## References

- [BERT Paper](https://arxiv.org/abs/1810.04805)
- [bert-extractive-summarizer](https://github.com/dmmiller612/bert-extractive-summarizer)
- [Hugging Face Transformers](https://huggingface.co/transformers/)
