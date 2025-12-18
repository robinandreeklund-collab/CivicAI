# Hur PES Phase 2 Fungerar - Endast ONESEEK

## Översikt

PES Phase 2 använder **ENDAST ONESEEK-modellen** för all analys och simulering. Systemet baserar sina simuleringar på **historisk data från databasen** - hur andra AIs faktiskt röstade, deras motiveringar, och mentions av ONESEEK.

## Inga Externa AI-Tjänster

❌ **ANVÄNDS INTE:**
- OpenAI GPT-4
- Claude
- Gemini API
- Andra externa AI-tjänster

✅ **ANVÄNDS:**
- ONESEEK-modellen (localhost:5000)
- Historisk debattdata från Firebase
- Statistisk aggregering

## Data Flow

```
┌─────────────────────────────────────────────┐
│ 1. HISTORISKA DEBATTER (från Firebase)     │
│    - Frågor och svar                        │
│    - Röster med motiveringar               │
│    - Mentions av ONESEEK                    │
│    - Vinnare per debatt                     │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 2. ONESEEK ANALYSERAR                       │
│    Prompt: "Analysera denna debatt.        │
│    Identifiera vad som gjorde ONESEEK      │
│    effektiv/ineffektiv baserat på:         │
│    - Röster mottagna                       │
│    - Motiveringar från andra AIs           │
│    - Mentions i andra svar                 │
│    - Vinnare av debatten"                  │
│                                             │
│    ONESEEK svarar med analys i JSON        │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 3. ONESEEK GENERERAR VARIANTER             │
│    Prompt: "Baserat på dessa insikter,    │
│    generera 5 promptvarianter som:         │
│    - Betonar framgångsrika element         │
│    - Adresserar svagheter                  │
│    - Testar olika strategier"              │
│                                             │
│    ONESEEK svarar med 5 varianter          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 4. SIMULERING MED ONESEEK                  │
│    För varje variant:                       │
│    - ONESEEK genererar nya svar             │
│    - Externa AI-svar hålls fixerade        │
│      (från historisk data)                  │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 5. ONESEEK SIMULERAR RÖSTER                │
│    Prompt: "Du simulerar hur GPT-4 skulle  │
│    rösta baserat på historiska mönster.    │
│    Given denna debatt, förutse rösten      │
│    baserat på tidigare beteende."          │
│                                             │
│    Görs för varje AI: GPT-4, Gemini, etc   │
│    ONESEEK förutser varje röst             │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│ 6. STATISTISK AGGREGERING                  │
│    - Räkna röster per variant              │
│    - Beräkna win rate                       │
│    - Räkna mentions                         │
│    - Välj vinnare                           │
│    (Ingen AI används här - ren matematik)   │
└─────────────────────────────────────────────┘
```

## Hur Röstningssimulering Fungerar

### Tidigare (FELAKTIGT med extern AI):
```javascript
// ❌ Använde OpenAI GPT-4
const vote = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: votingPrompt }]
});
```

### Nu (KORREKT med endast ONESEEK):
```javascript
// ✅ Använder ONESEEK med historisk kontext
const votingPrompt = `
Du simulerar hur ${voterName} skulle rösta baserat på 
HISTORISKA RÖSTMÖNSTER från databasen.

Tidigare röstningar visar att ${voterName}:
- Värderar clarity och structure
- Röstar ofta för data-driven svar
- Mentions ONESEEK när synthes är bra

Given denna debatt, förutse hur ${voterName} skulle rösta...
`;

const vote = await generateWithOneseek(votingPrompt, {
  temperature: 0.3,
  max_tokens: 500
});
```

## Nyckelskillnader

### Debattanalys
**Före:** OpenAI GPT-4 analyserade debatter
**Nu:** ONESEEK analyserar debatter baserat på faktisk röstningsdata

### Promptgenerering
**Före:** OpenAI GPT-4 genererade varianter
**Nu:** ONESEEK genererar varianter baserat på insikter

### Röstningssimulering
**Före:** OpenAI GPT-4 simulerade varje AI
**Nu:** ONESEEK simulerar alla AIs baserat på historiska mönster

## Varför Detta Är Bättre

1. **Ingen extern kostnad** - Inga API-avgifter till OpenAI
2. **Konsekvent med systemet** - Samma modell används överallt
3. **Baserat på verklig data** - Simuleringar grundade i faktisk historik
4. **Fristående** - Fungerar även utan internetanslutning
5. **Ingen data läckage** - All data stannar inom systemet

## Exempel: En Komplett Evolution Loop

1. **Start**: Användare startar loop med baseline prompt
2. **Hämta data**: System läser 15 historiska debatter från Firebase
3. **ONESEEK analyserar**: 
   - "I debatt X fick ONESEEK 3 röster"
   - "Motiveringar: 'klar struktur', 'bra syntes'"
   - "Mentioned 2 gånger av andra AIs"
4. **ONESEEK genererar**: 5 varianter som betonar klarhet och syntes
5. **ONESEEK simulerar**: Genererar nya svar för varje variant
6. **ONESEEK förutser röster**: 
   - "GPT-4 skulle troligen rösta för detta för det har bra struktur"
   - "Gemini skulle uppskatta data-driven approach"
7. **Aggregering**: Räkna röster, välj vinnare (ren matematik)
8. **Resultat**: Variant C vinner med +87% fler röster

## Fallback-Logik

Om ONESEEK inte kan generera valid JSON:
- **Heuristisk analys** baserad på röstdata
- **Regelbaserad generering** av varianter
- **Statistisk röstning** baserad på längd och struktur

Allt utan externa AI-tjänster!

## Sammanfattning

✅ **En AI-modell**: Endast ONESEEK
✅ **Historisk data**: Från faktiska debatter i databasen
✅ **Fristående**: Inget externt beroende
✅ **Kostnadseffektivt**: Inga API-avgifter
✅ **Säkert**: All data stannar inom systemet

❌ **Inga externa AIs**: OpenAI, Claude, Gemini, etc.
