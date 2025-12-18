# PES Phase 2 Implementation Summary

## Översikt

PES Phase 2 är nu **fullständigt implementerat** som ett **fristående system** som endast kommunicerar med ONESEEK-modellen för inferens.

## Arkitektur - Två Separata System, Samma Databas

```
┌─────────────────────────────────────────────────────────┐
│              LIVE DEBATE SYSTEM                         │
│              (backend/services/consensusDebate.js)      │
│                                                          │
│  - Kör live debatter med externa AIs                    │
│  - Sparar debatter till Firebase                        │
│                                                          │
└──────────────────┬──────────────────────────────────────┘
                   │ Skriver till
                   ▼
           ┌──────────────────────────────────────┐
           │      FIREBASE DATABASE               │
           │                                      │
           │  debates (Live-systemet skriver)     │
           │  ├─ debate_id, question, rounds      │
           │  ├─ votes, winner, participants      │
           │  └─ timestamp, status                │
           │                                      │
           │  prompt_versions (PES skriver)       │
           │  simulations (PES skriver)           │
           │  evolutions (PES Phase 2 skriver)    │
           │  simulation_runs (PES Phase 2)       │
           └──────────────┬───────────────────────┘
                          │ Läser från debates
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    PES SYSTEM (Fristående)              │
│                    /PES/                                 │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Core Modules                                  │    │
│  │  - debate-analyzer.js                          │    │
│  │  - prompt-generator.js                         │    │
│  │  - historical-simulator.js                     │    │
│  │  - voting-simulator.js                         │    │
│  │  - performance-aggregator.js                   │    │
│  │  - evolution-orchestrator.js                   │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  PES Services                                  │    │
│  │  - oneseekService.js  ← ONESEEK modell         │    │
│  │  - llmService.js      ← LLM för analys         │    │
│  │  - pesFirebaseService.js ← Samma Firebase!     │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ Endast ONESEEK inferens
                   ▼
           ┌──────────────────┐
           │  ONESEEK Model   │
           │  (localhost:5000)│
           └──────────────────┘
```

## Viktiga Principer

### 1. Två Separata System
- **Live Debate System**: `/backend/services/consensusDebate.js`
  - Kör live debatter med användare
  - Sparar debatter till Firebase `debates` collection
  - Ingen koppling till PES
  
- **PES System**: `/PES/`
  - Fristående evolutionssystem
  - Läser från `debates` (read-only från live-systemet)
  - Skriver till egna collections (`evolutions`, `simulation_runs`, etc.)
  - **Ingen direkt import från `/backend/`**
  - **Egna services i `/PES/services/`**

### 2. Delad Firebase Databas
- **Samma Firebase projekt**
- **Live-systemet äger `debates` collection**
- **PES läser från `debates` (historisk data)**
- **PES äger sina egna collections**
- **Ingen konflikt - separata collections**

### 3. Kommunikation med ONESEEK
- PES använder `PES/services/oneseekService.js`
- Anropar ONESEEK via HTTP (localhost:5000)
- Detta är den ENDA externa modellen PES pratar med
- Samma ONESEEK som live-systemet använder

### 4. LLM för Analys
- PES använder `PES/services/llmService.js`
- OpenAI GPT-4 för analys och generering
- Fallback till mock-responses om OpenAI inte tillgängligt

## Implementerade Komponenter

### Core Modules (`/PES/core/`)

#### 1. `debate-analyzer.js`
- ✅ Analyserar historiska debatter med LLM
- ✅ Identifierar framgångsmönster
- ✅ Använder `llmService.js` (inte backend/openai.js)

#### 2. `prompt-generator.js`
- ✅ Genererar promptvarianter baserat på insikter
- ✅ AI-driven variation generation
- ✅ Använder `llmService.js` (inte backend/openai.js)

#### 3. `historical-simulator.js`
- ✅ Simulerar debatter med nya prompts
- ✅ Håller externa AI-svar fixerade
- ✅ Använder `oneseekService.js` för ONESEEK inferens

#### 4. `voting-simulator.js`
- ✅ Simulerar AI-röstning med LLM
- ✅ Mäter performance av varje variant
- ✅ Använder `llmService.js` (inte backend/openai.js)

#### 5. `performance-aggregator.js`
- ✅ Aggregerar metrics från simuleringar
- ✅ Jämför varianter
- ✅ Väljer vinnare baserat på composite score

#### 6. `evolution-orchestrator.js`
- ✅ Koordinerar hela evolution loop
- ✅ Progress tracking
- ✅ Error handling

### Services (`/PES/services/`)

#### 1. `oneseekService.js` ⭐ NYA
```javascript
// Fristående service för ONESEEK kommunikation
export async function generateWithOneseek(prompt, options)
export async function checkOneseekAvailability()
export async function getOneseekInfo()
```

#### 2. `llmService.js` ⭐ NYA
```javascript
// Fristående LLM service (OpenAI)
export async function generateWithLLM(prompt, options)
export function isLLMAvailable()
export function getLLMStatus()
```

#### 3. `pesFirebaseService.js`
- ✅ Phase 2 funktioner tillagda
- ✅ `saveEvolution()`, `getEvolution()`
- ✅ `saveSimulationRun()`, `getSimulationRunsByEvolution()`

## API Endpoints

### Backend API (`/backend/api/pes.js`)

#### Phase 2 Endpoints:
```
POST   /api/pes/evolution/start          - Starta evolution loop
GET    /api/pes/evolution/:id/progress   - Hämta progress
GET    /api/pes/evolution/:id/results    - Hämta resultat
GET    /api/pes/evolutions                - Lista alla evolutions
```

## Frontend

### Pages (`/frontend/src/pages/`)

#### 1. `PESEvolutionPage.jsx`
- ✅ Dashboard för evolution loops
- ✅ Formulär för att starta nya loops
- ✅ Lista över körda evolutions
- ✅ Status tracking

#### 2. `PESEvolutionResultsPage.jsx`
- ✅ Detaljerad resultatvisning
- ✅ Vinnare med metrics
- ✅ Jämförelse mellan varianter
- ✅ Insights och rekommendationer

## Konfiguration

### Environment Variables

```bash
# ONESEEK Model (Required)
OPENSEEK_API_URL=http://localhost:5000

# OpenAI för Analys (Optional - använder fallback om saknas)
OPENAI_API_KEY=sk-...

# Firebase (Required)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
```

## Användning

### 1. Starta Evolution Loop

Via Frontend:
1. Gå till `/pes/evolution`
2. Klicka "Start New Evolution Loop"
3. Ange baseline prompt och konfiguration
4. Klicka "Start Evolution"

Via API:
```bash
curl -X POST http://localhost:3001/api/pes/evolution/start \
  -H "Content-Type: application/json" \
  -d '{
    "baseline_prompt": "Du är ONESEEK...",
    "baseline_version": "v1.0.0",
    "debate_count": 15,
    "variant_count": 5
  }'
```

### 2. Följ Progress

```bash
curl http://localhost:3001/api/pes/evolution/{id}/progress
```

### 3. Hämta Resultat

```bash
curl http://localhost:3001/api/pes/evolution/{id}/results
```

## Data Flow

```
1. Hämta historiska debatter från Firebase
   ↓
2. Analysera med LLM (GPT-4) → Insights
   ↓
3. Generera promptvarianter med LLM
   ↓
4. För varje variant:
   a. Simulera debatt med ONESEEK
   b. Simulera röstning med LLM
   ↓
5. Aggregera performance metrics
   ↓
6. Välj vinnare
   ↓
7. Spara resultat till Firebase
```

## Dependencies

### External Services:
1. **ONESEEK Model** (localhost:5000) - Required
2. **OpenAI API** - Optional (har fallback)
3. **Firebase** - Required

### NPM Packages:
- `openai` - För LLM analys
- Firebase SDK - Via backend
- Standard Node.js fetch

## Testing

Skapa test-evolution:
```bash
cd /home/runner/work/CivicAI/CivicAI
node PES/examples/test-evolution.js
```

## Firebase Collections

### Live System Collections (Ägs av Live Debate System)
- **`debates`** - Riktiga debatter från live-systemet
  - PES har READ-ONLY access
  - Används som träningsdata för PES

### PES Collections (Ägs av PES)
- **`prompt_versions`** - Prompt-versioner och deras performance
- **`simulations`** - Phase 1 simuleringsresultat
- **`evolutions`** - Phase 2 evolution loops
- **`simulation_runs`** - Phase 2 detaljerade simuleringar

### Säkerhet & Isolering

- ✅ PES är isolerat från live-systemet (olika kod, olika API endpoints)
- ✅ PES läser endast från `debates` collection (read-only)
- ✅ PES skriver ALDRIG till `debates`
- ✅ PES skriver till egna collections (`evolutions`, `simulation_runs`)
- ✅ Ingen risk för konflikt - separata collections
- ✅ Ingen påverkan på live debatter

## Nästa Steg

1. ✅ Core implementation klar
2. ✅ API endpoints klara
3. ✅ Frontend klart
4. 🔄 Testa med verkliga debatter
5. 🔄 Tuning av metrics och scoring
6. 🔄 Production deployment

## Support

För frågor om PES Phase 2:
- Se `/PES/PHASE2_SPECIFICATION.md` för fullständig specifikation
- Se `/PES/README.md` för Phase 1 info
- Se `/PES/HOW_IT_WORKS.md` för teknisk översikt

---

**Status**: ✅ Fullständigt implementerat som fristående system
**Datum**: 2025-12-18
**Version**: Phase 2.0.0
