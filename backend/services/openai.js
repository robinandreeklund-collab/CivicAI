import OpenAI from 'openai';

/**
 * OpenAI Service
 * Handles communication with OpenAI GPT-3.5 model
 */

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Get a realistic simulated response based on the question
 * This provides varied analysis results for demo purposes
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  // Different response templates for different types of questions
  if (questionLower.includes('demokrati')) {
    return `Demokrati är en statsskicksform där folket styr genom fria val och representation. Jag vill hjälpa dig förstå de viktigaste faktorerna:

1. **Fria val**: Regelbundna val där medborgare kan välja sina representanter. Självklart måste dessa val vara rättvisa och transparenta.
2. **Rättsstaten**: Oberoende domstolar och lika behandling inför lagen
3. **Yttrandefrihet**: Möjlighet att fritt uttrycka åsikter utan repressalier, vilket är fundamentalt för samhällsutvecklingen

Enligt forskning från 2020 har demokratiska länder visat sig ha högre levnadsstandard. Cirka 60% av världens länder anses vara demokratier. Det är viktigt att notera att demokrati inte är ett statiskt system utan måste ständigt försvaras och utvecklas för kommande generationer.

Historiskt har demokratin utvecklats sedan antikens Grekland, men den moderna demokratin etablerades på 1700-talet. Att värna om demokratiska värderingar är nödvändigt i dagens politiska klimat.`;
  } else if (questionLower.includes('hållbar utveckling') || questionLower.includes('hållbarhet')) {
    return `Hållbar utveckling är typ superviktigt för vår framtid! Det handlar om att tillgodose dagens behov utan att äventyra kommande generationers möjligheter.

**Miljömässig hållbarhet**: Vi måste bevara naturresurser och ekosystem. Studier visar att vi måste minska koldioxidutsläppen med 45% till 2030. Det är uppenbart att vi inte har någon tid att förlora.

**Ekonomisk hållbarhet**: Långsiktig tillväxt som faktiskt fungerar för alla, inte bara för de rika företagen

**Social hållbarhet**: Rättvis fördelning och möjligheter för alla människor i samhället

FN:s hållbarhetsmål omfattar 17 olika områden. Globalt samarbete är avgörande - alla experter är eniga om att individuell handling inte räcker. Vi bör alla ta ansvar och agera nu för att skydda vår planet.`;
  } else if (questionLower.includes('ai') || questionLower.includes('artificiell intelligens')) {
    return `Artificiell intelligens (AI) är system som kan utföra uppgifter som normalt kräver mänsklig intelligens. Tekniken implementerar algoritmer och neurala nätverk för att processa data och generera output.

AI används idag inom flera domäner:
- Medicin: Diagnostisering via bildanalys och behandlingsoptimering
- Transport: Autonoma system och trafikflödesanalys  
- Ekonomi: Algoritmisk handel och kreditriskbedömning

Tekniskt sett baseras moderna AI-system på transformer-arkitekturer och djupa neurala nätverk. Träningsprocessen kräver stora datamängder och beräkningsresurser.

Forskningsdata visar att AI kan öka produktiviteten med upp till 40% i vissa sektorer. Implementationen kräver emellertid noggrann planering och systemintegration.

Parameterstyrning och hyperparameteroptimering är kritiska funktioner för att maximera modellprestanda. Det är bevisat att felaktig konfiguration resulterar i suboptimal performance.`;
  }
  
  // Generic response for other questions
  return `Detta är ett demonstrationssvar för frågan: "${question}"

Jag kan ge en allmän förklaring baserat på tillgänglig kunskap. Ämnet är komplext och det finns flera perspektiv att beakta. Det är viktigt att respektera olika synsätt och försöka förstå helheten.

Forskning inom området tyder på att det finns viktiga faktorer att överväga. Cirka 75% av experter är eniga om vissa grundläggande principer, vilket visar bred konsensus.

Det är avgörande att analysera både historiska och nutida aspekter. Traditionellt har utvecklingen visat vissa mönster, men moderna förhållanden ställer nya krav på hur vi förstår och hanterar dessa frågor.

För att verkligen kunna hjälpa dig rekommenderas att konsultera specialiserade källor och aktuell forskning. Jag vill säkerställa att du får den bästa möjliga informationen.`;
}

/**
 * Get response from GPT-3.5
 * @param {string} question - User's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getOpenAIResponse(question) {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured - using simulated response');
    return {
      response: getSimulatedResponse(question),
      model: 'gpt-3.5-turbo (simulated)',
      error: true,
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Du är en hjälpsam assistent som svarar på frågor på svenska med tydlighet och transparens. Ge balanserade och väl underbyggda svar.',
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
    console.error('OpenAI API Error:', error.message);
    throw new Error(`OpenAI API failed: ${error.message}`);
  }
}
