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
import { TRAINING_CONFIG, generateRunId, validateBaseModels, getAutoStopConfig } from '../config/trainingConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads with category support
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Save to datasets folder in project root (one level up from backend)
    // Check for category in the request body (requires parsing before file upload)
    const category = req.query.category || 'custom'; // Default to custom category
    const validCategories = ['politik', 'sverige', 'oneseek', 'custom'];
    const targetCategory = validCategories.includes(category) ? category : 'custom';
    
    const uploadDir = path.join(process.cwd(), '..', 'datasets', targetCategory);
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

// Dataset categories
const DATASET_CATEGORIES = ['politik', 'sverige', 'oneseek', 'custom'];

// Helper function to resolve dataset path (supports category/file format)
function resolveDatasetPath(datasetId) {
  const datasetsDir = path.join(process.cwd(), '..', 'datasets');
  // Dataset ID can be "category/filename.jsonl" or just "filename.jsonl"
  return path.join(datasetsDir, datasetId);
}

// Helper function to get filename from dataset ID
function getDatasetFilename(datasetId) {
  // Dataset ID can be "category/filename.jsonl" or just "filename.jsonl"
  return path.basename(datasetId);
}

// GET /api/admin/datasets - List all datasets
router.get('/datasets', requireAdmin, async (req, res) => {
  try {
    // Use datasets directory in project root (one level up from backend)
    const datasetsDir = path.join(process.cwd(), '..', 'datasets');
    await fs.mkdir(datasetsDir, { recursive: true });
    
    const datasets = [];
    const categories = {};
    
    // Initialize categories
    for (const cat of DATASET_CATEGORIES) {
      categories[cat] = [];
      const catDir = path.join(datasetsDir, cat);
      await fs.mkdir(catDir, { recursive: true });
    }
    
    // Helper to process dataset file
    const processDatasetFile = async (file, category, filePath) => {
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
        id: category ? `${category}/${file}` : file,
        name: file,
        category: category || 'root',
        size: stats.size,
        uploadedAt: stats.mtime.toISOString(),
        entries,
      };
    };
    
    // Read files from each category directory
    for (const category of DATASET_CATEGORIES) {
      const catDir = path.join(datasetsDir, category);
      try {
        const files = await fs.readdir(catDir);
        for (const file of files) {
          if (file.endsWith('.json') || file.endsWith('.jsonl')) {
            const filePath = path.join(catDir, file);
            const stats = await fs.stat(filePath);
            if (stats.isFile()) {
              const dataset = await processDatasetFile(file, category, filePath);
              datasets.push(dataset);
              categories[category].push(dataset);
            }
          }
        }
      } catch (error) {
        console.log(`Category ${category} directory not found or empty`);
      }
    }
    
    // Also read files from root datasets directory (legacy support)
    const rootFiles = await fs.readdir(datasetsDir);
    for (const file of rootFiles) {
      if ((file.endsWith('.json') || file.endsWith('.jsonl')) && !DATASET_CATEGORIES.includes(file)) {
        const filePath = path.join(datasetsDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          const dataset = await processDatasetFile(file, null, filePath);
          datasets.push(dataset);
        }
      }
    }
    
    res.json({ 
      datasets,
      categories,
      availableCategories: DATASET_CATEGORIES
    });
  } catch (error) {
    console.error('Error listing datasets:', error);
    res.status(500).json({ error: 'Failed to list datasets' });
  }
});

// GET /api/admin/models/available - List available models in models directory
router.get('/models/available', requireAdmin, async (req, res) => {
  try {
    // Check both Windows path and project-relative path
    const windowsModelsPath = 'C:\\Users\\robin\\Documents\\GitHub\\CivicAI\\models';
    const projectModelsPath = path.join(process.cwd(), '..', 'models');
    
    let modelsDir = projectModelsPath;
    
    // Try Windows path first
    try {
      await fs.access(windowsModelsPath);
      modelsDir = windowsModelsPath;
    } catch (error) {
      // Fall back to project-relative path
      try {
        await fs.access(projectModelsPath);
        modelsDir = projectModelsPath;
      } catch (innerError) {
        // Create directory if it doesn't exist
        await fs.mkdir(projectModelsPath, { recursive: true });
        modelsDir = projectModelsPath;
      }
    }
    
    const models = [];
    
    // First, check certified directory for DNA-based models
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    try {
      const certifiedEntries = await fs.readdir(certifiedDir, { withFileTypes: true });
      
      for (const entry of certifiedEntries) {
        if (!entry.isDirectory()) continue;
        if (entry.name === 'OneSeek-7B-Zero-CURRENT') continue; // Skip symlink
        
        // DNA-based directories: OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1
        if (!entry.name.startsWith('OneSeek-7B-Zero.v')) {
          if (entry.name.startsWith('run-')) continue; // Skip old temp directories
          continue;
        }
        
        const modelPath = path.join(certifiedDir, entry.name);
        const metadataPath = path.join(modelPath, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          models.push({
            id: entry.name,
            name: entry.name,
            path: modelPath,
            displayName: entry.name, // Use full DNA name as display
            dna: metadata.dna || entry.name,
            isCertified: true,
            language: metadata.language || 'unknown',
            datasets: metadata.datasets || [],
          });
        } catch (err) {
          console.log(`Skipping certified model ${entry.name}: ${err.message}`);
        }
      }
    } catch (err) {
      console.log('Certified directory not found or empty:', err.message);
    }
    
    // Also check root directory for legacy models
    const items = await fs.readdir(modelsDir);
    
    // Check each item to see if it's a model directory
    for (const item of items) {
      const itemPath = path.join(modelsDir, item);
      try {
        const stats = await fs.stat(itemPath);
        if (stats.isDirectory()) {
          // Skip certified directory (already processed above)
          if (item === 'oneseek-certified') continue;
          
          // Check if directory contains model files (weights, config, etc.)
          const dirContents = await fs.readdir(itemPath);
          const hasModelFiles = dirContents.some(file => 
            file.endsWith('.pth') || 
            file.endsWith('.bin') || 
            file.endsWith('.safetensors') ||
            file === 'config.json' ||
            file === 'weights' ||
            file === 'pytorch_model.bin'
          );
          
          if (hasModelFiles || dirContents.includes('weights') || dirContents.includes('base_models')) {
            models.push({
              id: item,
              name: item,
              path: itemPath,
              displayName: formatModelName(item),
              isCertified: false,
            });
          }
        }
      } catch (error) {
        console.error(`Error checking ${item}:`, error.message);
      }
    }
    
    res.json({ 
      models,
      modelsPath: modelsDir 
    });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models', message: error.message });
  }
});

// Helper function to format model names for display
function formatModelName(dirName) {
  // Convert directory name to display name
  // e.g., "gpt-sw3-20b-instruct" -> "GPT-SW3-20B-Instruct"
  // e.g., "oneseek-7b-zero" -> "OneSeek-7B-Zero"
  return dirName
    .split('-')
    .map(part => {
      // Convert numbers and version patterns to uppercase
      if (/^\d/.test(part) || /^v\d/.test(part)) {
        return part.toUpperCase();
      }
      // Capitalize first letter of words
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('-');
}

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
    if (!originalName.match(/^oneseek_[a-zA-Z]+_v[0-9.]+\.jsonl$/)) {
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
// Use wildcard to support paths like "politik/filename.jsonl"
router.get('/datasets/:id(*)/validate', requireAdmin, async (req, res) => {
  try {
    const filePath = resolveDatasetPath(req.params.id);
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = getDatasetFilename(req.params.id);
    
    let validEntries = 0;
    let invalidEntries = 0;
    const errors = [];
    
    if (filename.endsWith('.jsonl')) {
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
router.delete('/datasets/:id(*)', requireAdmin, async (req, res) => {
  try {
    const filePath = resolveDatasetPath(req.params.id);
    await fs.unlink(filePath);
    res.json({ success: true, message: 'Dataset deleted successfully' });
  } catch (error) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Delete failed', message: error.message });
  }
});

// GET /api/admin/datasets/:id/analyze-language - Analyze language distribution in dataset
router.get('/datasets/:id(*)/analyze-language', requireAdmin, async (req, res) => {
  try {
    const filePath = resolveDatasetPath(req.params.id);
    const content = await fs.readFile(filePath, 'utf-8');
    const filename = getDatasetFilename(req.params.id);
    
    let texts = [];
    
    // Extract texts from dataset
    if (filename.endsWith('.jsonl')) {
      const lines = content.trim().split('\n');
      lines.forEach((line) => {
        if (!line.trim()) return;
        try {
          const parsed = JSON.parse(line);
          const text = [
            parsed.instruction || '',
            parsed.input || '',
            parsed.output || '',
            parsed.question || '',
            parsed.response || ''
          ].filter(t => t).join(' ');
          if (text) texts.push(text);
        } catch (error) {
          // Skip invalid lines
        }
      });
    } else {
      try {
        const json = JSON.parse(content);
        const entries = Array.isArray(json) ? json : [json];
        entries.forEach((entry) => {
          const text = [
            entry.instruction || '',
            entry.input || '',
            entry.output || '',
            entry.question || '',
            entry.response || ''
          ].filter(t => t).join(' ');
          if (text) texts.push(text);
        });
      } catch (error) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }
    
    // Simple language detection based on character patterns
    let swedishCount = 0;
    let englishCount = 0;
    let otherCount = 0;
    
    const swedishPatterns = /[åäöÅÄÖ]/;
    const swedishWords = /\b(och|är|det|som|för|på|med|att|en|av|till|har|inte|från|kan|men|om|varit|skulle|vara|eller|blir|kommer|någon|också|alla|efter|finns|vid|bara|under|många|utan|där|dessa|dessa|genom|sedan|mellan|sina)\b/i;
    
    texts.forEach(text => {
      const hasSwedishChars = swedishPatterns.test(text);
      const hasSwedishWords = swedishWords.test(text);
      
      if (hasSwedishChars || hasSwedishWords) {
        swedishCount++;
      } else if (/[a-zA-Z]/.test(text)) {
        englishCount++;
      } else {
        otherCount++;
      }
    });
    
    const total = texts.length;
    const swedishPercent = total > 0 ? (swedishCount / total) * 100 : 0;
    const englishPercent = total > 0 ? (englishCount / total) * 100 : 0;
    const otherPercent = total > 0 ? (otherCount / total) * 100 : 0;
    
    // Determine primary language and suggested model
    let primaryLanguage = 'en';
    let suggestedModel = 'OneSeek-7B-Zero.v1.0.en';
    let languageCode = 'en';
    
    if (swedishPercent >= 70) {
      primaryLanguage = 'Swedish';
      languageCode = 'sv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.sv';
    } else if (englishPercent >= 70) {
      primaryLanguage = 'English';
      languageCode = 'en';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.en';
    } else if (swedishPercent >= 30 && englishPercent >= 30) {
      primaryLanguage = 'Mixed (Swedish/English)';
      languageCode = 'ensv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.ensv';
    } else if (swedishPercent > englishPercent) {
      primaryLanguage = 'Primarily Swedish';
      languageCode = 'sv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.sv';
    }
    
    res.json({
      totalSamples: total,
      languages: {
        swedish: { count: swedishCount, percent: swedishPercent.toFixed(1) },
        english: { count: englishCount, percent: englishPercent.toFixed(1) },
        other: { count: otherCount, percent: otherPercent.toFixed(1) }
      },
      primaryLanguage,
      languageCode,
      suggestedModel,
      recommendation: swedishPercent >= 70 
        ? `Strongly Swedish dataset - train as ${suggestedModel}`
        : englishPercent >= 70
        ? `Strongly English dataset - train as ${suggestedModel}`
        : swedishPercent >= 30 && englishPercent >= 30
        ? `Mixed language dataset (${swedishPercent.toFixed(0)}% sv, ${englishPercent.toFixed(0)}% en) - train as ${suggestedModel}`
        : `Primarily ${primaryLanguage} - train as ${suggestedModel}`
    });
  } catch (error) {
    console.error('Error analyzing dataset language:', error);
    res.status(500).json({ error: 'Language analysis failed', message: error.message });
  }
});

// POST /api/admin/datasets/analyze-multiple-languages - Analyze language distribution across multiple datasets
router.post('/datasets/analyze-multiple-languages', requireAdmin, async (req, res) => {
  try {
    const { datasetIds } = req.body;
    
    if (!datasetIds || !Array.isArray(datasetIds) || datasetIds.length === 0) {
      return res.status(400).json({ error: 'datasetIds array is required' });
    }
    
    let totalSwedish = 0;
    let totalEnglish = 0;
    let totalOther = 0;
    let totalSamples = 0;
    
    // Analyze each dataset and combine results
    for (const datasetId of datasetIds) {
      try {
        const filePath = resolveDatasetPath(datasetId);
        const content = await fs.readFile(filePath, 'utf-8');
        const filename = getDatasetFilename(datasetId);
        
        let texts = [];
        
        if (filename.endsWith('.jsonl')) {
          const lines = content.trim().split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const sample = JSON.parse(line);
              const text = sample.text || sample.question || sample.input || sample.instruction || sample.output || '';
              if (text) texts.push(text);
            } catch (err) {
              // Skip invalid JSON lines
            }
          }
        } else {
          try {
            const json = JSON.parse(content);
            const samples = Array.isArray(json) ? json : [json];
            for (const sample of samples) {
              const text = sample.text || sample.question || sample.input || sample.instruction || sample.output || '';
              if (text) texts.push(text);
            }
          } catch (err) {
            // Skip invalid JSON
          }
        }
        
        // Analyze language for this dataset's texts
        for (const text of texts.slice(0, Math.min(100, texts.length))) {
          const swedishPattern = /\b(och|att|är|som|för|med|till|på|av|i|det|jag|en|ett|inte|har|om|den|kan|man|dig|de|du|sig|från|men|var|vi|så|när|hon|han|nu|skulle|eller|blir|hade|vill|göra|finns|alla|mycket|ingen|bara|också|andra|själv|sedan|kommer|får|samma|utan|något|mellan|genom|varje|år|eftersom|därför|själva|över|under|både|stora|många|enligt|samt|denna|dessa|andra|några|lite|ganska|ofta|ibland|alltid|aldrig)\b/gi;
          const englishPattern = /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/gi;
          
          const swedishMatches = (text.match(swedishPattern) || []).length;
          const englishMatches = (text.match(englishPattern) || []).length;
          
          totalSamples++;
          if (swedishMatches > englishMatches) {
            totalSwedish++;
          } else if (englishMatches > swedishMatches) {
            totalEnglish++;
          } else {
            totalOther++;
          }
        }
      } catch (error) {
        console.error(`Error analyzing dataset ${datasetId}:`, error);
        // Continue with other datasets
      }
    }
    
    // Calculate percentages
    const total = totalSwedish + totalEnglish + totalOther || 1;
    const swedishPercent = (totalSwedish / total) * 100;
    const englishPercent = (totalEnglish / total) * 100;
    const otherPercent = (totalOther / total) * 100;
    
    // Determine primary language and suggested model
    let primaryLanguage = 'en';
    let suggestedModel = 'OneSeek-7B-Zero.v1.0.en';
    let languageCode = 'en';
    
    if (swedishPercent >= 70) {
      primaryLanguage = 'Swedish';
      languageCode = 'sv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.sv';
    } else if (englishPercent >= 70) {
      primaryLanguage = 'English';
      languageCode = 'en';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.en';
    } else if (swedishPercent >= 30 && englishPercent >= 30) {
      primaryLanguage = 'Mixed (Swedish/English)';
      languageCode = 'ensv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.ensv';
    } else if (swedishPercent > englishPercent) {
      primaryLanguage = 'Primarily Swedish';
      languageCode = 'sv';
      suggestedModel = 'OneSeek-7B-Zero.v1.0.sv';
    }
    
    res.json({
      totalSamples: total,
      languages: {
        swedish: { count: totalSwedish, percent: swedishPercent.toFixed(1) },
        english: { count: totalEnglish, percent: englishPercent.toFixed(1) },
        other: { count: totalOther, percent: otherPercent.toFixed(1) }
      },
      primaryLanguage,
      languageCode,
      suggestedModel,
      recommendation: swedishPercent >= 70 
        ? `Strongly Swedish dataset - train as ${suggestedModel}`
        : englishPercent >= 70
        ? `Strongly English dataset - train as ${suggestedModel}`
        : swedishPercent >= 30 && englishPercent >= 30
        ? `Mixed language dataset (${swedishPercent.toFixed(0)}% sv, ${englishPercent.toFixed(0)}% en) - train as ${suggestedModel}`
        : `Primarily ${primaryLanguage} - train as ${suggestedModel}`
    });
  } catch (error) {
    console.error('Error analyzing multiple datasets:', error);
    res.status(500).json({ error: 'Language analysis failed', message: error.message });
  }
});

// Training Control Endpoints

// GET /api/admin/training/status - Get training status
router.get('/training/status', requireAdmin, (req, res) => {
  res.json(trainingState);
});

// POST /api/admin/training/start - DEPRECATED: Use /api/admin/training/start-dna-v2 instead
// This endpoint is disabled to enforce DNA v2 structure migration
router.post('/training/start', requireAdmin, async (req, res) => {
  // Legacy endpoint disabled - redirect to DNA v2
  return res.status(410).json({ 
    error: 'Legacy training endpoint is deprecated',
    message: 'Please use DNA v2 training instead. This ensures all models use the certified structure.',
    endpoint: '/api/admin/training/start-dna-v2',
    migration: 'All new training must use the DNA-based certified structure in /models/oneseek-certified/'
  });
  
  /* LEGACY CODE DISABLED - DO NOT USE
  try {
    const { datasetId, epochs, batchSize, learningRate, language, externalModel } = req.body;
    
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
    */ // END LEGACY CODE DISABLED
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

// POST /api/admin/training/start-dna-v2 - Start DNA v2 training with adaptive weights
router.post('/training/start-dna-v2', requireAdmin, async (req, res) => {
  try {
    const { 
      datasetId, datasetIds, epochs, learningRate, autoStopThreshold, autoStopPatience, seed, baseModels,
      // Advanced LoRA parameters
      loraRank, loraAlpha, lrScheduler, warmupSteps, weightDecay, maxGradNorm,
      precision, optimizer, gradientCheckpointing, torchCompile, targetModules, dropout
    } = req.body;
    
    // Accept either datasetId (single) or datasetIds (multiple)
    const datasets = datasetIds || (datasetId ? [datasetId] : []);
    
    if (datasets.length === 0) {
      return res.status(400).json({ error: 'At least one dataset is required' });
    }

    if (!baseModels || baseModels.length === 0) {
      return res.status(400).json({ error: 'At least one base model is required for DNA v2 training' });
    }
    
    if (trainingState.status === 'training') {
      return res.status(400).json({ error: 'Training already in progress' });
    }
    
    // Verify all datasets exist (supports category paths like "politik/file.jsonl")
    for (const dsId of datasets) {
      const datasetPath = resolveDatasetPath(dsId);
      try {
        await fs.access(datasetPath);
      } catch (error) {
        return res.status(404).json({ error: `Dataset not found: ${dsId}`, path: datasetPath });
      }
    }
    
    // If multiple datasets, merge them into a temporary combined dataset
    let finalDatasetPath;
    let finalDatasetId;
    
    if (datasets.length > 1) {
      // Create merged dataset in custom folder
      const mergedDatasetId = `custom/merged_${Date.now()}.jsonl`;
      finalDatasetPath = resolveDatasetPath(mergedDatasetId);
      finalDatasetId = mergedDatasetId;
      
      // Merge all datasets into one JSONL file
      let mergedContent = '';
      for (const dsId of datasets) {
        const dsPath = resolveDatasetPath(dsId);
        const content = await fs.readFile(dsPath, 'utf-8');
        const filename = getDatasetFilename(dsId);
        
        if (filename.endsWith('.jsonl')) {
          mergedContent += content.trim() + '\n';
        } else {
          // Convert JSON to JSONL
          try {
            const json = JSON.parse(content);
            const samples = Array.isArray(json) ? json : [json];
            for (const sample of samples) {
              mergedContent += JSON.stringify(sample) + '\n';
            }
          } catch (err) {
            console.error(`Error parsing ${dsId}:`, err);
          }
        }
      }
      
      await fs.writeFile(finalDatasetPath, mergedContent);
      
      trainingState.logs = trainingState.logs || [];
      trainingState.logs.push({
        timestamp: new Date().toISOString(),
        message: `Merged ${datasets.length} datasets into ${mergedDatasetId}`,
      });
    } else {
      finalDatasetId = datasets[0];
      finalDatasetPath = resolveDatasetPath(finalDatasetId);
    }
    
    // Validate that base models are selected (not using defaults)
    try {
      validateBaseModels(baseModels);
    } catch (error) {
      trainingState.status = 'idle';
      return res.status(400).json({ error: error.message });
    }
    
    // Analyze dataset language before training
    let languageCode = 'en';
    try {
      const datasetContent = await fs.readFile(finalDatasetPath, 'utf-8');
      const lines = datasetContent.trim().split('\n').filter(line => line.trim());
      
      let swedishCount = 0;
      let englishCount = 0;
      
      for (const line of lines.slice(0, Math.min(100, lines.length))) {
        try {
          const sample = JSON.parse(line);
          // Check multiple possible field names for text content
          const text = sample.text || sample.question || sample.input || sample.instruction || sample.output || '';
          
          if (text) {
            const swedishPattern = /\b(och|att|är|som|för|med|till|på|av|i|det|jag|en|ett|inte|har|om|den|kan|man|dig|de|du|sig|från|men|var|vi|så|när|hon|han|nu|skulle|eller|blir|hade|vill|göra|finns|alla|mycket|ingen|bara|också|andra|själv|sedan|kommer|får|samma|utan|något|mellan|genom|varje|år|eftersom|därför|själva|över|under|både|stora|många|enligt|samt|denna|dessa|andra|några|lite|ganska|ofta|ibland|alltid|aldrig)\b/gi;
            const englishPattern = /\b(the|be|to|of|and|a|in|that|have|I|it|for|not|on|with|he|as|you|do|at|this|but|his|by|from|they|we|say|her|she|or|an|will|my|one|all|would|there|their|what|so|up|out|if|about|who|get|which|go|me|when|make|can|like|time|no|just|him|know|take|people|into|year|your|good|some|could|them|see|other|than|then|now|look|only|come|its|over|think|also|back|after|use|two|how|our|work|first|well|way|even|new|want|because|any|these|give|day|most|us)\b/gi;
            
            const swedishMatches = (text.match(swedishPattern) || []).length;
            const englishMatches = (text.match(englishPattern) || []).length;
            
            if (swedishMatches > englishMatches) {
              swedishCount++;
            } else if (englishMatches > swedishMatches) {
              englishCount++;
            }
          }
        } catch (err) {
          // Skip invalid JSON lines
        }
      }
      
      const total = swedishCount + englishCount || 1;
      const swedishPercent = (swedishCount / total) * 100;
      const englishPercent = (englishCount / total) * 100;
      
      // Determine language code
      if (swedishPercent >= 70) {
        languageCode = 'sv';
      } else if (englishPercent >= 70) {
        languageCode = 'en';
      } else if (swedishPercent >= 30 && englishPercent >= 30) {
        languageCode = 'ensv';
      } else if (swedishPercent > englishPercent) {
        languageCode = 'sv';
      }
    } catch (error) {
      console.error('Error analyzing language:', error);
      // Default to 'en' if analysis fails
    }
    
    // Initialize training state with proper runId (no colons in timestamp)
    const runId = generateRunId();
    trainingState = {
      status: 'training',
      runId: runId,
      currentEpoch: 0,
      totalEpochs: epochs || TRAINING_CONFIG.defaults.epochs,
      loss: null,
      progress: 0,
      datasetId: finalDatasetId,
      datasets: datasets, // Store all dataset IDs
      useDnaV2: true,
      mode: 'dna-v2', // Explicitly set mode to prevent legacy metadata creation
      baseModels: baseModels,
      language: languageCode, // Store detected language
      logs: [
        {
          timestamp: new Date().toISOString(),
          message: `Starting DNA v2 training with ${datasets.length} dataset(s): ${datasets.join(', ')}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Run ID: ${runId}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Detected language: ${languageCode}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Base models (${baseModels.length}): ${baseModels.join(', ')}`,
        },
        {
          timestamp: new Date().toISOString(),
          message: `Parameters: epochs=${epochs || TRAINING_CONFIG.defaults.epochs}, lr=${learningRate || TRAINING_CONFIG.defaults.learning_rate}, auto-stop=${autoStopThreshold || TRAINING_CONFIG.confidence_auto_stop.threshold}/${autoStopPatience || TRAINING_CONFIG.confidence_auto_stop.patience}`,
        },
      ],
    };
    
    // Path to DNA v2 Python script
    const pythonScript = path.join(process.cwd(), '..', 'scripts', 'train_dna_v2.py');
    
    // Check if Python script exists
    try {
      await fs.access(pythonScript);
    } catch (error) {
      trainingState.status = 'idle';
      return res.status(500).json({ 
        error: 'DNA v2 training script not found', 
        message: `scripts/train_dna_v2.py does not exist at ${pythonScript}`,
      });
    }
    
    // Determine Python command - use venv from backend/python_services/venv
    let pythonCommand;
    const venvPath = path.join(process.cwd(), 'python_services', 'venv');
    
    if (process.platform === 'win32') {
      const venvPython = path.join(venvPath, 'Scripts', 'python.exe');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[VENV] Using venv Python: ${venvPython}`,
        });
      } catch {
        pythonCommand = 'python';
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[WARNING] venv not found at ${venvPython}, using system Python`,
        });
      }
    } else {
      const venvPython = path.join(venvPath, 'bin', 'python3');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[VENV] Using venv Python: ${venvPython}`,
        });
      } catch {
        pythonCommand = 'python3';
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message: `[WARNING] venv not found at ${venvPython}, using system Python`,
        });
      }
    }
    
    // Build Python script arguments with configuration defaults
    const pythonArgs = [
      pythonScript,
      '--dataset', `datasets/${finalDatasetId}`,
      '--epochs', String(epochs || TRAINING_CONFIG.defaults.epochs),
      '--learning-rate', String(learningRate || TRAINING_CONFIG.defaults.learning_rate),
      '--auto-stop-threshold', String(autoStopThreshold || TRAINING_CONFIG.confidence_auto_stop.threshold),
      '--auto-stop-patience', String(autoStopPatience || TRAINING_CONFIG.confidence_auto_stop.patience),
      '--seed', String(seed || TRAINING_CONFIG.defaults.seed),
      '--language', languageCode, // Pass detected language to Python script
    ];
    
    // Add advanced LoRA parameters if provided
    if (loraRank !== undefined) {
      pythonArgs.push('--lora-rank', String(loraRank));
    }
    if (loraAlpha !== undefined) {
      pythonArgs.push('--lora-alpha', String(loraAlpha));
    }
    if (lrScheduler) {
      pythonArgs.push('--lr-scheduler', lrScheduler);
    }
    if (warmupSteps !== undefined) {
      pythonArgs.push('--warmup-steps', String(warmupSteps));
    }
    if (weightDecay !== undefined) {
      pythonArgs.push('--weight-decay', String(weightDecay));
    }
    if (maxGradNorm !== undefined) {
      pythonArgs.push('--max-grad-norm', String(maxGradNorm));
    }
    if (precision) {
      pythonArgs.push('--precision', precision);
    }
    if (optimizer) {
      pythonArgs.push('--optimizer', optimizer);
    }
    if (gradientCheckpointing === false) {
      pythonArgs.push('--no-gradient-checkpointing');
    }
    if (torchCompile === false) {
      pythonArgs.push('--no-torch-compile');
    }
    if (targetModules) {
      pythonArgs.push('--target-modules', targetModules);
    }
    if (dropout !== undefined) {
      pythonArgs.push('--dropout', String(dropout));
    }

    
    trainingState.logs.push({
      timestamp: new Date().toISOString(),
      message: `Command: ${pythonCommand} ${pythonArgs.join(' ')}`,
    });
    
    // Set environment variables
    const env = {
      ...process.env,
      MODELS_DIR: 'models',
      BASE_MODELS: baseModels.join(','),  // Pass selected base models
      RUN_ID: runId,  // Pass run_id to Python script for consistent tracking
    };
    
    // Add ledger configuration if available
    if (process.env.LEDGER_URL) {
      env.LEDGER_URL = process.env.LEDGER_URL;
    }
    if (process.env.LEDGER_PRIVATE_KEY_PATH) {
      env.LEDGER_PRIVATE_KEY_PATH = process.env.LEDGER_PRIVATE_KEY_PATH;
    }
    
    trainingProcess = spawn(pythonCommand, pythonArgs, {
      cwd: path.join(process.cwd(), '..'),
      env: env,
    });
    
    // Handle stdout
    trainingProcess.stdout.on('data', (data) => {
      const message = data.toString().trim();
      if (message) {
        trainingState.logs.push({
          timestamp: new Date().toISOString(),
          message,
        });
        
        // Parse epoch progress
        const epochMatch = message.match(/Epoch (\d+)\/(\d+)/);
        if (epochMatch) {
          trainingState.currentEpoch = parseInt(epochMatch[1]);
          trainingState.totalEpochs = parseInt(epochMatch[2]);
          trainingState.progress = Math.round((trainingState.currentEpoch / trainingState.totalEpochs) * 100);
        }
        
        // Parse loss
        const lossMatch = message.match(/loss[=:]\s*([0-9.]+)/i);
        if (lossMatch) {
          trainingState.loss = parseFloat(lossMatch[1]);
        }
        
        // Parse DNA
        const dnaMatch = message.match(/DNA:\s*(OneSeek-7B-Zero\.v[\w.]+)/);
        if (dnaMatch) {
          trainingState.dna = dnaMatch[1];
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
      
      if (code === 0) {
        trainingState.status = 'idle';
        trainingState.logs.push({
          timestamp: endTime,
          message: `Training completed successfully with DNA v2!`,
        });
        
        // Try to load DNA v2 training results from the most recent run
        let trainingResults = null;
        try {
          const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
          const runs = await fs.readdir(certifiedDir);
          
          // Find the most recent run directory
          const runDirs = [];
          for (const dir of runs) {
            const dirPath = path.join(certifiedDir, dir);
            const stats = await fs.stat(dirPath);
            if (stats.isDirectory()) {
              runDirs.push({ name: dir, mtime: stats.mtime });
            }
          }
          
          if (runDirs.length > 0) {
            // Sort by modification time (most recent first)
            runDirs.sort((a, b) => b.mtime - a.mtime);
            const latestRun = runDirs[0].name;
            
            const resultsPath = path.join(certifiedDir, latestRun, 'training_results.json');
            const resultsData = await fs.readFile(resultsPath, 'utf-8');
            trainingResults = JSON.parse(resultsData);
          }
        } catch (error) {
          console.log('Could not load training_results.json, using state data:', error.message);
        }
        
        // Extract DNA and metrics
        const dna = trainingResults?.dna || trainingState.dna;
        const immutableHash = trainingResults?.immutable_hash;
        const finalWeights = trainingResults?.final_weights || {};
        const trainingHistory = trainingResults?.training_history || [];
        
        // Calculate training duration
        const duration = Math.round((new Date(endTime) - new Date(startTime)) / 1000);
        
        // Get final loss from training history or state
        let finalLoss = trainingState.loss;
        if (trainingHistory.length > 0) {
          const lastEpoch = trainingHistory[trainingHistory.length - 1];
          finalLoss = lastEpoch.loss || finalLoss;
        }
        
        // Count samples from dataset
        let samplesProcessed = 0;
        let languageAnalysis = null;
        try {
          const finalDsPath = path.join(process.cwd(), '..', 'datasets', trainingState.datasetId);
          const datasetContent = await fs.readFile(finalDsPath, 'utf-8');
          samplesProcessed = datasetContent.trim().split('\n').filter(line => line.trim()).length;
          
          // Analyze language distribution (use multi-dataset analysis if multiple datasets)
          try {
            if (trainingState.datasets && trainingState.datasets.length > 1) {
              const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/admin/datasets/analyze-multiple-languages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ datasetIds: trainingState.datasets }),
              });
              if (response.ok) {
                languageAnalysis = await response.json();
              }
            } else {
              const response = await fetch(`http://localhost:${process.env.PORT || 3001}/api/admin/datasets/${trainingState.datasetId}/analyze-language`);
              if (response.ok) {
                languageAnalysis = await response.json();
              }
            }
          } catch (err) {
            console.log('Could not analyze language:', err.message);
          }
          
          // Clean up merged dataset file if it was created
          if (trainingState.datasets && trainingState.datasets.length > 1 && trainingState.datasetId.startsWith('merged_')) {
            try {
              await fs.unlink(finalDsPath);
              console.log(`Cleaned up merged dataset: ${trainingState.datasetId}`);
            } catch (err) {
              console.error('Error cleaning up merged dataset:', err);
            }
          }
        } catch (error) {
          console.log('Could not count samples:', error.message);
        }
        
        // Save to training history
        await addTrainingSession({
          modelName: 'OneSeek-7B-Zero',
          dna: dna,
          timestamp: endTime,
          duration: duration,
          samplesProcessed: samplesProcessed,
          finalLoss: finalLoss,
          accuracy: null, // DNA v2 doesn't track accuracy during training
          baseModels: baseModels,
          epochs: trainingState.totalEpochs,
          autoStopped: trainingHistory.some(e => e.auto_stopped),
          immutableHash: immutableHash,
        });
        
        // Update training schedule
        schedule.lastTraining = endTime;
        
        // SKIP legacy metadata file creation for DNA v2 training
        // The certified directory structure already has metadata.json in the DNA-named directory
        // Creating a legacy metadata file causes duplicate model listings in the admin panel
        // Legacy metadata is only needed for old-style training (non-DNA v2)
        console.log(`[DNA CHECK] dna=${dna}, mode=${trainingState.mode}, should skip legacy=${trainingState.mode === 'dna-v2'}`);
        if (dna && trainingState.mode !== 'dna-v2') {
          // Only create legacy metadata for non-DNA-v2 training
          console.log('[LEGACY] Creating legacy metadata file (mode is NOT dna-v2)');
          try {
            // Extract version from DNA (e.g., "OneSeek-7B-Zero.v1.0.abcd1234..." -> "1.0")
            const versionMatch = dna.match(/OneSeek-7B-Zero\.v([0-9.]+)/);
            const version = versionMatch ? versionMatch[1] : '1.0';
            
            // Create model metadata
            const modelsDir = path.join(process.cwd(), '..', 'models', 'oneseek-7b-zero', 'weights');
            await fs.mkdir(modelsDir, { recursive: true });
            
            // Clear isCurrent flag from all existing models first
            try {
              const files = await fs.readdir(modelsDir);
              const metadataFiles = files.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
              
              for (const file of metadataFiles) {
                const filePath = path.join(modelsDir, file);
                try {
                  const content = await fs.readFile(filePath, 'utf-8');
                  const meta = JSON.parse(content);
                  if (meta.isCurrent) {
                    meta.isCurrent = false;
                    await fs.writeFile(filePath, JSON.stringify(meta, null, 2));
                  }
                } catch (err) {
                  console.error(`Error updating ${file}:`, err);
                }
              }
            } catch (err) {
              console.error('Error clearing isCurrent flags:', err);
            }
            
            const metadataPath = path.join(modelsDir, `oneseek-7b-zero-v${version}.json`);
            const metadata = {
              version: dna,
              createdAt: endTime,
              trainingType: 'legacy',
              samplesProcessed: samplesProcessed,
              isCurrent: true,
              metrics: {
                loss: finalLoss,
                accuracy: null,
                fairness: null,
              },
              dna: {
                fingerprint: dna,
                immutableHash: immutableHash,
                finalWeights: finalWeights,
                baseModels: baseModels,
                languageAnalysis: languageAnalysis || null,
              },
              training: {
                epochs: trainingState.totalEpochs,
                duration: duration,
                autoStopped: trainingHistory.some(e => e.auto_stopped),
              },
            };
            
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
            
            trainingState.logs.push({
              timestamp: endTime,
              message: `Legacy model metadata saved: ${metadataPath}`,
            });
          } catch (error) {
            console.error('Error saving legacy model metadata:', error);
            trainingState.logs.push({
              timestamp: endTime,
              message: `[WARNING] Could not save legacy model metadata: ${error.message}`,
            });
          }
        } else if (dna && trainingState.mode === 'dna-v2') {
          // For DNA v2 training, metadata is already created by train_dna_v2.py in the certified directory
          // However, we need to update it with the final calculated metrics
          try {
            const certifiedDir = path.join(process.cwd(), '..', 'models', 'oneseek-certified');
            const certifiedModelPath = path.join(certifiedDir, dna);
            const certifiedMetadataPath = path.join(certifiedModelPath, 'metadata.json');
            
            // Read existing metadata
            const existingMetadata = JSON.parse(await fs.readFile(certifiedMetadataPath, 'utf-8'));
            
            // Update with calculated metrics
            existingMetadata.metrics = {
              loss: finalLoss,
              accuracy: null, // DNA v2 doesn't track accuracy during training
              fairness: null,
            };
            existingMetadata.samplesProcessed = samplesProcessed;
            
            // Write updated metadata
            await fs.writeFile(certifiedMetadataPath, JSON.stringify(existingMetadata, null, 2));
            
            trainingState.logs.push({
              timestamp: endTime,
              message: `Updated certified model metadata with final metrics: ${certifiedMetadataPath}`,
            });
          } catch (error) {
            console.error('Error updating certified metadata:', error);
            trainingState.logs.push({
              timestamp: endTime,
              message: `[WARNING] Could not update certified metadata: ${error.message}`,
            });
          }
        } else if (dna) {
          // Explicitly log that we're skipping legacy for DNA v2
          console.log('[DNA V2] Skipping legacy metadata creation - using certified structure');
          trainingState.logs.push({
            timestamp: endTime,
            message: `Model metadata saved in certified directory: ${dna}`,
          });
        }
        
        notifications.push({
          id: uuidv4(),
          message: `DNA v2 training completed successfully! DNA: ${dna || 'Check logs'}`,
          timestamp: endTime,
        });
        
        // Store DNA in training state for retrieval
        if (dna) {
          trainingState.logs.push({
            timestamp: endTime,
            message: `Model DNA: ${dna}`,
          });
        }
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
    
    trainingProcess.on('error', (error) => {
      trainingState.status = 'idle';
      trainingState.logs.push({
        timestamp: new Date().toISOString(),
        message: `Process error: ${error.message}`,
      });
      trainingProcess = null;
    });
    
    res.json({ success: true, message: 'DNA v2 training started' });
  } catch (error) {
    console.error('Error starting DNA v2 training:', error);
    trainingState.status = 'idle';
    res.status(500).json({ error: 'Failed to start training', message: error.message });
  }
});

// Model Management Endpoints

// GET /api/admin/models/discover-base - Discover base models in models/ directory
router.get('/models/discover-base', requireAdmin, async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const discoveredModels = [];

    try {
      const entries = await fs.readdir(modelsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const modelDir = path.join(modelsDir, entry.name);
        
        // Check for model indicator files
        const hasConfig = await fs.access(path.join(modelDir, 'config.json')).then(() => true).catch(() => false);
        const hasTokenizer = await fs.access(path.join(modelDir, 'tokenizer_config.json')).then(() => true).catch(() => false);
        const hasPytorchModel = await fs.access(path.join(modelDir, 'pytorch_model.bin')).then(() => true).catch(() => false);
        const hasSafetensors = await fs.access(path.join(modelDir, 'model.safetensors')).then(() => true).catch(() => false);
        const hasAdapter = await fs.access(path.join(modelDir, 'adapter_model.bin')).then(() => true).catch(() => false);
        
        if (hasConfig || hasTokenizer || hasPytorchModel || hasSafetensors || hasAdapter) {
          let parameters = 'unknown';
          let modelType = 'causal_lm';
          
          // Try to read config for more info
          if (hasConfig) {
            try {
              const configContent = await fs.readFile(path.join(modelDir, 'config.json'), 'utf-8');
              const config = JSON.parse(configContent);
              modelType = config.model_type || 'causal_lm';
              
              // Estimate parameters from config
              const hiddenSize = config.hidden_size || 0;
              const numLayers = config.num_hidden_layers || 0;
              if (hiddenSize > 0 && numLayers > 0) {
                const estParams = (hiddenSize / 1024) * numLayers * 12;
                if (estParams > 1000) {
                  parameters = `${(estParams / 1000).toFixed(1)}B`;
                } else {
                  parameters = `${estParams.toFixed(0)}M`;
                }
              }
            } catch (error) {
              console.error(`Error reading config for ${entry.name}:`, error);
            }
          }
          
          discoveredModels.push({
            name: entry.name,
            path: modelDir,
            type: modelType,
            parameters: parameters,
          });
        }
      }
      
      // Also add trained OneSeek models from weights directory
      try {
        const weightsDir = path.join(modelsDir, 'oneseek-7b-zero', 'weights');
        const weightFiles = await fs.readdir(weightsDir);
        const metadataFiles = weightFiles.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
        
        for (const file of metadataFiles) {
          try {
            const filePath = path.join(weightsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const metadata = JSON.parse(content);
            const dna = metadata.dna?.fingerprint || metadata.version;
            
            if (dna && metadata.isCurrent) {
              discoveredModels.push({
                name: dna,
                path: weightsDir,
                type: 'oneseek-trained',
                parameters: '7B',
                isCurrent: true,
                language: metadata.dna?.languageAnalysis?.languageCode || 'unknown',
              });
            }
          } catch (err) {
            console.error(`Error reading ${file}:`, err);
          }
        }
      } catch (err) {
        // Weights directory doesn't exist or is empty
      }
      
      res.json({ models: discoveredModels });
    } catch (error) {
      console.error('Error reading models directory:', error);
      res.json({ models: [] });
    }
  } catch (error) {
    console.error('Error discovering base models:', error);
    res.status(500).json({ error: 'Failed to discover base models', message: error.message });
  }
});

// GET /api/admin/models - List all model versions
router.get('/models', requireAdmin, async (req, res) => {
  try {
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const legacyWeightsDir = path.join(modelsDir, 'oneseek-7b-zero', 'weights');
    const models = [];
    
    // First, check for DNA-based certified models
    try {
      await fs.mkdir(certifiedDir, { recursive: true });
      const entries = await fs.readdir(certifiedDir, { withFileTypes: true });
      
      for (const entry of entries) {
        // Skip non-directories and special files
        if (!entry.isDirectory()) continue;
        if (entry.name === 'OneSeek-7B-Zero-CURRENT') continue; // Skip symlink
        
        // DNA-based directories have format: OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1
        if (!entry.name.startsWith('OneSeek-7B-Zero.v')) {
          // Also skip run-* directories (old temp format)
          if (entry.name.startsWith('run-')) continue;
          continue;
        }
        
        const modelPath = path.join(certifiedDir, entry.name);
        const metadataPath = path.join(modelPath, 'metadata.json');
        
        try {
          // Check if metadata.json exists
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Extract components from directory name
          // Format: OneSeek-7B-Zero.v1.0.sv.dsCivicID-SwedID.141521ad.90cdf6f1
          const nameParts = entry.name.split('.');
          const versionPart = nameParts[1]; // v1.0
          const versionId = versionPart.replace('v', ''); // 1.0
          
          models.push({
            id: entry.name, // Full DNA-based directory name
            version: metadata.version || `OneSeek-7B-Zero.v${versionId}`,
            dna: metadata.dna || entry.name,
            directoryName: entry.name,
            createdAt: metadata.createdAt || new Date().toISOString(),
            trainingType: metadata.trainingType || 'dna-v2',
            samplesProcessed: metadata.samplesProcessed || 0,
            isCurrent: false, // Will be updated below by checking symlink
            metrics: metadata.metrics || {
              loss: null,
              accuracy: null,
              fairness: null,
            },
            weights: null,
            baseModels: metadata.baseModel ? [metadata.baseModel] : [],
            baseModel: metadata.baseModel || 'Unknown',
            language: metadata.language || 'unknown',
            datasets: metadata.datasets || [],
            training: null,
            metadata: metadata,
            isCertified: true,
          });
        } catch (error) {
          console.log(`Skipping ${entry.name}: ${error.message}`);
        }
      }
    } catch (error) {
      console.log('Certified directory not found or empty:', error.message);
    }
    
    // Check which model is current by reading symlink
    try {
      const symlinkPath = path.join(certifiedDir, 'OneSeek-7B-Zero-CURRENT');
      let currentTarget = null;
      
      try {
        // Try to read symlink
        currentTarget = await fs.readlink(symlinkPath);
        // Convert to basename if it's a path
        currentTarget = path.basename(currentTarget);
      } catch (e) {
        // Try marker file
        const markerPath = symlinkPath + '.txt';
        try {
          const markerContent = await fs.readFile(markerPath, 'utf-8');
          currentTarget = path.basename(markerContent.trim());
        } catch (e2) {
          // No current model set
        }
      }
      
      if (currentTarget) {
        const currentModel = models.find(m => m.directoryName === currentTarget || m.id === currentTarget);
        if (currentModel) {
          currentModel.isCurrent = true;
        }
      }
    } catch (error) {
      console.log('Could not determine current model:', error.message);
    }
    
    // Fallback: check legacy weights directory for old metadata files
    try {
      await fs.mkdir(legacyWeightsDir, { recursive: true });
      const files = await fs.readdir(legacyWeightsDir);
      
      // Filter for metadata JSON files
      // Prioritize double-dot files (..) which are the correct format
      // e.g., oneseek-7b-zero-v1.0..json is correct, oneseek-7b-zero-v1.0.json is incorrect
      const metadataFiles = files.filter(f => 
        (f.startsWith('oneseek-7b-zero-v') && f.endsWith('..json')) || // Correct format with ..
        (f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json') && !f.endsWith('..json')) // Fallback
      );
      
      for (const file of metadataFiles) {
        const metadataPath = path.join(legacyWeightsDir, file);
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          
          // Extract version from filename as fallback
          // Handle both double-dot (..) and single-dot (.) files
          const versionMatch = file.match(/oneseek-7b-zero-v([0-9.]+)\.+json/);
          const versionId = versionMatch ? versionMatch[1] : 'unknown';
          
          models.push({
            id: versionId, // Use version ID for legacy models
            version: metadata.version || `OneSeek-7B-Zero.v${versionId}`,
            dna: metadata.dna?.fingerprint || null,  // Don't fallback to version - keep separate
            directoryName: null, // No DNA directory for legacy
            createdAt: metadata.createdAt || new Date().toISOString(),
            trainingType: metadata.trainingType || 'unknown',
            samplesProcessed: metadata.samplesProcessed || 0,
            isCurrent: metadata.isCurrent || false,
            metrics: metadata.metrics || {
              loss: null,
              accuracy: null,
              fairness: null,
            },
            weights: metadata.dna?.finalWeights || null,
            baseModels: metadata.dna?.baseModels || [],
            training: metadata.training || null,
            metadata: metadata,
            isCertified: false, // Legacy model
          });
        } catch (error) {
          console.error(`Error reading metadata file ${file}:`, error);
        }
      }
    } catch (error) {
      console.log('Legacy weights directory not found or empty:', error.message);
    }
    
    // Sort by creation date (newest first)
    models.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    
    // If no models found, return empty array (don't create default)
    res.json({ models });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

// GET /api/admin/models/:id/metadata - Get model metadata
router.get('/models/:id/metadata', requireAdmin, async (req, res) => {
  try {
    const modelId = decodeURIComponent(req.params.id);
    const modelsDir = path.join(process.cwd(), '..', 'models');
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    
    // Try to find in certified directory
    const modelPath = path.join(certifiedDir, modelId);
    const metadataPath = path.join(modelPath, 'metadata.json');
    
    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      
      // Get directory size
      let totalSize = 0;
      try {
        const files = await fs.readdir(modelPath);
        for (const file of files) {
          try {
            const stats = await fs.stat(path.join(modelPath, file));
            if (stats.isFile()) {
              totalSize += stats.size;
            }
          } catch {
            // Skip files we can't stat
          }
        }
      } catch {
        // Ignore size calculation errors
      }
      
      res.json({
        ...metadata,
        size: totalSize,
        adapterSize: totalSize,
        directory: modelId,
      });
    } catch (error) {
      // Model not found
      res.status(404).json({ error: 'Model metadata not found', modelId });
    }
  } catch (error) {
    console.error('Error getting model metadata:', error);
    res.status(500).json({ error: 'Failed to get model metadata' });
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

// POST /api/admin/models/verify - Verify model integrity
router.post('/models/verify', requireAdmin, async (req, res) => {
  try {
    const { model_path } = req.body;
    
    if (!model_path) {
      return res.status(400).json({ error: 'model_path is required' });
    }
    
    // Resolve model path
    const modelDir = path.isAbsolute(model_path) 
      ? model_path 
      : path.join(process.cwd(), '..', model_path);
    
    // Check if verify_integrity.py exists in the model directory
    const verifyScriptInModel = path.join(modelDir, 'verify_integrity.py');
    const verifyScriptGlobal = path.join(process.cwd(), '..', 'models', 'oneseek-certified', 'verify_integrity.py');
    
    let verifyScript;
    try {
      await fs.access(verifyScriptInModel);
      verifyScript = verifyScriptInModel;
    } catch {
      try {
        await fs.access(verifyScriptGlobal);
        verifyScript = verifyScriptGlobal;
      } catch {
        return res.status(404).json({ 
          error: 'Verification script not found',
          details: `Looked in ${verifyScriptInModel} and ${verifyScriptGlobal}`
        });
      }
    }
    
    // Determine Python command
    let pythonCommand;
    const venvPath = path.join(process.cwd(), '..', 'venv');
    
    if (process.platform === 'win32') {
      const venvPython = path.join(venvPath, 'Scripts', 'python.exe');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
      } catch {
        pythonCommand = 'python';
      }
    } else {
      const venvPython = path.join(venvPath, 'bin', 'python3');
      try {
        await fs.access(venvPython);
        pythonCommand = venvPython;
      } catch {
        pythonCommand = 'python3';
      }
    }
    
    // Run verify_integrity.py
    const verifyProcess = spawn(pythonCommand, [verifyScript, modelDir]);
    
    let stdout = '';
    let stderr = '';
    
    verifyProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    verifyProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    verifyProcess.on('close', (code) => {
      try {
        // Parse JSON output from verify_integrity.py
        const result = JSON.parse(stdout);
        
        // Map to expected response format
        const response = {
          dna_valid: result.dna === 'VALID',
          ledger_synced: result.ledger === 'SYNCED',
          datasets_unchanged: result.datasets === 'UNCHANGED',
          details: result.details || {}
        };
        
        // Add overall status
        response.overall_status = result.overall || 'UNKNOWN';
        
        // Include stderr if there were warnings
        if (stderr) {
          response.warnings = stderr.split('\n').filter(line => line.trim());
        }
        
        res.json(response);
      } catch (parseError) {
        // Failed to parse JSON, return raw output
        res.status(500).json({
          error: 'Failed to parse verification result',
          stdout,
          stderr,
          exit_code: code
        });
      }
    });
    
    verifyProcess.on('error', (error) => {
      res.status(500).json({ 
        error: 'Failed to run verification script',
        details: error.message
      });
    });
    
  } catch (error) {
    console.error('Error verifying model:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

export default router;
