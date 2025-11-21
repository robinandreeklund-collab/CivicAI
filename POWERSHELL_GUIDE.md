# PowerShell Guide för Firebase Setup (OQT-1.0)

Detta dokument beskriver hur du använder PowerShell-scripten för att sätta upp Firebase collections för OQT-1.0.

## Översikt

Vi har skapat **2 PowerShell-script** för Windows-användare:

1. **`setup_firebase.ps1`** - Visar collections, exporterar schema
2. **`create_collections.ps1`** - Detaljerad manual för skapning

## Varför inte automatisk skapning?

PowerShell kan inte direkt skapa Firestore collections via REST API utan komplex OAuth2-autentisering. Därför rekommenderar vi:

**ALTERNATIV 1 (ENKLAST): Använd Python-scriptet**
```powershell
# Aktivera virtual environment
.\venv\Scripts\Activate.ps1

# Kör Python-scriptet
python scripts/setup_firebase.py
```

**ALTERNATIV 2: PowerShell-script + Manuell skapning**

Se nedan för steg-för-steg guide.

---

## Använda setup_firebase.ps1

Detta script visar vilka collections som ska skapas och exporterar schema till JSON.

### Steg 1: Kör scriptet

```powershell
cd C:\path\to\CivicAI

# Kör setup script
.\scripts\setup_firebase.ps1
```

### Output:

```
================================================================
OQT-1.0 Firebase Setup Script (PowerShell)
================================================================

Detta script skapar endast nödvändiga collections baserat på
faktisk användning i projektet. Följande redundanta collections
har tagits bort:
  - questions (data finns i ai_interactions)
  - external_raw_responses (data finns i ai_interactions)
  ...

Found service account file: firebase-service-account.json

================================================================
Firebase Collections Setup
================================================================

Collections som ska skapas (6 st):

1. ai_interactions
   Syfte: Stores complete interaction data...
   Datatyp: Dokument med nested objekt

2. oqt_queries
   ...

Collection schema exporterat till: firebase-collections-schema.json
```

### Steg 2: Använd exporterad JSON

Scriptet skapar `firebase-collections-schema.json` som innehåller fullständig schema-information:

```powershell
# Visa schema
Get-Content firebase-collections-schema.json | ConvertFrom-Json | Format-List
```

---

## Använda create_collections.ps1

Detta script ger detaljerade instruktioner för att skapa collections manuellt i Firebase Console.

### Kör scriptet:

```powershell
.\scripts\create_collections.ps1
```

### Output:

```
================================================================
OQT-1.0 Firebase Collection Creator (REST API)
================================================================

REKOMMENDATION
================================================================

REKOMMENDERADE ALTERNATIV:

1. Använd Python-scriptet (ENKLAST):
   python scripts/setup_firebase.py

2. Skapa manuellt i Firebase Console:
   https://console.firebase.google.com/
   -> Firestore Database -> Start collection

Collections att skapa:

1. ai_interactions
   Unified lagring av frågor, råsvar från AI, och ML-analyser

2. oqt_queries
   Direkta frågor till OQT-1.0 från dashboard
   
...

Manual Creation Steps (Firebase Console)
================================================================

För varje collection ovan:

1. Gå till Firebase Console -> Firestore Database
2. Klicka 'Start collection'
3. Ange collection ID (t.ex. 'ai_interactions')
4. Lägg till ett sample dokument:
   Document ID: _sample
   Field: _sample (boolean) = true
   ...
```

---

## Manuell Skapning via Firebase Console

Om du väljer att skapa collections manuellt, följ dessa steg:

### Steg 1: Öppna Firebase Console

1. Gå till https://console.firebase.google.com/
2. Välj ditt projekt
3. Klicka på "Firestore Database" i menyn

### Steg 2: Skapa första collection

1. Klicka "Start collection" (om första gången) eller "+ Start collection"
2. Collection ID: `ai_interactions`
3. Klicka "Next"

### Steg 3: Lägg till sample dokument

**Document ID**: `_sample`

**Fields**:
- `_sample` (boolean): `true`
- `_description` (string): `Unified lagring av frågor, råsvar från AI, och ML-analyser`
- `_created` (timestamp): [Klicka "ADD" och välj "timestamp" → "now"]

4. Klicka "Save"

### Steg 4: Upprepa för alla 6 collections

Skapa på samma sätt:

1. ✅ **ai_interactions** - Unified lagring av frågor, råsvar från AI, och ML-analyser
2. ✅ **oqt_queries** - Direkta frågor till OQT-1.0 från dashboard
3. ✅ **oqt_training_events** - Loggning av träningssessioner
4. ✅ **oqt_metrics** - Prestationsmetriker över tid
5. ✅ **oqt_provenance** - Provenienshantering för transparens
6. ✅ **oqt_ledger** - Blockchain-stil immutable ledger

---

## Skapa Composite Indexes

Efter att collections är skapade, måste du skapa composite indexes för effektiva queries.

### Via Firebase Console:

1. Gå till Firestore Database → Indexes
2. Klicka "Create Index"
3. Välj collection och fields enligt nedan

### Indexes att skapa:

#### ai_interactions
- **Index 1**: `question.source` (Ascending), `timestamp` (Descending)
- **Index 2**: `timestamp` (Descending)

#### oqt_queries
- **Index 1**: `timestamp` (Descending)
- **Index 2**: `version` (Ascending), `timestamp` (Descending)

#### oqt_training_events
- **Index 1**: `type` (Ascending), `timestamp` (Descending)
- **Index 2**: `modelVersion` (Ascending), `timestamp` (Descending)

#### oqt_metrics
- **Index 1**: `version` (Ascending), `timestamp` (Descending)
- **Index 2**: `timestamp` (Descending)

#### oqt_provenance
- **Index 1**: `queryId` (Ascending)
- **Index 2**: `timestamp` (Descending)

#### oqt_ledger
- **Index 1**: `blockNumber` (Ascending)
- **Index 2**: `type` (Ascending), `timestamp` (Descending)

---

## Verifiera Installation

Efter att collections och indexes är skapade:

### Verifiera via Firebase Console

1. Gå till Firestore Database
2. Kontrollera att alla 6 collections finns
3. Gå till Indexes
4. Kontrollera att alla indexes är "Enabled" (gröna)

### Verifiera via PowerShell

```powershell
# Testa Firebase connection (kräver Python)
.\venv\Scripts\Activate.ps1

python -c "
import firebase_admin
from firebase_admin import credentials, firestore
cred = credentials.Certificate('firebase-service-account.json')
firebase_admin.initialize_app(cred)
db = firestore.client()
print('✓ Firebase connected')

# Lista collections
collections = db.collections()
for col in collections:
    print(f'  - {col.id}')
"
```

**Förväntat output**:
```
✓ Firebase connected
  - ai_interactions
  - oqt_queries
  - oqt_training_events
  - oqt_metrics
  - oqt_provenance
  - oqt_ledger
```

---

## Felsökning

### Problem: Service account file not found

**Lösning**:
```powershell
# Kontrollera att filen finns
Test-Path .\firebase-service-account.json

# Om False, ladda ner från Firebase Console:
# Project Settings -> Service Accounts -> Generate New Private Key
```

### Problem: PowerShell execution policy

**Lösning**:
```powershell
# Tillåt lokala scripts
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Eller kör med bypass
powershell -ExecutionPolicy Bypass -File .\scripts\setup_firebase.ps1
```

### Problem: Python inte installerat

**Lösning**:
```powershell
# Installera Python från python.org
# Eller använd manuell skapning via Firebase Console
```

---

## Sammanfattning

### Snabbaste metoden (Python):
```powershell
.\venv\Scripts\Activate.ps1
python scripts/setup_firebase.py
```

### PowerShell-metoden:
```powershell
# 1. Visa collections
.\scripts\setup_firebase.ps1

# 2. Se detaljerad manual
.\scripts\create_collections.ps1

# 3. Skapa manuellt i Firebase Console
# (följ instruktioner ovan)
```

### Verifiering:
```powershell
# Kör verifieringsskript (kräver WSL eller Git Bash)
bash scripts/verify_installation.sh

# Eller testa manuellt enligt VERIFICATION_GUIDE.md
```

---

## Nästa Steg

Efter Firebase setup:

1. ✅ Collections skapade
2. ✅ Indexes skapade
3. ⏭️ Konfigurera .env filer
4. ⏭️ Installera dependencies
5. ⏭️ Ladda ner modeller (optional)
6. ⏭️ Starta applikationen

Se `INSTALLATION_GUIDE.md` för fullständiga instruktioner.

---

**Frågor?** Se `OQT-1.0-README.md` för fullständig dokumentation.
