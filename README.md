# 🧭 CivicAI

**Beslut med insyn. AI med ansvar.**

CivicAI är en öppen plattform för att jämföra hur olika AI-modeller svarar på samma fråga. Genom att synliggöra skillnader i fakta, ton, bias och källor hjälper CivicAI beslutsfattare att fatta mer informerade och transparenta beslut.

---

## 🎨 Grok-Inspirerad Design

CivicAI har nu en moderniserad design inspirerad av Grok med fokus på användarvänlighet och professionell estetik.

### Huvudfunktioner

![CivicAI Huvudvy](https://github.com/user-attachments/assets/e5c29380-8140-4b7b-8af0-2eaa5f858341)
*Grok-inspirerad layout med sidebar, centrerad chat och AI-tjänsteväljare*

**✨ Nyckeldelar:**
- **Sidebar**: Historia av konversationer, logo-placering och exportfunktioner
- **AI-Tjänsteväljare**: Aktivera/deaktivera specifika AI-modeller innan frågan skickas
- **Centrerad Chat**: Frågeruta och svar i mitten, precis som Grok
- **Moderna Animationer**: Fade-ins, loaders och smooth transitions

### AI-Tjänsteväljare

![AI-Tjänsteväljare](https://github.com/user-attachments/assets/fa7d93ce-2937-448b-8871-117d7cb16da1)
*Välj vilka AI-modeller som ska inkluderas i svaret*

Användare kan nu välja vilka AI-tjänster de vill fråga:
- 🤖 **GPT-3.5**: Snabb och effektiv
- ✨ **Gemini**: Googles AI-modell
- Toggle-switchar för enkel aktivering/deaktivering

### Kollapsbar Sidebar

![Kollapsad Sidebar](https://github.com/user-attachments/assets/28d135ed-3cb5-4967-9044-ae4163edfd2b)
*Maximera arbetsytan genom att kollapsa sidebaren*

Sidebaren kan enkelt kollapsa för att ge mer utrymme åt konversationen.

---

## 📦 Projektstruktur

```plaintext
civicai/
├── README.md                  # Projektbeskrivning
├── manifest.yaml              # Vision, målgrupp, komponenter, värderingar
├── index.yaml                 # Modulöversikt och navigering
├── CONTRIBUTING.md            # Onboarding för utvecklare
│
├── frontend/                  # React-applikation
│   ├── src/
│   │   ├── components/        # UI-komponenter
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Normalisering, export
│   │   ├── pages/             # Vystrukturer
│   │   └── styles/            # Tema och typografi
│
├── backend/                   # API och analysmotorer
│   ├── api/                   # Endpoints
│   ├── services/              # AI-integrationer
│   ├── schemas/               # JSON-schema
│   └── utils/                 # Analysmoduler
│
├── firebase/                  # Databas (aktiveras efter MVP)
├── data/                      # Testfrågor, exports, profiler
└── tests/                     # Enhetstester och mockdata

```

🛠 Teknikstack

Lager

Teknik

Frontend

React, Vite, Tailwind CSS, Zustand

Backend

Node.js eller FastAPI

AI-modeller

OpenAI (GPT-3.5), Gemini, HuggingFace, Together.ai

Analys

spaCy, TextBlob, GPT-3.5 som metagranskare

Export

js-yaml, markdown-it, html2pdf

Databas

Firebase (kopplas på efter MVP)

## 🚀 Kom igång

### Backend Setup

1. **Installera beroenden:**
   ```bash
   cd backend
   npm install
   ```

2. **Konfigurera API-nycklar:**
   
   Skapa en `.env`-fil i `backend/`-mappen baserad på `.env.example`:
   ```bash
   cp .env.example .env
   ```
   
   Redigera `.env` och lägg till dina API-nycklar:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Google Gemini Configuration
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Server Configuration
   PORT=3001
   ```

3. **Starta backend-servern:**
   ```bash
   npm start
   ```
   
   Servern startar på `http://localhost:3001` och visar debug-information om API-nycklar är konfigurerade:
   ```
   🚀 CivicAI Backend running on port 3001
   🔗 Health check: http://localhost:3001/health
   [DEBUG] OPENAI_API_KEY: ✓ Configured
   [DEBUG] GEMINI_API_KEY: ✓ Configured
   ```

### API-nycklar och felsökning

**Gemini API:**
- Använder modell: `gemini-2.5-flash`
- Hämta API-nyckel från: [Google AI Studio](https://aistudio.google.com/app/apikey)

**OpenAI API:**
- Använder modell: `gpt-3.5-turbo`
- Hämta API-nyckel från: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Obs:** Kontrollera att du har tillgänglig kredit och inte har överskridit din kvot

**Vanliga fel:**
- `404 Not Found` (Gemini): Modellnamnet är inkorrekt eller inaktuellt. Använd `gemini-2.5-flash` eller `gemini-1.5-pro`.
- `429 Quota Exceeded` (OpenAI): Du har överskridit din API-kvot. Kontrollera ditt konto och faktureringsdetaljer.
- `401 Unauthorized`: API-nyckeln är ogiltig eller felaktig.

**OBS:** Utan konfigurerade API-nycklar kommer applikationen att fungera med simulerade svar för demonstration.

✨ Funktioner

🔄 Multi-agent svarsspegel

🧠 Ton- och stilanalys

🧭 Biasdetektion

🔍 Faktakoll mot webbkällor

🧬 Agentprofiler

🗳 Battle mode

📤 Export till YAML, README, PDF

📚 Audit trail för transparens

🧩 Komponentöversikt

Komponent

Funktion

AgentBubble

Visar AI-svar med agentnamn, tonetikett och färgkodning

BiasIndicator

Visualiserar bias (politisk, kommersiell, kulturell)

BattlePanel

Låter användare rösta på bästa AI-svar

AgentProfileCard

Visar AI-modellens stil, ton och källpreferens

ExportPanel

Exporterar jämförelse till YAML, README eller PDF

ComparisonPanel

Huvudvy för AI-svar, analys och metadata

QuestionInput

Frågeruta som triggar AI-anrop

ResponseAnalyzer

Kör tonanalys, biasdetektion och faktakoll

SettingsPanel

Välj AI-modeller, språk och analysnivå

AuditTrailViewer

Visar historik över frågor och exporthändelser

🚀 Utvecklingsfaser

🧪 Fas 1: MVP

[ ] Frågeruta + agentbubblor

[ ] API-anrop till GPT-3.5 och Gemini

[ ] YAML-export

[ ] Grundläggande UI med mörkt tema

🔍 Fas 2: Analys & insyn

[ ] Ton- och stilanalys

[ ] Biasindikatorer

[ ] Faktakoll via webbsök

[ ] Agentprofiler

[ ] 🔧 Koppla på Firebase som databas

🗳 Fas 3: Beslutsstöd

[ ] Battle mode

[ ] Audit trail

[ ] Policyfrågebank

[ ] Export till PDF/README

🌐 Fas 4: Skalbarhet & öppenhet

[ ] API för externa appar

[ ] Crowdsourcing av feedback

[ ] Offentlig portal för medborgare

[ ] Fler AI-modeller via Together.ai eller HuggingFace

📜 Licens

MIT — fritt att använda, förbättra och sprida med attribution.

🤝 Bidra

CivicAI är ett samhällsprojekt. Vi välkomnar bidrag från utvecklare, forskare, beslutsfattare och etiker. Se CONTRIBUTING.md för riktlinjer.

🧠 Kontakt

Byggt och initierat av Robin — meta-arkitekt med passion för transparens, agentdesign och samhällsnyttiga system.
