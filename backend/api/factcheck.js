/**
 * Fact Checking API Endpoints
 * 
 * This module provides API endpoints for fact-checking using Google Fact Check Claim Search API.
 * Integrates with ChatV2 frontend fact-checking panel.
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

const GOOGLE_FACTCHECK_API_KEY = process.env.GOOGLE_FACTCHECK_API_KEY;
const GOOGLE_FACTCHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

/**
 * Sanitize text to prevent XSS attacks
 * Removes HTML tags and escapes special characters
 */
function sanitizeText(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * POST /fact-check/verify
 * Fact verification using Google Fact Check Claim Search API
 * 
 * Verifies claims and provides ClaimReview data with verdicts, publishers, and dates.
 */
router.post('/verify', async (req, res) => {
  try {
    const { claim, context = '', max_sources = 5 } = req.body;

    if (!claim) {
      return res.status(400).json({ 
        error: 'Missing required field: claim' 
      });
    }

    // Check if Google Fact Check API key is configured
    if (!GOOGLE_FACTCHECK_API_KEY) {
      console.warn('Google Fact Check API key not configured, returning placeholder');
      
      // Return placeholder data when API key is not configured
      // TODO: Backend team - configure GOOGLE_FACTCHECK_API_KEY environment variable
      return res.json({
        verificationStatus: 'unverified',
        confidence: 0.0,
        verdict: 'Fact checking service not configured. Please set GOOGLE_FACTCHECK_API_KEY environment variable.',
        publisher: 'N/A',
        date: null,
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Google Fact Check (not configured)',
          note: 'GOOGLE_FACTCHECK_API_KEY environment variable not set'
        }
      });
    }

    try {
      // Call Google Fact Check API
      const searchQuery = context ? `${claim} ${context}` : claim;
      
      const googleResponse = await axios.get(
        GOOGLE_FACTCHECK_API_URL,
        {
          params: {
            key: GOOGLE_FACTCHECK_API_KEY,
            query: searchQuery,
            languageCode: 'en',
            pageSize: max_sources,
          },
          timeout: 10000,
        }
      );

      const claims = googleResponse.data.claims || [];
      
      if (claims.length === 0) {
        return res.json({
          verificationStatus: 'unverified',
          confidence: 0.0,
          verdict: 'No fact-checks found for this claim',
          publisher: 'N/A',
          date: null,
          timestamp: new Date().toISOString(),
          metadata: {
            api: 'Google Fact Check',
            query: searchQuery,
            results_found: 0
          }
        });
      }

      // Get the first (most relevant) claim review
      const topClaim = claims[0];
      const claimReview = topClaim.claimReview?.[0];
      
      if (!claimReview) {
        return res.json({
          verificationStatus: 'unverified',
          confidence: 0.0,
          verdict: 'No ClaimReview data available',
          publisher: 'N/A',
          date: null,
          timestamp: new Date().toISOString(),
          metadata: {
            api: 'Google Fact Check',
            query: searchQuery
          }
        });
      }

      // Calculate confidence based on textual rating
      const textualRating = claimReview.textualRating || 'Unverified';
      const publisher = claimReview.publisher?.name || 'Unknown Publisher';
      
      let confidence = 5.0;
      let verificationStatus = 'unverified';
      
      const rating = textualRating.toLowerCase();
      if (rating.includes('true') && !rating.includes('false') && !rating.includes('mostly')) {
        confidence = 9.0;
        verificationStatus = 'true';
      } else if (rating.includes('mostly true') || rating.includes('largely true')) {
        confidence = 7.5;
        verificationStatus = 'mostly_true';
      } else if (rating.includes('partly true') || rating.includes('half true') || rating.includes('mixture')) {
        confidence = 6.0;
        verificationStatus = 'partially_true';
      } else if (rating.includes('mostly false') || rating.includes('largely false')) {
        confidence = 2.5;
        verificationStatus = 'mostly_false';
      } else if (rating.includes('false') && !rating.includes('mostly')) {
        confidence = 1.0;
        verificationStatus = 'false';
      }

      return res.json({
        verificationStatus,
        confidence: confidence / 10, // Normalize to 0-1 range
        verdict: sanitizeText(textualRating),
        publisher: sanitizeText(publisher),
        date: claimReview.reviewDate || topClaim.claimDate,
        url: claimReview.url,
        title: sanitizeText(claimReview.title || ''),
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Google Fact Check',
          query: searchQuery,
          results_found: claims.length,
          oqt_training_event: true,
          oqt_version: 'OQT-1.0.v12.7'
        }
      });

    } catch (googleError) {
      console.error('Google Fact Check API error:', googleError.message);
      
      // Return error response but with proper structure
      return res.json({
        verificationStatus: 'unverified',
        confidence: 0.0,
        verdict: `Fact checking service error: ${googleError.message}`,
        publisher: 'N/A',
        date: null,
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Google Fact Check (error)',
          error: googleError.message
        }
      });
    }

  } catch (error) {
    console.error('Fact check endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to verify claim',
      message: error.message 
    });
  }
});

/**
 * POST /fact-check/sources
 * Get credible fact-check sources for a query
 * 
 * Searches for fact-checks related to a query from established fact-checking organizations.
 */
router.post('/sources', async (req, res) => {
  try {
    const { query, num_sources = 10, language = 'en' } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Missing required field: query' 
      });
    }

    if (!GOOGLE_FACTCHECK_API_KEY) {
      return res.json({
        sources: [],
        total: 0,
        metadata: {
          query_time_ms: 0,
          note: 'GOOGLE_FACTCHECK_API_KEY not configured'
        }
      });
    }

    try {
      const startTime = Date.now();
      
      const googleResponse = await axios.get(
        GOOGLE_FACTCHECK_API_URL,
        {
          params: {
            key: GOOGLE_FACTCHECK_API_KEY,
            query,
            languageCode: language,
            pageSize: num_sources,
          },
          timeout: 10000,
        }
      );

      const claims = googleResponse.data.claims || [];
      const queryTime = Date.now() - startTime;

      const sources = claims.map(claimData => {
        const claimReview = claimData.claimReview?.[0];
        if (!claimReview) return null;
        
        const publisher = claimReview.publisher?.name || 'Unknown';
        
        // Assign credibility based on publisher
        let credibility = 0.7;
        const lowerPublisher = publisher.toLowerCase();
        if (lowerPublisher.includes('politifact') || lowerPublisher.includes('snopes') || 
            lowerPublisher.includes('factcheck.org') || lowerPublisher.includes('full fact')) {
          credibility = 0.95;
        } else if (lowerPublisher.includes('afp') || lowerPublisher.includes('reuters')) {
          credibility = 0.90;
        } else if (lowerPublisher.includes('associated press') || lowerPublisher.includes('bbc')) {
          credibility = 0.85;
        }

        return {
          url: claimReview.url,
          title: claimReview.title || 'Untitled',
          publisher: publisher,
          verdict: claimReview.textualRating || 'Not rated',
          date: claimReview.reviewDate || claimData.claimDate,
          credibility
        };
      }).filter(source => source !== null);

      return res.json({
        sources,
        total: sources.length,
        metadata: {
          query_time_ms: queryTime,
          api: 'Google Fact Check'
        }
      });

    } catch (googleError) {
      console.error('Google Fact Check API error for sources:', googleError.message);
      
      return res.json({
        sources: [],
        total: 0,
        metadata: {
          query_time_ms: 0,
          error: googleError.message
        }
      });
    }

  } catch (error) {
    console.error('Sources endpoint error:', error);
    res.status(500).json({ 
      error: 'Failed to get sources',
      message: error.message 
    });
  }
});

export default router;
