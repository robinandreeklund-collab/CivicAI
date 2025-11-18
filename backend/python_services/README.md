# CivicAI Python NLP Service

Advanced NLP analysis service for CivicAI using Python machine learning libraries.

## Quick Start

### Windows (PowerShell)

```powershell
# Run automated setup
.\setup_windows.ps1

# Or manual installation:
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download sv_core_news_sm
python -m textblob.download_corpora

# Start service
python nlp_pipeline.py
```

### Linux / macOS

```bash
# Run automated setup
./setup.sh

# Or manual installation:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download sv_core_news_sm
python -m textblob.download_corpora

# Start service
python nlp_pipeline.py
```

## Features

### ✅ Core Features (Windows-compatible)

- **spaCy 3.7.2** - Tokenization, POS-tagging, NER
- **TextBlob 0.17.1** - Sentiment and subjectivity analysis
- **langdetect 1.0.9** - Language detection (55+ languages)
- **Detoxify 0.5.2** - Toxicity detection
- **Transformers 4.36.2** - Swedish BERT for ideology classification
- **SHAP 0.44.0** - Model explainability
- **Gensim 4.3.2** - LDA topic modeling, Word2Vec

### ⚠️ Optional Features (May require compilation on Windows)

- **BERTopic 0.16.0** - Advanced transformer-based topic modeling
  - Requires: `umap-learn`, `hdbscan` (need C++ compiler on Windows)
  - **Fallback:** System uses Gensim LDA when BERTopic unavailable
  - **Windows users:** Can skip BERTopic - Gensim provides good topic modeling

## Windows Installation Issues

### Problem: hdbscan compilation error

**Error message:**
```
ERROR: Failed building wheel for hdbscan
```

**Solution:** BERTopic is optional. The system automatically uses Gensim LDA for topic modeling when BERTopic is unavailable.

**If you want BERTopic on Windows:**
1. Install Microsoft C++ Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. After installation, run:
   ```powershell
   pip install hdbscan
   pip install umap-learn
   pip install bertopic
   ```

**Or just skip it:** The system works great without BERTopic using Gensim LDA instead.

## API Endpoints

### Health Check
```bash
GET http://localhost:5001/health
```

### Preprocessing
```bash
POST http://localhost:5001/preprocess
Content-Type: application/json

{"text": "Din svenska text här"}
```

### Language Detection
```bash
POST http://localhost:5001/detect-language
Content-Type: application/json

{"text": "Din text här"}
```

### Toxicity Detection
```bash
POST http://localhost:5001/detect-toxicity
Content-Type: application/json

{"text": "Din text här"}
```

### Ideology Classification
```bash
POST http://localhost:5001/classify-ideology
Content-Type: application/json

{"text": "Politisk text här"}
```

### Topic Modeling (requires BERTopic OR uses Gensim fallback)
```bash
POST http://localhost:5001/extract-topics
Content-Type: application/json

{"texts": ["Text 1", "Text 2", "Text 3"]}
```

## Troubleshooting

### PowerShell Execution Policy Error

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Python Not Found

Download and install Python 3.8+ from: https://www.python.org/downloads/

During installation, check "Add Python to PATH"

### Virtual Environment Won't Activate

```powershell
# Use full path
C:\Path\To\Project\backend\python_services\venv\Scripts\Activate.ps1
```

### Dependency Installation Fails

This is normal on Windows for packages requiring compilation (hdbscan, umap-learn). The system works fine without them.

## Architecture

```
┌──────────────────────────────────────┐
│   Node.js Backend (Port 3001)       │
│   ├─ Orchestrates AI requests       │
│   ├─ Calls Python service (optional)│
│   └─ Falls back to JavaScript       │
└───────────────┬──────────────────────┘
                │
                ▼
┌──────────────────────────────────────┐
│  Python NLP Service (Port 5001)      │
│  ├─ spaCy (Tokenization, NER)       │
│  ├─ TextBlob (Sentiment)            │
│  ├─ langdetect (Language)           │
│  ├─ Detoxify (Toxicity)             │
│  ├─ Transformers (Ideology)         │
│  ├─ Gensim (Topic Modeling)         │
│  └─ BERTopic (Optional)             │
└──────────────────────────────────────┘
```

## Environment Variables

Optional Flask debug mode (defaults to False for security):

```bash
# Linux/macOS
export FLASK_DEBUG=false
python nlp_pipeline.py

# Windows PowerShell
$env:FLASK_DEBUG="false"
python nlp_pipeline.py
```

## Requirements

- **Python:** 3.8 or higher
- **RAM:** ~2-3 GB for ML models
- **Disk:** ~2 GB for models and dependencies
- **C++ Compiler:** Optional (only for BERTopic on Windows)

## Additional: Enabling optional models and verifying availability
- BERTopic requires `umap-learn` and `hdbscan`. On Windows you may need Visual C++ Build Tools.
- After installing optional deps, restart the Python service and check `/health`.
- Example checks:
  - `curl http://localhost:5001/health`
  - `curl http://localhost:3001/api/health`

Production note: set `FLASK_DEBUG=false` and ensure the Python service has adequate memory for transformer models.

## License

Part of the CivicAI project.
