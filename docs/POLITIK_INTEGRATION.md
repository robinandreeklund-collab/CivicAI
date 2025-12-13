# Politik API Integration

## Overview

Complete integration of Swedish political data APIs including Sveriges Riksdag, SCB (Statistics Sweden), and OpenAid for comprehensive political information, election results, and development aid data.

**Version**: 1.0.0  
**Created**: 2025-12-13  
**Status**: ✅ Production Ready

## Architecture

This integration follows the exact same modular pattern as SMHI and Libris XL:

```
config/
├── api_catalog.json                    # Main catalog with $ref to politik
├── api_catalog_politik.json            # Politik API definitions
└── personality_catalog.json            # Added "politikern" personality

api/
└── politik.py                         # Politik API client module

frontend/public/characters/
└── OneSeek-Politikern.yaml            # Politikern character card
```

## Data Sources

### 1. Sveriges Riksdag (Riksdagens öppna data)
- **URL**: https://data.riksdagen.se/
- **License**: Öppen data (PSI)
- **Update Frequency**: Real-time
- **Coverage**: Parliamentary votes, documents, members, speeches

### 2. SCB (Statistiska centralbyrån)
- **URL**: https://api.scb.se/
- **License**: CC0 / PSI
- **Update Frequency**: After elections
- **Coverage**: Election results, voter turnout, statistics

### 3. OpenAid.se (Utrikesdepartementet/Sida)
- **URL**: https://openaid.se/api/
- **License**: Öppen data
- **Update Frequency**: Monthly
- **Coverage**: Swedish development aid projects

## API Endpoints

### Riksdagen APIs

#### 1. `riksdagen_voteringar` (Priority 0 - Main)
**Riksdagens voteringar och omröstningar**
- URL: `https://data.riksdagen.se/voteringlista/?rm={riksmote}&bet={beteckning}&sz=100&utformat=json`
- Parameters:
  - `riksmote` (required): e.g., "2024/25"
  - `beteckning` (required): e.g., "AU4"
- Keywords: votering, omröstning, riksdagsröstning, hur röstade, parti röstade
- Example: How did the Riksdag vote on AU4 2024/25?

#### 2. `riksdagen_dokument` (Priority 1)
**Riksdagsdokument (propositioner, motioner, betänkanden)**
- URL: `https://data.riksdagen.se/dokumentlista/?sok={query}&doktyp=prop,mot,bet&utformat=json&p=1`
- Parameters:
  - `query` (optional): Search term
- Keywords: proposition, motion, betänkande, regeringens förslag
- Example: Search for documents about "klimat"

#### 3. `riksdagen_ledamoter` (Priority 2)
**Lista alla riksdagsledamöter**
- URL: `https://data.riksdagen.se/personlista/?utformat=json`
- No parameters required
- Keywords: ledamot, riksdagsledamot, politiker, parti
- Returns: Full list of current members of parliament

#### 4. `riksdagen_anforanden` (Priority 3)
**Anföranden och tal i riksdagen**
- URL: `https://data.riksdagen.se/anforandelista/?iid={ledamot_id}&sz=50&utformat=json`
- Parameters:
  - `ledamot_id` (required): Member ID from personlista
- Keywords: tal i riksdagen, anförande, debatt, vad sa
- Example: Get speeches by a specific member

### Other APIs

#### 5. `valresultat` (Priority 4)
**Valresultat från SCB**
- URL: `https://api.scb.se/OV0104/v1/doris/sv/ssd/START/ME/ME0104/ME0104A/RiksdValkrets`
- Note: POST with JSON query required for detailed data
- Keywords: valresultat, riksdagsval, valdeltagande, mandat
- Example: Election results 2022

#### 6. `bistand_projekt` (Priority 5)
**Svenska biståndsprojekt**
- URL: `https://openaid.se/api/activities/?q={query}`
- Parameters:
  - `query` (optional): Country, organization or keyword
- Keywords: bistånd, svenskt bistånd, utvecklingssamarbete
- Example: Swedish aid to Kenya

## Python API Module

### PolitikClient Class

```python
from api.politik import PolitikClient

client = PolitikClient(timeout=10)

# Get voting results
result = client.get_voteringar(riksmote="2024/25", beteckning="AU4")

# Search documents
docs = client.search_dokument(query="klimat", page=1)

# Get all members of parliament
members = client.get_ledamoter()

# Get speeches by a member
speeches = client.get_anforanden(ledamot_id="0123456789", limit=50)

# Search aid projects
aid = client.search_bistand(query="kenya")
```

### Convenience Functions

```python
from api import politik

# Direct access without creating client
result = politik.get_voteringar("2024/25", "AU4")
docs = politik.search_dokument("klimat")
members = politik.get_ledamoter()
speeches = politik.get_anforanden("0123456789")
aid = politik.search_bistand("kenya")
```

## Politikern Personality

### Character Card
**File**: `frontend/public/characters/OneSeek-Politikern.yaml`

**Traits**:
- Politiskt påläst
- Faktabaserad
- Opartisk
- Rak
- Analytisk
- Svensk

**Capabilities**:
- Riksdagens voteringar och omröstningar
- Riksdagsdokument analysis
- Member and party information
- Parliamentary speeches and debates
- Election results from SCB
- Swedish development aid projects

**Keywords**: riksdag, regering, politik, votering, omröstning, ledamot, proposition, motion, val, bistånd

### Personality Prompt

The Politikern personality is designed to be:
1. **Factual**: Only uses official data from Riksdag, SCB, OpenAid
2. **Impartial**: Presents all parties' votes objectively
3. **Analytical**: Provides context without political bias
4. **Clear**: Explains complex political processes simply

### Source Attribution

Always includes proper attribution:
- Riksdag data: "Källa: Sveriges Riksdag"
- Election data: "Källa: SCB (Statistiska centralbyrån)"
- Aid data: "Källa: OpenAid.se (Utrikesdepartementet/Sida)"

## Configuration

### API Catalog Entry
In `config/api_catalog.json`:
```json
{
  "api_catalog": {
    "politik": {
      "$ref": "api_catalog_politik.json"
    }
  }
}
```

### Personality Catalog Entry
In `config/personality_catalog.json`:
```json
{
  "oneseek-politikern": {
    "card_file": "frontend/public/characters/OneSeek-Politikern.yaml",
    "name": "Politikern",
    "keywords": ["riksdag", "regering", "politik", "votering", ...],
    "categories": ["politik", "samhälle"],
    "description": "Sveriges mest pålästa politiska expert"
  }
}
```

## Usage Examples

### Example 1: Voting Results
**User**: "Hur röstade riksdagen om AU4 2024/25?"

**Politikern Response**:
```
Riksdagen röstade om betänkande AU4 (2024/25) den [datum]. 
Resultatet blev bifall med 175 ja-röster mot 174 nej-röster.

Socialdemokraterna, Miljöpartiet och Vänsterpartiet röstade ja.
Moderaterna, Sverigedemokraterna, Kristdemokraterna och Liberalerna röstade nej.

Källa: Sveriges Riksdag
```

### Example 2: Document Search
**User**: "Vilka propositioner finns om klimat?"

**Politikern Response**:
```
Här är de senaste propositionerna om klimat:

1. Proposition 2024/25:XX - Klimatpolitiskt ramverk
2. Proposition 2024/25:YY - Hållbar energi och klimatomställning
[...]

Källa: Sveriges Riksdag
```

### Example 3: Aid Projects
**User**: "Svenskt bistånd till Kenya?"

**Politikern Response**:
```
Sveriges bistånd till Kenya omfattar [antal] projekt inom områdena 
hälsa, utbildning och demokrati.

Totalt budgeterat belopp: [belopp] kronor.
Huvudsakliga organisationer: Sida, svenska ambassaden i Nairobi.

Källa: OpenAid.se (Utrikesdepartementet/Sida)
```

## Rate Limits & Caching

### Rate Limits
- Requests per second: 5
- Requests per hour: 500
- Recommendation: Respectful usage

### Caching Strategy
```json
{
  "voteringar": "15 minuter",
  "dokument": "30 minuter",
  "ledamoter": "24 timmar",
  "anforanden": "1 timme",
  "valresultat": "30 dagar",
  "bistand": "7 dagar"
}
```

## Error Handling

The Politik API client includes comprehensive error handling:

1. **Network Errors**: Automatic retry with exponential backoff
2. **Missing Data**: Clear messages when no results found
3. **Invalid Parameters**: Validation before API calls
4. **Timeout**: Configurable timeout (default 10s)

### Fallback Message
```
"Kunde inte hämta politisk data just nu. Försök igen om en stund 
eller besök riksdagen.se"
```

## Testing

### Validate Configuration
```bash
python -c "
import json
with open('config/api_catalog_politik.json') as f:
    data = json.load(f)
    print(f'✅ Valid JSON: {data[\"name\"]}')"
```

### Test API Module
```bash
python -c "
from api.politik import PolitikClient
client = PolitikClient()
print('✅ Politik module ready')"
```

### Test Integration
```bash
python -c "
import json
with open('config/api_catalog.json') as f:
    catalog = json.load(f)
    assert 'politik' in catalog['api_catalog']
    print('✅ Politik integrated in main catalog')"
```

## Future Enhancements

Potential additions:
1. **Regional Politics**: Add kommunfullmäktige data
2. **EU Parliament**: Swedish MEPs and EU votes
3. **Historical Data**: Archive of older parliamentary sessions
4. **Party Programs**: Integration of party policy documents
5. **Committee Work**: Detailed utskott activities

## Related Documentation

- [Libris XL Integration](./LIBRIS_INTEGRATION.md)
- [SMHI Integration](./SMHI_INTEGRATION.md)
- [Modular API Catalog Architecture](./API_CATALOG.md)

## Support & Contact

For issues or questions about the Politik API integration:
- GitHub Issues: [CivicAI Repository](https://github.com/robinandreeklund-collab/CivicAI)
- Official API Docs: 
  - [Riksdagen](https://data.riksdagen.se/)
  - [SCB](https://www.scb.se/vara-tjanster/oppna-data/api-for-statistikdatabasen/)
  - [OpenAid](https://openaid.se/about/api)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: 2025-12-13
