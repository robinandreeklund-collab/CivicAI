# Socionomen - Stöd för båda Socialtjänstlagarna

## Översikt
Socionomen har uppdaterats för att hantera både den gamla och nya Socialtjänstlagen, vilket möjliggör:
- Citat från aktuell lag (2024:683)
- Citat från tidigare lag (2001:453)
- Jämförelser mellan lagversionerna
- Förklaringar av vad som ändrades

## Lagversioner

### Nya Socialtjänstlagen (2025:400)
- **Giltighetstid**: Från 1 juli 2025 →
- **Källa**: Sveriges Riksdag
- **URL**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/socialtjanstlag-2025400_sfs-2025-400
- **API endpoint**: `sol_ny_kapitel` (browse_page_chapter)
- **Nyckelord**: "ny sol", "sol 2025:400", "nya socialtjänstlagen", "socialtjänstlagen 2025", "aktuell sol"
- **Prioritet**: 0 (default)
- **Kapitelextraktion**: Smart extraktion av specifika kapitel (3-6k tecken per kapitel)

**Viktiga ändringar i nya lagen**:
- Stärkt barnperspektiv i alla beslut
- Tydligare rätt till bistånd och stöd
- Mer fokus på förebyggande insatser
- Förtydliganden kring samverkan mellan myndigheter
- Utökade rättigheter för personer med funktionsnedsättning

### Gamla Socialtjänstlagen (2001:453)
- **Giltighetstid**: Till och med 30 juni 2025
- **Källa**: Sveriges Riksdag
- **URL**: https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/socialtjanstlag-2001453_sfs-2001-453
- **API endpoint**: `sol_gammal_kapitel` (browse_page_chapter)
- **Nyckelord**: "gammal sol", "sol 2001:453", "gamla socialtjänstlagen", "sol före 2025", "socialtjänstlagen 2001"
- **Prioritet**: 1
- **Kapitelextraktion**: Smart extraktion av specifika kapitel med bevarade paragrafmarkörer (inkl. bokstavsparagrafer)

## Kapitel- vs Paragrafextraktion (KRITISKT VIKTIGT)

När användare anger "X kap. Y §":
- **X = Kapitelnummer** → skickas som parameter `kapitel="X"` till API:et
- **Y = Paragrafnummer** → används endast för citat i svaret, INTE som API-parameter

**Exempel på KORREKT extraktion:**
1. "Citera 4 kap. 1 § i gamla SoL" → `sol_gammal_kapitel` med `{"kapitel": "4"}`
2. "Vad säger 11 kap 5 § i nya SoL?" → `sol_ny_kapitel` med `{"kapitel": "11"}`
3. "Jämför 4 kap. 1 § mellan gamla och nya SoL" → båda API:er med `{"kapitel": "4"}`

**Regex-mönster för extraktion**: `(\d+)\s+kap\.?\s+(\d+\s*[a-z]?)?\s*§?`
- Första gruppen = kapitelnummer (används som API-parameter)
- Andra gruppen = paragrafnummer (används för citat)

## Användningsexempel

### Exempel 1: Fråga om aktuell lag (default)
**Fråga**: "Vad säger SoL om ekonomiskt bistånd?"

**Systemets val**: `sol_ny_kapitel` (2025:400) med automatiskt val av relevant kapitel

**Förväntat svar**:
```
10 kap. 1 § Socialtjänstlagen (2025:400):

[Exakt text från nya lagen, kapitel 10 om ekonomiskt bistånd]

Vill du se hur denna paragraf har tillämpats i verkliga domar och prejudikat?

{
  "follow_up_options": [
    {
      "id": "prej_yes",
      "label": "Ja, visa domar och prejudikat",
      "action": "search_prejudikat",
      "parameters": {
        "paragraf": "10 kap. 1 §",
        "lag_namn": "Socialtjänstlagen (2025:400)",
        "personality": "socionomen"
      }
    },
    {
      "id": "prej_no",
      "label": "Nej, ställ ny fråga",
      "action": "decline_followup",
      "parameters": {
        "personality": "socionomen"
      }
    }
  ]
}

Källa: Socialtjänstlagen (2025:400) via Riksdagen – hämtat i realtid 15 december 2025.
```

### Exempel 2: Explicit fråga om specifik paragraf i gamla lagen
**Fråga**: "Citera 4 kap. 1 § i gamla SoL"

**Systemets val**: `sol_gammal_kapitel` (2001:453) med `{"kapitel": "4"}`

**VIKTIGT**: Parametern är `kapitel="4"`, INTE `kapitel="1"`!

**Förväntat svar**:
```
4 kap. 1 § Socialtjänstlagen (2001:453):

Den som inte själv kan tillgodose sina behov eller kan få dem tillgodosedda 
på annat sätt har rätt till bistånd av socialnämnden för sin försörjning 
(försörjningsstöd) och för sin livsföring i övrigt.

[Resten av kapitel 4 med alla paragrafer och underrubriker...]

Vill du se hur denna paragraf har tillämpats i verkliga domar och prejudikat?

[follow_up_options JSON...]

Källa: Socialtjänstlagen (2001:453) via Riksdagen – hämtat i realtid 15 december 2025.
```

**Längd**: Svaret bör vara 900-1500 tokens (ingen trunkering).

### Exempel 3: Jämförelse mellan lagversioner
**Fråga**: "Jämför 4 kap. 1 § i gamla och nya Socialtjänstlagen"

**Systemets val**: 
- `sol_gammal_kapitel` (2001:453) med `{"kapitel": "4"}`
- `sol_ny_kapitel` (2025:400) med relevant kapitel för bistånd

**VIKTIGT**: Båda API:er får samma `kapitel="4"` när det refereras till gamla lagen!

**Förväntat svar**:
```
Gammal SoL (2001:453, 4 kap. 1 §):
Den som inte själv kan tillgodose sina behov eller kan få dem tillgodosedda 
på annat sätt har rätt till bistånd av socialnämnden...

Ny SoL (2025:400, 10 kap. 1 §):
Den som inte själv kan tillgodose sina behov eller få dem tillgodosedda 
på annat sätt har rätt till bistånd...

Huvudskillnad: 
1. Bestämmelserna om ekonomiskt bistånd har flyttats från kapitel 4 till kapitel 10-12 i nya lagen
2. Den nya lagen betonar tydligare förebyggande insatser och barnets bästa i alla beslut
3. Formuleringen har förtydligats för att ge starkare rättigheter och tydligare ansvar

Vill du se hur dessa paragrafer har tillämpats i domstolspraxis?

[follow_up_options JSON med alternativ för båda lagversionerna...]

Källa: Sveriges Riksdag – hämtat i realtid 15 december 2025.
```

**Längd**: Svaret bör vara 1000-1800 tokens (ingen trunkering).

## API-konfiguration

### lagen_nu_sol_ny (2024:683)
```json
{
  "name": "lagen_nu_sol_ny",
  "source": "Lagrummet / Lagen.nu (ny SoL)",
  "url": "https://lagen.nu/2024:683",
  "tool": "browse_page",
  "keywords": [
    "socialtjänstlagen", "sol", "ekonomiskt bistånd", "§", "paragraf",
    "ny sol", "sol 2024:683", "nya socialtjänstlagen", "aktuell sol"
  ],
  "priority": 0,
  "description": "Socialtjänstlagen (SoL 2024:683) – ny lag från 1 juli 2025 via Lagen.nu"
}
```

### lagen_nu_sol_gammal (2001:453)
```json
{
  "name": "lagen_nu_sol_gammal",
  "source": "Lagrummet / Lagen.nu (gammal SoL)",
  "url": "https://lagen.nu/2001:453",
  "tool": "browse_page",
  "keywords": [
    "gammal sol", "sol 2001:453", "gamla socialtjänstlagen", "sol före 2025"
  ],
  "priority": 1,
  "description": "Socialtjänstlagen (SoL 2001:453) – gammal lag före 1 juli 2025 via Lagen.nu"
}
```

## System Prompt - Lagversionshantering

Socionomen har följande instruktioner för att välja rätt lagversion:

```
LAGVERSIONER (VÄLJ ALLTID RÄTT VERSION AV SOCIALTJÄNSTLAGEN):
- Default: Använd lagen_nu_sol_ny (2024:683) – den aktuella lagen från 1 juli 2025.
- När användaren frågar om "gammal SoL", "före 2025", "2001:453", "gamla socialtjänstlagen" 
  → använd lagen_nu_sol_gammal.
- När användaren frågar om "ny SoL", "efter 2025", "2024:683", "nya socialtjänstlagen" 
  eller inget specifikt → använd lagen_nu_sol_ny.
- När skillnader frågas → citera från båda versionerna och förklara huvudskillnaderna.
```

## Teknisk implementation

### API Selector Integration
API selector (`ml_service/api_selector.py`) hanterar automatiskt:
1. Identifiering av nyckelord i användarens fråga
2. Val av rätt API endpoint baserat på prioritet och keywords
3. Anrop till `browse_page` för att hämta lagtext från Lagen.nu
4. Returnering av text till modellen för formattering

### Browse_page Process
1. **URL**: `https://lagen.nu/2024:683` eller `https://lagen.nu/2001:453`
2. **HTTP GET**: Hämtar HTML från Lagen.nu
3. **Parsing**: Extraherar text med regex (tar bort script/style-taggar)
4. **Clean up**: Normaliserar whitespace
5. **Return**: Returnerar text till modellen

### Keyword Matching
Modellen analyserar användarens fråga och matchar keywords:
- "gammal sol" → `lagen_nu_sol_gammal` (priority 1)
- "ny sol" → `lagen_nu_sol_ny` (priority 0)
- "sol" (utan specifikation) → `lagen_nu_sol_ny` (priority 0, default)

## Testning

### Test Suite
1. **Aktuell lag**: "Vad säger SoL om ekonomiskt bistånd?"
2. **Gammal lag**: "Vad sade gamla SoL om ekonomiskt bistånd?"
3. **Jämförelse**: "Vad ändrades i 4 kap. 1 § SoL i nya lagen?"
4. **Specifik paragraf ny**: "Vad säger exakt 4 kap. 1 § SoL 2024:683?"
5. **Specifik paragraf gammal**: "Vad sade exakt 4 kap. 1 § SoL 2001:453?"

### Förväntade resultat
- ✅ Rätt lagversion väljs automatiskt baserat på nyckelord
- ✅ Exakt lagtext citeras från Lagen.nu
- ✅ Tydlig källhänvisning med lagnummer och datum
- ✅ Förklaringar av skillnader vid jämförelser
- ✅ Professionell och korrekt ton genomgående

## Fördelar med Lagen.nu

### Jämfört med Riksdagen.se
1. **Bättre struktur**: Lagen.nu har renare HTML och tydligare formatering
2. **Länkar mellan paragrafer**: Enklare navigation och referenshantering
3. **Kommentarer och förarbeten**: Tillgång till förklarande noter (om önskat)
4. **Snabbare access**: Oftast snabbare responstid än Riksdagen.se
5. **Versionshantering**: Enkel åtkomst till både gamla och nya lagversioner

### Lagrummet / Lagen.nu
- **Drivs av**: Staffan Malmgren
- **Syfte**: Fri tillgång till svensk lagstiftning
- **Licens**: Öppen data (CC0)
- **Uppdateringsfrekvens**: Kontinuerligt när lagar ändras
- **Tillförlitlighet**: Hög - baserat direkt på officiella lagtexter

## Framtida förbättringar

### Fas 2 (möjliga tillägg)
1. **Paragraf-specifika URLs**: Använd `https://lagen.nu/2024:683#K4P1` för direktlänkar
2. **Fler lagar**: LSS, HSL, SoL-förordningen, etc.
3. **Förarbeten**: Tillgång till propositioner och kommentarer
4. **Ändringshistorik**: Visa när och hur paragrafer ändrats över tid
5. **Jämförelser mellan fler versioner**: T.ex. visa ändringar 2010 → 2015 → 2025

## Sammanfattning

✅ **Båda lagversionerna stöds**
✅ **Automatisk val baserat på nyckelord**
✅ **Tydlig källhänvisning**
✅ **Jämförelser mellan versioner möjliga**
✅ **Professionell och korrekt presentation**
✅ **Integration med browse_page fungerar**

---

**Datum**: 2025-12-14
**Version**: 2.0.0 (med stöd för båda lagversionerna)
**Status**: Redo för testning
