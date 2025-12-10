# Bugfix: API Name Mismatch in Catalog

**Issue ID**: Comment #3639050404  
**Datum**: 2025-12-10  
**Status**: ✅ Fixed  
**Commit**: 397d84d

## Problem

Vid testning av väder-API:t (Hjo) misslyckades systemet med felet:
```
API 'smhi' not found in catalog
```

Trots att API:t fanns i katalogen kunde backend inte hitta det.

## Root Cause Analysis

### 1. API Name Mismatch
Backend-prompten instruerade modellen att använda API-namnet `"smhi"`:
```json
{"apis": [{"name": "smhi", "params": {"lon": "...", "lat": "..."}}]}
```

Men `api_catalog.json` definierade API:t med namnet `"smhi_current"`:
```json
{
  "väder": {
    "apis": [
      {"name": "smhi_current", "source": "SMHI", ...}
    ]
  }
}
```

### 2. Modular Refactoring Issues
I den ursprungliga refaktoreringen byttes strukturen från:
```json
{
  "api_catalog": {
    "väder": {
      "apis": [...]
    }
  }
}
```

Till en modulär struktur med `$ref`:
```json
{
  "api_catalog": {
    "väder": {
      "$ref": "api_catalog_smhi.json"
    }
  }
}
```

Detta introducerade två problem:
- Backend hade inte stöd för att lösa `$ref` referenser
- API-namnen i den nya strukturen matchade inte existerande prompter

### 3. Wrong Catalog Key in api_selector.py
`api_selector.py` letade efter `api_categories` nyckel:
```python
for category_data in api_catalog.get('api_categories', {}).values():
```

Men strukturen använder `api_catalog` nyckel.

## Solution

### 1. Återställ Fungerande Struktur
```bash
git checkout 129c6d0~1 -- config/api_catalog.json
```

Detta återställde den fungerande v6.2.0 strukturen med alla API:er inline.

### 2. Fixa API-namn i Prompter
**Fil**: `ml_service/server.py`

**Ändring 1** (rad ~13450):
```python
# Före:
{{"apis": [{{"name": "smhi", "params": {{"lon": "18.07", "lat": "59.33"}}}}]}}

# Efter:
{{"apis": [{{"name": "smhi_current", "params": {{"lon": "18.07", "lat": "59.33"}}}}]}}
```

**Ändring 2** (rad ~13370):
```python
# Före:
{"apis": [{"name": "smhi", "params": {"lon": "14.28", "lat": "58.30"}}]}

# Efter:
{"apis": [{"name": "smhi_current", "params": {"lon": "14.28", "lat": "58.30"}}]}
```

### 3. Lägg till Backward Compatibility
**Fil**: `ml_service/api_selector.py`

```python
# Support both 'api_categories' and 'api_catalog' keys
catalog_key = 'api_catalog' if 'api_catalog' in api_catalog else 'api_categories'
for category_data in api_catalog.get(catalog_key, {}).values():
    for api in category_data.get('apis', []):
        if api.get('name') == api_name:
            api_config = api
            break
```

Detta gör att både gamla och nya strukturer fungerar.

## Testing

För att verifiera fixet:

```python
# Test 1: Kolla att API:t hittas
from ml_service.api_selector import call_api
import asyncio
import json

with open('config/api_catalog.json') as f:
    catalog = json.load(f)

result = asyncio.run(call_api(
    'smhi_current', 
    {'lon': '13.79', 'lat': '57.79'}, 
    catalog
))

print(result)  # Should not show "API 'smhi_current' not found"
```

```bash
# Test 2: Verifiera katalogstruktur
python -c "
import json
with open('config/api_catalog.json') as f:
    cat = json.load(f)
    
# Kolla att 'smhi_current' finns
found = False
for category, data in cat['api_catalog'].items():
    for api in data.get('apis', []):
        if api['name'] == 'smhi_current':
            print(f'✓ Found smhi_current in category {category}')
            found = True
            break

if not found:
    print('✗ smhi_current not found!')
"
```

## Impact

### ✅ Fixed
- API 'smhi_current' kan nu hittas och anropas korrekt
- Väder-frågor fungerar (ex: "Vädret i Hjo")
- Backward compatibility med både gamla och nya strukturer

### ⚠️ Reverted (Temporarily)
- Modulär `$ref`-struktur
  - Motivering: Backend hade inte stöd för $ref-upplösning
  - Bevarad som exempel: `config/api_catalog_smhi.json`
  - Kan återaktiveras när backend stödjer $ref

- Reducerad api_catalog.json (29 rader)
  - Motivering: För många beroenden på den fullständiga strukturen
  - Återställd till 330+ rader med alla API:er inline

### 📦 Preserved for Future
Följande modulära komponenter är bevarade för framtida användning:
- `/api/smhi.py` - Komplett SMHI Python client (570 rader)
- `config/api_catalog_smhi.json` - Exempel på modulär katalog
- `frontend/src/pages/ApiAdminPageNew.jsx` - Skalbar admin UI

## Lessons Learned

### 1. API Contract Consistency
Prompter och katalog måste alltid använda samma API-namn. Detta är ett "contract" som måste respekteras av både:
- Model prompting (Stage 2 inference)
- API catalog definition
- API selector lookup logic

### 2. Gradual Migration Strategy
Vid stora strukturella förändringar:
1. ✅ Implementera ny funktionalitet utan att bryta gamla
2. ✅ Lägg till backward compatibility
3. ✅ Testa båda versionerna
4. ❌ Byt INTE struktur om backend inte stödjer den ännu

### 3. Integration Testing Critical
Enhetstest av enskilda komponenter räcker inte. Behöver integration tests som verifierar:
- Model → Prompt → API Selection → API Catalog → API Call
- Hela kedjan från användarfråga till API-svar

## Future Work

### För att återaktivera modulär struktur:

**1. Implementera $ref Resolution**
```python
# I personality_selector.py eller api_selector.py
def resolve_catalog_refs(catalog: Dict, config_dir: Path) -> Dict:
    """Resolve all $ref links in catalog."""
    resolved = catalog.copy()
    
    for category, data in catalog.get('api_catalog', {}).items():
        if isinstance(data, dict) and '$ref' in data:
            ref_file = config_dir / data['$ref']
            with open(ref_file) as f:
                ref_data = json.load(f)
            resolved['api_catalog'][category] = ref_data
    
    return resolved
```

**2. Uppdatera API Loading**
```python
# I alla ställen där katalogen laddas:
catalog = load_api_catalog()
catalog = resolve_catalog_refs(catalog, config_dir)
```

**3. Säkerställ Name Consistency**
- Varje ny modulär katalog måste definiera API-namn som matchar prompter
- Alternativt: Använd alias-system där "smhi" → "smhi_current"

**4. Add Integration Tests**
```python
def test_api_selection_end_to_end():
    """Test full flow from user query to API call."""
    query = "Hur är vädret i Stockholm?"
    
    # Stage 2: API Selection
    api_selection = model_selects_apis(query)
    
    # Verify API exists in catalog
    catalog = load_api_catalog()
    for api_spec in api_selection['apis']:
        assert api_exists_in_catalog(api_spec['name'], catalog)
    
    # Stage 2.5: API Call
    results = await fetch_apis_parallel(api_selection, catalog)
    
    # Verify at least one success
    assert any(r['success'] for r in results)
```

## Conclusion

Problemet var en **API name mismatch** mellan prompt-exempel och katalog-definition, förvärrat av en ofullständig strukturell refaktorering. 

Lösningen var att:
1. ✅ Återställa fungerande struktur
2. ✅ Fixa name consistency
3. ✅ Lägga till backward compatibility
4. 📦 Bevara modulära komponenter för framtida bruk

Systemet fungerar nu korrekt med SMHI-API:t.
