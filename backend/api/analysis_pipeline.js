/**
 * Analysis Pipeline API Router
 * 
 * Provides endpoints for:
 * - Complete analysis pipeline execution
 * - Pipeline timeline visualization
 * - Multi-dimensional analysis results
 * - Analysis transparency and audit trail
 */

import express from 'express';
import { executeAnalysisPipeline, executeBatchAnalysisPipeline } from '../services/analysisPipeline.js';

const router = express.Router();

/**
 * POST /api/analysis-pipeline/analyze
 * Execute the complete analysis pipeline on a single text
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, question, options } = req.body;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Text is required and must be a non-empty string',
      });
    }

    console.log(`📊 Executing analysis pipeline for text (${text.length} characters)`);

    const result = await executeAnalysisPipeline(text, question || '', options || {});

    res.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in analysis pipeline:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * POST /api/analysis-pipeline/batch
 * Execute the analysis pipeline on multiple texts
 */
router.post('/batch', async (req, res) => {
  try {
    const { texts, question, options } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Texts must be a non-empty array',
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Maximum 10 texts allowed per batch request',
      });
    }

    console.log(`📊 Executing batch analysis pipeline for ${texts.length} texts`);

    const results = await executeBatchAnalysisPipeline(texts, question || '', options || {});

    res.json({
      success: true,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in batch analysis pipeline:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/analysis-pipeline/timeline/:id
 * Get analysis timeline for a specific analysis (placeholder for future implementation)
 */
router.get('/timeline/:id', async (req, res) => {
  try {
    // This is a placeholder for future implementation
    // In a real system, this would fetch stored analysis results from a database
    res.json({
      message: 'Timeline endpoint - not yet implemented',
      note: 'Analysis results are currently returned directly from the /analyze endpoint',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
});

/**
 * GET /api/analysis-pipeline/info
 * Get information about the analysis pipeline
 */
router.get('/info', (req, res) => {
  res.json({
    name: 'CivicAI Analysis Pipeline',
    version: '1.0.0',
    description: 'Comprehensive text analysis pipeline with preprocessing, bias detection, sentiment analysis, ideological classification, and transparency tracking',
    components: [
      {
        name: 'Text Preprocessing',
        version: '1.0.0',
        features: ['Tokenization', 'POS-tagging', 'Subjectivity filtering', 'Noise reduction', 'Loaded expression detection'],
      },
      {
        name: 'Bias Detection',
        version: '1.0.0',
        features: ['Political bias', 'Commercial bias', 'Cultural bias', 'Confirmation bias', 'Recency bias', 'Per-sentence analysis'],
      },
      {
        name: 'Sentiment Analysis',
        version: '1.0.0',
        features: ['VADER sentiment scores', 'Sarcasm detection', 'Aggression detection', 'Empathy detection'],
      },
      {
        name: 'Ideological Classification',
        version: '1.0.0',
        features: ['Left-right-center scoring', 'Economic dimension', 'Social dimension', 'Authority dimension', 'Party alignment suggestions'],
      },
      {
        name: 'Tone Analysis',
        version: '1.0.0',
        features: ['Tone classification', 'Confidence scoring', 'Characteristic detection'],
      },
      {
        name: 'Fact Checking',
        version: '1.0.0',
        features: ['Verifiable claim detection', 'Claim categorization', 'Verification recommendations'],
      },
    ],
    transparency: {
      timeline: 'Full timeline of analysis steps with timestamps',
      provenance: 'Every datapoint includes model, version, method, and timestamp',
      auditTrail: 'Complete audit trail of all processing steps',
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
