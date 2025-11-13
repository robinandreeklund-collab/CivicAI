/**
 * Voting API
 * Endpoints for battle mode voting
 */

import express from 'express';
import { 
  castVote, 
  getVoteStats, 
  getOverallVoteStats,
  getVotes 
} from '../services/voting.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';

const router = express.Router();

/**
 * POST /api/votes
 * Cast a vote for battle mode
 */
router.post('/', (req, res) => {
  try {
    const { questionId, winnerId, userId = 'anonymous', reason = '' } = req.body;
    
    if (!questionId || !winnerId) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'questionId and winnerId are required',
      });
    }
    
    const validAgents = ['gpt-3.5', 'gemini', 'deepseek'];
    if (!validAgents.includes(winnerId)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'winnerId must be one of: gpt-3.5, gemini, deepseek',
      });
    }
    
    const vote = castVote(questionId, winnerId, userId, reason);
    
    // Log audit event
    logAuditEvent(AuditEventType.VOTE_CAST, {
      voteId: vote.id,
      questionId,
      winnerId,
      reason: reason ? 'Reason provided' : 'No reason',
    }, userId);
    
    res.status(201).json(vote);
  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/votes/stats/:questionId
 * Get vote statistics for a specific question
 */
router.get('/stats/:questionId', (req, res) => {
  try {
    const { questionId } = req.params;
    const stats = getVoteStats(questionId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching vote stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/votes/stats
 * Get overall vote statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getOverallVoteStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching overall vote stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/votes
 * Get all votes with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { questionId, winnerId, userId, limit = 50, offset = 0 } = req.query;
    
    const filters = {};
    if (questionId) filters.questionId = questionId;
    if (winnerId) filters.winnerId = winnerId;
    if (userId) filters.userId = userId;
    
    const result = getVotes(filters, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
