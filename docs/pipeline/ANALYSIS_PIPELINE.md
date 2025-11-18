# 🔬 CivicAI Analysis Pipeline Documentation

## Overview

The CivicAI Analysis Pipeline är ett komplett analysmotorsystem som kombinerar flera NLP- och AI-tekniker för att ge djupgående insikter om text. Systemet bygger på fem huvudkomponenter som tillsammans skapar en transparent och spårbar analysprocess.

## Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                     Analysis Pipeline                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Preprocessing│  │ Bias         │  │ Sentiment    │          │
│  │              │→ │ Detection    │→ │ Analysis     │          │
│  │ • Tokenization│  │              │  │              │          │
│  │ • POS-tagging│  │ • Political  │  │ • VADER      │          │
│  │ • Subjectivity│ │ • Commercial │  │ • Sarcasm    │          │
│  │ • Noise      │  │ • Cultural   │  │ • Aggression │          │
│  └──────────────┘  └──────────────┘  │ • Empathy    │          │
│                                       └──────────────┘          │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐                            │
│  │ Ideological  │  │ Transparency │                            │
│  │ Classification│→ │ & Audit     │                            │
│  │              │  │ Trail        │                            │
│  │ • Left-Right │  │              │                            │
│  │ • Economic   │  │ • Timeline   │                            │
│  │ • Social     │  │ • Provenance │                            │
│  │ • Authority  │  │ • Metadata   │                            │
│  └──────────────┘  └──────────────┘                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Komponenter

### 1. Text Preprocessing (Förbearbetning)

**Modul:** `backend/utils/preprocessText.js`

**Funktioner:**
- **Tokenisering:** Delar upp text i meningar och ord med POS-taggar
- **Subjektivitetsfiltrering:** Identifierar objektiva vs subjektiva meningar
- **Laddade uttryck:** Hittar emotionellt laddade fraser
- **Brusreducering:** Tar bort fyllnadsord och icke-informativt innehåll

**Exempel:**

```javascript
import { performCompletePreprocessing } from './utils/preprocessText.js';

const result = performCompletePreprocessing('Text att analysera...');

console.log(result.tokenization.words);        // [{text: 'Text', pos: 'NOUN'}, ...]
console.log(result.subjectivityAnalysis);      // {objectiveSentences: [...], subjectivityScore: 0.3}
console.log(result.loadedExpressions);         // {loadedExpressions: [...], count: 2}
console.log(result.noiseAnalysis);             // {noisePercentage: 5, cleanedText: '...'}
```

**Provenance:**
Varje resultat inkluderar fullständig provenance med modell, version, metod och tidsstämpel.

### 2. Bias Detection (Biasdetektion)

**Modul:** `backend/utils/detectBias.js` (befintlig, används i pipeline)

**Funktioner:**
- Politisk bias (vänster/höger)
- Kommersiell bias
- Kulturell bias (västerländsk/icke-västerländsk)
- Bekräftelsebias
- Recency bias
- **NYT:** Per-mening analys med flaggade termer

**Exempel:**

```javascript
import { executeAnalysisPipeline } from './services/analysisPipeline.js';

const result = await executeAnalysisPipeline(text, question);

console.log(result.biasAnalysis);              // {biasScore: 3, detectedBiases: [...]}
console.log(result.sentenceBiasAnalysis);      // {sentences: [{biases: [...], flaggedTerms: [...]}]}
```

### 3. Sentiment Analysis (Sentimentanalys)

**Modul:** `backend/utils/sentimentAnalysis.js`

**Funktioner:**
- **VADER Sentiment:** Positiv/negativ/neutral klassificering med scores
- **Sarkasmdetektion:** Identifierar ironiska och sarkastiska uttryck
- **Aggressionsdetektion:** Hittar aggressivt och fientligt språk
- **Empatidetektion:** Upptäcker empatiska och medkännande formuleringar

**Exempel:**

```javascript
import { performCompleteSentimentAnalysis } from './utils/sentimentAnalysis.js';

const sentiment = performCompleteSentimentAnalysis('Text...');

console.log(sentiment.vaderSentiment);          // {classification: 'positive', comparative: 0.5}
console.log(sentiment.sarcasmDetection);        // {isSarcastic: true, confidence: 0.7}
console.log(sentiment.aggressionDetection);     // {isAggressive: false, level: 'none'}
console.log(sentiment.empathyDetection);        // {isEmpathetic: true, level: 'high'}
```

**VADER Scores:**
- `comparative`: Normaliserad score från -1 (negativ) till 1 (positiv)
- `positiveScore`: Andel positiva ord (0-1)
- `negativeScore`: Andel negativa ord (0-1)
- `neutralScore`: Andel neutrala ord (0-1)

### 4. Ideological Classification (Ideologisk Klassificering)

**Modul:** `backend/utils/ideologicalClassification.js`

**Funktioner:**
- Övergripande vänster-höger-center score
- Ekonomisk dimension (omfördelning vs fri marknad)
- Social dimension (progressiv vs konservativ)
- Auktoritetsdimension (libertär vs auktoritär)
- Svenska partidöverenstämmelser

**Exempel:**

```javascript
import { performCompleteIdeologicalClassification } from './utils/ideologicalClassification.js';

const ideology = performCompleteIdeologicalClassification('Text...');

console.log(ideology.ideology.overallScore);     // -0.5 (vänster)
console.log(ideology.ideology.classification);   // 'left'
console.log(ideology.ideology.dimensions);       // {economic: {...}, social: {...}, authority: {...}}
console.log(ideology.partyAlignment);            // {suggestedParties: [...]}
```

**Dimensioner:**

| Dimension | Vänster/Libertär | Höger/Auktoritär |
|-----------|------------------|------------------|
| **Ekonomisk** | Välfärd, omfördelning | Fri marknad, lägre skatter |
| **Social** | Progressiv, mångkultur | Konservativ, tradition |
| **Auktoritet** | Individuell frihet | Ordning, kontroll |

### 5. Analysis Pipeline (Analyspipeline)

**Modul:** `backend/services/analysisPipeline.js`

**Funktioner:**
- Orkesterar alla analyskomponenter
- Genererar timeline med metadata
- Skapar aggregerade insikter
- Identifierar riskflaggor
- Producerar sammanfattning

**Exempel:**

```javascript
import { executeAnalysisPipeline } from './services/analysisPipeline.js';

const result = await executeAnalysisPipeline(
  'Text att analysera...',
  'Valfri fråga för kontext',
  { includeEnhancedNLP: true }  // Valfria optioner
);

// Tillgängliga resultat:
console.log(result.preprocessing);              // Förbearbetningsresultat
console.log(result.sentimentAnalysis);          // Sentimentresultat
console.log(result.ideologicalClassification);  // Ideologiresultat
console.log(result.insights);                   // Aggregerade insikter
console.log(result.summary);                    // Sammanfattning
console.log(result.timeline);                   // Timeline med alla steg
```

## API Endpoints

### GET `/api/analysis-pipeline/info`

Hämtar information om analyspipeline.

**Response:**
```json
{
  "name": "CivicAI Analysis Pipeline",
  "version": "1.0.0",
  "components": [
    {
      "name": "Text Preprocessing",
      "features": ["Tokenization", "POS-tagging", ...]
    },
    ...
  ]
}
```

### POST `/api/analysis-pipeline/analyze`

Kör komplett analyspipmeline på en text.

**Request:**
```json
{
  "text": "Text att analysera",
  "question": "Valfri fråga för kontext",
  "options": {
    "includeEnhancedNLP": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "preprocessing": {...},
    "biasAnalysis": {...},
    "sentimentAnalysis": {...},
    "ideologicalClassification": {...},
    "insights": {...},
    "summary": {...},
    "timeline": [...]
  }
}
```

### POST `/api/analysis-pipeline/batch`

Kör pipeline på flera texter (max 10).

**Request:**
```json
{
  "texts": ["Text 1", "Text 2", ...],
  "question": "Valfri fråga",
  "options": {}
}
```

## Frontend Komponenter

### AnalysisPipelineTimeline

Visualiserar analyspipeline timeline med alla steg.

**Props:**
- `pipelineAnalysis`: Pipeline resultatobjekt

**Features:**
- Interaktiv timeline med klickbara steg
- Visar processtid för varje steg
- Expanderbar metadata
- Sammanfattande statistik

### IdeologicalClassificationPanel

Visar ideologisk klassificering med visuella indikatorer.

**Props:**
- `ideologyData`: Ideologisk klassificeringsresultat

**Features:**
- Övergripande vänster-höger bar
- Dimensionella scores med färgkodning
- Politiska markörer
- Partidöverenstämmelser

### SentimentAnalysisPanel

Visar sentimentanalys med VADER scores och emotionella indikatorer.

**Props:**
- `sentimentData`: Sentimentanalysresultat

**Features:**
- VADER score visualization
- Sentiment breakdown (positiv/negativ/neutral)
- Sarkasm/aggression/empati badges
- Detaljerade indikatorer

### PipelineAnalysisPanel

Omfattande panel som kombinerar alla analyskomponenter.

**Props:**
- `pipelineAnalysis`: Komplett pipeline resultat

**Features:**
- Flikar för olika vyer (Översikt, Sentiment, Ideologi, Timeline, Detaljer)
- Kvalitetsindikatorer
- Riskflaggor
- Textmätningar

**Användning:**

```jsx
import PipelineAnalysisPanel from './components/PipelineAnalysisPanel';

<PipelineAnalysisPanel pipelineAnalysis={response.pipelineAnalysis} />
```

### AgentBubble (Uppdaterad)

AI-responsbubblor med integrerad pipeline-analys.

**Nya Props:**
- `pipelineAnalysis`: Pipeline resultat

**Nya Features:**
- Toggle för pipeline-analys
- Visar PipelineAnalysisPanel när aktiverad

## Transparency & Provenance

### Provenance Tracking

Varje datapoint inkluderar:

```javascript
{
  provenance: {
    model: 'Custom Sentiment Analyzer',
    version: '1.0.0',
    method: 'Lexicon-based sentiment analysis',
    timestamp: '2025-11-15T12:00:00.000Z'
  }
}
```

### Timeline

Pipeline genererar en komplett timeline:

```javascript
timeline: [
  {
    step: 'preprocessing',
    startTime: '2025-11-15T12:00:00.000Z',
    endTime: '2025-11-15T12:00:00.050Z',
    durationMs: 50,
    model: 'compromise.js Tokenizer',
    version: '14.11.0',
    method: 'NLP-based tokenization'
  },
  ...
]
```

### Insights

Aggregerade insikter från alla komponenter:

```javascript
insights: {
  textMetrics: {
    wordCount: 150,
    sentenceCount: 10,
    avgWordsPerSentence: 15,
    subjectivityScore: 0.4,
    noiseLevel: 0.05
  },
  qualityIndicators: {
    objectivity: 0.6,
    clarity: 0.95,
    factuality: 0.8,
    neutrality: 0.7
  },
  emotionalProfile: {
    overallTone: 'analytical',
    sentimentClassification: 'neutral',
    isSarcastic: false,
    isAggressive: false,
    isEmpathetic: true
  },
  politicalProfile: {
    overallIdeology: 'center',
    economicStance: 'left',
    socialStance: 'progressive'
  },
  riskFlags: {
    highBias: false,
    highSubjectivity: false,
    hasAggression: false,
    loadedLanguage: false,
    manyUnverifiedClaims: false
  }
}
```

## Integration med Query Dispatcher

Pipeline är redan integrerad i `/api/query` endpoint:

```javascript
// I query_dispatcher.js
const pipelineAnalysis = await executeAnalysisPipeline(responseText, question, { 
  includeEnhancedNLP: false 
});

responses.push({
  agent: 'gpt-3.5',
  response: responseText,
  analysis: {...},
  pipelineAnalysis: pipelineAnalysis,  // ← Ny
});
```

## Testing

### Backend Tests

Kör test suite:

```bash
cd backend
node test-analysis-pipeline.js
```

**Test Coverage:**
- ✅ Text preprocessing (tokenization, subjectivity, noise)
- ✅ Sentiment analysis (VADER, sarcasm, aggression, empathy)
- ✅ Ideological classification (all dimensions)
- ✅ Complete pipeline execution
- ✅ Edge cases (empty text, short text, mixed language)

### Manual Testing

```bash
# Starta backend
cd backend
npm start

# I annat terminal
curl -X POST http://localhost:3001/api/analysis-pipeline/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"Vi måste stärka välfärden","question":"Politik?"}'
```

## Performance

Typiska processtider:

| Komponent | Tid (kort text) | Tid (lång text) |
|-----------|-----------------|-----------------|
| Preprocessing | 5-30 ms | 50-100 ms |
| Bias Detection | 1-5 ms | 5-20 ms |
| Sentiment | 1-5 ms | 5-15 ms |
| Ideology | 1-5 ms | 10-30 ms |
| **Total** | **10-50 ms** | **80-200 ms** |

## Extensibility

### Lägg till ny processor

1. Skapa processor-funktion:

```javascript
export function myNewProcessor(text) {
  // Analys här
  
  return {
    result: yourResult,
    provenance: {
      model: 'My Processor',
      version: '1.0.0',
      method: 'Description',
      timestamp: new Date().toISOString()
    }
  };
}
```

2. Integrera i pipeline:

```javascript
// I analysisPipeline.js
const myNewData = trackStep('my_new_step', myNewProcessor, text);
```

3. Lägg till i frontend:

```jsx
// I PipelineAnalysisPanel.jsx eller ny komponent
<MyNewDataDisplay data={pipelineAnalysis.myNewData} />
```

## Exempel

### Komplett exempel

```javascript
// Backend
import { executeAnalysisPipeline } from './services/analysisPipeline.js';

const text = `
  Vi måste stärka välfärden och investera mer i offentlig sektor.
  Skatterna på de rikaste bör höjas för att finansiera detta.
  Det är en fråga om rättvisa och jämlikhet i samhället.
`;

const result = await executeAnalysisPipeline(text, 'Vad tycker du om välfärd?');

console.log('Ideologi:', result.ideologicalClassification.ideology.classification);
// Output: 'left'

console.log('Sentiment:', result.sentimentAnalysis.overallTone);
// Output: 'persuasive' eller 'aggressive'

console.log('Sammanfattning:', result.summary.text);
// Output: "Texten har en övertygande ton med neutral sentiment..."
```

### Frontend exempel

```jsx
import { useState } from 'react';
import PipelineAnalysisPanel from './components/PipelineAnalysisPanel';

function AnalysisPage() {
  const [result, setResult] = useState(null);

  const analyzeText = async (text) => {
    const response = await fetch('http://localhost:3001/api/analysis-pipeline/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, question: '' })
    });
    
    const data = await response.json();
    setResult(data.result);
  };

  return (
    <div>
      <textarea onChange={(e) => analyzeText(e.target.value)} />
      {result && <PipelineAnalysisPanel pipelineAnalysis={result} />}
    </div>
  );
}
```

## Troubleshooting

### Problem: Pipeline är långsam

**Lösning:**
- Sätt `includeEnhancedNLP: false` för snabbare analys
- Använd batch-endpoint för flera texter
- Cachea resultat för återanvända texter

### Problem: VADER fungerar inte för svenska

**Aktuellt status:** VADER lexicon är på engelska. Systemet fungerar ändå genom:
- Sarcasm/aggression/empati detektorer är skräddarsydda för svenska
- Ideologisk klassificering använder svensk politisk terminologi
- För bättre VADER: Överväg att lägga till svenskt sentiment lexicon

### Problem: Felaktig ideologisk klassificering

**Orsak:** Lexicon-baserad approach kan missa kontext

**Förbättring:**
- Lägg till fler politiska nyckelord i `ideologicalClassification.js`
- Öka markörvikter för viktigare termer
- Överväg ML-baserad approach för bättre precision

## Roadmap

**Fas 1 (Klar):** ✅
- Grundläggande pipeline
- Alla analyskomponenter
- Frontend visualisering

**Fas 2 (Planerad):**
- [ ] ML-baserad ideologisk klassificering (fine-tunad BERT)
- [ ] Svenskt sentiment lexicon för VADER
- [ ] Batch-processing optimering
- [ ] Caching layer

**Fas 3 (Framtid):**
- [ ] Real-time pipeline för streaming text
- [ ] Jämförande analys mellan flera texter
- [ ] Export av pipeline resultat
- [ ] Historisk tracking av analyser

## Licens

MIT - Se projektets huvudlicens

## Support

För frågor eller bugrapporter, kontakta projektets maintainers eller öppna ett issue på GitHub.
