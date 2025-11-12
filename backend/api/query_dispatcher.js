import express from 'express';
import { getOpenAIResponse } from '../services/openai.js';
import { getGeminiResponse } from '../services/gemini.js';

const router = express.Router();

/**
 * POST /api/query
 * Dispatches a question to multiple AI models and returns their responses
 */
router.post('/query', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string' 
      });
    }

    console.log(`📝 Processing question: ${question.substring(0, 50)}...`);

    // Call both AI services in parallel
    const [gptResponse, geminiResponse] = await Promise.allSettled([
      getOpenAIResponse(question),
      getGeminiResponse(question),
    ]);

    // Process responses
    const responses = [];

    if (gptResponse.status === 'fulfilled') {
      responses.push({
        agent: 'gpt-3.5',
        response: gptResponse.value.response,
        metadata: {
          model: gptResponse.value.model,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.error('GPT-3.5 error:', gptResponse.reason);
      responses.push({
        agent: 'gpt-3.5',
        response: 'Fel: Kunde inte hämta svar från GPT-3.5. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (geminiResponse.status === 'fulfilled') {
      responses.push({
        agent: 'gemini',
        response: geminiResponse.value.response,
        metadata: {
          model: geminiResponse.value.model,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      console.error('Gemini error:', geminiResponse.reason);
      responses.push({
        agent: 'gemini',
        response: 'Fel: Kunde inte hämta svar från Gemini. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      question,
      responses,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in query dispatcher:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
