/**
 * OpenSeek Service
 * 
 * Wrapper for calling local OpenSeek inference endpoint.
 * 
 * Configuration:
 * - OPENSEEK_API_URL: URL for the OpenSeek inference endpoint (default: http://localhost:5000)
 * - OPENSEEK_API_KEY: Optional API key for authentication
 */

const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_MAX_TOKENS = 512;

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
      console.error('❌ OpenSeek request timed out');
      return {
        response: null,
        model: 'openseek-7b-zero',
        raw: null,
        error: `OpenSeek request timed out after ${timeout}ms`,
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
  politics: ['demokrati', 'politik', 'val', 'riksdag', 'regering'],
};

/**
 * Get a simulated response when OpenSeek is not available
 * @param {string} question
 * @returns {string}
 */
function getSimulatedResponse(question) {
  const questionLower = question.toLowerCase();
  
  const isWeatherQuestion = SIMULATED_RESPONSE_KEYWORDS.weather.some(kw => questionLower.includes(kw));
  const isPoliticsQuestion = SIMULATED_RESPONSE_KEYWORDS.politics.some(kw => questionLower.includes(kw));
  
  if (isWeatherQuestion) {
    return `Just nu kan jag inte hämta väderdata i demo-läge.

**Sammanfattning från andra AI-modeller:**
Baserat på den kontext jag fick kan jag se att flera modeller har gett svar om detta ämne. 

Det verkar finnas konsensus kring de grundläggande fakta, men jag rekommenderar att du dubbelkollar med officiella källor som SMHI för aktuell väderinformation.

**Källa:** Demo-läge (OpenSeek-7B-Zero)`;
  }
  
  if (isPoliticsQuestion) {
    return `Tack för din fråga om demokrati och politik.

**Min syntes baserad på andra modellers svar:**
Demokrati är ett statsskick där makten utgår från folket. De viktigaste principerna inkluderar:

• Fria och rättvisa val
• Yttrandefrihet och pressfrihet  
• Rättsstatens principer
• Maktdelning

Jag har analyserat svaren från GPT, Gemini och DeepSeek och finner att de är eniga om grundprinciperna, även om de betonar olika aspekter.

**Källa:** Demo-läge (OpenSeek-7B-Zero)`;
  }
  
  return `Tack för din fråga: "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}"

**Min analys baserad på extern kontext:**
Jag har tagit del av svar från flera AI-modeller och sammanställt en övergripande bild.

De olika perspektiven visar på både konsensus och nyanser i hur frågan kan besvaras. För mer detaljerad information rekommenderar jag att konsultera specialiserade källor.

**Källa:** Demo-läge (OpenSeek-7B-Zero)`;
}

export default {
  getOpenSeekResponse,
  isOpenSeekConfigured,
};
