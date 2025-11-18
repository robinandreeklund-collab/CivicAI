# OneSeek.AI Design Concepts

Detta är designkoncept för den nya grafiska profilen för OneSeek.AI - en komplett rebranding från CivicAI.

## 📂 Filer i denna mapp

### 1. `animated-text-logo-demo.html`
**Animerad textlogotyp - 6 varianter**

Visar sex olika animationskoncept för OneSeek.AI logotypen, alla i gråtoner:

- **Variant 1: Fade & Slide** - Subtil fade-in med lätt rörelse uppåt
- **Variant 2: Letter Wave** - Vågrörelser genom bokstäverna, en efter en
- **Variant 3: Gradient Shift** - Gradient som rör sig genom texten
- **Variant 4: Glow Pulse** - Pulserande glöd-effekt runt texten
- **Variant 5: Split Reveal** - Delade delar som rör sig mot varandra
- **Variant 6: Typing Effect** - Klassisk skrivmaskineffekt

**Rekommenderad variant:** Variant 3 (Gradient Shift) eller Variant 4 (Glow Pulse) för bästa balans mellan visuell impact och minimalism.

### 2. `graphic-profile-demo.html`
**Komplett grafisk profil**

Detaljerad demonstration av:

- **Färgpalett** - 8 nyanser av grått från #1a1a1a till #f5f5f5
- **Typografi** - Font sizes, weights och letter spacing
- **UI Komponenter** - Buttons, inputs, cards, badges
- **Layout exempel** - Sidebar och main content struktur
- **Designprinciper** - 6 grundprinciper för den nya profilen

**Nyckelprinciper:**
1. Minimalism först
2. Endast gråtoner
3. Generöst med whitespace
4. Subtila animationer
5. Typografi som hierarki
6. Konsekvent spacing

### 3. `full-ui-demo.html`
**Interaktiv fullständig UI-demo**

En komplett, interaktiv mockup av hela OneSeek.AI-gränssnittet:

- Kollapsbar sidebar med animerad logo
- AI-tjänsteväljare med toggle switches
- Tom state med animerad logotyp
- Chat-gränssnitt med exempel på AI-svar
- Input-område med auto-resize
- Responsiva hover-states och animationer

**Interaktiva funktioner:**
- Klicka på collapse-knappen för att kollapsa sidebaren
- Klicka på AI-toggles för att aktivera/deaktivera modeller
- Skriv i input-fältet och tryck "Skicka" för att visa exempel-svar

## 🎨 Färgpalett (Endast Gråtoner)

| Namn | Hex | Användning |
|------|-----|------------|
| Djup Svart | `#1a1a1a` | Bakgrund, primary surface |
| Mörk Grå | `#2a2a2a` | Sekundär bakgrund, cards |
| Medium Grå | `#3a3a3a` | Borders, dividers |
| Ljus Grå | `#505050` | Hover states, accents |
| Silver | `#888888` | Sekundär text, subtitles |
| Ljus Silver | `#c0c0c0` | Body text |
| Ljusgrå | `#e0e0e0` | Primary text, headings |
| Nästan Vit | `#f5f5f5` | Highlights, brand elements |

## 📏 Spacing System

- **Extra Small:** 8px
- **Small:** 16px
- **Medium:** 24px
- **Large:** 32px
- **Extra Large:** 40px
- **XXL:** 60px

## 🔤 Typografi

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### Sizes & Weights

| Element | Size | Weight | Letter Spacing | Color |
|---------|------|--------|----------------|-------|
| H1 | 48px | 300 | 2px | #f5f5f5 |
| H2 | 32px | 300 | 1px | #e0e0e0 |
| H3 | 20px | 500 | 0.5px | #e0e0e0 |
| Body | 16px | 400 | 0 | #c0c0c0 |
| Small | 13px | 400 | 0 | #888 |
| Label | 11px | 500 | 1px | #666 |

## 🎬 Animationer

### Rekommenderade Timing Functions
- **Ease:** Default för de flesta animationer
- **Ease-in-out:** För fade och slide effekter
- **Linear:** För kontinuerliga animationer (gradient shifts)

### Rekommenderade Durationer
- **Snabb:** 0.2s - Hover states, toggle switches
- **Normal:** 0.3s - Buttons, modals
- **Långsam:** 2-3s - Logo-animationer, gradient shifts

## 📱 Hur man testar

1. Öppna HTML-filerna direkt i din webbläsare
2. Testa olika viewport-storlekar för att se responsivitet
3. Interagera med element för att se hover-states och animationer
4. Observera färgpaletten och spacing

## 🖼️ Skärmbilder

För att ta skärmbilder av koncepten:

1. Öppna varje HTML-fil i webbläsaren
2. Använd webbläsarens fullskärmsläge (F11)
3. Ta skärmbild eller använd verktyg som:
   - macOS: Cmd + Shift + 4
   - Windows: Win + Shift + S
   - Linux: PrtScn eller Shift + PrtScn

## 🎯 Nästa Steg

Efter godkännande av designkoncepten:

1. ✅ Välj föredragen animerad logo-variant
2. ✅ Implementera nya färgpaletten i Tailwind config
3. ✅ Uppdatera alla komponenter med nya färger
4. ✅ Byt ut alla referenser från CivicAI till OneSeek.AI
5. ✅ Skapa nya logo-komponenter i React
6. ✅ Testa och verifiera alla ändringar

## 💡 Design Philosophy

**"Minimalism är inte att ha mindre. Det är att ha exakt vad som behövs."**

OneSeek.AI's nya design fokuserar på:
- **Klarhet:** Varje element har ett tydligt syfte
- **Elegans:** Subtila animationer och välbalanserad typografi
- **Professionalism:** Gråskalan skapar en lyxig, seriös känsla
- **Fokus:** Inget distraherar från innehållet

---

**Version:** 1.0
**Datum:** 2024-11-14
**Skapat för:** OneSeek.AI Rebranding Project
