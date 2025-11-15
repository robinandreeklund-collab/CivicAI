/**
 * Text Preprocessing Module
 * 
 * METHODOLOGY:
 * This module provides text preprocessing capabilities for the analysis pipeline.
 * It performs tokenization, POS-tagging, subjectivity filtering, and noise reduction.
 * 
 * PROCESSING STEPS:
 * 1. Tokenization: Break text into sentences and words
 * 2. POS-tagging: Tag each word with its part of speech
 * 3. Subjectivity filtering: Identify and filter subjective expressions
 * 4. Noise reduction: Remove filler words and non-informative content
 * 
 * MODELS USED:
 * - compromise.js for NLP processing
 * - Custom lexicons for subjectivity detection
 * 
 * OUTPUT:
 * - Tokens with POS tags
 * - Filtered sentences (objective vs subjective)
 * - Loaded expressions (emotionally charged phrases)
 * - Noise indicators
 */

import nlp from 'compromise';

/**
 * Tokenize text into sentences and words with POS tags
 * @param {string} text - The text to tokenize
 * @returns {Object} Tokenization result with sentences and word-level tokens
 */
export function tokenizeText(text) {
  if (!text || typeof text !== 'string') {
    return {
      sentences: [],
      words: [],
      wordCount: 0,
      sentenceCount: 0,
      provenance: {
        model: 'compromise.js Tokenizer',
        version: '14.11.0',
        method: 'NLP-based tokenization',
        timestamp: new Date().toISOString(),
      },
    };
  }

  const doc = nlp(text);
  
  // Extract sentences
  const sentences = doc.sentences().out('array');
  
  // Extract words with POS tags
  const words = [];
  doc.terms().forEach(term => {
    const termData = term.json()[0];
    if (termData) {
      words.push({
        text: termData.text,
        normal: termData.normal,
        tags: termData.tags || [],
        pos: getPrimaryPOS(termData.tags),
      });
    }
  });

  return {
    sentences: sentences,
    words: words,
    wordCount: words.length,
    sentenceCount: sentences.length,
    provenance: {
      model: 'compromise.js Tokenizer',
      version: '14.11.0',
      method: 'NLP-based tokenization with POS tagging',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Get primary POS tag from term tags
 * @param {Array} tags - Array of tags from compromise
 * @returns {string} Primary POS tag
 */
function getPrimaryPOS(tags) {
  if (!tags || tags.length === 0) return 'UNKNOWN';
  
  const posMap = {
    'Noun': 'NOUN',
    'Verb': 'VERB',
    'Adjective': 'ADJ',
    'Adverb': 'ADV',
    'Pronoun': 'PRON',
    'Determiner': 'DET',
    'Preposition': 'ADP',
    'Conjunction': 'CONJ',
    'Number': 'NUM',
    'Punctuation': 'PUNCT',
  };

  for (const tag of tags) {
    if (posMap[tag]) {
      return posMap[tag];
    }
  }

  return tags[0] || 'UNKNOWN';
}

/**
 * Filter text by subjectivity to identify objective vs subjective content
 * @param {string} text - The text to analyze
 * @returns {Object} Subjectivity analysis result
 */
export function filterBySubjectivity(text) {
  if (!text || typeof text !== 'string') {
    return {
      objectiveSentences: [],
      subjectiveSentences: [],
      subjectivityScore: 0,
      provenance: {
        model: 'Custom Subjectivity Filter',
        version: '1.0.0',
        method: 'Lexicon-based subjectivity detection',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Subjective indicators (opinions, feelings, judgments)
  const subjectiveIndicators = [
    'tycker', 'tror', 'anser', 'känner', 'verkar', 'kanske', 'troligen',
    'borde', 'bör', 'skulle', 'personligen', 'enligt mig', 'i min mening',
    'fantastisk', 'hemsk', 'underbar', 'fruktansvärd', 'bra', 'dålig',
    'bättre', 'sämre', 'bäst', 'värst', 'älskar', 'hatar', 'föredrar',
    'önskar', 'hoppas', 'befarar', 'tvivlar', 'misstänker',
  ];

  // Objective indicators (facts, data, neutral descriptions)
  const objectiveIndicators = [
    'är', 'var', 'blev', 'enligt', 'studie', 'forskning', 'data',
    'statistik', 'visar', 'bevisar', 'dokumenterad', 'mätt', 'procent',
    'antal', 'datum', 'år', 'månad', 'dag', 'tid', 'plats',
  ];

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const objectiveSentences = [];
  const subjectiveSentences = [];

  sentences.forEach(sentence => {
    const sentenceLower = sentence.toLowerCase();
    let subjectiveCount = 0;
    let objectiveCount = 0;

    // Count indicators
    subjectiveIndicators.forEach(indicator => {
      if (sentenceLower.includes(indicator)) {
        subjectiveCount++;
      }
    });

    objectiveIndicators.forEach(indicator => {
      if (sentenceLower.includes(indicator)) {
        objectiveCount++;
      }
    });

    // Classify sentence
    const sentenceData = {
      text: sentence.trim(),
      subjectiveCount,
      objectiveCount,
    };

    if (subjectiveCount > objectiveCount) {
      subjectiveSentences.push(sentenceData);
    } else if (objectiveCount > 0 || subjectiveCount === 0) {
      objectiveSentences.push(sentenceData);
    } else {
      // Equal or no indicators - classify as subjective to be safe
      subjectiveSentences.push(sentenceData);
    }
  });

  // Calculate overall subjectivity score (0 = objective, 1 = subjective)
  const totalSentences = sentences.length;
  const subjectivityScore = totalSentences > 0 
    ? subjectiveSentences.length / totalSentences 
    : 0;

  return {
    objectiveSentences: objectiveSentences.map(s => s.text),
    subjectiveSentences: subjectiveSentences.map(s => s.text),
    subjectivityScore: Math.round(subjectivityScore * 100) / 100,
    objectivePercentage: Math.round((objectiveSentences.length / totalSentences) * 100),
    subjectivePercentage: Math.round((subjectiveSentences.length / totalSentences) * 100),
    provenance: {
      model: 'Custom Subjectivity Filter',
      version: '1.0.0',
      method: 'Lexicon-based subjectivity detection with indicator counting',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Identify loaded/charged expressions in text
 * @param {string} text - The text to analyze
 * @returns {Object} Loaded expressions analysis
 */
export function identifyLoadedExpressions(text) {
  if (!text || typeof text !== 'string') {
    return {
      loadedExpressions: [],
      count: 0,
      provenance: {
        model: 'Loaded Expression Detector',
        version: '1.0.0',
        method: 'Pattern matching for emotionally charged language',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Emotionally charged or loaded expressions
  const loadedPatterns = [
    // Strong positive
    { pattern: /fantastisk|underbar|utmärkt|briljant|exceptionell/gi, type: 'strong_positive', sentiment: 'positive' },
    // Strong negative
    { pattern: /fruktansvärd|hemsk|katastrof|skandal|oacceptabel/gi, type: 'strong_negative', sentiment: 'negative' },
    // Alarmist
    { pattern: /kris|fara|hot|risk|varning|alarm/gi, type: 'alarmist', sentiment: 'negative' },
    // Hyperbole
    { pattern: /alltid|aldrig|alla|ingen|helt|fullständigt omöjlig/gi, type: 'hyperbole', sentiment: 'neutral' },
    // Judgmental
    { pattern: /fel|rätt|bör|måste|inte får|aldrig får/gi, type: 'judgmental', sentiment: 'neutral' },
    // Emotional appeal
    { pattern: /tänk på|föreställ dig|känner du|skulle du|vad om/gi, type: 'emotional_appeal', sentiment: 'neutral' },
  ];

  const loadedExpressions = [];

  loadedPatterns.forEach(({ pattern, type, sentiment }) => {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      matches.forEach(match => {
        // Get context
        const index = text.toLowerCase().indexOf(match.toLowerCase());
        const start = Math.max(0, index - 40);
        const end = Math.min(text.length, index + match.length + 40);
        const context = text.substring(start, end).trim();

        loadedExpressions.push({
          expression: match,
          type,
          sentiment,
          context: context.length > 80 ? context.substring(0, 80) + '...' : context,
        });
      });
    }
  });

  // Remove duplicates based on context
  const uniqueExpressions = [];
  const seenContexts = new Set();
  
  loadedExpressions.forEach(expr => {
    if (!seenContexts.has(expr.context)) {
      seenContexts.add(expr.context);
      uniqueExpressions.push(expr);
    }
  });

  return {
    loadedExpressions: uniqueExpressions,
    count: uniqueExpressions.length,
    byType: countByType(uniqueExpressions),
    provenance: {
      model: 'Loaded Expression Detector',
      version: '1.0.0',
      method: 'Pattern matching for emotionally charged language',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Count loaded expressions by type
 */
function countByType(expressions) {
  const counts = {};
  expressions.forEach(expr => {
    counts[expr.type] = (counts[expr.type] || 0) + 1;
  });
  return counts;
}

/**
 * Reduce noise in text by identifying filler words and low-information content
 * @param {string} text - The text to analyze
 * @returns {Object} Noise analysis result
 */
export function reduceNoise(text) {
  if (!text || typeof text !== 'string') {
    return {
      noiseWords: [],
      noiseScore: 0,
      cleanedText: '',
      provenance: {
        model: 'Noise Reducer',
        version: '1.0.0',
        method: 'Filler word detection and removal',
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Filler words and noise patterns (Swedish)
  const fillerWords = [
    'typ', 'liksom', 'asså', 'ba', 'typ av', 'eller nåt', 'eller så',
    'och så', 'och sånt', 'eller vad det nu', 'eller hur', 'eller vad',
    'nån slags', 'lite grand', 'rätt så', 'ganska mycket',
  ];

  const words = text.split(/\s+/);
  const noiseWords = [];
  const cleanWords = [];

  words.forEach(word => {
    const wordLower = word.toLowerCase();
    let isNoise = false;

    for (const filler of fillerWords) {
      if (wordLower.includes(filler)) {
        noiseWords.push(word);
        isNoise = true;
        break;
      }
    }

    if (!isNoise) {
      cleanWords.push(word);
    }
  });

  const noiseScore = words.length > 0 ? noiseWords.length / words.length : 0;

  return {
    noiseWords: [...new Set(noiseWords)], // Remove duplicates
    noiseScore: Math.round(noiseScore * 100) / 100,
    noisePercentage: Math.round(noiseScore * 100),
    cleanedText: cleanWords.join(' '),
    originalWordCount: words.length,
    cleanedWordCount: cleanWords.length,
    provenance: {
      model: 'Noise Reducer',
      version: '1.0.0',
      method: 'Filler word detection and removal',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Perform complete preprocessing on text
 * @param {string} text - The text to preprocess
 * @returns {Object} Complete preprocessing result
 */
export function performCompletePreprocessing(text) {
  const startTime = Date.now();

  const tokenization = tokenizeText(text);
  const subjectivityAnalysis = filterBySubjectivity(text);
  const loadedExpressions = identifyLoadedExpressions(text);
  const noiseAnalysis = reduceNoise(text);

  const endTime = Date.now();

  return {
    tokenization,
    subjectivityAnalysis,
    loadedExpressions,
    noiseAnalysis,
    metadata: {
      processingTimeMs: endTime - startTime,
      textLength: text.length,
      processedAt: new Date().toISOString(),
    },
  };
}
