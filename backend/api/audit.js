/**
 * Audit Trail API
 * Endpoints for audit trail management
 */

import express from 'express';
import { 
  getAuditEvents, 
  getAuditStats,
  logAuditEvent,
  AuditEventType 
} from '../services/auditTrail.js';

const router = express.Router();

/**
 * GET /api/audit
 * Get audit events with optional filtering
 */
router.get('/', (req, res) => {
  try {
    const { type, userId, startDate, endDate, limit = 100, offset = 0 } = req.query;
    
    const filters = {};
    if (type) filters.type = type;
    if (userId) filters.userId = userId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const result = getAuditEvents(filters, parseInt(limit), parseInt(offset));
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching audit events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/audit/stats
 * Get audit statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = getAuditStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/audit
 * Manually log an audit event (for frontend events)
 */
router.post('/', (req, res) => {
  try {
    const { type, data, userId = 'anonymous' } = req.body;
    
    if (!type || !Object.values(AuditEventType).includes(type)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Valid event type is required',
      });
    }
    
    const event = logAuditEvent(type, data, userId);
    res.status(201).json(event);
  } catch (error) {
    console.error('Error logging audit event:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
