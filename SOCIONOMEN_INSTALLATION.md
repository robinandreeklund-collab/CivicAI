# Socionomen - Installation och Setup

## Kort svar
**Nej, ingen extra installation krävs!** Browse_page-funktionaliteten använder endast standardbibliotek som redan finns i `requirements.txt`.

## Tekniska detaljer

### Beroenden för browse_page
Browse_page-funktionen i `ml_service/api_integrations.py` använder:

1. **`requests`** - För HTTP-anrop
   - Redan i requirements.txt: `requests>=2.31.0`
   - Används för att hämta HTML-innehåll från webbsidor

2. **`re`** (regex) - För HTML-parsing
   - Python standard library (ingen installation krävs)
   - Används för att ta bort script/style-taggar och extrahera text

3. **`logging`** - För loggning
   - Python standard library (ingen installation krävs)

### Beroenden för api_selector integration
Integration i `ml_service/api_selector.py` använder:

1. **`asyncio`** - För async/await
   - Python standard library (ingen installation krävs)
   - Används för att köra browse_page i executor

2. **`aiohttp`** - För async HTTP-anrop (standard APIs)
   - Redan i requirements.txt: `aiohttp>=3.9.0`
   - Används för JSON API:er (inte browse_page)

## Verifiering av installation

### Kontrollera att dependencies finns:
```bash
# Verifiera requests är installerat
python -c "import requests; print(f'requests version: {requests.__version__}')"

# Verifiera aiohttp är installerat
python -c "import aiohttp; print(f'aiohttp version: {aiohttp.__version__}')"

# Verifiera regex fungerar
python -c "import re; print('re module OK')"
```

### Test av browse_page direkt:
```bash
cd /path/to/CivicAI
python -c "
from ml_service.api_integrations import browse_page
result = browse_page('https://example.com', max_length=200)
print(f'Result length: {len(result)}')
print(f'First 100 chars: {result[:100]}')
"
```

## Vad som redan är installerat

Enligt `requirements.txt` finns alla nödvändiga paket redan:

```txt
# Core Python packages
requests>=2.31.0        # ✅ För browse_page HTTP-anrop
aiohttp>=3.9.0         # ✅ För async API-anrop

# Standard library (ingen installation)
re                      # ✅ För HTML-parsing
asyncio                 # ✅ För async execution
logging                 # ✅ För loggning
```

## Vad händer när browse_page körs?

1. **HTTP Request**: `requests.get(url)` hämtar HTML från riksdagen.se eller annan myndighet
2. **HTML Parsing**: Regex tar bort `<script>` och `<style>` taggar
3. **Text Extraction**: Regex tar bort alla HTML-taggar
4. **Clean up**: Whitespace normaliseras
5. **Truncate**: Text begränsas till max_length (default 5000 tecken)
6. **Return**: Text returneras som sträng

## Vanliga frågor

### Behöver jag BeautifulSoup?
**Nej.** Browse_page använder medvetet enkel regex-baserad parsing för:
- Minimala dependencies
- Snabb execution
- Tillräckligt för välformatterade myndighetssidor

För framtida förbättringar kan BeautifulSoup läggas till, men det är inte nödvändigt nu.

### Behöver jag Playwright eller Selenium?
**Nej.** Dessa är för dynamisk JavaScript-rendering. Myndighetssidor (Riksdagen, Socialstyrelsen, IVO, SCB) använder statisk HTML som kan hämtas direkt med `requests`.

### Fungerar det i production?
**Ja!** Alla dependencies finns redan i requirements.txt och har installerats när du kör:
```bash
pip install -r requirements.txt
```

### Behöver jag konfigurera något?
**Nej.** Browse_page fungerar direkt efter installation av requirements.txt. Inga API-nycklar, konfiguration eller setup krävs.

## Felsökning

### Om browse_page inte fungerar:

1. **Kontrollera requests är installerat:**
   ```bash
   pip install requests>=2.31.0
   ```

2. **Kontrollera nätverksåtkomst:**
   - Testa att du kan nå riksdagen.se från servern
   - Kontrollera firewall-regler om du kör i Docker/VM

3. **Kontrollera import:**
   ```python
   from ml_service.api_integrations import browse_page
   # Ska fungera utan fel
   ```

4. **Kontrollera logs:**
   - Browse_page loggar alla anrop med `logger.info()`
   - Kolla efter "[browse_page] Fetching: ..." i loggarna

### Om api_selector inte hittar browse_page:

1. **Kontrollera import i api_selector.py:**
   ```python
   from api_integrations import browse_page
   ```
   Detta ska fungera eftersom `api_selector.py` och `api_integrations.py` är i samma katalog (`ml_service/`).

2. **Kontrollera att browse_page exporteras:**
   ```python
   # I api_integrations.py __all__ list:
   'browse_page',  # ✅ Ska finnas
   ```

## Sammanfattning

✅ **Inga extra installationer krävs**
✅ **Alla dependencies finns redan i requirements.txt**
✅ **Browse_page fungerar direkt efter `pip install -r requirements.txt`**
✅ **Inga API-nycklar eller konfiguration behövs**
✅ **Systemet är redo att använda Socionomen direkt**

---

**Datum**: 2025-12-14
**Version**: 1.0.0
**Status**: Redo för användning
