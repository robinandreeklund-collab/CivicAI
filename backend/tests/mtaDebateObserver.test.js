/**
 * Integration tests for MTA-Debate-Observer
 * Tests the complete MTA analysis flow
 */

import { jest } from '@jest/globals';

// Mock OpenAI response before importing modules
const mockOpenAIResponse = {
  response: JSON.stringify({
    analysis: {
      relevance: { score: 8.5, reasoning: 'Highly relevant to the question' },
      argument_depth: { score: 7.8, reasoning: 'Good argumentation depth' },
      factual_anchoring: { score: 7.2, reasoning: 'Some factual support' },
      bias_detection: { score: 3.5, reasoning: 'Minimal bias detected' },
      logical_coherence: { score: 8.8, reasoning: 'Strong logical flow' },
      originality: { score: 6.5, reasoning: 'Moderately original perspective' },
      clarity: { score: 9.0, reasoning: 'Very clear communication' },
      constructiveness: { score: 8.2, reasoning: 'Constructive contribution' },
    },
    summary: {
      strengths: ['Clear communication', 'Strong logic'],
      weaknesses: ['Could use more data'],
      key_insights: ['Well-balanced perspective'],
    },
  }),
  model: 'gpt-3.5-turbo',
};

// Mock the OpenAI module
jest.unstable_mockModule('../../services/openai.js', () => ({
  getOpenAIResponse: jest.fn(() => Promise.resolve(mockOpenAIResponse)),
}));

// Import after mocking
const { 
  analyzeMTADebateResponse, 
  generateMTACommentary,
  generateMTAInsight,
  batchAnalyzeMTAResponses,
} = await import('../../services/mtaDebateObserver.js');

describe('MTA-Debate-Observer Integration Tests', () => {
  const testQuestion = 'Ska Sverige satsa mer på förnybar energi?';
  const testResponse = 'Ja, Sverige bör absolut satsa mer på förnybar energi. Det finns flera starka argument för detta...';
  
  test('analyzeMTADebateResponse should return valid analysis', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      testResponse,
      testQuestion
    );
    
    expect(analysis).toBeDefined();
    expect(analysis.agent_name).toBe('gpt-3.5');
    expect(analysis.round_number).toBe(1);
    expect(analysis.timestamp).toBeDefined();
    expect(analysis.response_text).toBeDefined();
    
    // Check analysis structure
    expect(analysis.analysis).toBeDefined();
    expect(analysis.analysis.relevance).toBeDefined();
    expect(analysis.analysis.relevance.score).toBeGreaterThanOrEqual(0);
    expect(analysis.analysis.relevance.score).toBeLessThanOrEqual(10);
    expect(analysis.analysis.relevance.reasoning).toBeDefined();
    
    // Check summary
    expect(analysis.summary).toBeDefined();
    expect(analysis.summary.overall_score).toBeGreaterThanOrEqual(0);
    expect(analysis.summary.overall_score).toBeLessThanOrEqual(10);
    expect(analysis.summary.weighted_score).toBeDefined();
    expect(Array.isArray(analysis.summary.strengths)).toBe(true);
    expect(Array.isArray(analysis.summary.weaknesses)).toBe(true);
    expect(Array.isArray(analysis.summary.key_insights)).toBe(true);
  }, 15000); // 15 second timeout
  
  test('all 8 evaluation dimensions should be present', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gemini',
      1,
      testResponse,
      testQuestion
    );
    
    const expectedDimensions = [
      'relevance',
      'argument_depth',
      'factual_anchoring',
      'bias_detection',
      'logical_coherence',
      'originality',
      'clarity',
      'constructiveness',
    ];
    
    expectedDimensions.forEach(dimension => {
      expect(analysis.analysis[dimension]).toBeDefined();
      expect(analysis.analysis[dimension].score).toBeDefined();
      expect(analysis.analysis[dimension].reasoning).toBeDefined();
    });
  }, 15000);
  
  test('batchAnalyzeMTAResponses should handle multiple responses', async () => {
    const responses = [
      {
        agentName: 'gpt-3.5',
        roundNum: 1,
        response: testResponse,
        question: testQuestion,
      },
      {
        agentName: 'gemini',
        roundNum: 1,
        response: 'Nej, jag tycker inte att Sverige behöver satsa mer...',
        question: testQuestion,
      },
    ];
    
    const analyses = await batchAnalyzeMTAResponses(responses);
    
    expect(analyses).toBeDefined();
    expect(Array.isArray(analyses)).toBe(true);
    expect(analyses.length).toBe(2);
    expect(analyses[0].agent_name).toBe('gpt-3.5');
    expect(analyses[1].agent_name).toBe('gemini');
  }, 20000);
  
  test('generateMTACommentary should return commentary text', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      testResponse,
      testQuestion
    );
    
    const commentary = await generateMTACommentary(
      'gpt-3.5',
      1,
      testResponse,
      analysis,
      [analysis]
    );
    
    expect(commentary).toBeDefined();
    expect(typeof commentary).toBe('string');
    expect(commentary.length).toBeGreaterThan(0);
  }, 15000);
  
  test('generateMTAInsight should return insight with emoji', async () => {
    const analysis1 = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      testResponse,
      testQuestion
    );
    
    const analysis2 = await analyzeMTADebateResponse(
      'gemini',
      1,
      'Ja, förnybar energi är framtiden...',
      testQuestion
    );
    
    const insight = await generateMTAInsight(1, [analysis1, analysis2]);
    
    expect(insight).toBeDefined();
    expect(typeof insight).toBe('string');
    expect(insight).toContain('💡');
  }, 20000);
  
  test('analysis should have correct weighted scoring', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      testResponse,
      testQuestion
    );
    
    // Weighted score should be different from overall score due to weights
    expect(analysis.summary.weighted_score).toBeDefined();
    expect(typeof analysis.summary.weighted_score).toBe('number');
    
    // Both scores should be in valid range
    expect(analysis.summary.overall_score).toBeGreaterThanOrEqual(0);
    expect(analysis.summary.overall_score).toBeLessThanOrEqual(10);
    expect(analysis.summary.weighted_score).toBeGreaterThanOrEqual(0);
    expect(analysis.summary.weighted_score).toBeLessThanOrEqual(10);
  }, 15000);
  
  test('fallback analysis should be provided on error', async () => {
    // Force an error by passing invalid data
    const { getOpenAIResponse } = await import('../../services/openai.js');
    getOpenAIResponse.mockRejectedValueOnce(new Error('API Error'));
    
    const analysis = await analyzeMTADebateResponse(
      'error-agent',
      1,
      testResponse,
      testQuestion
    );
    
    expect(analysis).toBeDefined();
    expect(analysis.fallback).toBe(true);
    expect(analysis.summary.overall_score).toBeDefined();
  }, 15000);
  
  test('response text should be truncated if too long', async () => {
    const longResponse = 'a'.repeat(1000);
    
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      longResponse,
      testQuestion
    );
    
    expect(analysis.response_text.length).toBeLessThanOrEqual(503); // 500 + '...'
    expect(analysis.response_text).toContain('...');
  }, 15000);
});

describe('MTA-DO Data Validation', () => {
  test('timestamp should be ISO8601 format', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      'Test response',
      'Test question'
    );
    
    const timestamp = analysis.timestamp;
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  }, 15000);
  
  test('all scores should be clamped to 0-10 range', async () => {
    const analysis = await analyzeMTADebateResponse(
      'gpt-3.5',
      1,
      'Test response',
      'Test question'
    );
    
    Object.values(analysis.analysis).forEach(dimension => {
      expect(dimension.score).toBeGreaterThanOrEqual(0);
      expect(dimension.score).toBeLessThanOrEqual(10);
    });
  }, 15000);
});
