import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

/**
 * Execute Python change detection module
 * @param {string} question - The question asked
 * @param {string} model - Model name (e.g., 'gpt-3.5', 'gemini')
 * @param {string} response - Current model response
 * @param {string} version - Optional model version
 * @returns {Promise<Object|null>} Change detection result or null
 */
async function executeChangeDetection(question, model, response, version = 'unknown') {
  return new Promise((resolve) => {
    const pythonScript = path.join(__dirname, '../../ml/pipelines/change_detection.py');
    
    // Create JSON input for the Python script
    const input = JSON.stringify({
      question,
      model,
      response,
      version
    });
    
    const python = spawn('python3', [
      pythonScript,
      '--detect-json'
    ]);
    
    let output = '';
    let errorOutput = '';
    
    // Send input to Python script via stdin
    python.stdin.write(input);
    python.stdin.end();
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (e) {
          console.error('Failed to parse change detection output:', e.message);
          console.error('Output was:', output);
          resolve(null);
        }
      } else {
        if (errorOutput) {
          console.error('Change detection error:', errorOutput);
        }
        resolve(null);
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      python.kill();
      resolve(null);
    }, 10000);
  });
}

/**
 * POST /api/change-detection/analyze
 * Analyze a single response for changes
 */
router.post('/analyze', async (req, res) => {
  try {
    const { question, model, response, version } = req.body;
    
    if (!question || !model || !response) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question, model, and response are required'
      });
    }
    
    console.log(`🔍 Analyzing change detection for ${model}...`);
    
    const result = await executeChangeDetection(question, model, response, version);
    
    if (result) {
      console.log(`✅ Change detection complete: severity=${result.change_metrics?.severity_index || 'N/A'}`);
      res.json(result);
    } else {
      res.json({ 
        message: 'No change detected or first response for this question/model',
        change_detected: false
      });
    }
  } catch (error) {
    console.error('Error in change detection analysis:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/change-detection/history
 * Get change history for a specific question and optionally a specific model
 */
router.get('/history', async (req, res) => {
  try {
    const { question, model, limit } = req.query;
    
    if (!question) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question parameter is required'
      });
    }
    
    const pythonScript = path.join(__dirname, '../../ml/pipelines/change_detection.py');
    
    const args = [
      pythonScript,
      '--history-json',
      '--question', question
    ];
    
    if (model) {
      args.push('--model', model);
    }
    
    if (limit) {
      args.push('--limit', limit);
    }
    
    const python = spawn('python3', args);
    
    let output = '';
    let errorOutput = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (e) {
          console.error('Failed to parse history output:', e.message);
          res.status(500).json({
            error: 'Failed to parse history',
            message: e.message
          });
        }
      } else {
        if (errorOutput) {
          console.error('History retrieval error:', errorOutput);
        }
        res.json({ history: [] });
      }
    });
    
    setTimeout(() => {
      python.kill();
      res.status(504).json({ error: 'Request timeout' });
    }, 10000);
    
  } catch (error) {
    console.error('Error retrieving change history:', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: error.message
    });
  }
});

/**
 * GET /api/change-detection/heatmap
 * Generate heatmap data for narrative shifts
 */
router.get('/heatmap', async (req, res) => {
  try {
    const { question, models } = req.query;
    
    if (!question) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question parameter is required'
      });
    }
    
    // Parse models if provided as JSON array
    let modelList = [];
    if (models) {
      try {
        modelList = JSON.parse(models);
      } catch (e) {
        modelList = models.split(',');
      }
    }
    
    const pythonScript = path.join(__dirname, '../../ml/pipelines/change_detection.py');
    
    const args = [
      pythonScript,
      '--heatmap-json',
      '--question', question
    ];
    
    if (modelList.length > 0) {
      args.push('--models', JSON.stringify(modelList));
    }
    
    const python = spawn('python3', args);
    
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (e) {
          // Return mock data for now
          res.json({
            timePeriods: ['2025-10-01', '2025-10-15', '2025-11-01', '2025-11-17'],
            dimensions: {
              sentiment: {
                label: 'Sentiment',
                models: {}
              },
              ideology: {
                label: 'Ideologi',
                models: {}
              },
              themes: {
                label: 'Tematiska skiften',
                models: {}
              }
            }
          });
        }
      } else {
        res.json({
          timePeriods: [],
          dimensions: {}
        });
      }
    });
    
    setTimeout(() => {
      python.kill();
      res.status(504).json({ error: 'Request timeout' });
    }, 10000);
    
  } catch (error) {
    console.error('Error generating heatmap:', error);
    res.status(500).json({
      error: 'Failed to generate heatmap',
      message: error.message
    });
  }
});

/**
 * GET /api/change-detection/bias-drift
 * Get bias drift data for a specific model
 */
router.get('/bias-drift', async (req, res) => {
  try {
    const { question, model } = req.query;
    
    if (!question || !model) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and model parameters are required'
      });
    }
    
    const pythonScript = path.join(__dirname, '../../ml/pipelines/change_detection.py');
    
    const args = [
      pythonScript,
      '--bias-drift-json',
      '--question', question,
      '--model', model
    ];
    
    const python = spawn('python3', args);
    
    let output = '';
    
    python.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    python.on('close', (code) => {
      if (code === 0 && output.trim()) {
        try {
          const result = JSON.parse(output);
          res.json(result);
        } catch (e) {
          // Return mock data for now
          res.json({
            dimensions: ['Positivitet', 'Normativ', 'Vänster', 'Höger', 'Grön', 'Emotionell'],
            periods: []
          });
        }
      } else {
        res.json({
          dimensions: ['Positivitet', 'Normativ', 'Vänster', 'Höger', 'Grön', 'Emotionell'],
          periods: []
        });
      }
    });
    
    setTimeout(() => {
      python.kill();
      res.status(504).json({ error: 'Request timeout' });
    }, 10000);
    
  } catch (error) {
    console.error('Error retrieving bias drift:', error);
    res.status(500).json({
      error: 'Failed to retrieve bias drift',
      message: error.message
    });
  }
});

export default router;
export { executeChangeDetection };
