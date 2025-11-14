/**
 * Summary Generation Utility
 * Creates a synthesized summary from multiple AI responses
 * Enhanced with BERT Extractive Summarization for maximum neutrality and precision
 */

import { generateBERTSummary } from '../services/bertSummarizer.js';

/**
 * Generate a neutral summary from all AI responses
 * Uses BERT Extractive Summarization when available for maximum neutrality
 * Falls back to keyword-based extraction if BERT is not available
 * 
 * @param {Array} responses - Array of AI responses with their text
 * @param {string} question - The original question
 * @param {Object} factCheckComparison - Optional fact-check comparison data
 * @returns {Promise<string>} A synthesized summary with fact-check insights
 */
export async function generateSynthesizedSummary(responses, question, factCheckComparison = null) {
  if (!responses || responses.length === 0) {
    return 'Ingen sammanfattning tillgänglig.';
  }

  // Filter out error responses
  const validResponses = responses.filter(r => r && r.response && !r.metadata?.error);
  
  if (validResponses.length === 0) {
    return 'Kunde inte generera sammanfattning från tillgängliga svar.';
  }

  let summaryText = '';
  let usedBERT = false;

  // Check if Python/BERT is enabled via environment variable
  const pythonEnabled = process.env.PYTHON_ENABLED === 'true';

  // Try to use BERT Extractive Summarizer for maximum neutrality (only if enabled)
  if (pythonEnabled) {
    try {
      const responseTexts = validResponses.map(r => r.response);
      const bertResult = await generateBERTSummary(responseTexts, question, 100, 500);
      
      if (bertResult.success) {
        summaryText = bertResult.summary;
        usedBERT = true;
        console.log('[Summary] Using BERT Extractive Summarization');
        console.log('[Summary] Compression ratio:', bertResult.metadata.compression_ratio);
      } else if (!bertResult.fallback) {
        // BERT failed but not a fallback scenario
        console.warn('[Summary] BERT summarization failed:', bertResult.error);
        console.log('[Summary] Falling back to keyword-based extraction');
      }
    } catch (error) {
      console.warn('[Summary] BERT summarization error:', error.message);
      console.log('[Summary] Falling back to keyword-based extraction');
    }
  } else {
    console.log('[Summary] BERT summarization disabled (PYTHON_ENABLED not set to true)');
  }

  // Fallback to keyword-based extraction if BERT not available or failed
  if (!usedBERT) {
    summaryText = generateKeywordBasedSummary(validResponses, question);
  }

  // Add fact-checking insights if available
  if (factCheckComparison && factCheckComparison.available) {
    summaryText += '\n\n' + generateFactCheckSection(factCheckComparison);
  }

  return summaryText;
}

/**
 * Generate keyword-based summary (fallback method)
 * @param {Array} validResponses - Valid responses
 * @param {string} question - The original question
 * @returns {string} Generated summary
 */
function generateKeywordBasedSummary(validResponses, question) {
  // Extract key points from each response
  const allPoints = [];
  validResponses.forEach(resp => {
    const text = resp.response;
    
    // Extract sentences that appear to be key points (sentences with keywords)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keywordPatterns = [
      /viktig/i, /fundamental/i, /central/i, /avgörande/i, /väsentlig/i,
      /först/i, /andra/i, /tredje/i, /slutligen/i, /dessutom/i,
      /inkluderar/i, /omfattar/i, /består av/i, /definieras/i
    ];
    
    sentences.forEach(sentence => {
      const trimmed = sentence.trim();
      if (keywordPatterns.some(pattern => pattern.test(trimmed))) {
        allPoints.push(trimmed);
      }
    });
  });

  // Identify common themes by looking at word overlap
  const commonThemes = extractCommonThemes(validResponses.map(r => r.response));
  
  // Build the summary
  let summary = `Baserat på svaren från ${validResponses.length} AI-modell${validResponses.length > 1 ? 'er' : ''} `;
  summary += `angående frågan "${question.substring(0, 100)}${question.length > 100 ? '...' : ''}", `;
  summary += 'kan följande sammanfattning ges:\n\n';

  // Add common themes
  if (commonThemes.length > 0) {
    summary += '**Gemensamma teman:**\n';
    summary += `Svaren betonar ${commonThemes.slice(0, 3).join(', ')}`;
    if (commonThemes.length > 3) {
      summary += ` samt ${commonThemes.slice(3).join(', ')}`;
    }
    summary += '.\n\n';
  }

  // Add key points synthesis
  if (allPoints.length > 0) {
    summary += '**Huvudpunkter:**\n';
    // Take up to 3 diverse key points
    const selectedPoints = selectDiversePoints(allPoints, 3);
    selectedPoints.forEach((point, idx) => {
      summary += `${idx + 1}. ${point}.\n`;
    });
    summary += '\n';
  }

  // Add consensus or divergence note
  if (validResponses.length > 1) {
    const similarity = calculateResponseSimilarity(validResponses.map(r => r.response));
    if (similarity > 0.7) {
      summary += '**Konsensus:** AI-modellerna är i stort sett överens i sina svar och betonar liknande aspekter.';
    } else if (similarity < 0.4) {
      summary += '**Perspektiv:** AI-modellerna erbjuder olika perspektiv och betoningar, vilket ger en bredare bild av ämnet.';
    } else {
      summary += '**Balans:** AI-modellerna delar vissa gemensamma punkter men erbjuder också olika nyanser och perspektiv.';
    }
  }

  return summary;
}

/**
 * Generate fact-check section for summary
 * @param {Object} factCheckComparison - Fact-check comparison data
 * @returns {string} Fact-check section text
 */
function generateFactCheckSection(factCheckComparison) {
  let section = '**Faktakoll och verifierbarhet:**\n';
  
  // Visa verifierad/ej verifierad statistik
  if (factCheckComparison.totalClaims > 0) {
    const verificationRate = Math.round((factCheckComparison.totalVerified / factCheckComparison.totalClaims) * 100);
    section += `${factCheckComparison.totalVerified} av ${factCheckComparison.totalClaims} påståenden verifierade (${verificationRate}%). `;
    
    // Källtäthet
    if (factCheckComparison.averageSourcesPerClaim) {
      section += `Genomsnittlig källtäthet: ${factCheckComparison.averageSourcesPerClaim} källor per påstående. `;
    }
    
    // Osäkerhetsnivå
    if (factCheckComparison.uncertaintyLevel) {
      const uncertaintyText = {
        'hög': 'hög osäkerhet - många påståenden saknar tillräckliga källor',
        'medel': 'viss osäkerhet - några påståenden kunde inte verifieras fullt ut',
        'låg': 'låg osäkerhet - de flesta påståenden är väl underbyggda'
      };
      section += `Osäkerhetsnivå: ${uncertaintyText[factCheckComparison.uncertaintyLevel]}.`;
    }
  } else if (factCheckComparison.neutralCount > 0) {
    // Neutral bedömning - förklara varför
    section += `Svaren innehåller inga specifika verifierbara påståenden (${factCheckComparison.neutralCount} av ${factCheckComparison.agentCount} AI-modeller gav kvalitativa/åsiktsbaserade svar). `;
    section += 'Detta är normalt för frågor som handlar om åsikter, filosofi eller kvalitativa bedömningar där faktakoll inte är applicerbart.';
  }
  
  // Typfördelning om tillgänglig
  if (factCheckComparison.claimTypeDistribution && Object.keys(factCheckComparison.claimTypeDistribution).length > 0) {
    section += '\n\n**Påståendetyper:** ';
    const typeDescriptions = {
      statistical: 'statistiska',
      scientific: 'vetenskapliga',
      temporal: 'tidsbundna',
      historical: 'historiska',
      definitive: 'definitiva'
    };
    const types = Object.entries(factCheckComparison.claimTypeDistribution)
      .map(([type, data]) => `${data.count} ${typeDescriptions[type] || type}`)
      .join(', ');
    section += types + '.';
  }

  return section;
}

/**
 * Extract common themes from responses
 * @param {Array<string>} responses - Array of response texts
 * @returns {Array<string>} Array of common theme words
 */
function extractCommonThemes(responses) {
  const stopWords = new Set([
    'är', 'och', 'att', 'det', 'som', 'för', 'på', 'med', 'en', 'av', 'till', 'i',
    'den', 'har', 'de', 'kan', 'inte', 'om', 'vara', 'eller', 'från', 'ett', 'vid',
    'också', 'detta', 'dessa', 'denna', 'alla', 'mycket', 'samt'
  ]);

  const wordFrequency = {};
  
  responses.forEach(response => {
    const words = response.toLowerCase()
      .split(/[\s,;:.!?()[\]{}]+/)
      .filter(w => w.length > 4 && !stopWords.has(w));
    
    words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    });
  });

  // Get words mentioned in multiple responses
  return Object.entries(wordFrequency)
    .filter(([, count]) => count >= Math.min(responses.length, 2))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Select diverse points to avoid repetition
 * @param {Array<string>} points - Array of points
 * @param {number} count - Number of points to select
 * @returns {Array<string>} Selected diverse points
 */
function selectDiversePoints(points, count) {
  if (points.length <= count) return points;

  const selected = [];
  const used = new Set();

  for (const point of points) {
    // Check if this point is too similar to already selected ones
    const pointWords = new Set(point.toLowerCase().split(/\s+/));
    let tooSimilar = false;
    
    for (const usedPoint of used) {
      const usedWords = new Set(usedPoint.toLowerCase().split(/\s+/));
      const overlap = [...pointWords].filter(w => usedWords.has(w)).length;
      const similarity = overlap / Math.min(pointWords.size, usedWords.size);
      
      if (similarity > 0.6) {
        tooSimilar = true;
        break;
      }
    }

    if (!tooSimilar) {
      selected.push(point);
      used.add(point);
      
      if (selected.length >= count) break;
    }
  }

  return selected;
}

/**
 * Calculate similarity between responses
 * @param {Array<string>} responses - Array of response texts
 * @returns {number} Similarity score between 0 and 1
 */
function calculateResponseSimilarity(responses) {
  if (responses.length < 2) return 1;

  const wordSets = responses.map(r => {
    const words = r.toLowerCase()
      .split(/[\s,;:.!?()[\]{}]+/)
      .filter(w => w.length > 4);
    return new Set(words);
  });

  // Calculate average pairwise similarity
  let totalSimilarity = 0;
  let comparisons = 0;

  for (let i = 0; i < wordSets.length; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      const set1 = wordSets[i];
      const set2 = wordSets[j];
      const intersection = [...set1].filter(w => set2.has(w)).length;
      const union = new Set([...set1, ...set2]).size;
      const similarity = intersection / union;
      
      totalSimilarity += similarity;
      comparisons++;
    }
  }

  return comparisons > 0 ? totalSimilarity / comparisons : 0;
}
