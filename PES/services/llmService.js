/**
 * PES LLM Service
 * 
 * Standalone service for PES to use external LLMs for analysis and generation
 * Currently supports OpenAI GPT models
 */

import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Generate response using LLM
 * @param {string} prompt - The prompt to send
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Generated text
 */
export async function generateWithLLM(prompt, options = {}) {
  const {
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    max_tokens = 2000,
    response_format = null
  } = options;

  console.log(`[PES LLM] Generating with ${model}...`);

  // Check if OpenAI is configured
  if (!openai) {
    console.warn('[PES LLM] OpenAI not configured, using mock response');
    return generateMockResponse(prompt, options);
  }

  try {
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ];

    const requestOptions = {
      model: model,
      messages: messages,
      temperature: temperature,
      max_tokens: max_tokens
    };

    // Add response format if specified (for JSON mode)
    if (response_format) {
      requestOptions.response_format = response_format;
    }

    const response = await openai.chat.completions.create(requestOptions);

    const text = response.choices[0]?.message?.content || '';
    
    console.log(`[PES LLM] Response received (${text.length} chars)`);

    return text;
  } catch (error) {
    console.error('[PES LLM] Error generating response:', error.message);
    
    // Fallback to mock if API fails
    console.warn('[PES LLM] Falling back to mock response');
    return generateMockResponse(prompt, options);
  }
}

/**
 * Generate a mock/fallback response when OpenAI is not available
 * @param {string} prompt - Original prompt
 * @param {Object} options - Options
 * @returns {string} Mock response
 */
function generateMockResponse(prompt, options) {
  console.log('[PES LLM] Generating mock response...');

  // Check if JSON format is requested
  if (options.response_format?.type === 'json_object') {
    // Return a basic JSON structure based on the prompt type
    
    if (prompt.includes('analyze') || prompt.includes('Analyze')) {
      return JSON.stringify({
        effectiveness_score: 7,
        successful_elements: [
          "Clear structure and organization",
          "Use of data and evidence",
          "Balanced perspective"
        ],
        unsuccessful_elements: [
          "Could be more concise",
          "Some technical jargon"
        ],
        synthesis_approach: "Comprehensive analysis with multiple perspectives",
        voter_preferences: "Clarity and evidence-based reasoning",
        improvement_suggestions: [
          "Simplify language",
          "Add more concrete examples",
          "Strengthen conclusions"
        ]
      }, null, 2);
    } else if (prompt.includes('Generate') || prompt.includes('variants')) {
      return JSON.stringify({
        variants: [
          {
            prompt_text: "You are ONESEEK, an AI that synthesizes multiple perspectives with clarity and evidence.",
            hypothesis: "Emphasizing clarity and evidence improves vote count",
            expected_improvement: "+15% votes",
            changes_summary: "Focus on clear communication and data",
            strategic_focus: ["clarity", "evidence"]
          },
          {
            prompt_text: "You are ONESEEK, an AI that provides balanced synthesis of different viewpoints.",
            hypothesis: "Balanced approach increases trust and mentions",
            expected_improvement: "+20% mentions",
            changes_summary: "Emphasis on balance and fairness",
            strategic_focus: ["balance", "synthesis"]
          }
        ]
      }, null, 2);
    } else if (prompt.includes('successful_patterns')) {
      return JSON.stringify({
        successful_patterns: [
          "Data-driven arguments",
          "Clear structure with bullet points",
          "Acknowledging multiple perspectives"
        ],
        weaknesses: [
          "Sometimes too verbose",
          "Could be more decisive"
        ],
        winning_styles: [
          "Evidence-based synthesis",
          "Balanced analysis"
        ],
        strategic_recommendations: [
          "Maintain clarity while being concise",
          "Lead with strongest evidence",
          "Provide clear takeaways"
        ],
        question_type_insights: {
          "politics": "Balance and fairness most valued",
          "science": "Data and evidence critical",
          "general": "Clarity and structure important"
        }
      }, null, 2);
    }
  }

  // Default text response
  return "Mock LLM response: Analysis completed successfully. The data shows several patterns that could inform improvements. Consider focusing on clarity, evidence-based reasoning, and balanced synthesis.";
}

/**
 * Check if LLM service is available
 * @returns {boolean}
 */
export function isLLMAvailable() {
  return !!openai;
}

/**
 * Get LLM service status
 * @returns {Object}
 */
export function getLLMStatus() {
  return {
    available: !!openai,
    provider: 'OpenAI',
    configured: !!process.env.OPENAI_API_KEY,
    fallback_enabled: true
  };
}

export default {
  generateWithLLM,
  isLLMAvailable,
  getLLMStatus
};
