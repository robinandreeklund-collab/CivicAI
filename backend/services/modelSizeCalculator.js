/**
 * Model Size Calculator Service
 * 
 * Calculates exact sizes for base models and LoRA adapters,
 * providing real-time size tracking for the model chain.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base model sizes (in GB) - based on actual model sizes
const BASE_MODEL_SIZES = {
  'kb-llama-3-1-8b-swedish': 8.03,
  'kb-llama-3.1-8b-swedish': 8.03,
  'mistral-7b': 7.24,
  'llama-2-7b': 6.74,
  'gpt-2': 0.5,
  'default': 8.0
};

/**
 * Get file size in bytes
 */
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

/**
 * Get directory size in bytes (recursive)
 */
async function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else {
        totalSize += await getFileSize(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read - return 0
    return 0;
  }
  
  return totalSize;
}

/**
 * Convert bytes to GB with precision
 */
function bytesToGB(bytes) {
  return bytes / (1024 * 1024 * 1024);
}

/**
 * Get base model size in GB
 */
export function getBaseModelSize(modelName) {
  const normalizedName = modelName.toLowerCase().replace(/_/g, '-');
  
  for (const [key, size] of Object.entries(BASE_MODEL_SIZES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return size;
    }
  }
  
  return BASE_MODEL_SIZES.default;
}

/**
 * Calculate adapter size from directory
 */
export async function getAdapterSize(adapterPath) {
  const size = await getDirectorySize(adapterPath);
  return bytesToGB(size);
}

/**
 * Calculate total model chain size
 */
export async function calculateChainSize(baseModel, adapters = []) {
  const baseSize = getBaseModelSize(baseModel);
  let adaptersTotalSize = 0;
  
  const projectRoot = path.resolve(__dirname, '../..');
  
  for (const adapter of adapters) {
    const adapterPath = path.join(projectRoot, 'models', 'oneseek-certified', adapter);
    const adapterSize = await getAdapterSize(adapterPath);
    adaptersTotalSize += adapterSize;
  }
  
  return {
    baseSize,
    adaptersSize: adaptersTotalSize,
    totalSize: baseSize + adaptersTotalSize,
    adapterCount: adapters.length
  };
}

/**
 * Format size for display
 */
export function formatSize(sizeGB) {
  if (sizeGB < 1) {
    return `${(sizeGB * 1024).toFixed(0)} MB`;
  }
  return `${sizeGB.toFixed(2)} GB`;
}

/**
 * Get size warning level
 */
export function getSizeWarning(totalSizeGB) {
  if (totalSizeGB > 16) {
    return { level: 'critical', message: 'Critical size! Merge immediately recommended' };
  } else if (totalSizeGB > 9) {
    return { level: 'warning', message: 'Over 9 GB - recommend merge soon' };
  } else if (totalSizeGB > 6) {
    return { level: 'info', message: 'Size growing - consider merge planning' };
  }
  return { level: 'ok', message: 'Size is optimal' };
}

// Constants for size estimation
const BASE_SIZE_PER_MODULE_MB = 6.5; // MB per module for rank 64
const DEFAULT_LORA_RANK = 64;

/**
 * Calculate estimated adapter size based on parameters
 */
export function estimateAdapterSize(loraRank = DEFAULT_LORA_RANK, targetModules = 7) {
  // Rough estimation: each rank adds ~6.5MB per target module for 8B model
  const sizePerModule = (loraRank / DEFAULT_LORA_RANK) * BASE_SIZE_PER_MODULE_MB;
  const totalMB = sizePerModule * targetModules;
  return bytesToGB(totalMB * 1024 * 1024);
}

/**
 * Predict growth based on training iterations
 */
export function predictGrowth(currentSize, iterations, avgAdapterSize = 0.42) {
  const predictedSize = currentSize + (iterations * avgAdapterSize);
  const warning = getSizeWarning(predictedSize);
  
  return {
    currentSize,
    iterations,
    avgAdapterSize,
    predictedSize,
    warning
  };
}

export default {
  getBaseModelSize,
  getAdapterSize,
  calculateChainSize,
  formatSize,
  getSizeWarning,
  estimateAdapterSize,
  predictGrowth
};
