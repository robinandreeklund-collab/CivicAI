# Fix för ECONNREFUSED 127.0.0.1:3001 Fel

## Sammanfattning av Problemet

PR #44 fastnade i en loop på grund av att Firebase Functions inte kunde ansluta till backend API:et.

**Felet:**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Orsak:**
Firebase Functions som är deployade till Google Cloud kan INTE nå `localhost` eller `127.0.0.1`. De körs på Googles servrar, inte på din dator.

## Lösningen

### 1. För Produktion (Rekommenderat)

Deploya backend till en publik server:

```bash
# Exempel: Deploya till Railway, Heroku, Google Cloud Run, etc.
# Efter deployment, sätt den publika URL:en

# Alternativ A: Använd .runtimeconfig.json
cd functions
cat > .runtimeconfig.json << EOF
{
  "backend": {
    "url": "https://din-backend-url.com"
  }
}
EOF

# Alternativ B: Använd Firebase CLI
firebase functions:config:set backend.url="https://din-backend-url.com"

# Deploy
firebase deploy --only functions
```

### 2. För Testning med Lokal Backend (Snabbt)

Använd ngrok för att exponera din lokala backend:

```bash
# Steg 1: Installera ngrok
# Ladda ner från https://ngrok.com/download

# Steg 2: Starta backend lokalt
cd backend
npm start
# Backend körs på http://localhost:3001

# Steg 3: I ny terminal, exponera backend via ngrok
ngrok http 3001
# Ngrok ger dig en publik URL, t.ex.: https://abc123.ngrok-free.dev

# Steg 4: Konfigurera Firebase Functions med ngrok URL
# Alternativ A: .runtimeconfig.json
cd functions
cat > .runtimeconfig.json << EOF
{
  "backend": {
    "url": "https://abc123.ngrok-free.dev"
  }
}
EOF

# Alternativ B: Firebase CLI
firebase functions:config:set backend.url="https://abc123.ngrok-free.dev"

# Steg 5: Deploy functions
firebase deploy --only functions

# Steg 6: Testa
# Gå till frontend och ställ en fråga
# Kontrollera i Firebase Console att INGA ECONNREFUSED errors finns
```

**Viktigt om ngrok:**
- Gratis ngrok URLs ändras varje gång du startar om ngrok
- Du måste uppdatera konfigurationen och deployas om när URL ändras
- För längre testning, överväg ngrok Pro för statiska URLs

### 3. För Lokal Utveckling (Snabbast för Utveckling)

Använd Firebase Emulator istället för deployed functions:

```bash
# Steg 1: Konfigurera för localhost (endast för emulator)
cd functions
cat > .runtimeconfig.json << EOF
{
  "backend": {
    "url": "http://localhost:3001"
  }
}
EOF

# Steg 2: Starta backend
cd ../backend
npm start

# Steg 3: I ny terminal, starta Firebase Emulator
firebase emulators:start --only functions,firestore

# Nu körs functions LOKALT och kan nå localhost
# Frontend måste konfigureras att använda emulator istället för deployed functions
```

## Nya Säkerhetsåtgärder

### 1. Built-in Localhost Detection

Firebase Functions-koden har nu en check som failar direkt om localhost används:

```javascript
// I functions/index.js
const isLocalhost = backendUrl === 'http://localhost:3001' || 
                   backendUrl.includes('127.0.0.1') ||
                   backendUrl.includes('localhost');

if (isLocalhost) {
  throw new Error(`
CONFIGURATION ERROR: Backend URL is set to localhost (${backendUrl})

Firebase Functions deployed to cloud CANNOT access localhost URLs.

Solutions:
1. For PRODUCTION: Deploy backend to public server
2. For TESTING: Use ngrok to expose local backend
3. For LOCAL DEVELOPMENT: Use Firebase Emulator
`);
}
```

Detta ger ett **tydligt felmeddelande omedelbart** istället för det tysta ECONNREFUSED-felet.

### 2. Configuration Template

Skapat `functions/.runtimeconfig.json.example`:
```json
{
  "backend": {
    "url": "http://localhost:3001"
  }
}
```

Kopiera och redigera för din miljö:
```bash
cd functions
cp .runtimeconfig.json.example .runtimeconfig.json
# Redigera .runtimeconfig.json med din publika URL
```

### 3. Förbättrad Dokumentation

- `functions/README.md` - Komplett troubleshooting guide
- `docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md` - Uppdaterad med tydliga varningar
- `docs/deployment/FIREBASE_FUNCTIONS_CONFIG_FIX.md` - Existerande guide om config-problem

## Verifiering

### 1. Kontrollera Konfiguration

```bash
# Metod 1: Kolla .runtimeconfig.json
cat functions/.runtimeconfig.json
# Ska visa DIN publika URL, INTE localhost

# Metod 2: Kolla Firebase config
firebase functions:config:get
# Ska visa:
# {
#   "backend": {
#     "url": "https://din-publika-url.com"
#   }
# }
```

### 2. Kontrollera Logs Efter Deploy

```bash
firebase functions:log --only onQuestionCreate

# Du ska se:
# [onQuestionCreate] Using backend URL: https://din-publika-url.com

# DU SKA INTE SE:
# [onQuestionCreate] Using backend URL: http://localhost:3001
```

### 3. Testa End-to-End

1. Starta backend (eller säkerställ att den är deployed)
2. Om du använder ngrok, starta det och verifiera URL
3. Deploy functions: `firebase deploy --only functions`
4. Gå till frontend och ställ en fråga
5. Kolla Firebase Console > Firestore Database > `ai_interactions`
6. Öppna det senaste dokumentet
7. **Verifiera att `errors` array är TOM** (inga ECONNREFUSED errors)
8. Verifiera att `status` går från `received` → `processing` → `completed` → `ledger_verified`
9. Verifiera att `raw_responses` och `processed_data` finns

## Vanliga Misstag att Undvika

### ❌ FEL: Använda localhost för deployed functions
```bash
# Detta fungerar INTE för deployed functions
firebase functions:config:set backend.url="http://localhost:3001"
firebase deploy --only functions
# Resultat: ECONNREFUSED error
```

### ✅ RÄTT: Använd ngrok eller production URL
```bash
# För testning med ngrok
ngrok http 3001
firebase functions:config:set backend.url="https://abc123.ngrok.io"
firebase deploy --only functions

# Eller för produktion
firebase functions:config:set backend.url="https://api.mysite.com"
firebase deploy --only functions
```

### ❌ FEL: Glömma att deployas om efter config-ändring
```bash
# Config ändrad men inte deployad
firebase functions:config:set backend.url="https://new-url.com"
# GLÖMDE: firebase deploy --only functions
# Resultat: Gamla config används fortfarande
```

### ✅ RÄTT: Alltid deploya efter config-ändring
```bash
firebase functions:config:set backend.url="https://new-url.com"
firebase deploy --only functions  # VIKTIGT!
```

### ❌ FEL: Testa med emulator men backend inte startat
```bash
# Starta emulator UTAN att starta backend först
firebase emulators:start --only functions,firestore
# Resultat: ECONNREFUSED eftersom ingen lyssnar på localhost:3001
```

### ✅ RÄTT: Starta backend först
```bash
# Terminal 1: Starta backend
cd backend && npm start

# Terminal 2: Starta emulator
firebase emulators:start --only functions,firestore
```

## Support

Om du fortfarande har problem:

1. Läs `functions/README.md` för fullständig troubleshooting
2. Kolla Firebase Functions logs: `firebase functions:log`
3. Verifiera backend status: `curl https://din-url.com/health`
4. Kontrollera att ngrok fortfarande kör (om du använder det)
5. Öppna ett issue på GitHub med:
   - Firebase functions logs
   - Backend logs
   - Firestore document med errors
   - Din konfiguration (utan känsliga detaljer)

## Sammanfattning

**Problemet:** Firebase Functions kunde inte nå backend på localhost

**Lösningen:** 
- Använd publikt åtkomlig URL (produktion eller ngrok)
- ELLER använd Firebase Emulator för lokal utveckling

**Nya Säkerhetsåtgärder:**
- Built-in localhost detection med tydliga felmeddelanden
- Configuration template (`.runtimeconfig.json.example`)
- Förbättrad dokumentation med varningar

**Resultat:** 
- Inga fler tysta ECONNREFUSED errors
- Tydliga felmeddelanden med lösningsförslag
- Lättare att konfigurera och felsöka
