// Firebase Web SDK Configuration (Client-side)
// This file should be used in the frontend

/**
 * Firebase Web SDK initialization
 * Reads configuration from environment variables
 * 
 * Required environment variables (in frontend/.env):
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 * - VITE_FIREBASE_MEASUREMENT_ID (optional)
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate configuration
function validateFirebaseConfig() {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.warn('[Firebase Web] ⚠ Missing configuration:', missingFields);
    console.warn('[Firebase Web] Set environment variables in frontend/.env');
    console.warn('[Firebase Web] See frontend/.env.example for template');
    return false;
  }

  return true;
}

// Initialize Firebase
let app = null;
let auth = null;
let db = null;
let analytics = null;

function initializeFirebase() {
  if (app) {
    console.log('[Firebase Web] Already initialized');
    return { app, auth, db, analytics };
  }

  if (!validateFirebaseConfig()) {
    console.warn('[Firebase Web] ⚠ Not initialized - missing configuration');
    return { app: null, auth: null, db: null, analytics: null };
  }

  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Initialize analytics if measurement ID is provided
    if (firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
    }

    console.log('[Firebase Web] ✓ Initialized');
    console.log('[Firebase Web] Project ID:', firebaseConfig.projectId);

    return { app, auth, db, analytics };
  } catch (error) {
    console.error('[Firebase Web] ✗ Initialization failed:', error.message);
    return { app: null, auth: null, db: null, analytics: null };
  }
}

// Export initialized instances
const firebase = initializeFirebase();

export const { app: firebaseApp, auth: firebaseAuth, db: firebaseDb, analytics: firebaseAnalytics } = firebase;

export default firebaseApp;
