# OneSeek.AI - Utvecklingsguide

## 🚀 Kom igång

### Installation

1. Installera alla beroenden:
```bash
npm run install:all
```

Eller installera separat:
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Konfiguration

1. Kopiera `.env.example` till `.env` i backend-mappen:
```bash
cp backend/.env.example backend/.env
```

2. Lägg till dina API-nycklar i `backend/.env`:
```
OPENAI_API_KEY=din_openai_nyckel
GEMINI_API_KEY=din_gemini_nyckel
```

**Obs:** Applikationen fungerar även utan API-nycklar (visar simulerade svar).

### Köra applikationen

**Alternativ 1: Kör båda samtidigt (rekommenderat)**
```bash
npm run dev
```

**Alternativ 2: Kör separat**

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

Applikationen öppnas på:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## 📁 Projektstruktur

```
oneseek-ai/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── QuestionInput.jsx         # Frågeruta
│   │   │   ├── AgentBubble.jsx           # AI-svarsbubblor med Fas 2-analys
│   │   │   ├── ToneIndicator.jsx         # ✨ Ton- och stilindikator
│   │   │   ├── BiasIndicator.jsx         # ✨ Biasindikator
│   │   │   ├── FactCheckIndicator.jsx    # ✨ Faktakontrollindikator
│   │   │   ├── AgentProfileCard.jsx      # ✨ Agentprofilkort
│   │   │   ├── ExportPanel.jsx           # YAML/JSON-export
│   │   │   ├── Sidebar.jsx               # Konversationshistorik
│   │   │   ├── AIServiceToggle.jsx       # AI-tjänsteväljare
│   │   │   └── ModernLoader.jsx          # Laddningsanimation
│   │   ├── styles/
│   │   │   └── index.css                 # Tailwind + mörkt tema
│   │   ├── App.jsx                       # Huvudkomponent
│   │   └── main.jsx                      # Entry point
│   └── package.json
│
├── backend/           # Node.js + Express
│   ├── api/
│   │   └── query_dispatcher.js           # API endpoint med analysintegration
│   ├── services/
│   │   ├── openai.js                     # GPT-3.5 integration
│   │   └── gemini.js                     # Gemini integration
│   ├── utils/                            # ✨ Fas 2-analysverktyg
│   │   ├── analyzeTone.js                # Tonanalys
│   │   ├── detectBias.js                 # Biasdetektion
│   │   └── checkFacts.js                 # Faktakontroll
│   ├── index.js                          # Server setup
│   └── package.json
│
└── package.json       # Root scripts
```

## ✨ Implementerade funktioner

### Fas 1: MVP ✅
- [x] QuestionInput-komponent tar emot användarfrågor
- [x] AgentBubble-komponenter visar svar från olika AI-modeller
- [x] Backend-API med `/api/query` endpoint
- [x] Parallella anrop till GPT-3.5 och Gemini
- [x] YAML och JSON export
- [x] Mörkt tema med Tailwind CSS
- [x] Sidebar med konversationshistorik
- [x] AI-tjänsteväljare

### Fas 2: Analys & insyn ✅
- [x] **Tonanalys**: Identifierar formell, informell, teknisk, empatisk, analytisk eller övertygande ton
- [x] **Biasdetektion**: Upptäcker politisk, kommersiell, kulturell, bekräftelse- och recency bias
- [x] **Faktakontroll**: Identifierar verifierbara påståenden (statistiska, vetenskapliga, historiska)
- [x] **Agentprofiler**: Visar styrkor, svagheter och karakteristika för varje AI-modell
- [x] Komplett integration i backend och frontend
- [x] Visuella indikatorer för analys i användargränssnittet

## 🔧 Utveckling

### Frontend
- React 18 med hooks
- Vite för snabb utveckling
- Tailwind CSS för styling
- js-yaml för YAML-export

### Backend
- Express.js server
- OpenAI SDK för GPT-3.5
- Google Generative AI för Gemini
- CORS-aktiverat för lokal utveckling
- Custom analysverktyg för Fas 2-funktioner

### Linting och byggning
```bash
# Lint frontend
cd frontend && npm run lint

# Bygg frontend
npm run build

# Testa backend-syntax
cd backend && node -c index.js
```

## 📝 Nästa steg (Post-Fas 2)

### Fas 3: Beslutsstöd
- [ ] Battle mode - Rösta på bästa svar
- [ ] Audit trail - Historik över beslut
- [ ] Policyfrågebank
- [ ] PDF-export

### Fas 4: Skalbarhet & öppenhet
- [ ] Firebase-integration för datapersistens
- [ ] API för externa appar
- [ ] Crowdsourcing av feedback
- [ ] Offentlig portal för medborgare
- [ ] Fler AI-modeller via Together.ai eller HuggingFace

## 🤝 Bidra

Se huvudfilen README.md för projektbeskrivning och CONTRIBUTING.md för riktlinjer.

## 📜 Licens

MIT - Se LICENSE filen för detaljer.
