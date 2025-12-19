/**
 * PES Phase 2: Voting Simulator
 * 
 * Simulates AI voting based on historical voting patterns and motivations
 * Uses ONESEEK to predict votes based on past behavior
 */

import { generateWithOneseek } from '../services/oneseekService.js';
import { analyzeMotivationVectors } from '../services/vectorAnalysisService.js';

/**
 * Simulate voting for a debate simulation
 * @param {string} question - Debate question
 * @param {Array} rounds - Array of round data with responses
 * @param {Array} participants - List of participant model names
 * @param {Array} historicalDebates - Historical debates for extracting voting patterns
 * @returns {Promise<Object>} Voting results
 */
export async function simulateVoting(question, rounds, participants, historicalDebates = []) {
  console.log('[Voting Simulator] Simulating votes for debate...');
  
  if (!question || !rounds || rounds.length === 0) {
    throw new Error('Question and rounds are required for voting simulation');
  }
  
  // Determine voters (all participants except ONESEEK)
  const voters = (participants || []).filter(p => 
    p !== 'ONESEEK' && !p.toLowerCase().includes('oneseek')
  );
  
  if (voters.length === 0) {
    console.warn('[Voting Simulator] No voters available, using defaults');
    voters.push('GPT-4', 'Gemini', 'DeepSeek', 'Grok');
  }
  
  // Extract historical voting patterns per voter
  const historicalVotingPatterns = extractHistoricalVotingPatterns(historicalDebates, voters);
  
  const votes = [];
  
  // Simulate each voter
  for (const voter of voters) {
    try {
      const historicalData = historicalVotingPatterns[voter] || null;
      const vote = await simulateSingleVote(voter, question, rounds, historicalData);
      
      // PHASE 3: Analyze motivation with vector extraction
      if (vote.motivation && !vote.error) {
        try {
          vote.vector_analysis = await analyzeMotivationVectors(vote.motivation);
          vote.analyzed_at = new Date().toISOString();
        } catch (vectorError) {
          console.warn(`[Voting Simulator] Vector analysis failed for ${voter}:`, vectorError.message);
          // Continue without vector analysis
        }
      }
      
      votes.push(vote);
    } catch (error) {
      console.error(`[Voting Simulator] Error getting vote from ${voter}:`, error.message);
      // Add a default/fallback vote
      votes.push({
        voter: voter,
        voted_for: selectRandomParticipant(participants),
        category: 'unknown',
        motivation: 'Vote simulation failed',
        oneseek_mentioned: false,
        error: true
      });
    }
  }
  
  // Aggregate results
  const results = aggregateVotes(votes, participants);
  
  console.log(`[Voting Simulator] Voting complete: ${results.oneseek_votes} votes for ONESEEK`);
  
  return results;
}

/**
 * Simulate a single AI voter's vote
 * @param {string} voterName - Name of the voting AI
 * @param {string} question - Debate question
 * @param {Array} rounds - Round data
 * @param {Object} historicalVotingData - Historical voting patterns for this voter
 * @returns {Promise<Object>} Vote object
 */
async function simulateSingleVote(voterName, question, rounds, historicalVotingData = null) {
  // Build voting prompt with historical context
  const votingPrompt = buildVotingPrompt(voterName, question, rounds, historicalVotingData);
  
  try {
    // Use ONESEEK to simulate vote based on historical patterns
    const response = await generateWithOneseek(votingPrompt, {
      temperature: 0.3,
      max_tokens: 500
    });
    
    // Parse JSON from ONESEEK response
    let voteData;
    try {
      const jsonMatch = response.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        voteData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn(`[Voting Simulator] Could not parse vote from ${voterName}, using heuristic`);
      voteData = generateHeuristicVote(voterName, rounds);
    }
    
    // Validate and normalize vote
    return {
      voter: voterName,
      voted_for: voteData.voted_for || 'Unknown',
      category: voteData.category || 'general',
      motivation: voteData.motivation || 'No motivation provided',
      oneseek_mentioned: checkOneseekMention(voteData.motivation || ''),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[Voting Simulator] Error parsing vote from ${voterName}:`, error.message);
    throw error;
  }
}

/**
 * Build voting prompt for an AI voter
 * @param {string} voterName - Name of voter
 * @param {string} question - Question
 * @param {Array} rounds - Rounds with responses
 * @param {Object} historicalVotingData - Historical voting patterns for this voter
 * @returns {string} Voting prompt
 */
function buildVotingPrompt(voterName, question, rounds, historicalVotingData = null) {
  const allResponses = formatAllResponses(rounds);
  
  // Build historical context if available
  let historicalContext = '';
  if (historicalVotingData && historicalVotingData.votes && historicalVotingData.votes.length > 0) {
    historicalContext = `
HISTORICAL VOTING PATTERNS FOR ${voterName}:
Based on ${historicalVotingData.votes.length} previous votes, ${voterName} has shown these preferences:

Recent Vote Examples:
${historicalVotingData.votes.slice(0, 3).map(v => `- Voted for ${v.voted_for} because: "${v.motivation}"${v.vector_analysis ? `\n  Vector scores: ${Object.entries(v.vector_analysis).slice(0, 3).map(([k,val]) => `${k}=${val.toFixed(2)}`).join(', ')}` : ''}`).join('\n')}

Voting Tendencies:
- Most valued dimensions: ${historicalVotingData.top_dimensions ? historicalVotingData.top_dimensions.join(', ') : 'synthesis, clarity, insight'}
- Vote distribution: ${historicalVotingData.vote_distribution || 'Varied across models'}
- Consistency pattern: ${historicalVotingData.consistency || 'Moderate'}
`;
  } else {
    historicalContext = `
BASELINE VOTING PROFILE FOR ${voterName}:
Without specific historical data, simulate realistic voting behavior:
- Technical AIs (GPT, DeepSeek) typically value accuracy and depth
- Conversational AIs (Gemini, Grok) often prioritize clarity and engagement
- All models value synthesis and practical relevance
- Votes should reflect genuine quality assessment, not bias toward any model
`;
  }
  
  return `You are simulating how ${voterName} would vote in this debate based on their historical voting patterns and typical evaluation criteria.
${historicalContext}
DEBATE QUESTION:
"${question}"

After ${rounds.length} rounds of responses, here are all the final answers from each AI:

${allResponses}

TASK: Predict ${voterName}'s vote by applying their historical voting patterns to this specific debate.

IMPORTANT REALISM CONSTRAINTS:
1. ONESEEK should NOT receive votes unrealistically - it typically gets 0-2 votes per debate in real data
2. Consider the actual quality of each response, not just synthesis ability
3. Apply historical patterns: if ${voterName} typically values depth, vote for the deepest answer
4. If historical vectors show ${voterName} valued certain dimensions, apply that here
5. Distribution should be realistic: not all voters choose the same model

Provide the predicted vote as JSON:
{
  "voted_for": "model_name",
  "category": "accuracy|clarity|synthesis|insight|relevance|balance",
  "motivation": "2-3 sentences explaining why this answer would receive the vote, reflecting historical voting style"
}

Note: Base prediction on actual response quality AND historical voting behavior patterns.`;
}

/**
 * Generate heuristic vote when ONESEEK response can't be parsed
 * @param {string} voterName - Voter name
 * @param {Array} rounds - Rounds data
 * @returns {Object} Heuristic vote
 */
function generateHeuristicVote(voterName, rounds) {
  // Simple heuristic: vote for longest response with good structure
  const allResponses = [];
  
  rounds.forEach((round) => {
    if (round.external_responses) {
      round.external_responses.forEach(resp => {
        allResponses.push({
          model: resp.model,
          length: (resp.text || '').length,
          hasStructure: (resp.text || '').includes('\n') || (resp.text || '').includes('•')
        });
      });
    }
    if (round.oneseek_response) {
      allResponses.push({
        model: 'ONESEEK',
        length: (round.oneseek_response.text || '').length,
        hasStructure: (round.oneseek_response.text || '').includes('\n')
      });
    }
  });
  
  // Score responses
  const scored = allResponses.map(r => ({
    ...r,
    score: r.length * 0.6 + (r.hasStructure ? 200 : 0)
  }));
  
  // Pick highest score
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0] || { model: 'ONESEEK' };
  
  return {
    voted_for: winner.model,
    category: 'clarity',
    motivation: `Heuristic vote based on response length and structure.`,
    oneseek_mentioned: false
  };
}

/**
 * Format all responses from all rounds for voting
 * @param {Array} rounds - Array of rounds
 * @returns {string} Formatted responses
 */
function formatAllResponses(rounds) {
  const responsesByModel = {};
  
  // Collect all responses per model
  rounds.forEach((round, roundIdx) => {
    // External responses
    if (round.external_responses) {
      round.external_responses.forEach(resp => {
        const model = resp.model || 'Unknown';
        if (!responsesByModel[model]) {
          responsesByModel[model] = [];
        }
        responsesByModel[model].push({
          round: roundIdx + 1,
          text: resp.text
        });
      });
    }
    
    // ONESEEK response
    if (round.oneseek_response) {
      if (!responsesByModel['ONESEEK']) {
        responsesByModel['ONESEEK'] = [];
      }
      responsesByModel['ONESEEK'].push({
        round: roundIdx + 1,
        text: round.oneseek_response.text
      });
    }
  });
  
  // Format for display
  const formatted = [];
  for (const [model, responses] of Object.entries(responsesByModel)) {
    formatted.push(`\n=== ${model} ===`);
    responses.forEach(resp => {
      const text = resp.text || '';
      const truncated = text.length > 600 ? text.substring(0, 600) + '...' : text;
      formatted.push(`Round ${resp.round}: ${truncated}`);
    });
  }
  
  return formatted.join('\n');
}



/**
 * Extract historical voting patterns from past debates
 * @param {Array} historicalDebates - Array of historical debate objects
 * @param {Array} voters - List of voter names
 * @returns {Object} Voting patterns per voter
 */
function extractHistoricalVotingPatterns(historicalDebates, voters) {
  const patterns = {};
  
  if (!historicalDebates || historicalDebates.length === 0) {
    return patterns;
  }
  
  // Initialize patterns for each voter
  voters.forEach(voter => {
    patterns[voter] = {
      votes: [],
      vote_distribution: {},
      top_dimensions: [],
      consistency: 'moderate'
    };
  });
  
  // Extract votes from historical debates
  historicalDebates.forEach(debate => {
    const voteArray = debate.vote_results || debate.votes || [];
    
    voteArray.forEach(vote => {
      const voterKey = voters.find(v => 
        v.toLowerCase() === (vote.voter || '').toLowerCase() ||
        v.toLowerCase().includes((vote.voter || '').toLowerCase())
      );
      
      if (voterKey && patterns[voterKey]) {
        patterns[voterKey].votes.push({
          voted_for: vote.voted_for,
          motivation: vote.motivation || '',
          category: vote.category || 'unknown',
          vector_analysis: vote.vector_analysis || null
        });
        
        // Track vote distribution
        const votedFor = vote.voted_for;
        patterns[voterKey].vote_distribution[votedFor] = 
          (patterns[voterKey].vote_distribution[votedFor] || 0) + 1;
      }
    });
  });
  
  // Analyze patterns for each voter
  voters.forEach(voter => {
    const voterPattern = patterns[voter];
    
    if (voterPattern.votes.length > 0) {
      // Calculate top dimensions from vector analyses
      const dimensionScores = {};
      let vectorCount = 0;
      
      voterPattern.votes.forEach(vote => {
        if (vote.vector_analysis) {
          vectorCount++;
          Object.entries(vote.vector_analysis).forEach(([dim, score]) => {
            if (typeof score === 'number') {
              dimensionScores[dim] = (dimensionScores[dim] || 0) + score;
            }
          });
        }
      });
      
      if (vectorCount > 0) {
        // Average and sort dimensions
        const avgDimensions = Object.entries(dimensionScores)
          .map(([dim, total]) => ({ dim, avg: total / vectorCount }))
          .sort((a, b) => b.avg - a.avg);
        
        voterPattern.top_dimensions = avgDimensions.slice(0, 3).map(d => d.dim);
      }
      
      // Calculate consistency (how often they vote for ONESEEK)
      const oneseekVotes = voterPattern.vote_distribution['ONESEEK'] || 
                          voterPattern.vote_distribution['oneseek'] || 0;
      const totalVotes = voterPattern.votes.length;
      const oneseekRate = oneseekVotes / totalVotes;
      
      if (oneseekRate < 0.15) {
        voterPattern.consistency = 'rarely votes for ONESEEK (realistic)';
      } else if (oneseekRate < 0.35) {
        voterPattern.consistency = 'occasionally votes for ONESEEK';
      } else {
        voterPattern.consistency = 'frequently votes for ONESEEK';
      }
    }
  });
  
  return patterns;
}

/**
 * Check if ONESEEK is mentioned in motivation
 * @param {string} motivation - Vote motivation text
 * @returns {boolean} True if mentioned
 */
function checkOneseekMention(motivation) {
  const lower = (motivation || '').toLowerCase();
  return lower.includes('oneseek');
}

/**
 * Aggregate votes and calculate results
 * @param {Array} votes - Array of vote objects
 * @param {Array} participants - All participants
 * @returns {Object} Aggregated results
 */
function aggregateVotes(votes, participants) {
  const voteCounts = {};
  const votesByCategory = {};
  
  // Initialize counts
  (participants || []).forEach(p => {
    voteCounts[p] = 0;
  });
  
  // Count votes
  votes.forEach(vote => {
    const votedFor = vote.voted_for;
    voteCounts[votedFor] = (voteCounts[votedFor] || 0) + 1;
    
    // Category breakdown
    if (vote.category) {
      if (!votesByCategory[vote.category]) {
        votesByCategory[vote.category] = {};
      }
      votesByCategory[vote.category][votedFor] = 
        (votesByCategory[vote.category][votedFor] || 0) + 1;
    }
  });
  
  // Calculate ONESEEK-specific metrics
  const oneseekVotes = voteCounts['ONESEEK'] || 0;
  const oneseekMentions = votes.filter(v => v.oneseek_mentioned).length;
  
  // Determine winner
  const winner = Object.keys(voteCounts).reduce((a, b) => 
    voteCounts[a] > voteCounts[b] ? a : b
  );
  
  const oneseekWon = winner === 'ONESEEK';
  
  // Calculate ONESEEK vote categories
  const oneseekCategories = {};
  votes.filter(v => v.voted_for === 'ONESEEK').forEach(v => {
    oneseekCategories[v.category] = (oneseekCategories[v.category] || 0) + 1;
  });
  
  return {
    votes: votes,
    vote_counts: voteCounts,
    votes_by_category: votesByCategory,
    oneseek_votes: oneseekVotes,
    oneseek_vote_categories: oneseekCategories,
    oneseek_mentions: oneseekMentions,
    winner: winner,
    oneseek_won: oneseekWon,
    total_votes: votes.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Select a random participant (for fallback)
 * @param {Array} participants - Participant names
 * @returns {string} Random participant
 */
function selectRandomParticipant(participants) {
  if (!participants || participants.length === 0) {
    return 'Unknown';
  }
  return participants[Math.floor(Math.random() * participants.length)];
}

/**
 * Simulate voting for multiple debates
 * @param {Array} simulations - Array of debate simulations
 * @returns {Promise<Array>} Array of voting results
 */
export async function simulateVotingForMultiple(simulations, historicalDebates = []) {
  console.log(`[Voting Simulator] Simulating votes for ${simulations.length} debates...`);
  console.log(`[Voting Simulator] Using ${historicalDebates.length} historical debates for voting patterns`);
  
  const results = [];
  
  for (const sim of simulations) {
    if (!sim.success || !sim.rounds || sim.rounds.length === 0) {
      console.warn(`[Voting Simulator] Skipping invalid simulation for debate ${sim.debate_id}`);
      continue;
    }
    
    try {
      const votingResult = await simulateVoting(
        sim.question,
        sim.rounds,
        sim.metadata?.participants || [],
        historicalDebates  // Pass historical debates for realistic voting simulation
      );
      
      results.push({
        debate_id: sim.debate_id,
        variant_version: sim.variant_version,
        voting: votingResult
      });
    } catch (error) {
      console.error(`[Voting Simulator] Error voting for debate ${sim.debate_id}:`, error.message);
      results.push({
        debate_id: sim.debate_id,
        variant_version: sim.variant_version,
        voting: {
          error: error.message,
          oneseek_votes: 0,
          oneseek_won: false
        }
      });
    }
  }
  
  console.log(`[Voting Simulator] Completed voting for ${results.length} debates`);
  
  return results;
}

export default {
  simulateVoting,
  simulateVotingForMultiple
};
