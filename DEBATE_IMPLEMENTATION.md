# Live AI-Debatt Implementation

## Översikt

Live AI-Debatt är en **separat, fristående funktion** integrerad i /7B-Zero som låter användare starta live-debatter mellan 4 externa AI-modeller (GPT, Gemini, DeepSeek, Grok) plus ONESEEK som neutral domare.

**VIKTIGT**: Debattflödet är **helt separat** från det normala query-flödet (Compare/Standard). Detta ger:
- **Full kontroll**: Debattlogik är oberoende och kan utvecklas fritt
- **Avancerade funktioner**: Röstning, rundhantering, confetti etc. utan att påverka standardflödet
- **Enklare underhåll**: Ändringar i debatt påverkar inte Compare eller Standard-läge
- **Bättre prestanda**: Dedikerat WebSocket-flöde för realtidsstreaming

## Flöde

### 1. Initiering - Separat Flöde Aktiveras
- Användaren aktiverar **[Debatt]**-knappen bredvid Compare-knappen
- Frontend växlar till **debattläge** (helt separat från Standard/Compare)
- Frågan skickas via **dedikerad WebSocket** till `/ws/debate`
- Servern startar **separat debattflöde** med egen logik

### 2. Personlighet & Prompt - Automatisk Laddning
**VIKTIGT**: När Debatt-knappen trycks händer automatiskt:
1. **Debattledare-personligheten laddas direkt** från `personality_catalog.json`
2. **Debatt-specifik system prompt** aktiveras (neutral domare, objektiv)
3. **Personlighetskortet** (`OneSeek-Debattledare.yaml`) laddas automatiskt
4. Inget behov av automatisk nyckelordsanalys - knappen styr allt

**Separat Flöde**: Debattlogiken använder:
- Egen WebSocket-endpoint (`/ws/debate`)
- Egen state-hantering (rounds, votes, winner)
- Egna meddelanden och events
- Ingen delad logik med Standard/Compare-lägen

### 3. Debattrundor (3 st)
Varje runda:
1. Alla 5 AI:er får samma fråga + kontext från tidigare rundor
2. Svar hämtas parallellt från:
   - **GPT** (OpenAI API)
   - **Gemini** (Google Gemini API)
   - **DeepSeek** (DeepSeek API)
   - **Grok** (X.AI API)
   - **ONESEEK** (lokalt via llama-server)
3. Svar streamas live via WebSocket så fort de anländer
4. Format: `{"type": "response", "round": 1-3, "agent": "gpt|gemini|deepseek|grok|oneseek", "message": "..."}`

### 4. Röstning
Efter 3 rundor:
- Alla 5 AI:er röstar på bästa svaret
- **Regel**: Ingen får rösta på sig själv
- **ONESEEK**: Agerar som neutral domare och röstar objektivt
- Format: `{"type": "voting", "message": "🗳️ Röstning pågår..."}`

### 5. Vinnare
- AI:n med flest röster vinner
- Vinnaren annonseras live
- **Confetti-effekt** visas i UI:t i 5 sekunder
- Format: `{"type": "winner", "data": {"winner": "gpt", "votes": 3, "all_votes": {...}}}`

### 6. Sammanfattning
- ONESEEK skapar objektiv sammanfattning av debatten
- Förklarar varför vinnaren vann
- Format: `{"type": "summary", "message": "...", "data": {"summary": "..."}}`

## API-Endpoints

### WebSocket: `/ws/debate`

**Request:**
```json
{
  "question": "[debatt] Ska Sverige bygga nya kärnkraftverk?"
}
```

**Response Events:**

1. **thinking** - Tänksteg
```json
{
  "type": "thinking",
  "message": "[tänker...] Startar debattarena..."
}
```

2. **debate_init** - Initiering
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

3. **round_start** - Runda startar
```json
{
  "type": "round_start",
  "round": 1,
  "message": "🎯 Runda 1 startar..."
}
```

4. **response** - AI-svar (5x per runda)
```json
{
  "type": "response",
  "round": 1,
  "agent": "gpt",
  "message": "Kärnkraft ger stabil elförsörjning...",
  "data": {
    "model": "gpt-3.5-turbo",
    "success": true
  }
}
```

5. **round_end** - Runda avslutas
```json
{
  "type": "round_end",
  "round": 1,
  "message": "✅ Runda 1 avslutad"
}
```

6. **voting** - Röstning
```json
{
  "type": "voting",
  "message": "🗳️ Röstning pågår..."
}
```

7. **winner** - Vinnare utses
```json
{
  "type": "winner",
  "message": "🏆 Vinnare: GPT med 3 röster!",
  "data": {
    "winner": "gpt",
    "votes": 3,
    "all_votes": {"gpt": 3, "gemini": 1, "deepseek": 1},
    "vote_results": [
      {"voter": "gemini", "voted_for": "gpt"},
      {"voter": "deepseek", "voted_for": "gpt"},
      ...
    ]
  }
}
```

8. **summary** - Sammanfattning
```json
{
  "type": "summary",
  "message": "Debatten handlade om kärnkraft. GPT vann...",
  "data": {
    "summary": "Debatten handlade om kärnkraft. GPT vann med tydliga argument om elförsörjning..."
  }
}
```

9. **final** - Avslut
```json
{
  "type": "final",
  "message": "Debatt avslutad!",
  "data": {
    "question": "Ska Sverige bygga nya kärnkraftverk?",
    "rounds": 3,
    "winner": "gpt",
    "winner_votes": 3,
    "summary": "..."
  }
}
```

10. **error** - Fel
```json
{
  "type": "error",
  "message": "Felmeddelande här"
}
```

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
