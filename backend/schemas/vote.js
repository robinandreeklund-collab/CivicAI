/**
 * Vote Schema
 * Defines the structure for battle mode voting
 */

/**
 * Creates a vote object
 * @param {string} questionId - The question being voted on
 * @param {string} winnerId - The agent that won (gpt-3.5, gemini, deepseek)
 * @param {string} userId - Optional user identifier
 * @param {string} reason - Optional reason for the vote
 * @returns {object} Vote object
 */
export function createVote(questionId, winnerId, userId = 'anonymous', reason = '') {
  return {
    id: `vote-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    questionId,
    winnerId,
    userId,
    reason,
    timestamp: new Date().toISOString(),
  };
}

export const VoteSchema = {
  type: 'object',
  required: ['id', 'questionId', 'winnerId', 'userId', 'timestamp'],
  properties: {
    id: { type: 'string' },
    questionId: { type: 'string' },
    winnerId: { type: 'string', enum: ['gpt-3.5', 'gemini', 'deepseek'] },
    userId: { type: 'string' },
    reason: { type: 'string', maxLength: 500 },
    timestamp: { type: 'string', format: 'date-time' },
  },
};
