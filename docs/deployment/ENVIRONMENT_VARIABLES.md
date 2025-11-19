# Environment Variables - Quick Reference

## Backend (.env)

```bash
# ============================================
# FIREBASE ADMIN SDK (REQUIRED för Firebase Step 2)
# ============================================
# Från Firebase Console > Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# ============================================
# AI SERVICE API KEYS (VALFRIA)
# ============================================
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
DEEPSEEK_API_KEY=sk-...
XAI_API_KEY=...
QWEN_API_KEY=...

# ============================================
# PIPELINE CONFIGURATION
# ============================================
PIPELINE_VERSION=1.0.0

# ============================================
# SERVER
# ============================================
PORT=3001
NODE_ENV=development
```

## Frontend (.env)

```bash
# ============================================
# FIREBASE WEB SDK (REQUIRED för Firebase Step 2)
# ============================================
# Från Firebase Console > Project Settings > Your apps > Web app
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# ============================================
# BACKEND API URL
# ============================================
# Lokal utveckling
VITE_BACKEND_URL=http://localhost:3001

# Produktion (ändra till din faktiska URL)
# VITE_BACKEND_URL=https://api.civicai.se
```

## Firebase Functions Config

```bash
# Sätt via Firebase CLI
firebase functions:config:set backend.url="http://localhost:3001"

# För produktion
firebase functions:config:set backend.url="https://din-backend-url.com"
```

## Var Hittar Jag Dessa Värden?

### Firebase Admin SDK (Backend)

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt
3. Gå till **Project Settings** (kugghjulet) > **Service Accounts**
4. Klicka på **"Generate new private key"**
5. En JSON-fil laddas ner med alla värden

**Från JSON-filen:**
```json
{
  "project_id": "→ FIREBASE_PROJECT_ID",
  "client_email": "→ FIREBASE_CLIENT_EMAIL",
  "private_key": "→ FIREBASE_PRIVATE_KEY"
}
```

### Firebase Web SDK (Frontend)

1. Gå till [Firebase Console](https://console.firebase.google.com/)
2. Välj ditt projekt
3. Gå till **Project Settings** (kugghjulet) > **General**
4. Scrolla ner till **"Your apps"**
5. Om du inte har en web app, klicka på web-ikonen (</>) för att skapa en
6. Kopiera config-objektet:

```javascript
const firebaseConfig = {
  apiKey: "→ VITE_FIREBASE_API_KEY",
  authDomain: "→ VITE_FIREBASE_AUTH_DOMAIN",
  projectId: "→ VITE_FIREBASE_PROJECT_ID",
  storageBucket: "→ VITE_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "→ VITE_FIREBASE_MESSAGING_SENDER_ID",
  appId: "→ VITE_FIREBASE_APP_ID",
  measurementId: "→ VITE_FIREBASE_MEASUREMENT_ID"
};
```

## Vanliga Problem

### FIREBASE_PRIVATE_KEY Format

**Problem:** Private key har fel format

**Lösning:** Nyckeln måste ha `\n` (backslash-n) för radbrytningar, INTE faktiska radbrytningar.

**Rätt:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n"
```

**Fel:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBg...
-----END PRIVATE KEY-----"
```

**Alternativ lösning:** Base64-encode nyckeln:
```bash
# Linux/Mac
echo -n "-----BEGIN PRIVATE KEY-----..." | base64

# Sätt sedan i .env
FIREBASE_PRIVATE_KEY=base64_encoded_key_here
```

### VITE_BACKEND_URL

**Viktigt:** Denna URL måste vara tillgänglig från webbläsaren (frontend).

**Lokal utveckling:**
```bash
VITE_BACKEND_URL=http://localhost:3001
```

**Produktion:**
```bash
VITE_BACKEND_URL=https://api.civicai.se
# INTE http://localhost:3001 !
```

### Backend URL för Firebase Functions

**Viktigt:** Denna URL måste vara tillgänglig från Firebase Functions (serverside).

**Lokal testning:**
```bash
firebase functions:config:set backend.url="http://localhost:3001"
# Obs: Fungerar bara om backend är publikt tillgänglig
```

**Produktion:**
```bash
firebase functions:config:set backend.url="https://din-backend-url.com"
```

**För lokal emulator:**
```bash
# Använd host.docker.internal om backend körs lokalt
firebase functions:config:set backend.url="http://host.docker.internal:3001"
```

## Checklist för Deployment

### Lokal Testning

- [ ] Backend `.env` konfigurerad med Firebase Admin SDK
- [ ] Frontend `.env` konfigurerad med Firebase Web SDK
- [ ] `VITE_BACKEND_URL=http://localhost:3001`
- [ ] Firebase Functions config: `backend.url=http://localhost:3001`
- [ ] Backend startar utan Firebase-fel
- [ ] Frontend startar utan fel
- [ ] Firebase Functions deployed

### Produktion

- [ ] Skapa production Firebase project
- [ ] Backend `.env` med production Firebase credentials
- [ ] Frontend `.env` med production Firebase config
- [ ] `VITE_BACKEND_URL` satt till production backend URL
- [ ] Firebase Functions config med production backend URL
- [ ] Backend deployed och publikt tillgänglig
- [ ] Frontend deployed
- [ ] Firebase Functions deployed
- [ ] Firestore Security Rules uppdaterade för produktion
- [ ] Testat end-to-end i produktion

## Exempel-filer

### backend/.env.example

Se: `/home/runner/work/CivicAI/CivicAI/backend/.env.example`

### frontend/.env.firebase.example

Se: `/home/runner/work/CivicAI/CivicAI/frontend/.env.firebase.example`

## Support

Se [Firebase Step 2 Deployment Guide](FIREBASE_STEP2_DEPLOYMENT_GUIDE.md) för fullständig deployment-guide.
