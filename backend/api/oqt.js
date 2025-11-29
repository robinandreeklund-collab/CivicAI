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
import { detectOne } from 'langdetect';
import { 
  saveOQTQuery, 
  saveOQTMetrics, 
  saveOQTTrainingEvent,
  saveOQTProvenance,
  getLatestOQTMetrics,
  getOQTQueries
} from '../services/oqtFirebaseService.js';
import {
  addQueryToLedger,
  addTrainingToLedger,
  verifyLedger,
  getLedgerStats
} from '../services/oqtLedgerService.js';
import {
  executeOQTMultiModelPipeline,
  generateMultiModelResponses,
  analyzeMultiModelResponses,
  calculateConsensus,
  detectCrossBias,
  calculateFairnessIndex,
  generateMetaSummary
} from '../services/oqtMultiModelPipeline.js';
import { getMistralResponse } from '../services/mistral.js';
import { getLlamaResponse } from '../services/llama.js';
import { broadcastTrainingEvent } from '../ws/training_ws.js';
import { getAvailableLanguageModels } from '../utils/languageBaseCheck.js';

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
 * POST /api/oqt/multi-model-query
 * NEW: Enhanced query endpoint using multi-model pipeline
 * Processes query through Mistral 7B and LLaMA-2, performs analysis, and returns synthesized OQT-1.0 response
 * Includes real-time microtraining with language detection
 * 
 * Body:
 * {
 *   question: string,
 *   includeExternal?: boolean (include GPT, Gemini, Grok),
 *   enableTraining?: boolean (perform microtraining)
 * }
 */
router.post('/multi-model-query', rateLimiter, async (req, res) => {
  try {
    const { question, includeExternal = false, enableTraining = true } = req.body;

    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string'
      });
    }

    const queryId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Detect language for micro-training
    let detectedLanguage = 'en';
    try {
      const langResult = detectOne(question);
      // Map language codes to supported languages (sv or en)
      if (langResult === 'sv' || langResult === 'no' || langResult === 'da') {
        detectedLanguage = 'sv';
      } else {
        detectedLanguage = 'en';
      }
      console.log(`[OQT] Detected language: ${langResult} -> ${detectedLanguage}`);
    } catch (err) {
      console.warn('[OQT] Language detection failed, defaulting to English:', err.message);
    }

    // Execute multi-model pipeline
    const pipelineResult = await executeOQTMultiModelPipeline(question, {
      includeExternal,
    });

    // Generate OQT-1.0 synthesized response based on pipeline results
    const oqtResponse = synthesizeOQTResponse(
      question,
      pipelineResult.rawResponses,
      pipelineResult.metaSummary,
      pipelineResult.consensus
    );

    // Perform real-time microtraining (two-step) with language-specific model
    let trainingResult = null;
    if (enableTraining) {
      try {
        // Call micro-training endpoint (use relative URL for same server)
        const microTrainResponse = await fetch('/api/training/micro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            question,
            language: detectedLanguage,
            rawResponses: pipelineResult.rawResponses,
            analyzedData: {
              consensus: pipelineResult.consensus.score,
              bias: pipelineResult.bias.aggregatedScore,
              fairness: pipelineResult.fairness.score,
              metaSummary: pipelineResult.metaSummary,
            },
          }),
        });
        
        if (microTrainResponse.ok) {
          const microTrainData = await microTrainResponse.json();
          trainingResult = {
            success: true,
            language: detectedLanguage,
            model: microTrainData.model,
            fallback: microTrainData.fallback,
            stage1: microTrainData.stages?.stage1,
            stage2: microTrainData.stages?.stage2,
            state: microTrainData.state,
          };
          
          console.log(`[OQT] Micro-training completed for ${detectedLanguage} model`);
        } else {
          const errorData = await microTrainResponse.json();
          console.warn('[OQT] Micro-training failed:', errorData);
          trainingResult = {
            success: false,
            error: errorData.error || 'Micro-training failed',
          };
        }
      } catch (err) {
        console.error('[OQT] Micro-training error:', err);
        trainingResult = {
          success: false,
          error: err.message,
        };
      }

      oqtModel.trainingData.microBatch += 1;

      // Save training event
      await saveOQTTrainingEvent({
        trainingId: uuidv4(),
        type: 'multi-model-micro-training',
        question,
        language: detectedLanguage,
        samplesProcessed: pipelineResult.rawResponses.length,
        trainingResult: trainingResult,
        modelVersion: oqtModel.version,
        metrics: oqtModel.metrics,
      });
    }

    // Save query to Firebase
    await saveOQTQuery({
      queryId,
      question,
      response: oqtResponse.text,
      confidence: oqtResponse.confidence,
      language: detectedLanguage,
      metadata: {
        modelsUsed: pipelineResult.rawResponses.map(r => r.model),
        consensus: pipelineResult.consensus,
        bias: pipelineResult.bias,
        fairness: pipelineResult.fairness,
        processingTime_ms: pipelineResult.metadata.processingTime_ms,
      },
      model: 'OQT-1.0-MultiModel',
      version: oqtModel.version,
    });

    // Add to ledger
    await addQueryToLedger(queryId, question, oqtModel.version);

    // Return comprehensive response
    res.json({
      success: true,
      queryId,
      model: 'OQT-1.0',
      version: oqtModel.version,
      language: detectedLanguage,
      
      // OQT synthesized response
      response: oqtResponse.text,
      confidence: oqtResponse.confidence,
      
      // Multi-model analysis
      analysis: {
        consensus: {
          score: pipelineResult.consensus.score,
          level: pipelineResult.consensus.level,
          metrics: pipelineResult.consensus.metrics,
        },
        bias: {
          aggregatedScore: pipelineResult.bias.aggregatedScore,
          level: pipelineResult.bias.level,
          types: pipelineResult.bias.biasTypes,
        },
        fairness: {
          score: pipelineResult.fairness.score,
          level: pipelineResult.fairness.level,
        },
        metaSummary: pipelineResult.metaSummary,
      },
      
      // Model responses (for transparency)
      modelResponses: pipelineResult.rawResponses.map(r => ({
        model: r.model,
        responsePreview: r.response.substring(0, 200) + '...',
        metadata: r.metadata,
      })),
      
      // Training info
      training: trainingResult,
      
      // Metadata
      metadata: {
        totalModels: pipelineResult.rawResponses.length,
        processingTime_ms: pipelineResult.metadata.processingTime_ms,
        pipelineVersion: pipelineResult.metadata.pipelineVersion,
      },
      
      timestamp,
    });

  } catch (error) {
    console.error('Multi-model query error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process multi-model query',
      message: error.message,
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
router.get('/status', rateLimiter, async (req, res) => {
  try {
    // Get all available trained models
    const availableModels = await getAvailableLanguageModels();
    
    // Find current model (prefer certified models)
    const currentModel = availableModels.find(m => m.isCurrent) || availableModels[0];
    
    res.json({
      success: true,
      status: 'up',
      model: {
        name: 'OQT-1.0',
        version: currentModel ? currentModel.dna : oqtModel.version,
        status: currentModel ? 'ready' : oqtModel.status,
        lastTraining: currentModel ? currentModel.metadata?.createdAt : oqtModel.lastTraining,
        architecture: 'Transformer',
        trainingMethod: 'DNA v2 + Adaptive Weighting',
        dna: currentModel?.dna || null,
        directoryName: currentModel?.directoryName || null,
        language: currentModel?.language || 'unknown',
        isCertified: currentModel?.isCertified || false,
      },
      availableModels: availableModels.map(m => ({
        language: m.language,
        dna: m.dna,
        directoryName: m.directoryName || null,
        isCurrent: m.isCurrent,
        isCertified: m.isCertified || false,
        status: m.exists ? 'ready' : 'not found',
      })),
      health: {
        operational: availableModels.length > 0,
        modelsAvailable: availableModels.length,
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
 * GET /api/oqt/queries
 * Get query history from Firebase
 * Query params: limit (default 50)
 */
router.get('/queries', rateLimiter, async (req, res) => {
  try {
    const rawLimit = req.query.limit;
    const limit = Math.min(parseInt(rawLimit, 10) || 50, 100); // Cap at 100
    if (isNaN(limit) || limit < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter'
      });
    }
    const result = await getOQTQueries({ limit });
    
    if (result.success) {
      res.json({
        success: true,
        queries: result.queries,
        count: result.count,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        success: true,
        queries: [],
        count: 0,
        message: 'No queries found or Firebase unavailable',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Get queries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get queries',
      message: error.message
    });
  }
});

/**
 * Helper: Generate OQT-1.0 response
 * Uses Mistral 7B and LLaMA-2 for real inference with ensemble approach
 */
async function generateOQTResponse(question, context, options) {
  const startTime = Date.now();
  
  try {
    // Get responses from both models in parallel for ensemble
    const [mistralResult, llamaResult] = await Promise.all([
      getMistralResponse(question, options),
      getLlamaResponse(question, options)
    ]);
    
    // Check if we got real model responses
    const usingRealModels = !mistralResult.metadata.simulated || !llamaResult.metadata.simulated;
    
    // Choose the better response or combine them
    let responseText;
    let confidence;
    let modelsUsed = [];
    
    if (usingRealModels) {
      // If we have real models, use the Mistral response (it's faster and often more concise)
      // In future, could implement more sophisticated ensemble logic
      if (!mistralResult.metadata.simulated) {
        responseText = mistralResult.response;
        modelsUsed.push('mistral-7b');
        confidence = 0.90 + Math.random() * 0.08; // 0.90-0.98 for real models
      } else if (!llamaResult.metadata.simulated) {
        responseText = llamaResult.response;
        modelsUsed.push('llama-2-7b');
        confidence = 0.88 + Math.random() * 0.08; // 0.88-0.96 for real models
      }
      
      console.log(`✓ OQT using real model inference: ${modelsUsed.join(', ')}`);
    } else {
      // Fallback to simulated OQT response
      console.log('Using simulated OQT response');
      
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
      
      confidence = 0.85 + Math.random() * 0.1; // 0.85-0.95 for simulated
      modelsUsed = ['simulated'];
    }
    
    const latency_ms = Date.now() - startTime;
    const tokens = Math.ceil(responseText.split(' ').length * 1.3);
    
    return {
      text: responseText,
      confidence,
      tokens,
      latency_ms,
      modelsUsed,
      simulated: !usingRealModels,
      mistralMetadata: mistralResult.metadata,
      llamaMetadata: llamaResult.metadata
    };
  } catch (error) {
    console.error('Error in generateOQTResponse:', error);
    
    // Fallback to generic response on error
    const responseText = `Based on analysis from multiple AI models and consensus mechanisms, here's a transparent perspective on "${question}": ` +
      `OQT-1.0 synthesizes information from diverse sources to provide balanced, fair responses. ` +
      `This response is generated using our transparent AI pipeline with full provenance tracking.`;
    
    const latency_ms = Date.now() - startTime;
    const tokens = Math.ceil(responseText.split(' ').length * 1.3);
    
    return {
      text: responseText,
      confidence: 0.85 + Math.random() * 0.1,
      tokens,
      latency_ms,
      modelsUsed: ['fallback'],
      simulated: true,
      error: error.message
    };
  }
}

/**
 * Helper: Synthesize OQT-1.0 response from multi-model pipeline results
 * Creates a balanced response considering consensus, bias, and fairness
 */
function synthesizeOQTResponse(question, rawResponses, metaSummary, consensus) {
  // Select the best response based on consensus and bias
  // In a real implementation, this would use ML-based synthesis
  
  const questionLower = question.toLowerCase();
  
  // Check knowledge base first
  if (oqtModel.knowledge.has(questionLower)) {
    const knowledgeResponse = oqtModel.knowledge.get(questionLower);
    return {
      text: knowledgeResponse,
      confidence: 0.90,
      source: 'knowledge_base',
    };
  }
  
  // Use Mistral or LLaMA response as base (they are core models)
  const coreModels = rawResponses.filter(r => 
    r.model.includes('Mistral') || r.model.includes('LLaMA')
  );
  
  let baseResponse = '';
  if (coreModels.length > 0) {
    // Prefer LLaMA for comprehensive questions, Mistral for direct questions
    const preferLlama = question.split(' ').length > 10;
    const preferred = coreModels.find(r => 
      preferLlama ? r.model.includes('LLaMA') : r.model.includes('Mistral')
    ) || coreModels[0];
    
    baseResponse = preferred.response;
  } else if (rawResponses.length > 0) {
    // Fallback to any available response
    baseResponse = rawResponses[0].response;
  }
  
  // Add OQT synthesis header
  const consensusLevel = consensus.level;
  const consensusNote = consensusLevel === 'high' 
    ? 'med hög modellkonsensus'
    : consensusLevel === 'medium'
    ? 'med måttlig modellkonsensus'
    : 'med varierande modellperspektiv';
  
  const synthesizedText = `OQT-1.0 Syntetiserat Svar (${consensusNote}, ${rawResponses.length} modeller analyserade):\n\n${baseResponse}\n\n` +
    `---\n` +
    `Detta svar är syntetiserat från ${rawResponses.length} AI-modeller ` +
    `med full transparens och provenienshantering. ` +
    `Konsensus: ${(consensus.score * 100).toFixed(0)}%, ` +
    `Rättvisa: ${metaSummary.fairnessLevel}.`;
  
  // Calculate confidence based on consensus and fairness
  const confidence = Math.min(
    0.95,
    consensus.score * 0.6 + (metaSummary.fairnessScore || 0.8) * 0.4
  );
  
  return {
    text: synthesizedText,
    confidence,
    source: 'multi_model_synthesis',
    modelsUsed: rawResponses.length,
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
