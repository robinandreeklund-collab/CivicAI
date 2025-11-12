# 🧭 CivicAI

**Beslut med insyn. AI med ansvar.**

CivicAI är en öppen plattform för att jämföra hur olika AI-modeller svarar på samma fråga. Genom att synliggöra skillnader i fakta, ton, bias och källor hjälper CivicAI beslutsfattare att fatta mer informerade och transparenta beslut.

---

## 🎨 Chat-Interface som Copilot & Grok

![CivicAI Chat Interface](https://github.com/user-attachments/assets/8e587888-c1be-42ec-a844-49171f3a1899)
*Ren chat-interface med integrerad frågeruta precis som Copilot och Grok*

![CivicAI Chat with Responses](https://github.com/user-attachments/assets/f5d01c85-69da-4f77-83a1-b9b62d0f31b6)
*AI-svar i chat-bubblor med kompakta export-ikoner i headern*

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
