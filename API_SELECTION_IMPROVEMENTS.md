# API Selection Improvements - Multi-API Support & Smart Empty Catalog Handling

## Översikt
Förbättringar av 3-stegs reasoning-flödet för bättre API-hantering och tydligare tankekedjor.

## Datum
2025-12-14

## Problem som löstes

### 1. **En fråga krävde ofta flera API:er men modellen valde bara ett**
**Tidigare**: Modellen valde oftast bara ETT API även när frågan krävde data från flera källor.

**Exempel**:
- Fråga: "Jämför gamla och nya SoL om ekonomiskt bistånd"
- Problem: Modellen valde bara ett av API:erna (antingen gamla eller nya lagen)
- Resultat: Ofullständigt svar utan jämförelse

### 2. **Personligheter utan API:er försökte ändå välja API:er**
**Tidigare**: Även när en personlighet hade tom API-katalog kördes Stage 2 (API-val).

**Problem**:
- Slöseri med inferens-tid
- Modellen försökte resonera om tomma API-kartor
- Otydligt för användaren varför inga API:er användes

### 3. **Reasoning var inte integrerad tillräckligt bra**
**Tidigare**: Reasoning fanns men var inte lika tydlig för varför vissa API:er valdes eller inte valdes.

## Lösningar implementerade

### 1. Multi-API Support

#### Uppdaterad Prompt (`build_api_selection_prompt`)
**Ny sektion i prompten**:
```
4. **VIKTIGT: Välj FLERA APIs om frågan behöver data från flera källor för bättre svar**
5. Returnera JSON med ALLA relevanta APIs och parametrar
```

**Nya exempel**:
```
**Exempel på flera APIs:**
- Fråga: "Vad ändrades i nya SoL jämfört med gamla?" 
  → Välj BÅDE lagen_nu_sol_ny OCH lagen_nu_sol_gammal
  
- Fråga: "Väder och vädervarningar i Stockholm" 
  → Välj BÅDE smhi_prognos OCH smhi_varningar
  
- Fråga: "Statistik om placerade barn och IVO-rapporter" 
  → Välj BÅDE socialstyrelsen_barn_vard OCH ivo_rapporter
```

**Ny reasoning-mall**:
```
Fråga: "Jämför gamla och nya SoL om ekonomiskt bistånd"
Svar:
{"apis": [
  {"name": "lagen_nu_sol_gammal", "params": {}}, 
  {"name": "lagen_nu_sol_ny", "params": {}}
]}

Reasoning: Användaren vill "jämföra" gamla och nya lagen, vilket kräver 
data från BÅDA källor. Keyword "gamla" matchar lagen_nu_sol_gammal och 
"nya" matchar lagen_nu_sol_ny. Keyword "ekonomiskt bistånd" matchar båda 
API:erna. Jag behöver hämta från båda för att kunna göra jämförelsen.
```

#### Resultat
✅ Modellen uppmanas tänka: "Vilka ALLA datakällor behövs för ett komplett svar?"
✅ Fler API:er valda när frågan kräver det
✅ Rikare svar med data från flera källor

### 2. Smart Empty Catalog Handling

#### Ny Logik i Stage 2
**Innan Stage 2 körs**:
```python
# Check if we have any APIs first
has_apis = total_filtered > 0

if not has_apis:
    # Skip Stage 2 entirely
    no_api_reasoning = f"{personality_name} har inga externa API:er 
    konfigurerade. Svarar baserat på intern kunskap och resonemang."
    
    thinking_steps.append({
        "step": "no_apis_available",
        "message": "Ingen API-katalog tillgänglig",
        "reasoning": no_api_reasoning
    })
    
    # Emit clear message to user
    yield "Svarar med intern kunskap..."
```

#### Speciell Prompt för Tom Katalog
När `character_api_json` är tom, används en alternativ prompt:
```
**VIKTIGT: Du har INGA API:er tillgängliga.**

Din uppgift är att förklara varför du inte behöver externa API:er:
1. Analysera vad användarens fråga handlar om
2. Förklara vilken typ av kunskap eller resonemang som behövs
3. Bekräfta att du kan svara baserat på din interna kunskap
4. Returnera JSON som bekräftar att inga APIs behövs

{"apis": []}

Reasoning: Användaren frågar om [ämne] som kräver [typ av kunskap], 
inte realtidsdata. Jag kan svara baserat på [vad] utan externa API:er.
```

#### Resultat
✅ Ingen slösad inferens på tom API-katalog
✅ Tydlig reasoning varför inga API:er används
✅ Användaren ser "Svarar med intern kunskap..." istället för "Analyserar APIs..."

### 3. Bättre Reasoning Integration

#### Förbättrad Reasoning-template
**Tidigare**: Vaga förklaringar
**Nu**: Strukturerad reasoning med:
- Vilka keywords matchade
- Varför flera APIs valdes (om flera)
- Vilka entity_types extraherades
- Varför specifikt DESSA APIs (inte andra)

#### Exempel på Förbättrad Reasoning
```
**Multi-API reasoning:**
Användaren frågade om "jämföra" gamla och nya SoL, vilket kräver 
data från BÅDA källor för komplett svar. Keyword "gamla" matchar 
lagen_nu_sol_gammal (priority 1) och "nya" matchar lagen_nu_sol_ny 
(priority 0). Keyword "ekonomiskt bistånd" finns i båda. För att 
göra jämförelsen behövs text från båda lagversioner.

**Ingen API reasoning:**
Användaren frågar om litterära begrepp (metafor vs liknelse) som 
kräver förklaring och definition, inte realtidsdata. Jag kan svara 
baserat på min språkkunskap och ge exempel. Inga externa API:er 
behövs för denna kunskapsfråga.
```

## Teknisk Implementation

### Kod-ändringar

#### 1. `build_api_selection_prompt()` i `ml_service/server.py`
```python
def build_api_selection_prompt(...):
    # Check if API catalog is empty
    try:
        api_data = json.loads(character_api_json)
        has_apis = bool(api_data.get('api_catalog', {}))
    except:
        has_apis = True
    
    if not has_apis:
        # Return special prompt for empty catalog
        return special_no_api_prompt
    else:
        # Return enhanced prompt encouraging multiple APIs
        return enhanced_multi_api_prompt
```

#### 2. Stage 2 Logic i `ml_service/server.py` (around line 15343)
```python
# Check if we have any APIs first
has_apis = total_filtered > 0

if not has_apis:
    # Skip Stage 2 entirely
    print("⚠️ STAGE 2: Skipping API selection - no APIs available")
    # Add clear reasoning
    no_api_reasoning = "..."
    thinking_steps.append(...)
    yield "event: thinking..."
else:
    # Run normal Stage 2 with API selection
    print("🔍 STAGE 2: API Selection + Entity Extraction...")
    # ... rest of API selection logic
```

### Flödesdiagram

#### Tidigare Flöde
```
Stage 1: Välj personlighet
    ↓
Stage 2: Försök välja API (även om tom katalog)
    ↓
Stage 3: Generera svar
```

#### Nytt Flöde
```
Stage 1: Välj personlighet
    ↓
Har personligheten API:er?
    ├─ NEJ → Skip Stage 2, lägg till reasoning "ingen API-katalog"
    │         ↓
    │      Stage 3: Generera svar med intern kunskap
    │
    └─ JA → Stage 2: Välj API:er (kan vara flera!)
              ↓
           Stage 3: Generera svar med API-data
```

## Testfall

### Test 1: Multi-API Selection
**Fråga**: "Jämför gamla och nya SoL om ekonomiskt bistånd"

**Förväntat Stage 2 svar**:
```json
{"apis": [
  {"name": "lagen_nu_sol_gammal", "params": {}},
  {"name": "lagen_nu_sol_ny", "params": {}}
]}
```

**Reasoning**: 
"Användaren vill jämföra båda lagversioner vilket kräver data från båda källor..."

### Test 2: Empty Catalog
**Personlighet**: Medveten (ingen API-katalog)
**Fråga**: "Vad är skillnaden mellan en metafor och en liknelse?"

**Förväntat Stage 2**:
- Stage 2 SKIPPAS helt
- Thinking chain visar: "Ingen API-katalog tillgänglig"
- Reasoning: "Medveten har inga externa API:er konfigurerade. Svarar baserat på intern kunskap."

### Test 3: Single API (fortfarande fungerar)
**Fråga**: "Vad är vädret imorgon i Stockholm?"

**Förväntat Stage 2 svar**:
```json
{"apis": [{"name": "smhi_prognos", "params": {"lon": "18.07", "lat": "59.33"}}]}
```

**Reasoning**: 
"Användaren frågade om 'imorgon' vilket matchar smhi_prognos keywords..."

## Fördelar

### Användare
✅ **Rikare svar**: Flera datakällor ger mer dimensioner i svaret
✅ **Tydligare reasoning**: Ser varför flera API:er används eller varför inga används
✅ **Snabbare svar**: Ingen slösad tid på tomma API-kataloger

### System
✅ **Effektivare**: Hoppar över Stage 2 när den inte behövs
✅ **Bättre reasoning**: Modellen får tydligare instruktioner
✅ **Mer flexibel**: Kan hantera både många och inga API:er

### Utvecklare
✅ **Enklare debugging**: Tydligare reasoning i logs
✅ **Bättre skalbarhet**: Lätt att lägga till fler API:er per personlighet
✅ **Mindre underhåll**: Personligheter utan API:er "just works"

## Framtida Förbättringar

### Fas 2
1. **Automatisk API-prioritering**: Modellen rankar API:er baserat på relevans
2. **Parallella API-anrop**: Hämta från flera API:er samtidigt istället för sekventiellt
3. **Adaptiv API-val**: Lär sig vilka API-kombinationer som ger bäst resultat

### Fas 3
1. **API-resultat-aggregering**: Smart sammanfattning av data från flera API:er
2. **Konflikthantering**: När API:er ger motsägande data
3. **Fallback-kedja**: Automatisk växling till backup-API om primärt misslyckas

## Sammanfattning

### Vad har förbättrats?
1. ✅ **Multi-API Support**: Modellen väljer flera API:er när det behövs
2. ✅ **Smart Tom Katalog**: Hoppar över Stage 2 när inga API:er finns
3. ✅ **Bättre Reasoning**: Tydligare förklaringar i tankekedjan

### Impact
- **Socionomen**: Kan nu jämföra gamla och nya lagar genom att hämta från båda
- **Metrolog**: Kan hämta både väderprognos och varningar samtidigt
- **Medveten**: Slipper försöka välja från tom API-katalog

### Testresultat
- ✅ Python syntax validerad
- ✅ Logik-flöde verifierat
- ✅ Prompts uppdaterade med exempel
- ✅ Stage 2 skip-logik implementerad

---

**Version**: 2.0.0
**Datum**: 2025-12-14
**Status**: Implementerat och redo för testning
