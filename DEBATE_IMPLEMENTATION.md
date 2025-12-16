# Live AI-Debatt Implementation

## Översikt

Live AI-Debatt är en **separat, fristående funktion** integrerad i /7B-Zero med **queue-based, event-driven arkitektur** för maximal realtidsupplevelse. 5 AI-modeller (GPT, Gemini, DeepSeek, Grok, ONESEEK) deltar som **fullständiga debattörer** där varje svar processas och streamas omedelbart när det anländer.

**NY ARKITEKTUR (Queue-based Real-time Flow)**:
- 🔄 **Köbaserad processing**: Svar processas i ankomstordning, inga batch-dumps
- 📡 **Full streaming**: Token-by-token streaming av alla svar och analyser (~65 tokens/sek)
- 🧠 **OneSeek som aktiv deltagare**: Analyserar varje svar + ger sitt eget fullständiga debattsvar
- 💡 **Live insikter**: "Sport-commentator" stil updates för varje svar
- 📚 **Kunskapskedja**: OneSeek bygger progressiv förståelse genom hela debatten
- 🎯 **Rundsammanfattningar**: 10 viktigaste lärdomarna efter varje runda

**VIKTIGT**: Debattflödet är **helt separat** från det normala query-flödet (Compare/Standard). Detta ger:
- **Full kontroll**: Debattlogik är oberoende och kan utvecklas fritt
- **Avancerade funktioner**: Röstning, rundhantering, confetti, streaming etc. utan att påverka standardflödet
- **Enklare underhåll**: Ändringar i debatt påverkar inte Compare eller Standard-läge
- **Bättre prestanda**: Dedikerat WebSocket-flöde för realtidsstreaming med köhantering

## Flöde

### 1. Initiering - Separat Flöde Aktiveras
- Användaren aktiverar **[Debatt]**-knappen bredvid Compare-knappen
- Frontend växlar till **debattläge** (helt separat från Standard/Compare)
- Frågan skickas via **dedikerad WebSocket** till `/ws/debate`
- Servern startar **separat debattflöde** med egen logik

### 2. Introduktion - OneSeek Startar Debatten
**NYTT**: OneSeek introducerar ämnet och välkomnar deltagarna:
- **Debattledare-personligheten laddas direkt** från `personality_catalog.json`
- OneSeek presenterar debattämnet: "Välkommen till debatten om [ämne]. Runda 1 börjar nu – här är frågan: [fråga]"
- Event: `debate_intro` med introduktionsmeddelandet

**Separat Flöde**: Debattlogiken använder:
- Egen WebSocket-endpoint (`/ws/debate`)
- Egen state-hantering (rounds, votes, winner)
- Egna meddelanden och events
- Ingen delad logik med Standard/Compare-lägen

### 3. Debattrundor (3 st) - QUEUE-BASED REAL-TIME FLOW

**UPPDATERAD ARKITEKTUR**: Varje svar processas omedelbart när det anländer med konversationella kommentarer!

#### Flöde per runda:

**Steg 1: Parallell insamling med kö**
- Fråga skickas till 4 externa AI:er (GPT, Gemini, DeepSeek, Grok) parallellt
- Varje svar läggs i kö **omedelbart** när det anländer
- Event: `{"type": "ai_response", "agent": "gpt", "message": "✅ GPT har svarat"}`

**Steg 2: OneSeek processerar varje köat svar i ordning**
För varje svar i kön:

a) **Echo (Streaming)**: OneSeek ekar svaret token-för-token
   - Event start: `{"type": "oneseek_echo_start", "agent": "gpt"}`
   - Streaming: `{"type": "oneseek_echo", "text": "...", "complete": false}`
   - Simulerar realistisk AI-hastighet (~65 tokens/sek)

b) **Direkt Kommentar (UPPDATERAD)**: OneSeek kommenterar konversationellt
   - Genererar konversationell kommentar (2-3 meningar)
   - Format: "Intressant poäng från GPT. Jag håller med om X, men vill tillägga Y..."
   - Event: `{"type": "oneseek_reasoning", "message": "Intressant poäng från GPT..."}`
   - Sparas i kunskapskedjan

c) **Live Insight**: En-raders "sport-commentator" uppdatering
   - Event: `{"type": "live_insight", "message": "💡 GPT fokuserar på ekonomi - 1/4 svar mottagna"}`

**Steg 3: OneSeeks eget starka debattsvar (Streaming)**
Efter alla externa svar processats:
- OneSeek genererar sitt EGET starka, personliga debattsvar (400-600 ord)
- **TAR TYDLIG STÄLLNING** och bemöter andras argument direkt
- Event start: `{"type": "oneseek_own_answer_start"}`
- Streaming: `{"type": "oneseek_own_answer", "text": "...", "complete": false}`
- Reasoning: `{"type": "oneseek_own_reasoning", "message": "Min tankekedja..."}`
- **AVSLUTAR MED FRÅGA** (om inte sista rundan): "Vad säger ni andra i nästa runda – håller ni med mig eller ser ni det annorlunda?"
- **OneSeek är fullständig debattdeltagare**, inte bara domare!

**Steg 4: Rundsammanfattning**
- OneSeek komprimerar rundan: 10 viktigaste lärdomarna
- Event: `{"type": "round_summary", "data": {"summary": "1. ...\n2. ...\n10. ..."}}`

**Steg 5: Runda avslutas**
- Event: `{"type": "round_end", "round": 1}`
- Kort paus (1s) innan nästa runda

### 4. Röstning (UPPDATERAD)
**OneSeek inleder röstningen**:
- Event: `{"type": "voting_intro", "message": "Debatten är avslutad efter tre rundor. Nu går vi till röstning! Jag ber alla modeller (inklusive mig själv) att rösta på det bästa svaret i hela debatten – men INTE sitt eget. Ge också en kort motivering."}`

**Rösterna kommer in med motiveringar**:
- Alla 5 AI:er röstar på bästa svaret **med kort motivering**
- **Regel**: Ingen får rösta på sig själv
- **ONESEEK**: Agerar som neutral domare och röstar objektivt
- **Live streaming**: Varje röst visas när den kommer in
- Format: `{"type": "vote_received", "voter": "gpt", "voted_for": "claude", "message": "GPT röstar på Claude – motivering: mest nyanserat."}`

### 5. Vinnare (UPPDATERAD)
- AI:n med flest röster vinner
- **OneSeek räknar rösterna och korar vinnare**
- Vinnaren annonseras live med röstresultat
- **Confetti-effekt** visas i UI:t i 5 sekunder
- Event: `{"type": "winner", "message": "🏆 Vinnare: GPT med 3 röster!", "data": {"winner": "gpt", "votes": 3, "all_votes": {...}}}`

### 6. Avslutande Kommentar (UPPDATERAD)
- ONESEEK ger avslutande kommentar om debatten:
  1. Tackar för en fantastisk debatt
  2. Sammanfattar kortfattat vad debatten handlade om
  3. Förklarar varför vinnaren vann
  4. Ger en insikt om vad vi lärt oss
- Event: `{"type": "debate_complete", "data": {"summary": "Tack för en fantastisk debatt! Vinnaren är [modell] med X röster..."}}`

## API-Endpoints

### WebSocket: `/ws/debate`

**Request:**
```json
{
  "question": "[debatt] Ska Sverige bygga nya kärnkraftverk?"
}
```

**Response Events (Queue-based Real-time Architecture):**

### Initialization Events

1. **thinking** - Progress updates
```json
{
  "type": "thinking",
  "message": "[tänker...] Startar debattarena..."
}
```

2. **debate_init** - Debate initialization
```json
{
  "type": "debate_init",
  "message": "🎤 Debattarena redo! Debattledaren välkomnar alla deltagare.",
  "data": {
    "agents": ["gpt", "gemini", "deepseek", "grok", "oneseek"],
    "rounds": 3,
    "question": "Ska Sverige bygga nya kärnkraftverk?",
    "personality": "Debattledaren"
  }
}
```

3. **debate_intro** - OneSeek introduces the topic (NEW)
```json
{
  "type": "debate_intro",
  "message": "Välkommen till debatten om kärnkraft. Runda 1 börjar nu – här är frågan: Ska Sverige bygga nya kärnkraftverk?",
  "data": {
    "question": "Ska Sverige bygga nya kärnkraftverk?",
    "round": 1
  }
}
```

3. **round_start** - Round begins
```json
{
  "type": "round_start",
  "round": 1,
  "message": "🎯 Runda 1 startar..."
}
```

### NEW: Queue-based Processing Events

4. **ai_response** - External AI answer arrived and queued
```json
{
  "type": "ai_response",
  "round": 1,
  "agent": "gpt",
  "message": "✅ GPT har svarat",
  "data": {
    "agent": "gpt",
    "success": true
  }
}
```

5. **oneseek_echo_start** - OneSeek starts echoing an answer
```json
{
  "type": "oneseek_echo_start",
  "round": 1,
  "agent": "gpt",
  "message": "🔄 OneSeek ekar GPTs svar..."
}
```

6. **oneseek_echo** - Token stream of echoed answer (~65 tokens/sec)
```json
{
  "type": "oneseek_echo",
  "text": "Kärnkraft ger stabil elförsörjning och är viktig för...",
  "complete": false,
  "agent": "gpt",
  "round": 1
}
```

7. **oneseek_reasoning** - OneSeek's focused analysis of specific answer
```json
{
  "type": "oneseek_reasoning",
  "round": 1,
  "agent": "gpt",
  "message": "GPT lyfter ekonomiska aspekter och elförsörjning som huvudargument. Styrka: konkreta exempel. Saknar miljöperspektiv.",
  "data": {
    "reasoning": "GPT lyfter ekonomiska aspekter...",
    "agent_analyzed": "gpt"
  }
}
```

8. **live_insight** - One-liner "sport-commentator" update
```json
{
  "type": "live_insight",
  "round": 1,
  "agent": "gpt",
  "message": "💡 GPT fokuserar på ekonomi, teknologi - 1/4 svar mottagna",
  "data": {
    "progress": "1/4"
  }
}
```

### NEW: OneSeek's Own Answer Events

9. **oneseek_own_answer_start** - OneSeek starts its own comprehensive answer
```json
{
  "type": "oneseek_own_answer_start",
  "round": 1,
  "message": "🤖 ONESEEK ger sitt debattsvar..."
}
```

10. **oneseek_own_answer** - Token stream of OneSeek's own answer
```json
{
  "type": "oneseek_own_answer",
  "text": "För att besvara frågan om kärnkraft måste vi analysera flera dimensioner...",
  "complete": false,
  "agent": "oneseek",
  "round": 1
}
```

11. **oneseek_own_reasoning** - OneSeek's reasoning for its own answer
```json
{
  "type": "oneseek_own_reasoning",
  "round": 1,
  "message": "Jag identifierar tre huvuddimensioner: ekonomi, miljö och samhälle. Andra AI:er fokuserar på ekonomi, jag täcker alla aspekter.",
  "data": {
    "reasoning": "Jag identifierar tre huvuddimensioner..."
  }
}
```

### NEW: Round Summary Event

12. **round_summary** - Compressed learnings from round (10 key points)
```json
{
  "type": "round_summary",
  "round": 1,
  "message": "📚 Lärdomar från runda 1",
  "data": {
    "summary": "1. Ekonomiska aspekter dominerar argumenten\n2. Miljöfrågor nämns av 3/5 AI:er\n3. Teknisk genomförbarhet diskuteras\n...\n10. Långsiktig planering betonas",
    "round": 1
  }
}
```

13. **round_end** - Round complete
```json
{
  "type": "round_end",
  "round": 1,
  "message": "✅ Runda 1 avslutad"
}
```

### Voting & Winner Events

14. **voting_intro** - OneSeek introduces voting phase (NEW)
```json
{
  "type": "voting_intro",
  "message": "Debatten är avslutad efter tre rundor. Nu går vi till röstning! Jag ber alla modeller (inklusive mig själv) att rösta på det bästa svaret i hela debatten – men INTE sitt eget. Ge också en kort motivering."
}
```

15. **vote_received** - Individual vote with motivation (NEW)
```json
{
  "type": "vote_received",
  "voter": "gpt",
  "voted_for": "claude",
  "message": "GPT röstar på Claude – motivering: mest nyanserat."
}
```

16. **winner** - Winner announcement (UPDATED with live streaming)
```json
{
  "type": "winner",
  "message": "🏆 Vinnare: GPT med 3 röster!",
  "data": {
    "winner": "gpt",
    "votes": 3,
    "all_votes": {"gpt": 3, "gemini": 1, "deepseek": 1},
    "vote_results": [
      {"voter": "gemini", "voted_for": "gpt", "motivation": "mest nyanserat"},
      {"voter": "deepseek", "voted_for": "gpt", "motivation": "starkast argumentation"},
      ...
    ]
  }
}
```

16. **debate_complete** - Final combined event with all results
```json
{
  "type": "debate_complete",
  "message": "Debatt avslutad!",
  "data": {
    "question": "Ska Sverige bygga nya kärnkraftverk?",
    "rounds": 3,
    "winner": "gpt",
    "winner_votes": 3,
    "total_votes": 5,
    "vote_results": [...],
    "all_votes": {...},
    "summary": "Debatten handlade om kärnkraft. GPT vann..."
  }
}
```

17. **error** - Error occurred
```json
{
  "type": "error",
  "message": "Felmeddelande här"
}
```

## Architecture Comparison

### OLD Architecture (Pre-Queue)
```
External APIs → Wait for ALL → Batch Process → Send grouped round_complete → Show all at once
                                 ↓
                            OneSeek synthesis → Add to batch
```
❌ **Problems:**
- No live activity during gathering phase
- Batch dumps feel slow/unresponsive
- OneSeek not visible as active participant
- No progressive knowledge building

### NEW Architecture (Queue-based Real-time)
```
External APIs → Queue immediately on arrival → Process in order → Stream live
                         ↓                           ↓
                    Event: ai_response         OneSeek Pipeline:
                                                1. Echo (streaming)
                                                2. Reasoning
                                                3. Insight
                                                     ↓
                                               Next queued answer
                                                     ↓
                                           All done → OneSeek own answer (streaming)
                                                     ↓
                                           Round summary (10 points)
```
✅ **Benefits:**
- Constant live activity - no waiting
- Token-by-token streaming feels responsive
- OneSeek visible as active analyzer AND full debater
- Progressive knowledge chain building
- Real-time insights keep users engaged
- Round compression aids comprehension

## Personlighetskonfiguration

### `personality_catalog.json`
```json
{
  "oneseek-debattledare": {
    "card_file": "frontend/public/characters/OneSeek-Debattledare.yaml",
    "name": "Debattledaren",
    "keywords": ["debatt", "debattera", "diskutera", "diskussion", "argumentera", "åsikter", "perspektiv", "för och emot", "borde", "ska vi", "vad tycker", "olika syn", "jämföra"],
    "categories": ["debatt", "diskussion", "analys"],
    "description": "Sveriges mest erfarna och objektiva debattmoderator - leder AI-debatter med expertis",
    "prompt": "Du är Debattledaren – Sveriges mest erfarna och objektiva debattmoderator..."
  }
}
```

### `OneSeek-Debattledare.yaml`
Innehåller:
- `char_name`: "Debattledare"
- `char_persona`: Roll och regler
- `char_keywords`: Triggerord för automatiskt val
- `char_categories`: Kategorier
- Exempel på debattflöde

## Frontend-integration

### State Management
```javascript
const [debateMode, setDebateMode] = useState(false);
const [debateData, setDebateData] = useState(null);
const [showConfetti, setShowConfetti] = useState(false);
```

### Debatt-knapp
```javascript
<button
  onClick={() => {
    setDebateMode(prev => !prev);
    if (compareMode) setCompareMode(false);
  }}
>
  {debateMode ? '🎤 Debatt ON' : '🎤 Debatt OFF'}
</button>
```

### WebSocket-hantering
```javascript
const startLiveDebate = async (question, aiMessageId) => {
  const ws = new WebSocket('ws://localhost:5000/ws/debate');
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'winner':
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        break;
      // ... hantera andra events
    }
  };
};
```

### Confetti-effekt
```css
.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall 3s linear infinite;
}

@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

## Felhantering

### Externa API-fel
- Om en extern AI inte svarar: `success: false` + felmeddelande
- Debatten fortsätter med de AI:er som svarade
- Minst 3 AI:er (inkl. ONESEEK) krävs för giltig debatt

### WebSocket-fel
- Frontend visar felmeddelande
- Automatisk återanslutning (ej implementerat än)
- Fallback till REST API (ej implementerat än)

### Timeout-hantering
- Varje AI-svar har 60s timeout
- Om timeout: markeras som misslyckad + fortsätt med nästa

## Exempelfrågor

1. **Kärnkraft**: "Ska Sverige bygga nya kärnkraftverk?"
2. **Klimat**: "Är elektriska bilar bättre för miljön än bensinbilar?"
3. **AI**: "Ska AI-genererat innehåll vara märkt som AI-skapat?"
4. **Politik**: "Borde Sverige gå med i NATO?" *(redan gjort)*
5. **Ekonomi**: "Är grundinkomst en bra idé för Sverige?"

## Testning

### Manuell testning
1. Starta backend: `cd ml_service && python server.py`
2. Starta frontend: `cd frontend && npm run dev`
3. Gå till /7B-Zero
4. Aktivera [Debatt]-knappen
5. Ställ en debattfråga (se exempel ovan)
6. Observera live-streaming av rundor
7. Verifiera confetti vid vinnarannonsering
8. Kontrollera sammanfattning

### Enhetstest
```bash
# Backend WebSocket-test
cd ml_service
pytest tests/test_debate_websocket.py

# Frontend-test (TODO)
cd frontend
npm test
```

## Kända begränsningar

1. **Röstning är förenklad**: Använder randomiserad röstning för externa AI:er istället för att faktiskt låta dem analysera och rösta
2. **Ingen databaspersistens**: Debatter sparas endast i minnet under sessionen
3. **Ingen historik**: Ingen visning av tidigare debatter (kan läggas till i framtiden)
4. **Begränsat felåterställning**: WebSocket-fel kräver manuell omstart

## Framtida förbättringar

1. **Intelligent röstning**: Låt externa AI:er faktiskt analysera och rösta smart
2. **Databaspersistens**: Spara debatter i Firebase
3. **Historik**: Visa tidigare debatter i UI
4. **Debatt-arkiv**: Sökbar databas med alla debatter
5. **Fler AI-modeller**: Lägg till Claude, LLaMA 3, etc.
6. **Anpassningsbara regler**: Konfigurera antal rundor, deltagare, etc.
7. **Publikröstning**: Låt användare också rösta
8. **Videouppspelning**: Återspela debatt som animation

## Teknisk stack

- **Backend**: FastAPI (Python) + WebSocket
- **Frontend**: React + WebSocket API
- **AI-modeller**: 
  - GPT (OpenAI)
  - Gemini (Google)
  - DeepSeek (DeepSeek)
  - Grok (X.AI)
  - ONESEEK (lokal llama-server)
- **Styling**: TailwindCSS + custom CSS animations
- **Personligheter**: YAML-baserade cards + JSON-katalog

## Support och felsökning

### Problem: WebSocket ansluter inte
**Lösning**: Kontrollera att ml_service körs på port 5000

### Problem: Ingen personlighet väljs
**Lösning**: Verifiera att "debatt" finns i frågan eller använd nyckelord från katalogen

### Problem: Externa AI:er svarar inte
**Lösning**: 
1. Kontrollera API-nycklar i `.env`
2. Verifiera internetanslutning
3. Kontrollera API-kvotgränser

### Problem: Confetti visas inte
**Lösning**: Kontrollera att `showConfetti` state sätts till `true` vid winner-event

## Licens

Copyright © 2025 CivicAI - OneSeek Project
