/**
 * ML Pipeline API Endpoints
 * 
 * This module provides API endpoints for ML pipeline services including:
 * - SHAP explainability
 * - LIME interpretability
 * - Detoxify toxicity detection
 * - BERTopic topic modeling
 * - Fairlearn fairness metrics
 * 
 * These endpoints are designed to work with the ChatV2 frontend panels
 * and integrate with the Python ML service when available.
 */

import express from 'express';
import * as pythonNLP from '../services/pythonNLPClient.js';

const router = express.Router();

/**
 * POST /ml/shap
 * SHAP explainability analysis
 * 
 * Provides feature importance and model explanations using SHAP values.
 */
router.post('/shap', async (req, res) => {
  try {
    const { text, model = 'sentiment' } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Try to get SHAP analysis from Python service
    const shapResult = await pythonNLP.getShapExplanation(text, model);

    if (shapResult.success) {
      return res.json(shapResult.data);
    }

    // Fallback: Return placeholder data structure
    // TODO: Backend team - implement full SHAP analysis when Python service is unavailable
    console.warn('SHAP analysis not available from Python service, returning placeholder');
    
    return res.json({
      shapValues: [],
      tokens: text.split(/\s+/).slice(0, 10),
      baseValue: 0.0,
      topFeatures: [],
      globalImportance: {},
      visualization: null,
      metadata: {
        model: 'SHAP (fallback)',
        version: '1.0.0',
        explainer_type: 'unavailable',
        note: 'Python ML service not available - placeholder data returned'
      }
    });

  } catch (error) {
    console.error('SHAP endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to generate SHAP explanation',
      message: error.message 
    });
  }
});

/**
 * POST /ml/lime
 * LIME local interpretability
 * 
 * Provides local interpretable model-agnostic explanations.
 */
router.post('/lime', async (req, res) => {
  try {
    const { text, model = 'ideology', num_features = 10, num_samples = 5000 } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Try to get LIME analysis from Python service
    const limeResult = await pythonNLP.getLimeExplanation(text, model, num_features);

    if (limeResult.success) {
      return res.json(limeResult.data);
    }

    // Fallback: Return placeholder data structure
    // TODO: Backend team - implement full LIME analysis when Python service is unavailable
    console.warn('LIME analysis not available from Python service, returning placeholder');
    
    const words = text.split(/\s+/).slice(0, num_features);
    
    return res.json({
      explanation: 'Model explanation not available - Python ML service required',
      weights: words.map((word, idx) => ({
        word,
        weight: 0.0,
        class: 'unknown'
      })),
      prediction: 'unknown',
      confidence: 0.0,
      intercept: 0.0,
      score: 0.0,
      metadata: {
        model: 'LIME (fallback)',
        num_features,
        num_samples,
        note: 'Python ML service not available - placeholder data returned'
      }
    });

  } catch (error) {
    console.error('LIME endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to generate LIME explanation',
      message: error.message 
    });
  }
});

/**
 * POST /ml/toxicity
 * Multi-dimensional toxicity detection using Detoxify
 * 
 * Analyzes text for toxicity, threat, insult, identity attack, obscene, and severe toxicity.
 */
router.post('/toxicity', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Try to get toxicity analysis from Python service
    const toxicityResult = await pythonNLP.detectToxicity(text);

    if (toxicityResult.success) {
      return res.json(toxicityResult.data);
    }

    // Fallback: Return safe/non-toxic placeholder
    // TODO: Backend team - implement toxicity fallback logic when Python service is unavailable
    console.warn('Toxicity detection not available from Python service, returning safe defaults');
    
    return res.json({
      toxicity: 0.0,
      severe_toxicity: 0.0,
      obscene: 0.0,
      threat: 0.0,
      insult: 0.0,
      identity_attack: 0.0,
      sexual_explicit: 0.0,
      overall_toxic: false,
      risk_level: 'unknown',
      metadata: {
        model: 'Detoxify (fallback)',
        version: '1.0.0',
        note: 'Python ML service not available - safe defaults returned'
      }
    });

  } catch (error) {
    console.error('Toxicity endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to detect toxicity',
      message: error.message 
    });
  }
});

/**
 * POST /ml/topics
 * BERTopic topic modeling
 * 
 * Identifies dominant topics and clusters using BERTopic.
 */
router.post('/topics', async (req, res) => {
  try {
    const { text, num_topics = 5 } = req.body;

    if (!text) {
      return res.status(400).json({ 
        error: 'Missing required field: text' 
      });
    }

    // Try to get topic modeling from Python service
    const topicsResult = await pythonNLP.extractTopics(text, num_topics);

    if (topicsResult.success) {
      return res.json(topicsResult.data);
    }

    // Fallback: Return placeholder data structure
    // TODO: Backend team - implement topic modeling fallback when Python service is unavailable
    console.warn('Topic modeling not available from Python service, returning placeholder');
    
    return res.json({
      topics: [],
      num_topics_found: 0,
      outliers: 0.0,
      metadata: {
        model: 'BERTopic (fallback)',
        version: '1.0.0',
        embedding_model: 'unavailable',
        note: 'Python ML service not available - placeholder data returned'
      }
    });

  } catch (error) {
    console.error('Topics endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to extract topics',
      message: error.message 
    });
  }
});

/**
 * POST /ml/fairness
 * Fairlearn fairness metrics and bias analysis
 * 
 * Calculates fairness metrics including demographic parity, equalized odds, and disparate impact.
 */
router.post('/fairness', async (req, res) => {
  try {
    const { predictions, true_labels, sensitive_features, feature_names } = req.body;

    if (!predictions || !sensitive_features) {
      return res.status(400).json({ 
        error: 'Missing required fields: predictions, sensitive_features' 
      });
    }

    // Try to get fairness analysis from Python service
    const fairnessResult = await pythonNLP.analyzeFairness(
      predictions,
      true_labels,
      sensitive_features,
      feature_names
    );

    if (fairnessResult.success) {
      return res.json(fairnessResult.data);
    }

    // Fallback: Return placeholder data structure
    // TODO: Backend team - implement fairness analysis fallback when Python service is unavailable
    console.warn('Fairness analysis not available from Python service, returning placeholder');
    
    return res.json({
      demographicParity: 0.0,
      demographicParityDifference: 0.0,
      equalizedOdds: 0.0,
      disparateImpact: 0.0,
      biasMitigation: 'unknown',
      fairnessViolations: [],
      groupMetrics: {},
      recommendations: ['Python ML service required for fairness analysis'],
      metadata: {
        model: 'Fairlearn (fallback)',
        version: '1.0.0',
        note: 'Python ML service not available - placeholder data returned'
      }
    });

  } catch (error) {
    console.error('Fairness endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze fairness',
      message: error.message 
    });
  }
});

export default router;
