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

// Previous CPU usage snapshot for delta calculation
let previousCpuSnapshot = null;

let schedule = {
  frequency: 'manual',
  autoTrain: false,
  lastTraining: null,
  nextTraining: null,
};

let notifications = [];

// Training history storage file path
const TRAINING_HISTORY_FILE = path.join(process.cwd(), '..', 'ml', 'training_history.json');

// Helper function to load training history from file
async function loadTrainingHistory() {
  try {
    const historyDir = path.dirname(TRAINING_HISTORY_FILE);
    await fs.mkdir(historyDir, { recursive: true });
    
    const data = await fs.readFile(TRAINING_HISTORY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

// Helper function to save training history to file
async function saveTrainingHistory(history) {
  try {
    const historyDir = path.dirname(TRAINING_HISTORY_FILE);
    await fs.mkdir(historyDir, { recursive: true });
    
    await fs.writeFile(TRAINING_HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error saving training history:', error);
  }
}

// Helper function to add a training session to history
async function addTrainingSession(session) {
  const history = await loadTrainingHistory();
  history.push(session);
  
  // Keep only the last 50 sessions
  if (history.length > 50) {
    history.splice(0, history.length - 50);
  }
  
  await saveTrainingHistory(history);
}

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
    
    // Generate suggested name based on the naming convention: oneseek_<type>_<version>.jsonl
    const originalName = req.file.originalname;
    let suggestedName = originalName;
    
    // If the file doesn't follow the naming convention, suggest one
    if (!originalName.match(/^oneseek_[a-z]+_v[0-9.]+\.jsonl$/i)) {
      // Try to extract type from original name using word boundaries
      let datasetType = 'custom';
      const nameLower = originalName.toLowerCase();
      
      if (/\bidentity\b/.test(nameLower)) datasetType = 'identity';
      else if (/\bcivic\b/.test(nameLower)) datasetType = 'civic';
      else if (/\bpolicy\b/.test(nameLower)) datasetType = 'policy';
      else if (/\bqa\b/.test(nameLower)) datasetType = 'qa';
      
      suggestedName = `oneseek_${datasetType}_v1.0.jsonl`;
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
      suggestedName: suggestedName,
      namingConvention: 'oneseek_<type>_v<version>.jsonl (e.g., oneseek_identity_v1.0.jsonl)',
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
    // Determine Python command based on platform and virtual environment
    let pythonCommand;
    const venvPath = path.join(process.cwd(), 'python_services', 'venv');
    
    if (process.platform === 'win32') {
      // Windows: Check for virtual environment
      const venvPython = path.join(venvPath, 'Scripts', 'python.exe');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `Using virtual environment: ${venvPython}`,
        });
      } catch (error) {
        // Fallback to system python
        pythonCommand = 'python';
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: 'Virtual environment not found, using system python',
        });
      }
    } else {
      // Linux/Mac: Check for virtual environment
      const venvPython = path.join(venvPath, 'bin', 'python3');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `Using virtual environment: ${venvPython}`,
        });
      } catch (error) {
        // Fallback to system python3
        pythonCommand = 'python3';
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: 'Virtual environment not found, using system python3',
        });
      }
    }
    
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
    trainingProcess.on('close', async (code) => {
      const endTime = new Date().toISOString();
      const startTime = trainingState.logs[0]?.timestamp || endTime;
      const duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000);
      
      if (code === 0) {
        trainingState.status = 'idle';
        trainingState.progress = 100;
        trainingState.logs.push({
          timestamp: endTime,
          message: 'Training completed successfully!',
        });
        
        // Extract metrics from logs
        let finalLoss = trainingState.loss;
        let finalAccuracy = null;
        let finalFairness = null;
        
        // Parse logs for additional metrics
        for (const log of trainingState.logs) {
          const accMatch = log.message.match(/Accuracy[:\s]+([0-9.]+)/i);
          if (accMatch) finalAccuracy = parseFloat(accMatch[1]);
          
          const fairMatch = log.message.match(/Fairness[:\s]+([0-9.]+)/i);
          if (fairMatch) finalFairness = parseFloat(fairMatch[1]);
        }
        
        // Count samples processed from dataset
        let samplesProcessed = 0;
        try {
          const datasetPath = path.join(process.cwd(), '..', 'datasets', datasetId);
          const content = await fs.readFile(datasetPath, 'utf-8');
          if (datasetId.endsWith('.jsonl')) {
            samplesProcessed = content.trim().split('\n').filter(line => line.trim()).length;
          } else {
            const json = JSON.parse(content);
            samplesProcessed = Array.isArray(json) ? json.length : 1;
          }
        } catch (error) {
          console.error('Error counting samples:', error);
        }
        
        // Add training session to history
        const session = {
          modelVersion: 'OneSeek-7B-Zero',
          timestamp: endTime,
          duration: duration,
          samples: samplesProcessed * (epochs || 3), // samples * epochs
          dataset: datasetId,
          metrics: {
            loss: finalLoss,
            accuracy: finalAccuracy,
            fairness: finalFairness,
          },
          config: {
            epochs: epochs || 3,
            batchSize: batchSize || 8,
            learningRate: learningRate || 0.0001,
          },
        };
        
        await addTrainingSession(session);
        
        // Update schedule last training time
        schedule.lastTraining = endTime;
        
        // Save metadata to models directory
        try {
          const modelsDir = path.join(process.cwd(), '..', 'models', 'oneseek-7b-zero');
          const weightsDir = path.join(modelsDir, 'weights');
          await fs.mkdir(weightsDir, { recursive: true });
          
          // Determine next version number
          const existingFiles = await fs.readdir(weightsDir);
          const versionFiles = existingFiles.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
          const versions = versionFiles.map(f => {
            const match = f.match(/oneseek-7b-zero-v([0-9.]+)\.json/);
            return match ? match[1] : null;
          }).filter(v => v !== null);
          
          let nextVersion = '1.0';
          if (versions.length > 0) {
            // Parse versions properly (semantic versioning)
            const versionParts = versions.map(v => {
              const parts = v.split('.');
              return {
                original: v,
                major: parseInt(parts[0]) || 0,
                minor: parseInt(parts[1]) || 0
              };
            });
            
            // Find max version
            versionParts.sort((a, b) => {
              if (a.major !== b.major) return b.major - a.major;
              return b.minor - a.minor;
            });
            
            const maxVer = versionParts[0];
            nextVersion = `${maxVer.major}.${maxVer.minor + 1}`;
          }
          
          // Create metadata file
          const metadata = {
            version: `OneSeek-7B-Zero.v${nextVersion}`,
            createdAt: endTime,
            trainingType: 'identity',
            samplesProcessed: samplesProcessed,
            isCurrent: true,
            metrics: {
              loss: finalLoss,
              accuracy: finalAccuracy,
              fairness: finalFairness,
            },
            config: {
              epochs: epochs || 3,
              batchSize: batchSize || 8,
              learningRate: learningRate || 0.0001,
              dataset: datasetId,
            },
            baseModel: 'Mistral-7B',
            loraRank: 8,
          };
          
          const metadataPath = path.join(weightsDir, `oneseek-7b-zero-v${nextVersion}.json`);
          await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
          
          console.log(`Saved model metadata to ${metadataPath}`);
        } catch (error) {
          console.error('Error saving model metadata:', error);
        }
        
        // Add notification
        notifications.push({
          id: uuidv4(),
          message: `Training completed successfully! Final loss: ${finalLoss || 'N/A'}, Samples: ${samplesProcessed}`,
          timestamp: endTime,
        });
      } else {
        trainingState.status = 'idle';
        trainingState.logs.push({
          timestamp: endTime,
          message: `Training failed with exit code ${code}`,
        });
        
        notifications.push({
          id: uuidv4(),
          message: `Training failed with exit code ${code}`,
          timestamp: endTime,
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
    const modelsDir = path.join(process.cwd(), '..', 'models', 'oneseek-7b-zero', 'weights');
    const models = [];
    
    try {
      await fs.mkdir(modelsDir, { recursive: true });
      const files = await fs.readdir(modelsDir);
      
      // Filter for metadata JSON files
      const metadataFiles = files.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
      
      for (const file of metadataFiles) {
        const metadataPath = path.join(modelsDir, file);
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Extract version from filename as fallback
          const versionMatch = file.match(/oneseek-7b-zero-v([0-9.]+)\.json/);
          const versionId = versionMatch ? versionMatch[1] : 'unknown';
          
          models.push({
            id: versionId,
            version: metadata.version || `OneSeek-7B-Zero.v${versionId}`,
            createdAt: metadata.createdAt || new Date().toISOString(),
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
        } catch (error) {
          console.error(`Error reading metadata file ${file}:`, error);
        }
      }
      
      // Sort by version (newest first) using proper semantic versioning
      models.sort((a, b) => {
        const partsA = a.id.split('.').map(n => parseInt(n) || 0);
        const partsB = b.id.split('.').map(n => parseInt(n) || 0);
        
        // Compare major version
        if (partsA[0] !== partsB[0]) return partsB[0] - partsA[0];
        
        // Compare minor version
        return (partsB[1] || 0) - (partsA[1] || 0);
      });
      
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
  // Get current CPU snapshot
  const cpus = os.cpus();
  const currentSnapshot = cpus.map(cpu => ({
    idle: cpu.times.idle,
    total: Object.values(cpu.times).reduce((a, b) => a + b, 0)
  }));
  
  let cpuUsage = 0;
  
  if (previousCpuSnapshot && previousCpuSnapshot.length === currentSnapshot.length) {
    // Calculate CPU usage as the average across all cores
    // Only proceed if core count hasn't changed
    let totalUsage = 0;
    for (let i = 0; i < currentSnapshot.length; i++) {
      const idleDelta = currentSnapshot[i].idle - previousCpuSnapshot[i].idle;
      const totalDelta = currentSnapshot[i].total - previousCpuSnapshot[i].total;
      const usage = totalDelta > 0 ? (1 - idleDelta / totalDelta) * 100 : 0;
      totalUsage += usage;
    }
    cpuUsage = totalUsage / currentSnapshot.length;
  } else {
    // First call or core count changed, estimate based on current state
    let totalIdle = 0;
    let totalTick = 0;
    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    cpuUsage = totalTick > 0 ? 100 - (100 * totalIdle / totalTick) : 0;
  }
  
  // Update previous snapshot for next calculation
  previousCpuSnapshot = currentSnapshot;
  
  // Get memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memoryUsage = (usedMem / totalMem) * 100;
  
  // GPU usage - check if nvidia-smi is available
  let gpuUsage = 0;
  // Note: This would require spawning nvidia-smi which we'll keep at 0 for now
  // In production, you could use child_process to call nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader,nounits
  
  resourceMetrics.cpu.push(Math.round(cpuUsage * 10) / 10);
  resourceMetrics.memory.push(Math.round(memoryUsage * 10) / 10);
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
    // Load training history from file
    const history = await loadTrainingHistory();
    
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
