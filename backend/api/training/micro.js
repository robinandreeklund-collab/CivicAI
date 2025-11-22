/**
 * Micro-Training API Endpoint
 * Handles real-time micro-training requests for OneSeek-7B-Zero
 * 
 * Endpoints:
 * - POST /api/training/micro - Execute micro-training (two-stage)
 * - GET /api/training/micro/status - Get micro-training status
 * - GET /api/training/micro/stats - Get micro-training statistics
 */

import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { ensureLanguageBaseModel } from '../../utils/languageBaseCheck.js';
import { broadcastTrainingEvent } from '../../ws/training_ws.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Micro-training state
const microTrainingState = {
  totalRuns: 0,
  lastRun: null,
  runsByLanguage: {
    sv: 0,
    en: 0,
  },
};

/**
 * Execute Python micro-training script
 * @param {number} stage - Training stage (1 or 2)
 * @param {string} question - User question
 * @param {string} language - Detected language
 * @param {object} data - Training data
 * @param {boolean} checkDNA - Check if DNA update needed
 * @returns {Promise<object>} Training result
 */
async function executeMicroTraining(stage, question, language, data, checkDNA = false) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '..', '..', '..', 'scripts', 'micro_train.py');
    
    const args = [
      scriptPath,
      '--stage', stage.toString(),
      '--question', question,
      '--language', language,
      '--data', JSON.stringify(data),
    ];
    
    if (checkDNA) {
      args.push('--check-dna');
    }
    
    const pythonProcess = spawn('python3', args, {
      cwd: path.join(__dirname, '..', '..', '..'),
    });
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[MicroTraining] Python script error:', stderr);
        reject(new Error(`Micro-training failed with code ${code}: ${stderr}`));
        return;
      }
      
      try {
        // Extract JSON from stdout (last JSON object)
        const lines = stdout.trim().split('\n');
        let jsonOutput = '';
        
        // Find the last line that looks like JSON
        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].trim().startsWith('{')) {
            jsonOutput = lines[i];
            break;
          }
        }
        
        if (!jsonOutput) {
          // Try to parse all stdout as JSON
          jsonOutput = stdout.trim();
        }
        
        const result = JSON.parse(jsonOutput);
        resolve(result);
      } catch (err) {
        console.error('[MicroTraining] Failed to parse result:', err);
        console.error('[MicroTraining] Stdout:', stdout);
        reject(new Error(`Failed to parse training result: ${err.message}`));
      }
    });
    
    pythonProcess.on('error', (err) => {
      console.error('[MicroTraining] Failed to spawn Python process:', err);
      reject(new Error(`Failed to start micro-training: ${err.message}`));
    });
  });
}

/**
 * POST /api/training/micro
 * Execute two-stage micro-training
 * 
 * Body:
 * {
 *   question: string,
 *   language: string ('sv' or 'en'),
 *   rawResponses: Array<{model, response}>,
 *   analyzedData?: { consensus, bias, fairness, metaSummary }
 * }
 */
router.post('/micro', async (req, res) => {
  try {
    const { question, language = 'en', rawResponses, analyzedData } = req.body;
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Question is required and must be a string',
      });
    }
    
    if (!rawResponses || !Array.isArray(rawResponses)) {
      return res.status(400).json({
        success: false,
        error: 'rawResponses array is required',
      });
    }
    
    // Ensure language base model exists
    const modelCheck = await ensureLanguageBaseModel(language);
    
    if (!modelCheck.ready) {
      console.warn('[MicroTraining] Model not ready:', modelCheck.message);
      return res.json({
        success: false,
        skipped: true,
        reason: modelCheck.message,
        warning: modelCheck.warning,
      });
    }
    
    if (modelCheck.fallback) {
      console.warn('[MicroTraining] Using fallback model:', modelCheck.message);
    }
    
    const timestamp = new Date().toISOString();
    
    // Stage 1: Train on raw responses
    const stage1Result = await executeMicroTraining(
      1,
      question,
      language,
      rawResponses,
      false
    );
    
    // Broadcast stage 1 complete
    broadcastTrainingEvent('micro-training', 'stage1_complete', {
      question: question.substring(0, 100),
      language,
      model: modelCheck.model,
      samples: rawResponses.length,
      result: stage1Result,
    });
    
    // Stage 2: Train on analyzed data (if provided)
    let stage2Result = null;
    if (analyzedData) {
      stage2Result = await executeMicroTraining(
        2,
        question,
        language,
        analyzedData,
        true // Check DNA on stage 2
      );
      
      // Broadcast stage 2 complete
      broadcastTrainingEvent('micro-training', 'stage2_complete', {
        question: question.substring(0, 100),
        language,
        model: modelCheck.model,
        result: stage2Result,
      });
      
      // Broadcast DNA update if it happened
      if (stage2Result.dna_update?.dna_updated) {
        broadcastTrainingEvent('micro-training', 'dna_updated', {
          model: modelCheck.model,
          dna_hash: stage2Result.dna_update.dna_hash,
          total_samples: stage2Result.dna_update.total_samples,
        });
      }
    }
    
    // Update state
    microTrainingState.totalRuns += 1;
    microTrainingState.lastRun = timestamp;
    microTrainingState.runsByLanguage[language] = (microTrainingState.runsByLanguage[language] || 0) + 1;
    
    res.json({
      success: true,
      timestamp,
      model: modelCheck.model,
      language,
      fallback: modelCheck.fallback || false,
      stages: {
        stage1: {
          completed: true,
          samples_processed: rawResponses.length,
          result: stage1Result,
        },
        stage2: stage2Result ? {
          completed: true,
          result: stage2Result,
        } : {
          completed: false,
          reason: 'No analyzed data provided',
        },
      },
      state: {
        totalRuns: microTrainingState.totalRuns,
        runsByLanguage: microTrainingState.runsByLanguage,
      },
    });
    
  } catch (error) {
    console.error('[MicroTraining] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform micro-training',
      message: error.message,
    });
  }
});

/**
 * GET /api/training/micro/status
 * Get current micro-training status
 */
router.get('/micro/status', (req, res) => {
  res.json({
    success: true,
    status: 'operational',
    state: microTrainingState,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/training/micro/stats
 * Get detailed micro-training statistics
 */
router.get('/micro/stats', async (req, res) => {
  try {
    const modelsDir = path.join(__dirname, '..', '..', '..', 'models', 'oneseek-7b-zero');
    
    const stats = {
      totalRuns: microTrainingState.totalRuns,
      runsByLanguage: microTrainingState.runsByLanguage,
      lastRun: microTrainingState.lastRun,
      models: {},
    };
    
    // Get stats for each language model
    const languages = ['sv', 'en'];
    for (const lang of languages) {
      const modelName = `OneSeek-7B-Zero-${lang}`;
      const modelPath = path.join(modelsDir, modelName);
      const samplesPath = path.join(modelPath, 'training_samples');
      
      try {
        const files = await fs.readdir(samplesPath);
        const stage1Files = files.filter(f => f.startsWith('stage1_'));
        const stage2Files = files.filter(f => f.startsWith('stage2_'));
        
        // Check DNA marker
        let lastDNA = null;
        const dnaMarkerPath = path.join(modelPath, 'last_dna_update.json');
        try {
          const dnaData = await fs.readFile(dnaMarkerPath, 'utf-8');
          lastDNA = JSON.parse(dnaData);
        } catch (err) {
          // No DNA marker yet
        }
        
        stats.models[lang] = {
          model: modelName,
          stage1Samples: stage1Files.length,
          stage2Samples: stage2Files.length,
          totalSamples: stage1Files.length + stage2Files.length,
          lastDNA: lastDNA,
        };
      } catch (err) {
        stats.models[lang] = {
          model: modelName,
          error: 'Model directory not found or inaccessible',
        };
      }
    }
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('[MicroTraining] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get micro-training stats',
      message: error.message,
    });
  }
});

export default router;
