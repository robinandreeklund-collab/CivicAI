/**
 * Fact Checker Service
 * 
 * Provides automated fact-checking for AI responses using the Tavily Search API.
 * This module extracts verifiable claims from text and validates them against
 * external sources to ensure accuracy and transparency.
 * 
 * WORKFLOW:
 * 1. Extract and classify claims from AI response text
 * 2. Search up to 3 external sources via Tavily API for each claim
 * 3. Mark claim as verified if ≥2 sources found
 * 4. Calculate confidence levels and overall fact-check score
 * 5. Return comprehensive verification results
 * 
 * CLAIM TYPES:
 * - Statistical: Percentages, ratios, numeric data
 * - Temporal: Dates, years, time periods
 * - Scientific: Research references, studies
 * - Historical: Historical facts and events
 * - Definitive: Absolute statements requiring verification
 * 
 * CONFIDENCE SCORING:
 * - 0 sources: 0.0 (0%)
 * - 1 source: 3.3 (33%)
 * - 2 sources: 6.7 (67%) - minimum for verification
 * - 3+ sources: 10.0 (100%)
 * 
 * OVERALL SCORE CALCULATION:
 * - 50% weight: Verification rate (verified/total)
 * - 50% weight: Average confidence
 * - Result scaled 0-10
 * 
 * @module factChecker
 * @requires axios - HTTP client for Tavily API
 * @requires dotenv - Environment configuration
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_SEARCH_ENDPOINT = 'https://api.tavily.com/search';

/**
 * Search Tavily for fact verification
 * Queries the Tavily Search API to find external sources that can verify a claim
 * @param {string} claim - The claim to verify
 * @param {number} count - Number of results to retrieve (default: 3, max recommended: 5)
 * @returns {Promise<Object>} Search results with sources and metadata
 */
async function searchTavily(claim, count = 3) {
  if (!TAVILY_API_KEY) {
    console.warn('[FactChecker] Tavily Search API key not configured');
    return { available: false, sources: [] };
  }

  try {
    console.log(`[FactChecker] Searching Tavily for: "${claim.substring(0, 50)}..." (max ${count} sources)`);
    
    const response = await axios.post(TAVILY_SEARCH_ENDPOINT, {
      api_key: TAVILY_API_KEY,
      query: claim,
      search_depth: 'basic', // 'basic' for speed, 'advanced' for thoroughness
      include_answer: false,
      include_raw_content: false,
      max_results: count,
      include_domains: [],
      exclude_domains: [],
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout (increased from 5s for reliability)
    });

    const results = response.data.results || [];
    console.log(`[FactChecker] Tavily returned ${results.length} sources`);
    
    return {
      available: true,
      sources: results.map(result => ({
        title: result.title || 'Untitled',
        url: result.url,
        snippet: result.content || '',
        datePublished: result.published_date,
        displayUrl: result.url,
        score: result.score, // Relevance score from Tavily (0-1)
      })),
      totalResults: results.length,
    };
  } catch (error) {
    console.error('[FactChecker] Tavily Search API error:', error.message);
    
    // Provide more detailed error information
    if (error.response) {
      console.error('[FactChecker] API response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[FactChecker] No response received from Tavily API');
    }
    
    return {
      available: false,
      error: error.message,
      sources: [],
    };
  }
}

/**
 * Claim classification types with patterns
 * Each type has specific patterns and indicators
 */
const CLAIM_TYPES = {
  statistical: {
    patterns: [
      /\d+\s*%/gi,  // Percentages: 50%, 3%
      /\d+\s*procent/gi,  // Swedish percentages
      /\d+\s*av\s*\d+/gi,  // Ratios: 3 av 5
      /genomsnitt/gi,  // Averages
      /median/gi,  // Median
      /statistik/gi,  // Statistics
    ],
    description: 'Statistiskt påstående',
  },
  temporal: {
    patterns: [
      /\b(19|20)\d{2}\b/g,  // Years: 1995, 2023
      /\b(januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)\b/gi,  // Months
      /senaste\s+(året|åren|månaden|månaderna)/gi,  // Recent periods
      /\b\d{4}-\d{2}-\d{2}\b/g,  // Dates: 2023-01-15
      /sedan\s+\d{4}/gi,  // Since year
      /mellan\s+\d{4}\s+och\s+\d{4}/gi,  // Between years
    ],
    description: 'Tidsbundet påstående',
  },
  scientific: {
    patterns: [
      /forskning\s+(visar|tyder|indikerar|bevisar)/gi,
      /studier?\s+(visar|tyder|indikerar)/gi,
      /enligt\s+(forskning|studier|forskare)/gi,
      /vetenskaplig/gi,
      /undersökning(ar)?\s+(visar|tyder)/gi,
      /experiment/gi,
      /rapport(er)?\s+från/gi,
    ],
    description: 'Vetenskapligt påstående',
  },
  historical: {
    patterns: [
      /historiskt/gi,
      /ursprungligen/gi,
      /grundades?\s+\d{4}/gi,
      /etablerad(es)?\s+\d{4}/gi,
      /\bförr\s+i\s+tiden\b/gi,
      /under\s+\d{4}/gi,
      /sedan\s+\d{3,4}-talet/gi,
    ],
    description: 'Historiskt påstående',
  },
  definitive: {
    patterns: [
      /\bär\s+faktiskt\b/gi,
      /\bbevisat\s+att\b/gi,
      /\bdet\s+är\s+känt\s+att\b/gi,
      /\balla\s+(experter|forskare|studier)\b/gi,
      /\bvetenskapen\s+säger\b/gi,
      /\baltid\b/gi,
      /\baldrig\b/gi,
      /\bmåste\b/gi,
      /\binte\s+möjligt\b/gi,
    ],
    description: 'Definitivt påstående',
  },
};

/**
 * Extract and classify verifiable claims from text
 * Enhanced extraction with claim type classification and duplicate handling
 * @param {string} text - Text to analyze
 * @returns {Array<Object>} List of classified claims with metadata
 */
function extractClaims(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const claims = [];
  const seenClaims = new Set(); // For duplicate detection
  
  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // Skip questions and very short sentences
    if (trimmedSentence.endsWith('?') || trimmedSentence.length < 20) {
      continue;
    }
    
    // Check each claim type
    for (const [type, config] of Object.entries(CLAIM_TYPES)) {
      for (const pattern of config.patterns) {
        if (pattern.test(trimmedSentence)) {
          // Create a normalized version for duplicate detection
          const normalized = trimmedSentence.toLowerCase().replace(/\s+/g, ' ');
          
          // Skip if we've already seen a similar claim
          if (seenClaims.has(normalized)) {
            continue;
          }
          
          seenClaims.add(normalized);
          
          claims.push({
            text: trimmedSentence,
            type: type,
            description: config.description,
            // Extract the specific matched portion for context
            matchedPattern: trimmedSentence.match(pattern)?.[0] || '',
          });
          
          // Only classify each sentence once (by first matching type)
          break;
        }
      }
      
      // If claim was added, move to next sentence
      if (claims.length > 0 && claims[claims.length - 1].text === trimmedSentence) {
        break;
      }
    }
  }
  
  // Prioritize claims by type (statistical, scientific, definitive are highest priority)
  const priorityOrder = ['statistical', 'scientific', 'definitive', 'temporal', 'historical'];
  claims.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.type);
    const bPriority = priorityOrder.indexOf(b.type);
    return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
  });
  
  // Limit to 3 most important claims (as per requirements)
  return claims.slice(0, 3);
}

/**
 * Calculate confidence level for a claim based on sources found
 * Confidence scoring algorithm:
 * - 0 sources: 0.0 confidence
 * - 1 source: 3.3 confidence (33%)
 * - 2 sources: 6.7 confidence (67%) - minimum for verification
 * - 3+ sources: 10.0 confidence (100%)
 * @param {number} sourceCount - Number of sources found
 * @returns {number} Confidence score (0-10)
 */
function calculateConfidence(sourceCount) {
  if (sourceCount === 0) return 0;
  if (sourceCount === 1) return 3.3;
  if (sourceCount === 2) return 6.7;
  return 10.0;
}

/**
 * Calculate overall fact-check score
 * Scoring algorithm:
 * - 50% weight: Verification rate (verified claims / total claims)
 * - 50% weight: Average confidence across all claims
 * Result is scaled 0-10
 * @param {Array} verificationResults - Array of verification results
 * @returns {number|null} Overall score (0-10), or null if no claims
 */
function calculateOverallScore(verificationResults) {
  if (verificationResults.length === 0) return null; // No verifiable claims
  
  const verifiedCount = verificationResults.filter(r => r.verified).length;
  const verificationRate = verifiedCount / verificationResults.length;
  
  const avgConfidence = verificationResults.reduce((sum, r) => sum + r.confidence, 0) / verificationResults.length;
  
  // 50% weight on verification rate, 50% weight on confidence
  const overallScore = (verificationRate * 5) + (avgConfidence * 0.5);
  
  return Math.round(overallScore * 10) / 10;
}

/**
 * Perform comprehensive fact-check on AI response
 * @param {string} responseText - The AI response text to fact-check
 * @param {string} agentName - Name of the AI agent
 * @returns {Promise<Object>} Fact-check results with sources and confidence scores
 */
export async function performFactCheck(responseText, agentName) {
  console.log(`[FactChecker] Starting fact-check for ${agentName}`);
  
  if (!TAVILY_API_KEY) {
    console.warn('[FactChecker] Tavily API key not configured');
    return {
      available: false,
      message: 'Tavily Search API-nyckel saknas - faktakoll ej tillgänglig',
      claims: [],
      overallScore: null,
    };
  }

  try {
    // Step 1: Extract and classify claims from the response
    const claims = extractClaims(responseText);
    console.log(`[FactChecker] Extracted ${claims.length} claims`);
    
    if (claims.length === 0) {
      return {
        available: true,
        agent: agentName,
        claims: [],
        overallScore: 7, // Neutral score when no factual claims
        verifiedCount: 0,
        totalClaims: 0,
        message: 'Inga verifierbara påståenden hittades',
        timestamp: new Date().toISOString(),
      };
    }

    // Step 2: Verify each claim using Tavily Search (up to 3 sources per claim)
    const verificationResults = [];
    
    for (const claim of claims) {
      console.log(`[FactChecker] Verifying claim: ${claim.text.substring(0, 50)}...`);
      
      // Search for up to 3 external sources via Tavily
      const searchResults = await searchTavily(claim.text, 3);
      
      if (searchResults.available && searchResults.sources.length > 0) {
        // Mark as verified if at least 2 sources found (as per requirements)
        const verified = searchResults.sources.length >= 2;
        
        // Calculate confidence based on source count
        const confidence = calculateConfidence(searchResults.sources.length);
        
        console.log(`[FactChecker] Found ${searchResults.sources.length} sources, verified: ${verified}, confidence: ${confidence}`);
        
        verificationResults.push({
          claim: claim.text.substring(0, 150), // Truncate for display
          claimType: claim.type,
          claimDescription: claim.description,
          verified: verified,
          confidence: confidence,
          sources: searchResults.sources.map(s => ({
            title: s.title,
            url: s.url,
            snippet: truncateAtSentenceBoundary(s.snippet, 200),
            score: s.score, // Relevance score from Tavily
          })),
          sourceCount: searchResults.sources.length,
        });
      } else {
        // No sources found
        console.warn(`[FactChecker] No sources found for claim: ${claim.text.substring(0, 50)}...`);
        verificationResults.push({
          claim: claim.text.substring(0, 150),
          claimType: claim.type,
          claimDescription: claim.description,
          verified: false,
          confidence: 0,
          sources: [],
          sourceCount: 0,
          warning: 'Inga källor hittades för verifiering',
        });
      }
    }

    // Step 3: Calculate overall fact-check score
    const verifiedCount = verificationResults.filter(r => r.verified).length;
    const overallScore = calculateOverallScore(verificationResults);
    
    console.log(`[FactChecker] Complete: ${verifiedCount}/${claims.length} verified, overall score: ${overallScore}/10`);

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
      message: `Fel vid faktakoll: ${error.message}`,
    };
  }
}

/**
 * Perform batch fact-checking on multiple AI responses
 * Executes fact-checking in parallel for efficiency
 * @param {Array<Object>} responses - Array of AI responses with {response, agent} properties
 * @returns {Promise<Array<Object>>} Array of fact-check results in same order as input
 */
export async function batchFactCheck(responses) {
  console.log(`[FactChecker] Starting batch fact-check for ${responses.length} responses`);
  
  const factCheckPromises = responses.map((response, index) => {
    console.log(`[FactChecker] Queuing fact-check ${index + 1}/${responses.length} for ${response.agent}`);
    return performFactCheck(response.response, response.agent);
  });

  const results = await Promise.all(factCheckPromises);
  console.log(`[FactChecker] Batch fact-check complete`);
  
  return results;
}

/**
 * Compare fact-check results across multiple AI agents
 * Analyzes and ranks agents based on their fact-checking scores
 * @param {Array<Object>} factCheckResults - Results from batchFactCheck
 * @returns {Object} Comparative analysis with best/worst agents and aggregated statistics
 */
export function compareFactChecks(factCheckResults) {
  console.log(`[FactChecker] Comparing fact-checks across ${factCheckResults.length} agents`);
  
  const available = factCheckResults.some(r => r.available);
  
  if (!available) {
    console.warn('[FactChecker] No fact-check results available for comparison');
    return {
      available: false,
      message: 'Faktakoll inte tillgänglig',
    };
  }

  const validResults = factCheckResults.filter(r => r.available && r.overallScore !== null);
  
  if (validResults.length === 0) {
    console.warn('[FactChecker] No valid fact-check results with scores');
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
  const totalClaims = validResults.reduce((sum, r) => sum + r.totalClaims, 0);
  const totalVerified = validResults.reduce((sum, r) => sum + r.verifiedCount, 0);

  console.log(`[FactChecker] Best: ${best.agent} (${best.overallScore}/10), Worst: ${worst.agent} (${worst.overallScore}/10), Avg: ${Math.round(avgScore * 10) / 10}/10`);

  return {
    available: true,
    bestAgent: best.agent,
    bestScore: best.overallScore,
    worstAgent: worst.agent,
    worstScore: worst.overallScore,
    averageScore: Math.round(avgScore * 10) / 10,
    totalClaims: totalClaims,
    totalVerified: totalVerified,
    summary: `Bäst: ${best.agent} (${best.overallScore}/10) • Genomsnitt: ${Math.round(avgScore * 10) / 10}/10`,
  };
}

export default {
  performFactCheck,
  batchFactCheck,
  compareFactChecks,
};
