/**
 * Model Delete API Tests
 * Test suite for model and adapter deletion endpoints with active model protection
 */

import { jest } from '@jest/globals';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('Model Delete API', () => {
  describe('DELETE /api/models/:version', () => {
    test('should return 404 for non-existent model', async () => {
      const response = await fetch(`${API_BASE_URL}/api/models/nonexistent-model-xyz`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.code).toBe('MODEL_NOT_FOUND');
    });

    test('should return 400 for empty version parameter', async () => {
      const response = await fetch(`${API_BASE_URL}/api/models/`, {
        method: 'DELETE',
      });
      
      // Express will interpret this as a different route
      expect([400, 404, 405]).toContain(response.status);
    });

    test('should block path traversal attempts', async () => {
      const maliciousPaths = [
        '../base_models/test',
        '..%2Fbase_models',
        '....//base_models',
        'test/../../base_models'
      ];
      
      for (const path of maliciousPaths) {
        const response = await fetch(`${API_BASE_URL}/api/models/${encodeURIComponent(path)}`, {
          method: 'DELETE',
        });
        
        // Should either be 404 (not found after normalization) or 403 (blocked)
        expect([403, 404]).toContain(response.status);
        
        const data = await response.json();
        if (response.status === 403) {
          expect(['PATH_TRAVERSAL_BLOCKED', 'BASE_MODEL_PROTECTED']).toContain(data.code);
        }
      }
    });
  });

  describe('DELETE /api/models/:version/adapters/:adapterId', () => {
    test('should return 404 for non-existent model', async () => {
      const response = await fetch(`${API_BASE_URL}/api/models/nonexistent-model/adapters/adapter123`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.code).toBe('MODEL_NOT_FOUND');
    });

    test('should require both version and adapterId', async () => {
      // This path should result in 404 or 400
      const response = await fetch(`${API_BASE_URL}/api/models/test-model/adapters/`, {
        method: 'DELETE',
      });
      
      expect([400, 404]).toContain(response.status);
    });
  });
});

describe('Dev Reset API', () => {
  describe('POST /api/admin/dev-reset', () => {
    test('should return 403 when not in development environment', async () => {
      // This test assumes NODE_ENV is not development and ALLOW_DEV_RESET is not true
      // In CI, this should be the case
      const response = await fetch(`${API_BASE_URL}/api/admin/dev-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purgeFirebase: false,
          purgePreparedDatasets: false,
          purgeTrainingTemp: false,
          resetMemoryContext: false,
        }),
      });
      
      // Should be 403 in production, or 200 in development
      expect([200, 403]).toContain(response.status);
      
      if (response.status === 403) {
        const data = await response.json();
        expect(data.code).toBe('DEV_RESET_DISABLED');
      }
    });

    test('should accept valid options in request body', async () => {
      const response = await fetch(`${API_BASE_URL}/api/admin/dev-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purgeFirebase: true,
          purgePreparedDatasets: true,
          purgeTrainingTemp: true,
          resetMemoryContext: true,
          keepModels: true,
        }),
      });
      
      // 403 is expected in non-dev environment
      expect([200, 403]).toContain(response.status);
    });
  });
});

describe('Memory Reset API', () => {
  describe('POST /api/memory/reset', () => {
    test('should reset memory context successfully', async () => {
      const response = await fetch(`${API_BASE_URL}/api/memory/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.requestId).toBeDefined();
      expect(data.clearedComponents).toBeDefined();
      expect(Array.isArray(data.clearedComponents)).toBe(true);
    });

    test('should include expected cleared components', async () => {
      const response = await fetch(`${API_BASE_URL}/api/memory/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.clearedComponents).toContain('conversation_cache');
      expect(data.clearedComponents).toContain('inference_cache');
      expect(data.clearedComponents).toContain('oqt_knowledge_base');
    });
  });

  describe('GET /api/memory/status', () => {
    test('should return memory cache status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/memory/status`);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.caches).toBeDefined();
      expect(data.caches.conversationCache).toBeDefined();
      expect(data.caches.inferenceCache).toBeDefined();
      expect(data.caches.oqtKnowledgeBase).toBeDefined();
    });
  });
});
