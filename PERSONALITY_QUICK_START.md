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
npm install  # Installera dependencies (inkl. lucide-react)
npm run dev
```

## Steg 3: Öppna 7B-Zero Sidan

Navigera till den befintliga 7B-Zero sidan: `http://localhost:3000/7b-zero`

**OBS:** Funktionaliteten är nu integrerad i den befintliga 7B-Zero chatten, inte en separat sida.

## Steg 4: Testa olika frågor

### Test 1: Väderfråga (ska välja Metrologen + SMHI API)
```
Vad är vädret imorgon i Stockholm?
```

**Förväntat resultat**:
- Personlighet väljs automatiskt: Metrologen
- Tankekedja (klickbar) visar:
  - Analyserar frågan...
  - Valde personlighet: Metrologen
  - Hämtar väderdata...
  - Bygger svar...
- Källor visas som badges: "SMHI"
- Svar inkluderar väderdata

### Test 2: Bokfråga (ska välja Bibliotekarien + Libris)
```
Vad handlar Röda Rummet om?
```

**Förväntat resultat**:
- Personlighet: Bibliotekarien
- Källor: "Libris XL"
- Svar om boken med källa

### Test 3: Allmän fråga (ska välja Medveten, inga APIs)
```
Hej, vem är du?
```

**Förväntat resultat**:
- Personlighet: Medveten (default)
- Ingen API-data
- Generell presentation

## Steg 5: Utforska Tankekedjan

För varje svar:
1. Leta efter "🧠 Tankekedja" under svaret (klickbar sektion)
2. Klicka för att expandera
3. Se alla steg i processen:
   - ✅ Analyserar frågan...
   - ✅ Valde personlighet: [namn] (confidence: X.XX)
   - ✅ Skapade API-karta med X kategorier
   - ✅ Valde X API:er
   - ✅ Hämtade data från X/X API:er
   - ✅ Bygger svar...

## Steg 6: Kontrollera API-källor

Under svaret ser du badges med källor, t.ex.:
- [SMHI] (grön = lyckad)
- [Yr.no] (grön = lyckad)
- [API-namn] (röd = misslyckad, om något gick fel)

## Felsökning

### Problem: "sentence-transformers not available"
**Lösning**:
```bash
pip install sentence-transformers
```

### Problem: Personality endpoint svarar inte
**Lösning**: 
Systemet faller automatiskt tillbaka på standard-endpoint. Kontrollera att:
- Backend körs på port 8000
- `/api/ml/inference/personality` är tillgänglig

### Problem: Ingen Tankekedja visas
**Orsak**: Endpoint kanske inte använder personality-baserad inferens

**Lösning**:
- Kontrollera att backend är korrekt konfigurerad
- Se i nätverkstrafiken att `/api/ml/inference/personality` anropas
- Verifiera att `thinking_chain` finns i API-svaret

### Problem: Frontend visar "lucide-react" import error
**Lösning**:
```bash
cd frontend
npm install
```

## API-testning med curl

### Testa personality-endpoint
```bash
curl -X POST http://localhost:8000/inference/personality \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Vad är vädret imorgon?",
    "max_length": 512,
    "temperature": 0.7,
    "stream_thinking": true
  }'
```

### Hämta nuvarande personlighet
```bash
curl http://localhost:8000/api/ml/personality/current
```

### Byt personlighet manuellt
```bash
curl -X POST http://localhost:8000/api/ml/personality/override \
  -H "Content-Type": application/json" \
  -d '{"personality_id": "oneseek-metrolog"}'
```

### Återställ till auto
```bash
curl -X POST http://localhost:8000/api/ml/personality/reset \
  -H "Content-Type: application/json"
```

## Integration med befintlig funktionalitet

Personality-based API routing är nu **integrerat i den befintliga 7B-Zero sidan** och arbetar tillsammans med:
- ✅ Befintlig personlighetsväljare (manuell override fungerar fortfarande)
- ✅ Admin dashboard sync
- ✅ Streaming mode
- ✅ Typo checking
- ✅ Compare mode
- ✅ Conversation history

Systemet väljer automatiskt vilket endpoint som ska användas:
1. **Personality endpoint** (primär) - För automatisk personlighetsval + API routing
2. **Standard ONESEEK Δ+** (fallback) - Om personality endpoint misslyckas
3. **OQT endpoint** (final fallback) - För äldre kompatibilitet

## Nästa steg

- Redigera `config/personality_catalog.json` för att lägga till nya personligheter
- Redigera `config/api_catalog.json` för att lägga till nya API:er
- Testa live-reload genom att ändra en fil och anropa `/api/ml/personality/catalog/reload`
- Utforska olika frågor och se hur systemet väljer personlighet och API:er automatiskt
