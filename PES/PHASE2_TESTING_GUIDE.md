# PES Phase 2 Testing Guide

Komplett guide för att testa PES Phase 2 Evolution System.

## Förutsättningar

### 1. ONESEEK Modellen Körs
```bash
# Kontrollera att ONESEEK är igång
curl http://localhost:5000/
# Förväntat svar: {"status": "running"} eller liknande
```

### 2. Firebase Konfigurerad
```bash
# Sätt environment variables
export FIREBASE_PROJECT_ID="ditt-projekt-id"
export FIREBASE_CLIENT_EMAIL="din-email@..."
export FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

Eller skapa `.env` fil i projektets root:
```env
FIREBASE_PROJECT_ID=ditt-projekt-id
FIREBASE_CLIENT_EMAIL=din-email@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Historiska Debatter i Databasen
Du behöver minst **5-10 färdiga debatter** i Firebase `debates` collection.

För att skapa testdata:
1. Gå till `/7b-zero` i frontend
2. Aktivera "Debatt ON"
3. Ställ några frågor och låt debatten köra
4. Upprepa 5-10 gånger

Kontrollera att debatter finns:
```bash
curl http://localhost:3001/api/pes/debates?limit=5
```

## Test 1: Verifiera Systemstatus

### Via API
```bash
# Kontrollera PES status
curl http://localhost:3001/api/pes/status

# Förväntat svar:
# {
#   "status": "operational",
#   "data_available": {
#     "debates": true,
#     "prompt_versions": true/false,
#     "simulations": true/false
#   }
# }
```

### Via Kod
```javascript
import { getDebates } from './PES/services/pesFirebaseService.js';
import { checkOneseekAvailability } from './PES/services/oneseekService.js';

// Kontrollera debatter
const debates = await getDebates({ limit: 10, status: 'completed' });
console.log(`✅ Hittade ${debates.length} debatter`);

// Kontrollera ONESEEK
const available = await checkOneseekAvailability();
console.log(`✅ ONESEEK tillgänglig: ${available}`);
```

## Test 2: Testa Debattanalys

Detta testar om ONESEEK kan analysera historiska debatter.

```javascript
import { analyzeDebatePatterns } from './PES/core/debate-analyzer.js';
import { getDebates } from './PES/services/pesFirebaseService.js';

// Hämta testdebatter
const debates = await getDebates({ limit: 3, status: 'completed' });

if (debates.length === 0) {
  console.log('❌ Inga debatter tillgängliga - kör live debatter först');
  process.exit(1);
}

console.log(`Analyserar ${debates.length} debatter...`);

// Analysera med ONESEEK
const insights = await analyzeDebatePatterns(debates);

console.log('✅ Analys klar!');
console.log('Debatter analyserade:', insights.debates_analyzed);
console.log('Genomsnittliga röster:', insights.overall_metrics.avg_votes_per_debate);
console.log('Win rate:', (insights.overall_metrics.win_rate * 100).toFixed(1) + '%');
console.log('Framgångsmönster:', insights.successful_patterns);
console.log('Svagheter:', insights.weaknesses);
```

## Test 3: Testa Promptgenerering

Detta testar om ONESEEK kan generera promptvarianter.

```javascript
import { generatePromptVariants } from './PES/core/prompt-generator.js';

// Baseline prompt
const baselinePrompt = `Du är ONESEEK-7B-Zero, en AI som syntetiserar olika perspektiv.

Analysera frågan objektivt och jämför olika AI-svar.
Var koncis, balanserad och transparent.`;

// Mock insights (från tidigare analys)
const mockInsights = {
  debates_analyzed: 3,
  overall_metrics: {
    avg_votes_per_debate: 1.5,
    win_rate: 0.33,
    avg_mentions: 2.1
  },
  successful_patterns: [
    'Klar struktur',
    'Data-driven analys',
    'Balanserad syntes'
  ],
  weaknesses: [
    'Kunde vara mer koncis',
    'Ibland för teknisk'
  ],
  winning_styles: [
    'Evidensbaserad syntes',
    'Strukturerad presentation'
  ],
  strategic_recommendations: [
    'Betona klarhet',
    'Använd mer data',
    'Förenkla språk'
  ]
};

console.log('Genererar promptvarianter med ONESEEK...');

const variants = await generatePromptVariants(baselinePrompt, mockInsights, 3);

console.log(`✅ Genererade ${variants.length} varianter:`);
variants.forEach((v, i) => {
  console.log(`\n${i + 1}. ${v.version}`);
  console.log('   Hypotes:', v.hypothesis);
  console.log('   Förväntat:', v.expected_improvement);
});
```

## Test 4: Testa Komplett Evolution Loop

Detta testar hela evolution loop från start till slut.

### Via API (Rekommenderat)

```bash
# Starta evolution loop
curl -X POST http://localhost:3001/api/pes/evolution/start \
  -H "Content-Type: application/json" \
  -d '{
    "baseline_prompt": "Du är ONESEEK-7B-Zero, en AI som syntetiserar perspektiv.\n\nVar objektiv och balanserad.",
    "baseline_version": "v1.0.0",
    "debate_count": 5,
    "variant_count": 3
  }'

# Svar innehåller evolution_id
# {
#   "evolution_id": "evo_1234567890_abc",
#   "status": "started",
#   "estimated_time_minutes": 15
# }

# Följ progress (upprepa tills status = completed)
curl http://localhost:3001/api/pes/evolution/evo_1234567890_abc/progress

# Hämta resultat när klar
curl http://localhost:3001/api/pes/evolution/evo_1234567890_abc/results
```

### Via Frontend (UI Test)

1. **Öppna PES Dashboard**
   ```
   http://localhost:5173/pes/evolution
   ```

2. **Klicka "Start New Evolution Loop"**

3. **Fyll i formulär:**
   - Baseline Prompt: Din nuvarande ONESEEK prompt
   - Baseline Version: v1.0.0
   - Number of Debates: 5 (för snabbt test)
   - Number of Variants: 3
   - Auto-iterate: avmarkerad

4. **Klicka "Start Evolution"**

5. **Vänta och observera:**
   - Loop startar i bakgrunden
   - Refresh-knappen visar status
   - När klar: klicka "View Results"

6. **Verifiera resultat:**
   - Vinnare visas med grönt
   - Metrics: avg_votes, win_rate, mentions
   - Jämförelse mellan varianter
   - Insights och rekommendationer

### Via Kod

```javascript
import { runEvolutionLoop } from './PES/core/evolution-orchestrator.js';

const config = {
  baseline_prompt: `Du är ONESEEK-7B-Zero, en AI som syntetiserar perspektiv.
  
Var objektiv, balanserad och transparent i din analys.`,
  baseline_version: 'v1.0.0',
  debate_count: 5,
  variant_count: 3,
  auto_iterate: false
};

console.log('Startar evolution loop...');
console.log('Detta tar ca 10-20 minuter beroende på antal debatter...\n');

// Progress callback
const progressCallback = (progress) => {
  console.log(`[${progress.status}] ${progress.current_step}`);
  if (progress.simulations_total) {
    const pct = Math.round((progress.simulations_completed / progress.simulations_total) * 100);
    console.log(`Progress: ${pct}% (${progress.simulations_completed}/${progress.simulations_total})`);
  }
};

// Kör evolution loop
const results = await runEvolutionLoop(config, progressCallback);

console.log('\n✅ Evolution loop klar!');
console.log('Evolution ID:', results.evolution_id);
console.log('Status:', results.status);
console.log('Debatter analyserade:', results.debates_count);
console.log('Varianter testade:', results.variants_generated);
console.log('\nVinnare:', results.winner?.version);
console.log('Förbättring:', results.improvement_percentage?.toFixed(1) + '%');
console.log('Genomsnittliga röster:', results.winner?.avg_votes_per_debate?.toFixed(1));
console.log('Win rate:', (results.winner?.win_rate * 100).toFixed(1) + '%');
```

## Test 5: Enhetstester

Testa individuella komponenter:

### Test Voting Simulator
```javascript
import { simulateVoting } from './PES/core/voting-simulator.js';

const testQuestion = "Vad är demokrati?";
const testRounds = [
  {
    round_number: 1,
    external_responses: [
      { model: 'GPT-4', text: 'Demokrati är...' },
      { model: 'Gemini', text: 'Det handlar om...' }
    ],
    oneseek_response: {
      model: 'ONESEEK',
      text: 'Genom att syntetisera perspektiven...'
    }
  }
];
const participants = ['GPT-4', 'Gemini', 'ONESEEK'];

const voting = await simulateVoting(testQuestion, testRounds, participants);

console.log('✅ Röstning simulerad');
console.log('ONESEEK röster:', voting.oneseek_votes);
console.log('Mentions:', voting.oneseek_mentions);
console.log('Vinnare:', voting.winner);
```

### Test Performance Aggregator
```javascript
import { aggregatePerformance, selectWinner } from './PES/core/performance-aggregator.js';

// Mock simulation results
const mockResults = [
  {
    debate_id: 'debate1',
    variant_version: 'v1.1.0-a',
    voting: { oneseek_votes: 2, oneseek_won: true, oneseek_mentions: 3 }
  },
  {
    debate_id: 'debate2',
    variant_version: 'v1.1.0-a',
    voting: { oneseek_votes: 1, oneseek_won: false, oneseek_mentions: 2 }
  },
  {
    debate_id: 'debate1',
    variant_version: 'v1.1.0-b',
    voting: { oneseek_votes: 3, oneseek_won: true, oneseek_mentions: 4 }
  }
];

const aggregated = aggregatePerformance(mockResults);
const winner = selectWinner(aggregated);

console.log('✅ Aggregering klar');
console.log('Vinnare:', winner.winner?.version);
console.log('Förbättring:', winner.improvement_percentage + '%');
```

## Felsökning

### Problem: "No debates available"
**Lösning:** 
```bash
# Kör live debatter först
# Eller kontrollera Firebase connection
curl http://localhost:3001/api/pes/debates?limit=1
```

### Problem: "ONESEEK inference failed"
**Lösning:**
```bash
# Kontrollera att ONESEEK körs
curl http://localhost:5000/

# Kontrollera logs
# ml_service ska vara igång på port 5000
```

### Problem: "Firebase not initialized"
**Lösning:**
```bash
# Verifiera environment variables
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Eller kör med explicit env
FIREBASE_PROJECT_ID=xxx FIREBASE_CLIENT_EMAIL=yyy node test.js
```

### Problem: "Evolution loop tar för lång tid"
**Detta är normalt!** En evolution loop med:
- 10 debatter
- 5 varianter
- 3 rounds per debatt

= 150 ONESEEK-anrop (~30 sekunder vardera) = **75 minuter**

För snabbare tester:
- Minska `debate_count` till 3-5
- Minska `variant_count` till 2-3

### Problem: "JSON parse error from ONESEEK"
**Detta är OK!** Systemet har fallback-logik:
- Heuristisk analys baserad på röstdata
- Regelbaserad variantgenerering
- Statistisk röstning

ONESEEK är inte alltid perfekt på JSON-formattering, men systemet fungerar ändå.

## Förväntade Resultat

### God Evolution Loop
- **Status:** completed
- **Förbättring:** +20% till +100% (beroende på baseline)
- **Vinnare:** En variant med högre metrics än baseline
- **Insights:** Konkreta rekommendationer

### Exempel Output
```
Evolution ID: evo_2025-12-18_123456_abc
Status: completed
Duration: 45 minutes

Baseline (v1.0.0):
- Avg votes: 1.2
- Win rate: 20%
- Mentions: 1.8

Winner (v1.1.0-c):
- Avg votes: 2.1 (+75%)
- Win rate: 40% (+100%)
- Mentions: 3.2 (+78%)

Improvement: +84%

Insights:
✓ Betonar klarhet och struktur
✓ Mer data-driven approach
✓ Starkare syntes av perspektiv
```

## Nästa Steg

Efter framgångsrika tester:

1. **Kör med mer data**
   - Öka `debate_count` till 15-20
   - Öka `variant_count` till 5

2. **Analysera vinnaren**
   - Läs variantens prompt-text
   - Förstå vad som förbättrades
   - Implementera i produktion

3. **Iterera**
   - Använd vinnaren som ny baseline
   - Kör igen med `auto_iterate: true`
   - Fortsätt tills marginal förbättring

4. **A/B testa**
   - Använd vinnande prompt i 20% av debatter
   - Jämför med baseline i produktion
   - Skala upp om bättre

## Snabb Testsvit

Kör alla tester på en gång:

```bash
#!/bin/bash
# test-pes-phase2.sh

echo "=== PES Phase 2 Test Suite ==="
echo ""

# Test 1: Status
echo "1. Testing system status..."
curl -s http://localhost:3001/api/pes/status | jq

# Test 2: Debates
echo -e "\n2. Checking debates..."
curl -s "http://localhost:3001/api/pes/debates?limit=1" | jq '.total'

# Test 3: ONESEEK
echo -e "\n3. Checking ONESEEK..."
curl -s http://localhost:5000/ | jq

# Test 4: Start mini evolution
echo -e "\n4. Starting test evolution loop..."
EVOLUTION_ID=$(curl -s -X POST http://localhost:3001/api/pes/evolution/start \
  -H "Content-Type: application/json" \
  -d '{"baseline_prompt":"Test","debate_count":2,"variant_count":2}' \
  | jq -r '.evolution_id')

echo "Evolution ID: $EVOLUTION_ID"

# Test 5: Check progress
echo -e "\n5. Checking progress..."
sleep 5
curl -s "http://localhost:3001/api/pes/evolution/$EVOLUTION_ID/progress" | jq

echo -e "\n=== Tests Complete ==="
```

Kör:
```bash
chmod +x test-pes-phase2.sh
./test-pes-phase2.sh
```

## Support

- **Dokumentation:** Se `/PES/HOW_PES_WORKS_PHASE2.md` för detaljer
- **Specifikation:** Se `/PES/PHASE2_SPECIFICATION.md`
- **Implementation:** Se `/PES/PHASE2_IMPLEMENTATION_SUMMARY.md`

---

**Lycka till med testningen! 🚀**
