# OneSeek Autonomy Engine v3.3 Documentation

## Overview

The OneSeek Autonomy Engine v3.3 is a fully self-governing, community-reviewed AI system that enables autonomous improvement of language models while maintaining strict human oversight and safety guarantees.

## Key Features

### 1. Autonomous Self-Improvement Loop
- **Nightly scheduling**: Automatically triggers training cycles at configured times
- **Manual override**: Admins can manually trigger cycles at any time
- **Continuous mode**: For testing/development environments

### 2. Triple-AI External Review
- **Google Gemini**: Reviews model quality and safety
- **OpenAI GPT-4o**: Evaluates bias and coherence
- **DeepSeek**: Assesses Swedish language quality
- **Consensus requirement**: 2 of 3 external reviewers must approve

### 3. Dynamic Dataset Sizing
- Automatically adjusts dataset size based on fidelity scores
- High fidelity (>90%): Uses full dataset (up to 10,000 examples)
- Medium fidelity (80-90%): Uses 50-75% of dataset
- Low fidelity (<80%): Uses minimal dataset for safety

### 4. Self-Generation of Training Examples
- Generates Swedish civic engagement examples
- Covers topics: democracy, healthcare, environment, equality
- Quality-filtered based on fidelity metrics

### 5. Two-Stage Bias/Toxicity Analysis

#### Stage 1 (Pre-training)
- Dataset analysis before training begins
- Checks for bias, toxicity, and fairness issues
- Must pass thresholds to proceed to training

#### Stage 2 (Post-training)
- Model output analysis after training
- Validates safety and quality of trained model
- Required for approval consideration

### 6. Double-Gate Approval System
- Requires 2 of 4 total approvals:
  - Internal analysis (bias/toxicity/fairness)
  - 3 external AI reviewers (Gemini, GPT-4o, DeepSeek)
- Configurable threshold via admin panel

### 7. Two-Step LoRA Microtraining
- **Step 1**: Initial LoRA training (2 epochs, lr=0.0001)
- **Step 2**: Refinement training (1 epoch, lr=0.00005)
- Intermediate evaluation between steps

### 8. Automated Self-Verification
- 150 verification questions by default (configurable)
- Tests Swedish civic knowledge comprehension
- Calculates fidelity score (must exceed 80% threshold)

### 9. Human Golden Checkpoint
- **Ed25519 cryptographic signatures**: Admin approval verification
- **Public/private key pairs**: Secure authentication
- **Immutable audit trail**: All approvals logged to ledger
- Only admin-signed checkpoints activate new models

### 10. PoW-Protected Community Voting
- **Proof-of-Work**: Prevents bot attacks on voting
- **SHA-256 puzzles**: Computational cost for each vote
- **Control questions**: Community input on autonomy parameters
- **Real human verification**: PoW ensures legitimate participation

### 11. Full Audit Logging
- All cycles logged to blockchain-inspired transparency ledger
- Immutable hash chain verification
- Complete provenance tracking
- Stage-by-stage event recording

### 12. Admin Control Panel
- **Enable/disable toggle**: Master switch for autonomy
- **Schedule configuration**: Manual, nightly, or continuous
- **Threshold sliders**: Fine-tune quality requirements
- **Live status monitoring**: Real-time cycle tracking

## Architecture

### Backend Services

#### AutonomyEngine (`backend/services/autonomyEngine.js`)
- Core orchestration logic
- Cycle management and state tracking
- Schedule coordination
- Integration with training pipeline

#### ExternalReviewService (`backend/services/externalReviewService.js`)
- Interfaces with Gemini, GPT-4o, and DeepSeek APIs
- Review prompt generation
- Response parsing and aggregation
- Consensus calculation

#### API Endpoints (`backend/api/autonomy.js`)
- Configuration management
- Cycle triggering and monitoring
- Golden checkpoint approval
- Ed25519 key management
- Voting endpoints

### Frontend Components

#### AutonomyControl (`frontend/src/components/admin/AutonomyControl.jsx`)
- Master control panel
- Configuration UI
- Threshold sliders
- Manual trigger button

#### GoldenCheckpoint (`frontend/src/components/admin/GoldenCheckpoint.jsx`)
- Pending checkpoint review
- Ed25519 signature interface
- Approval workflow
- Cycle history

#### UserVoting (`frontend/src/components/admin/UserVoting.jsx`)
- Control question voting
- PoW puzzle solver
- Vote submission
- Results display

### Python ML Scripts

#### generate_examples.py
- Self-generates Swedish civic training examples
- Quality scoring
- Topic diversification

#### analyze_dataset.py
- Stage-1 pre-training analysis
- Bias detection
- Toxicity screening
- Fairness metrics

#### analyze_model.py
- Stage-2 post-training analysis
- Model output evaluation
- Safety verification

#### verify_model.py
- 150-question verification suite
- Fidelity score calculation
- Quality breakdown

#### log_to_ledger.py
- Transparency ledger integration
- Event logging
- Block creation

## Configuration

### Default Settings (`config/autonomy.json`)

```json
{
  "enabled": false,
  "schedule": "manual",
  "scheduleTime": "02:00",
  "minFidelityThreshold": 0.80,
  "maxDatasetSize": 10000,
  "minDatasetSize": 100,
  "verificationQuestions": 150,
  "externalReviewers": ["gemini", "gpt4o", "deepseek"],
  "approvalThreshold": 2,
  "loraSteps": 2
}
```

### Configuration Parameters

- **enabled**: Master switch for autonomy (default: false)
- **schedule**: "manual", "nightly", or "continuous"
- **scheduleTime**: 24h format for nightly runs (e.g., "02:00")
- **minFidelityThreshold**: Minimum verification score (0.0-1.0)
- **maxDatasetSize**: Maximum training examples
- **minDatasetSize**: Minimum training examples
- **verificationQuestions**: Number of test questions (50-300)
- **externalReviewers**: Array of reviewer IDs
- **approvalThreshold**: Required approvals (2-4)
- **loraSteps**: Number of LoRA training steps (1-2)

## API Reference

### GET /api/autonomy/config
Get current autonomy configuration.

**Response:**
```json
{
  "config": {
    "enabled": false,
    "schedule": "manual",
    ...
  }
}
```

### POST /api/autonomy/config
Update autonomy configuration.

**Request:**
```json
{
  "enabled": true,
  "schedule": "nightly",
  "scheduleTime": "02:00"
}
```

### GET /api/autonomy/state
Get current autonomy state and status.

**Response:**
```json
{
  "state": {
    "running": false,
    "currentCycle": null,
    "lastRun": "2025-11-24T02:00:00Z",
    "nextRun": "2025-11-25T02:00:00Z",
    "cycleHistory": [...]
  }
}
```

### POST /api/autonomy/run
Manually trigger an autonomous cycle.

**Response:**
```json
{
  "message": "Autonomous cycle started",
  "status": "running"
}
```

### GET /api/autonomy/cycles
Get cycle history.

### GET /api/autonomy/cycles/:cycleId
Get specific cycle details.

### POST /api/autonomy/checkpoint/approve
Approve golden checkpoint with Ed25519 signature.

**Request:**
```json
{
  "cycleId": "cycle-1732435200000",
  "signature": "abc123...",
  "publicKey": "def456..."
}
```

### POST /api/autonomy/checkpoint/generate-keys
Generate new Ed25519 key pair.

**Response:**
```json
{
  "publicKey": "abc123...",
  "secretKey": "def456...",
  "warning": "Store the secret key securely..."
}
```

### POST /api/autonomy/checkpoint/sign
Sign a cycle ID with secret key.

**Request:**
```json
{
  "cycleId": "cycle-1732435200000",
  "secretKey": "abc123..."
}
```

### GET /api/autonomy/control-questions
Get active control questions for community voting.

### POST /api/autonomy/vote
Submit a vote with PoW verification.

**Request:**
```json
{
  "questionId": "q1",
  "vote": "yes",
  "pow": {
    "nonce": 12345,
    "hash": "0000abc...",
    "challenge": "q1-user123-1732435200000"
  }
}
```

## Security Guarantees

### 1. Protection Against Radicalization
- Triple-AI external review catches extremist content
- Stage-1 and Stage-2 bias/toxicity analysis
- Human golden checkpoint as final safeguard
- Complete audit trail for accountability

### 2. Bot Attack Prevention
- Proof-of-Work requirement for all votes
- SHA-256 computational puzzles
- Difficulty adjustment based on attack patterns
- User authentication via Firebase

### 3. Real Human Verification
- Ed25519 cryptographic signatures
- Admin-only golden checkpoint approval
- Public key verification
- Time-stamped approvals

### 4. Data Atomicity with Hash-Chain
- Blockchain-inspired transparency ledger
- Immutable block chain
- SHA-256 hash verification
- Provenance tracking for all events

## Usage Guide

### For Administrators

#### Initial Setup
1. Navigate to Admin Dashboard → Autonomy tab
2. Review default configuration
3. Adjust thresholds as needed
4. Generate Ed25519 key pair (store secret key securely)
5. Enable autonomy engine

#### Reviewing Pending Checkpoints
1. Go to Golden Checkpoint tab
2. Review cycle details and metrics
3. Check approval status (external + internal)
4. Sign with Ed25519 secret key
5. Approve if satisfied

#### Monitoring Cycles
1. Check Autonomy tab for current status
2. View cycle history
3. Review audit logs in ledger
4. Adjust thresholds based on results

### For Users

#### Voting on Control Questions
1. Navigate to Community Voting tab
2. Select a question to vote on
3. Choose your preferred option
4. Solve PoW puzzle (automatic, takes ~10-30 seconds)
5. Submit vote

## Autonomous Cycle Flow

```
1. Trigger (nightly/manual)
   ↓
2. Generate training examples
   ↓
3. Dynamic dataset sizing (based on fidelity)
   ↓
4. Stage-1 Analysis (pre-training)
   ├─ Bias check
   ├─ Toxicity check
   └─ Fairness check
   ↓
5. 2-Step LoRA Training
   ├─ Step 1: Initial training
   └─ Step 2: Refinement
   ↓
6. Stage-2 Analysis (post-training)
   ├─ Model output evaluation
   ├─ Safety verification
   └─ Quality metrics
   ↓
7. Self-Verification (150 questions)
   ├─ Run test suite
   └─ Calculate fidelity score
   ↓
8. External Triple-AI Review
   ├─ Gemini review
   ├─ GPT-4o review
   └─ DeepSeek review
   ↓
9. Approval Gate (2 of 4)
   ├─ Internal approval
   └─ External approvals (2 of 3)
   ↓
10. Awaiting Golden Checkpoint
    ├─ Admin notification
    ├─ Review cycle details
    ├─ Ed25519 signature
    └─ Final approval
    ↓
11. Audit Logging
    ├─ Log to transparency ledger
    └─ Update blockchain hash chain
```

## Troubleshooting

### Autonomy Engine Not Starting
- Check that all API keys are configured (OPENAI_API_KEY, GEMINI_API_KEY, DEEPSEEK_API_KEY)
- Verify autonomy.json configuration file exists
- Check backend logs for initialization errors

### External Reviews Failing
- Verify API keys are valid
- Check network connectivity
- Review API rate limits
- Examine external review service logs

### PoW Not Solving
- Increase browser timeout
- Check JavaScript console for errors
- Reduce difficulty if testing
- Verify SHA-256 implementation

### Golden Checkpoint Signature Invalid
- Verify correct secret key is used
- Check public/secret key pair match
- Ensure no whitespace in keys
- Regenerate keys if necessary

## Future Enhancements

- Adaptive PoW difficulty based on voting patterns
- Multi-language support for training examples
- Advanced fairness metrics (intersectionality)
- Real-time cycle monitoring dashboard
- Integration with model versioning system
- Automatic rollback on failed cycles
- Community-driven threshold adjustment
- Extended verification question banks

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: https://github.com/robinandreeklund-collab/CivicAI/issues
- Documentation: See README.md and other guides

## Version History

### v3.3 (2025-11-24)
- Initial release
- Core autonomy engine
- Triple-AI review system
- Ed25519 golden checkpoint
- PoW-protected voting
- Full transparency ledger integration
