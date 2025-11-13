import OpenAI from 'openai';

/**
 * DeepSeek Service
 * Handles communication with DeepSeek AI model
 */

const deepseek = process.env.DEEPSEEK_API_KEY 
  ? new OpenAI({ 
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    })
  : null;

/**
 * Get a realistic simulated response based on the question
 * DeepSeek version with technical and data-driven style
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Different response templates with DeepSeek-like style (technical, data-driven)
  if (questionLower.includes('demokrati')) {
    return `Demokrati definieras som ett statsskick där den högsta makten utgår från folket. Ur ett systemteoretiskt perspektiv kan demokrati analyseras enligt följande komponenter:

**Strukturella element:**
- Rösträttsmekanismer: Universell och lika rösträtt för medborgare över en viss ålder
- Maktdelning: Tredimensionell separation mellan lagstiftande, verkställande och dömande makt
- Konstitutionell ram: Juridiskt bindande ramverk som definierar rättigheter och skyldigheter

**Funktionella aspekter:**
Demokratiska processer kräver transparens och ansvarsskyldighet. Empiriska studier (Freedom House, 2023) indikerar att demokratiska system korrelerar positivt med BNP per capita och livskvalitetsindex.

**Kvantitativa mått:**
Enligt Democracy Index 2023 klassificeras 167 länder, varav 21 som "fullständiga demokratier". Statistisk analys visar att demokratiska transitioner tar i genomsnitt 15-20 år att konsolidera.

**Evolutionär kontext:**
Från antikens direktdemokrati via representativ demokrati till moderna hybridsystem. Teknologisk utveckling möjliggör nu digitala former av medborgardeltagande.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Hållbar utveckling (eng. sustainable development) definieras enligt Brundtlandrapporten (1987) som utveckling som möter dagens behov utan att kompromissa framtida generationers möjligheter.

**Analytiskt ramverk:**

1. Ekologisk dimension: Kräver bevarande av naturkapital inom planetära gränser. Data från IPCC (2023) visar att koldioxidekvivalenter måste reduceras med 43% till 2030 för att uppnå 1.5°C-målet.

2. Ekonomisk dimension: Integration av miljökostnader i ekonomiska modeller. Cirkulär ekonomi estimeras kunna generera $4.5 triljoner i ekonomisk värdeskapande till 2030.

3. Social dimension: Inkluderar jämlikhet, utbildning och hälsa. GINI-koefficienten används för att mäta inkomstdistribution.

**Mätbara mål:**
FN:s Agenda 2030 specificerar 17 SDG:er (Sustainable Development Goals) med 169 delmål och 231 indikatorer för kvantitativ uppföljning.

**Systemanalys:**
Komplexitetsteori visar att hållbarhetsproblem är icke-linjära och kräver multi-stakeholder-samarbete. Tipping points identifieras inom klimat, biodiversitet och resursförbrukning.`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `Artificiell intelligens (AI) omfattar datasystem med kognitiva funktioner. Teknologiskt baseras moderna AI-system på djupa neurala nätverk (DNN) och transformer-arkitekturer.

**Teknisk arkitektur:**
- Neural processing: Multi-layer perceptrons med backpropagation
- Training methodology: Supervised, unsupervised och reinforcement learning
- Compute requirements: Exascale computing (10^18 FLOPS) för state-of-the-art modeller

**Tillämpningsdomäner med metrics:**
- Computer Vision: 95%+ accuracy på ImageNet-benchmark
- Natural Language Processing: GPT-4 uppnår 86.4% på MMLU-test
- Robotics: Autonoma system med 99.9% reliability i kontrollerade miljöer

**Prestanda och skalning:**
Training av large language models (LLM) kräver:
- 10^24 FLOPS för GPT-4-class modeller
- Petabytes av träningsdata
- Miljoner GPU-timmar

**Socioekonomisk påverkan:**
McKinsey-analys (2023) projekterar att AI kan bidra med $13 triljoner till global BNP till 2030. Samtidigt estimeras 300 miljoner jobb påverkas, vilket kräver workforce reskilling.

**Etiska parametrar:**
Algoritmic bias mäts via fairness metrics (demographic parity, equalized odds). Transparency kräver explainable AI (XAI) metoder för att säkerställa accountability.`;
  }
  
  // Generic response for other questions
  return `Angående frågan "${question}" kan följande analytiska perspektiv tillämpas:

**Metodologisk ram:**
Systematisk analys kräver både kvalitativa och kvantitativa metoder. Empiriska data från peer-reviewed källor indikerar specifika trender och mönster.

**Kvantifierbara parametrar:**
Statistisk signifikans (p < 0.05) observeras i 73% av relevanta studier. Konfidensintervall på 95% tillämpas för robusta slutsatser.

**Systemiskt perspektiv:**
Komplexitetsanalys visar interdependenser mellan olika faktorer. Kausalkedjor identifieras genom regressionsanalys och strukturella ekvationsmodeller.

**Evidensbaserad bedömning:**
Meta-analyser av befintlig litteratur konvergerar mot vissa slutsatser, samtidigt som osäkerhetsmarginaler kvantifieras.

För detaljerad analys rekommenderas konsultation av domänspecifika databaser och peer-reviewed publikationer.`;
}

/**
 * Get response from DeepSeek
 * @param {string} question - User's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getDeepSeekResponse(question) {
  if (!deepseek) {
    console.warn('⚠️  DeepSeek API key not configured - using simulated response');
    return {
      response: getSimulatedResponse(question),
      model: 'deepseek-chat (simulated)',
      error: true,
    };
  }

  try {
    const completion = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'Du är en analytisk AI-assistent som svarar på svenska med fokus på data, evidens och systematisk analys. Ge tekniskt noggranna och välunderbyggda svar med kvantitativa mått när det är relevant.',
        },
        {
          role: 'user',
          content: question,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return {
      response: completion.choices[0].message.content,
      model: completion.model,
    };
  } catch (error) {
    console.error('DeepSeek API Error:', error.message);
    throw new Error(`DeepSeek API failed: ${error.message}`);
  }
}
