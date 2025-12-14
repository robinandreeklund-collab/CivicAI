# Socionomen – Testdokumentation

## Översikt
Socionomen är en ny personlighet i CivicAI som specialiserar sig på svensk socialtjänst, sociallagstiftning och socialstatistik.

## Implementering
- **API Catalog**: `config/api_catalog_socionomen.json`
- **Personlighet**: `frontend/public/characters/OneSeek-Socionomen.yaml`
- **API Modul**: `api/socionomen.py`
- **Registrerad i**: `config/personality_catalog.json` och `config/api_catalog.json`

## Datakällor
1. **Sveriges Riksdag** - Lagtexter (SoL, LVU)
2. **Socialstyrelsen** - Officiell statistik om socialtjänst
3. **IVO** - Tillsynsrapporter och beslut
4. **SCB** - Kommunstatistik

## Browse_page funktionalitet
Socionomen använder `"tool": "browse_page"` för att hämta innehåll från:
- Lagtexter på riksdagen.se
- Statistik från socialstyrelsen.se
- IVO-rapporter från ivo.se
- Kommunstatistik från SCB

**Observera**: Browse_page-funktionaliteten behöver vara aktiverad i `ml_service/server.py` för att dessa endpoints ska fungera korrekt. Servern måste kunna ta emot function calls från modellen, hämta webbsidor med requests/playwright, och returnera innehållet till användaren.

## Testfrågor

### Test 1: Socialtjänstlagen (SoL)
**Fråga**: "Vad säger SoL om ekonomiskt bistånd?"

**Förväntat svar**: 
- Referens till SoL 4 kap. 1 §
- Exakt lagtext (ordagrant citat)
- Förklaring av rätten till ekonomiskt bistånd
- Källa: Socialtjänstlagen (2001:453) via Sveriges Riksdag

**API som används**: `sol_lagtext` (browse_page)

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
