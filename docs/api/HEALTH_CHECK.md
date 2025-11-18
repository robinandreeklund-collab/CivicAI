# Health-check och status-rapportering

Detta dokument förklarar hur CivicAI kontrollerar och rapporterar status för den frivilliga Python ML-tjänsten.

## Bakgrund
- Node-backend pollar Python `/health` regelbundet och cachar resultatet för att undvika flapp och dyra synkrona HTTP-anrop per request.

## Env-variabler
- `PYTHON_NLP_SERVICE_URL` (default `http://localhost:5001`)
- `PYTHON_HEALTH_POLL_INTERVAL_MS` (default `5000`)
- `PYTHON_HEALTH_REQUEST_TIMEOUT_MS` (default `2500`)

## API: /api/health
Svar innehåller per-tjänst status + för Python:
- `status`: "up" eller "down"
- `available_models`: per-modell bool (t.ex. `{"spacy": true, "bertopic": false}`)
- `lastChecked`: ISO timestamp för senaste attempt
- `lastSuccessful`: ISO timestamp för senaste lyckade poll
- `error`: senaste felmeddelande om status=false

## Varför vissa modeller kan vara "false"
- Exempel: BERTopic kräver `umap-learn` och `hdbscan`. På Windows kan `hdbscan` misslyckas utan C++ build tools.
- Om en modell inte importerades sätter Python-tjänsten modell-flaggan till false.

## Aktivera BERTopic (exempel för Windows)
1. Installera Microsoft C++ Build Tools
   - https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Aktivera venv och installera beroenden:
   ```powershell
   pip install hdbscan
   pip install umap-learn
   pip install bertopic
   ```
3. Starta om python-tjänsten: `python nlp_pipeline.py`
4. Kontrollera:
   ```bash
   curl http://localhost:5001/health
   ```

## Felsökning
- `curl http://localhost:5001/health` — verifiera vad Python-tjänsten tror om modeller
- `curl http://localhost:3001/api/health` — verifiera vad backend visar (cached)
- Kontrollera loggar i både Node och Python för timeouts och exceptions
