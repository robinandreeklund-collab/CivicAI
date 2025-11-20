/**
 * Firebase User Service
 * Manages Firebase Firestore operations for users collection
 * Supports both anonymous (crypto-key based) and authenticated users
 */

import crypto from 'crypto';

// Firebase will be initialized lazily when first needed
let admin = null;
let db = null;

async function initializeFirebaseAdmin() {
  if (admin) return admin;
  
  try {
    const firebaseAdmin = await import('firebase-admin');
    admin = firebaseAdmin.default;
    
    if (admin.apps.length > 0) {
      console.log('[Firebase User Service] Firebase Admin already initialized');
      return admin;
    }
    
    // Initialize with environment variables
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

      console.log('[Firebase User Service] ✓ Initialized');
      return admin;
    }
    
    console.warn('[Firebase User Service] ⚠ Not initialized - missing configuration');
    return null;

  } catch (error) {
    console.error('[Firebase User Service] ✗ Initialization failed:', error.message);
    return null;
  }
}

async function initializeDb() {
  if (!db) {
    try {
      const firebaseAdmin = await initializeFirebaseAdmin();
      if (firebaseAdmin) {
        db = firebaseAdmin.firestore();
        console.log('[Firebase User Service] ✓ Firestore initialized');
      }
    } catch (error) {
      console.error('[Firebase User Service] ✗ Failed to initialize Firestore:', error.message);
    }
  }
  return db;
}

/**
 * Check if Firebase is available
 */
export async function isFirebaseAvailable() {
  const database = await initializeDb();
  return database !== null && database !== undefined;
}

/**
 * Generate userId from public key hash
 */
function generateUserId(publicKey) {
  const hash = crypto.createHash('sha256').update(publicKey).digest('hex');
  return `user_${hash.substring(0, 32)}`;
}

/**
 * Hash data using SHA-256
 */
function hashData(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Create anonymous user account
 */
export async function createAnonymousUser(userData) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available, skipping user creation');
    return null;
  }

  try {
    const {
      publicKey,
      seedPhrase,
      proofOfWork,
      profileType = 'pseudonym',
      agentConfig = {}
    } = userData;

    // Validate required fields
    if (!publicKey) {
      throw new Error('Public key is required for anonymous account');
    }

    if (!proofOfWork || !proofOfWork.nonce || !proofOfWork.hash) {
      throw new Error('Valid proof-of-work is required');
    }

    // Generate userId from public key
    const publicKeyHash = hashData(publicKey);
    const userId = generateUserId(publicKey);

    // Hash seed phrase (never store the actual seed phrase)
    const seedPhraseHash = seedPhrase ? hashData(seedPhrase) : null;

    // Verify PoW hash has required leading zeros
    const difficulty = proofOfWork.difficulty || 4;
    if (!proofOfWork.hash.startsWith('0'.repeat(difficulty))) {
      throw new Error('Invalid proof-of-work: hash does not meet difficulty requirement');
    }

    // Create user document
    const userDoc = {
      userId,
      accountType: 'anonymous',
      publicKey,
      publicKeyHash,
      seedPhraseHash,
      proofOfWork: {
        nonce: proofOfWork.nonce,
        hash: proofOfWork.hash,
        timestamp: new Date(proofOfWork.timestamp || Date.now()),
        difficulty
      },
      profileType,
      agentConfig: {
        biasFilter: agentConfig.biasFilter || 'neutral',
        tone: agentConfig.tone || 'balanced',
        transparencyLevel: agentConfig.transparencyLevel || 'high'
      },
      role: 'user',
      accountStatus: 'pending',
      createdAt: new Date(),
      preferences: {
        theme: 'dark',
        language: 'sv',
        notifications: false
      },
      usage: {
        totalQuestions: 0,
        totalSessions: 0
      }
    };

    // Save to Firestore
    await database.collection('users').doc(userId).set(userDoc);

    console.log('[Firebase User Service] ✓ Anonymous user created:', userId);

    return {
      userId,
      publicKeyHash,
      accountStatus: 'pending',
      createdAt: userDoc.createdAt
    };

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error creating anonymous user:', error.message);
    throw error;
  }
}

/**
 * Get user by userId
 */
export async function getUser(userId) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    const docRef = database.collection('users').doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const userData = doc.data();
    
    // Convert Firestore Timestamps to ISO strings
    if (userData.createdAt) {
      userData.createdAt = userData.createdAt.toDate().toISOString();
    }
    if (userData.lastLogin) {
      userData.lastLogin = userData.lastLogin.toDate().toISOString();
    }
    if (userData.verifiedAt) {
      userData.verifiedAt = userData.verifiedAt.toDate().toISOString();
    }
    if (userData.proofOfWork && userData.proofOfWork.timestamp) {
      userData.proofOfWork.timestamp = userData.proofOfWork.timestamp.toDate().toISOString();
    }

    // Never return sensitive data
    delete userData.privateKey; // Should never be stored, but just in case
    delete userData.seedPhrase; // Should never be stored, but just in case

    return userData;

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error getting user:', error.message);
    throw error;
  }
}

/**
 * Get user by public key hash
 */
export async function getUserByPublicKeyHash(publicKeyHash) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    const querySnapshot = await database.collection('users')
      .where('publicKeyHash', '==', publicKeyHash)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const userData = doc.data();
    
    // Convert timestamps
    if (userData.createdAt) {
      userData.createdAt = userData.createdAt.toDate().toISOString();
    }
    if (userData.lastLogin) {
      userData.lastLogin = userData.lastLogin.toDate().toISOString();
    }
    if (userData.verifiedAt) {
      userData.verifiedAt = userData.verifiedAt.toDate().toISOString();
    }

    return userData;

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error getting user by public key hash:', error.message);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    // Validate userId
    if (!userId) {
      throw new Error('userId is required');
    }

    // Filter allowed fields for update
    const allowedFields = [
      'displayName',
      'profileType',
      'agentConfig',
      'preferences',
      'lastLogin'
    ];

    const filteredUpdates = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    // Never allow updating sensitive fields
    delete filteredUpdates.publicKey;
    delete filteredUpdates.privateKey;
    delete filteredUpdates.seedPhrase;
    delete filteredUpdates.seedPhraseHash;
    delete filteredUpdates.publicKeyHash;
    delete filteredUpdates.userId;
    delete filteredUpdates.accountType;
    delete filteredUpdates.role;

    if (Object.keys(filteredUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update document
    await database.collection('users').doc(userId).update(filteredUpdates);

    console.log('[Firebase User Service] ✓ User profile updated:', userId);

    return { success: true, userId, updated: Object.keys(filteredUpdates) };

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error updating user profile:', error.message);
    throw error;
  }
}

/**
 * Verify account and update status to active
 */
export async function verifyAccount(userId, ledgerBlockId) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    await database.collection('users').doc(userId).update({
      accountStatus: 'active',
      verifiedAt: new Date(),
      ledgerBlockId: ledgerBlockId
    });

    console.log('[Firebase User Service] ✓ Account verified:', userId);

    return { success: true, userId, accountStatus: 'active', ledgerBlockId };

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error verifying account:', error.message);
    throw error;
  }
}

/**
 * Update usage statistics
 */
export async function updateUsageStats(userId, stats) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    const updates = {};
    
    if (stats.incrementQuestions) {
      updates['usage.totalQuestions'] = admin.firestore.FieldValue.increment(1);
      updates['usage.lastQuestionAt'] = new Date();
    }
    
    if (stats.incrementSessions) {
      updates['usage.totalSessions'] = admin.firestore.FieldValue.increment(1);
    }

    if (Object.keys(updates).length === 0) {
      return { success: true, message: 'No stats to update' };
    }

    await database.collection('users').doc(userId).update(updates);

    console.log('[Firebase User Service] ✓ Usage stats updated:', userId);

    return { success: true, userId, updated: Object.keys(updates) };

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error updating usage stats:', error.message);
    throw error;
  }
}

/**
 * Delete user account (soft delete - marks as deleted)
 */
export async function deleteUserAccount(userId) {
  const database = await initializeDb();
  if (!database) {
    console.warn('[Firebase User Service] Firebase not available');
    return null;
  }

  try {
    await database.collection('users').doc(userId).update({
      accountStatus: 'deleted',
      deletedAt: new Date()
    });

    console.log('[Firebase User Service] ✓ Account deleted (soft):', userId);

    return { success: true, userId, accountStatus: 'deleted' };

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error deleting account:', error.message);
    throw error;
  }
}

/**
 * Check if public key is already registered
 */
export async function isPublicKeyRegistered(publicKey) {
  const database = await initializeDb();
  if (!database) {
    return false;
  }

  try {
    const publicKeyHash = hashData(publicKey);
    const querySnapshot = await database.collection('users')
      .where('publicKeyHash', '==', publicKeyHash)
      .limit(1)
      .get();

    return !querySnapshot.empty;

  } catch (error) {
    console.error('[Firebase User Service] ✗ Error checking public key:', error.message);
    return false;
  }
}
