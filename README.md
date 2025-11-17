# 🧭 CivicAI (OneSeek.AI)

**Beslut med insyn. AI med ansvar.**

## 🎯 Vad är CivicAI?

CivicAI är en öppen, transparent plattform för att jämföra och analysera hur olika AI-modeller svarar på samma fråga. Genom avancerad textanalys och maskininlärning synliggör plattformen skillnader i fakta, ton, bias och källor - vilket hjälper beslutsfattare, journalister och medborgare att fatta mer informerade och transparenta beslut.

### 🌟 Kärnfunktionalitet

**Multi-AI Jämförelse:** Ställ samma fråga till flera AI-modeller (GPT-3.5, Gemini, DeepSeek) samtidigt och jämför deras svar sida vid sida.

**Djupgående Analys:** Varje AI-svar analyseras automatiskt genom en omfattande pipeline som inkluderar:
- 📝 **Textförbearbetning** - Tokenisering, POS-tagging, språkdetektion
- 🎯 **Bias-detektion** - Identifierar politisk, kommersiell och kulturell bias samt toxicitet
- 💭 **Sentimentanalys** - Analyserar ton, polaritet, subjektivitet och känslomässig laddning
- 🏛️ **Ideologisk klassificering** - Kartlägger politisk lutning på ekonomisk, social och auktoritär dimension
- 🏷️ **Ämnesmodellering** - Identifierar dominerande teman och nyckelord
- ✅ **Faktakontroll** - Markerar verifierbara påståenden som bör kontrolleras
- 🔍 **Model Förklarbarhet (SHAP & LIME)** - Förstå exakt hur AI fattar beslut med feature importance och lokala förklaringar
- ⚖️ **Rättvisa & Bias Analys (Fairlearn)** - Säkerställ etisk AI med demographic parity och equal opportunity metriker
- 📊 **Data Quality Reports (Sweetviz & Lux)** - Automatiska EDA-rapporter och interaktiva visualiseringar för dataset-analys

**Konsensus Live Debatt:** När AI-modeller visar hög divergens (konsensus < 60%), kan användaren starta en live-debatt där:
- 🎯 **AI-agenter debatterar** - Max 5 agenter i max 5 live-följbara rundor baserat på RAW svar
- 🗳️ **AI-agenter röstar** - Varje agent röstar på bästa svaret (får inte rösta på sig själv)
- 🏆 **Vinnare utses** - Agent med flest röster vinner, med fullständig röstfördelning och motiveringar
- 🔬 **Automatisk analys** - Vinnande svar analyseras automatiskt med komplett pipeline
- 📊 **Timeline-integration** - Hela debatten visas steg-för-steg i timelinen med dedikerad vy

**Full Transparens:** Varje analysresultat inkluderar provenance-data (vilken modell, version, metod) så att användaren alltid kan förstå hur slutsatser dragits.

**Flexibel Export:** Exportera kompletta analyser och jämförelser till YAML, JSON, PDF eller README-format.

### 🎓 Målgrupp

- **Beslutsfattare** - Behöver transparent underlag för policyutveckling
- **Journalister** - Vill granska och jämföra AI-genererat innehåll
- **Forskare** - Studerar AI-beteende, bias och språkmodellers skillnader
- **Medborgare** - Vill förstå hur AI-verktyg fungerar och vilka begränsningar de har

---

## 🎨 Grok-Inspirerad Design

OneSeek.AI har nu en moderniserad design inspirerad av Grok med fokus på användarvänlighet och professionell estetik.

### Huvudfunktioner

![OneSeek.AI Huvudvy](https://github.com/user-attachments/assets/e5c29380-8140-4b7b-8af0-2eaa5f858341)
*Grok-inspirerad layout med sidebar, centrerad chat och AI-tjänsteväljare*

**✨ Nyckeldelar:**
- **Sidebar**: Historia av konversationer, logo-placering och exportfunktioner
- **AI-Tjänsteväljare**: Aktivera/deaktivera specifika AI-modeller innan frågan skickas
- **Centrerad Chat**: Frågeruta och svar i mitten, precis som Grok
- **Moderna Animationer**: Fade-ins, loaders och smooth transitions

### AI-Tjänsteväljare

![AI-Tjänsteväljare](https://github.com/user-attachments/assets/fa7d93ce-2937-448b-8871-117d7cb16da1)
*Välj vilka AI-modeller som ska inkluderas i svaret*

Användare kan nu välja vilka AI-tjänster de vill fråga:
- 🤖 **GPT-3.5**: Snabb och effektiv
- ✨ **Gemini**: Googles AI-modell
- 🧠 **DeepSeek**: Teknisk precision och datadriven analys
- Toggle-switchar för enkel aktivering/deaktivering

### Kollapsbar Sidebar

![Kollapsad Sidebar](https://github.com/user-attachments/assets/28d135ed-3cb5-4967-9044-ae4163edfd2b)
*Maximera arbetsytan genom att kollapsa sidebaren*

Sidebaren kan enkelt kollapsa för att ge mer utrymme åt konversationen.

---

## 🔬 Analyspipeline - Hjärtat i CivicAI

CivicAI använder en omfattande analyspipeline för att granska varje AI-svar. Pipelinen kombinerar både lightweight JavaScript-implementationer (fungerar alltid) och avancerade Python ML-modeller (när aktiverade).

### Pipeline-arkitektur

```
Användarens fråga
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  1. PREPROCESSING (Förbearbetning)                     │
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • spaCy - Tokenisering, POS-tagging, NER           │
│     • TextBlob - Polaritet och subjektivitet           │
│     • langdetect - Språkdetektion (55+ språk, Windows-kompatibel) │
│                                                         │
│  📊 Output: Tokens, meningar, entiteter,               │
│            språk, subjektivitetspoäng                   │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  2. BIAS DETECTION (Bias-detektion)                    │
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • BiasCheck - Politisk/kulturell bias              │
│     • Detoxify - Toxicitet, extremism, hot             │
│                                                         │
│  📊 Output: Bias-poäng (0-10), detekterade bias-typer, │
│            toxicitetspoäng, flaggade termer             │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  3. SENTIMENT ANALYSIS (Sentimentanalys)               │
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • VADER - Sociala medier och korta texter          │
│     • TextBlob - Polaritet och subjektivitet           │
│                                                         │
│  📊 Output: Sentiment (pos/neg/neutral), polaritet,    │
│            subjektivitet, sarkasm, empati               │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  4. IDEOLOGY CLASSIFICATION (Ideologisk klassificering)│
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • Transformers - PoliticalBERT/RoBERTa             │
│     • SHAP - Förklarar inflytande från nyckelord       │
│     • Gensim - Semantisk närhetsanalys (Word2Vec)      │
│                                                         │
│  📊 Output: Vänster/center/höger, ekonomisk/social/    │
│            auktoritär dimension, partidöverenstämmelse  │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  5. TOPIC MODELING (Ämnesmodellering)                  │
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • BERTopic - Transformer-baserad topic modeling    │
│     • Gensim - LDA och Word2Vec för tematiska kluster  │
│                                                         │
│  📊 Output: Huvudämnen, ämneskluster, nyckelfraser     │
└────────────────────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────────────────────┐
│  6. TRANSPARENCY LAYER (Transparenslager)              │
│  ─────────────────────────────────────────────────     │
│  🔧 Verktyg:                                            │
│     • Timeline Navigator - Klickbar steg-för-steg vy   │
│     • Audit Trail - Loggar tider, källor, modeller     │
│     • Export Panel - YAML, JSON, PDF, README export    │
│                                                         │
│  📊 Output: Komplett provenance för varje datapoint,   │
│            timeline med processtider, exportfiler       │
└────────────────────────────────────────────────────────┘
     │
     ▼
Komplett analys visas i UI + kan exporteras
```

### Hybrid-arkitektur: Python ML + JavaScript Fallback

CivicAI använder en **dubbel-tjänst arkitektur** som säkerställer att systemet alltid fungerar:

```
┌─────────────────────────────────────────────────────────┐
│           CivicAI Frontend (React + Vite)               │
│         Visar analyser och jämförelser i UI              │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP API (JSON)
┌────────────────────────┴────────────────────────────────┐
│      Node.js Backend (Port 3001) - Orchestrator         │
│  ┌────────────────────────────────────────────────┐     │
│  │  Analysis Pipeline Service                     │     │
│  │  • Kör alla analyssteg i sekvens               │     │
│  │  • Skapar timeline med metadata                │     │
│  │  • Aggregerar insikter och kvalitetsindikatorer│     │
│  └────────────────────┬───────────────────────────┘     │
│                       │                                  │
│  ┌────────────────────┴───────────────────────────┐     │
│  │  Python NLP Client (pythonNLPClient.js)        │     │
│  │  • Försöker anropa Python ML service           │     │
│  │  • Fallback till JavaScript vid timeout/fel    │     │
│  └────────────────────┬───────────────────────────┘     │
└─────────────────────────┼───────────────────────────────┘
                    ┌─────┴─────┐
        ┌───────────▼──────┐   ┌▼────────────────┐
        │  Python ML       │   │  JavaScript     │
        │  Service         │   │  Fallback       │
        │  (Port 5001)     │   │  (Alltid aktiv) │
        │                  │   │                 │
        │  Flask API med:  │   │  compromise.js  │
        │  • spaCy 3.7     │   │  sentiment lib  │
        │  • TextBlob      │   │  custom bias    │
        │  • langdetect    │   │  custom ideology│
        │  • Detoxify      │   │  topic extract  │
        │  • BERTopic      │   │                 │
        │  • Transformers  │   │                 │
        └──────────────────┘   └─────────────────┘
           (Valfritt)              (Standard)
```

### Data Flow - Från fråga till insikt

1. **Användarfråga** → Frontend skickar till `/api/query`
2. **Multi-AI dispatch** → Backend frågar GPT-3.5, Gemini, DeepSeek parallellt
3. **Svar mottagna** → För varje AI-svar:
   - ✅ Kör JavaScript-analys (tone, bias, facts)
   - ✅ Försök Python ML-analys (spaCy, Detoxify, etc.)
   - ✅ Sammanställ pipeline-resultat med provenance
4. **Model Synthesis** → Jämför alla svar:
   - 🔍 Identifiera divergenser (olika sentiment, ton, bias)
   - ⚠️ Hitta motsägelser (olika fakta om samma ämne)
   - 🤝 Beräkna konsensus (överensstämmelse mellan modeller)
5. **Timeline generering** → Skapa klickbar sekvens av alla steg
6. **Export** → Tillgänglig som YAML, JSON, PDF, README
7. **UI presentation** → Visa i AgentBubble, ModelSynthesis, PipelineAnalysis

### Pipeline-resultat i UI

**Varje AI-svar inkluderar:**
```javascript
{
  agent: "gpt-3.5",
  response: "AI-genererat svar...",
  
  // Grundläggande analys (JavaScript)
  analysis: {
    tone: { primary: "analytical", confidence: 85 },
    bias: { biasScore: 2, types: ["political"] },
    factCheck: { claimsFound: 3 }
  },
  
  // Pipeline-analys (Python ML om tillgänglig)
  pipelineAnalysis: {
    preprocessing: {
      spacy: { tokens: [...], entities: [...] },
      textblob: { polarity: 0.1, subjectivity: 0.5 },
      polyglot: { language: "sv", confidence: 0.95 }
    },
    biasAnalysis: {
      detoxify: { toxicity: 0.02, is_toxic: false }
    },
    timeline: [
      { step: "preprocessing", durationMs: 45, model: "spaCy 3.7.2" },
      { step: "bias_detection", durationMs: 12, model: "Detoxify 0.5.2" }
    ]
  }
}
```

### Provenance & Transparens

**Varje analysresultat spåras:**
```javascript
{
  result: { /* faktiska data */ },
  provenance: {
    model: "spaCy",           // Vilket verktyg användes
    version: "3.7.2",         // Version av verktyget
    method: "Statistical NLP", // Metod/algoritm
    timestamp: "2025-11-15T..." // När analysen kördes
  }
}
```

Detta ger **full insyn** i hur varje slutsats dragits och möjliggör reproducerbarhet.

---

## 📦 Projektstruktur

```plaintext
civicai/
├── README.md                      # Denna fil - projektöversikt
├── manifest.yaml                  # Vision, målgrupp, komponenter
├── CONTRIBUTING.md                # Guide för bidragsgivare
│
├── PIPELINE_INTEGRATION_GUIDE.md  # Snabbguide för pipeline
├── PYTHON_ML_INTEGRATION.md       # Teknisk guide för ML-integration
├── PIPELINE_VISUAL_GUIDE.md       # Visuell arkitekturguide
├── PIPELINE_INTEGRATION_SUMMARY.md # Implementationsdetaljer
│
├── frontend/                      # React-applikation (Port 5173)
│   ├── src/
│   │   ├── components/            # UI-komponenter
│   │   │   ├── AgentBubble.jsx           # Visar AI-svar med analys
│   │   │   ├── BiasIndicator.jsx         # Visualiserar bias
│   │   │   ├── EnhancedAnalysisPanel.jsx # Utökad NLP-analys
│   │   │   ├── PipelineAnalysisPanel.jsx # Komplett pipeline-vy
│   │   │   ├── TimelineNavigator.jsx     # Klickbar tidslinje
│   │   │   └── ExportPanel.jsx           # Export-funktionalitet
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── utils/                 # Hjälpfunktioner
│   │   └── pages/                 # Sidvyer
│
├── backend/                       # Node.js API (Port 3001)
│   ├── api/                       # REST API endpoints
│   │   ├── query_dispatcher.js           # Multi-AI dispatcher
│   │   ├── analysis_pipeline.js          # Pipeline API
│   │   ├── analysis_transparency.js      # Transparens API
│   │   └── export.js                     # Export endpoints
│   │
│   ├── services/                  # Tjänster och integration
│   │   ├── analysisPipeline.js           # Pipeline orchestrator
│   │   ├── modelSynthesis.js             # Modeljämförelse
│   │   ├── pythonNLPClient.js            # Python ML-klient
│   │   └── auditTrail.js                 # Audit logging
│   │
│   ├── utils/                     # Analysmoduler
│   │   ├── preprocessText.js             # Textförbearbetning
│   │   ├── detectBias.js                 # Bias-detektion
│   │   ├── sentimentAnalysis.js          # Sentimentanalys
│   │   ├── ideologicalClassification.js  # Ideologiklassificering
│   │   ├── nlpProcessors.js              # NLP-processorer
│   │   ├── analyzeTone.js                # Tonanalys
│   │   └── checkFacts.js                 # Faktakontroll
│   │
│   ├── config/                    # Konfiguration
│   │   └── pipelineConfig.js             # Pipeline-konfiguration
│   │
│   └── python_services/           # Python ML Service (Port 5001)
│       ├── nlp_pipeline.py               # Flask API med ML-modeller
│       ├── requirements.txt              # Python-beroenden
│       ├── setup.sh                      # Installationsscript
│       └── README.md                     # Python service guide
│
├── design-concepts/               # Design-mockups och koncept
├── data/                          # Testdata och exports
└── tests/                         # Tester och mockdata
```

### 🛠 Teknikstack

| Lager | Teknologi | Beskrivning |
|-------|-----------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS | Modern, responsiv UI med mörkt tema |
| **State Management** | Zustand | Lightweight state management |
| **Backend** | Node.js 18+, Express | RESTful API-server |
| **Python ML** | Flask, spaCy, Detoxify, BERTopic | Avancerade ML-modeller (valfritt) |
| **AI-modeller** | OpenAI GPT-3.5, Google Gemini, DeepSeek | Multi-AI jämförelse |
| **Analys (JS)** | compromise.js, sentiment, custom | Lightweight NLP |
| **Analys (Python)** | spaCy 3.7, TextBlob, Detoxify, BERTopic, Transformers, SHAP, Gensim | Avancerad ML-baserad NLP |
| **Export** | js-yaml, markdown-it, PDFKit | YAML, JSON, PDF, README export |
| **Databas** | (Planerat: Firebase) | För framtida persistens |

### 🔧 Pipeline-verktyg

| Steg | JavaScript (Standard) | Python ML (Valfritt) |
|------|----------------------|---------------------|
| **Preprocessing** | compromise.js | spaCy 3.7.2, TextBlob, langdetect |
| **Bias Detection** | Custom keyword-based | Custom + Detoxify 0.5.2 |
| **Sentiment** | sentiment library (VADER) | VADER + TextBlob |
| **Ideology** | Custom keyword classifier | Transformers 4.36.2 (PoliticalBERT-ready) |
| **Topics** | compromise.js | BERTopic 0.16.0, Gensim 4.3.2 |
| **Explainability** | Keyword tracking | SHAP 0.44.0 |

---

## 🚀 Kom igång

CivicAI kan köras i **två lägen**:
1. **JavaScript-läge** (Standard) - Fungerar direkt, inga extra beroenden
2. **Python ML-läge** (Avancerat) - Aktiverar avancerade maskininlärningsmodeller

### Snabbstart - JavaScript-läge (Rekommenderat för att börja)

Detta läge använder lightweight JavaScript-implementationer och fungerar omedelbart.

#### 1. Installera beroenden

```bash
# Backend
cd backend
npm install

# Frontend (i separat terminal)
cd frontend
npm install
```

#### 2. Konfigurera API-nycklar
   
Skapa en `.env`-fil i `backend/`-mappen:

```bash
cd backend
cp .env.example .env
```

Redigera `.env` och lägg till dina API-nycklar:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# DeepSeek Configuration (valfri)
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Server Configuration
PORT=3001
```

**Hämta API-nycklar:**
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Gemini**: [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
- **DeepSeek**: [platform.deepseek.com](https://platform.deepseek.com/)

#### 3. Starta applikationen

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

Du bör se:
```
🚀 OneSeek.AI Backend running on port 3001
🔗 Health check: http://localhost:3001/health
[DEBUG] OPENAI_API_KEY: ✓ Configured
[DEBUG] GEMINI_API_KEY: ✓ Configured

🐍 Python NLP Service: NOT AVAILABLE (using JavaScript fallbacks)
   To enable: cd backend/python_services && ./setup.sh && python nlp_pipeline.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Öppna webbläsaren på `http://localhost:5173`

### Avancerat - Python ML-läge (Valfritt)

För att aktivera avancerade maskininlärningsmodeller (spaCy, Detoxify, BERTopic, etc.):

#### 1. Installera Python-beroenden

```bash
cd backend/python_services
./setup.sh
```

Detta script:
- Skapar en Python virtual environment
- Installerar 15+ ML-bibliotek (spaCy, Detoxify, BERTopic, Transformers, etc.)
- Laddar ner spaCy svensk språkmodell
- Laddar ner TextBlob corpora

**Systemkrav:**
- Python 3.8+
- 4GB RAM minimum (8GB rekommenderas)
- ~2GB diskutrymme för modeller

#### 2. Starta Python ML-tjänsten

**Terminal 1 - Python ML Service:**
```bash
cd backend/python_services
source venv/bin/activate
python nlp_pipeline.py
```

Du bör se:
```
========================================
CivicAI Python NLP Pipeline Service
========================================

Available models:
  spaCy:        ✓
  TextBlob:     ✓
  Polyglot:     ✓
  Detoxify:     ✓
  Transformers: ✓
  SHAP:         ✓
  Gensim:       ✓
  BERTopic:     ✓

Starting Flask server on http://localhost:5001
```

**Terminal 2 - Node.js Backend:**
```bash
cd backend
npm start
```

Nu bör du se:
```
🚀 OneSeek.AI Backend running on port 3001

🐍 Python NLP Service: AVAILABLE
   Available models: {
     "spacy": true,
     "textblob": true,
     "detoxify": true,
     ...
   }
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

### Vilket läge ska jag välja?

| Funktion | JavaScript-läge | Python ML-läge |
|----------|----------------|----------------|
| **Snabbhet** | ⚡ Snabb start | 🐌 Längre laddningstid |
| **Minnesbehov** | 💾 ~500MB | 💾 ~3GB |
| **Tokenisering** | ✅ Basic (compromise.js) | ⭐ Avancerad (spaCy) |
| **Sentiment** | ✅ VADER | ⭐ VADER + TextBlob |
| **Bias-detektion** | ✅ Nyckelord | ⭐ Nyckelord + Detoxify ML |
| **Språkdetektion** | ✅ Basic pattern | ⭐ Polyglot (100+ språk) |
| **Topic modeling** | ✅ Nyckelord | ⭐ BERTopic (transformer) |
| **Ideologi** | ✅ Nyckelord | ⭐ Transformers (PoliticalBERT-ready) |

**Rekommendation:**
- **Utveckling/testning:** Börja med JavaScript-läge
- **Produktion/forskning:** Använd Python ML-läge för bästa precision

### API-nycklar och felsökning

**OpenAI API:**
- Använder modell: `gpt-3.5-turbo`
- Hämta API-nyckel från: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Obs:** Kontrollera att du har tillgänglig kredit och inte har överskridit din kvot

**Gemini API:**
- Använder modell: `gemini-2.5-flash`
- Hämta API-nyckel från: [Google AI Studio](https://aistudio.google.com/app/apikey)

**DeepSeek API:**
- Använder modell: `deepseek-chat`
- Hämta API-nyckel från: [DeepSeek Platform](https://platform.deepseek.com/)

**Vanliga fel:**
- `404 Not Found` (Gemini): Modellnamnet är inkorrekt eller inaktuellt. Använd `gemini-2.5-flash` eller `gemini-1.5-pro`.
- `429 Quota Exceeded` (OpenAI): Du har överskridit din API-kvot. Kontrollera ditt konto och faktureringsdetaljer.
- `401 Unauthorized`: API-nyckeln är ogiltig eller felaktig.

**OBS:** Utan konfigurerade API-nycklar kommer applikationen att fungera med simulerade svar för demonstration.

## ✨ Funktioner

### Implementerade funktioner (Fas 1 & 2) ✅

#### 🔄 Multi-agent svarsspegel
Ställ samma fråga till flera AI-modeller samtidigt och jämför deras svar i realtid. Stöd för GPT-3.5, Gemini och DeepSeek med möjlighet att välja vilka modeller som ska inkluderas.

#### 🧠 Ton- och stilanalys
Varje AI-svar analyseras automatiskt för:
- **Primär ton**: Formell, informell, teknisk, empatisk, analytisk eller övertygande
- **Sekundära karakteristika**: Ytterligare tondrag som identifierats i texten
- **Konfidensnivå**: Hur säker analysen är på resultatet

#### 🧭 Biasdetektion
Identifierar och markerar potentiella bias i AI-svar:
- **Politisk bias**: Vänster- eller högerorienterade formuleringar
- **Kommersiell bias**: Produktrekommendationer eller marknadsföring
- **Kulturell bias**: Västerländska eller icke-västerländska perspektiv
- **Bekräftelsebias**: Påståenden presenterade som självklara sanningar
- **Recency bias**: Överfokus på nyhet över relevans

Varje identifierad bias får en svårighetsgrad (låg, medel, hög) och detaljerad beskrivning.

#### 🔍 Faktakoll
Identifierar verifierbara påståenden i AI-svar som bör kontrolleras:
- **Statistiska påståenden**: Procentsatser och numerisk data
- **Tidsbundna påståenden**: Referenser till specifika år eller perioder
- **Vetenskapliga påståenden**: Hänvisningar till forskning eller studier
- **Historiska påståenden**: Historiska fakta och händelser
- **Definitiva påståenden**: Absoluta utsagor som kräver verifiering

Systemet rekommenderar verifiering via externa källor när många påståenden identifieras.

#### 🧬 Agentprofiler
Varje AI-modell har en detaljerad profil som visar:
- **Styrkor och svagheter**: Vad modellen är bra respektive mindre bra på
- **Karakteristika**: Kreativitet, precision, kontextförståelse, språkhantering
- **Beskrivning**: Information om leverantör och användningsområden

#### 📤 Export
Exportera konversationer och jämförelser till:
- **YAML**: Strukturerad data för vidare analys
- **JSON**: Kompatibel med andra verktyg och system

#### 💬 Grok-inspirerad UI
- **Sidebar**: Konversationshistorik med sök och navigering
- **AI-tjänsteväljare**: Aktivera/deaktivera specifika modeller före fråga
- **Moderna animationer**: Smooth transitions och fade-ins
- **Mörkt tema**: Professionell och ögonvänlig design

### Planerade funktioner (Fas 3 & 4)

🗳 Battle mode

📚 Audit trail för transparens

📤 Export till PDF och README-format

🌐 API för externa appar

👥 Crowdsourcing av feedback

## 🧩 Komponentöversikt

### Implementerade komponenter ✅

| Komponent | Status | Funktion |
|-----------|--------|----------|
| AgentBubble | ✅ | Visar AI-svar med agentnamn, metadata och komplett Fas 2-analys |
| BiasIndicator | ✅ | Visualiserar bias (politisk, kommersiell, kulturell) med svårighetsgrad |
| AgentProfileCard | ✅ | Visar AI-modellens styrkor, karakteristika och beskrivning |
| ToneIndicator | ✅ | Visar ton och stil för AI-svar med visuella badges |
| FactCheckIndicator | ✅ | Identifierar och listar verifierbara påståenden |
| ExportPanel | ✅ | Exporterar jämförelse till YAML och JSON |
| QuestionInput | ✅ | Frågeruta som triggar AI-anrop med stöd för Shift+Enter |
| Sidebar | ✅ | Konversationshistorik, ny konversation, export och kollapsbar design |
| AIServiceToggle | ✅ | Välj vilka AI-modeller som ska inkluderas i frågan |
| ModernLoader | ✅ | Animerad laddningsindikator för pågående AI-anrop |

### Planerade komponenter (Fas 3 & 4)

| Komponent | Status | Funktion |
|-----------|--------|----------|
| BattlePanel | 📋 | Låter användare rösta på bästa AI-svar |
| AuditTrailViewer | 📋 | Visar historik över frågor och exporthändelser |
| SettingsPanel | 📋 | Avancerade inställningar för AI-modeller och analysnivå |

### Backend-moduler ✅

| Modul | Status | Funktion |
|-------|--------|----------|
| query_dispatcher | ✅ | Multi-AI dispatcher med parallella anrop |
| analysisPipeline | ✅ | Orkestrerar komplett analyspipeline |
| pythonNLPClient | ✅ | Python ML-klient med auto-fallback |
| modelSynthesis | ✅ | Jämför modeller, identifierar divergenser |
| analyzeTone | ✅ | Klassificerar ton (6 kategorier) |
| detectBias | ✅ | Identifierar 5 typer av bias |
| sentimentAnalysis | ✅ | VADER + sarcasm/aggression/empati |
| ideologicalClassification | ✅ | Vänster/center/höger + 3 dimensioner |
| nlpProcessors | ✅ | Emotion, topics, intent, fact/opinion |
| preprocessText | ✅ | Tokenisering, POS, subjectivity, noise |
| checkFacts | ✅ | Identifierar verifierbara påståenden |
| exportUtils | ✅ | YAML, JSON, PDF, README export |
| auditTrail | ✅ | Logging och provenance tracking |

### Python ML-modeller (Valfritt) 🐍

| Modell | Version | Funktion |
|--------|---------|----------|
| spaCy | 3.7.2 | Tokenisering, POS, NER, dependency parsing |
| TextBlob | 0.17.1 | Sentiment polarity och subjectivity |
| Polyglot | 16.7.4 | Språkdetektion (100+ språk) |
| Detoxify | 0.5.2 | ML-baserad toxicitetsidentifiering |
| BERTopic | 0.16.0 | Transformer-baserad topic modeling |
| Transformers | 4.36.2 | Hugging Face (PoliticalBERT-ready) |
| SHAP | 0.44.0 | Model explainability |
| Gensim | 4.3.2 | Word2Vec, FastText, LDA |

---

## 📊 Nuvarande status

### ✅ Implementerat (Fas 1 & 2 & Pipeline Integration)

**Kärnfunktionalitet:**
- ✅ Multi-AI jämförelse (GPT-3.5, Gemini, DeepSeek)
- ✅ AI-tjänsteväljare (välj vilka modeller att fråga)
- ✅ Komplett analyspipeline (6 steg)
- ✅ Hybrid-arkitektur (JavaScript + Python ML)
- ✅ Auto-fallback (fungerar alltid med JavaScript)

**Pipeline-steg:**
- ✅ Preprocessing (tokenisering, POS, språkdetektion)
- ✅ Bias-detektion (politisk, kommersiell, kulturell, toxicitet)
- ✅ Sentimentanalys (VADER, polaritet, subjektivitet)
- ✅ Ideologisk klassificering (vänster/center/höger, 3 dimensioner)
- ✅ Topic modeling (BERTopic, LDA, nyckelord)
- ✅ Transparenslager (timeline, provenance, audit trail)

**UI & UX:**
- ✅ Grok-inspirerad design med mörkt tema
- ✅ Sidebar med konversationshistorik
- ✅ Moderna animationer och loaders
- ✅ Kollapsbar sidebar
- ✅ AgentBubble med komplett analysvy
- ✅ Bias-, ton- och faktakontrollindikatorer
- ✅ Pipeline-timeline navigator
- ✅ Model synthesis-vy (divergenser, konsensus)

**Export & Transparens:**
- ✅ YAML export med komplett pipeline-data
- ✅ JSON export strukturerad
- ✅ PDF export formaterad
- ✅ README export i markdown
- ✅ Provenance tracking för varje datapoint
- ✅ Audit trail logging

**Konsensus & Debatt:**
- ✅ Konsensus Live Debatt - Manuell start med knapp vid hög divergens
- ✅ Multi-round AI-agent debatter (max 5 rundor, live-följbar)
- ✅ Debatt baserad på RAW AI-svar utan analyser
- ✅ AI-agent röstning utan självröstning
- ✅ Vinnare-bestämning baserat på röster
- ✅ Automatisk pipeline-analys av vinnande svar
- ✅ Full timeline-integration med dedikerad vy

**Dokumentation:**
- ✅ Omfattande README (denna fil)
- ✅ Python ML Integration Guide
- ✅ Pipeline Visual Guide
- ✅ Pipeline Integration Summary
- ✅ Quick Start Guide
- ✅ Consensus Debate Documentation

### 🚧 Pågående arbete

- 🔄 Fine-tuning av PoliticalBERT på svenska politiska texter
- 🔄 Träning av BERTopic på svensk corpus
- 🔄 SHAP-visualiseringar i UI
- 🔄 Optimering av Python ML-modeller

### 📋 Planerat (Fas 3 & 4)

**Fas 3: Beslutsstöd**
- [ ] Battle mode (användare röstar på bästa svar)
- [ ] Utökad audit trail med filtreringsmöjligheter
- [ ] Policyfrågebank med fördefinierade frågor
- [ ] Förbättrad PDF-export med grafik

**Fas 4: Skalbarhet & öppenhet**
- [ ] Publikt API för externa applikationer
- [ ] Crowdsourcing av feedback på AI-svar
- [ ] Offentlig portal för medborgare
- [ ] Fler AI-modeller (Claude, Llama, Mistral)
- [ ] Firebase-integration för persistens
- [ ] Användarautentisering och profiler

---

## 🔬 Pipeline-detaljer

För djupare teknisk information om pipelinen och andra funktioner, se:

- **[PIPELINE_INTEGRATION_GUIDE.md](PIPELINE_INTEGRATION_GUIDE.md)** - Snabbguide för att komma igång
- **[PYTHON_ML_INTEGRATION.md](PYTHON_ML_INTEGRATION.md)** - Teknisk guide för ML-integration
- **[PIPELINE_VISUAL_GUIDE.md](PIPELINE_VISUAL_GUIDE.md)** - Arkitekturdiagram och dataflöde
- **[PIPELINE_INTEGRATION_SUMMARY.md](PIPELINE_INTEGRATION_SUMMARY.md)** - Implementationsdetaljer
- **[CONSENSUS_DEBATE_README.md](CONSENSUS_DEBATE_README.md)** - Konsensus Live Debatt funktionsbeskrivning

### Pipeline API-endpoints

```bash
# Hämta pipeline-konfiguration
GET /api/analysis-pipeline/config

# Hämta pipeline-steg
GET /api/analysis-pipeline/steps

# Analysera text
POST /api/analysis-pipeline/analyze
{
  "text": "Text att analysera...",
  "question": "Kontext (valfri)",
  "options": {}
}

# Python ML service (om aktiverad)
GET http://localhost:5001/health
POST http://localhost:5001/preprocess
POST http://localhost:5001/detect-toxicity
POST http://localhost:5001/topic-modeling
```

### Consensus Debate API-endpoints

```bash
# Kontrollera om debatt ska triggas
POST /api/debate/check-trigger
{
  "modelSynthesis": { /* synthesis result */ }
}

# Starta ny debatt
POST /api/debate/initiate
{
  "questionId": "unique-question-id",
  "question": "Frågan som debatteras",
  "agents": ["gpt-3.5", "gemini", "deepseek"],
  "initialResponses": [ /* array of responses */ ],
  "modelSynthesis": { /* synthesis result */ }
}

# Genomför nästa debattrunda
POST /api/debate/:debateId/round

# Genomför AI-röstning
POST /api/debate/:debateId/vote

# Hämta debatt
GET /api/debate/:debateId

# Hämta alla debatter (eller filtrera per fråga)
GET /api/debate?questionId=xxx

# Hämta debatt-konfiguration
GET /api/debate/config
```

---

🚀 Utvecklingsfaser

🧪 **Fas 1: MVP** ✅ KLAR

✅ Multi-AI jämförelse med GPT-3.5, Gemini, DeepSeek  
✅ Frågeruta + agentbubblor  
✅ Grundläggande analys (ton, bias, fakta)  
✅ YAML/JSON export  
✅ Grok-inspirerad UI med mörkt tema  
✅ Sidebar med konversationshistorik  
✅ AI-tjänsteväljare  

🔍 **Fas 2: Analys & insyn** ✅ KLAR

✅ Komplett analyspipeline (6 steg)  
✅ Djupgående ton- och stilanalys  
✅ Utökad bias-detektion (5 typer + toxicitet)  
✅ Sentimentanalys med VADER + TextBlob  
✅ Ideologisk klassificering (3 dimensioner)  
✅ Topic modeling med BERTopic  
✅ Python ML-integration (spaCy, Detoxify, etc.)  
✅ Transparenslager med provenance  
✅ PDF och README export  
✅ Model synthesis (divergenser, konsensus)  
✅ Agentprofiler med styrkor/svagheter  

🗳 **Fas 3: Beslutsstöd** (Planerat)

[ ] Battle mode - Användare röstar på bästa AI-svar  
[ ] Utökad audit trail med filter  
[ ] Policyfrågebank med fördefinierade frågor  
[ ] Förbättrad visualisering av pipeline-resultat  
[ ] Firebase-databas för persistens  

🌐 **Fas 4: Skalbarhet & öppenhet** (Framtida)

[ ] Publikt API för externa applikationer  
[ ] Crowdsourcing av feedback på AI-svar  
[ ] Offentlig portal för medborgare  
[ ] Fler AI-modeller (Claude, Llama, Mistral, etc.)  
[ ] Användarautentisering och personliga profiler  
[ ] Internationalisering (fler språk)  

---

## 📸 Skärmdumpar från plattformen

### Huvudvy - Multi-AI jämförelse

![OneSeek.AI Huvudvy](https://github.com/user-attachments/assets/e5c29380-8140-4b7b-8af0-2eaa5f858341)
*Grok-inspirerad layout: Sidebar, centrerad chat, AI-tjänsteväljare och moderna animationer*

### AI-tjänsteväljare

![AI-Tjänsteväljare](https://github.com/user-attachments/assets/fa7d93ce-2937-448b-8871-117d7cb16da1)
*Välj vilka AI-modeller som ska inkluderas i analysen - GPT-3.5, Gemini, DeepSeek*

### Kollapsbar Sidebar

![Kollapsad Sidebar](https://github.com/user-attachments/assets/28d135ed-3cb5-4967-9044-ae4163edfd2b)
*Maximera arbetsytan genom att kollapsa sidebaren för fokuserat arbete*

### Pipeline-analys (Exempel)

*Skärmdumpar av pipeline-analysvyer kommer att läggas till här när Python ML-service är aktiverad och används i produktion. Vyer inkluderar:*
- **Timeline Navigator** - Klickbar sekvens av alla pipeline-steg med processtider
- **Bias-detektering** - Visualisering av politisk, kommersiell och kulturell bias samt toxicitet
- **Sentimentanalys** - VADER scores, polaritet, subjektivitet med grafiska indikatorer  
- **Ideologisk klassificering** - Vänster/center/höger med multi-dimensionell vy
- **Topic Modeling** - BERTopic kluster och huvudämnen
- **Model Synthesis** - Jämförelse av divergenser och konsensus mellan AI-modeller

---

📜 Licens

MIT — fritt att använda, förbättra och sprida med attribution.

🤝 Bidra

OneSeek.AI är ett samhällsprojekt. Vi välkomnar bidrag från utvecklare, forskare, beslutsfattare och etiker. Se CONTRIBUTING.md för riktlinjer.

🧠 Kontakt

Byggt och initierat av Robin — meta-arkitekt med passion för transparens, agentdesign och samhällsnyttiga system.
