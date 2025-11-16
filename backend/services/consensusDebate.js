/**
 * Consensus Debate Service
 * Manages live debates between AI agents when model synthesis shows high divergence
 * 
 * Flow:
 * 1. Check if divergence exceeds threshold
 * 2. If yes, initiate debate with participating AI agents (max 5)
 * 3. Conduct debate rounds (max 5 rounds per agent)
 * 4. Each agent provides responses and rebuttals
 * 5. After debate, agents vote on best answer (cannot vote for themselves)
 * 6. Determine winner and display results
 */

import { v4 as uuidv4 } from 'uuid';
import { getOpenAIResponse } from './openai.js';
import { getGeminiResponse } from './gemini.js';
import { getDeepSeekResponse } from './deepseek.js';
import { getGrokResponse } from './grok.js';
import { getQwenResponse } from './qwen.js';
import { logAuditEvent, AuditEventType } from './auditTrail.js';
import { executeAnalysisPipeline } from './analysisPipeline.js';

// In-memory storage for debates (replace with database in production)
const debates = new Map();

// Configuration
const DEBATE_CONFIG = {
  maxAgents: 5,
  maxRoundsPerAgent: 5,
  divergenceThreshold: 60, // Percentage - if consensus < 40%, trigger debate
  severityThreshold: 2, // Number of high-severity divergences to trigger debate
};

/**
 * Check if debate should be triggered based on model synthesis
 * @param {object} modelSynthesis - The synthesis result from synthesizeModelResponses
 * @returns {boolean} Whether to trigger debate
 */
export function shouldTriggerDebate(modelSynthesis) {
  if (!modelSynthesis || !modelSynthesis.divergences || !modelSynthesis.consensus) {
    return false;
  }

  const { divergences, consensus } = modelSynthesis;
  
  // Trigger if overall consensus is low (high divergence)
  if (consensus.overallConsensus < DEBATE_CONFIG.divergenceThreshold) {
    return true;
  }
  
  // Or if there are multiple high-severity divergences
  if (divergences.severityCounts && 
      divergences.severityCounts.high >= DEBATE_CONFIG.severityThreshold) {
    return true;
  }
  
  return false;
}

/**
 * Initialize a new consensus debate
 * @param {string} questionId - The original question ID
 * @param {string} question - The original question text
 * @param {Array} agents - Array of agent names participating in debate
 * @param {Array} initialResponses - Initial responses from agents
 * @param {object} modelSynthesis - The synthesis showing divergences
 * @returns {object} Created debate object
 */
export function initiateDebate(questionId, question, agents, initialResponses, modelSynthesis) {
  const debateId = uuidv4();
  
  // Limit to max 5 agents
  const participatingAgents = agents.slice(0, DEBATE_CONFIG.maxAgents);
  
  const debate = {
    id: debateId,
    questionId,
    question,
    participants: participatingAgents,
    initialResponses: initialResponses,
    divergences: modelSynthesis.divergences,
    consensus: modelSynthesis.consensus,
    rounds: [],
    currentRound: 0,
    status: 'initiated',
    votes: [],
    winner: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  debates.set(debateId, debate);
  
  // Log audit event
  logAuditEvent(AuditEventType.ANALYSIS_COMPLETED, {
    eventType: 'debate_initiated',
    debateId,
    questionId,
    participants: participatingAgents,
    reason: `Consensus: ${modelSynthesis.consensus.overallConsensus}%`,
  });
  
  return debate;
}

/**
 * Get AI service function by agent name
 */
function getAIServiceByAgent(agent) {
  const serviceMap = {
    'gpt-3.5': getOpenAIResponse,
    'gemini': getGeminiResponse,
    'deepseek': getDeepSeekResponse,
    'grok': getGrokResponse,
    'qwen': getQwenResponse,
  };
  
  return serviceMap[agent];
}

/**
 * Conduct a single round of debate
 * @param {string} debateId - The debate ID
 * @returns {Promise<object>} Updated debate with new round
 */
export async function conductDebateRound(debateId) {
  const debate = debates.get(debateId);
  
  if (!debate) {
    throw new Error('Debate not found');
  }
  
  if (debate.status === 'completed') {
    throw new Error('Debate already completed');
  }
  
  if (debate.currentRound >= DEBATE_CONFIG.maxRoundsPerAgent) {
    throw new Error('Maximum rounds reached');
  }
  
  const roundNumber = debate.currentRound + 1;
  console.log(`🎯 Conducting debate round ${roundNumber} for debate ${debateId}`);
  
  const round = {
    roundNumber,
    responses: [],
    timestamp: new Date().toISOString(),
  };
  
  // Build context for this round
  const debateContext = buildDebateContext(debate);
  
  // Get responses from all participating agents
  const roundPromises = debate.participants.map(async (agent) => {
    const aiService = getAIServiceByAgent(agent);
    
    if (!aiService) {
      console.error(`AI service not found for agent: ${agent}`);
      return null;
    }
    
    try {
      // Create a debate prompt for this round
      const debatePrompt = createDebatePrompt(
        debate.question,
        agent,
        debateContext,
        roundNumber
      );
      
      const response = await aiService(debatePrompt);
      
      return {
        agent,
        response: response.response,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting response from ${agent}:`, error);
      return {
        agent,
        error: true,
        response: 'Fel: Kunde inte hämta svar för denna runda.',
        timestamp: new Date().toISOString(),
      };
    }
  });
  
  const responses = await Promise.all(roundPromises);
  round.responses = responses.filter(r => r !== null);
  
  debate.rounds.push(round);
  debate.currentRound = roundNumber;
  debate.updatedAt = new Date().toISOString();
  
  // If max rounds reached, mark for voting
  if (roundNumber >= DEBATE_CONFIG.maxRoundsPerAgent) {
    debate.status = 'voting';
  }
  
  debates.set(debateId, debate);
  
  // Log audit event
  logAuditEvent(AuditEventType.ANALYSIS_COMPLETED, {
    eventType: 'debate_round_completed',
    debateId,
    roundNumber,
    participantCount: round.responses.length,
  });
  
  return debate;
}

/**
 * Build debate context from previous rounds
 */
function buildDebateContext(debate) {
  let context = `Original Question: ${debate.question}\n\n`;
  
  context += `Initial Positions:\n`;
  debate.initialResponses.forEach(resp => {
    if (!resp.metadata?.error) {
      // Use raw response only, no analysis
      context += `- ${resp.agent}: ${resp.response.substring(0, 200)}...\n`;
    }
  });
  
  // Remove divergence information - let agents debate based on raw responses only
  
  if (debate.rounds.length > 0) {
    context += `\nPrevious Debate Rounds:\n`;
    debate.rounds.forEach(round => {
      context += `\nRound ${round.roundNumber}:\n`;
      round.responses.forEach(resp => {
        if (!resp.error) {
          context += `- ${resp.agent}: ${resp.response.substring(0, 150)}...\n`;
        }
      });
    });
  }
  
  return context;
}

/**
 * Create debate prompt for an agent
 */
function createDebatePrompt(question, agent, context, roundNumber) {
  return `Du är ${agent} och deltar i en konsensus-debatt om följande fråga:

${question}

DEBATT-KONTEXT:
${context}

Detta är runda ${roundNumber} av max ${DEBATE_CONFIG.maxRoundsPerAgent} rundor.

INSTRUKTIONER:
1. Ge ditt perspektiv på frågan baserat på tidigare diskussion
2. Svara på andra agenters argument om de finns
3. Försök hitta gemensam mark eller förklara varför du har en annan syn
4. Var koncis och fokuserad (max 300 ord)
5. Sträva efter konsensus men stå för din analys

Ditt svar:`;
}

/**
 * Conduct voting among AI agents
 * Each agent votes for the best answer (cannot vote for themselves)
 * @param {string} debateId - The debate ID
 * @returns {Promise<object>} Updated debate with votes
 */
export async function conductDebateVoting(debateId) {
  const debate = debates.get(debateId);
  
  if (!debate) {
    throw new Error('Debate not found');
  }
  
  if (debate.status !== 'voting') {
    throw new Error('Debate is not in voting stage');
  }
  
  console.log(`🗳️ Conducting voting for debate ${debateId}`);
  
  const votes = [];
  
  // Each agent votes for best answer
  const votingPromises = debate.participants.map(async (voter) => {
    const aiService = getAIServiceByAgent(voter);
    
    if (!aiService) {
      return null;
    }
    
    try {
      const votingPrompt = createVotingPrompt(debate, voter);
      const response = await aiService(votingPrompt);
      
      // Parse vote from response
      const vote = parseVote(response.response, voter, debate.participants);
      
      votes.push(vote);
      return vote;
    } catch (error) {
      console.error(`Error getting vote from ${voter}:`, error);
      return null;
    }
  });
  
  await Promise.all(votingPromises);
  
  debate.votes = votes.filter(v => v !== null);
  
  // Calculate winner
  debate.winner = calculateWinner(debate.votes);
  debate.status = 'completed';
  debate.updatedAt = new Date().toISOString();
  
  debates.set(debateId, debate);
  
  // Log audit event
  logAuditEvent(AuditEventType.VOTE_CAST, {
    eventType: 'debate_voting_completed',
    debateId,
    winner: debate.winner,
    voteCount: debate.votes.length,
  });
  
  return debate;
}

/**
 * Create voting prompt for an agent
 */
function createVotingPrompt(debate, voter) {
  let prompt = `Du är ${voter} och ska rösta på bästa svaret i debatten.

ORIGINAL FRÅGA:
${debate.question}

DEBATT-SAMMANFATTNING:
`;
  
  // Include final positions from last round
  if (debate.rounds.length > 0) {
    const lastRound = debate.rounds[debate.rounds.length - 1];
    lastRound.responses.forEach(resp => {
      if (!resp.error && resp.agent !== voter) {
        prompt += `\n${resp.agent}:\n${resp.response}\n`;
      }
    });
  }
  
  const otherAgents = debate.participants.filter(a => a !== voter);
  
  prompt += `\n\nINSTRUKTIONER:
1. Rösta på det svar du tycker är bäst (du får INTE rösta på ditt eget svar)
2. Basera ditt val på: noggrannhet, klarhet, fullständighet och användbarhet
3. Svara ENDAST med namnet på den agent du röstar på: ${otherAgents.join(', ')}
4. Ge en kort motivering (1-2 meningar)

Format:
RÖST: [agent-namn]
MOTIVERING: [din motivering]

Ditt svar:`;
  
  return prompt;
}

/**
 * Parse vote from AI response
 */
function parseVote(responseText, voter, participants) {
  // Try to extract vote using different patterns
  const voteMatch = responseText.match(/RÖST:\s*([a-z0-9\-\.]+)/i) ||
                    responseText.match(/röstar på\s*([a-z0-9\-\.]+)/i) ||
                    responseText.match(/väljer\s*([a-z0-9\-\.]+)/i);
  
  let votedFor = null;
  
  if (voteMatch) {
    const candidate = voteMatch[1].toLowerCase().trim();
    // Validate it's a valid participant and not self
    if (participants.includes(candidate) && candidate !== voter) {
      votedFor = candidate;
    }
  }
  
  // If no valid vote found, try to find any participant name mentioned
  if (!votedFor) {
    for (const participant of participants) {
      if (participant !== voter && 
          responseText.toLowerCase().includes(participant)) {
        votedFor = participant;
        break;
      }
    }
  }
  
  // Extract reasoning
  const reasoningMatch = responseText.match(/MOTIVERING:\s*(.+?)(?:\n|$)/i);
  const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 
                   responseText.substring(0, 200);
  
  return {
    voter,
    votedFor,
    reasoning,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate winner from votes
 */
function calculateWinner(votes) {
  const voteCounts = {};
  
  votes.forEach(vote => {
    if (vote.votedFor) {
      voteCounts[vote.votedFor] = (voteCounts[vote.votedFor] || 0) + 1;
    }
  });
  
  // Find agent with most votes
  let winner = null;
  let maxVotes = 0;
  
  Object.entries(voteCounts).forEach(([agent, count]) => {
    if (count > maxVotes) {
      maxVotes = count;
      winner = agent;
    }
  });
  
  return {
    agent: winner,
    voteCount: maxVotes,
    voteCounts,
  };
}

/**
 * Get debate by ID
 */
export function getDebate(debateId) {
  return debates.get(debateId);
}

/**
 * Get all debates
 */
export function getAllDebates() {
  return Array.from(debates.values());
}

/**
 * Get debates for a specific question
 */
export function getDebatesByQuestion(questionId) {
  return Array.from(debates.values()).filter(d => d.questionId === questionId);
}

/**
 * Get debate configuration
 */
export function getDebateConfig() {
  return { ...DEBATE_CONFIG };
}

/**
 * Get the winning answer from the last round and analyze it
 * @param {string} debateId - The debate ID
 * @returns {Promise<object>} Winning response with full analysis
 */
export async function analyzeWinningAnswer(debateId) {
  const debate = debates.get(debateId);
  
  if (!debate) {
    throw new Error('Debate not found');
  }
  
  if (debate.status !== 'completed' || !debate.winner) {
    throw new Error('Debate not completed or no winner determined');
  }
  
  console.log(`🔬 Analyzing winning answer from ${debate.winner.agent}...`);
  
  // Find the winning agent's last response
  const lastRound = debate.rounds[debate.rounds.length - 1];
  const winningResponse = lastRound.responses.find(r => r.agent === debate.winner.agent);
  
  if (!winningResponse || winningResponse.error) {
    throw new Error('Winning response not found or has error');
  }
  
  // Run complete analysis pipeline on the winning answer
  const pipelineAnalysis = await executeAnalysisPipeline(
    winningResponse.response, 
    debate.question, 
    { includeEnhancedNLP: true }
  );
  
  // Store analysis with the debate
  debate.winningAnalysis = {
    agent: debate.winner.agent,
    response: winningResponse.response,
    pipelineAnalysis: pipelineAnalysis,
    analyzedAt: new Date().toISOString(),
  };
  
  debates.set(debateId, debate);
  
  // Log audit event
  logAuditEvent(AuditEventType.ANALYSIS_COMPLETED, {
    eventType: 'debate_winner_analyzed',
    debateId,
    winningAgent: debate.winner.agent,
  });
  
  return debate.winningAnalysis;
}
