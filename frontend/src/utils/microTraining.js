/**
 * Micro-Training Utility
 * Helper function to trigger micro-training from any page
 * Calls micro-training endpoint in background without blocking UI
 */

/**
 * Trigger micro-training for a question
 * @param {string} question - The user's question
 * @param {Array} rawResponses - Array of {model, response} from AI services
 * @param {object} analyzedData - Optional analyzed data (consensus, bias, fairness)
 * @returns {Promise<object>} Training result or null if failed
 */
export async function triggerMicroTraining(question, rawResponses = [], analyzedData = null) {
  try {
    // Don't trigger if no question or responses
    if (!question || !rawResponses || rawResponses.length === 0) {
      console.log('[MicroTraining] Skipping - no question or responses provided');
      return null;
    }

    // Detect language (simple heuristic - check for Swedish characters)
    const swedishChars = /[åäöÅÄÖ]/;
    const detectedLanguage = swedishChars.test(question) ? 'sv' : 'en';

    console.log(`[MicroTraining] Triggering for language: ${detectedLanguage}`);

    const response = await fetch('/api/training/micro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        language: detectedLanguage,
        rawResponses: rawResponses.map(r => ({
          model: r.service || r.model || 'unknown',
          response: r.response || r.text || '',
        })),
        analyzedData: analyzedData ? {
          consensus: analyzedData.consensus || 0.5,
          bias: analyzedData.bias || 0.1,
          fairness: analyzedData.fairness || 0.9,
          metaSummary: analyzedData.metaSummary || {},
        } : null,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[MicroTraining] Success:', data);
      return data;
    } else {
      const errorData = await response.json();
      console.warn('[MicroTraining] Failed:', errorData);
      return null;
    }
  } catch (error) {
    console.error('[MicroTraining] Error:', error);
    return null;
  }
}

/**
 * Trigger micro-training in background (non-blocking)
 * Fire-and-forget version that doesn't wait for response
 */
export function triggerMicroTrainingAsync(question, rawResponses = [], analyzedData = null) {
  // Call async without awaiting
  triggerMicroTraining(question, rawResponses, analyzedData).catch(err => {
    console.error('[MicroTraining] Async error:', err);
  });
}

export default {
  triggerMicroTraining,
  triggerMicroTrainingAsync,
};
