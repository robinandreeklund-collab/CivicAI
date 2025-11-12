# CivicAI MVP - Utvecklingsguide

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

**Obs:** För MVP-demo fungerar applikationen även utan API-nycklar (visar simulerade svar).

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
civicai/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── QuestionInput.jsx    # Frågeruta
│   │   │   ├── AgentBubble.jsx      # AI-svarsbubblor
│   │   │   └── ExportPanel.jsx      # YAML-export
│   │   ├── styles/
│   │   │   └── index.css            # Tailwind + mörkt tema
│   │   ├── App.jsx                  # Huvudkomponent
│   │   └── main.jsx                 # Entry point
│   └── package.json
│
├── backend/           # Node.js + Express
│   ├── api/
│   │   └── query_dispatcher.js      # API endpoint
│   ├── services/
│   │   ├── openai.js                # GPT-3.5 integration
│   │   └── gemini.js                # Gemini integration
│   ├── index.js                     # Server setup
│   └── package.json
│
└── package.json       # Root scripts
```

## ✨ MVP-funktioner

### 1. Frågeruta + Agentbubblor ✅
- QuestionInput-komponent tar emot användarfrågor
- AgentBubble-komponenter visar svar från olika AI-modeller
- Färgkodning och metadata per agent

### 2. Backend-API ✅
- `/api/query` endpoint för att skicka frågor
- Parallella anrop till GPT-3.5 och Gemini
- Felhantering och simulerade svar vid saknade API-nycklar

### 3. YAML-export ✅
- ExportPanel-komponent
- js-yaml bibliotek för konvertering
- Ladda ner jämförelser som YAML-filer

### 4. Mörkt tema ✅
- Tailwind CSS med custom dark theme
- Civic-färgschema
- Responsiv design

## 🔧 Utveckling

### Frontend
- React 18 med hooks
- Vite för snabb utveckling
- Tailwind CSS för styling
- js-yaml för export

### Backend
- Express.js server
- OpenAI SDK för GPT-3.5
- Google Generative AI för Gemini
- CORS-aktiverat för lokal utveckling

## 📝 Nästa steg (Post-MVP)

- [ ] Ton- och stilanalys
- [ ] Biasindikatorer
- [ ] Faktakoll via webbsök
- [ ] Agentprofiler
- [ ] Battle mode
- [ ] Audit trail
- [ ] Firebase-integration
- [ ] PDF-export

## 🤝 Bidra

Se huvudfilen README.md för projektbeskrivning och CONTRIBUTING.md för riktlinjer.

## 📜 Licens

MIT - Se LICENSE filen för detaljer.
