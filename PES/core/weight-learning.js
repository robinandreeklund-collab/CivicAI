/**
 * PES Phase 3: Weight Learning
 * 
 * Learns and adapts category-specific weights based on real validation results
 */

import { CATEGORY_WEIGHTS, normalizeWeights } from '../config/category-weights.js';
import { DIMENSIONS } from '../services/vectorAnalysisService.js';

/**
 * Update category weights based on validation results
 * @param {Object} validationResults - Results from real voting validation
 * @returns {Object} Updated weights
 */
export async function updateCategoryWeights(validationResults) {
  const { category, real_vectors, simulated_vectors } = validationResults;
  
  if (!category || !real_vectors || !simulated_vectors) {
    console.warn('[Weight Learning] Invalid validation results, skipping update');
    return null;
  }

  const currentWeights = { ...CATEGORY_WEIGHTS[category] };
  
  if (!currentWeights) {
    console.warn(`[Weight Learning] Unknown category: ${category}`);
    return null;
  }

  console.log(`[Weight Learning] Updating weights for category: ${category}`);
  
  // For each dimension, adjust weight based on prediction accuracy
  for (const dim of DIMENSIONS) {
    const predicted = simulated_vectors[dim] || 0.5;
    const actual = real_vectors[dim] || 0.5;
    const error = actual - predicted;
    
    // Learning rate: 10% adjustment
    const learningRate = 0.1;
    
    // If we under-predicted importance, increase weight
    // If over-predicted, decrease weight
    currentWeights[dim] += error * learningRate;
    
    // Clamp to [0.5, 1.0] to ensure weights stay reasonable
    currentWeights[dim] = Math.max(0.5, Math.min(1.0, currentWeights[dim]));
  }
  
  // Normalize weights
  const normalizedWeights = normalizeWeights(currentWeights);
  
  console.log(`[Weight Learning] Updated ${category} weights:`, normalizedWeights);
  
  return {
    category: category,
    weights: normalizedWeights,
    updated_at: new Date().toISOString(),
    learning_rate: 0.1
  };
}

/**
 * Calculate prediction error between simulated and real vectors
 * @param {Object} simulatedVectors - Simulated vector values
 * @param {Object} realVectors - Real vector values
 * @returns {Object} Error metrics per dimension
 */
export function calculatePredictionError(simulatedVectors, realVectors) {
  const errors = {};
  let totalAbsoluteError = 0;
  
  for (const dim of DIMENSIONS) {
    const predicted = simulatedVectors[dim] || 0.5;
    const actual = realVectors[dim] || 0.5;
    const error = actual - predicted;
    const absoluteError = Math.abs(error);
    
    errors[dim] = {
      predicted: predicted,
      actual: actual,
      error: error,
      absolute_error: absoluteError,
      percentage_error: predicted > 0 ? (absoluteError / predicted * 100) : 0
    };
    
    totalAbsoluteError += absoluteError;
  }
  
  const meanAbsoluteError = totalAbsoluteError / DIMENSIONS.length;
  const accuracy = Math.max(0, 1 - meanAbsoluteError);
  
  return {
    errors_by_dimension: errors,
    mean_absolute_error: meanAbsoluteError,
    accuracy: accuracy,
    needs_calibration: accuracy < 0.75
  };
}

/**
 * Generate weight adjustment recommendations
 * @param {Object} errorMetrics - Error metrics from calculatePredictionError
 * @returns {Array} Array of recommendations
 */
export function generateWeightRecommendations(errorMetrics) {
  const recommendations = [];
  
  for (const [dim, error] of Object.entries(errorMetrics.errors_by_dimension)) {
    if (Math.abs(error.error) > 0.15) {
      // Significant error in this dimension
      if (error.error > 0) {
        recommendations.push({
          dimension: dim,
          action: 'increase_weight',
          reason: `Under-predicted importance (predicted: ${error.predicted.toFixed(2)}, actual: ${error.actual.toFixed(2)})`,
          adjustment: `+${(error.error * 0.1).toFixed(2)}`
        });
      } else {
        recommendations.push({
          dimension: dim,
          action: 'decrease_weight',
          reason: `Over-predicted importance (predicted: ${error.predicted.toFixed(2)}, actual: ${error.actual.toFixed(2)})`,
          adjustment: `${(error.error * 0.1).toFixed(2)}`
        });
      }
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      dimension: 'all',
      action: 'maintain',
      reason: 'Weights are well-calibrated',
      adjustment: 'none'
    });
  }
  
  return recommendations;
}

/**
 * Apply weight adjustments with safety checks
 * @param {Object} currentWeights - Current weight values
 * @param {Array} recommendations - Weight adjustment recommendations
 * @returns {Object} Adjusted weights
 */
export function applyWeightAdjustments(currentWeights, recommendations) {
  const adjustedWeights = { ...currentWeights };
  
  for (const rec of recommendations) {
    if (rec.action === 'maintain') continue;
    
    const dim = rec.dimension;
    const adjustment = parseFloat(rec.adjustment);
    
    if (!adjustedWeights[dim] || isNaN(adjustment)) continue;
    
    // Apply adjustment
    adjustedWeights[dim] += adjustment;
    
    // Safety: clamp to reasonable range [0.5, 1.0]
    adjustedWeights[dim] = Math.max(0.5, Math.min(1.0, adjustedWeights[dim]));
  }
  
  return normalizeWeights(adjustedWeights);
}

/**
 * Track weight evolution over time
 * @param {string} category - Category name
 * @param {Object} weights - Current weights
 * @param {Object} validationMetrics - Validation metrics
 * @returns {Object} Weight history entry
 */
export function createWeightHistoryEntry(category, weights, validationMetrics) {
  return {
    category: category,
    weights: weights,
    timestamp: new Date().toISOString(),
    accuracy: validationMetrics.accuracy,
    mean_absolute_error: validationMetrics.mean_absolute_error,
    validation_count: (validationMetrics.validation_count || 0) + 1
  };
}

/**
 * Calculate confidence in current weights based on validation history
 * @param {Array} weightHistory - Array of weight history entries
 * @returns {number} Confidence score (0-1)
 */
export function calculateWeightConfidence(weightHistory) {
  if (!weightHistory || weightHistory.length === 0) {
    return 0.5; // Neutral confidence for untested weights
  }
  
  if (weightHistory.length < 3) {
    return 0.6; // Low confidence with few validations
  }
  
  // Calculate average accuracy from recent validations
  const recentValidations = weightHistory.slice(-5); // Last 5
  const avgAccuracy = recentValidations.reduce((sum, h) => sum + h.accuracy, 0) / recentValidations.length;
  
  // Confidence increases with more validations and higher accuracy
  const validationFactor = Math.min(weightHistory.length / 10, 1); // Max at 10 validations
  const confidence = avgAccuracy * 0.7 + validationFactor * 0.3;
  
  return Math.min(confidence, 1.0);
}

export default {
  updateCategoryWeights,
  calculatePredictionError,
  generateWeightRecommendations,
  applyWeightAdjustments,
  createWeightHistoryEntry,
  calculateWeightConfidence
};
