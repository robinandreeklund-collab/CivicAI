# CivicAI Design Prototypes - Complete Collection

Detta är den kompletta samlingen av designprototyper för CivicAI. Alla prototyper följer den grafiska profilen med färger #0a0a0a, #151515, #e7e7e7, accent #99c2ff, #31deac och minimalistisk stil.

## Original 4 Prototyper

### 1. Floating Timeline Scroll
**Fil:** `floating-timeline-scroll.html`

Flytande/horizontell timeline ovanför chatten med scroll och snap-animering.

**Funktioner:**
- Horizontal scrollable timeline med snap-to-event
- Auto-progression simulation
- Pulsing animations på aktiva events
- Navigation arrows
- Real-time status indicators

---

### 2. Pixel Perfect Input
**Fil:** `pixel-perfect-input.html`

Inputfält med border-animation vid fokus och skickaknapp med rörelse/hovereffekt.

**Funktioner:**
- Animated gradient border on focus
- Auto-resizing textarea (max 200px)
- Character counter (0/500)
- Ripple effect on button click
- 3 alternative input variants (Standard, Minimal, Compact)

---

### 3. Minimalist Quick Reply
**Fil:** `minimalist-quick-reply.html`

Modern panel för snabbsvar med animation som visas under inputfältet.

**Funktioner:**
- Slide-up animated panel
- Categorized quick replies
- Staggered item animations (50ms delay)
- Click-to-fill functionality
- Auto-dismiss on selection
- Outside click to close

---

### 4. Timeline Animated Overlays
**Fil:** `timeline-animated-overlays.html`

Timeline med event-overlay som animeras in vid interaktion.

**Funktioner:**
- Vertical timeline with alternating layout
- Click-triggered modal overlays
- Detailed event information
- Progress ring SVG animation
- Blur backdrop with scale transitions
- Close on Escape key

---

## Nya 10 Sökfält & Startsidor

### 1. Holographic Search
**Fil:** `search-landing-1-holographic.html`

Holografisk sökupplevelse med flytande partiklar.

**Funktioner:**
- 50 animated floating particles
- Holographic gradient text effects
- 3D transform on hover
- Pulse animation on search icon
- Feature cards with float animation
- Glow and shadow effects

**Design:** Futuristisk med holografiska effekter

---

### 2. Glassmorphism Hero
**Fil:** `search-landing-2-glassmorphism.html`

Frostat glas-design med flytande gradienter.

**Funktioner:**
- Floating gradient orbs background
- Frosted glass card with backdrop blur
- Morphing gradient border on focus
- Shimmer text effects
- Action chips with scale animation
- Stats section with fade-in

**Design:** Modern glassmorphism med blur-effekter

---

### 3. Neon Pulse
**Fil:** `search-landing-3-neon-pulse.html`

Cyberpunk-inspirerad med neon och pulsering.

**Funktioner:**
- Animated grid background
- Neon glow and flicker effects
- Multiple expanding pulse rings
- Button pulse animation
- Sweep animation on hover
- Grid pattern movement

**Design:** Cyberpunk neon-stil

---

### 4. Minimal Zen
**Fil:** `search-landing-4-minimal-zen.html`

Ultra-minimalistisk Zen-design.

**Funktioner:**
- Breathing typography animation
- Flowing line animation
- Expanding circle button effect
- Minimal color palette
- Focus-triggered padding expansion
- Zen-inspired spacing

**Design:** Extremt minimalistisk med mycket whitespace

---

### 5. Liquid Motion
**Fil:** `search-landing-5-liquid-motion.html`

Morfande blobs med flytande animeringar.

**Funktioner:**
- Morphing blob backgrounds
- Liquid-style border animations
- Flowing text gradients
- Shimmer effects on cards
- Ripple effect on button
- Organic shape morphing

**Design:** Flytande organiska former

---

### 6. Terminal Command
**Fil:** `search-landing-6-terminal-command.html`

Retro terminal/CLI-interface.

**Funktioner:**
- Scanline overlay effect
- Blinking cursor and LEDs
- Terminal-style input with prefix
- Monospace font throughout
- Status bar with system info
- Glitch-inspired animations

**Design:** Retro terminal/command-line

---

### 7. Particle Wave
**Fil:** `search-landing-7-particle-wave.html`

Canvas-baserat partikelsystem med vågor.

**Funktioner:**
- 100 animated particles with connections
- Wave-based expanding rings
- Particle network visualization
- Canvas rendering at 60fps
- Wave gradient text
- Shine effect on button

**Design:** Partikel-våg visualisering

---

### 8. Gradient Flow
**Fil:** `search-landing-8-gradient-flow.html`

Flytande gradienter i flera lager.

**Funktioner:**
- Multi-layer gradient backgrounds
- Rotating gradient icon
- Animated gradient borders
- Flowing gradient button
- Gradient line animation on cards
- Breathing gradient shifts

**Design:** Gradient-fokuserad med flöden

---

### 9. 3D Depth
**Fil:** `search-landing-9-3d-depth.html`

CSS 3D-perspektiv med djupeffekter.

**Funktioner:**
- 3D perspective transforms
- Depth layers with parallax
- 3D hover interactions (rotateX, rotateY)
- Floating elements in Z-space
- Shadow depth simulation
- Transform-style: preserve-3d

**Design:** 3D djup med perspektiv

---

### 10. Cyber Matrix
**Fil:** `search-landing-10-cyber-matrix.html`

Matrix-regn med glitch-effekter.

**Funktioner:**
- Matrix rain effect (Canvas)
- Glitch text animations
- Neon scanline effects
- LED status indicators
- Cyberpunk grid layout
- Monospace cyber-font

**Design:** Matrix/cyberpunk-stil

---

## Tekniska Specifikationer

### Alla prototyper innehåller:
- ✅ Self-contained HTML files (ingen externa dependencies)
- ✅ Embedded CSS and JavaScript
- ✅ Responsiv design
- ✅ CivicAI färgpalett (#0a0a0a, #151515, #e7e7e7, #99c2ff, #31deac)
- ✅ Minimalistisk stil
- ✅ 60fps smooth animations
- ✅ Interactive hover states
- ✅ Svenska språket

### Browser-kompatibilitet:
- Chrome/Edge (senaste)
- Firefox (senaste)
- Safari (senaste)
- Mobile browsers (responsiv design)

### Prestanda:
- Inga externa HTTP requests
- Optimerade CSS animations
- Hardware-accelererade transforms
- Canvas-optimering där tillämpligt

---

## Hur man testar

1. Öppna valfri HTML-fil direkt i webbläsaren
2. Ingen build eller installation krävs
3. Alla filer är self-contained
4. Fungerar offline

### Rekommenderad testning:
```bash
# Starta en lokal server
python3 -m http.server 8080

# Öppna i webbläsare
http://localhost:8080/[filnamn].html
```

---

## Designprinciper

Alla prototyper följer CivicAI:s designprinciper:

1. **Minimalism först** - Varje element har ett syfte
2. **Grafisk profil** - Konsekvent färgpalett
3. **Smooth animations** - 60fps med CSS transforms
4. **Responsiv design** - Fungerar på alla skärmstorlekar
5. **Tillgänglighet** - Keyboard navigation där relevant
6. **Prestanda** - Optimerade animationer och effekter

---

## Användningsområden

### Original 4 prototyper:
- **Timeline scroll**: Process visualization
- **Input field**: Search och query input
- **Quick reply**: Pre-defined questions
- **Timeline overlays**: Detailed event information

### Nya 10 landing pages:
Perfekta för:
- Startsida / Hero section
- Marketing landing page
- Product showcase
- Brand presentation
- Demo/preview sida

---

**Version:** 2.0  
**Datum:** 2025-11-16  
**Skapad för:** CivicAI UX Design Lab
