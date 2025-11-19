/**
 * Firebase API Routes
 * Handles storing and managing questions in Firebase Firestore
 * Part of Firebase Integration - Step 1
 */

import express from 'express';
import {
  isFirebaseAvailable,
  createQuestion,
  getQuestion,
  updateQuestionStatus,
  listQuestions,
  deleteQuestion
} from '../services/firebaseService.js';
import { createLedgerBlock } from '../services/ledgerService.js';

const router = express.Router();

/**
 * POST /api/firebase/questions
 * Store a new question in Firebase
 */
router.post('/questions', async (req, res) => {
  try {
    // Check if Firebase is available
    if (!isFirebaseAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured or available',
        message: 'Please configure Firebase credentials to use this feature'
      });
    }

    const { question, userId, sessionId } = req.body;

    // Validate request
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Question is required and must be a non-empty string'
      });
    }

    // Create question in Firebase
    const result = await createQuestion({
      question: question.trim(),
      userId,
      sessionId
    });

    // Create ledger block for "Fråga mottagen"
    try {
      await createLedgerBlock({
        eventType: 'data_collection',
        data: {
          description: 'Fråga mottagen',
          question_hash: result.question_hash,
          firebase_doc_id: result.docId,
          timestamp: result.created_at,
          provenance: {
            source: 'chat-v2',
            user_id: userId || 'anonymous',
            session_id: sessionId || 'none'
          }
        }
      });
      console.log('[Firebase API] Ledger block created for question received');
    } catch (ledgerError) {
      console.error('[Firebase API] Failed to create ledger block:', ledgerError);
      // Don't fail the request if ledger fails
    }

    res.json({
      success: true,
      docId: result.docId,
      status: result.status,
      timestamp: result.created_at,
      message: 'Question stored successfully'
    });
  } catch (error) {
    console.error('[Firebase API] Error creating question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store question',
      message: error.message
    });
  }
});

/**
 * GET /api/firebase/questions/:docId
 * Retrieve a specific question by ID
 */
router.get('/questions/:docId', async (req, res) => {
  try {
    if (!isFirebaseAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured or available'
      });
    }

    const { docId } = req.params;

    const result = await getQuestion(docId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Firebase API] Error getting question:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve question',
      message: error.message
    });
  }
});

/**
 * POST /api/firebase/questions/:docId/status
 * Update the status of a question
 */
router.post('/questions/:docId/status', async (req, res) => {
  try {
    if (!isFirebaseAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured or available'
      });
    }

    const { docId } = req.params;
    const { status, analysis, completed_at, verified_at } = req.body;

    // Validate status
    const validStatuses = ['received', 'processing', 'completed', 'ledger_verified', 'error'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Update the question
    const result = await updateQuestionStatus(docId, {
      status,
      analysis,
      completed_at,
      verified_at
    });

    // Create ledger blocks for specific status updates
    if (status === 'completed') {
      try {
        await createLedgerBlock({
          eventType: 'data_collection',
          data: {
            description: 'Analys klar',
            question_hash: result.question_hash,
            firebase_doc_id: docId,
            timestamp: completed_at || new Date().toISOString(),
            analysis_summary: analysis ? {
              hasResults: !!analysis,
              keys: Object.keys(analysis || {})
            } : null
          }
        });
        console.log('[Firebase API] Ledger block created for analysis completed');
      } catch (ledgerError) {
        console.error('[Firebase API] Failed to create ledger block:', ledgerError);
      }
    }

    res.json({
      success: true,
      docId: result.docId,
      status: result.status,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('[Firebase API] Error updating question status:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Question not found',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update status',
      message: error.message
    });
  }
});

/**
 * GET /api/firebase/questions
 * List recent questions (for admin/testing)
 */
router.get('/questions', async (req, res) => {
  try {
    if (!isFirebaseAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured or available'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;

    const results = await listQuestions({ limit, status });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('[Firebase API] Error listing questions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list questions',
      message: error.message
    });
  }
});

/**
 * DELETE /api/firebase/questions/:docId
 * Delete a question (GDPR compliance)
 */
router.delete('/questions/:docId', async (req, res) => {
  try {
    if (!isFirebaseAvailable()) {
      return res.status(503).json({
        success: false,
        error: 'Firebase is not configured or available'
      });
    }

    const { docId } = req.params;

    await deleteQuestion(docId);

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('[Firebase API] Error deleting question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete question',
      message: error.message
    });
  }
});

/**
 * GET /api/firebase/status
 * Check Firebase availability and configuration
 */
router.get('/status', (req, res) => {
  const available = isFirebaseAvailable();
  
  res.json({
    available,
    configured: available,
    message: available 
      ? 'Firebase is configured and ready' 
      : 'Firebase is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.'
  });
});

export default router;
