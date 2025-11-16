# Konsensus Live Debatt - Funktionsbeskrivning

## Översikt

Konsensus Live Debatt är en avancerad funktion i CivicAI-plattformen som automatiskt triggas när AI-modellernas svar visar hög divergens. Funktionen låter AI-agenterna själva debattera sina perspektiv och rösta fram det bästa svaret.

## Funktionsflöde

### 1. Trigga Debatt

Debatten startar automatiskt när:
- **Låg konsensus**: Övergripande konsensus < 60%
- **Hög divergens**: 2 eller fler skillnader med hög svårighetsgrad

```javascript
// Backend kontrollerar automatiskt i query_dispatcher.js
const debateTrigger = shouldTriggerDebate(modelSynthesis);
```

### 2. Debattens Faser

#### Fas 1: Initiering
- Max 5 AI-agenter deltar (GPT-3.5, Gemini, DeepSeek, Grok, Qwen)
- Initial divergensanalys visas
- Debatt-kort skapas i UI

#### Fas 2: Debattrundor (Max 5 rundor)
- Varje agent får 5 rundor att presentera sitt perspektiv
- Agenter svarar på tidigare argument
- Rundorna visas i realtid i UI med agent-namn och tidsstämpel

#### Fas 3: Röstning
- Efter sista runda: Automatisk övergång till röstning
- Varje agent röstar på bästa svaret (får INTE rösta på sig själv)
- AI genererar motivering för sin röst

#### Fas 4: Vinnare
- Agent med flest röster vinner
- Röstfördelning visas med diagram
- Motiveringar från alla agenter visas

## API-Endpoints

### Backend (Node.js)

```javascript
// Kontrollera om debatt ska triggas
POST /api/debate/check-trigger
Body: { modelSynthesis }
Response: { shouldTrigger: boolean, reason: string }

// Starta debatt
POST /api/debate/initiate
Body: { questionId, question, agents, initialResponses, modelSynthesis }
Response: Debate object

// Genomför nästa runda
POST /api/debate/:debateId/round
Response: Updated debate with new round

// Genomför röstning
POST /api/debate/:debateId/vote
Response: Updated debate with votes and winner

// Hämta debatt
GET /api/debate/:debateId
Response: Debate object

// Hämta alla debatter (eller filtrera per fråga)
GET /api/debate?questionId=xxx
Response: { debates: [], total: number }

// Hämta konfiguration
GET /api/debate/config
Response: { maxAgents: 5, maxRoundsPerAgent: 5, divergenceThreshold: 60, ... }
```

## Frontend-Komponenter

### ConsensusDebateCard
Huvudkomponent för debattvisualisering:
- Auto-initierar debatt när hög divergens detekteras
- Visar deltagare, divergens-sammanfattning
- Knappar för att genomföra rundor och röstning
- Laddningsindikatorer och felhantering

```jsx
<ConsensusDebateCard
  questionId={questionId}
  question={question}
  modelSynthesis={modelSynthesis}
  responses={responses}
  onDebateComplete={(debate) => console.log('Debate complete', debate)}
/>
```

### DebateRoundDisplay
Visar en enskild debattrunda:
- Runda-nummer och tidsstämpel
- Svar från alla deltagande agenter
- Felhantering om agent inte svarar

### DebateVotingPanel
Visar röstningsresultat:
- Vinnare med antal röster
- Röstfördelning med progress bars
- Individuella röster med motiveringar
- Visuell markering av vinnande svar

## Integration med Timeline

Debatten visas i TimelineNavigator som ett eget avsnitt:
- **Ikon**: 🎯 Konsensus Live Debatt
- **Metadata**: Konsensus %, Antal skillnader
- **Position**: Under "Modellsyntes" i Analyser-sektionen

## Konfiguration

Standardvärden (kan justeras i `backend/services/consensusDebate.js`):

```javascript
const DEBATE_CONFIG = {
  maxAgents: 5,              // Max antal AI-agenter
  maxRoundsPerAgent: 5,      // Max rundor per agent
  divergenceThreshold: 60,   // Konsensus-tröskelvärde (%)
  severityThreshold: 2,      // Antal högseveritets-skillnader
};
```

## Säkerhet och Audit

All debatt-aktivitet loggas automatiskt:
- `debate_initiated` - När debatt startar
- `debate_round_completed` - Efter varje runda
- `debate_voting_completed` - När röstning är klar

Audit-loggar inkluderar:
- Debatt-ID
- Deltagande agenter
- Anledning (konsensus-värde)
- Tidsstämplar

## Användningsexempel

### Scenario: Politisk fråga med hög divergens

**Fråga**: "Vad är de viktigaste utmaningarna för Sveriges klimatpolitik?"

**Resultat**:
- GPT-3.5: Fokus på transport och industri
- Gemini: Betonar EU-samarbete
- DeepSeek: Teknologiska lösningar
- Konsensus: 45% → Debatt triggas!

**Debattflöde**:
1. **Runda 1**: Agenter presenterar initiala positioner
2. **Runda 2**: Agenter svarar på varandras argument
3. **Runda 3**: Fördjupning och specificering
4. **Runda 4**: Konsensus-sökande
5. **Runda 5**: Sammanfattning av position

**Röstning**:
- Gemini → DeepSeek (teknologiskt fokus + EU-samarbete)
- GPT-3.5 → Gemini (balanserat perspektiv)
- DeepSeek → Gemini (holistiskt tillvägagångssätt)

**Vinnare**: Gemini med 2 röster

## Best Practices

### UI/UX
✅ Visa tydlig indikator när debatt pågår (pulsande ikon)
✅ Använd smooth animationer vid rundbyten
✅ Visa progress för antal genomförda rundor
✅ Tydlig visuell separation mellan rundor
✅ Highlighta vinnande svar

### Prestanda
✅ Genomför rundor sekventiellt (inte parallellt) för läsbarhet
✅ Använd debouncing för API-anrop
✅ Cacha debatt-resultat i frontend
✅ Begränsa antal parallella AI-anrop

### Felhantering
✅ Hantera timeout för AI-anrop
✅ Visa felmeddelanden tydligt
✅ Tillåt manuell omstart av debatt
✅ Logga alla fel för debugging

## Framtida Förbättringar

### Fas 1 (Planerat)
- [ ] Användare kan välja vilka agenter som deltar
- [ ] Justera antal rundor dynamiskt baserat på konsensus-förbättring
- [ ] Real-time streaming av debattsvar

### Fas 2 (Framtida)
- [ ] Visualisering av argument-träd
- [ ] Sentiment-analys av debatt-ton
- [ ] Export av debatt till PDF/rapport
- [ ] Jämförelse mellan flera debatter över tid

### Fas 3 (Långsiktig)
- [ ] Användar-röstning parallellt med AI-röstning
- [ ] Machine learning för att förutsäga debatt-vinnare
- [ ] Multi-språkstöd för debatter
- [ ] Integration med externa expertpaneler

## Teknisk Arkitektur

```
Frontend (React)
    ↓
ConsensusDebateCard.jsx
    ↓
    ├─→ POST /api/debate/initiate
    ├─→ POST /api/debate/:id/round (x5)
    └─→ POST /api/debate/:id/vote
         ↓
    Backend API (Express)
         ↓
    consensusDebate.js Service
         ↓
    ├─→ shouldTriggerDebate()
    ├─→ initiateDebate()
    ├─→ conductDebateRound()
    │    ├─→ getOpenAIResponse()
    │    ├─→ getGeminiResponse()
    │    └─→ getDeepSeekResponse()
    └─→ conductDebateVoting()
         ↓
    Audit Trail Logging
```

## Troubleshooting

### Problem: Debatt startar inte
**Lösning**: Kontrollera att `debateTrigger` är `true` i API-svaret och att konsensus < 60%

### Problem: Agent svarar inte i runda
**Lösning**: Kontrollera API-nycklar och nätverksanslutning. Fel visas i UI.

### Problem: Röstning fastnar
**Lösning**: Kontrollera att alla agenter har giltiga svar i sista rundan. Röstning kräver minst 2 agenter.

### Problem: Ingen giltig röst
**Lösning**: AI:ns röst parsas från text. Kontrollera att prompt-formatet följs korrekt i `createVotingPrompt()`.

## Support

För frågor eller bugrapporter, kontakta utvecklingsteamet eller öppna en issue på GitHub.

## Licens

MIT - Fri att använda och modifiera med attribution.
