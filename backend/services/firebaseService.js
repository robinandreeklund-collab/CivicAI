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
    if (updates.analysis) updateData.analysis = updates.analysis;
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
  listQuestions,
  deleteQuestion
};
