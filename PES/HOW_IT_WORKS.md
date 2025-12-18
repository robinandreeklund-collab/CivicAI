# Hur PES (Prompt Evolution System) Fungerar - Komplett Beskrivning

## 📋 Innehållsförteckning

1. [Översikt](#översikt)
2. [Systemarkitektur](#systemarkitektur)
3. [Dataflöde](#dataflöde)
4. [Simulatorn i Detalj](#simulatorn-i-detalj)
5. [Performance Analyzer](#performance-analyzer)
6. [Prompt Evolution Process](#prompt-evolution-process)
7. [API och Integration](#api-och-integration)

---

## Översikt

PES (Prompt Evolution System) är ett system för att **systematiskt förbättra AI-prompts** genom:
- **Simuleringar** med verkliga debattdata från live-systemet
- **Kvantitativ analys** av prompt-prestanda
- **A/B-jämförelser** mellan olika prompt-versioner
- **Evolutionär optimering** baserad på metrics

### Nyckelkoncept

**Prompt Version**: En specifik version av en system prompt (ex: v1.0.0, v1.1.0)
**Simulation**: En körning där en prompt testas mot verkliga debattdata
**Metrics**: Kvantitativa mått på prompt-prestanda (längd, kvalitet, syntes)
**Baseline**: Den nuvarande production-prompten (v1.0.0-baseline)

---

## Systemarkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    LIVE DEBATE SYSTEM                        │
│  (Python ML Service - ml_service/server.py)                  │
│                                                              │
│  • WebSocket-baserade live-debatter                          │
│  • 3 rundor med GPT, Gemini, DeepSeek, Grok + ONESEEK      │
│  • Använder MAIN_DEBATE_PROMPT för ONESEEK-svar            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ POST /api/pes/debates (efter debatt)
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                   NODE.JS BACKEND                            │
│  (backend/index.js + backend/api/pes.js)                    │
│                                                              │
│  • REST API för PES-operationer                             │
│  • Firebase integration                                      │
│  • Serverar PES frontend                                     │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Sparar till debates collection
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE FIRESTORE                        │
│                                                              │
│  Collections:                                                │
│  • debates - Live debattdata från Python                     │
│  • prompt_versions - Olika prompt-versioner                 │
│  • simulations - Simuleringsresultat                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Hämtar data för simuleringar
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              PES CORE SYSTEM (/PES/core/)                    │
│                                                              │
│  1. orchestrator.js - Huvudkoordinator                       │
│  2. simulator.js    - Kör simuleringar                       │
│  3. analyzer.js     - Beräknar metrics                       │
│  4. comparator.js   - Jämför prompts                        │
│                                                              │
│  Services:                                                   │
│  • pesFirebaseService.js - Firebase CRUD                     │
│  • oneseekService.js - ONESEEK API integration              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ Uppdaterar resultat
                  ↓
┌─────────────────────────────────────────────────────────────┐
│              PES WEB FRONTEND (/PES/frontend/)               │
│                                                              │
│  • Dashboard - Översikt och statistik                        │
│  • Prompts - Lista alla prompt-versioner                     │
│  • Simulations - Visa simuleringsresultat                    │
│  • Debates - Se live debattdata                              │
│  • Create - Skapa nya prompt-versioner                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Dataflöde

### Steg 1: Live Debatt Körs

```javascript
// Användaren kör en live debatt på /7B-zero med "Debatt ON"
WebSocket Connection → ws://localhost:5000/ws/debate

Python ML Service:
  → Fråga: "Hur ska Sverige hantera energikrisen?"
  → Runda 1: GPT, Gemini, DeepSeek, Grok svarar
  → ONESEEK genererar svar med MAIN_DEBATE_PROMPT
  → Runda 2: Fortsatt debatt
  → Runda 3: Final debatt
  → Röstning: Vilken AI var bäst?
  → Resultat: Vinnare + sammanfattning
```

### Steg 2: Debatt Sparas till Firebase

```javascript
// Python server.py anropar efter avslutad debatt
POST http://localhost:3001/api/pes/debates

Body: {
  debate_id: "uuid-123-456",
  question: "Hur ska Sverige hantera energikrisen?",
  rounds: [
    {
      roundNumber: 1,
      responses: [
        { provider: "gpt", text: "...", timestamp: "..." },
        { provider: "oneseek", text: "...", timestamp: "..." },
        // ... andra AI-svar
      ]
    },
    // runda 2 och 3...
  ],
  votes: { oneseek: 3, gpt: 2, gemini: 1, ... },
  winner: "oneseek",
  summary: "ONESEEK vann med stark syntes...",
  created_at: "2024-01-15T10:30:00Z"
}

// Node.js backend sparar till Firebase
Firebase.collection('debates').doc(debate_id).set(debateData)
```

### Steg 3: Användaren Skapar Prompt Version

```javascript
// Via PES Frontend: http://localhost:3001/pes
// Klicka "Create Prompt" → Fyll i formulär

POST /api/pes/prompts
Body: {
  promptText: "Du är ONESEEK – en avancerad deltagare...",
  version: "v1.0.0-baseline",
  topic: "debate",
  status: "active",
  runSimulation: true  // Kör simulering direkt
}

// Orchestrator tar emot
createAndTestPromptVersion({
  promptText, version, topic
}, runSimulation=true)
```

### Steg 4: Simulering Körs

```javascript
// simulator.js runSimulation() anropas
1. Hämta alla debatter från Firebase
   debates = await pesFirebaseService.getDebates()
   
2. Filtrera giltig debattdata
   validDebates = debates.filter(d => 
     d.question && d.rounds && d.rounds.length > 0
   )
   
3. För varje debatt:
   a) Bygg simuleringskontext
   b) Ersätt template-variabler i prompten
   c) Generera simulerat ONESEEK-svar
   d) Beräkna metrics för svaret
   
4. Aggregera resultat över alla debatter
5. Spara simulation till Firebase
```

---

## Simulatorn i Detalj

### Simulator Architecture

```javascript
// PES/core/simulator.js

async function runSimulation(promptVersion, debateFilters = {}) {
  console.log(`[PES Simulator] Starting simulation for prompt ${promptVersion.version}`);
  
  // STEG 1: Hämta debattdata
  const debates = await pesFirebaseService.getDebates(debateFilters);
  console.log(`[PES Simulator] Using ${debates.length} debates for simulation`);
  
  // STEG 2: Validera debattdata
  const validDebates = debates.filter(validateDebateData);
  
  // STEG 3: Kör simulering för varje debatt
  const results = [];
  for (const debate of validDebates) {
    try {
      const result = await simulateDebateWithPrompt(
        debate, 
        promptVersion
      );
      results.push(result);
    } catch (error) {
      console.error(`[PES Simulator] Error in debate ${debate.id}:`, error);
    }
  }
  
  // STEG 4: Beräkna aggregerade metrics
  const aggregatedMetrics = calculateAggregatedMetrics(results);
  
  // STEG 5: Spara simulation
  const simulation = {
    prompt_version_id: promptVersion.id,
    debates_tested: validDebates.length,
    metrics: aggregatedMetrics,
    individual_results: results,
    timestamp: new Date()
  };
  
  await pesFirebaseService.saveSimulation(simulation);
  
  return simulation;
}
```

### Simuleringsprocess per Debatt

```javascript
async function simulateDebateWithPrompt(debate, promptVersion) {
  // STEG 1: Bygg kontext för varje runda
  const roundResults = [];
  
  for (let roundNum = 1; roundNum <= 3; roundNum++) {
    // STEG 1a: Hämta kontext för denna runda
    const context = buildSimulationContext(debate, roundNum);
    
    // STEG 1b: Ersätt template-variabler i prompten
    const filledPrompt = fillPromptTemplate(
      promptVersion.promptText,
      {
        clean_question: debate.question,
        round_num: roundNum,
        max_rounds: 3,
        chain_so_far: context.previousRounds,
        participants_text: context.participants,
        other_responses: context.otherResponses
      }
    );
    
    // STEG 1c: Generera ONESEEK-svar med prompten
    const simulatedResponse = await generateOneseekResponse(
      filledPrompt,
      debate.question,
      context
    );
    
    // STEG 1d: Beräkna metrics för detta svar
    const metrics = analyzeResponse(
      simulatedResponse,
      context,
      promptVersion
    );
    
    roundResults.push({
      round: roundNum,
      response: simulatedResponse,
      metrics: metrics
    });
  }
  
  // STEG 2: Beräkna genomsnittliga metrics för debatten
  const debateMetrics = aggregateRoundMetrics(roundResults);
  
  return {
    debate_id: debate.id,
    round_results: roundResults,
    overall_metrics: debateMetrics
  };
}
```

### Template-variabel Substitution

```javascript
function fillPromptTemplate(promptText, variables) {
  let filled = promptText;
  
  // Ersätt varje template-variabel
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    filled = filled.replace(new RegExp(placeholder, 'g'), value);
  }
  
  return filled;
}

// Exempel:
// Template: "Detta är runda {round_num} av {max_rounds}. Fråga: {clean_question}"
// Variables: { round_num: 2, max_rounds: 3, clean_question: "Vad tycker du?" }
// Resultat: "Detta är runda 2 av 3. Fråga: Vad tycker du?"
```

### Kontext-byggnad

```javascript
function buildSimulationContext(debate, currentRound) {
  // Samla tidigare rundor
  const previousRounds = [];
  for (let i = 1; i < currentRound; i++) {
    const round = debate.rounds.find(r => r.roundNumber === i);
    if (round && Array.isArray(round.responses)) {
      previousRounds.push({
        round: i,
        responses: round.responses.map(r => ({
          provider: r.provider || 'unknown',
          text: r.text || r.response || ''
        }))
      });
    }
  }
  
  // Samla andra AI:ers svar i denna runda
  const currentRoundData = debate.rounds.find(r => r.roundNumber === currentRound);
  const otherResponses = [];
  
  if (currentRoundData && Array.isArray(currentRoundData.responses)) {
    otherResponses = currentRoundData.responses
      .filter(r => r.provider !== 'oneseek')
      .map(r => ({
        provider: r.provider,
        text: r.text || r.response || ''
      }));
  }
  
  // Bygg "chain_so_far" - hela konversationen hittills
  let chain = `Fråga: ${debate.question}\n\n`;
  
  for (const prevRound of previousRounds) {
    chain += `=== Runda ${prevRound.round} ===\n`;
    for (const response of prevRound.responses) {
      chain += `${response.provider.toUpperCase()}: ${response.text}\n\n`;
    }
  }
  
  if (otherResponses.length > 0) {
    chain += `=== Runda ${currentRound} (andra AI:er) ===\n`;
    for (const response of otherResponses) {
      chain += `${response.provider.toUpperCase()}: ${response.text}\n\n`;
    }
  }
  
  return {
    previousRounds,
    otherResponses,
    chain: chain,
    participants: ['GPT', 'Gemini', 'DeepSeek', 'Grok', 'ONESEEK'].join(', ')
  };
}
```

### ONESEEK Response Generation

```javascript
async function generateOneseekResponse(filledPrompt, question, context) {
  // Anropa ONESEEK API med den ifyllda prompten
  const response = await oneseekService.generate({
    system_prompt: filledPrompt,
    user_message: question,
    context: context.chain,
    max_tokens: 700,  // Från MAIN_DEBATE config
    temperature: 0.7
  });
  
  return response.text;
}
```

---

## Performance Analyzer

### Metrics som Beräknas

```javascript
// PES/core/analyzer.js

function analyzeResponse(response, context, promptVersion) {
  return {
    // Grundläggande metrics
    response_length: response.length,
    word_count: response.split(/\s+/).length,
    
    // Strukturella metrics
    has_clear_structure: checkStructure(response),
    num_paragraphs: countParagraphs(response),
    num_sections: countSections(response),
    
    // Syntesförmåga
    synthesis_indicators: {
      references_others: checkReferencesToOthers(response, context),
      integrates_perspectives: checkIntegration(response, context),
      adds_new_insights: checkNovelty(response, context)
    },
    
    // Kvalitetsindikatorer
    quality_indicators: {
      has_examples: /exempel|till exempel|exempelvis/i.test(response),
      has_recommendations: /rekommenderar|föreslår|bör|ska/i.test(response),
      proper_ending: checkProperEnding(response),
      appropriate_length: checkLength(response, 350, 550)
    },
    
    // Prompt-följsamhet
    follows_format: checkPromptAdherence(response, promptVersion),
    
    // Score (0-100)
    overall_score: calculateOverallScore(response, context)
  };
}
```

### Score-beräkning

```javascript
function calculateOverallScore(response, context) {
  let score = 0;
  
  // Längd (0-20 poäng)
  const wordCount = response.split(/\s+/).length;
  if (wordCount >= 350 && wordCount <= 550) {
    score += 20;
  } else if (wordCount >= 300 && wordCount <= 600) {
    score += 15;
  } else {
    score += 10;
  }
  
  // Struktur (0-20 poäng)
  if (checkStructure(response)) score += 20;
  else score += 10;
  
  // Syntes (0-30 poäng)
  const synthesis = analyzeSynthesis(response, context);
  score += synthesis.score;
  
  // Kvalitet (0-30 poäng)
  if (hasExamples(response)) score += 10;
  if (hasRecommendations(response)) score += 10;
  if (properEnding(response)) score += 10;
  
  return Math.min(100, score);
}
```

### Aggregerade Metrics

```javascript
function calculateAggregatedMetrics(results) {
  const scores = results.map(r => r.overall_metrics.overall_score);
  const wordCounts = results.map(r => r.overall_metrics.avg_word_count);
  
  return {
    average_score: average(scores),
    median_score: median(scores),
    min_score: Math.min(...scores),
    max_score: Math.max(...scores),
    
    average_word_count: average(wordCounts),
    
    consistency: calculateConsistency(scores),
    
    debates_tested: results.length,
    
    strength_areas: identifyStrengths(results),
    improvement_areas: identifyWeaknesses(results)
  };
}
```

---

## Prompt Evolution Process

### 1. Etablera Baseline

```javascript
// Ladda production-prompten som baseline
const baseline = {
  version: "v1.0.0-baseline",
  promptText: MAIN_DEBATE_PROMPT,  // Från baseline-prompts.js
  topic: "debate",
  status: "active"
};

// Kör simulering för att etablera baseline-metrics
const baselineSimulation = await runSimulation(baseline);

// Resultat:
// - Average Score: 75/100
// - Avg Word Count: 420
// - Synthesis Score: 22/30
// etc.
```

### 2. Skapa Variation

```javascript
// Skapa en variant som fokuserar mer på exempel
const variant_v1_1_0 = {
  version: "v1.1.0-more-examples",
  promptText: baseline.promptText + 
    "\n\nGe ALLTID minst 2-3 konkreta exempel i varje svar.",
  topic: "debate",
  status: "testing"
};

// Kör simulering
const variantSimulation = await runSimulation(variant_v1_1_0);
```

### 3. Jämför Resultat

```javascript
// PES/core/comparator.js

const comparison = await comparePromptVersions(
  "v1.0.0-baseline",
  "v1.1.0-more-examples"
);

// Resultat:
{
  baseline: {
    version: "v1.0.0-baseline",
    avg_score: 75,
    avg_word_count: 420
  },
  variant: {
    version: "v1.1.0-more-examples",
    avg_score: 78,  // +3 poäng!
    avg_word_count: 445
  },
  improvements: {
    score: +3,
    has_more_examples: true,
    word_count: +25
  },
  recommendation: "Deploy v1.1.0 - better performance"
}
```

### 4. Iterera

```javascript
// Baserat på resultat, skapa fler varianter
const variants = [
  "v1.2.0-stronger-synthesis",    // Fokus på bättre syntes
  "v1.3.0-shorter-responses",     // Kortare svar
  "v1.4.0-more-structured",       // Tydligare struktur
];

// Testa alla
for (const variant of variants) {
  const simulation = await runSimulation(variant);
  // Jämför med baseline...
}

// Hitta bästa varianten
const winner = findBestPerformer(allSimulations);
```

### 5. Deploy

```javascript
// När en variant visar klart bättre resultat:
// 1. Uppdatera ml_service/server.py med nya prompten
// 2. Sätt status till "active" i PES
// 3. Ny variant blir nästa baseline
```

---

## API och Integration

### REST API Endpoints

```javascript
// GET /api/pes/status
// Hämta systemstatus
Response: {
  firebase_connected: true,
  oneseek_connected: true,
  total_prompts: 5,
  total_simulations: 12,
  total_debates: 8
}

// GET /api/pes/prompts?topic=debate&status=active
// Lista prompt-versioner
Response: {
  prompts: [
    {
      id: "abc123",
      version: "v1.0.0-baseline",
      topic: "debate",
      status: "active",
      created_at: "2024-01-15T10:00:00Z",
      last_simulation: {...}
    }
  ],
  total: 1
}

// POST /api/pes/prompts
// Skapa ny prompt-version (och köra simulering)
Request: {
  promptText: "Du är ONESEEK...",
  version: "v1.1.0",
  topic: "debate",
  runSimulation: true
}
Response: {
  prompt: {...},
  simulation: {...}
}

// GET /api/pes/simulations?prompt_version_id=abc123
// Hämta simuleringar
Response: {
  simulations: [
    {
      id: "sim123",
      prompt_version_id: "abc123",
      debates_tested: 5,
      metrics: {
        average_score: 78,
        average_word_count: 430,
        ...
      },
      timestamp: "2024-01-15T11:00:00Z"
    }
  ],
  total: 1
}

// POST /api/pes/compare
// Jämför två prompt-versioner
Request: {
  version1: "v1.0.0-baseline",
  version2: "v1.1.0-more-examples"
}
Response: {
  comparison: {
    baseline: {...},
    variant: {...},
    improvements: {...},
    recommendation: "..."
  }
}

// GET /api/pes/debates?limit=10
// Hämta debattdata (för frontend)
Response: {
  debates: [...],
  total: 8
}

// POST /api/pes/debates
// Spara ny debatt (från Python ML service)
Request: {
  debate_id: "uuid",
  question: "...",
  rounds: [...],
  votes: {...},
  winner: "oneseek"
}
Response: {
  success: true,
  id: "uuid"
}
```

### Frontend → Backend Flow

```javascript
// 1. Användaren skapar prompt i frontend
fetch('/api/pes/prompts', {
  method: 'POST',
  body: JSON.stringify({
    promptText: document.getElementById('prompt-text').value,
    version: document.getElementById('version').value,
    topic: 'debate',
    runSimulation: document.getElementById('run-sim').checked
  })
});

// 2. Backend tar emot
app.post('/api/pes/prompts', async (req, res) => {
  const { promptText, version, topic, runSimulation } = req.body;
  
  // Spara prompt
  const promptVersion = await pesFirebaseService.savePromptVersion({
    promptText, version, topic, status: 'active'
  });
  
  // Kör simulering om begärt
  let simulation = null;
  if (runSimulation) {
    simulation = await runSimulation(promptVersion);
  }
  
  res.json({ prompt: promptVersion, simulation });
});

// 3. Frontend uppdateras
const response = await fetch('/api/pes/prompts');
// Laddar om prompt-lista och visar ny prompt
```

---

## Sammanfattning: Hela Flödet

```
1. LIVE DEBATT
   └→ Python ML Service kör debatt med MAIN_DEBATE_PROMPT
   └→ Sparar till Firebase via POST /api/pes/debates

2. DATA I FIREBASE
   └→ debates collection innehåller alla live-debatter
   └→ Varje debatt har: question, rounds, votes, winner

3. SKAPA PROMPT-VERSION
   └→ Användare kopierar MAIN_DEBATE_PROMPT från baseline-prompts.js
   └→ Klistrar in i PES frontend "Create Prompt"
   └→ Sätter version: v1.0.0-baseline
   └→ Kryssar "Run simulation"
   └→ POST /api/pes/prompts

4. SIMULERING KÖRS
   └→ Hämtar alla debatter från Firebase
   └→ För varje debatt:
       └→ För varje runda (1-3):
           └→ Bygg kontext (tidigare rundor + andra AI-svar)
           └→ Fyll i template-variabler i prompten
           └→ Generera ONESEEK-svar med ONESEEK API
           └→ Beräkna metrics för svaret
   └→ Aggregera metrics över alla debatter
   └→ Spara simulation till Firebase

5. RESULTAT VISAS
   └→ Frontend hämtar simulation från Firebase
   └→ Visar metrics: score, word count, synthesis, etc.
   └→ Användaren kan se prestandadata

6. SKAPA VARIANTER
   └→ Kopiera baseline-prompten
   └→ Gör ändringar (ex: "Ge fler exempel")
   └→ Spara som v1.1.0
   └→ Kör simulering igen
   └→ Jämför med baseline

7. HITTA VINNARE
   └→ Använd /api/pes/compare för att jämföra versioner
   └→ Identifiera vilken prompt som presterar bäst
   └→ Deploy vinnande prompt till ml_service/server.py

8. UPPREPA
   └→ Ny variant blir baseline
   └→ Fortsätt iterera och förbättra
```

---

## Tekniska Detaljer

### Template Variables i Prompts

```
{clean_question}     - Den ursprungliga frågan från debatten
{round_num}          - Nuvarande rundnummer (1, 2, eller 3)
{max_rounds}         - Totalt antal rundor (alltid 3)
{chain_so_far}       - Hela konversationen hittills
{participants_text}  - Lista över alla deltagare
{other_responses}    - Andra AI:ers svar i denna runda
```

### Firebase Collections Schema

```javascript
// debates collection
{
  id: "uuid",
  question: "string",
  rounds: [
    {
      roundNumber: 1,
      responses: [
        { provider: "gpt", text: "...", timestamp: "..." }
      ]
    }
  ],
  votes: { oneseek: 3, gpt: 2 },
  winner: "oneseek",
  summary: "string",
  created_at: Timestamp
}

// prompt_versions collection
{
  id: "auto-generated",
  version: "v1.0.0-baseline",
  promptText: "Du är ONESEEK...",
  topic: "debate",
  status: "active",
  metadata: { source: "...", description: "..." },
  created_at: Timestamp
}

// simulations collection
{
  id: "auto-generated",
  prompt_version_id: "abc123",
  debates_tested: 5,
  metrics: {
    average_score: 78,
    average_word_count: 430,
    synthesis_score: 25,
    consistency: 0.85
  },
  individual_results: [...],
  timestamp: Timestamp
}
```

---

## Slutsats

PES är ett **systematiskt, data-drivet system** för att förbättra AI-prompts genom:

1. **Verklig data**: Använder faktiska debatter från live-systemet
2. **Kvantitativ analys**: Mäter prestanda med objektiva metrics
3. **A/B-testning**: Jämför olika prompt-versioner
4. **Iterativ förbättring**: Kontinuerlig optimering baserat på resultat

Systemet möjliggör **vetenskaplig prompt engineering** istället för gissningar och trial-and-error.
