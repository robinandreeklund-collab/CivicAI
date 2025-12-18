# PES Integration with Live Debate System

## Overview

PES (Prompt Evolution System) is designed to work in parallel with the live debate system, learning from real debates without affecting live operations.

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Live Debate System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User Question → Model Synthesis → Debate Triggered            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  Debate Process:                                      │     │
│  │  1. Initiate debate (consensusDebate.initiateDebate) │     │
│  │  2. Conduct rounds (consensusDebate.conductRound)    │     │
│  │  3. Voting (consensusDebate.conductVoting)           │     │
│  │  4. Analyze winner (consensusDebate.analyzeWinner)   │     │
│  └──────────────────────────────────────────────────────┘     │
│                           │                                     │
│                           ▼                                     │
│                  saveDebateToFirebase()                         │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Firebase Collection  │
                │      "debates"        │
                └───────────────────────┘
                            │
                            │ (Read-only access)
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PES (Isolated System)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌────────────────┐    ┌────────────────┐    ┌──────────────┐ │
│  │  Fetch Debates │───▶│  Run Simulation│───▶│   Analyze    │ │
│  │   (getDebates) │    │  (simulator.js)│    │(analyzer.js) │ │
│  └────────────────┘    └────────────────┘    └──────────────┘ │
│                                │                       │        │
│                                ▼                       ▼        │
│                       ┌────────────────────────────────────┐   │
│                       │  Firebase Collections (PES-only)   │   │
│                       │  - prompt_versions                 │   │
│                       │  - simulations                     │   │
│                       └────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Integration Points

### 1. Automatic Debate Logging

**File:** `backend/services/consensusDebate.js`

Every time a debate is initiated, conducted, or completed, it's automatically saved to Firebase:

```javascript
// After debate initiation
await saveDebateToFirebase(debate);

// After each round
await saveDebateToFirebase(debate);

// After voting
await saveDebateToFirebase(debate);

// After winner analysis
await saveDebateToFirebase(debate);
```

**What's Logged:**
- Debate ID and question
- All participants
- Initial responses from all models
- All debate rounds with responses
- Voting results and winner
- Full winning answer analysis

### 2. Firebase Collections

#### `debates` Collection (Managed by Live System)

Written by: `consensusDebate.js`  
Read by: PES system

Contains all real debates with complete data for training.

#### `prompt_versions` Collection (Managed by PES)

Written by: PES orchestrator  
Read by: PES analyzer

Contains all prompt versions being tested.

#### `simulations` Collection (Managed by PES)

Written by: PES simulator  
Read by: PES analyzer

Contains simulation results for each prompt version.

### 3. ONESEEK Integration

PES uses the **same ONESEEK endpoint** as the live system:

```javascript
// In PES simulator.js
const response = await getOpenSeekResponse(prompt, {
  systemPrompt: promptVersion.prompt_text,
  max_tokens: 1024,
  temperature: 0.7,
  timeout: 120000,
});
```

This ensures:
- Same model behavior
- Realistic performance metrics
- Valid comparison with live debates

## Usage Flow

### Phase 1 (Current)

1. **Live debates run** → Automatically saved to `debates` collection
2. **PES engineer creates prompt version** → Saved to `prompt_versions`
3. **PES runs simulation** → Uses real debates, calls ONESEEK
4. **Results analyzed** → Saved to `simulations`
5. **Engineer reviews** → Decides which prompt to use

### Phase 2 (Future)

1. Live system **checks for topic-specific prompts**
2. If available, uses **best-performing prompt** for that topic
3. Results feed back to PES for **continuous improvement**

## Code Changes Summary

### Modified Files

1. **`backend/services/consensusDebate.js`**
   - Added Firebase import: `import { getDb } from './firebaseService.js'`
   - Changed `initiateDebate` to async function
   - Added `saveDebateToFirebase()` calls after each state change
   - New function: `saveDebateToFirebase(debate)`

### New Files

1. **`PES/services/pesFirebaseService.js`**
   - Firebase operations for PES collections
   - CRUD operations for prompt_versions and simulations
   - Query helpers for debates

2. **`PES/core/simulator.js`**
   - Runs simulations using real debates
   - Calls ONESEEK for inference
   - Analyzes response quality

3. **`PES/core/analyzer.js`**
   - Performance analysis
   - Prompt version comparison
   - Trend analysis

4. **`PES/core/orchestrator.js`**
   - Main PES coordinator
   - Handles prompt creation and testing
   - Generates reports

5. **`PES/config/pesConfig.js`**
   - Configuration settings
   - Thresholds and weights

### Updated Files

1. **`firebase-schema.yaml`**
   - Added `debates` collection schema
   - Added `prompt_versions` collection schema
   - Added `simulations` collection schema

## Safety & Isolation

### ✅ Safe Operations

- PES only **reads** from `debates` collection
- PES writes to its **own collections** only
- Simulations run **independently** of live system
- No impact on live debate performance

### ❌ No Cross-Contamination

- PES never writes to `debates`
- PES never modifies live prompts
- Live system doesn't read PES data (Phase 1)

### 🔒 Firebase Security

All PES collections have security rules:
```
allow read: if request.auth != null;
allow write: if false; // Backend only
```

Only backend services can write data.

## Testing PES Integration

### 1. Verify Debate Logging

After running a live debate:

```javascript
import { getDebates } from './PES/services/pesFirebaseService.js';

const debates = await getDebates({ limit: 10 });
console.log(`Found ${debates.length} debates`);
```

### 2. Run Integration Tests

```bash
cd /home/runner/work/CivicAI/CivicAI
node PES/tests/test-pes-integration.js
```

### 3. Create Test Prompt

```javascript
import { createAndTestPromptVersion } from './PES/core/orchestrator.js';

const result = await createAndTestPromptVersion({
  promptText: "Your prompt here...",
  version: "v1.0.0-test",
  topic: "general"
}, true); // Run simulation immediately
```

## Environment Requirements

### Firebase Configuration

Ensure these environment variables are set:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### ONESEEK Service

Ensure ONESEEK is running:

```bash
curl http://localhost:5000/
# Should return: {"status": "running"}
```

## Troubleshooting

### Issue: "No debates available"

**Cause:** No live debates have been run yet  
**Solution:** Run some live debates to populate the `debates` collection

### Issue: "Firebase not initialized"

**Cause:** Missing Firebase credentials  
**Solution:** Set environment variables correctly

### Issue: "ONESEEK inference error"

**Cause:** ONESEEK service not running  
**Solution:** Start ml_service on port 5000

### Issue: "Simulation timeout"

**Cause:** Inference taking too long  
**Solution:** Increase `inferenceTimeout` in `pesConfig.js`

## Next Steps

After implementing Phase 1:

1. **Collect Data:** Run live debates to build training corpus
2. **Test Prompts:** Create and test different prompt versions
3. **Analyze Results:** Compare performance metrics
4. **Select Best:** Choose best-performing prompts

## Phase 2 Preview

Future enhancements will include:

- **Dynamic Prompt Selection:** Live system automatically picks best prompt per topic
- **Feedback Loop:** Live debate results feed back to PES
- **Auto-calibration:** PES adjusts based on live performance
- **A/B Testing:** Compare prompts in real-time

## Support

For questions or issues:
- Check PES/README.md for detailed documentation
- Review PES/examples/basic-usage.js for code examples
- Contact development team for support
