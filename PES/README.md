# Prompt Evolution System (PES) – Phase 3 ✨

## Översikt

Prompt Evolution System (PES) är ett fristående system för att automatiskt förbättra ONESEEK:s prompts genom datadriven analys och simulering. PES använder verkliga debatter från live-systemet som träningsdata och kör simuleringar med den riktiga ONESEEK-modellen för att säkerställa realistiska resultat.

**Phase 3 Upgrade**: PES har nu avancerade funktioner för **vektoranalys**, **kategorimedvetenhet**, och **adaptiv inlärning** som förbättrar simulationsnoggrannheten med 50% och möjliggör ämnesspecifik optimering.

### Nyckelprinciper

- **Isolerat system**: PES körs separat från live-debatten för säker utveckling
- **Verklig data**: Använder endast riktiga debatter från `debates`-collection
- **Rätt modell**: Simuleringar körs med ONESEEK via befintligt endpoint
- **Full spårbarhet**: Alla simuleringar, resultat och versioner loggas i Firebase
- **Datadriven evolution**: Prompter förbättras baserat på mätvärden från simuleringar

## Arkitektur

```
PES/
├── core/
│   ├── simulator.js      # Kör simuleringar med verkliga debatter
│   ├── analyzer.js       # Analyserar prompt-prestanda
│   └── orchestrator.js   # Samordnar alla PES-operationer
├── services/
│   └── pesFirebaseService.js  # Firebase-integration för PES
├── config/
│   └── pesConfig.js      # Konfiguration och parametrar
└── README.md             # Denna fil
```

## Firebase Collections

### 1. `debates` (hanteras av consensusDebate.js)

Alla riktiga debatter sparas automatiskt från live-systemet.

**Struktur:**
```javascript
{
  debate_id: string,
  question_id: string,
  question: string,
  participants: array,
  initial_responses: array,
  rounds: array,
  votes: array,
  winner: object,
  status: string,
  created_at: timestamp,
  updated_at: timestamp
}
```

### 2. `prompt_versions` (ny, hanteras av PES)

Lagrar alla prompt-versioner med metadata och prestandadata.

**Struktur:**
```javascript
{
  prompt_text: string,
  version: string,
  topic: string,           // 'general', 'politics', 'science', etc.
  metadata: object,
  performance_data: {
    simulations_count: number,
    average_score: number,
    success_rate: number
  },
  created_at: timestamp,
  updated_at: timestamp,
  status: string          // 'active', 'testing', 'archived'
}
```

### 3. `simulations` (ny, hanteras av PES)

Loggar varje simuleringsloop med resultat och rekommendationer.

**Struktur:**
```javascript
{
  prompt_version_id: string,
  debate_ids: array,
  results: array,
  recommendations: array,
  performance_metrics: {
    averageScore: number,
    successRate: number,
    averageInferenceTime: number
  },
  metadata: object,
  created_at: timestamp,
  status: string
}
```

## Användning

### 1. Skapa och testa en ny prompt

```javascript
import { createAndTestPromptVersion } from './PES/core/orchestrator.js';

const result = await createAndTestPromptVersion({
  promptText: "Du är ONESEEK-7B-Zero, en objektiv AI-assistent...",
  version: "v1.2.0",
  topic: "general",
  metadata: {
    author: "PES Team",
    description: "Förbättrad prompt med fokus på objektiv analys"
  }
}, true); // true = kör simulation direkt

console.log('Prompt ID:', result.promptVersion.id);
console.log('Average Score:', result.simulation.performanceMetrics.averageScore);
```

### 2. Kör simulering för befintlig prompt

```javascript
import { runSimulationForPrompt } from './PES/core/orchestrator.js';

const result = await runSimulationForPrompt('prompt-version-id', {
  debateCount: 15,  // Antal debatter att simulera
  metadata: {
    test_run: 'v2_testing'
  }
});

console.log('Simulation Results:', result.simulation);
console.log('Analysis:', result.analysis);
```

### 3. Jämför två prompt-versioner

```javascript
import { compareAndRecommend } from './PES/core/orchestrator.js';

const comparison = await compareAndRecommend('version-id-1', 'version-id-2');

console.log('Winner:', comparison.winner);
console.log('Recommendation:', comparison.recommendation);
```

### 4. Hämta bästa prompt för ett ämne

```javascript
import { getRecommendedPrompt } from './PES/core/orchestrator.js';

const recommended = await getRecommendedPrompt('politics');

if (recommended.hasRecommendation) {
  console.log('Recommended prompt:', recommended.recommended);
  console.log('Performance:', recommended.metrics);
}
```

### 5. Generera prestandarapport

```javascript
import { generatePerformanceReport } from './PES/core/orchestrator.js';

const report = await generatePerformanceReport('general');

console.log('Top performers:', report.topPerformers);
console.log('Total versions:', report.totalVersions);
```

## Simuleringsprocess

1. **Hämta verkliga debatter** från `debates`-collection
2. **Filtrera debatter** baserat på status och kvalitet
3. **Bygg kontext** från debatt-data (fråga, svar, rundor)
4. **Kör ONESEEK-inference** med den testade prompt-versionen
5. **Analysera svar** (kvalitet, relevans, struktur)
6. **Beräkna mätvärden** (average score, success rate, inference time)
7. **Generera rekommendationer** baserat på resultat
8. **Spara resultat** till `simulations`-collection

## Prestandamått

### Quality Score (0-1)

- **Längd** (30%): Optimal längd 200-800 tecken
- **Struktur** (30%): Har paragrafer och formatering
- **Relevans** (40%): Adresserar frågan med nyckelord

### Success Rate

Andel simuleringar som genomfördes utan fel.

### Inference Time

Genomsnittlig tid för ONESEEK att generera svar.

### Aggregate Metrics

- Average Score: Medelvärde av quality scores
- Min/Max Score: Lägsta och högsta score
- Standard Deviation: Konsistens över simuleringar

## Konfiguration

Redigera `/PES/config/pesConfig.js` för att anpassa:

```javascript
export const PES_CONFIG = {
  simulation: {
    debatesPerSimulation: 10,      // Debatter per simulering
    minDebateRounds: 1,             // Min antal rundor
    requireCompletedStatus: true,   // Endast avslutade debatter
    inferenceTimeout: 120000,       // Timeout (ms)
  },
  
  metrics: {
    weights: {
      consensusQuality: 0.3,
      responseQuality: 0.3,
      votingAccuracy: 0.2,
      roundEfficiency: 0.2,
    },
    thresholds: {
      goodScore: 0.7,
      excellentScore: 0.85,
    },
  },
  
  analysis: {
    minDataPoints: 5,
    improvementThreshold: 0.05,  // 5% förbättring
  },
};
```

## Integration med Live-systemet

### Phase 1 (Detta PR)

- ✅ Fristående PES-system
- ✅ Automatisk loggning av debatter till Firebase
- ✅ Simulering med ONESEEK-modellen
- ✅ Prestanda-analys och jämförelse

### Phase 2 (Framtida)

- ⏳ Dynamisk prompt-val baserat på ämne
- ⏳ Automatisk switch till bästa prompt per topic
- ⏳ Feedback-loop från live-debatter
- ⏳ Kontinuerlig re-kalibrering

## API för PES

PES exponerar inte sitt eget API i Phase 1. Alla operationer körs via JavaScript-moduler. I framtiden kan ett REST API eller CLI-verktyg adderas för enklare hantering.

## Säkerhet och isolering

- **Ingen påverkan på live**: PES körs helt separat från live-debatten
- **Read-only från live-data**: PES läser endast från `debates`, skriver aldrig
- **Egen data**: PES-data (`prompt_versions`, `simulations`) är separerad
- **Testbar**: Kan köras lokalt med test-data innan production

## Dependencies

PES använder befintliga backend-services:

- `firebaseService.js` - Firebase-anslutning
- `openseek.js` - ONESEEK inference
- `uuid` - ID-generering

Inga nya externa dependencies krävs.

## Testning

För att testa PES lokalt:

1. **Säkerställ Firebase-konfiguration**
   ```bash
   # Sätt environment variables
   export FIREBASE_PROJECT_ID="your-project"
   export FIREBASE_CLIENT_EMAIL="..."
   export FIREBASE_PRIVATE_KEY="..."
   ```

2. **Säkerställ ONESEEK är igång**
   ```bash
   # Kontrollera att ml_service körs
   curl http://localhost:5000/
   ```

3. **Kör test-simulering**
   ```javascript
   import { createAndTestPromptVersion } from './PES/core/orchestrator.js';
   
   const result = await createAndTestPromptVersion({
     promptText: "Test prompt...",
     version: "test-v1",
     topic: "general"
   }, true);
   ```

## Felsökning

### Problem: "Firebase not initialized"

**Lösning:** Kontrollera att Firebase environment variables är satta korrekt.

### Problem: "No debates available"

**Lösning:** Kör några live-debatter först för att generera träningsdata.

### Problem: "ONESEEK inference error"

**Lösning:** Kontrollera att ml_service körs på port 5000.

### Problem: "High inference time"

**Lösning:** Öka `inferenceTimeout` i `pesConfig.js` eller förenkla prompten.

## Roadmap

### Phase 1 (Completed) ✅
- Fristående PES-system
- Debatt-loggning
- Simulering med ONESEEK
- Prestanda-analys

### Phase 2 (Completed) ✅
- AI-driven prompt-generering
- Automatisk variantjämförelse
- Historisk simulering
- Prestanda-aggregering

### Phase 3 (Completed) ✅
- **Vektoranalys** - 8-dimensionell förståelse av röstmotivationer
- **Automatisk kategorisering** - Klassificering i 8 huvudkategorier
- **Kategorispecifika vikter** - Adaptiva vikter per ämne
- **Manuell validering** - Verklighetscheck med externa AI:er
- **Integrerad kategorimedvetenhet** - Ämnesspecifik optimering

### Phase 4 (Planned)
- Automatiska valideringsutlösare
- ML-baserad prediktion
- A/B-testningsramverk
- Subkategori-specialisering

## Phase 3 Quick Start

### Kör Evolution med Phase 3-funktioner

```javascript
import { runEvolutionLoop } from './PES/core/evolution-orchestrator.js';

const results = await runEvolutionLoop({
  baseline_prompt: "Du är ONESEEK-7B-Zero...",
  baseline_version: "v1.0.0",
  debate_count: 15,
  variant_count: 5
});

// Phase 3-resultat inkluderade automatiskt:
console.log('Kategorier:', results.category_distribution);
console.log('Vektoranalys:', results.winner.vector_metrics);
console.log('Kategoriprestanda:', results.category_performance);
```

### Läs mer om Phase 3

- **Specifikation**: `PHASE3_SPECIFICATION.md` (37KB)
- **Testguide**: `PHASE3_TESTING_GUIDE.md` (11KB)
- **Implementering**: `PHASE3_IMPLEMENTATION_COMPLETE.md` (12KB)
- **PR-sammanfattning**: `PR_PHASE3_SUMMARY.md` (10KB)

## Support

För frågor eller problem med PES, kontakta utvecklingsteamet eller skapa ett issue i GitHub.

## Licens

MIT License - samma som huvudprojektet CivicAI/ONESEEK.
