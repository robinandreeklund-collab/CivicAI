# Vanliga Fel & Lösningar

## ECONNREFUSED Error

### Symptom

```
Error: connect ECONNREFUSED 127.0.0.1:3001
_currentUrl: 'http://localhost:3001/api/query'
```

### Orsak

Firebase Functions körs i Google Cloud och kan INTE nå `localhost` eller `127.0.0.1`. Den deployade funktionen försöker ansluta till en lokal server som inte finns.

### Lösning 1: Använd ngrok (Snabbast för testning)

```powershell
# Terminal 1: Starta backend
cd backend
npm start

# Terminal 2: Starta ngrok
ngrok http 3001
# Kopiera https URL (t.ex. https://abc123.ngrok-free.dev)

# Terminal 3: Uppdatera functions/.env
cd functions
Set-Content -Path .env -Value "BACKEND_URL=https://abc123.ngrok-free.dev" -Encoding UTF8 -NoNewline

# Verifiera
Get-Content .env -Encoding UTF8

# Deploy från projekt root
cd ..
firebase deploy --only functions --force

# Vänta 30 sek och verifiera
Start-Sleep -Seconds 30
firebase functions:log --only onQuestionCreate
```

### Lösning 2: Deploya Backend till Produktion

1. Deploya backend till Heroku, Railway, Google Cloud Run, etc.
2. Uppdatera `functions/.env` med production URL
3. Deploy: `firebase deploy --only functions --force`

### Verifiering

```powershell
firebase functions:log --only onQuestionCreate
```

Du SKA se:
```
Using backend URL: https://din-ngrok-url.ngrok-free.dev
```

Du SKA INTE se:
```
Using backend URL: http://localhost:3001  ← FEL!
```

---

## Invalid dotenv file Error

### Symptom

```
Error: Failed to load environment variables from .env.
FirebaseError Invalid dotenv file, error on lines: ��BACKEND_URL=...
```

### Orsak

PowerShell `echo` kommando skapar filer med UTF-16 LE BOM encoding istället för UTF-8, vilket dotenv parsern inte kan läsa.

### Lösning

```powershell
cd functions

# Ta bort felaktig fil
Remove-Item .env

# Skapa ny med KORREKT encoding
Set-Content -Path .env -Value "BACKEND_URL=https://din-url.com" -Encoding UTF8 -NoNewline

# Verifiera (ska INTE visa �� tecken)
Get-Content .env -Encoding UTF8

# Deploy
cd ..
firebase deploy --only functions
```

### Verifiering

```powershell
# Filen ska vara ~60-100 bytes (beroende på URL längd)
(Get-Item functions/.env).Length

# Innehållet ska vara rent
Get-Content functions/.env -Encoding UTF8
# Output: BACKEND_URL=https://...
```

---

## .env Fil Laddas Inte

### Symptom

Functions använder fortfarande localhost trots att `.env` filen skapats.

### Orsak

`.env` filen skapades EFTER deployment. Firebase laddar endast `.env` vid deployment-tidpunkten.

### Lösning

```powershell
# 1. Verifiera att .env finns
cd functions
Test-Path .env  # Ska visa: True

# 2. Visa innehåll
Get-Content .env -Encoding UTF8
# Ska visa: BACKEND_URL=https://...

# 3. Gå till projekt root
cd ..

# 4. Deploy med --force för att tvinga omdeployment
firebase deploy --only functions --force
```

**VIKTIGT:** `--force` flaggan är nödvändig! Utan den skippar Firebase deployment om koden inte ändrats.

### Verifiering

```powershell
# Vänta 30 sekunder
Start-Sleep -Seconds 30

# Kolla logs
firebase functions:log --only onQuestionCreate
# Ska visa din ngrok/production URL
```

---

## Not in a Firebase app directory

### Symptom

```
Error: Not in a Firebase app directory (could not locate firebase.json)
```

### Orsak

Du försöker deployas från fel directory. Firebase CLI behöver köras från projekt root där `firebase.json` finns.

### Lösning

```powershell
# Gå till projekt root
cd C:\Users\robin\Documents\GitHub\CivicAI

# Verifiera att firebase.json finns
Test-Path firebase.json  # Ska visa: True

# Deploy
firebase deploy --only functions
```

---

## Firebase Not Initialized

### Symptom

```
[Firebase Service] ✗ Initialization failed
```

### Orsak

Saknar Firebase credentials i `backend/.env`.

### Lösning

1. Hämta credentials från Firebase Console (se [FIREBASE_SETUP_COMPLETE.md](./FIREBASE_SETUP_COMPLETE.md))
2. Uppdatera `backend/.env`:

```bash
FIREBASE_PROJECT_ID=openseek-c19fe
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

3. Restart backend:

```bash
cd backend
npm start
```

---

## ngrok URL ändras hela tiden

### Problem

Ngrok free tier ger ny URL varje gång du startar om ngrok.

### Lösning 1: Håll ngrok igång

Låt ngrok köra i bakgrunden och starta inte om den.

### Lösning 2: Använd ngrok Pro

Ngrok Pro ger statiska URLs.

### Lösning 3: Deploya till Produktion

Deploya backend till en riktig server med stabil URL.

---

## Functions deployment skipped

### Symptom

```
i functions: No changes detected. Skipping deployment.
```

### Orsak

Firebase hoppar över deployment om koden inte ändrats, även om `.env` ändrats.

### Lösning

Använd `--force` flaggan:

```powershell
firebase deploy --only functions --force
```

---

## Deprecated functions.config() Warning

### Symptom

```
DEPRECATION NOTICE: functions.config() API will be shut down in March 2026
```

### Orsak

Firebase avvecklar `functions.config()` API.

### Lösning

Vi har redan migrerat till `.env` fil. Warningen kan ignoreras så länge du använder `.env` filen.

Koden stöder BÅDA metoderna:
```javascript
const backendUrl = process.env.BACKEND_URL ||           // Nytt (.env)
                  functions.config().backend?.url ||    // Gammalt (deprecated)
                  'http://localhost:3001';              // Fallback
```

---

## Firestore Security Rules Error

### Symptom

```
Missing or insufficient permissions
```

### Orsak

Security rules blockerar åtkomst.

### Lösning

Uppdatera Firestore Security Rules i Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ai_interactions/{docId} {
      allow read: if true;  // Ändra till auth för produktion
      allow create: if true;
      allow update, delete: if false;
    }
  }
}
```

---

## Hitta Inte Lösningen?

1. Kolla [Firebase Console Logs](https://console.firebase.google.com/project/openseek-c19fe/overview)
2. Kolla backend logs: `cd backend && npm start`
3. Kolla browser console (F12)
4. Sök i `QUICK_START_NGROK.md` för mer detaljer
5. Öppna ett GitHub issue med logs
