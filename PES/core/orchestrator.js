/**
 * PES Orchestrator
 * 
 * Main orchestrator for Prompt Evolution System
 * Coordinates simulation, analysis, and prompt management
 */

import { runSimulation } from './simulator.js';
import { analyzePromptPerformance, comparePromptVersions, findBestPromptVersion } from './analyzer.js';
import { 
  savePromptVersion, 
  getPromptVersions, 
  updatePromptPerformance,
  saveSimulation 
} from '../services/pesFirebaseService.js';
import { PES_CONFIG } from '../config/pesConfig.js';

/**
 * Create and test a new prompt version
 * @param {Object} promptData - Prompt version data
 * @param {string} promptData.promptText - The prompt text
 * @param {string} promptData.version - Version identifier
 * @param {string} promptData.topic - Topic category
 * @param {Object} promptData.metadata - Additional metadata
 * @param {boolean} runSimulationImmediately - Whether to run simulation immediately
 * @returns {Promise<Object>} Created prompt version with initial results
 */
export async function createAndTestPromptVersion(promptData, runSimulationImmediately = true) {
  console.log(`[PES Orchestrator] Creating new prompt version: ${promptData.version}`);
  
  try {
    // Validate prompt data
    if (!promptData.promptText || !promptData.version) {
      throw new Error('promptText and version are required');
    }
    
    // Set defaults
    const promptVersion = {
      promptText: promptData.promptText,
      version: promptData.version,
      topic: promptData.topic || PES_CONFIG.promptVersions.defaultTopic,
      metadata: promptData.metadata || {},
      status: PES_CONFIG.promptVersions.status.TESTING,
    };
    
    // Save to Firebase
    const promptId = await savePromptVersion(promptVersion);
    promptVersion.id = promptId;
    
    console.log(`[PES Orchestrator] Prompt version saved with ID: ${promptId}`);
    
    // Run simulation if requested
    let simulationResult = null;
    if (runSimulationImmediately) {
      console.log(`[PES Orchestrator] Running initial simulation...`);
      simulationResult = await runSimulation(promptVersion);
      
      // Save simulation results
      if (simulationResult.success) {
        const simulationId = await saveSimulation({
          promptVersionId: promptId,
          debateIds: simulationResult.debateIds,
          results: simulationResult.results,
          recommendations: simulationResult.recommendations,
          performanceMetrics: simulationResult.performanceMetrics,
          metadata: {
            initial_test: true,
          },
        });
        
        console.log(`[PES Orchestrator] Simulation saved with ID: ${simulationId}`);
        
        // Update prompt version with initial performance
        await updatePromptPerformance(promptId, {
          simulations_count: 1,
          average_score: simulationResult.performanceMetrics.averageScore,
          success_rate: simulationResult.performanceMetrics.successRate,
        });
      }
    }
    
    return {
      promptVersion: {
        id: promptId,
        ...promptVersion,
      },
      simulation: simulationResult,
    };
  } catch (error) {
    console.error('[PES Orchestrator] Error creating prompt version:', error);
    throw error;
  }
}

/**
 * Run a simulation loop for an existing prompt version
 * @param {string} promptVersionId - The prompt version ID
 * @param {Object} options - Simulation options
 * @returns {Promise<Object>} Simulation results
 */
export async function runSimulationForPrompt(promptVersionId, options = {}) {
  console.log(`[PES Orchestrator] Running simulation for prompt version: ${promptVersionId}`);
  
  try {
    // Get prompt version from Firebase
    const promptVersions = await getPromptVersions({ limit: 100 });
    const promptVersion = promptVersions.find(pv => pv.id === promptVersionId);
    
    if (!promptVersion) {
      throw new Error(`Prompt version ${promptVersionId} not found`);
    }
    
    // Run simulation
    const simulationResult = await runSimulation(promptVersion, options);
    
    // Save simulation results
    if (simulationResult.success) {
      const simulationId = await saveSimulation({
        promptVersionId,
        debateIds: simulationResult.debateIds,
        results: simulationResult.results,
        recommendations: simulationResult.recommendations,
        performanceMetrics: simulationResult.performanceMetrics,
        metadata: options.metadata || {},
      });
      
      console.log(`[PES Orchestrator] Simulation saved with ID: ${simulationId}`);
      
      // Analyze and update performance
      const analysis = await analyzePromptPerformance(promptVersionId);
      
      if (analysis.hasData) {
        await updatePromptPerformance(promptVersionId, {
          simulations_count: analysis.simulationCount,
          average_score: analysis.metrics.averageScore,
          success_rate: analysis.metrics.successRate,
          last_simulation: simulationResult.timestamp,
        });
      }
      
      return {
        simulation: simulationResult,
        analysis,
      };
    }
    
    return {
      simulation: simulationResult,
      analysis: null,
    };
  } catch (error) {
    console.error('[PES Orchestrator] Error running simulation:', error);
    throw error;
  }
}

/**
 * Compare two prompt versions and recommend best
 * @param {string} versionId1 - First prompt version ID
 * @param {string} versionId2 - Second prompt version ID
 * @returns {Promise<Object>} Comparison results and recommendation
 */
export async function compareAndRecommend(versionId1, versionId2) {
  console.log(`[PES Orchestrator] Comparing prompt versions: ${versionId1} vs ${versionId2}`);
  
  try {
    const comparison = await comparePromptVersions(versionId1, versionId2);
    
    return {
      comparison,
      recommendation: comparison.recommendation,
      winner: comparison.winner,
    };
  } catch (error) {
    console.error('[PES Orchestrator] Error comparing prompts:', error);
    throw error;
  }
}

/**
 * Get recommended prompt for a topic
 * @param {string} topic - Topic category (optional)
 * @returns {Promise<Object>} Recommended prompt version
 */
export async function getRecommendedPrompt(topic = null) {
  console.log(`[PES Orchestrator] Getting recommended prompt${topic ? ` for topic: ${topic}` : ''}`);
  
  try {
    const result = await findBestPromptVersion(topic);
    
    if (result.error) {
      // Fallback to default prompt if no data available
      return {
        hasRecommendation: false,
        error: result.error,
        fallback: 'No data-driven recommendation available. Using default prompt.',
      };
    }
    
    return {
      hasRecommendation: true,
      recommended: result.bestVersion,
      metrics: result.metrics,
      alternatives: result.alternatives,
    };
  } catch (error) {
    console.error('[PES Orchestrator] Error getting recommended prompt:', error);
    throw error;
  }
}

/**
 * Run batch simulations for multiple prompt versions
 * @param {Array<string>} promptVersionIds - Array of prompt version IDs
 * @param {Object} options - Simulation options
 * @returns {Promise<Object>} Batch results
 */
export async function runBatchSimulations(promptVersionIds, options = {}) {
  console.log(`[PES Orchestrator] Running batch simulations for ${promptVersionIds.length} prompts`);
  
  const results = [];
  
  for (const versionId of promptVersionIds) {
    try {
      const result = await runSimulationForPrompt(versionId, options);
      results.push({
        promptVersionId: versionId,
        success: true,
        ...result,
      });
    } catch (error) {
      console.error(`[PES Orchestrator] Error in batch simulation for ${versionId}:`, error);
      results.push({
        promptVersionId: versionId,
        success: false,
        error: error.message,
      });
    }
  }
  
  return {
    totalProcessed: promptVersionIds.length,
    successCount: results.filter(r => r.success).length,
    results,
  };
}

/**
 * Generate a performance report for all prompt versions
 * @param {string} topic - Optional topic filter
 * @returns {Promise<Object>} Performance report
 */
export async function generatePerformanceReport(topic = null) {
  console.log(`[PES Orchestrator] Generating performance report${topic ? ` for topic: ${topic}` : ''}`);
  
  try {
    // Get all prompt versions
    const promptVersions = await getPromptVersions({
      topic: topic || undefined,
    });
    
    if (promptVersions.length === 0) {
      return {
        error: 'No prompt versions found',
        topic,
      };
    }
    
    // Analyze each version
    const analyses = [];
    for (const version of promptVersions) {
      try {
        const analysis = await analyzePromptPerformance(version.id);
        analyses.push({
          version: {
            id: version.id,
            version: version.version,
            topic: version.topic,
            status: version.status,
          },
          analysis,
        });
      } catch (error) {
        console.error(`[PES Orchestrator] Error analyzing version ${version.id}:`, error);
      }
    }
    
    // Sort by average score
    const withData = analyses.filter(a => a.analysis.hasData);
    withData.sort((a, b) => 
      b.analysis.metrics.averageScore - a.analysis.metrics.averageScore
    );
    
    return {
      topic,
      totalVersions: promptVersions.length,
      versionsWithData: withData.length,
      topPerformers: withData.slice(0, 5).map(a => ({
        id: a.version.id,
        version: a.version.version,
        averageScore: a.analysis.metrics.averageScore,
        simulationCount: a.analysis.simulationCount,
      })),
      allVersions: analyses,
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[PES Orchestrator] Error generating performance report:', error);
    throw error;
  }
}

export default {
  createAndTestPromptVersion,
  runSimulationForPrompt,
  compareAndRecommend,
  getRecommendedPrompt,
  runBatchSimulations,
  generatePerformanceReport,
};
