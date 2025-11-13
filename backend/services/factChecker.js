/**
 * Fact Checker Service
 * Integrates Bing Search API for real-time fact verification against web sources
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BING_SEARCH_API_KEY = process.env.BING_SEARCH_API_KEY;
const BING_SEARCH_ENDPOINT = 'https://api.bing.microsoft.com/v7.0/search';

/**
 * Search Bing for fact verification
 * @param {string} claim - The claim to verify
 * @param {number} count - Number of results to retrieve (default: 5)
 * @returns {Promise<Object>} Search results with sources
 */
async function searchBing(claim, count = 5) {
  if (!BING_SEARCH_API_KEY) {
    console.warn('[FactChecker] Bing Search API key not configured');
    return { available: false, sources: [] };
  }

  try {
    const response = await axios.get(BING_SEARCH_ENDPOINT, {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_SEARCH_API_KEY,
      },
      params: {
        q: claim,
        count: count,
        responseFilter: 'Webpages',
        safeSearch: 'Moderate',
      },
      timeout: 5000, // 5 second timeout
    });

    const webPages = response.data.webPages?.value || [];
    
    return {
      available: true,
      sources: webPages.map(page => ({
        title: page.name,
        url: page.url,
        snippet: page.snippet,
        datePublished: page.datePublished,
        displayUrl: page.displayUrl,
      })),
      totalResults: response.data.webPages?.totalEstimatedMatches || 0,
    };
  } catch (error) {
    console.error('[FactChecker] Bing Search API error:', error.message);
    return {
      available: false,
      error: error.message,
      sources: [],
    };
  }
}

/**
 * Extract verifiable claims from text
 * Simple extraction based on patterns (can be enhanced with NLP)
 * @param {string} text - Text to analyze
 * @returns {Array<string>} List of potential claims
 */
function extractClaims(text) {
  const claims = [];
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  // Look for factual statements (containing numbers, dates, specific entities)
  const factualPatterns = [
    /\d+/,  // Contains numbers
    /\b(är|var|blir|blev|har|hade)\b/i,  // Swedish verb patterns
    /\b(procent|kr|miljoner|miljarder|år)\b/i,  // Swedish units
  ];
  
  for (const sentence of sentences) {
    // Skip questions
    if (sentence.trim().endsWith('?')) continue;
    
    // Check if sentence contains factual indicators
    const isFact = factualPatterns.some(pattern => pattern.test(sentence));
    if (isFact) {
      claims.push(sentence.trim());
    }
  }
  
  return claims.slice(0, 3); // Limit to 3 most important claims
}

/**
 * Perform comprehensive fact-check on AI response
 * @param {string} responseText - The AI response text to fact-check
 * @param {string} agentName - Name of the AI agent
 * @returns {Promise<Object>} Fact-check results with sources
 */
export async function performFactCheck(responseText, agentName) {
  if (!BING_SEARCH_API_KEY) {
    return {
      available: false,
      message: 'Bing Search API-nyckel saknas - faktakoll ej tillgänglig',
      claims: [],
      overallScore: null,
    };
  }

  try {
    // Extract claims from the response
    const claims = extractClaims(responseText);
    
    if (claims.length === 0) {
      return {
        available: true,
        claims: [],
        overallScore: 7, // Neutral score when no factual claims
        message: 'Inga verifierbara påståenden hittades',
      };
    }

    // Verify each claim using Bing Search
    const verificationResults = [];
    
    for (const claim of claims) {
      const searchResults = await searchBing(claim, 3);
      
      if (searchResults.available && searchResults.sources.length > 0) {
        // Calculate confidence based on number of sources found
        const confidence = Math.min((searchResults.sources.length / 3) * 10, 10);
        
        verificationResults.push({
          claim: claim.substring(0, 150), // Truncate long claims
          verified: searchResults.sources.length >= 2, // At least 2 sources
          confidence: Math.round(confidence * 10) / 10,
          sources: searchResults.sources.map(s => ({
            title: s.title,
            url: s.url,
            snippet: s.snippet.substring(0, 200),
          })),
          sourceCount: searchResults.sources.length,
        });
      } else {
        verificationResults.push({
          claim: claim.substring(0, 150),
          verified: false,
          confidence: 0,
          sources: [],
          sourceCount: 0,
          warning: 'Inga källor hittades för verifiering',
        });
      }
    }

    // Calculate overall score (0-10)
    const verifiedCount = verificationResults.filter(r => r.verified).length;
    const avgConfidence = verificationResults.reduce((sum, r) => sum + r.confidence, 0) / verificationResults.length;
    const overallScore = Math.round(((verifiedCount / claims.length) * 5 + avgConfidence * 0.5) * 10) / 10;

    return {
      available: true,
      agent: agentName,
      claims: verificationResults,
      overallScore: overallScore,
      verifiedCount: verifiedCount,
      totalClaims: claims.length,
      summary: `${verifiedCount} av ${claims.length} påståenden verifierade (${Math.round((verifiedCount / claims.length) * 100)}%)`,
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error('[FactChecker] Error performing fact check:', error);
    return {
      available: false,
      error: error.message,
      claims: [],
      overallScore: null,
    };
  }
}

/**
 * Perform batch fact-checking on multiple AI responses
 * @param {Array<Object>} responses - Array of AI responses
 * @returns {Promise<Array<Object>>} Array of fact-check results
 */
export async function batchFactCheck(responses) {
  const factCheckPromises = responses.map(response => 
    performFactCheck(response.response, response.agent)
  );

  return Promise.all(factCheckPromises);
}

/**
 * Compare fact-check results across multiple AI agents
 * @param {Array<Object>} factCheckResults - Results from batchFactCheck
 * @returns {Object} Comparative analysis
 */
export function compareFactChecks(factCheckResults) {
  const available = factCheckResults.some(r => r.available);
  
  if (!available) {
    return {
      available: false,
      message: 'Faktakoll inte tillgänglig',
    };
  }

  const validResults = factCheckResults.filter(r => r.available && r.overallScore !== null);
  
  if (validResults.length === 0) {
    return {
      available: true,
      bestAgent: null,
      message: 'Inga verifierbara resultat',
    };
  }

  // Find agent with highest fact-check score
  const sorted = validResults.sort((a, b) => b.overallScore - a.overallScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const avgScore = validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length;

  return {
    available: true,
    bestAgent: best.agent,
    bestScore: best.overallScore,
    worstAgent: worst.agent,
    worstScore: worst.overallScore,
    averageScore: Math.round(avgScore * 10) / 10,
    totalClaims: validResults.reduce((sum, r) => sum + r.totalClaims, 0),
    totalVerified: validResults.reduce((sum, r) => sum + r.verifiedCount, 0),
    summary: `Bäst: ${best.agent} (${best.overallScore}/10) • Genomsnitt: ${Math.round(avgScore * 10) / 10}/10`,
  };
}

export default {
  performFactCheck,
  batchFactCheck,
  compareFactChecks,
};
