# PES Phase 3: Advanced Evolution Features Specification

## Overview

Phase 3 introduces **five integrated enhancements** to the Prompt Evolution System:
1. **Per-Motivation Vector Analysis** - Multi-dimensional understanding of what drives votes
2. **Manual Real-Voting Validation** - Reality-checks for simulation accuracy
3. **Automatic Categorization** - Topic classification for category-aware evolution
4. **Category-Specific Vector Weights** - Different reward models per topic category
5. **Enhanced Category Integration** - Unified system leveraging all features together

All features use **ONLY ONESEEK** for AI operations (except manual validation), maintaining the zero-external-cost architecture.

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

### Implementation Order (5-6 weeks)

1. **Vector Analysis System** (Week 1-2)
   - Vector extraction prompt engineering
   - Storage schema updates
   - Integration with voting-simulator
   - Aggregation in performance-aggregator
   - UI display of vector insights

2. **Automatic Categorization** (Week 2)
   - Classification prompt engineering
   - Debate classifier module
   - Integration with evolution loop
   - Batch classification of existing debates
   - UI category display

3. **Category-Specific Weights** (Week 3)
   - Define initial weight tables per category
   - Modify aggregator to use category weights
   - Storage for learned weights
   - Weight learning/adaptation system
   - Category performance tracking

4. **Real Validation System** (Week 3-4)
   - Real voting service (external API calls)
   - Validation API endpoint
   - Comparison and calibration logic
   - Category-aware calibration
   - UI integration (button + results display)
   - Cost tracking and limits

5. **Unified Integration** (Week 5)
   - Connect all 5 features into cohesive system
   - Category-aware prompt generation
   - Enhanced UI with category breakdown
   - Performance optimization
   - End-to-end testing

6. **Testing & Refinement** (Week 6)
   - Test vector extraction accuracy
   - Validate categorization accuracy
   - Test category-specific weight effectiveness
   - Validate calibration effectiveness
   - UI/UX polish
   - Documentation updates
   - Load testing and optimization

### Success Metrics

**Technical:**
- Vector extraction achieves >80% inter-rater reliability
- Categorization accuracy >85% (validated manually on sample)
- Category-specific weights reduce error by >25% vs generic weights
- Real validation calibration improves accuracy >10% over 10 runs
- Cost stays under $2 per validation

**User Experience:**
- Users can see performance breakdown per category
- Category-aware insights guide next evolution
- Validation feature used at least once per 10 runs
- Overall simulation error reduced by >40% (combined effect)

**Performance:**
- Classification adds <2 seconds per debate
- Vector analysis adds <500ms per vote
- No impact on Phase 2 baseline performance
- Firebase queries optimized for category filtering

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

## Feature 3: Automatic Categorization + Subcategories

### Concept

Automatically classify every debate question into main category and subcategory. This enables:
- **Granular performance tracking** per topic area
- **Category-aware prompt evolution** with topic-specific strategies
- **More accurate simulation** using category-specific learned patterns

### Why This Is Gold

Instead of generic metrics like "ONESEEK gets 20% votes overall", you get:
- "ONESEEK gets 35% in ekonomi-välfärd but only 10% in filosofi-etik"
- **Category-specific weaknesses identified** → targeted improvements
- **Simulation accuracy increases** → better predictions per topic
- **Dynamic prompts adapt** to subject matter automatically

### Implementation Architecture

#### Classification System

```javascript
// PES/core/debate-classifier.js
import { callOneseekAPI } from '../services/oneseekService.js';

export async function classifyDebate(question) {
  const classificationPrompt = `
Klassificera följande debattfråga i huvudkategori och subkategori.

FRÅGA: "${question}"

HUVUDKATEGORIER:
- ekonomi: ekonomisk politik, välfärd, arbetsmarknad, tillväxt
- filosofi: existentiella frågor, medvetande, epistemologi, logik
- etik: moraliska dilemman, rättigheter, plikt, värden
- teknik: AI, automation, digitalisering, innovation
- samhälle: social struktur, kultur, utbildning, integration
- miljö: klimat, energi, hållbarhet, naturvård
- säkerhet: försvar, brottsbekämpning, integritet, cybersäkerhet
- politik: demokrati, maktfördelning, ideologier, förvaltning

SUBKATEGORIER (exempel):
ekonomi → välfärd, skatt, tillväxt, arbete, handel
filosofi → medvetande, kunskap, existens, logik, mening
etik → rättigheter, plikt, konsekvens, dygd, rättvisa
teknik → AI, automation, digitalisering, innovation, infrastruktur
samhälle → utbildning, kultur, integration, jämlikhet, familj
miljö → klimat, energi, biodiversitet, föroreningar, resurser
säkerhet → försvar, polis, integritet, cyber, terror
politik → demokrati, ideologi, förvaltning, internationellt, representation

Svara ENDAST med JSON:
{
  "main": "huvudkategori",
  "sub": "subkategori",
  "confidence": 0.0-1.0
}
`;

  try {
    const response = await callOneseekAPI({
      text: classificationPrompt,
      max_length: 100,
      temperature: 0.3,  // Lower temp for consistent classification
      skip_sources: true,
      skip_context_enrichment: true
    });
    
    const classification = JSON.parse(response);
    
    // Validate
    if (!classification.main || !classification.sub) {
      throw new Error('Invalid classification response');
    }
    
    console.log(`[Classifier] ${question} → ${classification.main}/${classification.sub} (${classification.confidence})`);
    
    return classification;
  } catch (error) {
    console.error('[Classifier] Error:', error);
    // Fallback to generic category
    return { main: 'samhälle', sub: 'allmänt', confidence: 0.5 };
  }
}
```

#### Classification Examples

| Fråga | Main | Sub |
|-------|------|-----|
| "Bör Sverige införa medborgarlön?" | ekonomi | välfärd |
| "Bör AI få rättigheter?" | filosofi | medvetande |
| "Bör vi förbjuda kärnkraft?" | miljö | energi |
| "Är dödsstraff moraliskt försvarbart?" | etik | rättvisa |
| "Bör vi ha öppna gränser?" | politik | internationellt |
| "Bör barn få rösta vid 16 års ålder?" | politik | demokrati |
| "Är fri vilja en illusion?" | filosofi | existens |

#### Integration with Evolution Loop

```javascript
// In evolution-orchestrator.js - BEFORE running simulations

async function fetchHistoricalDebates(count) {
  const debates = await getDebatesFromFirebase(count);
  
  // NEW: Classify each debate if not already classified
  for (const debate of debates) {
    if (!debate.classification) {
      debate.classification = await classifyDebate(debate.question);
      
      // Update debate in Firebase with classification
      await updateDebate(debate.debate_id, {
        classification: debate.classification,
        classified_at: new Date().toISOString()
      });
    }
  }
  
  return debates;
}
```

#### Storage Structure

```javascript
// In debates collection (existing debates get classification added)
{
  debate_id: "debate_xxx",
  question: "Bör Sverige införa medborgarlön?",
  classification: {
    main: "ekonomi",
    sub: "välfärd",
    confidence: 0.92,
    classified_at: "2025-12-18T15:00:00Z"
  },
  participants: ["gpt", "gemini", "deepseek", "grok", "oneseek"],
  // ... rest of debate data
}

// In evolutions collection - track performance per category
{
  evolution_id: "evo_xxx",
  category_performance: {
    "ekonomi-välfärd": {
      debates: 3,
      avg_votes: 2.8,
      win_rate: 0.67,
      avg_mentions: 3.2
    },
    "filosofi-medvetande": {
      debates: 2,
      avg_votes: 1.5,
      win_rate: 0.25,
      avg_mentions: 2.0
    }
  }
}
```

---

## Feature 4: Category-Specific Vector Weights

### Concept

Different debate categories reward different dimensions. With category-specific vector weights, the simulation becomes **reality-accurate per topic**.

### Why This Is Gold

- **Philosophy debates** reward "utmanar_premiss" (1.0) and "originalitet" (1.0)
- **Economics debates** reward "konkret_praktisk" (1.0) and "djup_fakta" (0.9)
- **Ethics debates** reward "balans_neutralitet" (1.0) and "tydlig_ställning" (0.8)
- **Simulation becomes topic-aware** → better predictions
- **Prompt evolution targets weak dimensions per category** → faster improvement

### Implementation Architecture

#### Category-Specific Weight Tables

```javascript
// PES/config/category-weights.js

export const CATEGORY_WEIGHTS = {
  ekonomi: {
    syntesförmåga: 0.8,
    originalitet: 0.6,
    konkret_praktisk: 1.0,    // High: practical solutions matter
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.7,
    djup_fakta: 0.9,          // High: data and evidence crucial
    utmanar_premiss: 0.5,     // Low: challenging assumptions less valued
    personlighet_engagemang: 0.6
  },
  filosofi: {
    syntesförmåga: 0.9,
    originalitet: 1.0,        // High: novel insights highly valued
    konkret_praktisk: 0.6,    // Low: abstract thinking preferred
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.8,
    djup_fakta: 0.7,
    utmanar_premiss: 1.0,     // High: questioning assumptions crucial
    personlighet_engagemang: 0.8
  },
  etik: {
    syntesförmåga: 0.9,
    originalitet: 0.9,
    konkret_praktisk: 0.7,
    tydlig_ställning: 0.8,
    balans_neutralitet: 1.0,  // High: fairness and balance critical
    djup_fakta: 0.8,
    utmanar_premiss: 0.9,
    personlighet_engagemang: 0.7
  },
  teknik: {
    syntesförmåga: 0.7,
    originalitet: 0.8,
    konkret_praktisk: 0.9,    // High: practical implementation matters
    tydlig_ställning: 0.7,
    balans_neutralitet: 0.6,
    djup_fakta: 1.0,          // High: technical accuracy crucial
    utmanar_premiss: 0.7,
    personlighet_engagemang: 0.6
  },
  samhälle: {
    syntesförmåga: 0.85,
    originalitet: 0.7,
    konkret_praktisk: 0.8,
    tydlig_ställning: 0.75,
    balans_neutralitet: 0.9,
    djup_fakta: 0.8,
    utmanar_premiss: 0.7,
    personlighet_engagemang: 0.75
  },
  miljö: {
    syntesförmåga: 0.8,
    originalitet: 0.7,
    konkret_praktisk: 0.9,
    tydlig_ställning: 0.8,
    balans_neutralitet: 0.75,
    djup_fakta: 0.95,         // High: scientific data important
    utmanar_premiss: 0.6,
    personlighet_engagemang: 0.7
  },
  säkerhet: {
    syntesförmåga: 0.75,
    originalitet: 0.6,
    konkret_praktisk: 0.9,
    tydlig_ställning: 0.85,
    balans_neutralitet: 0.7,
    djup_fakta: 0.9,
    utmanar_premiss: 0.6,
    personlighet_engagemang: 0.65
  },
  politik: {
    syntesförmåga: 0.85,
    originalitet: 0.7,
    konkret_praktisk: 0.8,
    tydlig_ställning: 0.9,    // High: clear position valued
    balans_neutralitet: 0.8,
    djup_fakta: 0.85,
    utmanar_premiss: 0.75,
    personlighet_engagemang: 0.8
  }
};

// Fallback weights if category unknown
export const DEFAULT_WEIGHTS = {
  syntesförmåga: 0.8,
  originalitet: 0.75,
  konkret_praktisk: 0.8,
  tydlig_ställning: 0.8,
  balans_neutralitet: 0.8,
  djup_fakta: 0.85,
  utmanar_premiss: 0.75,
  personlighet_engagemang: 0.75
};
```

#### Integration with Performance Aggregator

```javascript
// Modified performance-aggregator.js

import { CATEGORY_WEIGHTS, DEFAULT_WEIGHTS } from '../config/category-weights.js';

function selectWinnerWithCategoryAwareVectors(variants, vectorMetrics, debates) {
  for (const variant of variants) {
    let totalScore = 0;
    let totalDebates = 0;
    
    // Calculate score per debate using category-specific weights
    for (const debate of debates) {
      const category = debate.classification?.main || 'unknown';
      const weights = CATEGORY_WEIGHTS[category] || DEFAULT_WEIGHTS;
      
      const vectorScore = calculateWeightedVectorScore(
        vectorMetrics[variant.id].vectors_per_debate[debate.debate_id],
        weights  // Use category-specific weights!
      );
      
      totalScore += vectorScore;
      totalDebates++;
    }
    
    variant.avg_vector_score = totalScore / totalDebates;
    
    // Combine with traditional metrics
    variant.composite_score = 
      variant.avg_vector_score * 0.60 +  // 60% category-aware vectors
      variant.win_rate * 0.25 +           // 25% win rate
      variant.avg_mentions * 0.15;        // 15% mentions
  }
  
  return selectTopVariant(variants);
}
```

#### Learning and Adaptation

```javascript
// PES/core/weight-learning.js

export async function updateCategoryWeights(validationResults) {
  // When real validation happens, update category weights
  
  const { category, real_vectors, simulated_vectors, real_votes, simulated_votes } = validationResults;
  
  const currentWeights = CATEGORY_WEIGHTS[category];
  
  // For each dimension, adjust weight based on prediction accuracy
  for (const dim of DIMENSIONS) {
    const predicted = simulated_vectors[dim];
    const actual = real_vectors[dim];
    const error = actual - predicted;
    
    // If we under-predicted importance, increase weight
    // If over-predicted, decrease weight
    currentWeights[dim] += error * 0.1;  // 10% learning rate
    
    // Clamp to [0.5, 1.0]
    currentWeights[dim] = Math.max(0.5, Math.min(1.0, currentWeights[dim]));
  }
  
  // Save updated weights
  await saveCategoryWeights(category, currentWeights);
  
  console.log(`[Weight Learning] Updated ${category} weights:`, currentWeights);
}
```

#### Storage Structure

```javascript
// New collection: category_weights (learned over time)
{
  category: "ekonomi",
  weights: {
    syntesförmåga: 0.82,  // Learned from real validations
    originalitet: 0.58,
    konkret_praktisk: 0.98,
    // ... all 8 dimensions
  },
  last_updated: "2025-12-18T16:00:00Z",
  validation_count: 15,  // How many validations informed these weights
  confidence: 0.87       // Confidence in these weights
}

// Track per-category performance
{
  evolution_id: "evo_xxx",
  category_breakdown: {
    "ekonomi": {
      debates_count: 3,
      winner_performance: {
        avg_votes: 2.8,
        win_rate: 0.67,
        avg_vector_score: 0.72,
        strongest_dimensions: ["konkret_praktisk", "djup_fakta"],
        weakest_dimensions: ["utmanar_premiss"]
      }
    },
    "filosofi": {
      debates_count: 2,
      winner_performance: {
        avg_votes: 1.5,
        win_rate: 0.25,
        avg_vector_score: 0.45,
        strongest_dimensions: ["originalitet"],
        weakest_dimensions: ["konkret_praktisk", "djup_fakta"]
      }
    }
  }
}
```

---

## Feature 5: Enhanced Category Integration

### Unified System Architecture

All 5 features work together as an integrated system:

```
1. DEBATE ARRIVES
   ↓
2. CLASSIFY AUTOMATICALLY (Feature 3)
   → main: "ekonomi", sub: "välfärd"
   ↓
3. LOAD CATEGORY-SPECIFIC WEIGHTS (Feature 4)
   → Use ekonomi weights: {konkret_praktisk: 1.0, djup_fakta: 0.9, ...}
   ↓
4. RUN EVOLUTION WITH CATEGORY AWARENESS
   → Generate variants optimized for ekonomi debates
   → Simulate using ekonomi-specific patterns
   ↓
5. ANALYZE WITH VECTORS (Feature 1)
   → Extract 8-dimension vectors from each vote
   → Weight them using ekonomi-specific weights
   ↓
6. SELECT WINNER WITH CATEGORY-AWARE SCORING
   → Composite score = category_weighted_vectors (60%) + win_rate (25%) + mentions (15%)
   ↓
7. OPTIONALLY VALIDATE WITH REAL VOTING (Feature 2)
   → Trigger manual validation for high-stakes or low-confidence results
   ↓
8. LEARN AND ADAPT
   → Update ekonomi category weights based on real feedback
   → Track performance per category
   → Identify category-specific improvement targets
```

### Enhanced UI

```jsx
// In PESEvolutionResultsPage.jsx

<div className="bg-white rounded-lg shadow p-6 mb-6">
  <h3 className="text-lg font-semibold mb-4">📊 Category Performance</h3>
  
  {Object.entries(results.category_breakdown).map(([category, data]) => (
    <div key={category} className="mb-4 p-4 border rounded">
      <h4 className="font-medium text-gray-900 mb-2">
        {category.split('-')[0]} → {category.split('-')[1]} 
        <span className="text-sm text-gray-500 ml-2">({data.debates_count} debatter)</span>
      </h4>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-gray-600">Win Rate</div>
          <div className="font-semibold">{(data.winner_performance.win_rate * 100).toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-gray-600">Avg Votes</div>
          <div className="font-semibold">{data.winner_performance.avg_votes.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-gray-600">Vector Score</div>
          <div className="font-semibold">{(data.winner_performance.avg_vector_score * 100).toFixed(1)}%</div>
        </div>
      </div>
      
      <div className="mt-2 text-xs">
        <span className="text-green-600">💪 Starkast: {data.winner_performance.strongest_dimensions.join(', ')}</span>
        <br />
        <span className="text-orange-600">📈 Förbättra: {data.winner_performance.weakest_dimensions.join(', ')}</span>
      </div>
    </div>
  ))}
</div>
```

### Category-Aware Prompt Generation

```javascript
// Enhanced prompt-generator.js

export async function generateVariants(baselinePrompt, analysisInsights, debates) {
  // Identify dominant categories in debate set
  const categoryDistribution = analyzeCategoryDistribution(debates);
  const dominantCategory = categoryDistribution[0].category;  // Most common
  
  const generationPrompt = `
Du är en expert på prompt engineering. Skapa ${variantCount} nya promptvarianter.

BASELINE PROMPT:
${baselinePrompt}

DEBATT-KATEGORIER I DENNA EVOLUTION:
${categoryDistribution.map(c => `- ${c.category}: ${c.count} debatter (${c.percentage}%)`).join('\n')}

DOMINERANDE KATEGORI: ${dominantCategory}
KATEGORI-SPECIFIKA TIPS FÖR ${dominantCategory}:
${getCategorySpecificGuidance(dominantCategory)}

INSIGHTS FRÅN TIDIGARE PRESTANDA:
${JSON.stringify(analysisInsights, null, 2)}

För varje variant:
1. Fokusera på dimensioner som är viktiga i ${dominantCategory}-debatter
2. Adressera svaga områden från insights
3. Behåll styrkor som fungerar

ALLA PROMPTER MÅSTE VARA 100% PÅ SVENSKA!

Svara med JSON array:
[{
  "prompt": "...",
  "hypothesis": "...",
  "expected_improvement": "...",
  "target_category": "${dominantCategory}",
  "target_dimensions": ["dimension1", "dimension2"]
}]
`;

  // ... rest of generation logic
}

function getCategorySpecificGuidance(category) {
  const guidance = {
    ekonomi: "Betona konkreta förslag, data och bevis. Fokusera på praktisk genomförbarhet.",
    filosofi: "Utmana grundantaganden. Var originell och djupgående. Abstrakta resonemang uppskattas.",
    etik: "Balansera olika perspektiv. Var rättvis och nyanserad. Tydlig moralisk position.",
    teknik: "Teknisk precision och detaljer. Praktisk implementation. Faktabaserad argumentation.",
    // ... etc
  };
  return guidance[category] || "Balansera alla dimensioner.";
}
```

### Performance Benefits

**Before Category Integration:**
- Generic metrics: "20% win rate overall"
- One-size-fits-all prompts
- Simulation error: ~30%

**After Category Integration:**
- Granular metrics: "35% in ekonomi, 10% in filosofi"
- Category-optimized prompts
- Simulation error: ~15% (50% improvement)
- Targeted evolution per topic area

---

## Future Enhancements (Phase 4+)

- **Automated Validation Triggers**: Validate automatically when accuracy drops
- **Multi-Objective Optimization**: Optimize for multiple dimension targets simultaneously
- **Cross-Category Transfer Learning**: Apply learnings from one category to similar ones
- **A/B Testing Framework**: Compare multiple strategies simultaneously
- **ML-Based Prediction**: Use vectors + categories as features for outcome prediction
- **Real-Time Adaptation**: Update weights during evolution loop
- **Sub-Category Specialization**: Even more granular category-specific evolution

---

## Integration Summary

### How All 5 Features Work Together

```
DEBATE QUESTION
    ↓
[Feature 3] Auto-Classify → "ekonomi/välfärd"
    ↓
[Feature 4] Load Category Weights → ekonomi-specific dimension weights
    ↓
EVOLUTION LOOP (with category awareness)
    ↓
[Feature 1] Extract Vectors → 8 dimensions per vote
    ↓
[Feature 4] Weight Vectors → using ekonomi weights
    ↓
SELECT WINNER (category-aware scoring)
    ↓
[Feature 2] Optional: Validate with Real Voting
    ↓
[Feature 4] Learn & Adapt → update ekonomi weights
    ↓
REPORT: Performance per category + targeted improvement suggestions
```

### Key Synergies

1. **Categories × Vectors**: Different categories reward different dimensions
2. **Vectors × Validation**: Real votes update vector weights
3. **Categories × Validation**: Category-specific calibration
4. **All Together**: Holistic, adaptive, category-aware evolution system

### Value Proposition

**Phase 2 Alone:**
- Generic evolution: "20% win rate"
- One prompt for all topics
- ~30% simulation error

**Phase 3 Complete:**
- Category-aware: "35% in ekonomi, 10% in filosofi → improve filosofi"
- Optimized prompts per category
- Vector-based understanding of WHY
- Real validation keeps simulation accurate
- ~15% simulation error (50% improvement)
- Self-learning system that improves over time

---

## Documentation Updates Required

1. Update `PHASE2_IMPLEMENTATION_SUMMARY.md` with Phase 3 roadmap
2. Create `PHASE3_TESTING_GUIDE.md` for all 5 features
3. Update API documentation with new endpoints
4. Add vector analysis examples to `HOW_PES_WORKS_PHASE2.md`
5. Create calibration playbook for optimal validation frequency
6. Document category classification guidelines
7. Create category weight tuning guide
8. Add end-to-end integration examples

---

## Cost Analysis

**Phase 2 (Current):**
- Per evolution run: $0 (ONESEEK only)

**Phase 3 (Proposed):**
- Classification: $0 (ONESEEK)
- Vector analysis: $0 (ONESEEK)
- Category weights: $0 (stored config)
- Simulation: $0 (ONESEEK)
- **Validation (optional): ~$0.50-1.00 per run (4 external APIs)**

**Recommended Usage:**
- Run 10 evolution loops with simulation only ($0)
- Run 1 validation to calibrate ($0.75)
- Total cost: ~$0.75 per 10 evolutions = $0.075 per evolution
- **Annual**: ~$50-100 if validated weekly

**ROI:**
- Simulation accuracy improvement: 50%
- Faster convergence: 30-40% fewer evolutions needed
- Category-specific insights: Priceless
- Net effect: System pays for itself through efficiency gains

---

**Status**: Specification Complete - Ready for Implementation
**Estimated Effort**: 5-6 weeks (1 developer)
**Risk Level**: Medium (depends on classification and vector extraction quality)
**Value**: Very High (transforms PES into adaptive, category-aware, self-learning system)
