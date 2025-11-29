# OneSeek Real-Time Suite – Komplett Dokumentation

> **Version**: 1.0.0  
> **Uppdaterad**: 2025-11-29  
> **Status**: Production Ready

---

## 📖 Innehållsförteckning

1. [Översikt](#översikt)
2. [Arkitektur & Dataflöde](#arkitektur--dataflöde)
3. [Tjänster & Funktioner](#tjänster--funktioner)
   - [Force-Svenska](#1-force-svenska)
   - [Tavily Web Search](#2-tavily-web-search)
   - [Tid & Datum](#3-tid--datum)
   - [Årstidsmedvetenhet](#4-årstidsmedvetenhet)
   - [Väder (SMHI)](#5-väder-smhi)
   - [RSS Nyhetsfeeds](#6-rss-nyhetsfeeds)
   - [Svenska Öppna Data APIs](#7-svenska-öppna-data-apis)
4. [Konfigurationsfiler](#konfigurationsfiler)
5. [API Endpoints](#api-endpoints)
6. [Admin Dashboard](#admin-dashboard)
7. [Dataflödesdiagram](#dataflödesdiagram)
8. [Installation & Konfiguration](#installation--konfiguration)

---

## Översikt

**OneSeek Real-Time Suite** är ett komplett paket av realtidstjänster som ger OneSeek AI-modellen tillgång till aktuell information om tid, väder, nyheter och svenska öppna data. Alla tjänster är 100% styrda via Admin Dashboard utan behov av serveromstart.

### Huvudfunktioner

| Tjänst | Beskrivning | Datakälla | API-nyckel |
|--------|-------------|-----------|------------|
| Force-Svenska | Tvingar svenska svar | langdetect + triggers | ❌ Nej |
| Tavily Search | Realtidsfakta från webben | Tavily API | ✅ Ja |
| Tid & Datum | Aktuell svensk tid | Systemklocka | ❌ Nej |
| Årstid | Aktuell årstid | Systemklocka | ❌ Nej |
| Väder | Svensk väderprognos | SMHI | ❌ Nej |
| Nyheter | Senaste nyheterna | RSS-feeds | ❌ Nej |
| Öppna Data | 25 svenska myndighets-APIs | Diverse | ❌ Nej |

---

## Arkitektur & Dataflöde

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                                       │
│                    "Hur blir vädret i Stockholm imorgon?"                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ML SERVICE (FastAPI)                                 │
│                         ml_service/server.py                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐             │
│  │ 1. FORCE-SVENSKA│  │ 2. TIME CONTEXT │  │ 3. SEASON       │             │
│  │                 │  │                 │  │                 │             │
│  │ is_swedish()    │  │ inject_time_    │  │ get_current_    │             │
│  │ check_force_    │  │ context()       │  │ season()        │             │
│  │ svenska()       │  │                 │  │                 │             │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘             │
│           │                    │                    │                       │
│           ▼                    ▼                    ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CONTEXT AGGREGATOR                               │   │
│  │                                                                      │   │
│  │  context_parts = [                                                   │   │
│  │    "[Aktuell tid] Måndag den 29 nov 2025. Klockan är 13:10"        │   │
│  │    "[Årstid] Vi är mitt i hösten just nu."                          │   │
│  │    "[Väder] I Stockholm blir det imorgon ca 4°C och regn."         │   │
│  │    "[Force-Svenska] Du pratar alltid svenska..."                    │   │
│  │  ]                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│           │                                                                 │
│           ▼                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     ONESEEK MODEL INFERENCE                          │   │
│  │                     (DNA v2 Certified)                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER RESPONSE                                      │
│         "Imorgon i Stockholm blir det ca 4°C och regn. Vi är mitt          │
│          i hösten just nu, så ta med dig en varm jacka!"                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tjänster & Funktioner

### 1. Force-Svenska

**Syfte**: Säkerställer att OneSeek alltid svarar på svenska när användaren skriver på svenska.

#### Dataflöde

```
┌──────────────────────┐
│   User Message       │
│  "Hej, hur mår du?"  │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         is_swedish(text)                                  │
├──────────────────────────────────────────────────────────────────────────┤
│  1. Prova langdetect.detect(text)                                        │
│     - Returnerar "sv", "da", eller "no" → Svenska!                       │
│     - LangDetectException → Fallback till triggers                       │
│                                                                          │
│  2. Fallback: Kolla mot FORCE_SVENSKA_TRIGGERS                          │
│     - Laddas från config/force_swedish.json                              │
│     - Default: ["hej", "vad", "vem", "hur", "varför", "när"...]          │
└──────────────────────────────────────────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  Om svenska detekterad → Lägg till system message:                       │
│  "Du pratar alltid svenska. Inga engelska ord. Inga undantag."          │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Funktioner

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `load_force_swedish()` | server.py:83 | Laddar triggers från JSON |
| `is_swedish(text)` | server.py:109 | Primär språkdetektering med langdetect |
| `check_force_svenska(text)` | routers.py | Kontrollerar om Force-Svenska ska aktiveras |

#### Konfiguration

**Fil**: `config/force_swedish.json`

```json
{
  "triggers": [
    "hej", "vad", "vem", "hur", "varför", "när", "kan du", "är du",
    "vill du", "ska vi", "tack", "snälla", "förlåt", "god morgon",
    "god kväll", "vad heter du", "vad gör du", "vad tycker du"
  ]
}
```

#### API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| `GET` | `/api/force-swedish` | Hämta aktuella triggers |
| `POST` | `/api/force-swedish` | Spara nya triggers |

---

### 2. Tavily Web Search

**Syfte**: Hämtar realtidsfakta från webben när användaren ställer frågor om aktuella händelser.

#### Dataflöde

```
┌──────────────────────────────────────┐
│ User Message                          │
│ "Vad säger nya lagen om AI 2025?"    │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    check_tavily_trigger(user_msg)                        │
├──────────────────────────────────────────────────────────────────────────┤
│  1. Kolla om något trigger-ord finns i meddelandet                       │
│     triggers: ["vad säger", "aktuell", "senaste", "2025", "2026"...]     │
│                                                                          │
│  2. Kolla att inget blacklist-ord finns                                  │
│     blacklist: ["vem är du", "vad heter du", "berätta om dig"...]       │
│                                                                          │
│  3. Om trigger HIT och INTE blacklisted → Aktivera Tavily               │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       tavily_search(query)                               │
├──────────────────────────────────────────────────────────────────────────┤
│  POST https://api.tavily.com/search                                      │
│  {                                                                       │
│    "api_key": TAVILY_API_KEY,                                           │
│    "query": "Vad säger nya lagen om AI 2025?",                          │
│    "search_depth": "advanced",                                           │
│    "include_answer": true,                                               │
│    "max_results": 4                                                      │
│  }                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    format_tavily_sources(data)                           │
├──────────────────────────────────────────────────────────────────────────┤
│  **Källor:**                                                             │
│  1. [EU AI Act - Regeringen.se](https://...)                            │
│  2. [AI-lagen 2025 - SVD](https://...)                                  │
│  3. [Ny lag om artificiell intelligens - DN](https://...)               │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Funktioner

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `load_tavily_config()` | server.py:161 | Laddar triggers och blacklist |
| `check_tavily_trigger(msg)` | server.py:812 | Kontrollerar om Tavily ska aktiveras |
| `tavily_search(query)` | server.py:757 | Gör API-anrop till Tavily |
| `format_tavily_sources(data)` | server.py:787 | Formaterar källor som markdown |

#### Konfiguration

**Fil**: `config/tavily_triggers.json`

```json
{
  "triggers": [
    "vad säger", "aktuell", "senaste", "2025", "2026", "hände", "blir det",
    "lag", "regel", "kostar", "händer", "ny", "nya", "ändrats", "ändring"
  ],
  "blacklist": [
    "vem är du", "vad heter du", "berätta om dig", "vad tycker du",
    "vad känner du", "älskar du", "hatar du"
  ]
}
```

#### Miljövariabel

```bash
export TAVILY_API_KEY="tvly-xxxxxxxxxxxxx"
```

#### API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| `GET` | `/api/tavily-triggers` | Hämta triggers och blacklist |
| `POST` | `/api/tavily-triggers` | Spara triggers och blacklist |

---

### 3. Tid & Datum

**Syfte**: OneSeek är alltid medveten om aktuell tid och datum.

#### Dataflöde

```
┌───────────────────────────────────────────────────────────────┐
│                   inject_time_context()                        │
├───────────────────────────────────────────────────────────────┤
│  now = datetime.datetime.now()                                │
│                                                               │
│  1. Hämta svensk veckodag                                     │
│     days_sv = ["Måndag", "Tisdag", ...]                       │
│                                                               │
│  2. Hämta svensk månad                                        │
│     months_sv = ["januari", "februari", ...]                  │
│                                                               │
│  3. Formatera output                                          │
│     "Idag är det Fredag den 29 november 2025.                │
│      Klockan är 13:10 (svensk tid)."                         │
└───────────────────────────────────────────────────────────────┘
```

#### Funktion

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `inject_time_context()` | server.py:574 | Genererar svensk tid- och datumtext |

#### Output Format

```
"Idag är det Fredag den 29 november 2025. Klockan är 13:10 (svensk tid)."
```

---

### 4. Årstidsmedvetenhet

**Syfte**: OneSeek vet vilken årstid det är.

#### Dataflöde

```
┌───────────────────────────────────────────────────────────────┐
│                   get_current_season()                         │
├───────────────────────────────────────────────────────────────┤
│  month = datetime.now().month                                 │
│                                                               │
│  seasons = {                                                  │
│    12, 1, 2: "vintern"                                       │
│    3, 4, 5: "våren"                                          │
│    6, 7, 8: "sommaren"                                       │
│    9, 10, 11: "hösten"                                       │
│  }                                                            │
│                                                               │
│  Output: "Vi är mitt i hösten just nu."                      │
└───────────────────────────────────────────────────────────────┘
```

#### Funktion

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `get_current_season()` | server.py:557 | Returnerar aktuell årstid på svenska |

---

### 5. Väder (SMHI)

**Syfte**: Hämtar väderprognos för svenska städer från SMHI (gratis, ingen API-nyckel).

#### Dataflöde

```
┌──────────────────────────────────────┐
│ User Message                          │
│ "Hur blir vädret i Malmö imorgon?"   │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    check_weather_city(user_msg)                          │
├──────────────────────────────────────────────────────────────────────────┤
│  1. Kolla om väder-keywords finns:                                       │
│     ["vädret", "regnar", "soligt", "imorgon", "väder", "temperatur"...] │
│                                                                          │
│  2. Sök efter stadsnamn i SWEDISH_CITIES                                │
│     {"stockholm", "göteborg", "malmö", "uppsala", "luleå"...}           │
│                                                                          │
│  3. Returnera matchad stad eller "stockholm" som default                │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    get_weather(city="malmö")                             │
├──────────────────────────────────────────────────────────────────────────┤
│  1. Hämta koordinater från SWEDISH_CITIES                               │
│     malmö: {"lon": 13.00, "lat": 55.61}                                 │
│                                                                          │
│  2. Anropa SMHI API                                                      │
│     GET https://opendata-download-metfcst.smhi.se/api/category/pmp3g/   │
│         version/2/geotype/point/lon/13.00/lat/55.61/data.json           │
│                                                                          │
│  3. Parse respons                                                        │
│     - Temperatur (t): 4.2                                               │
│     - Nederbördskategori (pcat): 3 = "regn"                             │
│                                                                          │
│  4. Formatera output                                                     │
│     "I Malmö blir det imorgon ca 4°C och regn."                        │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Funktioner

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `load_swedish_cities()` | server.py:210 | Laddar städer från JSON |
| `check_weather_city(msg)` | server.py:718 | Detekterar väder-fråga och stad |
| `get_weather(city)` | server.py:601 | Hämtar väderdata från SMHI |

#### Konfiguration

**Fil**: `config/swedish_cities.json`

```json
{
  "cities": {
    "stockholm": {"lon": 18.07, "lat": 59.33},
    "göteborg": {"lon": 11.97, "lat": 57.71},
    "malmö": {"lon": 13.00, "lat": 55.61},
    "uppsala": {"lon": 17.64, "lat": 59.86},
    "luleå": {"lon": 22.16, "lat": 65.58},
    "västerås": {"lon": 16.54, "lat": 59.61},
    "örebro": {"lon": 15.21, "lat": 59.27},
    "linköping": {"lon": 15.62, "lat": 58.41},
    "helsingborg": {"lon": 12.69, "lat": 56.05},
    "jönköping": {"lon": 14.16, "lat": 57.78}
  }
}
```

#### Nederbördskategorier (SMHI pcat)

| Kod | Svenska |
|-----|---------|
| 0 | ingen nederbörd |
| 1 | snö |
| 2 | snö och regn |
| 3 | regn |
| 4 | duggregn |
| 5 | fryst duggregn |
| 6 | fryst regn |

#### API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| `GET` | `/api/swedish-cities` | Hämta alla städer |
| `POST` | `/api/swedish-cities` | Uppdatera städer |

---

### 6. RSS Nyhetsfeeds

**Syfte**: Hämtar senaste nyheterna från konfigurerbara RSS-feeds.

#### Dataflöde

```
┌──────────────────────────────────────┐
│ User Message                          │
│ "Vad är det senaste nyheterna?"      │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    check_news_trigger(user_msg)                          │
├──────────────────────────────────────────────────────────────────────────┤
│  NEWS_KEYWORDS = [                                                       │
│    "senaste nyheterna", "vad hände idag", "nyheter",                    │
│    "vad är det senaste", "aktuella nyheter"                             │
│  ]                                                                       │
│                                                                          │
│  Returnerar True om något keyword matchar                               │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    get_latest_news()                                     │
├──────────────────────────────────────────────────────────────────────────┤
│  För varje feed i RSS_FEEDS:                                            │
│    1. feedparser.parse(feed.url)                                        │
│    2. Hämta 2 senaste entries per feed                                  │
│    3. Extrahera title, summary, link, source                            │
│                                                                          │
│  Sortera alla entries efter published (nyast först)                     │
│  Returnera topp 5 nyheter                                               │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    format_news_for_context(news)                         │
├──────────────────────────────────────────────────────────────────────────┤
│  **Senaste nyheterna:**                                                  │
│  1. [Regeringen presenterar ny klimatlag](https://...) (SVT Nyheter)   │
│  2. [Strejk hotar i Göteborgs hamn](https://...) (Omni)                 │
│  3. [Rekordvärme i Malmö](https://...) (SR Ekot)                        │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Funktioner

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `load_rss_feeds()` | server.py:251 | Laddar feeds från JSON |
| `check_news_trigger(msg)` | server.py:743 | Kontrollerar om nyhetsfråga |
| `get_latest_news()` | server.py:665 | Hämtar nyheter från alla feeds |
| `format_news_for_context(news)` | server.py:698 | Formaterar som markdown |

#### Konfiguration

**Fil**: `config/rss_feeds.json`

```json
{
  "feeds": [
    {"name": "SVT Nyheter", "url": "https://www.svt.se/nyheter/rss.xml"},
    {"name": "SVT Inrikes", "url": "https://www.svt.se/nyheter/inrikes/rss.xml"},
    {"name": "Omni", "url": "https://omni.se/rss"},
    {"name": "SR Ekot", "url": "https://api.sr.se/api/rss/program/83"}
  ]
}
```

#### Beroenden

```
feedparser>=6.0.0
```

#### API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| `GET` | `/api/rss-feeds` | Hämta alla feeds |
| `POST` | `/api/rss-feeds` | Uppdatera feeds |

---

### 7. Svenska Öppna Data APIs

**Syfte**: Tillgång till 25 svenska myndighets-APIs utan API-nycklar.

#### Tillgängliga APIs

| ID | Namn | Beskrivning | Triggers |
|----|------|-------------|----------|
| `scb` | SCB Statistik | Befolkning, ekonomi, statistik | befolkning, statistik, invånare, ekonomi |
| `trafikverket` | Trafikanalys | Trafikflöde, olyckor | trafik, e4, e6, e18, e20 |
| `naturvardsverket` | Naturvårdsverket | Luftkvalitet, miljödata | luftkvalitet, miljö, utsläpp |
| `boverket` | Boverket | Bygglov, energideklarationer | bygglov, energideklaration |
| `riksdagen` | Riksdagen | Voteringar, lagförslag, debatter | riksdagen, votering, lagförslag |
| `slu` | SLU | Skogsdata, virkesförråd | skog, virkesförråd |
| `opendata` | Opendata.se | Sök i alla svenska öppna data | öppen data, dataportal |
| `digg` | DIGG | Offentliga register | digg, myndighet |
| `krisinformation` | Krisinformation.se | Krislarm, VMA | kris, vma, varning |
| `skatteverket` | Skatteverket | Skatte- och deklarationsstatistik | skatt, inkomst, moms, snittinkomst |
| `energimyndigheten` | Energimyndigheten | Energistatistik, elpriser | elpris, energi, vad kostar elen, se3 |
| `socialstyrelsen` | Socialstyrelsen | Hälsostatistik, vårdköer | vård, vårdkö, sjukvård, vaccination |
| `lantmateriet` | Lantmäteriet | Geodata, fastigheter, kartor | fastighet, karta, tomt, geodata |
| `folkhalsomyndigheten` | Folkhälsomyndigheten | Hälsodata, epidemi, smittspridning | folkhälsa, epidemi, smitta, covid |
| `trafikverket_vag` | Trafikverket Väg & Järnväg | Vägarbeten, järnvägsdata | vägarbete, järnväg, tågförseningar |
| `energimarknadsinspektionen` | Energimarknadsinspektionen | Elmarknad, nätpriser | nätavgift, elnät, elmarknad |
| `vinnova` | Vinnova | Innovation, forskning, bidrag | innovation, vinnova, startup |
| `formas` | Formas | Forskning, hållbarhet | formas, hållbarhetsforskning |
| `vetenskapsradet` | Vetenskapsrådet | Forskning, vetenskapliga projekt | vetenskapsrådet, forskning, vetenskap |
| `forsakringskassan` | Försäkringskassan | Socialförsäkring, bidrag | sjukpenning, föräldrapenning, barnbidrag |
| `migrationsverket` | Migrationsverket | Migration, asyl, visum | migration, asyl, uppehållstillstånd |
| `arbetsformedlingen` | Arbetsförmedlingen | Arbetsmarknad, lediga jobb | lediga jobb, arbetslöshet, arbetsmarknad |
| `uhr` | UHR | Antagningsstatistik, universitet | antagning, universitet, högskola |
| `csn` | CSN | Studiemedel, bidrag, lån | studiemedel, csn, studiebidrag |
| `skolverket` | Skolverket (Susa-navet) | Utbildningsstatistik, skolor | skola, skolverket, läroplan, betyg |

#### Dataflöde

```
┌──────────────────────────────────────┐
│ User Message                          │
│ "Vad röstade riksdagen om igår?"     │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    check_open_data_trigger(user_msg)                     │
├──────────────────────────────────────────────────────────────────────────┤
│  För varje API i OPEN_DATA_APIS:                                        │
│    - Kolla om enabled == true                                            │
│    - Kolla om något trigger-ord matchar                                  │
│    - Returnera första matchade API-config                               │
│                                                                          │
│  Resultat: riksdagen API (triggers: riksdagen, röstade, votering...)    │
└──────────────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    fetch_open_data(api, query)                           │
├──────────────────────────────────────────────────────────────────────────┤
│  Välj rätt fetch-funktion baserat på api.id:                            │
│                                                                          │
│  "riksdagen" → fetch_riksdagen_data(query)                              │
│    GET https://data.riksdagen.se/dokumentlista/                          │
│        ?sok=igår&utformat=json&sort=datum&sortorder=desc                │
│                                                                          │
│  Resultat:                                                               │
│    **Från Riksdagen:**                                                   │
│    • Motion om klimatpolitik (motion, 2025-11-28)                       │
│    • Votering om budgetpropositionen (votering, 2025-11-28)             │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Funktioner

| Funktion | Fil | Beskrivning |
|----------|-----|-------------|
| `load_open_data_apis()` | server.py:324 | Laddar API-config från JSON |
| `check_open_data_trigger(msg)` | server.py:347 | Matchar trigger mot alla APIs |
| `fetch_open_data(api, query)` | server.py:503 | Dispatcher för API-anrop |
| `fetch_scb_data(query)` | server.py:370 | SCB-specifik fetch |
| `fetch_krisinformation()` | server.py:397 | Krisinformation-specifik fetch |
| `fetch_riksdagen_data(query)` | server.py:424 | Riksdagen-specifik fetch |
| `fetch_trafikverket_data(query)` | server.py:456 | Trafikverket-info |
| `fetch_open_data_search(query)` | server.py:474 | Sökning i Dataportal.se |

#### Konfiguration

**Fil**: `config/open_data_apis.json`

```json
{
  "apis": [
    {
      "id": "scb",
      "name": "SCB Statistik",
      "description": "Befolkning, ekonomi, statistik från Statistiska centralbyrån",
      "base_url": "https://api.scb.se/OV0104/v1/doris/sv/ssd",
      "enabled": true,
      "triggers": ["befolkning", "statistik", "invånare", "ekonomi", "scb"],
      "fallback_message": "Kunde inte hämta data från SCB. Försök igen senare."
    },
    ...
  ]
}
```

#### API Endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| `GET` | `/api/open-data` | Hämta alla APIs och deras config |
| `POST` | `/api/open-data` | Ersätt hela API-listan |
| `PATCH` | `/api/open-data` | Uppdatera specifikt API (enable/disable, triggers) |

---

## Konfigurationsfiler

Alla konfigurationsfiler finns i `config/`-mappen:

| Fil | Innehåll | Uppdateras av |
|-----|----------|---------------|
| `force_swedish.json` | Svenska trigger-ord | Admin Dashboard |
| `tavily_triggers.json` | Sök-triggers och blacklist | Admin Dashboard |
| `swedish_cities.json` | Städer med koordinater | Admin Dashboard |
| `rss_feeds.json` | RSS-feeds för nyheter | Admin Dashboard |
| `open_data_apis.json` | Öppna Data API-konfiguration | Admin Dashboard |

---

## API Endpoints

### Sammanfattning

| Endpoint | GET | POST | PATCH | Beskrivning |
|----------|-----|------|-------|-------------|
| `/api/force-swedish` | ✅ | ✅ | ❌ | Force-Svenska triggers |
| `/api/tavily-triggers` | ✅ | ✅ | ❌ | Tavily search triggers |
| `/api/swedish-cities` | ✅ | ✅ | ❌ | Svenska städer för väder |
| `/api/rss-feeds` | ✅ | ✅ | ❌ | RSS nyhetsfeeds |
| `/api/open-data` | ✅ | ✅ | ✅ | Öppna Data APIs |

### Inference Endpoints

| Endpoint | Beskrivning |
|----------|-------------|
| `/infer` | Huvudendpoint med rate limiting (alla features) |
| `/inference/oneseek` | Direkt OneSeek inference (alla features) |

---

## Admin Dashboard

### Flikar

Admin Dashboard har nu två separata flikar för inställningar:

1. **System Prompts** - Hantera system prompts, Force-Svenska och Tavily triggers
2. **🔌 Integrations** - Hantera externa API-integrationer (Städer, RSS, Öppna Data)

### Komponenter

#### System Prompts Tab
**Fil**: `frontend/src/components/admin/SystemPromptManagement.jsx`

Sektioner:
1. **🇸🇪 Force-Svenska Triggers** (Blå)
   - Textarea för kommaseparerade trigger-ord
   - Spara-knapp med realtidsaktivering

2. **🔍 Tavily Web Search** (Grön)
   - Två textareas: triggers och blacklist
   - API-nyckel status

#### Integrations Tab
**Fil**: `frontend/src/components/admin/IntegrationsManagement.jsx`

Sektioner:
1. **🌤️ Svenska Städer (Väder)** (Cyan)
   - Redigera städer med koordinater
   - Format: `stadnamn:lat,lon`
   - Spara-knapp

2. **📰 RSS Nyhetsfeeds** (Orange)
   - Redigera RSS-feeds
   - Format: `namn:url`
   - Spara-knapp

3. **📊 Svenska Öppna Data APIs** (Lila)
   - Grid med 9 API-kort
   - Klicka för att aktivera/avaktivera
   - Grön prick = aktiv

---

## Dataflödesdiagram

### Komplett Inference-flöde

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INCOMING REQUEST                                     │
│                         POST /infer                                          │
│                         {"text": "Vad blir vädret i Göteborg imorgon?"}     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                   │
                    ▼                                   ▼
    ┌───────────────────────────────┐   ┌───────────────────────────────┐
    │   1. FORCE-SVENSKA CHECK      │   │   2. CONTEXT INJECTION        │
    │                               │   │                               │
    │   is_swedish() →              │   │   inject_time_context() →     │
    │   check_force_svenska() →     │   │   get_current_season() →      │
    │   prepend swedish instruction │   │   always inject               │
    └───────────────────────────────┘   └───────────────────────────────┘
                    │                                   │
                    └─────────────────┬─────────────────┘
                                      │
    ┌─────────────────────────────────┼─────────────────────────────────┐
    │                                 │                                 │
    ▼                                 ▼                                 ▼
┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
│ 3. WEATHER      │           │ 4. NEWS CHECK   │           │ 5. TAVILY CHECK │
│                 │           │                 │           │                 │
│ check_weather_  │           │ check_news_     │           │ check_tavily_   │
│ city() →        │           │ trigger() →     │           │ trigger() →     │
│ get_weather()   │           │ get_latest_     │           │ tavily_search() │
│                 │           │ news()          │           │                 │
└─────────────────┘           └─────────────────┘           └─────────────────┘
        │                             │                             │
        │                             │                             │
        └─────────────────────────────┼─────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      6. OPEN DATA CHECK                              │
    │                                                                      │
    │   check_open_data_trigger() → fetch_open_data()                     │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      7. CONTEXT AGGREGATION                          │
    │                                                                      │
    │   context_parts = [                                                  │
    │     "[Force-Svenska] Du pratar alltid svenska...",                  │
    │     "[Aktuell tid] Fredag den 29 november 2025. Kl 13:10",          │
    │     "[Årstid] Vi är mitt i hösten just nu.",                        │
    │     "[Väder] I Göteborg blir det imorgon ca 5°C och regn.",        │
    │   ]                                                                  │
    │                                                                      │
    │   full_input = "\n".join(context_parts) + "\n\n" + user_text       │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
    ┌──────────────────────────────────────────────────────────────────────┐
    │                      8. MODEL INFERENCE                              │
    │                                                                      │
    │   load_model('oneseek-7b-zero', ONESEEK_PATH)                       │
    │   tokenizer(full_input)                                              │
    │   model.generate(...)                                                │
    │   tokenizer.decode(outputs)                                          │
    │   clean_inference_response()                                         │
    └──────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESPONSE                                             │
│                         {                                                    │
│                           "response": "Imorgon i Göteborg blir det ca 5°C  │
│                                        och regn. Vi är mitt i hösten...",   │
│                           "model": "OneSeek DNA v2 Certified",              │
│                           "tokens": 156,                                     │
│                           "latency_ms": 1234.5                              │
│                         }                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Installation & Konfiguration

### Beroenden

```bash
pip install langdetect>=1.0.9 feedparser>=6.0.0
```

### Miljövariabler

```bash
# Obligatorisk för Tavily (valfri feature)
export TAVILY_API_KEY="tvly-xxxxxxxxxxxxx"

# Valfria
export RATE_LIMIT_PER_MINUTE=1000
export ONESEEK_DEBUG=1  # För verbose logging
```

### Starta servern

```bash
cd ml_service
python server.py --listen --auto-devices
```

### Verifiera att allt fungerar

```bash
# Health check
curl http://localhost:5000/

# Test Force-Svenska
curl -X POST http://localhost:5000/infer \
  -H "Content-Type: application/json" \
  -d '{"text": "Hej, vad heter du?"}'

# Test väder
curl -X POST http://localhost:5000/infer \
  -H "Content-Type: application/json" \
  -d '{"text": "Hur blir vädret i Stockholm imorgon?"}'

# Test nyheter
curl -X POST http://localhost:5000/infer \
  -H "Content-Type: application/json" \
  -d '{"text": "Vad är de senaste nyheterna?"}'
```

---

## Changelog

### v1.0.0 (2025-11-29)
- Initial release av OneSeek Real-Time Suite
- Force-Svenska med langdetect
- Tavily Web Search
- Tid & Datum & Årstidsmedvetenhet
- SMHI väder för 10 svenska städer
- RSS nyhetsfeeds (4 källor)
- 9 Svenska Öppna Data APIs
- Komplett Admin Dashboard integration
