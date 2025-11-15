# 📍 Var hittar jag pipeline-analysen? (Guide)

## 🎯 Så här använder du den nya pipeline-analysen

### Steg 1: Ställ en fråga
Skriv en fråga i sökfältet på startsidan (HomePage) och tryck Enter.

```
Exempel: "Vad tycker du om välfärdspolitik?"
```

### Steg 2: Vänta på AI-svar
Systemet kommer att:
- Skicka din fråga till alla aktiverade AI-modeller (GPT-3.5, Gemini, DeepSeek, etc.)
- Köra den kompletta analyspipelinen på varje svar
- Visa resultaten i huvudområdet

### Steg 3: Navigera i Timeline (höger sidopanel)

I den högra sidopanelen ser du en **Timeline Navigator** med olika sektioner:

```
┌─────────────────────────────┐
│  📊 PROCESSERING            │
│  ├─ Bästa svar              │
│  └─ BERT-sammanfattning     │
│                             │
│  🤖 AI-SVAR                 │
│  ├─ GPT-3.5                 │ ← KLICKA HÄR!
│  │   Med pipeline-analys    │ ← Denna text visar att pipeline finns
│  ├─ Gemini                  │
│  │   Med pipeline-analys    │
│  └─ DeepSeek                │
│      Med pipeline-analys    │
│                             │
│  📈 ANALYSER                │
│  ├─ Modellsyntes            │
│  └─ GPT Metagranskning      │
└─────────────────────────────┘
```

### Steg 4: Klicka på ett AI-svar

När du klickar på t.ex. **"GPT-3.5"** under "AI-SVAR" sektionen, visas:

#### 📄 Del 1: Standard AI-svar Card
```
┌────────────────────────────────────────┐
│ 🤖 GPT-3.5 Svar                        │
├────────────────────────────────────────┤
│                                        │
│ [AI-svaret visas här...]               │
│                                        │
├────────────────────────────────────────┤
│ Metadata:                              │
│ • Modell: gpt-3.5-turbo               │
│ • Svarstid: 1234ms                    │
│ • Bias-poäng: 2/10                    │
│ └─ etc.                                │
└────────────────────────────────────────┘
```

#### 🔬 Del 2: KOMPLETT PIPELINE-ANALYS (NY!)
Direkt under AI-svaret ser du en stor ny sektion:

```
┌─────────────────────────────────────────────────┐
│ 🔬 Komplett Pipeline-analys                     │
│                                                  │
│ Djupgående analys av detta AI-svar med          │
│ förbearbetning, sentiment, ideologi och         │
│ transparens                                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  [📊 Översikt] [💭 Sentiment] [🏛️ Ideologi]     │
│  [⏱️ Timeline] [🔍 Detaljer]                    │
│  ─────────────                                   │
│                                                  │
│  📄 SAMMANFATTNING                              │
│  ┌──────────────────────────────────────────┐  │
│  │ Texten har en övertygande ton med        │  │
│  │ neutral sentiment. Minimal bias           │  │
│  │ detekterad. Texten är huvudsakligen       │  │
│  │ objektiv (100% objektiva meningar)...     │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ⭐ KVALITETSINDIKATORER                        │
│  ┌──────────────────────────────────────────┐  │
│  │ Objektivitet    ████████░░ 80%           │  │
│  │ Tydlighet       ██████████ 100%          │  │
│  │ Faktabaserad    ████████░░ 85%           │  │
│  │ Neutralitet     ██████████ 95%           │  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  📏 TEXTMÄTNINGAR                               │
│  ┌─────────────────────────────────────────┐   │
│  │   150        10          15              │   │
│  │   Ord     Meningar   Ord/mening          │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Steg 5: Utforska olika flikar

Klicka på de olika flikarna för att se:

#### 💭 Sentiment-fliken
```
┌─────────────────────────────────────────┐
│ 💭 Sentimentanalys                      │
├─────────────────────────────────────────┤
│ VADER Sentiment                         │
│ ┌─────────────────────────────────────┐ │
│ │ Negativ ←─────●─────→ Positiv       │ │
│ │                                     │ │
│ │ Positiv: 20%  Neutral: 70%          │ │
│ │ Negativ: 10%                        │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Känslomässiga Indikatorer:              │
│ ┌─────────────────────────────────────┐ │
│ │ 😏 Sarkasm        ⚠️ Detekterat    │ │
│ │ 😠 Aggression     ✓ Låg nivå       │ │
│ │ 💚 Empati         ✓ Hög nivå       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 🏛️ Ideologi-fliken
```
┌──────────────────────────────────────────┐
│ 🏛️ Ideologisk Klassificering            │
├──────────────────────────────────────────┤
│ Vänster ←────●────→ Höger                │
│              Center                       │
│ Score: -0.12 (center)                    │
│ Säkerhet: 29%                            │
│                                          │
│ Dimensioner:                             │
│ ┌────────────────────────────────────┐  │
│ │ Ekonomisk    ←●─→  (left)          │  │
│ │ Social       ─●──  (moderate)      │  │
│ │ Auktoritet   ─●──  (balanced)      │  │
│ └────────────────────────────────────┘  │
│                                          │
│ Partidöverenstämmelse:                   │
│ • Centerpartiet (C)                      │
│ • Liberalerna (L)                        │
└──────────────────────────────────────────┘
```

#### ⏱️ Timeline-fliken
```
┌──────────────────────────────────────────┐
│ ⏱️ Analys Pipeline Timeline              │
│ Total tid: 43ms                          │
├──────────────────────────────────────────┤
│ │                                        │
│ ●─┬─ 📝 Förbearbetning (28ms)           │
│ │ │    compromise.js Tokenizer          │
│ │ │    [Klicka för detaljer]            │
│ │                                        │
│ ●─┬─ 🎯 Biasdetektion (0ms)             │
│ │ │    BiasCheck v1.0                   │
│ │                                        │
│ ●─┬─ 💭 Sentimentanalys (1ms)           │
│ │ │    VADER + Custom                   │
│ │                                        │
│ ●─┬─ 🏛️ Ideologisk Klassificering (1ms)│
│ │ │    PoliticalBERT-like              │
│ │                                        │
│ ●─── 🎵 Tonanalys (0ms)                 │
│ │                                        │
│ ●─── ✅ Faktakontroll (1ms)             │
│ │                                        │
│ ●─── 🧠 Utökad NLP-analys (12ms)        │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │  8 Steg   43ms      2.9ms/steg    │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## 🎨 Visuella indikatorer

### I Timeline Navigator
- **"Med pipeline-analys"** = Detta svar har full pipeline-analys tillgänglig
- **Procentsiffra** = Endast basic analys (ingen pipeline)

### I Pipeline Panel
- 🟢 Grön = Bra kvalitet (>70%)
- 🟡 Gul = Medel kvalitet (40-70%)
- 🔴 Röd = Låg kvalitet (<40%)

### Risk Flaggor
Om systemet hittar problem visas:
```
┌─────────────────────────────────┐
│ 🚨 Riskflaggor                  │
├─────────────────────────────────┤
│ ⚠️ Hög bias detekterad          │
│ ⚠️ Aggressivt språk             │
│ ⚠️ Laddat språk                 │
└─────────────────────────────────┘
```

## 🔧 Felsökning

### Problem: Jag ser inget "Med pipeline-analys" i timeline
**Lösning:** Pipeline-analysen körs automatiskt för alla AI-svar när backend är igång. Om du inte ser den:
1. Kontrollera att backend servern körs (`npm start` i backend-mappen)
2. Ställ en ny fråga (gamla svar har inte pipeline-data)
3. Se till att AI-modellerna svarar (kolla console för fel)

### Problem: Jag kan inte klicka på AI-svaren
**Lösning:** 
1. Se till att du klickar på rätt plats (under "AI-SVAR" sektionen i timeline)
2. Scrolla ner i huvudområdet - pipeline-panelen visas UNDER AI-svaret
3. Uppdatera sidan och försök igen

### Problem: Pipeline-panelen är tom
**Lösning:**
1. Se att `pipelineAnalysis` data finns i svaret (kolla browser console)
2. Backend kanske inte genererade pipeline-data - kolla backend logs
3. Testa med en ny fråga

## 📝 Exempel på fungerande flöde

1. **Öppna appen** → Se startsidan
2. **Skriv fråga** → "Vad är viktigt för Sveriges framtid?"
3. **Vänta 2-5 sekunder** → AI-svar genereras
4. **Titta på höger sidebar** → Se "AI-SVAR" sektionen
5. **Klicka på "GPT-3.5"** → Se AI-svaret
6. **Scrolla ner** → Se "🔬 Komplett Pipeline-analys" rubriken
7. **Klicka på flikarna** → Utforska sentiment, ideologi, timeline
8. **Upprepa för andra AI-svar** → Jämför analyserna

## 🎉 Färdigt!

Nu kan du:
- ✅ Se pipeline-analys för alla AI-svar
- ✅ Klicka på AI-svar i timeline
- ✅ Utforska sentiment, ideologi och kvalitet
- ✅ Se transparent timeline av analysprocessen
- ✅ Identifiera risker och bias automatiskt

Njut av din nya transparenta AI-analys! 🚀
