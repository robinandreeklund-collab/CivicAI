# Socionomen - Stöd för båda Socialtjänstlagarna

## Översikt
Socionomen har uppdaterats för att hantera både den gamla och nya Socialtjänstlagen, vilket möjliggör:
- Citat från aktuell lag (2024:683)
- Citat från tidigare lag (2001:453)
- Jämförelser mellan lagversionerna
- Förklaringar av vad som ändrades

## Lagversioner

### Nya Socialtjänstlagen (2024:683)
- **Giltighetstid**: Från 1 juli 2025 →
- **Källa**: Lagrummet / Lagen.nu
- **URL**: https://lagen.nu/2024:683
- **API endpoint**: `lagen_nu_sol_ny`
- **Nyckelord**: "ny sol", "sol 2024:683", "nya socialtjänstlagen", "socialtjänstlagen 2025", "aktuell sol"
- **Prioritet**: 0 (default)

**Viktiga ändringar i nya lagen**:
- Stärkt barnperspektiv i alla beslut
- Tydligare rätt till bistånd och stöd
- Mer fokus på förebyggande insatser
- Förtydliganden kring samverkan mellan myndigheter
- Utökade rättigheter för personer med funktionsnedsättning

### Gamla Socialtjänstlagen (2001:453)
- **Giltighetstid**: Till och med 30 juni 2025
- **Källa**: Lagrummet / Lagen.nu
- **URL**: https://lagen.nu/2001:453
- **API endpoint**: `lagen_nu_sol_gammal`
- **Nyckelord**: "gammal sol", "sol 2001:453", "gamla socialtjänstlagen", "sol före 2025", "socialtjänstlagen 2001"
- **Prioritet**: 1

## Användningsexempel

### Exempel 1: Fråga om aktuell lag (default)
**Fråga**: "Vad säger SoL om ekonomiskt bistånd?"

**Systemets val**: `lagen_nu_sol_ny` (2024:683)

**Förväntat svar**:
```
4 kap. 1 § Socialtjänstlagen (2024:683):

[Exakt text från nya lagen]

Källa: Socialtjänstlagen (2024:683) via Lagrummet – hämtat i realtid 14 december 2025.
```

### Exempel 2: Explicit fråga om gamla lagen
**Fråga**: "Vad sade gamla SoL om ekonomiskt bistånd?"

**Systemets val**: `lagen_nu_sol_gammal` (2001:453)

**Förväntat svar**:
```
4 kap. 1 § Socialtjänstlagen (2001:453):

[Exakt text från gamla lagen]

Källa: Socialtjänstlagen (2001:453) via Lagrummet – hämtat i realtid 14 december 2025.
```

### Exempel 3: Jämförelse mellan lagversioner
**Fråga**: "Vad ändrades i 4 kap. 1 § SoL i nya lagen?"

**Systemets val**: Både `lagen_nu_sol_gammal` och `lagen_nu_sol_ny`

**Förväntat svar**:
```
Gammal SoL (2001:453, 4 kap. 1 §):
[Exakt text från gamla lagen]

Ny SoL (2024:683, 4 kap. 1 §):
[Exakt text från nya lagen]

Huvudskillnad: Den nya lagen betonar tydligare förebyggande insatser och barnets bästa i alla beslut. Formuleringen har förtydligats för att ge starkare rättigheter och tydligare ansvar för socialtjänsten.

Källa: Lagrummet – hämtat i realtid 14 december 2025.
```

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
