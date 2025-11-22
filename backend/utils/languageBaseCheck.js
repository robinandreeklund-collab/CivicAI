/**
 * Language Base Model Check Utility
 * Ensures Swedish/English base models exist with failsafe fallback
 * Used for real-time micro-training language separation
 */

import fs from 'fs/promises';
import path from 'path';

const MODELS_DIR = path.join(process.cwd(), '..', 'models', 'oneseek-7b-zero');

const LANGUAGE_MODELS = {
  sv: 'OneSeek-7B-Zero-sv',
  en: 'OneSeek-7B-Zero-en',
};

/**
 * Check if a language-specific base model exists
 * @param {string} languageCode - Language code ('sv' or 'en')
 * @returns {Promise<{exists: boolean, path: string, model: string}>}
 */
export async function checkLanguageBaseModel(languageCode) {
  const normalizedLang = languageCode.toLowerCase();
  const modelName = LANGUAGE_MODELS[normalizedLang];
  
  if (!modelName) {
    return {
      exists: false,
      path: null,
      model: null,
      error: `Unsupported language: ${languageCode}`,
    };
  }
  
  const modelPath = path.join(MODELS_DIR, modelName);
  
  try {
    const stats = await fs.stat(modelPath);
    
    if (stats.isDirectory()) {
      // Check for essential model files
      const configPath = path.join(modelPath, 'config.json');
      const weightsPath = path.join(modelPath, 'model.safetensors');
      
      try {
        await fs.access(configPath);
        // Note: weights might not exist yet for new models
        return {
          exists: true,
          path: modelPath,
          model: modelName,
          hasWeights: await fs.access(weightsPath).then(() => true).catch(() => false),
        };
      } catch (err) {
        return {
          exists: false,
          path: modelPath,
          model: modelName,
          error: 'Model directory exists but missing config.json',
        };
      }
    }
    
    return {
      exists: false,
      path: modelPath,
      model: modelName,
      error: 'Model path is not a directory',
    };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {
        exists: false,
        path: modelPath,
        model: modelName,
        error: 'Model directory does not exist',
      };
    }
    
    return {
      exists: false,
      path: modelPath,
      model: modelName,
      error: err.message,
    };
  }
}

/**
 * Ensure language base model exists, with fallback and notifications
 * @param {string} languageCode - Language code ('sv' or 'en')
 * @returns {Promise<{ready: boolean, model: string, fallback: boolean, message: string}>}
 */
export async function ensureLanguageBaseModel(languageCode) {
  const check = await checkLanguageBaseModel(languageCode);
  
  if (check.exists) {
    if (check.hasWeights) {
      return {
        ready: true,
        model: check.model,
        path: check.path,
        fallback: false,
        message: `Model ${check.model} is ready`,
      };
    } else {
      // Model directory exists but no weights yet - can still be used for training
      console.warn(`[LanguageBaseCheck] Model ${check.model} exists but has no weights yet`);
      return {
        ready: true,
        model: check.model,
        path: check.path,
        fallback: false,
        message: `Model ${check.model} directory exists, will be initialized on first training`,
      };
    }
  }
  
  // Model doesn't exist - use fallback
  console.warn(`[LanguageBaseCheck] Model ${check.model} not found: ${check.error}`);
  console.warn(`[LanguageBaseCheck] Using fallback to generic OneSeek-7B-Zero model`);
  
  // Try fallback to generic model
  const fallbackPath = path.join(MODELS_DIR, 'OneSeek-7B-Zero');
  
  try {
    const stats = await fs.stat(fallbackPath);
    if (stats.isDirectory()) {
      return {
        ready: true,
        model: 'OneSeek-7B-Zero',
        path: fallbackPath,
        fallback: true,
        message: `Language-specific model ${check.model} not found, using fallback to generic model`,
        warning: `Consider creating language-specific model for ${languageCode}`,
      };
    }
  } catch (err) {
    console.error(`[LanguageBaseCheck] Fallback model also not found: ${err.message}`);
  }
  
  // Neither language-specific nor fallback exists
  return {
    ready: false,
    model: null,
    path: null,
    fallback: false,
    message: `No suitable model found for language ${languageCode}`,
    error: 'Model not available',
    warning: 'Micro-training will be skipped until model is available',
  };
}

/**
 * Get available language models
 * @returns {Promise<Array<{language: string, model: string, exists: boolean}>>}
 */
export async function getAvailableLanguageModels() {
  const results = [];
  
  for (const [lang, model] of Object.entries(LANGUAGE_MODELS)) {
    const check = await checkLanguageBaseModel(lang);
    results.push({
      language: lang,
      model: model,
      exists: check.exists,
      hasWeights: check.hasWeights || false,
      path: check.path,
    });
  }
  
  return results;
}

export default {
  checkLanguageBaseModel,
  ensureLanguageBaseModel,
  getAvailableLanguageModels,
};
