# Firebase Collection Setup - Quick Reference

This guide provides three ways to create Firestore collections for CivicAI.

## 🚀 Quick Start

Choose the method that works best for you:

### Option 1: Automated Script (Fastest) ⚡

```bash
./scripts/firebase-init-collections.sh
```

**What it does:**
- Automatically creates all 6 collections
- Adds sample documents with correct schemas
- Validates Firebase connection
- Shows schema info for each collection

**Time:** ~2 minutes

---

### Option 2: YAML Schema for Firebase AI 🤖

**File:** `firebase-schema.yaml` (in project root)

**How to use:**

1. **With Firebase AI:**
   - Open Firebase Console
   - Navigate to AI/ML features
   - Provide this schema file
   - Let AI create collections

2. **As Reference:**
   - View complete schema structure
   - Copy field definitions
   - Use for manual creation

**Example Firebase AI prompt:**
```
Create the following Firestore collections with these schemas:

[Copy relevant sections from firebase-schema.yaml]

For collection ai_interactions:
- Field question: type string, required
- Field created_at: type timestamp, required
- Field status: type string, required, enum: received|processing|completed|ledger_verified
... etc
```

**Time:** ~5 minutes (depending on AI)

---

### Option 3: Manual Creation (Most Control) 📝

**See:** `docs/guides/FIREBASE_SETUP.md` - Step 7

**Summary for each collection:**

1. Go to Firebase Console → Firestore
2. Click "Start collection"
3. Enter collection ID
4. Add fields according to schema
5. Save document

**Collections to create:**
1. `ai_interactions` - User questions and responses
2. `model_versions` - AI model configurations
3. `ledger_blocks` - Transparency audit trail
4. `change_events` - Model behavior changes
5. `users` - User profiles
6. `audit_logs` - System logs

**Time:** ~15-20 minutes

---

## Collection Schemas Summary

### 1. ai_interactions
```
question: string (required)
created_at: timestamp (required)
status: string (required) - received|processing|completed|ledger_verified
pipeline_version: string (required)
analysis: object (optional)
completed_at: timestamp (optional)
user_id: string (optional)
session_id: string (optional)
question_hash: string (required)
```

### 2. model_versions
```
modelId: string (required)
provider: string (required) - openai|google|deepseek
modelName: string (required)
version: string (required)
configuration: object (required)
profile: object (optional)
usage: object (optional)
```

### 3. ledger_blocks
```
block_id: number (required)
timestamp: timestamp (required)
previous_hash: string (required)
current_hash: string (required)
event_type: string (required) - genesis|data_collection|training|update|audit
data: object (required)
signatures: object (required)
```

### 4. change_events
```
eventId: string (required)
timestamp: timestamp (required)
changeType: string (required) - response_drift|model_update|bias_shift
modelId: string (required)
changeDetails: object (required)
detection: object (required)
impact: object (required)
```

### 5. users
```
userId: string (required)
email: string (required)
displayName: string (optional)
role: string (required) - user|admin
createdAt: timestamp (required)
lastLogin: timestamp (optional)
preferences: object (optional)
```

### 6. audit_logs
```
logId: string (required)
timestamp: timestamp (required)
eventType: string (required)
userId: string (required)
action: string (required)
details: object (optional)
ipAddress: string (optional)
```

---

## Verification

After creating collections, verify they work:

### 1. Check Firebase Console
```
https://console.firebase.google.com/project/YOUR_PROJECT_ID/firestore
```

You should see all 6 collections.

### 2. Test Backend Connection

```bash
cd backend
npm start
```

Then check:
```bash
curl http://localhost:3001/api/firebase/status
```

Expected response:
```json
{
  "available": true,
  "configured": true,
  "message": "Firebase is configured and ready"
}
```

### 3. Test Creating a Question

```bash
curl -X POST http://localhost:3001/api/firebase/questions \
  -H "Content-Type: application/json" \
  -d '{
    "question": "Test question",
    "userId": "test-user",
    "sessionId": "test-session"
  }'
```

Expected response:
```json
{
  "success": true,
  "docId": "generated-id",
  "status": "received"
}
```

---

## Troubleshooting

### "Collection not found"
- **Solution:** Create the collection using one of the three methods above

### "Permission denied"
- **Solution:** Check Firestore security rules (see `FIREBASE_SETUP.md` Step 8)

### "Invalid field type"
- **Solution:** Ensure field types match the schema exactly (string vs number vs timestamp)

### Script fails with "firebase-admin not found"
- **Solution:** The script will auto-install dependencies. Ensure you have Node.js installed.

---

## Next Steps

After creating collections:

1. ✅ Set up Firestore security rules (`FIREBASE_SETUP.md` Step 8)
2. ✅ Create indexes for optimized queries (`FIREBASE_SETUP.md` Step 9)
3. ✅ Test the connection (see Verification above)
4. ✅ Start using the collections in your app

---

## Resources

- **Automated Script:** `scripts/firebase-init-collections.sh`
- **YAML Schema:** `firebase-schema.yaml`
- **Full Setup Guide:** `docs/guides/FIREBASE_SETUP.md`
- **API Documentation:** `docs/api/API-Firebase-Integration.md`
- **Firebase Console:** https://console.firebase.google.com

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the full setup guide: `docs/guides/FIREBASE_SETUP.md`
3. Verify your Firebase credentials are correct
4. Check Firebase Console for any error messages
5. Ensure you have the required permissions in your Firebase project

---

**Quick Command Reference:**

```bash
# Automated setup
./scripts/firebase-init-collections.sh

# Check Firebase status
curl http://localhost:3001/api/firebase/status

# View logs
firebase functions:log

# Deploy security rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes
```
