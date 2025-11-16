/**
 * Python NLP Pipeline Client
 * 
 * This service provides a Node.js interface to the Python NLP Pipeline service
 * which includes advanced ML models like spaCy, Detoxify, BERTopic, etc.
 */

import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_NLP_SERVICE_URL || 'http://localhost:5001';

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
    const response = await axios.post(`${PYTHON_SERVICE_URL}/preprocess`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'spaCy not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Analyze sentiment using TextBlob
 * - Polarity score
 * - Subjectivity score
 */
export async function analyzeSentimentWithTextBlob(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/sentiment`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'TextBlob not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Detect language using Polyglot
 * - Multi-language support
 * - Confidence scores
 */
export async function detectLanguageWithPolyglot(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/detect-language`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'Polyglot not available - using JavaScript fallback',
      };
    }
    throw error;
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
    const response = await axios.post(`${PYTHON_SERVICE_URL}/detect-toxicity`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'Detoxify not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Classify political ideology using Transformers
 * Now uses KB/bert-base-swedish-cased for Swedish political text analysis
 */
export async function classifyIdeologyWithTransformers(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/classify-ideology`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
      usingSwedishBERT: response.data.provenance?.model?.includes('swedish') || false,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'Transformers not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Perform topic modeling using BERTopic
 * Requires multiple texts
 */
export async function topicModelingWithBERTopic(texts) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/topic-modeling`, { texts });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'BERTopic not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Analyze semantic similarity using Gensim
 */
export async function analyzeSemanticSimilarity(texts) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/semantic-similarity`, { texts });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'Gensim not available - using JavaScript fallback',
      };
    }
    throw error;
  }
}

/**
 * Run complete pipeline analysis using all available Python ML tools
 */
export async function runCompletePythonPipeline(text) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/analyze-complete`, { text });
    return {
      success: true,
      data: response.data,
      usingPython: true,
    };
  } catch (error) {
    if (error.response?.status === 503) {
      return {
        success: false,
        fallback: true,
        error: 'Python pipeline not available - using JavaScript fallback',
      };
    }
    throw error;
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
 * Check Python service status and log capabilities
 */
export async function logPythonServiceStatus() {
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
  analyzeSemanticSimilarity,
  runCompletePythonPipeline,
  enhancedPreprocess,
  enhancedSentiment,
  logPythonServiceStatus,
};
