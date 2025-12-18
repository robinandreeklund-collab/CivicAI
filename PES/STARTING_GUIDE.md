# PES - Hur man Startar och Använder

## 🚀 Snabbstart

### 1. Förberedelser

Innan du startar PES, se till att följande är konfigurerat:

#### Firebase Configuration
```bash
export FIREBASE_PROJECT_ID="your-project-id"
export FIREBASE_CLIENT_EMAIL="your-email"
export FIREBASE_PRIVATE_KEY="your-key"
```

#### ONESEEK Service
Se till att ONESEEK ML service körs på port 5000:
```bash
# Starta ml_service (från rot-katalogen)
cd ml_service
python server.py
```

Verifiera att det fungerar:
```bash
curl http://localhost:5000/
# Ska returnera: {"status": "running"}
```

### 2. Starta Backend

```bash
cd backend
npm install  # Första gången
npm start    # eller npm run dev för development
```

Backend startar på port 3001 (default).

### 3. Öppna PES Frontend

Öppna din webbläsare och navigera till:
```
http://localhost:3001/pes
```

Du bör nu se PES-dashboarden! 🎉

## 📱 Använda Webgränssnittet

### Dashboard
Första fliken visar systemstatus och statistik:
- **System Status**: Visar om PES är operativt
- **Statistik**: Antal prompts, simuleringar och debatter
- **Top Prompts**: Bäst presterande prompts

### Prompts
Visar alla skapade prompts med:
- Version och ämne
- Status (active/testing/archived)
- Genomsnittlig score
- Antal simuleringar
- Filter för ämne och status

### Simuleringar
Lista över alla körda simuleringar med:
- Vilken prompt som testades
- Antal debatter som användes
- Performance metrics
- Status

### Debatter
Visar alla loggade debatter från live-systemet:
- Fråga
- Antal deltagare och rundor
- Status och vinnare
- Datum

### Skapa Prompt
Formulär för att skapa nya prompts:
1. Skriv prompt-text
2. Ge den en version (t.ex. v1.0.0)
3. Välj ämne (general, politics, etc.)
4. Lägg till författare och beskrivning
5. Välj om simulering ska köras direkt
6. Klicka "Skapa Prompt"

Systemet kommer:
- Spara prompten i Firebase
- Köra simulering med verkliga debatter (om valt)
- Visa resultat direkt i gränssnittet

## 🔧 Använda API:et Direkt

Om du föredrar att använda API:et direkt:

### Hämta Status
```bash
curl http://localhost:3001/api/pes/status
```

### Hämta Alla Prompts
```bash
curl http://localhost:3001/api/pes/prompts
```

### Skapa Ny Prompt
```bash
curl -X POST http://localhost:3001/api/pes/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "promptText": "Du är ONESEEK-7B-Zero...",
    "version": "v1.0.0",
    "topic": "general",
    "metadata": {
      "author": "Robin",
      "description": "Test prompt"
    },
    "runSimulation": true
  }'
```

### Kör Simulering
```bash
curl -X POST http://localhost:3001/api/pes/simulations \
  -H "Content-Type: application/json" \
  -d '{
    "promptId": "your-prompt-id",
    "debateCount": 10
  }'
```

### Hämta Rekommendation
```bash
curl http://localhost:3001/api/pes/recommendations/general
```

### Generera Rapport
```bash
curl http://localhost:3001/api/pes/report
```

## 💻 Använda Programmatiskt

Du kan också använda PES direkt från JavaScript:

```javascript
import {
  createAndTestPromptVersion,
  getRecommendedPrompt,
  runSimulationForPrompt
} from './PES/core/orchestrator.js';

// Skapa och testa ny prompt
const result = await createAndTestPromptVersion({
  promptText: "Din prompt här...",
  version: "v1.0.0",
  topic: "general",
  metadata: { author: "Ditt namn" }
}, true);

console.log('Prompt skapad:', result.promptVersion.id);
console.log('Score:', result.simulation.performanceMetrics.averageScore);

// Hämta bästa prompt för ett ämne
const best = await getRecommendedPrompt('general');
console.log('Bästa prompt:', best.recommended.version);

// Kör extra simulering
const simResult = await runSimulationForPrompt('prompt-id', {
  debateCount: 15
});
```

## 📊 Tolka Resultat

### Quality Score (0-1)
- **0.8-1.0**: Excellent - prompten är mycket bra
- **0.7-0.8**: Good - prompten fungerar bra
- **0.5-0.7**: Average - kan förbättras
- **<0.5**: Poor - behöver omarbetas

### Success Rate
Andel simuleringar som genomfördes utan fel:
- **>90%**: Mycket stabilt
- **80-90%**: Bra stabilitet
- **<80%**: Kan behöva optimering

### Inference Time
Genomsnittlig tid för ONESEEK att generera svar:
- **<30s**: Snabbt
- **30-60s**: Normalt
- **>60s**: Långsamt - överväg att förenkla prompt

## 🔍 Felsökning

### "Inga debatter tillgängliga"
**Problem**: Ingen träningsdata finns ännu  
**Lösning**: Kör några live-debatter först. Gå till huvudsystemet och trigga några debatter.

### "Firebase not initialized"
**Problem**: Firebase credentials saknas  
**Lösning**: 
```bash
# Kontrollera att env vars är satta
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Sätt dem om de saknas
export FIREBASE_PROJECT_ID="..."
export FIREBASE_CLIENT_EMAIL="..."
export FIREBASE_PRIVATE_KEY="..."
```

### "ONESEEK inference error"
**Problem**: ML service körs inte  
**Lösning**:
```bash
# Starta ml_service
cd ml_service
python server.py

# Verifiera
curl http://localhost:5000/
```

### "Cannot reach backend"
**Problem**: Backend körs inte eller fel port  
**Lösning**:
```bash
# Starta backend
cd backend
npm start

# Kontrollera vilken port den använder
# Default är 3001
```

### Frontend visar "Connection refused"
**Problem**: API_BASE i frontend pekar på fel URL  
**Lösning**: Öppna `PES/frontend/index.html` och kontrollera att:
```javascript
const API_BASE = 'http://localhost:3001/api/pes';
```
matchar din backend-port.

## 🎯 Best Practices

### 1. Starta med Träningsdata
Innan du skapar prompts:
- Kör minst 5-10 live-debatter
- Dessa sparas automatiskt i `debates` collection
- Ju mer data, desto bättre analyser

### 2. Versionshantering
Använd semantisk versionshantering:
- `v1.0.0` - Första version
- `v1.1.0` - Mindre förbättring
- `v2.0.0` - Större förändring

### 3. Testa Iterativt
1. Skapa prompt → Kör simulering
2. Analysera resultat
3. Förbättra prompt baserat på insights
4. Upprepa

### 4. Jämför Versioner
När du har flera prompts:
```javascript
import { compareAndRecommend } from './PES/core/orchestrator.js';

const comparison = await compareAndRecommend('v1-id', 'v2-id');
console.log('Vinnare:', comparison.winner);
```

### 5. Övervaka Trends
Kör simuleringar regelbundet för samma prompt för att se:
- Förbättring över tid
- Konsistens
- När prompts behöver uppdateras

## 📈 Workflow-Exempel

### Komplett Workflow för Prompt-Utveckling

```javascript
// 1. Kontrollera tillgänglig data
import { getDebates } from './PES/services/pesFirebaseService.js';
const debates = await getDebates({ limit: 1 });
if (debates.length === 0) {
  console.log('Kör live-debatter först!');
}

// 2. Skapa första version
import { createAndTestPromptVersion } from './PES/core/orchestrator.js';
const v1 = await createAndTestPromptVersion({
  promptText: "Version 1 prompt...",
  version: "v1.0.0",
  topic: "general"
}, true);

console.log('v1.0.0 Score:', v1.simulation.performanceMetrics.averageScore);

// 3. Analysera resultat
import { analyzePromptPerformance } from './PES/core/analyzer.js';
const analysis = await analyzePromptPerformance(v1.promptVersion.id);
console.log('Insights:', analysis.insights);

// 4. Skapa förbättrad version
const v2 = await createAndTestPromptVersion({
  promptText: "Förbättrad version baserat på insights...",
  version: "v1.1.0",
  topic: "general"
}, true);

// 5. Jämför versioner
import { compareAndRecommend } from './PES/core/orchestrator.js';
const comp = await compareAndRecommend(v1.promptVersion.id, v2.promptVersion.id);
console.log('Bästa version:', comp.winner);

// 6. Använd bästa prompt i produktion
import { getRecommendedPrompt } from './PES/core/orchestrator.js';
const best = await getRecommendedPrompt('general');
console.log('Produktionsprompt:', best.recommended.version);
```

## 🌐 Åtkomst från Andra Maskiner

Om du vill komma åt PES från en annan dator i nätverket:

1. **Ändra CORS-inställningar** (om behövs)
2. **Uppdatera API_BASE** i frontend:
```javascript
const API_BASE = 'http://your-server-ip:3001/api/pes';
```

3. **Öppna via:**
```
http://your-server-ip:3001/pes
```

## 🔐 Säkerhet

För produktion:
- Lägg till autentisering på `/api/pes` endpoints
- Använd HTTPS
- Sätt rate limiting
- Validera alla inputs
- Skydda Firebase credentials

## 📝 Loggar

Backend-loggar visar:
```
[PES API] Error checking status: ...
[PES Simulator] Starting simulation for prompt version: ...
[PES] Retrieved X debates from Firebase
[PES] Saved prompt version Y
```

Kontrollera backend-terminal för debugging.

## 🎓 Lär Mer

- **Full dokumentation**: `PES/README.md`
- **Integration details**: `PES/INTEGRATION.md`
- **Quick start**: `PES/QUICKSTART.md`
- **Code examples**: `PES/examples/basic-usage.js`

## 💡 Tips

- Använd Chrome DevTools Network tab för att debugga API-anrop
- Kolla backend-loggar för fel
- Börja med små simuleringar (5-10 debatter)
- Dokumentera varför du gjorde specifika prompt-ändringar i metadata

---

**Lycka till med prompt-utveckling! 🚀**

Om du stöter på problem, kontakta utvecklingsteamet eller öppna ett issue på GitHub.
