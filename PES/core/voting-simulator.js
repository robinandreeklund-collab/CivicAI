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
 * @returns {Promise<Object>} Voting results
 */
export async function simulateVoting(question, rounds, participants) {
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
  
  const votes = [];
  
  // Simulate each voter
  for (const voter of voters) {
    try {
      const vote = await simulateSingleVote(voter, question, rounds);
      
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
 * @returns {Promise<Object>} Vote object
 */
async function simulateSingleVote(voterName, question, rounds) {
  // Build voting prompt
  const votingPrompt = buildVotingPrompt(voterName, question, rounds);
  
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
 * @returns {string} Voting prompt
 */
function buildVotingPrompt(voterName, question, rounds) {
  const allResponses = formatAllResponses(rounds);
  
  return `You are simulating how ${voterName} would vote in a debate based on historical voting patterns.

CONTEXT: Analyze this debate and predict how ${voterName} would vote based on typical voting criteria from historical data.

DEBATE QUESTION:
"${question}"

After ${rounds.length} rounds of responses, here are all the final answers from each AI:

${allResponses}

TASK: Predict ${voterName}'s vote by evaluating:
- Accuracy and factual correctness (historically valued by technical AIs)
- Clarity and structure (consistently important)
- Synthesis of different perspectives (especially for ONESEEK evaluation)
- Depth of insight
- Practical relevance
- Balance and objectivity

Based on historical voting patterns, provide the predicted vote as JSON:
{
  "voted_for": "model_name",
  "category": "accuracy|clarity|synthesis|insight|relevance|balance",
  "motivation": "2-3 sentences explaining why this answer would likely receive the vote"
}

Note: Base prediction on quality assessment patterns observed in historical debate data.`;
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
export async function simulateVotingForMultiple(simulations) {
  console.log(`[Voting Simulator] Simulating votes for ${simulations.length} debates...`);
  
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
        sim.metadata?.participants || []
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
