/**
 * Remote Training API Routes
 * 
 * Handles remote GPU training job submission, status monitoring,
 * and coordination between laptop and desktop systems.
 */

import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import modelSizeCalculator from '../services/modelSizeCalculator.js';
import adapterVerifier from '../services/adapterVerifier.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Job queue storage (in production, use Redis or database)
const jobQueue = [];
const jobStatus = new Map();

/**
 * GET /api/remote/status
 * Get remote worker status and job queue
 */
router.get('/status', async (req, res) => {
  try {
    const projectRoot = path.resolve(__dirname, '../..');
    const statusFile = path.join(projectRoot, 'models', '.remote_status.json');
    
    let workerStatus = { online: false, lastPing: null };
    
    try {
      const statusData = await fs.readFile(statusFile, 'utf-8');
      workerStatus = JSON.parse(statusData);
      
      // Check if last ping was within 30 seconds
      const lastPing = new Date(workerStatus.lastPing);
      const now = new Date();
      workerStatus.online = (now - lastPing) < 30000;
    } catch (error) {
      // Status file doesn't exist or can't be read
    }
    
    res.json({
      worker: workerStatus,
      queueLength: jobQueue.length,
      activeJobs: Array.from(jobStatus.entries()).filter(([_, status]) => status.state === 'running').length,
      queue: jobQueue.slice(0, 10) // Return first 10 jobs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/remote/submit
 * Submit a training job to remote worker
 */
router.post('/submit', async (req, res) => {
  try {
    const {
      dataset,
      baseModels,
      params,
      runId
    } = req.body;
    
    if (!dataset || !baseModels || !params) {
      return res.status(400).json({ error: 'Missing required fields: dataset, baseModels, params' });
    }
    
    const jobId = `remote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      type: 'remote_training',
      dataset,
      baseModels,
      params,
      runId,
      submittedAt: new Date().toISOString(),
      state: 'queued'
    };
    
    jobQueue.push(job);
    jobStatus.set(jobId, {
      state: 'queued',
      progress: 0,
      message: 'Waiting for remote worker'
    });
    
    // Write job to file for remote worker to pick up
    const projectRoot = path.resolve(__dirname, '../..');
    const jobsDir = path.join(projectRoot, 'models', '.remote_jobs');
    await fs.mkdir(jobsDir, { recursive: true });
    
    const jobFile = path.join(jobsDir, `${jobId}.json`);
    await fs.writeFile(jobFile, JSON.stringify(job, null, 2));
    
    res.json({
      success: true,
      jobId,
      message: 'Job submitted to remote queue'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/remote/job/:jobId
 * Get status of a specific job
 */
router.get('/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const status = jobStatus.get(jobId);
    if (!status) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json({
      jobId,
      ...status
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/remote/job/:jobId/update
 * Update job status (called by remote worker)
 */
router.post('/job/:jobId/update', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { state, progress, message, gpuMetrics } = req.body;
    
    const currentStatus = jobStatus.get(jobId) || {};
    
    jobStatus.set(jobId, {
      ...currentStatus,
      state,
      progress: progress || currentStatus.progress,
      message: message || currentStatus.message,
      gpuMetrics: gpuMetrics || currentStatus.gpuMetrics,
      lastUpdate: new Date().toISOString()
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/remote/worker/ping
 * Heartbeat from remote worker
 */
router.post('/worker/ping', async (req, res) => {
  try {
    const { hostname, gpuInfo } = req.body;
    
    const projectRoot = path.resolve(__dirname, '../..');
    const statusFile = path.join(projectRoot, 'models', '.remote_status.json');
    
    const status = {
      online: true,
      hostname,
      gpuInfo,
      lastPing: new Date().toISOString()
    };
    
    await fs.mkdir(path.dirname(statusFile), { recursive: true });
    await fs.writeFile(statusFile, JSON.stringify(status, null, 2));
    
    res.json({ success: true, message: 'Ping received' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/remote/chain/size
 * Calculate total size of current model chain
 */
router.get('/chain/size', async (req, res) => {
  try {
    const { baseModel, adapters } = req.query;
    
    if (!baseModel) {
      return res.status(400).json({ error: 'baseModel is required' });
    }
    
    const adapterList = adapters ? adapters.split(',') : [];
    const sizeInfo = await modelSizeCalculator.calculateChainSize(baseModel, adapterList);
    const warning = modelSizeCalculator.getSizeWarning(sizeInfo.totalSize);
    
    res.json({
      ...sizeInfo,
      warning,
      formatted: {
        base: modelSizeCalculator.formatSize(sizeInfo.baseSize),
        adapters: modelSizeCalculator.formatSize(sizeInfo.adaptersSize),
        total: modelSizeCalculator.formatSize(sizeInfo.totalSize)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/remote/chain/verify
 * Verify adapter chain integrity and compatibility
 */
router.post('/chain/verify', async (req, res) => {
  try {
    const { baseModel, adapters } = req.body;
    
    if (!baseModel || !adapters) {
      return res.status(400).json({ error: 'baseModel and adapters are required' });
    }
    
    const compatibility = await adapterVerifier.verifyChainCompatibility(baseModel, adapters);
    const mergeRisk = await adapterVerifier.calculateMergeRisk(adapters);
    
    res.json({
      compatibility,
      mergeRisk
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/remote/adapter/compare
 * Compare two adapters
 */
router.post('/adapter/compare', async (req, res) => {
  try {
    const { adapter1, adapter2 } = req.body;
    
    if (!adapter1 || !adapter2) {
      return res.status(400).json({ error: 'Both adapter1 and adapter2 are required' });
    }
    
    const comparison = await adapterVerifier.compareAdapters(adapter1, adapter2);
    
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/remote/predict/growth
 * Predict size growth over iterations
 */
router.get('/predict/growth', async (req, res) => {
  try {
    const { baseModel, adapters, iterations } = req.query;
    
    if (!baseModel || !iterations) {
      return res.status(400).json({ error: 'baseModel and iterations are required' });
    }
    
    const adapterList = adapters ? adapters.split(',') : [];
    const currentSize = await modelSizeCalculator.calculateChainSize(baseModel, adapterList);
    
    const prediction = modelSizeCalculator.predictGrowth(
      currentSize.totalSize,
      parseInt(iterations),
      0.42 // Default avg adapter size
    );
    
    res.json(prediction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
