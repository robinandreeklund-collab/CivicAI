/**
 * Firebase Users API Routes
 * Handles anonymous user account creation and management
 */

import express from 'express';
import {
  createAnonymousUser,
  getUser,
  getUserByPublicKeyHash,
  updateUserProfile,
  verifyAccount,
  updateUsageStats,
  deleteUserAccount,
  isPublicKeyRegistered,
  isFirebaseAvailable
} from '../services/firebaseUserService.js';
import { createLedgerBlock } from '../services/ledgerService.js';

const router = express.Router();

/**
 * POST /api/users/signup
 * Create anonymous user account with cryptographic keys
 * 
 * TODO: Add rate limiting (e.g., 3 accounts per IP/hour)
 * This is mentioned in SIGNUP_IMPLEMENTATION.md as a future enhancement
 * Current bot protection relies on Proof-of-Work only
 */
router.post('/signup', async (req, res) => {
  try {
    // Check Firebase availability
    const firebaseReady = await isFirebaseAvailable();
    if (!firebaseReady) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service not available',
        message: 'User signup is temporarily unavailable'
      });
    }

    const { publicKey, seedPhrase, proofOfWork, profileType, agentConfig } = req.body;

    // Validate required fields
    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: publicKey'
      });
    }

    if (!proofOfWork || !proofOfWork.nonce || !proofOfWork.hash) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: proofOfWork with nonce and hash'
      });
    }

    // Check if public key is already registered
    const alreadyRegistered = await isPublicKeyRegistered(publicKey);
    if (alreadyRegistered) {
      return res.status(409).json({
        success: false,
        error: 'Public key already registered',
        message: 'This cryptographic key is already associated with an account'
      });
    }

    // Create anonymous user
    const userResult = await createAnonymousUser({
      publicKey,
      seedPhrase,
      proofOfWork,
      profileType,
      agentConfig
    });

    if (!userResult) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Create ledger block for account creation
    let ledgerBlock = null;
    try {
      ledgerBlock = await createLedgerBlock({
        event_type: 'data_collection',
        data: {
          description: 'Anonymt konto skapat',
          userId: userResult.userId,
          publicKeyHash: userResult.publicKeyHash,
          accountType: 'anonymous',
          profileType: profileType || 'pseudonym',
          timestamp: new Date().toISOString()
        }
      });

      // Update user account with ledger block reference
      if (ledgerBlock && ledgerBlock.block_id !== undefined) {
        await verifyAccount(userResult.userId, ledgerBlock.block_id);
      }
    } catch (ledgerError) {
      console.error('[Users API] Ledger block creation failed:', ledgerError.message);
      // Don't fail the signup if ledger fails, but log it
    }

    res.status(201).json({
      success: true,
      user: {
        userId: userResult.userId,
        publicKeyHash: userResult.publicKeyHash,
        accountStatus: ledgerBlock ? 'active' : 'pending',
        createdAt: userResult.createdAt,
        ledgerBlockId: ledgerBlock?.block_id || null
      },
      message: 'Anonymous account created successfully'
    });

  } catch (error) {
    console.error('[Users API] Signup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create user account',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/users/:userId
 * Get user profile by userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const user = await getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('[Users API] Get user error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
});

/**
 * GET /api/users/by-key/:publicKeyHash
 * Get user by public key hash
 */
router.get('/by-key/:publicKeyHash', async (req, res) => {
  try {
    const { publicKeyHash } = req.params;

    if (!publicKeyHash) {
      return res.status(400).json({
        success: false,
        error: 'publicKeyHash is required'
      });
    }

    const user = await getUserByPublicKeyHash(publicKeyHash);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('[Users API] Get user by key error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get user'
    });
  }
});

/**
 * PUT /api/users/:userId/profile
 * Update user profile
 */
router.put('/:userId/profile', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const result = await updateUserProfile(userId, updates);

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      updated: result.updated
    });

  } catch (error) {
    console.error('[Users API] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update profile'
    });
  }
});

/**
 * POST /api/users/:userId/usage
 * Update usage statistics
 */
router.post('/:userId/usage', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const result = await updateUsageStats(userId, stats);

    res.json({
      success: true,
      message: 'Usage stats updated',
      updated: result.updated
    });

  } catch (error) {
    console.error('[Users API] Update usage error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update usage stats'
    });
  }
});

/**
 * DELETE /api/users/:userId
 * Delete user account (soft delete)
 */
router.delete('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    const result = await deleteUserAccount(userId);

    if (!result) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });

  } catch (error) {
    console.error('[Users API] Delete account error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete account'
    });
  }
});

/**
 * POST /api/users/check-key
 * Check if a public key is already registered
 */
router.post('/check-key', async (req, res) => {
  try {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({
        success: false,
        error: 'publicKey is required'
      });
    }

    const isRegistered = await isPublicKeyRegistered(publicKey);

    res.json({
      success: true,
      isRegistered
    });

  } catch (error) {
    console.error('[Users API] Check key error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check public key'
    });
  }
});

/**
 * GET /api/users/status
 * Check users service status
 */
router.get('/status', async (req, res) => {
  try {
    const firebaseReady = await isFirebaseAvailable();
    
    res.json({
      success: true,
      status: firebaseReady ? 'available' : 'unavailable',
      firebase: firebaseReady,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Users API] Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check status'
    });
  }
});

export default router;
