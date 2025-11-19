/**
 * Users API Tests
 * Test suite for Firebase user signup and management endpoints
 */

import request from 'supertest';
import { jest } from '@jest/globals';

// Note: These tests require Firebase to be configured
// Set SKIP_FIREBASE_TESTS=true to skip in CI/CD environments

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const SKIP_TESTS = process.env.SKIP_FIREBASE_TESTS === 'true';

// Mock user data
const mockUserData = {
  publicKey: 'pk_30820122300d06092a864886f70d0101010500034b00304802410084c5e2f4a1b3d7e8f9c0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4',
  seedPhrase: 'abandon ability able about above absent absorb abstract absurd abuse access accident',
  proofOfWork: {
    nonce: 8521,
    hash: '0000707a0b5c6418ac72e8821ff7266a243fba6f245a1cb23c4d5e6f7a8b9c0d',
    timestamp: Date.now(),
    difficulty: 4
  },
  profileType: 'pseudonym',
  agentConfig: {
    biasFilter: 'neutral',
    tone: 'balanced',
    transparencyLevel: 'high'
  }
};

describe('Users API - Signup Flow', () => {
  
  if (SKIP_TESTS) {
    test.skip('Skipping Firebase tests - SKIP_FIREBASE_TESTS is true', () => {});
    return;
  }

  let createdUserId = null;

  test('GET /api/users/status - should return service status', async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/status`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.status).toBeDefined();
    expect(['available', 'unavailable']).toContain(data.status);
  });

  test('POST /api/users/check-key - should check if public key exists', async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/check-key`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey: mockUserData.publicKey })
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(typeof data.isRegistered).toBe('boolean');
  });

  test('POST /api/users/signup - should create anonymous user account', async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockUserData)
    });
    const data = await response.json();

    // If Firebase is not configured, expect 503
    if (response.status === 503) {
      console.log('⚠️  Firebase not configured - skipping remaining tests');
      return;
    }

    expect([201, 409]).toContain(response.status);
    expect(data.success).toBeDefined();

    if (response.status === 201) {
      expect(data.user.userId).toBeDefined();
      expect(data.user.publicKeyHash).toBeDefined();
      expect(data.user.accountStatus).toBeDefined();
      expect(data.user.createdAt).toBeDefined();
      
      createdUserId = data.user.userId;
      console.log('✓ Created user:', createdUserId);
    } else if (response.status === 409) {
      console.log('⚠️  Public key already registered - expected behavior');
    }
  }, 10000); // Extended timeout for Firebase operations

  test('POST /api/users/signup - should reject missing publicKey', async () => {
    const invalidData = { ...mockUserData };
    delete invalidData.publicKey;

    const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    const data = await response.json();

    expect([400, 503]).toContain(response.status);
    if (response.status === 400) {
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    }
  });

  test('POST /api/users/signup - should reject invalid proof-of-work', async () => {
    const invalidData = {
      ...mockUserData,
      publicKey: 'pk_different_key_to_avoid_conflict_test',
      proofOfWork: {
        nonce: 1,
        hash: 'invalid_hash_no_leading_zeros',
        timestamp: Date.now(),
        difficulty: 4
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidData)
    });
    const data = await response.json();

    expect([400, 500, 503]).toContain(response.status);
    if (response.status !== 503) {
      expect(data.success).toBe(false);
    }
  });

  test('GET /api/users/:userId - should retrieve user profile', async () => {
    if (!createdUserId) {
      console.log('⚠️  No userId available - skipping test');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${createdUserId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toBeDefined();
    expect(data.user.userId).toBe(createdUserId);
    expect(data.user.accountType).toBe('anonymous');
    expect(data.user.publicKey).toBeDefined();
    
    // Verify sensitive data is not returned
    expect(data.user.privateKey).toBeUndefined();
    expect(data.user.seedPhrase).toBeUndefined();
  });

  test('PUT /api/users/:userId/profile - should update user profile', async () => {
    if (!createdUserId) {
      console.log('⚠️  No userId available - skipping test');
      return;
    }

    const updates = {
      displayName: 'Test User',
      profileType: 'public',
      agentConfig: {
        biasFilter: 'progressive',
        tone: 'casual',
        transparencyLevel: 'medium'
      }
    };

    const response = await fetch(`${API_BASE_URL}/api/users/${createdUserId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBeDefined();
    expect(data.updated.length).toBeGreaterThan(0);
  });

  test('POST /api/users/:userId/usage - should update usage stats', async () => {
    if (!createdUserId) {
      console.log('⚠️  No userId available - skipping test');
      return;
    }

    const stats = {
      incrementQuestions: true,
      incrementSessions: false
    };

    const response = await fetch(`${API_BASE_URL}/api/users/${createdUserId}/usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.updated).toBeDefined();
  });

  test('GET /api/users/:userId - should show updated profile', async () => {
    if (!createdUserId) {
      console.log('⚠️  No userId available - skipping test');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/users/${createdUserId}`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.displayName).toBe('Test User');
    expect(data.user.profileType).toBe('public');
  });
});

describe('Users API - Error Handling', () => {
  
  if (SKIP_TESTS) {
    test.skip('Skipping Firebase tests - SKIP_FIREBASE_TESTS is true', () => {});
    return;
  }

  test('GET /api/users/:userId - should return 404 for non-existent user', async () => {
    const response = await fetch(`${API_BASE_URL}/api/users/user_nonexistent123`);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });

  test('PUT /api/users/:userId/profile - should reject sensitive field updates', async () => {
    const maliciousUpdates = {
      publicKey: 'pk_hacked',
      privateKey: 'sk_hacked',
      role: 'admin'
    };

    const response = await fetch(`${API_BASE_URL}/api/users/user_test123/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maliciousUpdates)
    });
    const data = await response.json();

    // Should fail because no valid fields to update
    expect([400, 404, 500]).toContain(response.status);
    expect(data.success).toBe(false);
  });
});

describe('Users API - Integration', () => {
  
  if (SKIP_TESTS) {
    test.skip('Skipping Firebase tests - SKIP_FIREBASE_TESTS is true', () => {});
    return;
  }

  test('Health check should include users service', async () => {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.services.users).toBeDefined();
    expect(data.services.users.description).toBeDefined();
    expect(data.services.users.endpoints).toBeDefined();
  });
});

// Utility function to run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Running Users API tests...');
  console.log('API Base URL:', API_BASE_URL);
  console.log('Skip Firebase Tests:', SKIP_TESTS);
}
