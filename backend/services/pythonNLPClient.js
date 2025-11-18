/**
 * Python NLP Pipeline Client
 * 
 * This service provides a Node.js interface to the Python NLP Pipeline service
 * which includes advanced ML models like spaCy, Detoxify, BERTopic, etc.
 */

import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_NLP_SERVICE_URL || 'http://localhost:5001';

// Lazy import to avoid circular dependency
let getCachedPythonStatusFn = null;
async function getCachedPythonStatusIfAvailable() {
  if (!getCachedPythonStatusFn) {
    try {
      const healthCache = await import('./healthCache.js');
      getCachedPythonStatusFn = healthCache.getCachedPythonStatus;
    } catch (err) {
      // healthCache not available, use direct calls
      return null;
    }
  }
  return getCachedPythonStatusFn ? getCachedPythonStatusFn() : null;
}

/**
 * Check if Python NLP service is available
 */
export async function isPythonServiceAvailable() {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout: 2000 });
    return response.data.status === 'ok';
  } catch (error) {
    return false;
  }
}

/**
 * Get available models from Python service
 */
export async function getAvailableModels() {
  try {
    const response = await axios.get(`${PYTHON_SERVICE_URL}/health`);
    return response.data.available_models || {};
  } catch (error) {
    console.error('Error checking Python service models:', error.message);
    return {};
  }
}

/**
 * Preprocess text using spaCy
 * - Tokenization with POS tags
 * - Dependency parsing
 * - Named entity recognition
 */
export async function preprocessWithSpacy(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/preprocess`, { text }, { timeout: 5000 });
    console.log('✓ Using Python spaCy for preprocessing');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    // Handle any connection or service errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallback for preprocessing');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ spaCy not available in Python service - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'spaCy not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python preprocessing:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Analyze sentiment using TextBlob
 * - Polarity score
 * - Subjectivity score
 */
export async function analyzeSentimentWithTextBlob(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/sentiment`, { text }, { timeout: 5000 });
    console.log('✓ Using Python TextBlob for sentiment analysis');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallback for sentiment');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ TextBlob not available in Python service - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'TextBlob not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python sentiment analysis:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Detect language using langdetect
 * - Multi-language support
 * - Confidence scores
 */
export async function detectLanguageWithPolyglot(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/detect-language`, { text }, { timeout: 5000 });
    console.log('✓ Using Python langdetect for language detection');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallback for language detection');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ langdetect not available in Python service - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'langdetect not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python language detection:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Detect toxicity using Detoxify
 * - Toxicity score
 * - Severe toxicity
 * - Insults, threats, etc.
 */
export async function detectToxicityWithDetoxify(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/detect-toxicity`, { text }, { timeout: 5000 });
    console.log('✓ Using Python Detoxify for toxicity detection');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallback for toxicity detection');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Detoxify not available in Python service - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'Detoxify not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python toxicity detection:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Classify political ideology using Transformers
 * Now uses KB/bert-base-swedish-cased for Swedish political text analysis
 */
export async function classifyIdeologyWithTransformers(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/classify-ideology`, { text }, { timeout: 10000 });
    console.log('✓ Using Python Transformers (Swedish BERT) for ideology classification');
    return {
      success: true,
      data: response.data,
      usingPython: true,
      usingSwedishBERT: response.data.provenance?.model?.includes('swedish') || false,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallback for ideology classification');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Transformers not available in Python service - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'Transformers not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python ideology classification:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Perform topic modeling using BERTopic
 * Requires multiple texts
 */
export async function topicModelingWithBERTopic(texts) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/topic-modeling`, { texts }, { timeout: 15000 });
    console.log('✓ Using Python BERTopic for topic modeling');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - BERTopic unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ BERTopic not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'BERTopic not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python topic modeling:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Analyze semantic similarity using Gensim
 */
export async function analyzeSemanticSimilarity(texts) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/semantic-similarity`, { texts }, { timeout: 10000 });
    console.log('✓ Using Python Gensim for semantic similarity');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - Gensim unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Gensim not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'Gensim not available - using JavaScript fallback',
      };
    }
    console.error('Error calling Python semantic similarity:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Check Python ML service status (compatibility wrapper)
 * Returns structured status with available models and timestamps
 */
export async function checkPythonML() {
  try {
    const available = await isPythonServiceAvailable();
    const models = available ? await getAvailableModels() : {};
    return {
      status: available,
      available_models: models,
      lastChecked: new Date().toISOString(),
    };
  } catch (err) {
    return {
      status: false,
      available_models: {},
      lastChecked: new Date().toISOString(),
      error: err?.message || String(err),
    };
  }
}

/**
 * Run complete pipeline analysis using all available Python ML tools
 */
export async function runCompletePythonPipeline(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze-complete`, { text }, { timeout: 20000 });
    console.log('✓ Using complete Python ML pipeline');

    // Try to extract models info from python response
    const payload = response.data || {};
    const availableModels = payload.available_models || payload.provenance?.models_used || {};

    // Normalize: if provenance.models_used is an array, set models_attempted = array
    const modelsAttempted = Array.isArray(payload.provenance?.models_used)
      ? payload.provenance.models_used
      : Object.keys(availableModels || {}).length ? Object.keys(availableModels) : [];

    // Infer success/failure: if available_models object present, pick trues as used
    const modelsUsed = Array.isArray(payload.provenance?.models_used)
      ? payload.provenance.models_used
      : Object.entries(availableModels || {}).filter(([k, v]) => v === true).map(([k]) => k);

    const modelsFailed = modelsAttempted.filter(m => !modelsUsed.includes(m));

    return {
      success: true,
      data: payload,
      usingPython: true,
      models_attempted: modelsAttempted,
      models_used: modelsUsed,
      models_failed: modelsFailed,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - using JavaScript fallbacks');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
        models_attempted: [],
        models_used: [],
        models_failed: [],
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Python pipeline not available - using JavaScript fallback');
      return {
        success: false,
        fallback: true,
        error: 'Python pipeline not available - using JavaScript fallback',
        models_attempted: [],
        models_used: [],
        models_failed: [],
      };
    }
    console.error('Error calling Python complete pipeline:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
      models_attempted: [],
      models_used: [],
      models_failed: [],
    };
  }
}

/**
 * Enhanced preprocessing with Python ML tools if available, fallback to JavaScript
 */
export async function enhancedPreprocess(text) {
  // Try Python service first
  const pythonResult = await preprocessWithSpacy(text);
  if (pythonResult.success) {
    return pythonResult.data;
  }
  
  // Fallback to existing JavaScript implementation
  console.log('Using JavaScript preprocessing fallback');
  return null; // Will use existing compromise.js implementation
}

/**
 * Enhanced sentiment analysis with Python ML tools if available
 */
export async function enhancedSentiment(text) {
  const results = {
    textblob: null,
    detoxify: null,
  };
  
  // Try TextBlob
  const textBlobResult = await analyzeSentimentWithTextBlob(text);
  if (textBlobResult.success) {
    results.textblob = textBlobResult.data;
  }
  
  // Try Detoxify
  const detoxifyResult = await detectToxicityWithDetoxify(text);
  if (detoxifyResult.success) {
    results.detoxify = detoxifyResult.data;
  }
  
  return results;
}

/**
 * Explain predictions using SHAP (SHapley Additive exPlanations)
 */
export async function explainWithSHAP(text, model = 'sentiment') {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/explain-shap`, { 
      text,
      model 
    }, { timeout: 15000 });
    console.log('✓ Using Python SHAP for explainability');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - SHAP unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ SHAP not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'SHAP not available',
      };
    }
    console.error('Error calling Python SHAP:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Explain predictions using LIME (Local Interpretable Model-agnostic Explanations)
 */
export async function explainWithLIME(text, model = 'sentiment') {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/explain-lime`, { 
      text,
      model 
    }, { timeout: 15000 });
    console.log('✓ Using Python LIME for explainability');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - LIME unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ LIME not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'LIME not available',
      };
    }
    console.error('Error calling Python LIME:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Perform topic modeling using Gensim LDA
 */
export async function topicModelingWithGensim(textOrTexts) {
  try {
    // Accept both single text and array of texts
    const payload = typeof textOrTexts === 'string' 
      ? { text: textOrTexts, method: 'gensim' }
      : { texts: textOrTexts, method: 'gensim' };
    
    const response = await axios.post(`${PYTHON_SERVICE_URL}/topic-modeling`, payload, { timeout: 20000 });
    console.log('✓ Using Python Gensim for topic modeling');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - Gensim unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Gensim not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'Gensim not available',
      };
    }
    if (error.response?.status === 400) {
      console.log('✗ Gensim topic modeling requires more text');
      return {
        success: false,
        fallback: true,
        error: error.response?.data?.error || 'Text too short for topic modeling',
      };
    }
    console.error('Error calling Python Gensim:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Analyze fairness metrics using Fairlearn
 */
export async function analyzeFairness(predictions, sensitive_features) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/fairness-metrics`, { 
      predictions,
      sensitive_features 
    }, { timeout: 10000 });
    console.log('✓ Using Python Fairlearn for fairness analysis');
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.log('✗ Python service not reachable - Fairlearn unavailable');
      return {
        success: false,
        fallback: true,
        error: 'Python service not reachable',
      };
    }
    if (error.response?.status === 503) {
      console.log('✗ Fairlearn not available in Python service');
      return {
        success: false,
        fallback: true,
        error: 'Fairlearn not available',
      };
    }
    console.error('Error calling Python Fairlearn:', error.message);
    return {
      success: false,
      fallback: true,
      error: error.message,
    };
  }
}

/**
 * Check Python service status and log capabilities
 */
export async function logPythonServiceStatus() {
  // Try to use cached status first to avoid delays on startup
  const cachedStatus = await getCachedPythonStatusIfAvailable();
  
  if (cachedStatus && cachedStatus.status) {
    console.log('🐍 Python NLP Service: AVAILABLE (cached)');
    console.log('   Available models:', JSON.stringify(cachedStatus.available_models, null, 2));
    console.log('   Last checked:', cachedStatus.lastChecked);
    return;
  }
  
  // Fallback to direct check if cache not available
  const available = await isPythonServiceAvailable();
  
  if (available) {
    const models = await getAvailableModels();
    console.log('🐍 Python NLP Service: AVAILABLE');
    console.log('   Available models:', JSON.stringify(models, null, 2));
  } else {
    console.log('🐍 Python NLP Service: NOT AVAILABLE (using JavaScript fallbacks)');
    console.log('   To enable: cd backend/python_services && ./setup.sh && python nlp_pipeline.py');
  }
}

export default {
  isPythonServiceAvailable,
  getAvailableModels,
  preprocessWithSpacy,
  analyzeSentimentWithTextBlob,
  detectLanguageWithPolyglot,
  detectToxicityWithDetoxify,
  classifyIdeologyWithTransformers,
  topicModelingWithBERTopic,
  topicModelingWithGensim,
  analyzeSemanticSimilarity,
  runCompletePythonPipeline,
  enhancedPreprocess,
  enhancedSentiment,
  logPythonServiceStatus,
  checkPythonML,
  explainWithSHAP,
  explainWithLIME,
  analyzeFairness,
};
