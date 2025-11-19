# Firebase Signup Integration - Complete Documentation

## Overview

This document describes the complete Firebase integration for the anonymous account signup flow, combining PR28 (anonymous account creation with real cryptography) and PR41 (Firebase integration step 1).

## Architecture

### Flow Diagram

```
Frontend (SignupPage)
    ↓
1. Generate RSA-2048 keypair locally (Web Crypto API)
    ↓
2. Generate BIP39 seed phrase (12 words)
    ↓
3. Perform Proof-of-Work (SHA-256, 4 leading zeros)
    ↓
4. Configure profile (pseudonym/public/private)
    ↓
5. Customize AI agent (bias filter, tone, transparency)
    ↓
6. Submit to backend API
    ↓
POST /api/users/signup
    ↓
Backend (firebaseUserService)
    ↓
7. Validate proof-of-work
    ↓
8. Generate userId from public key hash
    ↓
9. Hash seed phrase (never store plaintext)
    ↓
10. Store user document in Firestore
    ↓
11. Create ledger block for audit trail
    ↓
12. Update account status to "active"
    ↓
13. Return userId and ledger block ID
    ↓
Frontend displays success with complete summary
```

## Database Schema

### Users Collection

Location: `firestore://users/{userId}`

```javascript
{
  // Identity
  userId: "user_abc123...",              // SHA-256 hash of public key (first 32 chars)
  accountType: "anonymous",               // "anonymous" | "authenticated"
  
  // Cryptographic Data
  publicKey: "pk_30820122300d...",       // RSA-2048 public key (SPKI, hex with pk_ prefix)
  publicKeyHash: "sha256_hash...",       // SHA-256 hash of public key
  seedPhraseHash: "sha256_hash...",      // SHA-256 hash of BIP39 seed phrase
  
  // Proof-of-Work
  proofOfWork: {
    nonce: 8521,                          // Nonce that produced valid hash
    hash: "0000707a0b5c6418...",          // SHA-256 hash with 4 leading zeros
    timestamp: Timestamp,                 // When PoW was completed
    difficulty: 4                         // Number of leading zeros required
  },
  
  // Profile Settings
  profileType: "pseudonym",              // "public" | "pseudonym" | "private"
  agentConfig: {
    biasFilter: "neutral",               // "neutral" | "progressive" | "conservative"
    tone: "balanced",                     // "balanced" | "formal" | "casual"
    transparencyLevel: "high"            // "high" | "medium" | "minimal"
  },
  
  // Account Management
  role: "user",                          // "user" | "admin" | "moderator"
  accountStatus: "active",               // "pending" | "active" | "suspended" | "deleted"
  
  // Timestamps
  createdAt: Timestamp,                  // Account creation date
  verifiedAt: Timestamp,                 // When account was verified (after ledger block)
  lastLogin: Timestamp,                  // Last login timestamp
  
  // Audit Trail
  ledgerBlockId: 42,                     // Ledger block ID for account creation
  
  // Preferences
  preferences: {
    theme: "dark",
    language: "sv",
    notifications: false
  },
  
  // Usage Statistics
  usage: {
    totalQuestions: 0,
    totalSessions: 0,
    lastQuestionAt: Timestamp
  }
}
```

### Ledger Blocks Collection

When a user account is created, a ledger block is automatically generated:

```javascript
{
  block_id: 42,
  timestamp: Timestamp,
  previous_hash: "hash_of_block_41",
  current_hash: "sha256_hash_of_this_block",
  event_type: "data_collection",
  data: {
    description: "Anonymt konto skapat",
    userId: "user_abc123...",
    publicKeyHash: "sha256_hash...",
    accountType: "anonymous",
    profileType: "pseudonym",
    timestamp: "2024-11-19T23:42:00.000Z"
  },
  signatures: {
    data_hash: "sha256_hash...",
    validator: "system"
  }
}
```

## API Endpoints

### POST /api/users/signup

Create a new anonymous user account.

**Request:**

```json
{
  "publicKey": "pk_30820122300d06092a864886f70d01...",
  "seedPhrase": "broccoli bunker beef awake aim away...",
  "proofOfWork": {
    "nonce": 8521,
    "hash": "0000707a0b5c6418ac72e8821ff7266a...",
    "timestamp": 1700431320000,
    "difficulty": 4
  },
  "profileType": "pseudonym",
  "agentConfig": {
    "biasFilter": "neutral",
    "tone": "balanced",
    "transparencyLevel": "high"
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "user": {
    "userId": "user_abc123def456...",
    "publicKeyHash": "sha256_hash_of_public_key...",
    "accountStatus": "active",
    "createdAt": "2024-11-19T23:42:00.000Z",
    "ledgerBlockId": 42
  },
  "message": "Anonymous account created successfully"
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Missing required field: publicKey"
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "error": "Public key already registered",
  "message": "This cryptographic key is already associated with an account"
}
```

### GET /api/users/:userId

Get user profile by userId.

**Response (200 OK):**

```json
{
  "success": true,
  "user": {
    "userId": "user_abc123...",
    "accountType": "anonymous",
    "publicKey": "pk_30820122300d...",
    "publicKeyHash": "sha256_hash...",
    "profileType": "pseudonym",
    "agentConfig": {
      "biasFilter": "neutral",
      "tone": "balanced",
      "transparencyLevel": "high"
    },
    "accountStatus": "active",
    "createdAt": "2024-11-19T23:42:00.000Z",
    "ledgerBlockId": 42
  }
}
```

### PUT /api/users/:userId/profile

Update user profile settings.

**Request:**

```json
{
  "displayName": "Anonymous Swede",
  "profileType": "public",
  "agentConfig": {
    "biasFilter": "progressive",
    "tone": "casual"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "updated": ["displayName", "profileType", "agentConfig"]
}
```

### POST /api/users/:userId/usage

Update usage statistics.

**Request:**

```json
{
  "incrementQuestions": true,
  "incrementSessions": false
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "userId": "user_abc123...",
  "updated": ["usage.totalQuestions", "usage.lastQuestionAt"]
}
```

### POST /api/users/check-key

Check if a public key is already registered.

**Request:**

```json
{
  "publicKey": "pk_30820122300d06092a864886f70d01..."
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "isRegistered": false
}
```

### GET /api/users/status

Check users service status.

**Response (200 OK):**

```json
{
  "success": true,
  "status": "available",
  "firebase": true,
  "timestamp": "2024-11-19T23:42:00.000Z"
}
```

## Security Features

### Privacy-Preserving Design

✅ **No private keys stored** - Only public keys are stored  
✅ **Seed phrases hashed** - SHA-256 hash for verification only  
✅ **No email required** - Fully anonymous signup  
✅ **No IP logging** - Privacy-first approach  
✅ **Proof-of-Work** - Bot protection without tracking  
✅ **Ledger audit trail** - Immutable transparency  

### Cryptographic Security

- **RSA-2048** keypair generation using Web Crypto API
- **BIP39** seed phrase for recovery (12 words)
- **SHA-256** hashing for proof-of-work and data integrity
- **4 leading zeros** PoW difficulty (adjustable)
- **Client-side generation** - Keys never transmitted in plaintext

### Data Protection

**Sensitive Data Never Stored:**
- ❌ Private keys (user keeps locally)
- ❌ Seed phrases in plaintext (only SHA-256 hash)
- ❌ IP addresses
- ❌ Browser fingerprints
- ❌ Session cookies

**Data Stored:**
- ✅ Public key (needed for identification)
- ✅ Public key hash (userId generation)
- ✅ Seed phrase hash (recovery verification)
- ✅ Proof-of-Work data (bot protection verification)
- ✅ Profile preferences (user choice)
- ✅ Usage statistics (anonymous aggregation)

## Frontend Integration

### SignupPage Component

**Location:** `frontend/src/pages/SignupPage.jsx`

**Key Features:**

1. **Step-by-step wizard** (7 steps total)
2. **Real cryptography** using Web Crypto API
3. **Progress tracking** with visual feedback
4. **Error handling** with user-friendly messages
5. **Firebase integration** at completion step

**State Management:**

```javascript
const [accountData, setAccountData] = useState({
  publicKey: '',
  privateKey: '',
  seedPhrase: '',
  qrCode: '',
  profileType: 'pseudonym',
  agentConfig: {
    biasFilter: 'neutral',
    tone: 'balanced',
    transparencyLevel: 'high'
  },
  userId: null,
  ledgerBlockId: null,
  powData: null
});
```

**Save Function:**

```javascript
const saveAccountToFirebase = async () => {
  const payload = {
    publicKey: accountData.publicKey,
    seedPhrase: accountData.seedPhrase,
    proofOfWork: accountData.powData,
    profileType: accountData.profileType,
    agentConfig: accountData.agentConfig
  };

  const response = await fetch(`${API_BASE_URL}/api/users/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  
  if (result.success) {
    setAccountData(prev => ({
      ...prev,
      userId: result.user.userId,
      ledgerBlockId: result.user.ledgerBlockId,
      accountStatus: result.user.accountStatus
    }));
  }
};
```

## Backend Services

### firebaseUserService.js

**Location:** `backend/services/firebaseUserService.js`

**Key Functions:**

- `createAnonymousUser(userData)` - Create new anonymous account
- `getUser(userId)` - Retrieve user by ID
- `getUserByPublicKeyHash(hash)` - Find user by public key
- `updateUserProfile(userId, updates)` - Update profile settings
- `verifyAccount(userId, ledgerBlockId)` - Mark account as verified
- `updateUsageStats(userId, stats)` - Update usage counters
- `isPublicKeyRegistered(publicKey)` - Check key uniqueness

**Security Validations:**

1. ✅ Proof-of-Work hash verification (4 leading zeros)
2. ✅ Public key uniqueness check
3. ✅ Never store private keys or plaintext seed phrases
4. ✅ Filter sensitive fields from updates
5. ✅ Validate all input parameters

### users.js API Routes

**Location:** `backend/api/users.js`

**Features:**

- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Input validation
- ✅ Firebase availability checks
- ✅ Ledger integration
- ✅ Detailed logging

## Testing Guide

### Manual Testing

1. **Navigate to signup page:**
   ```
   http://localhost:3000/skapa-konto
   ```

2. **Complete signup flow:**
   - Step 0: Read introduction → Click "Börja skapa konto"
   - Step 1: Keys generated automatically → Click "Nästa"
   - Step 2: View seed phrase and QR code → Click "Nästa"
   - Step 3: Wait for PoW completion (3-10 seconds) → Click "Nästa"
   - Step 4: Select profile type → Click "Nästa"
   - Step 5: Customize agent settings → Click "Slutför"
   - Step 6: Account saved to Firebase, view summary

3. **Verify in Firebase Console:**
   - Check `users` collection for new document
   - Verify `ledger_blocks` collection for new block
   - Confirm all fields are populated correctly

4. **Check browser console:**
   ```
   [Signup] Saving account to Firebase...
   [Signup] Account saved successfully: { userId: "user_abc123...", ... }
   ```

5. **Verify API responses:**
   ```bash
   # Check service status
   curl http://localhost:3001/api/users/status
   
   # Get user by ID
   curl http://localhost:3001/api/users/user_abc123...
   ```

### Automated Testing

**Create test file:** `backend/tests/users.test.js`

```javascript
import request from 'supertest';
import app from '../index.js';

describe('Users API', () => {
  test('POST /api/users/signup - creates anonymous account', async () => {
    const response = await request(app)
      .post('/api/users/signup')
      .send({
        publicKey: 'pk_test123...',
        seedPhrase: 'word1 word2 word3...',
        proofOfWork: {
          nonce: 1234,
          hash: '0000abcd1234...',
          timestamp: Date.now(),
          difficulty: 4
        }
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.user.userId).toBeDefined();
  });
});
```

## Environment Configuration

### Backend (.env)

```bash
# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=3001
NODE_ENV=production
```

### Frontend (.env)

```bash
# API Endpoint
VITE_API_URL=http://localhost:3001

# Firebase Client SDK (if needed later)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Deployment Checklist

- [ ] Configure Firebase project in Google Cloud Console
- [ ] Generate service account key and set environment variables
- [ ] Deploy Firestore security rules from `firebase-schema.yaml`
- [ ] Create Firestore indexes (defined in schema)
- [ ] Deploy backend to production server
- [ ] Deploy frontend to CDN/hosting
- [ ] Test signup flow end-to-end in production
- [ ] Monitor logs for errors
- [ ] Set up alerts for failed signups

## Performance Considerations

### Proof-of-Work

- **Average time:** 3-5 seconds for 4 leading zeros
- **Worst case:** Up to 10 seconds
- **Non-blocking:** Uses `setTimeout` for UI updates
- **Adjustable:** Difficulty can be increased/decreased

### Firebase Operations

- **Write latency:** ~100-300ms to Firestore
- **Read latency:** ~50-150ms with caching
- **Ledger creation:** ~200ms additional
- **Total signup time:** ~4-6 seconds end-to-end

### Optimization Tips

1. **Cache service status** - Don't check Firebase on every request
2. **Batch writes** - Use Firestore batch for user + ledger
3. **Index strategically** - Only create needed indexes
4. **Monitor quota** - Watch Firestore read/write limits

## Troubleshooting

### Error: "Firebase service not available"

**Cause:** Firebase not configured or credentials invalid

**Solution:**
```bash
# Check environment variables
echo $FIREBASE_PROJECT_ID
echo $FIREBASE_CLIENT_EMAIL

# Verify credentials are correct
# Check backend logs for initialization errors
```

### Error: "Public key already registered"

**Cause:** User attempting to create account with same key twice

**Solution:** User should generate new keypair or use different browser/device

### Error: "Invalid proof-of-work"

**Cause:** PoW hash doesn't have required leading zeros

**Solution:** 
- Check PoW difficulty setting matches frontend/backend
- Ensure PoW completed successfully before submission
- Verify hash generation algorithm is correct

### Error: "Failed to create ledger block"

**Cause:** Ledger service unavailable or error

**Solution:**
- Account is still created (graceful degradation)
- Status remains "pending" instead of "active"
- Ledger can be created retroactively

## Future Enhancements

### Short-term
- [ ] Add account recovery flow using seed phrase
- [ ] Implement session management with JWT tokens
- [ ] Add rate limiting per IP address
- [ ] Create user dashboard for profile management

### Medium-term
- [ ] Support authenticated accounts (email/password)
- [ ] Add 2FA option for enhanced security
- [ ] Implement account deletion workflow
- [ ] Create admin panel for user management

### Long-term
- [ ] Support multiple device sync
- [ ] Add encrypted backup to cloud
- [ ] Implement social recovery mechanism
- [ ] Add hardware wallet support

## References

- **PR28:** Anonymous account creation with real cryptography
- **PR41:** Firebase integration step 1 (question storage)
- **SIGNUP_IMPLEMENTATION.md:** Original signup specification
- **firebase-schema.yaml:** Complete database schema
- **Web Crypto API:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- **BIP39 Spec:** https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki

## Support

For questions or issues:
1. Check this documentation
2. Review backend logs: `backend/logs/`
3. Check Firebase console for data issues
4. Review browser console for frontend errors
5. Contact development team

---

**Last Updated:** 2024-11-19  
**Version:** 1.0.0  
**Author:** GitHub Copilot Agent
