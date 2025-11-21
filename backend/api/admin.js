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

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'datasets', 'uploads');
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

// In-memory state (should be replaced with database in production)
let trainingState = {
  status: 'idle', // idle, training, stopping
  currentEpoch: 0,
  totalEpochs: 0,
  loss: null,
  progress: 0,
  logs: [],
};

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
    const uploadsDir = path.join(process.cwd(), 'datasets', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const files = await fs.readdir(uploadsDir);
    const datasets = await Promise.all(
      files
        .filter(file => file.endsWith('.json') || file.endsWith('.jsonl'))
        .map(async (file) => {
          const filePath = path.join(uploadsDir, file);
          const stats = await fs.stat(filePath);
          
          // Try to count entries
          let entries = 0;
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            if (file.endsWith('.jsonl')) {
              entries = content.trim().split('\n').length;
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
    const filePath = path.join(process.cwd(), 'datasets', 'uploads', req.params.id);
    const content = await fs.readFile(filePath, 'utf-8');
    
    let validEntries = 0;
    let invalidEntries = 0;
    const errors = [];
    
    if (req.params.id.endsWith('.jsonl')) {
      const lines = content.trim().split('\n');
      lines.forEach((line, index) => {
        try {
          JSON.parse(line);
          validEntries++;
        } catch (error) {
          invalidEntries++;
          errors.push(`Line ${index + 1}: ${error.message}`);
        }
      });
    } else {
      try {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
          validEntries = json.length;
        } else {
          validEntries = 1;
        }
      } catch (error) {
        invalidEntries = 1;
        errors.push(error.message);
      }
    }
    
    res.json({ validEntries, invalidEntries, errors });
  } catch (error) {
    console.error('Error validating dataset:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// DELETE /api/admin/datasets/:id - Delete a dataset
router.delete('/datasets/:id', requireAdmin, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'datasets', 'uploads', req.params.id);
    await fs.unlink(filePath);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Delete failed' });
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
    
    // Initialize training state
    trainingState = {
      status: 'training',
      currentEpoch: 0,
      totalEpochs: epochs || 3,
      loss: null,
      progress: 0,
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: `Starting training with dataset: ${datasetId}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Parameters: epochs=${epochs}, batchSize=${batchSize}, lr=${learningRate}`,
        },
      ],
    };
    
    // Simulate training (replace with actual training logic)
    setTimeout(() => {
      trainingState.currentEpoch = 1;
      trainingState.loss = 0.5;
      trainingState.progress = 33;
      trainingState.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Epoch 1/3 completed - Loss: 0.5',
      });
    }, 5000);
    
    setTimeout(() => {
      trainingState.currentEpoch = 2;
      trainingState.loss = 0.3;
      trainingState.progress = 66;
      trainingState.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Epoch 2/3 completed - Loss: 0.3',
      });
    }, 10000);
    
    setTimeout(() => {
      trainingState.currentEpoch = 3;
      trainingState.loss = 0.2;
      trainingState.progress = 100;
      trainingState.status = 'idle';
      trainingState.logs.push({
        timestamp: new Date().toISOString(),
        message: 'Training completed successfully!',
      });
      
      // Add notification
      notifications.push({
        id: uuidv4(),
        message: `Training completed successfully! Final loss: ${trainingState.loss}`,
        timestamp: new Date().toISOString(),
      });
    }, 15000);
    
    res.json({ success: true, message: 'Training started' });
  } catch (error) {
    console.error('Error starting training:', error);
    res.status(500).json({ error: 'Failed to start training' });
  }
});

// POST /api/admin/training/stop - Stop training
router.post('/training/stop', requireAdmin, (req, res) => {
  if (trainingState.status !== 'training') {
    return res.status(400).json({ error: 'No training in progress' });
  }
  
  trainingState.status = 'idle';
  trainingState.logs.push({
    timestamp: new Date().toISOString(),
    message: 'Training stopped by user',
  });
  
  res.json({ success: true });
});

// Model Management Endpoints

// GET /api/admin/models - List all model versions
router.get('/models', requireAdmin, async (req, res) => {
  try {
    // In production, fetch from database and model storage
    const models = [
      {
        id: 'v1.0',
        version: 'OneSeek-7B-Zero.v1.0',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        trainingType: 'initial',
        samplesProcessed: 500,
        isCurrent: true,
        metrics: {
          loss: 0.245,
          accuracy: 89.5,
          fairness: 0.88,
        },
        metadata: {
          baseModel: 'Mistral-7B',
          loraRank: 8,
        },
      },
    ];
    
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
  // Simulate resource metrics (replace with actual system monitoring)
  const cpuUsage = Math.random() * 50 + 30; // 30-80%
  const gpuUsage = Math.random() * 60 + 20; // 20-80%
  
  resourceMetrics.cpu.push(cpuUsage);
  resourceMetrics.gpu.push(gpuUsage);
  
  // Keep only last 50 data points
  if (resourceMetrics.cpu.length > 50) {
    resourceMetrics.cpu = resourceMetrics.cpu.slice(-50);
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
