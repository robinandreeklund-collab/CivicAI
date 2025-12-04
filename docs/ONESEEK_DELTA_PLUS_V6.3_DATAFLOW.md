# ONESEEK Δ+ v6.3 - Dataflöde för Personlighetsval

## Visuellt Dataflöde

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ONESEEK Δ+ v6.3 DATAFLÖDE                        │
│                    AI-Driven Personality Selection                   │
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
         │  3. Formaterar personlighetskarta         │
         │  4. Injicerar i system prompt             │
         └────────────────────┬───────────────────────┘
                              │
                    STEG 2: SYSTEM PROMPT + KARTA
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │           SYSTEM PROMPT                    │
         │                                            │
         │  "Du är OneSeek-7B-Zero.                  │
         │   ...                                      │
         │   Här är din inre karta:                  │
         │                                            │
         │   === PERSONLIGHET: medveten (default) === │
         │   Nyckelord: hej, vem, vad                │
         │   Kategori: allmän                         │
         │                                            │
         │   === PERSONLIGHET: metrolog ===          │
         │   Nyckelord: väder, regn, snö, sol        │
         │   Kategori: väder                          │
         │                                            │
         │   === PERSONLIGHET: bibliotekarie ===     │
         │   Nyckelord: bok, författare, isbn        │
         │   Kategori: böcker                         │
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
         │  4. Lägger till hidden tag:               │
         │     [PERSONLIGHET: metrolog]              │
         │  5. Svarar med personlighetens röst       │
         └────────────────────┬───────────────────────┘
                              │
                              │  RAW RESPONSE:
                              │  "[PERSONLIGHET: metrolog]
                              │   Vädret i Stockholm imorgon
                              │   blir klart och soligt..."
                              │
                    STEG 4: BACKEND PARSAR TAG
                              │
                              ▼
         ┌────────────────────────────────────────────┐
         │     parse_personality_tag()                │
         │                                            │
         │  1. Hittar [PERSONLIGHET: metrolog]       │
         │  2. Extraherar: "metrolog"                │
         │  3. Mappar till: "oneseek-metrolog"       │
         │  4. Tar bort taggen från svaret           │
         │  5. Laddar character card (för metadata)   │
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
         │      "categories": ["väder"],             │
         │      "description": "Väder-expert"        │
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
🎭 ONESEEK Δ+ v6.3 - DATAFLÖDE FÖR PERSONLIGHETSVAL
======================================================================
┌─────────────────────────────────────────────────────────────────────┐
│  STEG 1: FRÅGA IN                                                   │
│  ↓                                                                  │
│  STEG 2: SYSTEM PROMPT + PERSONLIGHETSKARTA                         │
│  ↓                                                                  │
│  STEG 3: MODELLEN VÄLJER [PERSONLIGHET: xxx] TAG                    │
│  ↓                                                                  │
│  STEG 4: BACKEND PARSAR TAG → LADDAR CHARACTER CARD                 │
│  ↓                                                                  │
│  STEG 5: SVAR UTAN TAG → ANVÄNDARE                                  │
└─────────────────────────────────────────────────────────────────────┘

📝 STEG 1: FRÅGA IN
   Användarens fråga: 'Hur blir vädret i Stockholm imorgon?'
   Längd: 37 tecken
----------------------------------------------------------------------

📋 STEG 2: LADDAR PERSONLIGHETSKATALOG
   Fil: config/personality_catalog.json
   Formaterad katalog (847 tecken):
----------------------------------------
=== PERSONLIGHET: medveten (default) ===
Nyckelord: hej, vem är du, vad kan du
Kategori: allmän
Prompt: Du är OneSeek-7B-Zero – den medvetna grunden.

=== PERSONLIGHET: metrolog ===
Nyckelord: väder, regn, snö, sol, temperatur
Kategori: väder
Prompt: Du är Metrologen – Sveriges vassaste väder-expert.

=== PERSONLIGHET: bibliotekarie ===
Nyckelord: bok, böcker, författare, isbn
Kategori: böcker
Prompt: Du är Bibliotekarien – Sveriges största bokälskare.
----------------------------------------

✅ PLACEHOLDER_PERSONALITY_CATALOG ersatt!
   System prompt längd: 2847 tecken

======================================================================
🤖 STEG 3: MODELLEN VÄLJER PERSONLIGHET
======================================================================
📝 Skickar till modellen...
   Input längd: 3124 tecken
   Modell: DUAL-model (Mistral + LLaMA)
   Max tokens: 512
   Temperature: 0.7
----------------------------------------------------------------------
⏳ Väntar på svar från modellen...
✅ Modellens svar mottaget!
   Svarstid: 1247ms
   Tokens: 89
   Modell: LLaMA-7B

======================================================================
🏷️  ONESEEK Δ+ v6.3 - PARSING PERSONALITY TAG
======================================================================
📝 Raw response (first 200 chars):
   '[PERSONLIGHET: metrolog] Vädret i Stockholm imorgon blir klart...'

✅ TAG FOUND!
   🎭 Raw tag value: 'metrolog'
   🎭 Normalized: 'metrolog'
   🎭 Full ID: 'oneseek-metrolog'
   📝 Clean response (first 100 chars): 'Vädret i Stockholm imorgon blir klart...'
======================================================================

======================================================================
📍 STEG 4: BACKEND PARSAR TAG → LADDAR CHARACTER CARD
======================================================================

🎭 DETEKTERAT PERSONLIGHETSVAL:
   ID: oneseek-metrolog

🔄 BYTER PERSONLIGHET!
   Från: oneseek-medveten (default)
   Till: oneseek-metrolog

📂 LADDAR CHARACTER CARD:
   Fil: frontend/public/characters/OneSeek-Metrolog.yaml
   Status: ✅ FINNS
   Namn: Metrologen
   Prompt längd: 1847 tecken

📊 PERSONLIGHETSINFO (för frontend):
   {
       "id": "oneseek-metrolog",
       "description": "Väder-expert – SMHI-stil",
       "categories": ["väder"],
       "is_default": false
   }

======================================================================
📍 STEG 5: SVAR UTAN TAG → ANVÄNDARE
======================================================================
📝 Rent svar (utan tag), första 200 tecken:
   'Vädret i Stockholm imorgon blir klart och soligt med temperatur...'
----------------------------------------------------------------------

======================================================================
✅ ONESEEK Δ+ v6.3 - KOMPLETT DATAFLÖDE SAMMANFATTNING
======================================================================
┌─────────────────────────────────────────────────────────────────────┐
│  ✅ STEG 1: FRÅGA IN                                                │
│     "Hur blir vädret i Stockholm imorgon?"                          
│  ↓                                                                  │
│  ✅ STEG 2: SYSTEM PROMPT + PERSONLIGHETSKARTA INJICERAD            │
│     Katalog: 847 tecken                                             
│  ↓                                                                  │
│  ✅ STEG 3: MODELLEN VALDE PERSONLIGHET                             │
│     🎭 Vald: oneseek-metrolog                                       
│  ↓                                                                  │
│  ✅ STEG 4: CHARACTER CARD LADDAD                                   │
│     📂 oneseek-metrolog                                             
│  ↓                                                                  │
│  ✅ STEG 5: SVAR TILL ANVÄNDARE                                     │
│     📝 156 tecken                                                   
└─────────────────────────────────────────────────────────────────────┘
⏱️  Total tid: 1247ms
🔗 Blockchain Hash: a7b3c9d2e1f...
📊 Confidence v2: 0.89
======================================================================
```

## Viktiga Funktioner

### 1. `format_personality_catalog_for_prompt()`
Skapar den mänskligt läsbara personlighetskartan som injiceras i system prompt.

### 2. `parse_personality_tag(response)`
Parsar `[PERSONLIGHET: xxx]` taggen från modellens svar och returnerar rent svar.

### 3. `get_personality_info(personality_id)`
Hämtar personlighetsinfo för frontend-visning.

### 4. `get_api_catalog_for_personality(personality_id)`
Filtrerar API-katalogen baserat på personlighetens kategorier.

## Debugging Tips

1. **Kolla terminalen** - All debug-info skrivs till terminalen
2. **Sök efter `[PERSONLIGHET:`** i modellens råa svar
3. **Verifiera att taggen** är i BÖRJAN av svaret (inte mitt i)
4. **Kontrollera character card** finns i `frontend/public/characters/`
