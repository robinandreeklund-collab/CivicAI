/**
 * External AI Services API
 * Simple HTTP endpoints for debate functionality to call external AI services
 */

import express from 'express';
import { getOpenAIResponse } from '../services/openai.js';
import { getGeminiResponse } from '../services/gemini.js';
import { getDeepSeekResponse } from '../services/deepseek.js';
import { getGrokResponse } from '../services/grok.js';

const router = express.Router();

/**
 * POST /api/external/openai
 * Get response from OpenAI GPT
 */
router.post('/openai', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string'
      });
    }
    
    const result = await getOpenAIResponse(question);
    res.json(result);
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({
      error: 'Service error',
      message: error.message,
      response: 'Kunde inte hämta svar från GPT.'
    });
  }
});

/**
 * POST /api/external/gemini
 * Get response from Google Gemini
 */
router.post('/gemini', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string'
      });
    }
    
    const result = await getGeminiResponse(question);
    res.json(result);
  } catch (error) {
    console.error('Error calling Gemini:', error);
    res.status(500).json({
      error: 'Service error',
      message: error.message,
      response: 'Kunde inte hämta svar från Gemini.'
    });
  }
});

/**
 * POST /api/external/deepseek
 * Get response from DeepSeek
 */
router.post('/deepseek', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string'
      });
    }
    
    const result = await getDeepSeekResponse(question);
    res.json(result);
  } catch (error) {
    console.error('Error calling DeepSeek:', error);
    res.status(500).json({
      error: 'Service error',
      message: error.message,
      response: 'Kunde inte hämta svar från DeepSeek.'
    });
  }
});

/**
 * POST /api/external/grok
 * Get response from X.AI Grok
 */
router.post('/grok', async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string'
      });
    }
    
    const result = await getGrokResponse(question);
    res.json(result);
  } catch (error) {
    console.error('Error calling Grok:', error);
    res.status(500).json({
      error: 'Service error',
      message: error.message,
      response: 'Kunde inte hämta svar från Grok.'
    });
  }
});

export default router;
