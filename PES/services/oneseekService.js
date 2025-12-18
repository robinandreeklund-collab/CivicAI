/**
 * PES ONESEEK Service
 * 
 * Standalone service for PES to communicate with ONESEEK model
 * This is the ONLY external dependency for PES - communication with the model
 */

const DEFAULT_TIMEOUT_MS = 120000; // 2 minutes
const ONESEEK_URL = process.env.OPENSEEK_API_URL || 'http://localhost:5000';

/**
 * Generate response from ONESEEK model
 * @param {string} prompt - The prompt to send to ONESEEK
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Response from ONESEEK
 */
export async function generateWithOneseek(prompt, options = {}) {
  const {
    max_tokens = 512,
    temperature = 0.7,
    timeout = DEFAULT_TIMEOUT_MS,
    context = null
  } = options;

  console.log(`[PES ONESEEK] Generating response (${prompt.length} chars)...`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestBody = {
      question: prompt,
      max_tokens: max_tokens,
      temperature: temperature,
      stream: false
    };

    // Add context if provided
    if (context) {
      requestBody.context = context;
    }

    const response = await fetch(`${ONESEEK_URL}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`ONESEEK API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`[PES ONESEEK] Response received (${data.response?.length || 0} chars)`);

    return {
      response: data.response || data.text || '',
      model: 'ONESEEK',
      inference_time_ms: data.inference_time_ms || 0,
      raw: data
    };
  } catch (error) {
    console.error('[PES ONESEEK] Error generating response:', error.message);
    
    if (error.name === 'AbortError') {
      throw new Error('ONESEEK request timed out');
    }
    
    throw error;
  }
}

/**
 * Check if ONESEEK service is available
 * @returns {Promise<boolean>}
 */
export async function checkOneseekAvailability() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${ONESEEK_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    return response.ok;
  } catch (error) {
    console.error('[PES ONESEEK] Service not available:', error.message);
    return false;
  }
}

/**
 * Get ONESEEK model info
 * @returns {Promise<Object>}
 */
export async function getOneseekInfo() {
  try {
    const response = await fetch(`${ONESEEK_URL}/`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error('Failed to get model info');
    }

    return await response.json();
  } catch (error) {
    console.error('[PES ONESEEK] Error getting model info:', error.message);
    return {
      model: 'ONESEEK',
      status: 'unknown'
    };
  }
}

export default {
  generateWithOneseek,
  checkOneseekAvailability,
  getOneseekInfo
};
