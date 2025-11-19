/**
 * Firebase Service
 * Manages Firebase Firestore operations for ai_interactions collection
 * Part of Firebase Integration - Step 1
 */

import crypto from 'crypto';

// Firebase will be initialized lazily when first needed
let admin = null;
let db = null;
let initError = null;

async function initializeFirebaseAdmin() {
  if (admin) return admin;
  
  try {
    // Dynamically import firebase-admin
    const firebaseAdmin = await import('firebase-admin');
    admin = firebaseAdmin.default;
    
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('[Firebase Service] Firebase Admin already initialized');
      return admin;
    }
    
    // Option 1: Use environment variables (recommended for production)
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
      }
      privateKey = privateKey.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('[Firebase Service] ✓ Initialized with environment variables');
      console.log('[Firebase Service] Project ID:', process.env.FIREBASE_PROJECT_ID);
      return admin;
    }
    
    // Option 2: Use service account file (development only)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const { readFileSync } = await import('fs');
      const serviceAccountData = readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountData);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('[Firebase Service] ✓ Initialized with service account file');
      console.log('[Firebase Service] Project ID:', serviceAccount.project_id);
      return admin;
    }

    // Option 3: Use default credentials (for Google Cloud environments)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp();
      console.log('[Firebase Service] ✓ Initialized with default credentials');
      return admin;
    }

    console.warn('[Firebase Service] ⚠ Not initialized - missing configuration');
    console.warn('[Firebase Service] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
    console.warn('[Firebase Service] Or set FIREBASE_SERVICE_ACCOUNT_PATH for development');
    return null;

  } catch (error) {
    console.error('[Firebase Service] ✗ Initialization failed:', error.message);
    initError = error;
    return null;
  }
}

async function initializeDb() {
  if (!db) {
    try {
      const firebaseAdmin = await initializeFirebaseAdmin();
      if (firebaseAdmin) {
        // IMPORTANT: Call firestore() with parentheses to get Firestore instance
        db = firebaseAdmin.firestore();
        console.log('[Firebase Service] ✓ Firestore initialized successfully');
      } else {
        console.warn('[Firebase Service] ⚠ Firebase Admin not initialized - Firestore unavailable');
      }
    } catch (error) {
      console.error('[Firebase Service] ✗ Failed to initialize Firestore:', error.message);
      initError = error;
      db = null;
    }
  }
  return db;
}

/**
 * Get the Firestore database instance
 * @returns {Promise<FirebaseFirestore.Firestore|null>} Firestore instance or null
 */
export async function getDb() {
  return await initializeDb();
}

/**
 * Get initialization error if any
 * @returns {Error|null} Initialization error or null
 */
export function getInitError() {
  return initError;
}

/**
 * Check if Firebase is available
 * @returns {Promise<boolean>} True if Firebase is initialized and ready
 */
export async function isFirebaseAvailable() {
  try {
    const firestore = await initializeDb();
    return firestore !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Create a hash of the question for ledger tracking
 * @param {string} question - The question text
 * @returns {string} SHA-256 hash of the question
 */
function hashQuestion(question) {
  return crypto.createHash('sha256').update(question).digest('hex');
}

/**
 * Store a new question in Firebase
 * @param {Object} params - Question parameters
 * @param {string} params.question - The user's question
 * @param {string} [params.userId] - Optional user ID
 * @param {string} [params.sessionId] - Optional session ID
 * @returns {Promise<Object>} Created document data
 */
export async function createQuestion({ question, userId, sessionId }) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const docData = {
      question,
      created_at: new Date().toISOString(),
      status: 'received',
      pipeline_version: process.env.PIPELINE_VERSION || '1.0.0',
      analysis: null,
      completed_at: null,
      question_hash: hashQuestion(question),
      // Enhanced schema fields for Step 2
      raw_responses: [],
      processed_data: {},
      processing_times: {},
      pipeline_metadata: {
        status_log: [{
          status: 'received',
          timestamp: new Date().toISOString(),
          message: 'Question received and stored'
        }]
      },
      errors: [],
      quality_metrics: {},
      ledger_blocks: []
    };

    // Add optional fields
    if (userId) docData.user_id = userId;
    if (sessionId) docData.session_id = sessionId;

    // Create document with auto-generated ID
    const docRef = await firestore.collection('ai_interactions').add(docData);
    
    console.log(`[Firebase Service] Question created with ID: ${docRef.id}`);
    console.log(`[Firebase Service] Status: ${docData.status}`);
    
    return {
      docId: docRef.id,
      ...docData
    };
  } catch (error) {
    console.error('[Firebase Service] Error creating question:', error);
    throw error;
  }
}

/**
 * Save raw AI service responses to Firebase
 * @param {string} docId - Document ID
 * @param {Array} responses - Array of AI service responses
 * @returns {Promise<Object>} Updated document data
 */
export async function saveRawResponses(docId, responses) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const firebaseAdmin = await initializeFirebaseAdmin();
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    // Transform responses to include full provenance
    const rawResponses = responses.map(r => ({
      service: r.agent || r.service || 'unknown',
      model_version: r.metadata?.version || r.metadata?.model || 'unknown',
      response_text: r.response || '',
      metadata: {
        timestamp: r.metadata?.timestamp || new Date().toISOString(),
        responseTimeMs: r.metadata?.responseTimeMs || 0,
        tokenCount: r.metadata?.tokenCount || 0,
        characterCount: r.metadata?.characterCount || 0,
        confidence: r.metadata?.confidence || 0,
        language: r.metadata?.language || null,
        endpoint: r.metadata?.endpoint || 'unknown',
        request_id: r.metadata?.request_id || '',
        model: r.metadata?.model || null,
        version: r.metadata?.version || null
      },
      analysis: r.analysis || {},
      enhancedAnalysis: r.enhancedAnalysis || null,
      pipelineAnalysis: r.pipelineAnalysis || null
    }));
    
    // Clean raw responses to remove any undefined values
    const cleanedRawResponses = removeUndefinedValues(rawResponses) || [];
    
    await docRef.update({
      raw_responses: cleanedRawResponses,
      updated_at: new Date().toISOString(),
      'pipeline_metadata.status_log': firebaseAdmin.firestore.FieldValue.arrayUnion({
        status: 'responses_saved',
        timestamp: new Date().toISOString(),
        message: `Saved ${cleanedRawResponses.length} raw AI responses`
      })
    });
    
    console.log(`[Firebase Service] Saved ${cleanedRawResponses.length} raw responses for ${docId}`);
    
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] Error saving raw responses:', error);
    throw error;
  }
}

/**
 * Recursively remove undefined values from an object and convert to Firestore-safe format
 * Firestore does not allow undefined values and has limitations on nested structures
 * @param {any} obj - Object to clean
 * @param {number} depth - Current nesting depth (for limiting recursion)
 * @returns {any} Cleaned object safe for Firestore
 */
function removeUndefinedValues(obj, depth = 0) {
  // Limit depth to prevent overly nested structures (Firestore limit is around 20 levels)
  const MAX_DEPTH = 15;
  
  if (depth > MAX_DEPTH) {
    // Convert deeply nested objects to JSON string
    try {
      return JSON.stringify(obj);
    } catch (e) {
      return null;
    }
  }
  
  if (obj === null || obj === undefined) {
    return null;
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle primitive types
  if (typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    const cleaned = obj
      .map(item => removeUndefinedValues(item, depth + 1))
      .filter(item => item !== undefined && item !== null);
    return cleaned.length > 0 ? cleaned : null;
  }
  
  // Handle objects - convert to plain object and clean
  const cleaned = {};
  try {
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }
      
      const cleanedValue = removeUndefinedValues(value, depth + 1);
      if (cleanedValue !== undefined && cleanedValue !== null) {
        cleaned[key] = cleanedValue;
      }
    }
  } catch (e) {
    // If we can't iterate, try to convert to JSON
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (jsonError) {
      return null;
    }
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : null;
}

/**
 * Save processed pipeline data to Firebase
 * @param {string} docId - Document ID
 * @param {Object} pipelineData - Processed pipeline analysis data
 * @returns {Promise<Object>} Updated document data
 */
export async function savePipelineData(docId, pipelineData) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const firebaseAdmin = await initializeFirebaseAdmin();
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    // Extract processing times from timeline
    const processingTimes = {};
    if (pipelineData.timeline) {
      pipelineData.timeline.forEach(step => {
        processingTimes[step.step] = {
          durationMs: step.durationMs,
          model: step.model,
          version: step.version
        };
      });
    }
    
    // Calculate quality metrics
    const qualityMetrics = {
      confidence: pipelineData.aggregatedInsights?.overallConfidence || 0,
      consensus: pipelineData.consensus || 0,
      severity: pipelineData.severity || 'low',
      completeness: pipelineData.completeness || 0
    };
    
    // Simplify and clean pipeline data for Firestore
    // Serialize ALL complex nested objects to JSON strings to avoid Firestore nesting limits
    // Keep only simple scalar values and shallow objects
    const simplifiedData = {
      // Serialize preprocessing completely to avoid nested issues
      preprocessing: pipelineData.preprocessing ? JSON.stringify(pipelineData.preprocessing) : null,
      
      // Serialize all analysis components to JSON strings
      biasAnalysis: pipelineData.biasAnalysis || pipelineData.bias ? 
        JSON.stringify(pipelineData.biasAnalysis || pipelineData.bias) : null,
      sentenceBiasAnalysis: pipelineData.sentenceBiasAnalysis ? 
        JSON.stringify(pipelineData.sentenceBiasAnalysis) : null,
      sentimentAnalysis: pipelineData.sentimentAnalysis || pipelineData.sentiment ? 
        JSON.stringify(pipelineData.sentimentAnalysis || pipelineData.sentiment) : null,
      ideologicalClassification: pipelineData.ideologicalClassification || pipelineData.ideology ? 
        JSON.stringify(pipelineData.ideologicalClassification || pipelineData.ideology) : null,
      toneAnalysis: pipelineData.toneAnalysis ? 
        JSON.stringify(pipelineData.toneAnalysis) : null,
      factCheck: pipelineData.factCheck ? 
        JSON.stringify(pipelineData.factCheck) : null,
      enhancedNLP: pipelineData.enhancedNLP ? 
        JSON.stringify(pipelineData.enhancedNLP) : null,
      
      // Serialize complex ML analysis objects
      explainability: pipelineData.explainability ? 
        JSON.stringify(pipelineData.explainability) : null,
      topics: pipelineData.topics ? 
        JSON.stringify(pipelineData.topics) : null,
      fairnessAnalysis: pipelineData.fairnessAnalysis ? 
        JSON.stringify(pipelineData.fairnessAnalysis) : null,
      
      // Serialize other potentially complex objects
      insights: pipelineData.insights ? 
        JSON.stringify(pipelineData.insights) : null,
      summary: pipelineData.summary ? 
        JSON.stringify(pipelineData.summary) : null,
      timeline: pipelineData.timeline ? 
        JSON.stringify(pipelineData.timeline) : null,
      pythonMLStats: pipelineData.pythonMLStats ? 
        JSON.stringify(pipelineData.pythonMLStats) : null,
      pipelineConfig: pipelineData.pipelineConfig ? 
        JSON.stringify(pipelineData.pipelineConfig) : null,
      
      // Keep only simple scalar values for these
      transparency: pipelineData.transparency ? {
        score: pipelineData.transparency.score || 0,
        level: pipelineData.transparency.level || 'unknown'
      } : null,
      aggregatedInsights: pipelineData.aggregatedInsights ? {
        overallConfidence: pipelineData.aggregatedInsights.overallConfidence || 0,
        summary: pipelineData.aggregatedInsights.summary || ''
      } : null,
      consensus: pipelineData.consensus || 0
    };
    
    // Clean to remove null values (don't use removeUndefinedValues on already stringified data)
    const cleanedProcessedData = {};
    for (const [key, value] of Object.entries(simplifiedData)) {
      if (value !== null && value !== undefined) {
        cleanedProcessedData[key] = value;
      }
    }
    
    console.log(`[Firebase Service] Saving pipeline data for ${docId}:`);
    console.log(`   - explainability: ${cleanedProcessedData.explainability ? 'YES (JSON)' : 'NO'}`);
    console.log(`   - topics: ${cleanedProcessedData.topics ? 'YES (JSON)' : 'NO'}`);
    console.log(`   - fairnessAnalysis: ${cleanedProcessedData.fairnessAnalysis ? 'YES (JSON)' : 'NO'}`);
    console.log(`   - biasAnalysis: ${cleanedProcessedData.biasAnalysis ? 'YES (JSON)' : 'NO'}`);
    console.log(`   - All data serialized as JSON strings to avoid Firestore nesting limits`);
    console.log(`   - processed_data keys: ${Object.keys(cleanedProcessedData).join(', ')}`);
    
    // Use set() with merge instead of update() to ensure field is created
    await docRef.set({
      processed_data: cleanedProcessedData || {},
      processing_times: removeUndefinedValues(processingTimes) || {},
      quality_metrics: removeUndefinedValues(qualityMetrics) || {},
      pipeline_metadata: {
        start_time: pipelineData.metadata?.pipelineStartTime || null,
        end_time: pipelineData.metadata?.pipelineEndTime || null,
        total_duration_ms: pipelineData.metadata?.totalDurationMs || 0,
        status_log: firebaseAdmin.firestore.FieldValue.arrayUnion({
          status: 'pipeline_complete',
          timestamp: new Date().toISOString(),
          message: 'ML pipeline processing completed'
        })
      },
      updated_at: new Date().toISOString()
    }, { merge: true });
    
    console.log(`[Firebase Service] ✅ Saved pipeline data for ${docId}`);
    
    // Verify data was actually saved
    const verifyDoc = await docRef.get();
    const verifyData = verifyDoc.data();
    if (verifyData.processed_data && Object.keys(verifyData.processed_data).length > 0) {
      console.log(`[Firebase Service] ✓ Verified: processed_data exists with ${Object.keys(verifyData.processed_data).length} keys`);
    } else {
      console.error(`[Firebase Service] ✗ WARNING: processed_data not found or empty after save!`);
    }
    
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] Error saving pipeline data:', error);
    throw error;
  }
}

/**
 * Add ledger block reference to a question
 * @param {string} docId - Document ID
 * @param {string} blockId - Ledger block ID
 * @returns {Promise<Object>} Updated document data
 */
export async function addLedgerBlockReference(docId, blockId) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const firebaseAdmin = await initializeFirebaseAdmin();
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    await docRef.update({
      ledger_blocks: firebaseAdmin.firestore.FieldValue.arrayUnion(blockId),
      updated_at: new Date().toISOString()
    });
    
    console.log(`[Firebase Service] Added ledger block ${blockId} to ${docId}`);
    
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] Error adding ledger block reference:', error);
    throw error;
  }
}

/**
 * Log an error for a question
 * @param {string} docId - Document ID
 * @param {Object} error - Error object
 * @returns {Promise<Object>} Updated document data
 */
export async function logQuestionError(docId, error) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const firebaseAdmin = await initializeFirebaseAdmin();
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      code: error.code || 'UNKNOWN'
    };
    
    await docRef.update({
      errors: firebaseAdmin.firestore.FieldValue.arrayUnion(errorLog),
      status: 'error',
      updated_at: new Date().toISOString(),
      'pipeline_metadata.status_log': firebaseAdmin.firestore.FieldValue.arrayUnion({
        status: 'error',
        timestamp: new Date().toISOString(),
        message: `Error: ${error.message}`
      })
    });
    
    console.error(`[Firebase Service] Logged error for ${docId}:`, error.message);
    
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (err) {
    console.error('[Firebase Service] Error logging question error:', err);
    throw err;
  }
}

/**
 * Get a question by document ID
 * @param {string} docId - Document ID
 * @returns {Promise<Object>} Question document data
 */
export async function getQuestion(docId) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const docRef = firestore.collection('ai_interactions').doc(docId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      throw new Error(`Question not found: ${docId}`);
    }
    
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] Error getting question:', error);
    throw error;
  }
}

/**
 * Save synthesized summary and meta review to Firebase
 * @param {string} docId - Document ID
 * @param {Object} data - Summary and review data
 * @param {string} [data.synthesizedSummary] - BERT-generated summary
 * @param {Object} [data.synthesizedSummaryMetadata] - Summary metadata
 * @param {Object} [data.metaReview] - GPT meta-review
 * @returns {Promise<Object>} Updated document data
 */
export async function saveSynthesisData(docId, data) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const firebaseAdmin = await initializeFirebaseAdmin();
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    // Build update object with synthesis data
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (data.synthesizedSummary !== undefined) {
      updateData.synthesized_summary = data.synthesizedSummary;
      console.log(`[Firebase Service] Saving synthesized_summary (${data.synthesizedSummary?.length || 0} chars)`);
    }
    if (data.synthesizedSummaryMetadata !== undefined) {
      updateData.synthesized_summary_metadata = removeUndefinedValues(data.synthesizedSummaryMetadata);
      console.log(`[Firebase Service] Saving synthesized_summary_metadata:`, data.synthesizedSummaryMetadata);
    }
    if (data.metaReview !== undefined) {
      updateData.meta_review = removeUndefinedValues(data.metaReview);
      console.log(`[Firebase Service] Saving meta_review with keys:`, Object.keys(data.metaReview || {}));
    }
    
    await docRef.update(updateData);
    
    console.log(`[Firebase Service] ✅ Saved synthesis data for ${docId}`);
    
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] ❌ Error saving synthesis data:', error);
    throw error;
  }
}

/**
 * Update the status of a question
 * @param {string} docId - Document ID
 * @param {Object} updates - Fields to update
 * @param {string} [updates.status] - New status value
 * @param {Object} [updates.analysis] - Analysis results
 * @param {string} [updates.completed_at] - Completion timestamp
 * @returns {Promise<Object>} Updated document data
 */
export async function updateQuestionStatus(docId, updates) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    const docRef = firestore.collection('ai_interactions').doc(docId);
    
    // Build update object
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.status) updateData.status = updates.status;
    if (updates.analysis) updateData.analysis = removeUndefinedValues(updates.analysis);
    if (updates.completed_at) updateData.completed_at = updates.completed_at;
    if (updates.verified_at) updateData.verified_at = updates.verified_at;
    
    await docRef.update(updateData);
    
    console.log(`[Firebase Service] Question ${docId} updated to status: ${updates.status || 'unchanged'}`);
    
    // Return updated document
    const doc = await docRef.get();
    return {
      docId: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[Firebase Service] Error updating question status:', error);
    throw error;
  }
}

/**
 * List recent questions (for testing and admin purposes)
 * @param {Object} options - Query options
 * @param {number} [options.limit=10] - Maximum number of questions to return
 * @param {string} [options.status] - Filter by status
 * @returns {Promise<Array>} Array of question documents
 */
export async function listQuestions(options = {}) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    let query = firestore.collection('ai_interactions')
      .orderBy('created_at', 'desc')
      .limit(options.limit || 10);
    
    // Filter by status if provided
    if (options.status) {
      query = query.where('status', '==', options.status);
    }
    
    const snapshot = await query.get();
    
    const questions = [];
    snapshot.forEach(doc => {
      questions.push({
        docId: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[Firebase Service] Retrieved ${questions.length} questions`);
    return questions;
  } catch (error) {
    console.error('[Firebase Service] Error listing questions:', error);
    throw error;
  }
}

/**
 * Delete a question (for GDPR compliance and testing)
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteQuestion(docId) {
  const firestore = await initializeDb();
  
  if (!firestore) {
    throw new Error('Firebase is not initialized. Check your Firebase configuration.');
  }

  try {
    await firestore.collection('ai_interactions').doc(docId).delete();
    console.log(`[Firebase Service] Question ${docId} deleted`);
  } catch (error) {
    console.error('[Firebase Service] Error deleting question:', error);
    throw error;
  }
}

export default {
  isFirebaseAvailable,
  getDb,
  getInitError,
  createQuestion,
  getQuestion,
  updateQuestionStatus,
  saveSynthesisData,
  listQuestions,
  deleteQuestion
};
