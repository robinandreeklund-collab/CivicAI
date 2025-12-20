/**
 * PES Phase 3: Calibration Service
 * 
 * Compares simulated vs real voting to calibrate the simulation model
 */

import { DIMENSIONS } from '../services/vectorAnalysisService.js';
import { 
  calculatePredictionError, 
  updateCategoryWeights 
} from './weight-learning.js';

/**
 * Compare simulated votes with real votes
 * @param {Array} simulatedVotes - Votes from simulation
 * @param {Array} realVotes - Votes from real external APIs
 * @param {Object} simulatedVectors - Aggregated vectors from simulation
 * @param {Object} realVectors - Aggregated vectors from real voting
 * @returns {Object} Comparison results
 */
export function compareSimulatedVsReal(simulatedVotes, realVotes, simulatedVectors, realVectors) {
  console.log('[Calibration] Comparing simulated vs real voting...');
  
  // 1. Vote outcome accuracy
  const voteAccuracy = calculateVoteAccuracy(simulatedVotes, realVotes);
  
  // 2. Vector delta per dimension
  const vectorDelta = {};
  for (const dim of DIMENSIONS) {
    const simValue = simulatedVectors[dim] || 0.5;
    const realValue = realVectors[dim] || 0.5;
    vectorDelta[dim] = realValue - simValue;
  }
  
  // 3. Calculate average delta
  const avgDelta = calculateAverageDelta(vectorDelta);
  
  // 4. Overall accuracy score
  const accuracyScore = (
    voteAccuracy * 0.6 +
    (1 - Math.abs(avgDelta)) * 0.4
  );
  
  console.log(`[Calibration] Vote accuracy: ${(voteAccuracy * 100).toFixed(1)}%`);
  console.log(`[Calibration] Vector accuracy: ${((1 - Math.abs(avgDelta)) * 100).toFixed(1)}%`);
  console.log(`[Calibration] Overall accuracy: ${(accuracyScore * 100).toFixed(1)}%`);
  
  return {
    vote_accuracy: voteAccuracy,
    vector_delta: vectorDelta,
    average_delta: avgDelta,
    accuracy_score: accuracyScore,
    needs_calibration: accuracyScore < 0.75,
    comparison_timestamp: new Date().toISOString()
  };
}

/**
 * Calculate vote outcome accuracy
 * @param {Array} simulatedVotes - Simulated votes
 * @param {Array} realVotes - Real votes
 * @returns {number} Accuracy (0-1)
 */
function calculateVoteAccuracy(simulatedVotes, realVotes) {
  if (!simulatedVotes || !realVotes || simulatedVotes.length === 0 || realVotes.length === 0) {
    return 0.5;
  }
  
  // Compare vote outcomes
  const simWinner = determineWinner(simulatedVotes);
  const realWinner = determineWinner(realVotes);
  
  // Check if winners match
  const winnerMatch = simWinner === realWinner ? 1.0 : 0.0;
  
  // Check vote distribution similarity
  const simDistribution = getVoteDistribution(simulatedVotes);
  const realDistribution = getVoteDistribution(realVotes);
  
  const distributionSimilarity = calculateDistributionSimilarity(simDistribution, realDistribution);
  
  // Combined accuracy
  return winnerMatch * 0.6 + distributionSimilarity * 0.4;
}

/**
 * Determine winner from votes
 * @param {Array} votes - Array of vote objects
 * @returns {string} Winner name
 */
function determineWinner(votes) {
  const voteCounts = {};
  
  for (const vote of votes) {
    const votedFor = vote.voted_for || vote.model || 'Unknown';
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
  }
  
  // Find model with most votes
  let winner = 'Unknown';
  let maxVotes = 0;
  
  for (const [model, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = model;
    }
  }
  
  return winner;
}

/**
 * Get vote distribution
 * @param {Array} votes - Array of votes
 * @returns {Object} Vote counts by model
 */
function getVoteDistribution(votes) {
  const distribution = {};
  
  for (const vote of votes) {
    const votedFor = vote.voted_for || vote.model || 'Unknown';
    distribution[votedFor] = (distribution[votedFor] || 0) + 1;
  }
  
  return distribution;
}

/**
 * Calculate similarity between two vote distributions
 * @param {Object} dist1 - First distribution
 * @param {Object} dist2 - Second distribution
 * @returns {number} Similarity (0-1)
 */
function calculateDistributionSimilarity(dist1, dist2) {
  // Get all unique models
  const allModels = new Set([...Object.keys(dist1), ...Object.keys(dist2)]);
  
  if (allModels.size === 0) return 0;
  
  // Calculate total votes
  const total1 = Object.values(dist1).reduce((sum, v) => sum + v, 0);
  const total2 = Object.values(dist2).reduce((sum, v) => sum + v, 0);
  
  if (total1 === 0 || total2 === 0) return 0;
  
  // Compare normalized distributions
  let similarity = 0;
  
  for (const model of allModels) {
    const prop1 = (dist1[model] || 0) / total1;
    const prop2 = (dist2[model] || 0) / total2;
    
    // Inverse of absolute difference (closer to 1 is more similar)
    similarity += 1 - Math.abs(prop1 - prop2);
  }
  
  // Average similarity across all models
  return similarity / allModels.size;
}

/**
 * Calculate average delta across all dimensions
 * @param {Object} vectorDelta - Delta per dimension
 * @returns {number} Average delta
 */
function calculateAverageDelta(vectorDelta) {
  const deltas = Object.values(vectorDelta);
  const sum = deltas.reduce((acc, d) => acc + Math.abs(d), 0);
  return sum / deltas.length;
}

/**
 * Recalibrate simulation weights based on validation delta
 * @param {Object} comparisonResult - Result from compareSimulatedVsReal
 * @param {string} category - Debate category
 * @returns {Promise<Object>} Updated weights
 */
export async function recalibrateSimulationWeights(comparisonResult, category) {
  console.log('[Calibration] Recalibrating simulation weights...');
  
  if (!comparisonResult.needs_calibration) {
    console.log('[Calibration] Weights are well-calibrated, no adjustment needed');
    return null;
  }
  
  // Use weight learning to update category-specific weights
  const validationResults = {
    category: category,
    real_vectors: extractRealVectors(comparisonResult),
    simulated_vectors: extractSimulatedVectors(comparisonResult)
  };
  
  const updatedWeights = await updateCategoryWeights(validationResults);
  
  console.log('[Calibration] Recalibration complete');
  
  return updatedWeights;
}

/**
 * Extract real vectors from comparison (helper)
 * @param {Object} comparison - Comparison result
 * @returns {Object} Real vector values
 */
function extractRealVectors(comparison) {
  const vectors = {};
  
  for (const dim of DIMENSIONS) {
    // Real = simulated + delta
    const delta = comparison.vector_delta[dim] || 0;
    vectors[dim] = 0.5 + delta; // Assuming baseline 0.5
  }
  
  return vectors;
}

/**
 * Extract simulated vectors from comparison (helper)
 * @param {Object} comparison - Comparison result
 * @returns {Object} Simulated vector values
 */
function extractSimulatedVectors(comparison) {
  const vectors = {};
  
  for (const dim of DIMENSIONS) {
    vectors[dim] = 0.5; // Baseline assumption
  }
  
  return vectors;
}

/**
 * Generate calibration report
 * @param {Object} comparisonResult - Comparison result
 * @param {Object} updatedWeights - Updated weights (if any)
 * @returns {Object} Calibration report
 */
export function generateCalibrationReport(comparisonResult, updatedWeights) {
  const report = {
    summary: {
      overall_accuracy: comparisonResult.accuracy_score,
      vote_accuracy: comparisonResult.vote_accuracy,
      vector_accuracy: 1 - Math.abs(comparisonResult.average_delta),
      needs_calibration: comparisonResult.needs_calibration,
      calibration_applied: !!updatedWeights
    },
    dimension_deltas: comparisonResult.vector_delta,
    recommendations: []
  };
  
  // Add recommendations based on deltas
  for (const [dim, delta] of Object.entries(comparisonResult.vector_delta)) {
    if (Math.abs(delta) > 0.15) {
      report.recommendations.push({
        dimension: dim,
        issue: delta > 0 ? 'under-predicted' : 'over-predicted',
        magnitude: Math.abs(delta).toFixed(2),
        suggestion: delta > 0 ? 
          `Increase weight for ${dim} to better capture importance` :
          `Decrease weight for ${dim} to avoid over-emphasis`
      });
    }
  }
  
  if (report.recommendations.length === 0) {
    report.recommendations.push({
      dimension: 'all',
      issue: 'none',
      suggestion: 'Weights are well-calibrated'
    });
  }
  
  if (updatedWeights) {
    report.updated_weights = updatedWeights.weights;
    report.weight_update_timestamp = updatedWeights.updated_at;
  }
  
  return report;
}

/**
 * Track calibration history
 * @param {string} evolutionId - Evolution ID
 * @param {Object} calibrationReport - Calibration report
 * @returns {Object} Calibration history entry
 */
export function createCalibrationHistoryEntry(evolutionId, calibrationReport) {
  return {
    evolution_id: evolutionId,
    timestamp: new Date().toISOString(),
    accuracy_score: calibrationReport.summary.overall_accuracy,
    vote_accuracy: calibrationReport.summary.vote_accuracy,
    vector_accuracy: calibrationReport.summary.vector_accuracy,
    calibration_applied: calibrationReport.summary.calibration_applied,
    dimension_deltas: calibrationReport.dimension_deltas,
    recommendations_count: calibrationReport.recommendations.length
  };
}

export default {
  compareSimulatedVsReal,
  recalibrateSimulationWeights,
  generateCalibrationReport,
  createCalibrationHistoryEntry
};
