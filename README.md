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
- 🧠 **DeepSeek**: Teknisk precision och datadriven analys
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
   
   # DeepSeek Configuration
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   
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

**OpenAI API:**
- Använder modell: `gpt-3.5-turbo`
- Hämta API-nyckel från: [OpenAI Platform](https://platform.openai.com/api-keys)
- **Obs:** Kontrollera att du har tillgänglig kredit och inte har överskridit din kvot

**Gemini API:**
- Använder modell: `gemini-2.5-flash`
- Hämta API-nyckel från: [Google AI Studio](https://aistudio.google.com/app/apikey)

**DeepSeek API:**
- Använder modell: `deepseek-chat`
- Hämta API-nyckel från: [DeepSeek Platform](https://platform.deepseek.com/)

**Vanliga fel:**
- `404 Not Found` (Gemini): Modellnamnet är inkorrekt eller inaktuellt. Använd `gemini-2.5-flash` eller `gemini-1.5-pro`.
- `429 Quota Exceeded` (OpenAI): Du har överskridit din API-kvot. Kontrollera ditt konto och faktureringsdetaljer.
- `401 Unauthorized`: API-nyckeln är ogiltig eller felaktig.

**OBS:** Utan konfigurerade API-nycklar kommer applikationen att fungera med simulerade svar för demonstration.

## ✨ Funktioner

### Implementerade funktioner (Fas 1 & 2) ✅

#### 🔄 Multi-agent svarsspegel
Ställ samma fråga till flera AI-modeller samtidigt och jämför deras svar i realtid. Stöd för GPT-3.5, Gemini och DeepSeek med möjlighet att välja vilka modeller som ska inkluderas.

#### 🧠 Ton- och stilanalys
Varje AI-svar analyseras automatiskt för:
- **Primär ton**: Formell, informell, teknisk, empatisk, analytisk eller övertygande
- **Sekundära karakteristika**: Ytterligare tondrag som identifierats i texten
- **Konfidensnivå**: Hur säker analysen är på resultatet

#### 🧭 Biasdetektion
Identifierar och markerar potentiella bias i AI-svar:
- **Politisk bias**: Vänster- eller högerorienterade formuleringar
- **Kommersiell bias**: Produktrekommendationer eller marknadsföring
- **Kulturell bias**: Västerländska eller icke-västerländska perspektiv
- **Bekräftelsebias**: Påståenden presenterade som självklara sanningar
- **Recency bias**: Överfokus på nyhet över relevans

Varje identifierad bias får en svårighetsgrad (låg, medel, hög) och detaljerad beskrivning.

#### 🔍 Faktakoll
Identifierar verifierbara påståenden i AI-svar som bör kontrolleras:
- **Statistiska påståenden**: Procentsatser och numerisk data
- **Tidsbundna påståenden**: Referenser till specifika år eller perioder
- **Vetenskapliga påståenden**: Hänvisningar till forskning eller studier
- **Historiska påståenden**: Historiska fakta och händelser
- **Definitiva påståenden**: Absoluta utsagor som kräver verifiering

Systemet rekommenderar verifiering via externa källor när många påståenden identifieras.

#### 🧬 Agentprofiler
Varje AI-modell har en detaljerad profil som visar:
- **Styrkor och svagheter**: Vad modellen är bra respektive mindre bra på
- **Karakteristika**: Kreativitet, precision, kontextförståelse, språkhantering
- **Beskrivning**: Information om leverantör och användningsområden

#### 📤 Export
Exportera konversationer och jämförelser till:
- **YAML**: Strukturerad data för vidare analys
- **JSON**: Kompatibel med andra verktyg och system

#### 💬 Grok-inspirerad UI
- **Sidebar**: Konversationshistorik med sök och navigering
- **AI-tjänsteväljare**: Aktivera/deaktivera specifika modeller före fråga
- **Moderna animationer**: Smooth transitions och fade-ins
- **Mörkt tema**: Professionell och ögonvänlig design

### Planerade funktioner (Fas 3 & 4)

🗳 Battle mode

📚 Audit trail för transparens

📤 Export till PDF och README-format

🌐 API för externa appar

👥 Crowdsourcing av feedback

## 🧩 Komponentöversikt

### Implementerade komponenter ✅

| Komponent | Status | Funktion |
|-----------|--------|----------|
| AgentBubble | ✅ | Visar AI-svar med agentnamn, metadata och komplett Fas 2-analys |
| BiasIndicator | ✅ | Visualiserar bias (politisk, kommersiell, kulturell) med svårighetsgrad |
| AgentProfileCard | ✅ | Visar AI-modellens styrkor, karakteristika och beskrivning |
| ToneIndicator | ✅ | Visar ton och stil för AI-svar med visuella badges |
| FactCheckIndicator | ✅ | Identifierar och listar verifierbara påståenden |
| ExportPanel | ✅ | Exporterar jämförelse till YAML och JSON |
| QuestionInput | ✅ | Frågeruta som triggar AI-anrop med stöd för Shift+Enter |
| Sidebar | ✅ | Konversationshistorik, ny konversation, export och kollapsbar design |
| AIServiceToggle | ✅ | Välj vilka AI-modeller som ska inkluderas i frågan |
| ModernLoader | ✅ | Animerad laddningsindikator för pågående AI-anrop |

### Planerade komponenter (Fas 3 & 4)

| Komponent | Status | Funktion |
|-----------|--------|----------|
| BattlePanel | 📋 | Låter användare rösta på bästa AI-svar |
| AuditTrailViewer | 📋 | Visar historik över frågor och exporthändelser |
| SettingsPanel | 📋 | Avancerade inställningar för AI-modeller och analysnivå |

### Backend-moduler ✅

| Modul | Status | Funktion |
|-------|--------|----------|
| query_dispatcher | ✅ | Skickar frågor till valda AI-modeller och returnerar svar med analys |
| analyzeTone | ✅ | Klassificerar ton (formell, teknisk, empatisk, etc.) |
| detectBias | ✅ | Identifierar bias i AI-svar via semantisk analys |
| checkFacts | ✅ | Markerar verifierbara påståenden för faktakontroll |
| generateSummary | ✅ | Skapar syntetiserad sammanfattning från alla AI-svar |
| openai service | ✅ | Integration med OpenAI GPT-3.5 |
| gemini service | ✅ | Integration med Google Gemini |
| deepseek service | ✅ | Integration med DeepSeek AI |

🚀 Utvecklingsfaser

🧪 Fas 1: MVP ✅ KLAR

✅ Frågeruta + agentbubblor

✅ API-anrop till GPT-3.5 och Gemini

✅ YAML-export

✅ Grundläggande UI med mörkt tema

✅ Sidebar med konversationshistorik

✅ AI-tjänsteväljare

🔍 Fas 2: Analys & insyn ✅ KLAR

✅ Ton- och stilanalys

✅ Biasindikatorer

✅ Faktakoll (identifiering av verifierbara påståenden)

✅ Agentprofiler

[ ] 🔧 Koppla på Firebase som databas (Planerad för framtida version)

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
