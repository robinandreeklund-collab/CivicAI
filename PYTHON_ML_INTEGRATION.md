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
│  ├── langdetect (Language Detection - Windows-compatible)   │
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

**Linux / macOS:**

```bash
cd backend/python_services
./setup.sh
```

**Windows (PowerShell):**

```powershell
cd backend\python_services
.\setup_windows.ps1
```

This script will:
1. Create a Python virtual environment
2. Install all required packages (spaCy, Detoxify, Gensim, etc.)
3. Download spaCy language models (Swedish and/or English)
4. Download TextBlob corpora
5. Check for Windows Long Path support

**Important Windows Notes:**

1. **BERTopic:** May fail to install due to compilation requirements (hdbscan, umap-learn). This is normal - the system will automatically use Gensim LDA for topic modeling instead.

2. **Lux/Sweetviz (Long Path Issue):** These packages require Windows Long Path support enabled. If you encounter an error like:
   ```
   ERROR: Could not install packages due to an OSError: [Errno 2] No such file or directory
   HINT: This error might have occurred since this system does not have Windows Long Path support enabled.
   ```
   
   **Solution A (Recommended):** Enable Windows Long Paths
   - Run PowerShell as Administrator
   - Execute:
     ```powershell
     New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
       -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
     ```
   - Restart your computer
   - Re-run `.\setup_windows.ps1`
   
   **Solution B:** Skip optional EDA packages
   - Edit `requirements.txt` and comment out `lux-api` and `sweetviz`
   - Set environment variables: `$env:ENABLE_LUX="false"` and `$env:ENABLE_SWEETVIZ="false"`
   - Core functionality (SHAP, LIME, Fairlearn) will still work
   
   See `TROUBLESHOOTING.md` for detailed instructions.

**Alternative manual installation (Linux/macOS):**

```bash
cd backend/python_services
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download sv_core_news_sm
python -m textblob.download_corpora
```

**Alternative manual installation (Windows):**

```powershell
cd backend\python_services
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m spacy download sv_core_news_sm
python -m textblob.download_corpora
```

### Step 2: Start Python NLP Service

**Linux / macOS:**

```bash
cd backend/python_services
source venv/bin/activate
python nlp_pipeline.py
```

**Windows (PowerShell):**

```powershell
cd backend\python_services
.\venv\Scripts\Activate.ps1
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

### 3. Language Detection (langdetect)

**Tool:** langdetect v1.0.9

**Capabilities:**
- Multi-language detection (55+ languages)
- Confidence scoring
- Windows-compatible (replaces Polyglot)

**API Endpoint:** `POST /detect-language`

**Example:**
```javascript
import { detectLanguageWithPolyglot } from './services/pythonNLPClient.js';

const result = await detectLanguageWithPolyglot('Text...');
// Returns: language code, name, confidence
```

**Note:** Uses langdetect instead of Polyglot for better Windows compatibility.

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
**Model:** KB/bert-base-swedish-cased (Swedish BERT)

**Capabilities:**
- Political ideology classification
- Left-right-center scoring
- Keyword-enhanced classification with Swedish political lexicons

**API Endpoint:** `POST /classify-ideology`

**Note:** Uses KB/bert-base-swedish-cased (Swedish BERT) with keyword analysis for political classification. For optimal results in production, fine-tune on a labeled Swedish political corpus.

**Example:**
```javascript
import { classifyIdeologyWithTransformers } from './services/pythonNLPClient.js';

const result = await classifyIdeologyWithTransformers('Text...');
// Returns: classification, confidence, left/center/right scores
```

### 6. Topic Modeling (BERTopic / Gensim)

**Primary Tool:** BERTopic v0.16.0 (Optional - requires compilation on Windows)  
**Fallback Tool:** Gensim v4.3.2 LDA (Always available)  
**Model:** Transformer-based with clustering (BERTopic) or LDA (Gensim)

**Capabilities:**
- Automatic topic extraction
- Topic clustering
- Hierarchical topics (BERTopic)
- Dynamic topic modeling

**API Endpoint:** `POST /topic-modeling`

**Requires:** Multiple texts (minimum 3)

**Windows Note:** BERTopic may not install on Windows due to hdbscan/umap-learn compilation requirements. The system automatically uses Gensim LDA for topic modeling when BERTopic is unavailable - this provides excellent topic modeling without compilation issues.

**Example:**
```javascript
import { topicModelingWithBERTopic } from './services/pythonNLPClient.js';

const texts = ['Text 1...', 'Text 2...', 'Text 3...'];
const result = await topicModelingWithBERTopic(texts);
// Returns: topics, topic assignments, topic info
// Uses BERTopic if available, otherwise Gensim LDA
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

2. **Swedish BERT for Political Ideology:** Currently using KB/bert-base-swedish-cased with keyword analysis

   **To fine-tune on Swedish political texts:**
   ```python
   from transformers import AutoModelForSequenceClassification, AutoTokenizer, Trainer, TrainingArguments
   import pandas as pd
   import torch
   
   # Load Swedish BERT
   model = AutoModelForSequenceClassification.from_pretrained(
       'KB/bert-base-swedish-cased',
       num_labels=3  # left, center, right
   )
   tokenizer = AutoTokenizer.from_pretrained('KB/bert-base-swedish-cased')
   
   # Prepare your labeled Swedish political corpus
   # Format: CSV with columns 'text' and 'label' (0=left, 1=center, 2=right)
   train_df = pd.read_csv('swedish_political_corpus.csv')
   
   # Tokenize
   train_encodings = tokenizer(
       train_df['text'].tolist(),
       truncation=True,
       padding=True,
       max_length=512
   )
   
   # Create dataset
   class PoliticalDataset(torch.utils.data.Dataset):
       def __init__(self, encodings, labels):
           self.encodings = encodings
           self.labels = labels
       
       def __getitem__(self, idx):
           item = {key: torch.tensor(val[idx]) for key, val in self.encodings.items()}
           item['labels'] = torch.tensor(self.labels[idx])
           return item
       
       def __len__(self):
           return len(self.labels)
   
   train_dataset = PoliticalDataset(train_encodings, train_df['label'].tolist())
   
   # Training arguments
   training_args = TrainingArguments(
       output_dir='./political_bert_swedish',
       num_train_epochs=3,
       per_device_train_batch_size=8,
       warmup_steps=500,
       weight_decay=0.01,
   )
   
   # Train
   trainer = Trainer(model=model, args=training_args, train_dataset=train_dataset)
   trainer.train()
   model.save_pretrained('./political_bert_swedish_final')
   tokenizer.save_pretrained('./political_bert_swedish_final')
   ```
   
   **Update `nlp_pipeline.py` to use fine-tuned model:**
   ```python
   # In load_ideology_classifier():
   model_name = "./political_bert_swedish_final"
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

1. ~~**SHAP Integration:** Add visual explanations for ideology classification~~ ✓ **COMPLETED**
2. **Custom Models:** Train domain-specific models on Swedish political texts
3. **Streaming:** Real-time analysis for long texts
4. **Batch Processing:** Optimize for analyzing multiple texts
5. **Model Versioning:** Track and manage different model versions
6. **A/B Testing:** Compare different models and approaches

## New Integrations (v1.1.0)

### 8. Model Explainability (SHAP)

**Tool:** SHAP v0.44.0

**Capabilities:**
- Global feature importance analysis
- Model-agnostic explanations
- Feature contribution visualization
- Support for transformer models

**API Endpoint:** `POST /explain-shap`

**Configuration:** Set `ENABLE_SHAP=true` (default: enabled)

**Example:**
```javascript
import { explainWithSHAP } from './services/pythonNLPClient.js';

const result = await explainWithSHAP('Text to explain...');
// Returns: feature_importance for each class, provenance
```

**Output Format:**
```json
{
  "feature_importance": [
    {
      "class": "left",
      "features": [["välfärd", 0.45], ["jämlikhet", 0.32]]
    }
  ],
  "explanation_type": "global",
  "model": "KB/bert-base-swedish-cased"
}
```

### 9. Local Explanations (LIME)

**Tool:** LIME v0.2.0.1

**Capabilities:**
- Local interpretable model-agnostic explanations
- Word-level contribution analysis
- Individual prediction explanations
- Alternative prediction scenarios

**API Endpoint:** `POST /explain-lime`

**Configuration:** Set `ENABLE_LIME=true` (default: enabled)

**Example:**
```javascript
import { explainWithLIME } from './services/pythonNLPClient.js';

const result = await explainWithLIME('Text to explain...', { num_features: 10 });
// Returns: explanation with word contributions, prediction probabilities
```

**Output Format:**
```json
{
  "explanation": [["balansera", 0.35], ["kompromiss", 0.28]],
  "prediction": {"left": 0.21, "center": 0.67, "right": 0.12},
  "predicted_class": "center",
  "text": "Original text..."
}
```

### 10. Fairness Analysis (Fairlearn)

**Tool:** Fairlearn v0.10.0

**Capabilities:**
- Demographic parity measurement
- Equal opportunity analysis
- Fairness metrics computation
- Bias detection across groups

**API Endpoint:** `POST /fairness-metrics`

**Configuration:** Set `ENABLE_FAIRLEARN=true` (default: enabled)

**Example:**
```javascript
import { analyzeFairness } from './services/pythonNLPClient.js';

const result = await analyzeFairness({
  texts: ['Text 1...', 'Text 2...'],
  sensitive_features: ['Group A', 'Group B']
});
// Returns: selection_rates, demographic_parity, fairness_status
```

**Output Format:**
```json
{
  "selection_rates": {
    "Group A": {"left": 0.22, "center": 0.51, "right": 0.27}
  },
  "demographic_parity": {"left": 0.06, "center": 0.08, "right": 0.02},
  "overall_fairness_score": 0.08,
  "fairness_status": "fair"
}
```

### 11. EDA Reports (Sweetviz)

**Tool:** Sweetviz v2.3.1

**Capabilities:**
- Automated HTML report generation
- Dataset comparison (train vs test)
- Feature correlation analysis
- Missing value detection

**API Endpoint:** `POST /generate-eda-report`

**Configuration:** Set `ENABLE_SWEETVIZ=true` (default: enabled)

**Example:**
```javascript
import { generateEDAReport } from './services/pythonNLPClient.js';

const result = await generateEDAReport({
  dataset: [{text: '...', label: 'left'}, ...],
  report_name: 'training_data'
});
// Returns: report_path, report_html, summary statistics
```

### 12. Interactive Visualizations (Lux)

**Tool:** Lux v0.5.0

**Capabilities:**
- Automatic visualization recommendations
- Interactive Pandas DataFrame enhancement
- Smart chart selection
- One-line visualization generation

**API Endpoint:** `POST /lux-recommendations`

**Configuration:** Set `ENABLE_LUX=true` (default: enabled)

**Example:**
```javascript
import { getLuxRecommendations } from './services/pythonNLPClient.js';

const result = await getLuxRecommendations({
  dataset: [{prediction: 'left', confidence: 0.8}, ...]
});
// Returns: visualization recommendations and dataset summary
```

## Complete Data Flow (Updated)

```
┌──────────────────────────────────────────────────────────────┐
│                     User Query                                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              1. PREPROCESSING                                 │
│  • spaCy (tokenization, POS, NER)                            │
│  • TextBlob (sentiment, subjectivity)                        │
│  • langdetect (language detection)                           │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              2. BIAS & TOXICITY DETECTION                     │
│  • Detoxify (toxicity, threats, insults)                     │
│  • Custom bias detector (political, commercial)              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              3. IDEOLOGY CLASSIFICATION                       │
│  • Swedish BERT (KB/bert-base-swedish-cased)                 │
│  • Left/Center/Right classification                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              4. EXPLAINABILITY (NEW)                          │
│  • SHAP (global feature importance)                          │
│  • LIME (local explanations per prediction)                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              5. FAIRNESS ANALYSIS (NEW)                       │
│  • Fairlearn (demographic parity)                            │
│  • Equal opportunity metrics                                 │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              6. DATA QUALITY (NEW)                            │
│  • Sweetviz (EDA reports)                                    │
│  • Lux (interactive visualizations)                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│              7. UI PRESENTATION                               │
│  • PipelineAnalysisPanel (all results)                       │
│  • Explainability tab (SHAP/LIME)                            │
│  • Fairness tab (metrics/indicators)                         │
│  • Data Quality section (reports)                            │
└──────────────────────────────────────────────────────────────┘
```

## Configuration Guide

### Environment Variables

Add to `.env`:

```env
# Python NLP Service
PYTHON_NLP_SERVICE_URL=http://localhost:5001

# Feature Flags (all default to true)
ENABLE_LUX=true
ENABLE_SWEETVIZ=true
ENABLE_SHAP=true
ENABLE_LIME=true
ENABLE_FAIRLEARN=true
```

### Disable Specific Features

To disable a feature (e.g., for performance or resource constraints):

```env
ENABLE_SHAP=false
ENABLE_LIME=false
```

## API Endpoints (Updated)

### Python NLP Service (Port 5001)

| Endpoint | Method | Purpose | New in v1.1 |
|----------|--------|---------|-------------|
| `/health` | GET | Service health check | - |
| `/preprocess` | POST | spaCy preprocessing | - |
| `/sentiment` | POST | TextBlob sentiment | - |
| `/detect-language` | POST | Language detection | - |
| `/detect-toxicity` | POST | Detoxify toxicity detection | - |
| `/classify-ideology` | POST | Transformer ideology classification | - |
| `/topic-modeling` | POST | BERTopic topic modeling | - |
| `/semantic-similarity` | POST | Gensim similarity | - |
| `/analyze-complete` | POST | Complete pipeline | - |
| `/explain-shap` | POST | SHAP feature importance | ✓ |
| `/explain-lime` | POST | LIME local explanations | ✓ |
| `/fairness-metrics` | POST | Fairness analysis | ✓ |
| `/generate-eda-report` | POST | Sweetviz EDA reports | ✓ |
| `/lux-recommendations` | POST | Lux visualizations | ✓ |

## References

- [spaCy Documentation](https://spacy.io/)
- [TextBlob Documentation](https://textblob.readthedocs.io/)
- [Detoxify GitHub](https://github.com/unitaryai/detoxify)
- [BERTopic Documentation](https://maartengr.github.io/BERTopic/)
- [Gensim Documentation](https://radimrehurek.com/gensim/)
- [Hugging Face Transformers](https://huggingface.co/transformers/)
- [SHAP Documentation](https://shap.readthedocs.io/)
- [LIME Documentation](https://lime-ml.readthedocs.io/)
- [Fairlearn Documentation](https://fairlearn.org/)
- [Sweetviz Documentation](https://github.com/fbdesignpro/sweetviz)
- [Lux Documentation](https://lux-api.readthedocs.io/)

## License

MIT - See main project license
