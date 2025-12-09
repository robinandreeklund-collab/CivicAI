/**
 * Chat Service for CivicAI Frontend
 * Handles communication with ML backend (GGUF or .bin)
 */

import { getMLServiceURL, getInferenceEndpoint, isGGUFActive } from '../config/backend';

/**
 * Send a chat message to the ML backend
 * 
 * @param {string} message - User's message
 * @param {Object} options - Additional options
 * @param {string} options.systemPrompt - Custom system prompt (optional)
 * @param {number} options.maxTokens - Max tokens to generate (default: 512)
 * @param {number} options.temperature - Temperature for sampling (default: 0.7)
 * @param {number} options.topP - Top-p sampling (default: 0.9)
 * @returns {Promise<Object>} Response from ML backend
 */
export async function sendChatMessage(message, options = {}) {
  const {
    systemPrompt = null,
    maxTokens = 512,
    temperature = 0.7,
    topP = 0.9,
  } = options;

  const endpoint = getInferenceEndpoint();
  
  // Build request payload based on backend type
  let payload;
  
  if (isGGUFActive()) {
    // GGUF uses OpenAI-compatible chat completions format
    const messages = [];
    
    // System prompt is handled by backend, but can be overridden
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: message
    });
    
    payload = {
      messages,
      max_tokens: maxTokens,
      temperature,
      top_p: topP,
    };
  } else {
    // Legacy .bin backend uses OneSeek inference format
    payload = {
      text: message,
      max_length: maxTokens,
      temperature,
      top_p: topP,
    };
    
    if (systemPrompt) {
      payload.system_prompt = systemPrompt;
    }
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Normalize response format
    if (isGGUFActive()) {
      // Extract from OpenAI format
      if (data.choices && data.choices.length > 0) {
        return {
          response: data.choices[0].message.content,
          model: data.model || 'gguf',
          tokens: data.usage?.total_tokens || 0,
          latency_ms: 0, // Not provided by OpenAI format
        };
      }
    }
    
    // Legacy .bin format (already normalized)
    return data;
  } catch (error) {
    console.error('[ChatService] Error:', error);
    throw error;
  }
}

/**
 * Send a chat message using personality-based inference
 * 
 * @param {string} message - User's message
 * @param {Object} options - Additional options
 * @param {string} options.overridePersonality - Manual personality ID override (optional)
 * @param {Array} options.history - Conversation history (optional)
 * @param {number} options.maxTokens - Max tokens to generate (default: 512)
 * @param {number} options.temperature - Temperature for sampling (default: 0.7)
 * @param {boolean} options.streamThinking - Stream thinking steps (default: true)
 * @returns {Promise<Object>} Response with personality info and thinking chain
 */
export async function sendPersonalityChatMessage(message, options = {}) {
  const {
    overridePersonality = null,
    history = null,
    maxTokens = 512,
    temperature = 0.7,
    streamThinking = true,
  } = options;

  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/inference/personality`;
  
  const payload = {
    text: message,
    max_length: maxTokens,
    temperature,
    stream_thinking: streamThinking,
  };
  
  if (overridePersonality) {
    payload.override_personality = overridePersonality;
  }
  
  if (history) {
    payload.history = history;
  }
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[ChatService] Personality inference error:', error);
    throw error;
  }
}

/**
 * Get current personality
 * 
 * @returns {Promise<Object>} Current personality info
 */
export async function getCurrentPersonality() {
  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/api/ml/personality/current`;
  
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[ChatService] Get personality error:', error);
    throw error;
  }
}

/**
 * Override personality selection
 * 
 * @param {string} personalityId - Personality ID to use
 * @returns {Promise<Object>} Success status
 */
export async function overridePersonality(personalityId) {
  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/api/ml/personality/override`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ personality_id: personalityId }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[ChatService] Override personality error:', error);
    throw error;
  }
}

/**
 * Reset personality selection
 * 
 * @returns {Promise<Object>} Success status
 */
export async function resetPersonality() {
  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/api/ml/personality/reset`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[ChatService] Reset personality error:', error);
    throw error;
  }
}

/**
 * Get personality catalog
 * 
 * @returns {Promise<Object>} Full personality catalog
 */
export async function getPersonalityCatalog() {
  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/api/ml/personality/catalog`;
  
  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('[ChatService] Get catalog error:', error);
    throw error;
  }
}

export default {
  sendChatMessage,
  sendPersonalityChatMessage,
  getCurrentPersonality,
  overridePersonality,
  resetPersonality,
  getPersonalityCatalog,
};
