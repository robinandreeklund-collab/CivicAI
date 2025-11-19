# Verifiering: Data Från Firestore vs API

Detta dokument förklarar EXAKT hur du verifierar att alla datapunkter hämtas från Firestore-databasen och INTE från direkta API-anrop.

## 🔍 Metod 1: Browser Console Logging

### Steg 1: Öppna Browser Developer Tools

1. Öppna din app i webbläsaren: `http://localhost:5173`
2. Tryck **F12** eller högerklicka → "Inspect" → "Console"

### Steg 2: Filtrera Logs

I Console-fliken, skriv i filter-boxen:
```
ChatV2
```

Detta visar endast logs från ChatV2-komponenten.

### Steg 3: Ställ En Fråga

Skriv en fråga och skicka den. Du ska se följande loggar:

#### ✅ KORREKT Flöde (Data från Firestore):

```
[ChatV2] ✅ Question stored in Firebase: abc123xyz
[useFirestoreDocument] Listening to ai_interactions/abc123xyz
[useFirestoreDocument] Document updated: processing
[useFirestoreDocument] Document updated: completed
[ChatV2] Firestore data updated: {
  status: "completed",
  hasRawResponses: true,
  hasProcessedData: true
}
[ChatV2] ✅ AI message updated from Firestore
```

#### ❌ FELAKTIGT Flöde (Data från API):

```
[ChatV2] Question stored in Firebase: abc123xyz
[ChatV2] Calling /api/query...          ← DETTA SKA INTE SYNAS!
[ChatV2] Response from API: {...}       ← DETTA SKA INTE SYNAS!
```

## 🔍 Metod 2: Network Tab Analys

### Steg 1: Öppna Network Tab

1. Developer Tools (F12) → "Network" tab
2. Klicka på "Clear" (🚫) för att rensa tidigare requests

### Steg 2: Ställ En Fråga

Skriv och skicka en fråga.

### Steg 3: Kontrollera Network Requests

Du ska se följande requests:

#### ✅ FÖRVÄNTAT (Endast Firebase):

```
POST /api/firebase/questions        ← OK! Skapar dokument
WS   firestore.googleapis.com       ← OK! Firestore WebSocket listener
```

#### ❌ SKA INTE SYNAS (API-anrop):

```
POST /api/query                     ← FEL! Direkt API-anrop
POST /api/ml/shap                   ← FEL! Direkt ML-anrop
POST /api/ml/lime                   ← FEL! Direkt ML-anrop
```

**Viktigt:** Om du ser `/api/query` i Network tab betyder det att frontend fortfarande anropar API:t direkt istället för att lyssna på Firestore!

## 🔍 Metod 3: Firebase Console Verifiering

### Steg 1: Öppna Firebase Console

Gå till: https://console.firebase.google.com/project/openseek-c19fe/firestore

### Steg 2: Navigera Till Collection

1. Klicka på `ai_interactions` collection
2. Hitta det senaste dokumentet (sorterat efter timestamp)

### Steg 3: Verifiera Dokument Innehåll

Dokumentet ska innehålla:

#### ✅ OBLIGATORISKA Fält (Från Backend → Firestore):

```javascript
{
  // Basic info
  id: "auto-generated-id",
  question: "Din fråga...",
  status: "ledger_verified",
  timestamp: Timestamp,
  
  // Raw AI responses (MÅSTE finnas)
  raw_responses: {
    gpt35: {
      text: "GPT svar...",
      metadata: { model: "gpt-3.5-turbo", tokens: 450, ... }
    },
    gemini: {
      text: "Gemini svar...",
      metadata: { ... }
    },
    deepseek: {
      text: "DeepSeek svar...",
      metadata: { ... }
    }
  },
  
  // Processed data (MÅSTE finnas)
  processed_data: {
    bert_summary: {
      text: "Sammanfattning...",
      metadata: { confidence: 0.92, ... }
    },
    consensus_analysis: {
      consensus_score: 0.85,
      agreement_points: [...],
      divergence_points: [...]
    },
    quality_metrics: {
      avg_confidence: 0.92,
      toxicity_score: 0.05
    },
    fact_check_results: [...]
  },
  
  // Ledger (MÅSTE finnas)
  ledger_blocks: [
    { block_id: "block_001", event_type: "question_received", ... },
    { block_id: "block_002", event_type: "ai_response_saved", ... }
  ]
}
```

### Steg 4: Jämför Med Frontend UI

Öppna din app och jämför:

| UI Element | Firestore Field | Måste Matcha |
|------------|----------------|--------------|
| Frågan i header | `question` | ✅ |
| GPT-3.5 svar | `raw_responses.gpt35.text` | ✅ |
| Gemini svar | `raw_responses.gemini.text` | ✅ |
| DeepSeek svar | `raw_responses.deepseek.text` | ✅ |
| BERT Summary | `processed_data.bert_summary.text` | ✅ |
| Consensus Score | `processed_data.consensus_analysis.consensus_score` | ✅ |

**Om texten matchar EXAKT** → Data kommer från Firestore ✅

## 🔍 Metod 4: Kod-Inspektion

### Kontrollera ChatV2Page.jsx

Öppna: `frontend/src/pages/ChatV2Page.jsx`

#### ✅ KORREKT Implementation:

```javascript
// Ska FINNAS:
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';

// Ska FINNAS:
const [firebaseDocId, setFirebaseDocId] = useState(null);

// Ska FINNAS:
const { data: firestoreData, loading, error } = useFirestoreDocument(
  'ai_interactions',
  firebaseDocId
);

// Ska FINNAS:
useEffect(() => {
  if (!firestoreData) return;
  
  if (firestoreData.status === 'completed' || firestoreData.status === 'ledger_verified') {
    const aiMessage = {
      type: 'ai',
      responses: Object.entries(firestoreData.raw_responses || {}).map(...),
      bertSummary: firestoreData.processed_data?.bert_summary?.text,
      // ... mer data från Firestore
    };
    setMessages([...]);
  }
}, [firestoreData]);

// handleSubmit ska ENDAST göra detta:
const handleSubmit = async (e) => {
  // ...
  const response = await fetch('/api/firebase/questions', {...});
  const { docId } = await response.json();
  setFirebaseDocId(docId); // Startar listener!
  
  // SKA INTE finnas:
  // await fetch('/api/query', {...});  ← DETTA SKA VARA BORTTAGET!
};
```

#### ❌ FELAKTIG Implementation (Gammal):

```javascript
// SKA INTE finnas längre:
const response = await fetch('/api/query', {
  method: 'POST',
  body: JSON.stringify({ question, services: [...] })
});

const data = await response.json();
const aiMessage = {
  responses: data.responses,  // ← Data från API!
  bertSummary: data.synthesizedSummary  // ← Data från API!
};
```

## 🔍 Metod 5: Temporär Disconnect Test

Detta är den **mest definitiva** metoden!

### Steg 1: Stoppa Backend Servern

```bash
# Gå till backend terminal och tryck Ctrl+C
# Eller stäng backend terminalen helt
```

### Steg 2: Ställ En Fråga

Med backend stoppad:

1. Öppna appen i webbläsaren
2. Ställ en fråga
3. Observera vad som händer

#### ✅ FÖRVÄNTAT Beteende (Använder Firestore):

```
1. Frågan skickas (POST /api/firebase/questions fungerar - backend är igång för detta)
2. Firebase Functions trigger aktiveras
3. Functions försöker anropa backend → MISSLYCKAS (backend är nere)
4. Firestore dokument uppdateras med status: "error"
5. Frontend listener upptäcker error
6. UI visar felmeddelande: "Ett fel uppstod vid bearbetning av frågan"
```

**Detta bevisar att frontend lyssnar på Firestore!**

#### ❌ FELAKTIGT Beteende (Använder API direkt):

```
1. Frontend försöker POST /api/query
2. Får omedelbar error (backend är nere)
3. Ingen Firestore-interaktion
4. Error kommer direkt från API-anropet
```

### Steg 3: Starta Backend Igen

```bash
cd backend
npm start
```

## 🔍 Metod 6: Dataflödes-Timing Analys

### Test: Mät Tiden

1. Öppna Browser Console
2. Kör:

```javascript
console.time('Total Response Time');
// Ställ fråga i UI
// När svar visas, kör:
console.timeEnd('Total Response Time');
```

#### ✅ FÖRVÄNTAT (Firestore Listener):

```
Total Response Time: 3000-8000ms
```

**Timing Breakdown:**
- 0-500ms: POST /api/firebase/questions
- 500-1000ms: Firebase Functions trigger
- 1000-7000ms: Backend processing (AI calls, ML pipeline)
- 7000-8000ms: Firestore update + listener notification → UI update

#### ❌ FELAKTIGT (Direkt API):

```
Total Response Time: 3000-7000ms (snabbare)
```

**Varför snabbare?** Ingen Firestore-mellanhänd, data kommer direkt från API.

## 📊 Komplett Verifierings-Checklista

Kör igenom alla dessa tester:

### Test 1: Console Logs ✅
- [ ] Ser `[ChatV2] ✅ Question stored in Firebase`
- [ ] Ser `[useFirestoreDocument] Listening to ai_interactions/...`
- [ ] Ser `[ChatV2] ✅ AI message updated from Firestore`
- [ ] Ser INTE `[ChatV2] Calling /api/query`

### Test 2: Network Tab ✅
- [ ] Ser POST `/api/firebase/questions`
- [ ] Ser WebSocket `firestore.googleapis.com`
- [ ] Ser INTE POST `/api/query`
- [ ] Ser INTE POST `/api/ml/shap`, `/api/ml/lime`, etc.

### Test 3: Firebase Console ✅
- [ ] Dokument skapas i `ai_interactions` collection
- [ ] `raw_responses` fält finns och har data
- [ ] `processed_data` fält finns och har data
- [ ] `ledger_blocks` array finns med minst 2 blocks
- [ ] `status` är `completed` eller `ledger_verified`

### Test 4: Data Matching ✅
- [ ] UI fråga matchar `question` i Firestore
- [ ] UI AI-svar matchar `raw_responses.*.text` i Firestore
- [ ] UI BERT summary matchar `processed_data.bert_summary.text`
- [ ] UI consensus score matchar `processed_data.consensus_analysis.consensus_score`

### Test 5: Kod-Inspektion ✅
- [ ] `useFirestoreDocument` hook importerad
- [ ] `firebaseDocId` state finns
- [ ] `useEffect` med `firestoreData` dependency finns
- [ ] `handleSubmit` anropar ENDAST `/api/firebase/questions`
- [ ] INGEN fetch till `/api/query` i ChatV2Page

### Test 6: Disconnect Test ✅
- [ ] Med backend stoppad, frontend visar error från Firestore
- [ ] Ingen direkt API-error
- [ ] Error message kommer från Firestore `errors[]` field

## 🎯 Slutlig Verifiering

Kör detta komplett test:

```bash
# 1. Öppna 3 terminaler

# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Firebase logs
firebase functions:log --only onQuestionCreate --follow
```

**Ställ en fråga och observera:**

1. **Terminal 1 (Backend):** Inget direkt från frontend (endast från Firebase Functions)
2. **Terminal 2 (Frontend console i browser):** Firestore listener logs
3. **Terminal 3 (Firebase logs):** Trigger aktiverad, backend anropad

**Om alla 3 terminaler visar korrekt beteende** → ✅ Data kommer från Firestore!

## 🆘 Troubleshooting

### Problem: Ser fortfarande `/api/query` i Network tab

**Lösning:**
1. Kontrollera att du kör senaste versionen: `git pull origin copilot/fix-connection-error-database`
2. Restart frontend dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

### Problem: Firestore listener startar inte

**Lösning:**
1. Kontrollera att `frontend/.env` har Firebase credentials
2. Kontrollera console för Firebase init errors
3. Verifiera att `firebaseDocId` sätts: `console.log(firebaseDocId)` i useEffect

### Problem: Data visas inte i UI

**Lösning:**
1. Kontrollera Firebase Console att data finns
2. Kontrollera att `status` är `completed` eller `ledger_verified`
3. Kontrollera console för mapping errors

## 📚 Relaterad Dokumentation

- [Chat-v2 Data Structure](./CHAT_V2_DATA_STRUCTURE.md) - Komplett dataflöde
- [Common Errors & Fixes](./COMMON_ERRORS_AND_FIXES.md) - Troubleshooting
- [Firebase Setup Guide](./FIREBASE_SETUP_COMPLETE.md) - Setup instruktioner

---

**Senast Uppdaterad:** 2025-11-19  
**Status:** Komplett verifieringsguide för Firestore integration
