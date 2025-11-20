/**
 * OQT Multi-Model Integration Tests
 * Tests for Mistral, LLaMA, and multi-model pipeline
 */

import { getMistralResponse, isMistralAvailable, getMistralInfo } from '../services/mistral.js';
import { getLlamaResponse, isLlamaAvailable, getLlamaInfo } from '../services/llama.js';
import {
  generateMultiModelResponses,
  analyzeMultiModelResponses,
  calculateConsensus,
  detectCrossBias,
  calculateFairnessIndex,
  generateMetaSummary,
  executeOQTMultiModelPipeline
} from '../services/oqtMultiModelPipeline.js';

describe('Mistral Service', () => {
  test('getMistralResponse should return a response', async () => {
    const result = await getMistralResponse('Vad är demokrati?');
    
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('metadata');
    expect(result.model).toBe('mistral-7b-instruct');
    expect(result.response.length).toBeGreaterThan(0);
  });

  test('isMistralAvailable should return true', async () => {
    const available = await isMistralAvailable();
    expect(available).toBe(true);
  });

  test('getMistralInfo should return model info', () => {
    const info = getMistralInfo();
    
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('version');
    expect(info).toHaveProperty('parameters');
    expect(info.parameters).toBe('7B');
  });
});

describe('LLaMA Service', () => {
  test('getLlamaResponse should return a response', async () => {
    const result = await getLlamaResponse('Vad är demokrati?');
    
    expect(result).toHaveProperty('response');
    expect(result).toHaveProperty('model');
    expect(result).toHaveProperty('metadata');
    expect(result.model).toContain('llama-2');
    expect(result.response.length).toBeGreaterThan(0);
  });

  test('isLlamaAvailable should return true', async () => {
    const available = await isLlamaAvailable();
    expect(available).toBe(true);
  });

  test('getLlamaInfo should return model info', () => {
    const info = getLlamaInfo();
    
    expect(info).toHaveProperty('name');
    expect(info).toHaveProperty('versions');
    expect(info.versions).toContain('7B');
    expect(info.versions).toContain('13B');
  });
});

describe('Multi-Model Pipeline', () => {
  test('generateMultiModelResponses should return responses from multiple models', async () => {
    const responses = await generateMultiModelResponses('Vad är demokrati?');
    
    expect(Array.isArray(responses)).toBe(true);
    expect(responses.length).toBeGreaterThanOrEqual(2); // At least Mistral + LLaMA
    
    const modelNames = responses.map(r => r.model);
    expect(modelNames).toContain('Mistral 7B');
    expect(modelNames).toContain('LLaMA-2 7B');
  });

  test('analyzeMultiModelResponses should analyze all responses', async () => {
    const rawResponses = await generateMultiModelResponses('Vad är demokrati?');
    const analyzed = await analyzeMultiModelResponses(rawResponses, 'Vad är demokrati?');
    
    expect(Array.isArray(analyzed)).toBe(true);
    expect(analyzed.length).toBe(rawResponses.length);
    
    analyzed.forEach(response => {
      expect(response).toHaveProperty('analysis');
      expect(response.analysis).toHaveProperty('bias');
      expect(response.analysis).toHaveProperty('sentiment');
      expect(response.analysis).toHaveProperty('tone');
    });
  });

  test('calculateConsensus should return consensus metrics', async () => {
    const rawResponses = await generateMultiModelResponses('Vad är demokrati?');
    const analyzed = await analyzeMultiModelResponses(rawResponses, 'Vad är demokrati?');
    const consensus = calculateConsensus(analyzed);
    
    expect(consensus).toHaveProperty('score');
    expect(consensus).toHaveProperty('level');
    expect(consensus).toHaveProperty('metrics');
    
    expect(typeof consensus.score).toBe('number');
    expect(consensus.score).toBeGreaterThanOrEqual(0);
    expect(consensus.score).toBeLessThanOrEqual(1);
    expect(['high', 'medium', 'low']).toContain(consensus.level);
  });

  test('detectCrossBias should return bias analysis', async () => {
    const rawResponses = await generateMultiModelResponses('Vad är demokrati?');
    const analyzed = await analyzeMultiModelResponses(rawResponses, 'Vad är demokrati?');
    const bias = detectCrossBias(analyzed);
    
    expect(bias).toHaveProperty('aggregatedScore');
    expect(bias).toHaveProperty('level');
    expect(bias).toHaveProperty('biasTypes');
    
    expect(typeof bias.aggregatedScore).toBe('number');
    expect(['high', 'medium', 'low']).toContain(bias.level);
    expect(Array.isArray(bias.biasTypes)).toBe(true);
  });

  test('calculateFairnessIndex should return fairness metrics', async () => {
    const rawResponses = await generateMultiModelResponses('Vad är demokrati?');
    const analyzed = await analyzeMultiModelResponses(rawResponses, 'Vad är demokrati?');
    const fairness = calculateFairnessIndex(analyzed);
    
    expect(fairness).toHaveProperty('score');
    expect(fairness).toHaveProperty('level');
    
    expect(typeof fairness.score).toBe('number');
    expect(fairness.score).toBeGreaterThanOrEqual(0);
    expect(fairness.score).toBeLessThanOrEqual(1);
    expect(['excellent', 'good', 'fair', 'poor']).toContain(fairness.level);
  });

  test('generateMetaSummary should return summary', async () => {
    const rawResponses = await generateMultiModelResponses('Vad är demokrati?');
    const analyzed = await analyzeMultiModelResponses(rawResponses, 'Vad är demokrati?');
    const consensus = calculateConsensus(analyzed);
    const bias = detectCrossBias(analyzed);
    const fairness = calculateFairnessIndex(analyzed);
    const metaSummary = generateMetaSummary(analyzed, consensus, bias, fairness);
    
    expect(metaSummary).toHaveProperty('totalModels');
    expect(metaSummary).toHaveProperty('consensusLevel');
    expect(metaSummary).toHaveProperty('biasLevel');
    expect(metaSummary).toHaveProperty('fairnessLevel');
    expect(metaSummary).toHaveProperty('keyThemes');
    expect(metaSummary).toHaveProperty('recommendation');
    
    expect(typeof metaSummary.totalModels).toBe('number');
    expect(Array.isArray(metaSummary.keyThemes)).toBe(true);
    expect(typeof metaSummary.recommendation).toBe('string');
  });

  test('executeOQTMultiModelPipeline should execute complete pipeline', async () => {
    const result = await executeOQTMultiModelPipeline('Vad är demokrati?');
    
    expect(result).toHaveProperty('rawResponses');
    expect(result).toHaveProperty('analyzedResponses');
    expect(result).toHaveProperty('consensus');
    expect(result).toHaveProperty('bias');
    expect(result).toHaveProperty('fairness');
    expect(result).toHaveProperty('metaSummary');
    expect(result).toHaveProperty('metadata');
    
    expect(Array.isArray(result.rawResponses)).toBe(true);
    expect(result.rawResponses.length).toBeGreaterThanOrEqual(2);
    
    expect(result.metadata).toHaveProperty('question');
    expect(result.metadata).toHaveProperty('pipelineVersion');
    expect(result.metadata.pipelineVersion).toBe('2.0');
  });
});

describe('Integration Tests', () => {
  test('Full query flow should work end-to-end', async () => {
    const question = 'Hur påverkar AI samhället?';
    
    // Execute pipeline
    const pipelineResult = await executeOQTMultiModelPipeline(question, {
      includeExternal: false,
    });
    
    // Verify all components
    expect(pipelineResult.rawResponses.length).toBeGreaterThanOrEqual(2);
    expect(pipelineResult.analyzedResponses.length).toBe(pipelineResult.rawResponses.length);
    
    // Verify consensus
    expect(pipelineResult.consensus.score).toBeGreaterThanOrEqual(0);
    expect(pipelineResult.consensus.score).toBeLessThanOrEqual(1);
    
    // Verify bias
    expect(pipelineResult.bias.aggregatedScore).toBeGreaterThanOrEqual(0);
    
    // Verify fairness
    expect(pipelineResult.fairness.score).toBeGreaterThanOrEqual(0);
    expect(pipelineResult.fairness.score).toBeLessThanOrEqual(1);
    
    // Verify meta summary
    expect(pipelineResult.metaSummary.recommendation).toBeTruthy();
    expect(pipelineResult.metaSummary.keyThemes.length).toBeGreaterThan(0);
    
    // Verify metadata
    expect(pipelineResult.metadata.question).toBe(question);
    expect(pipelineResult.metadata.processingTime_ms).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for full pipeline
});
