/**
 * CivicAI Frontend Configuration
 * Handles backend routing for GGUF vs .bin models
 */

// Backend selection from environment variable
// Can be 'gguf' or 'bin'
const rawBackend = import.meta.env.VITE_MODEL_BACKEND || 'bin';

// Validate MODEL_BACKEND value
if (rawBackend !== 'gguf' && rawBackend !== 'bin') {
  console.error(`[Config] Invalid MODEL_BACKEND: "${rawBackend}". Must be 'gguf' or 'bin'. Defaulting to 'bin'.`);
  throw new Error(`Invalid MODEL_BACKEND: "${rawBackend}". Must be 'gguf' or 'bin'.`);
}

export const MODEL_BACKEND = rawBackend;

// GGUF Server Base URL (for llama-server/llama.cpp)
export const GGUF_SERVER_BASE = import.meta.env.VITE_GGUF_SERVER_BASE || 'http://localhost:8080';

// Legacy .bin Server Base URL (for HuggingFace transformers)
export const BIN_SERVER_BASE = import.meta.env.VITE_BIN_SERVER_BASE || 'http://localhost:5000';

// Get the active ML service base URL based on MODEL_BACKEND
export const getMLServiceURL = () => {
  if (MODEL_BACKEND === 'gguf') {
    return GGUF_SERVER_BASE;
  }
  return BIN_SERVER_BASE;
};

// Get the appropriate inference endpoint
export const getInferenceEndpoint = () => {
  const baseURL = getMLServiceURL();
  
  if (MODEL_BACKEND === 'gguf') {
    // GGUF uses OpenAI-compatible chat completions
    return `${baseURL}/v1/chat/completions`;
  }
  
  // Legacy .bin uses OneSeek inference endpoint
  return `${baseURL}/api/ml/inference/oneseek`;
};

// Check if GGUF backend is active
export const isGGUFActive = () => MODEL_BACKEND === 'gguf';

// Log configuration on import (development only)
if (import.meta.env.DEV) {
  console.log('[Config] Backend Configuration:');
  console.log(`  MODEL_BACKEND: ${MODEL_BACKEND}`);
  console.log(`  GGUF_SERVER_BASE: ${GGUF_SERVER_BASE}`);
  console.log(`  BIN_SERVER_BASE: ${BIN_SERVER_BASE}`);
  console.log(`  Active ML Service: ${getMLServiceURL()}`);
  console.log(`  Inference Endpoint: ${getInferenceEndpoint()}`);
}

export default {
  MODEL_BACKEND,
  GGUF_SERVER_BASE,
  BIN_SERVER_BASE,
  getMLServiceURL,
  getInferenceEndpoint,
  isGGUFActive,
};
