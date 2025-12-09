# Snabbstart: Testa Personality-Based API Routing

## Steg 1: Starta Backend (ml_service)

```bash
cd ml_service
python server.py
```

Kontrollera startup-loggen för:
```
✅ ACTIVE     Personality Selector - Embedding-based personality matching
✅ ACTIVE     API Selector         - Dynamic API routing with parallel fetch
```

## Steg 2: Starta Frontend

```bash
cd frontend
npm run dev
```

## Steg 3: Öppna Demo-sidan

Navigera till: `http://localhost:5173/personality-chat`

## Steg 4: Testa olika frågor

### Test 1: Väderfråga (ska välja Metrologen)
```
Vad är vädret imorgon i Stockholm?
```

**Förväntat resultat**:
- Personlighet: Metrologen
- Tankekedja visar API-val och datahämtning
- Svar inkluderar väderdata

### Test 2: Bokfråga (ska välja Bibliotekarien)
```
Vad handlar Röda Rummet om?
```

**Förväntat resultat**:
- Personlighet: Bibliotekarien
- API: Libris XL
- Svar om boken med källa

### Test 3: Allmän fråga (ska välja Medveten)
```
Hej, vem är du?
```

**Förväntat resultat**:
- Personlighet: Medveten (default)
- Ingen API-data
- Generell presentation

## Steg 5: Testa manuell personlighetsval

1. Klicka på personlighetsknappen (högst upp till höger)
2. Välj "Metrologen" manuellt
3. Ställ en allmän fråga som "Hur mår du?"
4. Verifiera att svaret kommer från Metrologen trots att frågan inte är väderrelaterad

## Steg 6: Granska tankekedjan

För varje svar:
1. Klicka på "Tankekedja ▼"
2. Se alla steg i processen
3. Kontrollera att:
   - Personlighetsval har rätt confidence
   - API:er väljs korrekt
   - Data hämtas framgångsrikt

## Felsökning

### Problem: "sentence-transformers not available"
**Lösning**:
```bash
pip install sentence-transformers
```

### Problem: API-data visas inte
**Orsak**: llama-server.exe kanske inte returnerar korrekt JSON för API-val

**Lösning**: 
- Kontrollera att modellen är laddad
- Se i backend-loggen vad modellen returnerade
- Justera temperature till 0.3 för mer strukturerad output

### Problem: Frontend visar "Service Unavailable"
**Lösning**:
- Kontrollera att ml_service/server.py körs på port 8000
- Verifiera CORS-inställningar
- Kontrollera att modulerna laddades korrekt vid startup

## API-testning med curl

### Testa personality-endpoint
```bash
curl -X POST http://localhost:8000/inference/personality \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Vad är vädret imorgon?",
    "max_length": 512,
    "temperature": 0.7
  }'
```

### Hämta nuvarande personlighet
```bash
curl http://localhost:8000/api/ml/personality/current
```

### Byt personlighet manuellt
```bash
curl -X POST http://localhost:8000/api/ml/personality/override \
  -H "Content-Type: application/json" \
  -d '{"personality_id": "oneseek-metrolog"}'
```

### Återställ till auto
```bash
curl -X POST http://localhost:8000/api/ml/personality/reset \
  -H "Content-Type: application/json"
```

## Nästa steg

- Redigera `config/personality_catalog.json` för att lägga till nya personligheter
- Redigera `config/api_catalog.json` för att lägga till nya API:er
- Testa live-reload genom att ändra en fil och anropa `/api/ml/personality/catalog/reload`
