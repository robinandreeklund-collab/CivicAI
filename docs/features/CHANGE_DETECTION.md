# Change Detection Module för OpenSeek.AI

## 📑 Översikt

Change Detection Module är en utökad komponent för OpenSeek.AI som automatiskt upptäcker och analyserar förändringar i AI-modellers svar över tid. Modulen körs automatiskt vid varje ny fråga och jämför med tidigare svar från samma modell. När en förändring upptäcks loggas den både i analysen och i Transparency Ledger som ett immutabelt block.

## 🎯 Huvudfunktioner

### 1. Deltaanalys

Modulen analyserar skillnader mellan nuvarande och tidigare svar på följande dimensioner:

- **Textlikhet**: Beräknas med word overlap (Jaccard similarity). I produktion skulle embeddings och cosine similarity användas.
- **Sentiment shift**: Upptäcker förändring från neutral → positiv/negativ
- **Ideology shift**: Upptäcker förändring mellan vänster/höger/center/grön
- **Tonläge**: Förändring i stil (neutral → starkt värderande)

### 2. Utökade Analysfunktioner

#### Change Severity Index (0-1)
Beräknar hur stor förändringen är baserat på:
- Textdissimilaritet (1 - similarity)
- Sentiment-förändring (+0.2 om ändrad)
- Ideologi-förändring (+0.2 om ändrad)

**Tröskelvärden:**
- `severity >= 0.7`: Stor förändring (röd badge)
- `severity >= 0.4`: Måttlig förändring (gul badge)
- `severity < 0.4`: Mindre förändring (grön badge)

#### Explainability Delta
Visar vilka features/begrepp som ändrats mest mellan versioner:
- Borttagna begrepp
- Nya begrepp
- I produktion: SHAP eller LIME analys

#### Bias Drift Tracking
Mäter förändringar i bias över tid:
- Räknar normativa ord (bör, måste, nödvändigt, etc.)
- Beräknar procentuell förändring i normativ ton
- Visualiseras i Bias Drift Radar

#### Thematic Drift
Visar hur dominerande teman skiftar:
- Extraherar upp till 3 huvudteman per svar
- Teman: klimat, ekonomi, välfärd, säkerhet, migration
- I produktion: LDA eller BERTopic topic modeling

#### Consensus Shift
Flaggar när flera modeller går från enighet till oenighet:
- Jämför consensus-nivå mellan tidigare och nuvarande svar
- Beräknar genomsnittlig similarity mellan modeller
- Flaggar om förändring > 0.2

#### Ethical Impact Tagging
Etiketterar förändringar baserat på samhällspåverkan:
- **"Etiskt relevant"**: Severity > 0.7 eller ideologi-förändring
- **"Risk för bias"**: Severity > 0.4
- **"Neutral"**: Severity <= 0.4

## 🏗️ Arkitektur

### Backend - Python Pipeline

**Fil:** `ml/pipelines/change_detection.py`

**Klass:** `ChangeDetectionModule`

**Huvudmetoder:**

```python
# Initiering
detector = ChangeDetectionModule(ledger_dir, history_dir)

# Upptäck förändring för enskild modell
change_analysis = detector.detect_change(
    question="Vad tycker du om klimatpolitik?",
    model="Grok",
    current_response="...",
    model_version="2025.11"
)

# Upptäck consensus shift mellan modeller
consensus_shift = detector.detect_consensus_shift(
    question="...",
    model_responses={
        "Grok": "...",
        "GPT-4": "...",
        "Gemini": "..."
    }
)

# Hämta historik
history = detector.get_change_history(
    question="...",
    model="Grok",
    limit=10
)
```

**Datalagring:**

- **Responshistorik**: `ml/change_history/{question_hash}_{model}.json`
- **Ledger**: `ml/ledger/ledger.json` (via TransparencyLedger)

### Frontend - React Components

#### ChangeDetectionPanel.jsx
Visar förändringsanalys direkt i chatvyn:

```jsx
<ChangeDetectionPanel 
  changeData={changeAnalysis}
  onOpenLedger={(blockId) => navigateToLedger(blockId)}
  onOpenReplay={(data) => setReplayData(data)}
/>
```

**Funktioner:**
- Severity badge med färgkodning
- Kompakt vy med expanderbar detalj
- Tidigare vs nuvarande svar side-by-side
- Bias drift, explainability delta, teman
- Länk till Transparency Ledger
- Replay-knapp för historikvisning

#### ReplayTimeline.jsx
Spela upp historik över tid:

```jsx
<ReplayTimeline 
  question="Vad tycker du om klimatpolitik?"
  model="Grok"
  onClose={() => setShowReplay(false)}
/>
```

**Funktioner:**
- Interaktiv tidslinje med alla versioner
- Play-knapp för automatisk uppspelning
- Jämförelseläge (side-by-side)
- Visualisering av change metrics vid varje punkt

#### NarrativeHeatmap.jsx
Heatmap över narrativskiften:

```jsx
<NarrativeHeatmap 
  question="..."
  models={['Grok', 'GPT-4', 'Gemini']}
/>
```

**Funktioner:**
- X-axel: Tidsperioder
- Y-axel: Modeller
- Färgintensitet: Grad av förändring
- Dimensioner: Sentiment, Ideologi, Tematiska skiften
- Interaktiva celler med hover-info
- Automatiska insikter

#### BiasDriftRadar.jsx
Radardiagram för bias drift:

```jsx
<BiasDriftRadar 
  question="..."
  model="Grok"
/>
```

**Funktioner:**
- Radardiagram med 6 bias-dimensioner
- Jämförelse mellan upp till 3 tidsperioder
- Färgkodade polygoner
- Procentuell förändring per dimension
- Sammanfattande bias-analys

## 📊 Transparency Ledger Integration

### Schema-utökning

**Fil:** `backend/schemas/ledger_block.json`

**Ny event_type:** `change_detection`

**Nya fält i data-objektet:**

```json
{
  "question_hash": "sha256:...",
  "model": "Grok",
  "model_version": "2025.11",
  "version_shift": "2025-10-01 → 2025-11-17",
  "sentiment_shift": "neutral → positiv",
  "ideology_shift": "center → grön",
  "text_similarity": 0.62,
  "severity_index": 0.78,
  "consensus_shift": false,
  "bias_drift": "+15% mer normativ",
  "explainability_delta": ["Borttagna begrepp: ...", "Nya begrepp: ..."],
  "dominant_themes": ["klimat", "ekonomi"],
  "ethical_tag": "Etiskt relevant",
  "provenance": {
    "pipeline_version": "openseek-ml-1.3.0",
    "module": "change_detection",
    "detection_timestamp": "2025-11-18T01:35:00Z"
  }
}
```

### Blockexempel

```json
{
  "block_id": 15,
  "timestamp": "2025-11-18T01:35:00Z",
  "previous_hash": "abc123...",
  "current_hash": "def456...",
  "event_type": "change_detection",
  "data": {
    "question_hash": "sha256:q789...",
    "model": "Grok",
    "model_version": "2025.11",
    "version_shift": "2025-10-01 → 2025-11-17",
    "sentiment_shift": "neutral → positiv",
    "ideology_shift": "center → grön",
    "text_similarity": 0.62,
    "severity_index": 0.78,
    "consensus_shift": false,
    "bias_drift": "+15% mer normativ",
    "explainability_delta": [
      "Borttagna begrepp: hållbar, utveckling",
      "Nya begrepp: avgörande, tillväxt, prioriteras"
    ],
    "dominant_themes": ["klimat", "ekonomi"],
    "ethical_tag": "Etiskt relevant",
    "provenance": {
      "pipeline_version": "openseek-ml-1.3.0",
      "module": "change_detection",
      "detection_timestamp": "2025-11-18T01:35:00Z"
    }
  },
  "signatures": {
    "data_hash": "ghi789...",
    "validator": "change_detection_module"
  }
}
```

## 🚀 Användning

### Backend Integration

```python
from ml.pipelines.change_detection import ChangeDetectionModule

# Initialisera
detector = ChangeDetectionModule(
    ledger_dir="ml/ledger",
    history_dir="ml/change_history"
)

# Vid varje API-fråga
for model_name, response_text in model_responses.items():
    change = detector.detect_change(
        question=user_question,
        model=model_name,
        current_response=response_text,
        model_version=get_model_version(model_name)
    )
    
    if change:
        # Lägg till change_data i API-response
        api_response['change_detection'] = change

# Consensus shift (om flera modeller)
consensus = detector.detect_consensus_shift(
    question=user_question,
    model_responses=model_responses
)
```

### Frontend Integration i ChatV2Page

```jsx
import ChangeDetectionPanel from '../components/ChangeDetectionPanel';
import ReplayTimeline from '../components/ReplayTimeline';

function ChatV2Page() {
  const [showReplay, setShowReplay] = useState(false);
  const [replayData, setReplayData] = useState(null);

  // I handleSubmit/response parsing:
  const aiMessage = {
    type: 'ai',
    question: userQuestion,
    responses: data.responses,
    changeDetection: data.change_detection, // Från backend
    // ... övriga fält
  };

  return (
    <div>
      {/* Visa AI-svar */}
      {latestAiMessage && (
        <div>
          {/* Vanliga svar */}
          <ResponseDisplay response={latestAiMessage} />
          
          {/* Change Detection Panel */}
          {latestAiMessage.changeDetection && (
            <ChangeDetectionPanel 
              changeData={latestAiMessage.changeDetection}
              onOpenLedger={(blockId) => navigateToLedger(blockId)}
              onOpenReplay={(data) => {
                setReplayData(data);
                setShowReplay(true);
              }}
            />
          )}
        </div>
      )}

      {/* Replay Modal */}
      {showReplay && (
        <ReplayTimeline 
          question={replayData.question}
          model={replayData.model}
          onClose={() => setShowReplay(false)}
        />
      )}
    </div>
  );
}
```

## 🧪 Testing

### Backend Test

```bash
cd /home/runner/work/CivicAI/CivicAI/ml/pipelines

# Kör test med mockade data
python change_detection.py --test

# Visa historik för fråga
python change_detection.py --history "Vad tycker du om klimatpolitik?"
```

### Frontend Test

```bash
cd /home/runner/work/CivicAI/CivicAI/frontend

# Starta dev server
npm run dev

# Navigera till chat och ställ samma fråga flera gånger
# för att se change detection i praktiken
```

## 📈 Produktionsförbättringar

För produktionsmiljö bör följande förbättringar göras:

### 1. Textanalys
- **Embeddings**: Använd sentence-transformers för semantisk similarity
- **Modeller**: multilingual-MiniLM-L12-v2 eller paraphrase-multilingual-mpnet-base-v2

### 2. Sentiment & Ideology
- **Sentiment**: TextBlob eller BERT-baserad sentiment model
- **Ideology**: Finjusterad svensk politisk BERT-modell

### 3. Explainability
- **SHAP**: För feature importance i klassificeringsmodeller
- **LIME**: För lokal förklarbarhet

### 4. Topic Modeling
- **BERTopic**: För dynamisk topic modeling
- **LDA**: För traditionell topic extraction

### 5. Skalbarhet
- **Databas**: Migrera från JSON-filer till PostgreSQL/MongoDB
- **Caching**: Redis för snabb åtkomst till frequently queried history
- **Async Processing**: Celery för background jobs

### 6. API Endpoints

Lägg till i backend:

```javascript
// GET /api/change-detection/history
app.get('/api/change-detection/history', async (req, res) => {
  const { question, model, limit } = req.query;
  // Anropa Python change_detection module
  const history = await getChangeHistory(question, model, limit);
  res.json(history);
});

// GET /api/change-detection/heatmap
app.get('/api/change-detection/heatmap', async (req, res) => {
  const { question, models } = req.query;
  // Generera heatmap data
  const heatmapData = await generateHeatmapData(question, models);
  res.json(heatmapData);
});

// GET /api/change-detection/bias-drift
app.get('/api/change-detection/bias-drift', async (req, res) => {
  const { question, model } = req.query;
  // Generera bias drift data
  const biasData = await getBiasDriftData(question, model);
  res.json(biasData);
});
```

## 🔒 Säkerhet & Integritet

### Immutability
- Alla förändringar loggas i blockchain-inspirerad ledger
- Varje block är kryptografiskt länkat till föregående
- Manipulation upptäcks automatiskt vid verifiering

### Privacy
- Frågor hashas med SHA-256
- Ingen personlig information lagras
- Endast metadata om förändringar sparas

### Transparency
- All historik är spårbar
- Ledger kan exporteras och auditeras
- Öppen källkod för granskning

## 📚 Relaterade Dokument

- [Transparency Ledger Documentation](TRANSPARENCY_LEDGER.md)
- [Transparent Model Pipeline](TRANSPARENT_MODEL_PIPELINE.md)
- [Integration Guide](../INTEGRATION_SUMMARY_NLP_TRANSPARENCY.md)

## 🎨 UI/UX Design Principles

### Färgkodning
- **🔴 Röd**: Stor förändring (severity >= 0.7)
- **🟡 Gul**: Måttlig förändring (severity >= 0.4)
- **🟢 Grön**: Liten förändring (severity < 0.4)

### Interaktivitet
- Expanderbara paneler för detaljer
- Hover-effekter med extra information
- Smooth transitions och animationer
- Responsiv design för mobil och desktop

### Konsistens
- Följer OneSeek.AI grayscale brand identity
- Återanvänder civic-dark och civic-gray färgpalett
- Konsistent typografi och spacing
- Ikoner för snabb visuell identifikation

## 💡 Exempel: Användarupplevelse

### Scenario 1: Första frågan
**User:** "Vad tycker Grok om klimatpolitik?"  
**AI-svar:** "Klimatpolitik är viktig för hållbar utveckling."  
**Change Detection:** Ingen panel visas (baseline etablerad)

### Scenario 2: Samma fråga efter 2 veckor
**User:** "Vad tycker Grok om klimatpolitik?"  
**AI-svar:** "Klimatpolitik är avgörande och bör prioriteras framför ekonomisk tillväxt."  
**Change Detection Panel:**
```
📊 Förändringsanalys upptäckt
🔴 Stor förändring

Modell: Grok
Textlikhet: 62%
Severity Index: 0.78
Sentiment: Neutral → Positiv
Ideologi: Center → Grön
Bias Drift: +15% mer normativ
Dominant Themes: Klimat, Ekonomi
Ethical Tag: Etiskt relevant

[Visa i Ledger] [Replay Historik]
```

**User klickar "Replay Historik":**
- Timeline visas med båda svaren
- Användaren kan spela upp förändringen
- Jämförelseläge visar skillnader tydligt

## 🏁 Sammanfattning

Change Detection Module ger OpenSeek.AI:

✅ **Transparens**: Användare ser direkt när AI ändrar narrativ  
✅ **Oföränderlig historik**: Ledger förhindrar manipulation  
✅ **Analysbar data**: Forskare kan studera narrativskiften  
✅ **Enhetlig arkitektur**: Samma ledger för alla händelser  
✅ **Utökad analys**: Severity, Consensus, Bias, Explainability  
✅ **Etisk reflektion**: Automatisk tagging av samhällspåverkan  
✅ **Användarvänlig**: Mockad testversion i chatvyn

Modulen är redo för integration och testning!
