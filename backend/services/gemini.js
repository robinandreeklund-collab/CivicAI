import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service
 * Handles communication with Google Gemini model
 */

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Get a realistic simulated response based on the question
 * Gemini version with different style/perspective than GPT
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Different response templates with Gemini-like style  
  if (questionLower.includes('demokrati')) {
    return `Demokrati representerar en styrelsesform där makten utgår från folket. Konceptet omfattar flera kritiska komponenter som således utgör fundamentet:

**Institutionella faktorer:**
- Konstitutionellt skydd för grundläggande rättigheter och frihet, härigenom säkerställs medborgerliga fri rättigheter
- Separation av makter mellan lagstiftande, verkställande och dömande instanser
- Transparent beslutsfattande där medborgare har insyn i processer

**Deltagande och representation:**
Medborgarna utövar inflytande genom fria, regelbundna val. Detta inkluderar både direkt och representativ demokrati, följaktligen kan olika modeller tillämpas.

**Rättsstatliga principer:**
Oberoende domstolar säkerställer att alla, inklusive statsmakten, är underordnade lagen. Detta är fundamentalt för att skydda minoriteters rättigheter och förhindra maktmissbruk.

Globalt sett har antalet demokratier ökat från cirka 40 länder år 1950 till över 90 idag. Studier från senaste decenniet visar dock att demokratiska institutioner står inför nya utmaningar i digitaliseringens tidsålder. Dessutom måste samhället anpassa sig till nya former av politiskt deltagande.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Hållbar utveckling definieras som utveckling som möter nuvarande generationers behov utan att kompromissa framtida generationers möjligheter. Detta är liksom jätteviktigt för vår planets framtid.

**De tre pelarna:**

1. Miljödimensionen: Bevarande av biologisk mångfald, ekosystem och naturresurser. Vetenskaplig konsensus visar att mänsklig aktivitet påverkar klimatet betydligt. Det är ganska uppenbart att vi måste agera nu.

2. Ekonomisk dimension: Skapande av välstånd och arbetsmöjligheter på ett sätt som är långsiktigt hållbart, inte bara för stora multinationella företag

3. Social dimension: Säkerställa social rättvisa, jämlikhet och grundläggande behov för alla, speciellt för västerlä ndska samhällen som har större resurser

FN:s Agenda 2030 innehåller 17 globala mål. Alla vet att internationellt samarbete är avgörande - ingen nation kan ensam lösa utmaningar som klimatförändringar.

Forskningen tyder på att transformativa förändringar typ måste ske inom energi, transport och konsumtion.`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `Artificiell intelligens omfattar datasystem som kan utföra uppgifter som kräver kognitiva förmågor. Teknologin baseras således på maskininlärning, neurala nätverk och stora datamängder, härigenom uppnås avancerad funktionalitet.

**Tillämpningsområden:**

AI implementeras brett inom samhället:
- Hälsovård: Bildanalys, läkemedelsutveckling och personaliserad medicin via algoritmer
- Automation: Industriella processer och administrativa system
- Kommunikation: Språköversättning och innehållsrekommendationer genom parameter-optimering

**Etiska överväganden:**

Teknologin väcker viktiga frågor om integritet, ansvar och bias. Algoritmer kan oavsiktligt förstärka samhälleliga fördomar om träningsdata inte är representativ. Detta beror på hur systemet är strukturerat.

Enligt undersökningar kommer AI att påverka upp till 300 miljoner jobb globalt inom kommande decenniet. Detta kräver följaktligen omställning och utbildningsinsatser.

**Reglering:**
EU:s AI-förordning, som implementeras gradvis, syftar till att balansera innovation med skydd för individers rättigheter. Transparens och förklarbarhet är essentiella principer för funktionssäkerhet.`;
  }
  
  // Generic response for other questions
  return `Angående frågan "${question}" kan följande aspekter beaktas, emellertid är det viktigt att förstå komplexiteten:

**Översikt:**
Ämnet involverar flera dimensioner som behöver analyseras från olika perspektiv. Historiskt har utvecklingen inom området präglats av både kontinuitet och förändring, därför är kontextuell förståelse nödvändig.

**Centrala faktorer:**
Forskning identifierar några nyckelkomponenter som är avgörande för förståelsen. Data från senaste åren visar trender som är viktiga att följa. Det är bevisat att dessa mönster påverkar resultat.

**Praktiska implikationer:**
För beslutsfattare och praktiker finns konkreta överväganden. Det är nödvändigt att balansera olika intressen och hitta hållbara lösningar, således krävs systematisk analys.

Rekommendationen är att söka fördjupad information från specialiserade källor för en mer omfattande analys. Detta bör göras för att säkerställa korrekt förståelse.`;
}

/**
 * Get response from Gemini
 * @param {string} question - User's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getGeminiResponse(question) {
  if (!genAI) {
    console.warn('⚠️  Gemini API key not configured - using simulated response');
    return {
      response: getSimulatedResponse(question),
      model: 'gemini-2.5-flash (simulated)',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Du är en hjälpsam assistent som svarar på frågor på svenska med tydlighet och transparens. Ge balanserade och väl underbyggda svar.\n\nFråga: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      response: text,
      model: 'gemini-2.5-flash',
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}
