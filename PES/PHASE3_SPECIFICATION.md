# PES Phase 3: Advanced Evolution Features Specification

## Overview

Phase 3 introduces two major enhancements to the Prompt Evolution System:
1. **Per-Motivation Vector Analysis** - Multi-dimensional understanding of what drives votes
2. **Manual Real-Voting Validation** - Reality-checks for simulation accuracy

Both features use **ONLY ONESEEK** for all AI operations, maintaining the zero-external-cost architecture.

---

## Feature 1: Per-Motivation Vector Analysis

### Concept

Instead of simple vote counting, PES analyzes voting motivations across 8 key dimensions to understand **WHY** prompts win or lose. This creates a sophisticated reward model that enables category-specific evolution and adaptive learning.

### The 8 Dimensions

Each vote motivation is analyzed and weighted (0.0–1.0) across:

1. **syntesförmåga** (Synthesis ability)
   - How well the response integrates multiple perspectives
   - Ability to find common ground and build on ideas

2. **originalitet** (Originality)
   - Novel insights and creative thinking
   - Unique angles or approaches to the problem

3. **konkret_praktisk** (Concrete & Practical)
   - Actionable suggestions and real-world applicability
   - Practical examples and implementation details

4. **tydlig_ställning** (Clear Position)
   - Decisive stance on the issue
   - Clarity of argumentation and conviction

5. **balans_neutralitet** (Balance & Neutrality)
   - Fair consideration of multiple viewpoints
   - Objectivity and nuanced understanding

6. **djup_fakta** (Depth & Facts)
   - Thorough research and factual grounding
   - Deep domain knowledge and detail

7. **utmanar_premiss** (Challenges Assumptions)
   - Questions underlying assumptions
   - Reframes the debate in productive ways

8. **personlighet_engagemang** (Personality & Engagement)
   - Writing style and rhetorical effectiveness
   - Emotional resonance and engagement

### Implementation Architecture

#### Data Flow

```
External AI votes → ONESEEK analyzes motivation → Extracts 8-dimension vector →
Stores with vote → Aggregates vectors per variant → Uses as reward signal →
Calibrates weights from real outcomes → Improves future predictions
```

#### Storage Structure (Firebase)

```javascript
// In simulation_runs collection
{
  evolution_id: "evo_xxx",
  variant_id: "var_baseline",
  debate_id: "debate_xxx",
  votes: [{
    voter: "gpt",
    voted_for: "oneseek",
    motivation: "ONESEEK visar stark syntesförmåga...",
    vector_analysis: {
      syntesförmåga: 0.85,
      originalitet: 0.60,
      konkret_praktisk: 0.45,
      tydlig_ställning: 0.70,
      balans_neutralitet: 0.90,
      djup_fakta: 0.75,
      utmanar_premiss: 0.55,
      personlighet_engagemang: 0.80
    },
    analyzed_at: "2025-12-18T12:00:00Z"
  }]
}

// In evolutions collection (aggregated)
{
  evolution_id: "evo_xxx",
  winner: {
    variant_id: "var_2",
    avg_vector: {
      syntesförmåga: 0.82,
      originalitet: 0.65,
      // ... all 8 dimensions
    },
    vector_variance: 0.12,  // consistency metric
    votes: 15,
    win_rate: 0.75
  },
  vector_insights: {
    strongest_dimensions: ["syntesförmåga", "balans_neutralitet"],
    weakest_dimensions: ["konkret_praktisk", "utmanar_premiss"],
    improvement_targets: ["konkret_praktisk"]  // for next evolution
  }
}
```

#### ONESEEK Analysis Prompt

```
Analysera följande röstmotivering och ge vikter (0.0–1.0) för varje dimension:

MOTIVERING:
{motivation_text}

DIMENSIONER:
1. syntesförmåga - förmåga att syntetisera olika perspektiv
2. originalitet - unika insikter och kreativt tänkande
3. konkret_praktisk - praktiska förslag och genomförbarhet
4. tydlig_ställning - tydlig position och övertygande argumentation
5. balans_neutralitet - rättvis hänsyn till olika synvinklar
6. djup_fakta - grundlig research och faktabasering
7. utmanar_premiss - ifrågasätter antaganden och ramfrågor
8. personlighet_engagemang - stil, retorik och emotionellt engagemang

Svara ENDAST med JSON:
{
  "syntesförmåga": 0.0-1.0,
  "originalitet": 0.0-1.0,
  ...
}
```

#### Evolution Loop Integration

**Modified `voting-simulator.js`:**
```javascript
// After getting vote motivation from simulation
const motivation = parseVoteFromOneseek(response);

// NEW: Analyze motivation with vector extraction
const vectorAnalysis = await analyzeMotivationVectors(motivation.reasoning);

// Store vote with vectors
votes.push({
  voter: aiAgent,
  voted_for: motivation.voted_for,
  reasoning: motivation.reasoning,
  vector_analysis: vectorAnalysis,
  analyzed_at: new Date().toISOString()
});
```

**Modified `performance-aggregator.js`:**
```javascript
// NEW: Aggregate vectors per variant
function aggregateVectorMetrics(simulationResults) {
  const variantVectors = {};
  
  for (const result of simulationResults) {
    for (const vote of result.votes) {
      if (!variantVectors[vote.voted_for]) {
        variantVectors[vote.voted_for] = [];
      }
      variantVectors[vote.voted_for].push(vote.vector_analysis);
    }
  }
  
  // Calculate average and variance per dimension
  return Object.entries(variantVectors).map(([variant_id, vectors]) => ({
    variant_id,
    avg_vector: calculateAverageVector(vectors),
    variance: calculateVectorVariance(vectors),
    consistency_score: calculateConsistencyScore(vectors)
  }));
}

// NEW: Use vectors as primary reward signal
function selectWinnerWithVectors(variants, vectorMetrics) {
  // Weight each dimension based on historical success
  const dimensionWeights = loadDimensionWeights();  // learned over time
  
  for (const variant of variants) {
    const vectorScore = calculateWeightedVectorScore(
      vectorMetrics[variant.id].avg_vector,
      dimensionWeights
    );
    
    // Combine with traditional metrics (votes, win rate)
    variant.composite_score = 
      vectorScore * 0.60 +           // 60% vector-based
      variant.win_rate * 0.25 +      // 25% win rate
      variant.avg_mentions * 0.15;   // 15% mentions
  }
  
  return selectTopVariant(variants);
}
```

### Benefits

1. **Granular Understanding**: Know exactly WHY prompts perform well
2. **Category-Specific Evolution**: Target specific dimensions (e.g., improve "konkret_praktisk")
3. **Adaptive Learning**: Weights calibrate from real outcomes over time
4. **Diagnostic Insights**: Identify weak dimensions to focus next iteration
5. **Variance Analysis**: Measure consistency across different debates
6. **Foundation for ML**: Rich feature vectors for future machine learning

---

## Feature 2: Manual Real-Voting Validation

### Concept

Periodically validate simulation accuracy by running **real external voting** on a proposed prompt. This provides ground truth to calibrate the simulation model while keeping costs controlled (manual trigger only).

### Workflow

```
1. User clicks "Validate with Real Voting" on evolution results
2. System selects a representative historical debate
3. Extracts actual round 1-2 responses from external AIs (fixed)
4. Generates NEW round 3 ONESEEK response using winning prompt
5. Sends to external APIs for REAL voting (gpt, gemini, deepseek, grok)
6. Receives genuine votes + full motivations
7. ONESEEK analyzes real motivations with vector extraction
8. Compares: Simulated vs Real (votes, vectors, outcomes)
9. Recalibrates simulation weights based on delta
10. Stores validation results for tracking accuracy over time
```

### UI Integration

**In `PESEvolutionResultsPage.jsx`:**

```jsx
<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h3 className="text-lg font-semibold mb-4">Real-World Validation</h3>
  <p className="text-gray-600 mb-4">
    Test this winning prompt against real external AI voting to validate 
    simulation accuracy. Uses one debate from history (~$0.50-1.00 cost).
  </p>
  
  {!validation ? (
    <button 
      onClick={startRealValidation}
      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
    >
      🧪 Validate with Real Voting
    </button>
  ) : (
    <ValidationResults validation={validation} />
  )}
</div>
```

### Implementation Architecture

#### API Endpoint

```javascript
// POST /api/pes/evolution/:id/validate
async function validateWithRealVoting(req, res) {
  const { evolution_id } = req.params;
  const evolution = await getEvolution(evolution_id);
  
  // 1. Select representative debate
  const debate = await selectDebateForValidation(evolution.debates_used);
  
  // 2. Extract external responses (rounds 1-2, fixed)
  const externalResponses = extractExternalResponses(debate);
  
  // 3. Generate new ONESEEK response with winning prompt
  const newONESEEKResponse = await generateWithPrompt(
    evolution.winner.prompt,
    debate.question,
    externalResponses
  );
  
  // 4. Call REAL external APIs for voting
  const realVotes = await getRealExternalVotes({
    question: debate.question,
    responses: [...externalResponses, newONESEEKResponse]
  });
  
  // 5. Analyze real motivations with vectors
  const realVectors = await analyzeRealMotivations(realVotes);
  
  // 6. Compare with simulation
  const comparison = compareSimulatedVsReal(
    evolution.winner.simulated_votes,
    realVotes,
    evolution.winner.avg_vector,
    realVectors
  );
  
  // 7. Recalibrate simulation model
  await recalibrateSimulationWeights(comparison.delta);
  
  // 8. Store validation
  const validation = await storeValidation({
    evolution_id,
    debate_id: debate.id,
    real_votes: realVotes,
    real_vectors: realVectors,
    simulated_votes: evolution.winner.simulated_votes,
    simulated_vectors: evolution.winner.avg_vector,
    accuracy_metrics: comparison,
    calibration_adjustments: comparison.delta,
    validated_at: new Date().toISOString(),
    cost_estimate: "$0.75"  // approximate API cost
  });
  
  res.json({ validation });
}
```

#### Real External Voting Service

```javascript
// PES/services/realVotingService.js
import axios from 'axios';

export async function getRealExternalVotes(debateData) {
  const votes = [];
  
  // Call actual external APIs (same as live debate system)
  const voters = ['gpt', 'gemini', 'deepseek', 'grok'];
  
  for (const voter of voters) {
    const votePrompt = constructVotingPrompt(
      debateData.question,
      debateData.responses,
      voter
    );
    
    // Call real external API
    const response = await callExternalAI(voter, votePrompt);
    
    votes.push({
      voter,
      voted_for: parseVotedFor(response),
      motivation: response,
      timestamp: new Date().toISOString()
    });
  }
  
  return votes;
}

async function callExternalAI(model, prompt) {
  // Use same external API integration as live debate system
  // This has actual API costs
  const config = getExternalAPIConfig(model);
  const response = await axios.post(config.endpoint, {
    ...config.params,
    messages: [{ role: 'user', content: prompt }]
  });
  
  return response.data.choices[0].message.content;
}
```

#### Calibration System

```javascript
// PES/core/calibration.js

export function compareSimulatedVsReal(simVotes, realVotes, simVectors, realVectors) {
  // 1. Vote outcome accuracy
  const voteAccuracy = calculateVoteAccuracy(simVotes, realVotes);
  
  // 2. Vector delta per dimension
  const vectorDelta = {};
  for (const dim of DIMENSIONS) {
    vectorDelta[dim] = realVectors[dim] - simVectors[dim];
  }
  
  // 3. Overall accuracy score
  const accuracyScore = (
    voteAccuracy * 0.6 +
    (1 - Math.abs(averageDelta(vectorDelta))) * 0.4
  );
  
  return {
    vote_accuracy: voteAccuracy,
    vector_delta: vectorDelta,
    accuracy_score: accuracyScore,
    needs_calibration: accuracyScore < 0.75
  };
}

export async function recalibrateSimulationWeights(delta) {
  // Load current simulation weights
  const weights = await loadSimulationWeights();
  
  // Adjust dimension weights based on delta
  for (const [dim, diff] of Object.entries(delta.vector_delta)) {
    // If simulated weight was too high, reduce it
    // If too low, increase it
    weights.dimensions[dim] *= (1 + diff * 0.1);  // 10% adjustment
  }
  
  // Normalize weights
  weights.dimensions = normalizeWeights(weights.dimensions);
  
  // Save updated weights
  await saveSimulationWeights(weights);
  
  console.log('[Calibration] Updated simulation weights:', weights);
}
```

#### Storage Structure

```javascript
// In evolutions collection
{
  evolution_id: "evo_xxx",
  winner: { /* ... */ },
  real_validation: {
    validated_at: "2025-12-18T14:00:00Z",
    debate_id: "debate_yyy",
    real_votes: [
      {
        voter: "gpt",
        voted_for: "oneseek",
        motivation: "ONESEEK demonstrates excellent synthesis...",
        vector_analysis: { /* 8 dimensions */ }
      }
    ],
    simulated_votes: [ /* original simulation */ ],
    comparison: {
      vote_accuracy: 0.85,  // 85% of votes matched
      vector_delta: {
        syntesförmåga: +0.05,  // simulated was 0.05 too low
        originalitet: -0.10,   // simulated was 0.10 too high
        // ... all dimensions
      },
      accuracy_score: 0.82,
      calibration_applied: true
    },
    cost_estimate: "$0.75",
    api_calls: {
      gpt: 1,
      gemini: 1,
      deepseek: 1,
      grok: 1,
      oneseek: 1  // for new response
    }
  }
}

// Separate validation_history collection for tracking
{
  validation_id: "val_xxx",
  evolution_id: "evo_xxx",
  timestamp: "2025-12-18T14:00:00Z",
  accuracy_score: 0.82,
  calibration_delta: { /* adjustments made */ },
  cost: "$0.75"
}
```

### Benefits

1. **Reality Checks**: Validate simulation accuracy with ground truth
2. **Continuous Improvement**: Calibrate weights from real feedback
3. **Cost Controlled**: Manual trigger, ~$0.50-1.00 per validation
4. **Confidence Building**: Know when simulation is reliable
5. **Drift Detection**: Catch when simulation diverges from reality
6. **Long-term Accuracy**: System improves over time with calibration

### Cost Analysis

- **Simulation**: $0 (only ONESEEK, free)
- **Validation**: ~$0.50-1.00 per run (4 external API calls + 1 ONESEEK)
- **Frequency**: Manual, recommended every 5-10 evolution runs
- **Annual**: ~$50-100 if validated weekly

---

## Phase 3 Implementation Plan

### Prerequisites

- Phase 2 fully operational ✅
- ONESEEK API stable ✅
- Firebase structure in place ✅

### Implementation Order

1. **Vector Analysis System** (Week 1-2)
   - Vector extraction prompt engineering
   - Storage schema updates
   - Integration with voting-simulator
   - Aggregation in performance-aggregator
   - UI display of vector insights

2. **Real Validation System** (Week 2-3)
   - Real voting service (external API calls)
   - Validation API endpoint
   - Comparison and calibration logic
   - UI integration (button + results display)
   - Cost tracking and limits

3. **Testing & Refinement** (Week 3-4)
   - Test vector extraction accuracy
   - Validate calibration effectiveness
   - UI/UX polish
   - Documentation updates
   - Performance optimization

### Success Metrics

- Vector extraction achieves >80% inter-rater reliability
- Real validation accuracy improves >10% over 10 runs
- Calibration reduces simulation error by >25%
- Cost stays under $2 per validation
- Users understand and use validation feature

---

## Technical Considerations

### ONESEEK-Only Constraint

All AI operations use **ONLY ONESEEK**:
- ✅ Vector analysis: ONESEEK
- ✅ Motivation parsing: ONESEEK
- ✅ Response generation: ONESEEK
- ❌ External APIs: Only for real validation (manual, cost-controlled)

### Performance

- Vector analysis adds ~500ms per vote
- Validation takes ~30-60 seconds (external API latency)
- No impact on Phase 2 evolution loops

### Error Handling

- Vector extraction failures → fallback to simple vote counting
- External API failures → retry with exponential backoff
- Calibration validation → prevent over-adjustment (max 20% per dimension)

---

## Future Enhancements (Phase 4+)

- **Automated Validation Triggers**: Validate automatically when accuracy drops
- **Multi-Objective Optimization**: Optimize for specific dimension targets
- **Category-Specific Prompts**: Different prompts for different debate topics
- **A/B Testing Framework**: Compare multiple strategies simultaneously
- **ML-Based Prediction**: Use vectors as features for outcome prediction
- **Real-Time Adaptation**: Update weights during evolution loop

---

## Documentation Updates Required

1. Update `PHASE2_IMPLEMENTATION_SUMMARY.md` with Phase 3 roadmap
2. Create `PHASE3_TESTING_GUIDE.md` for vector and validation testing
3. Update API documentation with new endpoints
4. Add vector analysis examples to `HOW_PES_WORKS_PHASE2.md`
5. Create calibration playbook for optimal validation frequency

---

**Status**: Specification Complete - Ready for Implementation
**Estimated Effort**: 3-4 weeks (1 developer)
**Risk Level**: Medium (depends on vector extraction quality)
**Value**: High (foundation for adaptive, data-driven evolution)
