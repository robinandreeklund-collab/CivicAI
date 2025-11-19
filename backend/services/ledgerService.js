/**
 * Ledger Service
 * Manages blockchain-inspired transparency ledger
 * 
 * NOTE: In-memory storage for MVP. For production:
 * - Store in Firebase Firestore (ledger_blocks collection)
 * - Implement proper cryptographic signing
 * - Add distributed verification
 */

import crypto from 'crypto';

// In-memory ledger storage
const ledgerBlocks = [];

/**
 * Create a hash of data
 * @param {any} data - Data to hash
 * @returns {string} SHA-256 hash
 */
function createHash(data) {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Get the last block in the chain
 * @returns {object|null} Last block or null if chain is empty
 */
function getLastBlock() {
  return ledgerBlocks.length > 0 ? ledgerBlocks[ledgerBlocks.length - 1] : null;
}

/**
 * Create a new ledger block
 * @param {Object} params - Block parameters
 * @param {string} params.eventType - Type of event (data_collection, training, update, etc.)
 * @param {Object} params.data - Event-specific data
 * @returns {Object} Created ledger block
 */
export async function createLedgerBlock({ eventType, data }) {
  const lastBlock = getLastBlock();
  const blockNumber = lastBlock ? lastBlock.block_id + 1 : 0;
  const previousHash = lastBlock ? lastBlock.current_hash : '0';
  
  const timestamp = new Date().toISOString();
  
  // Create block data
  const blockData = {
    block_id: blockNumber,
    timestamp,
    previous_hash: previousHash,
    event_type: eventType,
    data: {
      ...data,
      timestamp // Ensure timestamp is in data as well
    }
  };
  
  // Create hash of current block
  const currentHash = createHash({
    block_id: blockNumber,
    timestamp,
    previous_hash: previousHash,
    event_type: eventType,
    data: blockData.data
  });
  
  // Complete block with hash
  const block = {
    ...blockData,
    current_hash: currentHash,
    signatures: {
      data_hash: createHash(blockData.data),
      validator: 'system'
    }
  };
  
  // Add to ledger
  ledgerBlocks.push(block);
  
  console.log(`[Ledger Service] Block #${blockNumber} created: ${eventType}`);
  
  return block;
}

/**
 * Get all ledger blocks
 * @param {Object} options - Query options
 * @param {number} [options.limit] - Maximum number of blocks to return
 * @param {string} [options.eventType] - Filter by event type
 * @returns {Array} Array of ledger blocks
 */
export function getLedgerBlocks(options = {}) {
  let blocks = [...ledgerBlocks];
  
  // Filter by event type
  if (options.eventType) {
    blocks = blocks.filter(block => block.event_type === options.eventType);
  }
  
  // Sort by block_id (newest first)
  blocks.sort((a, b) => b.block_id - a.block_id);
  
  // Apply limit
  if (options.limit) {
    blocks = blocks.slice(0, options.limit);
  }
  
  return blocks;
}

/**
 * Get a specific ledger block by ID
 * @param {number} blockId - Block ID
 * @returns {Object|null} Ledger block or null if not found
 */
export function getLedgerBlock(blockId) {
  return ledgerBlocks.find(block => block.block_id === blockId) || null;
}

/**
 * Verify the integrity of the ledger chain
 * @returns {Object} Verification result
 */
export function verifyLedgerChain() {
  if (ledgerBlocks.length === 0) {
    return { valid: true, message: 'Ledger is empty' };
  }
  
  // Check genesis block
  const genesisBlock = ledgerBlocks[0];
  if (genesisBlock.previous_hash !== '0') {
    return { 
      valid: false, 
      message: 'Invalid genesis block',
      blockId: 0 
    };
  }
  
  // Verify each block in the chain
  for (let i = 1; i < ledgerBlocks.length; i++) {
    const currentBlock = ledgerBlocks[i];
    const previousBlock = ledgerBlocks[i - 1];
    
    // Check if previous hash matches
    if (currentBlock.previous_hash !== previousBlock.current_hash) {
      return {
        valid: false,
        message: `Block #${currentBlock.block_id} has invalid previous hash`,
        blockId: currentBlock.block_id
      };
    }
    
    // Verify current hash
    const calculatedHash = createHash({
      block_id: currentBlock.block_id,
      timestamp: currentBlock.timestamp,
      previous_hash: currentBlock.previous_hash,
      event_type: currentBlock.event_type,
      data: currentBlock.data
    });
    
    if (calculatedHash !== currentBlock.current_hash) {
      return {
        valid: false,
        message: `Block #${currentBlock.block_id} has invalid hash`,
        blockId: currentBlock.block_id
      };
    }
  }
  
  return { 
    valid: true, 
    message: 'Ledger chain is valid',
    totalBlocks: ledgerBlocks.length 
  };
}

/**
 * Get ledger statistics
 * @returns {Object} Ledger statistics
 */
export function getLedgerStats() {
  const eventTypeCounts = {};
  
  ledgerBlocks.forEach(block => {
    eventTypeCounts[block.event_type] = (eventTypeCounts[block.event_type] || 0) + 1;
  });
  
  return {
    totalBlocks: ledgerBlocks.length,
    genesisBlock: ledgerBlocks.length > 0 ? ledgerBlocks[0] : null,
    latestBlock: getLastBlock(),
    eventTypes: eventTypeCounts,
    verified: verifyLedgerChain().valid
  };
}

/**
 * Clear all ledger blocks (for testing purposes)
 */
export function clearLedger() {
  ledgerBlocks.length = 0;
  console.log('[Ledger Service] Ledger cleared');
}

export default {
  createLedgerBlock,
  getLedgerBlocks,
  getLedgerBlock,
  verifyLedgerChain,
  getLedgerStats,
  clearLedger
};
