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
 * Truncate text at sentence boundary to avoid cutting off mid-sentence
 * Ensures snippets are readable and properly formatted for display
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length in characters
 * @returns {string} Truncated text ending at a sentence boundary
 */
function truncateAtSentenceBoundary(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  // Find last sentence-ending punctuation within maxLength
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  // If we found a sentence boundary, use it
  if (lastSentenceEnd > maxLength * 0.6) { // At least 60% of maxLength
    return truncated.substring(0, lastSentenceEnd + 1);
  }
  
  // Otherwise, truncate at word boundary and add ellipsis
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

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
 * Enhanced version with deep insights for neutral summary display
 * 
 * BERÄKNINGAR OCH ANALYS:
 * - Typfördelning: Antal claims per typ (statistical, scientific, etc.)
 * - Källtäthet: Genomsnittligt antal källor per claim
 * - Osäkerhetsgrad: Procentandel av claims som är ej verifierade
 * - Confidence-distribution: Spridning av confidence-scores
 * - Bias mot neutralitet: Hur många svar har neutrala scores (7/10)
 * 
 * MOTIV FÖR NEUTRAL BEDÖMNING:
 * När overallScore = 7, innebär det att inga verifierbara påståenden hittades.
 * Detta är INTE negativt - det betyder att svaret är kvalitativt/åsiktsbaserat
 * snarare än faktabaserat. Neutral = "Inget att verifiera" ≠ "Låg kvalitet"
 * 
 * @param {Array<Object>} factCheckResults - Results from batchFactCheck
 * @returns {Object} Comprehensive comparative analysis with all metadata
 */
export function compareFactChecks(factCheckResults) {
  console.log(`[FactChecker] Comparing fact-checks across ${factCheckResults.length} agents`);
  
  const available = factCheckResults.some(r => r.available);
  const timestamp = new Date().toISOString();
  
  if (!available) {
    console.warn('[FactChecker] No fact-check results available for comparison');
    return {
      available: false,
      message: 'Faktakoll inte tillgänglig',
      timestamp,
    };
  }

  const validResults = factCheckResults.filter(r => r.available && r.overallScore !== null);
  
  if (validResults.length === 0) {
    console.warn('[FactChecker] No valid fact-check results with scores');
    return {
      available: true,
      bestAgent: null,
      message: 'Inga verifierbara resultat',
      timestamp,
    };
  }

  // ===== GRUNDLÄGGANDE STATISTIK =====
  
  // Find agent with highest fact-check score
  const sorted = validResults.sort((a, b) => b.overallScore - a.overallScore);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  const avgScore = validResults.reduce((sum, r) => sum + r.overallScore, 0) / validResults.length;
  const totalClaims = validResults.reduce((sum, r) => sum + r.totalClaims, 0);
  const totalVerified = validResults.reduce((sum, r) => sum + r.verifiedCount, 0);
  const totalUnverified = totalClaims - totalVerified;

  // ===== TYPFÖRDELNING (Claim Type Distribution) =====
  // Räkna antal claims per typ över alla svar
  const claimTypeDistribution = {};
  const claimTypeVerificationRate = {}; // Verifieringsgrad per typ
  
  validResults.forEach(result => {
    if (result.claims && result.claims.length > 0) {
      result.claims.forEach(claim => {
        const type = claim.claimType || 'unknown';
        
        // Räkna totalt per typ
        if (!claimTypeDistribution[type]) {
          claimTypeDistribution[type] = { count: 0, verified: 0 };
        }
        claimTypeDistribution[type].count++;
        
        // Räkna verifierade per typ
        if (claim.verified) {
          claimTypeDistribution[type].verified++;
        }
      });
    }
  });
  
  // Beräkna verifieringsgrad per typ
  Object.keys(claimTypeDistribution).forEach(type => {
    const dist = claimTypeDistribution[type];
    claimTypeVerificationRate[type] = dist.count > 0 
      ? Math.round((dist.verified / dist.count) * 100) 
      : 0;
  });

  // ===== KÄLLTÄTHET (Source Density) =====
  // Genomsnittligt antal källor per claim
  let totalSourceCount = 0;
  let claimsWithSources = 0;
  
  validResults.forEach(result => {
    if (result.claims && result.claims.length > 0) {
      result.claims.forEach(claim => {
        if (claim.sourceCount !== undefined) {
          totalSourceCount += claim.sourceCount;
          claimsWithSources++;
        }
      });
    }
  });
  
  const averageSourcesPerClaim = claimsWithSources > 0 
    ? Math.round((totalSourceCount / claimsWithSources) * 10) / 10 
    : 0;

  // ===== OSÄKERHETSGRAD (Uncertainty Level) =====
  // Procentandel claims som INTE är verifierade
  const uncertaintyRate = totalClaims > 0 
    ? Math.round((totalUnverified / totalClaims) * 100) 
    : 0;

  // ===== CONFIDENCE DISTRIBUTION =====
  // Hur fördelar sig confidence-scores?
  const confidenceDistribution = {
    high: 0,    // 6.7-10 (verified)
    medium: 0,  // 3.3-6.6 (partially verified)
    low: 0,     // 0-3.2 (unverified)
  };
  
  validResults.forEach(result => {
    if (result.claims && result.claims.length > 0) {
      result.claims.forEach(claim => {
        if (claim.confidence >= 6.7) {
          confidenceDistribution.high++;
        } else if (claim.confidence >= 3.3) {
          confidenceDistribution.medium++;
        } else {
          confidenceDistribution.low++;
        }
      });
    }
  });

  // ===== NEUTRAL SCORES ANALYS =====
  // Räkna hur många svar har neutral score (7/10) - dvs inga claims
  const neutralResults = validResults.filter(r => r.overallScore === 7);
  const neutralCount = neutralResults.length;
  const neutralRate = Math.round((neutralCount / validResults.length) * 100);
  
  // ===== CLAIMS PER AGENT DISTRIBUTION =====
  const claimsPerAgent = validResults.map(r => ({
    agent: r.agent,
    claims: r.totalClaims || 0,
    verified: r.verifiedCount || 0,
    score: r.overallScore,
  }));

  // ===== MOTIV FÖR NEUTRAL BEDÖMNING =====
  // Skapa human-readable motivering när score är neutral
  let neutralAssessmentReason = null;
  if (neutralRate >= 50) {
    neutralAssessmentReason = `Majoriteten av svaren (${neutralRate}%) innehåller inga specifika verifierbara påståenden. Detta är vanligt för kvalitativa, åsiktsbaserade eller filosofiska svar där faktakoll inte är applicerbart.`;
  } else if (neutralCount > 0) {
    neutralAssessmentReason = `${neutralCount} av ${validResults.length} svar innehåller inga specifika verifierbara påståenden. Dessa svar fokuserar på kvalitativ analys snarare än faktapåståenden.`;
  }

  // ===== AGGREGERAD BIAS-SCORE (om tillgänglig) =====
  // Om responses innehåller bias-data, aggregera det
  let aggregatedBiasScore = null;
  const biasScores = factCheckResults
    .filter(r => r.biasScore !== undefined)
    .map(r => r.biasScore);
  
  if (biasScores.length > 0) {
    aggregatedBiasScore = Math.round(
      (biasScores.reduce((sum, s) => sum + s, 0) / biasScores.length) * 10
    ) / 10;
  }

  // ===== FÖRBÄTTRINGSFÖRSLAG =====
  const improvementSuggestions = [];
  
  if (uncertaintyRate > 50) {
    improvementSuggestions.push('Många påståenden är ej verifierade - överväg att be AI:n att ge mer konkreta, verifierbara påståenden.');
  }
  
  if (averageSourcesPerClaim < 2) {
    improvementSuggestions.push('Låg källtäthet - många claims har färre än 2 källor. Sök bredare eller mer specifika claims.');
  }
  
  if (totalClaims < validResults.length * 2) {
    improvementSuggestions.push('Få verifierbara påståenden totalt - svaren är mestadels kvalitativa. Detta är OK för vissa frågetyper.');
  }

  console.log(`[FactChecker] Enhanced comparison: Best: ${best.agent} (${best.overallScore}/10), Avg: ${Math.round(avgScore * 10) / 10}/10, Neutral: ${neutralRate}%`);

  // ===== RETURNERA FULLSTÄNDIG ANALYS =====
  return {
    // Grundläggande statistik
    available: true,
    bestAgent: best.agent,
    bestScore: best.overallScore,
    worstAgent: worst.agent,
    worstScore: worst.overallScore,
    averageScore: Math.round(avgScore * 10) / 10,
    totalClaims,
    totalVerified,
    totalUnverified,
    summary: `Bäst: ${best.agent} (${best.overallScore}/10) • Genomsnitt: ${Math.round(avgScore * 10) / 10}/10`,
    
    // Ny meta-data
    timestamp,
    agentCount: validResults.length,
    
    // Typfördelning
    claimTypeDistribution,
    claimTypeVerificationRate,
    
    // Källanalys
    averageSourcesPerClaim,
    totalSourceCount,
    sourceDensity: averageSourcesPerClaim >= 2 ? 'hög' : averageSourcesPerClaim >= 1 ? 'medel' : 'låg',
    
    // Osäkerhet
    uncertaintyRate,
    uncertaintyLevel: uncertaintyRate >= 50 ? 'hög' : uncertaintyRate >= 25 ? 'medel' : 'låg',
    
    // Confidence distribution
    confidenceDistribution,
    
    // Neutral bedömning
    neutralCount,
    neutralRate,
    neutralAssessmentReason,
    
    // Claims per agent
    claimsPerAgent,
    
    // Bias
    aggregatedBiasScore,
    
    // Förbättringar
    improvementSuggestions,
    
    // Transparens-metadata
    transparency: {
      claimsAnalyzed: totalClaims,
      claimsVerified: totalVerified,
      claimsUnverified: totalUnverified,
      averageConfidence: totalClaims > 0 
        ? Math.round((validResults.reduce((sum, r) => {
            return sum + (r.claims || []).reduce((s, c) => s + (c.confidence || 0), 0);
          }, 0) / totalClaims) * 10) / 10
        : 0,
    },
  };
}

export default {
  performFactCheck,
  batchFactCheck,
  compareFactChecks,
};
