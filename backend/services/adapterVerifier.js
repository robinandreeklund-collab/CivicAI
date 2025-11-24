/**
 * Adapter Verifier Service
 * 
 * Provides hash integrity checks and compatibility verification
 * for LoRA adapters in the model chain.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Calculate SHA256 hash of a file
 */
async function hashFile(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
  } catch (error) {
    return null;
  }
}

/**
 * Calculate hash for all files in a directory
 */
async function hashDirectory(dirPath) {
  const hashes = {};
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isFile()) {
        hashes[entry.name] = await hashFile(fullPath);
      }
    }
  } catch (error) {
    return null;
  }
  
  return hashes;
}

/**
 * Verify adapter integrity by checking file hashes
 */
export async function verifyAdapterIntegrity(adapterPath) {
  const projectRoot = path.resolve(__dirname, '../..');
  const fullPath = path.join(projectRoot, 'models', 'oneseek-certified', adapterPath);
  
  try {
    // Check if adapter exists
    await fs.access(fullPath);
    
    // Calculate hashes for all files
    const hashes = await hashDirectory(fullPath);
    
    if (!hashes || Object.keys(hashes).length === 0) {
      return {
        valid: false,
        error: 'No files found in adapter directory',
        hashes: null
      };
    }
    
    // Check for required LoRA files
    const hasAdapterConfig = hashes['adapter_config.json'] !== null;
    const hasAdapterModel = hashes['adapter_model.safetensors'] !== null || hashes['adapter_model.bin'] !== null;
    
    if (!hasAdapterConfig || !hasAdapterModel) {
      return {
        valid: false,
        error: 'Missing required LoRA files (adapter_config.json or adapter_model)',
        hashes
      };
    }
    
    return {
      valid: true,
      hashes,
      fileCount: Object.keys(hashes).length
    };
  } catch (error) {
    return {
      valid: false,
      error: `Adapter not found or inaccessible: ${error.message}`,
      hashes: null
    };
  }
}

/**
 * Verify compatibility between adapters and base model
 */
export async function verifyChainCompatibility(baseModel, adapters) {
  const results = {
    compatible: true,
    issues: [],
    adapters: {}
  };
  
  const projectRoot = path.resolve(__dirname, '../..');
  
  for (const adapter of adapters) {
    const adapterPath = path.join(projectRoot, 'models', 'oneseek-certified', adapter);
    
    try {
      // Read adapter config
      const configPath = path.join(adapterPath, 'adapter_config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      
      // Check base model compatibility
      const configBaseModel = config.base_model_name_or_path || '';
      const isCompatible = configBaseModel.toLowerCase().includes(baseModel.toLowerCase()) ||
                          baseModel.toLowerCase().includes(configBaseModel.toLowerCase());
      
      results.adapters[adapter] = {
        compatible: isCompatible,
        configuredBaseModel: configBaseModel,
        rank: config.r || 'unknown',
        alpha: config.lora_alpha || 'unknown'
      };
      
      if (!isCompatible) {
        results.compatible = false;
        results.issues.push(`Adapter ${adapter} configured for ${configBaseModel}, but chain uses ${baseModel}`);
      }
    } catch (error) {
      results.compatible = false;
      results.issues.push(`Cannot read config for adapter ${adapter}: ${error.message}`);
      results.adapters[adapter] = {
        compatible: false,
        error: error.message
      };
    }
  }
  
  return results;
}

/**
 * Calculate risk score for merge operation (0-100%)
 */
export async function calculateMergeRisk(adapters) {
  let riskScore = 0;
  const factors = [];
  
  // More adapters = higher risk
  if (adapters.length > 5) {
    riskScore += 30;
    factors.push('High adapter count (>5)');
  } else if (adapters.length > 3) {
    riskScore += 15;
    factors.push('Moderate adapter count (>3)');
  }
  
  // Verify each adapter
  const projectRoot = path.resolve(__dirname, '../..');
  const ranks = [];
  
  for (const adapter of adapters) {
    const integrity = await verifyAdapterIntegrity(adapter);
    
    if (!integrity.valid) {
      riskScore += 20;
      factors.push(`Adapter ${adapter} has integrity issues`);
    }
    
    // Check for rank inconsistencies
    try {
      const configPath = path.join(projectRoot, 'models', 'oneseek-certified', adapter, 'adapter_config.json');
      const configData = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configData);
      ranks.push(config.r || 64);
    } catch (error) {
      // Ignore config read errors for risk calculation
    }
  }
  
  // Different ranks across adapters increases risk
  const uniqueRanks = [...new Set(ranks)];
  if (uniqueRanks.length > 1) {
    riskScore += 10;
    factors.push(`Inconsistent LoRA ranks: ${uniqueRanks.join(', ')}`);
  }
  
  // Cap at 100
  riskScore = Math.min(100, riskScore);
  
  return {
    riskScore,
    riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
    factors
  };
}

/**
 * Compare two adapters to see what changed
 */
export async function compareAdapters(adapter1Path, adapter2Path) {
  const projectRoot = path.resolve(__dirname, '../..');
  
  const hash1 = await hashDirectory(path.join(projectRoot, 'models', 'oneseek-certified', adapter1Path));
  const hash2 = await hashDirectory(path.join(projectRoot, 'models', 'oneseek-certified', adapter2Path));
  
  if (!hash1 || !hash2) {
    return {
      success: false,
      error: 'Cannot read one or both adapters'
    };
  }
  
  const allFiles = new Set([...Object.keys(hash1), ...Object.keys(hash2)]);
  const differences = {
    modified: [],
    added: [],
    removed: []
  };
  
  for (const file of allFiles) {
    if (!hash1[file]) {
      differences.added.push(file);
    } else if (!hash2[file]) {
      differences.removed.push(file);
    } else if (hash1[file] !== hash2[file]) {
      differences.modified.push(file);
    }
  }
  
  return {
    success: true,
    adapter1: adapter1Path,
    adapter2: adapter2Path,
    differences,
    identical: differences.modified.length === 0 && differences.added.length === 0 && differences.removed.length === 0
  };
}

export default {
  verifyAdapterIntegrity,
  verifyChainCompatibility,
  calculateMergeRisk,
  compareAdapters
};
