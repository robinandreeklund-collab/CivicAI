# NLP Flow Demos

Denna mapp innehåller 10 olika HTML-demonstrationer som visar fullständigt flöde från landningssida till NLP-bearbetning till chattvy.

## Översikt

Varje demo implementerar samma grundläggande flöde:
1. **Landningssida** - Visar "Välkommen!" och ett inmatningsfält för frågor
2. **NLP-laddare** - Animerad visualisering av NLP-bearbetningssteg
3. **Chattvy** - Visar användarens fråga och ett simulerat AI-svar

## NLP-bearbetningssteg

Alla demos visar dessa fem NLP-steg:
1. **Tokenisering** - Delar upp texten i mindre enheter
2. **Entitetsigenkänning** - Identifierar namngivna entiteter
3. **Sentimentanalys** - Analyserar känslomässig ton
4. **Semantisk analys** - Förstår innebörden av texten
5. **Sammanfattning** - Skapar koncist svar

## Demo-varianter

### Demo 1 - Progress Bar
**Fil:** `demo-01-progress-bar.html`

Klassisk progressbar med steg-för-steg-visualisering. Varje steg aktiveras i tur och ordning med visuell feedback.

**Funktioner:**
- Horisontell progressbar
- Steg-ikoner med checkmarkeringar
- Smooth övergångar

---

### Demo 2 - Circular Pulse
**Fil:** `demo-02-circular-pulse.html`

Elegant cirkulär pulsanimation med koncentriska ringar som expanderar.

**Funktioner:**
- Pulsande ringar
- Centrerad textvisning
- Mjuka färggradienter (turkos/grön)

---

### Demo 3 - Typing Dots
**Fil:** `demo-03-typing-dots.html`

Minimalistisk design med tre studsande punkter och roterande stegnamn.

**Funktioner:**
- Animerade prickar (typing indicator)
- Fade-in text för varje steg
- Mörkt tema med lila gradienter

---

### Demo 4 - Vertical Timeline
**Fil:** `demo-04-vertical-timeline.html`

Vertikal tidslinje med detaljerad beskrivning för varje steg.

**Funktioner:**
- Timeline med vertikalt flöde
- Steg-beskrivningar
- Pulsande aktiv indikator
- Gröna checkmarkeringar för slutförda steg

---

### Demo 5 - Gradient Wave
**Fil:** `demo-05-gradient-wave.html`

Våganimation med flytande steg-badges.

**Funktioner:**
- Animerade gradienter som rör sig
- Flytande (floating) steg-knappar
- Rosa/röd färgpalett

---

### Demo 6 - Card Flip
**Fil:** `demo-06-card-flip.html`

Kort som vänds för att visa varje bearbetningssteg.

**Funktioner:**
- 3D-rotationsanimation
- Kort vänds sekventiellt
- Orange/gul färgschema

---

### Demo 7 - Matrix Rain
**Fil:** `demo-07-matrix-rain.html`

Matrix-inspirerad design med fallande text och grön terminal-estetik.

**Funktioner:**
- Animerad Matrix-bakgrund (canvas)
- Fallande steg-text
- Monospace font
- Klassisk grön-på-svart färgschema

---

### Demo 8 - Ripple Effect
**Fil:** `demo-08-ripple-effect.html`

Koncentrerade cirklar som expanderar i vattenvågor.

**Funktioner:**
- Ripple-animation (vågeffekt)
- Mjuka övergångar
- Lila gradient bakgrund

---

### Demo 9 - Particle System
**Fil:** `demo-09-particle-system.html`

Interaktivt partikelsystem med förbundna noder.

**Funktioner:**
- Canvas-baserade partiklar
- Dynamiska anslutningar mellan partiklar
- Röd/blå färgschema

---

### Demo 10 - Neural Network
**Fil:** `demo-10-neural-network.html`

Neuralt nätverk visualisering med noder och anslutningar.

**Funktioner:**
- Simulerad neural nätverksarkitektur
- Aktivering av lager sekventiellt
- Lysande anslutningar mellan noder
- Blå/lila färgschema

---

## Användning

Varje demo är en fristående HTML-fil som kan öppnas direkt i en webbläsare.

### Öppna en demo:
1. Navigera till `nlp-flow-demos/` mappen
2. Dubbelklicka på önskad `.html` fil
3. Eller öppna filen i din webbläsare

### Interaktion:
1. Skriv en fråga i inmatningsfältet
2. Klicka "Skicka fråga" eller tryck Enter
3. Se NLP-bearbetningen animeras
4. Läs det simulerade AI-svaret
5. Klicka "Ställ ny fråga" för att börja om

## Teknisk information

### Teknologier:
- **HTML5** - Struktur
- **CSS3** - Styling och animationer
- **JavaScript (Vanilla)** - Logik och interaktivitet
- **Canvas API** - För demos 7, 9 och 10

### Funktioner:
- Inga externa beroenden
- Responsiv design
- Smooth animationer och övergångar
- Keyboard-support (Enter för att skicka)

### Simulerat AI-svar:
Varje demo använder ett av tre fördefinierade svar som väljs slumpmässigt:
1. Komplext ämne som kräver noggrann övervägning
2. Beror på olika perspektiv och sammanhang
3. Flera aspekter att ta hänsyn till

## Anpassning

För att anpassa demos:

1. **Ändra färger** - Leta efter gradient- och färgdefinitioner i `<style>` sektionen
2. **Justera timing** - Ändra `setTimeout` värden (vanligtvis 800-900ms)
3. **Lägg till fler steg** - Uppdatera `steps` array i JavaScript
4. **Anpassa svar** - Modifiera `responses` array i `showChat()` funktionen

## Browser-kompatibilitet

Alla demos fungerar i moderna webbläsare:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Licens

MIT License - Fri att använda, modifiera och distribuera.
