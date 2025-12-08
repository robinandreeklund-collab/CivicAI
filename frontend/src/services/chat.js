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

export default {
  sendChatMessage,
};
