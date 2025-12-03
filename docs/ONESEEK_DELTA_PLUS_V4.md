# ONESEEK Δ+ v4.0 – Self-Steering AI Documentation

## Översikt

ONESEEK Δ+ v4.0 är en fullständigt självstyrd AI som automatiskt väljer rätt API-kategori och datakällor baserat på användarens fråga. Intent Engine och Typo Checker är **avstängda som default** – systemet använder `api_catalog.json` för kategori-matchning.

## Så fungerar Self-Steering Mode

```
┌─────────────────────────────────────────────────────────────────────────┐
│  SELF-STEERING FLÖDE (v4.0) med PARALLELL API-HÄMTNING                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. Fråga kommer in: "Hur många bor i Hjo?"                            │
│         ↓                                                               │
│  2. Läs api_catalog.json → 31 kategorier med keywords                  │
│         ↓                                                               │
│  3. Matcha keywords:                                                    │
│     "hur många bor" → befolkning.keywords → MATCH!                     │
│         ↓                                                               │
│  4. Hämta kategori-config:                                             │
│     - apis: [scb_population, skatteverket_folkbokföring]               │
│     - entity_required: true                                            │
│     - entity_type: "kommun"                                            │
│         ↓                                                               │
│  5. Extrahera entity: "Hjo"                                            │
│         ↓                                                               │
│  6. 🔄 PARALLELL HÄMTNING (asyncio.gather):                            │
│     ┌──────────────────┐  ┌──────────────────────────┐                 │
│     │ SCB Population   │  │ Skatteverket Folkbokfö.  │                 │
│     │ (300ms)          │  │ (250ms)                  │                 │
│     └────────┬─────────┘  └────────────┬─────────────┘                 │
│              └─────────────┬───────────┘                               │
│                            ↓                                            │
│              Total tid: ~300ms (inte 550ms sekventiellt!)              │
│         ↓                                                               │
│  7. Injicera ALL data i system prompt                                  │
│         ↓                                                               │
│  8. Modellen väljer bästa källan och svarar                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Parallell vs Sekventiell hämtning

```python
# Sekventiellt – DÅLIGT (gamla sättet)
result1 = await scb_population(entity)    # 400ms
result2 = await skatteverket(entity)       # 350ms
# → 750ms totalt

# Parallellt – BRA (nya sättet med asyncio.gather)
result1, result2 = await asyncio.gather(
    scb_population(entity),
    skatteverket(entity)
)
# → ~400ms totalt (tiden för den långsammaste)
```

## Arkitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                    ONESEEK Δ+ v4.0                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐  │
│  │  Användare  │───▶│  API Catalog     │───▶│  31+ Svenska  │  │
│  │   Fråga     │    │  (Self-Steering) │    │  Realtids-API │  │
│  └─────────────┘    └──────────────────┘    └───────────────┘  │
│                              │                      │          │
│                              ▼                      ▼          │
│                     ┌──────────────────┐    ┌───────────────┐  │
│                     │  Parallell       │    │  Modellen     │  │
│                     │  API-hämtning    │───▶│  väljer bästa │  │
│                     └──────────────────┘    │  källa        │  │
│                                             └───────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Konfigurationsfiler

### 1. `config/api_catalog.json` – Huvudkonfiguration

Detta är den centrala konfigurationsfilen för ONESEEK Δ+ v4.0.

**Plats:** `/config/api_catalog.json`

**Struktur:**

```json
{
  "version": "4.0.0",
  "description": "ONESEEK Δ+ v4.0 - Fullständigt självstyrd AI",
  "updated": "2025-12-03",
  
  "active_features": {
    "intent_engine": false,    // ❌ Avstängd (modellen väljer själv)
    "typo_checker": false,     // ❌ Avstängd (modellen förstår stavfel)
    "time_context": true       // ✅ Alltid på (krävs för kontext)
  },
  
  "api_catalog": {
    "befolkning": {
      "description": "Befolkningsstatistik och folkbokföring",
      "apis": [
        {"name": "scb_population", "source": "SCB", "frequency": "månadsvis", "url": "https://api.scb.se"},
        {"name": "skatteverket_folkbokföring", "source": "Skatteverket", "frequency": "dagligen"}
      ],
      "entity_required": true,
      "entity_type": "kommun",
      "keywords": ["befolkning", "invånare", "hur många bor"]
    },
    // ... 30+ kategorier till
  }
}
```

### 2. Aktivera/Inaktivera funktioner

Ändra `active_features` i `config/api_catalog.json`:

| Funktion | Default | Beskrivning |
|----------|---------|-------------|
| `intent_engine` | `false` | Semantisk intent-detektering. Av = modellen väljer själv. |
| `typo_checker` | `false` | Stavningskontroll. Av = modellen förstår stavfel själv. |
| `time_context` | `true` | Tid/datum/årstid. Alltid på för kontext. |

## API-katalogen

### Tillgängliga kategorier (31 st)

1. **befolkning** – SCB, Skatteverket
2. **väder** – SMHI, YR.no
3. **nyheter** – SVT, SR Ekot, Omni
4. **kris** – Krisinformation.se
5. **politik** – Riksdagen
6. **trafik** – Trafikverket, SL
7. **hälsa** – Folkhälsomyndigheten
8. **utbildning** – Skolverket
9. **ekonomi** – Riksbanken, SCB
10. **miljö** – SMHI, Naturvårdsverket
... och 21 kategorier till

### Lägga till en ny API-kategori

Lägg till i `config/api_catalog.json` under `api_catalog`:

```json
"ny_kategori": {
  "description": "Beskrivning av kategorin",
  "apis": [
    {
      "name": "api_namn",
      "source": "Källans namn",
      "frequency": "realtid|dagligen|månadsvis",
      "url": "https://api.example.com"
    }
  ],
  "entity_required": true,      // Kräver plats/namn?
  "entity_type": "kommun",      // kommun|stad|region|organisation
  "keywords": ["trigger", "ord", "som", "aktiverar"],
  "priority": 5                 // Lägre = högre prioritet
}
```

### Lägga till en ny API i befintlig kategori

```json
"väder": {
  "apis": [
    {"name": "smhi_current", "source": "SMHI", ...},
    {"name": "yr_no", "source": "YR.no", ...},
    // Lägg till ny:
    {"name": "met_no", "source": "MET Norway", "frequency": "timvis", "url": "https://api.met.no"}
  ]
}
```

## Kodfiler

### Backend (Python/FastAPI)

| Fil | Syfte |
|-----|-------|
| `ml_service/server.py` | Huvudserver med alla endpoints |
| `ml_service/intent_engine.py` | Intent-detektering (avstängd default) |
| `ml_service/typo_checker.py` | Stavningskontroll (avstängd default) |
| `config/api_catalog.json` | API-katalog och konfiguration |

### Viktiga funktioner i `server.py`

```python
# Ladda katalogen vid uppstart
load_api_catalog()

# Kolla om funktioner är aktiverade
is_intent_engine_enabled()  # -> False (default)
is_typo_checker_enabled()   # -> False (default)
is_time_context_enabled()   # -> True (alltid)

# Hämta kategori-info
get_api_catalog_categories()  # -> ["befolkning", "väder", ...]
get_category_config("väder")  # -> {...}
```

### Frontend (React)

| Fil | Syfte |
|-----|-------|
| `frontend/src/pages/MessageBuilderPage.jsx` | /admin/builder debugsida |
| `frontend/src/App.jsx` | Routing |

## API-endpoints

### Konfiguration

```
GET  /api/ml/delta-plus/status           # Modulstatus
GET  /api/ml/delta-plus/active-features  # Hämta aktiva funktioner
POST /api/ml/delta-plus/active-features  # Ändra funktioner runtime
GET  /api/ml/delta-plus/api-catalog      # Hela katalogen
GET  /api/ml/delta-plus/api-catalog/{category}  # Specifik kategori
```

### Exempel

```bash
# Hämta status
curl http://localhost:5000/api/ml/delta-plus/status

# Aktivera Intent Engine tillfälligt
curl -X POST http://localhost:5000/api/ml/delta-plus/active-features \
  -H "Content-Type: application/json" \
  -d '{"intent_engine": true}'

# Hämta väder-kategorin
curl http://localhost:5000/api/ml/delta-plus/api-catalog/väder
```

## Felsökning

### Terminal-debug

När du kör frågor via `/admin/builder` visas debug-info i terminalen:

```
======================================================================
🔧 MESSAGE BUILDER DEBUG - API FETCH
======================================================================
  📝 Question: Hur många bor i Hjo?
  🔧 Structure: current
----------------------------------------------------------------------
  ONESEEK Δ+ v4.0 CONFIG:
    Global Intent Engine: ❌ DISABLED (Self-Steering)
    Request Intent Engine: ❌ OFF
    Mode: ⚡ Self-Steering (v4.0)
  🕐 Time: Idag är det Onsdag den 3 december 2025...
  🌿 Season: Vi är mitt i vintern just nu.
----------------------------------------------------------------------
  ⚡ SELF-STEERING MODE (v4.0)
    Intent Engine: DISABLED
    Model will choose category and API itself
----------------------------------------------------------------------
  📊 RESULT SUMMARY:
    Sources: ['scb']
    Intent: befolkning
    Data fetched: ['statistics']
    Response: 170 chars, 74 tokens
    Latency: 17412ms
======================================================================
```

### UI-debug i /admin/builder

1. **API CATALOG v4.0 DEBUG panel** visar:
   - Mode (Self-Steering / Intent-Based)
   - Antal kategorier (31)
   - Intent Engine: ✅/❌
   - Typo Checker: ✅/❌
   - Time Context: ✅

2. **INTENT ENGINE panel** (om aktiverat) visar:
   - Detekterad intent
   - Entity (plats/namn)
   - Confidence %
   - Vilken API som användes

3. **HÄMTAD DATA panel** visar:
   - JSON med all hämtad data
   - Källan (SCB, SMHI, etc.)
   - Location/entity

4. **API FETCH LOG panel** visar:
   - Timestamp för varje API-anrop
   - Vilka API:er som anropades
   - Status (success/error)
   - Svarstid per API

### Verifiera att data kommer från rätt källa

1. **Kolla API FETCH LOG** i `/admin/builder`
   - Varje API-anrop loggas med timestamp
   - Visar källan (SMHI, SCB, etc.)
   - Visar svarstid

2. **Kolla YAML-exporten**
   - `api_fetch_log` visar alla API-anrop
   - Timestamps och status per anrop
   - Totalt antal lyckade/misslyckade

3. **Kolla terminalen**
   - Varje API-fetch loggas med `📡 FETCHING:`
   - Success/error visas med `✓`/`✗`

## Self-Steering Mode vs Intent-Based Mode

| Aspekt | Self-Steering (v4.0) | Intent-Based (legacy) |
|--------|---------------------|----------------------|
| Intent Engine | ❌ Av | ✅ På |
| Kategorival | Modellen själv | Intent Engine |
| API-val | Modellen själv | Baserat på intent |
| Stavning | Modellen förstår | Typo Checker |
| Hastighet | Snabbare | Långsammare |
| Precision | Modellen bedömer | Regelbaserat |

## Versionshistorik

| Version | Datum | Ändringar |
|---------|-------|-----------|
| 4.0.0 | 2025-12-03 | Self-Steering mode, Intent Engine avstängd default |
| 3.3.0 | 2025-11 | Autonomy Engine |
| 3.0.0 | 2025-10 | DNA v2 certifiering |

---

*ONESEEK Δ+ v4.0 – Byggd i Sverige 🇸🇪*
