/**
 * Bias Detection Utility
 * Detects potential biases in AI responses
 */

/**
 * Detect potential biases in a text response
 * @param {string} text - The response text to analyze
 * @param {string} question - The original question for context
 * @returns {{overallBias: string, biasScore: number, detectedBiases: Array<{type: string, severity: string, direction?: string, description: string}>}} 
 *   An object containing:
 *     - overallBias: The overall bias detected ('neutral', 'left', 'right', etc.)
 *     - biasScore: Numeric score representing the severity of bias
 *     - detectedBiases: Array of detected bias objects, each with:
 *         - type: Type of bias (e.g., 'political', 'commercial')
 *         - severity: Severity level ('low', 'medium', 'high')
 *         - direction: Direction of bias (if applicable, e.g., 'left', 'right')
 *         - description: Description of the detected bias
 */
export function detectBias(text, question = '') {
  if (!text || typeof text !== 'string') {
    return {
      overallBias: 'neutral',
      biasScore: 0,
      detectedBiases: [],
    };
  }

  const biasIndicators = {
    political: {
      leftLeaning: ['jämlikhet', 'välfärd', 'solidaritet', 'omfördelning', 'kollektiv'],
      rightLeaning: ['frihet', 'individuell', 'konkurrens', 'marknad', 'privat'],
      score: 0,
      direction: 'neutral',
    },
    commercial: {
      keywords: ['köp', 'produkt', 'tjänst', 'erbjudande', 'brand', 'företag som', 'rekommenderar att köpa'],
      score: 0,
    },
    cultural: {
      western: ['västerländsk', 'europeisk', 'amerikansk', 'väst'],
      nonWestern: ['österländsk', 'asiatisk', 'afrikansk', 'latinamerikansk'],
      score: 0,
      direction: 'neutral',
    },
    confirmation: {
      keywords: ['uppenbarligen', 'självklart', 'alla vet', 'det är känt att', 'naturligtvis'],
      score: 0,
    },
    recency: {
      keywords: ['nyligen', 'senaste', 'modern', 'traditionell', 'gammal', 'föråldrad'],
      score: 0,
    },
  };

  const textLower = text.toLowerCase();
  const detectedBiases = [];

  // Check political bias
  let leftCount = 0;
  let rightCount = 0;
  
  biasIndicators.political.leftLeaning.forEach(keyword => {
    if (textLower.includes(keyword)) leftCount++;
  });
  
  biasIndicators.political.rightLeaning.forEach(keyword => {
    if (textLower.includes(keyword)) rightCount++;
  });

  if (leftCount > rightCount + 2) {
    biasIndicators.political.score = leftCount - rightCount;
    biasIndicators.political.direction = 'left';
    detectedBiases.push({
      type: 'political',
      severity: calculateSeverity(biasIndicators.political.score),
      direction: 'left',
      description: 'Vänsterorienterad politisk bias',
    });
  } else if (rightCount > leftCount + 2) {
    biasIndicators.political.score = rightCount - leftCount;
    biasIndicators.political.direction = 'right';
    detectedBiases.push({
      type: 'political',
      severity: calculateSeverity(biasIndicators.political.score),
      direction: 'right',
      description: 'Högerorienterad politisk bias',
    });
  }

  // Check commercial bias
  biasIndicators.commercial.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.commercial.score++;
    }
  });

  if (biasIndicators.commercial.score > 1) {
    detectedBiases.push({
      type: 'commercial',
      severity: calculateSeverity(biasIndicators.commercial.score),
      description: 'Kommersiell bias eller produktrekommendationer',
    });
  }

  // Check cultural bias
  let westernCount = 0;
  let nonWesternCount = 0;

  biasIndicators.cultural.western.forEach(keyword => {
    if (textLower.includes(keyword)) westernCount++;
  });

  biasIndicators.cultural.nonWestern.forEach(keyword => {
    if (textLower.includes(keyword)) nonWesternCount++;
  });

  if (westernCount > nonWesternCount + 1) {
    biasIndicators.cultural.score = westernCount;
    biasIndicators.cultural.direction = 'western';
    detectedBiases.push({
      type: 'cultural',
      severity: calculateSeverity(biasIndicators.cultural.score),
      direction: 'western',
      description: 'Västerländsk kulturell bias',
    });
  }

  // Check confirmation bias
  biasIndicators.confirmation.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.confirmation.score++;
    }
  });

  if (biasIndicators.confirmation.score > 0) {
    detectedBiases.push({
      type: 'confirmation',
      severity: calculateSeverity(biasIndicators.confirmation.score),
      description: 'Bekräftelsebias - presenterar påståenden som självklara',
    });
  }

  // Check recency bias
  biasIndicators.recency.keywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      biasIndicators.recency.score++;
    }
  });

  if (biasIndicators.recency.score > 2) {
    detectedBiases.push({
      type: 'recency',
      severity: calculateSeverity(biasIndicators.recency.score - 2),
      description: 'Recency bias - fokuserar på nyhet över relevans',
    });
  }

  // Calculate overall bias score
  const totalBiasScore = detectedBiases.reduce((sum, bias) => {
    return sum + severityToScore(bias.severity);
  }, 0);

  return {
    overallBias: totalBiasScore > 2 ? 'detected' : 'minimal',
    biasScore: Math.min(totalBiasScore, 10),
    detectedBiases: detectedBiases.sort((a, b) => 
      severityToScore(b.severity) - severityToScore(a.severity)
    ),
  };
}

/**
 * Calculate severity based on score
 * @param {number} score - Raw bias score
 * @returns {string} Severity level
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
