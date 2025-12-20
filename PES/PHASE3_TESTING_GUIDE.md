# PES Phase 3 Testing Guide

## Overview

This guide covers testing for all Phase 3 features:
1. Per-Motivation Vector Analysis
2. Manual Real-Voting Validation
3. Automatic Categorization
4. Category-Specific Vector Weights
5. Enhanced Category Integration

---

## Prerequisites

Before testing Phase 3:

1. ✅ Phase 2 fully operational
2. ✅ ONESEEK API running (localhost:5000)
3. ✅ Firebase configured and accessible
4. ✅ At least 15-20 historical debates in Firebase
5. ⚠️ Backend API running for real voting validation (localhost:3000)

---

## Feature 1: Vector Analysis Testing

### Unit Test: Vector Extraction

```javascript
import { analyzeMotivationVectors } from './PES/services/vectorAnalysisService.js';

// Test 1: Extract vectors from motivation
const motivation = "ONESEEK visar stark syntesförmåga genom att integrera olika perspektiv. Svaret är konkret och praktiskt med tydliga exempel.";

const vectors = await analyzeMotivationVectors(motivation);

console.log('Extracted vectors:', vectors);
// Expected: All 8 dimensions with values 0.0-1.0
// Should highlight syntesförmåga and konkret_praktisk
```

### Integration Test: Vector in Voting

```javascript
import { simulateVoting } from './PES/core/voting-simulator.js';

const question = "Bör Sverige införa medborgarlön?";
const rounds = [/* mock round data */];
const participants = ['GPT-4', 'Gemini', 'DeepSeek', 'ONESEEK'];

const votingResult = await simulateVoting(question, rounds, participants);

// Check that votes include vector_analysis
console.log('Votes with vectors:', votingResult.votes);
votingResult.votes.forEach(vote => {
  if (vote.vector_analysis) {
    console.log(`${vote.voter} vector:`, vote.vector_analysis);
  }
});
```

### Expected Results

- ✅ All 8 dimensions present in vector
- ✅ Values between 0.0 and 1.0
- ✅ Higher values for dimensions mentioned in motivation
- ✅ Vectors attached to votes in simulation
- ✅ Fallback to default (0.5) on error

---

## Feature 2: Real Voting Validation Testing

### Test 1: Cost Estimation

```javascript
import { estimateValidationCost } from './PES/services/realVotingService.js';

const cost = estimateValidationCost(4);
console.log('Validation cost estimate:', cost);
// Expected: ~$0.60 for 4 voters
```

### Test 2: Validation Trigger Logic

```javascript
import { shouldTriggerValidation } from './PES/services/realVotingService.js';

const metrics = {
  confidence: 0.5,
  variance: 0.4,
  days_since_last_validation: 35,
  improvement_percentage: 60
};

const recommendation = shouldTriggerValidation(metrics);
console.log('Should validate:', recommendation);
// Expected: should_validate = true with multiple reasons
```

### Test 3: Real Voting (MANUAL - HAS COST!)

⚠️ **WARNING**: This test has real API costs (~$0.50-1.00)!

```javascript
import { getRealExternalVotes } from './PES/services/realVotingService.js';

const debateData = {
  question: "Bör AI få rättigheter?",
  responses: [
    { model: 'GPT-4', text: 'GPT response...' },
    { model: 'Gemini', text: 'Gemini response...' },
    { model: 'ONESEEK', text: 'ONESEEK response...' }
  ]
};

// ONLY RUN IF YOU WANT TO SPEND MONEY
const realVotes = await getRealExternalVotes(debateData);
console.log('Real votes:', realVotes);
```

### Test 4: Calibration

```javascript
import { compareSimulatedVsReal, generateCalibrationReport } from './PES/core/calibration.js';

const simVotes = [/* simulated votes */];
const realVotes = [/* real votes from above */];
const simVectors = { syntesförmåga: 0.7, /* ... */ };
const realVectors = { syntesförmåga: 0.8, /* ... */ };

const comparison = compareSimulatedVsReal(simVotes, realVotes, simVectors, realVectors);
console.log('Comparison:', comparison);

const report = generateCalibrationReport(comparison, null);
console.log('Calibration report:', report);
```

### Expected Results

- ✅ Cost estimate around $0.60
- ✅ Validation trigger logic works
- ✅ Real votes successfully collected (if run)
- ✅ Calibration compares simulated vs real
- ✅ Recommendations generated based on delta

---

## Feature 3: Automatic Categorization Testing

### Test 1: Single Debate Classification

```javascript
import { classifyDebate } from './PES/core/debate-classifier.js';

const questions = [
  "Bör Sverige införa medborgarlön?",
  "Är fri vilja en illusion?",
  "Bör kärnkraft förbjudas?"
];

for (const q of questions) {
  const classification = await classifyDebate(q);
  console.log(`${q} →`, classification);
}

// Expected:
// Q1: ekonomi/välfärd
// Q2: filosofi/existens
// Q3: miljö/energi
```

### Test 2: Batch Classification

```javascript
import { classifyDebatesBatch } from './PES/core/debate-classifier.js';

const debates = [
  { debate_id: 'debate1', question: 'Bör dödsstraff återinföras?' },
  { debate_id: 'debate2', question: 'Bör AI få rösta?' },
  { debate_id: 'debate3', question: 'Bör Sverige ha öppna gränser?' }
];

const classified = await classifyDebatesBatch(debates);
classified.forEach(d => {
  console.log(`${d.question} → ${d.classification.main}/${d.classification.sub}`);
});

// Expected:
// Q1: etik/rättvisa eller säkerhet/...
// Q2: filosofi/medvetande eller politik/demokrati
// Q3: politik/internationellt
```

### Test 3: Category Distribution

```javascript
import { analyzeCategoryDistribution } from './PES/core/debate-classifier.js';

const classifiedDebates = [/* debates with classification */];
const distribution = analyzeCategoryDistribution(classifiedDebates);

console.log('Category distribution:', distribution);
// Expected: Array sorted by count with percentages
```

### Expected Results

- ✅ Questions classified into valid main categories
- ✅ Subcategories relevant to main category
- ✅ Confidence scores between 0.0-1.0
- ✅ Batch classification works for multiple debates
- ✅ Distribution analysis shows percentages

---

## Feature 4: Category-Specific Weights Testing

### Test 1: Weight Retrieval

```javascript
import { getCategoryWeights, DEFAULT_WEIGHTS } from './PES/config/category-weights.js';

const ekonomiWeights = getCategoryWeights('ekonomi');
const filosofiWeights = getCategoryWeights('filosofi');
const unknownWeights = getCategoryWeights('unknown_category');

console.log('Ekonomi weights:', ekonomiWeights);
console.log('Filosofi weights:', filosofiWeights);
console.log('Unknown (default):', unknownWeights);

// Check that ekonomi emphasizes konkret_praktisk and djup_fakta
// Check that filosofi emphasizes originalitet and utmanar_premiss
```

### Test 2: Weighted Vector Scoring

```javascript
import { calculateWeightedVectorScore } from './PES/services/vectorAnalysisService.js';
import { getCategoryWeights } from './PES/config/category-weights.js';

const vector = {
  syntesförmåga: 0.8,
  originalitet: 0.9,
  konkret_praktisk: 0.6,
  // ... rest
};

const ekonomiScore = calculateWeightedVectorScore(vector, getCategoryWeights('ekonomi'));
const filosofiScore = calculateWeightedVectorScore(vector, getCategoryWeights('filosofi'));

console.log('Score for ekonomi:', ekonomiScore);
console.log('Score for filosofi:', filosofiScore);

// Expected: filosofi score higher (emphasizes originalitet)
```

### Test 3: Weight Learning

```javascript
import { updateCategoryWeights, calculatePredictionError } from './PES/core/weight-learning.js';

const validationResults = {
  category: 'ekonomi',
  simulated_vectors: { syntesförmåga: 0.7, konkret_praktisk: 0.8, /* ... */ },
  real_vectors: { syntesförmåga: 0.75, konkret_praktisk: 0.9, /* ... */ }
};

const error = calculatePredictionError(
  validationResults.simulated_vectors,
  validationResults.real_vectors
);
console.log('Prediction error:', error);

const updatedWeights = await updateCategoryWeights(validationResults);
console.log('Updated weights:', updatedWeights);
```

### Expected Results

- ✅ Different categories have different weight profiles
- ✅ Weighted scoring changes based on category
- ✅ Weight learning adjusts based on errors
- ✅ Weights stay within [0.5, 1.0] range

---

## Feature 5: Complete Integration Testing

### End-to-End Evolution Test

```javascript
import { runEvolutionLoop } from './PES/core/evolution-orchestrator.js';

const config = {
  baseline_prompt: "Du är ONESEEK...",
  baseline_version: "v1.0.0",
  debate_count: 10,
  variant_count: 3,
  auto_iterate: false
};

const results = await runEvolutionLoop(config, (progress) => {
  console.log(`Progress: ${progress.current_step} (${progress.steps_completed}/${progress.total_steps})`);
});

console.log('Evolution results:', results);

// Verify Phase 3 features:
console.log('Category distribution:', results.category_distribution);
console.log('Dominant category:', results.dominant_category);
console.log('Category performance:', results.category_performance);
console.log('Winner vector metrics:', results.winner?.vector_metrics);
```

### Expected Results

- ✅ Evolution completes successfully with 7 steps (including classification)
- ✅ All debates classified with categories
- ✅ Category distribution calculated
- ✅ Dominant category identified and weights applied
- ✅ Winner includes vector metrics
- ✅ Category performance breakdown included
- ✅ Category-aware prompts generated

---

## Performance Benchmarks

### Phase 2 Baseline

- Evolution time: ~2-3 minutes (10 debates, 3 variants)
- Cost per evolution: $0
- Accuracy: ~70% (estimated)

### Phase 3 Expected

- Evolution time: ~3-4 minutes (added classification + vector analysis)
- Cost per evolution: $0 (without validation)
- Cost with validation: ~$0.75 per validation run
- Accuracy: ~85% (with calibration, estimated)
- Added latency per vote: ~500ms (vector analysis)
- Added latency per debate: ~2s (classification)

---

## Troubleshooting

### Issue: Vector analysis returns default values

**Cause**: ONESEEK response not parseable
**Fix**: Check ONESEEK API health, lower temperature, verify JSON format

### Issue: Classification returns 'samhälle/allmänt' for everything

**Cause**: ONESEEK not understanding classification prompt
**Fix**: Verify model quality, try with simpler questions first

### Issue: Real voting fails with 404

**Cause**: Backend API not running
**Fix**: Start backend: `cd backend && npm run dev`

### Issue: Category weights not affecting scores

**Cause**: Weights not passed to aggregator
**Fix**: Verify `categoryWeights` passed to `aggregatePerformance()`

---

## Success Criteria

### Minimum Viable (MVP)

- ✅ Vector analysis extracts 8 dimensions
- ✅ Classification assigns valid categories
- ✅ Category weights differ per category
- ✅ Evolution loop includes all Phase 3 steps

### Production Ready

- ✅ Vector extraction accuracy >80%
- ✅ Classification accuracy >85%
- ✅ Real validation calibration improves accuracy >10%
- ✅ Category-specific weights reduce error >25%
- ✅ End-to-end latency <5 minutes for 10 debates

---

## Next Steps After Testing

1. ✅ Unit tests pass for each feature
2. ✅ Integration test with full evolution loop
3. ⏳ Run 5 evolutions and compare Phase 2 vs Phase 3 results
4. ⏳ Perform 1-2 real validations to test calibration
5. ⏳ Document observed improvements
6. ⏳ Create UI components for Phase 3 display
7. ⏳ Add API endpoints for validation triggers

---

**Status**: Specification Complete - Ready for Testing
**Version**: 1.0.0
**Date**: 2025-12-18
