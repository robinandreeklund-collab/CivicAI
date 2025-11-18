/**
 * Fact Checking API Endpoints
 * 
 * This module provides API endpoints for fact-checking using external services like Tavily.
 * Integrates with ChatV2 frontend fact-checking panel.
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

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
 * Fact verification using Tavily API
 * 
 * Verifies claims and provides source citations with credibility scores.
 */
router.post('/verify', async (req, res) => {
  try {
    const { claim, context = '', max_sources = 5 } = req.body;

    if (!claim) {
      return res.status(400).json({ 
        error: 'Missing required field: claim' 
      });
    }

    // Check if Tavily API key is configured
    if (!TAVILY_API_KEY) {
      console.warn('Tavily API key not configured, returning placeholder');
      
      // Return placeholder data when API key is not configured
      // TODO: Backend team - configure TAVILY_API_KEY environment variable
      return res.json({
        verificationStatus: 'unverified',
        confidence: 0.0,
        verdict: 'Fact checking service not configured. Please set TAVILY_API_KEY environment variable.',
        sources: [],
        supportingEvidence: 0,
        contradictingEvidence: 0,
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Tavily (not configured)',
          search_depth: 'unavailable',
          note: 'TAVILY_API_KEY environment variable not set'
        }
      });
    }

    try {
      // Call Tavily API for fact checking
      const searchQuery = context ? `${claim} ${context}` : claim;
      
      const tavilyResponse = await axios.post(
        TAVILY_API_URL,
        {
          api_key: TAVILY_API_KEY,
          query: searchQuery,
          search_depth: 'advanced',
          max_results: max_sources,
          include_answer: true,
          include_raw_content: false
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const results = tavilyResponse.data.results || [];
      const answer = tavilyResponse.data.answer || '';

      // Process sources and assign credibility based on domain
      const sources = results.map(result => {
        const url = new URL(result.url);
        const domain = url.hostname;
        
        // Simple credibility scoring based on domain type
        let credibility = 0.7; // Default credibility
        if (domain.endsWith('.gov') || domain.endsWith('.edu')) {
          credibility = 0.95;
        } else if (domain.endsWith('.org')) {
          credibility = 0.85;
        } else if (domain.includes('wikipedia') || domain.includes('britannica')) {
          credibility = 0.80;
        }

        return {
          url: result.url,
          title: sanitizeText(result.title) || 'Untitled',
          snippet: sanitizeText(result.content?.substring(0, 200)) || '',
          credibility,
          date: result.published_date || null
        };
      });

      // Determine verification status based on answer and sources
      let verificationStatus = 'unverified';
      let confidence = 0.5;

      if (sources.length >= 3) {
        // If we have multiple sources, attempt to classify
        const avgCredibility = sources.reduce((sum, s) => sum + s.credibility, 0) / sources.length;
        confidence = avgCredibility;

        if (answer.toLowerCase().includes('true') || answer.toLowerCase().includes('correct')) {
          verificationStatus = 'true';
        } else if (answer.toLowerCase().includes('false') || answer.toLowerCase().includes('incorrect')) {
          verificationStatus = 'false';
        } else if (answer.toLowerCase().includes('partial') || answer.toLowerCase().includes('mixed')) {
          verificationStatus = 'partially_true';
        } else {
          verificationStatus = 'unverified';
          confidence = 0.6;
        }
      }

      return res.json({
        verificationStatus,
        confidence,
        verdict: sanitizeText(answer) || 'Unable to determine verification status from available sources.',
        sources,
        supportingEvidence: Math.floor(sources.length * 0.7), // Estimate
        contradictingEvidence: Math.floor(sources.length * 0.3), // Estimate
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Tavily',
          search_depth: 'advanced',
          query: searchQuery
        }
      });

    } catch (tavilyError) {
      console.error('Tavily API error:', tavilyError.message);
      
      // Return error response but with proper structure
      return res.json({
        verificationStatus: 'unverified',
        confidence: 0.0,
        verdict: `Fact checking service error: ${tavilyError.message}`,
        sources: [],
        supportingEvidence: 0,
        contradictingEvidence: 0,
        timestamp: new Date().toISOString(),
        metadata: {
          api: 'Tavily (error)',
          search_depth: 'unavailable',
          error: tavilyError.message
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
 * Get credible sources for a topic
 * 
 * Searches for credible sources related to a query.
 */
router.post('/sources', async (req, res) => {
  try {
    const { query, num_sources = 10, domain_filter = [] } = req.body;

    if (!query) {
      return res.status(400).json({ 
        error: 'Missing required field: query' 
      });
    }

    if (!TAVILY_API_KEY) {
      return res.json({
        sources: [],
        total: 0,
        metadata: {
          query_time_ms: 0,
          note: 'TAVILY_API_KEY not configured'
        }
      });
    }

    try {
      const startTime = Date.now();
      
      const tavilyResponse = await axios.post(
        TAVILY_API_URL,
        {
          api_key: TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          max_results: num_sources,
          include_domains: domain_filter.length > 0 ? domain_filter : undefined
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const results = tavilyResponse.data.results || [];
      const queryTime = Date.now() - startTime;

      const sources = results.map(result => {
        const url = new URL(result.url);
        const domain = url.hostname;
        
        let credibility = 0.7;
        if (domain.endsWith('.gov') || domain.endsWith('.edu')) {
          credibility = 0.95;
        } else if (domain.endsWith('.org')) {
          credibility = 0.85;
        }

        return {
          url: result.url,
          title: result.title || 'Untitled',
          credibility
        };
      });

      return res.json({
        sources,
        total: sources.length,
        metadata: {
          query_time_ms: queryTime
        }
      });

    } catch (tavilyError) {
      console.error('Tavily API error for sources:', tavilyError.message);
      
      return res.json({
        sources: [],
        total: 0,
        metadata: {
          query_time_ms: 0,
          error: tavilyError.message
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
