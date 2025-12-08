# GGUF Snabbstart Guide

## Problemet

När du kör `python ml_service/server.py --use-gguf` utan att starta en GGUF-server får du felet:
```
[GGUF] Both streaming endpoints failed: HTTPConnectionPool(host='localhost', port=8080): Max retries exceeded
```

## Lösningar

### Alternativ 1: Auto-start med GGUF-modell (Enklast)

Ange GGUF-modellens sökväg så startar Python-servern automatiskt llama-server.exe:

```bash
python ml_service\server.py --use-gguf --gguf "C:\path\to\model.gguf" --listen --api
```

**Förutsättningar:**
- llama-server.exe måste finnas i `CivicAI\llama.cpp-bin-cuda\`
- Ladda ner från: https://github.com/ggerganov/llama.cpp/releases
- Välj: `llama-bXXXX-bin-win-cuda-cu12.x.x-x86_64.zip`

### Alternativ 2: Manuell start (Mer kontroll)

**Terminal 1 - Starta llama-server.exe:**
```bash
cd C:\path\to\llama.cpp-bin-cuda
llama-server.exe -m "C:\path\to\model.gguf" -c 32768 -ngl 99 --port 8080 --verbose
```

**Terminal 2 - Starta Python-servern:**
```bash
python ml_service\server.py --use-gguf --listen --api
```

### Alternativ 3: Anpassad port

Om du kör llama-server på en annan port (t.ex. 8081):

```bash
# Terminal 1 - llama-server på port 8081
llama-server.exe -m "C:\path\to\model.gguf" --port 8081

# Terminal 2 - Python-server med anpassad GGUF_SERVER_BASE
set GGUF_SERVER_BASE=http://localhost:8081
python ml_service\server.py --use-gguf --listen --api
```

## Vanliga GGUF-flaggor för llama-server.exe

```bash
llama-server.exe \
  -m "path/to/model.gguf"    # Modellens sökväg
  -c 32768                    # Context size (tokens)
  -ngl 99                     # GPU layers (99 = alla lager)
  --port 8080                 # Server port
  --verbose                   # Visa debug-output
  --threads 8                 # CPU-trådar
  --batch-size 512           # Batch size
```

## Verifiera att det fungerar

1. **Kontrollera att llama-server körs:**
```bash
curl http://localhost:8080/health
```

Du ska få ett JSON-svar om servern körs.

2. **Testa inferens via Python-servern:**
```bash
curl http://localhost:5000/api/ml/inference/oneseek -X POST -H "Content-Type: application/json" -d "{\"text\":\"Hej, vad är befolkningen i Stockholm?\"}"
```

3. **Kontrollera loggar:**
Sök efter dessa rader i Python-servern:
```
[GGUF] Sending to /v1/chat/completions with system prompt
[GGUF] Messages: [{'role': 'system', 'content': 'Du är OneSeek...'}]
[GGUF] Response received
```

## Felsökning

### "llama-server.exe not found"
- Ladda ner llama.cpp binaries från GitHub releases
- Extrahera till `CivicAI\llama.cpp-bin-cuda\`
- Verifiera att `llama-server.exe` finns i mappen

### "Cannot connect to GGUF server"
- Kontrollera att llama-server körs: `curl http://localhost:8080/health`
- Kontrollera rätt port i GGUF_SERVER_BASE
- Kontrollera firewall-inställningar

### "CUDA 13.x detected - Manual build required"
Om du har CUDA 13.x behöver du bygga llama-cpp-python från källkod:
```bash
# PowerShell
$env:CMAKE_ARGS="-DLLAMA_CUDA=on -DLLAMA_CUDA_F16=ON -DLLAMA_CUBLAS=on"
pip install llama-cpp-python --force-reinstall --no-cache-dir
```

### Svar på svenska följs inte
Detta PR löser detta problem! Kontrollera att:
1. Du använder den senaste versionen av denna PR
2. Python-servern visar: `[GGUF] Messages: [{'role': 'system', ...}]`
3. System prompt är på svenska

## Miljövariabler

Skapa `.env.local` för permanent konfiguration:
```bash
MODEL_BACKEND=gguf
GGUF_SERVER_BASE=http://localhost:8080
PLATFORM_SYSTEM_PROMPT=Du är OneSeek, en svensk AI-assistent för civila frågor.
```

## Se även

- `docs/gguf-prompt-routing.md` - Teknisk arkitektur
- `docs/testing-gguf-prompt-fix.md` - Testprocedurer
- `.env.local.example` - Konfigurationsmall

---

**Senast uppdaterad**: 2025-12-08  
**PR**: Fix GGUF system prompt injection and backend routing
