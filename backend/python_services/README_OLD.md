# Python Services for OneSeek.AI

This directory contains Python-based services that enhance the backend functionality.

## BERT Extractive Summarizer

Uses BERT-based extractive summarization to create neutral, high-precision summaries from multiple AI responses.

### Setup

1. Install Python 3.8+ if not already installed
2. Install dependencies:
   ```bash
   cd backend/python_services
   pip install -r requirements.txt
   ```

### Usage

The service is called from Node.js via child_process and communicates through stdin/stdout using JSON.

**Input format:**
```json
{
  "responses": ["Response 1 text...", "Response 2 text..."],
  "question": "Original question",
  "min_length": 100,
  "max_length": 500
}
```

**Output format:**
```json
{
  "success": true,
  "summary": "Extracted summary text...",
  "metadata": {
    "original_length": 1500,
    "summary_length": 450,
    "compression_ratio": 0.3,
    "num_responses": 5,
    "method": "BERT Extractive Summarization"
  }
}
```

### How it works

1. **Combines responses**: All AI responses are concatenated into a single document
2. **BERT analysis**: Uses pre-trained BERT model to analyze semantic importance
3. **Extractive selection**: Selects the most important sentences based on:
   - Semantic similarity to the overall document
   - Information content
   - Positional importance
4. **Neutral output**: Extracts verbatim sentences (no generation), ensuring:
   - No added bias
   - High precision
   - Factual accuracy maintained

### Benefits

- **Neutrality**: Extractive approach ensures no new bias is introduced
- **Precision**: Uses actual sentences from responses, maintaining accuracy
- **Context-aware**: BERT understanding of context helps select most relevant content
- **Multi-source**: Combines insights from all AI services fairly
