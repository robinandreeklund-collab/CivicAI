# ONESEEK Δ+ v4.0 – Self-Steering AI Documentation

## Översikt

ONESEEK Δ+ v4.0 är en fullständigt självstyrd AI som automatiskt väljer rätt API-kategori och datakällor baserat på användarens fråga. Intent Engine och Typo Checker är **avstängda som default** – systemet använder `api_catalog.json` för kategori-matchning och parallell API-hämtning.

**Senast uppdaterad:** 2025-12-03

---

## Innehållsförteckning

1. [Så fungerar Self-Steering Mode](#så-fungerar-self-steering-mode)
2. [Arkitektur](#arkitektur)
3. [Konfigurationsfiler](#konfigurationsfiler)
4. [Komplett API-katalog](#komplett-api-katalog)
5. [API-implementationer – Detaljerad Status](#api-implementationer--detaljerad-status)
6. [Kodfiler](#kodfiler)
7. [API-endpoints](#api-endpoints)
8. [Felsökning](#felsökning)
9. [Versionshistorik](#versionshistorik)

---

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

---

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

---

## Konfigurationsfiler

### 1. `config/api_catalog.json` – Huvudkonfiguration

**Plats:** `/config/api_catalog.json`

```json
{
  "version": "4.0.0",
  "active_features": {
    "intent_engine": false,    // ❌ Avstängd
    "typo_checker": false,     // ❌ Avstängd  
    "time_context": true       // ✅ Alltid på
  },
  "api_catalog": { ... }
}
```

### Aktivera/Inaktivera funktioner

| Funktion | Default | Beskrivning |
|----------|---------|-------------|
| `intent_engine` | `false` | Semantisk intent-detektering |
| `typo_checker` | `false` | Stavningskontroll |
| `time_context` | `true` | Tid/datum/årstid |

---

## Komplett API-katalog

### Alla 31 kategorier

| # | Kategori | APIs | Entity krävs | Exempel-fråga |
|---|----------|------|--------------|---------------|
| 1 | **befolkning** | SCB, Skatteverket | ✅ kommun | "Hur många bor i Hjo?" |
| 2 | **väder** | SMHI, YR.no | ✅ stad | "Vädret i Stockholm?" |
| 3 | **nyheter** | SVT, SR Ekot, Omni | ❌ | "Senaste nyheterna?" |
| 4 | **kris** | Krisinformation.se, MSB | ❌ | "Krislarm?" |
| 5 | **politik** | Riksdagen | ❌ | "Vad röstade riksdagen?" |
| 6 | **trafik** | Trafikverket | ❌ | "Trafikinfo E4?" |
| 7 | **statistik** | SCB | ❌ | "Arbetslöshetsstatistik?" |
| 8 | **skatt** | Skatteverket, SCB | ❌ | "Snittinkomst?" |
| 9 | **elpris** | Energimyndigheten, Nord Pool | ❌ | "Elpris SE3?" |
| 10 | **hälsa** | Socialstyrelsen, FHM | ❌ | "Vårdköer?" |
| 11 | **miljö** | Naturvårdsverket, SMHI | ❌ | "Luftkvalitet?" |
| 12 | **fastighet** | Lantmäteriet, Boverket | ✅ kommun | "Fastighet Göteborg?" |
| 13 | **skola** | Skolverket | ❌ | "Läroplan?" |
| 14 | **arbetsmarknad** | Arbetsförmedlingen, SCB | ❌ | "Lediga jobb?" |
| 15 | **studier** | UHR, CSN | ❌ | "Studiemedel?" |
| 16 | **företag** | Bolagsverket, Allabolag | ❌ | "Sök företag?" |
| 17 | **migration** | Migrationsverket | ❌ | "Asylstatistik?" |
| 18 | **socialförsäkring** | Försäkringskassan | ❌ | "Föräldrapenning?" |
| 19 | **forskning** | Vinnova, Formas, VR | ❌ | "Forskningsbidrag?" |
| 20 | **turism** | Visit Sweden | ❌ | "Turistinfo?" |
| 21 | **upphandling** | Konkurrensverket | ❌ | "Offentlig upphandling?" |
| 22 | **konsument** | Konsumentverket | ❌ | "Reklamationsrätt?" |
| 23 | **öppen_data** | Dataportal.se, DIGG | ❌ | "Öppen data?" |
| 24 | **ordbok** | SAOL | ✅ ord | "Vad betyder kvintessens?" |
| 25 | **skog** | SLU | ❌ | "Skogsdata?" |
| 26 | **infrastruktur** | Trafikverket | ❌ | "Vägarbeten?" |
| 27 | **elmarknad** | EI | ❌ | "Nätavgifter?" |
| 28 | **bygglov** | Boverket | ✅ kommun | "Bygglov?" |
| 29 | **bostad** | Hemnet, SCB | ❌ | "Bostadspriser?" |
| 30 | **kultur** | Riksarkivet, KB | ❌ | "Arkiv?" |
| 31 | **sökning** | Tavily | ❌ | "Vad är senaste om...?" |

---

## API-implementationer – Detaljerad Status

### ✅ AKTIVA API:er (Riktiga anrop med data)

| API-namn | Källa | URL | Funktion | Status |
|----------|-------|-----|----------|--------|
| `scb_population` | SCB | api.scb.se | `fetch_scb_population()` | ✅ RIKTIG DATA |
| `skatteverket_folkbokföring` | Skatteverket | via SCB | `fetch_skatteverket_population()` | ✅ RIKTIG DATA |
| `smhi_current` | SMHI | opendata-download-metfcst.smhi.se | `get_weather()` | ✅ RIKTIG DATA |
| `krisinformation` | Krisinformation.se | api.krisinformation.se | `fetch_krisinformation()` | ✅ RIKTIG DATA |
| `riksdagen_dokumentlista` | Riksdagen | data.riksdagen.se | `fetch_riksdagen_data()` | ✅ RIKTIG DATA |
| `arbetsformedlingen` | Arbetsförmedlingen | jobsearch.api.jobtechdev.se | `fetch_arbetsformedlingen_jobs()` | ✅ RIKTIG DATA |
| `svt_nyheter` | SVT | svt.se/nyheter/rss.xml | `fetch_svt_news()` | ✅ RSS |
| `sr_ekot` | Sveriges Radio | api.sr.se/api/rss | `fetch_sr_ekot_news()` | ✅ RSS |
| `omni` | Omni | omni.se/rss | `fetch_omni_news()` | ✅ RSS |
| `dataportal` | Dataportal.se | dataportal.se/api | `fetch_open_data_search()` | ✅ RIKTIG DATA |

### ℹ️ INFORMATIVA API:er (Länkar till källa)

| API-namn | Källa | Funktion | Varför inte dynamisk? |
|----------|-------|----------|----------------------|
| `trafikverket_info` | Trafikverket | `fetch_trafikverket_data()` | Kräver API-nyckel |
| `lantmateriet` | Lantmäteriet | `fetch_lantmateriet_data()` | Kräver API-nyckel |
| `hemnet` | Hemnet | `fetch_hemnet_data()` | Ingen publik API |
| `nordpool` | Nord Pool | `fetch_nordpool_elpris()` | Kräver API-nyckel |
| `saol` | SAOL | `fetch_saol_data()` | Kräver registrering |
| `skolverket` | Skolverket | `fetch_skolverket_data()` | Begränsad API |
| `bolagsverket` | Bolagsverket | `fetch_bolagsverket_data()` | Ingen publik API |
| `migrationsverket` | Migrationsverket | `fetch_migrationsverket_data()` | Ingen publik API |
| `forsakringskassan` | Försäkringskassan | `fetch_forsakringskassan_data()` | Ingen publik API |
| `socialstyrelsen` | Socialstyrelsen | `fetch_socialstyrelsen_data()` | Begränsad API |
| `folkhalsomyndigheten` | FHM | `fetch_folkhalsomyndigheten_data()` | Begränsad API |
| `naturvardsverket` | Naturvårdsverket | `fetch_naturvardsverket_data()` | Begränsad API |
| `csn` | CSN | `fetch_csn_data()` | Ingen publik API |
| `riksarkivet` | Riksarkivet | `fetch_riksarkivet_data()` | Sökbaserad |
| `kungliga_biblioteket` | KB | `fetch_kungliga_biblioteket_data()` | Sökbaserad |
| `vinnova` | Vinnova | `fetch_vinnova_data()` | Ingen publik API |

---

## Kodfiler

### Backend (Python/FastAPI)

| Fil | Syfte | Rad-nummer |
|-----|-------|------------|
| `ml_service/server.py` | Huvudserver | – |
| ↳ API-funktioner | Alla fetch-funktioner | ~739-1600 |
| ↳ `api_function_map` | API-namn → funktion | ~6458 |
| ↳ Self-Steering | Kategori-matchning | ~5924-6200 |
| `config/api_catalog.json` | API-katalog | – |

### Frontend (React)

| Fil | Syfte |
|-----|-------|
| `frontend/src/pages/MessageBuilderPage.jsx` | /admin/builder |

---

## API-endpoints

```
GET  /api/ml/delta-plus/status           # Modulstatus
GET  /api/ml/delta-plus/active-features  # Aktiva funktioner
POST /api/ml/delta-plus/active-features  # Ändra funktioner
GET  /api/ml/delta-plus/api-catalog      # Hela katalogen
GET  /api/ml/delta-plus/api-catalog/{category}  # Specifik kategori
```

---

## Felsökning

### Terminal-debug

```
======================================================================
🔧 MESSAGE BUILDER DEBUG - API FETCH
======================================================================
  📝 Question: Hur många bor i Hjo?
----------------------------------------------------------------------
  ONESEEK Δ+ v4.0 CONFIG:
    Global Intent Engine: ❌ DISABLED (Self-Steering)
    Mode: ⚡ Self-Steering (v4.0)
----------------------------------------------------------------------
  ⚡ SELF-STEERING MODE (v4.0)
    📚 API Catalog loaded: 31 categories
    ✓ Category matched: befolkning
      Keywords: ['hur många bor']
      APIs: ['scb_population', 'skatteverket_folkbokföring']
      Entity detected: Hjo
  📡 PARALLEL FETCH: Starting 2 API calls...
    ✓ SCB: Data received (437ms)
    ✓ Skatteverket: Data received (325ms)
  📊 PARALLEL FETCH COMPLETE: 2 APIs, 437ms total
======================================================================
```

### Vanliga problem

| Problem | Lösning |
|---------|---------|
| "No handler implemented" | Lägg till i `api_function_map` |
| "Category not matched" | Lägg till keywords i `api_catalog.json` |
| "Entity required but not found" | Kontrollera `entity_type` |

---

## Versionshistorik

| Version | Datum | Ändringar |
|---------|-------|-----------|
| 4.0.0 | 2025-12-03 | Self-Steering, 31 kategorier, parallell hämtning, 50+ API-funktioner |
| 3.3.0 | 2025-11 | Autonomy Engine |
| 3.0.0 | 2025-10 | DNA v2 certifiering |

---

*ONESEEK Δ+ v4.0 – Byggd i Sverige 🇸🇪*
