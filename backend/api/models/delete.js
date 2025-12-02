/**
 * Models API - Delete Model/Adapter
 * 
 * Provides endpoints for hard-deleting model versions and adapters
 * with active model protection, path safety, and audit logging
 * 
 * Endpoints:
 * - DELETE /api/models/:version - Delete a specific model version
 * - DELETE /api/models/:version/adapters/:adapterId - Delete a specific adapter
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rate limiting for destructive operations
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 delete requests per minute

function checkRateLimit(identifier) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(identifier) || [];
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}

function rateLimiter(req, res, next) {
  const identifier = req.ip || 'unknown';
  
  if (!checkRateLimit(identifier)) {
    return res.status(429).json({
      error: 'Too many delete requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  next();
}

// Middleware to check admin access
// NOTE: In production, implement proper authentication using the existing AuthContext
// This placeholder allows all requests - integrate with Firebase Auth before deployment
function requireAdmin(req, res, next) {
  // TODO: Implement proper admin authentication
  // Example: Check req.user.role === 'admin' from Firebase Auth middleware
  next();
}

/**
 * Get the models directory path
 */
async function getModelsDir() {
  // Use environment variable if set, otherwise use project-relative path
  const modelsDir = process.env.MODELS_DIR || path.join(__dirname, '..', '..', '..', 'models');
  
  try {
    await fs.access(modelsDir);
  } catch {
    // Directory doesn't exist yet, but will be created when needed
  }
  
  return modelsDir;
}

/**
 * Check if a path is safe (within allowed directories)
 * Prevents path traversal attacks
 */
function isPathSafe(targetPath, allowedBaseDir) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedBase = path.resolve(allowedBaseDir);
  
  return resolvedTarget.startsWith(resolvedBase + path.sep) || resolvedTarget === resolvedBase;
}

/**
 * Get the current active model (target of -CURRENT symlink)
 */
async function getCurrentModel(certifiedDir) {
  const symlinkPath = path.join(certifiedDir, 'OneSeek-7B-Zero-CURRENT');
  
  try {
    // Try reading symlink
    const target = await fs.readlink(symlinkPath);
    return path.basename(path.resolve(certifiedDir, target));
  } catch {
    // Try marker file (Windows fallback)
    const markerPath = symlinkPath + '.txt';
    try {
      const targetPath = await fs.readFile(markerPath, 'utf-8');
      return path.basename(targetPath.trim());
    } catch {
      return null;
    }
  }
}

/**
 * Write audit log entry
 */
async function writeAuditLog(modelsDir, entry) {
  const auditDir = path.join(modelsDir, 'oneseek-certified', '.audit');
  await fs.mkdir(auditDir, { recursive: true });
  
  const auditFile = path.join(auditDir, 'deletion-log.jsonl');
  const logLine = JSON.stringify({
    ...entry,
    timestamp: new Date().toISOString()
  }) + '\n';
  
  await fs.appendFile(auditFile, logLine, 'utf-8');
}

/**
 * DELETE /api/models/:version
 * Hard-delete a specific model version
 */
router.delete('/:version', requireAdmin, rateLimiter, async (req, res) => {
  const { version } = req.params;
  const user = req.user?.name || req.user?.email || req.ip || 'Admin';
  
  if (!version) {
    return res.status(400).json({
      error: 'Version parameter is required',
      code: 'MISSING_VERSION'
    });
  }
  
  try {
    const modelsDir = await getModelsDir();
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    const baseModelsDir = path.join(modelsDir, 'base_models');
    
    // Determine model path - could be in certified or merged directories
    let modelPath = path.join(certifiedDir, version);
    let foundIn = 'certified';
    
    // Check if model exists in certified directory
    try {
      await fs.access(modelPath);
    } catch {
      // Try merged directory
      const mergedPath = path.join(certifiedDir, 'merged', version);
      try {
        await fs.access(mergedPath);
        modelPath = mergedPath;
        foundIn = 'merged';
      } catch {
        return res.status(404).json({
          error: 'Model version not found',
          code: 'MODEL_NOT_FOUND',
          version
        });
      }
    }
    
    // Path safety check - ensure we're not deleting base_models
    if (!isPathSafe(modelPath, certifiedDir)) {
      console.error(`[DELETE] Path traversal attempt blocked: ${modelPath}`);
      return res.status(403).json({
        error: 'Invalid path - cannot delete outside certified models directory',
        code: 'PATH_TRAVERSAL_BLOCKED'
      });
    }
    
    // Ensure we're not trying to delete base_models
    if (modelPath.includes('base_models') || modelPath.includes('basemodeller')) {
      return res.status(403).json({
        error: 'Cannot delete base models',
        code: 'BASE_MODEL_PROTECTED'
      });
    }
    
    // Check if this is the active model
    const currentModel = await getCurrentModel(certifiedDir);
    if (currentModel && (currentModel === version || modelPath.endsWith(currentModel))) {
      console.log(`[DELETE] Blocked deletion of active model: ${version}`);
      return res.status(409).json({
        error: 'Cannot delete the active model. Set another model as active first.',
        code: 'ACTIVE_MODEL',
        activeModel: currentModel,
        version
      });
    }
    
    // Write audit log BEFORE deletion
    await writeAuditLog(modelsDir, {
      action: 'DELETE_MODEL',
      version,
      modelPath,
      foundIn,
      user,
      ip: req.ip,
      outcome: 'PENDING'
    });
    
    // Perform deletion
    try {
      await fs.rm(modelPath, { recursive: true, force: true });
      console.log(`[DELETE] Successfully deleted model: ${version}`);
      
      // Update audit log with success
      await writeAuditLog(modelsDir, {
        action: 'DELETE_MODEL',
        version,
        modelPath,
        foundIn,
        user,
        ip: req.ip,
        outcome: 'SUCCESS'
      });
      
      res.json({
        success: true,
        message: `Model version ${version} deleted successfully`,
        version,
        deletedPath: modelPath,
        foundIn
      });
      
    } catch (deleteError) {
      console.error(`[DELETE] Failed to delete model: ${deleteError.message}`);
      
      // Update audit log with failure
      await writeAuditLog(modelsDir, {
        action: 'DELETE_MODEL',
        version,
        modelPath,
        foundIn,
        user,
        ip: req.ip,
        outcome: 'FAILED',
        error: deleteError.message
      });
      
      throw deleteError;
    }
    
  } catch (error) {
    console.error('[DELETE] Error deleting model:', error);
    res.status(500).json({
      error: 'Failed to delete model',
      code: 'DELETE_FAILED',
      details: error.message
    });
  }
});

/**
 * DELETE /api/models/:version/adapters/:adapterId
 * Hard-delete a specific adapter within a model version
 */
router.delete('/:version/adapters/:adapterId', requireAdmin, rateLimiter, async (req, res) => {
  const { version, adapterId } = req.params;
  const user = req.user?.name || req.user?.email || req.ip || 'Admin';
  
  if (!version || !adapterId) {
    return res.status(400).json({
      error: 'Version and adapterId parameters are required',
      code: 'MISSING_PARAMETERS'
    });
  }
  
  try {
    const modelsDir = await getModelsDir();
    const certifiedDir = path.join(modelsDir, 'oneseek-certified');
    
    // Find the model directory
    let modelPath = path.join(certifiedDir, version);
    let foundIn = 'certified';
    
    try {
      await fs.access(modelPath);
    } catch {
      const mergedPath = path.join(certifiedDir, 'merged', version);
      try {
        await fs.access(mergedPath);
        modelPath = mergedPath;
        foundIn = 'merged';
      } catch {
        return res.status(404).json({
          error: 'Model version not found',
          code: 'MODEL_NOT_FOUND',
          version
        });
      }
    }
    
    // Find the adapter path
    const adapterPath = path.join(modelPath, 'adapters', adapterId);
    
    // Path safety check
    if (!isPathSafe(adapterPath, modelPath)) {
      console.error(`[DELETE] Path traversal attempt blocked for adapter: ${adapterPath}`);
      return res.status(403).json({
        error: 'Invalid path - cannot delete outside model directory',
        code: 'PATH_TRAVERSAL_BLOCKED'
      });
    }
    
    // Check if adapter exists
    try {
      await fs.access(adapterPath);
    } catch {
      // Adapter might be a direct file in the model directory
      const alternateAdapterPath = path.join(modelPath, adapterId);
      try {
        await fs.access(alternateAdapterPath);
        // Found as a direct file
      } catch {
        return res.status(404).json({
          error: 'Adapter not found',
          code: 'ADAPTER_NOT_FOUND',
          version,
          adapterId
        });
      }
    }
    
    // Check if parent model is active and adapter is required
    const currentModel = await getCurrentModel(certifiedDir);
    if (currentModel && (currentModel === version || modelPath.endsWith(currentModel))) {
      // Check if the adapter is essential (adapter_model.bin, adapter_config.json)
      const essentialAdapters = ['adapter_model.bin', 'adapter_model.safetensors', 'adapter_config.json'];
      if (essentialAdapters.includes(adapterId)) {
        console.log(`[DELETE] Blocked deletion of essential adapter for active model: ${adapterId}`);
        return res.status(409).json({
          error: 'Cannot delete essential adapter files from the active model. Set another model as active first.',
          code: 'ACTIVE_MODEL_ADAPTER',
          activeModel: currentModel,
          version,
          adapterId
        });
      }
    }
    
    // Write audit log BEFORE deletion
    await writeAuditLog(modelsDir, {
      action: 'DELETE_ADAPTER',
      version,
      adapterId,
      adapterPath,
      foundIn,
      user,
      ip: req.ip,
      outcome: 'PENDING'
    });
    
    // Perform deletion
    try {
      const finalAdapterPath = path.join(modelPath, 'adapters', adapterId);
      try {
        await fs.access(finalAdapterPath);
        await fs.rm(finalAdapterPath, { recursive: true, force: true });
      } catch {
        // Try direct path
        const directPath = path.join(modelPath, adapterId);
        await fs.rm(directPath, { recursive: true, force: true });
      }
      
      console.log(`[DELETE] Successfully deleted adapter: ${adapterId} from ${version}`);
      
      // Update audit log with success
      await writeAuditLog(modelsDir, {
        action: 'DELETE_ADAPTER',
        version,
        adapterId,
        foundIn,
        user,
        ip: req.ip,
        outcome: 'SUCCESS'
      });
      
      res.json({
        success: true,
        message: `Adapter ${adapterId} deleted from model ${version}`,
        version,
        adapterId
      });
      
    } catch (deleteError) {
      console.error(`[DELETE] Failed to delete adapter: ${deleteError.message}`);
      
      // Update audit log with failure
      await writeAuditLog(modelsDir, {
        action: 'DELETE_ADAPTER',
        version,
        adapterId,
        foundIn,
        user,
        ip: req.ip,
        outcome: 'FAILED',
        error: deleteError.message
      });
      
      throw deleteError;
    }
    
  } catch (error) {
    console.error('[DELETE] Error deleting adapter:', error);
    res.status(500).json({
      error: 'Failed to delete adapter',
      code: 'DELETE_FAILED',
      details: error.message
    });
  }
});

export default router;
