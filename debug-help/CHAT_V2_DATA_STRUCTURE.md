# Chat-v2 Data Structure & Complete Flow

Detta dokument förklarar EXAKT hur data flödar genom hela CivicAI systemet, från att användaren ställer en fråga till att svaret visas på frontend.

## 🔄 Komplett Dataflöde (End-to-End)

```
ANVÄNDARE
   │
   │ 1. Ställer fråga
   ▼
┌─────────────────────┐
│   FRONTEND          │
│   ChatV2Page.jsx    │
│                     │
│   State:            │
│   - question        │
│   - messages        │
│   - isLoading       │
└─────────────────────┘
   │
   │ 2. POST /api/firebase/questions
   ▼
┌─────────────────────┐
│   BACKEND           │
│   server.js         │
│   firebase_service  │
└─────────────────────┘
   │
   │ 3. Skapar dokument i Firestore
   ▼
┌─────────────────────────────────────┐
│   FIRESTORE                         │
│   Collection: ai_interactions       │
│                                     │
│   Dokument: {                       │
│     question: "Vad är AI?"          │
│     status: "received"              │
│     timestamp: ISO8601              │
│     userId: "anonymous"             │
│     sessionId: "session-xxx"        │
│   }                                 │
└─────────────────────────────────────┘
   │
   │ 4. onCreate trigger
   ▼
┌─────────────────────┐
│   FIREBASE          │
│   FUNCTIONS         │
│   onQuestionCreate  │
└─────────────────────┘
   │
   │ 5. Uppdaterar status: "processing"
   │ 6. POST http://ngrok-url/api/query
   ▼
┌─────────────────────────────────────┐
│   BACKEND                           │
│   /api/query                        │
│   query_dispatcher.js               │
│                                     │
│   Processer:                        │
│   1. Validerar input                │
│   2. Anropar AI-tjänster            │
│   3. Sparar raw responses           │
│   4. Kör ML pipeline                │
│   5. Skapar ledger blocks           │
└─────────────────────────────────────┘
   │
   │ 7a. Anropar AI Services (parallellt)
   ├─────────────────┬─────────────────┬──────────────────┐
   ▼                 ▼                 ▼                  ▼
┌──────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ GPT  │      │ Gemini   │      │ DeepSeek │      │ Claude   │
│ 3.5  │      │          │      │          │      │ (opt)    │
└──────┘      └──────────┘      └──────────┘      └──────────┘
   │                 │                 │                  │
   │ 7b. Responses   │                 │                  │
   └─────────────────┴─────────────────┴──────────────────┘
                     │
                     ▼
   ┌─────────────────────────────────────┐
   │   BACKEND                           │
   │   ML Pipeline Processing            │
   │                                     │
   │   8. BERT Summarization             │
   │   9. Consensus Analysis             │
   │   10. Fact Checking                 │
   │   11. Change Detection              │
   │   12. Quality Metrics               │
   └─────────────────────────────────────┘
                     │
                     │ 13. Sparar processed data
                     ▼
   ┌─────────────────────────────────────────────────────────┐
   │   FIRESTORE (Uppdaterat dokument)                       │
   │                                                          │
   │   {                                                      │
   │     question: "Vad är AI?"                               │
   │     status: "completed" → "ledger_verified"              │
   │                                                          │
   │     // RAW RESPONSES                                     │
   │     raw_responses: {                                     │
   │       gpt35: {                                           │
   │         text: "AI är...",                                │
   │         metadata: { model, tokens, latency }             │
   │       },                                                 │
   │       gemini: { ... },                                   │
   │       deepseek: { ... }                                  │
   │     },                                                   │
   │                                                          │
   │     // PROCESSED DATA                                    │
   │     processed_data: {                                    │
   │       consensus_analysis: {                              │
   │         consensus_score: 0.85,                           │
   │         agreement_points: [...],                         │
   │         divergence_points: [...]                         │
   │       },                                                 │
   │       bert_summary: "Sammanfattning...",                 │
   │       fact_check_results: [...],                         │
   │       quality_metrics: {                                 │
   │         avg_confidence: 0.92,                            │
   │         toxicity_score: 0.05                             │
   │       }                                                  │
   │     },                                                   │
   │                                                          │
   │     // LEDGER                                            │
   │     ledger_blocks: [                                     │
   │       {                                                  │
   │         block_id: "block_001",                           │
   │         event_type: "question_received",                 │
   │         timestamp: ISO8601,                              │
   │         data_hash: "sha256..."                           │
   │       },                                                 │
   │       {                                                  │
   │         block_id: "block_002",                           │
   │         event_type: "ai_response_saved",                 │
   │         service: "gpt-3.5",                              │
   │         previous_hash: "sha256..."                       │
   │       }                                                  │
   │     ]                                                    │
   │   }                                                      │
   └─────────────────────────────────────────────────────────┘
                     │
                     │ 14. Frontend hämtar data
                     ▼
   ┌─────────────────────────────────────┐
   │   FRONTEND                          │
   │   ChatV2Page.jsx                    │
   │                                     │
   │   Visar:                            │
   │   - Användarens fråga               │
   │   - AI responses (3 modeller)       │
   │   - BERT sammanfattning             │
   │   - Consensus analys                │
   │   - Quality metrics                 │
   │   - Pipeline visualization          │
   └─────────────────────────────────────┘
                     │
                     ▼
                 ANVÄNDARE
            (Ser svaret!)
```

## 📊 Datapunkter i Detalj

### 1. Frontend State (ChatV2Page.jsx)

**Nuvarande Implementation:**
```javascript
const [messages, setMessages] = useState([]);
const [question, setQuestion] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [viewMode, setViewMode] = useState('overview');

// Senaste AI message
const latestAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
```

**Datakälla:** 
- ❌ **PROBLEM:** Just nu populeras `messages` från `/api/query` response (direkt från backend)
- ✅ **MÅL:** Ska hämtas från Firestore via Firebase SDK

**Status:** BEHÖVER ÄNDRAS

---

### 2. Initial Question Storage

**Flöde:**
```javascript
// ChatV2Page.jsx, rad 74-93
fetch('/api/firebase/questions', {
  method: 'POST',
  body: JSON.stringify({
    question: userQuestion,
    userId: 'anonymous',
    sessionId: `session-${Date.now()}`
  })
})
```

**Backend Endpoint:** `server.js:158-179`
```javascript
app.post('/api/firebase/questions', async (req, res) => {
  const docRef = await db.collection('ai_interactions').add({
    question,
    userId,
    sessionId,
    status: 'received',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
});
```

**Firestore Dokument:**
```javascript
{
  id: "auto-generated-id",
  question: "Vad är AI?",
  userId: "anonymous",
  sessionId: "session-1234567890",
  status: "received",
  timestamp: Timestamp(2025-11-19 12:00:00),
  created_at: Timestamp(2025-11-19 12:00:00)
}
```

**Status:** ✅ FUNGERAR

---

### 3. Firebase Functions Trigger

**Trigger:** `functions/index.js:62-69`
```javascript
exports.onQuestionCreate = functions
  .firestore
  .document('ai_interactions/{docId}')
  .onCreate(async (snap, context) => {
    const docId = context.params.docId;
    const data = snap.data();
    // Processar frågan...
  });
```

**Process Flow:**
1. Dokument skapas i Firestore
2. `onCreate` trigger aktiveras inom ~1 sekund
3. Function uppdaterar status till "processing"
4. Function anropar backend `/api/query`

**Status:** ✅ FUNGERAR (efter .env fix)

---

### 4. Backend ML Pipeline

**Endpoint:** `/api/query` (query_dispatcher.js)

**Input:**
```javascript
{
  question: "Vad är AI?",
  services: ['gpt-3.5', 'gemini', 'deepseek'],
  firebaseDocId: "abc123"
}
```

**Process:**

**Steg 1: AI Service Calls** (parallellt)
```javascript
// query_dispatcher.js rad ~100-150
const responses = await Promise.all([
  callOpenAI(question),
  callGemini(question),
  callDeepSeek(question)
]);
```

**Steg 2: Spara Raw Responses**
```javascript
// query_dispatcher.js rad ~200-250
await saveRawResponsesToFirestore(firebaseDocId, {
  gpt35: {
    text: gptResponse,
    metadata: {
      model: 'gpt-3.5-turbo',
      tokens: 450,
      latency_ms: 1250,
      timestamp: new Date().toISOString()
    }
  },
  // ... andra modeller
});
```

**Steg 3: ML Analysis Pipeline**
```javascript
// pipeline.js
const bertSummary = await summarizeWithBERT(combinedText);
const consensusAnalysis = analyzeConsensus(responses);
const factCheck = await performFactCheck(responses);
const qualityMetrics = calculateQualityMetrics(responses);
```

**Steg 4: Spara Processed Data**
```javascript
await db.collection('ai_interactions').doc(firebaseDocId).update({
  processed_data: {
    consensus_analysis: consensusAnalysis,
    bert_summary: bertSummary,
    fact_check_results: factCheck,
    quality_metrics: qualityMetrics
  },
  status: 'completed'
});
```

**Steg 5: Skapa Ledger Blocks**
```javascript
await createLedgerBlock(firebaseDocId, {
  event_type: 'ai_responses_saved',
  data_hash: sha256(JSON.stringify(responses))
});
```

**Output:**
```javascript
{
  success: true,
  responses: [...],
  synthesizedSummary: "BERT summary...",
  modelSynthesis: { consensus_score: 0.85, ... },
  // ... mer data
}
```

**Status:** ✅ FUNGERAR

---

### 5. Firestore Data Structure

**Collection:** `ai_interactions`

**Dokument Schema:**
```javascript
{
  // BASIC INFO
  id: "auto-generated",
  question: "Vad är AI?",
  userId: "anonymous",
  sessionId: "session-xxx",
  
  // STATUS TRACKING
  status: "received" | "processing" | "completed" | "ledger_verified" | "error",
  timestamp: Timestamp,
  created_at: Timestamp,
  updated_at: Timestamp,
  
  // PIPELINE METADATA
  pipeline_metadata: {
    version: "1.0.0",
    status_log: [
      { status: "received", timestamp: ISO8601, message: "Question stored" },
      { status: "processing", timestamp: ISO8601, message: "Starting pipeline" },
      { status: "completed", timestamp: ISO8601, message: "Pipeline done" }
    ],
    processing_times: {
      total_ms: 5000,
      ai_services_ms: 3000,
      ml_pipeline_ms: 1500,
      ledger_ms: 500
    }
  },
  
  // RAW AI RESPONSES
  raw_responses: {
    gpt35: {
      text: "AI, eller artificiell intelligens...",
      metadata: {
        model: "gpt-3.5-turbo",
        tokens: 450,
        latency_ms: 1250,
        timestamp: ISO8601,
        temperature: 0.7,
        max_tokens: 500
      }
    },
    gemini: {
      text: "Artificiell intelligens är...",
      metadata: {
        model: "gemini-pro",
        tokens: 380,
        latency_ms: 980,
        timestamp: ISO8601
      }
    },
    deepseek: {
      text: "AI representerar...",
      metadata: {
        model: "deepseek-chat",
        tokens: 420,
        latency_ms: 1100,
        timestamp: ISO8601
      }
    }
  },
  
  // PROCESSED DATA (från ML Pipeline)
  processed_data: {
    // BERT Sammanfattning
    bert_summary: {
      text: "Sammanfattning av alla AI-svar...",
      metadata: {
        model: "bert-base-swedish",
        confidence: 0.92,
        compression_ratio: 0.45,
        timestamp: ISO8601
      }
    },
    
    // Consensus Analysis
    consensus_analysis: {
      consensus_score: 0.85,  // 0-1
      agreement_points: [
        "AI är datorprogram som kan lära sig",
        "Machine learning är en viktig del",
        "Används inom många områden"
      ],
      divergence_points: [
        {
          topic: "Etiska aspekter",
          models: {
            gpt35: "Betonar vikten av etik",
            gemini: "Neutral ton",
            deepseek: "Fokuserar på tekniska aspekter"
          }
        }
      ],
      similarity_matrix: {
        gpt35_gemini: 0.87,
        gpt35_deepseek: 0.82,
        gemini_deepseek: 0.88
      }
    },
    
    // Fact Checking
    fact_check_results: [
      {
        claim: "AI utvecklades på 1950-talet",
        verified: true,
        confidence: 0.95,
        sources: ["britannica.com", "wikipedia.org"]
      }
    ],
    
    // Quality Metrics
    quality_metrics: {
      avg_confidence: 0.92,
      avg_latency_ms: 1110,
      toxicity_score: 0.05,  // 0-1, lägre är bättre
      coherence_score: 0.88,
      relevance_score: 0.94
    },
    
    // Change Detection (om samma fråga ställts tidigare)
    change_detection: {
      has_previous: false,
      changes: null
    }
  },
  
  // LEDGER BLOCKS
  ledger_blocks: [
    {
      block_id: "block_001_abc123",
      event_type: "question_received",
      timestamp: ISO8601,
      data: {
        question: "Vad är AI?",
        userId: "anonymous"
      },
      data_hash: "sha256_hash_of_data",
      previous_hash: null  // Första blocket
    },
    {
      block_id: "block_002_abc123",
      event_type: "ai_response_saved",
      timestamp: ISO8601,
      data: {
        service: "gpt-3.5",
        response_length: 450,
        latency_ms: 1250
      },
      data_hash: "sha256_hash",
      previous_hash: "sha256_of_block_001"
    },
    {
      block_id: "block_003_abc123",
      event_type: "pipeline_completed",
      timestamp: ISO8601,
      data: {
        bert_summary_length: 200,
        consensus_score: 0.85
      },
      data_hash: "sha256_hash",
      previous_hash: "sha256_of_block_002"
    }
  ],
  
  // ERROR HANDLING
  errors: [
    // Tomt om allt gick bra
    // Annars:
    // {
    //   code: "ECONNREFUSED",
    //   message: "connect ECONNREFUSED 127.0.0.1:3001",
    //   timestamp: ISO8601,
    //   stack: "Error stack trace..."
    // }
  ]
}
```

**Status:** ✅ STRUKTUR DEFINIERAD

---

### 6. Frontend Data Display (BEHÖVER ÄNDRAS)

**Nuvarande (Fel):**
```javascript
// ChatV2Page.jsx, rad 189-200
const aiMessage = {
  type: 'ai',
  responses: data.responses,  // ← Från /api/query direkt
  bertSummary: data.synthesizedSummary,
  modelSynthesis: data.modelSynthesis,
  // ...
};

setMessages(prev => [...prev, aiMessage]);
```

**Problem:** Data kommer direkt från backend `/api/query`, INTE från Firestore.

**Lösning (Ska Implementeras):**
```javascript
// Använd Firebase SDK för att lyssna på Firestore
import { doc, onSnapshot } from 'firebase/firestore';

useEffect(() => {
  if (!firebaseDocId) return;
  
  const unsubscribe = onSnapshot(
    doc(db, 'ai_interactions', firebaseDocId),
    (doc) => {
      const data = doc.data();
      
      // Uppdatera UI baserat på status
      if (data.status === 'completed' || data.status === 'ledger_verified') {
        const aiMessage = {
          type: 'ai',
          responses: data.raw_responses,  // ← Från Firestore
          bertSummary: data.processed_data?.bert_summary,
          consensusAnalysis: data.processed_data?.consensus_analysis,
          qualityMetrics: data.processed_data?.quality_metrics,
          ledgerBlocks: data.ledger_blocks
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }
    }
  );
  
  return () => unsubscribe();
}, [firebaseDocId]);
```

**Status:** ❌ BEHÖVER IMPLEMENTERAS

---

## 🔍 Verifiering av Dataflöde

### Steg 1: Verifiera Frontend → Firestore

```javascript
// Browser Console (F12)
// Efter att fråga skickats:
console.log(firebaseDocId);  // Ska visa: "abc123..."
```

**Firebase Console:**
1. Gå till [Firestore Database](https://console.firebase.google.com/project/openseek-c19fe/firestore)
2. Öppna `ai_interactions` collection
3. Hitta dokumentet med rätt ID
4. Verifiera att `status: "received"`

### Steg 2: Verifiera Firebase Functions Trigger

```powershell
# Terminal
firebase functions:log --only onQuestionCreate
```

**Förväntad output:**
```
[onQuestionCreate] Processing question: abc123
[onQuestionCreate] Question: Vad är AI?
[onQuestionCreate] Using backend URL: https://ngrok-url.ngrok-free.dev
```

### Steg 3: Verifiera Backend Processing

```bash
# Backend Terminal
# Du ska se:
[Query Dispatcher] Received query request
[Query Dispatcher] Firebase Doc ID: abc123
[AI Service] Calling OpenAI GPT-3.5...
[AI Service] Calling Gemini...
[AI Service] Calling DeepSeek...
[Pipeline] Running BERT summarization...
[Pipeline] Calculating consensus...
[Firebase Service] Saving raw responses...
[Ledger Service] Creating ledger block...
```

### Steg 4: Verifiera Firestore Update

**Firebase Console:**
1. Refresh dokumentet i Firestore
2. Verifiera att `status: "completed"` eller `"ledger_verified"`
3. Verifiera att `raw_responses` finns
4. Verifiera att `processed_data` finns
5. Verifiera att `ledger_blocks` array har items

### Steg 5: Verifiera Frontend Display

**Browser:**
1. Svaret ska visas i ChatV2
2. Alla 3 AI-modellers svar ska synas
3. BERT sammanfattning ska synas
4. Consensus score ska synas

---

## 📋 Implementation Checklist

### Nuvarande Status:

- ✅ Backend `/api/firebase/questions` skapar dokument
- ✅ Firebase Functions trigger aktiveras
- ✅ Backend `/api/query` processar frågor
- ✅ Raw responses sparas i Firestore
- ✅ Processed data sparas i Firestore
- ✅ Ledger blocks skapas
- ❌ Frontend hämtar data direkt från `/api/query` (ska ändras till Firestore)
- ❌ Frontend lyssnar INTE på Firestore real-time updates

### Behöver Implementeras:

1. **Firebase SDK i Frontend**
   - [ ] Installera Firebase SDK
   - [ ] Konfigurera Firebase i frontend
   - [ ] Skapa Firestore connection

2. **Real-time Listener**
   - [ ] Implementera `onSnapshot` för att lyssna på dokument
   - [ ] Uppdatera UI baserat på `status` changes
   - [ ] Visa loading state medan `status: "processing"`

3. **Data Mapping**
   - [ ] Mappa `raw_responses` till UI components
   - [ ] Mappa `processed_data` till UI components
   - [ ] Visa `ledger_blocks` i debug view

4. **Error Handling**
   - [ ] Visa errors från Firestore `errors` array
   - [ ] Hantera timeout (om status stannar på "processing")

---

## 🎯 Sammanfattning

**Nuvarande Flow:**
```
Frontend → Backend /api/firebase/questions → Firestore (skapar dokument)
                ↓
        Firebase Functions trigger
                ↓
        Backend /api/query (processar)
                ↓
        Firestore (uppdaterar dokument)
                ↓
        Frontend ← Backend /api/query (direkt response) ← PROBLEM!
```

**Korrigerat Flow:**
```
Frontend → Backend /api/firebase/questions → Firestore (skapar dokument)
                ↓
        Firebase Functions trigger
                ↓
        Backend /api/query (processar)
                ↓
        Firestore (uppdaterar dokument)
                ↓
        Frontend ← Firestore (real-time listener) ← RÄTT!
```

**Fördelar med Korrekt Flow:**
- ✅ Single source of truth (Firestore)
- ✅ Real-time updates
- ✅ Konsistent data mellan users
- ✅ Möjlighet att visa tidigare frågor
- ✅ Bättre error handling
- ✅ Audit trail via ledger blocks
