/**
 * PES Firebase Service
 * Manages Firebase operations for Prompt Evolution System
 * 
 * Collections:
 * - debates: Real debates from live system (managed by consensusDebate.js)
 * - prompt_versions: All prompt versions with metadata and performance
 * - simulations: Simulation runs and their results
 */

import { getDb } from '../../backend/services/firebaseService.js';

/**
 * Get all debates from Firebase
 * @param {Object} options - Query options
 * @param {number} options.limit - Limit number of results
 * @param {string} options.status - Filter by status
 * @returns {Promise<Array>} Array of debate documents
 */
export async function getDebates(options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('debates');
    
    // Apply filters
    if (options.status) {
      query = query.where('status', '==', options.status);
    }
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const debates = [];
    snapshot.forEach(doc => {
      debates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES] Retrieved ${debates.length} debates from Firebase`);
    return debates;
  } catch (error) {
    console.error('[PES] Error fetching debates:', error);
    throw error;
  }
}

/**
 * Get a specific debate by ID
 * @param {string} debateId - The debate ID
 * @returns {Promise<Object|null>} Debate document or null
 */
export async function getDebateById(debateId) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const doc = await db.collection('debates').doc(debateId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[PES] Error fetching debate:', error);
    throw error;
  }
}

/**
 * Save a new prompt version
 * @param {Object} promptVersion - The prompt version data
 * @returns {Promise<string>} The created document ID
 */
export async function savePromptVersion(promptVersion) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const timestamp = new Date().toISOString();
    const data = {
      prompt_text: promptVersion.promptText,
      version: promptVersion.version,
      topic: promptVersion.topic || 'general',
      metadata: promptVersion.metadata || {},
      performance_data: promptVersion.performanceData || {
        simulations_count: 0,
        average_score: 0,
        win_rate: 0,
      },
      created_at: timestamp,
      updated_at: timestamp,
      status: promptVersion.status || 'active',
    };
    
    const docRef = await db.collection('prompt_versions').add(data);
    
    console.log(`[PES] Saved prompt version ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[PES] Error saving prompt version:', error);
    throw error;
  }
}

/**
 * Get all prompt versions
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of prompt version documents
 */
export async function getPromptVersions(options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('prompt_versions');
    
    // Filter by topic if specified
    if (options.topic) {
      query = query.where('topic', '==', options.topic);
    }
    
    // Filter by status if specified
    if (options.status) {
      query = query.where('status', '==', options.status);
    }
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const promptVersions = [];
    snapshot.forEach(doc => {
      promptVersions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES] Retrieved ${promptVersions.length} prompt versions`);
    return promptVersions;
  } catch (error) {
    console.error('[PES] Error fetching prompt versions:', error);
    throw error;
  }
}

/**
 * Update prompt version performance data
 * @param {string} versionId - The prompt version ID
 * @param {Object} performanceData - Performance metrics to update
 */
export async function updatePromptPerformance(versionId, performanceData) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    await db.collection('prompt_versions').doc(versionId).update({
      performance_data: performanceData,
      updated_at: new Date().toISOString(),
    });
    
    console.log(`[PES] Updated performance for prompt version ${versionId}`);
  } catch (error) {
    console.error('[PES] Error updating prompt performance:', error);
    throw error;
  }
}

/**
 * Save a simulation run
 * @param {Object} simulation - The simulation data
 * @returns {Promise<string>} The created document ID
 */
export async function saveSimulation(simulation) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const data = {
      prompt_version_id: simulation.promptVersionId,
      debate_ids: simulation.debateIds || [],
      results: simulation.results || {},
      recommendations: simulation.recommendations || [],
      performance_metrics: simulation.performanceMetrics || {},
      metadata: simulation.metadata || {},
      created_at: new Date().toISOString(),
      status: simulation.status || 'completed',
    };
    
    const docRef = await db.collection('simulations').add(data);
    
    console.log(`[PES] Saved simulation ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[PES] Error saving simulation:', error);
    throw error;
  }
}

/**
 * Get simulations for a specific prompt version
 * @param {string} promptVersionId - The prompt version ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of simulation documents
 */
export async function getSimulationsByPromptVersion(promptVersionId, options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('simulations')
      .where('prompt_version_id', '==', promptVersionId);
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const simulations = [];
    snapshot.forEach(doc => {
      simulations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES] Retrieved ${simulations.length} simulations for prompt version ${promptVersionId}`);
    return simulations;
  } catch (error) {
    console.error('[PES] Error fetching simulations:', error);
    throw error;
  }
}

/**
 * Get all simulations
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of simulation documents
 */
export async function getAllSimulations(options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('simulations');
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    // Apply limit if specified
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const simulations = [];
    snapshot.forEach(doc => {
      simulations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES] Retrieved ${simulations.length} simulations`);
    return simulations;
  } catch (error) {
    console.error('[PES] Error fetching simulations:', error);
    throw error;
  }
}
