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

    // Paths
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const modelPath = path.join(modelsDir, modelId);
    const symlinkPath = path.join(certifiedDir, 'OneSeek-7B-Zero-CURRENT');

    // Verify model exists
    try {
      await fs.access(modelPath);
    } catch (error) {
      return res.status(404).json({ error: 'Model not found', modelId });
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

    // Create new symlink
    // Use relative path for better portability within the same filesystem
    // Note: Symlink targets are resolved relative to the symlink's location.
    // This works as long as the models directory structure remains consistent.
    // For cross-filesystem scenarios, consider using absolute paths instead.
    const relativeModelPath = path.relative(certifiedDir, modelPath);
    await fs.symlink(relativeModelPath, symlinkPath, 'dir');

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
      const productionModelPath = path.join(productionModelsPath, modelId);
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
      symlinkPath,
      currentModel: modelId,
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
      // Read symlink to get current model
      const target = await fs.readlink(symlinkPath);
      const currentModel = path.basename(path.resolve(certifiedDir, target));

      res.json({
        success: true,
        currentModel,
        symlinkPath,
        target,
      });
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.json({
          success: true,
          currentModel: null,
          message: 'No current model set',
        });
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
