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
    maxTokens = null,  // Will be determined based on personality
    temperature = 0.7,
    streamThinking = true,
  } = options;
  
  // Set higher token limits for Socionomen to avoid truncation
  // Default is 512, but Socionomen needs more for full legal text
  let actualMaxTokens = maxTokens;
  if (!actualMaxTokens) {
    if (overridePersonality === 'socionomen' || overridePersonality === 'oneseek-socionomen') {
      actualMaxTokens = 1600;  // Elevated default for Socionomen
    } else {
      actualMaxTokens = 512;  // Standard default
    }
  }

  const baseUrl = getMLServiceURL();
  const endpoint = `${baseUrl}/inference/personality`;
  
  const payload = {
    text: message,
    max_length: actualMaxTokens,
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
 * Handle follow-up action (e.g., search prejudikat for Socionomen)
 * 
 * @param {Object} followUpOption - The selected follow-up option
 * @param {string} followUpOption.id - Option ID
 * @param {string} followUpOption.action - Action to perform
 * @param {Object} followUpOption.parameters - Action parameters
 * @returns {Promise<Object>} Response with new answer based on follow-up
 */
export async function handleFollowUpAction(followUpOption) {
  const { action, parameters } = followUpOption;
  
  // If decline, just return acknowledgment
  if (action === 'decline_followup') {
    return {
      response: "Okej, du kan ställa en ny fråga om du vill ha mer information.",
      personality: parameters.personality || 'socionomen',
      thinking_chain: [],
      follow_up_options: null
    };
  }
  
  // If search_prejudikat, create a new query to search for case law
  if (action === 'search_prejudikat') {
    const { paragraf, lag_namn, personality } = parameters;
    
    // Generate a natural search query
    const searchQuery = `Sök efter domar och prejudikat om ${paragraf} i ${lag_namn}`;
    
    // Call personality inference with context that we're following up
    const response = await sendPersonalityChatMessage(searchQuery, {
      overridePersonality: personality,
      maxTokens: 1200  // Allow more tokens for case law summaries
    });
    
    return response;
  }
  
  throw new Error(`Unknown follow-up action: ${action}`);
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
