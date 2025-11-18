// Firebase Admin SDK Configuration (Server-side)
// This file should be used on the backend/server

/**
 * Initialize Firebase Admin SDK
 * Reads configuration from environment variables
 * 
 * Required environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (base64 encoded or as string with \n)
 * 
 * OR use service account file (not recommended for production):
 * - FIREBASE_SERVICE_ACCOUNT_PATH (path to serviceAccountKey.json)
 */

const admin = require('firebase-admin');

let firebaseApp = null;

function initializeFirebaseAdmin() {
  if (firebaseApp) {
    console.log('[Firebase Admin] Already initialized');
    return firebaseApp;
  }

  try {
    // Option 1: Use service account file (development only)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
      
      console.log('[Firebase Admin] ✓ Initialized with service account file');
      console.log('[Firebase Admin] Project ID:', serviceAccount.project_id);
      return firebaseApp;
    }

    // Option 2: Use environment variables (recommended for production)
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      // Decode private key if base64 encoded
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!privateKey.includes('BEGIN PRIVATE KEY')) {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
      }
      // Replace escaped newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('[Firebase Admin] ✓ Initialized with environment variables');
      console.log('[Firebase Admin] Project ID:', process.env.FIREBASE_PROJECT_ID);
      return firebaseApp;
    }

    // Option 3: Use default credentials (for Google Cloud environments)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseApp = admin.initializeApp();
      console.log('[Firebase Admin] ✓ Initialized with default credentials');
      return firebaseApp;
    }

    console.warn('[Firebase Admin] ⚠ Not initialized - missing configuration');
    console.warn('[Firebase Admin] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY');
    console.warn('[Firebase Admin] Or set FIREBASE_SERVICE_ACCOUNT_PATH for development');
    return null;

  } catch (error) {
    console.error('[Firebase Admin] ✗ Initialization failed:', error.message);
    return null;
  }
}

function getFirestore() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }

  return admin.firestore();
}

function getAuth() {
  if (!firebaseApp) {
    initializeFirebaseAdmin();
  }
  
  if (!firebaseApp) {
    throw new Error('Firebase Admin not initialized');
  }

  return admin.auth();
}

module.exports = {
  initializeFirebaseAdmin,
  getFirestore,
  getAuth,
  admin
};
