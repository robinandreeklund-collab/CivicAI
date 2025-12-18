/**
 * PES Simulator
 * 
 * Simulates debates using real debate data from Firebase
 * and ONESEEK model inference via the existing openseek.js service
 */

import { getDebates } from '../services/pesFirebaseService.js';
import { getOpenSeekResponse } from '../../backend/services/openseek.js';
import { PES_CONFIG } from '../config/pesConfig.js';

/**
 * Run a simulation using real debates and a specific prompt version
 * @param {Object} promptVersion - The prompt version to test
 * @param {Object} options - Simulation options
 * @returns {Promise<Object>} Simulation results
 */
export async function runSimulation(promptVersion, options = {}) {
  console.log(`[PES Simulator] Starting simulation for prompt version: ${promptVersion.version}`);
  
  try {
    // Fetch real debates from Firebase
    const debates = await getDebates({
      status: 'completed',
      limit: options.debateCount || PES_CONFIG.simulation.debatesPerSimulation,
    });
    
    if (debates.length === 0) {
      console.warn('[PES Simulator] No debates available for simulation');
      return {
        success: false,
        error: 'No debates available',
        debatesUsed: 0,
      };
    }
    
    console.log(`[PES Simulator] Using ${debates.length} debates for simulation`);
    
    // Filter debates based on configuration
    const validDebates = debates.filter(debate => {
      // Must have minimum rounds
      if (debate.current_round < PES_CONFIG.simulation.minDebateRounds) {
        return false;
      }
      
      // Must be completed if required
      if (PES_CONFIG.simulation.requireCompletedStatus && debate.status !== 'completed') {
        return false;
      }
      
      return true;
    });
    
    console.log(`[PES Simulator] ${validDebates.length} debates passed validation`);
    
    if (validDebates.length === 0) {
      return {
        success: false,
        error: 'No valid debates after filtering',
        debatesUsed: 0,
      };
    }
    
    // Run simulations for each debate
    const simulationResults = [];
    
    for (const debate of validDebates) {
      try {
        const result = await simulateDebateWithPrompt(debate, promptVersion);
        simulationResults.push(result);
      } catch (error) {
        console.error(`[PES Simulator] Error simulating debate ${debate.debate_id}:`, error);
        simulationResults.push({
          debateId: debate.debate_id,
          success: false,
          error: error.message,
        });
      }
    }
    
    // Calculate aggregate metrics
    const metrics = calculateAggregateMetrics(simulationResults);
    
    // Generate recommendations
    const recommendations = generateRecommendations(metrics, promptVersion);
    
    const simulationReport = {
      success: true,
      promptVersion: {
        id: promptVersion.id,
        version: promptVersion.version,
        topic: promptVersion.topic,
      },
      debatesUsed: validDebates.length,
      debateIds: validDebates.map(d => d.debate_id),
      results: simulationResults,
      performanceMetrics: metrics,
      recommendations,
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[PES Simulator] Simulation completed. Average score: ${metrics.averageScore.toFixed(3)}`);
    
    return simulationReport;
  } catch (error) {
    console.error('[PES Simulator] Simulation error:', error);
    throw error;
  }
}

/**
 * Simulate a single debate using ONESEEK with a specific prompt
 * @param {Object} debate - The debate data from Firebase
 * @param {Object} promptVersion - The prompt version to test
 * @returns {Promise<Object>} Simulation result for this debate
 */
async function simulateDebateWithPrompt(debate, promptVersion) {
  console.log(`[PES Simulator] Simulating debate ${debate.debate_id} with prompt ${promptVersion.version}`);
  
  try {
    // Build simulation context from the debate
    const simulationContext = buildSimulationContext(debate);
    
    // Create prompt for ONESEEK using the prompt version
    const prompt = constructPromptForDebate(debate.question, simulationContext, promptVersion);
    
    // Call ONESEEK inference endpoint
    const startTime = Date.now();
    const response = await getOpenSeekResponse(prompt, {
      systemPrompt: promptVersion.prompt_text,
      max_tokens: 1024,
      temperature: 0.7,
      timeout: PES_CONFIG.simulation.inferenceTimeout,
    });
    const inferenceTime = Date.now() - startTime;
    
    if (response.error) {
      throw new Error(`ONESEEK inference error: ${response.error}`);
    }
    
    // Analyze the response quality
    const analysis = analyzeSimulationResponse(response.response, debate);
    
    return {
      debateId: debate.debate_id,
      success: true,
      response: response.response,
      analysis,
      inferenceTime,
      modelUsed: response.model,
    };
  } catch (error) {
    console.error(`[PES Simulator] Error in debate simulation:`, error);
    return {
      debateId: debate.debate_id,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Build simulation context from debate data
 * @param {Object} debate - The debate data
 * @returns {string} Context string
 */
function buildSimulationContext(debate) {
  let context = `Original Question: ${debate.question}\n\n`;
  
  context += `Initial Responses:\n`;
  if (debate.initial_responses) {
    debate.initial_responses.forEach(resp => {
      if (!resp.metadata?.error) {
        context += `- ${resp.agent}: ${resp.response.substring(0, 200)}...\n`;
      }
    });
  }
  
  if (debate.rounds && debate.rounds.length > 0) {
    context += `\nDebate Rounds:\n`;
    debate.rounds.forEach(round => {
      context += `\nRound ${round.roundNumber}:\n`;
      if (round.responses) {
        round.responses.forEach(resp => {
          if (!resp.error) {
            context += `- ${resp.agent}: ${resp.response.substring(0, 150)}...\n`;
          }
        });
      }
    });
  }
  
  return context;
}

/**
 * Construct the prompt for ONESEEK inference
 * @param {string} question - The debate question
 * @param {string} context - The debate context
 * @param {Object} promptVersion - The prompt version
 * @returns {string} Complete prompt
 */
function constructPromptForDebate(question, context, promptVersion) {
  return `${context}

QUESTION: ${question}

Based on the debate context above, provide your analysis and answer to the question.`;
}

/**
 * Analyze simulation response quality
 * @param {string} response - The ONESEEK response
 * @param {Object} debate - The original debate data
 * @returns {Object} Analysis results
 */
function analyzeSimulationResponse(response, debate) {
  const analysis = {
    responseLength: response.length,
    hasStructure: false,
    addressesQuestion: false,
    qualityScore: 0,
  };
  
  // Check if response has structure (paragraphs, formatting)
  const paragraphs = response.split('\n\n').filter(p => p.trim().length > 0);
  analysis.hasStructure = paragraphs.length > 1;
  
  // Check if response addresses the question
  const questionKeywords = extractKeywords(debate.question);
  const responseKeywords = extractKeywords(response.toLowerCase());
  const keywordOverlap = questionKeywords.filter(kw => 
    responseKeywords.some(rw => rw.includes(kw) || kw.includes(rw))
  ).length;
  analysis.addressesQuestion = keywordOverlap > 0;
  
  // Calculate quality score (0-1)
  let score = 0;
  
  // Length factor (optimal range: 200-800 chars)
  if (response.length >= 200 && response.length <= 800) {
    score += 0.3;
  } else if (response.length > 100) {
    score += 0.15;
  }
  
  // Structure factor
  if (analysis.hasStructure) {
    score += 0.3;
  }
  
  // Question relevance factor
  if (analysis.addressesQuestion) {
    score += 0.4;
  }
  
  analysis.qualityScore = Math.min(score, 1.0);
  
  return analysis;
}

/**
 * Extract keywords from text
 * @param {string} text - Input text
 * @returns {Array<string>} Array of keywords
 */
function extractKeywords(text) {
  // Simple keyword extraction - remove common words
  const stopWords = ['är', 'och', 'det', 'att', 'i', 'en', 'på', 'för', 'med', 'av', 'som', 'den', 'till', 'från', 'har', 'om', 'kan', 'när', 'var', 'hur', 'vad', 'vem'];
  
  const words = text.toLowerCase()
    .replace(/[^\wåäöÅÄÖ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.includes(w));
  
  return [...new Set(words)]; // Remove duplicates
}

/**
 * Calculate aggregate metrics from simulation results
 * @param {Array} results - Array of simulation results
 * @returns {Object} Aggregate metrics
 */
function calculateAggregateMetrics(results) {
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      averageScore: 0,
      successRate: 0,
      averageInferenceTime: 0,
      totalDebates: results.length,
      successfulDebates: 0,
    };
  }
  
  const totalScore = successfulResults.reduce((sum, r) => 
    sum + (r.analysis?.qualityScore || 0), 0
  );
  
  const totalInferenceTime = successfulResults.reduce((sum, r) => 
    sum + (r.inferenceTime || 0), 0
  );
  
  return {
    averageScore: totalScore / successfulResults.length,
    successRate: successfulResults.length / results.length,
    averageInferenceTime: totalInferenceTime / successfulResults.length,
    totalDebates: results.length,
    successfulDebates: successfulResults.length,
    averageResponseLength: successfulResults.reduce((sum, r) => 
      sum + (r.response?.length || 0), 0
    ) / successfulResults.length,
  };
}

/**
 * Generate recommendations based on simulation metrics
 * @param {Object} metrics - Performance metrics
 * @param {Object} promptVersion - The tested prompt version
 * @returns {Array<Object>} Array of recommendations
 */
function generateRecommendations(metrics, promptVersion) {
  const recommendations = [];
  
  // Score-based recommendations
  if (metrics.averageScore < PES_CONFIG.metrics.thresholds.goodScore) {
    recommendations.push({
      type: 'performance',
      severity: 'high',
      message: `Average quality score (${metrics.averageScore.toFixed(2)}) is below good threshold (${PES_CONFIG.metrics.thresholds.goodScore})`,
      suggestion: 'Consider revising prompt to improve response quality and relevance',
    });
  } else if (metrics.averageScore >= PES_CONFIG.metrics.thresholds.excellentScore) {
    recommendations.push({
      type: 'performance',
      severity: 'info',
      message: `Excellent average quality score: ${metrics.averageScore.toFixed(2)}`,
      suggestion: 'This prompt version performs well and could be promoted to production',
    });
  }
  
  // Success rate recommendations
  if (metrics.successRate < 0.8) {
    recommendations.push({
      type: 'reliability',
      severity: 'medium',
      message: `Success rate (${(metrics.successRate * 100).toFixed(1)}%) indicates some simulation failures`,
      suggestion: 'Check for timeout issues or prompt complexity',
    });
  }
  
  // Inference time recommendations
  if (metrics.averageInferenceTime > 60000) { // > 1 minute
    recommendations.push({
      type: 'performance',
      severity: 'medium',
      message: `Average inference time (${(metrics.averageInferenceTime / 1000).toFixed(1)}s) is high`,
      suggestion: 'Consider simplifying prompt or reducing max_tokens',
    });
  }
  
  // Data quality recommendations
  if (metrics.totalDebates < PES_CONFIG.analysis.minDataPoints) {
    recommendations.push({
      type: 'data',
      severity: 'info',
      message: `Limited data points (${metrics.totalDebates}) for analysis`,
      suggestion: 'Run more simulations for more reliable metrics',
    });
  }
  
  return recommendations;
}

export default {
  runSimulation,
};
