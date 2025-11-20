/**
 * OQT Ledger Service
 * Blockchain-inspired transparency ledger for OQT-1.0
 * Implements SHA-256 hashing, block linking, and verification
 */

import crypto from 'crypto';
import { saveOQTLedgerBlock, getOQTLedgerBlocks, getOQTLedgerBlock } from './oqtFirebaseService.js';

// In-memory cache of the latest block (for performance)
let latestBlockCache = null;
let blockCount = 0;

/**
 * Initialize genesis block if ledger is empty
 */
export async function initializeLedger() {
  try {
    const { success, blocks } = await getOQTLedgerBlocks({ limit: 1 });
    
    if (success && blocks.length === 0) {
      // Create genesis block
      const genesisBlock = {
        blockNumber: 0,
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        data: {
          type: 'genesis',
          message: 'OQT-1.0 Transparency Ledger initialized',
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString(),
        nonce: 0
      };

      // Calculate hash for genesis block
      genesisBlock.hash = calculateBlockHash(genesisBlock);
      
      await saveOQTLedgerBlock(genesisBlock);
      latestBlockCache = genesisBlock;
      blockCount = 1;
      
      console.log('[OQT Ledger] Genesis block created');
      return { success: true, block: genesisBlock };
    } else if (success && blocks.length > 0) {
      latestBlockCache = blocks[0];
      blockCount = blocks[0].blockNumber + 1;
      console.log('[OQT Ledger] Loaded existing ledger, block count:', blockCount);
      return { success: true, block: blocks[0] };
    }

    return { success: false, error: 'Failed to initialize ledger' };
  } catch (error) {
    console.error('[OQT Ledger] Error initializing:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calculate SHA-256 hash for a block
 */
function calculateBlockHash(block) {
  const blockString = JSON.stringify({
    blockNumber: block.blockNumber,
    previousHash: block.previousHash,
    data: block.data,
    timestamp: block.timestamp,
    nonce: block.nonce || 0
  });

  return crypto.createHash('sha256').update(blockString).digest('hex');
}

/**
 * Add a new block to the ledger
 * 
 * @param {object} data - Data to store in the block
 * @param {string} data.type - Type of event (query, training, model_update, etc.)
 * @param {object} data.content - Event-specific data
 * @returns {Promise<object>} Result with success flag and block data
 */
export async function addLedgerBlock(data) {
  try {
    // Ensure ledger is initialized
    if (!latestBlockCache) {
      const initResult = await initializeLedger();
      if (!initResult.success) {
        throw new Error('Failed to initialize ledger');
      }
    }

    // Get the latest block
    const previousBlock = latestBlockCache;
    
    // Create new block
    const newBlock = {
      blockNumber: blockCount,
      previousHash: previousBlock.hash,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      nonce: 0
    };

    // Calculate hash
    newBlock.hash = calculateBlockHash(newBlock);

    // Verify block integrity
    const verification = verifyBlock(newBlock, previousBlock);
    newBlock.verified = verification.valid;

    // Save to Firebase
    const saveResult = await saveOQTLedgerBlock(newBlock);

    if (saveResult.success) {
      latestBlockCache = newBlock;
      blockCount++;
      
      console.log('[OQT Ledger] Block added:', newBlock.blockNumber, 'Hash:', newBlock.hash.substring(0, 16) + '...');
      
      return { 
        success: true, 
        block: newBlock,
        blockNumber: newBlock.blockNumber,
        hash: newBlock.hash
      };
    }

    return { success: false, error: 'Failed to save block' };
  } catch (error) {
    console.error('[OQT Ledger] Error adding block:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify a single block's integrity
 */
function verifyBlock(block, previousBlock) {
  // Verify hash matches content
  const calculatedHash = calculateBlockHash(block);
  if (calculatedHash !== block.hash) {
    return {
      valid: false,
      reason: 'Hash mismatch',
      expected: calculatedHash,
      actual: block.hash
    };
  }

  // Verify previous hash link (except for genesis)
  if (block.blockNumber > 0) {
    if (block.previousHash !== previousBlock.hash) {
      return {
        valid: false,
        reason: 'Previous hash mismatch',
        expected: previousBlock.hash,
        actual: block.previousHash
      };
    }
  }

  return { valid: true };
}

/**
 * Verify entire blockchain integrity
 */
export async function verifyLedger(options = {}) {
  try {
    const { limit = 100 } = options;
    const { success, blocks } = await getOQTLedgerBlocks({ limit });

    if (!success || blocks.length === 0) {
      return { 
        valid: false, 
        error: 'No blocks found',
        totalBlocks: 0
      };
    }

    // Sort blocks by block number (ascending)
    blocks.sort((a, b) => a.blockNumber - b.blockNumber);

    let invalidBlocks = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const previousBlock = i > 0 ? blocks[i - 1] : null;

      const verification = verifyBlock(block, previousBlock);
      
      if (!verification.valid) {
        invalidBlocks.push({
          blockNumber: block.blockNumber,
          reason: verification.reason,
          details: verification
        });
      }
    }

    return {
      valid: invalidBlocks.length === 0,
      totalBlocks: blocks.length,
      verifiedBlocks: blocks.length - invalidBlocks.length,
      invalidBlocks,
      integrity: invalidBlocks.length === 0 ? 100 : 
        ((blocks.length - invalidBlocks.length) / blocks.length * 100).toFixed(2)
    };
  } catch (error) {
    console.error('[OQT Ledger] Error verifying ledger:', error);
    return { 
      valid: false, 
      error: error.message,
      totalBlocks: 0
    };
  }
}

/**
 * Get ledger statistics
 */
export async function getLedgerStats() {
  try {
    const { success, blocks, count } = await getOQTLedgerBlocks({ limit: 100 });

    if (!success) {
      return { success: false, stats: null };
    }

    // Count blocks by type
    const typeBreakdown = {};
    blocks.forEach(block => {
      const type = block.data?.type || 'unknown';
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;
    });

    // Get latest block
    const latestBlock = blocks.length > 0 ? blocks[0] : null;

    return {
      success: true,
      stats: {
        totalBlocks: blockCount || count,
        typeBreakdown,
        latestBlock: latestBlock ? {
          blockNumber: latestBlock.blockNumber,
          hash: latestBlock.hash,
          timestamp: latestBlock.timestamp,
          type: latestBlock.data?.type
        } : null
      }
    };
  } catch (error) {
    console.error('[OQT Ledger] Error getting stats:', error);
    return { success: false, stats: null, error: error.message };
  }
}

/**
 * Add query event to ledger
 */
export async function addQueryToLedger(queryId, question, modelVersion) {
  return addLedgerBlock({
    type: 'query',
    content: {
      queryId,
      question: question.substring(0, 100) + (question.length > 100 ? '...' : ''),
      modelVersion
    }
  });
}

/**
 * Add training event to ledger
 */
export async function addTrainingToLedger(trainingId, trainingType, samplesProcessed, newVersion) {
  return addLedgerBlock({
    type: 'training',
    content: {
      trainingId,
      trainingType, // 'micro' or 'batch'
      samplesProcessed,
      newVersion
    }
  });
}

/**
 * Add model update event to ledger
 */
export async function addModelUpdateToLedger(oldVersion, newVersion, changes) {
  return addLedgerBlock({
    type: 'model_update',
    content: {
      oldVersion,
      newVersion,
      changes
    }
  });
}

// Initialize ledger on module load
initializeLedger().catch(err => {
  console.error('[OQT Ledger] Failed to initialize on load:', err);
});
