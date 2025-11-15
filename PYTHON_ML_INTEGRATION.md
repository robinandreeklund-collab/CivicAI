# Python ML Pipeline Integration

## Overview

CivicAI now includes a comprehensive Python-based ML pipeline that provides advanced NLP capabilities using industry-standard tools and models. This integration follows the pipeline structure described in the requirements.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   CivicAI Application                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Node.js Backend (Port 3001)                                │
│  ├── Query Dispatcher                                       │
│  ├── Analysis Pipeline Service                              │
│  └── Python NLP Client ──────────┐                          │
│                                   │                          │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                                    │ HTTP API
                                    │
┌───────────────────────────────────┼──────────────────────────┐
│                                   │                          │
│  Python NLP Service (Port 5001)   │                          │
│  ├── spaCy (Tokenization, POS, NER)                         │
│  ├── TextBlob (Sentiment, Subjectivity)                     │
│  ├── Polyglot (Language Detection)                          │
│  ├── Detoxify (Toxicity Detection)                          │
│  ├── Transformers (Ideology Classification)                 │
│  ├── SHAP (Explainability)                                  │
│  ├── Gensim (Word2Vec, LDA)                                 │
│  └── BERTopic (Topic Modeling)                              │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- 4GB RAM minimum (8GB recommended for ML models)
- Internet connection for downloading models

### Step 1: Install Python Dependencies

```bash
cd backend/python_services
./setup.sh
```

This script will:
1. Create a Python virtual environment
2. Install all required packages (spaCy, Detoxify, BERTopic, etc.)
3. Download spaCy language models (Swedish and/or English)
4. Download TextBlob corpora

**Alternative manual installation:**

```bash
cd backend/python_services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download sv_core_news_sm
python -m textblob.download_corpora
```

### Step 2: Start Python NLP Service

```bash
cd backend/python_services
source venv/bin/activate
python nlp_pipeline.py
```

The service will start on `http://localhost:5001`

### Step 3: Start Node.js Backend

In a separate terminal:

```bash
cd backend
npm install
npm start
```

The backend will automatically detect if the Python service is available.

## Pipeline Components

### 1. Preprocessing (spaCy)

**Tool:** spaCy v3.7.2  
**Model:** `sv_core_news_sm` (Swedish) or `en_core_web_sm` (English)

**Capabilities:**
- Tokenization
- Part-of-speech (POS) tagging
- Dependency parsing
- Named Entity Recognition (NER)
- Lemmatization

**API Endpoint:** `POST /preprocess`

**Example:**
```javascript
import { preprocessWithSpacy } from './services/pythonNLPClient.js';

const result = await preprocessWithSpacy('Texten att analysera...');
// Returns: tokens, sentences, entities, POS tags, dependencies
```

### 2. Sentiment Analysis (TextBlob)

**Tool:** TextBlob v0.17.1

**Capabilities:**
- Polarity score (-1 to +1)
- Subjectivity score (0 to 1)
- Sentiment classification

**API Endpoint:** `POST /sentiment`

**Example:**
```javascript
import { analyzeSentimentWithTextBlob } from './services/pythonNLPClient.js';

const result = await analyzeSentimentWithTextBlob('Text...');
// Returns: polarity, subjectivity, classification
```

### 3. Language Detection (Polyglot)

**Tool:** Polyglot v16.7.4 with CLD2

**Capabilities:**
- Multi-language detection
- Confidence scoring
- Support for 100+ languages

**API Endpoint:** `POST /detect-language`

**Example:**
```javascript
import { detectLanguageWithPolyglot } from './services/pythonNLPClient.js';

const result = await detectLanguageWithPolyglot('Text...');
// Returns: language code, name, confidence
```

### 4. Toxicity Detection (Detoxify)

**Tool:** Detoxify v0.5.2  
**Model:** Multilingual transformer model

**Capabilities:**
- Toxicity detection
- Severe toxicity
- Obscene language
- Threats
- Insults
- Identity attacks

**API Endpoint:** `POST /detect-toxicity`

**Example:**
```javascript
import { detectToxicityWithDetoxify } from './services/pythonNLPClient.js';

const result = await detectToxicityWithDetoxify('Text...');
// Returns: toxicity, severe_toxicity, insult, threat, etc.
```

### 5. Ideology Classification (Transformers)

**Tool:** Hugging Face Transformers v4.36.2  
**Model:** Base transformer (placeholder for PoliticalBERT)

**Capabilities:**
- Political ideology classification
- Left-right-center scoring
- Explainability ready

**API Endpoint:** `POST /classify-ideology`

**Note:** Currently uses base model. For production, fine-tune on political texts using PoliticalBERT or RoBERTa.

**Example:**
```javascript
import { classifyIdeologyWithTransformers } from './services/pythonNLPClient.js';

const result = await classifyIdeologyWithTransformers('Text...');
// Returns: classification, confidence, left/center/right scores
```

### 6. Topic Modeling (BERTopic)

**Tool:** BERTopic v0.16.0  
**Model:** Transformer-based with clustering

**Capabilities:**
- Automatic topic extraction
- Topic clustering
- Hierarchical topics
- Dynamic topic modeling

**API Endpoint:** `POST /topic-modeling`

**Requires:** Multiple texts (minimum 3)

**Example:**
```javascript
import { topicModelingWithBERTopic } from './services/pythonNLPClient.js';

const texts = ['Text 1...', 'Text 2...', 'Text 3...'];
const result = await topicModelingWithBERTopic(texts);
// Returns: topics, topic assignments, topic info
```

### 7. Semantic Similarity (Gensim)

**Tool:** Gensim v4.3.2  
**Models:** Word2Vec, FastText, LDA

**Capabilities:**
- Word embeddings
- Semantic similarity
- Topic modeling with LDA
- Document similarity

**API Endpoint:** `POST /semantic-similarity`

**Note:** Requires training corpus for production use.

### 8. Explainability (SHAP)

**Tool:** SHAP v0.44.0

**Capabilities:**
- Model explainability
- Feature importance
- Word-level contributions
- Visualization support

**Status:** Integrated, ready for use with ideology classifier

## Integration with Existing Pipeline

### Hybrid Approach

The system uses a **hybrid approach**:

1. **Python ML tools** (if available): Advanced capabilities
2. **JavaScript fallback**: Existing lightweight tools

This ensures the system works even if Python service is unavailable.

### Automatic Fallback

```javascript
// Example from query_dispatcher.js
const pythonSentiment = await enhancedSentiment(responseText);

if (pythonSentiment.textblob) {
  // Use Python TextBlob results
  analysis.sentiment = pythonSentiment.textblob;
} else {
  // Fallback to existing JavaScript sentiment
  analysis.sentiment = performSentimentAnalysis(responseText);
}
```

### Pipeline Execution

When a user submits a query:

1. **Node.js backend** receives request
2. **Check Python service** availability
3. **Run Python ML pipeline** (if available):
   - spaCy preprocessing
   - TextBlob sentiment
   - Detoxify toxicity detection
   - Polyglot language detection
4. **Run JavaScript pipeline** (always):
   - compromise.js NLP
   - Custom bias detection
   - Ideological classification
5. **Merge results** from both pipelines
6. **Return comprehensive analysis**

## API Endpoints

### Python NLP Service (Port 5001)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Service health check |
| `/preprocess` | POST | spaCy preprocessing |
| `/sentiment` | POST | TextBlob sentiment |
| `/detect-language` | POST | Polyglot language detection |
| `/detect-toxicity` | POST | Detoxify toxicity detection |
| `/classify-ideology` | POST | Transformer ideology classification |
| `/topic-modeling` | POST | BERTopic topic modeling |
| `/semantic-similarity` | POST | Gensim similarity |
| `/analyze-complete` | POST | Complete pipeline |

### Node.js Backend (Port 3001)

All existing endpoints continue to work, now enhanced with Python ML capabilities when available.

## Configuration

### Environment Variables

Add to `.env`:

```env
# Python NLP Service
PYTHON_NLP_SERVICE_URL=http://localhost:5001
```

### Resource Usage

| Model | RAM Usage | Load Time |
|-------|-----------|-----------|
| spaCy (Swedish) | ~100MB | ~2s |
| TextBlob | ~50MB | <1s |
| Detoxify | ~500MB | ~5s |
| BERTopic | ~1GB | ~10s |
| Transformers (base) | ~500MB | ~5s |

**Total estimated:** 2-3GB RAM for all models loaded

## Production Deployment

### Recommended Setup

1. **Separate services:**
   - Node.js backend: Port 3001
   - Python NLP service: Port 5001
   
2. **Docker containers:**
   - Containerize Python service separately
   - Use docker-compose for orchestration

3. **Load balancing:**
   - Multiple Python service instances
   - Round-robin distribution

4. **Model optimization:**
   - Cache loaded models in memory
   - Use quantized models for faster inference
   - Consider GPU acceleration for heavy models

### Fine-tuning for Swedish/Production

1. **spaCy:** Already using Swedish model (`sv_core_news_sm`)

2. **PoliticalBERT:** Fine-tune on Swedish political texts:
   ```python
   from transformers import AutoModelForSequenceClassification, AutoTokenizer
   
   # Fine-tune on Swedish political corpus
   model = AutoModelForSequenceClassification.from_pretrained('KB/bert-base-swedish-cased')
   # ... training code ...
   ```

3. **BERTopic:** Train on Swedish corpus for better topic detection

4. **Detoxify:** Already uses multilingual model

## Monitoring

### Health Checks

```bash
# Check Python service
curl http://localhost:5001/health

# Check which models are available
curl http://localhost:5001/health | jq '.available_models'
```

### Logs

Python service logs include:
- Model load status
- Processing times
- Errors and warnings

## Troubleshooting

### Python service won't start

**Problem:** Missing dependencies

**Solution:**
```bash
cd backend/python_services
source venv/bin/activate
pip install -r requirements.txt
```

### spaCy model not found

**Problem:** `Can't find model 'sv_core_news_sm'`

**Solution:**
```bash
python -m spacy download sv_core_news_sm
```

### Out of memory

**Problem:** System runs out of RAM

**Solution:**
- Reduce number of models loaded simultaneously
- Use smaller models
- Increase system memory
- Use model lazy-loading

### Slow inference

**Problem:** ML models are slow

**Solution:**
- Use GPU acceleration (install `torch` with CUDA)
- Reduce batch size
- Cache frequent results
- Use quantized models

## Future Enhancements

1. **SHAP Integration:** Add visual explanations for ideology classification
2. **Custom Models:** Train domain-specific models on Swedish political texts
3. **Streaming:** Real-time analysis for long texts
4. **Batch Processing:** Optimize for analyzing multiple texts
5. **Model Versioning:** Track and manage different model versions
6. **A/B Testing:** Compare different models and approaches

## References

- [spaCy Documentation](https://spacy.io/)
- [TextBlob Documentation](https://textblob.readthedocs.io/)
- [Detoxify GitHub](https://github.com/unitaryai/detoxify)
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/)
- [Gensim Documentation](https://radimrehurek.com/gensim/)
- [Hugging Face Transformers](https://huggingface.co/transformers/)
- [SHAP Documentation](https://shap.readthedocs.io/)

## License

MIT - See main project license
