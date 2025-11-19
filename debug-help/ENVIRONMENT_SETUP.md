# Environment Setup - Complete Guide

Detta dokument listar ALLA environment variables och konfigurationsfiler som behövs för CivicAI.

## 📁 Konfigurationsfiler Översikt

```
CivicAI/
├── backend/
│   └── .env                    # Backend environment variables
├── frontend/
│   └── .env                    # Frontend environment variables  
├── functions/
│   ├── .env                    # Firebase Functions environment variables
│   └── .runtimeconfig.json     # Alternative till .env (deprecated approach)
├── firebase.json               # Firebase project configuration
└── .firebaserc                 # Firebase project ID
```

## 🔧 Backend Environment (.env)

**Plats:** `backend/.env`

**Template:** `backend/.env.example`

```bash
# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=openseek-c19fe
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@openseek-c19fe.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAAS...\n-----END PRIVATE KEY-----\n"

# VIKTIGT för FIREBASE_PRIVATE_KEY:
# - Måste ha dubbla citattecken
# - \n för radbrytningar (INTE faktiska radbrytningar)
# - Kopiera direkt från Firebase Service Account JSON

# API Keys för AI Services
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=...
CLAUDE_API_KEY=sk-ant-...  # Optional

# Pipeline Configuration
PIPELINE_VERSION=1.0.0
ENABLE_CHANGE_DETECTION=true
ENABLE_LEDGER=true

# Server Configuration
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# ML Models (Optional - använder defaults om saknas)
BERT_MODEL_PATH=models/bert-base-swedish
SENTIMENT_MODEL_PATH=models/sentiment-analysis
```

**Hur man får credentials:**
1. Firebase Project ID: Firebase Console → Project Settings → General
2. Service Account: Firebase Console → Project Settings → Service Accounts → Generate new private key
3. API Keys: Respektive AI-tjänsts dashboard

---

## 🌐 Frontend Environment (.env)

**Plats:** `frontend/.env`

**Template:** `frontend/.env.firebase.example`

```bash
# Firebase Web SDK Configuration
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=openseek-c19fe.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=openseek-c19fe
VITE_FIREBASE_STORAGE_BUCKET=openseek-c19fe.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Backend URL
VITE_BACKEND_URL=http://localhost:3001

# Feature Flags (Optional)
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_LEDGER_VIEW=true
```

**Hur man får Firebase Web Config:**
1. Firebase Console → Project Settings
2. Scroll ner till "Your apps"
3. Klicka Web-ikonen (</>) om ingen app finns
4. Kopiera `firebaseConfig` objektet

---

## 🔥 Firebase Functions Environment (.env)

**Plats:** `functions/.env`

**Template:** `functions/.env.example`

```bash
# Backend URL (MÅSTE vara publicly accessible)
BACKEND_URL=https://your-backend-url.com

# För utveckling med ngrok:
# BACKEND_URL=https://abc123.ngrok-free.dev

# För lokal utveckling med Firebase Emulator:
# BACKEND_URL=http://localhost:3001
```

**KRITISKT:**
- Deployed Firebase Functions kan INTE nå localhost
- Måste vara en publik URL (ngrok eller production)
- För lokal utveckling, använd Firebase Emulator istället

**Skapa filen (Windows PowerShell):**
```powershell
cd functions
Set-Content -Path .env -Value "BACKEND_URL=https://din-url.com" -Encoding UTF8 -NoNewline
```

**Verifiera:**
```powershell
Get-Content .env -Encoding UTF8
# Ska visa: BACKEND_URL=https://...
# Ska INTE visa: �� tecken
```

---

## 📄 Firebase Configuration Files

### firebase.json

**Plats:** `firebase.json` (projekt root)

```json
{
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ]
    }
  ],
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

### .firebaserc

**Plats:** `.firebaserc` (projekt root)

```json
{
  "projects": {
    "default": "openseek-c19fe"
  }
}
```

**OBS:** Byt ut `openseek-c19fe` mot ditt Firebase Project ID.

---

## 🔒 .gitignore Verification

Se till att dessa finns i `.gitignore`:

```bash
# Environment variables
.env
.env.local
.env.*.local

# Firebase
functions/.env
functions/.runtimeconfig.json
firebase-debug.log
firestore-debug.log

# Secrets
**/serviceAccountKey.json
firebase-adminsdk*.json
```

---

## ✅ Verifiering Checklist

### Backend

```bash
cd backend
npm start
```

**Förväntad output:**
```
🚀 OneSeek.AI Backend running on port 3001
[Firebase Service] ✓ Initialized with environment variables
[AI Services] ✓ OpenAI configured
[AI Services] ✓ Gemini configured
[AI Services] ✓ DeepSeek configured
```

**Om du ser fel:**
- `Firebase Service ✗` → Kolla FIREBASE_* variables
- `OpenAI ✗` → Kolla OPENAI_API_KEY
- `Port 3001 already in use` → Annan process använder porten

### Frontend

```bash
cd frontend
npm run dev
```

**Förväntad output:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Öppna http://localhost:5173 och kolla Console (F12):**
- Inga Firebase errors
- `Firebase initialized successfully` (om du har logging)

### Firebase Functions

```bash
firebase deploy --only functions
```

**Förväntad output:**
```
✔  functions: Finished running predeploy script.
✔  functions[onQuestionCreate]: Successful create operation.
✔  Deploy complete!
```

**Verifiera i logs:**
```powershell
firebase functions:log --only onQuestionCreate
```

Ska visa din backend URL, INTE localhost.

---

## 🆘 Troubleshooting

### "Firebase Service ✗ Initialization failed"

**Problem:** Backend kan inte initialisera Firebase

**Lösning:**
1. Verifiera att `backend/.env` finns
2. Kolla att FIREBASE_PRIVATE_KEY har `\n` (inte faktiska radbrytningar)
3. Test:
```bash
cd backend
node -e "console.log(process.env.FIREBASE_PROJECT_ID)"
# Ska visa ditt project ID
```

### "ECONNREFUSED" i Firebase Functions

**Problem:** Functions kan inte nå backend

**Lösning:**
1. Kolla att `functions/.env` finns
2. Kolla att BACKEND_URL är publik (ngrok eller production)
3. Deploy om: `firebase deploy --only functions --force`

### "Invalid Firebase configuration"

**Problem:** Frontend Firebase config är fel

**Lösning:**
1. Verifiera alla VITE_FIREBASE_* variables i `frontend/.env`
2. Kolla att alla börjar med `VITE_` (Vite kräver detta)
3. Restart dev server: `npm run dev`

### "Module not found" errors

**Problem:** Dependencies inte installerade

**Lösning:**
```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install

# Functions
cd functions && npm install
```

---

## 📚 Related Documentation

- [Firebase Setup Guide](./FIREBASE_SETUP_COMPLETE.md)
- [Common Errors & Fixes](./COMMON_ERRORS_AND_FIXES.md)
- [Quick Start with ngrok](../QUICK_START_NGROK.md)
