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
    
    // Note: We cannot combine where() and orderBy() on different fields without a composite index
    // For now, we'll fetch all and filter/sort in memory to avoid requiring index setup
    
    const snapshot = await query.get();
    
    let debates = [];
    snapshot.forEach(doc => {
      debates.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Apply status filter in memory if specified
    if (options.status) {
      debates = debates.filter(d => d.status === options.status);
    }
    
    // Sort by created_at (newest first)
    debates.sort((a, b) => {
      const dateA = a.created_at || a.createdAt || '';
      const dateB = b.created_at || b.createdAt || '';
      return dateB.localeCompare(dateA);
    });
    
    // Apply limit if specified
    if (options.limit) {
      debates = debates.slice(0, options.limit);
    }
    
    console.log(`[PES] Retrieved ${debates.length} debates from Firebase (total: ${snapshot.size})`);
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
 * Save a debate to Firebase (called from ML service via API)
 * @param {Object} debateData - The debate data to save
 * @returns {Promise<void>}
 */
export async function saveDebate(debateData) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    console.log(`[PES] Saving debate ${debateData.debate_id} to Firebase...`);
    
    // Use the provided debate_id as the document ID
    const docRef = db.collection('debates').doc(debateData.debate_id);
    
    await docRef.set(debateData, { merge: true });
    
    console.log(`[PES] ✅ Debate ${debateData.debate_id} saved to Firebase`);
  } catch (error) {
    console.error('[PES] Error saving debate:', error);
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

// ============================================================================
// PHASE 2: Evolution Loop Functions
// ============================================================================

/**
 * Save an evolution loop run to Firebase
 * @param {Object} evolution - Evolution data
 * @returns {Promise<string>} Evolution document ID
 */
export async function saveEvolution(evolution) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const data = {
      evolution_id: evolution.evolution_id,
      timestamp: evolution.timestamp || new Date().toISOString(),
      status: evolution.status || 'running',
      config: evolution.config || {},
      debates_used: evolution.debates_used || [],
      insights: evolution.insights || {},
      variants_tested: evolution.variants || [],
      winner: evolution.winner || null,
      improvement_percentage: evolution.improvement_percentage || 0,
      all_variant_metrics: evolution.all_variant_metrics || {},
      report: evolution.report || {},
      duration_seconds: evolution.duration_seconds || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const docRef = await db.collection('evolutions').doc(evolution.evolution_id).set(data);
    
    console.log(`[PES Phase 2] Saved evolution ${evolution.evolution_id}`);
    return evolution.evolution_id;
  } catch (error) {
    console.error('[PES Phase 2] Error saving evolution:', error);
    throw error;
  }
}

/**
 * Update evolution progress
 * @param {string} evolutionId - Evolution ID
 * @param {Object} updates - Updates to apply
 * @returns {Promise<void>}
 */
export async function updateEvolution(evolutionId, updates) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    await db.collection('evolutions').doc(evolutionId).update({
      ...updates,
      updated_at: new Date().toISOString()
    });
    
    console.log(`[PES Phase 2] Updated evolution ${evolutionId}`);
  } catch (error) {
    console.error('[PES Phase 2] Error updating evolution:', error);
    throw error;
  }
}

/**
 * Get evolution by ID
 * @param {string} evolutionId - Evolution ID
 * @returns {Promise<Object|null>} Evolution document
 */
export async function getEvolution(evolutionId) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const doc = await db.collection('evolutions').doc(evolutionId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('[PES Phase 2] Error fetching evolution:', error);
    throw error;
  }
}

/**
 * Get all evolutions
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of evolution documents
 */
export async function getAllEvolutions(options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('evolutions');
    
    // Order by creation date (newest first)
    query = query.orderBy('created_at', 'desc');
    
    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const evolutions = [];
    snapshot.forEach(doc => {
      evolutions.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES Phase 2] Retrieved ${evolutions.length} evolutions`);
    return evolutions;
  } catch (error) {
    console.error('[PES Phase 2] Error fetching evolutions:', error);
    throw error;
  }
}

/**
 * Save simulation run details (for Phase 2)
 * @param {Object} simulationRun - Simulation run data
 * @returns {Promise<string>} Document ID
 */
export async function saveSimulationRun(simulationRun) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    const data = {
      simulation_id: simulationRun.simulation_id,
      evolution_id: simulationRun.evolution_id,
      debate_id: simulationRun.debate_id,
      variant_version: simulationRun.variant_version,
      rounds: simulationRun.rounds || [],
      voting: simulationRun.voting || {},
      created_at: new Date().toISOString()
    };
    
    const docRef = await db.collection('simulation_runs').add(data);
    
    console.log(`[PES Phase 2] Saved simulation run ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[PES Phase 2] Error saving simulation run:', error);
    throw error;
  }
}

/**
 * Get simulation runs for an evolution
 * @param {string} evolutionId - Evolution ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of simulation runs
 */
export async function getSimulationRunsByEvolution(evolutionId, options = {}) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    
    let query = db.collection('simulation_runs')
      .where('evolution_id', '==', evolutionId);
    
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    const snapshot = await query.get();
    
    const runs = [];
    snapshot.forEach(doc => {
      runs.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`[PES Phase 2] Retrieved ${runs.length} simulation runs for evolution ${evolutionId}`);
    return runs;
  } catch (error) {
    console.error('[PES Phase 2] Error fetching simulation runs:', error);
    throw error;
  }
}
