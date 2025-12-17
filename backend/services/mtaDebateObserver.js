/**
 * MTA-Debate-Observer (MTA-DO) Service
 * Meta-Transparency Analysis for Debate Observation
 * 
 * Purpose:
 * - Provides real-time, non-intrusive analysis of debate responses
 * - Evaluates responses across 8 dimensions for transparency and meta-awareness
 * - Runs in parallel to maintain zero impact on debate timing
 * - Outputs structured JSON for downstream use by ONESEEK and other components
 * 
 * Version: 1.0.0
 */

import { getOpenAIResponse } from './openai.js';

// MTA-DO Configuration
const MTA_CONFIG = {
  dimensions: [
    { name: 'relevance', weight: 1.0, inverse: false },
    { name: 'argument_depth', weight: 1.2, inverse: false },
    { name: 'factual_anchoring', weight: 1.3, inverse: false },
    { name: 'bias_detection', weight: 1.1, inverse: true },
    { name: 'logical_coherence', weight: 1.0, inverse: false },
    { name: 'originality', weight: 0.8, inverse: false },
    { name: 'clarity', weight: 0.9, inverse: false },
    { name: 'constructiveness', weight: 1.0, inverse: false },
  ],
  timeout: 10000, // 10 seconds max
  parallelExecution: true,
  maxResponseTextLength: 500, // Maximum length for stored response text
};

/**
 * Analyze a debate response using MTA-DO evaluation
 * @param {string} agentName - Name of the agent (e.g., "gpt-3.5", "gemini")
 * @param {number} roundNum - Current round number
 * @param {string} response - The response text to analyze
 * @param {string} question - The original debate question
 * @returns {Promise<object>} MTA analysis result
 */
export async function analyzeMTADebateResponse(agentName, roundNum, response, question) {
  const startTime = Date.now();
  
  try {
    // Create MTA analysis prompt
    const prompt = createMTAAnalysisPrompt(agentName, roundNum, response, question);
    
    // Get analysis from AI (with timeout)
    const analysisPromise = getOpenAIResponse(prompt);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MTA analysis timeout')), MTA_CONFIG.timeout)
    );
    
    const result = await Promise.race([analysisPromise, timeoutPromise]);
    
    // Parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (handle cases where AI adds text before/after JSON)
      // Use a more precise extraction: find first { and matching }
      let jsonStart = result.response.indexOf('{');
      if (jsonStart === -1) {
        throw new Error('No JSON found in response');
      }
      
      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < result.response.length; i++) {
        if (result.response[i] === '{') braceCount++;
        if (result.response[i] === '}') braceCount--;
        if (braceCount === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
      
      if (jsonEnd === -1) {
        throw new Error('Malformed JSON in response');
      }
      
      const jsonStr = result.response.substring(jsonStart, jsonEnd);
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('❌ Failed to parse MTA analysis JSON:', parseError);
      // Return fallback analysis directly
      return createFallbackAnalysis(agentName, roundNum, response);
    }
    
    // Validate and enrich the analysis
    const enrichedAnalysis = enrichAnalysis(analysis, agentName, roundNum, response);
    
    const duration = Date.now() - startTime;
    console.log(`✅ MTA analysis completed for ${agentName} (Round ${roundNum}) in ${duration}ms`);
    
    return enrichedAnalysis;
  } catch (error) {
    console.error(`❌ MTA analysis failed for ${agentName}:`, error);
    // Return fallback analysis on error
    return createFallbackAnalysis(agentName, roundNum, response);
  }
}

/**
 * Create the MTA analysis prompt
 */
function createMTAAnalysisPrompt(agentName, roundNum, response, question) {
  return `You are the MTA-Debate-Observer, an objective meta-analysis system evaluating debate responses.

CONTEXT:
- Agent: ${agentName}
- Round: ${roundNum}
- Question: ${question}
- Response: ${response}

TASK:
Evaluate the response across 8 dimensions using a 0-10 scale. Provide both a numerical score and brief reasoning for each.

DIMENSIONS:
1. Relevance (0-10): How well does the response address the debate question?
2. Argument Depth (0-10): Depth and sophistication of argumentation
3. Factual Anchoring (0-10): Use of facts, data, and verifiable information
4. Bias Detection (0-10): Presence of bias (0=unbiased, 10=highly biased)
5. Logical Coherence (0-10): Internal consistency and logical flow
6. Originality (0-10): Novel insights and unique perspectives
7. Clarity (0-10): Communication clarity and accessibility
8. Constructiveness (0-10): Contribution to productive dialogue

Respond ONLY with valid JSON in this exact structure:
{
  "analysis": {
    "relevance": { "score": 0.0, "reasoning": "" },
    "argument_depth": { "score": 0.0, "reasoning": "" },
    "factual_anchoring": { "score": 0.0, "reasoning": "" },
    "bias_detection": { "score": 0.0, "reasoning": "" },
    "logical_coherence": { "score": 0.0, "reasoning": "" },
    "originality": { "score": 0.0, "reasoning": "" },
    "clarity": { "score": 0.0, "reasoning": "" },
    "constructiveness": { "score": 0.0, "reasoning": "" }
  },
  "summary": {
    "strengths": [],
    "weaknesses": [],
    "key_insights": []
  }
}`;
}

/**
 * Enrich the analysis with metadata and calculated scores
 */
function enrichAnalysis(analysis, agentName, roundNum, responseText) {
  // Calculate overall and weighted scores
  let totalScore = 0;
  let weightedScore = 0;
  let totalWeight = 0;
  
  MTA_CONFIG.dimensions.forEach(dim => {
    const dimAnalysis = analysis.analysis?.[dim.name];
    if (dimAnalysis && typeof dimAnalysis.score === 'number') {
      const score = Math.max(0, Math.min(10, dimAnalysis.score)); // Clamp to 0-10
      const adjustedScore = dim.inverse ? (10 - score) : score;
      
      totalScore += score;
      weightedScore += adjustedScore * dim.weight;
      totalWeight += dim.weight;
    }
  });
  
  const overallScore = totalScore / MTA_CONFIG.dimensions.length;
  const finalWeightedScore = weightedScore / totalWeight;
  
  const maxLen = MTA_CONFIG.maxResponseTextLength;
  return {
    agent_name: agentName,
    round_number: roundNum,
    timestamp: new Date().toISOString(),
    response_text: responseText.substring(0, maxLen) + (responseText.length > maxLen ? '...' : ''),
    analysis: analysis.analysis || {},
    summary: {
      overall_score: parseFloat(overallScore.toFixed(2)),
      weighted_score: parseFloat(finalWeightedScore.toFixed(2)),
      strengths: analysis.summary?.strengths || [],
      weaknesses: analysis.summary?.weaknesses || [],
      key_insights: analysis.summary?.key_insights || [],
    },
  };
}

/**
 * Create a fallback analysis when MTA analysis fails
 */
function createFallbackAnalysis(agentName, roundNum, responseText) {
  console.warn(`⚠️  Using fallback MTA analysis for ${agentName}`);
  
  const maxLen = MTA_CONFIG.maxResponseTextLength;
  return {
    agent_name: agentName,
    round_number: roundNum,
    timestamp: new Date().toISOString(),
    response_text: responseText.substring(0, maxLen) + (responseText.length > maxLen ? '...' : ''),
    analysis: {
      relevance: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
      argument_depth: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
      factual_anchoring: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
      bias_detection: { score: 5.0, reasoning: 'Fallback analysis - unable to evaluate' },
      logical_coherence: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
      originality: { score: 6.0, reasoning: 'Fallback analysis - unable to evaluate' },
      clarity: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
      constructiveness: { score: 7.0, reasoning: 'Fallback analysis - unable to evaluate' },
    },
    summary: {
      overall_score: 6.7,
      weighted_score: 6.7,
      strengths: ['Analysis temporarily unavailable'],
      weaknesses: ['Unable to provide detailed evaluation'],
      key_insights: ['MTA analysis failed - using fallback scores'],
    },
    fallback: true,
  };
}

/**
 * Generate ONESEEK commentary based on MTA analysis
 * @param {string} agentName - Name of the agent
 * @param {number} roundNum - Current round number
 * @param {string} response - The response text
 * @param {object} mtaAnalysis - The MTA analysis object
 * @param {array} allMTAAnalyses - All MTA analyses so far
 * @returns {Promise<string>} Commentary text
 */
export async function generateMTACommentary(agentName, roundNum, response, mtaAnalysis, allMTAAnalyses = []) {
  try {
    const prompt = createCommentaryPrompt(agentName, roundNum, response, mtaAnalysis, allMTAAnalyses);
    const result = await getOpenAIResponse(prompt);
    return result.response;
  } catch (error) {
    console.error('❌ Failed to generate MTA commentary:', error);
    return `Intressant perspektiv från ${agentName}. Svaret visar en poäng på ${mtaAnalysis.summary.weighted_score}/10.`;
  }
}

/**
 * Create commentary prompt
 */
function createCommentaryPrompt(agentName, roundNum, response, mtaAnalysis, allMTAAnalyses) {
  const formattedAnalyses = formatMTAAnalyses(allMTAAnalyses);
  
  return `You are ONESEEK providing meta-commentary on the debate.

CONTEXT:
- Agent: ${agentName}
- Round: ${roundNum}
- Response: ${response.substring(0, 300)}...
- MTA Score: ${mtaAnalysis.summary.weighted_score}/10
- Strengths: ${mtaAnalysis.summary.strengths.join(', ')}
- Weaknesses: ${mtaAnalysis.summary.weaknesses.join(', ')}

PREVIOUS ANALYSES:
${formattedAnalyses}

TASK:
Provide a brief, insightful commentary (2-3 sentences) that:
1. Acknowledges the response quality based on MTA scores
2. Highlights key strengths or concerns from the analysis
3. Contextualizes within the broader debate flow

Be neutral, constructive, and transparent about the analysis. Write in Swedish.`;
}

/**
 * Generate synthesis insight based on all MTA analyses
 * @param {number} roundNum - Current round number
 * @param {array} allMTAAnalyses - All MTA analyses
 * @returns {Promise<string>} Insight text with 💡
 */
export async function generateMTAInsight(roundNum, allMTAAnalyses) {
  try {
    const prompt = createInsightPrompt(roundNum, allMTAAnalyses);
    const result = await getOpenAIResponse(prompt);
    return `💡 ${result.response}`;
  } catch (error) {
    console.error('❌ Failed to generate MTA insight:', error);
    const avgScore = allMTAAnalyses.reduce((sum, a) => sum + a.summary.weighted_score, 0) / allMTAAnalyses.length;
    return `💡 Genomsnittlig kvalitet i denna runda: ${avgScore.toFixed(1)}/10`;
  }
}

/**
 * Create insight prompt
 */
function createInsightPrompt(roundNum, allMTAAnalyses) {
  const formattedAnalyses = formatMTAAnalyses(allMTAAnalyses);
  
  return `You are ONESEEK generating a synthesis insight (💡) for the current debate state.

CONTEXT:
- Round: ${roundNum}
- Number of responses analyzed: ${allMTAAnalyses.length}

ALL MTA ANALYSES:
${formattedAnalyses}

TASK:
Generate a brief insight (1-2 sentences) that:
1. Synthesizes patterns across all responses
2. Identifies emerging consensus or divergences
3. Highlights the most valuable contributions

Be concise yet illuminating. Write in Swedish. Do NOT include the 💡 emoji (it will be added automatically).`;
}

/**
 * Format MTA analyses for use in prompts
 */
function formatMTAAnalyses(analyses) {
  if (!analyses || analyses.length === 0) {
    return 'Inga tidigare analyser tillgängliga.';
  }
  
  return analyses.map(a => 
    `${a.agent_name} (Round ${a.round_number}): ${a.summary.weighted_score}/10 - ${a.summary.key_insights.join('; ')}`
  ).join('\n');
}

/**
 * Batch analyze multiple responses in parallel
 * @param {array} responses - Array of {agentName, roundNum, response, question}
 * @returns {Promise<array>} Array of MTA analyses
 */
export async function batchAnalyzeMTAResponses(responses) {
  console.log(`🔄 Starting batch MTA analysis for ${responses.length} responses`);
  
  const analysisPromises = responses.map(({ agentName, roundNum, response, question }) => 
    analyzeMTADebateResponse(agentName, roundNum, response, question)
  );
  
  const results = await Promise.allSettled(analysisPromises);
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`❌ MTA analysis failed for ${responses[index].agentName}:`, result.reason);
      return createFallbackAnalysis(
        responses[index].agentName,
        responses[index].roundNum,
        responses[index].response
      );
    }
  });
}

export default {
  analyzeMTADebateResponse,
  generateMTACommentary,
  generateMTAInsight,
  batchAnalyzeMTAResponses,
  MTA_CONFIG,
};
