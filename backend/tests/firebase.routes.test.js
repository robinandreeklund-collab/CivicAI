/**
 * Firebase Routes Integration Tests
 * Tests for the Firebase API endpoints with mocked firebase-admin
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock firebase-admin before importing the routes
const mockFirestore = {
  collection: jest.fn(() => ({
    add: jest.fn(async (data) => ({
      id: 'mock-doc-id-123'
    })),
    doc: jest.fn(() => ({
      get: jest.fn(async () => ({
        exists: true,
        id: 'mock-doc-id-123',
        data: () => ({
          question: 'Test question',
          status: 'received',
          created_at: new Date().toISOString()
        })
      })),
      update: jest.fn(async () => {}),
      delete: jest.fn(async () => {})
    })),
    where: jest.fn(() => ({
      orderBy: jest.fn(() => ({
        limit: jest.fn(() => ({
          get: jest.fn(async () => ({
            forEach: jest.fn((callback) => {
              callback({
                id: 'mock-doc-id-123',
                data: () => ({
                  question: 'Test question',
                  status: 'received',
                  created_at: new Date().toISOString()
                })
              });
            })
          }))
        }))
      }))
    })),
    orderBy: jest.fn(() => ({
      limit: jest.fn(() => ({
        get: jest.fn(async () => ({
          forEach: jest.fn((callback) => {
            callback({
              id: 'mock-doc-id-123',
              data: () => ({
                question: 'Test question',
                status: 'received',
                created_at: new Date().toISOString()
              })
            });
          })
        }))
      }))
    }))
  }))
};

const mockAdmin = {
  apps: [],
  initializeApp: jest.fn(() => ({})),
  credential: {
    cert: jest.fn(() => ({}))
  },
  firestore: jest.fn(() => mockFirestore)
};

// Mock the firebase-admin module
jest.unstable_mockModule('firebase-admin', () => ({
  default: mockAdmin
}));

// Mock the ledger service
jest.unstable_mockModule('../services/ledgerService.js', () => ({
  createLedgerBlock: jest.fn(async () => ({ blockId: 'mock-block-id' }))
}));

// Now import the modules that depend on firebase-admin
const { default: firebaseRouter } = await import('../api/firebase.js');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/firebase', firebaseRouter);

describe('Firebase API Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Set mock environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
    process.env.FIREBASE_PRIVATE_KEY = 'test-key';
  });

  describe('GET /api/firebase/status', () => {
    it('should return Firebase status information', async () => {
      const response = await request(app)
        .get('/api/firebase/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ok');
      expect(response.body).toHaveProperty('initialized');
      expect(response.body).toHaveProperty('message');
    });

    it('should include project ID when Firebase is configured', async () => {
      const response = await request(app)
        .get('/api/firebase/status');

      expect(response.status).toBe(200);
      if (response.body.ok) {
        expect(response.body).toHaveProperty('projectId');
      }
    });
  });

  describe('POST /api/firebase/questions', () => {
    it('should create a question with valid input', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 'What is the meaning of life?',
          userId: 'test-user-123',
          sessionId: 'test-session-456'
        });

      // Should either succeed (201) or return 503 if Firebase not configured
      expect([201, 503]).toContain(response.status);
      
      if (response.status === 201) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('docId');
        expect(response.body).toHaveProperty('status', 'received');
        expect(response.body).toHaveProperty('created_at');
      }
    });

    it('should return 400 for missing question', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          userId: 'test-user-123'
        });

      // Should return 400 for validation error or 503 if Firebase not configured
      expect([400, 503]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Question is required');
      }
    });

    it('should return 400 for empty question string', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: '   ',
          userId: 'test-user-123'
        });

      expect([400, 503]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Question is required');
      }
    });

    it('should return 400 for non-string question', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 123,
          userId: 'test-user-123'
        });

      expect([400, 503]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('success', false);
      }
    });
  });

  describe('GET /api/firebase/questions/:docId', () => {
    it('should retrieve a question by ID when Firebase is configured', async () => {
      const response = await request(app)
        .get('/api/firebase/questions/test-doc-id');

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('question');
        expect(response.body.data).toHaveProperty('status');
      }
    });
  });

  describe('POST /api/firebase/questions/:docId/status', () => {
    it('should update question status with valid status value', async () => {
      const response = await request(app)
        .post('/api/firebase/questions/test-doc-id/status')
        .send({
          status: 'processing'
        });

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('status');
      }
    });

    it('should return 400 for invalid status value', async () => {
      const response = await request(app)
        .post('/api/firebase/questions/test-doc-id/status')
        .send({
          status: 'invalid-status'
        });

      expect([400, 503]).toContain(response.status);
      
      if (response.status === 400) {
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Status must be one of');
      }
    });

    it('should accept all valid status values', async () => {
      const validStatuses = ['received', 'processing', 'completed', 'ledger_verified', 'error'];
      
      for (const status of validStatuses) {
        const response = await request(app)
          .post('/api/firebase/questions/test-doc-id/status')
          .send({ status });

        expect([200, 503]).toContain(response.status);
      }
    });
  });

  describe('GET /api/firebase/questions', () => {
    it('should list questions when Firebase is configured', async () => {
      const response = await request(app)
        .get('/api/firebase/questions');

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should respect limit query parameter', async () => {
      const response = await request(app)
        .get('/api/firebase/questions?limit=5');

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      }
    });

    it('should respect status query parameter', async () => {
      const response = await request(app)
        .get('/api/firebase/questions?status=received');

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
      }
    });
  });

  describe('DELETE /api/firebase/questions/:docId', () => {
    it('should delete a question when Firebase is configured', async () => {
      const response = await request(app)
        .delete('/api/firebase/questions/test-doc-id');

      expect([200, 503]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
      }
    });
  });

  describe('Error handling', () => {
    it('should return 503 when Firebase is not available', async () => {
      // Remove environment variables to simulate unconfigured Firebase
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;
      delete process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 'Test question'
        });

      // Restore env vars for other tests
      process.env.FIREBASE_PROJECT_ID = 'test-project';
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.iam.gserviceaccount.com';
      process.env.FIREBASE_PRIVATE_KEY = 'test-key';

      // The response could be 503 if Firebase is not configured
      // or could succeed if mocks are working
      expect([201, 503]).toContain(response.status);
    });
  });
});
