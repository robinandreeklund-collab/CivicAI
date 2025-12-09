# ONESEEK Δ+ v6.2: Intelligent Personality-Based API Routing

## Översikt

Detta system implementerar intelligent personlighetsbaserad inferens för ONESEEK-7B-Zero modellen, där AI:n automatiskt väljer rätt personlighet och hämtar realtidsdata från relevanta API:er baserat på användarens fråga.

## Hur det fungerar

### 9-stegs process

1. **Användaren ställer en fråga**
   - Frågan skickas till `/inference/personality` endpoint

2. **Embedding-baserad personlighetsval** 
   - Systemet använder `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` för semantisk matchning
   - Kombinerar keyword-matchning (40%) och embedding-similarity (60%)
   - Ger 40% boost till senaste personligheten om frågan är relaterad
   - Väljer den personlighet med högst matchning

3. **Dynamisk API-karta skapas**
   - Filtrerar `api_catalog.json` baserat på personlighetens tags
   - Skapar `runtime/character_api.json` med bara relevanta API:er

4. **Modellen väljer API:er**
   - Modellen får frågan + den filtrerade API-katalogen
   - Returnerar JSON med vilka API:er som behövs och parametrar
   - Exempel: `{"apis": [{"name": "smhi", "params": {"lat": "60.6", "lon": "17.3"}}]}`

5. **Parallell API-hämtning**
   - Systemet anropar alla valda API:er parallellt med `asyncio`
   - Max 5 samtidiga anrop (konfigurerbart)
   - Samlar in alla svar och felhantering

6. **Slutligt svar genereras**
   - Modellen får:
     - Personlighetens system-prompt
     - Aktuell tid och datum
     - Realtidsdata från API:er
   - Genererar det färdiga svaret i rätt personlighet

7. **Frontend-visning**
   - Användaren ser det rena svaret
   - Live-statusar visar "[tänker...] Analyserar frågan..." etc.
   - Klickbar "Tankekedja ▼" med alla steg
   - API-källor visas som badges

8. **Manuellt byte (valfritt)**
   - Användaren kan klicka på PersonalitySelector
   - Väljer en annan personlighet manuellt
   - Nästa svar använder den personligheten

9. **Live-uppdateringar**
   - Ändringar i `personality_catalog.json` laddas om direkt
   - Ingen omstart krävs

## Arkitektur

### Backend-komponenter

#### `ml_service/personality_selector.py`
- **select_personality()** - Huvudfunktion för att välja personlighet
  - Använder embedding-modellen för semantisk matchning
  - Kombinerar keyword + embedding scores
  - Applicerar boost till senaste personlighet
  
- **create_character_api_map()** - Skapar filtrerad API-karta
  - Matchar personlighetens tags mot API-kategorier
  - Sparar till `runtime/character_api.json`

- **override_personality()** - Manuell override
- **reset_personality()** - Återställ till auto-val

#### `ml_service/api_selector.py`
- **parse_api_selection()** - Parsar modellens JSON-svar
- **fetch_apis_parallel()** - Hämtar från flera API:er parallellt
- **format_api_data_for_model()** - Formaterar API-data för modellen
- **create_api_selection_prompt()** - Skapar prompt för API-val

#### `ml_service/server.py`
Nya endpoints:
- `POST /inference/personality` - Huvudendpoint för personality-baserad inferens
- `GET /api/ml/personality/current` - Hämta nuvarande personlighet
- `POST /api/ml/personality/override` - Byt personlighet manuellt
- `POST /api/ml/personality/reset` - Återställ till auto
- `GET /api/ml/personality/catalog` - Hämta hela katalogen
- `POST /api/ml/personality/catalog/reload` - Ladda om från disk

### Frontend-komponenter

#### `frontend/src/services/chat.js`
Nya funktioner:
- `sendPersonalityChatMessage()` - Anropa personality-endpoint
- `getCurrentPersonality()` - Hämta nuvarande personlighet
- `overridePersonality()` - Byt personlighet
- `resetPersonality()` - Återställ
- `getPersonalityCatalog()` - Hämta katalog

#### `frontend/src/components/ThinkingChain.jsx`
- Kollapsbar visning av tankekedjan
- Visar varje steg med ikon och meddelande
- Visar API-data som JSON om tillgängligt
- `LiveThinkingIndicator` - Real-time status medan AI bearbetar

#### `frontend/src/components/PersonalitySelector.jsx`
- Dropdown för manuellt personlighetsval
- Visar nuvarande personlighet med ikon
- Lista över alla tillgängliga personligheter
- "Automatiskt val" för att återgå till embedding-matching

#### `frontend/src/pages/PersonalityChatPage.jsx`
- Demo-sida som visar all funktionalitet
- Chatgränssnitt med personlighetsvisning
- Live tänker-indikatorer
- Kollapsbar tankekedja
- API-källor som badges

## Konfigurationsfiler

### `config/personality_catalog.json`
```json
{
  "version": "6.2.0",
  "personality_catalog": {
    "oneseek-medveten": {
      "name": "Medveten",
      "keywords": ["hej", "vem är du"],
      "categories": ["allmän"],
      "prompt": "Du är OneSeek...",
      "is_default": true
    },
    "oneseek-metrolog": {
      "name": "Metrologen",
      "keywords": ["väder", "regn", "temperatur"],
      "categories": ["väder"],
      "prompt": "Du är Metrologen..."
    }
  }
}
```

### `config/api_catalog.json`
```json
{
  "api_catalog": {
    "väder": {
      "description": "Väderdata och prognoser",
      "personality_tags": ["metrolog"],
      "apis": [
        {
          "name": "smhi_current",
          "source": "SMHI",
          "url": "https://opendata-download-metfcst.smhi.se",
          "keywords": ["väder", "temperatur"]
        }
      ]
    }
  }
}
```

## Installation

### Backend
```bash
# Installera sentence-transformers (om ej redan installerat)
pip install sentence-transformers

# Modulerna laddas automatiskt av server.py
# Kontrollera status i startup-loggen
```

### Frontend
```bash
cd frontend
npm install

# Komponenter är redan importerade och routade
```

## Användning

### Från Frontend
Navigera till `/personality-chat` för demo-sidan:
```
http://localhost:5173/personality-chat
```

### API-anrop
```javascript
// Skicka meddelande med personality-baserad inferens
const response = await fetch('http://localhost:8000/inference/personality', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Vad är vädret imorgon i Hjo?",
    max_length: 512,
    temperature: 0.7
  })
});

const data = await response.json();
console.log(data.response);  // Färdigt svar
console.log(data.personality);  // Vald personlighet
console.log(data.thinking_chain);  // Tankekedja
console.log(data.api_data);  // API-data
```

### Manuell personlighetsval
```javascript
// Byt till specifik personlighet
await fetch('http://localhost:8000/api/ml/personality/override', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    personality_id: "oneseek-metrolog"
  })
});

// Återställ till auto
await fetch('http://localhost:8000/api/ml/personality/reset', {
  method: 'POST'
});
```

## Prestanda

- **Embedding-matchning**: ~50-100ms för 3 personligheter
- **API-parallellisering**: Max 5 samtidiga, timeout 10s per API
- **Total latens**: Vanligtvis 2-5s beroende på API-svar
- **Tokens/s**: 70-80 med llama-server.exe (GGUF)

## Felsökning

### Embedding-modellen laddas inte
```
[ERROR] Failed to load embedding model
```
**Lösning**: Installera sentence-transformers
```bash
pip install sentence-transformers
```

### API-selection misslyckas
```
[ERROR] No JSON found in model response
```
**Lösning**: 
- Kontrollera att modellen är laddad och funkar
- Testa med lägre temperature (0.3) för mer strukturerad output
- Verifiera att API-katalogen är korrekt formaterad

### Frontend får 503 Service Unavailable
```
Personality selector module not available
```
**Lösning**: Kontrollera att ml_service/server.py har laddat modulerna vid startup

## Exempel på användarupplevelse

**Användare**: "Vad är vädret imorgon i Hjo?"

**Frontend visar live**:
```
[tänker...] Analyserar frågan...
[tänker...] Valde personlighet: Metrologen
[tänker...] Hämtar väderdata...
[tänker...] Bygger svar...
```

**Svar**:
```
Imorgon i Hjo: +2°C, mulet, 5 m/s från sydväst. 
60 % risk för snöblandat regn efter lunch.

Källa: SMHI (uppdaterad 2025-12-09 09:22)
```

**Tankekedja ▼** (klickbar):
- ✅ Analyserar frågan...
- ✅ Valde personlighet: Metrologen (confidence: 0.95)
- ✅ Skapade API-karta med 1 kategorier
- ✅ Valde 1 API:er
- ✅ Hämtade data från 1/1 API:er
- ✅ Bygger svar...

**API-källor**: [SMHI]

## Framtida förbättringar

- [ ] Streaming av tankekedja i realtid (Server-Sent Events)
- [ ] Mer sofistikerad API-parameterekstraktion (NER för platser, datum, etc.)
- [ ] Caching av embedding-resultat för snabbare matchning
- [ ] Historik-baserad personlighetsval (lär sig från tidigare konversationer)
- [ ] A/B-testning av olika personligheter för samma fråga
- [ ] Admin UI för att redigera personality_catalog.json live

## Support

För frågor eller problem, skapa ett issue på GitHub eller kontakta @robinandreeklund-collab.
