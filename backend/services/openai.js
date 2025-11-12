import OpenAI from 'openai';

/**
 * OpenAI Service
 * Handles communication with OpenAI GPT-3.5 model
 */

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Get response from GPT-3.5
 * @param {string} question - User's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getOpenAIResponse(question) {
  if (!openai) {
    console.warn('⚠️  OpenAI API key not configured');
    return {
      response: '[MVP Demo] Detta är ett simulerat svar från GPT-3.5. Konfigurera OPENAI_API_KEY i .env för riktiga svar.\n\nFrågan var: ' + question,
      model: 'gpt-3.5-turbo (simulated)',
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
