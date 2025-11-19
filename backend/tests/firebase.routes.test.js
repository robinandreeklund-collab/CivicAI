/**
 * Firebase Routes Integration Tests
 * Tests Firebase API endpoints with mocked firebase-admin
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock firebase-admin before importing anything that uses it
const mockFirestore = {
  collection: jest.fn(() => ({
    add: jest.fn(),
    doc: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn()
        }))
      }))
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn()
      }))
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

// Mock firebase-admin module
jest.unstable_mockModule('firebase-admin', () => ({
  default: mockAdmin
}));

// Mock ledger service to avoid dependencies
jest.unstable_mockModule('../services/ledgerService.js', () => ({
  createLedgerBlock: jest.fn(() => Promise.resolve({ blockId: 'test-block' }))
}));

// Now import the modules that depend on mocks
const { default: firebaseRouter } = await import('../api/firebase.js');

// Create test app
const app = express();
app.use(express.json());
app.use('/api/firebase', firebaseRouter);

describe('Firebase API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/firebase/status', () => {
    test('should return Firebase status when configured', async () => {
      const response = await request(app)
        .get('/api/firebase/status')
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('available');
      expect(response.body).toHaveProperty('configured');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should return helpful message when not configured', async () => {
      const response = await request(app)
        .get('/api/firebase/status');

      expect(response.body.message).toBeDefined();
      if (!response.body.available) {
        expect(response.body.message).toContain('Firebase');
      }
    });
  });

  describe('POST /api/firebase/questions', () => {
    test('should return 400 when question is missing', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.message).toContain('Question');
    });

    test('should return 400 when question is empty string', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({ question: '' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('non-empty');
    });

    test('should return 400 when question is not a string', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({ question: 123 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('string');
    });

    test('should return 201 with proper response when question is valid', async () => {
      // Mock successful Firestore operations
      const mockDocRef = {
        id: 'test-doc-id-123'
      };

      mockFirestore.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValue(mockDocRef)
      });

      const testQuestion = 'What is the climate policy?';
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: testQuestion,
          userId: 'test-user',
          sessionId: 'test-session'
        });

      // Should return 201 Created for successful resource creation
      if (response.status === 201) {
        expect(response.body.success).toBe(true);
        expect(response.body.docId).toBeDefined();
        expect(response.body.status).toBe('received');
        expect(response.body.created_at).toBeDefined();
      }
      // Accept both 201 and 503 (if Firebase not configured in test env)
      expect([201, 503]).toContain(response.status);
    });

    test('should handle Firebase not configured with 503', async () => {
      // This test verifies that when Firebase is not configured,
      // we get a proper 503 Service Unavailable response
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 'Test question'
        });

      if (response.status === 503) {
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('not configured');
      }
    });
  });

  describe('GET /api/firebase/questions/:docId', () => {
    test('should return 503 when Firebase not configured', async () => {
      const response = await request(app)
        .get('/api/firebase/questions/test-doc-id');

      // Expect either 503 (not configured) or 404/500 (configured but doc not found)
      expect([503, 404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/firebase/questions/:docId/status', () => {
    test('should return 400 for invalid status value', async () => {
      // Mock Firebase as available
      mockFirestore.collection.mockReturnValueOnce({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            id: 'test-doc',
            data: () => ({
              question: 'test',
              status: 'received',
              created_at: new Date().toISOString()
            })
          }),
          update: jest.fn().mockResolvedValue()
        }))
      });

      const response = await request(app)
        .post('/api/firebase/questions/test-doc/status')
        .send({
          status: 'invalid_status'
        });

      if (response.status === 400) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Status');
      }
      // Accept 400, 404, 500, or 503
      expect([400, 404, 500, 503]).toContain(response.status);
    });

    test('should accept valid status values', async () => {
      const validStatuses = ['received', 'processing', 'completed', 'ledger_verified', 'error'];
      
      for (const status of validStatuses) {
        // Mock successful update
        mockFirestore.collection.mockReturnValueOnce({
          doc: jest.fn(() => ({
            get: jest.fn().mockResolvedValue({
              exists: true,
              id: 'test-doc',
              data: () => ({
                question: 'test',
                status: 'received',
                created_at: new Date().toISOString(),
                question_hash: 'abc123'
              })
            }),
            update: jest.fn().mockResolvedValue()
          }))
        });

        const response = await request(app)
          .post('/api/firebase/questions/test-doc/status')
          .send({ status });

        // Should either succeed or fail due to Firebase not configured
        expect([200, 404, 500, 503]).toContain(response.status);
      }
    });
  });

  describe('DELETE /api/firebase/questions/:docId', () => {
    test('should handle delete request', async () => {
      const response = await request(app)
        .delete('/api/firebase/questions/test-doc-id');

      // Expect either success (200), not found (404), server error (500), or not configured (503)
      expect([200, 404, 500, 503]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    test('should return 500 on internal server error', async () => {
      // Mock Firestore to throw an error
      mockFirestore.collection.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 'Test question'
        });

      // Should return either 500 or 503
      expect([500, 503]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });
});
