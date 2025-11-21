/**
 * Fact Checker Service
 * 
 * Provides automated fact-checking for AI responses using the Google Fact Check Claim Search API.
 * This module extracts verifiable claims from text and validates them against
 * established fact-checking organizations to ensure accuracy and transparency.
 * 
 * WORKFLOW:
 * 1. Extract and classify claims from AI response text
 * 2. Search Google Fact Check API for verified fact-checks
 * 3. Retrieve ClaimReview data with verdicts, publishers, and dates
 * 4. Calculate confidence levels based on fact-check results
 * 5. Return comprehensive verification results with provenance
 * 
 * CLAIM TYPES:
 * - Statistical: Percentages, ratios, numeric data
 * - Temporal: Dates, years, time periods
 * - Scientific: Research references, studies
 * - Historical: Historical facts and events
 * - Definitive: Absolute statements requiring verification
 * 
 * CONFIDENCE SCORING:
 * - Based on fact-check verdict and publisher credibility
 * - True verdicts: 8.0-10.0 confidence
 * - Partly true verdicts: 5.0-7.0 confidence
 * - Unverified/no results: 3.0-5.0 confidence
 * - False verdicts: 0.0-3.0 confidence
 * 
 * OVERALL SCORE CALCULATION:
 * - 50% weight: Verification rate (verified/total)
 * - 50% weight: Average confidence
 * - Result scaled 0-10
 * 
 * @module factChecker
 * @requires axios - HTTP client for Google Fact Check API
 * @requires dotenv - Environment configuration
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_FACTCHECK_API_KEY = process.env.GOOGLE_FACTCHECK_API_KEY;
const GOOGLE_FACTCHECK_ENDPOINT = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// OQT Configuration
const OQT_VERSION = 'OQT-1.0.v12.7';

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
 * Search Google Fact Check API for fact verification
 * Queries the Google Fact Check Claim Search API to find verified fact-checks from established organizations
 * @param {string} claim - The claim to verify
 * @param {number} maxResults - Maximum number of results to retrieve (default: 10)
 * @returns {Promise<Object>} Fact-check results with ClaimReview data
 */
async function searchGoogleFactCheck(claim, maxResults = 10) {
  if (!GOOGLE_FACTCHECK_API_KEY) {
    console.warn('[FactChecker] Google FactCheck API key not configured');
    return { available: false, claims: [] };
  }

  try {
    console.log(`[FactChecker] Searching Google Fact Check for: "${claim.substring(0, 50)}..." (max ${maxResults} results)`);
    
    const response = await axios.get(GOOGLE_FACTCHECK_ENDPOINT, {
      params: {
        key: GOOGLE_FACTCHECK_API_KEY,
        query: claim,
        languageCode: 'en', // Can be made configurable
        pageSize: maxResults,
      },
      timeout: 10000, // 10 second timeout
    });

    const claims = response.data.claims || [];
    console.log(`[FactChecker] Google Fact Check returned ${claims.length} results`);
    
    // Process claims to extract ClaimReview data
    const processedResults = claims.map(claimData => {
      const claimReview = claimData.claimReview?.[0]; // Get first ClaimReview
      if (!claimReview) return null;
      
      return {
        claim: claimData.text || claim,
        claimant: claimData.claimant || 'Unknown',
        publisher: claimReview.publisher?.name || 'Unknown Publisher',
        url: claimReview.url,
        title: claimReview.title || 'Untitled',
        reviewDate: claimReview.reviewDate || claimData.claimDate,
        textualRating: claimReview.textualRating || 'Not rated',
        languageCode: claimReview.languageCode || 'en',
      };
    }).filter(result => result !== null);
    
    return {
      available: true,
      claims: processedResults,
      totalResults: processedResults.length,
    };
  } catch (error) {
    console.error('[FactChecker] Google FactCheck API error:', error.message);
    
    // Provide more detailed error information
    if (error.response) {
      console.error('[FactChecker] API response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('[FactChecker] No response received from Google Fact Check API');
    }
    
    return {
      available: false,
      error: error.message,
      claims: [],
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
 * Calculate confidence level for a claim based on fact-check verdict
 * Confidence scoring algorithm based on Google Fact Check ratings:
 * - True/Correct: 8.0-10.0 confidence (highly verified)
 * - Mostly True/Partly True: 5.0-7.0 confidence (partially verified)
 * - Mixed/Unverified: 3.0-5.0 confidence (unclear)
 * - Mostly False/False: 0.0-3.0 confidence (contradicted)
 * - No results: 0.0 confidence (unverified)
 * @param {string} textualRating - The textual rating from Google Fact Check
 * @param {string} publisher - The publisher name for credibility weighting
 * @returns {number} Confidence score (0-10)
 */
function calculateConfidence(textualRating, publisher = '') {
  if (!textualRating) return 0;
  
  const rating = textualRating.toLowerCase();
  
  // High credibility publishers get a boost
  const highCredibilityPublishers = ['politifact', 'snopes', 'afp', 'factcheck.org', 'full fact'];
  const credibilityBoost = highCredibilityPublishers.some(pub => publisher.toLowerCase().includes(pub)) ? 0.5 : 0;
  
  // Classify based on common fact-check ratings
  if (rating.includes('true') && !rating.includes('false') && !rating.includes('mostly')) {
    return Math.min(10.0, 9.0 + credibilityBoost);
  } else if (rating.includes('mostly true') || rating.includes('largely true')) {
    return Math.min(10.0, 7.5 + credibilityBoost);
  } else if (rating.includes('partly true') || rating.includes('half true') || rating.includes('mixture')) {
    return Math.min(10.0, 6.0 + credibilityBoost);
  } else if (rating.includes('mostly false') || rating.includes('largely false')) {
    return Math.min(10.0, 2.5 + credibilityBoost);
  } else if (rating.includes('false') && !rating.includes('mostly')) {
    return Math.min(10.0, 1.0 + credibilityBoost);
  } else if (rating.includes('unverified') || rating.includes('unproven')) {
    return Math.min(10.0, 4.0 + credibilityBoost);
  }
  
  // Default for unknown ratings
  return 5.0;
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
 * @returns {Promise<Object>} Fact-check results with ClaimReview data and confidence scores
 */
export async function performFactCheck(responseText, agentName) {
  console.log(`[FactChecker] Starting fact-check for ${agentName}`);
  
  if (!GOOGLE_FACTCHECK_API_KEY) {
    console.warn('[FactChecker] Google FactCheck API key not configured');
    return {
      available: false,
      message: 'Google Fact Check API-nyckel saknas - faktakoll ej tillgänglig',
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

    // Step 2: Verify each claim using Google Fact Check API
    const verificationResults = [];
    
    for (const claim of claims) {
      console.log(`[FactChecker] Verifying claim: ${claim.text.substring(0, 50)}...`);
      
      // Search Google Fact Check API
      const factCheckResults = await searchGoogleFactCheck(claim.text, 5);
      
      if (factCheckResults.available && factCheckResults.claims.length > 0) {
        // Use the first (most relevant) fact-check result
        const topResult = factCheckResults.claims[0];
        
        // Calculate confidence based on verdict
        const confidence = calculateConfidence(topResult.textualRating, topResult.publisher);
        
        // Mark as verified if confidence >= 6.0 (mostly true or better)
        const verified = confidence >= 6.0;
        
        console.log(`[FactChecker] Found fact-check: ${topResult.textualRating}, verified: ${verified}, confidence: ${confidence}`);
        
        verificationResults.push({
          claim: claim.text.substring(0, 150), // Truncate for display
          claimType: claim.type,
          claimDescription: claim.description,
          verified: verified,
          confidence: confidence,
          verdict: topResult.textualRating,
          publisher: topResult.publisher,
          date: topResult.reviewDate,
          url: topResult.url,
          title: topResult.title,
          oqt_training_event: true, // Mark for OQT training
          oqt_version: OQT_VERSION, // OQT version
        });
      } else {
        // No fact-check found
        console.warn(`[FactChecker] No fact-check found for claim: ${claim.text.substring(0, 50)}...`);
        verificationResults.push({
          claim: claim.text.substring(0, 150),
          claimType: claim.type,
          claimDescription: claim.description,
          verified: false,
          confidence: 0,
          verdict: 'Unverified',
          publisher: 'N/A',
          date: null,
          warning: 'Inga faktakollar hittades för detta påstående',
          oqt_training_event: false,
          oqt_version: OQT_VERSION,
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
  calculateConfidence, // Export for use in API endpoints
  OQT_VERSION, // Export constant
};
