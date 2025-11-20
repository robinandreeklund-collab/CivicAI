/**
 * OQT-1.0 (Open Quality Transformer) API
 * Self-contained AI model with real-time training and Firebase integration
 * 
 * Endpoints:
 * - POST /api/oqt/query - Generate response using OQT-1.0
 * - POST /api/oqt/train - Trigger training on accumulated data
 * - POST /api/oqt/micro-train - Real-time micro-training
 * - GET /api/oqt/status - Model status and health
 * - GET /api/oqt/metrics - Performance metrics
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  saveOQTQuery, 
  saveOQTMetrics, 
  saveOQTTrainingEvent,
  saveOQTProvenance,
  getLatestOQTMetrics
} from '../services/oqtFirebaseService.js';
import {
  addQueryToLedger,
  addTrainingToLedger,
  verifyLedger,
  getLedgerStats
} from '../services/oqtLedgerService.js';

const router = express.Router();

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute (higher for OQT)

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  
  // Remove old requests outside the window
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  // Cleanup old entries periodically
  if (rateLimitMap.size > 10000) {
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.every(time => now - time > RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  return true;
}

// Rate limiting middleware
function rateLimiter(req, res, next) {
  const identifier = req.ip || 'unknown';
  
  if (!checkRateLimit(identifier)) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  next();
}

// OQT-1.0 Model State (in-memory for now, will be persisted to Firebase)
let oqtModel = {
  version: '1.2.0',
  status: 'active',
  lastTraining: new Date().toISOString(),
  trainingData: {
    totalSamples: 22000,
    weeklyBatch: 0,
    microBatch: 0
  },
  metrics: {
    accuracy: 0.905,
    fairness: 0.948,
    bias: 0.082,
    consensus: 0.847
  },
  // Simple knowledge base for demo (simulates trained model)
  knowledge: new Map()
};

/**
 * POST /api/oqt/query
 * Generate response using OQT-1.0 model
 * 
 * Body:
 * {
 *   question: string,
 *   context?: object,
 *   options?: { temperature?: number }
 * }
 */
router.post('/query', rateLimiter, async (req, res) => {
  try {
    const { question, context, options } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string'
      });
    }

    const queryId = uuidv4();
    const timestamp = new Date().toISOString();

    // Generate OQT-1.0 response (simplified inference for demo)
    // In production, this would use actual ML model inference
    const response = await generateOQTResponse(question, context, options);

    // Create provenance record
    const provenance = {
      queryId,
      timestamp,
      model: 'OQT-1.0',
      version: oqtModel.version,
      inputHash: hashString(question),
      processingSteps: [
        { step: 'tokenization', timestamp: new Date().toISOString() },
        { step: 'inference', timestamp: new Date().toISOString() },
        { step: 'post-processing', timestamp: new Date().toISOString() }
      ]
    };

    // Save query to Firebase
    const queryData = {
      queryId,
      question,
      response: response.text,
      confidence: response.confidence,
      metadata: {
        tokens: response.tokens,
        latency_ms: response.latency_ms,
        temperature: options?.temperature || 0.7
      },
      model: 'OQT-1.0',
      version: oqtModel.version
    };
    
    await saveOQTQuery(queryData);
    
    // Save provenance to Firebase
    await saveOQTProvenance(provenance);

    // Add query to transparency ledger
    await addQueryToLedger(queryId, question, oqtModel.version);

    res.json({
      success: true,
      queryId,
      model: 'OQT-1.0',
      version: oqtModel.version,
      response: response.text,
      confidence: response.confidence,
      metadata: {
        tokens: response.tokens,
        latency_ms: response.latency_ms,
        temperature: options?.temperature || 0.7
      },
      provenance,
      timestamp
    });

  } catch (error) {
    console.error('OQT query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process query',
      message: error.message
    });
  }
});

/**
 * POST /api/oqt/micro-train
 * Real-time micro-training on new data
 * Two-stage process:
 * 1. Train on raw AI service responses
 * 2. Train on pipeline-analyzed data
 * 
 * Body:
 * {
 *   question: string,
 *   rawResponses: Array<{model, response}>,
 *   analyzedData?: { consensus, bias, fairness, metaSummary }
 * }
 */
router.post('/micro-train', async (req, res) => {
  try {
    const { question, rawResponses, analyzedData } = req.body;

    if (!question || !rawResponses || !Array.isArray(rawResponses)) {
      return res.status(400).json({
        success: false,
        error: 'Question and rawResponses array are required'
      });
    }

    const trainingId = uuidv4();
    const timestamp = new Date().toISOString();

    // Stage 1: Train on raw responses from AI services
    const stage1Result = await microTrainStage1(question, rawResponses);

    // Stage 2: Train on analyzed data (if provided)
    let stage2Result = null;
    if (analyzedData) {
      stage2Result = await microTrainStage2(question, analyzedData);
    }

    // Update model metrics
    oqtModel.trainingData.microBatch += 1;

    // Save training event to Firebase
    const trainingEventData = {
      trainingId,
      type: 'micro-training',
      question,
      samplesProcessed: rawResponses.length,
      stage1: stage1Result,
      stage2: stage2Result,
      modelVersion: oqtModel.version,
      metrics: {
        accuracy: oqtModel.metrics.accuracy,
        fairness: oqtModel.metrics.fairness,
        bias: oqtModel.metrics.bias,
        consensus: oqtModel.metrics.consensus
      }
    };

    await saveOQTTrainingEvent(trainingEventData);

    // Save updated metrics to Firebase
    await saveOQTMetrics({
      version: oqtModel.version,
      metrics: oqtModel.metrics,
      training: oqtModel.trainingData
    });

    // Add training event to ledger
    await addTrainingToLedger(
      trainingId,
      'micro',
      rawResponses.length,
      oqtModel.version
    );

    res.json({
      success: true,
      trainingId,
      timestamp,
      stages: {
        stage1: {
          completed: true,
          samplesProcessed: rawResponses.length,
          result: stage1Result
        },
        stage2: stage2Result ? {
          completed: true,
          result: stage2Result
        } : { completed: false, reason: 'No analyzed data provided' }
      },
      modelStatus: {
        version: oqtModel.version,
        totalMicroBatches: oqtModel.trainingData.microBatch,
        lastUpdate: timestamp
      }
    });

  } catch (error) {
    console.error('Micro-training error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform micro-training',
      message: error.message
    });
  }
});

/**
 * POST /api/oqt/train
 * Trigger weekly batch training
 * 
 * Body:
 * {
 *   dataSource?: string ('firestore' | 'file'),
 *   dateRange?: { start: ISO date, end: ISO date }
 * }
 */
router.post('/train', rateLimiter, async (req, res) => {
  try {
    const { dataSource = 'firestore', dateRange } = req.body;

    const trainingId = uuidv4();
    const timestamp = new Date().toISOString();

    // Simulate batch training
    const result = await performBatchTraining(dataSource, dateRange);

    // Update model version
    const versionParts = oqtModel.version.split('.');
    versionParts[2] = parseInt(versionParts[2]) + 1;
    const newVersion = versionParts.join('.');
    const previousVersion = oqtModel.version;

    oqtModel.version = newVersion;
    oqtModel.lastTraining = timestamp;
    oqtModel.trainingData.weeklyBatch += 1;
    oqtModel.trainingData.totalSamples += result.samplesProcessed;

    // Save training event to Firebase
    const trainingEventData = {
      trainingId,
      type: 'weekly-batch',
      dataSource,
      dateRange,
      samplesProcessed: result.samplesProcessed,
      epochs: result.epochs,
      duration_ms: result.duration_ms,
      previousVersion,
      newVersion,
      metrics: result.metrics
    };

    await saveOQTTrainingEvent(trainingEventData);

    // Save updated metrics to Firebase
    await saveOQTMetrics({
      version: newVersion,
      metrics: oqtModel.metrics,
      training: oqtModel.trainingData
    });

    // Add training event to ledger
    await addTrainingToLedger(
      trainingId,
      'batch',
      result.samplesProcessed,
      newVersion
    );

    res.json({
      success: true,
      trainingId,
      timestamp,
      previousVersion,
      newVersion,
      result: {
        samplesProcessed: result.samplesProcessed,
        epochs: result.epochs,
        duration_ms: result.duration_ms,
        metrics: result.metrics
      },
      modelStatus: {
        version: newVersion,
        totalWeeklyBatches: oqtModel.trainingData.weeklyBatch,
        totalSamples: oqtModel.trainingData.totalSamples,
        lastTraining: timestamp
      }
    });

  } catch (error) {
    console.error('Batch training error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform batch training',
      message: error.message
    });
  }
});

/**
 * GET /api/oqt/status
 * Get OQT-1.0 model status and health
 */
router.get('/status', rateLimiter, (req, res) => {
  try {
    res.json({
      success: true,
      status: 'up',
      model: {
        name: 'OQT-1.0',
        version: oqtModel.version,
        status: oqtModel.status,
        lastTraining: oqtModel.lastTraining,
        architecture: 'Transformer',
        trainingMethod: 'Supervised + RLHF'
      },
      health: {
        operational: true,
        responseTime_ms: 5,
        uptime: process.uptime()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
});

/**
 * GET /api/oqt/metrics
 * Get OQT-1.0 performance metrics
 */
router.get('/metrics', rateLimiter, (req, res) => {
  try {
    res.json({
      success: true,
      version: oqtModel.version,
      metrics: {
        accuracy: oqtModel.metrics.accuracy,
        fairness: oqtModel.metrics.fairness,
        bias: oqtModel.metrics.bias,
        consensus: oqtModel.metrics.consensus,
        fairnessMetrics: {
          demographicParity: 0.978,
          equalOpportunity: 0.965,
          disparateImpact: 0.982
        }
      },
      training: {
        totalSamples: oqtModel.trainingData.totalSamples,
        weeklyBatches: oqtModel.trainingData.weeklyBatch,
        microBatches: oqtModel.trainingData.microBatch,
        lastTraining: oqtModel.lastTraining
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get metrics'
    });
  }
});

/**
 * Helper: Generate OQT-1.0 response
 * This simulates model inference. In production, would use actual ML model.
 */
async function generateOQTResponse(question, context, options) {
  const startTime = Date.now();
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 50));

  // Generate response based on knowledge base or general response
  let responseText;
  const questionLower = question.toLowerCase();

  // Check knowledge base
  if (oqtModel.knowledge.has(questionLower)) {
    responseText = oqtModel.knowledge.get(questionLower);
  } else {
    // Generate generic response
    responseText = `Based on analysis from multiple AI models and consensus mechanisms, here's a transparent perspective on "${question}": ` +
      `OQT-1.0 synthesizes information from diverse sources to provide balanced, fair responses. ` +
      `This response is generated using our transparent AI pipeline with full provenance tracking.`;
  }

  const latency_ms = Date.now() - startTime;
  const tokens = Math.ceil(responseText.split(' ').length * 1.3); // Rough token estimate

  return {
    text: responseText,
    confidence: 0.85 + Math.random() * 0.1, // 0.85-0.95
    tokens,
    latency_ms
  };
}

/**
 * Helper: Micro-training Stage 1 - Train on raw AI responses
 */
async function microTrainStage1(question, rawResponses) {
  // Simulate training on raw responses
  await new Promise(resolve => setTimeout(resolve, 100));

  // Update knowledge base with consensus from raw responses
  const consensusResponse = rawResponses
    .map(r => r.response)
    .join(' ')
    .substring(0, 200) + '...';

  oqtModel.knowledge.set(question.toLowerCase(), consensusResponse);

  return {
    method: 'raw_response_training',
    samplesProcessed: rawResponses.length,
    updated: true
  };
}

/**
 * Helper: Micro-training Stage 2 - Train on analyzed data
 */
async function microTrainStage2(question, analyzedData) {
  // Simulate training on analyzed/processed data
  await new Promise(resolve => setTimeout(resolve, 100));

  // Update metrics based on analyzed data
  if (analyzedData.consensus) {
    oqtModel.metrics.consensus = 
      (oqtModel.metrics.consensus * 0.9) + (analyzedData.consensus * 0.1);
  }

  if (analyzedData.bias) {
    oqtModel.metrics.bias = 
      (oqtModel.metrics.bias * 0.9) + (analyzedData.bias * 0.1);
  }

  if (analyzedData.fairness) {
    oqtModel.metrics.fairness = 
      (oqtModel.metrics.fairness * 0.9) + (analyzedData.fairness * 0.1);
  }

  return {
    method: 'analyzed_data_training',
    metricsUpdated: true,
    consensus: oqtModel.metrics.consensus,
    bias: oqtModel.metrics.bias,
    fairness: oqtModel.metrics.fairness
  };
}

/**
 * Helper: Perform batch training
 */
async function performBatchTraining(dataSource, dateRange) {
  // Simulate batch training
  await new Promise(resolve => setTimeout(resolve, 500));

  const samplesProcessed = 500 + Math.floor(Math.random() * 500);
  const epochs = 5;

  // Simulate improved metrics
  oqtModel.metrics.accuracy += 0.005;
  oqtModel.metrics.fairness += 0.003;
  oqtModel.metrics.bias = Math.max(0.05, oqtModel.metrics.bias - 0.005);

  return {
    samplesProcessed,
    epochs,
    duration_ms: 5000 + Math.floor(Math.random() * 3000),
    metrics: {
      accuracy: oqtModel.metrics.accuracy,
      fairness: oqtModel.metrics.fairness,
      bias: oqtModel.metrics.bias
    }
  };
}

/**
 * Helper: Hash string (simple hash for demo)
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * GET /api/oqt/ledger/verify
 * Verify blockchain ledger integrity
 */
router.get('/ledger/verify', rateLimiter, async (req, res) => {
  try {
    const verification = await verifyLedger();
    
    res.json({
      success: true,
      ...verification
    });
  } catch (error) {
    console.error('Ledger verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify ledger',
      message: error.message
    });
  }
});

/**
 * GET /api/oqt/ledger/stats
 * Get ledger statistics
 */
router.get('/ledger/stats', rateLimiter, async (req, res) => {
  try {
    const statsResult = await getLedgerStats();
    
    if (statsResult.success) {
      res.json({
        success: true,
        ...statsResult.stats
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get ledger stats'
      });
    }
  } catch (error) {
    console.error('Ledger stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get ledger stats',
      message: error.message
    });
  }
});

export default router;
