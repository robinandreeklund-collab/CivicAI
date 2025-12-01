# LanguageTool Self-Hosted + AI-personlig stavningskontroll

## Översikt

Detta dokument beskriver ONESEEK Δ+ integrationen med LanguageTool self-hosted - en kontextmedveten stavningskontroll som körs 100 % lokalt utan externa API:er.

## Varför LanguageTool?

| Problem med tidigare lösning | Lösning med LanguageTool |
|------------------------------|--------------------------|
| Typo.js + Nodehun förstår bara ord – inte kontext | LanguageTool förstår hela meningen |
| "bor i" → "bra i", "hjo" → "hon", "väddret" → "väderdet" | "väddret i Hjo imorn" → "vädret i Hjo imorgon" |
| Inga personliga svar – bara kalla förslag | AI:n själv svarar med värme |
| Externa API:er har rate limits och integritetsrisker | 100 % privat – egen server – 0 kr för evigt |

## Installation

### Steg 1: Starta LanguageTool-servern

```bash
cd docker/languagetool
docker-compose up -d
```

Servern startar på `http://localhost:8010`.

### Steg 2: Verifiera installation

```bash
curl "http://localhost:8010/v2/check?language=sv&text=Vad%20%C3%A4r%20v%C3%A4ddret"
```

### Steg 3: Testa i Admin Dashboard

1. Öppna Admin Dashboard
2. Gå till "Integration" → "LanguageTool"
3. Kontrollera att status visar "Online"
4. Testa stavningskontroll med exempeltext

## Arkitektur

```
┌─────────────────────────────────────────────────────────────┐
│                      ONESEEK Δ+ Frontend                    │
│                    (typo_hybrid.js)                         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                      ML Service API                         │
│                    (server.py)                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Typo Checker (typo_checker.py)                     │   │
│  │    ├─ LanguageTool Client (language_tool.py)        │   │
│  │    │    └─ localhost:8010                           │   │
│  │    └─ Lokal fallback (ordlista + fuzzy)             │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│             LanguageTool Self-Hosted (Docker)               │
│                    http://localhost:8010                    │
│                                                             │
│  • Kontextmedveten stavningskontroll                        │
│  • Svenska + 30+ språk                                      │
│  • Grammatik, typografi, stil                               │
└─────────────────────────────────────────────────────────────┘
```

## Filer

### Nya filer

| Fil | Beskrivning |
|-----|-------------|
| `docker/languagetool/docker-compose.yml` | Docker-konfiguration för LanguageTool |
| `docker/languagetool/README.md` | Dokumentation för Docker-setup |
| `ml_service/language_tool.py` | Python-klient för LanguageTool API |
| `ml_service/language_tool_config.json` | Konfiguration för LanguageTool |
| `ml_service/typo_checker.py` | Hybrid-kontroll (ersätter typo_double_check.py) |
| `admin/integration/LanguageToolConfig.jsx` | Admin-panel för status/kontroll |
| `docs/LANGUAGE_TOOL_SELF_HOSTED.md` | Denna dokumentation |

### Modifierade filer

| Fil | Ändring |
|-----|---------|
| `ml_service/server.py` | Ny AI-personlig system-prompt för stavfel |
| `frontend/chat/typo_hybrid.js` | Visar AI:s svar + knappar |

### Borttagna filer

| Fil | Ersätts av |
|-----|------------|
| `ml_service/typo_double_check.py` | `ml_service/typo_checker.py` |

## AI-personlig stavfelsprompt

När LanguageTool hittar stavfel injiceras följande system-prompt:

```python
if typo_result["changed"]:
    system_prompt = f"""
    Användaren skrev: "{original_question}"
    LanguageTool (vår egen server) har hittat stavfel och föreslår:
    "{typo_result['corrected']}"
    
    Du är OneSeek-7B-Zero – en varm, svensk kompis.
    Svara personligt och vänligt – alltid på svenska.
    Fråga om hen vill korrigera, och ge tre knappar:
    [ Ja, korrigera ] [ Nej, skicka som det är ] [ Skriv själv ]
    
    Variera tonen – välj en av dessa stilar (aldrig samma två gånger):
    • "Haha, jag tror du menade '{typo_result['corrected']}'? 😄"
    • "Oj, kanske '{typo_result['corrected']}'? 😊"
    • "Jag gissar att du ville säga '{typo_result['corrected']}' – stämmer det?"
    • "Tror du menade '{typo_result['corrected']}'? 🤔"
    • "Haha, '{typo_result['corrected']}' låter mer rätt! 😄"
    
    Håll det kort, varmt och naturligt – precis som en svensk kompis.
    """
    messages.insert(-1, {"role": "system", "content": system_prompt})
```

## Exempelflöde

### Användarinput

```
Du: Vad är väddret i Hjo imorn?
```

### AI-svar (genererat av modellen)

```
OneSeek: Haha, jag tror du menade "vädret" och "imorgon"? 😄
Ska jag söka efter "Vad är vädret i Hjo imorgon?" istället?

[ Ja, korrigera ] [ Nej, skicka som det är ] [ Skriv själv ]
```

### Efter att användaren klickar "Ja"

```
OneSeek: Tack! Hämtar direkt...
Imorgon i Hjo blir det 6°C och regn.

Källor:
1. SMHI – Väderprognos Hjo (https://smhi.se/)
```

## Konfiguration

### LanguageTool-konfiguration

Fil: `ml_service/language_tool_config.json`

```json
{
  "server": {
    "host": "localhost",
    "port": 8010,
    "timeout": 5,
    "retry_count": 2,
    "retry_delay": 0.5
  },
  "defaults": {
    "language": "sv",
    "enabled_only": false,
    "level": "default"
  },
  "categories": {
    "enabled": ["TYPOS", "GRAMMAR", "PUNCTUATION", "TYPOGRAPHY"],
    "disabled": ["STYLE"]
  },
  "whitelist": {
    "words": ["OneSeek", "ONESEEK", "Δ+", "AI"]
  }
}
```

### Docker-konfiguration

Fil: `docker/languagetool/docker-compose.yml`

```yaml
version: '3.8'

services:
  languagetool:
    image: erikvl87/languagetool
    container_name: languagetool
    ports:
      - "8010:8010"
    environment:
      - Java_Xms=512m
      - Java_Xmx=2g
    restart: unless-stopped
```

## API-endpoints

### Stavningskontroll

```
POST /api/ml/typo
Content-Type: application/json

{
  "text": "Vad är väddret i Hjo imorn?",
  "auto_correct": true
}
```

Svar:

```json
{
  "original": "Vad är väddret i Hjo imorn?",
  "corrected": "Vad är vädret i Hjo imorgon?",
  "is_correct": false,
  "errors_found": 2,
  "method": "languagetool",
  "word_results": [
    {
      "original": "väddret",
      "corrected": "vädret",
      "suggestions": ["vädret"],
      "confidence": 0.95
    },
    {
      "original": "imorn",
      "corrected": "imorgon",
      "suggestions": ["imorgon"],
      "confidence": 0.95
    }
  ]
}
```

### Status

```
GET /api/ml/typo/status
```

Svar:

```json
{
  "languagetool_available": true,
  "languagetool_status": {
    "status": "online",
    "url": "http://localhost:8010/v2",
    "swedish_supported": true,
    "languages_count": 32
  },
  "fallback_ready": true,
  "dictionary_words": 245,
  "common_typos": 18
}
```

## Felsökning

### LanguageTool startar inte

```bash
# Kontrollera Docker-status
docker-compose ps

# Visa loggar
docker-compose logs languagetool

# Omstart
docker-compose restart languagetool
```

### Hög minnesanvändning

Justera Java-heap i `docker-compose.yml`:

```yaml
environment:
  - Java_Xmx=1g  # Minska från 2g
```

### Anslutningsfel

```bash
# Testa lokal anslutning
curl http://localhost:8010/v2/languages

# Kontrollera portkonfiguration
netstat -tlpn | grep 8010
```

## Fördelar

| Funktion | Beskrivning |
|----------|-------------|
| 🔒 **100 % privat** | All data stannar på din egen server |
| 💰 **0 kr för evigt** | Inga API-avgifter eller rate limits |
| 🇸🇪 **Svenska** | Full support för svenska med kontext |
| 🧠 **Kontextförståelse** | "bor i Hjo" korrigeras INTE till "bra i hon" |
| ⚡ **Snabb** | Lokal server = låg latens |
| 🤖 **AI-personlighet** | Vänliga, personliga korrigeringsförslag |

## Licens

LanguageTool är öppen källkod under LGPL-licens.
