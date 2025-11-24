/**
 * ML Service Client
 * 
 * Client for communicating with the Python ML Inference Service (ml_service/server.py)
 * running on port 5000, which provides OneSeek-7B-Zero inference
 * 
 * NOTE: All inference now uses the unified OneSeek-7B-Zero model endpoint.
 * Legacy Mistral and LLaMA endpoints have been deprecated.
 */

import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
const ML_SERVICE_TIMEOUT = 120000; // 120 seconds (2 minutes) for model inference

/**
 * Check if ML service is available
 */
export async function isMLServiceAvailable() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 2000 });
    return response.data.status === 'running';
  } catch (error) {
    return false;
  }
}

/**
 * Get ML service status including loaded models
 */
export async function getMLServiceStatus() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/`);
    return {
      available: true,
      data: response.data,
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Get status of loaded models
 */
export async function getModelsStatus() {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/models/status`);
    return {
      available: true,
      data: response.data,
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
    };
  }
}

/**
 * Call OneSeek-7B-Zero inference (primary endpoint)
 * @param {string} text - Input text
 * @param {Object} options - Inference options
 * @returns {Promise<Object>} Inference result
 */
export async function callOneSeekInference(text, options = {}) {
  try {
    console.log(`Calling OneSeek-7B-Zero inference for: "${text.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/inference/oneseek`,
      {
        text,
        max_length: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
      },
      { timeout: ML_SERVICE_TIMEOUT }
    );
    
    console.log('✓ Using OneSeek-7B-Zero model for inference');
    return {
      success: true,
      data: response.data,
      simulated: false,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✗ ML service not reachable (connection refused) - using simulated response');
      return {
        success: false,
        error: 'ML service not reachable',
        simulated: true,
      };
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log(`✗ ML service timeout after ${ML_SERVICE_TIMEOUT/1000}s - using simulated response`);
      return {
        success: false,
        error: 'ML service timeout',
        simulated: true,
      };
    }
    
    console.error('OneSeek inference error:', error.response?.data || error.message);
    console.error('Error details:', { code: error.code, status: error.response?.status });
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      simulated: true,
    };
  }
}

/**
 * Call Mistral 7B inference (DEPRECATED - redirects to OneSeek)
 * @deprecated Use callOneSeekInference instead
 * @param {string} text - Input text
 * @param {Object} options - Inference options
 * @returns {Promise<Object>} Inference result
 */
export async function callMistralInference(text, options = {}) {
  console.log('⚠️ callMistralInference is deprecated - using OneSeek-7B-Zero');
  return callOneSeekInference(text, options);
}

/**
 * Call LLaMA-2 inference (DEPRECATED - redirects to OneSeek)
 * @deprecated Use callOneSeekInference instead
 * @param {string} text - Input text
 * @param {Object} options - Inference options
 * @returns {Promise<Object>} Inference result
 */
export async function callLlamaInference(text, options = {}) {
  console.log('⚠️ callLlamaInference is deprecated - using OneSeek-7B-Zero');
  return callOneSeekInference(text, options);
}

export default {
  isMLServiceAvailable,
  getMLServiceStatus,
  getModelsStatus,
  callOneSeekInference,
  callMistralInference,  // deprecated
  callLlamaInference,    // deprecated
};
