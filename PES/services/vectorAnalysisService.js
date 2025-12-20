/**
 * PES Phase 3: Vector Analysis Service
 * 
 * Analyzes voting motivations across 8 key dimensions to understand
 * WHY prompts win or lose. Uses ONESEEK for analysis.
 */

import { generateWithOneseek } from './oneseekService.js';

// The 8 dimensions for vector analysis
export const DIMENSIONS = [
  'syntesförmåga',
  'originalitet',
  'konkret_praktisk',
  'tydlig_ställning',
  'balans_neutralitet',
  'djup_fakta',
  'utmanar_premiss',
  'personlighet_engagemang'
];

/**
 * Analyze a vote motivation and extract 8-dimension vector
 * @param {string} motivation - The vote motivation text to analyze
 * @returns {Promise<Object>} Vector with 8 dimensions (0.0-1.0 each)
 */
export async function analyzeMotivationVectors(motivation) {
  if (!motivation || typeof motivation !== 'string') {
    console.warn('[Vector Analysis] Invalid motivation, returning default vector');
    return getDefaultVector();
  }

  const analysisPrompt = `
Analysera följande röstmotivering och ge vikter (0.0–1.0) för varje dimension:

MOTIVERING:
${motivation}

DIMENSIONER:
1. syntesförmåga - förmåga att syntetisera olika perspektiv
2. originalitet - unika insikter och kreativt tänkande
3. konkret_praktisk - praktiska förslag och genomförbarhet
4. tydlig_ställning - tydlig position och övertygande argumentation
5. balans_neutralitet - rättvis hänsyn till olika synvinklar
6. djup_fakta - grundlig research och faktabasering
7. utmanar_premiss - ifrågasätter antaganden och ramfrågor
8. personlighet_engagemang - stil, retorik och emotionellt engagemang

Svara ENDAST med JSON (ingen annan text):
{
  "syntesförmåga": 0.0-1.0,
  "originalitet": 0.0-1.0,
  "konkret_praktisk": 0.0-1.0,
  "tydlig_ställning": 0.0-1.0,
  "balans_neutralitet": 0.0-1.0,
  "djup_fakta": 0.0-1.0,
  "utmanar_premiss": 0.0-1.0,
  "personlighet_engagemang": 0.0-1.0
}
`;

  try {
    const response = await generateWithOneseek(analysisPrompt, {
      temperature: 0.3,
      max_tokens: 300,
      skip_sources: true,
      skip_context_enrichment: true
    });

    // Extract JSON from response
    const jsonMatch = response.response.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      console.warn('[Vector Analysis] No JSON found in ONESEEK response');
      return getDefaultVector();
    }

    const vector = JSON.parse(jsonMatch[0]);

    // Validate and normalize
    const normalizedVector = normalizeVector(vector);
    
    console.log('[Vector Analysis] Successfully extracted vector:', normalizedVector);
    return normalizedVector;

  } catch (error) {
    console.error('[Vector Analysis] Error analyzing motivation:', error.message);
    return getDefaultVector();
  }
}

/**
 * Normalize vector to ensure all dimensions are present and valid
 * @param {Object} vector - Raw vector from ONESEEK
 * @returns {Object} Normalized vector
 */
function normalizeVector(vector) {
  const normalized = {};
  
  for (const dim of DIMENSIONS) {
    let value = vector[dim] || 0.5;
    
    // Ensure value is a number between 0 and 1
    if (typeof value !== 'number' || isNaN(value)) {
      value = 0.5;
    }
    
    value = Math.max(0.0, Math.min(1.0, value));
    normalized[dim] = value;
  }
  
  return normalized;
}

/**
 * Get default vector (all dimensions at 0.5)
 * @returns {Object} Default vector
 */
function getDefaultVector() {
  const vector = {};
  for (const dim of DIMENSIONS) {
    vector[dim] = 0.5;
  }
  return vector;
}

/**
 * Calculate average vector from multiple vectors
 * @param {Array<Object>} vectors - Array of vector objects
 * @returns {Object} Average vector
 */
export function calculateAverageVector(vectors) {
  if (!vectors || vectors.length === 0) {
    return getDefaultVector();
  }

  const avg = {};
  
  for (const dim of DIMENSIONS) {
    const values = vectors.map(v => v[dim] || 0.5);
    avg[dim] = values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  
  return avg;
}

/**
 * Calculate variance in vectors (consistency metric)
 * @param {Array<Object>} vectors - Array of vector objects
 * @returns {number} Average variance across all dimensions
 */
export function calculateVectorVariance(vectors) {
  if (!vectors || vectors.length < 2) {
    return 0;
  }

  const variances = [];
  
  for (const dim of DIMENSIONS) {
    const values = vectors.map(v => v[dim] || 0.5);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    variances.push(variance);
  }
  
  // Return average variance across all dimensions
  return variances.reduce((sum, v) => sum + v, 0) / variances.length;
}

/**
 * Calculate consistency score from variance (0 = inconsistent, 1 = very consistent)
 * @param {Array<Object>} vectors - Array of vector objects
 * @returns {number} Consistency score (0-1)
 */
export function calculateConsistencyScore(vectors) {
  const variance = calculateVectorVariance(vectors);
  // Convert variance to consistency (lower variance = higher consistency)
  // Variance typically 0-0.25, so we normalize
  return Math.max(0, 1 - (variance * 4));
}

/**
 * Calculate weighted vector score using dimension weights
 * @param {Object} vector - Vector object with 8 dimensions
 * @param {Object} weights - Weight object with 8 dimensions
 * @returns {number} Weighted score (0-1)
 */
export function calculateWeightedVectorScore(vector, weights) {
  if (!vector || !weights) {
    return 0.5;
  }

  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const dim of DIMENSIONS) {
    const value = vector[dim] || 0.5;
    const weight = weights[dim] || 0.8;
    
    weightedSum += value * weight;
    totalWeight += weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

/**
 * Identify strongest and weakest dimensions in a vector
 * @param {Object} vector - Vector object
 * @returns {Object} Object with strongest and weakest dimensions
 */
export function identifyVectorInsights(vector) {
  const entries = DIMENSIONS.map(dim => ({
    dimension: dim,
    value: vector[dim] || 0.5
  }));

  // Sort by value
  entries.sort((a, b) => b.value - a.value);

  return {
    strongest_dimensions: entries.slice(0, 2).map(e => e.dimension),
    weakest_dimensions: entries.slice(-2).map(e => e.dimension),
    improvement_targets: entries.slice(-2).map(e => e.dimension)
  };
}

/**
 * Aggregate vector metrics per variant from simulation results
 * @param {Array} simulationResults - Array of simulation results
 * @returns {Object} Vector metrics by variant ID
 */
export function aggregateVectorMetrics(simulationResults) {
  const variantVectors = {};
  
  for (const result of simulationResults) {
    if (!result.voting || !result.voting.votes) continue;
    
    for (const vote of result.voting.votes) {
      if (!vote.vector_analysis) continue;
      
      const votedFor = vote.voted_for;
      
      if (!variantVectors[votedFor]) {
        variantVectors[votedFor] = [];
      }
      
      variantVectors[votedFor].push(vote.vector_analysis);
    }
  }
  
  // Calculate metrics for each variant
  const metrics = {};
  
  for (const [variant_id, vectors] of Object.entries(variantVectors)) {
    metrics[variant_id] = {
      variant_id,
      avg_vector: calculateAverageVector(vectors),
      variance: calculateVectorVariance(vectors),
      consistency_score: calculateConsistencyScore(vectors),
      vote_count: vectors.length,
      insights: identifyVectorInsights(calculateAverageVector(vectors))
    };
  }
  
  return metrics;
}
