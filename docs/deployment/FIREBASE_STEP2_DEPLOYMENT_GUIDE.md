# Firebase Step 2 - Steg-för-Steg Deployment Guide

Detta är en fullständig guide för att deploya Firebase Integration Step 2 till produktionsmiljön och testa på frontend.

## Innehållsförteckning

1. [Förberedelser](#förberedelser)
2. [Steg 1: Firebase Project Setup](#steg-1-firebase-project-setup)
3. [Steg 2: Backend Konfiguration](#steg-2-backend-konfiguration)
4. [Steg 3: Firebase Functions Deployment](#steg-3-firebase-functions-deployment)
5. [Steg 4: Frontend Konfiguration](#steg-4-frontend-konfiguration)
6. [Steg 5: Firestore Collections Setup](#steg-5-firestore-collections-setup)
7. [Steg 6: Testing](#steg-6-testing)
8. [Felsökning](#felsökning)

---

## Förberedelser

### Verktyg som behövs

```bash
# Node.js 18+ (kontrollera version)
node --version  # Ska vara v18.0.0 eller senare

# npm (kommer med Node.js)
npm --version

# Firebase CLI (installera globalt)
npm install -g firebase-tools

# Kontrollera Firebase CLI installation
firebase --version
```

### API Keys som behövs

Du behöver API-nycklar för följande tjänster (för att ML-pipelinen ska fungera):
- OpenAI (valfritt, men rekommenderas)
- Google Gemini (valfritt, men rekommenderas)
- DeepSeek (valfritt)

Utan dessa nycklar kommer bara Firebase-integreationen att fungera, men inte AI-svaren.

### Firebase Billing (VIKTIGT)

**Firebase Functions kräver Blaze (pay-as-you-go) plan.**

- **Kostnad:** Generös free tier - typiskt 0-5 USD/månad för detta projekt
- **Krävs för:** Firebase Functions deployment
- **Fungerar på free plan:** Firestore Database (kan användas utan uppgradering)
- **Uppgradering:** Se Steg 1.2 i guiden nedan

**Om du inte vill uppgradera till Blaze:**
- Du kan fortfarande använda Firestore för data storage
- Backend kan köras lokalt eller på egen server
- Firebase Functions kommer inte att fungera

---

## Steg 1: Firebase Project Setup

### 1.1 Skapa Firebase Project

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Klicka på "Add project" eller "Skapa projekt"
3. Ge projektet ett namn (t.ex. "civicai-production")
4. Välj om du vill ha Google Analytics (rekommenderas)
5. Klicka på "Create project"

### 1.2 Uppgradera till Blaze Plan (KRÄVS för Firebase Functions)

**VIKTIGT:** Firebase Functions kräver Blaze (pay-as-you-go) plan.

1. I Firebase Console, gå till vänster meny längst ner och klicka på "Upgrade"
2. Välj **Blaze Plan** (Pay as you go)
3. Lägg till betalningsinformation (kreditkort)
4. Klicka på "Purchase"

**Kostnad:**
- Firebase Functions har en **generös free tier**:
  - 2 miljoner anrop/månad gratis
  - 400,000 GB-sekunder gratis
  - 200,000 CPU-sekunder gratis
- För typisk användning med detta projekt: **0-5 USD/månad**
- Du kan sätta budget alerts i Google Cloud Console

**Alternativ (om du inte vill uppgradera):**
- Kör endast backend lokalt eller på egen server
- Firebase Functions kommer INTE att fungera på Spark (free) plan
- Du kan fortfarande använda Firestore Database (fungerar på free plan)

### 1.3 Aktivera Firestore Database

1. I Firebase Console, gå till "Build" > "Firestore Database"
2. Klicka på "Create database"
3. Välj läge:
   - **Production mode** (rekommenderas för produktion)
   - **Test mode** (endast för utveckling/testning)
4. Välj region (t.ex. "europe-west1" för Europa)
5. Klicka på "Enable"

### 1.4 Skapa Service Account

1. I Firebase Console, gå till Project Settings (kugghjulet) > "Service accounts"
2. Klicka på "Generate new private key"
3. En JSON-fil laddas ner - **Spara denna säkert!**
4. Filen innehåller:
   - `project_id`
   - `client_email`
   - `private_key`

**VIKTIGT:** Dela ALDRIG denna fil eller committa den till Git!

### 1.5 Skapa Web App (för Frontend)

1. I Firebase Console, gå till Project Settings > "Your apps"
2. Klicka på webb-ikonen (</>) för att lägga till en web app
3. Ge appen ett namn (t.ex. "CivicAI Web")
4. Klicka på "Register app"
5. Kopiera Firebase config-objektet som visas:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "civicai-xxx.firebaseapp.com",
  projectId: "civicai-xxx",
  storageBucket: "civicai-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## Steg 2: Backend Konfiguration

### 2.1 Skapa Backend .env Fil

```bash
cd /home/runner/work/CivicAI/CivicAI/backend
cp .env.example .env
```

### 2.2 Konfigurera Backend .env

Öppna `backend/.env` och lägg till:

```bash
# ============================================
# FIREBASE ADMIN SDK CREDENTIALS
# ============================================
# Från service account JSON-filen du laddade ner i Steg 1.3

FIREBASE_PROJECT_ID=civicai-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@civicai-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"

# VIKTIGT: Private key måste vara i anföringstecken och innehålla \n för radbrytningar
# Alternativt kan du base64-encode nyckeln:
# FIREBASE_PRIVATE_KEY=base64_encoded_key_here

# ============================================
# PIPELINE CONFIGURATION
# ============================================
PIPELINE_VERSION=1.0.0

# ============================================
# AI SERVICE API KEYS (Valfria)
# ============================================
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...

# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=production
```

### 2.3 Testa Backend Konfiguration

```bash
cd backend
npm install
npm start
```

Du bör se:
```
🚀 OneSeek.AI Backend running on port 3001
🔗 Health check: http://localhost:3001/health
[Firebase Service] ✓ Initialized with environment variables
[Firebase Service] Project ID: civicai-xxx
```

**Om du ser felmeddelanden om Firebase**, dubbelkolla att:
- `FIREBASE_PRIVATE_KEY` har rätt format (med \n för radbrytningar)
- Alla tre Firebase-variablerna är satta
- Service account har rätt behörigheter

---

## Steg 3: Firebase Functions Deployment

### 3.1 Installera Firebase CLI och Logga In

```bash
# Logga in på Firebase
firebase login

# Verifiera att du är inloggad
firebase projects:list
```

### 3.2 Initiera Firebase i Projektet

```bash
cd /home/runner/work/CivicAI/CivicAI

# Initiera Firebase (om inte redan gjort)
firebase init
```

Välj följande alternativ:
- **Functions** - Configure a Cloud Functions directory and its files
- Välj ditt Firebase project (civicai-xxx)
- **JavaScript** som språk
- **No** till ESLint (vi har redan linting)
- **Yes** till install dependencies

### 3.3 Kopiera Functions Code och Package.json

```bash
# Skapa functions directory om det inte finns
mkdir -p functions

# Kopiera vår functions code
cp firebase-functions/index.js functions/index.js

# Kopiera package.json template (med korrekta dependency versioner)
cp firebase-functions/package.json functions/package.json
```

**Alternativt**, skapa `functions/package.json` manuellt med detta innehåll (se nästa steg).

### 3.4 Konfigurera Functions package.json

Om du inte kopierade från template, redigera `functions/package.json`:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^12.5.0",
    "firebase-functions": "^5.1.1",
    "axios": "^1.7.0"
  }
}
```

**VIKTIGT:** Använd `firebase-admin@^12.5.0` (INTE `^13.x`) för att undvika peer dependency konflikt med `firebase-functions@^5.x`.

**Template finns i:** `firebase-functions/package.json` (kan kopieras direkt)

### 3.5 Installera Functions Dependencies

```bash
cd functions
npm install
```

### 3.6 Sätt Environment Variables för Functions

```bash
# Sätt backend URL (används av Functions för att anropa backend)
firebase functions:config:set backend.url="https://din-backend-url.com"

# Om du kör lokalt under testning:
firebase functions:config:set backend.url="http://localhost:3001"

# Verifiera konfigurationen
firebase functions:config:get
```

**Output bör vara:**
```json
{
  "backend": {
    "url": "http://localhost:3001"
  }
}
```

### 3.7 Deploy Functions

```bash
cd /home/runner/work/CivicAI/CivicAI

# Deploy endast functions
firebase deploy --only functions
```

**Förväntad output:**
```
=== Deploying to 'civicai-xxx'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XX.XX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 18 function onQuestionCreate(us-central1)...
i  functions: creating Node.js 18 function onStatusUpdate(us-central1)...
✔  functions[onQuestionCreate(us-central1)] Successful create operation.
✔  functions[onStatusUpdate(us-central1)] Successful create operation.

✔  Deploy complete!
```

### 3.8 Verifiera Functions Deployment

```bash
# Lista deployade functions
firebase functions:list

# Kolla logs
firebase functions:log
```

---

## Steg 4: Frontend Konfiguration

### 4.1 Skapa Frontend .env Fil

```bash
cd /home/runner/work/CivicAI/CivicAI/frontend
cp .env.firebase.example .env
```

### 4.2 Konfigurera Frontend .env

Öppna `frontend/.env` och fyll i från Firebase config (Steg 1.4):

```bash
# ============================================
# FIREBASE WEB SDK CONFIGURATION
# ============================================
# Från Firebase Console > Project Settings > Your apps > Web app

VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=civicai-xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=civicai-xxx
VITE_FIREBASE_STORAGE_BUCKET=civicai-xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# BACKEND API URL
# ============================================
# URL till backend API
VITE_BACKEND_URL=http://localhost:3001

# För produktion, använd din faktiska backend URL:
# VITE_BACKEND_URL=https://din-backend-url.com
```

**VIKTIGT om VITE_BACKEND_URL:**
- För **lokal utveckling**: `http://localhost:3001`
- För **produktion**: Din faktiska backend URL (t.ex. `https://api.civicai.se`)
- Frontend måste kunna nå backend via denna URL
- Om backend och frontend körs på samma maskin lokalt, använd `http://localhost:3001`

### 4.3 Installera Frontend Dependencies

```bash
cd frontend
npm install
```

### 4.4 Bygg och Starta Frontend

```bash
# Utvecklingsläge (med hot reload)
npm run dev

# Eller bygg för produktion
npm run build
```

**Output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Steg 5: Firestore Collections Setup

### 5.1 Skapa Collections Manuellt (Enklast)

1. Gå till Firebase Console > Firestore Database
2. Klicka på "Start collection"
3. Collection ID: `ai_interactions`
4. Lägg till ett test-dokument:
   - Document ID: Auto-ID
   - Fält:
     - `question` (string): "Test fråga"
     - `status` (string): "received"
     - `created_at` (timestamp): Nuvarande tid
     - `pipeline_version` (string): "1.0.0"
     - `question_hash` (string): "test-hash"
     - `raw_responses` (array): []
     - `processed_data` (map): {}
     - `processing_times` (map): {}
     - `pipeline_metadata` (map): { status_log: [] }
     - `errors` (array): []
     - `quality_metrics` (map): {}
     - `ledger_blocks` (array): []

5. Radera test-dokumentet (eller lämna kvar för testing)

### 5.2 Skapa Collections via Backend API

Alternativt kan du använda backend API:et för att skapa första dokumentet:

```bash
# Starta backend
cd backend
npm start

# I en annan terminal, skapa test-fråga
curl -X POST http://localhost:3001/api/firebase/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test fråga för att skapa collection",
    "userId": "test-user",
    "sessionId": "test-session"
  }'
```

Detta skapar automatiskt `ai_interactions` collection med rätt struktur.

### 5.3 Konfigurera Security Rules

I Firebase Console > Firestore Database > Rules, sätt följande:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ai_interactions collection
    match /ai_interactions/{docId} {
      // Läs: Endast autentiserade användare (eller alla för utveckling)
      allow read: if true;  // Ändra till 'if request.auth != null' för produktion
      
      // Skapa: Endast autentiserade användare
      allow create: if true;  // Ändra till 'if request.auth != null' för produktion
      
      // Uppdatera/Radera: Endast backend via Admin SDK
      allow update, delete: if false;
    }
    
    // ledger_blocks collection
    match /ledger_blocks/{blockId} {
      // Läs: Alla kan läsa ledger (öppen transparens)
      allow read: if true;
      
      // Skriva: Endast backend via Admin SDK
      allow write: if false;
    }
    
    // model_versions collection
    match /model_versions/{modelId} {
      // Läs: Alla
      allow read: if true;
      
      // Skriva: Endast backend
      allow write: if false;
    }
  }
}
```

Klicka på "Publish" för att spara reglerna.

### 5.4 Skapa Index (Om nödvändigt)

Om du får felmeddelanden om saknade index, skapar Firebase automatiskt en länk till att skapa indexet. Alternativt:

1. Gå till Firestore Database > Indexes
2. Klicka på "Create index"
3. Collection: `ai_interactions`
4. Fält:
   - `status` (Ascending)
   - `created_at` (Descending)
5. Klicka på "Create index"

---

## Steg 6: Testing

### 6.1 Fullständigt End-to-End Test

**Terminal 1 - Starta Backend:**
```bash
cd /home/runner/work/CivicAI/CivicAI/backend
npm start
```

**Terminal 2 - Starta Frontend:**
```bash
cd /home/runner/work/CivicAI/CivicAI/frontend
npm run dev
```

**Webbläsare:**
1. Öppna http://localhost:5173
2. Navigera till ChatV2-sidan
3. Skriv en fråga i sökfältet
4. Klicka på "Sök" eller tryck Enter

**Förväntat beteende:**

1. **Fråga skapas i Firestore**
   - Gå till Firebase Console > Firestore > `ai_interactions`
   - Se nytt dokument med status: `received`

2. **Status uppdateras i UI**
   - Du bör se FirebaseStatusIndicator komponenten
   - Status: "Fråga mottagen" (blå)
   - Efter några sekunder: "Bearbetning pågår…" (gul, animerad)

3. **Progress bar visas**
   - Under processing, visas:
     - Progress bar
     - "Steg X/7"
     - Procentandel (t.ex. "40%")

4. **Status uppdateras genom pipeline**
   - Firebase dokument uppdateras med:
     - `raw_responses` fylls i
     - `processed_data` fylls i
     - `pipeline_metadata.status_log` uppdateras
     - Status ändras till `completed` → `ledger_verified`

5. **UI visar slutresultat**
   - Status: "Data verifierad" (grön med lås-ikon)
   - AI-svar visas i ChatV2
   - Kan expandera status log för att se alla steg

### 6.2 Testa Firebase Functions (Trigger)

```bash
# Skapa en ny fråga direkt i Firestore (för att testa trigger)
```

1. Gå till Firebase Console > Firestore Database
2. Klicka på `ai_interactions` collection
3. Klicka på "Add document"
4. Fyll i:
   - Document ID: Auto-ID
   - `question`: "Test från Firebase Console"
   - `status`: "received"
   - `created_at`: Timestamp (nuvarande tid)
   - `pipeline_version`: "1.0.0"
   - `question_hash`: "test-hash-123"

5. Klicka på "Save"

6. **Förväntat beteende:**
   - Firebase Function `onQuestionCreate` triggas automatiskt
   - Status uppdateras till `processing`
   - Backend anropas för att köra ML pipeline
   - Dokument uppdateras med resultat

7. Kolla Functions Logs:
   ```bash
   firebase functions:log
   ```

### 6.3 Testa API Endpoints Manuellt

```bash
# Test 1: Skapa fråga
curl -X POST http://localhost:3001/api/firebase/questions \
  -H "Content-Type: application/json" \
  -d '{"question":"Vad är AI?","userId":"test","sessionId":"test-123"}'

# Spara docId från svaret

# Test 2: Hämta fråga
curl http://localhost:3001/api/firebase/questions/{docId}

# Test 3: Kör full query med Firebase integration
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Vad är klimatförändringar?",
    "firebaseDocId": "{docId}"
  }'
```

### 6.4 Verifiera Ledger Blocks

1. Gå till Firebase Console > Firestore Database
2. Öppna `ledger_blocks` collection
3. Du bör se flera block med:
   - `block_id` (nummer)
   - `event_type`: "data_collection"
   - `data.description`: "Fråga mottagen", "AI responses collected", etc.
   - `current_hash` och `previous_hash`

4. Verifiera kedjan:
   - Block 0 har `previous_hash`: null (genesis block)
   - Block 1 har `previous_hash` = Block 0's `current_hash`
   - Osv.

### 6.5 Kontrollera Real-time Updates i UI

1. Öppna ChatV2 i webbläsaren
2. Öppna Developer Console (F12)
3. Gå till Network tab
4. Skicka en fråga
5. Se polling requests till `/api/firebase/questions/{docId}`
6. Notera hur status uppdateras i realtid:
   - Första poll: status = "received"
   - Andra poll (2s senare): status = "processing"
   - Tredje poll: status = "completed"
   - Fjärde poll: status = "ledger_verified"

---

## Felsökning

### Problem: Blaze plan krävs för Firebase Functions deployment

**Symptom:**
```
Error: Your project openseek-c19fe must be on the Blaze (pay-as-you-go) plan to complete this command.
Required API cloudbuild.googleapis.com can't be enabled until the upgrade is complete.
```

**Lösning:**
Firebase Functions kräver Blaze (pay-as-you-go) plan för att fungera.

**Steg för att uppgradera:**
1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt
3. Klicka på "Upgrade" i vänstra menyn (längst ner)
4. Välj **Blaze Plan**
5. Lägg till betalningsinformation
6. Klicka på "Purchase"

**Kostnad:**
- Generös free tier: 2M anrop/månad gratis
- Typisk kostnad för detta projekt: **0-5 USD/månad**
- Sätt budget alerts i [Google Cloud Console](https://console.cloud.google.com/)

**Alternativ (utan att uppgradera):**
- Kör backend lokalt eller på egen server
- Använd endast Firestore (fungerar på free plan)
- Firebase Functions kommer INTE att fungera på Spark (free) plan

**Efter uppgradering:**
```bash
# Försök deploya igen
firebase deploy --only functions
```

### Problem: npm install fel i Firebase Functions (Peer dependency konflikt)

**Symptom:**
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer firebase-admin@"^11.10.0 || ^12.0.0" from firebase-functions@5.1.1
npm error Found: firebase-admin@13.6.0
```

**Lösning:**
Detta händer när `firebase-admin` version 13.x används med `firebase-functions` version 5.x.

**Metod 1 (Rekommenderat):** Använd kompatibla versioner:
```bash
cd functions
# Redigera package.json och ändra firebase-admin till "^12.0.0"
npm install
```

**Metod 2:** Använd legacy peer deps:
```bash
cd functions
npm install --legacy-peer-deps
```

**Metod 3:** Uppdatera till senaste kompatibla versioner:
```json
{
  "dependencies": {
    "firebase-admin": "^12.5.0",
    "firebase-functions": "^5.1.1",
    "axios": "^1.7.0"
  }
}
```

**VIKTIGT:** I deployment-guiden är nu rätt version angiven (`firebase-admin@^12.0.0`).

### Problem: Backend kan inte ansluta till Firebase

**Symptom:**
```
[Firebase Service] ✗ Initialization failed: Error: ...
```

**Lösning:**
1. Kontrollera att alla tre Firebase-variabler är satta i `backend/.env`
2. Verifiera att `FIREBASE_PRIVATE_KEY` har rätt format:
   - Måste ha `\n` för radbrytningar (inte faktiska radbrytningar)
   - Måste vara inom anföringstecken
3. Testa att kopiera private key direkt från JSON-filen
4. Om problemet kvarstår, försök base64-encode nyckeln:
   ```bash
   echo -n "-----BEGIN PRIVATE KEY-----..." | base64
   ```

### Problem: Firebase Functions kan inte nå Backend

**Symptom:**
```
Error: connect ECONNREFUSED
```

**Lösning:**
1. Kontrollera att `backend.url` är korrekt satt:
   ```bash
   firebase functions:config:get
   ```
2. Om du kör lokalt, använd:
   ```bash
   firebase functions:config:set backend.url="http://localhost:3001"
   ```
3. Om backend körs på en server, använd den publika URL:en
4. Deploy om functions efter config-ändring:
   ```bash
   firebase deploy --only functions
   ```

### Problem: Frontend kan inte ansluta till Backend

**Symptom:**
- CORS errors i browser console
- Network errors när fråga skickas

**Lösning:**
1. Kontrollera `VITE_BACKEND_URL` i `frontend/.env`
2. Om backend körs lokalt, använd: `http://localhost:3001`
3. Verifiera att backend har CORS aktiverat (redan konfigurerat i `backend/index.js`)
4. Restart frontend efter .env ändring:
   ```bash
   npm run dev
   ```

### Problem: "Collection not found" eller "Missing index"

**Lösning:**
1. Skapa collection manuellt (se Steg 5.1)
2. Eller skapa via API (se Steg 5.2)
3. Om index-fel, följ länken i felmeddelandet för att auto-skapa index
4. Eller skapa manuellt (se Steg 5.4)

### Problem: Firebase Functions timeout

**Symptom:**
```
Function execution took 60000 ms, finished with status: 'timeout'
```

**Lösning:**
1. Functions har redan 540s timeout - men detta gäller endast deployed functions
2. För emulator, öka timeout i `firebase.json`:
   ```json
   {
     "functions": {
       "predeploy": [],
       "source": "functions",
       "timeout": "540s"
     }
   }
   ```
3. Verifiera att backend svarar snabbt:
   ```bash
   time curl http://localhost:3001/health
   ```

### Problem: Inga AI-svar visas

**Lösning:**
1. Kontrollera att AI API-nycklar är satta i `backend/.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   GEMINI_API_KEY=AIza...
   ```
2. Kolla backend logs för felmeddelanden
3. Testa en AI-tjänst direkt:
   ```bash
   curl -X POST http://localhost:3001/api/query \
     -H "Content-Type: application/json" \
     -d '{"question":"Test"}'
   ```

### Problem: Status log visas inte i UI

**Lösning:**
1. Kontrollera att `pipeline_metadata.status_log` fylls i:
   - Gå till Firestore Console
   - Öppna ett dokument
   - Verifiera att `pipeline_metadata.status_log` är en array med objekt
2. Kontrollera att `useQuestionStatus` hook används korrekt
3. Verifiera att `FirebaseStatusIndicator` får `pipelineProgress` prop

---

## Produktion Deployment Checklist

När du är redo att deploya till produktion:

- [ ] Skapa production Firebase project
- [ ] Konfigurera production backend med Firebase credentials
- [ ] Deploy backend till production server (t.ex. Heroku, Railway, DigitalOcean)
- [ ] Sätt `backend.url` för Functions till production backend URL
- [ ] Deploy Firebase Functions: `firebase deploy --only functions`
- [ ] Konfigurera frontend med production Firebase config
- [ ] Sätt `VITE_BACKEND_URL` till production backend URL
- [ ] Bygg frontend: `npm run build`
- [ ] Deploy frontend (t.ex. Vercel, Netlify, Firebase Hosting)
- [ ] Uppdatera Firestore Security Rules till production-läge
- [ ] Testa full end-to-end flow i produktion
- [ ] Övervaka Firebase Console > Functions > Logs
- [ ] Övervaka backend logs
- [ ] Sätt upp monitoring/alerts (optional)

---

## Support

Om du stöter på problem:

1. Kolla denna guide först
2. Se [FIREBASE_STEP2_INTEGRATION.md](../api/FIREBASE_STEP2_INTEGRATION.md) för teknisk dokumentation
3. Kolla Firebase Console > Functions > Logs för fel
4. Kolla backend console output
5. Kolla browser console (F12) för frontend fel
6. Öppna ett issue på GitHub med:
   - Felbeskrivning
   - Relevanta logs
   - Steg för att reproducera

---

## Sammanfattning

**Minimal setup för lokal testning:**

```bash
# 1. Backend
cd backend
cp .env.example .env
# Fyll i FIREBASE_* variabler från service account JSON
npm install
npm start

# 2. Frontend (i ny terminal)
cd frontend
cp .env.firebase.example .env
# Fyll i VITE_FIREBASE_* från Firebase Web config
# Sätt VITE_BACKEND_URL=http://localhost:3001
npm install
npm run dev

# 3. Firebase Functions (i ny terminal)
cd /home/runner/work/CivicAI/CivicAI
firebase login
firebase init functions
# Kopiera firebase-functions/index.js till functions/index.js
cd functions
npm install
cd ..
firebase functions:config:set backend.url="http://localhost:3001"
firebase deploy --only functions

# 4. Testa
# Öppna http://localhost:5173
# Gå till ChatV2
# Skicka en fråga
# Verifiera i Firebase Console att data sparas
```

🎉 **Nu är Firebase Step 2 fullt deployat och redo att testa!**
