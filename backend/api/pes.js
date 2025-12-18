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

// ============================================================================
// PHASE 2: Evolution Loop Endpoints
// ============================================================================

/**
 * POST /api/pes/evolution/start
 * Start a new evolution loop
 */
router.post('/evolution/start', async (req, res) => {
  try {
    const { 
      baseline_prompt, 
      baseline_version, 
      debate_count, 
      variant_count,
      auto_iterate 
    } = req.body;
    
    if (!baseline_prompt) {
      return res.status(400).json({
        error: 'baseline_prompt is required'
      });
    }
    
    // Import evolution orchestrator
    const { runEvolutionLoop } = await import('../../PES/core/evolution-orchestrator.js');
    const { saveEvolution } = await import('../../PES/services/pesFirebaseService.js');
    
    // Generate evolution ID first
    const evolutionId = `evo_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Start evolution loop asynchronously
    const config = {
      evolution_id: evolutionId,
      baseline_prompt,
      baseline_version: baseline_version || 'v1.0.0',
      debate_count: debate_count || 15,
      variant_count: variant_count || 5,
      auto_iterate: auto_iterate || false
    };
    
    // Run in background and save to Firebase
    runEvolutionLoop(config, async (progress) => {
      // Save progress updates to Firebase
      const { updateEvolution } = await import('../../PES/services/pesFirebaseService.js');
      try {
        await updateEvolution(progress.evolution_id, {
          status: progress.status,
          current_step: progress.current_step,
          progress: progress
        });
      } catch (err) {
        console.error('[PES API] Error saving progress:', err);
      }
    })
      .then(async (results) => {
        // Save completed results
        await saveEvolution(results);
        console.log(`[PES API] Evolution ${results.evolution_id} completed successfully`);
      })
      .catch(async (error) => {
        console.error('[PES API] Evolution loop failed:', error);
        // Save failed status
        try {
          const { updateEvolution } = await import('../../PES/services/pesFirebaseService.js');
          await updateEvolution(evolutionId, {
            status: 'failed',
            error: error.message
          });
        } catch (err) {
          console.error('[PES API] Error saving failed status:', err);
        }
      });
    
    res.status(202).json({
      evolution_id: evolutionId,
      status: 'started',
      message: 'Evolution loop started in background',
      estimated_time_minutes: Math.ceil((config.debate_count * config.variant_count * 30) / 60),
      progress_url: `/api/pes/evolution/${evolutionId}/progress`
    });
    
  } catch (error) {
    console.error('[PES API] Error starting evolution:', error);
    res.status(500).json({
      error: 'Failed to start evolution loop',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/evolution/:id/progress
 * Get real-time progress of evolution loop
 */
router.get('/evolution/:id/progress', async (req, res) => {
  try {
    const evolutionId = req.params.id;
    
    const { getEvolution } = await import('../../PES/services/pesFirebaseService.js');
    const evolution = await getEvolution(evolutionId);
    
    if (!evolution) {
      return res.status(404).json({
        error: 'Evolution not found',
        evolution_id: evolutionId
      });
    }
    
    const progress = evolution.progress || {};
    
    res.json({
      evolution_id: evolutionId,
      status: evolution.status,
      current_step: evolution.current_step || 'Unknown',
      progress: {
        steps_completed: progress.steps_completed || 0,
        total_steps: progress.total_steps || 6,
        simulations_completed: progress.simulations_completed || 0,
        simulations_total: progress.simulations_total || 0,
        percentage: progress.simulation_percentage || 0
      },
      estimated_time_remaining_minutes: calculateRemainingTime(progress),
      last_update: evolution.updated_at
    });
    
  } catch (error) {
    console.error('[PES API] Error getting evolution progress:', error);
    res.status(500).json({
      error: 'Failed to get evolution progress',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/evolution/:id/results
 * Get complete results after evolution completes
 */
router.get('/evolution/:id/results', async (req, res) => {
  try {
    const evolutionId = req.params.id;
    
    const { getEvolution } = await import('../../PES/services/pesFirebaseService.js');
    const evolution = await getEvolution(evolutionId);
    
    if (!evolution) {
      return res.status(404).json({
        error: 'Evolution not found',
        evolution_id: evolutionId
      });
    }
    
    res.json({
      evolution_id: evolutionId,
      status: evolution.status,
      timestamp: evolution.timestamp,
      duration_seconds: evolution.duration_seconds,
      config: evolution.config,
      baseline: {
        version: evolution.config?.baseline_version,
        metrics: evolution.baseline_metrics
      },
      variants: evolution.variants_tested || [],
      winner: evolution.winner,
      improvement_percentage: evolution.improvement_percentage,
      report: evolution.report,
      insights: evolution.insights,
      debates_analyzed: evolution.debates_used?.length || 0
    });
    
  } catch (error) {
    console.error('[PES API] Error getting evolution results:', error);
    res.status(500).json({
      error: 'Failed to get evolution results',
      message: error.message
    });
  }
});

/**
 * GET /api/pes/evolutions
 * List all evolution loops
 */
router.get('/evolutions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const { getAllEvolutions } = await import('../../PES/services/pesFirebaseService.js');
    const evolutions = await getAllEvolutions({ limit });
    
    res.json({
      evolutions: evolutions.map(e => ({
        evolution_id: e.evolution_id,
        status: e.status,
        timestamp: e.timestamp,
        duration_seconds: e.duration_seconds,
        winner_version: e.winner?.version,
        improvement: e.improvement_percentage,
        debates_count: e.debates_used?.length || 0
      })),
      total: evolutions.length
    });
    
  } catch (error) {
    console.error('[PES API] Error listing evolutions:', error);
    res.status(500).json({
      error: 'Failed to list evolutions',
      message: error.message
    });
  }
});

/**
 * Calculate estimated remaining time
 * @param {Object} progress - Progress object
 * @returns {number} Estimated minutes remaining
 */
function calculateRemainingTime(progress) {
  if (!progress.simulations_total || !progress.simulations_completed) {
    return 0;
  }
  
  const remaining = progress.simulations_total - progress.simulations_completed;
  const avgTimePerSim = 0.5; // minutes per simulation (estimate)
  
  return Math.ceil(remaining * avgTimePerSim);
}

export default router;
