/**
 * Firebase Integration Tests
 * Tests for the Firebase question storage and status tracking
 */

import { expect } from 'chai';
import request from 'supertest';
import app from '../index.js';

describe('Firebase API Integration', () => {
  let testDocId = null;

  describe('POST /api/firebase/questions', () => {
    it('should create a new question when Firebase is configured', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: 'Test question for Firebase integration',
          userId: 'test-user-123',
          sessionId: 'test-session-456'
        });

      // If Firebase is not configured, expect 503
      if (response.status === 503) {
        console.log('Firebase not configured - skipping test');
        return;
      }

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('docId');
      expect(response.body).to.have.property('status', 'received');
      
      testDocId = response.body.docId;
    });

    it('should reject invalid requests', async () => {
      const response = await request(app)
        .post('/api/firebase/questions')
        .send({
          question: '' // Empty question
        });

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('success', false);
    });
  });

  describe('GET /api/firebase/questions/:docId', () => {
    it('should retrieve a question by ID', async () => {
      if (!testDocId) {
        console.log('No test doc ID - skipping test');
        return;
      }

      const response = await request(app)
        .get(`/api/firebase/questions/${testDocId}`);

      if (response.status === 503) {
        console.log('Firebase not configured - skipping test');
        return;
      }

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body.data).to.have.property('question');
      expect(response.body.data).to.have.property('status');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/firebase/questions/non-existent-id');

      if (response.status === 503) {
        console.log('Firebase not configured - skipping test');
        return;
      }

      expect(response.status).to.equal(404);
    });
  });

  describe('POST /api/firebase/questions/:docId/status', () => {
    it('should update question status', async () => {
      if (!testDocId) {
        console.log('No test doc ID - skipping test');
        return;
      }

      const response = await request(app)
        .post(`/api/firebase/questions/${testDocId}/status`)
        .send({
          status: 'processing'
        });

      if (response.status === 503) {
        console.log('Firebase not configured - skipping test');
        return;
      }

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('status', 'processing');
    });

    it('should reject invalid status values', async () => {
      if (!testDocId) {
        console.log('No test doc ID - skipping test');
        return;
      }

      const response = await request(app)
        .post(`/api/firebase/questions/${testDocId}/status`)
        .send({
          status: 'invalid-status'
        });

      if (response.status === 503) {
        console.log('Firebase not configured - skipping test');
        return;
      }

      expect(response.status).to.equal(400);
    });
  });

  describe('GET /api/firebase/status', () => {
    it('should return Firebase configuration status', async () => {
      const response = await request(app)
        .get('/api/firebase/status');

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('available');
      expect(response.body).to.have.property('configured');
      expect(response.body).to.have.property('message');
    });
  });

  // Cleanup
  after(async () => {
    if (testDocId) {
      // Clean up test document
      await request(app)
        .delete(`/api/firebase/questions/${testDocId}`);
    }
  });
});
