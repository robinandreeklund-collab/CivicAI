# ONESEEK Δ+ – Sveriges mest avancerade Civic-AI

## Översikt

ONESEEK Δ+ är en **självläkande, semantisk, transparent och mänsklig** AI som förstår svenska – på riktigt. Byggd på 31 svenska realtids-API:er, admin-styrd Intent Engine och världens mest avancerade träningsloop.

---

## 🔷 KOMPLETT ADMIN GUIDE + TESTNING

### Var hittar jag Δ+ funktionerna?

**URL:** `http://localhost:5173/admin` (eller din frontends port)

**Navigering:**
1. Gå till **Admin Dashboard**
2. Klicka på fliken **🔌 Integrations**
3. Expandera **🔷 ONESEEK Δ+ Admin** sektionen

### Δ+ Admin-flikar

| Flik | Beskrivning | Vad kan du göra? |
|------|-------------|------------------|
| 🎯 **Intent Engine** | Hantera intent-regler | Lägg till/redigera intents, triggers, prioriteter |
| 🏅 **Gold Editor** | Granska träningsdata | Ta bort skräp, godkänn för träning |
| ⚖️ **Källviktning** | Förtroende v2 | Justera vikt per källa (SCB +15, Aftonbladet -20) |
| ✏️ **Stavfel** | Stavfelspar | Granska och godkänn för självlärande |
| 📚 **Topics** | Topic History | Se topic-grupperad konversationshistorik |

---

## ✅ TESTNINGS-CHECKLISTA

Använd denna checklista för att verifiera att alla Δ+ funktioner fungerar.

### Backend-test (Terminal)

```bash
# 1. Starta ML-server med debug
# Windows:
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" "C:\Users\robin\Documents\GitHub\CivicAI\ml_service\server.py" --load-in-8bit --auto-devices --listen --api

# Du ska se:
# ======================================================================
# 🔷 ONESEEK Δ+ MODULE STATUS
# ======================================================================
#   ✅ READY  Intent Engine          - Semantic intent + entity detection
#   ✅ READY  Memory Manager         - Topic-grouped conversation history
#   ...
```

**[ ] Backend startar utan fel**
**[ ] Δ+ MODULE STATUS visar alla ✅ READY**

### Frontend-test

```bash
# 2. Starta frontend
cd C:\Users\robin\Documents\GitHub\CivicAI\frontend
npm run dev
```

**[ ] Frontend startar på http://localhost:3000** (Obs: kan vara 5173 om 3000 är upptagen)

> **OBS:** Frontend-porten konfigureras i `frontend/vite.config.js`. 
> Standardport är **3000** men kan variera. Titta på terminalutskriften när frontend startar.

### Admin Dashboard-test

1. **[ ] Gå till `/admin`**
2. **[ ] Klicka på "🔌 Integrations"**
3. **[ ] Se "🔷 ONESEEK Δ+ Admin" sektionen**
4. **[ ] Expandera Δ+ Admin (klicka på rubriken)**

### Intent Engine-test

1. **[ ] Klicka på "🎯 Intent Engine" fliken**
2. **[ ] Intent-lista laddas (befolkning, väder, etc.)**
3. **[ ] Testa redigera en intent**
4. **[ ] Spara → Toast visar "Sparat!"**

### Gold Editor-test

1. **[ ] Klicka på "🏅 Gold Editor" fliken**
2. **[ ] Gold-dataset laddas**
3. **[ ] Testa godkänn/radera ett exempel**

### Källviktning-test

1. **[ ] Klicka på "⚖️ Källviktning" fliken**
2. **[ ] Källor visas (SCB, SMHI, etc.)**
3. **[ ] Testa ändra vikt för en källa**
4. **[ ] Spara → Förtroende v2 uppdateras**

### Stavfel Editor-test

1. **[ ] Klicka på "✏️ Stavfel" fliken**
2. **[ ] Stavfelspar laddas**
3. **[ ] Testa godkänn ett par**
4. **[ ] Exportera till JSONL**

### Topic History-test

1. **[ ] Klicka på "📚 Topics" fliken**
2. **[ ] Topic-träd laddas**
3. **[ ] Se topic-gruppering (befolkning:hjo, etc.)**

---

## ❌ FELSÖKNING: HTTP 404 för Admin-flikar

Om du ser "HTTP 404" eller "Kunde inte ladda" fel i Admin-panelen:

### Problem: Vite proxy-inställningar

Admin-komponenterna använder `/api/ml/*` endpoints som måste proxyas till ML-servern (port 5000).

**Lösning 1: Verifiera att ML-servern körs**

```powershell
# ML-servern MÅSTE köras på port 5000
# Kontrollera att den kör:
curl http://localhost:5000/api/ml/intents
# Eller i PowerShell:
Invoke-WebRequest -Uri "http://localhost:5000/api/ml/intents"
```

**Lösning 2: Starta om frontend efter Vite-config ändring**

```bash
# Stoppa frontend (Ctrl+C)
# Starta om:
npm run dev
```

**Lösning 3: Kontrollera vite.config.js**

```javascript
// frontend/vite.config.js ska ha:
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api/ml': {
        target: 'http://localhost:5000',  // ML Service
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:3001',  // Backend
        changeOrigin: true,
      },
    },
  },
});
```

---

### Chat-test (Inference)

```bash
# 3. Testa i chatten
# Gå till http://localhost:3000/chat (eller 5173)

# Skriv: "Hur många bor i Hjo?"
# Du ska se i backend-terminal:
# ------------------------------------------------------------
# 🔷 ONESEEK Δ+ INFERENCE DEBUG
# ------------------------------------------------------------
#   📝 Input: Hur många bor i Hjo?
#   🇸🇪 Force-Svenska: ✅ ACTIVE
#   🎯 Intent Engine: ✅ befolkning (conf: 0.85)
#      └─ Entity: Hjo
#   ...
```

**[ ] Intent Engine triggas korrekt**
**[ ] Force-Svenska är ACTIVE**
**[ ] Topic hash genereras**

### Hybrid-Autocorrect test

```bash
# 4. Testa stavfel i chatten
# Skriv: "Hur många invåndare har Hjo?"
# Ska få förslag: "Menar du invånare?"
```

**[ ] Typo-checker föreslår korrigering**
**[ ] Stavfelspar sparas till dataset**

---

## 🔧 API-ENDPOINTS FÖR TESTNING

Testa API:erna direkt med curl eller Postman:

### Intent Engine API

```bash
# Hämta alla intents
curl http://localhost:5000/api/ml/intents

# Processa text
curl -X POST http://localhost:5000/api/ml/intent/process \
  -H "Content-Type: application/json" \
  -d '{"text": "Hur många bor i Stockholm?"}'
```

**[ ] `/api/ml/intents` returnerar JSON med intents**
**[ ] `/api/ml/intent/process` detekterar intent + entity**

### Stavfel API

```bash
# Hämta stavfelspar
curl http://localhost:5000/api/ml/stavfel

# Hämta statistik
curl http://localhost:5000/api/ml/stavfel/stats
```

**[ ] `/api/ml/stavfel` returnerar stavfelspar**
**[ ] `/api/ml/stavfel/stats` visar count**

### Källviktning API

```bash
# Hämta källor
curl http://localhost:5000/api/ml/sources
```

**[ ] `/api/ml/sources` returnerar sources med weight**

### Memory API

```bash
# Testa topic-detektion
curl -X POST http://localhost:5000/api/ml/memory/detect-topic \
  -H "Content-Type: application/json" \
  -d '{"text": "Hur är vädret i Göteborg?"}'
```

**[ ] `/api/ml/memory/detect-topic` returnerar topic_hash**

### Δ+ Status API

```bash
# Modulstatus
curl http://localhost:5000/api/ml/delta-plus/status
```

**[ ] `/api/ml/delta-plus/status` visar alla moduler**

---

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

## Väder-cache – Automatisk Uppdatering

### 🖥️ Windows 11 – Task Scheduler

Windows använder **Task Scheduler** istället för crontab. Så här sätter du upp 15-minutersuppdatering:

#### Alternativ 1: PowerShell-kommando (enklast)

```powershell
# Skapa schemalagd uppgift som kör var 15:e minut
$action = New-ScheduledTaskAction -Execute 'C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe' -Argument 'C:\Users\robin\Documents\GitHub\CivicAI\cache\weather_cache.py'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15) -RepetitionDuration (New-TimeSpan -Days 365)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "CivicAI_WeatherCache" -Action $action -Trigger $trigger -Settings $settings -Description "ONESEEK Δ+ Weather Cache Update"
```

#### Alternativ 2: Task Scheduler GUI

1. **Öppna Task Scheduler:**
   - Tryck `Win + R`
   - Skriv `taskschd.msc`
   - Tryck Enter

2. **Skapa ny uppgift:**
   - Högerklicka på "Task Scheduler Library"
   - Välj "Create Task..."

3. **General-fliken:**
   - Namn: `CivicAI_WeatherCache`
   - Beskrivning: `ONESEEK Δ+ Weather Cache Update var 15:e minut`
   - Välj "Run whether user is logged on or not"
   - Kryssa i "Run with highest privileges"

4. **Triggers-fliken:**
   - Klicka "New..."
   - Begin the task: "On a schedule"
   - Settings: "One time"
   - Start: välj aktuell tid
   - Kryssa i "Repeat task every:" och välj `15 minutes`
   - For a duration of: "Indefinitely"
   - Klicka "OK"

5. **Actions-fliken:**
   - Klicka "New..."
   - Action: "Start a program"
   - Program/script: 
     ```
     C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe
     ```
   - Add arguments:
     ```
     C:\Users\robin\Documents\GitHub\CivicAI\cache\weather_cache.py
     ```
   - Start in:
     ```
     C:\Users\robin\Documents\GitHub\CivicAI
     ```
   - Klicka "OK"

6. **Conditions-fliken:**
   - Avmarkera "Start only if computer is on AC power"

7. **Settings-fliken:**
   - Kryssa i "Allow task to be run on demand"
   - Kryssa i "If the running task does not end when requested, force it to stop"
   - Klicka "OK"

#### Verifiera att det fungerar

```powershell
# Kör manuellt för att testa
& "C:\Users\robin\Documents\GitHub\CivicAI\backend\python_services\venv\Scripts\python.exe" "C:\Users\robin\Documents\GitHub\CivicAI\cache\weather_cache.py"

# Kontrollera Task Scheduler status
Get-ScheduledTask -TaskName "CivicAI_WeatherCache" | Get-ScheduledTaskInfo

# Kör uppgiften manuellt
Start-ScheduledTask -TaskName "CivicAI_WeatherCache"

# Ta bort uppgiften (om du vill)
Unregister-ScheduledTask -TaskName "CivicAI_WeatherCache" -Confirm:$false
```

### 🐧 Linux/macOS – Crontab

```bash
# Redigera crontab
crontab -e

# Lägg till (byt ut /path/to till din faktiska sökväg):
*/15 * * * * /home/user/CivicAI/venv/bin/python /home/user/CivicAI/cache/weather_cache.py >> /home/user/CivicAI/logs/weather_cache.log 2>&1

# macOS-specifik (om python3):
*/15 * * * * /usr/local/bin/python3 /Users/user/CivicAI/cache/weather_cache.py >> /Users/user/CivicAI/logs/weather_cache.log 2>&1
```

#### Verifiera crontab

```bash
# Lista aktiva cron-jobb
crontab -l

# Kontrollera cron-logg
tail -f /var/log/cron  # Linux
tail -f /var/log/system.log | grep CRON  # macOS
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

---

## 🔥 Firebase-integration – Komplett Datakedja

### Befintliga Collections (OQT)

CivicAI använder redan dessa Firebase-collections som fungerar:

| Collection | Beskrivning | Δ+ Integration |
|------------|-------------|----------------|
| `oqt_queries` | Alla användarfrågor + AI-svar | Utökas med `topic_hash`, `intent`, `entity` |
| `oqt_training_events` | Träningshändelser | Kopplas till `gold_examples` |
| `oqt_ledger` | Blockchain-ledger för transparens | Utökas med `response_hash` från Δ+ |
| `oqt_provenance` | Källspårning | Kopplas till `source_weights` |
| `oqt_metrics` | Prestandamätningar | Utökas med Δ+ module metrics |

### Nya Collections (Δ+)

| Collection | Beskrivning | Koppling |
|------------|-------------|----------|
| `delta_topics` | Topic-metadata | Refererar `oqt_queries` via `topic_hash` |
| `delta_messages` | Topic-grupperade meddelanden | Kopior från `oqt_queries` med topic |
| `delta_typo_pairs` | Stavfelspar | Träningsdata för typo-checker |
| `delta_gold_examples` | Granskad träningsdata | Admin-godkänd från `oqt_queries` |
| `delta_intent_rules` | Admin-styrda intent-regler | Backup av `intent_rules.json` |
| `delta_source_weights` | Källviktning | Backup av `source_weights.json` |

---

### 📊 Dataflödesschema – Komplett Kedja

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ONESEEK Δ+ DATAFLÖDE                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────┐
                    │  ANVÄNDARE       │
                    │  "Hur många bor  │
                    │   i Hjo?"        │
                    └────────┬─────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  1️⃣ TYPO CHECKER (frontend/chat/typo_hybrid.js)                                    │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Typo.js + SAOL kontrollerar stavning                                            │
│  • Om stavfel: "Menar du invånare?" → sparas till delta_typo_pairs                │
│                                                                                    │
│  Firebase: delta_typo_pairs ← {original: "invåndare", corrected: "invånare"}      │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  2️⃣ INTENT ENGINE (ml_service/intent_engine.py)                                    │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Läser: intent_rules.json (backup i delta_intent_rules)                         │
│  • Output: intent="befolkning", entity="Hjo", confidence=0.92                     │
│                                                                                    │
│  Firebase: delta_intent_rules ← intent_rules.json (admin-synkad)                  │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  3️⃣ TOPIC HASH GENERATOR (ml_service/memory_manager.py)                            │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Input: intent="befolkning", entity="Hjo"                                        │
│  • Output: topic_hash = sha256("befolkning:hjo")[:16] = "a3f7d2e1"                │
│                                                                                    │
│  Firebase: delta_topics ← {topic_hash, intent, entity, label, message_count}      │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  4️⃣ MEMORY CONTEXT (ml_service/memory_manager.py)                                  │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Hämtar: senaste 8 meddelanden med samma topic_hash                             │
│  • Kontext byggs för AI:n                                                          │
│                                                                                    │
│  Firebase READ: delta_messages.where(topic_hash == "a3f7d2e1").limit(8)           │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  5️⃣ CACHE CHECK (ml_service/cache_manager.py)                                      │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Semantic hash: sha256(intent + entity + normalized_query)                      │
│  • Om cache HIT → returnera direkt (spar API-anrop)                               │
│  • Om cache MISS → fortsätt till API                                              │
│                                                                                    │
│  Lokal: cache/response_cache.json (7-dagars TTL)                                  │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  6️⃣ API ROUTING (ml_service/server.py)                                             │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Intent Engine väljer API baserat på intent:                                     │
│    - befolkning → SCB Population API                                               │
│    - väder → SMHI/Weather Cache                                                    │
│    - allmänt → Tavily Search (language="sv")                                      │
│                                                                                    │
│  Firebase: oqt_provenance ← {queryId, sources: ["SCB"], timestamp}                │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  7️⃣ CONFIDENCE CALCULATOR (ml_service/calculate_confidence.py)                     │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Läser: source_weights.json (backup i delta_source_weights)                     │
│  • Beräknar: confidence = base_weight * freshness_decay * source_count_bonus      │
│  • Output: confidence=0.94, sources=[{name: "SCB", weight: 0.98}]                 │
│                                                                                    │
│  Firebase: delta_source_weights ← source_weights.json (admin-synkad)              │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  8️⃣ DELTA COMPARE (ml_service/delta_compare.py)                                    │
│  ────────────────────────────────────────────────────────────────────────────────  │
│  • Jämför med tidigare svar på samma topic                                         │
│  • Om ändring: delta_info = {change: "+125 personer", percentage: "+1.3%"}        │
│  • Genererar: response_hash = sha256(response + timestamp)                        │
│                                                                                    │
│  Firebase: oqt_ledger ← {blockNumber, response_hash, delta_info}                  │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  9️⃣ SPARA RESULTAT (ml_service/server.py)                                          │
│  ────────────────────────────────────────────────────────────────────────────────  │
│                                                                                    │
│  Firebase WRITES:                                                                  │
│                                                                                    │
│  📦 oqt_queries ← {                                                               │
│       question: "Hur många bor i Hjo?",                                           │
│       response: "Hjo kommun har 9 512 invånare...",                              │
│       intent: "befolkning",                                                        │
│       entity: "Hjo",                                                               │
│       topic_hash: "a3f7d2e1",                          ← NYT FÄLT                 │
│       confidence: 0.94,                                                            │
│       sources: ["SCB"],                                                            │
│       response_hash: "b4c5d6e7...",                    ← NYT FÄLT                 │
│       delta_info: {change: "+125", prev_value: "9387"},← NYT FÄLT                 │
│       createdAt: timestamp                                                         │
│  }                                                                                 │
│                                                                                    │
│  📦 delta_messages ← {                                                            │
│       topic_hash: "a3f7d2e1",                                                     │
│       user_id_hash: "anon123",                                                    │
│       question: "Hur många bor i Hjo?",                                           │
│       answer: "Hjo kommun har 9 512 invånare...",                                │
│       intent: "befolkning",                                                        │
│       entity: "Hjo",                                                               │
│       timestamp: timestamp                                                         │
│  }                                                                                 │
│                                                                                    │
│  📦 delta_topics ← (UPSERT) {                                                     │
│       topic_hash: "a3f7d2e1",                                                     │
│       intent: "befolkning",                                                        │
│       entity: "Hjo",                                                               │
│       label: "Befolkning i Hjo",                                                  │
│       message_count: INCREMENT(1),                                                 │
│       updated_at: timestamp                                                        │
│  }                                                                                 │
│                                                                                    │
│  📦 oqt_ledger ← {                                                                │
│       blockNumber: NEXT_BLOCK,                                                     │
│       event_type: "query_response",                                               │
│       response_hash: "b4c5d6e7...",                                              │
│       previous_hash: "a1b2c3d4...",                                              │
│       data: {query_id: "...", confidence: 0.94},                                  │
│       timestamp: timestamp                                                         │
│  }                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│  🔟 RETURNERA TILL ANVÄNDARE                                                       │
│  ────────────────────────────────────────────────────────────────────────────────  │
│                                                                                    │
│  {                                                                                 │
│    "response": "Hjo kommun har 9 512 invånare (2024)...",                        │
│    "confidence": 0.94,                                                             │
│    "sources": ["SCB"],                                                             │
│    "delta": "+125 personer sedan juni (+1.3%)",                                   │
│    "response_hash": "b4c5d6e7f8a9b0c1...",                                       │
│    "topic_hash": "a3f7d2e1"                                                       │
│  }                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 📱 Admin-flöde (Gold Editor)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           ADMIN GOLD EDITOR FLÖDE                                   │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  oqt_queries     │     │  Admin Dashboard │     │delta_gold_examples│
│  (alla frågor)   │────▶│  Gold Editor     │────▶│  (godkänd data)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                         │                        │
        │                         ▼                        │
        │                 ┌──────────────────┐             │
        │                 │  Admin granskar: │             │
        │                 │  ✓ Bra exempel   │             │
        │                 │  ✗ Skräp/engelska│             │
        │                 │  ★ Godkänn       │             │
        │                 └──────────────────┘             │
        │                                                  │
        ▼                                                  ▼
┌──────────────────┐                             ┌──────────────────┐
│oqt_training_events│◀────────────────────────────│  Träning startas │
│ (event_type:     │                             │  med godkänd data│
│  "gold_approved")│                             └──────────────────┘
└──────────────────┘
```

---

### 🔧 Firebase Collection Schema (Uppdaterad)

#### `oqt_queries` (UTÖKAD)

```javascript
{
  // Befintliga fält
  question: string,
  response: string,
  model_version: string,
  createdAt: timestamp,
  updatedAt: timestamp,
  
  // NYA Δ+ FÄLT
  topic_hash: string,      // 16-char hash för topic-gruppering
  intent: string,          // Detekterad intent (befolkning, väder, etc.)
  entity: string,          // Detekterad entitet (Hjo, Stockholm, etc.)
  confidence: number,      // Förtroende v2 score (0-1)
  response_hash: string,   // Blockchain-hash för verifiering
  delta_info: {            // Δ-jämförelse info
    change: string,        // "+125 personer"
    prev_value: string,    // "9387"
    percentage: string     // "+1.3%"
  },
  sources: array,          // ["SCB", "SMHI"]
  typo_corrections: array  // [{original: "invåndare", corrected: "invånare"}]
}
```

#### `delta_topics` (NY)

```javascript
{
  topic_hash: string,      // Primärnyckel
  intent: string,
  entity: string,
  label: string,           // "Befolkning i Hjo"
  message_count: number,
  created_at: timestamp,
  updated_at: timestamp
}
```

#### `delta_messages` (NY)

```javascript
{
  topic_hash: string,      // Referens till delta_topics
  user_id_hash: string,    // Anonymiserad användare
  question: string,
  answer: string,
  intent: string,
  entity: string,
  confidence: number,
  sources: array,
  response_hash: string,
  timestamp: timestamp
}
```

#### `delta_typo_pairs` (NY)

```javascript
{
  original: string,        // "invåndare"
  corrected: string,       // "invånare"
  context: string,         // Omgivande text
  user_accepted: boolean,  // Användaren accepterade korrigeringen
  status: string,          // "pending" | "approved" | "rejected"
  approved_by: string,     // Admin user ID
  approved_at: timestamp,
  created_at: timestamp
}
```

#### `delta_gold_examples` (NY)

```javascript
{
  query_id: string,        // Referens till oqt_queries
  question: string,
  answer: string,
  intent: string,
  entity: string,
  confidence: number,
  sources: array,
  status: string,          // "pending" | "approved" | "rejected"
  approved_by: string,
  approved_at: timestamp,
  created_at: timestamp
}
```

---

### 🔄 Synkronisering med lokala filer

ONESEEK Δ+ använder lokala JSON-filer som primär källa men synkroniserar med Firebase:

| Lokal fil | Firebase Collection | Synk-riktning |
|-----------|---------------------|---------------|
| `intent_rules.json` | `delta_intent_rules` | Lokal → Firebase (vid ändring) |
| `source_weights.json` | `delta_source_weights` | Lokal → Firebase (vid ändring) |
| `datasets/typo_pairs_swedish.jsonl` | `delta_typo_pairs` | Båda riktningar |
| `cache/weather.json` | - | Endast lokal (15-min cache) |
| `memory/YYYY-MM.jsonl` | `delta_messages` | Lokal → Firebase (backup) |

---

### 📡 API för Firebase-operationer

```bash
# Synka intent_rules till Firebase
POST /api/ml/firebase/sync-intents

# Synka source_weights till Firebase
POST /api/ml/firebase/sync-sources

# Hämta topic-historik från Firebase
GET /api/ml/firebase/topics?user_id_hash=abc123

# Hämta meddelanden för topic
GET /api/ml/firebase/messages?topic_hash=a3f7d2e1&limit=20

# Migrera befintlig data till topic-struktur
POST /api/ml/firebase/migrate-topics
```

---

### 🧪 Testa Firebase-integration

```bash
# 1. Kontrollera att Firebase är konfigurerad
curl http://localhost:5000/api/health

# 2. Ställ en fråga och verifiera att data sparas
curl -X POST http://localhost:5000/infer \
  -H "Content-Type: application/json" \
  -d '{"text": "Hur många bor i Hjo?"}'

# 3. Kontrollera i Firebase Console:
# - oqt_queries → ny post med topic_hash
# - delta_topics → ny/uppdaterad topic
# - delta_messages → nytt meddelande

# 4. Hämta topic-historik
curl "http://localhost:5000/api/ml/firebase/messages?topic_hash=<hash>"
```

---

## Support

Vid frågor, skapa ett issue i repot eller kontakta utvecklingsteamet.

---

*ONESEEK Δ+ – Sveriges mest intelligenta, mänskliga och självläkande civic-AI – 2025*
