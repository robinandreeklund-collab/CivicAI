/**
 * Export API
 * Endpoints for exporting conversations to various formats
 */

import express from 'express';
import { 
  generatePDF, 
  generateReadme, 
  generateYAML, 
  generateJSON 
} from '../utils/exportUtils.js';
import { logAuditEvent, AuditEventType } from '../services/auditTrail.js';

const router = express.Router();

/**
 * POST /api/export/pdf
 * Export conversation to PDF
 */
router.post('/pdf', async (req, res) => {
  try {
    const { question, responses, synthesizedSummary, timestamp, userId = 'anonymous' } = req.body;
    
    if (!question || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and responses array are required',
      });
    }
    
    const data = {
      question,
      responses,
      synthesizedSummary,
      timestamp: timestamp || new Date().toISOString(),
    };
    
    const pdfBuffer = await generatePDF(data);
    
    // Log audit event
    logAuditEvent(AuditEventType.EXPORT_PDF, {
      question: question.substring(0, 100),
      responseCount: responses.length,
    }, userId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="civicai-export-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/export/readme
 * Export conversation to README markdown
 */
router.post('/readme', (req, res) => {
  try {
    const { question, responses, synthesizedSummary, timestamp, userId = 'anonymous' } = req.body;
    
    if (!question || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and responses array are required',
      });
    }
    
    const data = {
      question,
      responses,
      synthesizedSummary,
      timestamp: timestamp || new Date().toISOString(),
    };
    
    const readme = generateReadme(data);
    
    // Log audit event
    logAuditEvent(AuditEventType.EXPORT_README, {
      question: question.substring(0, 100),
      responseCount: responses.length,
    }, userId);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="civicai-export-${Date.now()}.md"`);
    res.send(readme);
  } catch (error) {
    console.error('Error generating README:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/export/yaml
 * Export conversation to YAML
 */
router.post('/yaml', (req, res) => {
  try {
    const { question, responses, synthesizedSummary, timestamp, userId = 'anonymous' } = req.body;
    
    if (!question || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and responses array are required',
      });
    }
    
    const data = {
      question,
      responses,
      synthesizedSummary,
      timestamp: timestamp || new Date().toISOString(),
    };
    
    const yaml = generateYAML(data);
    
    // Log audit event
    logAuditEvent(AuditEventType.EXPORT_YAML, {
      question: question.substring(0, 100),
      responseCount: responses.length,
    }, userId);
    
    res.setHeader('Content-Type', 'text/yaml');
    res.setHeader('Content-Disposition', `attachment; filename="civicai-export-${Date.now()}.yaml"`);
    res.send(yaml);
  } catch (error) {
    console.error('Error generating YAML:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/export/json
 * Export conversation to JSON
 */
router.post('/json', (req, res) => {
  try {
    const { question, responses, synthesizedSummary, timestamp, userId = 'anonymous' } = req.body;
    
    if (!question || !responses || !Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'question and responses array are required',
      });
    }
    
    const data = {
      question,
      responses,
      synthesizedSummary,
      timestamp: timestamp || new Date().toISOString(),
    };
    
    const json = generateJSON(data);
    
    // Log audit event
    logAuditEvent(AuditEventType.EXPORT_JSON, {
      question: question.substring(0, 100),
      responseCount: responses.length,
    }, userId);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="civicai-export-${Date.now()}.json"`);
    res.send(json);
  } catch (error) {
    console.error('Error generating JSON:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

export default router;
