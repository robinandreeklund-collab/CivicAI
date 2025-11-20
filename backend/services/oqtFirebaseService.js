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
