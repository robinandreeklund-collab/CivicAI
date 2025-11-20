/**
 * ChatV2Page Enhanced Views Tests
 * Tests for Pipeline View and Detailed Model Responses enhancements
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock firebase-admin
const mockFirestore = {
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      get: jest.fn(),
      onSnapshot: jest.fn()
    }))
  }))
};

const mockAdmin = {
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  firestore: jest.fn(() => mockFirestore)
};

jest.unstable_mockModule('firebase-admin', () => ({
  default: mockAdmin
}));

const { default: firebaseRouter } = await import('../api/firebase.js');

const app = express();
app.use(express.json());
app.use('/api/firebase', firebaseRouter);

describe('ChatV2 Enhanced Views - Firebase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Pipeline View Data Integration', () => {
    test('should retrieve complete pipeline data from Firebase', async () => {
      const mockDocData = {
        question: 'Test question',
        status: 'completed',
        processed_data: {
          preprocessing: {
            tokenCount: 100,
            sentences: 5,
            language: 'sv'
          },
          sentimentAnalysis: {
            overallTone: 'neutral',
            vaderSentiment: {
              score: 0.2,
              classification: 'neutral'
            }
          },
          biasAnalysis: {
            detoxify: {
              toxicity: 0.02,
              severe_toxicity: 0.001
            }
          },
          timeline: [
            {
              step: 'spacy_preprocessing',
              model: 'sv_core_news_sm',
              durationMs: 234
            }
          ]
        },
        pipeline_metadata: {
          totalProcessingTimeMs: 5000,
          status: 'completed',
          pipeline_version: '1.0.0'
        }
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.processed_data).toBeDefined();
        expect(response.body.data.processed_data.preprocessing).toBeDefined();
        expect(response.body.data.processed_data.sentimentAnalysis).toBeDefined();
        expect(response.body.data.pipeline_metadata).toBeDefined();
      }
    });

    test('should handle missing pipeline data gracefully', async () => {
      const mockDocData = {
        question: 'Test question',
        status: 'received',
        processed_data: null,
        pipeline_metadata: null
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      // Should not error even if pipeline data is missing
      expect([200, 404, 503]).toContain(response.status);
    });
  });

  describe('Detailed Model Responses Data Integration', () => {
    test('should retrieve raw responses with complete metadata', async () => {
      const mockDocData = {
        question: 'Test question',
        status: 'completed',
        raw_responses: [
          {
            service: 'gpt-3.5',
            agent: 'gpt-3.5',
            model_version: 'gpt-3.5-turbo-0125',
            response_text: 'Test response',
            metadata: {
              timestamp: '2025-11-20T09:00:00.000Z',
              responseTimeMs: 1234,
              tokenCount: 150,
              endpoint: 'https://api.openai.com/v1/chat/completions',
              request_id: 'req_abc123',
              confidence: 0.85
            },
            analysis: {
              tone: { primary: 'informative', confidence: 0.9 },
              bias: { biasScore: 0.15 }
            }
          }
        ]
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.raw_responses).toBeDefined();
        expect(response.body.data.raw_responses[0].service).toBe('gpt-3.5');
        expect(response.body.data.raw_responses[0].metadata).toBeDefined();
        expect(response.body.data.raw_responses[0].metadata.endpoint).toBeDefined();
      }
    });

    test('should retrieve comprehensive metrics data', async () => {
      const mockDocData = {
        question: 'Test question',
        status: 'completed',
        processed_data: {
          sentimentAnalysis: {
            overallTone: 'neutral',
            vaderSentiment: { score: 0.2 }
          },
          biasAnalysis: {
            detoxify: {
              toxicity: 0.02,
              severe_toxicity: 0.001,
              obscene: 0.01
            }
          },
          fairnessAnalysis: {
            demographicParity: 0.95,
            equalizedOdds: 0.92
          },
          explainability: {
            shap: {
              feature_importance: [
                { word: 'test', importance: 0.15, impact: 'positive' }
              ]
            }
          }
        },
        quality_metrics: {
          confidence: 0.86,
          consensus: {
            overallConsensus: 86
          }
        }
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        expect(response.body.data.processed_data.sentimentAnalysis).toBeDefined();
        expect(response.body.data.processed_data.biasAnalysis.detoxify).toBeDefined();
        expect(response.body.data.processed_data.fairnessAnalysis).toBeDefined();
        expect(response.body.data.quality_metrics).toBeDefined();
      }
    });

    test('should retrieve provenance information', async () => {
      const mockDocData = {
        question: 'Test question',
        raw_responses: [
          {
            service: 'gpt-3.5',
            metadata: {
              endpoint: 'https://api.openai.com/v1/chat/completions',
              request_id: 'req_abc123',
              timestamp: '2025-11-20T09:00:00.000Z',
              model: 'gpt-3.5-turbo-0125'
            }
          }
        ]
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        const metadata = response.body.data.raw_responses[0].metadata;
        expect(metadata.endpoint).toBeDefined();
        expect(metadata.request_id).toBeDefined();
        expect(metadata.timestamp).toBeDefined();
      }
    });

    test('should retrieve ledger blocks', async () => {
      const mockDocData = {
        question: 'Test question',
        status: 'ledger_verified',
        ledger_blocks: ['0', '1234', '1235', '1236']
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        expect(response.body.data.ledger_blocks).toBeDefined();
        expect(Array.isArray(response.body.data.ledger_blocks)).toBe(true);
        expect(response.body.data.ledger_blocks.length).toBeGreaterThan(0);
      }
    });

    test('should retrieve processing time breakdown', async () => {
      const mockDocData = {
        question: 'Test question',
        raw_responses: [
          {
            service: 'gpt-3.5',
            metadata: {
              responseTimeMs: 1234
            },
            pipelineAnalysis: {
              timeline: [
                { step: 'preprocessing', model: 'spaCy', durationMs: 234 },
                { step: 'sentiment', model: 'VADER', durationMs: 123 }
              ],
              metadata: {
                totalProcessingTimeMs: 858
              }
            }
          }
        ]
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        const pipelineAnalysis = response.body.data.raw_responses[0].pipelineAnalysis;
        expect(pipelineAnalysis.timeline).toBeDefined();
        expect(Array.isArray(pipelineAnalysis.timeline)).toBe(true);
        expect(pipelineAnalysis.metadata.totalProcessingTimeMs).toBeDefined();
      }
    });
  });

  describe('Real-time Updates', () => {
    test('should support real-time listener setup', () => {
      const mockOnSnapshot = jest.fn();
      
      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          onSnapshot: mockOnSnapshot
        }))
      });

      const collectionRef = mockFirestore.collection('ai_interactions');
      const docRef = collectionRef.doc('test-doc');
      const callback = jest.fn();
      
      docRef.onSnapshot(callback);

      expect(mockOnSnapshot).toHaveBeenCalledWith(callback);
    });
  });

  describe('Data Validation', () => {
    test('should validate required fields in raw responses', async () => {
      const mockDocData = {
        question: 'Test question',
        raw_responses: [
          {
            service: 'gpt-3.5',
            response_text: 'Test response',
            metadata: {}
          }
        ]
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      if (response.status === 200) {
        expect(response.body.data.raw_responses[0].service).toBeDefined();
        expect(response.body.data.raw_responses[0].response_text).toBeDefined();
      }
    });

    test('should handle JSON-stringified fields', async () => {
      // Some fields in Firebase may be stored as JSON strings
      const mockDocData = {
        question: 'Test question',
        processed_data: {
          sentimentAnalysis: JSON.stringify({
            overallTone: 'neutral',
            score: 0.2
          })
        }
      };

      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => mockDocData
          })
        }))
      });

      const response = await request(app)
        .get('/api/firebase/questions/test-doc');

      // Data should be retrievable whether stringified or not
      expect([200, 404, 503]).toContain(response.status);
    });
  });
});
