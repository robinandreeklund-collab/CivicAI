/**
 * Analysis Pipeline Service
 * 
 * METHODOLOGY:
 * This service orchestrates a comprehensive analysis pipeline that combines:
 * 1. Text Preprocessing (tokenization, POS-tagging, subjectivity filtering)
 * 2. Bias Detection (enhanced with per-sentence analysis)
 * 3. Sentiment Analysis (VADER + sarcasm, aggression, empathy)
 * 4. Ideological Classification (left-right-center scoring)
 * 5. Existing analysis modules (tone, fact-check, NLP processors)
 * 
 * TRANSPARENCY:
 * Every step is tracked with timestamps, model information, and metadata
 * to provide full audit trail and transparency for the analysis process.
 * 
 * OUTPUT:
 * Complete analysis package with:
 * - All analysis results from each component
 * - Timeline of analysis steps with metadata
 * - Aggregated insights and summary
 * - Full provenance tracking
 */

import { performCompletePreprocessing } from '../utils/preprocessText.js';
import { detectBias } from '../utils/detectBias.js';
import { performCompleteSentimentAnalysis } from '../utils/sentimentAnalysis.js';
import { performCompleteIdeologicalClassification } from '../utils/ideologicalClassification.js';
import { analyzeTone, getToneDescription } from '../utils/analyzeTone.js';
import { checkFacts } from '../utils/checkFacts.js';
import { performCompleteEnhancedAnalysis } from '../utils/nlpProcessors.js';
import { PIPELINE_CONFIG, generatePipelineMetadata, getPipelineStepsInOrder } from '../config/pipelineConfig.js';
import * as pythonNLP from './pythonNLPClient.js';

/**
 * Execute the complete analysis pipeline on a text
 * @param {string} text - The text to analyze
 * @param {string} question - The original question for context
 * @param {Object} options - Optional configuration
 * @returns {Object} Complete pipeline analysis result
 */
export async function executeAnalysisPipeline(text, question = '', options = {}) {
  const pipelineStartTime = Date.now();
  const timeline = [];
  
  // Helper function to track each step (synchronous)
  const trackStep = (stepName, stepFunction, ...args) => {
    const stepStartTime = Date.now();
    const result = stepFunction(...args);
    const stepEndTime = Date.now();
    
    // Extract provenance from nested structure
    let provenance = result.provenance || {};
    
    // For composite results, try to find provenance in first-level nested objects
    if (!provenance.model) {
      const firstKey = Object.keys(result).find(key => 
        result[key] && typeof result[key] === 'object' && result[key].provenance
      );
      if (firstKey) {
        provenance = result[firstKey].provenance;
      }
    }
    
    timeline.push({
      step: stepName,
      startTime: new Date(stepStartTime).toISOString(),
      endTime: new Date(stepEndTime).toISOString(),
      durationMs: stepEndTime - stepStartTime,
      model: provenance.model || 'Unknown',
      version: provenance.version || 'Unknown',
      method: provenance.method || 'Unknown',
    });
    
    return result;
  };

  // Helper function to track async steps (for Python ML tools)
  const trackAsyncStep = async (stepName, stepFunction, ...args) => {
    const stepStartTime = Date.now();
    const result = await stepFunction(...args);
    const stepEndTime = Date.now();
    
    // Extract provenance from result
    let provenance = result?.provenance || result?.data?.provenance || {};
    
    timeline.push({
      step: stepName,
      startTime: new Date(stepStartTime).toISOString(),
      endTime: new Date(stepEndTime).toISOString(),
      durationMs: stepEndTime - stepStartTime,
      model: provenance.model || 'Unknown',
      version: provenance.version || 'Unknown',
      method: provenance.method || 'Unknown',
      usingPython: result?.usingPython || false,
      fallback: result?.fallback || false,
    });
    
    return result;
  };

  console.log(`🔬 Starting analysis pipeline for text (${text.length} characters)`);

  // Step 1: Enhanced Text Preprocessing with Python ML tools
  console.log('📝 Step 1: Text Preprocessing with Python ML...');
  
  // 1a: Try spaCy preprocessing
  const spacyResult = await trackAsyncStep(
    'spacy_preprocessing',
    pythonNLP.preprocessWithSpacy,
    text
  );
  
  // 1b: Try TextBlob subjectivity
  const textBlobResult = await trackAsyncStep(
    'textblob_subjectivity',
    pythonNLP.analyzeSentimentWithTextBlob,
    text
  );
  
  // 1c: Language detection with langdetect
  const langDetectResult = await trackAsyncStep(
    'langdetect_language',
    pythonNLP.detectLanguageWithPolyglot,
    text
  );
  
  // 1d: Standard preprocessing (JavaScript fallback/enhancement)
  const preprocessing = trackStep(
    'preprocessing_javascript',
    performCompletePreprocessing,
    text
  );

  // Merge Python ML results into preprocessing if available
  if (spacyResult.success) {
    preprocessing.spacy = spacyResult.data;
  }
  if (textBlobResult.success) {
    preprocessing.textblob = textBlobResult.data;
  }
  if (langDetectResult.success) {
    preprocessing.langdetect = langDetectResult.data;
  }

  // Step 2: Bias Detection with Detoxify (Enhanced)
  console.log('🎯 Step 2: Bias Detection with Detoxify...');
  
  // 2a: Try Detoxify for toxicity detection
  const detoxifyResult = await trackAsyncStep(
    'detoxify_toxicity',
    pythonNLP.detectToxicityWithDetoxify,
    text
  );
  
  // 2b: Standard bias detection
  const biasAnalysis = trackStep(
    'bias_detection_javascript',
    detectBias,
    text,
    question
  );

  // Merge Detoxify results if available
  if (detoxifyResult.success) {
    biasAnalysis.detoxify = detoxifyResult.data;
  }

  // Add per-sentence bias analysis
  const sentenceBiasAnalysis = analyzeSentenceBias(text, question);
  timeline.push({
    step: 'sentence_bias_analysis',
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    durationMs: 0,
    model: 'Sentence-level Bias Analyzer',
    version: '1.0.0',
    method: 'Per-sentence bias detection',
  });

  // Step 3: Sentiment Analysis (VADER + TextBlob extras)
  console.log('💭 Step 3: Sentiment Analysis...');
  const sentimentAnalysis = trackStep(
    'sentiment_analysis_javascript',
    performCompleteSentimentAnalysis,
    text
  );

  // Step 4: Ideological Classification with Swedish BERT
  console.log('🏛️ Step 4: Ideological Classification with Swedish BERT...');
  
  // 4a: Try Transformers (Swedish BERT) for ideology
  const transformersResult = await trackAsyncStep(
    'swedish_bert_ideology',
    pythonNLP.classifyIdeologyWithTransformers,
    text
  );
  
  // 4b: Standard ideological classification
  const ideologicalClassification = trackStep(
    'ideology_classification_javascript',
    performCompleteIdeologicalClassification,
    text,
    question
  );

  // Merge Swedish BERT results if available
  if (transformersResult.success) {
    ideologicalClassification.swedishBERT = transformersResult.data;
    ideologicalClassification.usingSwedishBERT = transformersResult.usingSwedishBERT;
  }

  // Step 5: Tone Analysis
  console.log('🎵 Step 5: Tone Analysis...');
  const toneAnalysis = trackStep(
    'tone_analysis_javascript',
    analyzeTone,
    text
  );

  // Step 6: Fact Checking
  console.log('✅ Step 6: Fact Checking...');
  const factCheck = trackStep(
    'fact_checking_javascript',
    checkFacts,
    text
  );

  // Optional: Enhanced NLP Analysis (if requested)
  let enhancedNLP = null;
  if (options.includeEnhancedNLP !== false) {
    console.log('🧠 Step 7: Enhanced NLP Analysis...');
    enhancedNLP = trackStep(
      'enhanced_nlp_javascript',
      performCompleteEnhancedAnalysis,
      text,
      question,
      pipelineStartTime
    );
  }

  const pipelineEndTime = Date.now();

  // Log detailed timeline summary
  console.log(`\n✅ Pipeline completed in ${pipelineEndTime - pipelineStartTime}ms`);
  console.log(`📊 Timeline Summary:`);
  console.log(`   - Total steps: ${timeline.length}`);
  console.log(`   - Python ML steps: ${timeline.filter(t => t.usingPython).length}`);
  console.log(`   - JavaScript fallback steps: ${timeline.filter(t => t.fallback || !t.usingPython).length}`);
  
  // Log each Python ML tool used
  const pythonSteps = timeline.filter(t => t.usingPython);
  if (pythonSteps.length > 0) {
    console.log(`\n🐍 Python ML Tools Used:`);
    pythonSteps.forEach(step => {
      console.log(`   ✓ ${step.step}: ${step.model} (${step.durationMs}ms)`);
    });
  }

  // Generate aggregated insights
  const insights = generateAggregatedInsights({
    preprocessing,
    biasAnalysis,
    sentenceBiasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
    enhancedNLP,
  });

  // Generate summary
  const summary = generatePipelineSummary({
    preprocessing,
    biasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
  });

  console.log(`✅ Pipeline completed in ${pipelineEndTime - pipelineStartTime}ms`);

  // Get pipeline configuration metadata
  const pipelineMetadata = generatePipelineMetadata();
  const pipelineSteps = getPipelineStepsInOrder();

  // Count Python ML usage
  const pythonMLStats = {
    totalSteps: timeline.length,
    pythonSteps: timeline.filter(t => t.usingPython).length,
    fallbackSteps: timeline.filter(t => t.fallback).length,
    javascriptSteps: timeline.filter(t => !t.usingPython && !t.fallback).length,
    toolsUsed: [...new Set(timeline.map(t => t.model))],
  };

  return {
    // Individual analysis results
    preprocessing,
    biasAnalysis,
    sentenceBiasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
    enhancedNLP,
    
    // Aggregated data
    insights,
    summary,
    
    // Transparency data
    timeline,
    pythonMLStats,  // New: Statistics about Python ML usage
    metadata: {
      totalProcessingTimeMs: pipelineEndTime - pipelineStartTime,
      pipelineStartTime: new Date(pipelineStartTime).toISOString(),
      pipelineEndTime: new Date(pipelineEndTime).toISOString(),
      textLength: text.length,
      questionLength: question.length,
      stepsCompleted: timeline.length,
      pythonMLEnabled: pythonMLStats.pythonSteps > 0,
    },
    
    // Pipeline configuration
    pipelineConfig: {
      version: pipelineMetadata.pipelineVersion,
      description: pipelineMetadata.pipelineDescription,
      workflow: PIPELINE_CONFIG.workflow,
      steps: pipelineSteps,
      transparencyLayer: PIPELINE_CONFIG.transparency_layer,
      timestamp: pipelineMetadata.timestamp,
    },
  };
}

/**
 * Analyze bias at sentence level
 * @param {string} text - The text to analyze
 * @param {string} question - The question for context
 * @returns {Object} Sentence-level bias analysis
 */
function analyzeSentenceBias(text, question) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const sentenceAnalysis = [];

  sentences.forEach((sentence, index) => {
    const bias = detectBias(sentence, question);
    
    if (bias.detectedBiases.length > 0) {
      sentenceAnalysis.push({
        sentenceIndex: index,
        sentence: sentence.trim(),
        biases: bias.detectedBiases,
        biasScore: bias.biasScore,
        flaggedTerms: extractFlaggedTerms(sentence, bias.detectedBiases),
      });
    }
  });

  return {
    sentences: sentenceAnalysis,
    totalSentencesAnalyzed: sentences.length,
    biasedSentencesCount: sentenceAnalysis.length,
    biasedSentencesPercentage: Math.round((sentenceAnalysis.length / sentences.length) * 100),
    provenance: {
      model: 'Sentence-level Bias Analyzer',
      version: '1.0.0',
      method: 'Per-sentence bias detection with term extraction',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Extract flagged terms from sentence based on detected biases
 * @param {string} sentence - The sentence to analyze
 * @param {Array} biases - Detected biases
 * @returns {Array} Flagged terms
 */
function extractFlaggedTerms(sentence, biases) {
  const flaggedTerms = [];
  const sentenceLower = sentence.toLowerCase();

  // Extract terms based on bias type
  biases.forEach(bias => {
    if (bias.type === 'political') {
      const politicalTerms = ['jämlikhet', 'välfärd', 'solidaritet', 'frihet', 'marknad', 'konkurrens'];
      politicalTerms.forEach(term => {
        if (sentenceLower.includes(term)) {
          flaggedTerms.push({ term, biasType: 'political', direction: bias.direction });
        }
      });
    } else if (bias.type === 'commercial') {
      const commercialTerms = ['köp', 'produkt', 'tjänst', 'brand', 'företag'];
      commercialTerms.forEach(term => {
        if (sentenceLower.includes(term)) {
          flaggedTerms.push({ term, biasType: 'commercial' });
        }
      });
    } else if (bias.type === 'cultural') {
      const culturalTerms = ['västerländsk', 'europeisk', 'amerikansk', 'asiatisk'];
      culturalTerms.forEach(term => {
        if (sentenceLower.includes(term)) {
          flaggedTerms.push({ term, biasType: 'cultural', direction: bias.direction });
        }
      });
    }
  });

  return flaggedTerms;
}

/**
 * Generate aggregated insights from all analysis components
 * @param {Object} analysisResults - All analysis results
 * @returns {Object} Aggregated insights
 */
function generateAggregatedInsights(analysisResults) {
  const {
    preprocessing,
    biasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
  } = analysisResults;

  return {
    // Text characteristics
    textMetrics: {
      wordCount: preprocessing.tokenization.wordCount,
      sentenceCount: preprocessing.tokenization.sentenceCount,
      avgWordsPerSentence: Math.round(
        preprocessing.tokenization.wordCount / preprocessing.tokenization.sentenceCount
      ),
      subjectivityScore: preprocessing.subjectivityAnalysis.subjectivityScore,
      noiseLevel: preprocessing.noiseAnalysis.noiseScore,
    },
    
    // Content quality indicators
    qualityIndicators: {
      objectivity: 1 - preprocessing.subjectivityAnalysis.subjectivityScore,
      clarity: 1 - preprocessing.noiseAnalysis.noiseScore,
      factuality: 1 - (factCheck.claimsFound / 10), // Normalized
      neutrality: 1 - (biasAnalysis.biasScore / 10), // Normalized
    },
    
    // Emotional and tonal profile
    emotionalProfile: {
      overallTone: toneAnalysis.primary,
      sentimentClassification: sentimentAnalysis.vaderSentiment.classification,
      sentimentIntensity: sentimentAnalysis.vaderSentiment.intensity,
      isSarcastic: sentimentAnalysis.sarcasmDetection.isSarcastic,
      isAggressive: sentimentAnalysis.aggressionDetection.isAggressive,
      isEmpathetic: sentimentAnalysis.empathyDetection.isEmpathetic,
      loadedExpressionsCount: preprocessing.loadedExpressions.count,
    },
    
    // Political and ideological profile
    politicalProfile: {
      overallIdeology: ideologicalClassification.ideology.classification,
      detailedIdeology: ideologicalClassification.ideology.detailedClassification,
      ideologyConfidence: ideologicalClassification.ideology.confidence,
      economicStance: ideologicalClassification.ideology.dimensions.economic.classification,
      socialStance: ideologicalClassification.ideology.dimensions.social.classification,
      authorityStance: ideologicalClassification.ideology.dimensions.authority.classification,
      politicalBias: biasAnalysis.detectedBiases.find(b => b.type === 'political'),
    },
    
    // Risk flags
    riskFlags: {
      highBias: biasAnalysis.biasScore > 5,
      highSubjectivity: preprocessing.subjectivityAnalysis.subjectivityScore > 0.7,
      hasAggression: sentimentAnalysis.aggressionDetection.isAggressive,
      manyUnverifiedClaims: factCheck.claimsFound > 5,
      loadedLanguage: preprocessing.loadedExpressions.count > 3,
    },
  };
}

/**
 * Generate human-readable summary of pipeline analysis
 * @param {Object} analysisResults - All analysis results
 * @returns {Object} Pipeline summary
 */
function generatePipelineSummary(analysisResults) {
  const {
    preprocessing,
    biasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
  } = analysisResults;

  const summaryParts = [];

  // Tone and sentiment
  summaryParts.push(
    `Texten har en ${getToneDescription(toneAnalysis.primary).toLowerCase()} ton med ${sentimentAnalysis.vaderSentiment.classification} sentiment.`
  );

  // Ideology
  if (ideologicalClassification.ideology.confidence > 0.3) {
    summaryParts.push(
      `Ideologiskt klassificeras texten som ${ideologicalClassification.ideology.classification} (${Math.round(ideologicalClassification.ideology.confidence * 100)}% säkerhet).`
    );
  }

  // Bias
  if (biasAnalysis.biasScore > 2) {
    const biasTypes = biasAnalysis.detectedBiases.map(b => b.type).join(', ');
    summaryParts.push(
      `Detekterad bias: ${biasTypes} (bias-poäng: ${biasAnalysis.biasScore}/10).`
    );
  } else {
    summaryParts.push('Minimal bias detekterad.');
  }

  // Subjectivity
  if (preprocessing.subjectivityAnalysis.subjectivityScore > 0.6) {
    summaryParts.push(
      `Texten är mycket subjektiv (${Math.round(preprocessing.subjectivityAnalysis.subjectivityScore * 100)}%).`
    );
  } else if (preprocessing.subjectivityAnalysis.subjectivityScore < 0.3) {
    summaryParts.push(
      `Texten är huvudsakligen objektiv (${preprocessing.subjectivityAnalysis.objectivePercentage}% objektiva meningar).`
    );
  }

  // Fact checking
  if (factCheck.claimsFound > 0) {
    summaryParts.push(
      `${factCheck.claimsFound} verifierbara påståenden identifierade.`
    );
  }

  // Emotional indicators
  const emotionalFlags = [];
  if (sentimentAnalysis.sarcasmDetection.isSarcastic) emotionalFlags.push('sarkasm');
  if (sentimentAnalysis.aggressionDetection.isAggressive) emotionalFlags.push('aggression');
  if (sentimentAnalysis.empathyDetection.isEmpathetic) emotionalFlags.push('empati');
  
  if (emotionalFlags.length > 0) {
    summaryParts.push(`Detekterade känslomässiga indikatorer: ${emotionalFlags.join(', ')}.`);
  }

  return {
    text: summaryParts.join(' '),
    bullets: summaryParts,
    provenance: {
      model: 'Pipeline Summary Generator',
      version: '1.0.0',
      method: 'Rule-based summary generation from analysis results',
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Execute pipeline for multiple texts (batch processing)
 * @param {Array} texts - Array of texts to analyze
 * @param {string} question - Optional question for context
 * @param {Object} options - Optional configuration
 * @returns {Array} Array of pipeline results
 */
export async function executeBatchAnalysisPipeline(texts, question = '', options = {}) {
  const results = [];
  
  for (const text of texts) {
    const result = await executeAnalysisPipeline(text, question, options);
    results.push(result);
  }
  
  return results;
}
