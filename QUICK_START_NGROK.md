# SNABBGUIDE: Deploy Firebase Functions med Ngrok

Detta är en snabbguide för att lösa ECONNREFUSED-felet och deploya Firebase Functions med ngrok.

## Steg-för-Steg Instruktioner

### 1. Starta Backend

```bash
cd C:\Users\robin\Documents\GitHub\CivicAI\backend
npm start
```

Backend ska nu köra på `http://localhost:3001`

### 2. Starta Ngrok (i ny terminal)

```bash
ngrok http 3001
```

Du kommer se något liknande:
```
Forwarding  https://prayerful-competently-beatrice.ngrok-free.dev -> http://localhost:3001
```

**Kopiera den https URL** som ngrok visar!

### 3. Skapa .env Fil för Functions

**VIKTIGT:** Skapa `.env` filen INNAN du deployar! Använd en texteditor (t.ex. Notepad, VS Code) för att skapa filen. PowerShell `echo` kan skapa fel encoding.

**Metod 1: Kopiera från exempel-filen (Rekommenderat)**

```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\functions

# Kopiera exempel-filen
copy .env.example .env

# Öppna i Notepad och ändra URL
notepad .env
```

I Notepad, ändra raden:
```
BACKEND_URL=https://your-backend-url.com
```
till din ngrok URL:
```
BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev
```

Spara filen som **UTF-8** (viktigt!).

**Metod 2: Använd Set-Content i PowerShell**

```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\functions

# Skapa .env fil med korrekt encoding
Set-Content -Path .env -Value "BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev" -Encoding UTF8 -NoNewline
```

**Metod 3: I VS Code eller annan editor**

Skapa en ny fil `functions/.env` och skriv:
```
BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev
```

**VERIFIERING - VIKTIGT:**

Innan du deployar, verifiera att filen existerar och är korrekt:

```powershell
# Kontrollera att filen finns
Test-Path functions\.env
# Ska visa: True

# Visa innehållet (ska INTE ha �� tecken)
Get-Content functions\.env -Encoding UTF8
# Ska visa: BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev

# Kontrollera att det inte finns BOM eller konstiga tecken
(Get-Content functions\.env -Raw).Length
# Ska visa ungefär samma längd som din URL + "BACKEND_URL="
```

**Viktigt:** Byt ut `https://prayerful-competently-beatrice.ngrok-free.dev` med DIN ngrok URL från steg 2!

### 4. Deploy Functions (från PROJECT ROOT, INTE functions/)

**FÖRE DEPLOYMENT - KRITISK VERIFIERING:**

```powershell
# Verifiera att .env filen finns OCH innehåller rätt URL
cd C:\Users\robin\Documents\GitHub\CivicAI

# Kolla att filen existerar
if (Test-Path functions\.env) {
    Write-Host "✓ .env filen finns" -ForegroundColor Green
    Write-Host "Innehåll:" -ForegroundColor Cyan
    Get-Content functions\.env
} else {
    Write-Host "✗ VARNING: .env filen saknas! Skapa den först!" -ForegroundColor Red
    exit
}
```

**Om verifieringen visar rätt URL, deployas:**

```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI
firebase deploy --only functions
```

**OBS:** 
- Du MÅSTE köra deployment från projekt root där `firebase.json` finns!
- `.env` filen MÅSTE finnas i `functions/.env` INNAN deployment!
- Firebase laddar `.env` automatiskt vid deployment

### 5. Verifiera Deployment

Kolla logs för att se att rätt URL används:

```bash
firebase functions:log --only onQuestionCreate
```

Du ska se:
```
Using backend URL: https://prayerful-competently-beatrice.ngrok-free.dev
```

### 6. Testa

1. Gå till din frontend
2. Ställ en fråga
3. Kolla Firebase Console > Firestore > `ai_interactions`
4. Öppna det senaste dokumentet
5. Verifiera att `errors` array är TOM (inga ECONNREFUSED errors)

## Felsökning

### Fel: Functions använder fortfarande localhost (ECONNREFUSED 127.0.0.1:3001)

**Symptom i logs:**
```
_currentUrl: 'http://localhost:3001/api/query'
code: 'ECONNREFUSED'
address: '127.0.0.1'
port: 3001
```

**Orsak:** `.env` filen laddades inte vid deployment. Detta händer om:
1. `.env` filen inte fanns i `functions/` directory vid deployment
2. `.env` filen skapades EFTER deployment
3. `.env` filen har fel format eller encoding

**Lösning:**

1. **Verifiera att .env filen finns och är korrekt:**
```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\functions

# Kolla att filen finns
if (Test-Path .env) {
    Write-Host "✓ Filen finns" -ForegroundColor Green
} else {
    Write-Host "✗ Filen saknas - skapa den!" -ForegroundColor Red
}

# Visa innehåll (ska inte ha �� tecken)
Get-Content .env -Encoding UTF8
# MÅSTE visa: BACKEND_URL=https://din-ngrok-url.ngrok-free.dev

# Kontrollera filstorlek (ska inte vara 0)
(Get-Item .env).Length
```

2. **Om filen saknas eller är fel, skapa den:**
```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\functions

# Ta bort felaktig fil om den finns
Remove-Item .env -ErrorAction SilentlyContinue

# Skapa ny med korrekt encoding
Set-Content -Path .env -Value "BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev" -Encoding UTF8 -NoNewline

# Verifiera
Get-Content .env -Encoding UTF8
```

3. **Deployas OM (kritiskt!):**

Den gamla deployments har inte `.env` filen. Du måste deployas om:

```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI

# Verifiera att .env finns INNAN deployment
Get-Content functions\.env

# Deploy
firebase deploy --only functions --force
```

**VIKTIGT:** Använd `--force` flaggan för att tvinga omdeployment även om koden inte ändrats!

4. **Verifiera deployment:**
```powershell
# Vänta 30 sekunder efter deployment, sedan kolla logs
Start-Sleep -Seconds 30
firebase functions:log --only onQuestionCreate

# Du ska NU se:
# "Using backend URL: https://prayerful-competently-beatrice.ngrok-free.dev"
# INTE "http://localhost:3001"
```

5. **Testa med en ny fråga:**
- Ställ en ny fråga i appen
- Kolla att INGA ECONNREFUSED errors dyker upp i logs

### Fel: "Invalid dotenv file, error on lines: ��BACKEND_URL=..."

**Problem:** `.env` filen har fel encoding (UTF-16 med BOM istället för UTF-8)

**Orsak:** PowerShell `echo` kommando skapar filer med UTF-16 LE BOM encoding som inte fungerar med dotenv

**Lösning:**

1. **Ta bort den felaktiga filen:**
```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI\functions
Remove-Item .env
```

2. **Skapa ny fil med korrekt encoding:**

**Alternativ A: Använd Set-Content (Rekommenderat för PowerShell)**
```powershell
Set-Content -Path .env -Value "BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev" -Encoding UTF8 -NoNewline
```

**Alternativ B: Kopiera från exempel och redigera**
```powershell
copy .env.example .env
notepad .env
# Ändra URL och spara som UTF-8
```

**Alternativ C: Skapa i VS Code**
- Öppna VS Code
- Skapa ny fil `functions/.env`
- Skriv: `BACKEND_URL=https://prayerful-competently-beatrice.ngrok-free.dev`
- Spara (VS Code använder automatiskt UTF-8)

3. **Verifiera att filen är korrekt:**
```powershell
Get-Content .env -Encoding UTF8
# Ska visa: BACKEND_URL=https://...
```

4. **Deploy igen:**
```powershell
cd C:\Users\robin\Documents\GitHub\CivicAI
firebase deploy --only functions
```

### Fel: "Not in a Firebase app directory"

**Problem:** Du försöker deploya från fel directory

**Lösning:** Se till att du är i projekt root:
```bash
cd C:\Users\robin\Documents\GitHub\CivicAI
# Verifiera att firebase.json finns
dir firebase.json
# Deploya
firebase deploy --only functions
```

### Fel: "ECONNREFUSED 127.0.0.1:3001"

**Problem:** Functions använder fortfarande localhost

**Lösning:** 
1. Verifiera att `functions/.env` existerar och har rätt URL
2. Verifiera att du deployat efter att skapat .env
3. Kolla logs: `firebase functions:log`

### Ngrok URL ändras när jag startar om ngrok

**Problem:** Gratis ngrok ger nya URLs varje gång

**Lösningar:**
1. **Snabbt fix:** Uppdatera `.env` med ny URL och deployas om
2. **Bättre:** Använd ngrok Pro för statiska URLs
3. **Bäst:** Deploya backend till en riktig server (Heroku, Railway, etc.)

## Migration från functions.config()

Om du tidigare använde `firebase functions:config:set`:

```bash
# Gammalt sätt (fungerar fortfarande men deprecated)
firebase functions:config:set backend.url="https://din-url.com"

# Nytt sätt (rekommenderat)
echo BACKEND_URL=https://din-url.com > functions/.env
```

Functions-koden stöder BÅDA under migration, men `.env` har prioritet.

## Summering av Ändringarna

**Vad har fixats:**
1. ✅ Lagt till `firebase.json` och `.firebaserc` (krävs för deployment)
2. ✅ Migrerat till `.env` istället för deprecated `functions.config()`
3. ✅ Lagt till localhost-detektion som failar med tydligt felmeddelande
4. ✅ Skapatmallar (`.env.example`, `.runtimeconfig.json.example`)
5. ✅ Omfattande dokumentation på svenska

**Vad du behöver göra:**
1. Skapa `functions/.env` med din ngrok URL
2. Deploy från projekt root: `firebase deploy --only functions`
3. Testa genom att ställa en fråga

## Support

Se detaljerade guider:
- [Migration Guide](docs/deployment/FIREBASE_FUNCTIONS_MIGRATION.md)
- [Fix Summary](docs/deployment/FIX_ECONNREFUSED_SUMMARY.md)
- [Deployment Guide](docs/deployment/FIREBASE_STEP2_DEPLOYMENT_GUIDE.md)
