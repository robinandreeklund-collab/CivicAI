# ONESEEK Δ+ – Sveriges mest avancerade Civic-AI

## Översikt

ONESEEK Δ+ är en **självläkande, semantisk, transparent och mänsklig** AI som förstår svenska – på riktigt. Byggd på 31 svenska realtids-API:er, admin-styrd Intent Engine och världens mest avancerade träningsloop.

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
| 11 | **Stavfel sparas** | Bygger världens bästa svenska stavfels-dataset | ✅ Live |
| 12 | **Cache med hash + 7-dagars TTL** | Svar på 0.2 sek | ✅ Live |
| 13 | **Topic-gruppering + Minne** | AI:n minns konversationer och grupperar efter ämne | ✅ Live |
| 14 | **Semantisk historik** | Samma fråga med olika formuleringar = samma tråd | ✅ Live |

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

### Backend-installation

```bash
# Klona repot
git clone https://github.com/robinandreeklund-collab/CivicAI.git
cd CivicAI

# Installera Python-beroenden
cd ml_service
pip install -r requirements.txt

# Installera spaCy svenska modellen
python -m spacy download sv_core_news_lg

# Alternativt för mindre modell:
python -m spacy download sv_core_news_sm
```

### Frontend-installation

```bash
# Från projektets rot
cd frontend
npm install

# Bygg frontend
npm run build
```

### Miljövariabler

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

### Starta servern

```bash
# Starta ML-server
cd ml_service
python server.py

# I ett annat terminalfönster, starta frontend
cd frontend
npm run dev
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
