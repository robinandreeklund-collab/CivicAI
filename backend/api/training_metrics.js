/**
 * Training Metrics API Endpoints
 * 
 * Provides real-time access to training metrics, including:
 * - Per-model validation losses
 * - Adaptive weight adjustments
 * - Auto-stop status
 * - Live leaderboard data
 */

import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// In-memory cache for training metrics
const metricsCache = new Map();
const CACHE_TTL = 5000; // 5 seconds

/**
 * Helper function to get metrics from cache or load from file
 */
async function getTrainingMetrics(runId) {
  // Check cache first
  const cached = metricsCache.get(runId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  // Load from file
  try {
    const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
    const runDir = path.join(certifiedDir, runId);
    
    // Try to load training_results.json
    const resultsPath = path.join(runDir, 'training_results.json');
    const resultsData = await fs.readFile(resultsPath, 'utf-8');
    const results = JSON.parse(resultsData);
    
    // Try to load live metrics if available
    const liveMetricsPath = path.join(runDir, 'live_metrics.json');
    let liveMetrics = null;
    try {
      const liveData = await fs.readFile(liveMetricsPath, 'utf-8');
      liveMetrics = JSON.parse(liveData);
    } catch (err) {
      // Live metrics file doesn't exist yet
    }
    
    // Combine data
    const metrics = {
      run_id: runId,
      status: results.status || 'completed',
      current_epoch: results.current_epoch || results.epochs,
      total_epochs: results.epochs,
      val_losses: liveMetrics?.val_losses || {},
      weights: liveMetrics?.weights || results.final_weights || {},
      lr_multipliers: liveMetrics?.lr_multipliers || {},
      total_loss: liveMetrics?.total_loss || results.final_loss,
      auto_stop_info: liveMetrics?.auto_stop_info || null,
      progress_percent: liveMetrics?.progress_percent || 100,
      timestamp: liveMetrics?.timestamp || results.timestamp,
      training_history: results.training_history || [],
    };
    
    // Update cache
    metricsCache.set(runId, {
      data: metrics,
      timestamp: Date.now(),
    });
    
    return metrics;
  } catch (error) {
    throw new Error(`Failed to load metrics for run ${runId}: ${error.message}`);
  }
}

/**
 * GET /api/training/:runId/metrics
 * Get current training metrics for a specific run
 */
router.get('/:runId/metrics', async (req, res) => {
  try {
    const { runId } = req.params;
    const metrics = await getTrainingMetrics(runId);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching training metrics:', error);
    res.status(404).json({ 
      error: 'Metrics not found',
      message: error.message 
    });
  }
});

/**
 * GET /api/training/:runId/leaderboard
 * Get live leaderboard data for a specific run
 */
router.get('/:runId/leaderboard', async (req, res) => {
  try {
    const { runId } = req.params;
    const metrics = await getTrainingMetrics(runId);
    
    // Build leaderboard from metrics
    const leaderboard = Object.entries(metrics.weights).map(([model, weight]) => ({
      model_name: model,
      weight_multiplier: weight,
      val_loss: metrics.val_losses[model] || null,
      lr_multiplier: metrics.lr_multipliers[model] || null,
      rank: 0, // Will be set below
    }));
    
    // Sort by validation loss (lower is better)
    leaderboard.sort((a, b) => {
      if (a.val_loss === null) return 1;
      if (b.val_loss === null) return -1;
      return a.val_loss - b.val_loss;
    });
    
    // Assign ranks
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    res.json({
      run_id: runId,
      current_epoch: metrics.current_epoch,
      total_epochs: metrics.total_epochs,
      leaderboard,
      auto_stop_info: metrics.auto_stop_info,
      progress_percent: metrics.progress_percent,
      timestamp: metrics.timestamp,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(404).json({ 
      error: 'Leaderboard not found',
      message: error.message 
    });
  }
});

/**
 * GET /api/training/active
 * Get currently active training runs
 */
router.get('/active', async (req, res) => {
  try {
    const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
    await fs.mkdir(certifiedDir, { recursive: true });
    
    const runs = await fs.readdir(certifiedDir);
    const activeRuns = [];
    
    for (const runId of runs) {
      const runDir = path.join(certifiedDir, runId);
      const stats = await fs.stat(runDir);
      
      if (stats.isDirectory()) {
        try {
          const resultsPath = path.join(runDir, 'training_results.json');
          const resultsData = await fs.readFile(resultsPath, 'utf-8');
          const results = JSON.parse(resultsData);
          
          // Check if run is still active (has live_metrics file modified recently)
          const liveMetricsPath = path.join(runDir, 'live_metrics.json');
          try {
            const liveStats = await fs.stat(liveMetricsPath);
            const ageMs = Date.now() - liveStats.mtimeMs;
            
            // Consider active if updated in last 60 seconds
            if (ageMs < 60000 && results.status !== 'completed') {
              activeRuns.push({
                run_id: runId,
                started_at: results.timestamp,
                current_epoch: results.current_epoch || 0,
                total_epochs: results.epochs,
              });
            }
          } catch (err) {
            // No live metrics file, not active
          }
        } catch (err) {
          // Could not read results, skip
        }
      }
    }
    
    res.json({ active_runs: activeRuns });
  } catch (error) {
    console.error('Error fetching active runs:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active runs',
      message: error.message 
    });
  }
});

/**
 * POST /api/training/:runId/metrics
 * Update live metrics for a training run (called by training process)
 */
router.post('/:runId/metrics', async (req, res) => {
  try {
    const { runId } = req.params;
    const metrics = req.body;
    
    // Validate required fields
    if (!metrics.epoch) {
      return res.status(400).json({ error: 'Missing required field: epoch' });
    }
    
    const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
    const runDir = path.join(certifiedDir, runId);
    await fs.mkdir(runDir, { recursive: true });
    
    // Add timestamp
    metrics.timestamp = new Date().toISOString();
    
    // Write metrics using atomic write
    const liveMetricsPath = path.join(runDir, 'live_metrics.json');
    const tempPath = `${liveMetricsPath}.tmp`;
    
    await fs.writeFile(tempPath, JSON.stringify(metrics, null, 2));
    await fs.rename(tempPath, liveMetricsPath);
    
    // Invalidate cache
    metricsCache.delete(runId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating metrics:', error);
    res.status(500).json({ 
      error: 'Failed to update metrics',
      message: error.message 
    });
  }
});

export default router;
