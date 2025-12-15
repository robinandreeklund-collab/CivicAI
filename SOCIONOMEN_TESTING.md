# Socionomen – Testdokumentation

## Översikt
Socionomen är en ny personlighet i CivicAI som specialiserar sig på svensk socialtjänst, sociallagstiftning och socialstatistik.

## Implementering
- **API Catalog**: `config/api_catalog_socionomen.json`
- **Personlighet**: `frontend/public/characters/OneSeek-Socionomen.yaml`
- **API Modul**: `api/socionomen.py`
- **Registrerad i**: `config/personality_catalog.json` och `config/api_catalog.json`

## Datakällor
1. **Riksdagen.se** - Lagtexter (SoL 2025:400 och 2001:453, LVU) med kapitelextraktion
2. **Socialstyrelsen** - Officiell statistik om socialtjänst
3. **IVO** - Tillsynsrapporter och beslut
4. **SCB** - Kommunstatistik

## Browse_page och kapitelextraktion
Socionomen använder två huvudsakliga verktyg för att hämta lagtexter:

### Kapitelextraktion från Riksdagen (FÖREDRAGEN)
- **API:er**: `sol_ny_kapitel`, `sol_gammal_kapitel`
- **Tool**: `"browse_page_chapter"` (method: `"BROWSE_CHAPTER"`)
- **Funktion**: `browse_page_with_chapter_extraction` i `api_integrations.py`
- **Fördelar**:
  - Smart extraktion av specifika kapitel (3-6k tecken per kapitel)
  - Behåller paragrafmarkörer (inkl. bokstavsparagrafer som "1 a §", "1 b §")
  - Bevarar underrubriker (h4, h5)
  - Snabb och effektiv (ingen BERT-sammanfattning)
  
**Parameter-hantering KRITISKT VIKTIGT**:
- Vid användarfråga "4 kap. 1 §" → `kapitel="4"` (INTE 1!)
- Vid användarfråga "11 kap 5 §" → `kapitel="11"` (INTE 5!)
- Första siffran = kapitelnummer, andra siffran = paragrafnummer (används bara i svar)

### Legacy browse_page
- **Fallback**: För andra källor (Socialstyrelsen, IVO, SCB)
- Används när `"tool": "browse_page"` eller `"method": "BROWSE"`
- Max 6000 tecken

**Implementation**: Båda verktygen är integrerade i `ml_service/api_selector.py`. API-selektorn väljer automatiskt rätt verktyg baserat på `tool` eller `method` fält i API-konfigurationen.

## Testfrågor

### Test 1: Nya Socialtjänstlagen (SoL 2025:400)
**Fråga**: "Vad säger SoL om ekonomiskt bistånd?"

**Förväntat svar**: 
- Referens till ekonomiskt bistånd i nya lagen (kap. 10-12 i 2025:400)
- Exakt lagtext (ordagrant citat från nya lagen)
- Förklaring av rätten till ekonomiskt bistånd
- Follow-up fråga om prejudikat med `follow_up_options` JSON
- Källa: Socialtjänstlagen (2025:400) via Riksdagen

**API som används**: `sol_ny_kapitel` (browse_page_chapter)

---

### Test 1b: Gamla Socialtjänstlagen (SoL 2001:453) med specifik paragraf
**Fråga**: "Citera 4 kap. 1 § i gamla SoL"

**Förväntat svar**: 
- API anropas med `kapitel="4"` (INTE 1!)
- Referens till SoL 4 kap. 1 § (gamla lagen 2001:453)
- Exakt lagtext (ordagrant citat från kapitel 4, inklusive 1 §)
- Förklaring av rätten till ekonomiskt bistånd
- Follow-up fråga om prejudikat med `follow_up_options` JSON
- Svar längre än 900 tokens (ingen trunkering)
- Källa: Socialtjänstlagen (2001:453) via Riksdagen

**API som används**: `sol_gammal_kapitel` med parameter `{"kapitel": "4"}` (browse_page_chapter)

---

### Test 1c: Jämförelse mellan gamla och nya lagen
**Fråga**: "Jämför 4 kap. 1 § i gamla och nya Socialtjänstlagen"

**Förväntat svar**: 
- Båda API:er anropas med `kapitel="4"`
- Citat från både gamla (2001:453, 4 kap.) och nya (2025:400, kap. 10-12 för bistånd)
- Tydlig förklaring av skillnaderna och kapitelflytt
- Kontext om varför ändringen gjordes (t.ex. stärkt barnperspektiv, fokus på prevention)
- Follow-up alternativ för båda lagversionerna
- Totalt svar >1000 tokens utan trunkering
- Källa: Riksdagen (båda lagversionerna)

**API som används**: Både `sol_gammal_kapitel` (`kapitel="4"`) och `sol_ny_kapitel` (relevant kapitel för bistånd)

---

### Test 2: Statistik om placerade barn
**Fråga**: "Hur många barn är placerade i Sverige?"

**Förväntat svar**:
- Senaste statistik från Socialstyrelsen
- Antal barn i familjehem, HVB-hem, stödboende
- Fördelning och trender
- Källa: Socialstyrelsen – Statistik om barn och unga i socialtjänsten [år]

**API som används**: `socialstyrelsen_barn_vard` (browse_page)

---

### Test 3: Kommunstatistik
**Fråga**: "Hur ser statistiken ut för ekonomiskt bistånd i Hjo kommun?"

**Förväntat svar**:
- Kommunspecifik statistik från SCB
- Antal hushåll med ekonomiskt bistånd
- Jämförelse med andra kommuner eller riket
- Trender över tid
- Källa: SCB Statistikdatabasen – Ekonomiskt bistånd Hjo kommun [år]

**API som används**: `scb_kommun_statistik` (browse_page)

---

### Test 4: IVO-rapporter
**Fråga**: "Vilka IVO-rapporter finns om HVB-hem?"

**Förväntat svar**:
- Lista över relevanta IVO tillsynsbeslut
- Sammanfattning av vanliga brister/missförhållanden
- Länkar till fullständiga rapporter
- Källa: IVO tillsynsbeslut publicerat [datum] på ivo.se

**API som används**: `ivo_rapporter` (browse_page)

---

### Test 5: Follow-up för prejudikat (Ny funktionalitet)
**Fråga**: Efter ett lagcitat-svar, användaren svarar "ja" på uppföljningsfrågan

**Förväntat flöde**:
1. **Initialt svar** på "Citera 4 kap. 1 § i gamla SoL":
   - Lagtext från 4 kap. med paragraf 1
   - Uppföljningsfråga: "Vill du se hur denna paragraf har tillämpats i verkliga domar och prejudikat?"
   - **MÅSTE inkludera** `follow_up_options` JSON:
   ```json
   {
     "follow_up_options": [
       {
         "id": "prej_yes",
         "label": "Ja, visa domar och prejudikat",
         "action": "search_prejudikat",
         "parameters": {
           "paragraf": "4 kap. 1 §",
           "lag_namn": "Socialtjänstlagen (2001:453)",
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
   ```

2. **När användaren väljer "ja"** eller skriver "ja", "visa", "ja tack":
   - Frontend anropar `handleFollowUpAction` med vald option
   - Backend triggar ny sökning efter domar/prejudikat
   - Svar innehåller sammanfattning av relevanta domstolsavgöranden
   - Högt token-limit (1200+) för att inkludera flera domstolsexempel

**Validation**:
- `follow_up_options` finns i response JSON
- Alla required fields finns: `id`, `label`, `action`, `parameters`
- `action === "search_prejudikat"` för positiva alternativ
- `parameters` innehåller `paragraf`, `lag_namn`, och `personality`
- Frontend kan rendera knappar från options
- Click/text-svar triggar `handleFollowUpAction`

---

## Testning av API-modulen

### Manuell testning av Python-modulen
```bash
cd /home/runner/work/CivicAI/CivicAI
python api/socionomen.py
```

Detta kör tre tester:
1. Sökning i riksdagsdokument om socialtjänst
2. Hämtning av SoL-information
3. Hämtning av LVU-information

### Förväntat output
- Test 1 ska returnera lista över riksdagsdokument
- Test 2 ska returnera grundläggande SoL-information
- Test 3 ska returnera grundläggande LVU-information

---

## Nyckelord och aktivering

Socionomen aktiveras automatiskt när användaren ställer frågor med följande nyckelord:

- **Lagtexter**: socialtjänst, sol, socialtjänstlagen, lvu, paragraf, lag
- **Ekonomiskt bistånd**: ekonomiskt bistånd, försörjningsstöd
- **Barn och unga**: placerade barn, hvb, familjehem, barn i vård
- **Myndigheter**: ivo, socialstyrelsen
- **Statistik**: statistik, kommun

---

## Integration med server.py

### Browse_page implementering
För att Socionomen ska fungera fullt ut måste `ml_service/server.py` hantera:

1. **Function calls från modellen**:
   - Modellen identifierar att browse_page behövs
   - Skickar function call med URL

2. **Servern hanterar function call**:
   - Tar emot URL från modellen
   - Hämtar webbsidan med requests eller playwright
   - Extraherar relevant text/innehåll
   - Eventuellt summarerar långt innehåll
   - Returnerar till modellen

3. **Modellen använder resultatet**:
   - Får texten från webbsidan
   - Formulerar svar till användaren
   - Inkluderar korrekt källhänvisning

### Exempel på browse_page flow:
```
Användare: "Vad säger SoL om ekonomiskt bistånd?"
↓
Modellen identifierar: behöver sol_lagtext
↓
Function call: browse_page("https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/socialtjanstlag-20012453_sfs-2001-453")
↓
Server hämtar sidan och returnerar text
↓
Modellen läser 4 kap. 1 § och svarar användaren
```

---

## Verifiering

### Checklist för implementation:
- [x] `config/api_catalog_socionomen.json` skapad
- [x] `config/api_catalog.json` uppdaterad med socionom-referens
- [x] `frontend/public/characters/OneSeek-Socionomen.yaml` skapad
- [x] `config/personality_catalog.json` uppdaterad
- [x] `api/socionomen.py` skapad
- [ ] Browse_page funktionalitet verifierad i server.py
- [ ] Manuella tester körda med testfrågorna
- [ ] Integration test med live system

---

## Nästa steg

1. **Verifiera browse_page**: Kontrollera att server.py har stöd för browse_page function calls
2. **Testning**: Kör de fyra testfrågorna i live-systemet
3. **Finjustering**: Justera system_prompt baserat på testresultat
4. **Dokumentation**: Uppdatera användarguider med Socionomen-funktionalitet

---

## Anmärkningar

- Alla API:er är gratis och kräver inga API-nycklar
- Browse_page är kritisk för lagtext och vissa statistik-endpoints
- Riksdagens standard-API används för dokumentsökning (JSON)
- Källhänvisningar är obligatoriska i alla svar
- Tonen ska vara professionell men tillgänglig
- Inga juridiska råd ges – endast faktainformation

---

**Datum**: 2025-12-14
**Version**: 1.0.0
**Status**: Implementation klar, väntar på testning
