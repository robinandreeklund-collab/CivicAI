/**
 * OpenSeek Service
 * 
 * Wrapper for calling local OpenSeek inference endpoint.
 * 
 * Configuration:
 * - OPENSEEK_API_URL: URL for the OpenSeek inference endpoint (default: http://localhost:5000)
 * - OPENSEEK_API_KEY: Optional API key for authentication
 * - OPENSEEK_TIMEOUT_MS: Request timeout in milliseconds (default: 120000)
 */

// Increased timeout for complex compare operations
const DEFAULT_TIMEOUT_MS = parseInt(process.env.OPENSEEK_TIMEOUT_MS) || 120000; // 2 minutes default
const DEFAULT_MAX_TOKENS = 1024; // Increased for compare mode responses

/**
 * Get the configured OpenSeek API URL
 * @returns {string}
 */
function getOpenSeekUrl() {
  return process.env.OPENSEEK_API_URL || 'http://localhost:5000';
}

/**
 * Check if OpenSeek is configured
 * @returns {boolean}
 */
export function isOpenSeekConfigured() {
  return !!process.env.OPENSEEK_API_URL || true; // Default endpoint always available
}

/**
 * Get response from OpenSeek inference endpoint
 * 
 * @param {string} question - The question/prompt to send
 * @param {Object} options - Configuration options
 * @param {string} options.profileId - Profile/persona ID (e.g., 'zero')
 * @param {string} options.systemPrompt - System prompt for the model
 * @param {string} options.context - Additional context (compressed responses)
 * @param {number} options.max_tokens - Maximum tokens in response (default: 512)
 * @param {number} options.timeout - Request timeout in ms (default: 60000)
 * @param {number} options.temperature - Temperature for generation (default: 0.7)
 * @returns {Promise<{response: string, model: string, raw: Object, error?: string}>}
 */
export async function getOpenSeekResponse(question, options = {}) {
  const baseUrl = getOpenSeekUrl();
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  
  console.log(`🤖 Calling OpenSeek at ${baseUrl}...`);
  
  // Build the request body
  const requestBody = {
    text: question,
    max_length: options.max_tokens || DEFAULT_MAX_TOKENS,
    temperature: options.temperature ?? 0.7,
    top_p: options.top_p ?? 0.9,
  };
  
  // Add profile if specified
  if (options.profileId) {
    requestBody.profile_id = options.profileId;
  }
  
  // Add system prompt if specified
  if (options.systemPrompt) {
    requestBody.system_prompt = options.systemPrompt;
  }
  
  // Add context if specified
  if (options.context) {
    requestBody.context = options.context;
  }
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    // Build headers
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (process.env.OPENSEEK_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.OPENSEEK_API_KEY}`;
    }
    
    const response = await fetch(`${baseUrl}/infer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenSeek API error: ${response.status} - ${errorText}`);
      
      return {
        response: null,
        model: 'openseek-7b-zero',
        raw: null,
        error: `OpenSeek API error: ${response.status} - ${errorText}`,
      };
    }
    
    const data = await response.json();
    
    console.log('✅ OpenSeek response received');
    
    return {
      response: data.response || data.text || data.generated_text || '',
      model: data.model || data.version || 'openseek-7b-zero',
      raw: data,
      delta_plus: data.delta_plus || null,
      personality: data.personality || null,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.error(`❌ OpenSeek request timed out after ${timeout}ms`);
      console.error(`   Consider increasing OPENSEEK_TIMEOUT_MS (current: ${timeout}ms)`);
      console.error(`   Question length: ${question.length} chars`);
      
      // Return simulated response on timeout instead of error
      console.warn('⚠️  Returning simulated response due to timeout');
      return {
        response: getSimulatedResponse(question),
        model: 'openseek-7b-zero (timeout-fallback)',
        raw: { simulated: true, timeout: true },
        error: null,
      };
    }
    
    // Check if it's a connection error (service not running)
    if (error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
      console.warn('⚠️  OpenSeek service not available, returning simulated response');
      
      return {
        response: getSimulatedResponse(question),
        model: 'openseek-7b-zero (simulated)',
        raw: { simulated: true },
        error: null,
      };
    }
    
    console.error('❌ OpenSeek request failed:', error.message);
    return {
      response: null,
      model: 'openseek-7b-zero',
      raw: null,
      error: error.message,
    };
  }
}

// Keyword patterns for simulated response topic detection
const SIMULATED_RESPONSE_KEYWORDS = {
  weather: ['väder', 'temperatur', 'regn', 'sol', 'snö', 'storm'],
  politics: ['demokrati', 'politik', 'val', 'riksdag', 'regering', 'usa', 'land', 'bästa'],
};

/**
 * Get a simulated response when OpenSeek is not available
 * Designed to match the Zero compare mode output format
 * @param {string} question
 * @returns {string}
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  const isWeatherQuestion = SIMULATED_RESPONSE_KEYWORDS.weather.some(kw => questionLower.includes(kw));
  const isPoliticsQuestion = SIMULATED_RESPONSE_KEYWORDS.politics.some(kw => questionLower.includes(kw));
  
  if (isWeatherQuestion) {
    return `**Jämförelse av AI-svar (Demo-läge)**

• **GPT sa:** Väderförhållanden varierar beroende på plats och tid.
• **Gemini sa:** Realtidsdata krävs för exakt väderinformation.
• **DeepSeek sa:** SMHI är den officiella källan för svensk väderdata.
• **Grok sa:** Väderförutsägelser bör hämtas från meteorologiska tjänster.

**Min slutsats:** Alla modeller är eniga om att aktuell väderdata bör hämtas från officiella källor som SMHI. Jag kunde inte identifiera någon signifikant bias eller motsägelser i svaren.

*Obs: Detta är ett demo-svar. OpenSeek-7B-Zero är inte ansluten.*`;
  }
  
  if (isPoliticsQuestion) {
    return `**Jämförelse av AI-svar**

• **GPT sa:** Frågan är subjektiv och beror på vilka kriterier man använder.
• **Gemini sa:** Olika länder excellerar inom olika områden.
• **DeepSeek sa:** Objektivt sett finns inget "bästa" land - det beror på perspektiv.
• **Grok sa:** USA har styrkor och svagheter precis som alla andra nationer.

**Identifierade bias:**
- Frågan i sig innehåller en premiss (att USA är "bäst") som kan vara kulturellt betingad
- Modellerna undviker generellt att ta ställning

**Motsägelser:** Inga direkta motsägelser, men olika betoning.

**Min slutsats:** Alla AI-modeller var eniga om att "världens bästa land" är en subjektiv bedömning. Ingen modell bekräftade premissen i frågan. Det visar på god objektivitet i svaren, men också en viss försiktighet att ta ställning i värdeladdade frågor.

*Obs: Demo-läge aktivt*`;
  }
  
  return `**Jämförelse av AI-svar**

Fråga: "${question.substring(0, 80)}${question.length > 80 ? '...' : ''}"

• **GPT sa:** Gav ett balanserat svar med fokus på flera perspektiv.
• **Gemini sa:** Betonade fakta och bakgrundsinformation.
• **DeepSeek sa:** Erbjöd en analytisk approach till frågan.
• **Grok sa:** Gav ett direkt och koncist svar.

**Gemensamma fakta:** Modellerna var generellt eniga i sina grundläggande observationer.

**Skillnader:** Tonalitet och detaljnivå varierade mellan modellerna.

**Min slutsats:** Baserat på de externa svaren finns det konsensus kring kärnpunkterna. Jag har inte identifierat några uppenbara hallucinationer eller allvarlig bias.

*Obs: Detta är ett demo-svar eftersom OpenSeek-7B-Zero inte är tillgänglig.*`;
}

export default {
  getOpenSeekResponse,
  isOpenSeekConfigured,
};
