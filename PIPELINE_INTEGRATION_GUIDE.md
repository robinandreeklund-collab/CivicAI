# 🔬 Pipeline Integration - Quick Guide

This guide helps you get started with the newly integrated analysis pipeline that includes advanced Python ML capabilities.

## What's New?

CivicAI now includes a comprehensive analysis pipeline with Python ML libraries:

- **spaCy** - Advanced tokenization and NLP
- **TextBlob** - Sentiment polarity and subjectivity
- **Polyglot** - Multi-language detection
- **Detoxify** - ML-based toxicity detection
- **BERTopic** - Transformer-based topic modeling
- **Transformers** - Political ideology classification (ready for fine-tuning)
- **Gensim** - Word embeddings and semantic analysis
- **SHAP** - Model explainability

## Two Modes of Operation

### Mode 1: JavaScript Only (Default)
**Works immediately, no setup needed**

```bash
cd backend
npm start
```

The system uses lightweight JavaScript implementations for all analysis.

### Mode 2: Python ML Enhanced (Recommended)
**Requires Python setup, provides advanced capabilities**

```bash
# Terminal 1: Start Python ML service
cd backend/python_services
./setup.sh
source venv/bin/activate
python nlp_pipeline.py

# Terminal 2: Start Node.js backend
cd backend
npm start
```

The system automatically uses Python ML when available, falls back to JavaScript if not.

## Installation Steps

### 1. Install Python Dependencies

```bash
cd backend/python_services
./setup.sh
```

This script:
- Creates a Python virtual environment
- Installs all ML libraries (spaCy, Detoxify, BERTopic, etc.)
- Downloads spaCy language models
- Downloads TextBlob corpora

### 2. Start Services

**Terminal 1 - Python ML Service:**
```bash
cd backend/python_services
source venv/bin/activate
python nlp_pipeline.py
```

Output:
```
CivicAI Python NLP Pipeline Service
Available models:
  spaCy:        ✓
  TextBlob:     ✓
  Polyglot:     ✓
  Detoxify:     ✓
  ...
Starting Flask server on http://localhost:5001
```

**Terminal 2 - Node.js Backend:**
```bash
cd backend
npm start
```

Output:
```
🚀 OneSeek.AI Backend running on port 3001
🐍 Python NLP Service: AVAILABLE
   Available models: {...}
```

## What Changes When Python ML is Enabled?

### Enhanced Analysis

With Python ML, each AI response includes:

```javascript
{
  // Standard analysis (always present)
  analysis: {
    tone: {...},
    bias: {...},
    factCheck: {...}
  },
  
  // Enhanced analysis (JavaScript)
  enhancedAnalysis: {
    emotion: {...},
    topics: {...},
    intent: {...}
  },
  
  // Pipeline analysis (NEW - with Python ML)
  pipelineAnalysis: {
    preprocessing: {
      spacy: { tokens: [...], entities: [...] },  // Python
      textblob: { polarity: 0.1, subjectivity: 0.5 },  // Python
      polyglot: { language: "sv", confidence: 0.95 }  // Python
    },
    biasAnalysis: {
      detoxify: { toxicity: 0.02, is_toxic: false }  // Python
    },
    topicModeling: {
      bertopic: { topics: [...], clusters: [...] }  // Python
    }
  }
}
```

### Better Topic Detection

**JavaScript:** Basic keyword extraction  
**Python ML (BERTopic):** Transformer-based semantic clustering

### More Accurate Sentiment

**JavaScript:** Basic lexicon matching  
**Python ML (TextBlob):** Context-aware polarity and subjectivity

### Advanced Toxicity Detection

**JavaScript:** Keyword-based aggression detection  
**Python ML (Detoxify):** ML model detecting toxicity, threats, insults

## Viewing Pipeline Data

### In Frontend

Pipeline data is automatically visible in:

1. **Individual AI Answers** (AgentBubble component)
   - Click "Visa utökad analys" to see enhanced analysis
   - Click "Pipeline-analys" to see complete pipeline

2. **Model Synthesis View**
   - Compares pipeline results across all AI models
   - Shows divergences and consensus

3. **Complete Pipeline Analysis**
   - Full timeline of all steps
   - Quality indicators and risk flags
   - Tool metadata and provenance

### In Exports

All export formats (YAML, JSON, PDF, README) now include complete pipeline data:

```yaml
responses:
  - agent: "gpt-3.5"
    response: "..."
    pipelineAnalysis:
      preprocessing: {...}
      biasAnalysis: {...}
      sentimentAnalysis: {...}
      timeline:
        - step: "preprocessing"
          model: "spaCy 3.7.2"
          durationMs: 45
```

## API Endpoints

### Python ML Service (Port 5001)

```bash
# Check service health
curl http://localhost:5001/health

# Preprocess text with spaCy
curl -X POST http://localhost:5001/preprocess \
  -H "Content-Type: application/json" \
  -d '{"text": "Din text här..."}'

# Detect toxicity with Detoxify
curl -X POST http://localhost:5001/detect-toxicity \
  -H "Content-Type: application/json" \
  -d '{"text": "Din text här..."}'

# Get complete analysis
curl -X POST http://localhost:5001/analyze-complete \
  -H "Content-Type: application/json" \
  -d '{"text": "Din text här..."}'
```

### Node.js Backend (Port 3001)

```bash
# Get pipeline configuration
curl http://localhost:3001/api/analysis-pipeline/config

# Get pipeline steps
curl http://localhost:3001/api/analysis-pipeline/steps

# Analyze text
curl -X POST http://localhost:3001/api/analysis-pipeline/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "Din text här..."}'
```

## Troubleshooting

### Python service won't start

**Error:** `ModuleNotFoundError: No module named 'spacy'`

**Solution:**
```bash
cd backend/python_services
source venv/bin/activate
pip install -r requirements.txt
```

### spaCy model not found

**Error:** `Can't find model 'sv_core_news_sm'`

**Solution:**
```bash
python -m spacy download sv_core_news_sm
```

### Backend shows "Python NLP Service: NOT AVAILABLE"

This is normal if Python service isn't running. The system will use JavaScript fallbacks.

**To enable Python ML:**
1. Make sure Python service is running on port 5001
2. Restart Node.js backend to detect it

### Out of memory

Python ML models use 2-3GB RAM. If you run out of memory:
- Close other applications
- Increase system RAM
- Use JavaScript-only mode

## Configuration

### Environment Variables

Add to backend `.env`:

```env
# Python NLP Service (optional)
PYTHON_NLP_SERVICE_URL=http://localhost:5001

# Flask (for Python service)
FLASK_DEBUG=false  # Set to true only in development
```

### Production Deployment

For production, consider:

1. **Docker Containers:**
```dockerfile
# Python service container
FROM python:3.9-slim
COPY backend/python_services /app
RUN pip install -r /app/requirements.txt
CMD ["python", "/app/nlp_pipeline.py"]
```

2. **Process Managers:**
```bash
# Use PM2 for Node.js
pm2 start backend/index.js

# Use gunicorn for Python
gunicorn -w 4 -b 0.0.0.0:5001 nlp_pipeline:app
```

3. **Load Balancing:**
- Run multiple Python service instances
- Use nginx for load balancing

## Documentation

For detailed information, see:

- **PYTHON_ML_INTEGRATION.md** - Complete integration guide
- **PIPELINE_INTEGRATION_SUMMARY.md** - Implementation overview
- **PIPELINE_VISUAL_GUIDE.md** - Architecture diagrams
- **backend/python_services/README.md** - Python service guide

## Summary

✅ **Backward Compatible** - Existing functionality preserved  
✅ **Automatic Fallback** - Works with or without Python  
✅ **Enhanced Capabilities** - Advanced ML when enabled  
✅ **Full Transparency** - Complete provenance tracking  
✅ **Production Ready** - Secure and tested  

The pipeline integration provides powerful ML capabilities while maintaining the reliability of the existing system. Start with JavaScript-only mode and add Python ML when you're ready for advanced analysis!
