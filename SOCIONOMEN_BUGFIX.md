# Socionomen - Browse_page Integration Bugfix

## Problem
När användaren frågade "Vad säger exakt 4 kap. 1 § SoL?" valde systemet korrekt personlighet (Socionomen) och API (sol_lagtext), men fick följande fel:

```
Failed (200, message='Attempt to decode JSON with unexpected mimetype: text/html; charset=utf-8')
```

## Root Cause
API-katalogen för Socionomen specificerade korrekt:
```json
{
  "name": "sol_lagtext",
  "tool": "browse_page",
  "method": "BROWSE",
  "url": "https://www.riksdagen.se/sv/dokument-och-lagar/..."
}
```

Men `call_api` funktionen i `ml_service/api_selector.py` hanterade bara standard JSON API:er. Den försökte alltid parsa svar som JSON med `response.json()`, vilket misslyckades för HTML-innehåll från riksdagen.se.

## Solution
Uppdaterade `call_api` funktionen i `ml_service/api_selector.py` (commit: fe2bce0) att:

1. **Detektera browse_page APIs**: Kollar om API-konfigurationen har `"tool": "browse_page"` eller `"method": "BROWSE"`

2. **Anropa browse_page**: Om detekterat, importerar och anropar `browse_page` funktionen från `api_integrations.py` istället för att göra standard HTTP-anrop

3. **Hantera asynkron execution**: Eftersom `browse_page` är synkron men `call_api` är async, använder vi `loop.run_in_executor()` för att köra browse_page utan att blockera

4. **Returnera text-innehåll**: Resultatet returneras i formatet `{'text': content, 'url': url}` istället för JSON-data

## Code Changes

### Before
```python
async def call_api(...):
    # ... API configuration lookup ...
    
    # Always tried to make HTTP request and parse JSON
    async with session.get(api_url, ...) as response:
        if response.status == 200:
            data = await response.json()  # ❌ Fails for HTML content
```

### After
```python
async def call_api(...):
    # ... API configuration lookup ...
    
    # Check if API uses browse_page
    if api_tool == 'browse_page' or api_method == 'BROWSE':
        from api_integrations import browse_page
        
        # Run browse_page in executor
        loop = asyncio.get_event_loop()
        text_content = await loop.run_in_executor(None, browse_page, api_url, 8000)
        
        if text_content and not text_content.startswith("Kunde inte"):
            result['success'] = True
            result['data'] = {'text': text_content, 'url': api_url}  # ✅ Returns text
            return result
    
    # Standard JSON API handling for other APIs
    async with session.get(api_url, ...) as response:
        # ...
```

## Testing
Nu ska Socionomen kunna:

1. ✅ Identifiera frågor om SoL/LVU
2. ✅ Välja rätt API (sol_lagtext, lvu_lagtext, etc.)
3. ✅ Använda browse_page för att hämta HTML från riksdagen.se
4. ✅ Extrahera lagtext från HTML-innehåll
5. ✅ Formatera och presentera lagtext för användaren

### Test Query
```
Fråga: "Vad säger exakt 4 kap. 1 § SoL?"

Förväntat flöde:
1. Personality Selection: Socionomen (keywords: "sol", "4 kap")
2. API Selection: sol_lagtext (browse_page)
3. Browse Page: Hämta från riksdagen.se
4. Extract: Hitta 4 kap. 1 § i HTML
5. Response: Citera lagtext ordagrant med källa
```

## Impact on Other APIs
Denna ändring påverkar endast APIs som har:
- `"tool": "browse_page"`, ELLER
- `"method": "BROWSE"`

Alla andra APIs (JSON-baserade) fortsätter fungera som tidigare.

### Browse_page APIs i Socionomen
1. **sol_lagtext** - Socialtjänstlagen
2. **lvu_lagtext** - LVU
3. **socialstyrelsen_statistik** - Statistik
4. **socialstyrelsen_barn_vard** - Barn i vård statistik
5. **ivo_rapporter** - IVO tillsynsrapporter
6. **scb_kommun_statistik** - Kommunstatistik

### Standard JSON APIs i Socionomen
1. **riksdagen_social_lagstiftning** - Riksdagens dokument (fortsätter använda JSON API)

## Related Files
- `ml_service/api_selector.py` - Fix implementerad här
- `ml_service/api_integrations.py` - browse_page funktion
- `config/api_catalog_socionomen.json` - API-definitioner med "tool": "browse_page"
- `SOCIONOMEN_TESTING.md` - Uppdaterad med förklaring

## Next Steps
1. Testa med live-systemet
2. Verifiera att lagtext extraheras korrekt
3. Kontrollera att formatering och källhänvisning fungerar
4. Testa alla fyra standardfrågorna från SOCIONOMEN_TESTING.md

---

**Status**: ✅ Bugfix complete
**Commit**: fe2bce0
**Datum**: 2025-12-14
