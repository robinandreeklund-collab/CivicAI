/**
 * Language Base Model Check Utility
 * Updated for DNA v2: Uses trained models from weights directory
 * Used for real-time micro-training language separation
 */

import fs from 'fs/promises';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), '..', 'models', 'oneseek-7b-zero');
const WEIGHTS_DIR = path.join(MODELS_DIR, 'weights');

/**
 * Get the latest trained model for a specific language
 * @param {string} languageCode - Language code ('sv', 'en', 'ensv')
 * @returns {Promise<{exists: boolean, path: string, model: string, dna: string}>}
 */
export async function checkLanguageBaseModel(languageCode) {
  const normalizedLang = languageCode.toLowerCase();
  
  try {
    // Read all metadata files from weights directory
    await fs.mkdir(WEIGHTS_DIR, { recursive: true });
    const files = await fs.readdir(WEIGHTS_DIR);
    const metadataFiles = files.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
    
    let latestModel = null;
    let latestTime = 0;
    
    for (const file of metadataFiles) {
      const filePath = path.join(WEIGHTS_DIR, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        
        // Check if this model matches the requested language
        const dna = metadata.dna?.fingerprint || metadata.version;
        if (!dna) continue;
        
        // Extract language from DNA (e.g., "OneSeek-7B-Zero.v1.0.sv.dsIdentity..." -> "sv")
        const langMatch = dna.match(/OneSeek-7B-Zero\.v[0-9.]+\.([a-z]+)\./);
        const modelLang = langMatch ? langMatch[1] : null;
        
        if (modelLang === normalizedLang || (normalizedLang === 'en' && !modelLang)) {
          const createdTime = new Date(metadata.createdAt).getTime();
          if (createdTime > latestTime) {
            latestTime = createdTime;
            latestModel = {
              metadata,
              dna,
              filePath,
            };
          }
        }
      } catch (err) {
        console.error(`[LanguageBaseCheck] Error reading ${file}:`, err);
      }
    }
    
    if (latestModel) {
      return {
        exists: true,
        path: WEIGHTS_DIR,
        model: latestModel.dna,
        dna: latestModel.dna,
        metadata: latestModel.metadata,
        isCurrent: latestModel.metadata.isCurrent || false,
        hasWeights: true,
      };
    }
    
    return {
      exists: false,
      path: null,
      model: null,
      error: `No trained model found for language: ${languageCode}`,
    };
  } catch (err) {
    return {
      exists: false,
      path: null,
      model: null,
      error: err.message,
    };
  }
}

/**
 * Ensure language base model exists, with fallback and notifications
 * @param {string} languageCode - Language code ('sv', 'en', 'ensv')
 * @returns {Promise<{ready: boolean, model: string, fallback: boolean, message: string}>}
 */
export async function ensureLanguageBaseModel(languageCode) {
  const check = await checkLanguageBaseModel(languageCode);
  
  if (check.exists) {
    return {
      ready: true,
      model: check.model,
      dna: check.dna,
      path: check.path,
      fallback: false,
      message: `Model ${check.model} is ready`,
      metadata: check.metadata,
    };
  }
  
  // Model doesn't exist for this language
  console.warn(`[LanguageBaseCheck] No trained model found for language ${languageCode}: ${check.error}`);
  
  // Try to find any trained model as fallback
  try {
    await fs.mkdir(WEIGHTS_DIR, { recursive: true });
    const files = await fs.readdir(WEIGHTS_DIR);
    const metadataFiles = files.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
    
    if (metadataFiles.length > 0) {
      // Use the most recent model regardless of language
      let latestModel = null;
      let latestTime = 0;
      
      for (const file of metadataFiles) {
        const filePath = path.join(WEIGHTS_DIR, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const metadata = JSON.parse(content);
          const createdTime = new Date(metadata.createdAt).getTime();
          
          if (createdTime > latestTime) {
            latestTime = createdTime;
            latestModel = {
              metadata,
              dna: metadata.dna?.fingerprint || metadata.version,
            };
          }
        } catch (err) {
          console.error(`[LanguageBaseCheck] Error reading ${file}:`, err);
        }
      }
      
      if (latestModel) {
        console.warn(`[LanguageBaseCheck] Using fallback model: ${latestModel.dna}`);
        return {
          ready: true,
          model: latestModel.dna,
          dna: latestModel.dna,
          path: WEIGHTS_DIR,
          fallback: true,
          message: `No ${languageCode} model found, using fallback: ${latestModel.dna}`,
          warning: `Consider training a model for language ${languageCode}`,
          metadata: latestModel.metadata,
        };
      }
    }
  } catch (err) {
    console.error(`[LanguageBaseCheck] Error looking for fallback: ${err.message}`);
  }
  
  // No models available at all
  return {
    ready: false,
    model: null,
    path: null,
    fallback: false,
    message: `No suitable model found for language ${languageCode}`,
    error: 'No trained models available',
    warning: 'Train a model first in the Admin panel',
  };
}

/**
 * Get all available trained models
 * @returns {Promise<Array<{language: string, model: string, dna: string, exists: boolean}>>}
 */
export async function getAvailableLanguageModels() {
  const results = [];
  
  try {
    await fs.mkdir(WEIGHTS_DIR, { recursive: true });
    const files = await fs.readdir(WEIGHTS_DIR);
    const metadataFiles = files.filter(f => f.startsWith('oneseek-7b-zero-v') && f.endsWith('.json'));
    
    for (const file of metadataFiles) {
      const filePath = path.join(WEIGHTS_DIR, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const metadata = JSON.parse(content);
        const dna = metadata.dna?.fingerprint || metadata.version;
        
        // Extract language from DNA
        const langMatch = dna.match(/OneSeek-7B-Zero\.v[0-9.]+\.([a-z]+)\./);
        const language = langMatch ? langMatch[1] : 'unknown';
        
        results.push({
          language,
          model: dna,
          dna,
          exists: true,
          isCurrent: metadata.isCurrent || false,
          path: WEIGHTS_DIR,
          metadata,
        });
      } catch (err) {
        console.error(`[LanguageBaseCheck] Error reading ${file}:`, err);
      }
    }
  } catch (err) {
    console.error(`[LanguageBaseCheck] Error listing models:`, err);
  }
  
  return results;
}

export default {
  checkLanguageBaseModel,
  ensureLanguageBaseModel,
  getAvailableLanguageModels,
};
