# ONESEEK Δ+ v6.4 - Dataflöde för Personlighetsval och API-val

## Visuellt Dataflöde

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ONESEEK Δ+ v6.4 DATAFLÖDE                        │
│         AI-Driven Personality & API Selection with Hidden Tags      │
└─────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │  ANVÄNDARE      │
                         │  "Hur blir      │
                         │  vädret i       │
                         │  Stockholm?"    │
                         └────────┬────────┘
                                  │
                    STEG 1: FRÅGA IN
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │           BACKEND (server.py)              │
         │                                            │
         │  1. Läser frågan                          │
         │  2. Laddar config/personality_catalog.json │
         │  3. Laddar config/api_catalog.json        │
         │  4. Formaterar personlighetskarta         │
         │  5. Formaterar API-karta                  │
         │  6. Injicerar båda i system prompt        │
         └────────────────────┬───────────────────────┘
                              │
                    STEG 2: SYSTEM PROMPT + KARTOR
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │           SYSTEM PROMPT                    │
         │                                            │
         │  "Du är OneSeek-7B-Zero.                  │
         │   ...                                      │
         │   Här är din inre karta:                  │
         │                                            │
         │   {PERSONALITY_CATALOG_PLACEHOLDER}        │
         │   → === PERSONLIGHET: medveten ===        │
         │   → === PERSONLIGHET: metrolog ===        │
         │   → === PERSONLIGHET: bibliotekarie ===   │
         │                                            │
         │   Här är din API-karta:                   │
         │                                            │
         │   {MODELL_API_MAP_PLACEHOLDER}            │
         │   → === VÄDER ===                         │
         │   →   smhi_current (SMHI)                 │
         │   → === BÖCKER ===                        │
         │   →   libris_search (Libris XL)           │
         │   ..."                                     │
         └────────────────────┬───────────────────────┘
                              │
                    STEG 3: MODELLEN VÄLJER
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │              AI MODELL                     │
         │         (Mistral + LLaMA)                  │
         │                                            │
         │  1. Analyserar frågan                     │
         │  2. Läser personlighetskartan             │
         │  3. Väljer rätt personlighet              │
         │  4. Läser API-kartan                      │
         │  5. Väljer rätt API                       │
         │  6. Lägger till hidden tags:              │
         │     [PERSONLIGHET: metrolog]              │
         │     [API: smhi_current]                   │
         │  7. Svarar med personlighetens röst       │
         └────────────────────┬───────────────────────┘
                              │
                              │  RAW RESPONSE:
                              │  "[PERSONLIGHET: metrolog]
                              │   [API: smhi_current]
                              │   Vädret i Stockholm imorgon
                              │   blir klart och soligt..."
                              │
                    STEG 4: BACKEND PARSAR TAGS
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │     parse_personality_tag()                │
         │                                            │
         │  1. Hittar [PERSONLIGHET: metrolog]       │
         │  2. Hittar [API: smhi_current]            │
         │  3. Tar bort båda taggarna från svaret    │
         │  4. Loggar valen till terminal            │
         │  5. Kan byta character card i framtiden   │
         └────────────────────┬───────────────────────┘
                              │
                              │  CLEAN RESPONSE:
                              │  "Vädret i Stockholm imorgon
                              │   blir klart och soligt..."
                              │
                    STEG 5: SVAR TILL ANVÄNDARE
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │           InferenceResponse                │
         │                                            │
         │  {                                         │
         │    "response": "Vädret i Stockholm...",   │
         │    "personality": {                        │
         │      "id": "oneseek-metrolog",            │
         │      "categories": ["väder"]              │
         │    }                                       │
         │  }                                         │
         └────────────────────┬───────────────────────┘
                              │
                              ▼
                         ┌─────────────────┐
                         │    FRONTEND     │
                         │    /7B-Zero     │
                         │                 │
                         │  🎭 Metrologen  │
                         │                 │
                         │  "Vädret i      │
                         │  Stockholm..."  │
                         └─────────────────┘
```

## Placeholders i System Prompt

| Placeholder | Innehåll |
|-------------|----------|
| `{PERSONALITY_CATALOG_PLACEHOLDER}` | Minimal personlighetskarta med keywords och kategorier |
| `{MODELL_API_MAP_PLACEHOLDER}` | API-katalog med kategorier, källor och trigger-keywords |

## Hidden Tags från Modellen

| Tag | Format | Exempel |
|-----|--------|---------|
| `[PERSONLIGHET: xxx]` | Personlighetens korta namn | `[PERSONLIGHET: bibliotekarie]` |
| `[API: yyy]` | API:ns namn | `[API: libris_search]` |

## Filer som ingår

| Fil | Syfte |
|-----|-------|
| `config/personality_catalog.json` | Lista med alla personligheter, keywords, kategorier |
| `frontend/public/characters/*.yaml` | Character cards med fulla system prompts |
| `config/api_catalog.json` | API:er med `personality_tags` för filtrering |
| `ml_service/server.py` | Inference-logik, tag-parsing, debug-loggning |

## Terminal Debug Output

När du kör en fråga via `/admin/builder` eller `/7B-Zero` ser du detta i terminalen:

```
======================================================================
🎭 ONESEEK Δ+ v6.4 - DATAFLÖDE FÖR PERSONLIGHETSVAL
======================================================================

📋 STEG 2: LADDAR PERSONLIGHETSKATALOG
   Fil: config/personality_catalog.json
   Formaterad katalog (847 tecken)

📋 STEG 2b: LADDAR API-KARTA
   Fil: config/api_catalog.json
   Formaterad API-karta (2341 tecken)

✅ PERSONALITY_CATALOG_PLACEHOLDER ersatt!
✅ MODELL_API_MAP_PLACEHOLDER ersatt!

📊 INFERENCE SUMMARY - ONESEEK Δ+ v6.4
------------------------------------------------------------
🎭 Base: oneseek-medveten (SHE chooses personality from catalog)
📂 {PERSONALITY_CATALOG_PLACEHOLDER}: ✅ injected
📡 {MODELL_API_MAP_PLACEHOLDER}: ✅ injected
🧠 Model reads catalogs → chooses personality → chooses API
🏷️ Model responds with: [PERSONLIGHET: xxx] + [API: yyy]

======================================================================
🏷️  ONESEEK Δ+ v6.4 - PARSING HIDDEN TAGS
======================================================================
📝 Raw response (first 300 chars):
   '[PERSONLIGHET: metrolog] [API: smhi_current] Vädret i Stockholm...'

✅ PERSONLIGHET TAG FOUND!
   🎭 Raw tag value: 'metrolog'
   🎭 Full ID: 'oneseek-metrolog'

✅ API TAG FOUND!
   📡 Selected API: 'smhi_current'

📝 Clean response (first 150 chars):
   'Vädret i Stockholm imorgon blir klart...'
======================================================================
```

## Viktiga Funktioner

### 1. `format_personality_catalog_for_prompt()`
Skapar den mänskligt läsbara personlighetskartan som injiceras via `{PERSONALITY_CATALOG_PLACEHOLDER}`.

### 2. `format_api_map_for_prompt()`
Skapar den mänskligt läsbara API-kartan som injiceras via `{MODELL_API_MAP_PLACEHOLDER}`.

### 3. `parse_personality_tag(response)`
Parsar både `[PERSONLIGHET: xxx]` och `[API: yyy]` taggarna från modellens svar och returnerar rent svar.

### 4. `get_personality_info(personality_id)`
Hämtar personlighetsinfo för frontend-visning.

## Debugging Tips

1. **Kolla terminalen** - All debug-info skrivs till terminalen
2. **Sök efter `[PERSONLIGHET:`** i modellens råa svar
3. **Sök efter `[API:`** i modellens råa svar
4. **Verifiera att båda placeholders** ersätts korrekt
5. **Kontrollera character card** finns i `frontend/public/characters/`
