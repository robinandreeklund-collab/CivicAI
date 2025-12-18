/**
 * PES Phase 3: Category-Specific Vector Weights
 * 
 * Different debate categories reward different dimensions
 * These weights are used to calculate weighted vector scores
 */

// Category-specific dimension weights
export const CATEGORY_WEIGHTS = {
  ekonomi: {
    syntesförmåga: 0.8,
    originalitet: 0.6,
    konkret_praktisk: 1.0,    // High: practical solutions matter
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.7,
    djup_fakta: 0.9,          // High: data and evidence crucial
    utmanar_premiss: 0.5,     // Low: challenging assumptions less valued
    personlighet_engagemang: 0.6
  },
  filosofi: {
    syntesförmåga: 0.9,
    originalitet: 1.0,        // High: novel insights highly valued
    konkret_praktisk: 0.6,    // Low: abstract thinking preferred
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.8,
    djup_fakta: 0.7,
    utmanar_premiss: 1.0,     // High: questioning assumptions crucial
    personlighet_engagemang: 0.8
  },
  etik: {
    syntesförmåga: 0.9,
    originalitet: 0.9,
    konkret_praktisk: 0.7,
    tydlig_ställning: 0.8,
    balans_neutralitet: 1.0,  // High: fairness and balance critical
    djup_fakta: 0.8,
    utmanar_premiss: 0.9,
    personlighet_engagemang: 0.7
  },
  teknik: {
    syntesförmåga: 0.7,
    originalitet: 0.8,
    konkret_praktisk: 0.9,    // High: practical implementation matters
    tydlig_ställning: 0.7,
    balans_neutralitet: 0.6,
    djup_fakta: 1.0,          // High: technical accuracy crucial
    utmanar_premiss: 0.7,
    personlighet_engagemang: 0.6
  },
  samhälle: {
    syntesförmåga: 0.85,
    originalitet: 0.7,
    konkret_praktisk: 0.8,
    tydlig_ställning: 0.75,
    balans_neutralitet: 0.9,
    djup_fakta: 0.8,
    utmanar_premiss: 0.7,
    personlighet_engagemang: 0.75
  },
  miljö: {
    syntesförmåga: 0.8,
    originalitet: 0.7,
    konkret_praktisk: 0.9,
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.75,
    djup_fakta: 0.95,         // High: scientific data important
    utmanar_premiss: 0.6,
    personlighet_engagemang: 0.7
  },
  säkerhet: {
    syntesförmåga: 0.75,
    originalitet: 0.6,
    konkret_praktisk: 0.9,
    tydlig_ställning: 0.85,
    balans_neutralitet: 0.7,
    djup_fakta: 0.9,
    utmanar_premiss: 0.6,
    personlighet_engagemang: 0.65
  },
  politik: {
    syntesförmåga: 0.85,
    originalitet: 0.7,
    konkret_praktisk: 0.8,
    tydlig_ställning: 0.9,    // High: clear position valued
    balans_neutralitet: 0.8,
    djup_fakta: 0.85,
    utmanar_premiss: 0.75,
    personlighet_engagemang: 0.8
  }
};

// Fallback weights if category unknown
export const DEFAULT_WEIGHTS = {
  syntesförmåga: 0.8,
  originalitet: 0.75,
  konkret_praktisk: 0.8,
  tydlig_ställning: 0.8,
  balans_neutralitet: 0.8,
  djup_fakta: 0.85,
  utmanar_premiss: 0.75,
  personlighet_engagemang: 0.75
};

/**
 * Get weights for a specific category
 * @param {string} category - Main category name
 * @returns {Object} Weights for the category
 */
export function getCategoryWeights(category) {
  if (!category || typeof category !== 'string') {
    return DEFAULT_WEIGHTS;
  }
  
  const normalized = category.toLowerCase();
  return CATEGORY_WEIGHTS[normalized] || DEFAULT_WEIGHTS;
}

/**
 * Get weights for a category key (e.g., "ekonomi-välfärd")
 * Uses main category only for weights
 * @param {string} categoryKey - Category key like "ekonomi-välfärd"
 * @returns {Object} Weights for the main category
 */
export function getWeightsForCategoryKey(categoryKey) {
  if (!categoryKey || typeof categoryKey !== 'string') {
    return DEFAULT_WEIGHTS;
  }
  
  const mainCategory = categoryKey.split('-')[0];
  return getCategoryWeights(mainCategory);
}

/**
 * Validate weights object
 * @param {Object} weights - Weights object to validate
 * @returns {boolean} True if valid
 */
export function validateWeights(weights) {
  if (!weights || typeof weights !== 'object') {
    return false;
  }
  
  const requiredDimensions = Object.keys(DEFAULT_WEIGHTS);
  
  for (const dim of requiredDimensions) {
    if (typeof weights[dim] !== 'number' || weights[dim] < 0 || weights[dim] > 1) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize weights to ensure they are between 0 and 1
 * @param {Object} weights - Weights object
 * @returns {Object} Normalized weights
 */
export function normalizeWeights(weights) {
  const normalized = {};
  
  for (const [dim, value] of Object.entries(weights)) {
    normalized[dim] = Math.max(0, Math.min(1, value));
  }
  
  return normalized;
}

export default {
  CATEGORY_WEIGHTS,
  DEFAULT_WEIGHTS,
  getCategoryWeights,
  getWeightsForCategoryKey,
  validateWeights,
  normalizeWeights
};
