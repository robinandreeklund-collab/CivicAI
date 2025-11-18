# 🧭 CivicAI (OneSeek.AI)

**Beslut med insyn. AI med ansvar.**

A transparent platform for comparing and analyzing AI model responses with advanced NLP analysis, consensus debate mechanisms, and blockchain-inspired transparency ledger.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://www.python.org/)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Current Status](#-current-status)
- [Features](#-features)
- [Architecture](#-architecture)
- [Module Status](#-module-status)
- [Data Models](#-data-models)
- [Quality & Ethics](#-quality--ethics)
- [Documentation](#-documentation)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Python** 3.8+ (optional, for ML features)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/robinandreeklund-collab/CivicAI.git
   cd CivicAI
   ```

2. **Run setup script**
   ```bash
   ./scripts/setup.sh
   ```
   This will:
   - Install all dependencies
   - Create environment files
   - Check prerequisites

3. **Configure API keys**
   
   Edit `backend/.env` and add your API keys:
   ```env
   OPENAI_API_KEY=your_openai_key
   GEMINI_API_KEY=your_gemini_key
   DEEPSEEK_API_KEY=your_deepseek_key
   ```

   Get your keys:
   - OpenAI: https://platform.openai.com/api-keys
   - Gemini: https://aistudio.google.com/app/apikey
   - DeepSeek: https://platform.deepseek.com/

4. **Start the application**

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm start
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to http://localhost:5173

### Optional: Python ML Service

For advanced ML features (spaCy, Detoxify, BERTopic):

```bash
cd backend/python_services
./setup.sh
python3 nlp_pipeline.py
```

See [Python ML Integration Guide](docs/pipeline/PYTHON_ML_INTEGRATION.md) for details.

### Firebase Setup (Optional)

To enable data persistence and user authentication:

```bash
./scripts/firebase-bootstrap.sh
```

See [Firebase Setup Guide](docs/guides/FIREBASE_SETUP.md) for detailed instructions.

---

## 📊 Current Status

### ✅ Implemented (Production Ready)

**Core Functionality:**
- ✅ Multi-AI comparison (GPT-3.5, Gemini, DeepSeek)
- ✅ Comprehensive 6-step analysis pipeline
- ✅ Hybrid architecture (JavaScript + optional Python ML)
- ✅ Auto-fallback system (always functional)
- ✅ Real-time consensus debate system
- ✅ Export to YAML/JSON/PDF/README

**Analysis Capabilities:**
- ✅ Text preprocessing (tokenization, POS tagging, NER)
- ✅ Bias detection (political, commercial, cultural, toxicity)
- ✅ Sentiment analysis (VADER, polarity, subjectivity)
- ✅ Ideological classification (left/center/right)
- ✅ Topic modeling (BERTopic, keyword extraction)
- ✅ Fact checking (claim identification)
- ✅ Transparency layer (provenance, timeline, audit trail)

**UI/UX:**
- ✅ Grok-inspired dark theme design
- ✅ Collapsible sidebar with conversation history
- ✅ AI model selector (toggle models)
- ✅ Animated loading states
- ✅ Pipeline analysis visualization
- ✅ Model synthesis view (divergences, consensus)
- ✅ Timeline navigator

### 🚧 In Progress

- 🔄 Firebase integration for data persistence
- 🔄 User authentication system
- 🔄 Transparency ledger blockchain implementation
- 🔄 Change detection enhanced features
- 🔄 Model training pipeline

### 📋 Planned

- [ ] Battle mode (user voting on best response)
- [ ] Public API for external applications
- [ ] Crowdsourced feedback system
- [ ] Additional AI models (Claude, Llama, Mistral)
- [ ] Real-time collaborative analysis
- [ ] Mobile application

---

## ✨ Features

### 🤖 Multi-AI Comparison

Ask the same question to multiple AI models simultaneously and compare:
- **GPT-3.5** (OpenAI) - Fast and efficient
- **Gemini** (Google) - Advanced reasoning
- **DeepSeek** - Technical precision

### 🔬 Advanced Analysis Pipeline

Each response undergoes a comprehensive 6-step analysis:

1. **Preprocessing** - Tokenization, POS tagging, language detection
2. **Bias Detection** - Political, commercial, cultural bias + toxicity
3. **Sentiment Analysis** - VADER scores, polarity, subjectivity
4. **Ideology Classification** - Multi-dimensional political positioning
5. **Topic Modeling** - BERTopic transformer-based topics
6. **Transparency Layer** - Full provenance and audit trail

### 🗳️ Consensus Live Debate

When AI models show high divergence (consensus < 60%):
- 🎯 AI agents debate in real-time (max 5 rounds)
- 🗳️ Agents vote on best response (no self-voting)
- 🏆 Winner determined by vote count
- 🔬 Automatic analysis of winning response
- 📊 Full timeline integration

### 📤 Flexible Export

Export complete analyses to:
- **YAML** - Structured data
- **JSON** - API compatible
- **PDF** - Formatted reports
- **README** - Markdown documentation

### 🔍 Transparency & Provenance

Every analysis includes:
- Model version and provider
- Analysis method and algorithm
- Processing timestamps
- Confidence scores
- Full audit trail

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           Frontend (React + Vite)                   │
│         Port 5173 - Modern UI/UX                    │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────┐
│      Backend (Node.js + Express)                    │
│            Port 3001 - Orchestrator                 │
│  ┌──────────────────────────────────────────────┐   │
│  │  Analysis Pipeline Service                   │   │
│  │  • Multi-AI dispatcher                       │   │
│  │  • Model synthesis                           │   │
│  │  • Consensus debate manager                  │   │
│  │  • Export engine                             │   │
│  └──────────────────┬───────────────────────────┘   │
│                     │                                │
│  ┌──────────────────┴───────────────────────────┐   │
│  │  Python NLP Client (Optional)                │   │
│  │  • Auto-fallback to JavaScript               │   │
│  │  • Timeout handling                          │   │
│  └──────────────────┬───────────────────────────┘   │
└────────────────────┼─────────────────────────────────┘
                     │
       ┌─────────────┴─────────────┐
       │                           │
   ┌───▼──────────┐        ┌───────▼──────────┐
   │ Python ML    │        │ JavaScript       │
   │ Service      │        │ Fallback         │
   │ Port 5001    │        │ (Always active)  │
   │              │        │                  │
   │ • spaCy      │        │ • compromise.js  │
   │ • Detoxify   │        │ • sentiment      │
   │ • BERTopic   │        │ • custom NLP     │
   │ • SHAP       │        │                  │
   └──────────────┘        └──────────────────┘
       (Optional)              (Standard)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18, Vite, Tailwind CSS | Modern, responsive UI |
| **State** | Zustand | Lightweight state management |
| **Backend** | Node.js 18+, Express | RESTful API server |
| **Python ML** | Flask, spaCy, Detoxify, BERTopic, SHAP, LIME, Fairlearn, Lux, Sweetviz | Advanced ML models (optional) |
| **AI Models** | OpenAI, Google Gemini, DeepSeek | Multi-AI comparison |
| **Database** | Firebase Firestore (planned) | Data persistence |
| **Export** | js-yaml, markdown-it, PDFKit | Multi-format export |

### Pipeline Tools

| Step | JavaScript (Standard) | Python ML (Optional) |
|------|----------------------|---------------------|
| **Preprocessing** | compromise.js | spaCy 3.7.2, TextBlob, langdetect |
| **Bias Detection** | Custom keyword-based | Custom + Detoxify 0.5.2 |
| **Sentiment** | sentiment library (VADER) | VADER + TextBlob |
| **Ideology** | Custom keyword classifier | Transformers 4.36.2 (Swedish BERT) |
| **Topics** | compromise.js | BERTopic 0.16.0, Gensim 4.3.2 |
| **Explainability** | Keyword tracking | SHAP 0.44.0, LIME |
| **Fairness** | Basic bias detection | Fairlearn 0.10.0 (demographic parity, equal opportunity) |
| **Data Quality** | Manual analysis | Sweetviz (automated EDA), Lux (visualizations) |

---

## 📦 Module Status

### Backend Modules

| Module | Status | Description | API Endpoint |
|--------|--------|-------------|--------------|
| **query_dispatcher** | ✅ Ready | Multi-AI query orchestration | `/api/query` |
| **analysis_pipeline** | ✅ Ready | Full NLP analysis pipeline | `/api/analysis-pipeline/*` |
| **model_synthesis** | ✅ Ready | Model comparison and consensus | Part of query response |
| **debate** | ✅ Ready | Consensus live debate system | `/api/debate/*` |
| **export** | ✅ Ready | Multi-format export | `/api/export/*` |
| **auth** | 🔶 Partial | User authentication (signup only) | `/api/auth/signup` |
| **change_detection** | ✅ Ready | Detect response/model changes | `/api/change-detection/*` |
| **transparency_ledger** | 📋 Planned | Blockchain-inspired audit | `/api/ledger/*` |
| **realtime_update** | 📋 Planned | WebSocket real-time updates | `/api/realtime/*` |

### Frontend Components

| Component | Status | Description |
|-----------|--------|-------------|
| **AgentBubble** | ✅ Ready | AI response display with analysis |
| **PipelineAnalysisPanel** | ✅ Ready | Complete pipeline visualization |
| **TimelineNavigator** | ✅ Ready | Step-by-step process timeline |
| **ModelSynthesis** | ✅ Ready | Model comparison view |
| **DebatePanel** | ✅ Ready | Live debate visualization |
| **ExportPanel** | ✅ Ready | Export functionality |
| **BiasIndicator** | ✅ Ready | Bias visualization |
| **FactCheckIndicator** | ✅ Ready | Fact checking display |
| **AIServiceToggle** | ✅ Ready | Model selection |
| **Sidebar** | ✅ Ready | Conversation history |

### Python ML Models (Optional)

| Model | Status | Version | Purpose |
|-------|--------|---------|---------|
| **spaCy** | ✅ Ready | 3.7.2 | Tokenization, POS, NER, dependency parsing |
| **TextBlob** | ✅ Ready | 0.17.1 | Sentiment polarity and subjectivity |
| **langdetect** | ✅ Ready | Latest | Multi-language detection (55+ languages) |
| **Detoxify** | ✅ Ready | 0.5.2 | ML-based toxicity detection |
| **Transformers** | 🔶 Partial | 4.36.2 | Swedish BERT ideology classification |
| **SHAP** | ✅ Ready | 0.44.0 | Global model explainability |
| **Gensim** | ✅ Ready | 4.3.2 | Word2Vec, FastText, LDA semantic analysis |
| **BERTopic** | ✅ Ready | 0.16.0 | Transformer-based topic modeling |
| **LIME** | ✅ Ready | Latest | Local interpretable explanations |
| **Fairlearn** | ✅ Ready | 0.10.0 | Fairness metrics and bias analysis |
| **Lux** | ✅ Ready | Latest | Interactive visualization recommendations |
| **Sweetviz** | ✅ Ready | Latest | Automated EDA report generation |

### ML Pipeline Modules (Future)

| Module | Status | Purpose |
|--------|--------|---------|
| **prepare_dataset** | 📋 Planned | Dataset preparation for training |
| **train_language_model** | 📋 Planned | Custom model training |
| **model_evaluation** | 📋 Planned | Model performance metrics |
| **change_detection_enhanced** | 🔄 In Progress | Advanced change detection with ML |

---

## 💾 Data Models

### Core Collections (Firestore)

#### ai_interactions
Stores user queries and AI responses with complete analysis.

```javascript
{
  interactionId: "uuid",
  userId: "user-id",
  timestamp: Date,
  question: {
    text: "string",
    hash: "sha256",
    language: "iso-code"
  },
  responses: [{
    agent: "gpt-3.5|gemini|deepseek",
    response: "text",
    analysis: { tone, bias, sentiment },
    pipelineAnalysis: { preprocessing, topics, etc }
  }],
  modelSynthesis: {
    consensus: 0-100,
    divergences: [],
    contradictions: []
  }
}
```

#### model_versions
Tracks AI model configurations and metadata.

```javascript
{
  modelId: "provider-model-version",
  provider: "openai|google|deepseek",
  modelName: "string",
  version: "string",
  configuration: { temperature, maxTokens, ... },
  profile: { strengths, weaknesses, characteristics },
  usage: { totalRequests, averageResponseTime }
}
```

#### ledger_blocks
Blockchain-inspired transparency ledger for audit trail.

```javascript
{
  blockId: "uuid",
  blockNumber: number,
  previousHash: "sha256",
  currentHash: "sha256",
  data: {
    type: "interaction|model_update|system_event",
    interactionId: "uuid",
    modelsUsed: ["gpt-3.5", ...]
  },
  metadata: { verified: boolean }
}
```

#### change_events
Records detected changes in model behavior or responses.

```javascript
{
  eventId: "uuid",
  changeType: "response_drift|model_update|bias_shift",
  modelId: "string",
  changeDetails: { before, after, delta, magnitude },
  detection: { method, confidence },
  impact: { severity, affected }
}
```

See [Data Schemas Documentation](docs/schemas/README.md) for complete schemas.

---

## ⚖️ Quality & Ethics

### Transparency Principles

1. **Full Provenance** - Every analysis result includes source model, version, and method
2. **Reproducibility** - All analyses can be reproduced with the same inputs
3. **No Hidden Algorithms** - All analysis methods are documented
4. **Audit Trail** - Complete history of system decisions
5. **User Control** - Users can enable/disable features and models

### Bias Mitigation

- **Multi-model approach** - Compare multiple AI providers to identify biases
- **Bias detection** - Automated identification of political, commercial, cultural bias
- **Toxicity screening** - ML-based toxicity detection (Detoxify)
- **Provenance tracking** - Know which model produced which result
- **User awareness** - Clear visualization of detected biases

### Data Privacy

- **Local-first** - No data stored without explicit user action
- **Optional cloud** - Firebase integration is optional
- **No tracking** - Zero analytics or tracking by default
- **Open source** - Full transparency through public code
- **User ownership** - Users own their data and can export anytime

### Ethical AI Use

- **Clear attribution** - AI-generated content clearly marked
- **Fact checking** - Identify claims that need verification
- **Limitations disclosed** - Document what AI can and cannot do
- **Diverse perspectives** - Multiple AI models for balanced view
- **Human oversight** - Tools support human decision-making, not replace it

---

## 📚 Documentation

### Getting Started
- [Setup Guide](docs/guides/SETUP.md) - Detailed installation instructions
- [Development Guide](docs/guides/DEVELOPMENT.md) - Development workflow
- [User Interface Guide](docs/guides/ANVÄNDARGRÄNSSNITT_GUIDE.md) - UI/UX documentation

### Technical Documentation
- [API Reference](docs/api/README.md) - Complete API endpoint documentation
- [Data Schemas](docs/schemas/README.md) - Firestore collection schemas
- [Analysis Pipeline](docs/pipeline/ANALYSIS_PIPELINE.md) - Pipeline architecture
- [Python ML Integration](docs/pipeline/PYTHON_ML_INTEGRATION.md) - ML setup guide

### Feature Documentation
- [Consensus Debate](docs/features/CONSENSUS_DEBATE.md) - Live debate system
- [Change Detection](docs/features/CHANGE_DETECTION.md) - Change detection system
- [Transparency Ledger](docs/features/TRANSPARENCY_LEDGER.md) - Audit trail
- [Fact Checking](docs/features/FACTCHECK.md) - Fact checking implementation

### Implementation Reports
- [Implementation Complete](docs/implementation/IMPLEMENTATION_COMPLETE.md)
- [Pipeline Integration](docs/implementation/PIPELINE_INTEGRATION_GUIDE.md)
- [Final Integration Report](docs/implementation/FINAL_INTEGRATION_REPORT.md)

### Scripts & Tools
- [Scripts Documentation](scripts/README.md) - Utility scripts guide

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ Complete
- [x] Multi-AI comparison
- [x] Basic analysis (tone, bias, facts)
- [x] YAML/JSON export
- [x] Grok-inspired UI

### Phase 2: Advanced Analysis ✅ Complete
- [x] Full 6-step analysis pipeline
- [x] Python ML integration
- [x] Model synthesis
- [x] Consensus debate system
- [x] PDF/README export

### Phase 3: Data Persistence 🔄 In Progress
- [x] Firebase configuration setup
- [x] Firestore schema design
- [ ] Firebase Admin SDK integration
- [ ] Firebase Web SDK integration
- [ ] Data migration scripts
- [ ] User authentication
- [ ] Conversation history persistence

### Phase 4: Transparency Ledger 📋 Planned
- [ ] Blockchain-inspired ledger implementation
- [ ] Hash chain validation
- [ ] Block verification UI
- [ ] Ledger filtering and search
- [ ] Immutable audit trail

### Phase 5: Advanced Features 📋 Planned
- [ ] Battle mode (user voting)
- [ ] Public API for external apps
- [ ] Crowdsourced feedback
- [ ] Additional AI models (Claude, Llama, Mistral)
- [ ] Real-time collaborative analysis
- [ ] Advanced visualization dashboard

### Phase 6: Scale & Community 📋 Future
- [ ] Mobile application
- [ ] Multi-language support
- [ ] Plugin system for custom analyzers
- [ ] Community model contributions
- [ ] Enterprise features
- [ ] API rate limiting and authentication

---

## 🤝 Contributing

We welcome contributions from developers, researchers, and ethics experts!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Run tests and linters** (`./scripts/lint.sh`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Add tests for new features
- Update documentation
- Keep commits atomic and well-described
- Ensure backward compatibility

### Areas We Need Help

- 🔧 **Frontend development** - UI/UX improvements
- 🧠 **ML/NLP** - New analysis methods
- 📊 **Data visualization** - Better charts and insights
- 🔒 **Security** - Authentication and authorization
- 📝 **Documentation** - Tutorials and guides
- 🌍 **Translations** - Multi-language support
- 🧪 **Testing** - Unit and integration tests

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

Free to use, modify, and distribute with attribution.

---

## 🙏 Acknowledgments

Built with passion for transparency, ethical AI, and informed decision-making.

**Core Technologies:**
- React, Vite, Tailwind CSS
- Node.js, Express
- spaCy, Detoxify, BERTopic
- OpenAI, Google Gemini, DeepSeek

**Inspiration:**
- Grok UI/UX design
- Open government principles
- Transparency in AI systems
- Civic technology movement

---

## 📞 Contact

**Project Maintainer:** Robin

**Repository:** https://github.com/robinandreeklund-collab/CivicAI

**Issues:** https://github.com/robinandreeklund-collab/CivicAI/issues

---

## 🔗 Quick Links

- **Live Demo:** Coming soon
- **Documentation:** [/docs](/docs)
- **API Reference:** [/docs/api](/docs/api)
- **Roadmap:** [GitHub Projects](https://github.com/robinandreeklund-collab/CivicAI/projects)

---

**Remember:** AI is a tool to support human decision-making, not replace it. Use CivicAI to gain insights, identify biases, and make more informed choices.

**🌟 Star this repo if you find it useful!**
