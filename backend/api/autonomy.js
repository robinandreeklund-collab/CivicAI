/**
 * Autonomy Engine API Endpoints
 * 
 * Provides control and monitoring for OneSeek Autonomy Engine v3.3
 */

import express from 'express';
import autonomyEngine from '../services/autonomyEngine.js';
import nacl from 'tweetnacl';

const router = express.Router();

// Middleware to check admin access
function requireAdmin(req, res, next) {
  // In production, implement proper authentication
  // For now, we allow all requests
  next();
}

/**
 * GET /api/autonomy/config
 * Get current autonomy configuration
 */
router.get('/config', requireAdmin, (req, res) => {
  try {
    const config = autonomyEngine.getConfig();
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/config
 * Update autonomy configuration
 */
router.post('/config', requireAdmin, async (req, res) => {
  try {
    const updates = req.body;
    const config = await autonomyEngine.updateConfig(updates);
    res.json({ config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/autonomy/state
 * Get current autonomy state
 */
router.get('/state', requireAdmin, (req, res) => {
  try {
    const state = autonomyEngine.getState();
    res.json({ state });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/run
 * Manually trigger an autonomous cycle
 */
router.post('/run', requireAdmin, async (req, res) => {
  try {
    // Start async process
    autonomyEngine.runAutonomousCycle().catch(error => {
      console.error('Autonomous cycle error:', error);
    });
    
    res.json({ 
      message: 'Autonomous cycle started',
      status: 'running',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/autonomy/cycles
 * Get cycle history
 */
router.get('/cycles', requireAdmin, (req, res) => {
  try {
    const state = autonomyEngine.getState();
    res.json({ cycles: state.cycleHistory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/autonomy/cycles/:cycleId
 * Get specific cycle details
 */
router.get('/cycles/:cycleId', requireAdmin, (req, res) => {
  try {
    const { cycleId } = req.params;
    const state = autonomyEngine.getState();
    const cycle = state.cycleHistory.find(c => c.id === cycleId);
    
    if (!cycle) {
      return res.status(404).json({ error: 'Cycle not found' });
    }
    
    res.json({ cycle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/checkpoint/approve
 * Approve golden checkpoint with Ed25519 signature
 */
router.post('/checkpoint/approve', requireAdmin, async (req, res) => {
  try {
    const { cycleId, signature, publicKey } = req.body;
    
    if (!cycleId || !signature || !publicKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: cycleId, signature, publicKey',
      });
    }
    
    const cycle = await autonomyEngine.approveGoldenCheckpoint(
      cycleId,
      signature,
      publicKey
    );
    
    res.json({ 
      success: true,
      cycle,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/checkpoint/generate-keys
 * Generate Ed25519 key pair for admin
 */
router.post('/checkpoint/generate-keys', requireAdmin, (req, res) => {
  try {
    const keyPair = nacl.sign.keyPair();
    
    res.json({
      publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
      secretKey: Buffer.from(keyPair.secretKey).toString('hex'),
      warning: 'Store the secret key securely. It will not be shown again.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/checkpoint/sign
 * Sign a cycle ID with provided secret key
 */
router.post('/checkpoint/sign', requireAdmin, (req, res) => {
  try {
    const { cycleId, secretKey } = req.body;
    
    if (!cycleId || !secretKey) {
      return res.status(400).json({ 
        error: 'Missing required fields: cycleId, secretKey',
      });
    }
    
    const message = Buffer.from(cycleId);
    const secretKeyBuffer = Buffer.from(secretKey, 'hex');
    
    const signature = nacl.sign.detached(message, secretKeyBuffer);
    
    res.json({
      signature: Buffer.from(signature).toString('hex'),
      cycleId,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/autonomy/pending-checkpoints
 * Get cycles awaiting golden checkpoint
 */
router.get('/pending-checkpoints', requireAdmin, (req, res) => {
  try {
    const state = autonomyEngine.getState();
    const pending = state.cycleHistory.filter(c => c.status === 'awaiting_checkpoint');
    
    res.json({ pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/autonomy/control-questions
 * Get active control questions for voting
 */
router.get('/control-questions', (req, res) => {
  try {
    // Mock control questions - would be stored in database
    const questions = [
      {
        id: 'q1',
        question: 'Should the autonomy engine prioritize Swedish language quality?',
        description: 'Determines if Swedish-specific metrics get higher weight in approval',
        options: [
          { id: 'yes', label: 'Yes, prioritize Swedish', votes: 42 },
          { id: 'no', label: 'No, treat equally', votes: 18 },
        ],
        votes: 60,
        active: true,
      },
      {
        id: 'q2',
        question: 'What should be the minimum fidelity threshold for approval?',
        description: 'Higher thresholds ensure quality but may slow improvement',
        options: [
          { id: '75', label: '75% - Faster iteration', votes: 12 },
          { id: '80', label: '80% - Balanced', votes: 35 },
          { id: '85', label: '85% - High quality', votes: 23 },
        ],
        votes: 70,
        active: true,
      },
    ];
    
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/autonomy/vote
 * Submit a vote with PoW verification
 */
router.post('/vote', async (req, res) => {
  try {
    const { questionId, vote, pow } = req.body;
    
    if (!questionId || !vote || !pow) {
      return res.status(400).json({ 
        error: 'Missing required fields: questionId, vote, pow',
      });
    }
    
    // Verify PoW
    const { nonce, hash, challenge } = pow;
    const expectedHash = await computeSHA256(challenge + nonce);
    
    // Check if hash starts with enough zeros (difficulty)
    const difficulty = 4;
    const target = '0'.repeat(difficulty);
    
    if (!hash.startsWith(target) || hash !== expectedHash) {
      return res.status(400).json({ error: 'Invalid Proof-of-Work' });
    }
    
    // Vote would be stored in database
    console.log(`Vote received: question=${questionId}, vote=${vote}, pow verified`);
    
    res.json({ 
      success: true,
      message: 'Vote recorded',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper function to compute SHA-256 hash
 */
async function computeSHA256(message) {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(message).digest('hex');
}

export default router;
