# 🎤 Live AI-Debatt - Användarguide

## Vad är Live AI-Debatt?

Live AI-Debatt låter dig se 5 olika AI-modeller debattera en fråga i realtid:
- **GPT** (OpenAI)
- **Gemini** (Google)
- **DeepSeek** (DeepSeek)
- **Grok** (X.AI)
- **ONESEEK** (lokal AI - neutral domare)

Efter 3 debattrundor röstar alla AI:er (utom på sig själva) och en vinnare utses!

## Hur använder jag det?

### 1. Gå till /7B-Zero
Navigera till `/7B-Zero` sidan i CivicAI.

### 2. Aktivera Debatt-knappen
Klicka på knappen **🎤 Debatt OFF** för att aktivera debattläge.
- Knappen blir grön: **🎤 Debatt ON**
- Compare-läget stängs av automatiskt

### 3. Ställ din fråga
Skriv en debattfråga i textfältet, till exempel:
- "Ska Sverige bygga nya kärnkraftverk?"
- "Är elektriska bilar bättre för miljön?"
- "Borde Sverige ha grundinkomst?"

**Tips**: Du kan använda prefix `[debatt]` men det är inte nödvändigt.

### 4. Följ debatten live
När du skickar frågan händer följande:

**Runda 1-3:**
- Alla 5 AI:er svarar på frågan
- Svaren streamas live så fort de kommer
- Varje AI ser tidigare rundors argument

**Röstning:**
- Alla 5 AI:er röstar på bästa svaret
- Ingen får rösta på sig själv
- ONESEEK agerar som neutral domare

**Vinnare:**
- AI:n med flest röster vinner
- 🎉 Confetti-regn i 5 sekunder!
- ONESEEK sammanfattar debatten objektivt

### 5. Läs sammanfattningen
Efter debatten visar ONESEEK (Debattledaren):
- Vad debatten handlade om
- Viktiga argument från varje AI
- Varför vinnaren vann
- Objektiv bedömning av diskussionen

## Exempelfrågor

### 🔋 Energi & Klimat
- "Ska Sverige bygga nya kärnkraftverk?"
- "Är solenergi mer hållbart än vindkraft?"
- "Borde Sverige stoppa all fossilbränsleförsäljning 2030?"

### 🚗 Transport
- "Är elektriska bilar verkligen bättre för miljön?"
- "Ska Sverige förbjuda bensin- och dieselbilar?"
- "Borde kollektivtrafiken vara gratis?"

### 🤖 Teknologi & AI
- "Ska AI-genererat innehåll märkas som AI-skapat?"
- "Är AI ett hot mot arbetstillfällen?"
- "Borde AI-företag betala för träningsdata?"

### 💰 Ekonomi & Politik
- "Är grundinkomst en bra idé för Sverige?"
- "Borde Sverige ha förmögenhetsskatt?"
- "Ska företag betala högre skatt för klimatavtryck?"

### 🏥 Samhälle & Välfärd
- "Borde alla få gratis tandvård i Sverige?"
- "Ska Sverige ha öppnare invandringspolitik?"
- "Borde studiestödet höjas?"

## Tips för bra debattfrågor

✅ **Bra frågor:**
- Öppna för olika perspektiv
- Relevanta för samhället
- Tydligt formulerade
- Möjliggör konstruktiv diskussion

❌ **Undvik:**
- Ja/nej-frågor utan nyans
- Alltför tekniska frågor
- Frågor med självklart svar
- Offensiva eller känsliga ämnen

## Funktioner

### 🎯 Live Streaming
- Se svar i realtid när AI:erna svarar
- Ingen väntan - flödet är snabbt!

### 🔄 3 Debattrundor
- Runda 1: Initial position
- Runda 2: Svar på argument
- Runda 3: Slutargument

### 🗳️ Röstning
- 5 AI:er röstar (ingen på sig själv)
- Transparent röstningsprocess
- ONESEEK = neutral domare

### 🏆 Vinnare
- Baserat på flest röster
- Confetti-effekt i UI!
- Objektiv förklaring varför

### 📝 Sammanfattning
- ONESEEK sammanfattar objektivt
- Förklarar debattens innehåll
- Analyserar varför vinnaren vann

## Tekniska detaljer

### WebSocket-anslutning
Debatten använder WebSocket för realtidsstreaming:
- Snabb respons
- Live-uppdateringar
- Minimal latens

### Personlighet: Debattledaren
När du aktiverar Debatt-knappen laddas automatiskt:
- **Namn**: Debattledaren
- **Roll**: Neutral och objektiv moderator
- **Uppgift**: Leda debatt, rösta smart, sammanfatta

### Felhantering
Om en AI inte svarar:
- Debatten fortsätter med de som svarade
- Felmeddelande visas
- Minst 3 AI:er krävs för giltig debatt

## Felsökning

### "WebSocket ansluter inte"
**Problem**: Kan inte starta debatt
**Lösning**: 
1. Kontrollera att backend körs (port 5000)
2. Ladda om sidan
3. Kontrollera webbläsarens konsol för fel

### "Ingen AI svarar"
**Problem**: Inga svar från externa AI:er
**Lösning**:
1. Kontrollera API-nycklar i `.env`
2. Verifiera internetanslutning
3. Vänta en stund och försök igen

### "Confetti visas inte"
**Problem**: Inget confetti när vinnare utses
**Lösning**:
1. Kontrollera att JavaScript är aktiverat
2. Testa i en annan webbläsare
3. Ladda om sidan

## Begränsningar

- **Maximal frågelängd**: 5000 tecken
- **Antal rundor**: Fast 3 rundor
- **Antal deltagare**: Fast 5 AI:er
- **Timeout per AI**: 60 sekunder
- **Ingen historik**: Debatter sparas ej permanent (än)

## Kommande förbättringar

- 📊 Debatthistorik
- 🎥 Återspelning av debatter
- 👥 Publikröstning
- ⚙️ Anpassningsbara regler
- 💾 Permanent lagring
- 🤖 Fler AI-modeller

## Support

För teknisk support eller buggrapporter:
- Öppna ett issue på GitHub
- Kontakta utvecklingsteamet
- Se [DEBATE_IMPLEMENTATION.md](../DEBATE_IMPLEMENTATION.md) för tekniska detaljer

---

**Njut av debatten!** 🎤✨
