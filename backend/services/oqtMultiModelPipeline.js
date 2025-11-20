/**
 * OQT-1.0 Multi-Model Pipeline
 * 
 * Orchestrates Mistral 7B and LLaMA-2 models for OQT-1.0 analysis
 * Implements:
 * - Multi-model response generation (Mistral + LLaMA + existing AI services)
 * - Consensus analysis between models
 * - Bias detection across responses
 * - Fairness assessment
 * - Meta-summary synthesis
 * - Two-step training preparation
 */

import { getMistralResponse, isMistralAvailable, getMistralInfo } from './mistral.js';
import { getLlamaResponse, isLlamaAvailable, getLlamaInfo } from './llama.js';
import { getOpenAIResponse } from './openai.js';
import { getGeminiResponse } from './gemini.js';
import { getGrokResponse } from './grok.js';
import { executeAnalysisPipeline } from './analysisPipeline.js';

/**
 * Generate responses from all available models
 * @param {string} question - User's question
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of model responses with metadata
 */
export async function generateMultiModelResponses(question, options = {}) {
  const responses = [];
  const startTime = Date.now();
  
  console.log(`\n🤖 Generating multi-model responses for: "${question}"`);
  
  // Core models for OQT-1.0 (Mistral + LLaMA)
  const coreModels = [
    {
      name: 'Mistral 7B',
      generate: getMistralResponse,
      checkAvailable: isMistralAvailable,
      priority: 'high',
    },
    {
      name: 'LLaMA-2 7B',
      generate: getLlamaResponse,
      checkAvailable: isLlamaAvailable,
      priority: 'high',
    },
  ];
  
  // Additional models for comparison (optional based on options)
  const additionalModels = options.includeExternal ? [
    {
      name: 'GPT-3.5',
      generate: getOpenAIResponse,
      checkAvailable: async () => true,
      priority: 'medium',
    },
    {
      name: 'Gemini',
      generate: getGeminiResponse,
      checkAvailable: async () => true,
      priority: 'medium',
    },
    {
      name: 'Grok',
      generate: getGrokResponse,
      checkAvailable: async () => true,
      priority: 'low',
    },
  ] : [];
  
  const allModels = [...coreModels, ...additionalModels];
  
  // Generate responses in parallel
  const responsePromises = allModels.map(async (modelConfig) => {
    try {
      const available = await modelConfig.checkAvailable();
      if (!available) {
        console.log(`⚠️  ${modelConfig.name} not available, skipping`);
        return null;
      }
      
      console.log(`📡 Querying ${modelConfig.name}...`);
      const result = await modelConfig.generate(question, options);
      
      return {
        model: modelConfig.name,
        response: result.response,
        metadata: result.metadata || {},
        priority: modelConfig.priority,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error from ${modelConfig.name}:`, error.message);
      return {
        model: modelConfig.name,
        error: error.message,
        priority: modelConfig.priority,
        timestamp: new Date().toISOString(),
      };
    }
  });
  
  const results = await Promise.all(responsePromises);
  const validResponses = results.filter(r => r && !r.error);
  
  console.log(`✅ Generated ${validResponses.length}/${allModels.length} responses in ${Date.now() - startTime}ms`);
  
  return validResponses;
}

/**
 * Analyze responses from multiple models using the analysis pipeline
 * @param {Array} responses - Model responses
 * @param {string} question - Original question
 * @returns {Promise<Array>} Analyzed responses with pipeline results
 */
export async function analyzeMultiModelResponses(responses, question) {
  console.log(`\n🔬 Analyzing ${responses.length} model responses...`);
  
  const analyzedResponses = await Promise.all(
    responses.map(async (response) => {
      console.log(`  📊 Analyzing ${response.model}...`);
      
      try {
        // Run full analysis pipeline on each response
        const analysis = await executeAnalysisPipeline(
          response.response,
          question,
          { includeExplainability: false } // Skip heavy explainability for speed
        );
        
        return {
          ...response,
          analysis: {
            preprocessing: analysis.preprocessing,
            bias: analysis.biasAnalysis,
            sentiment: analysis.sentimentAnalysis,
            ideology: analysis.ideologicalClassification,
            tone: analysis.toneAnalysis,
            fairness: analysis.fairnessAnalysis,
            summary: analysis.summary,
          },
          pipelineMetadata: analysis.metadata,
        };
      } catch (error) {
        console.error(`❌ Analysis error for ${response.model}:`, error.message);
        return {
          ...response,
          analysisError: error.message,
        };
      }
    })
  );
  
  console.log(`✅ Analysis complete for all models`);
  return analyzedResponses;
}

/**
 * Calculate consensus between model responses
 * @param {Array} analyzedResponses - Responses with analysis
 * @returns {Object} Consensus metrics
 */
export function calculateConsensus(analyzedResponses) {
  if (analyzedResponses.length < 2) {
    return {
      score: 1.0,
      level: 'complete',
      note: 'Only one model response available',
    };
  }
  
  const metrics = {
    sentimentAgreement: 0,
    toneAgreement: 0,
    biasVariance: 0,
    ideologyVariance: 0,
  };
  
  // Extract sentiment classifications
  const sentiments = analyzedResponses
    .filter(r => r.analysis?.sentiment)
    .map(r => r.analysis.sentiment.vaderSentiment?.classification || 'neutral');
  
  // Calculate sentiment agreement
  if (sentiments.length > 0) {
    const sentimentCounts = {};
    sentiments.forEach(s => sentimentCounts[s] = (sentimentCounts[s] || 0) + 1);
    const maxCount = Math.max(...Object.values(sentimentCounts));
    metrics.sentimentAgreement = maxCount / sentiments.length;
  }
  
  // Extract tones
  const tones = analyzedResponses
    .filter(r => r.analysis?.tone)
    .map(r => r.analysis.tone.primary || 'neutral');
  
  // Calculate tone agreement
  if (tones.length > 0) {
    const toneCounts = {};
    tones.forEach(t => toneCounts[t] = (toneCounts[t] || 0) + 1);
    const maxCount = Math.max(...Object.values(toneCounts));
    metrics.toneAgreement = maxCount / tones.length;
  }
  
  // Calculate bias variance
  const biasScores = analyzedResponses
    .filter(r => r.analysis?.bias)
    .map(r => r.analysis.bias.biasScore || 0);
  
  if (biasScores.length > 0) {
    const mean = biasScores.reduce((a, b) => a + b, 0) / biasScores.length;
    const variance = biasScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / biasScores.length;
    metrics.biasVariance = variance;
  }
  
  // Calculate overall consensus score (0-1)
  const consensusScore = (
    metrics.sentimentAgreement * 0.4 +
    metrics.toneAgreement * 0.3 +
    (1 - Math.min(metrics.biasVariance / 10, 1)) * 0.3
  );
  
  // Determine consensus level
  let level = 'low';
  if (consensusScore >= 0.8) level = 'high';
  else if (consensusScore >= 0.6) level = 'medium';
  
  return {
    score: consensusScore,
    level,
    metrics: {
      sentimentAgreement: metrics.sentimentAgreement,
      toneAgreement: metrics.toneAgreement,
      biasVariance: metrics.biasVariance,
    },
    details: {
      sentiments,
      tones,
      biasScores,
    },
  };
}

/**
 * Detect bias across multiple model responses
 * @param {Array} analyzedResponses - Responses with analysis
 * @returns {Object} Aggregated bias analysis
 */
export function detectCrossBias(analyzedResponses) {
  const biasResults = analyzedResponses
    .filter(r => r.analysis?.bias)
    .map(r => ({
      model: r.model,
      biasScore: r.analysis.bias.biasScore,
      detectedBiases: r.analysis.bias.detectedBiases,
    }));
  
  if (biasResults.length === 0) {
    return {
      aggregatedScore: 0,
      level: 'none',
      modelBiases: [],
    };
  }
  
  // Calculate average bias score
  const avgBiasScore = biasResults.reduce((sum, r) => sum + r.biasScore, 0) / biasResults.length;
  
  // Collect all unique bias types
  const allBiasTypes = new Set();
  biasResults.forEach(r => {
    r.detectedBiases.forEach(b => allBiasTypes.add(b.type));
  });
  
  // Determine level
  let level = 'low';
  if (avgBiasScore >= 6) level = 'high';
  else if (avgBiasScore >= 3) level = 'medium';
  
  return {
    aggregatedScore: avgBiasScore,
    level,
    biasTypes: Array.from(allBiasTypes),
    modelBiases: biasResults,
    variance: calculateVariance(biasResults.map(r => r.biasScore)),
  };
}

/**
 * Calculate fairness index across responses
 * @param {Array} analyzedResponses - Responses with analysis
 * @returns {Object} Fairness metrics
 */
export function calculateFairnessIndex(analyzedResponses) {
  const fairnessScores = analyzedResponses
    .filter(r => r.analysis?.fairness)
    .map(r => {
      if (r.analysis.fairness.bias_indicators) {
        return r.analysis.fairness.bias_indicators.overall_fairness_score || 0;
      }
      return 0;
    });
  
  if (fairnessScores.length === 0) {
    return {
      score: 0.8,
      level: 'good',
      note: 'No fairness data available, using baseline',
    };
  }
  
  const avgFairness = fairnessScores.reduce((a, b) => a + b, 0) / fairnessScores.length;
  
  let level = 'poor';
  if (avgFairness >= 0.8) level = 'excellent';
  else if (avgFairness >= 0.7) level = 'good';
  else if (avgFairness >= 0.6) level = 'fair';
  
  return {
    score: avgFairness,
    level,
    modelScores: fairnessScores,
    variance: calculateVariance(fairnessScores),
  };
}

/**
 * Generate meta-summary from all model responses
 * @param {Array} analyzedResponses - Responses with analysis
 * @param {Object} consensus - Consensus analysis
 * @param {Object} bias - Bias analysis
 * @param {Object} fairness - Fairness analysis
 * @returns {Object} Meta-summary
 */
export function generateMetaSummary(analyzedResponses, consensus, bias, fairness) {
  const validResponses = analyzedResponses.filter(r => !r.error && !r.analysisError);
  
  // Extract key themes from all responses
  const allWords = validResponses
    .map(r => r.response.toLowerCase())
    .join(' ')
    .split(/\s+/)
    .filter(w => w.length > 4);
  
  const wordCounts = {};
  allWords.forEach(w => wordCounts[w] = (wordCounts[w] || 0) + 1);
  
  const topWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
  
  // Identify common perspectives
  const perspectives = validResponses.map(r => ({
    model: r.model,
    length: r.response.length,
    sentiment: r.analysis?.sentiment?.vaderSentiment?.classification || 'unknown',
    tone: r.analysis?.tone?.primary || 'unknown',
    biasScore: r.analysis?.bias?.biasScore || 0,
  }));
  
  // Create synthesis
  const synthesis = {
    totalModels: validResponses.length,
    consensusLevel: consensus.level,
    consensusScore: consensus.score,
    biasLevel: bias.level,
    avgBiasScore: bias.aggregatedScore,
    fairnessLevel: fairness.level,
    fairnessScore: fairness.score,
    keyThemes: topWords,
    modelPerspectives: perspectives,
    recommendation: generateRecommendation(consensus, bias, fairness),
  };
  
  return synthesis;
}

/**
 * Generate recommendation based on analysis
 * @param {Object} consensus - Consensus metrics
 * @param {Object} bias - Bias metrics
 * @param {Object} fairness - Fairness metrics
 * @returns {string} Recommendation text
 */
function generateRecommendation(consensus, bias, fairness) {
  const issues = [];
  
  if (consensus.score < 0.6) {
    issues.push('låg konsensus mellan modeller');
  }
  
  if (bias.level === 'high') {
    issues.push('hög bias detekterad');
  }
  
  if (fairness.level === 'poor' || fairness.level === 'fair') {
    issues.push('begränsad rättvisa i perspektiv');
  }
  
  if (issues.length === 0) {
    return 'Svaren visar hög konsensus, låg bias och god rättvisa. Informationen kan användas med förtroende.';
  }
  
  return `Uppmärksamhet krävs: ${issues.join(', ')}. Rekommenderas att granska källorna och söka ytterligare perspektiv.`;
}

/**
 * Calculate variance for array of numbers
 * @param {Array} numbers - Array of numbers
 * @returns {number} Variance
 */
function calculateVariance(numbers) {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
}

/**
 * Execute complete OQT multi-model pipeline
 * @param {string} question - User's question
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Complete pipeline result
 */
export async function executeOQTMultiModelPipeline(question, options = {}) {
  const pipelineStart = Date.now();
  
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║       🚀 OQT-1.0 MULTI-MODEL ANALYSIS PIPELINE v2.0         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  
  // Step 1: Generate responses from all models
  console.log('\n📝 Step 1: Multi-Model Response Generation');
  const rawResponses = await generateMultiModelResponses(question, options);
  
  // Step 2: Analyze all responses
  console.log('\n🔬 Step 2: Pipeline Analysis of Responses');
  const analyzedResponses = await analyzeMultiModelResponses(rawResponses, question);
  
  // Step 3: Calculate consensus
  console.log('\n🤝 Step 3: Consensus Analysis');
  const consensus = calculateConsensus(analyzedResponses);
  console.log(`  Consensus Score: ${(consensus.score * 100).toFixed(1)}% (${consensus.level})`);
  
  // Step 4: Detect cross-model bias
  console.log('\n⚖️  Step 4: Cross-Model Bias Detection');
  const bias = detectCrossBias(analyzedResponses);
  console.log(`  Bias Level: ${bias.level} (score: ${bias.aggregatedScore.toFixed(2)})`);
  
  // Step 5: Calculate fairness
  console.log('\n✅ Step 5: Fairness Assessment');
  const fairness = calculateFairnessIndex(analyzedResponses);
  console.log(`  Fairness Level: ${fairness.level} (score: ${(fairness.score * 100).toFixed(1)}%)`);
  
  // Step 6: Generate meta-summary
  console.log('\n📊 Step 6: Meta-Summary Generation');
  const metaSummary = generateMetaSummary(analyzedResponses, consensus, bias, fairness);
  
  const pipelineEnd = Date.now();
  console.log(`\n✅ Pipeline completed in ${pipelineEnd - pipelineStart}ms`);
  
  return {
    rawResponses,
    analyzedResponses,
    consensus,
    bias,
    fairness,
    metaSummary,
    metadata: {
      question,
      totalModels: rawResponses.length,
      pipelineVersion: '2.0',
      processingTime_ms: pipelineEnd - pipelineStart,
      timestamp: new Date().toISOString(),
    },
  };
}
