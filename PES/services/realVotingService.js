/**
 * PES Phase 3: Real Voting Service
 * 
 * Calls actual external APIs for real voting validation
 * Used sparingly for manual validation only (has API costs)
 */

import { analyzeMotivationVectors } from './vectorAnalysisService.js';

/**
 * Get real votes from external AIs for validation
 * NOTE: This has actual API costs! Use sparingly.
 * 
 * @param {Object} debateData - Debate data
 * @param {string} debateData.question - Debate question
 * @param {Array} debateData.responses - All AI responses
 * @returns {Promise<Array>} Array of real votes with motivations
 */
export async function getRealExternalVotes(debateData) {
  console.log('[Real Voting] Starting real external API voting...');
  console.warn('[Real Voting] WARNING: This will incur API costs (~$0.50-1.00)');
  
  const { question, responses } = debateData;
  
  if (!question || !responses || responses.length === 0) {
    throw new Error('Question and responses are required for real voting');
  }
  
  const voters = ['gpt', 'gemini', 'deepseek', 'grok'];
  const votes = [];
  
  for (const voter of voters) {
    try {
      console.log(`[Real Voting] Calling ${voter}...`);
      
      const votePrompt = constructVotingPrompt(question, responses, voter);
      const response = await callExternalAI(voter, votePrompt);
      
      // Parse vote from response
      const voteData = parseVoteResponse(response, voter);
      
      // Analyze motivation with vector extraction
      const vectorAnalysis = await analyzeMotivationVectors(voteData.motivation);
      
      votes.push({
        voter: voter,
        voted_for: voteData.voted_for,
        motivation: voteData.motivation,
        vector_analysis: vectorAnalysis,
        timestamp: new Date().toISOString(),
        real_api_call: true
      });
      
      console.log(`[Real Voting] ${voter} voted for: ${voteData.voted_for}`);
      
    } catch (error) {
      console.error(`[Real Voting] Error getting vote from ${voter}:`, error.message);
      votes.push({
        voter: voter,
        voted_for: 'Error',
        motivation: `Failed to get vote: ${error.message}`,
        error: true,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  console.log(`[Real Voting] Real voting complete: ${votes.length} votes collected`);
  
  return votes;
}

/**
 * Construct voting prompt for external AI
 * @param {string} question - Debate question
 * @param {Array} responses - All responses
 * @param {string} voterModel - Voter model name
 * @returns {string} Voting prompt
 */
function constructVotingPrompt(question, responses, voterModel) {
  const responseText = responses.map((r, i) => 
    `\n[${r.model || `Model ${i+1}`}]:\n${r.text || r.response || ''}`
  ).join('\n');

  return `You are voting in a debate. Analyze all responses and vote for the best one.

QUESTION: ${question}

RESPONSES:
${responseText}

TASK: Vote for the response that best answers the question. Consider:
- Accuracy and factual correctness
- Clarity and coherence
- Depth of insight
- Practical relevance
- Balance and objectivity

Provide your vote in this format:
VOTE: [model name]
MOTIVATION: [2-3 sentences explaining your choice]`;
}

/**
 * Call external AI API
 * @param {string} model - Model name (gpt, gemini, deepseek, grok)
 * @param {string} prompt - Prompt text
 * @returns {Promise<string>} AI response
 */
async function callExternalAI(model, prompt) {
  // NOTE: Since PES is standalone and backend endpoints require HTTP,
  // we need to either:
  // 1. Import backend services directly (breaks isolation)
  // 2. Make HTTP calls to backend API
  // 3. Duplicate external AI service code
  
  // For Phase 3, we'll use approach 2: HTTP calls to backend API
  // This maintains PES isolation while allowing real validation
  
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  const endpoint = `${backendUrl}/api/external/${model === 'gpt' ? 'openai' : model}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: prompt })
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || data.text || '';
    
  } catch (error) {
    console.error(`[Real Voting] Error calling ${model}:`, error);
    throw new Error(`Failed to call ${model}: ${error.message}`);
  }
}

/**
 * Parse vote from AI response
 * @param {string} response - AI response text
 * @param {string} voterModel - Voter model name
 * @returns {Object} Parsed vote data
 */
function parseVoteResponse(response, voterModel) {
  // Try to extract VOTE: and MOTIVATION: from response
  const voteMatch = response.match(/VOTE:\s*\[?([^\]]+)\]?/i);
  const motivationMatch = response.match(/MOTIVATION:\s*(.+?)(?:\n\n|$)/is);
  
  let votedFor = 'Unknown';
  let motivation = response;
  
  if (voteMatch) {
    votedFor = voteMatch[1].trim();
  } else {
    // Try to find model name mentioned in response
    const modelNames = ['ONESEEK', 'GPT', 'Gemini', 'DeepSeek', 'Grok'];
    for (const name of modelNames) {
      if (response.includes(name)) {
        votedFor = name;
        break;
      }
    }
  }
  
  if (motivationMatch) {
    motivation = motivationMatch[1].trim();
  }
  
  return {
    voted_for: votedFor,
    motivation: motivation
  };
}

/**
 * Estimate cost of real validation
 * @param {number} voterCount - Number of voters
 * @returns {Object} Cost estimate
 */
export function estimateValidationCost(voterCount = 4) {
  // Rough estimates per API call:
  // GPT-4: ~$0.20-0.30
  // Gemini: ~$0.10-0.15
  // DeepSeek: ~$0.05-0.10
  // Grok: ~$0.10-0.15
  // Total: ~$0.45-0.70 per validation
  
  const avgCostPerVoter = 0.15;
  const totalCost = voterCount * avgCostPerVoter;
  
  return {
    voter_count: voterCount,
    cost_per_voter: avgCostPerVoter,
    estimated_total: totalCost,
    currency: 'USD',
    note: 'Approximate cost, actual may vary'
  };
}

/**
 * Check if real validation should be triggered
 * @param {Object} evolutionMetrics - Evolution performance metrics
 * @returns {Object} Recommendation
 */
export function shouldTriggerValidation(evolutionMetrics) {
  const recommendations = {
    should_validate: false,
    reasons: [],
    confidence: 'low'
  };
  
  // Trigger validation if:
  // 1. Low confidence in results
  if (evolutionMetrics.confidence < 0.6) {
    recommendations.should_validate = true;
    recommendations.reasons.push('Low confidence in simulation results');
  }
  
  // 2. High variance in results
  if (evolutionMetrics.variance > 0.3) {
    recommendations.should_validate = true;
    recommendations.reasons.push('High variance in simulation results');
  }
  
  // 3. No recent validations
  const daysSinceLastValidation = evolutionMetrics.days_since_last_validation || 999;
  if (daysSinceLastValidation > 30) {
    recommendations.should_validate = true;
    recommendations.reasons.push('No recent validation (>30 days)');
  }
  
  // 4. Significant performance change
  if (evolutionMetrics.improvement_percentage > 50 || evolutionMetrics.improvement_percentage < -20) {
    recommendations.should_validate = true;
    recommendations.reasons.push('Significant performance change detected');
  }
  
  if (recommendations.should_validate) {
    recommendations.confidence = recommendations.reasons.length >= 2 ? 'high' : 'medium';
  }
  
  return recommendations;
}

export default {
  getRealExternalVotes,
  estimateValidationCost,
  shouldTriggerValidation
};
