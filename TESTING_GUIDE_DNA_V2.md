# Testing Guide for DNA v2 Migration PR

This document provides step-by-step testing instructions for the migration to DNA-based certified structure.

## Prerequisites

Before testing, ensure:
- [x] Backend dependencies installed: `cd backend && npm install`
- [x] Frontend dependencies installed: `cd frontend && npm install`
- [x] Backend compiles: `cd backend && node --check index.js`
- [x] Frontend builds: `cd frontend && npm run build`

## Test Suite

### Test 1: Backend Reset Endpoint (API Level)

**Objective:** Verify reset endpoint works correctly via API

**Steps:**
1. Start backend server:
   ```bash
   cd backend
   npm start
   ```

2. Test the reset endpoint (in new terminal):
   ```bash
   curl -X POST http://localhost:3001/api/models/reset \
     -H "Content-Type: application/json"
   ```

**Expected Result:**
```json
{
  "success": true,
  "message": "All trained models have been reset. You can now train your first model from scratch.",
  "details": {
    "certifiedDir": "/path/to/models/oneseek-certified",
    "basemodellerDir": "/path/to/models/basemodeller",
    "timestamp": "2025-11-23T...",
    "action": "Full reset completed",
    "preserved": "Base models in /models/basemodeller/"
  },
  "ledger": {
    "timestamp": "2025-11-23T...",
    "user": "Admin",
    "message": "Full reset by Admin on 2025-11-23..."
  }
}
```

**Verification:**
- [ ] Response has `success: true`
- [ ] `models/oneseek-certified/` directory exists but is empty (except README, .ledger)
- [ ] `models/basemodeller/` directory exists (if it existed before)
- [ ] `models/oneseek-certified/README.md` file created
- [ ] `models/oneseek-certified/.ledger/reset-log.jsonl` contains log entry

---

### Test 2: Directory Structure After Reset

**Objective:** Verify correct directory structure after reset

**Steps:**
1. After running reset (from Test 1), check directory:
   ```bash
   ls -la models/
   ls -la models/oneseek-certified/
   ls -la models/basemodeller/ 2>/dev/null || echo "basemodeller not present (OK)"
   ```

**Expected Structure:**
```
models/
├── oneseek-certified/
│   ├── README.md
│   └── .ledger/
│       └── reset-log.jsonl
└── basemodeller/          (if existed before)
    └── README.md
```

**Verification:**
- [ ] `oneseek-certified/` directory exists
- [ ] `oneseek-certified/README.md` contains helpful documentation
- [ ] `oneseek-certified/.ledger/` directory exists
- [ ] `oneseek-certified/.ledger/reset-log.jsonl` contains JSON entries
- [ ] `basemodeller/` preserved if it existed before
- [ ] No DNA-named model directories in `oneseek-certified/`

---

### Test 3: Frontend UI Reset Button

**Objective:** Verify reset button works in Admin Dashboard

**Steps:**
1. Start backend (if not running):
   ```bash
   cd backend
   npm start
   ```

2. Start frontend (in new terminal):
   ```bash
   cd frontend
   npm run dev
   ```

3. Open browser to `http://localhost:5173`

4. Navigate to Admin Dashboard → Models tab

5. Locate the "⚠️ Reset All" button (red, next to "Compare Versions")

6. Click "⚠️ Reset All"

**Expected Behavior:**
- [ ] Confirmation prompt appears
- [ ] Prompt shows detailed warning message
- [ ] Prompt requires typing "RESET" to confirm
- [ ] Typing anything else cancels the operation
- [ ] Typing "RESET" executes the reset
- [ ] Success alert shows after reset
- [ ] Model list refreshes (should be empty or show only old models)

**Screenshot Required:**
- [ ] Take screenshot of Admin Dashboard showing "⚠️ Reset All" button
- [ ] Take screenshot of confirmation prompt

---

### Test 4: Rate Limiting

**Objective:** Verify rate limiting prevents abuse

**Steps:**
1. Run reset 6 times in quick succession:
   ```bash
   for i in {1..6}; do
     curl -X POST http://localhost:3001/api/models/reset \
       -H "Content-Type: application/json"
     echo ""
   done
   ```

**Expected Result:**
- [ ] First 5 requests succeed (status 200)
- [ ] 6th request fails with status 429 (Too Many Requests)
- [ ] Error message: "Too many reset requests. Please try again later."
- [ ] Response includes `retryAfter` field

---

### Test 5: Ledger Logging

**Objective:** Verify all resets are logged to ledger

**Steps:**
1. Perform 2-3 resets via API or UI
2. Check ledger file:
   ```bash
   cat models/oneseek-certified/.ledger/reset-log.jsonl
   ```

**Expected Result:**
```json
{"action":"FULL_RESET","timestamp":"2025-11-23T...","user":"Admin","ip":"::1","modelsDir":"/path/to/models","certifiedDir":"/path/to/models/oneseek-certified"}
{"action":"FULL_RESET","timestamp":"2025-11-23T...","user":"Admin","ip":"::1","modelsDir":"/path/to/models","certifiedDir":"/path/to/models/oneseek-certified"}
```

**Verification:**
- [ ] Each reset creates a new JSONL entry
- [ ] Entries contain timestamp, user, IP, paths
- [ ] File is append-only (old entries preserved)

---

### Test 6: Base Models Preservation

**Objective:** Verify base models are never deleted during reset

**Steps:**
1. Create fake base model directory:
   ```bash
   mkdir -p models/basemodeller/test-base-model
   echo "test" > models/basemodeller/test-base-model/config.json
   ```

2. Run reset via API or UI

3. Check base model still exists:
   ```bash
   ls -la models/basemodeller/test-base-model/
   cat models/basemodeller/test-base-model/config.json
   ```

**Expected Result:**
- [ ] `models/basemodeller/` directory still exists
- [ ] `models/basemodeller/test-base-model/` directory preserved
- [ ] `config.json` file still contains "test"

---

### Test 7: README File Creation

**Objective:** Verify helpful README files are created after reset

**Steps:**
1. Run reset
2. Read README files:
   ```bash
   cat models/oneseek-certified/README.md
   cat models/basemodeller/README.md
   ```

**Expected Content:**

**oneseek-certified/README.md:**
- [ ] Explains DNA-based naming format
- [ ] Shows directory structure example
- [ ] Explains active model symlink
- [ ] Shows last reset timestamp and user

**basemodeller/README.md:**
- [ ] Explains purpose of basemodeller directory
- [ ] Lists supported base models
- [ ] Explains what files should be present

---

### Test 8: Environment Variable Support

**Objective:** Verify MODELS_DIR environment variable works

**Steps:**
1. Create custom models directory:
   ```bash
   mkdir -p /tmp/custom-models
   ```

2. Start backend with custom path:
   ```bash
   MODELS_DIR=/tmp/custom-models npm start
   ```

3. Run reset:
   ```bash
   curl -X POST http://localhost:3001/api/models/reset \
     -H "Content-Type: application/json"
   ```

4. Verify directories created in custom location:
   ```bash
   ls -la /tmp/custom-models/
   ls -la /tmp/custom-models/oneseek-certified/
   ```

**Expected Result:**
- [ ] Reset creates directories in `/tmp/custom-models/`
- [ ] `oneseek-certified/` and `basemodeller/` in custom location
- [ ] Response shows custom path in `details.certifiedDir`

---

### Test 9: Backward Compatibility

**Objective:** Verify legacy models still work

**Steps:**
1. Create fake legacy model structure:
   ```bash
   mkdir -p models/oneseek-7b-zero/weights
   echo '{"version":"1.0","createdAt":"2025-11-20"}' > \
     models/oneseek-7b-zero/weights/oneseek-7b-zero-v1.0.json
   ```

2. Start backend and frontend

3. Navigate to Admin Dashboard → Models

4. Check if legacy model appears in list

**Expected Result:**
- [ ] Legacy model appears in model list
- [ ] Marked as "Legacy" or non-certified
- [ ] Can still be viewed/selected
- [ ] Reset doesn't delete legacy directory

---

### Test 10: Model Training After Reset

**Objective:** Verify training works after reset

**Steps:**
1. Run reset
2. Ensure you have a dataset:
   ```bash
   ls -la datasets/*.jsonl
   ```

3. Train a model using DNA v2:
   ```bash
   python scripts/train_dna_v2.py \
     --dataset datasets/oneseek_identity_v1.jsonl \
     --epochs 1 \
     --learning-rate 2e-5
   ```

**Expected Result:**
- [ ] Training starts without errors
- [ ] Model saved to `models/oneseek-certified/OneSeek-7B-Zero.v1.*`
- [ ] Directory name follows DNA format
- [ ] Symlink created: `OneSeek-7B-Zero-CURRENT`
- [ ] Model appears in Admin Dashboard

---

## Issue Reporting

If any test fails, please report:

**Template:**
```markdown
**Test Failed:** [Test Number/Name]

**Steps Taken:**
1. ...
2. ...

**Expected Result:**
...

**Actual Result:**
...

**Error Messages:**
```
[paste error messages]
```

**Screenshots:**
[attach screenshots]

**Environment:**
- OS: [e.g., Ubuntu 22.04, Windows 11, macOS 14]
- Node.js version: [run `node --version`]
- Python version: [run `python --version`]
```

## Success Criteria

All tests must pass:
- [x] Test 1: Backend Reset Endpoint
- [x] Test 2: Directory Structure
- [x] Test 3: Frontend UI Button (requires screenshot)
- [x] Test 4: Rate Limiting
- [x] Test 5: Ledger Logging
- [x] Test 6: Base Models Preservation
- [x] Test 7: README Creation
- [x] Test 8: Environment Variables
- [x] Test 9: Backward Compatibility
- [x] Test 10: Model Training

## Cleanup After Testing

```bash
# Remove test artifacts
rm -rf models/oneseek-certified/*
rm -rf models/basemodeller/test-base-model
rm -rf /tmp/custom-models
```

## Notes

- Some tests require Python and training dependencies
- Tests 1-8 can run without full ML setup
- Test 10 requires complete ML environment
- Screenshots are required for UI tests
