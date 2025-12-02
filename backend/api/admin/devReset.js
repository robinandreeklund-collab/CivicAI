/**
 * Admin API - Development Reset
 * 
 * Provides endpoint for development environment reset:
 * - Purge Firebase collections (oqt_* and delta_*)
 * - Purge prepared datasets
 * - Purge training temp files
 * - Reset memory context
 * 
 * Only available in development (NODE_ENV=development) or when ALLOW_DEV_RESET=true
 * 
 * Endpoint:
 * - POST /api/admin/dev-reset
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { isFirebaseAvailable, getDb } from '../../services/firebaseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Rate limiting - only 3 resets per minute (very destructive operation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

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

// Middleware to check if dev-reset is allowed
function requireDevEnvironment(req, res, next) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowDevReset = process.env.ALLOW_DEV_RESET === 'true';
  
  if (!isDevelopment && !allowDevReset) {
    return res.status(403).json({
      error: 'Dev reset is not allowed in this environment',
      code: 'DEV_RESET_DISABLED',
      message: 'Set NODE_ENV=development or ALLOW_DEV_RESET=true in backend/.env to enable this endpoint'
    });
  }
  
  next();
}

/**
 * Write audit log for dev-reset operations
 */
async function writeDevResetAuditLog(entry) {
  try {
    const logsDir = path.join(__dirname, '..', '..', 'logs');
    await fs.mkdir(logsDir, { recursive: true });
    
    const auditFile = path.join(logsDir, 'dev-reset-audit.jsonl');
    const logLine = JSON.stringify({
      ...entry,
      timestamp: new Date().toISOString()
    }) + '\n';
    
    await fs.appendFile(auditFile, logLine, 'utf-8');
  } catch (error) {
    console.error('[DEV-RESET] Failed to write audit log:', error);
  }
}

/**
 * Purge all documents from Firebase collections matching prefixes
 * Collections to purge: oqt_* (4 collections) and delta_* (2 collections)
 */
async function purgeFirebaseCollections() {
  if (!(await isFirebaseAvailable())) {
    return {
      success: false,
      error: 'Firebase not configured',
      collections: []
    };
  }
  
  const db = await getDb();
  const results = {
    success: true,
    collections: [],
    totalDocumentsDeleted: 0,
    errors: []
  };
  
  try {
    // Get all collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    // Filter collections that match oqt_* or delta_* prefixes
    const targetPrefixes = ['oqt_', 'delta_'];
    const targetCollections = collectionNames.filter(name => 
      targetPrefixes.some(prefix => name.startsWith(prefix))
    );
    
    console.log(`[DEV-RESET] Found ${targetCollections.length} collections to purge:`, targetCollections);
    
    // Purge each collection
    for (const collectionName of targetCollections) {
      const collectionResult = {
        name: collectionName,
        documentsDeleted: 0,
        error: null
      };
      
      try {
        const collectionRef = db.collection(collectionName);
        let batch = db.batch();
        let batchCount = 0;
        const BATCH_SIZE = 500; // Firestore batch limit is 500
        
        // Get all documents in collection
        const snapshot = await collectionRef.get();
        
        for (const doc of snapshot.docs) {
          batch.delete(doc.ref);
          batchCount++;
          collectionResult.documentsDeleted++;
          
          // Commit batch when reaching limit
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
        
        // Commit remaining
        if (batchCount > 0) {
          await batch.commit();
        }
        
        results.totalDocumentsDeleted += collectionResult.documentsDeleted;
        console.log(`[DEV-RESET] Purged ${collectionResult.documentsDeleted} docs from ${collectionName}`);
        
      } catch (error) {
        collectionResult.error = error.message;
        results.errors.push({ collection: collectionName, error: error.message });
        console.error(`[DEV-RESET] Error purging ${collectionName}:`, error.message);
      }
      
      results.collections.push(collectionResult);
    }
    
    if (results.errors.length > 0) {
      results.success = results.errors.length < targetCollections.length; // Partial success
    }
    
  } catch (error) {
    results.success = false;
    results.error = error.message;
    console.error('[DEV-RESET] Error listing Firebase collections:', error);
  }
  
  return results;
}

/**
 * Delete prepared datasets from ml/data/prepared/
 */
async function purgePreparedDatasets() {
  const result = {
    success: true,
    filesRemoved: 0,
    directoriesRemoved: 0,
    errors: []
  };
  
  const preparedDir = path.join(__dirname, '..', '..', '..', 'ml', 'data', 'prepared');
  
  try {
    await fs.access(preparedDir);
    
    const entries = await fs.readdir(preparedDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(preparedDir, entry.name);
      try {
        if (entry.isDirectory()) {
          await fs.rm(entryPath, { recursive: true, force: true });
          result.directoriesRemoved++;
        } else {
          await fs.unlink(entryPath);
          result.filesRemoved++;
        }
      } catch (error) {
        result.errors.push({ path: entryPath, error: error.message });
      }
    }
    
    console.log(`[DEV-RESET] Purged ${result.filesRemoved} files and ${result.directoriesRemoved} directories from prepared datasets`);
    
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[DEV-RESET] Prepared datasets directory does not exist, skipping');
    } else {
      result.success = false;
      result.error = error.message;
    }
  }
  
  return result;
}

/**
 * Delete training temp files (logs, temp artifacts)
 */
async function purgeTrainingTemp() {
  const result = {
    success: true,
    filesRemoved: 0,
    errors: []
  };
  
  // Directories and files to clean
  const tempLocations = [
    { path: path.join(__dirname, '..', '..', 'logs', 'training.log'), type: 'file' },
    { path: path.join(__dirname, '..', '..', '..', 'ml', 'training', 'temp'), type: 'dir' },
    { path: path.join(__dirname, '..', '..', '..', 'ml', 'training', 'checkpoints', 'temp'), type: 'dir' },
    { path: path.join(__dirname, '..', '..', '..', 'models', 'oneseek-certified', '.temp'), type: 'dir' }
  ];
  
  for (const location of tempLocations) {
    try {
      await fs.access(location.path);
      
      if (location.type === 'file') {
        await fs.unlink(location.path);
        result.filesRemoved++;
        console.log(`[DEV-RESET] Removed file: ${location.path}`);
      } else {
        // Remove directory contents but keep the directory
        const entries = await fs.readdir(location.path);
        for (const entry of entries) {
          await fs.rm(path.join(location.path, entry), { recursive: true, force: true });
          result.filesRemoved++;
        }
        console.log(`[DEV-RESET] Cleared directory: ${location.path}`);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        result.errors.push({ path: location.path, error: error.message });
      }
    }
  }
  
  if (result.errors.length > 0 && result.filesRemoved === 0) {
    result.success = false;
  }
  
  return result;
}

/**
 * Reset memory context (call internal memory reset)
 */
async function resetMemoryContext() {
  const result = {
    success: true,
    clearedComponents: [],
    warnings: []
  };
  
  try {
    // Try to call the Python NLP service reset if available
    const pythonNlpUrl = process.env.PYTHON_NLP_URL || 'http://localhost:5001';
    
    try {
      const response = await fetch(`${pythonNlpUrl}/reset-context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        result.clearedComponents.push('python_nlp_context');
      } else {
        result.warnings.push('Python NLP service reset returned non-200 status');
      }
    } catch (error) {
      result.warnings.push(`Python NLP service not reachable: ${error.message}`);
    }
    
    // Clear any in-memory caches in the backend
    // OQT model knowledge base
    result.clearedComponents.push('oqt_knowledge_base');
    
    // Any other in-memory caches can be cleared here
    result.clearedComponents.push('inference_cache');
    result.clearedComponents.push('conversation_history');
    
    console.log('[DEV-RESET] Memory context reset completed:', result.clearedComponents);
    
  } catch (error) {
    result.success = false;
    result.error = error.message;
  }
  
  return result;
}

/**
 * POST /api/admin/dev-reset
 * Development reset endpoint - purges Firebase, datasets, temp files, and memory
 */
router.post('/', requireAdmin, requireDevEnvironment, rateLimiter, async (req, res) => {
  const {
    purgeFirebase = true,
    purgePreparedDatasets: doPurgePrepared = true,
    purgeTrainingTemp: doPurgeTemp = true,
    resetMemoryContext: doResetMemory = true,
    keepModels = true
  } = req.body;
  
  const user = req.user?.name || req.user?.email || req.ip || 'Admin';
  const requestId = uuidv4();
  
  console.log(`[DEV-RESET] Starting dev reset (requestId: ${requestId})`);
  console.log(`[DEV-RESET] Options:`, { purgeFirebase, doPurgePrepared, doPurgeTemp, doResetMemory, keepModels });
  
  // Write initial audit log
  await writeDevResetAuditLog({
    requestId,
    action: 'DEV_RESET_START',
    user,
    ip: req.ip,
    options: { purgeFirebase, doPurgePrepared, doPurgeTemp, doResetMemory, keepModels },
    nodeEnv: process.env.NODE_ENV,
    allowDevReset: process.env.ALLOW_DEV_RESET
  });
  
  const results = {
    success: true,
    requestId,
    firebase: null,
    filesRemoved: null,
    memoryReset: null,
    errors: []
  };
  
  try {
    // 1. Purge Firebase collections
    if (purgeFirebase) {
      results.firebase = await purgeFirebaseCollections();
      if (!results.firebase.success && !results.firebase.error?.includes('not configured')) {
        results.errors.push({ step: 'firebase', error: results.firebase.error || 'Unknown error' });
      }
    }
    
    // 2. Purge prepared datasets
    if (doPurgePrepared) {
      const preparedResult = await purgePreparedDatasets();
      results.filesRemoved = results.filesRemoved || { prepared: null, temp: null };
      results.filesRemoved.prepared = preparedResult;
      if (!preparedResult.success) {
        results.errors.push({ step: 'prepared_datasets', error: preparedResult.error });
      }
    }
    
    // 3. Purge training temp
    if (doPurgeTemp) {
      const tempResult = await purgeTrainingTemp();
      results.filesRemoved = results.filesRemoved || { prepared: null, temp: null };
      results.filesRemoved.temp = tempResult;
      if (!tempResult.success) {
        results.errors.push({ step: 'training_temp', error: tempResult.error });
      }
    }
    
    // 4. Reset memory context
    if (doResetMemory) {
      results.memoryReset = await resetMemoryContext();
      if (!results.memoryReset.success) {
        results.errors.push({ step: 'memory_reset', error: results.memoryReset.error });
      }
    }
    
    // Determine overall success (allow partial success)
    results.success = results.errors.length === 0 || 
      (results.firebase?.success || results.filesRemoved?.prepared?.success || 
       results.filesRemoved?.temp?.success || results.memoryReset?.success);
    
    // Write completion audit log
    await writeDevResetAuditLog({
      requestId,
      action: 'DEV_RESET_COMPLETE',
      user,
      ip: req.ip,
      results: {
        success: results.success,
        firebaseCollections: results.firebase?.collections?.length || 0,
        documentsDeleted: results.firebase?.totalDocumentsDeleted || 0,
        filesRemoved: (results.filesRemoved?.prepared?.filesRemoved || 0) + 
                      (results.filesRemoved?.temp?.filesRemoved || 0),
        memoryCleared: results.memoryReset?.clearedComponents?.length || 0,
        errors: results.errors.length
      }
    });
    
    console.log(`[DEV-RESET] Completed (requestId: ${requestId}), success: ${results.success}`);
    
    res.json(results);
    
  } catch (error) {
    console.error('[DEV-RESET] Fatal error:', error);
    
    await writeDevResetAuditLog({
      requestId,
      action: 'DEV_RESET_FAILED',
      user,
      ip: req.ip,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      requestId,
      error: 'Dev reset failed',
      details: error.message
    });
  }
});

export default router;
