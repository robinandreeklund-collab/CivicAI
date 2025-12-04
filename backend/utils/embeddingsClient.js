/**
 * Embeddings Client for OpenAI API
 * 
 * Provides a minimal client for calling OpenAI's embeddings endpoint with
 * batching and error handling. Falls back gracefully when API is unavailable.
 * 
 * Configuration:
 * - OPENAI_API_KEY: Required for embeddings functionality
 * - EMBEDDING_PROVIDER: Set to 'openai' to enable embeddings mode
 */

const OPENAI_EMBEDDINGS_URL = 'https://api.openai.com/v1/embeddings';
const DEFAULT_MODEL = 'text-embedding-3-small';
const MAX_BATCH_SIZE = 100; // OpenAI limit per request
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;

/**
 * Check if embeddings functionality is available
 * @returns {boolean}
 */
export function isEmbeddingsAvailable() {
  const provider = process.env.EMBEDDING_PROVIDER?.toLowerCase();
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  return provider === 'openai' && hasApiKey;
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number}
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Fetch embeddings for a batch of texts from OpenAI (internal function)
 * @param {string[]} texts - Array of texts to embed (max 100 per batch)
 * @param {Object} [options={}] - Optional configuration
 * @param {string} [options.model] - OpenAI embedding model (default: text-embedding-3-small)
 * @returns {Promise<number[][]>} Array of embedding vectors in same order as input texts
 * @throws {Error} If API key is not configured or API returns an error
 */
async function fetchEmbeddingsBatch(texts, options = {}) {
  const model = options.model || DEFAULT_MODEL;
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  
  const response = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    if (response.status === 429) {
      throw new Error('Rate limited by OpenAI embeddings API');
    }
    throw new Error(`OpenAI embeddings API error: ${response.status} - ${errorBody}`);
  }
  
  const data = await response.json();
  
  // Sort by index to ensure order matches input
  const sortedData = data.data.sort((a, b) => a.index - b.index);
  return sortedData.map(item => item.embedding);
}

/**
 * Get embeddings for an array of texts with batching and retry logic
 * @param {string[]} texts - Array of texts to embed
 * @param {Object} options - Optional configuration
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function getEmbeddings(texts, options = {}) {
  if (!texts || texts.length === 0) {
    return [];
  }
  
  if (!isEmbeddingsAvailable()) {
    console.warn('⚠️  Embeddings not available - EMBEDDING_PROVIDER not set to "openai" or missing OPENAI_API_KEY');
    return null;
  }
  
  // Filter out empty texts and track indices
  const validTexts = [];
  const indexMap = [];
  texts.forEach((text, i) => {
    if (text && typeof text === 'string' && text.trim()) {
      validTexts.push(text.trim());
      indexMap.push(i);
    }
  });
  
  if (validTexts.length === 0) {
    return texts.map(() => null);
  }
  
  console.log(`📊 Getting embeddings for ${validTexts.length} texts...`);
  
  const allEmbeddings = new Array(texts.length).fill(null);
  
  // Process in batches
  for (let i = 0; i < validTexts.length; i += MAX_BATCH_SIZE) {
    const batchTexts = validTexts.slice(i, i + MAX_BATCH_SIZE);
    const batchIndices = indexMap.slice(i, i + MAX_BATCH_SIZE);
    
    let lastError;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`📊 Retry attempt ${attempt} for embeddings batch...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
        }
        
        const embeddings = await fetchEmbeddingsBatch(batchTexts, options);
        
        // Map back to original indices
        embeddings.forEach((embedding, j) => {
          allEmbeddings[batchIndices[j]] = embedding;
        });
        
        break;
      } catch (error) {
        lastError = error;
        console.error(`❌ Embeddings batch error (attempt ${attempt + 1}):`, error.message);
        
        if (attempt === MAX_RETRIES) {
          throw lastError;
        }
      }
    }
  }
  
  console.log(`✅ Successfully got ${allEmbeddings.filter(e => e).length} embeddings`);
  return allEmbeddings;
}

/**
 * Get embedding for a single text
 * @param {string} text - Text to embed
 * @param {Object} options - Optional configuration
 * @returns {Promise<number[]|null>} Embedding vector or null
 */
export async function getEmbedding(text, options = {}) {
  if (!text || typeof text !== 'string' || !text.trim()) {
    return null;
  }
  
  const embeddings = await getEmbeddings([text], options);
  return embeddings ? embeddings[0] : null;
}

export default {
  isEmbeddingsAvailable,
  getEmbeddings,
  getEmbedding,
  cosineSimilarity,
};
