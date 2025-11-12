import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini Service
 * Handles communication with Google Gemini model
 */

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Get response from Gemini
 * @param {string} question - User's question
 * @returns {Promise<{response: string, model: string}>}
 */
export async function getGeminiResponse(question) {
  if (!genAI) {
    console.warn('⚠️  Gemini API key not configured');
    return {
      response: '[MVP Demo] Detta är ett simulerat svar från Gemini. Konfigurera GEMINI_API_KEY i .env för riktiga svar.\n\nFrågan var: ' + question,
      model: 'gemini-2.5-flash (simulated)',
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Du är en hjälpsam assistent som svarar på frågor på svenska med tydlighet och transparens. Ge balanserade och väl underbyggda svar.\n\nFråga: ${question}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return {
      response: text,
      model: 'gemini-2.5-flash',
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error(`Gemini API failed: ${error.message}`);
  }
}
