/**
 * WebSocket Service for Personality-Based Inference
 * Handles real-time streaming of personality pipeline steps
 */

import { getMLServiceURL } from '../config/backend';

/**
 * Send a personality-based chat message via WebSocket with streaming updates
 * 
 * @param {string} message - User's message
 * @param {Object} options - Options for the request
 * @param {Function} options.onThinking - Callback for thinking steps
 * @param {Function} options.onFinal - Callback for final response
 * @param {Function} options.onError - Callback for errors
 * @param {string} options.overridePersonality - Manual personality override
 * @param {Array} options.history - Conversation history
 * @param {number} options.maxTokens - Max tokens to generate
 * @param {number} options.temperature - Temperature for sampling
 * @returns {Promise<WebSocket>} WebSocket connection
 */
export async function sendPersonalityMessageViaWebSocket(message, options = {}) {
  const {
    onThinking = () => {},
    onFinal = () => {},
    onError = () => {},
    overridePersonality = null,
    history = null,
    maxTokens = 512,
    temperature = 0.7,
  } = options;

  // Get WebSocket URL
  const baseUrl = getMLServiceURL();
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
  const endpoint = `${wsUrl}/ws/personality`;

  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(endpoint);

      ws.onopen = () => {
        console.log('[PersonalityWS] Connection established');
        
        // Send initial request
        const payload = {
          text: message,
          max_length: maxTokens,
          temperature,
        };

        if (overridePersonality) {
          payload.override_personality = overridePersonality;
        }

        if (history) {
          payload.history = history;
        }

        ws.send(JSON.stringify(payload));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'thinking') {
            // Progressive thinking step
            onThinking({
              step: data.step,
              message: data.message,
              data: data.data || {}
            });
          } else if (data.type === 'final') {
            // Final response
            onFinal(data);
            ws.close();
            resolve(data);
          } else if (data.type === 'error') {
            // Error
            onError(data.message);
            ws.close();
            reject(new Error(data.message));
          }
        } catch (e) {
          console.error('[PersonalityWS] Error parsing message:', e);
          onError('Failed to parse server message');
        }
      };

      ws.onerror = (error) => {
        console.error('[PersonalityWS] WebSocket error:', error);
        onError('WebSocket connection error');
        reject(error);
      };

      ws.onclose = (event) => {
        console.log('[PersonalityWS] Connection closed', event.code, event.reason);
        if (event.code !== 1000 && event.code !== 1001) {
          // Abnormal closure
          onError(`Connection closed unexpectedly (code: ${event.code})`);
        }
      };

    } catch (error) {
      console.error('[PersonalityWS] Error creating WebSocket:', error);
      reject(error);
    }
  });
}

/**
 * Check if WebSocket is supported by the browser
 * 
 * @returns {boolean} True if WebSocket is supported
 */
export function isWebSocketSupported() {
  return typeof WebSocket !== 'undefined';
}

export default {
  sendPersonalityMessageViaWebSocket,
  isWebSocketSupported,
};
