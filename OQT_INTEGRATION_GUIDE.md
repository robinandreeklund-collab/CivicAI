# OQT Dashboard med Riktiga Modeller - Snabbguide

## Problem & Lösning

**Problem**: OQT Dashboard chatten visade endast simulerade svar trots att ML service körde och hittade modellerna.

**Lösning**: Backend-tjänsterna (`mistral.js`, `llama.js`) anropade aldrig ML service. Nu fixat i commit `995b4ef`.

## Hur det fungerar nu

### Med ML Service (Riktiga modeller)
1. Användare ställer fråga i OQT Dashboard
2. Backend anropar `mlServiceClient.js`
3. HTTP-anrop till `http://localhost:5000/inference/mistral` eller `/inference/llama`
4. ML service genererar svar med riktiga modeller
5. ✅ **Verkligt AI-genererat svar** visas i chatten

### Utan ML Service (Fallback)
1. Anslutning till port 5000 misslyckas
2. Backend använder fördefinierade simulerade svar
3. Console loggar: "Using simulated Mistral/LLaMA response"
4. Systemet fortsätter fungera

## Starta Fullständig Stack

### Terminal 1 - ML Service (Krävs för riktiga modeller)
```bash
# Aktivera virtual environment
source venv/bin/activate
# eller på Windows:
.\venv\Scripts\Activate.ps1

# Starta ML service
python ml_service/server.py

# Du ska se:
# INFO: ✓ Mistral model directory found
# INFO: ✓ LLaMA model directory found
# INFO: Uvicorn running on http://0.0.0.0:5000
```

### Terminal 2 - Backend
```bash
cd backend
npm run dev

# Du ska se:
# Server running on port 3001
```

### Terminal 3 - Frontend
```bash
cd frontend
npm run dev

# Du ska se:
# Local: http://localhost:3000/
```

## Testa att det Fungerar

1. **Öppna**: `http://localhost:3000/oqt-dashboard`

2. **Ställ en fråga**, t.ex.:
   - "Vad är demokrati?"
   - "Förklara AI"
   - "Hej"

3. **Kontrollera Terminal 2 (Backend)** för log:
   ```
   ✓ Using real Mistral 7B model for inference
   ```
   ELLER
   ```
   ✗ ML service not reachable - using simulated Mistral response
   ```

4. **Förväntat resultat**:
   - **Med ML service**: Unikt AI-genererat svar varje gång
   - **Utan ML service**: Förutbestämt svar (samma text som tidigare)

## Felsökning

### "Får fortfarande simulerade svar"

**Problem**: Backend hittar inte ML service

**Lösningar**:

1. **Kontrollera ML service körs**:
   ```bash
   curl http://localhost:5000/
   # Ska returnera JSON med "status": "running"
   ```

2. **Kontrollera backend använder rätt URL**:
   ```bash
   # I backend/.env (skapa om den inte finns)
   ML_SERVICE_URL=http://localhost:5000
   ```

3. **Starta om backend efter ML service**:
   ```bash
   # Ctrl+C i Terminal 2
   cd backend && npm run dev
   ```

4. **Verifiera i backend console**:
   - Bra: `✓ Using real Mistral 7B model for inference`
   - Dåligt: `✗ ML service not reachable`

### "ML service startar inte modellerna"

**Problem**: Modeller inte laddade i ML service

**Lösning**: Modeller laddas bara när första förfrågan kommer:

```bash
# Testa manuellt
curl -X POST http://localhost:5000/inference/mistral \
  -H "Content-Type: application/json" \
  -d '{"text":"Test","max_length":100}'

# Du ska se i ML service console:
# INFO: Loading mistral from C:\...\models\mistral-7b-instruct
# INFO: ✓ mistral loaded successfully on cpu
```

### "Connection refused"

**Problem**: ML service körs inte eller på fel port

**Lösning**:
1. Verifiera ML service körs: `ps aux | grep "ml_service"` (Linux/Mac) eller Task Manager (Windows)
2. Kontrollera port: ML service ska vara på port 5000, backend på 3001, frontend på 3000

## Verifiera Full Integration

### Test 1: ML Service Health Check
```bash
curl http://localhost:5000/
```
**Förväntat**:
```json
{
  "service": "OQT-1.0 ML Service",
  "status": "running",
  "device": "cpu",
  "models_loaded": []
}
```

### Test 2: Mistral Inference
```bash
curl -X POST http://localhost:5000/inference/mistral \
  -H "Content-Type: application/json" \
  -d '{"text":"Vad är AI?","max_length":200}'
```
**Förväntat**: JSON med unikt genererat svar

### Test 3: Backend OQT API
```bash
curl -X POST http://localhost:3001/api/oqt/multi-model-query \
  -H "Content-Type: application/json" \
  -d '{"question":"Hej"}'
```
**Förväntat**: JSON med svar där metadata visar `"simulated": false`

### Test 4: Dashboard Chat
1. Öppna `http://localhost:3000/oqt-dashboard`
2. Skriv "Vad är demokrati?" i chatten
3. Svar ska vara unikt och detaljerat (inte det fördefinierade texten)

## Metadata för Verifiering

Svaret från backend innehåller metadata som visar om riktiga modeller användes:

```javascript
{
  "response": "...",
  "metadata": {
    "simulated": false,      // false = riktig modell, true = simulerat
    "mlService": true,       // true = från ML service
    "latency_ms": 2500,      // Verklig inferenstid
    "tokens": 150
  }
}
```

## Sammanfattning

✅ **Full integration klar** - OQT Dashboard → Backend API → ML Service → Modeller  
✅ **Fungerar nu** - Starta alla 3 terminaler ovan  
✅ **Graceful fallback** - Systemet fungerar även utan ML service  
✅ **Tydlig loggning** - Console visar vilka modeller som används  

**Nästa steg**: Starta alla 3 terminaler och testa i OQT Dashboard!
