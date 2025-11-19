/**
 * Topic Modeling Integration Tests
 * Tests for BERTopic and Gensim topic modeling functionality
 */

import { jest } from '@jest/globals';

// Mock axios for Python service calls
const mockAxios = {
  get: jest.fn(),
  post: jest.fn()
};

jest.unstable_mockModule('axios', () => ({
  default: mockAxios
}));

// Import after mocking
const { topicModelingWithBoth, topicModelingWithGensim, topicModelingWithBERTopic } = 
  await import('../services/pythonNLPClient.js');

describe('Topic Modeling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('topicModelingWithBoth', () => {
    it('should call Python service with method="both"', async () => {
      const mockResponse = {
        data: {
          method: 'both',
          bertopic: {
            topics: [
              { topic_id: 0, name: 'climate_change', count: 10 }
            ],
            model: 'BERTopic',
            version: '0.16.0'
          },
          gensim: {
            topics: [
              { topic_id: 0, label: 'Topic 0', terms: [{ word: 'climate', weight: 0.5 }] }
            ],
            num_topics: 1,
            model: 'Gensim LDA',
            version: '4.3.2'
          },
          provenance: {
            models: ['BERTopic', 'Gensim LDA'],
            method: 'Parallel topic modeling with BERTopic and Gensim LDA',
            timestamp: new Date().toISOString()
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await topicModelingWithBoth('test text about climate change');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/topic-modeling'),
        expect.objectContaining({
          text: 'test text about climate change',
          method: 'both'
        }),
        expect.objectContaining({ timeout: 30000 })
      );

      expect(result.success).toBe(true);
      expect(result.data.method).toBe('both');
      expect(result.data.bertopic).toBeDefined();
      expect(result.data.gensim).toBeDefined();
    });

    it('should handle Python service unavailable', async () => {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      mockAxios.post.mockRejectedValueOnce(error);

      const result = await topicModelingWithBoth('test text');

      expect(result.success).toBe(false);
      expect(result.fallback).toBe(true);
      expect(result.error).toBe('Python service not reachable');
    });

    it('should handle partial results (only Gensim available)', async () => {
      const mockResponse = {
        data: {
          method: 'both',
          bertopic: null,
          gensim: {
            topics: [
              { topic_id: 0, label: 'Topic 0', terms: [{ word: 'test', weight: 0.5 }] }
            ],
            num_topics: 1
          },
          provenance: {
            models: ['Gensim LDA'],
            method: 'Partial topic modeling (Gensim only)',
            timestamp: new Date().toISOString()
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await topicModelingWithBoth('test text');

      expect(result.success).toBe(true);
      expect(result.data.bertopic).toBeNull();
      expect(result.data.gensim).toBeDefined();
    });
  });

  describe('topicModelingWithGensim', () => {
    it('should call Python service with method="gensim"', async () => {
      const mockResponse = {
        data: {
          topics: [
            { topic_id: 0, label: 'Topic 0', terms: [{ word: 'test', weight: 0.5 }] }
          ],
          num_topics: 1,
          provenance: {
            model: 'Gensim LDA',
            version: '4.3.2'
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await topicModelingWithGensim('test text');

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/topic-modeling'),
        expect.objectContaining({
          text: 'test text',
          method: 'gensim'
        }),
        expect.any(Object)
      );

      expect(result.success).toBe(true);
      expect(result.data.topics).toBeDefined();
    });
  });

  describe('topicModelingWithBERTopic', () => {
    it('should call Python service for BERTopic', async () => {
      const mockResponse = {
        data: {
          topics: [
            { topic_id: 0, name: 'climate_change', count: 10 }
          ],
          provenance: {
            model: 'BERTopic',
            version: '0.16.0'
          }
        }
      };

      mockAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await topicModelingWithBERTopic(['text 1', 'text 2', 'text 3']);

      expect(mockAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/topic-modeling'),
        expect.objectContaining({
          texts: ['text 1', 'text 2', 'text 3']
        }),
        expect.any(Object)
      );

      expect(result.success).toBe(true);
      expect(result.data.topics).toBeDefined();
    });
  });
});
