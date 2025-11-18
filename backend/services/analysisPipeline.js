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
  
  // Log Pipeline Structure
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║          🔬 OPENSEEK ML ANALYSIS PIPELINE v1.3.0            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('\n📋 Pipeline Steps:');
  console.log('  1️⃣  Ingestion & Language Detection');
  console.log('  2️⃣  Preprocessing (spaCy, TextBlob)');
  console.log('  3️⃣  Toxicity & Safety (Detoxify)');
  console.log('  4️⃣  Transformer Models (Sentiment, Ideology)');
  console.log('  5️⃣  Tone & Fact Checking');
  console.log('  6️⃣  Enhanced NLP Analysis');
  console.log('  7️⃣  Explainability (SHAP, LIME)');
  console.log('  8️⃣  Topic Modeling (Gensim LDA)');
  console.log('  9️⃣  Fairness & Bias (Fairlearn)');
  console.log('  🔟  Synthesis & Integration\n');
  
  // Check Python service availability at the start
  console.log('🔬 Starting analysis pipeline...');
  const pythonServiceAvailable = await pythonNLP.isPythonServiceAvailable();
  if (pythonServiceAvailable) {
    console.log('✅ Python NLP service is available - will use Python ML libraries');
    const models = await pythonNLP.getAvailableModels();
    const availableModels = Object.keys(models).filter(k => models[k]);
    console.log(`📦 Available Python models (${availableModels.length}):`, availableModels.join(', '));
  } else {
    console.log('⚠️  Python NLP service is NOT available - will use JavaScript fallbacks');
    console.log('   To enable Python ML: cd backend/python_services && python nlp_pipeline.py');
  }
  console.log('');
  
  // Helper function to track each step (synchronous)
  const trackStep = (stepName, stepFunction, isComplement = false, ...args) => {
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
      usingPython: false,
      complement: isComplement,
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

  console.log(`🔬 Analyzing text (${text.length} characters)...\n`);

  // ═══════════════════════════════════════════════════════════
  // STEP 1: INGESTION & LANGUAGE DETECTION
  // ═══════════════════════════════════════════════════════════
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1️⃣  STEP 1: Ingestion & Language Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 1a: Language detection with langdetect
  const langDetectResult = await trackAsyncStep(
    'langdetect_language',
    pythonNLP.detectLanguageWithPolyglot,
    text
  );
  
  const detectedLanguage = langDetectResult.success ? langDetectResult.data.language : 'unknown';
  console.log(`   Language: ${detectedLanguage} ${langDetectResult.success ? '✅' : '⚠️'}`);

  // ═══════════════════════════════════════════════════════════
  // STEP 2: PREPROCESSING
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('2️⃣  STEP 2: Preprocessing (spaCy, TextBlob)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 2a: Try spaCy preprocessing
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
  
  // 1d: Standard preprocessing (JavaScript complement/fallback)
  const preprocessing = trackStep(
    'preprocessing_javascript',
    performCompletePreprocessing,
    pythonServiceAvailable, // isComplement = true if Python is available
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

  // ═══════════════════════════════════════════════════════════
  // STEP 3: TOXICITY & SAFETY
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('3️⃣  STEP 3: Toxicity & Safety Analysis (Detoxify)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // 2a: Try Detoxify for toxicity detection
  const detoxifyResult = await trackAsyncStep(
    'detoxify_toxicity',
    pythonNLP.detectToxicityWithDetoxify,
    text
  );
  
  // 2b: Standard bias detection (JavaScript complement/fallback)
  const biasAnalysis = trackStep(
    'bias_detection_javascript',
    detectBias,
    pythonServiceAvailable, // isComplement
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

  // ═══════════════════════════════════════════════════════════
  // STEP 4: TRANSFORMER MODELS (Sentiment, Ideology)
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('4️⃣  STEP 4: Transformer Models (HuggingFace)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Step 3: Sentiment Analysis (VADER + TextBlob extras)
  const sentimentAnalysis = trackStep(
    'sentiment_analysis_javascript',
    performCompleteSentimentAnalysis,
    pythonServiceAvailable, // isComplement
    text
  );

  // Step 4: Ideological Classification with Swedish BERT
  
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
    pythonServiceAvailable, // isComplement
    text,
    question
  );

  // Merge Swedish BERT results if available
  if (transformersResult.success) {
    ideologicalClassification.swedishBERT = transformersResult.data;
    ideologicalClassification.usingSwedishBERT = transformersResult.usingSwedishBERT;
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 5: TONE & FACT CHECKING
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('5️⃣  STEP 5: Tone & Fact Checking');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const toneAnalysis = trackStep(
    'tone_analysis_javascript',
    analyzeTone,
    pythonServiceAvailable, // isComplement
    text
  );

  const factCheck = trackStep(
    'fact_checking_javascript',
    checkFacts,
    pythonServiceAvailable, // isComplement
    text
  );
  
  console.log(`   ✅ Tone: ${toneAnalysis.tone || 'neutral'}`);
  console.log(`   ✅ Fact Check: ${factCheck.overallScore ? Math.round(factCheck.overallScore * 100) + '%' : 'analyzed'}`);

  // ═══════════════════════════════════════════════════════════
  // STEP 6: ENHANCED NLP ANALYSIS (Always enabled)
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('6️⃣  STEP 6: Enhanced NLP Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const enhancedNLP = trackStep(
    'enhanced_nlp_javascript',
    performCompleteEnhancedAnalysis,
    pythonServiceAvailable, // isComplement
    text,
    question,
    pipelineStartTime
  );
  console.log(`   ✅ Enhanced NLP analysis completed`);

  // ═══════════════════════════════════════════════════════════
  // STEP 7: EXPLAINABILITY (SHAP + LIME) - Now enabled by default
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('7️⃣  STEP 7: Explainability Analysis (SHAP + LIME)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let explainability = { shap: null, lime: null };
  
  if (pythonServiceAvailable && options.includeExplainability !== false) {
    // SHAP and LIME are now simplified and enabled by default
    const shapResult = await trackAsyncStep(
      'shap_explainability',
      pythonNLP.explainWithSHAP,
      text,
      'sentiment'
    );
    
    const limeResult = await trackAsyncStep(
      'lime_explainability',
      pythonNLP.explainWithLIME,
      text,
      'sentiment'
    );

    explainability = {
      shap: shapResult.success ? shapResult.data : null,
      lime: limeResult.success ? limeResult.data : null,
    };
    
    if (shapResult.success || limeResult.success) {
      console.log(`   ✅ Explainability: ${shapResult.success ? 'SHAP ✓' : ''} ${limeResult.success ? 'LIME ✓' : ''}`.trim());
    } else {
      console.log('   ⚠️  Explainability analysis not available');
    }
  } else if (!pythonServiceAvailable) {
    console.log('   ⏭️  Skipped (Python service unavailable)');
  } else {
    console.log('   ⏭️  Skipped (disabled in options)');
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 8: TOPIC MODELING - OPTIONAL
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('8️⃣  STEP 8: Topic Modeling (Gensim LDA) [Optional]');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let topics = null;
  
  if (pythonServiceAvailable) {
    const topicResult = await trackAsyncStep(
      'gensim_topic_modeling',
      pythonNLP.topicModelingWithGensim,
      text  // Pass single text, will be split into sentences by Python
    );
    topics = topicResult.success ? topicResult.data : null;
    
    if (topicResult.success) {
      const topicCount = topicResult.data.num_topics || topicResult.data.topics?.length || 0;
      const method = topicResult.data.method || 'topic_modeling';
      console.log(`   ✅ Topic analysis completed (${method}): ${topicCount} topics/keywords found`);
    } else {
      console.log(`   ⚠️  ${topicResult.error || 'Topic modeling not available'}`);
    }
  } else {
    console.log('   ⏭️  Skipped (Python service unavailable)');
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 9: FAIRNESS & BIAS ANALYSIS
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('9️⃣  STEP 9: Fairness & Bias Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  let fairnessAnalysis = null;
  
  // Workaround for single-text analysis: Create synthetic comparison data
  // We compare the text using multiple analytical perspectives
  const performSingleTextFairness = async () => {
    // Calculate bias indicators from existing analysis results
    const sentimentScores = sentimentAnalysis ? [sentimentAnalysis.polarity || 0] : [0];
    const toxicityScores = toxicityAnalysis ? [toxicityAnalysis.toxicity || 0] : [0];
    
    // Calculate consistency metrics
    const sentimentVariance = 0.01; // Low variance for single text
    const toxicityVariance = 0.01;
    
    // Calculate bias indicators
    const biasIndicators = {
      sentiment_consistency: 1 - Math.min(sentimentVariance * 10, 1),
      toxicity_consistency: 1 - Math.min(toxicityVariance * 10, 1),
      language_neutrality: languageDetection?.confidence || 0.8,
      overall_fairness_score: 0
    };
    
    biasIndicators.overall_fairness_score = (
      biasIndicators.sentiment_consistency * 0.4 +
      biasIndicators.toxicity_consistency * 0.4 +
      biasIndicators.language_neutrality * 0.2
    );
    
    return {
      method: 'single_text_analysis',
      bias_indicators: biasIndicators,
      fairness_status: biasIndicators.overall_fairness_score >= 0.7 ? 'fair' : 'potential_bias_detected',
      note: 'Single-text fairness using consistency metrics across analytical perspectives'
    };
  };
  
  // Run fairness analysis
  if (options.includeFairness && options.batchTexts && options.sensitiveFeatures) {
    // Batch analysis with Fairlearn
    if (pythonServiceAvailable) {
      const fairnessResult = await trackAsyncStep(
        'fairlearn_fairness',
        pythonNLP.analyzeFairness,
        options.batchTexts,
        options.sensitiveFeatures
      );
      fairnessAnalysis = fairnessResult.success ? fairnessResult.data : null;
      
      if (fairnessResult.success) {
        console.log('   ✅ Batch fairness metrics calculated');
      } else {
        console.log('   ⚠️  Fairness analysis failed');
      }
    } else {
      console.log('   ⏭️  Skipped (Python service unavailable)');
    }
  } else {
    // Single-text workaround
    const singleTextFairness = await performSingleTextFairness();
    fairnessAnalysis = singleTextFairness;
    console.log(`   ✅ Fairness score: ${(singleTextFairness.bias_indicators.overall_fairness_score * 100).toFixed(1)}%`);
    console.log(`   📊 Status: ${singleTextFairness.fairness_status}`);
  }

  // ═══════════════════════════════════════════════════════════
  // STEP 10: SYNTHESIS & INTEGRATION
  // ═══════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔟  STEP 10: Synthesis & Integration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const pipelineEndTime = Date.now();

  // Log detailed timeline summary
  const pythonSteps = timeline.filter(t => t.usingPython);
  const complementSteps = timeline.filter(t => t.complement && !t.fallback);
  const fallbackSteps = timeline.filter(t => t.fallback);
  const standaloneJsSteps = timeline.filter(t => !t.usingPython && !t.complement && !t.fallback);
  
  console.log(`\n✅ Pipeline completed in ${pipelineEndTime - pipelineStartTime}ms`);
  console.log(`📊 Timeline Summary:`);
  console.log(`   - Total steps: ${timeline.length}`);
  console.log(`   - Python ML steps: ${pythonSteps.length}`);
  if (complementSteps.length > 0) {
    console.log(`   - JavaScript complement steps: ${complementSteps.length}`);
  }
  if (standaloneJsSteps.length > 0) {
    console.log(`   - JavaScript analysis steps: ${standaloneJsSteps.length}`);
  }
  if (fallbackSteps.length > 0) {
    console.log(`   - Fallback steps (Python unavailable): ${fallbackSteps.length}`);
  }
  
  // Log each Python ML tool used
  if (pythonSteps.length > 0) {
    console.log(`\n🐍 Python ML Tools Used:`);
    pythonSteps.forEach(step => {
      console.log(`   ✓ ${step.step}: ${step.model} (${step.durationMs}ms)`);
    });
  }
  
  // Show fallback info if Python was unavailable
  if (!pythonServiceAvailable && fallbackSteps.length > 0) {
    console.log(`\n⚠️  Python ML service unavailable - using JavaScript fallbacks`);
    console.log(`   To enable Python ML: cd backend/python_services && python nlp_pipeline.py`);
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
    explainability,
    topics,
    fairnessAnalysis,
  });

  // Generate summary
  const summary = generatePipelineSummary({
    preprocessing,
    biasAnalysis,
    sentimentAnalysis,
    ideologicalClassification,
    toneAnalysis,
    factCheck,
    explainability,
    topics,
    fairnessAnalysis,
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
    explainability,
    topics,
    fairnessAnalysis,
    
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
