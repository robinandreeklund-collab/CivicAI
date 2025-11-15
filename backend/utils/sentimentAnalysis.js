/**
 * Sentiment Analysis Module
 * 
 * METHODOLOGY:
 * This module provides comprehensive sentiment analysis using VADER-like approach
 * combined with detection of sarcasm, aggression, and empathy.
 * 
 * ANALYSIS COMPONENTS:
 * 1. VADER Sentiment: Positive, negative, neutral, compound scores
 * 2. Sarcasm Detection: Identify sarcastic or ironic statements
 * 3. Aggression Detection: Identify aggressive or hostile language
 * 4. Empathy Detection: Identify empathetic and compassionate language
 * 
 * MODELS USED:
 * - Natural library's sentiment analyzer (VADER-like)
 * - Custom lexicons for sarcasm, aggression, empathy
 * 
 * OUTPUT:
 * - VADER scores (positive, negative, neutral, compound)
 * - Sarcasm indicators and score
 * - Aggression indicators and score
 * - Empathy indicators and score
 * - Overall sentiment classification
 */

import Sentiment from 'sentiment';

const sentiment = new Sentiment();

/**
 * Perform VADER-like sentiment analysis
 * @param {string} text - The text to analyze
 * @returns {Object} VADER sentiment scores
 */
export function analyzeVADERSentiment(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0,
      comparative: 0,
      positive: [],
      negative: [],
      classification: 'neutral',
      provenance: {
        model: 'Sentiment (VADER-like)',
        version: '5.0.2',
        method: 'VADER lexicon-based sentiment analysis',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const result = sentiment.analyze(text);

  // Calculate normalized scores similar to VADER
  const wordCount = text.split(/\s+/).length;
  const positive = result.positive.length;
  const negative = result.negative.length;
  const total = positive + negative;

  // Classify sentiment based on compound score
  let classification = 'neutral';
  if (result.comparative >= 0.05) {
    classification = 'positive';
  } else if (result.comparative <= -0.05) {
    classification = 'negative';
  }

  // Intensity levels
  let intensity = 'low';
  const absComparative = Math.abs(result.comparative);
  if (absComparative >= 0.5) {
    intensity = 'high';
  } else if (absComparative >= 0.2) {
    intensity = 'medium';
  }

  return {
    score: result.score,
    comparative: result.comparative, // Normalized score (-1 to 1)
    positive: result.positive,
    negative: result.negative,
    positiveScore: total > 0 ? positive / total : 0,
    negativeScore: total > 0 ? negative / total : 0,
    neutralScore: wordCount > 0 ? Math.max(0, 1 - (total / wordCount)) : 1,
    classification,
    intensity,
    provenance: {
      model: 'Sentiment (VADER-like)',
      version: '5.0.2',
      method: 'VADER lexicon-based sentiment analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Detect sarcasm in text
 * @param {string} text - The text to analyze
 * @returns {Object} Sarcasm detection result
 */
export function detectSarcasm(text) {
  if (!text || typeof text !== 'string') {
    return {
      isSarcastic: false,
      sarcasticIndicators: [],
      score: 0,
      confidence: 0,
      provenance: {
        model: 'Sarcasm Detector',
        version: '1.0.0',
        method: 'Pattern-based sarcasm detection',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const sarcasticIndicators = [];
  const textLower = text.toLowerCase();

  // Sarcasm patterns
  const sarcasticPatterns = [
    // Obvious exaggeration
    { pattern: /jättebra|fantastiskt|underbart.*verkligen/gi, type: 'exaggeration', weight: 2 },
    { pattern: /självklart|naturligtvis.*inte/gi, type: 'irony', weight: 3 },
    // Quotation marks indicating irony
    { pattern: /"[^"]*"/g, type: 'ironic_quotes', weight: 1 },
    // Contradictory statements
    { pattern: /visst.*men|jo.*fast|ja.*dock/gi, type: 'contradiction', weight: 2 },
    // Rhetorical questions
    { pattern: /verkligen\?|inte sant\?|hur oväntat/gi, type: 'rhetorical', weight: 2 },
    // Over-politeness
    { pattern: /så otroligt|fantastiskt|absolut briljant/gi, type: 'over_politeness', weight: 2 },
  ];

  let score = 0;

  sarcasticPatterns.forEach(({ pattern, type, weight }) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        sarcasticIndicators.push({
          type,
          match,
          weight,
        });
        score += weight;
      });
    }
  });

  // Check for sentiment mismatch (negative sentiment with positive words)
  const sentimentResult = sentiment.analyze(text);
  if (sentimentResult.score < -2 && sentimentResult.positive.length > 0) {
    sarcasticIndicators.push({
      type: 'sentiment_mismatch',
      match: 'Negative tone with positive words',
      weight: 2,
    });
    score += 2;
  }

  const isSarcastic = score >= 3;
  const confidence = Math.min(score / 10, 1); // Normalize to 0-1

  return {
    isSarcastic,
    sarcasticIndicators,
    score,
    confidence: Math.round(confidence * 100) / 100,
    provenance: {
      model: 'Sarcasm Detector',
      version: '1.0.0',
      method: 'Pattern-based sarcasm detection with sentiment mismatch analysis',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Detect aggression in text
 * @param {string} text - The text to analyze
 * @returns {Object} Aggression detection result
 */
export function detectAggression(text) {
  if (!text || typeof text !== 'string') {
    return {
      isAggressive: false,
      aggressiveIndicators: [],
      score: 0,
      level: 'none',
      provenance: {
        model: 'Aggression Detector',
        version: '1.0.0',
        method: 'Lexicon-based aggression detection',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const aggressiveIndicators = [];
  const textLower = text.toLowerCase();

  // Aggression lexicon
  const aggressionPatterns = [
    // Hostile language
    { keywords: ['idiot', 'dum', 'korkad', 'tjock i huvudet', 'cp'], type: 'insult', severity: 'high' },
    // Threats
    { keywords: ['hot', 'ska få', 'kommer att ångra', 'ska se till'], type: 'threat', severity: 'high' },
    // Anger expressions
    { keywords: ['arg', 'förbannad', 'rasande', 'ilsken', 'frustrerad'], type: 'anger', severity: 'medium' },
    // Demanding language
    { keywords: ['måste', 'ska', 'kräver', 'beordrar', 'förbjuder'], type: 'demanding', severity: 'low' },
    // Confrontational
    { keywords: ['fel', 'har inte en aning', 'begriper inte', 'fattar ingenting'], type: 'confrontational', severity: 'medium' },
    // Excessive capitalization (shouting)
    { keywords: [], type: 'shouting', severity: 'medium' }, // Will be checked separately
  ];

  let score = 0;

  // Check keyword patterns
  aggressionPatterns.forEach(({ keywords, type, severity }) => {
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        const weight = severity === 'high' ? 3 : severity === 'medium' ? 2 : 1;
        aggressiveIndicators.push({
          type,
          keyword,
          severity,
          weight,
        });
        score += weight;
      }
    });
  });

  // Check for excessive capitalization (shouting)
  const capsWords = text.match(/\b[A-ZÅÄÖ]{3,}\b/g);
  if (capsWords && capsWords.length > 2) {
    aggressiveIndicators.push({
      type: 'shouting',
      keyword: `${capsWords.length} ord i versaler`,
      severity: 'medium',
      weight: 2,
    });
    score += 2;
  }

  // Check for excessive exclamation marks
  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 2) {
    aggressiveIndicators.push({
      type: 'excessive_emphasis',
      keyword: `${exclamations} utropstecken`,
      severity: 'low',
      weight: 1,
    });
    score += 1;
  }

  // Determine aggression level
  let level = 'none';
  if (score >= 6) {
    level = 'high';
  } else if (score >= 3) {
    level = 'medium';
  } else if (score >= 1) {
    level = 'low';
  }

  const isAggressive = score >= 2;

  return {
    isAggressive,
    aggressiveIndicators,
    score,
    level,
    provenance: {
      model: 'Aggression Detector',
      version: '1.0.0',
      method: 'Lexicon-based aggression detection with severity weighting',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Detect empathy in text
 * @param {string} text - The text to analyze
 * @returns {Object} Empathy detection result
 */
export function detectEmpathy(text) {
  if (!text || typeof text !== 'string') {
    return {
      isEmpathetic: false,
      empatheticIndicators: [],
      score: 0,
      level: 'none',
      provenance: {
        model: 'Empathy Detector',
        version: '1.0.0',
        method: 'Lexicon-based empathy detection',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const empatheticIndicators = [];
  const textLower = text.toLowerCase();

  // Empathy lexicon
  const empathyPatterns = [
    // Understanding
    { keywords: ['förstår', 'begriper', 'kan se', 'ser hur', 'inser'], type: 'understanding', weight: 2 },
    // Compassion
    { keywords: ['ledsen att höra', 'tråkigt', 'synd', 'beklaglig', 'förstår att det är svårt'], type: 'compassion', weight: 3 },
    // Support
    { keywords: ['hjälpa', 'stötta', 'finns här', 'kan göra', 'låt mig'], type: 'support', weight: 2 },
    // Validation
    { keywords: ['det är okej', 'helt förståeligt', 'naturligt', 'normalt att känna'], type: 'validation', weight: 2 },
    // Active listening
    { keywords: ['lyssnar', 'hör dig', 'berätta mer', 'hur känns', 'vad tänker du'], type: 'active_listening', weight: 2 },
    // Kindness
    { keywords: ['omtanke', 'omsorg', 'vänlighet', 'respekt', 'hänsyn'], type: 'kindness', weight: 1 },
  ];

  let score = 0;

  empathyPatterns.forEach(({ keywords, type, weight }) => {
    keywords.forEach(keyword => {
      if (textLower.includes(keyword)) {
        empatheticIndicators.push({
          type,
          keyword,
          weight,
        });
        score += weight;
      }
    });
  });

  // Check for questions (showing interest)
  const questions = (text.match(/\?/g) || []).length;
  if (questions > 0) {
    empatheticIndicators.push({
      type: 'asking_questions',
      keyword: `${questions} frågor`,
      weight: 1,
    });
    score += Math.min(questions, 3); // Cap at 3 points for questions
  }

  // Determine empathy level
  let level = 'none';
  if (score >= 8) {
    level = 'high';
  } else if (score >= 4) {
    level = 'medium';
  } else if (score >= 2) {
    level = 'low';
  }

  const isEmpathetic = score >= 3;

  return {
    isEmpathetic,
    empatheticIndicators,
    score,
    level,
    provenance: {
      model: 'Empathy Detector',
      version: '1.0.0',
      method: 'Lexicon-based empathy detection with pattern matching',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Perform complete sentiment analysis including VADER, sarcasm, aggression, and empathy
 * @param {string} text - The text to analyze
 * @returns {Object} Complete sentiment analysis result
 */
export function performCompleteSentimentAnalysis(text) {
  const startTime = Date.now();

  const vaderSentiment = analyzeVADERSentiment(text);
  const sarcasmDetection = detectSarcasm(text);
  const aggressionDetection = detectAggression(text);
  const empathyDetection = detectEmpathy(text);

  const endTime = Date.now();

  // Generate overall tone assessment
  let overallTone = vaderSentiment.classification;
  
  if (sarcasmDetection.isSarcastic) {
    overallTone = 'sarcastic';
  } else if (aggressionDetection.isAggressive) {
    overallTone = 'aggressive';
  } else if (empathyDetection.isEmpathetic) {
    overallTone = 'empathetic';
  }

  return {
    vaderSentiment,
    sarcasmDetection,
    aggressionDetection,
    empathyDetection,
    overallTone,
    metadata: {
      processingTimeMs: endTime - startTime,
      textLength: text.length,
      processedAt: new Date().toISOString(),
    },
  };
}
