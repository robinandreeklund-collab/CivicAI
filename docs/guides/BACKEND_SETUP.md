# Backend Setup Guide

Guide för att sätta upp CivicAI backend med Firebase integration.

## Prerequisites

- Node.js (v18 eller senare)
- npm (kommer med Node.js)
- Firebase projekt skapat
- Service Account Key nedladdad

## Installation

### 1. Navigera till backend-mappen

```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\backend
```

### 2. Installera dependencies

```powershell
npm install
```

Detta installerar alla nödvändiga paket inklusive:
- `firebase-admin` (v13.6.0) - Firebase Admin SDK
- `express` - Web server
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables
- Och alla andra dependencies

**Förväntat output:**
```
added 343 packages, and audited 344 packages in 17s

36 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

### 3. Verifiera installation

```powershell
npm list firebase-admin
```

**Förväntat output:**
```
oneseek-ai-backend@0.1.0 C:\Users\robin\Documents\GitHub\CivicAI\backend
└── firebase-admin@13.6.0
```

## Firebase Configuration

### Option 1: Environment Variables (Rekommenderat för produktion)

Skapa en `.env` fil i `backend/` mappen:

```env
# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Viktigt:**
- FIREBASE_PRIVATE_KEY måste ha citattecken och `\n` för newlines
- Hämta dessa värden från din service account JSON-fil

### Option 2: Service Account Key Path (Enklast för utveckling)

```env
# Firebase Admin SDK Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=C:\Users\robin\.firebase-keys\serviceAccountKey.json

# Server Configuration
PORT=3001
NODE_ENV=development
```

**Viktigt:**
- Använd absolut sökväg till din service account key JSON-fil
- Lagra ALDRIG denna fil i Git (är redan i .gitignore)

### Var hittar jag dessa värden?

**Service Account Key:**
1. Gå till: https://console.firebase.google.com
2. Välj ditt projekt
3. Project Settings (⚙️) → Service accounts
4. Klicka "Generate new private key"
5. Spara JSON-filen säkert (t.ex. `C:\Users\robin\.firebase-keys\`)

**Från JSON-filen:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",           ← FIREBASE_PROJECT_ID
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY...", ← FIREBASE_PRIVATE_KEY
  "client_email": "...@....iam.gserviceaccount.com", ← FIREBASE_CLIENT_EMAIL
  ...
}
```

## Starting the Backend

### 1. Starta server

```powershell
npm start
```

**Förväntat output (SUCCESS):**
```
[Firebase Service] ✓ Firebase Admin SDK initialized successfully
[Firebase Service] ✓ Project ID: your-project-id
[Firebase Service] ✓ Firestore connected
Server running on port 3001
```

**Om Firebase INTE är konfigurerad (OK för utveckling utan Firebase):**
```
[Firebase Service] ℹ Firebase not configured (optional)
Server running on port 3001
```

### 2. Test i en ny PowerShell-fönster

```powershell
curl http://localhost:3001/api/firebase/status
```

**Förväntat svar:**
```json
{
  "available": true,
  "configured": true,
  "message": "Firebase is configured and ready"
}
```

## Verification Checklist

- [ ] `npm install` kördes utan fel
- [ ] `firebase-admin@13.6.0` finns i `npm list`
- [ ] `.env` fil finns med Firebase credentials
- [ ] Backend startar utan "Cannot find package" errors
- [ ] Firebase Service visar "✓ initialized successfully"
- [ ] `/api/firebase/status` returnerar `{"available": true}`

## Troubleshooting

### Error: "Cannot find package 'firebase-admin'"

**Problem:** Dependencies inte installerade

**Lösning:**
```powershell
cd backend
npm install
```

### Error: "Firebase initialization failed"

**Möjliga orsaker:**

**1. .env fil saknas eller är tom**
```powershell
# Kontrollera om .env finns
Get-Content .env
```

**2. Felaktiga credentials**
- Kontrollera att Project ID är korrekt
- Kontrollera att client_email matchar service account
- Kontrollera att private_key har korrekt format

**3. Invalid FIREBASE_PRIVATE_KEY format**

Om du använder Option 1 (env variables), se till att:
- Hela nyckeln är inom citattecken: `"-----BEGIN...-----END PRIVATE KEY-----\n"`
- Newlines är escaped som `\n`
- Inga extra mellanslag

**Enklare:** Använd Option 2 (file path) istället

### Error: "EADDRINUSE: address already in use :::3001"

**Problem:** Port 3001 används redan av en annan process

**Lösning 1: Hitta och döda processen**
```powershell
# Hitta process på port 3001
netstat -ano | findstr :3001

# Döda processen (byt PID)
taskkill /PID <process-id> /F
```

**Lösning 2: Använd en annan port**

I `.env`:
```env
PORT=3002
```

Sedan testa: `curl http://localhost:3002/api/firebase/status`

### Error: "Failed to parse private key"

**Problem:** FIREBASE_PRIVATE_KEY har fel format

**Lösning:**

Använd service account key path istället:

**.env:**
```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\Users\robin\.firebase-keys\serviceAccountKey.json
```

Kommentera bort eller ta bort FIREBASE_PRIVATE_KEY variabeln.

### Warning: "Firebase not configured (optional)"

**Betydelse:** Backend startar men Firebase är inte konfigurerat

**Om du VILL använda Firebase:**
1. Skapa/uppdatera `.env` fil med Firebase credentials
2. Starta om backend: `npm start`

**Om du INTE vill använda Firebase:**
- Inget problem - backend fungerar ändå
- Firebase-funktioner är optional och gracefully degraderar

### Backend startar men frågor sparas inte i Firebase

**Kontrollera:**

**1. Backend console output:**
När du ställer en fråga från frontend, kolla backend terminal.
Du bör se något som: `[Firebase] Question stored: <docId>`

**2. Browser DevTools:**
- Öppna DevTools (F12)
- Network tab
- Ställ en fråga
- Leta efter POST till `/api/firebase/questions`
- Kolla status code och response

**3. Testa API:et direkt:**
```powershell
$body = @{
    question = "Test från PowerShell"
    userId = "test-user"
    sessionId = "test-session"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3001/api/firebase/questions" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Förväntat svar:**
```json
{
  "success": true,
  "docId": "abc123xyz",
  "status": "received",
  "message": "Question stored successfully"
}
```

**4. Verifiera i Firebase Console:**
- https://console.firebase.google.com/project/YOUR-PROJECT/firestore
- Öppna `ai_interactions` collection
- Kolla om frågan finns där

## Development vs. Production

### Development (lokal utveckling)

```env
NODE_ENV=development
PORT=3001
FIREBASE_SERVICE_ACCOUNT_PATH=C:\Users\robin\.firebase-keys\dev-key.json
```

### Production (deployment)

```env
NODE_ENV=production
PORT=3001
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

**Viktigt för produktion:**
- Använd environment variables (inte file path)
- Olika service accounts för dev/prod
- Enable security rules i Firestore
- Sätt upp proper authentication

## Quick Reference

### Installera dependencies
```powershell
cd backend
npm install
```

### Starta backend
```powershell
npm start
```

### Testa Firebase status
```powershell
curl http://localhost:3001/api/firebase/status
```

### Kolla logs
Backend printar logs direkt i terminal. Kolla efter:
- `✓` = Success
- `ℹ` = Info
- `✗` = Error

### Stoppa backend
Tryck `Ctrl+C` i terminalen där backend körs

## Next Steps

När backend är uppsatt och fungerar:

1. **Testa från frontend:**
   - Starta frontend: `cd ..\frontend && npm run dev`
   - Öppna: http://localhost:3000
   - Gå till Chat-V2
   - Ställ en fråga
   - Verifiera i Firebase Console

2. **Kontrollera status tracking:**
   - Frågan bör sparas med status `received`
   - När AI-analys är klar uppdateras till `completed`

3. **Utforska API endpoints:**
   - `GET /api/firebase/questions` - Lista frågor
   - `GET /api/firebase/questions/:docId` - Hämta specifik fråga
   - `POST /api/firebase/questions/:docId/status` - Uppdatera status

## Support

Om du stöter på problem som inte täcks här:

1. Kolla backend console output för error messages
2. Kolla browser DevTools console
3. Verifiera att Firebase credentials är korrekta
4. Testa API endpoints direkt med PowerShell
5. Kontrollera Firebase Console för data

**Vanliga guides:**
- `docs/guides/FIREBASE_SETUP.md` - Firebase setup
- `docs/guides/FIREBASE_CREDENTIALS_FIX.md` - Credentials troubleshooting
- `docs/api/API-Firebase-Integration.md` - API documentation
