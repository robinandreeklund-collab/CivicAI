# Firebase Collections Setup - Windows PowerShell Guide

## För Windows-användare 🪟

Detta är en komplett guide för att köra Firebase collections setup-scriptet i Windows PowerShell.

---

## Snabbstart

### Steg 1: Öppna PowerShell som Administrator

1. Tryck `Win + X`
2. Välj **"Windows PowerShell (Admin)"** eller **"Terminal (Admin)"**
3. Klicka **"Ja"** när UAC frågar om tillstånd

### Steg 2: Navigera till projektmappen

```powershell
cd C:\path\to\CivicAI
```

**Exempel:**
```powershell
cd C:\Users\dittnamn\Documents\CivicAI
```

### Steg 3: Tillåt script-körning (om nödvändigt)

PowerShell kräver ofta att du tillåter script-körning:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Svara **"Y"** (Yes) när du blir tillfrågad.

### Steg 4: Kör scriptet

**REKOMMENDERAT: Använd simplified script**
```powershell
.\scripts\firebase-init-collections-simple.ps1
```

**Alternativ: Original script**
```powershell
.\scripts\firebase-init-collections.ps1
```

> **💡 Tips:** Om du får parse errors (syntax errors), använd den simplified versionen.

### Steg 5: Följ instruktionerna

Scriptet kommer att:
1. Fråga efter din service account key-fil
2. Fråga efter ditt Firebase Project ID
3. Installera firebase-admin (om nödvändigt)
4. Skapa alla 6 collections

---

## Förberedelser

### Installera Node.js och npm

**Ladda ner från:** https://nodejs.org/

Välj LTS-versionen (rekommenderat).

**Verifiera installation:**
```powershell
node --version
npm --version
```

### Installera Firebase CLI

```powershell
npm install -g firebase-tools
```

**Verifiera:**
```powershell
firebase --version
```

### Logga in på Firebase (Valfritt)

```powershell
firebase login
```

Detta öppnar en webbläsare där du loggar in med ditt Google-konto.

> **📝 Obs:** Firebase CLI-inloggning är inte strikt nödvändig för collection setup eftersom scriptet använder service account key direkt. Men det kan vara användbart för andra Firebase-kommandon.

---

## ⚠️ Viktigt: Aktivera Firestore Database

**INNAN du kör scriptet måste Firestore vara aktiverat i ditt Firebase-projekt!**

### Kontrollera och aktivera Firestore

**Steg 1:** Gå till Firestore i Firebase Console:
```
https://console.firebase.google.com/project/DITT-PROJECT-ID/firestore
```

**Steg 2:** Om Firestore inte är aktiverat:
1. Klicka **"Create database"**
2. Välj **"Start in production mode"** (rekommenderat) eller **"Test mode"** (för utveckling)
3. Välj en location (t.ex. `europe-west1` för Europa)
4. Klicka **"Enable"**
5. Vänta ~1 minut medan databasen skapas

**Steg 3:** Verifiera att Firestore är aktivt:
- Du bör se Firestore-gränssnittet med möjlighet att skapa collections
- Om du ser "Create database"-knappen är Firestore INTE aktiverat ännu

### Vanligt fel

Om du kör scriptet UTAN att aktivera Firestore får du detta fel:
```
ERROR: ai_interactions - 5 NOT_FOUND:
ERROR: Firestore database not found!

ACTION REQUIRED:
1. Go to: https://console.firebase.google.com/project/your-project/firestore
2. Click "Create database"
```

**Lösning:** Följ instruktionerna ovan för att aktivera Firestore först.

---

## Hämta Service Account Key

### Steg 1: Gå till Firebase Console

Öppna i din webbläsare: https://console.firebase.google.com

### Steg 2: Välj projekt och hämta nyckel

1. Klicka på ditt projekt
2. Klicka på kugghjulet ⚙️ → **"Project settings"**
3. Gå till fliken **"Service accounts"**
4. Klicka **"Generate new private key"**
5. Klicka **"Generate key"** i dialogen
6. En JSON-fil laddas ner

### Steg 3: Flytta filen till en säker plats

**Rekommendation:** Spara INTE i projektmappen (säkerhetsrisk!)

```powershell
# Skapa en mapp för Firebase-nycklar
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.firebase-keys"

# Flytta den nedladdade filen dit
Move-Item "$env:USERPROFILE\Downloads\*firebase-adminsdk*.json" "$env:USERPROFILE\.firebase-keys\"
```

**Sökväg blir:**
```
C:\Users\dittnamn\.firebase-keys\civicai-prod-firebase-adminsdk-abc123.json
```

---

## Köra Scriptet - Detaljerat

### Alternativ 1: Kör direkt med PowerShell-scriptet

```powershell
# Navigera till projektet
cd C:\path\to\CivicAI

# Kör scriptet
.\scripts\firebase-init-collections.ps1
```

**När scriptet frågar efter service account key:**
```
Enter the path to your service account key JSON file: C:\Users\dittnamn\.firebase-keys\serviceAccountKey.json
```

**När scriptet frågar efter Project ID:**
```
Enter your Firebase Project ID: civicai-prod
```

### Alternativ 2: Sätt environment variable först

```powershell
# Sätt credentials för denna PowerShell-session
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\dittnamn\.firebase-keys\serviceAccountKey.json"

# Kör scriptet
.\scripts\firebase-init-collections.ps1
```

### Alternativ 3: Permanent environment variable

**Genom GUI:**
1. Högerklicka på **"This PC"** → **"Properties"**
2. Klicka **"Advanced system settings"**
3. Klicka **"Environment Variables"**
4. Under **"User variables"**, klicka **"New"**
5. Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
6. Variable value: `C:\Users\dittnamn\.firebase-keys\serviceAccountKey.json`
7. Klicka **OK**
8. Starta om PowerShell

**Genom PowerShell (kräver admin):**
```powershell
[Environment]::SetEnvironmentVariable(
    "GOOGLE_APPLICATION_CREDENTIALS",
    "C:\Users\dittnamn\.firebase-keys\serviceAccountKey.json",
    "User"
)
```

---

## Felsökning

### Problem: Parse Errors / Syntax Errors

**Fullständigt fel:**
```
At C:\...\firebase-init-collections.ps1:17 char:1
+ } else {
+ ~
Unexpected token '}' in expression or statement.
```

**Orsak:** 
- Unix line endings (LF) istället för Windows (CRLF)
- Inkompatibilitet mellan olika PowerShell-versioner

**Lösning 1: Använd Simplified Script (REKOMMENDERAT)**
```powershell
.\scripts\firebase-init-collections-simple.ps1
```

Den simplified versionen är garanterat kompatibel med alla PowerShell-versioner.

**Lösning 2: Fixa Line Endings**
```powershell
# Läs och skriv filen för att konvertera line endings
(Get-Content scripts\firebase-init-collections.ps1) | Set-Content -Path scripts\firebase-init-collections.ps1
```

**Lösning 3: Använd PowerShell Core**
```powershell
# Installera PowerShell Core (pwsh) från Microsoft Store eller
# https://github.com/PowerShell/PowerShell/releases

pwsh -File scripts\firebase-init-collections.ps1
```

### Problem: "Cannot be loaded because running scripts is disabled"

**Fullständigt fel:**
```
.\scripts\firebase-init-collections.ps1 : File C:\path\to\firebase-init-collections.ps1 
cannot be loaded because running scripts is disabled on this system.
```

**Lösning:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problem: "firebase : The term 'firebase' is not recognized"

**Lösning:**
```powershell
npm install -g firebase-tools
```

Starta om PowerShell efter installationen.

### Problem: "node : The term 'node' is not recognized"

**Lösning:**
1. Installera Node.js från https://nodejs.org/
2. Starta om PowerShell
3. Verifiera: `node --version`

### Problem: Path med mellanslag

Om din sökväg har mellanslag, använd citattecken:

```powershell
cd "C:\Users\My Name\Documents\CivicAI"
```

För service account key:
```
C:\Users\My Name\.firebase-keys\serviceAccountKey.json
```

### Problem: "Failed to install firebase-admin"

**Lösning 1:** Installera globalt först
```powershell
npm install -g firebase-admin
```

**Lösning 2:** Kör PowerShell som Administrator
```powershell
# Högerklicka på PowerShell → "Run as Administrator"
npm install -g firebase-admin
```

**Lösning 3:** Rensa npm cache
```powershell
npm cache clean --force
npm install -g firebase-admin
```

### Problem: "5 NOT_FOUND" eller "Firestore database not found"

**Fullständigt fel:**
```
[5/5] Creating collections...
  ERROR: ai_interactions - 5 NOT_FOUND:
  ERROR: model_versions - 5 NOT_FOUND:
  ERROR: Cannot access Firestore!
```

**Detta fel har FLERA möjliga orsaker:**

#### Orsak 1: Firestore inte aktiverat

**Kontrollera:** Gå till Firebase Console:
```
https://console.firebase.google.com/project/DITT-PROJECT-ID/firestore
```

**Lösning om du ser "Create database":**
1. Klicka **"Create database"**
2. Välj **"Start in production mode"** (rekommenderat)
3. Välj location (t.ex. `europe-west1`)
4. Klicka **"Enable"**
5. Vänta ~1 minut
6. Kör scriptet igen

#### Orsak 2: Fel Project ID

**Kontrollera:** Project Settings → Project ID i Firebase Console

**Symptom:** Du har skapat Firestore MEN får ändå "NOT_FOUND"

**Lösning:**
1. Öppna Firebase Console: https://console.firebase.google.com
2. Klicka Project Settings (⚙️)
3. Kopiera rätt **"Project ID"** (INTE "Project name")
4. Exempel:
   - ✅ Rätt: `my-app-abc123`
   - ❌ Fel: `My App`
5. Kör scriptet igen med korrekt Project ID

#### Orsak 3: Service Account saknar behörigheter

**Symptom:** Firestore finns OCH Project ID är korrekt, men fortfarande fel

**Lösning:**
1. Gå till Google Cloud Console IAM:
   ```
   https://console.cloud.google.com/iam-admin/iam?project=DITT-PROJECT-ID
   ```

2. Hitta din service account email (från JSON-filen)
   - T.ex. `firebase-adminsdk-xxxxx@projekt-id.iam.gserviceaccount.com`

3. Klicka på "Edit" (penna-ikonen) vid service account

4. Lägg till en av dessa roller:
   - **"Cloud Datastore User"** (minst behörighet)
   - **"Firebase Admin"** (rekommenderat)
   - **"Editor"** (mest behörighet)

5. Klicka **"Save"**

6. Vänta 1-2 minuter (permissions uppdatering)

7. Kör scriptet igen

#### Orsak 4: Datastore mode istället för Firestore Native mode

**Symptom:** Du har "skapat database" men får fortfarande fel

**Kontrollera:**
1. Gå till: https://console.cloud.google.com/datastore/entities
2. Om du ser text om "Datastore mode", har du fel typ av database

**Lösning:**
- Du kan INTE konvertera mellan Datastore och Firestore
- Du måste skapa ett nytt Firebase-projekt med Firestore Native mode
- Eller: Använd manuell collection-skapning istället för scriptet

**Verifiering efter fix:**
- Gå till Firestore i Console
- Du bör se ett database-gränssnitt (inte "Create database"-knapp)
- Scriptet visar nu tydliga error messages som hjälper dig identifiera problemet

---

## Alternativa Metoder

### Metod 1: Använd WSL (Windows Subsystem for Linux)

Om du har WSL installerat kan du köra bash-scriptet:

```bash
# I WSL-terminal
cd /mnt/c/path/to/CivicAI
./scripts/firebase-init-collections.sh
```

### Metod 2: Använd Git Bash

Om du har Git för Windows installerat:

```bash
# I Git Bash
cd /c/path/to/CivicAI
./scripts/firebase-init-collections.sh
```

### Metod 3: Manuell Node.js-körning

```powershell
# Sätt credentials
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\serviceAccountKey.json"

# Kör Node.js direkt (kräver att du skapat ett Node.js script)
cd scripts
node init-collections-manual.js your-project-id
```

---

## Verifiering

### Kontrollera att collections skapades

1. Öppna Firebase Console: https://console.firebase.google.com
2. Välj ditt projekt
3. Gå till **Firestore Database**
4. Du bör se 6 collections:
   - ✅ ai_interactions
   - ✅ model_versions
   - ✅ ledger_blocks
   - ✅ change_events
   - ✅ users
   - ✅ audit_logs

### Testa backend-anslutning

```powershell
cd backend
npm start
```

I en annan PowerShell-terminal:
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

---

## Tips för Windows

### PowerShell vs Command Prompt

**Använd PowerShell!** Inte Command Prompt (cmd.exe).

PowerShell har bättre stöd för:
- Environment variables
- Felhantering
- Moderna kommandon

### Sökvägar i Windows

Windows använder backslash (`\`) men många kommandon accepterar också forward slash (`/`):

```powershell
# Båda fungerar
cd C:\Users\Name\Documents
cd C:/Users/Name/Documents
```

### Tab-completion

Tryck `Tab` för att auto-komplettera sökvägar:

```powershell
cd C:\Users\Na[TAB]
# Blir: cd C:\Users\Name\
```

### Kopiera/klistra in i PowerShell

- **Kopiera:** Markera text → Högerklick
- **Klistra in:** Högerklick i PowerShell-fönstret

Eller använd `Ctrl+C` och `Ctrl+V` i Windows Terminal.

---

## Säkerhet

### Skydda din service account key

```powershell
# Se filrättigheter
Get-Acl C:\Users\Name\.firebase-keys\serviceAccountKey.json | Format-List

# Lägg ALDRIG i Git
# Kontrollera att .gitignore inkluderar:
*.json
.firebase-keys/
```

### Lägg ALDRIG nyckeln i projektmappen

```powershell
# DÅLIGT (lätt att råka commita)
C:\path\to\CivicAI\serviceAccountKey.json

# BRA (utanför projektet)
C:\Users\Name\.firebase-keys\serviceAccountKey.json
```

---

## Snabbreferens

```powershell
# Installation
npm install -g firebase-tools
firebase login

# Sätt credentials
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\key.json"

# Kör script
cd C:\path\to\CivicAI
.\scripts\firebase-init-collections.ps1

# Verifiera
firebase projects:list
curl http://localhost:3001/api/firebase/status
```

---

## Support

### Fortfarande problem?

**Debug-läge:**
```powershell
# Kör med verbose output
$VerbosePreference = "Continue"
.\scripts\firebase-init-collections.ps1
```

**Spara log:**
```powershell
.\scripts\firebase-init-collections.ps1 2>&1 | Tee-Object -FilePath setup-log.txt
```

**Resurser:**
- PowerShell guide: https://docs.microsoft.com/en-us/powershell/
- Firebase dokumentation: https://firebase.google.com/docs
- Node.js för Windows: https://nodejs.org/

---

**Lycka till med setup! 🚀**

Om du följer denna guide bör du kunna köra Firebase collections setup utan problem i Windows PowerShell.
