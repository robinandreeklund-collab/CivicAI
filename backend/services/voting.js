/**
 * Voting Service
 * Manages battle mode voting
 * 
 * NOTE: In-memory storage for MVP. Replace with database for production.
 */

import { createVote } from '../schemas/vote.js';

// In-memory storage (replace with database in production)
const votes = [];

/**
 * Cast a vote for battle mode
 * @param {string} questionId - The question being voted on
 * @param {string} winnerId - The agent that won
 * @param {string} userId - Optional user identifier
 * @param {string} reason - Optional reason for the vote
 * @returns {object} Created vote
 */
export function castVote(questionId, winnerId, userId = 'anonymous', reason = '') {
  const vote = createVote(questionId, winnerId, userId, reason);
  votes.push(vote);
  return vote;
}

/**
 * Get vote statistics for a specific question
 * @param {string} questionId - The question ID
 * @returns {object} Vote statistics
 */
export function getVoteStats(questionId) {
  const questionVotes = votes.filter(v => v.questionId === questionId);
  
  const stats = {
    total: questionVotes.length,
    byAgent: {
      'gpt-3.5': 0,
      'gemini': 0,
      'deepseek': 0,
    },
  };
  
  questionVotes.forEach(vote => {
    stats.byAgent[vote.winnerId] = (stats.byAgent[vote.winnerId] || 0) + 1;
  });
  
  return stats;
}

/**
 * Get overall voting statistics
 * @returns {object} Overall statistics
 */
export function getOverallVoteStats() {
  const stats = {
    total: votes.length,
    byAgent: {
      'gpt-3.5': 0,
      'gemini': 0,
      'deepseek': 0,
    },
    recentVotes: [],
  };
  
  votes.forEach(vote => {
    stats.byAgent[vote.winnerId] = (stats.byAgent[vote.winnerId] || 0) + 1;
  });
  
  // Get last 10 votes
  stats.recentVotes = [...votes]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
  
  return stats;
}

/**
 * Get all votes with optional filtering
 * @param {object} filters - Optional filters (questionId, winnerId, userId)
 * @param {number} limit - Maximum number of votes to return
 * @param {number} offset - Offset for pagination
 * @returns {object} Filtered votes with pagination info
 */
export function getVotes(filters = {}, limit = 50, offset = 0) {
  let filtered = [...votes];
  
  if (filters.questionId) {
    filtered = filtered.filter(v => v.questionId === filters.questionId);
  }
  
  if (filters.winnerId) {
    filtered = filtered.filter(v => v.winnerId === filters.winnerId);
  }
  
  if (filters.userId) {
    filtered = filtered.filter(v => v.userId === filters.userId);
  }
  
  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply pagination
  const paginated = filtered.slice(offset, offset + limit);
  
  return {
    votes: paginated,
    total: filtered.length,
    limit,
    offset,
  };
}

/**
 * Clear all votes (for testing purposes)
 */
export function clearVotes() {
  votes.length = 0;
}
