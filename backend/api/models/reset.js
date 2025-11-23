/**
 * Models API - Reset All Models
 * 
 * Provides endpoint to completely reset the oneseek-certified directory
 * while preserving base models in basemodeller directory
 * 
 * Endpoint:
 * - POST /api/models/reset - Delete all trained models and start fresh
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
const RATE_LIMIT_MAX_REQUESTS = 5; // Only 5 reset requests per minute (destructive action)

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
  
  return true;
}

// Rate limiting middleware
function rateLimiter(req, res, next) {
  const identifier = req.ip || 'unknown';
  
  if (!checkRateLimit(identifier)) {
    return res.status(429).json({ 
      error: 'Too many reset requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }
  
  next();
}

/**
 * Recursively delete directory contents
 */
async function deleteDirectoryContents(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        await deleteDirectoryContents(fullPath);
        await fs.rmdir(fullPath);
      } else {
        await fs.unlink(fullPath);
      }
    }
  } catch (error) {
    // Directory might be empty or not exist
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

// POST /api/models/reset - Reset all trained models
router.post('/reset', rateLimiter, async (req, res) => {
  try {
    // Determine models directory
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
    const basemodellerDir = path.join(modelsDir, 'basemodeller');

    // Log the reset action
    const timestamp = new Date().toISOString();
    const resetLog = {
      action: 'FULL_RESET',
      timestamp,
      user: req.user?.name || req.user?.email || 'Admin',
      ip: req.ip,
      modelsDir,
      certifiedDir,
    };

    console.log('[RESET] Starting full model reset:', resetLog);

    // Delete entire oneseek-certified directory
    try {
      await deleteDirectoryContents(certifiedDir);
      console.log('[RESET] Deleted contents of oneseek-certified directory');
    } catch (error) {
      console.error('[RESET] Error deleting certified directory:', error);
      if (error.code !== 'ENOENT') {
        return res.status(500).json({
          error: 'Failed to delete certified models',
          details: error.message
        });
      }
    }

    // Recreate empty oneseek-certified directory with proper structure
    await fs.mkdir(certifiedDir, { recursive: true });
    console.log('[RESET] Created empty oneseek-certified directory');

    // Create README in oneseek-certified to explain structure
    const readmeContent = `# OneSeek-7B-Zero Certified Models

This directory contains trained OneSeek-7B-Zero models with DNA-based naming.

## Structure

Each trained model is stored in a self-contained directory with DNA fingerprint naming:

\`\`\`
OneSeek-7B-Zero.v{VERSION}.{LANG}.{DATASETS}.{WEIGHTS_HASH}.{TIMESTAMP_HASH}/
├── metadata.json          # Model metadata and training info
├── adapter_config.json    # LoRA adapter configuration
├── adapter_model.bin      # LoRA weights
├── training_results.json  # Training history and metrics
└── verify_integrity.py    # Integrity verification script
\`\`\`

## DNA Naming Format

\`OneSeek-7B-Zero.v1.492.sv.dsCivicID-SwedID.8f3a1c9d.2e7f4b1a\`

- \`v1.492\` - Version number
- \`sv\` - Language code (sv=Swedish, en=English, ensv=Bilingual)
- \`dsCivicID-SwedID\` - Dataset categories
- \`8f3a1c9d\` - Weights hash
- \`2e7f4b1a\` - Timestamp hash

## Active Model

The active model is indicated by a symlink:
\`OneSeek-7B-Zero-CURRENT\` -> \`OneSeek-7B-Zero.v1.493....\`

## Reset

Last reset: ${timestamp}
Reset by: ${resetLog.user}
`;

    await fs.writeFile(path.join(certifiedDir, 'README.md'), readmeContent, 'utf-8');

    // Copy verify_integrity.py to oneseek-certified if it exists
    const verifyScriptSrc = path.join(modelsDir, 'oneseek-certified', 'verify_integrity.py');
    try {
      // Check if script exists in old location
      await fs.access(verifyScriptSrc);
      // It already exists, no need to copy
    } catch (error) {
      // Script doesn't exist, we'll rely on the training script to create it
      console.log('[RESET] verify_integrity.py not found, will be created during training');
    }

    // Ensure basemodeller directory exists (preserve base models)
    await fs.mkdir(basemodellerDir, { recursive: true });
    console.log('[RESET] Ensured basemodeller directory exists');

    // Create README in basemodeller directory
    const basemodellerReadme = `# Base Models

This directory contains unmodified base models used for training OneSeek-7B-Zero.

Base models are preserved during resets and can be reused for training.

## Supported Base Models

Place HuggingFace-compatible models here:
- KB-Llama-3-1-8B-Swedish
- Mistral-7B-v0.1
- Qwen-2.5-7B
- etc.

Each model should have its own directory with:
- config.json
- tokenizer files
- model weights (pytorch_model.bin or model.safetensors)
`;

    await fs.writeFile(path.join(basemodellerDir, 'README.md'), basemodellerReadme, 'utf-8');

    // Write reset log to a ledger file
    const ledgerDir = path.join(modelsDir, 'oneseek-certified', '.ledger');
    await fs.mkdir(ledgerDir, { recursive: true });
    
    const ledgerFile = path.join(ledgerDir, 'reset-log.jsonl');
    const ledgerEntry = JSON.stringify(resetLog) + '\n';
    
    await fs.appendFile(ledgerFile, ledgerEntry, 'utf-8');

    console.log('[RESET] Reset completed successfully');

    res.json({
      success: true,
      message: 'All trained models have been reset. You can now train your first model from scratch.',
      details: {
        certifiedDir,
        basemodellerDir,
        timestamp,
        action: 'Full reset completed',
        preserved: 'Base models in /models/basemodeller/',
      },
      ledger: {
        timestamp,
        user: resetLog.user,
        message: `Full reset by ${resetLog.user} on ${timestamp}`,
      }
    });

  } catch (error) {
    console.error('[RESET] Error during reset:', error);
    res.status(500).json({ 
      error: 'Failed to reset models', 
      details: error.message 
    });
  }
});

export default router;
