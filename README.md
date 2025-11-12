project:
  name: CivicAI
  tagline: "Beslut med insyn. AI med ansvar."
  description: >
    CivicAI är en öppen plattform för att jämföra hur olika AI-modeller svarar på samma fråga.
    Genom att synliggöra skillnader i fakta, ton, bias och källor hjälper CivicAI beslutsfattare
    att fatta mer informerade och transparenta beslut.

audience:
  - Kommunala och statliga beslutsfattare
  - Policyanalytiker och utredare
  - NGO:er och civilsamhällesorganisationer
  - Journalister och forskare
  - Etikråd och AI-granskare

tech_stack:
  frontend:
    framework: React
    bundler: Vite
    styling: Tailwind CSS
    state_management: Zustand
  backend:
    language: Node.js eller Python
    framework: FastAPI eller Express
  ai_integrations:
    - OpenAI (GPT-3.5)
    - Google Gemini
    - HuggingFace Inference API
    - Together.ai
  analysis_modules:
    - spaCy
    - TextBlob
    - GPT-3.5 som metagranskare
  export:
    - js-yaml
    - markdown-it
    - html2pdf
  database:
    current: none
    planned: Firebase (aktiveras efter MVP)

components:
  AgentBubble:
    description: >
      Visar ett AI-svar i en stiliserad bubbla med agentnamn, tonetikett och färgkodning.
      Kan innehålla metadata som tokenlängd, källor och biasindikator.
  BiasIndicator:
    description: >
      Visualiserar potentiell bias i ett AI-svar, t.ex. politisk lutning, kommersiell påverkan eller kulturell ton.
      Kan visas som färgprick, tooltip eller stapel.
  BattlePanel:
    description: >
      Låter användare jämföra AI-svar sida vid sida och rösta på det mest trovärdiga eller användbara.
      Används för intern deliberation eller teamdiskussion.
  AgentProfileCard:
    description: >
      Visar en sammanfattning av en AI-modells typiska stil, ton, källpreferens och biashistorik.
      Kan användas för att förstå varje agents “personlighet”.
  ExportPanel:
    description: >
      Låter användaren exportera jämförelsen till YAML, README eller PDF.
      Inkluderar metadata, analysresultat och agentprofiler.
  ComparisonPanel:
    description: >
      Huvudvyn där alla AI-svar visas parallellt med analys, biasindikatorer och faktakoll.
      Kan filtreras och sorteras efter ton, källor eller agent.
  QuestionInput:
    description: >
      Frågeruta där användaren skriver sin policyfråga eller prompt.
      Triggar `query_dispatcher` och visar svar i `ComparisonPanel`.
  ResponseAnalyzer:
    description: >
      Tar in AI-svar och kör tonanalys, biasdetektion och faktakoll.
      Returnerar strukturerad metadata till UI-komponenter.
  SettingsPanel:
    description: >
      Låter användaren välja vilka AI-modeller som ska användas, språk, exportformat och analysnivå.
      Kan kopplas till användarprofil via Firebase.
  AuditTrailViewer:
    description: >
      Visar historik över ställda frågor, svar, analyser och exporthändelser.
      Används för transparens och revision.

features:
  core:
    - Multi-agent svarsspegel
    - Ton- och stilanalys
    - Biasdetektion
    - Faktakoll mot webbkällor
    - Agentprofiler
    - Export till YAML, README, PDF
    - Audit trail för transparens
    - Battle mode för interna diskussioner

development_phases:
  phase_1:
    name: MVP
    status: active
    tasks:
      - Frågeruta + agentbubblor
      - API-anrop till GPT-3.5 och Gemini
      - YAML-export
      - Grundläggande UI med mörkt tema
  phase_2:
    name: Analys & insyn
    status: planned
    tasks:
      - Ton- och stilanalys
      - Biasindikatorer
      - Faktakoll via webbsök
      - Agentprofiler
      - 🔧 Koppla på Firebase som databas
  phase_3:
    name: Beslutsstöd
    status: planned
    tasks:
      - Battle mode
      - Audit trail
      - Policyfrågebank
      - Export till PDF/README
  phase_4:
    name: Skalbarhet & öppenhet
    status: future
    tasks:
      - API för externa appar
      - Crowdsourcing av feedback
      - Offentlig portal för medborgare
      - Fler AI-modeller via Together.ai eller HuggingFace

visual_identity:
  theme: "Mörkt tema med blå och grå accentfärger"
  logo_motif: "Skalvåg, prisma eller spegel"
  typography: "Serif för rubriker, sans-serif för brödtext"
  iconography:
    - Agent-avatarer
    - Biasindikatorer
    - Källsymboler

values:
  - Transparens
  - Ansvar
  - Mångfald av perspektiv
  - Etisk AI-användning
  - Beslutsstöd, inte beslutsersättning

license: MIT

contact:
  author: Robin
  github: https://github.com/robin
