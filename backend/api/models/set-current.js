/**
 * Models API - Set Current Model
 * 
 * Manages the -CURRENT symlink for active model selection
 * This allows OQT Dashboard to always use the most recently verified/trained model
 * 
 * Endpoint:
 * - POST /api/models/set-current - Set the current active model via symlink
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Simple in-memory rate limiter
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20; // 20 model management requests per minute

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
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  next();
}

// POST /api/models/set-current - Set current active model
router.post('/set-current', rateLimiter, async (req, res) => {
  const { modelId } = req.body;

  if (!modelId) {
    return res.status(400).json({ error: 'modelId is required' });
  }

  try {
    // Determine models directory using same logic as /api/admin/models/available
    // Check both Windows path and project-relative path
    const windowsModelsPath = 'C:\\Users\\robin\\Documents\\GitHub\\CivicAI\\models';
    const projectModelsPath = path.join(__dirname, '..', '..', '..', 'models');
    
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
        // Use project path even if it doesn't exist yet
        modelsDir = projectModelsPath;
      }
    }

    // For OneSeek models stored as metadata JSON files in weights directory,
    // the symlink should point to the base oneseek-7b-zero directory
    // The modelId is just a version number like "1.0", not a directory name
    const baseModelDir = 'oneseek-7b-zero';
    
    // Paths
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const modelPath = path.join(modelsDir, baseModelDir);
    const symlinkPath = path.join(certifiedDir, 'OneSeek-7B-Zero-CURRENT');

    // Verify base model directory exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      return res.status(404).json({ 
        error: 'Base model directory not found', 
        modelId,
        expectedPath: modelPath 
      });
    }

    // Verify the specific model version exists by checking metadata file
    const weightsDir = path.join(modelPath, 'weights');
    
    // Check for metadata file with double dots first (this is the correct format)
    // e.g., oneseek-7b-zero-v1.0..json
    let metadataFile = `oneseek-7b-zero-v${modelId}..json`;
    let metadataPath = path.join(weightsDir, metadataFile);
    
    try {
      await fs.access(metadataPath);
    } catch (error) {
      // If double-dot file doesn't exist, try single dot as fallback
      metadataFile = `oneseek-7b-zero-v${modelId}.json`;
      metadataPath = path.join(weightsDir, metadataFile);
      
      try {
        await fs.access(metadataPath);
      } catch (innerError) {
        return res.status(404).json({ 
          error: 'Model version metadata not found', 
          modelId,
          triedFiles: [
            `oneseek-7b-zero-v${modelId}..json`,
            `oneseek-7b-zero-v${modelId}.json`
          ],
          note: 'The model metadata file does not exist. Train a model first or check the version number.'
        });
      }
    }

    // Create certified directory if it doesn't exist
    await fs.mkdir(certifiedDir, { recursive: true });

    // Remove existing symlink if it exists
    try {
      await fs.unlink(symlinkPath);
    } catch (error) {
      // Symlink might not exist, which is fine
      if (error.code !== 'ENOENT') {
        console.warn('Warning removing old symlink:', error);
      }
    }

    // Create new symlink or junction (for Windows compatibility)
    // Use relative path for better portability within the same filesystem
    const relativeModelPath = path.relative(certifiedDir, modelPath);
    
    // On Windows, try junction first (doesn't require admin), then symlink
    // On Unix, use symlink directly
    try {
      if (process.platform === 'win32') {
        // Try junction first (Windows, no admin required)
        await fs.symlink(modelPath, symlinkPath, 'junction');
        console.log(`Junction created: ${symlinkPath} -> ${modelPath}`);
      } else {
        // Unix: use regular symlink with relative path
        await fs.symlink(relativeModelPath, symlinkPath, 'dir');
        console.log(`Symlink created: ${symlinkPath} -> ${relativeModelPath}`);
      }
    } catch (error) {
      if (error.code === 'EPERM' && process.platform === 'win32') {
        // Windows: EPERM means we need admin for symlinks, fallback to marker file
        console.warn('Symlink creation requires admin privileges. Creating marker file instead.');
        
        // Remove the failed symlink attempt
        try {
          await fs.unlink(symlinkPath);
        } catch (e) {
          // Ignore
        }
        
        // Create a marker file with the target path
        await fs.writeFile(
          symlinkPath + '.txt',
          modelPath,
          'utf-8'
        );
        console.log(`Marker file created: ${symlinkPath}.txt -> ${modelPath}`);
      } else {
        throw error;
      }
    }

    // Also create absolute symlink at production path if configured
    const productionModelsPath = process.env.PRODUCTION_MODELS_PATH || '/app/models';
    const productionCertifiedPath = path.join(productionModelsPath, 'oneseek-certified');
    const productionSymlinkPath = path.join(productionCertifiedPath, 'OneSeek-7B-Zero-CURRENT');
    
    try {
      // Check if production models path exists
      await fs.access(productionModelsPath);
      
      // Create directory if needed
      await fs.mkdir(productionCertifiedPath, { recursive: true });
      
      // Remove old symlink
      try {
        await fs.unlink(productionSymlinkPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('Warning removing old production symlink:', error);
        }
      }
      
      // Create production symlink with absolute path
      const productionModelPath = path.join(productionModelsPath, baseModelDir);
      await fs.symlink(productionModelPath, productionSymlinkPath, 'dir');
      
      console.log(`Production symlink created: ${productionSymlinkPath} -> ${productionModelPath}`);
    } catch (error) {
      // Not in production environment or path doesn't exist, skip
      console.log('Not in production environment or production path not accessible, skipping production symlink');
    }

    res.json({
      success: true,
      message: 'Current model updated successfully',
      modelId,
      modelVersion: `oneseek-7b-zero-v${modelId}`,
      symlinkPath,
      currentModel: baseModelDir,
      note: 'Restart ml_service to load this model. The symlink points to the base model directory with all weights.'
    });

  } catch (error) {
    console.error('Error setting current model:', error);
    res.status(500).json({ 
      error: 'Failed to set current model', 
      details: error.message 
    });
  }
});

// GET /api/models/current - Get current active model
router.get('/current', rateLimiter, async (req, res) => {
  try {
    // Determine models directory using same logic as /api/admin/models/available
    const windowsModelsPath = 'C:\\Users\\robin\\Documents\\GitHub\\CivicAI\\models';
    const projectModelsPath = path.join(__dirname, '..', '..', '..', 'models');
    
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
        modelsDir = projectModelsPath;
      }
    }

    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const symlinkPath = path.join(certifiedDir, 'OneSeek-7B-Zero-CURRENT');

    try {
      // Try reading symlink/junction first
      const target = await fs.readlink(symlinkPath);
      const currentModel = path.basename(path.resolve(certifiedDir, target));

      res.json({
        success: true,
        currentModel,
        symlinkPath,
        target,
        note: 'The symlink points to the base oneseek-7b-zero directory containing all model weights and versions.'
      });
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EINVAL' || error.code === 'UNKNOWN') {
        // Check for marker file (Windows fallback)
        const markerPath = symlinkPath + '.txt';
        try {
          const targetPath = await fs.readFile(markerPath, 'utf-8');
          const currentModel = path.basename(targetPath.trim());
          
          return res.json({
            success: true,
            currentModel,
            symlinkPath: markerPath,
            target: targetPath.trim(),
            note: 'Using marker file (Windows). The marker points to the base oneseek-7b-zero directory.'
          });
        } catch (markerError) {
          return res.json({
            success: true,
            currentModel: null,
            message: 'No current model set',
          });
        }
      }
      throw error;
    }

  } catch (error) {
    console.error('Error getting current model:', error);
    res.status(500).json({ 
      error: 'Failed to get current model', 
      details: error.message 
    });
  }
});

export default router;
