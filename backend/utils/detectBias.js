/**
 * Bias Detection Utility
 * 
 * METHODOLOGY:
 * This module detects potential biases in AI responses using multi-dimensional keyword analysis.
 * It identifies five types of bias: political, commercial, cultural, confirmation, and recency.
 * Each bias type has specific keywords or patterns that, when detected, increase the bias score.
 * 
 * BIAS TYPES DETECTED:
 * 1. Political Bias: Detects left-leaning or right-leaning political language
 * 2. Commercial Bias: Identifies product recommendations or marketing language
 * 3. Cultural Bias: Detects Western vs. non-Western perspectives
 * 4. Confirmation Bias: Identifies statements presented as self-evident truths
 * 5. Recency Bias: Detects over-focus on novelty over relevance
 * 
 * CALCULATION METHOD:
 * - Keywords are counted for each bias category
 * - For directional biases (political, cultural), direction is determined by comparing counts
 * - Threshold: Minimum difference required to trigger directional bias detection
 * - Severity levels: low (score ≤ 1), medium (1 < score ≤ 3), high (score > 3)
 * - Overall bias score: Sum of severity scores across all detected biases (max 10)
 * 
 * STANDOUT DATA INFLUENCERS:
 * - Keyword density: More matches = stronger bias signal
 * - Directional imbalance: Large difference between opposing keywords (e.g., left vs right)
 * - Threshold exceedance: Only biases exceeding thresholds are reported
 * - Severity levels: High-severity biases are sorted first in results
 */

/**
 * Detect potential biases in a text response
 * @param {string} text - The response text to analyze
 * @param {string} question - The original question for context
 * @returns {{overallBias: string, biasScore: number, detectedBiases: Array<{type: string, severity: string, direction?: string, description: string}>}} 
 *   An object containing:
 *     - overallBias: The overall bias level ('minimal' or 'detected')
 *     - biasScore: Numeric score representing the severity of bias (0-10)
 *     - detectedBiases: Array of detected bias objects, each with:
 *         - type: Type of bias (e.g., 'political', 'commercial')
 *         - severity: Severity level ('low', 'medium', 'high')
 *         - direction: Direction of bias (if applicable, e.g., 'left', 'right')
 *         - description: Human-readable description of the detected bias in Swedish
 */
export function detectBias(text, question = '') {
  if (!text || typeof text !== 'string') {
    return {
      overallBias: 'neutral',
      biasScore: 0,
      detectedBiases: [],
    };
  }

  // Bias indicator patterns and keywords
  // Each bias type has specific keywords that signal its presence
  const biasIndicators = {
    // POLITICAL BIAS: Detects ideological leanings
    // Threshold: Difference of 3+ keywords required to assign direction
    political: {
      leftLeaning: ['jämlikhet', 'välfärd', 'solidaritet', 'omfördelning', 'kollektiv'],
      rightLeaning: ['frihet', 'individuell', 'konkurrens', 'marknad', 'privat'],
      score: 0,
      direction: 'neutral',
    },
    // COMMERCIAL BIAS: Detects marketing or product promotion
    // Threshold: 2+ matches required for detection
    commercial: {
      keywords: ['köp', 'produkt', 'tjänst', 'erbjudande', 'brand', 'företag som', 'rekommenderar att köpa'],
      score: 0,
    },
    // CULTURAL BIAS: Detects geographical/cultural perspective bias
    // Threshold: Difference of 2+ keywords required to assign direction
    cultural: {
      western: ['västerländsk', 'europeisk', 'amerikansk', 'väst'],
      nonWestern: ['österländsk', 'asiatisk', 'afrikansk', 'latinamerikansk'],
      score: 0,
      direction: 'neutral',
    },
    // CONFIRMATION BIAS: Detects statements presented as self-evident
    // Threshold: 1+ match required (any occurrence is significant)
    confirmation: {
      keywords: ['uppenbarligen', 'självklart', 'alla vet', 'det är känt att', 'naturligtvis'],
      score: 0,
    },
    // RECENCY BIAS: Detects over-emphasis on novelty
    // Threshold: 3+ matches required (adjusted by -2 to account for normal usage)
    recency: {
      keywords: ['nyligen', 'senaste', 'modern', 'traditionell', 'gammal', 'föråldrad'],
      score: 0,
    },
  };

  const textLower = text.toLowerCase();
  const detectedBiases = [];

  // POLITICAL BIAS DETECTION
  // Compare left-leaning vs right-leaning keyword counts
  // Direction assigned only if one side exceeds the other by 3+ keywords
  let leftCount = 0;
  let rightCount = 0;
  const leftWords = [];
  const rightWords = [];
  
  biasIndicators.political.leftLeaning.forEach(keyword => {
    if (textLower.includes(keyword)) {
      leftCount++;
      leftWords.push(keyword);
    }
  });
  
  biasIndicators.political.rightLeaning.forEach(keyword => {
    if (textLower.includes(keyword)) {
      rightCount++;
      rightWords.push(keyword);
    }
  });

  if (leftCount > rightCount + 2) {
    // Left bias detected: Score = difference between counts
    biasIndicators.political.score = leftCount - rightCount;
    biasIndicators.political.direction = 'left';
    detectedBiases.push({
      type: 'political',
      severity: calculateSeverity(biasIndicators.political.score),
      direction: 'left',
      description: 'Vänsterorienterad politisk bias',
      words: leftWords,
    });
  } else if (rightCount > leftCount + 2) {
    // Right bias detected: Score = difference between counts
    biasIndicators.political.score = rightCount - leftCount;
    biasIndicators.political.direction = 'right';
    detectedBiases.push({
      type: 'political',
      severity: calculateSeverity(biasIndicators.political.score),
      direction: 'right',
      description: 'Högerorienterad politisk bias',
      words: rightWords,
    });
  }

  // COMMERCIAL BIAS DETECTION
  // Count commercial keywords; 2+ matches trigger detection
  const commercialWords = [];
  biasIndicators.commercial.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.commercial.score++;
      commercialWords.push(keyword);
    }
  });

  if (biasIndicators.commercial.score > 1) {
    detectedBiases.push({
      type: 'commercial',
      severity: calculateSeverity(biasIndicators.commercial.score),
      description: 'Kommersiell bias eller produktrekommendationer',
      words: commercialWords,
    });
  }

  // CULTURAL BIAS DETECTION
  // Compare Western vs non-Western keyword counts
  // Direction assigned only if one side exceeds the other by 2+ keywords
  let westernCount = 0;
  let nonWesternCount = 0;
  const westernWords = [];
  const nonWesternWords = [];

  biasIndicators.cultural.western.forEach(keyword => {
    if (textLower.includes(keyword)) {
      westernCount++;
      westernWords.push(keyword);
    }
  });

  biasIndicators.cultural.nonWestern.forEach(keyword => {
    if (textLower.includes(keyword)) {
      nonWesternCount++;
      nonWesternWords.push(keyword);
    }
  });

  if (westernCount > nonWesternCount + 1) {
    biasIndicators.cultural.score = westernCount;
    biasIndicators.cultural.direction = 'western';
    detectedBiases.push({
      type: 'cultural',
      severity: calculateSeverity(biasIndicators.cultural.score),
      direction: 'western',
      description: 'Västerländsk kulturell bias',
      words: westernWords,
    });
  }

  // CONFIRMATION BIAS DETECTION
  // Any occurrence of confirmation keywords is significant
  const confirmationWords = [];
  biasIndicators.confirmation.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.confirmation.score++;
      confirmationWords.push(keyword);
    }
  });

  if (biasIndicators.confirmation.score > 0) {
    detectedBiases.push({
      type: 'confirmation',
      severity: calculateSeverity(biasIndicators.confirmation.score),
      description: 'Bekräftelsebias - presenterar påståenden som självklara',
      words: confirmationWords,
    });
  }

  // RECENCY BIAS DETECTION
  // Count temporal keywords; 3+ matches trigger detection (adjusted -2 for normal usage)
  const recencyWords = [];
  biasIndicators.recency.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.recency.score++;
      recencyWords.push(keyword);
    }
  });

  if (biasIndicators.recency.score > 2) {
    detectedBiases.push({
      type: 'recency',
      severity: calculateSeverity(biasIndicators.recency.score - 2), // Adjust score
      description: 'Recency bias - fokuserar på nyhet över relevans',
      words: recencyWords,
    });
  }

  // CALCULATE OVERALL BIAS SCORE
  // Sum severity scores from all detected biases
  // Maximum score capped at 10
  const totalBiasScore = detectedBiases.reduce((sum, bias) => {
    return sum + severityToScore(bias.severity);
  }, 0);

  return {
    overallBias: totalBiasScore > 2 ? 'detected' : 'minimal',
    biasScore: Math.min(totalBiasScore, 10),
    detectedBiases: detectedBiases.sort((a, b) => 
      severityToScore(b.severity) - severityToScore(a.severity)
    ),
    provenance: {
      model: 'Multi-dimensional Bias Detector',
      version: '1.0.0',
      method: 'Keyword-based bias detection with 5 bias types',
      timestamp: new Date().toISOString(),
      library: 'JavaScript native (no external dependencies)',
    },
  };
}

/**
 * Calculate severity based on score
 * 
 * SEVERITY LEVELS:
 * - low (1 point): Score ≤ 1 - Minor bias, may be acceptable
 * - medium (2 points): 1 < Score ≤ 3 - Moderate bias, should be noted
 * - high (3 points): Score > 3 - Significant bias, affects objectivity
 * 
 * @param {number} score - Raw bias score from keyword counting
 * @returns {string} Severity level ('low', 'medium', or 'high')
 */
function calculateSeverity(score) {
  if (score <= 1) return 'low';
  if (score <= 3) return 'medium';
  return 'high';
}

/**
 * Convert severity to numeric score
 * @param {string} severity - Severity level
 * @returns {number} Numeric score
 */
function severityToScore(severity) {
  const scores = { low: 1, medium: 2, high: 3 };
  return scores[severity] || 0;
}

/**
 * Get bias indicator color
 * @param {string} severity - Severity level
 * @returns {string} Color code
 */
export function getBiasColor(severity) {
  const colors = {
    low: 'yellow',
    medium: 'orange',
    high: 'red',
  };
  return colors[severity] || 'gray';
}
