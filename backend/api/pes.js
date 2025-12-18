/**
 * PES (Prompt Evolution System) API
 * Provides REST endpoints for PES operations
 */

import express from 'express';
import {
  createAndTestPromptVersion,
  runSimulationForPrompt,
  compareAndRecommend,
  getRecommendedPrompt,
  generatePerformanceReport
} from '../../PES/core/orchestrator.js';
import {
  getDebates,
  getPromptVersions,
  getAllSimulations,
  getSimulationsByPromptVersion
} from '../../PES/services/pesFirebaseService.js';

const router = express.Router();

/**
 * GET /api/pes/status
 * Get PES system status
 */
router.get('/status', async (req, res) => {
  try {
    const debates = await getDebates({ limit: 1 });
    const promptVersions = await getPromptVersions({ limit: 1 });
    const simulations = await getAllSimulations({ limit: 1 });
    
    res.json({
      status: 'operational',
      data_available: {
        debates: debates.length > 0,
        prompt_versions: promptVersions.length > 0,
        simulations: simulations.length > 0
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PES API] Error checking status:', error);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * GET /api/pes/debates
 * Get debates for PES training
 */
router.get('/debates', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100; // Increased default to show all debates
    const status = req.query.status; // Only filter if explicitly provided
    
    const options = { limit };
    if (status) {
      options.status = status;
    }
    
    const debates = await getDebates(options);
    
    res.json({
      debates,
      total: debates.length,
      filter: options
    });
  } catch (error) {
    console.error('[PES API] Error fetching debates:', error);
    res.status(500).json({
      error: 'Failed to fetch debates',
      message: error.message
    });
  }
});

/**
 * POST /api/pes/debates
 * Save a completed debate to Firebase (called from Python ML service)
 */
router.post('/debates', async (req, res) => {
  try {
    const debateData = req.body;
    
    if (!debateData || !debateData.debate_id || !debateData.question) {
      return res.status(400).json({
        error: 'Invalid debate data',
        message: 'debate_id and question are required'
      });
    }
    
    console.log(`[PES API] Saving debate ${debateData.debate_id} to Firebase...`);
    
    // Import Firebase service dynamically to save debate
    const { saveDebate } = await import('../../PES/services/pesFirebaseService.js');
    await saveDebate(debateData);
    
    console.log(`[PES API] ✅ Debate ${debateData.debate_id} saved successfully`);
    
    res.status(201).json({
      success: true,
      debate_id: debateData.debate_id,
      message: 'Debate saved to Firebase'
    });
  } catch (error) {
    console.error('[PES API] Error saving debate:', error);
    res.status(500).json({
      error: 'Failed to save debate',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/prompts
 * Get all prompt versions
 */
router.get('/prompts', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const topic = req.query.topic;
    const status = req.query.status;
    
    const prompts = await getPromptVersions({ limit, topic, status });
    
    res.json({
      prompts,
      total: prompts.length,
      filter: { limit, topic, status }
    });
  } catch (error) {
    console.error('[PES API] Error fetching prompts:', error);
    res.status(500).json({
      error: 'Failed to fetch prompts',
      message: error.message
    });
  }
});

/**
 * POST /api/pes/prompts
 * Create a new prompt version
 */
router.post('/prompts', async (req, res) => {
  try {
    const { promptText, version, topic, metadata, runSimulation } = req.body;
    
    if (!promptText || !version) {
      return res.status(400).json({
        error: 'promptText and version are required'
      });
    }
    
    const result = await createAndTestPromptVersion({
      promptText,
      version,
      topic: topic || 'general',
      metadata: metadata || {}
    }, runSimulation !== false); // Default to true
    
    res.status(201).json({
      success: true,
      promptVersion: result.promptVersion,
      simulation: result.simulation
    });
  } catch (error) {
    console.error('[PES API] Error creating prompt:', error);
    res.status(500).json({
      error: 'Failed to create prompt',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/simulations
 * Get all simulations
 */
router.get('/simulations', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const promptId = req.query.promptId;
    
    let simulations;
    if (promptId) {
      simulations = await getSimulationsByPromptVersion(promptId, { limit });
    } else {
      simulations = await getAllSimulations({ limit });
    }
    
    res.json({
      simulations,
      total: simulations.length,
      filter: { limit, promptId }
    });
  } catch (error) {
    console.error('[PES API] Error fetching simulations:', error);
    res.status(500).json({
      error: 'Failed to fetch simulations',
      message: error.message
    });
  }
});

/**
 * POST /api/pes/simulations
 * Run a simulation for a prompt
 */
router.post('/simulations', async (req, res) => {
  try {
    const { promptId, debateCount } = req.body;
    
    if (!promptId) {
      return res.status(400).json({
        error: 'promptId is required'
      });
    }
    
    const result = await runSimulationForPrompt(promptId, {
      debateCount: debateCount || 10
    });
    
    res.status(201).json({
      success: true,
      simulation: result.simulation,
      analysis: result.analysis
    });
  } catch (error) {
    console.error('[PES API] Error running simulation:', error);
    res.status(500).json({
      error: 'Failed to run simulation',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/recommendations/:topic
 * Get recommended prompt for a topic
 */
router.get('/recommendations/:topic?', async (req, res) => {
  try {
    const topic = req.params.topic || null;
    
    const result = await getRecommendedPrompt(topic);
    
    res.json(result);
  } catch (error) {
    console.error('[PES API] Error getting recommendation:', error);
    res.status(500).json({
      error: 'Failed to get recommendation',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/report
 * Generate performance report
 */
router.get('/report', async (req, res) => {
  try {
    const topic = req.query.topic || null;
    
    const report = await generatePerformanceReport(topic);
    
    res.json(report);
  } catch (error) {
    console.error('[PES API] Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * POST /api/pes/compare
 * Compare two prompt versions
 */
router.post('/compare', async (req, res) => {
  try {
    const { promptId1, promptId2 } = req.body;
    
    if (!promptId1 || !promptId2) {
      return res.status(400).json({
        error: 'promptId1 and promptId2 are required'
      });
    }
    
    const result = await compareAndRecommend(promptId1, promptId2);
    
    res.json(result);
  } catch (error) {
    console.error('[PES API] Error comparing prompts:', error);
    res.status(500).json({
      error: 'Failed to compare prompts',
      message: error.message
    });
  }
});

export default router;
