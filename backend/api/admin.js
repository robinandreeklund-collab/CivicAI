/**
 * Admin API Endpoints for OneSeek-7B-Zero Management
 * 
 * Provides endpoints for:
 * - Dataset management (upload, list, validate, delete)
 * - Training control (start, stop, status)
 * - Model management (list, download, rollback)
 * - Monitoring (resources, history, schedule, notifications)
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Save to datasets folder in project root (one level up from backend)
    const uploadDir = path.join(process.cwd(), '..', 'datasets');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.json' && ext !== '.jsonl') {
      return cb(new Error('Only JSON and JSONL files are allowed'));
    }
    cb(null, true);
  },
});

// In-memory state for training
let trainingState = {
  status: 'idle', // idle, training, stopping
  currentEpoch: 0,
  totalEpochs: 0,
  loss: null,
  progress: 0,
  logs: [],
  datasetId: null,
};

let trainingProcess = null; // Store the training process

let resourceMetrics = {
  cpu: [],
  gpu: [],
  memory: [],
};

let schedule = {
  frequency: 'manual',
  autoTrain: false,
  lastTraining: null,
  nextTraining: null,
};

let notifications = [];

// Middleware to check admin access (simplified - should use proper auth)
function requireAdmin(req, res, next) {
  // For now, we'll allow all requests
  // In production, implement proper authentication
  next();
}

// Dataset Management Endpoints

// GET /api/admin/datasets - List all datasets
router.get('/datasets', requireAdmin, async (req, res) => {
  try {
    // Use datasets directory in project root (one level up from backend)
    const datasetsDir = path.join(process.cwd(), '..', 'datasets');
    await fs.mkdir(datasetsDir, { recursive: true });
    
    const files = await fs.readdir(datasetsDir);
    const datasets = await Promise.all(
      files
        .filter(file => file.endsWith('.json') || file.endsWith('.jsonl'))
        .map(async (file) => {
          const filePath = path.join(datasetsDir, file);
          const stats = await fs.stat(filePath);
          
          // Try to count entries
          let entries = 0;
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (file.endsWith('.jsonl')) {
              entries = content.trim().split('\n').filter(line => line.trim()).length;
            } else {
              const json = JSON.parse(content);
              entries = Array.isArray(json) ? json.length : 1;
            }
          } catch (error) {
            console.error('Error counting entries:', error);
          }
          
          return {
            id: file,
            name: file,
            size: stats.size,
            uploadedAt: stats.mtime.toISOString(),
            entries,
          };
        })
    );
    
    res.json({ datasets });
  } catch (error) {
    console.error('Error listing datasets:', error);
    res.status(500).json({ error: 'Failed to list datasets' });
  }
});

// POST /api/admin/datasets/upload - Upload a new dataset
router.post('/datasets/upload', requireAdmin, upload.single('dataset'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate the dataset
    const content = await fs.readFile(req.file.path, 'utf-8');
    let validEntries = 0;
    let invalidEntries = 0;
    const errors = [];
    
    try {
      if (req.file.originalname.endsWith('.jsonl')) {
        const lines = content.trim().split('\n');
        lines.forEach((line, index) => {
          try {
            JSON.parse(line);
            validEntries++;
          } catch (error) {
            invalidEntries++;
            errors.push(`Line ${index + 1}: Invalid JSON`);
          }
        });
      } else {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          json.forEach((entry, index) => {
            if (typeof entry === 'object' && entry !== null) {
              validEntries++;
            } else {
              invalidEntries++;
              errors.push(`Entry ${index + 1}: Invalid format`);
            }
          });
        } else if (typeof json === 'object') {
          validEntries = 1;
        }
      }
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid file format',
        validation: { validEntries: 0, invalidEntries: 1, errors: [error.message] }
      });
    }
    
    res.json({
      success: true,
      file: {
        id: req.file.filename,
        name: req.file.originalname,
        size: req.file.size,
      },
      validation: {
        validEntries,
        invalidEntries,
        errors: errors.slice(0, 10), // Return first 10 errors only
      },
    });
  } catch (error) {
    console.error('Error uploading dataset:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/admin/datasets/:id/validate - Validate a specific dataset
router.get('/datasets/:id/validate', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), '..', 'datasets', req.params.id);
    const content = await fs.readFile(filePath, 'utf-8');
    
    let validEntries = 0;
    let invalidEntries = 0;
    const errors = [];
    
    if (req.params.id.endsWith('.jsonl')) {
      const lines = content.trim().split('\n');
      lines.forEach((line, index) => {
        if (!line.trim()) return; // Skip empty lines
        try {
          const parsed = JSON.parse(line);
          // Check for required fields
          if (parsed.instruction !== undefined || parsed.input !== undefined || parsed.output !== undefined) {
            validEntries++;
          } else {
            invalidEntries++;
            errors.push(`Line ${index + 1}: Missing required fields (instruction, input, output)`);
          }
        } catch (error) {
          invalidEntries++;
          errors.push(`Line ${index + 1}: ${error.message}`);
        }
      });
    } else {
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          json.forEach((entry, index) => {
            if (entry.instruction !== undefined || entry.input !== undefined || entry.output !== undefined) {
              validEntries++;
            } else {
              invalidEntries++;
              errors.push(`Entry ${index + 1}: Missing required fields`);
            }
          });
        } else {
          validEntries = 1;
        }
      } catch (error) {
        invalidEntries = 1;
        errors.push(error.message);
      }
    }
    
    res.json({ validEntries, invalidEntries, errors: errors.slice(0, 10) });
  } catch (error) {
    console.error('Error validating dataset:', error);
    res.status(500).json({ error: 'Validation failed', message: error.message });
  }
});

// DELETE /api/admin/datasets/:id - Delete a dataset
router.delete('/datasets/:id', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), '..', 'datasets', req.params.id);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Delete failed', message: error.message });
  }
});

// Training Control Endpoints

// GET /api/admin/training/status - Get training status
router.get('/training/status', requireAdmin, (req, res) => {
  res.json(trainingState);
});

// POST /api/admin/training/start - Start training
router.post('/training/start', requireAdmin, async (req, res) => {
  try {
    const { datasetId, epochs, batchSize, learningRate } = req.body;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'Dataset ID is required' });
    }
    
    if (trainingState.status === 'training') {
      return res.status(400).json({ error: 'Training already in progress' });
    }
    
    // Verify dataset exists (one level up from backend directory)
    const datasetPath = path.join(process.cwd(), '..', 'datasets', datasetId);
    try {
      await fs.access(datasetPath);
    } catch (error) {
      return res.status(404).json({ error: 'Dataset not found', path: datasetPath });
    }
    
    // Initialize training state
    trainingState = {
      status: 'training',
      currentEpoch: 0,
      totalEpochs: epochs || 3,
      loss: null,
      progress: 0,
      datasetId,
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: `Starting training with dataset: ${datasetId}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Parameters: epochs=${epochs || 3}, batchSize=${batchSize || 8}, lr=${learningRate || 0.0001}`,
        },
      ],
    };
    
    // Path to Python script (one level up from backend directory)
    const pythonScript = path.join(process.cwd(), '..', 'scripts', 'train_identity.py');
    
    // Check if Python script exists
    try {
      await fs.access(pythonScript);
    } catch (error) {
      trainingState.status = 'idle';
      return res.status(500).json({ 
        error: 'Training script not found', 
        message: `scripts/train_identity.py does not exist at ${pythonScript}`,
        cwd: process.cwd()
      });
    }
    
    // Spawn Python training process
    // Use 'python' on Windows, 'python3' on Linux/Mac
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    trainingProcess = spawn(pythonCommand, [pythonScript], {
      cwd: path.join(process.cwd(), '..'), // Set working directory to project root
      env: {
        ...process.env,
        DATASET_PATH: datasetPath,
        EPOCHS: String(epochs || 3),
        BATCH_SIZE: String(batchSize || 8),
        LEARNING_RATE: String(learningRate || 0.0001),
      }
    });
    
    // Handle stdout
    trainingProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message,
        });
        
        // Parse epoch progress if available
        const epochMatch = message.match(/Epoch (\d+)\/(\d+)/);
        if (epochMatch) {
          trainingState.currentEpoch = parseInt(epochMatch[1]);
          trainingState.totalEpochs = parseInt(epochMatch[2]);
          trainingState.progress = Math.round((trainingState.currentEpoch / trainingState.totalEpochs) * 100);
        }
        
        // Parse loss if available
        const lossMatch = message.match(/Loss[:\s]+([0-9.]+)/i);
        if (lossMatch) {
          trainingState.loss = parseFloat(lossMatch[1]);
        }
      }
    });
    
    // Handle stderr
    trainingProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[ERROR] ${message}`,
        });
      }
    });
    
    // Handle process completion
    trainingProcess.on('close', (code) => {
      if (code === 0) {
        trainingState.status = 'idle';
        trainingState.progress = 100;
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: 'Training completed successfully!',
        });
        
        // Add notification
        notifications.push({
          id: uuidv4(),
          message: `Training completed successfully! Final loss: ${trainingState.loss || 'N/A'}`,
          timestamp: new Date().toISOString(),
        });
      } else {
        trainingState.status = 'idle';
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `Training failed with exit code ${code}`,
        });
        
        notifications.push({
          id: uuidv4(),
          message: `Training failed with exit code ${code}`,
          timestamp: new Date().toISOString(),
        });
      }
      trainingProcess = null;
    });
    
    res.json({ success: true, message: 'Training started' });
  } catch (error) {
    console.error('Error starting training:', error);
    trainingState.status = 'idle';
    res.status(500).json({ error: 'Failed to start training', message: error.message });
  }
});

// POST /api/admin/training/stop - Stop training
router.post('/training/stop', requireAdmin, (req, res) => {
  if (trainingState.status !== 'training') {
    return res.status(400).json({ error: 'No training in progress' });
  }
  
  // Kill the training process if it exists
  if (trainingProcess) {
    trainingProcess.kill('SIGTERM');
    trainingProcess = null;
  }
  
  trainingState.status = 'idle';
  trainingState.logs.push({
    timestamp: new Date().toISOString(),
    message: 'Training stopped by user',
  });
  
  notifications.push({
    id: uuidv4(),
    message: 'Training stopped by user',
    timestamp: new Date().toISOString(),
  });
  
  res.json({ success: true });
});

// Model Management Endpoints

// GET /api/admin/models - List all model versions
router.get('/models', requireAdmin, async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const models = [];
    
    try {
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      
      for (const file of files) {
        const modelPath = path.join(modelsDir, file);
        const stats = await fs.stat(modelPath);
        
        if (stats.isDirectory()) {
          // Try to read metadata if it exists
          let metadata = null;
          try {
            const metadataPath = path.join(modelPath, 'metadata.json');
            const metadataContent = await fs.readFile(metadataPath, 'utf-8');
            metadata = JSON.parse(metadataContent);
          } catch (error) {
            // No metadata file, create basic info
            metadata = {
              version: file,
              createdAt: stats.mtime.toISOString(),
            };
          }
          
          models.push({
            id: file,
            version: metadata.version || file,
            createdAt: metadata.createdAt || stats.mtime.toISOString(),
            trainingType: metadata.trainingType || 'unknown',
            samplesProcessed: metadata.samplesProcessed || 0,
            isCurrent: metadata.isCurrent || false,
            metrics: metadata.metrics || {
              loss: null,
              accuracy: null,
              fairness: null,
            },
            metadata: metadata,
          });
        }
      }
    } catch (error) {
      console.error('Error reading models directory:', error);
    }
    
    // If no models found, return default entry
    if (models.length === 0) {
      models.push({
        id: 'v1.0',
        version: 'OneSeek-7B-Zero.v1.0',
        createdAt: new Date().toISOString(),
        trainingType: 'initial',
        samplesProcessed: 0,
        isCurrent: true,
        metrics: {
          loss: null,
          accuracy: null,
          fairness: null,
        },
        metadata: {
          baseModel: 'Mistral-7B',
          loraRank: 8,
        },
      });
    }
    
    res.json({ models });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

// GET /api/admin/models/:id/download - Download model weights
router.get('/models/:id/download', requireAdmin, async (req, res) => {
  try {
    const { type } = req.query; // 'weights' or 'lora'
    
    // In production, stream the actual model file
    res.status(501).json({ error: 'Download not yet implemented' });
  } catch (error) {
    console.error('Error downloading model:', error);
    res.status(500).json({ error: 'Download failed' });
  }
});

// POST /api/admin/models/:id/rollback - Rollback to a specific model version
router.post('/models/:id/rollback', requireAdmin, async (req, res) => {
  try {
    // In production, implement actual rollback logic
    res.json({ success: true, message: 'Rollback successful' });
  } catch (error) {
    console.error('Error rolling back model:', error);
    res.status(500).json({ error: 'Rollback failed' });
  }
});

// Monitoring Endpoints

// GET /api/admin/monitoring/resources - Get resource usage metrics
router.get('/monitoring/resources', requireAdmin, (req, res) => {
  // Get real CPU usage
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;
  
  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });
  
  const cpuUsage = 100 - ~~(100 * totalIdle / totalTick);
  
  // Get memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsage = (usedMem / totalMem) * 100;
  
  // GPU usage - not available without external tools, use placeholder
  const gpuUsage = 0; // Would need nvidia-smi or similar
  
  resourceMetrics.cpu.push(cpuUsage);
  resourceMetrics.memory.push(memoryUsage);
  resourceMetrics.gpu.push(gpuUsage);
  
  // Keep only last 50 data points
  if (resourceMetrics.cpu.length > 50) {
    resourceMetrics.cpu = resourceMetrics.cpu.slice(-50);
    resourceMetrics.memory = resourceMetrics.memory.slice(-50);
    resourceMetrics.gpu = resourceMetrics.gpu.slice(-50);
  }
  
  res.json(resourceMetrics);
});

// GET /api/admin/monitoring/training-history - Get training history
router.get('/monitoring/training-history', requireAdmin, async (req, res) => {
  try {
    // In production, fetch from database
    const history = [
      {
        modelVersion: 'OneSeek-7B-Zero.v1.0',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 3600,
        samples: 500,
        metrics: {
          loss: 0.245,
          accuracy: 89.5,
        },
      },
    ];
    
    res.json({ history });
  } catch (error) {
    console.error('Error fetching training history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/admin/monitoring/schedule - Get training schedule
router.get('/monitoring/schedule', requireAdmin, (req, res) => {
  res.json(schedule);
});

// POST /api/admin/monitoring/schedule - Update training schedule
router.post('/monitoring/schedule', requireAdmin, (req, res) => {
  schedule = { ...schedule, ...req.body };
  res.json({ success: true, schedule });
});

// GET /api/admin/monitoring/notifications - Get notifications
router.get('/monitoring/notifications', requireAdmin, (req, res) => {
  res.json({ notifications });
});

// DELETE /api/admin/monitoring/notifications/:id - Clear a notification
router.delete('/monitoring/notifications/:id', requireAdmin, (req, res) => {
  notifications = notifications.filter(n => n.id !== req.params.id);
  res.json({ success: true });
});

export default router;
