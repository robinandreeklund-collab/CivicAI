/**
 * OQT Firebase Service
 * Manages Firebase Firestore operations for OQT-1.0 model data
 * Collections: oqt_queries, oqt_metrics, oqt_training_events, oqt_ledger
 */

import { isFirebaseAvailable, getDb } from './firebaseService.js';

/**
 * Save OQT query to Firestore
 * Collection: oqt_queries
 */
export async function saveOQTQuery(queryData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[OQT Firebase] Firebase not available, skipping query save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const queryRef = await db.collection('oqt_queries').add({
      ...queryData,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('[OQT Firebase] Query saved:', queryRef.id);
    return { success: true, stored: true, id: queryRef.id };
  } catch (error) {
    console.error('[OQT Firebase] Error saving query:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get OQT queries from Firestore
 * Collection: oqt_queries
 */
export async function getOQTQueries(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, queries: [] };
  }

  try {
    const db = await getDb();
    const { limit = 50, startAfter = null } = options;

    let query = db.collection('oqt_queries')
      .orderBy('createdAt', 'desc')
      .limit(limit);

    if (startAfter) {
      query = query.startAfter(startAfter);
    }

    const snapshot = await query.get();
    const queries = [];

    snapshot.forEach(doc => {
      queries.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, queries, count: queries.length };
  } catch (error) {
    console.error('[OQT Firebase] Error getting queries:', error);
    return { success: false, queries: [], error: error.message };
  }
}

/**
 * Save OQT metrics to Firestore
 * Collection: oqt_metrics
 */
export async function saveOQTMetrics(metricsData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[OQT Firebase] Firebase not available, skipping metrics save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const metricsRef = await db.collection('oqt_metrics').add({
      ...metricsData,
      timestamp: new Date()
    });

    console.log('[OQT Firebase] Metrics saved:', metricsRef.id);
    return { success: true, stored: true, id: metricsRef.id };
  } catch (error) {
    console.error('[OQT Firebase] Error saving metrics:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get latest OQT metrics from Firestore
 * Collection: oqt_metrics
 */
export async function getLatestOQTMetrics() {
  if (!(await isFirebaseAvailable())) {
    return { success: false, metrics: null };
  }

  try {
    const db = await getDb();
    const snapshot = await db.collection('oqt_metrics')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: true, metrics: null };
    }

    const doc = snapshot.docs[0];
    return { 
      success: true, 
      metrics: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    console.error('[OQT Firebase] Error getting latest metrics:', error);
    return { success: false, metrics: null, error: error.message };
  }
}

/**
 * Save OQT training event to Firestore
 * Collection: oqt_training_events
 */
export async function saveOQTTrainingEvent(trainingData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[OQT Firebase] Firebase not available, skipping training event save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const eventRef = await db.collection('oqt_training_events').add({
      ...trainingData,
      timestamp: new Date()
    });

    console.log('[OQT Firebase] Training event saved:', eventRef.id);
    return { success: true, stored: true, id: eventRef.id };
  } catch (error) {
    console.error('[OQT Firebase] Error saving training event:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get OQT training events from Firestore
 * Collection: oqt_training_events
 */
export async function getOQTTrainingEvents(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, events: [] };
  }

  try {
    const db = await getDb();
    const { limit = 100, type = null } = options;

    let query = db.collection('oqt_training_events')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.get();
    const events = [];

    snapshot.forEach(doc => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, events, count: events.length };
  } catch (error) {
    console.error('[OQT Firebase] Error getting training events:', error);
    return { success: false, events: [], error: error.message };
  }
}

/**
 * Save OQT ledger block to Firestore
 * Collection: oqt_ledger
 */
export async function saveOQTLedgerBlock(blockData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[OQT Firebase] Firebase not available, skipping ledger block save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    
    // Use blockNumber as document ID for easy retrieval
    const blockRef = db.collection('oqt_ledger').doc(String(blockData.blockNumber));
    await blockRef.set({
      ...blockData,
      timestamp: new Date()
    });

    console.log('[OQT Firebase] Ledger block saved:', blockData.blockNumber);
    return { success: true, stored: true, blockNumber: blockData.blockNumber };
  } catch (error) {
    console.error('[OQT Firebase] Error saving ledger block:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get OQT ledger blocks from Firestore
 * Collection: oqt_ledger
 */
export async function getOQTLedgerBlocks(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, blocks: [] };
  }

  try {
    const db = await getDb();
    const { limit = 50, startBlock = null } = options;

    let query = db.collection('oqt_ledger')
      .orderBy('blockNumber', 'desc')
      .limit(limit);

    if (startBlock !== null) {
      query = query.where('blockNumber', '<=', startBlock);
    }

    const snapshot = await query.get();
    const blocks = [];

    snapshot.forEach(doc => {
      blocks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, blocks, count: blocks.length };
  } catch (error) {
    console.error('[OQT Firebase] Error getting ledger blocks:', error);
    return { success: false, blocks: [], error: error.message };
  }
}

/**
 * Get specific OQT ledger block by number
 * Collection: oqt_ledger
 */
export async function getOQTLedgerBlock(blockNumber) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, block: null };
  }

  try {
    const db = await getDb();
    const blockDoc = await db.collection('oqt_ledger').doc(String(blockNumber)).get();

    if (!blockDoc.exists) {
      return { success: true, block: null };
    }

    return {
      success: true,
      block: {
        id: blockDoc.id,
        ...blockDoc.data()
      }
    };
  } catch (error) {
    console.error('[OQT Firebase] Error getting ledger block:', error);
    return { success: false, block: null, error: error.message };
  }
}

/**
 * Save OQT provenance data to Firestore
 * Collection: oqt_provenance
 */
export async function saveOQTProvenance(provenanceData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[OQT Firebase] Firebase not available, skipping provenance save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const provenanceRef = await db.collection('oqt_provenance').add({
      ...provenanceData,
      createdAt: new Date()
    });

    console.log('[OQT Firebase] Provenance saved:', provenanceRef.id);
    return { success: true, stored: true, id: provenanceRef.id };
  } catch (error) {
    console.error('[OQT Firebase] Error saving provenance:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get OQT provenance by query ID
 * Collection: oqt_provenance
 */
export async function getOQTProvenance(queryId) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, provenance: null };
  }

  try {
    const db = await getDb();
    const snapshot = await db.collection('oqt_provenance')
      .where('queryId', '==', queryId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { success: true, provenance: null };
    }

    const doc = snapshot.docs[0];
    return {
      success: true,
      provenance: {
        id: doc.id,
        ...doc.data()
      }
    };
  } catch (error) {
    console.error('[OQT Firebase] Error getting provenance:', error);
    return { success: false, provenance: null, error: error.message };
  }
}

// ============================================================================
// ONESEEK Δ+ NEW COLLECTIONS
// Collections: delta_topics, delta_messages, delta_typo_pairs, delta_gold_examples
// ============================================================================

/**
 * Save or update delta topic to Firestore
 * Collection: delta_topics
 * Uses topic_hash as document ID for upsert behavior
 */
export async function saveDeltaTopic(topicData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[Δ+ Firebase] Firebase not available, skipping topic save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const { topic_hash, intent, entity, label } = topicData;
    
    if (!topic_hash) {
      console.warn('[Δ+ Firebase] topic_hash is required');
      return { success: false, stored: false, error: 'topic_hash required' };
    }
    
    // Use topic_hash as document ID for upsert
    const topicRef = db.collection('delta_topics').doc(topic_hash);
    const existingDoc = await topicRef.get();
    
    if (existingDoc.exists) {
      // Update existing topic (increment message count, update timestamp)
      await topicRef.update({
        message_count: (existingDoc.data().message_count || 0) + 1,
        updated_at: new Date()
      });
      console.log('[Δ+ Firebase] Topic updated:', topic_hash);
    } else {
      // Create new topic
      await topicRef.set({
        topic_hash,
        intent: intent || 'general',
        entity: entity || '',
        label: label || `${intent || 'General'}${entity ? ' i ' + entity : ''}`,
        message_count: 1,
        created_at: new Date(),
        updated_at: new Date()
      });
      console.log('[Δ+ Firebase] Topic created:', topic_hash);
    }
    
    return { success: true, stored: true, topic_hash };
  } catch (error) {
    console.error('[Δ+ Firebase] Error saving topic:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get delta topics from Firestore
 * Collection: delta_topics
 */
export async function getDeltaTopics(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, topics: [] };
  }

  try {
    const db = await getDb();
    const { limit = 50 } = options;

    const snapshot = await db.collection('delta_topics')
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .get();

    const topics = [];
    snapshot.forEach(doc => {
      topics.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, topics, count: topics.length };
  } catch (error) {
    console.error('[Δ+ Firebase] Error getting topics:', error);
    return { success: false, topics: [], error: error.message };
  }
}

/**
 * Save delta message to Firestore
 * Collection: delta_messages
 */
export async function saveDeltaMessage(messageData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[Δ+ Firebase] Firebase not available, skipping message save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const { topic_hash, question, answer, intent, entity, sources, confidence, response_hash } = messageData;
    
    const messageRef = await db.collection('delta_messages').add({
      topic_hash: topic_hash || 'unknown',
      question: question || '',
      answer: answer || '',
      intent: intent || 'general',
      entity: entity || '',
      sources: sources || [],
      confidence: confidence || null,
      response_hash: response_hash || null,
      timestamp: new Date()
    });

    console.log('[Δ+ Firebase] Message saved:', messageRef.id);
    return { success: true, stored: true, id: messageRef.id };
  } catch (error) {
    console.error('[Δ+ Firebase] Error saving message:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get delta messages by topic_hash
 * Collection: delta_messages
 */
export async function getDeltaMessagesByTopic(topicHash, options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, messages: [] };
  }

  try {
    const db = await getDb();
    const { limit = 20 } = options;

    const snapshot = await db.collection('delta_messages')
      .where('topic_hash', '==', topicHash)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, messages, count: messages.length };
  } catch (error) {
    console.error('[Δ+ Firebase] Error getting messages:', error);
    return { success: false, messages: [], error: error.message };
  }
}

/**
 * Save typo pair to Firestore
 * Collection: delta_typo_pairs
 */
export async function saveDeltaTypoPair(typoPairData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[Δ+ Firebase] Firebase not available, skipping typo pair save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const { original, corrected, context, status } = typoPairData;
    
    const pairRef = await db.collection('delta_typo_pairs').add({
      original: original || '',
      corrected: corrected || '',
      context: context || '',
      status: status || 'pending', // pending, approved, rejected
      created_at: new Date(),
      approved_at: null,
      approved_by: null
    });

    console.log('[Δ+ Firebase] Typo pair saved:', pairRef.id);
    return { success: true, stored: true, id: pairRef.id };
  } catch (error) {
    console.error('[Δ+ Firebase] Error saving typo pair:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get delta typo pairs from Firestore
 * Collection: delta_typo_pairs
 */
export async function getDeltaTypoPairs(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, pairs: [] };
  }

  try {
    const db = await getDb();
    const { status = null, limit = 100 } = options;

    let query = db.collection('delta_typo_pairs')
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (status) {
      query = query.where('status', '==', status);
    }

    const snapshot = await query.get();
    const pairs = [];

    snapshot.forEach(doc => {
      pairs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, pairs, count: pairs.length };
  } catch (error) {
    console.error('[Δ+ Firebase] Error getting typo pairs:', error);
    return { success: false, pairs: [], error: error.message };
  }
}

/**
 * Update typo pair status (approve/reject)
 * Collection: delta_typo_pairs
 */
export async function updateDeltaTypoPairStatus(pairId, status, approvedBy = null) {
  if (!(await isFirebaseAvailable())) {
    return { success: false };
  }

  try {
    const db = await getDb();
    const updateData = {
      status,
      updated_at: new Date()
    };
    
    if (status === 'approved') {
      updateData.approved_at = new Date();
      updateData.approved_by = approvedBy;
    }
    
    await db.collection('delta_typo_pairs').doc(pairId).update(updateData);
    console.log('[Δ+ Firebase] Typo pair status updated:', pairId, status);
    return { success: true };
  } catch (error) {
    console.error('[Δ+ Firebase] Error updating typo pair:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Save gold example to Firestore
 * Collection: delta_gold_examples
 */
export async function saveDeltaGoldExample(goldData) {
  if (!(await isFirebaseAvailable())) {
    console.log('[Δ+ Firebase] Firebase not available, skipping gold example save');
    return { success: false, stored: false };
  }

  try {
    const db = await getDb();
    const { question, answer, intent, entity, sources, quality_score, approved_by } = goldData;
    
    const goldRef = await db.collection('delta_gold_examples').add({
      question: question || '',
      answer: answer || '',
      intent: intent || 'general',
      entity: entity || '',
      sources: sources || [],
      quality_score: quality_score || 1.0,
      approved_by: approved_by || 'admin',
      created_at: new Date()
    });

    console.log('[Δ+ Firebase] Gold example saved:', goldRef.id);
    return { success: true, stored: true, id: goldRef.id };
  } catch (error) {
    console.error('[Δ+ Firebase] Error saving gold example:', error);
    return { success: false, stored: false, error: error.message };
  }
}

/**
 * Get delta gold examples from Firestore
 * Collection: delta_gold_examples
 */
export async function getDeltaGoldExamples(options = {}) {
  if (!(await isFirebaseAvailable())) {
    return { success: false, examples: [] };
  }

  try {
    const db = await getDb();
    const { intent = null, limit = 100 } = options;

    let query = db.collection('delta_gold_examples')
      .orderBy('created_at', 'desc')
      .limit(limit);

    if (intent) {
      query = query.where('intent', '==', intent);
    }

    const snapshot = await query.get();
    const examples = [];

    snapshot.forEach(doc => {
      examples.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return { success: true, examples, count: examples.length };
  } catch (error) {
    console.error('[Δ+ Firebase] Error getting gold examples:', error);
    return { success: false, examples: [], error: error.message };
  }
}

/**
 * Delete delta gold example
 * Collection: delta_gold_examples
 */
export async function deleteDeltaGoldExample(exampleId) {
  if (!(await isFirebaseAvailable())) {
    return { success: false };
  }

  try {
    const db = await getDb();
    await db.collection('delta_gold_examples').doc(exampleId).delete();
    console.log('[Δ+ Firebase] Gold example deleted:', exampleId);
    return { success: true };
  } catch (error) {
    console.error('[Δ+ Firebase] Error deleting gold example:', error);
    return { success: false, error: error.message };
  }
}
