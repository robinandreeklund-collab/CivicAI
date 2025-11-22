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

// POST /api/models/set-current - Set current active model
router.post('/set-current', async (req, res) => {
  const { modelId } = req.body;

  if (!modelId) {
    return res.status(400).json({ error: 'modelId is required' });
  }

  try {
    // Paths
    const modelsDir = path.join(__dirname, '..', '..', '..', 'models');
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
    // Use relative path for better portability
    const relativeModelPath = path.relative(certifiedDir, modelPath);
    await fs.symlink(relativeModelPath, symlinkPath, 'dir');

    // Also create absolute symlink at /app/models/oneseek-certified/ for Docker/production
    const productionSymlinkPath = '/app/models/oneseek-certified/OneSeek-7B-Zero-CURRENT';
    try {
      // Check if /app/models exists (production environment)
      await fs.access('/app/models');
      
      // Create directory if needed
      await fs.mkdir('/app/models/oneseek-certified', { recursive: true });
      
      // Remove old symlink
      try {
        await fs.unlink(productionSymlinkPath);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('Warning removing old production symlink:', error);
        }
      }
      
      // Create production symlink with absolute path
      const productionModelPath = `/app/models/${modelId}`;
      await fs.symlink(productionModelPath, productionSymlinkPath, 'dir');
      
      console.log(`Production symlink created: ${productionSymlinkPath} -> ${productionModelPath}`);
    } catch (error) {
      // Not in production environment, skip
      console.log('Not in production environment, skipping /app symlink');
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
router.get('/current', async (req, res) => {
  try {
    const modelsDir = path.join(__dirname, '..', '..', '..', 'models');
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
