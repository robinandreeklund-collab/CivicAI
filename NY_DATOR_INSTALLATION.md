# 🚀 CivicAI Installation Guide - Ny Dator

**Komplett installationsguide för en helt ny dator från början!**

Denna guide går igenom allt du behöver installera från grunden för att köra CivicAI på en ny dator.

---

## 📋 Innehåll

1. [System Requirements](#1-system-requirements)
2. [Installera Grundläggande Verktyg](#2-installera-grundläggande-verktyg)
3. [Ladda Ner Projektet](#3-ladda-ner-projektet)
4. [Installera Python Dependencies](#4-installera-python-dependencies)
5. [Installera Node.js Dependencies](#5-installera-nodejs-dependencies)
6. [Konfigurera Firebase](#6-konfigurera-firebase)
7. [Konfigurera API-nycklar](#7-konfigurera-api-nycklar)
8. [Starta Applikationen](#8-starta-applikationen)
9. [Vanliga Problem och Lösningar](#9-vanliga-problem-och-lösningar)

---

## 1. System Requirements

### Minimum:
- **OS**: Windows 10/11, macOS 12+, eller Ubuntu 20.04+
- **RAM**: 16GB
- **Lagring**: 60GB ledigt utrymme
- **CPU**: 4 kärnor

### Rekommenderat:
- **RAM**: 32GB
- **GPU**: NVIDIA GPU med 12GB+ VRAM (för snabbare AI-inferens)
- **Lagring**: SSD med 100GB+ ledigt utrymme

---

## 2. Installera Grundläggande Verktyg

### A. Git (versionshantering)

**Windows:**
1. Ladda ner från: https://git-scm.com/download/win
2. Kör installationsprogrammet
3. Använd standardinställningar (tryck bara "Next")
4. Verifiera installation:
   ```powershell
   git --version
   ```

**macOS:**
```bash
# Installera via Homebrew (om du inte har Homebrew, installera det först från https://brew.sh)
brew install git

# Verifiera installation
git --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install git

# Verifiera installation
git --version
```

---

### B. Python 3.10+

**Windows:**
1. Ladda ner från: https://www.python.org/downloads/
2. **VIKTIGT**: Bocka i "Add Python to PATH" under installationen!
3. Kör installationsprogrammet
4. Verifiera installation:
   ```powershell
   python --version
   pip --version
   ```

**macOS:**
```bash
# Installera via Homebrew
brew install python@3.11

# Verifiera installation
python3 --version
pip3 --version
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install python3.11 python3.11-venv python3-pip

# Verifiera installation
python3 --version
pip3 --version
```

---

### C. Node.js 18+ och npm

**Windows:**
1. Ladda ner LTS-version från: https://nodejs.org/
2. Kör installationsprogrammet (standardinställningar)
3. Verifiera installation:
   ```powershell
   node --version
   npm --version
   ```

**macOS:**
```bash
# Installera via Homebrew
brew install node@18

# Verifiera installation
node --version
npm --version
```

**Linux (Ubuntu/Debian):**
```bash
# Installera Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verifiera installation
node --version
npm --version
```

---

### D. Visual Studio Code (Valfritt men rekommenderat)

För att redigera kod och filer:

1. Ladda ner från: https://code.visualstudio.com/
2. Installera med standardinställningar
3. Installera rekommenderade extensions:
   - Python
   - ESLint
   - Prettier
   - GitLens

---

## 3. Ladda Ner Projektet

### Öppna en terminal/kommandotolk:

**Windows:** Högerklicka på skrivbordet → "Open in Terminal" eller sök efter "PowerShell"

**macOS:** Öppna Terminal från Applications → Utilities

**Linux:** Tryck Ctrl+Alt+T

### Klona projektet:

```bash
# Navigera till önskad mapp (t.ex. Documents)
cd Documents

# Klona projektet
git clone https://github.com/robinandreeklund-collab/CivicAI.git

# Gå in i projektmappen
cd CivicAI
```

**✅ Du är nu i projektmappen!** Alla kommandon nedan ska köras från denna mapp.

---

## 4. Installera Python Dependencies

### Steg 1: Skapa Virtual Environment

**Windows:**
```powershell
# Skapa virtual environment
python -m venv venv

# Aktivera virtual environment
.\venv\Scripts\Activate.ps1

# Om du får ett felmeddelande om execution policy, kör först:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**macOS/Linux:**
```bash
# Skapa virtual environment
python3 -m venv venv

# Aktivera virtual environment
source venv/bin/activate
```

**✅ Virtual environment är nu aktiverat!** Du ser `(venv)` före din kommandorad.

---

### Steg 2: Installera Python-paket

Det finns två alternativ:

#### Alternativ A: Minimal Installation (Rekommenderas för testning)

Ingen modellnedladdning krävs. Systemet körs med simulerade svar.

```bash
# Uppgradera pip
pip install --upgrade pip

# Installera minimal requirements
pip install -r requirements-minimal.txt
```

#### Alternativ B: Full Installation (För riktiga AI-modeller)

Kräver ~30GB nedladdning för Mistral 7B och LLaMA-2.

**Steg 1 - Installera PyTorch FÖRST:**

**För GPU (NVIDIA med CUDA):**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**För CPU-only:**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

**Steg 2 - Installera övriga paket:**
```bash
pip install -r requirements.txt
```

---

### Steg 3: Verifiera Installation

```bash
# Testa att viktiga paket är installerade
python -c "import fastapi; import firebase_admin; print('✓ Python packages OK')"
```

---

## 5. Installera Node.js Dependencies

**⚠️ VIKTIGT:** Du behöver INTE ha virtual environment aktiverat för Node.js-kommandon!

### Installera backend dependencies:

```bash
# Gå till backend-mappen
cd backend

# Installera paket
npm install

# Gå tillbaka till projektmappen
cd ..
```

### Installera frontend dependencies:

```bash
# Gå till frontend-mappen
cd frontend

# Installera paket
npm install

# Gå tillbaka till projektmappen
cd ..
```

**✅ Alla Node.js-paket är nu installerade!**

---

## 6. Konfigurera Firebase

### Steg 1: Skapa Firebase-projekt

1. Gå till: https://console.firebase.google.com/
2. Klicka på "Add project"
3. Ge projektet ett namn (t.ex. "CivicAI-Test")
4. Följ guiden (du kan hoppa över Google Analytics om du vill)

### Steg 2: Aktivera Firestore Database

1. I Firebase Console, gå till "Build" → "Firestore Database"
2. Klicka "Create database"
3. Välj "Start in test mode" (för utveckling)
4. Välj en region (t.ex. europe-west3)

### Steg 3: Ladda ner Service Account Key

1. Gå till "Project Settings" (kugghjulet uppe till vänster)
2. Välj "Service accounts" tab
3. Klicka "Generate new private key"
4. Spara filen som `firebase-service-account.json` i **projektets rotmapp** (CivicAI/)

**⚠️ VIKTIGT:** Denna fil innehåller känslig information. Dela den ALDRIG!

### Steg 4: Skapa Firebase Collections

**Med virtual environment aktiverat:**

**Windows:**
```powershell
# Aktivera venv om inte redan aktivt
.\venv\Scripts\Activate.ps1

# Skapa collections
python scripts/setup_firebase.py
```

**macOS/Linux:**
```bash
# Aktivera venv om inte redan aktivt
source venv/bin/activate

# Skapa collections
python scripts/setup_firebase.py
```

Detta skapar 6 essentiella collections:
- `ai_interactions` - Lagrar frågor och AI-svar
- `oqt_queries` - ONESEEK frågor
- `oqt_training_events` - Träningshändelser
- `oqt_metrics` - Prestationsmått
- `oqt_provenance` - Spårbarhet
- `oqt_ledger` - Transparens-logg

---

## 7. Konfigurera API-nycklar

### Steg 1: Skapa .env-filer

**Windows:**
```powershell
# Kopiera exempel-filer
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

**macOS/Linux:**
```bash
# Kopiera exempel-filer
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Steg 2: Redigera backend/.env

Öppna filen `backend/.env` i en textredigerare och uppdatera:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Firebase Configuration - UPPDATERA DESSA!
FIREBASE_PROJECT_ID=ditt-projekt-id
FIREBASE_SERVICE_ACCOUNT_PATH=../firebase-service-account.json

# API Keys för Externa AI-tjänster (Valfritt)
OPENAI_API_KEY=din-openai-nyckel
GEMINI_API_KEY=din-gemini-nyckel
DEEPSEEK_API_KEY=din-deepseek-nyckel
XAI_API_KEY=din-xai-nyckel

# Tavily API Key (för websök)
TAVILY_API_KEY=din-tavily-nyckel
```

**Var hittar jag API-nycklar?**

- **OpenAI**: https://platform.openai.com/api-keys
- **Google Gemini**: https://aistudio.google.com/app/apikey
- **DeepSeek**: https://platform.deepseek.com/
- **xAI (Grok)**: https://console.x.ai/
- **Tavily**: https://tavily.com/

**💡 Tips:** Du kan hoppa över externa API-nycklar för nu och lägga till dem senare.

### Steg 3: Redigera frontend/.env

Öppna filen `frontend/.env` och uppdatera:

```env
VITE_API_URL=http://localhost:3001

# Firebase Configuration för frontend (hitta i Firebase Console)
VITE_FIREBASE_API_KEY=din-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=ditt-projekt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ditt-projekt-id
```

**Var hittar jag Firebase frontend-uppgifter?**

1. Gå till Firebase Console
2. Klicka på kugghjulet → "Project settings"
3. Scrolla ner till "Your apps"
4. Om du inte har en web app: Klicka "</>" för att skapa en
5. Kopiera värdena från "Firebase SDK snippet"

---

## 8. Starta Applikationen

Du behöver **3 separata terminaler/kommandotolkar** öppna samtidigt.

### Terminal 1: Python ML Service

**Windows:**
```powershell
# Gå till projektmappen
cd C:\path\to\CivicAI

# Aktivera virtual environment
.\venv\Scripts\Activate.ps1

# Starta ML service
python ml_service/server.py
```

**macOS/Linux:**
```bash
# Gå till projektmappen
cd ~/Documents/CivicAI

# Aktivera virtual environment
source venv/bin/activate

# Starta ML service
python ml_service/server.py
```

**✅ Förväntad output:**
```
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
Starting ML Service...
Device: cuda (eller cpu)
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

**⚠️ Låt denna terminal vara öppen!**

---

### Terminal 2: Node.js Backend

**Öppna en NY terminal/PowerShell**

**Windows:**
```powershell
# Gå till projektmappen
cd C:\path\to\CivicAI\backend

# Starta backend
npm run dev
```

**macOS/Linux:**
```bash
# Gå till projektmappen
cd ~/Documents/CivicAI/backend

# Starta backend
npm run dev
```

**✅ Förväntad output:**
```
> backend@1.0.0 dev
> nodemon index.js

[nodemon] starting `node index.js`
Server running on port 3001
```

**⚠️ Låt denna terminal vara öppen!**

---

### Terminal 3: React Frontend

**Öppna en NY terminal/PowerShell**

**Windows:**
```powershell
# Gå till projektmappen
cd C:\path\to\CivicAI\frontend

# Starta frontend
npm run dev
```

**macOS/Linux:**
```bash
# Gå till projektmappen
cd ~/Documents/CivicAI/frontend

# Starta frontend
npm run dev
```

**✅ Förväntad output:**
```
  VITE v5.4.21  ready in 324 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**⚠️ Låt denna terminal vara öppen!**

---

### Öppna Applikationen i Webbläsaren

När alla tre terminaler visar att de körs, öppna din webbläsare och gå till:

**Huvudsida:** http://localhost:5173

**OQT Dashboard (ONESEEK chat):** http://localhost:5173/oqt-dashboard

**Compare Mode:** http://localhost:5173/7b-zero

**Admin Dashboard:** http://localhost:5173/admin

---

## 9. Vanliga Problem och Lösningar

### Problem: "Python is not recognized as a command"

**Lösning (Windows):**
1. Kontrollera att Python är installerat: Sök efter "Python" i Start-menyn
2. Lägg till Python i PATH:
   - Högerklicka på "This PC" → Properties
   - Advanced system settings → Environment Variables
   - Under "System variables", hitta "Path" och klicka Edit
   - Lägg till: `C:\Users\DittNamn\AppData\Local\Programs\Python\Python311\`
   - Lägg också till: `C:\Users\DittNamn\AppData\Local\Programs\Python\Python311\Scripts\`
3. Starta om terminalen

---

### Problem: "Port 3001 is already in use"

**Lösning:**

**Windows:**
```powershell
# Hitta och stoppa processen
netstat -ano | findstr :3001
taskkill /PID <process-id> /F
```

**macOS/Linux:**
```bash
# Hitta och stoppa processen
lsof -ti:3001 | xargs kill -9
```

---

### Problem: "Cannot activate virtual environment"

**Lösning (Windows PowerShell):**
```powershell
# Tillåt script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Försök aktivera igen
.\venv\Scripts\Activate.ps1
```

**Lösning (Windows cmd):**
```cmd
# Använd cmd istället för PowerShell
venv\Scripts\activate.bat
```

---

### Problem: "Firebase Admin SDK error"

**Lösning:**
1. Kontrollera att `firebase-service-account.json` finns i projektmappen
2. Verifiera att filen inte är korrupt (öppna i textredigerare, ska vara JSON)
3. Kontrollera att `FIREBASE_SERVICE_ACCOUNT_PATH` i backend/.env pekar rätt
4. Testa Firebase-anslutning:
   ```bash
   # Aktivera venv först
   python -c "import firebase_admin; from firebase_admin import credentials; cred = credentials.Certificate('firebase-service-account.json'); print('✓ Firebase OK')"
   ```

---

### Problem: "Module not found" errors

**Lösning:**
```bash
# Kontrollera att du är i rätt mapp
pwd  # macOS/Linux
cd  # Windows

# Reinstallera dependencies
# För Python (med venv aktiverat):
pip install -r requirements.txt

# För Node.js (gå till rätt mapp först):
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### Problem: "Out of memory" eller långsam prestanda

**Lösning:**

1. **Använd CPU-only mode** (om du inte har kraftig GPU):
   ```bash
   # I backend/.env, ändra eller lägg till:
   USE_GPU=false
   ```

2. **Stäng andra program** som använder mycket RAM

3. **Använd minimal installation** istället för full:
   ```bash
   pip install -r requirements-minimal.txt
   ```

---

## 🎉 Klart!

Om allt fungerar ser du nu:
- ✅ Python ML Service körs på http://localhost:5000
- ✅ Node.js Backend körs på http://localhost:3001
- ✅ React Frontend körs på http://localhost:5173
- ✅ Applikationen går att öppna i webbläsaren

### Nästa steg:

1. **Utforska applikationen:**
   - Prova Compare Mode (http://localhost:5173/7b-zero)
   - Testa Live Debate funktionen
   - Kolla Admin Dashboard

2. **Läs mer dokumentation:**
   - [README.md](README.md) - Översikt och features
   - [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) - Detaljerad installation
   - [OQT-1.0-README.md](OQT-1.0-README.md) - ONESEEK dokumentation

3. **Konfigurera API-nycklar:**
   - Lägg till externa AI-tjänsters nycklar i backend/.env
   - Testa jämförelseläget med flera AI-modeller

---

## 🆘 Behöver du mer hjälp?

- **Dokumentation**: Kolla mappen `docs/` för detaljerad information
- **GitHub Issues**: https://github.com/robinandreeklund-collab/CivicAI/issues
- **Discord**: [Länk till Discord server om sådan finns]

---

**Lycka till med CivicAI!** 🚀
