# ONESEEK Personality Pipeline Debugger

## Översikt

Detta är en fristående debug-terminal som visar exakt vad som händer i personality-based API routing pipeline:et i realtid. 

## Installation

```bash
cd ml_service
pip install -r debug_requirements.txt
```

## Användning

### Steg 1: Starta Debug-Terminalen (Terminal 1)

```bash
python debug_personality_pipeline.py
```

Du ska se:
```
╔════════════════════════════════════════════════════════════════════════════╗
║           ONESEEK PERSONALITY PIPELINE DEBUGGER                            ║
║  Lyssnar på: ws://localhost:5001                                          ║
╚════════════════════════════════════════════════════════════════════════════╝

✓ Debug server startad
✓ Väntar på anslutningar från ml_service/server.py...
```

### Steg 2: Starta Server med Debug-Läge (Terminal 2)

```bash
python server.py --debug-pipeline
```

### Steg 3: Starta Frontend (Terminal 3)

```bash
cd ../frontend
npm run dev
```

### Steg 4: Använd Applikationen

Gå till `http://localhost:3000/7b-zero` och ställ en fråga.

I debug-terminalen (Terminal 1) ser du nu **exakt** vad som händer steg för steg!

## Vad Du Ser i Debug-Terminalen

### Session Start
```
[08:15:32.123] STEG 1: SESSION START
  → Ny fråga mottagen
  Data:
    query: "Vad är vädret imorgon i Stockholm?"
    timestamp: 2025-12-10T08:15:32.123456
```

### Personality Selection
```
[08:15:32.234] STEG 2: PERSONALITY SELECTION
  → Embedding-matchning genomförd
  Data:
    selected: "Meteorologen"
    confidence: 0.87
    candidates: [
      {"name": "Meteorologen", "score": 0.87},
      {"name": "Medveten", "score": 0.52}
    ]
```

### API Map Creation
```
[08:15:32.345] STEG 3: API MAP CREATION
  → Character API-karta skapad
  Data:
    personality: "Meteorologen"
    api_categories: 3
    tags: ["väder", "smhi", "prognoser"]
```

### Första Inferensen (Personality + API Selection)
```
────────────────────────────────────────────────────────────────────────────

[08:15:32.456] STEG 4: FÖRSTA INFERENSEN - START
  → Skickar unified prompt till modell
  Data:
    prompt_type: "personality + API selection"
    model: "oneseek-7b-zero"
    max_tokens: 256
    
  PROMPT (första 500 tecken):
  Du är OneSeek-7B-Zero.
  Du har en aktiv personlighet och en API-karta.
  ...

[08:15:33.567] STEG 5: FÖRSTA INFERENSEN - SVAR
  → Modellen returnerade JSON
  Data:
    response: {"personlighet": "Meteorologen", "apis": [...]}
    latency_ms: 1111
```

### API Selection Parsed
```
[08:15:33.678] STEG 6: API SELECTION PARSED
  → Parsade 2 valda API:er
  Data:
    apis: [
      "smhi ({'lon': '18.0', 'lat': '59.3'})",
      "yr_no ({'location': 'Stockholm'})"
    ]
```

### API Data Fetch
```
────────────────────────────────────────────────────────────────────────────

[08:15:33.789] STEG 7: API FETCH - START
  → Börjar hämta data från API:er parallellt
  Data:
    api_count: 2
    concurrent_limit: 5

[08:15:34.123] STEG 8: API FETCH - smhi
  → ✅ Data hämtad
  Data:
    source: "SMHI"
    data_keys: ["temperature", "wind", "precipitation"]
    latency_ms: 334

[08:15:34.234] STEG 9: API FETCH - yr_no
  → ✅ Data hämtad
  Data:
    source: "Yr.no"
    data_keys: ["forecast", "location"]
    latency_ms: 445

 ✅ SUCCESS: Alla 2 API:er lyckades
```

### Andra Inferensen (Final Answer)
```
────────────────────────────────────────────────────────────────────────────

[08:15:34.345] STEG 10: ANDRA INFERENSEN - START
  → Skickar final prompt med personality + API data
  Data:
    personality: "Meteorologen"
    api_data_included: true
    model: "oneseek-7b-zero"
    max_tokens: 512
    
  SYSTEM PROMPT (första 300 tecken):
  Du är Meteorologen från SMHI.
  Du pratar om väder med precision och passion.
  ...

[08:15:37.456] STEG 11: ANDRA INFERENSEN - SVAR
  → Modellen genererade slutligt svar
  Data:
    response_length: 234
    latency_ms: 3111
    tokens_per_sec: 75.2
    
  SVAR (första 200 tecken):
  Imorgon i Stockholm: +2°C, mulet, 5 m/s från sydväst. 
  60% risk för snöblandat regn efter lunch.
  Källa: SMHI + Yr.no (uppdaterad 2025-12-10 08:15)...
```

### Response Sent
```
────────────────────────────────────────────────────────────────────────────

 ✅ SUCCESS: Svar skickat till frontend

  Total tid: 5.33s
  Steg genomförda: 11
```

## Färgkodning

- **CYAN**: Session och info
- **MAGENTA**: Personality selection
- **BLUE**: API map creation
- **YELLOW**: Inferenser (modell-anrop)
- **GREEN**: Lyckade operationer (API fetch, parsing)
- **RED**: Fel och problem
- **YELLOW (background)**: Varningar

## Felmeddelanden

Om något går fel ser du tydliga felmeddelanden:

```
 ❌ FEL: JSON visas för användaren!
  Detta ska INTE hända - JSON ska vara intern
```

## Avsluta

Tryck `Ctrl+C` i debug-terminalen för att avsluta.

## Tekniska Detaljer

- Lyssnar på WebSocket port 5001
- Tar emot JSON-meddelanden från server.py
- Visar meddelanden i färgkodad format
- Fungerar på både Windows och Linux (tack vare colorama)

## Felsökning

**Problem**: "Connection refused"
**Lösning**: Starta debug-terminalen FÖRE server.py

**Problem**: Inga meddelanden visas
**Lösning**: Kontrollera att server.py startades med `--debug-pipeline` flaggan

**Problem**: Färgerna fungerar inte på Windows
**Lösning**: `pip install colorama` (borde redan vara installerat)
