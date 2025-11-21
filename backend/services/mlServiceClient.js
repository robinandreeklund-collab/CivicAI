/**
 * ML Service Client
 * 
 * Client for communicating with the Python ML Inference Service (ml_service/server.py)
 * running on port 5000, which provides Mistral 7B and LLaMA-2 inference
 */

import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';
const ML_SERVICE_TIMEOUT = 120000; // 120 seconds (2 minutes) for model inference on CPU

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
 * Call Mistral 7B inference
 * @param {string} text - Input text
 * @param {Object} options - Inference options
 * @returns {Promise<Object>} Inference result
 */
export async function callMistralInference(text, options = {}) {
  try {
    console.log(`Calling Mistral inference for: "${text.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/inference/mistral`,
      {
        text,
        max_length: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
      },
      { timeout: ML_SERVICE_TIMEOUT }
    );
    
    console.log('✓ Using real Mistral 7B model for inference');
    return {
      success: true,
      data: response.data,
      simulated: false,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✗ ML service not reachable (connection refused) - using simulated Mistral response');
      return {
        success: false,
        error: 'ML service not reachable',
        simulated: true,
      };
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log(`✗ ML service timeout after ${ML_SERVICE_TIMEOUT/1000}s - using simulated Mistral response`);
      return {
        success: false,
        error: 'ML service timeout',
        simulated: true,
      };
    }
    
    console.error('Mistral inference error:', error.response?.data || error.message);
    console.error('Error details:', { code: error.code, status: error.response?.status });
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      simulated: true,
    };
  }
}

/**
 * Call LLaMA-2 inference
 * @param {string} text - Input text
 * @param {Object} options - Inference options
 * @returns {Promise<Object>} Inference result
 */
export async function callLlamaInference(text, options = {}) {
  try {
    console.log(`Calling LLaMA inference for: "${text.substring(0, 50)}..."`);
    
    const response = await axios.post(
      `${ML_SERVICE_URL}/inference/llama`,
      {
        text,
        max_length: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
      },
      { timeout: ML_SERVICE_TIMEOUT }
    );
    
    console.log('✓ Using real LLaMA-2 model for inference');
    return {
      success: true,
      data: response.data,
      simulated: false,
    };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('✗ ML service not reachable (connection refused) - using simulated LLaMA response');
      return {
        success: false,
        error: 'ML service not reachable',
        simulated: true,
      };
    }
    
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      console.log(`✗ ML service timeout after ${ML_SERVICE_TIMEOUT/1000}s - using simulated LLaMA response`);
      return {
        success: false,
        error: 'ML service timeout',
        simulated: true,
      };
    }
    
    console.error('LLaMA inference error:', error.response?.data || error.message);
    console.error('Error details:', { code: error.code, status: error.response?.status });
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      simulated: true,
    };
  }
}

export default {
  isMLServiceAvailable,
  getMLServiceStatus,
  getModelsStatus,
  callMistralInference,
  callLlamaInference,
};
