/**
 * Memory API - Memory Context Reset
 * 
 * Provides endpoint for resetting memory contexts used by inference,
 * conversation history caches, and server-side caches.
 * 
 * Endpoint:
 * - POST /api/memory/reset (admin-only)
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 10;

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
      error: 'Too many reset requests. Please try again later.',
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
 * Write audit log for memory reset operations
 */
async function writeMemoryResetAuditLog(entry) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const auditFile = path.join(logsDir, 'memory-reset-audit.jsonl');
    const logLine = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }) + '\n';
    
    await fs.appendFile(auditFile, logLine, 'utf-8');
  } catch (error) {
    console.error('[MEMORY-RESET] Failed to write audit log:', error);
  }
}

// In-memory caches that can be reset
// These are module-level references that will be cleared
let conversationCache = new Map();
let inferenceCache = new Map();
let oqtKnowledgeBase = new Map();

// Export functions to allow other modules to use these caches
export function getConversationCache() {
  return conversationCache;
}

export function getInferenceCache() {
  return inferenceCache;
}

export function getOqtKnowledgeBase() {
  return oqtKnowledgeBase;
}

/**
 * Reset all in-memory caches
 */
function resetAllCaches() {
  const previousSizes = {
    conversationCache: conversationCache.size,
    inferenceCache: inferenceCache.size,
    oqtKnowledgeBase: oqtKnowledgeBase.size
  };
  
  conversationCache.clear();
  inferenceCache.clear();
  oqtKnowledgeBase.clear();
  
  return previousSizes;
}

/**
 * Try to reset Python NLP service context
 */
async function resetPythonNLPContext() {
  const pythonNlpUrl = process.env.PYTHON_NLP_URL || 'http://localhost:5001';
  
  try {
    const response = await fetch(`${pythonNlpUrl}/reset-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Try to reset ML service context
 */
async function resetMLServiceContext() {
  const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
  
  try {
    const response = await fetch(`${mlServiceUrl}/reset-context`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * POST /api/memory/reset
 * Reset all memory contexts (admin-only)
 */
router.post('/reset', requireAdmin, rateLimiter, async (req, res) => {
  const user = req.user?.name || req.user?.email || req.ip || 'Admin';
  const requestId = uuidv4();
  
  console.log(`[MEMORY-RESET] Starting memory reset (requestId: ${requestId})`);
  
  // Write initial audit log
  await writeMemoryResetAuditLog({
    requestId,
    action: 'MEMORY_RESET_START',
    user,
    ip: req.ip
  });
  
  const result = {
    success: true,
    requestId,
    clearedComponents: [],
    warnings: [],
    details: {}
  };
  
  try {
    // 1. Reset in-memory caches
    const cacheSizes = resetAllCaches();
    result.clearedComponents.push('conversation_cache');
    result.clearedComponents.push('inference_cache');
    result.clearedComponents.push('oqt_knowledge_base');
    result.details.previousCacheSizes = cacheSizes;
    console.log('[MEMORY-RESET] Cleared in-memory caches:', cacheSizes);
    
    // 2. Try to reset Python NLP service
    const pythonResult = await resetPythonNLPContext();
    if (pythonResult.success) {
      result.clearedComponents.push('python_nlp_context');
      result.details.pythonNLP = pythonResult.data;
    } else {
      result.warnings.push(`Python NLP service: ${pythonResult.error}`);
    }
    
    // 3. Try to reset ML service
    const mlResult = await resetMLServiceContext();
    if (mlResult.success) {
      result.clearedComponents.push('ml_service_context');
      result.details.mlService = mlResult.data;
    } else {
      result.warnings.push(`ML service: ${mlResult.error}`);
    }
    
    // Write completion audit log
    await writeMemoryResetAuditLog({
      requestId,
      action: 'MEMORY_RESET_COMPLETE',
      user,
      ip: req.ip,
      clearedComponents: result.clearedComponents,
      warnings: result.warnings
    });
    
    console.log(`[MEMORY-RESET] Completed (requestId: ${requestId})`);
    console.log(`[MEMORY-RESET] Cleared: ${result.clearedComponents.join(', ')}`);
    if (result.warnings.length > 0) {
      console.log(`[MEMORY-RESET] Warnings: ${result.warnings.join(', ')}`);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('[MEMORY-RESET] Error:', error);
    
    await writeMemoryResetAuditLog({
      requestId,
      action: 'MEMORY_RESET_FAILED',
      user,
      ip: req.ip,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      requestId,
      error: 'Memory reset failed',
      details: error.message
    });
  }
});

/**
 * GET /api/memory/status
 * Get current memory cache status
 */
router.get('/status', requireAdmin, (req, res) => {
  res.json({
    success: true,
    caches: {
      conversationCache: {
        size: conversationCache.size,
        type: 'Map'
      },
      inferenceCache: {
        size: inferenceCache.size,
        type: 'Map'
      },
      oqtKnowledgeBase: {
        size: oqtKnowledgeBase.size,
        type: 'Map'
      }
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
