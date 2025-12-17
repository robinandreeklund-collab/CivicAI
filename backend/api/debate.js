/**
 * Consensus Debate API
 * Endpoints for managing live debates between AI agents
 */

import express from 'express';
import {
  shouldTriggerDebate,
  initiateDebate,
  conductDebateRound,
  conductDebateVoting,
  getDebate,
  getAllDebates,
  getDebatesByQuestion,
  getDebateConfig,
  analyzeWinningAnswer,
} from '../services/consensusDebate.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';

const router = express.Router();

/**
 * GET /api/debate/config
 * Get debate configuration
 */
router.get('/config', (req, res) => {
  try {
    const config = getDebateConfig();
    res.json(config);
  } catch (error) {
    console.error('Error fetching debate config:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/debate/check-trigger
 * Check if debate should be triggered based on model synthesis
 */
router.post('/check-trigger', (req, res) => {
  try {
    const { modelSynthesis } = req.body;
    
    if (!modelSynthesis) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'modelSynthesis is required',
      });
    }
    
    const shouldTrigger = shouldTriggerDebate(modelSynthesis);
    
    res.json({
      shouldTrigger,
      reason: shouldTrigger 
        ? `Consensus: ${modelSynthesis.consensus?.overallConsensus}%` 
        : 'Consensus acceptable',
    });
  } catch (error) {
    console.error('Error checking debate trigger:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/debate/initiate
 * Initiate a new debate
 */
router.post('/initiate', (req, res) => {
  try {
    const { questionId, question, agents, initialResponses, modelSynthesis } = req.body;
    
    console.log('📝 Debate initiation request:', {
      questionId: questionId ? 'present' : 'missing',
      question: question ? 'present' : 'missing',
      agents: agents ? `${agents.length} agents` : 'missing',
      initialResponses: initialResponses ? `${initialResponses.length} responses` : 'missing',
      modelSynthesis: modelSynthesis ? 'present' : 'missing',
    });
    
    if (!questionId || !question || !agents || !initialResponses || !modelSynthesis) {
      const missing = [];
      if (!questionId) missing.push('questionId');
      if (!question) missing.push('question');
      if (!agents) missing.push('agents');
      if (!initialResponses) missing.push('initialResponses');
      if (!modelSynthesis) missing.push('modelSynthesis');
      
      console.error('❌ Missing required fields:', missing.join(', '));
      
      return res.status(400).json({
        error: 'Invalid request',
        message: `Missing required fields: ${missing.join(', ')}`,
      });
    }
    
    if (!Array.isArray(agents) || agents.length === 0) {
      console.error('❌ Invalid agents array');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'agents must be a non-empty array',
      });
    }
    
    const debate = initiateDebate(questionId, question, agents, initialResponses, modelSynthesis);
    console.log('✅ Debate initiated successfully:', debate.id);
    
    res.status(201).json(debate);
  } catch (error) {
    console.error('❌ Error initiating debate:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/debate/:debateId/round
 * Conduct next round of debate
 */
router.post('/:debateId/round', async (req, res) => {
  try {
    const { debateId } = req.params;
    
    if (!debateId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'debateId is required',
      });
    }
    
    const debate = await conductDebateRound(debateId);
    
    res.json(debate);
  } catch (error) {
    console.error('Error conducting debate round:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }
    
    if (error.message.includes('Maximum rounds') || error.message.includes('already completed')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/debate/:debateId/vote
 * Conduct voting for debate
 */
router.post('/:debateId/vote', async (req, res) => {
  try {
    const { debateId } = req.params;
    
    if (!debateId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'debateId is required',
      });
    }
    
    const debate = await conductDebateVoting(debateId);
    
    res.json(debate);
  } catch (error) {
    console.error('Error conducting debate voting:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }
    
    if (error.message.includes('not in voting stage')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/debate/:debateId/analyze-winner
 * Analyze the winning answer with full pipeline
 */
router.post('/:debateId/analyze-winner', async (req, res) => {
  try {
    const { debateId } = req.params;
    
    if (!debateId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'debateId is required',
      });
    }
    
    const winningAnalysis = await analyzeWinningAnswer(debateId);
    
    res.json(winningAnalysis);
  } catch (error) {
    console.error('Error analyzing winning answer:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        error: 'Not found',
        message: error.message,
      });
    }
    
    if (error.message.includes('not completed')) {
      return res.status(400).json({
        error: 'Invalid request',
        message: error.message,
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/debate/:debateId
 * Get debate by ID
 */
router.get('/:debateId', (req, res) => {
  try {
    const { debateId } = req.params;
    
    if (!debateId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'debateId is required',
      });
    }
    
    const debate = getDebate(debateId);
    
    if (!debate) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Debate not found',
      });
    }
    
    res.json(debate);
  } catch (error) {
    console.error('Error fetching debate:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/debate
 * Get all debates or filter by question
 */
router.get('/', (req, res) => {
  try {
    const { questionId } = req.query;
    
    let debates;
    if (questionId) {
      debates = getDebatesByQuestion(questionId);
    } else {
      debates = getAllDebates();
    }
    
    res.json({
      debates,
      total: debates.length,
    });
  } catch (error) {
    console.error('Error fetching debates:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
