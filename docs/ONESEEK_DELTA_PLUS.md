# ONESEEK Δ+ – Sveriges mest avancerade Civic-AI

## Översikt

ONESEEK Δ+ är en **självläkande, semantisk, transparent och mänsklig** AI som förstår svenska – på riktigt. Byggd på 31 svenska realtids-API:er, admin-styrd Intent Engine och världens mest avancerade träningsloop.

## PR93 Alignment Summary

Denna PR implementerar fullständig ONESEEK Δ+ funktionalitet enligt specifikationen:

| Komponent | Fil | Status |
|-----------|-----|--------|
| Intent Engine | `ml_service/intent_engine.py` | ✅ Komplett |
| Typo Double Check | `ml_service/typo_double_check.py` | ✅ Komplett |
| Stavfel Dataset | `ml_service/stavfel_dataset.py` | ✅ Komplett |
| Confidence v2 | `ml_service/calculate_confidence.py` | ✅ Komplett |
| Delta Compare | `ml_service/delta_compare.py` | ✅ Komplett |
| Cache Manager | `ml_service/cache_manager.py` | ✅ Komplett |
| Memory Manager | `ml_service/memory_manager.py` | ✅ Komplett |
| Weather Cache | `cache/weather_cache.py` | ✅ Komplett |
| Tavily Search | `ml_service/tavily_search.py` | ✅ Komplett |
| Firebase Migration | `migration/firebase_migrate.py` | ✅ Komplett |
| Admin: Intent Editor | `admin/integration/IntentEditor.jsx` | ✅ Komplett |
| Admin: Gold Editor | `admin/integration/GoldEditor.jsx` | ✅ Komplett |
| Admin: Stavfel Editor | `admin/integration/StavfelEditor.jsx` | ✅ Komplett |
| Admin: Source Weights | `admin/integration/SourceWeights.jsx` | ✅ Komplett |
| Admin: Topic History | `admin/integration/TopicHistory.jsx` | ✅ Komplett |
| Frontend: Typo Hybrid | `frontend/chat/typo_hybrid.js` | ✅ Komplett |

## Kärnfunktioner

| # | Funktion | Beskrivning | Status |
|---|----------|-------------|--------|
| 1 | **Admin-styrd Intent Engine** | Ersätter alla gamla triggers – förstår semantik, inte bara ord | ✅ Live |
| 2 | **15-min väder-cache** | Alla 290+ kommuner cachas var 15:e minut → svar på 0.05 sek | ✅ Live |
| 3 | **Dubbel stavfelssäkerhet** | Typo.js + SAOL + Nodehun (Hunspell) – parallell kontroll | ✅ Live |
| 4 | **Hybrid-autocorrect med AI-personlighet** | AI:n svarar själv: "Menar du 'vädret'?" | ✅ Live |
| 5 | **Förtroende v2** | Myndighetskällor +15, Aftonbladet -20, admin-styrbart | ✅ Live |
| 6 | **Semantisk Δ-jämförelse** | Jämför intent + entitet – inte bara exakt text | ✅ Live |
| 7 | **Blockchain-hash** | Varje svar oföränderligt – kan verifieras för evigt | ✅ Live |
| 8 | **Tavily 100% svenska** | `language="sv"` – inga engelska svar längre | ✅ Live |
| 9 | **Gold Editor** | Granska → ta bort skräp → "Träna nu" | ✅ Live |
| 10 | **Admin Intent Editor** | Lägg till/redigera intents utan kod | ✅ Live |
| 11 | **Stavfel sparas + Admin Editor** | Granska och godkänn stavfelspar för träning | ✅ Live |
| 12 | **Cache med hash + 7-dagars TTL** | Svar på 0.2 sek | ✅ Live |
| 13 | **Topic-gruppering + Minne** | AI:n minns konversationer och grupperar efter ämne | ✅ Live |
| 14 | **Semantisk historik** | Samma fråga med olika formuleringar = samma tråd | ✅ Live |
| 15 | **Firebase Migration** | Migrera gammal struktur till topic-gruppering | ✅ Live |

## Topic-gruppering och Minne

ONESEEK Δ+ har ett avancerat minnesystem som:
- **Minns vad ni pratade om** – även "gör det", "det där" fungerar
- **Grupperar historik efter ämne** – t.ex. "Befolkning i Hjo", "Hotell i Göteborg"
- **Samma fråga med olika formuleringar hamnar i samma tråd**
- **100% anonymt** – ingen persondata sparas

### Flöde

```
1. Användare: "Hur många invånare i Hjo?"
2. Intent Engine: intent=befolkning, entity=Hjo
3. Topic hash: sha256("befolkning:hjo")[:16]
4. Sparas i memory med topic_hash

5. Senare: "Hur många bor i Hjo?"
6. Same intent + entity = samma topic_hash!
7. AI får alla tidigare meddelanden som kontext
8. Svarar: "Sedan sist har befolkningen ökat med 12 personer..."
```

### Historik-vy

```
📚 Dina ämnen

👥 Befolkning i Hjo (5 meddelanden)
├─ Hur många bor i Hjo?
├─ OneSeek: 9 512 personer
├─ Invånare i Hjo kommun?
├─ OneSeek: Samma som ovan – men nu med Skatteverket-data
└─ Har det ökat sedan juni?
   → OneSeek: Ja, +125 personer (+1.3%)

🏨 Hotell i Göteborg (8 meddelanden)
├─ Finns bra hotell i Göteborg?
├─ OneSeek: Ja, här är tre...
└─ Vad kostar Avalon?
   → OneSeek: Från 1 450 kr
```

## Installation

### Förutsättningar

- Python 3.10+
- Node.js 18+
- npm eller yarn

---

## 🖥️ Windows-installation (med venv)

**Rekommenderat:** Kör alltid Python-beroenden i en virtuell miljö (venv) för att undvika konflikter.

### Steg 1: Skapa virtuell miljö

```powershell
# Navigera till projektet
cd C:\Users\robin\Documents\GitHub\CivicAI

# Skapa venv i backend/python_services
cd backend\python_services
python -m venv venv

# Aktivera venv
.\venv\Scripts\Activate.ps1

# Du ser nu (venv) i terminalen
```

### Steg 2: Installera Python-beroenden i venv

**Alternativ A: Med venv aktiverat**
```powershell
# Aktivera venv först (från backend\python_services)
.\venv\Scripts\Activate.ps1

# Installera requirements (använd absolut sökväg)
pip install -r "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\requirements.txt"

# Installera spaCy svenska modellen (stor, rekommenderas)
python -m spacy download sv_core_news_lg

# Alternativt mindre modell (snabbare men mindre träffsäker):
python -m spacy download sv_core_news_sm
```

**Alternativ B: Utan att aktivera venv (rekommenderas)**
```powershell
# Installera requirements med fullständig sökväg till pip
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" install -r "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\requirements.txt"

# Installera spaCy svenska modellen
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" -m spacy download sv_core_news_lg

# Alternativt mindre modell:
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" -m spacy download sv_core_news_sm
```

### Steg 3: Starta ML-servern

**Alternativ A: Med venv aktiverat**
```powershell
# Aktivera venv först
cd C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services
.\venv\Scripts\Activate.ps1

# Kör servern
python ..\..\ml_service\server.py --load-in-8bit --auto-devices --listen --api
```

**Alternativ B: Direkt utan aktivering (en rad)**
```powershell
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\server.py" --load-in-8bit --auto-devices --listen --api
```

### Steg 4: Verifiera installation

```powershell
# Testa att spaCy fungerar
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" -c "import spacy; nlp = spacy.load('sv_core_news_lg'); print('✅ spaCy fungerar!')"

# Kontrollera installerade paket
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" list
```

---

## 🐧 Linux/macOS-installation (med venv)

### Steg 1: Skapa virtuell miljö

```bash
# Navigera till projektet
cd ~/CivicAI

# Skapa venv
python3 -m venv venv

# Aktivera venv
source venv/bin/activate

# Du ser nu (venv) i terminalen
```

### Steg 2: Installera Python-beroenden

```bash
# Med venv aktiverat
pip install -r ml_service/requirements.txt

# Installera spaCy svenska modellen
python -m spacy download sv_core_news_lg

# Alternativt mindre modell:
python -m spacy download sv_core_news_sm
```

### Steg 3: Starta ML-servern

```bash
# Med venv aktiverat
python ml_service/server.py --load-in-8bit --auto-devices --listen --api

# Eller direkt:
./venv/bin/python ml_service/server.py --load-in-8bit --auto-devices --listen --api
```

---

## Frontend-installation

```bash
# Från projektets rot
cd frontend
npm install

# Bygg frontend
npm run build
```

---

## Miljövariabler

Skapa `.env`-fil i projektets rot:

```env
# Tavily API (för webbsökning)
TAVILY_API_KEY=your_tavily_api_key

# Firebase (valfritt)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Server
PORT=8000
HOST=0.0.0.0
```

---

## Starta hela stacken

### Windows (PowerShell)

```powershell
# Terminal 1: ML-server
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\server.py" --load-in-8bit --auto-devices --listen --api

# Terminal 2: Frontend
cd C:\Users\robin\Documents\GitHub\CivicAI\frontend
npm run dev
```

### Linux/macOS

```bash
# Terminal 1: ML-server
source venv/bin/activate
python ml_service/server.py --load-in-8bit --auto-devices --listen --api

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## Server-flaggor

| Flagga | Beskrivning |
|--------|-------------|
| `--load-in-8bit` | Ladda modell i 8-bit för lägre minnesanvändning |
| `--auto-devices` | Automatisk enhetsallokering (GPU/CPU) |
| `--listen` | Lyssna på alla nätverksinterface |
| `--api` | Aktivera REST API endpoints |

---

## Felsökning venv

**Problem: "python" hittas inte i venv**
```powershell
# Använd fullständig sökväg
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" --version
```

**Problem: "requirements file not found"**
```powershell
# Använd ALLTID absolut sökväg till requirements.txt
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" install -r "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\requirements.txt"
```

**Problem: ModuleNotFoundError**
```powershell
# Kontrollera att du installerat i rätt venv
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" list

# Installera om requirements
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" install -r "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\requirements.txt"
```

**Problem: spaCy-modell saknas**
```powershell
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" -m spacy download sv_core_news_lg
```

**Problem: spaCy ModuleNotFoundError**
```powershell
# Installera spaCy först
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\pip.exe" install spacy

# Sedan ladda modellen
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" -m spacy download sv_core_news_lg
```

## Filstruktur

```
CivicAI/
├── cache/
│   └── weather_cache.py              # Cron-script för 15-min väder-cache
│
├── ml_service/
│   ├── server.py                     # Huvudserver med Intent Engine
│   ├── intent_engine.py              # Semantisk Intent + Entity Engine
│   ├── intent_rules.json             # Admin-styrbara intent-regler
│   ├── typo_double_check.py          # Dubbel stavfelssäkerhet
│   ├── tavily_search.py              # Tavily sökning med 100% svenska
│   ├── source_weights.json           # Admin-styrd källviktning
│   ├── calculate_confidence.py       # Förtroende v2-algoritm
│   ├── delta_compare.py              # Semantisk Δ-jämförelse
│   ├── cache_manager.py              # Hash-baserad cache, 7-dagars TTL
│   └── memory_manager.py             # Topic-gruppering + semantisk historik
│
├── memory/                           # Lokal minneslagring (JSONL-filer)
│   └── YYYY-MM.jsonl                 # Månadsvisa minnesfiler
│
├── public/
│   └── dictionaries/
│       └── sv/
│           ├── sv.dic                # SAOL ordbok
│           └── sv.aff                # Hunspell affix-fil
│
├── admin/
│   └── integration/
│       ├── IntentEditor.jsx          # Admin: Redigera intents
│       ├── GoldEditor.jsx            # Admin: Granska gold-dataset
│       ├── GoldQueue.jsx             # Admin: Visa gold-kö
│       ├── SourceWeights.jsx         # Admin: Justera källviktning
│       └── TopicHistory.jsx          # Topic-grupperad historik
│
├── frontend/
│   └── chat/
│       └── typo_hybrid.js            # Hybrid-autocorrect
│
├── docs/
│   └── schemas/
│       └── FIREBASE_TOPIC_SCHEMA.md  # Firebase databasschema
│
└── datasets/
    └── typo_pairs_swedish.jsonl      # Svenska stavfelspar
```

## API-endpoints

### Intent Engine API
- `GET /api/ml/intents` - Hämta alla intents
- `POST /api/ml/intents` - Skapa ny intent
- `PUT /api/ml/intents/{name}` - Uppdatera intent
- `DELETE /api/ml/intents/{name}` - Ta bort intent
- `POST /api/ml/intent/process` - Processa text genom Intent Engine

### Typo Checker API
- `POST /api/ml/typo` - Kontrollera stavning
- `POST /api/ml/typo/log` - Logga stavfel för träning

### Stavfel Dataset API (PR93 Alignment)
- `GET /api/ml/stavfel` - Hämta stavfelspar (filter: pending/approved/all)
- `POST /api/ml/stavfel/approve` - Godkänn par för träning
- `POST /api/ml/stavfel/reject` - Ta bort felaktigt par
- `POST /api/ml/stavfel/export` - Exportera för träning (jsonl/csv/json)
- `GET /api/ml/stavfel/stats` - Statistik över dataset

### Confidence API
- `GET /api/ml/sources` - Hämta källviktning
- `PUT /api/ml/sources/{id}` - Uppdatera källvikt
- `POST /api/ml/confidence` - Beräkna förtroende

### Delta Compare API
- `POST /api/ml/delta/compare` - Jämför två resultat
- `POST /api/ml/delta/hash` - Skapa blockchain-hash

### Cache API
- `GET /api/ml/cache/stats` - Cache-statistik
- `POST /api/ml/cache/cleanup` - Rensa utgångna
- `DELETE /api/ml/cache` - Rensa all cache

### Weather API
- `GET /api/ml/weather/cache` - All väderdata
- `GET /api/ml/weather/{city}` - Väder för stad

### Memory API (Topic-gruppering)
- `POST /api/ml/memory/save` - Spara meddelande med topic_hash
- `GET /api/ml/memory/context/{topic_hash}` - Hämta konversationskontext för topic
- `GET /api/ml/memory/topics/{user_id}` - Hämta alla topics för användare
- `POST /api/ml/memory/detect-topic` - Detektera intent och entity, generera topic_hash

### Status API
- `GET /api/ml/delta-plus/status` - ONESEEK Δ+ modulstatus

## Firebase Migration

För att migrera befintlig Firebase-data till topic-struktur:

```bash
# Simulera migrering (dry-run)
python migration/firebase_migrate.py --dry-run

# Kör faktisk migrering
python migration/firebase_migrate.py --execute

# Specificera collections
python migration/firebase_migrate.py --execute --old-collection messages --new-collection memory
```

## Konfigurera Intent-regler

Redigera `ml_service/intent_rules.json`:

```json
{
  "intents": {
    "befolkning": {
      "keywords": ["hur många bor", "invånare", "folkmängd"],
      "entities": ["GPE", "LOC"],
      "api": "scb_population",
      "weight": 1.0,
      "priority": 1
    },
    "väder": {
      "keywords": ["väder", "regn", "snö", "temperatur"],
      "api": "weather_cache",
      "weight": 0.95,
      "priority": 1
    }
  }
}
```

## Konfigurera källviktning

Redigera `ml_service/source_weights.json`:

```json
{
  "sources": {
    "scb": {"weight": 0.98, "reliability": "official"},
    "smhi": {"weight": 0.95, "reliability": "official"},
    "riksdagen": {"weight": 0.98, "reliability": "official"},
    "aftonbladet": {"weight": 0.40, "reliability": "low"}
  }
}
```

## Väder-cache Cron

Sätt upp cron för 15-minutersuppdatering:

```bash
# Redigera crontab
crontab -e

# Lägg till:
*/15 * * * * python /path/to/CivicAI/cache/weather_cache.py
```

## Flöde – från stavfel till perfekt svar

```
1. Användare skriver: "Hur många invåndare har Hjo?"
2. Typo-checker upptäcker "invåndare" → föreslår "invånare"
3. OneSeek svarar: "Menar du invånare? 😊 [Ja] [Nej]"
4. Användare klickar "Ja"
5. Intent Engine: intent=befolkning, entity=Hjo
6. Cache-check med semantisk hash
7. SCB API anropas
8. Δ-jämförelse: "+125 personer sedan juni"
9. Svar med källor, förtroende, blockchain-hash
10. Stavfelspar sparas för framtida träning
```

## Admin-paneler

### Intent Editor
- Lägg till/redigera/ta bort intents live
- Konfigurera nyckelord och vikter
- Ingen kodändring krävs

### Gold Editor
- Granska kvalitet på träningsdata
- Ta bort engelska/skräp-exempel
- Godkänn för träning

### Source Weights
- Justera källviktning i realtid
- SCB +15, SMHI +10, Aftonbladet -20

## Teknisk stack

- **Backend**: FastAPI + Python 3.10+
- **NLP**: spaCy + sv_core_news_lg
- **Frontend**: React 18 + Vite
- **Cache**: Hash-baserad med 7-dagars TTL
- **API:er**: 31 svenska realtids-API:er

## Support

Vid frågor, skapa ett issue i repot eller kontakta utvecklingsteamet.

---

*ONESEEK Δ+ – Sveriges mest intelligenta, mänskliga och självläkande civic-AI – 2025*
