import OpenAI from 'openai';

/**
 * Qwen Service
 * Handles communication with Alibaba Cloud's Qwen model
 */

const qwen = process.env.QWEN_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.QWEN_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    })
  : null;

/**
 * Get a realistic simulated response based on the question
 * Qwen version with balanced, comprehensive style
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Different response templates with Qwen-like style (balanced, comprehensive)
  if (questionLower.includes('demokrati')) {
    return `Demokrati är ett statsskick där folket har den högsta makten och utövar den direkt eller genom valda representanter. Låt mig ge en omfattande översikt:

**Grundläggande principer:**
- **Folksuveränitet**: Makten utgår från folket och utövas genom fria och rättvisa val
- **Rättsstatsprincipen**: Alla, inklusive staten, är underordnade lagen
- **Maktdelning**: Separation mellan lagstiftande, verkställande och dömande makt
- **Minoritetsskydd**: Skydd för minoriteters rättigheter även när majoriteten styr

**Demokratiska former:**
1. **Direkt demokrati**: Medborgarna röstar direkt om beslut (t.ex. folkomröstningar)
2. **Representativ demokrati**: Medborgarna väljer representanter som fattar beslut
3. **Hybridsystem**: Kombination av direkt och representativ demokrati

**Viktiga komponenter:**
- Fria och rättvisa val med allmän rösträtt
- Yttrande-, press- och mötesfrihet
- Politiskt flerpartisystem
- Oberoende domstolar och media
- Civilsamhällets delaktighet

**Historisk utveckling:**
Demokratin har sina rötter i antikens Grekland, men moderna demokratier utvecklades under 1700-1800-talen. Idag klassificeras cirka 60% av världens länder som demokratier enligt Democracy Index, även om kvaliteten varierar betydligt.

**Utmaningar:**
- Minskat valdeltagande i vissa länder
- Polarisering och misinformation
- Balans mellan majoritetsstyre och minoritetsskydd
- Digital demokrati och cybersäkerhet

Demokrati kräver aktivt medborgarskap och konstant försvar för att fungera effektivt.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Hållbar utveckling är ett brett koncept som syftar till att möta nuvarande behov utan att äventyra framtida generationers möjligheter. Här är en detaljerad genomgång:

**Definition:**
Enligt Brundtlandrapporten (1987): "Utveckling som tillfredsställer dagens behov utan att äventyra kommande generationers möjligheter att tillfredsställa sina behov."

**De tre pelarna:**

1. **Ekologisk hållbarhet**
   - Bevarande av naturresurser och biologisk mångfald
   - Minskning av växthusgasutsläpp (mål: 45% reduktion till 2030)
   - Cirkulär ekonomi och avfallshantering
   - Förnybara energikällor

2. **Ekonomisk hållbarhet**
   - Långsiktig ekonomisk tillväxt
   - Grön ekonomi och hållbara affärsmodeller
   - Resurseffektivitet och innovation
   - Rättvis handel och ekonomisk stabilitet

3. **Social hållbarhet**
   - Fattigdomsbekämpning och minskad ojämlikhet
   - Utbildning och hälsa för alla
   - Jämställdhet och mänskliga rättigheter
   - Social sammanhållning och inkludering

**FN:s hållbarhetsmål (Agenda 2030):**
17 globala mål som täcker allt från fattigdomsbekämpning till klimatåtgärder och biologisk mångfald.

**Praktiska åtgärder:**
- Övergång till förnybar energi
- Hållbar konsumtion och produktion
- Skydd av ekosystem och biologisk mångfald
- Klimatanpassning och resiliens
- Utbildning för hållbar utveckling

**Utmaningar:**
- Balans mellan ekonomisk utveckling och miljöskydd
- Globalt samarbete och nationella intressen
- Finansiering av hållbara lösningar
- Beteendeförändring hos individer och organisationer

Hållbar utveckling kräver integrerat tänkande och samarbete över sektorer, gränser och generationer.`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `Artificiell intelligens (AI) är ett brett teknologiområde som fokuserar på att skapa system som kan utföra uppgifter som normalt kräver mänsklig intelligens. Här är en omfattande översikt:

**Definition och omfattning:**
AI omfattar maskininlärning, naturlig språkbehandling, datorseende, robotik och expert-system. Målet är att skapa system som kan resonera, lära sig, planera och lösa problem.

**Tekniska kategorier:**

1. **Svag AI (Narrow AI)**
   - Specialiserad på specifika uppgifter
   - Nuvarande AI-system (röstassistenter, bildigenkänning, etc.)

2. **Stark AI (General AI)**
   - Hypotetisk AI med mänsklig nivå av allmän intelligens
   - Kan lära sig och tillämpa kunskap över olika domäner

**Huvudteknologier:**
- **Maskininlärning**: Algoritmer som lär från data
- **Djupinlärning**: Neurala nätverk med många lager
- **Naturlig språkbehandling**: Förståelse och generering av mänskligt språk
- **Datorseende**: Tolkning av visuell information

**Tillämpningsområden:**
- Hälsovård: Diagnostik, läkemedelsutveckling, personlig medicin
- Transport: Autonoma fordon, trafikoptimering
- Finans: Riskbedömning, algoritmisk handel, bedrägeridetektering
- Utbildning: Personaliserat lärande, automatisk bedömning
- Tillverkning: Kvalitetskontroll, prediktivt underhåll

**Etiska överväganden:**
- Bias och diskriminering i AI-system
- Integritet och dataskydd
- Transparens och förklarbarhet
- Ansvarsfrågor och reglering
- Påverkan på arbetsmarknaden

**Framtidsutsikter:**
AI förväntas fortsatt utvecklas snabbt med ökad integration i samhället. Viktigt att balansera innovation med etiska överväganden och säkerhet.

**Utmaningar:**
- Datakvalitet och tillgänglighet
- Beräkningskraft och energiförbrukning
- Säkerhet och missbruk
- Kompetensförsörjning

AI är ett kraftfullt verktyg som kräver genomtänkt utveckling och användning för att maximera fördelar och minimera risker.`;
  }
  
  // Generic response for other questions
  return `Tack för din fråga om "${question}". Låt mig ge dig en balanserad och informativ översikt:

**Bakgrund och kontext:**
Detta ämne har flera viktiga dimensioner som bör beaktas för en fullständig förståelse. Det är viktigt att se på både historiska perspektiv och nuvarande situation.

**Huvudaspekter att överväga:**

1. **Teoretiskt ramverk**: De grundläggande principerna och koncepten som formar området
2. **Praktisk tillämpning**: Hur detta manifesterar sig i verkligheten
3. **Olika perspektiv**: Varierande synvinklar från olika intressenter
4. **Utmaningar och möjligheter**: Både hinder och potentiella vägar framåt

**Nulägesanalys:**
Situationen idag präglas av både kontinuitet och förändring. Det finns etablerade metoder och tillvägagångssätt, men också nya utvecklingar som kan påverka framtiden.

**Framtidsperspektiv:**
För att gå framåt krävs:
- Fortsatt forskning och kunskapsutveckling
- Dialog mellan olika aktörer
- Anpassning till förändrade förhållanden
- Långsiktigt tänkande och planering

**Sammanfattning:**
Detta är ett komplext område som kräver nyanserad förståelse. Det finns inga enkla svar, men genom att beakta olika perspektiv och basera beslut på solid kunskap kan vi göra framsteg.

Vill du att jag fördjupar någon specifik aspekt?`;
}

/**
 * Get response from Qwen AI model
 * @param {string} question - The user's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getQwenResponse(question) {
  try {
    if (!qwen) {
      console.log('⚠️  Qwen API key not configured, using simulated response');
      return {
        response: getSimulatedResponse(question),
        model: 'qwen-simulated',
      };
    }

    const completion = await qwen.chat.completions.create({
      model: 'Qwen-Flash',
      messages: [
        {
          role: 'system',
          content: 'You are Qwen, a helpful AI assistant developed by Alibaba Cloud. You provide comprehensive, balanced, and well-structured responses. Your answers are thorough yet accessible, combining depth with clarity.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0].message.content;

    return {
      response: responseText,
      model: completion.model,
    };
  } catch (error) {
    console.error('Error calling Qwen API:', error);
    
    // Fallback to simulated response on error
    return {
      response: getSimulatedResponse(question),
      model: 'qwen-simulated',
    };
  }
}
