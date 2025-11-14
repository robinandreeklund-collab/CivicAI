import express from 'express';
import { getOpenAIResponse } from '../services/openai.js';
import { getGeminiResponse } from '../services/gemini.js';
import { getDeepSeekResponse } from '../services/deepseek.js';
import { getGrokResponse } from '../services/grok.js';
import { getQwenResponse } from '../services/qwen.js';
import { analyzeTone, getToneDescription } from '../utils/analyzeTone.js';
import { detectBias } from '../utils/detectBias.js';
import { checkFacts } from '../utils/checkFacts.js';
import { generateSynthesizedSummary } from '../utils/generateSummary.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';
import { 
  performCompleteMetaAnalysis, 
  performGPTMetaReview,
  generateMetaAnalysisSummary 
} from '../services/metaAnalysis.js';
import { batchFactCheck, compareFactChecks } from '../services/factChecker.js';

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
    // Maximum length validation (e.g., 5000 characters)
    if (question.length > 5000) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is too long. Maximum allowed length is 5000 characters.'
      });
    }

    console.log(`📝 Processing question: ${question.length > 50 ? question.substring(0, 50) + '...' : question}`);

    // Log audit event
    logAuditEvent(AuditEventType.QUESTION_ASKED, {
      question: question.substring(0, 100),
      questionLength: question.length,
    });

    // Call all AI services in parallel
    const [gptResponse, geminiResponse, deepseekResponse, grokResponse, qwenResponse] = await Promise.allSettled([
      getOpenAIResponse(question),
      getGeminiResponse(question),
      getDeepSeekResponse(question),
      getGrokResponse(question),
      getQwenResponse(question),
    ]);

    // Process responses
    const responses = [];

    if (gptResponse.status === 'fulfilled') {
      const responseText = gptResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

      responses.push({
        agent: 'gpt-3.5',
        response: responseText,
        metadata: {
          model: gptResponse.value.model,
          timestamp: new Date().toISOString(),
        },
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
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
      const responseText = geminiResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

      responses.push({
        agent: 'gemini',
        response: responseText,
        metadata: {
          model: geminiResponse.value.model,
          timestamp: new Date().toISOString(),
        },
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
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

    if (deepseekResponse.status === 'fulfilled') {
      const responseText = deepseekResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

      responses.push({
        agent: 'deepseek',
        response: responseText,
        metadata: {
          model: deepseekResponse.value.model,
          timestamp: new Date().toISOString(),
        },
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
      });
    } else {
      console.error('DeepSeek error:', deepseekResponse.reason);
      responses.push({
        agent: 'deepseek',
        response: 'Fel: Kunde inte hämta svar från DeepSeek. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (grokResponse.status === 'fulfilled') {
      const responseText = grokResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

      responses.push({
        agent: 'grok',
        response: responseText,
        metadata: {
          model: grokResponse.value.model,
          timestamp: new Date().toISOString(),
        },
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
      });
    } else {
      console.error('Grok error:', grokResponse.reason);
      responses.push({
        agent: 'grok',
        response: 'Fel: Kunde inte hämta svar från Grok. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    if (qwenResponse.status === 'fulfilled') {
      const responseText = qwenResponse.value.response;
      const toneAnalysis = analyzeTone(responseText);
      const biasAnalysis = detectBias(responseText, question);
      const factCheck = checkFacts(responseText);
      const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

      responses.push({
        agent: 'qwen',
        response: responseText,
        metadata: {
          model: qwenResponse.value.model,
          timestamp: new Date().toISOString(),
        },
        analysis: {
          tone: {
            primary: toneAnalysis.primary,
            description: getToneDescription(toneAnalysis.primary),
            confidence: toneAnalysis.confidence,
            characteristics: toneAnalysis.characteristics,
          },
          bias: biasAnalysis,
          factCheck: factCheck,
        },
        metaAnalysis: metaAnalysis,
        metaSummary: generateMetaAnalysisSummary(metaAnalysis),
      });
    } else {
      console.error('Qwen error:', qwenResponse.reason);
      responses.push({
        agent: 'qwen',
        response: 'Fel: Kunde inte hämta svar från Qwen. Kontrollera API-nyckeln.',
        metadata: {
          error: true,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Perform GPT-3.5 meta-review of all responses
    const gptMetaReview = await performGPTMetaReview(responses, question);

    // Perform Bing Search fact-checking on all responses
    console.log('🔍 Performing Bing Search fact-checking...');
    const factCheckResults = await batchFactCheck(responses);
    const factCheckComparison = compareFactChecks(factCheckResults);

    // Add fact-check results to each response
    responses.forEach((response, index) => {
      if (factCheckResults[index]) {
        response.bingFactCheck = factCheckResults[index];
      }
    });

    // Generate synthesized summary from all responses using BERT
    console.log('📝 Generating synthesized summary with BERT...');
    const synthesizedSummary = await generateSynthesizedSummary(responses, question, factCheckComparison);

    res.json({
      question,
      responses,
      synthesizedSummary,
      metaReview: gptMetaReview,
      factCheckComparison: factCheckComparison,
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
