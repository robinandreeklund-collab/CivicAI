/**
 * Policy Questions API
 * Endpoints for policy question bank management
 */

import express from 'express';
import { 
  getPolicyQuestions,
  getPolicyQuestionById,
  addPolicyQuestion,
  updatePolicyQuestion,
  deletePolicyQuestion,
  incrementQuestionUsage,
  getCategories,
  getPolicyQuestionStats,
  PolicyCategory
} from '../services/policyQuestions.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';

const router = express.Router();

/**
 * GET /api/policy-questions
 * Get all policy questions with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { category, tags, search, limit = 50, offset = 0 } = req.query;
    
    const filters = {};
    if (category) filters.category = category;
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];
    if (search) filters.search = search;
    
    const result = getPolicyQuestions(filters, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    console.error('Error fetching policy questions:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/policy-questions/categories
 * Get available categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/policy-questions/stats
 * Get policy question statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getPolicyQuestionStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/policy-questions/:id
 * Get a specific policy question by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const question = getPolicyQuestionById(id);
    
    if (!question) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Policy question not found',
      });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error fetching policy question:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/policy-questions
 * Create a new policy question
 */
router.post('/', (req, res) => {
  try {
    const { question, category, description = '', tags = [], userId = 'anonymous' } = req.body;
    
    if (!question || !category) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and category are required',
      });
    }
    
    if (!Object.values(PolicyCategory).includes(category)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Invalid category',
      });
    }
    
    const newQuestion = addPolicyQuestion(question, category, description, tags);
    
    // Log audit event
    logAuditEvent(AuditEventType.POLICY_QUESTION_CREATED, {
      questionId: newQuestion.id,
      question: question.substring(0, 100),
      category,
    }, userId);
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating policy question:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * PUT /api/policy-questions/:id
 * Update a policy question
 */
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { question, category, description, tags, userId = 'anonymous' } = req.body;
    
    const updates = {};
    if (question) updates.question = question;
    if (category) {
      if (!Object.values(PolicyCategory).includes(category)) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Invalid category',
        });
      }
      updates.category = category;
    }
    if (description !== undefined) updates.description = description;
    if (tags) updates.tags = tags;
    
    const updatedQuestion = updatePolicyQuestion(id, updates);
    
    if (!updatedQuestion) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Policy question not found',
      });
    }
    
    // Log audit event
    logAuditEvent(AuditEventType.POLICY_QUESTION_UPDATED, {
      questionId: id,
      updatedFields: Object.keys(updates),
    }, userId);
    
    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating policy question:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/policy-questions/:id
 * Delete a policy question
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { userId = 'anonymous' } = req.body;
    
    const deleted = deletePolicyQuestion(id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Policy question not found',
      });
    }
    
    // Log audit event
    logAuditEvent(AuditEventType.POLICY_QUESTION_DELETED, {
      questionId: id,
    }, userId);
    
    res.json({ success: true, message: 'Policy question deleted' });
  } catch (error) {
    console.error('Error deleting policy question:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/policy-questions/:id/use
 * Increment usage count for a policy question
 */
router.post('/:id/use', (req, res) => {
  try {
    const { id } = req.params;
    const question = incrementQuestionUsage(id);
    
    if (!question) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Policy question not found',
      });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error incrementing usage:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
