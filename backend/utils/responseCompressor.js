/**
 * Response Compressor for Zero Compare Flow
 * 
 * Provides two compression modes for preparing external AI responses as context:
 * 1. Embeddings-based mode: Uses semantic similarity to select relevant sentences
 * 2. Fallback heuristic mode: Sentence extraction with deduplication and truncation
 * 
 * Configuration:
 * - EMBEDDING_PROVIDER=openai + OPENAI_API_KEY: Enables embeddings mode
 */

import { 
  isEmbeddingsAvailable, 
  getEmbeddings, 
  cosineSimilarity 
} from './embeddingsClient.js';

// Default configuration
const DEFAULT_CHAR_LIMIT = 3000;
const DEFAULT_PER_AGENT_LIMIT = 800;
const DEFAULT_SIMILARITY_THRESHOLD = 0.85; // For deduplication
const DEFAULT_MIN_SENTENCE_LENGTH = 20;
const DEFAULT_MAX_SENTENCES_PER_AGENT = 10;

/**
 * Split text into sentences
 * @param {string} text
 * @returns {string[]}
 */
function splitIntoSentences(text) {
  if (!text || typeof text !== 'string') return [];
  
  // Handle common abbreviations and edge cases
  const cleaned = text
    .replace(/(\d+)\./g, '$1<DOT>')  // Preserve numbers like "1."
    .replace(/([A-Z])\./g, '$1<DOT>') // Preserve initials like "J."
    .replace(/\.\.\./g, '<ELLIPSIS>');
  
  // Split on sentence boundaries
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map(s => s
      .replace(/<DOT>/g, '.')
      .replace(/<ELLIPSIS>/g, '...')
      .trim()
    )
    .filter(s => s.length >= DEFAULT_MIN_SENTENCE_LENGTH);
  
  return sentences;
}

/**
 * Extract agent and response text from a response object
 * @param {Object} response
 * @returns {{agent: string, text: string}}
 */
function extractAgentResponse(response) {
  const agent = response.agent || response.model || response.name || 'unknown';
  let text = '';
  
  if (typeof response === 'string') {
    text = response;
  } else if (response.response) {
    text = response.response;
  } else if (response.text) {
    text = response.text;
  } else if (response.content) {
    text = response.content;
  }
  
  return { agent, text: typeof text === 'string' ? text : '' };
}

/**
 * Heuristic compression: sentence extraction with deduplication and truncation
 * @param {Object[]} responses - Array of response objects
 * @param {Object} options - Configuration options
 * @returns {{compressed: string, metadata: Object}}
 */
function heuristicCompress(responses, options = {}) {
  const charLimit = options.charLimit || DEFAULT_CHAR_LIMIT;
  const perAgentLimit = options.perAgentLimit || DEFAULT_PER_AGENT_LIMIT;
  
  console.log('📝 Using heuristic compression mode');
  
  const agentSentences = [];
  const seenSentencesLower = new Set();
  
  for (const response of responses) {
    const { agent, text } = extractAgentResponse(response);
    if (!text) continue;
    
    const sentences = splitIntoSentences(text);
    const selectedSentences = [];
    let agentCharCount = 0;
    
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Skip duplicates
      if (seenSentencesLower.has(lowerSentence)) continue;
      
      // Check per-agent limit
      if (agentCharCount + sentence.length > perAgentLimit) break;
      
      seenSentencesLower.add(lowerSentence);
      selectedSentences.push(sentence);
      agentCharCount += sentence.length;
    }
    
    if (selectedSentences.length > 0) {
      agentSentences.push({
        agent,
        sentences: selectedSentences,
        charCount: agentCharCount,
      });
    }
  }
  
  // Build output respecting total char limit
  const lines = [];
  let totalChars = 0;
  
  for (const { agent, sentences } of agentSentences) {
    const header = `• ${agent}:`;
    if (totalChars + header.length > charLimit) break;
    
    lines.push(header);
    totalChars += header.length;
    
    for (const sentence of sentences) {
      const line = `  - ${sentence}`;
      if (totalChars + line.length > charLimit) break;
      lines.push(line);
      totalChars += line.length;
    }
  }
  
  return {
    compressed: lines.join('\n'),
    metadata: {
      mode: 'heuristic',
      agentCount: agentSentences.length,
      totalSentences: agentSentences.reduce((sum, a) => sum + a.sentences.length, 0),
      totalChars: totalChars,
    },
  };
}

/**
 * Embeddings-based compression: semantic similarity selection
 * @param {Object[]} responses - Array of response objects
 * @param {Object} options - Configuration options
 * @returns {Promise<{compressed: string, metadata: Object}>}
 */
async function embeddingsCompress(responses, options = {}) {
  const charLimit = options.charLimit || DEFAULT_CHAR_LIMIT;
  const question = options.question || '';
  const similarityThreshold = options.similarityThreshold || DEFAULT_SIMILARITY_THRESHOLD;
  const maxSentencesPerAgent = options.maxSentencesPerAgent || DEFAULT_MAX_SENTENCES_PER_AGENT;
  
  console.log('📊 Using embeddings-based compression mode');
  
  // Collect all sentences with agent info
  const allSentences = [];
  for (const response of responses) {
    const { agent, text } = extractAgentResponse(response);
    if (!text) continue;
    
    const sentences = splitIntoSentences(text);
    for (const sentence of sentences.slice(0, maxSentencesPerAgent * 2)) {
      allSentences.push({ agent, sentence });
    }
  }
  
  if (allSentences.length === 0) {
    return {
      compressed: '',
      metadata: { mode: 'embeddings', error: 'No valid sentences found' },
    };
  }
  
  // Get embeddings for question and all sentences
  const textsToEmbed = [question, ...allSentences.map(s => s.sentence)];
  
  let embeddings;
  try {
    embeddings = await getEmbeddings(textsToEmbed);
    if (!embeddings) {
      console.warn('⚠️  Failed to get embeddings, falling back to heuristic mode');
      return heuristicCompress(responses, options);
    }
  } catch (error) {
    console.error('❌ Embeddings error:', error.message);
    return heuristicCompress(responses, options);
  }
  
  const questionEmbedding = embeddings[0];
  const sentenceEmbeddings = embeddings.slice(1);
  
  // Score sentences by similarity to question
  const scoredSentences = allSentences.map((item, i) => ({
    ...item,
    similarity: questionEmbedding ? cosineSimilarity(questionEmbedding, sentenceEmbeddings[i]) : 0,
    embedding: sentenceEmbeddings[i],
  }));
  
  // Sort by similarity (highest first)
  scoredSentences.sort((a, b) => b.similarity - a.similarity);
  
  // Select sentences with deduplication using cosine similarity
  const selectedSentences = [];
  const agentCounts = {};
  let totalChars = 0;
  
  for (const item of scoredSentences) {
    // Check agent limit
    agentCounts[item.agent] = (agentCounts[item.agent] || 0) + 1;
    if (agentCounts[item.agent] > maxSentencesPerAgent) continue;
    
    // Check for semantic duplicates
    let isDuplicate = false;
    for (const selected of selectedSentences) {
      if (selected.embedding && item.embedding) {
        const sim = cosineSimilarity(selected.embedding, item.embedding);
        if (sim >= similarityThreshold) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (isDuplicate) continue;
    
    // Check char limit
    const lineLength = item.agent.length + item.sentence.length + 10; // Account for formatting
    if (totalChars + lineLength > charLimit) continue;
    
    selectedSentences.push(item);
    totalChars += lineLength;
  }
  
  // Group by agent and format output
  const byAgent = {};
  for (const item of selectedSentences) {
    if (!byAgent[item.agent]) byAgent[item.agent] = [];
    byAgent[item.agent].push(item);
  }
  
  const lines = [];
  for (const [agent, items] of Object.entries(byAgent)) {
    lines.push(`• ${agent}:`);
    for (const item of items) {
      lines.push(`  - ${item.sentence}`);
    }
  }
  
  return {
    compressed: lines.join('\n'),
    metadata: {
      mode: 'embeddings',
      agentCount: Object.keys(byAgent).length,
      totalSentences: selectedSentences.length,
      totalChars: totalChars,
      avgSimilarity: selectedSentences.length > 0
        ? selectedSentences.reduce((sum, s) => sum + s.similarity, 0) / selectedSentences.length
        : 0,
    },
  };
}

/**
 * Compress responses for prompt context
 * Automatically selects embeddings or heuristic mode based on availability
 * 
 * @param {Object[]} responses - Array of response objects with agent and response text
 * @param {Object} options - Configuration options
 * @param {number} options.charLimit - Maximum total characters (default: 3000)
 * @param {number} options.perAgentLimit - Maximum chars per agent in heuristic mode (default: 800)
 * @param {string} options.question - Original question for semantic relevance (embeddings mode)
 * @param {boolean} options.forceHeuristic - Force heuristic mode even if embeddings available
 * @returns {Promise<{compressed: string, metadata: Object}>}
 */
export async function compressResponsesForPrompt(responses, options = {}) {
  if (!responses || responses.length === 0) {
    return {
      compressed: '',
      metadata: { mode: 'none', error: 'No responses provided' },
    };
  }
  
  console.log(`🗜️  Compressing ${responses.length} responses for prompt context...`);
  
  // Use embeddings if available and not forced to heuristic
  if (!options.forceHeuristic && isEmbeddingsAvailable()) {
    return embeddingsCompress(responses, options);
  }
  
  return heuristicCompress(responses, options);
}

export default {
  compressResponsesForPrompt,
  isEmbeddingsAvailable,
};
