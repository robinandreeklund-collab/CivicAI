# LanguageTool Self-Hosted för ONESEEK Δ+

## Översikt

LanguageTool är en kraftfull grammatik- och stavningskontroll som förstår kontext – inte bara enskilda ord.

### Fördelar med self-hosted LanguageTool

| Funktion | Beskrivning |
|----------|-------------|
| 🔒 100 % privat | All data stannar på din egen server |
| 💰 0 kr för evigt | Inga API-avgifter eller rate limits |
| 🇸🇪 Svenska | Full support för svenska med kontext |
| 🧠 Kontextförståelse | "bor i Hjo" korrigeras INTE till "bra i hon" |

## Snabbstart

### 1. Starta LanguageTool-servern

```bash
cd docker/languagetool
docker-compose up -d
```

### 2. Verifiera att servern körs

```bash
curl "http://localhost:8010/v2/check?language=sv&text=Vad%20%C3%A4r%20v%C3%A4ddret%20i%20Hjo%20imorn"
```

Förväntat svar innehåller korrigeringsförslag för "väddret" → "vädret" och "imorn" → "imorgon".

### 3. Stoppa servern

```bash
cd docker/languagetool
docker-compose down
```

## Konfiguration

### Miljövariabler

| Variabel | Standard | Beskrivning |
|----------|----------|-------------|
| `Java_Xms` | 512m | Min Java-heap |
| `Java_Xmx` | 2g | Max Java-heap |
| `langtool_languageModel` | /ngrams | Sökväg för n-gram-modeller |

### Portkonfiguration

Standardporten är **8010**. Ändra i `docker-compose.yml` om behövs:

```yaml
ports:
  - "8010:8010"  # Ändra vänster sida för extern port
```

## API-användning

### Stavningskontroll

```bash
curl -X POST "http://localhost:8010/v2/check" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "language=sv&text=Vad är väddret i Hjo imorn?"
```

### Python-exempel

```python
from ml_service.language_tool import check_text

result = check_text("Vad är väddret i Hjo imorn?")
print(result)
# Output: {"corrected": "Vad är vädret i Hjo imorgon?", "matches": [...]}
```

## Felsökning

### Servern startar inte

```bash
# Kontrollera status
docker-compose logs languagetool

# Omstart
docker-compose restart languagetool
```

### Anslutningsfel

```bash
# Testa lokal anslutning
curl http://localhost:8010/v2/languages
```

### Hög minnesanvändning

Justera Java-heap i `docker-compose.yml`:

```yaml
environment:
  - Java_Xmx=1g  # Minska från 2g
```

## Integration med ONESEEK Δ+

LanguageTool integreras automatiskt med ONESEEK via:

1. **ml_service/language_tool.py** – Python-klient
2. **ml_service/typo_checker.py** – Hybrid-kontroll (LanguageTool + fallback)
3. **Admin Dashboard** – Status och kontroll

## Licens

LanguageTool är öppen källkod under LGPL-licens.
