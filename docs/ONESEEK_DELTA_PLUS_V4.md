# ONESEEK Δ+ v4.0 – Self-Steering AI Documentation

## Översikt

ONESEEK Δ+ v4.0 är en fullständigt självstyrd AI som automatiskt väljer rätt API-kategori och datakällor baserat på användarens fråga. Intent Engine och Typo Checker är **avstängda som default** – systemet använder `api_catalog.json` och `open_data_apis.json` för kategori-matchning och parallell API-hämtning.

**Senast uppdaterad:** 2025-12-03

### Två konfigurationsfiler för API:er

| Fil | Syfte | Antal API:er |
|-----|-------|--------------|
| `config/api_catalog.json` | Self-Steering kategorier med parallell hämtning | 31 kategorier |
| `config/open_data_apis.json` | Öppna data-API:er med triggers | 31 API:er |

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

### 1. `config/api_catalog.json` – Self-Steering kategorier

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

### 2. `config/open_data_apis.json` – Öppna data-API:er

**Plats:** `/config/open_data_apis.json`

Innehåller 31 Svenska öppna data-API:er med triggers och fallback-meddelanden.

### 3. `config/api_keys.json` – API-nycklar (för skyddade API:er)

**Plats:** `/config/api_keys.json`

Vissa API:er kräver autentisering. Skapa filen från mallen:

```bash
cp config/api_keys.json.example config/api_keys.json
```

**Innehåll:**
```json
{
  "trafikverket_api_key": "din-nyckel-här",
  "lantmateriet_api_key": "",
  "bolagsverket_api_key": ""
}
```

**Hämta API-nycklar:**
| API | URL för registrering |
|-----|---------------------|
| Trafikverket | https://api.trafikinfo.trafikverket.se/ |
| Lantmäteriet | https://opendata.lantmateriet.se/ |
| Bolagsverket | https://bolagsverket.se/om-oss/utveckling-av-digitala-tjanster/oppna-data |

**Alternativ:** Sätt via miljövariabel:
```bash
export TRAFIKVERKET_API_KEY="din-nyckel"
```

### 4. `config/rss_feeds.json` – RSS-flöden

Nyhetsflöden från SVT, SR Ekot, Omni för realtidsnyheter.

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

### ✅ AKTIVA API:er (Riktiga API-anrop som returnerar dynamisk data)

Dessa API:er gör riktiga HTTP-anrop och returnerar aktuell data:

| API-namn | Källa | API-URL | Funktion | Status |
|----------|-------|---------|----------|--------|
| `scb_population` | SCB | api.scb.se/OV0104/v1/doris/sv/ssd | `fetch_scb_population()` | ✅ RIKTIG DATA |
| `skatteverket_folkbokföring` | Skatteverket | via SCB månadsstatistik | `fetch_skatteverket_population()` | ✅ RIKTIG DATA |
| `smhi_current` | SMHI | opendata-download-metfcst.smhi.se | `get_weather()` | ✅ RIKTIG DATA |
| `krisinformation` | Krisinformation.se | api.krisinformation.se/v3 | `fetch_krisinformation()` | ✅ RIKTIG DATA |
| `riksdagen_dokumentlista` | Riksdagen | data.riksdagen.se/dokumentlista | `fetch_riksdagen_data()` | ✅ RIKTIG DATA |
| `arbetsformedlingen` | Arbetsförmedlingen | jobsearch.api.jobtechdev.se/search | `fetch_arbetsformedlingen_jobs()` | ✅ RIKTIG DATA |
| `svt_nyheter` | SVT | svt.se/nyheter/rss.xml | `fetch_svt_news()` | ✅ RSS |
| `sr_ekot` | Sveriges Radio | api.sr.se/api/rss/program/83 | `fetch_sr_ekot_news()` | ✅ RSS |
| `omni` | Omni | omni.se/rss | `fetch_omni_news()` | ✅ RSS |
| `dataportal` | Dataportal.se | dataportal.se/api/3/action | `fetch_open_data_search()` | ✅ RIKTIG DATA |
| `skolverket_syllabus` | Skolverket | api.skolverket.se/syllabus/v1 | `fetch_skolverket_data()` | ✅ RIKTIG DATA |

### 📋 ÖPPNA DATA API:er (från `open_data_apis.json`)

Alla 31 API:er i `config/open_data_apis.json`:

| # | API-ID | Namn | Triggers (exempel) | Status |
|---|--------|------|-------------------|--------|
| 1 | `scb` | SCB Statistik | befolkning, statistik, invånare | ✅ AKTIV |
| 2 | `trafikverket` | Trafikanalys | trafik, olycka, e4, e6 | ⚙️ Kräver API-nyckel |
| 3 | `naturvardsverket` | Naturvårdsverket | luftkvalitet, miljö, utsläpp | 📌 Informativ |
| 4 | `boverket` | Boverket | bygglov, energideklaration | 📌 Informativ |
| 5 | `riksdagen` | Riksdagen | votering, lagförslag, debatt | ✅ AKTIV |
| 6 | `slu` | SLU Riksskogstaxeringen | skog, virkesförråd | 📌 Informativ |
| 7 | `opendata` | Opendata.se | öppen data, dataportal | ✅ AKTIV |
| 8 | `digg` | DIGG | myndighet, offentlig förvaltning | 📌 Informativ |
| 9 | `krisinformation` | Krisinformation.se | kris, vma, beredskap | ✅ AKTIV |
| 10 | `skatteverket` | Skatteverket | skatt, inkomst, moms | ✅ AKTIV (via SCB) |
| 11 | `energimyndigheten` | Energimyndigheten | elpris, energi, elområde | 📌 Informativ |
| 12 | `socialstyrelsen` | Socialstyrelsen | vård, vårdkö, vaccination | 📌 Informativ |
| 13 | `lantmateriet` | Lantmäteriet | fastighet, karta, geodata | ⚙️ Kräver API-nyckel |
| 14 | `folkhalsomyndigheten` | Folkhälsomyndigheten | folkhälsa, epidemi, smitta | 📌 Informativ |
| 15 | `trafikverket_vag` | Trafikverket Väg & Järnväg | vägarbete, järnväg | ⚙️ Kräver API-nyckel → ✅ AKTIV med nyckel |
| 16 | `energimarknadsinspektionen` | EI | nätavgift, elnät | 📌 Informativ |
| 17 | `vinnova` | Vinnova | innovation, forskningsbidrag | 📌 Informativ |
| 18 | `formas` | Formas | hållbarhetsforskning, miljöforskning | 📌 Informativ |
| 19 | `vetenskapsradet` | Vetenskapsrådet | forskning, vetenskap | 📌 Informativ |
| 20 | `forsakringskassan` | Försäkringskassan | sjukpenning, föräldrapenning | 📌 Informativ |
| 21 | `migrationsverket` | Migrationsverket | migration, asyl, visum | 📌 Informativ |
| 22 | `arbetsformedlingen` | Arbetsförmedlingen | lediga jobb, arbetslöshet | ✅ AKTIV (JobTech API) |
| 23 | `uhr` | UHR | antagning, universitet | 📌 Informativ |
| 24 | `csn` | CSN | studiemedel, studiebidrag | 📌 Informativ |
| 25 | `skolverket` | Skolverket | skola, läroplan, betyg | ✅ AKTIV (Syllabus API) |
| 26 | `skolverket_syllabus` | Skolverket Syllabus API | kursplan, ämnesplan | ✅ AKTIV |
| 27 | `visitsweden` | Visit Sweden | hotell, turism, boende | 📌 Informativ |
| 28 | `bolagsverket` | Bolagsverket | bolag, företag, styrelse | ⚙️ Kräver registrering |
| 29 | `konkurrensverket` | Konkurrensverket | upphandling, konkurrens | 📌 Informativ |
| 30 | `konsumentverket` | Konsumentverket | konsument, reklamation | 📌 Informativ |
| 31 | `saol` | SAOL | vad betyder, ord, synonym | ✅ AKTIV (svenska.se sök) |

### Statusförklaringar

| Symbol | Status | Beskrivning |
|--------|--------|-------------|
| ✅ AKTIV | Fullständig | Riktiga API-anrop med dynamisk data |
| ⚙️ Kräver nyckel | Begränsad | Fungerande API men kräver API-nyckel i `config/api_keys.json` |
| 📌 Informativ | Länk-baserad | Ger direktlänk till källan med relevant info |

### 📌 INFORMATIVA API:er (Dynamiska länkar till källan)

Dessa API:er returnerar informativ text med korrekta källlänkar. De gör inte API-anrop men ger användaren direktlänkar till rätt källa:

| API-namn | Källa | Funktion | Anledning till statisk data |
|----------|-------|----------|----------------------------|
| `saol` | SAOL | `fetch_saol_data()` | Genererar sök-länk till svenska.se med användarens ord |
| `visitsweden` | Visit Sweden | – | Turistinformation med länk till visitsweden.com |
| `trafikverket_info` | Trafikverket | `fetch_trafikverket_data()` | ✅ **AKTIV med API-nyckel** – hämtar störningar, olyckor, vägarbeten |
| `lantmateriet` | Lantmäteriet | `fetch_lantmateriet_data()` | Kräver API-nyckel |
| `hemnet` | Hemnet | `fetch_hemnet_data()` | Ingen publik API tillgänglig |
| `nordpool` | Nord Pool | `fetch_nordpool_elpris()` | Kräver API-nyckel |
| `bolagsverket` | Bolagsverket | `fetch_bolagsverket_data()` | Kräver registrering |
| `migrationsverket` | Migrationsverket | `fetch_migrationsverket_data()` | Statistik publiceras i PDF |
| `forsakringskassan` | Försäkringskassan | `fetch_forsakringskassan_data()` | Ingen publik API |
| `socialstyrelsen` | Socialstyrelsen | `fetch_socialstyrelsen_data()` | Begränsad publik API |
| `folkhalsomyndigheten` | FHM | `fetch_folkhalsomyndigheten_data()` | Data publiceras på webb |
| `naturvardsverket` | Naturvårdsverket | `fetch_naturvardsverket_data()` | Begränsad publik API |
| `csn` | CSN | `fetch_csn_data()` | Ingen publik API |
| `riksarkivet` | Riksarkivet | `fetch_riksarkivet_data()` | Sökbaserad webbplats |
| `kungliga_biblioteket` | KB | `fetch_kungliga_biblioteket_data()` | Sökbaserad webbplats |
| `vinnova` | Vinnova | `fetch_vinnova_data()` | Kräver registrering |

### 🔧 Så lägger du till en ny AKTIV API

1. **Lägg till i `config/api_catalog.json`:**
```json
{
  "ny_kategori": {
    "keywords": ["nyckelord1", "nyckelord2"],
    "apis": [{"name": "ny_api", "source": "Källan"}],
    "entity_required": false
  }
}
```

2. **Skapa fetch-funktion i `ml_service/server.py`:**
```python
def fetch_ny_api(query: str = None) -> Optional[str]:
    """Hämta data från NY API."""
    try:
        url = "https://api.källa.se/endpoint"
        r = requests.get(url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            # Bearbeta data...
            result = f"**Data:**\n{formatted_data}"
            result += '\n\n**Källor:**\n'
            result += '1. <a href="https://källa.se">Källa</a>'
            return result
    except Exception:
        return None
    return "Fallback info\n\n**Källor:**\n1. <a href=\"https://källa.se\">Källa</a>"
```

3. **Lägg till i `api_function_map` (rad ~6458):**
```python
"ny_api": lambda e: fetch_ny_api(e),
```

---

## Kodfiler

### Backend (Python/FastAPI)

| Fil | Syfte | Rad-nummer |
|-----|-------|------------|
| `ml_service/server.py` | Huvudserver | – |
| ↳ API-funktioner | Alla fetch-funktioner | ~739-1600 |
| ↳ `api_function_map` | API-namn → funktion | ~6458 |
| ↳ Self-Steering | Kategori-matchning | ~5924-6200 |
| ↳ `load_open_data_apis()` | Laddar open_data_apis.json | ~693 |
| `config/api_catalog.json` | Self-Steering kategorier | – |
| `config/open_data_apis.json` | Öppna data-API:er | – |
| `config/rss_feeds.json` | Nyhets-RSS flöden | – |

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
| 4.0.0 | 2025-12-03 | Self-Steering, 31 kategorier + 31 öppna data-API:er, parallell hämtning |
| 3.3.0 | 2025-11 | Autonomy Engine |
| 3.0.0 | 2025-10 | DNA v2 certifiering |

---

*ONESEEK Δ+ v4.0 – Byggd i Sverige 🇸🇪*
