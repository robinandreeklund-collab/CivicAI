# PES Phase 2: AI-Driven Prompt Evolution System
## Complete Specification & Architecture

**Version:** 2.0.0  
**Status:** Specification Document  
**Date:** 2025-12-18

---

## 🎯 Executive Summary

PES Phase 2 implements a **fully autonomous AI-driven prompt evolution system** where ONESEEK analyzes historical debate data, identifies performance patterns, and automatically generates improved prompt variations through iterative simulation and measurement.

**Key Difference from Phase 1:**
- Phase 1: Static heuristic scoring (length, structure, keyword matching)
- Phase 2: AI analyzes debate outcomes, voting patterns, and generates intelligent prompt improvements

---

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. LIVE DEBATE EXECUTION                                        │
│    - User asks question on /7B-zero with "Debatt ON"           │
│    - WebSocket debate: GPT-4, Gemini, DeepSeek, Grok + ONESEEK │
│    - 3 rounds of responses                                      │
│    - AI voting with motivations                                 │
│    - Winner declared, summary generated                         │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. DEBATE SAVED TO FIREBASE                                     │
│    Collection: debates                                          │
│    Fields:                                                      │
│    - debate_id (UUID)                                           │
│    - question (original question text)                          │
│    - rounds[] (array of round objects)                          │
│      └─ round_number, responses[], oneseek_response            │
│    - votes[] (array of vote objects)                            │
│      └─ voter, voted_for, motivation, category                 │
│    - winner (model name)                                        │
│    - summary (closing summary text)                             │
│    - oneseek_mentions (count in other AI responses)            │
│    - timestamp                                                  │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. PES TRIGGER (Manual or Scheduled)                            │
│    - User clicks "Start Evolution Loop" in PES frontend         │
│    - OR: Scheduled cron job (e.g., daily at 3 AM)              │
│    - OR: Automatic trigger when N new debates accumulated       │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. FETCH HISTORICAL DEBATES                                     │
│    Query: debates.orderBy('timestamp', 'desc').limit(20)        │
│    Returns: Last 10-20 completed debates with full data         │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. AI ANALYSIS PHASE                                            │
│    For each debate:                                             │
│    A. Extract patterns:                                         │
│       - ONESEEK responses in each round                         │
│       - Votes received (who, why, category)                     │
│       - Mentions by other AIs                                   │
│       - Question topic/type                                     │
│                                                                 │
│    B. LLM Reasoning (GPT-4/Claude):                             │
│       Prompt: "Analyze this debate data. Identify:             │
│       - What made ONESEEK responses effective/ineffective       │
│       - Which synthesis approaches got votes                    │
│       - When ONESEEK was mentioned positively                   │
│       - Patterns across rounds                                  │
│       Output: Structured analysis with insights"                │
│                                                                 │
│    C. Aggregate insights across all debates                     │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PROMPT VARIATION GENERATION (AI-DRIVEN)                      │
│    Input:                                                       │
│    - Current baseline prompt (v1.0.0)                           │
│    - Aggregated insights from step 5                            │
│    - Performance metrics from previous simulations              │
│                                                                 │
│    LLM Task: "Generate 3-5 prompt variations that:             │
│    - Emphasize successful synthesis patterns                    │
│    - Address weaknesses identified in analysis                  │
│    - Test different strategic approaches                        │
│    - Maintain core ONESEEK identity                            │
│    Keep changes focused and measurable."                        │
│                                                                 │
│    Output: 3-5 candidate prompts (v1.1.0-a, v1.1.0-b, etc.)    │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. SIMULATION LOOP (Per Historical Debate)                      │
│    For each of 10-20 historical debates:                        │
│      For each prompt variant (3-5 variations):                  │
│                                                                 │
│        ROUND 1:                                                 │
│        ├─ Keep external AI responses FIXED (from history)       │
│        ├─ Generate new ONESEEK response with variant prompt     │
│        │  └─ Call: /api/oneseek/generate                       │
│        │     Body: { prompt: variant, context: round1_data }    │
│        └─ Record: oneseek_response_v1.1.0-a_r1                 │
│                                                                 │
│        ROUND 2:                                                 │
│        ├─ Keep external AI responses FIXED                      │
│        ├─ Include new ONESEEK response from R1 in context       │
│        ├─ Generate new ONESEEK response                         │
│        └─ Record: oneseek_response_v1.1.0-a_r2                 │
│                                                                 │
│        ROUND 3:                                                 │
│        ├─ Keep external AI responses FIXED                      │
│        ├─ Include new ONESEEK responses from R1+R2 in context   │
│        ├─ Generate new ONESEEK response                         │
│        └─ Record: oneseek_response_v1.1.0-a_r3                 │
│                                                                 │
│        VOTING SIMULATION:                                       │
│        ├─ For each AI voter (GPT-4, Gemini, DeepSeek, Grok):   │
│        │  └─ LLM Vote: "Given this debate with responses:       │
│        │     [show all responses including new ONESEEK]         │
│        │     Vote for best answer with motivation."             │
│        ├─ Count votes for each participant                      │
│        ├─ Check: mentions of ONESEEK in voting motivations      │
│        └─ Record: votes_received, mentions, win_status          │
│                                                                 │
│    Repeat for next variant → next debate                        │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. PERFORMANCE AGGREGATION                                      │
│    For each prompt variant:                                     │
│    Metrics:                                                     │
│    - Total votes received across all debates                    │
│    - Win percentage (debates where ONESEEK won)                 │
│    - Average mentions by other AIs                              │
│    - Votes by category (accuracy, clarity, synthesis, etc.)     │
│    - Performance by question type                               │
│                                                                 │
│    Comparison:                                                  │
│    - Baseline (v1.0.0): 15 votes, 20% wins, 2.3 mentions       │
│    - Variant A (v1.1.0-a): 23 votes, 35% wins, 3.8 mentions    │
│    - Variant B (v1.1.0-b): 19 votes, 25% wins, 3.1 mentions    │
│    - Variant C (v1.1.0-c): 28 votes, 45% wins, 4.2 mentions ✓  │
│                                                                 │
│    Winner: v1.1.0-c (best overall performance)                  │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. SAVE RESULTS TO FIREBASE                                     │
│    Collection: simulations                                      │
│    Document:                                                    │
│    {                                                            │
│      simulation_id: "sim_2025-12-18_001",                      │
│      timestamp: "2025-12-18T10:30:00Z",                        │
│      baseline_version: "v1.0.0",                               │
│      debates_analyzed: 15,                                     │
│      variants_tested: [                                        │
│        {                                                       │
│          version: "v1.1.0-a",                                  │
│          prompt_text: "...",                                   │
│          metrics: {                                            │
│            total_votes: 23,                                    │
│            win_rate: 0.35,                                     │
│            avg_mentions: 3.8,                                  │
│            votes_by_category: {...}                            │
│          },                                                    │
│          debates_results: [...]                                │
│        },                                                      │
│        ...                                                     │
│      ],                                                        │
│      winner: {                                                 │
│        version: "v1.1.0-c",                                    │
│        improvement_vs_baseline: "+87% votes, +125% wins"       │
│      },                                                        │
│      insights: "Analysis shows..."                             │
│    }                                                           │
│                                                                 │
│    Collection: prompt_versions                                  │
│    Document (for winner):                                       │
│    {                                                            │
│      version: "v1.1.0-c",                                      │
│      prompt_text: "...",                                       │
│      status: "candidate",                                      │
│      simulation_id: "sim_2025-12-18_001",                      │
│      metrics: {...},                                           │
│      created_at: "2025-12-18T10:30:00Z"                        │
│    }                                                           │
└─────────────────┬───────────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. ITERATIVE IMPROVEMENT (Optional)                            │
│     If winner shows significant improvement:                    │
│     - Set v1.1.0-c as new baseline                             │
│     - Trigger new evolution loop                                │
│     - Generate v1.2.0-x variants based on v1.1.0-c insights    │
│     - Repeat process                                            │
│                                                                 │
│     Stop criteria:                                              │
│     - Diminishing returns (<5% improvement)                     │
│     - Maximum iterations reached (e.g., 10 loops)               │
│     - Manual human review required                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

### Core Components

#### 1. Evolution Orchestrator (`PES/core/evolution-orchestrator.js`)
**Responsibilities:**
- Manage full evolution loop lifecycle
- Coordinate between components
- Track progress and handle errors
- Implement stop criteria

**Key Methods:**
```javascript
async runEvolutionLoop(config) {
  // 1. Fetch debates
  const debates = await fetchHistoricalDebates(config.debateCount);
  
  // 2. Analyze patterns
  const insights = await analyzeDebatePatterns(debates);
  
  // 3. Generate variants
  const variants = await generatePromptVariants(
    config.baselinePrompt, 
    insights, 
    config.variantCount
  );
  
  // 4. Simulate all variants
  const results = await simulateAllVariants(debates, variants);
  
  // 5. Aggregate and compare
  const winner = await selectWinner(results);
  
  // 6. Save results
  await saveEvolutionResults(winner, results);
  
  return winner;
}
```

#### 2. Debate Analyzer (`PES/core/debate-analyzer.js`)
**Responsibilities:**
- Extract patterns from historical debates
- Use LLM to identify success factors
- Aggregate insights across multiple debates

**Key Methods:**
```javascript
async analyzeDebatePatterns(debates) {
  const patterns = [];
  
  for (const debate of debates) {
    // Extract structured data
    const oneseekResponses = extractOneseekResponses(debate);
    const votesReceived = extractVotesForOneseek(debate);
    const mentions = countOneseekMentions(debate);
    
    // LLM analysis
    const analysis = await llmAnalyze({
      prompt: `Analyze ONESEEK's performance in this debate:
      
      Question: ${debate.question}
      
      ONESEEK Responses:
      ${oneseekResponses.map(r => `Round ${r.round}: ${r.text}`).join('\n')}
      
      Votes Received: ${votesReceived.length}
      Details: ${JSON.stringify(votesReceived, null, 2)}
      
      Mentions by others: ${mentions}
      
      Identify:
      1. What made ONESEEK's responses effective or ineffective?
      2. Which specific phrases or approaches generated votes?
      3. How did synthesis quality compare to other AIs?
      4. What patterns emerge across rounds?
      
      Output structured insights.`,
      model: 'gpt-4-turbo'
    });
    
    patterns.push({
      debate_id: debate.id,
      question_type: classifyQuestion(debate.question),
      insights: analysis,
      metrics: {
        votes: votesReceived.length,
        mentions: mentions,
        won: debate.winner === 'ONESEEK'
      }
    });
  }
  
  // Aggregate
  return aggregateInsights(patterns);
}
```

#### 3. Prompt Variant Generator (`PES/core/prompt-generator.js`)
**Responsibilities:**
- Generate intelligent prompt variations using LLM
- Apply insights from debate analysis
- Maintain ONESEEK core identity

**Key Methods:**
```javascript
async generatePromptVariants(baselinePrompt, insights, count = 5) {
  const generationPrompt = `You are optimizing the ONESEEK debate prompt based on performance data.

Current baseline prompt:
${baselinePrompt}

Performance insights from ${insights.debates_analyzed} debates:
${formatInsights(insights)}

Key patterns:
- High-performing approaches: ${insights.successful_patterns}
- Areas for improvement: ${insights.weaknesses}
- Vote-winning synthesis styles: ${insights.winning_styles}

Generate ${count} prompt variations that:
1. Test different synthesis approaches based on successful patterns
2. Address identified weaknesses
3. Emphasize vote-winning characteristics
4. Maintain ONESEEK's core identity and tone
5. Keep changes focused and measurable

For each variation:
- Provide complete prompt text with {template_variables}
- Explain the strategic hypothesis being tested
- Predict expected impact on metrics

Output as JSON array.`;

  const response = await llmGenerate({
    prompt: generationPrompt,
    model: 'gpt-4-turbo',
    temperature: 0.7,
    max_tokens: 4000
  });
  
  const variants = parseVariants(response);
  
  // Validate each variant
  return variants.map((v, i) => ({
    version: `v${getNextVersion()}-${String.fromCharCode(97 + i)}`,
    prompt_text: v.prompt_text,
    hypothesis: v.hypothesis,
    expected_improvement: v.expected_improvement,
    changes_summary: diffPrompts(baselinePrompt, v.prompt_text)
  }));
}
```

#### 4. Historical Simulator (`PES/core/historical-simulator.js`)
**Responsibilities:**
- Replay debates with new ONESEEK prompts
- Keep external AI responses fixed
- Generate new ONESEEK responses per round

**Key Methods:**
```javascript
async simulateDebateWithVariant(historicalDebate, promptVariant) {
  const simulation = {
    debate_id: historicalDebate.id,
    variant_version: promptVariant.version,
    rounds: []
  };
  
  let contextChain = [];
  
  // Simulate each round
  for (let roundNum = 1; roundNum <= 3; roundNum++) {
    const historicalRound = historicalDebate.rounds[roundNum - 1];
    
    // Build context with historical responses + previous ONESEEK
    const roundContext = {
      question: historicalDebate.question,
      round_number: roundNum,
      max_rounds: 3,
      previous_responses: historicalRound.responses.filter(r => r.model !== 'ONESEEK'),
      chain_so_far: contextChain,
      participants: historicalDebate.participants
    };
    
    // Generate new ONESEEK response with variant prompt
    const oneseekResponse = await generateOneseekResponse(
      promptVariant.prompt_text,
      roundContext
    );
    
    simulation.rounds.push({
      round_number: roundNum,
      external_responses: roundContext.previous_responses,
      oneseek_response: oneseekResponse
    });
    
    // Update context chain
    contextChain.push({
      round: roundNum,
      responses: [...roundContext.previous_responses, oneseekResponse]
    });
  }
  
  // Simulate voting
  const votingResults = await simulateVoting(
    historicalDebate.question,
    simulation.rounds,
    historicalDebate.participants
  );
  
  simulation.voting = votingResults;
  
  return simulation;
}
```

#### 5. Voting Simulator (`PES/core/voting-simulator.js`)
**Responsibilities:**
- Simulate AI voting with motivations
- Count votes per participant
- Measure ONESEEK mentions

**Key Methods:**
```javascript
async simulateVoting(question, rounds, participants) {
  const votes = [];
  
  // Each AI votes (except ONESEEK voting for itself)
  const voters = participants.filter(p => p !== 'ONESEEK');
  
  for (const voter of voters) {
    const votingPrompt = `You are ${voter}. After this 3-round debate on:
"${question}"

All responses:
${formatAllResponses(rounds)}

Vote for the single best overall answer. Consider:
- Accuracy and factual correctness
- Clarity and structure
- Synthesis of different perspectives
- Depth of insight
- Practical relevance

Provide your vote as JSON:
{
  "voted_for": "model_name",
  "category": "accuracy|clarity|synthesis|insight|relevance",
  "motivation": "Why this answer was best (2-3 sentences)",
  "oneseek_mentioned": true/false
}`;

    const voteResponse = await llmGenerate({
      prompt: votingPrompt,
      model: voter.toLowerCase().includes('gpt') ? 'gpt-4-turbo' : 'gpt-3.5-turbo',
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const vote = JSON.parse(voteResponse);
    votes.push({
      voter: voter,
      ...vote
    });
  }
  
  // Aggregate results
  const voteCounts = countVotes(votes);
  const oneseekMentions = votes.filter(v => v.oneseek_mentioned).length;
  const oneseekVotes = votes.filter(v => v.voted_for === 'ONESEEK').length;
  
  return {
    votes: votes,
    vote_counts: voteCounts,
    oneseek_votes: oneseekVotes,
    oneseek_mentions: oneseekMentions,
    winner: Object.keys(voteCounts).reduce((a, b) => 
      voteCounts[a] > voteCounts[b] ? a : b
    ),
    oneseek_won: voteCounts['ONESEEK'] > Math.max(...Object.values(voteCounts).filter((_, i) => Object.keys(voteCounts)[i] !== 'ONESEEK'))
  };
}
```

#### 6. Performance Aggregator (`PES/core/performance-aggregator.js`)
**Responsibilities:**
- Aggregate metrics across all simulations
- Compare variants against baseline
- Identify winner

**Key Methods:**
```javascript
async aggregatePerformance(simulationResults) {
  const variantMetrics = {};
  
  // Group by variant
  for (const result of simulationResults) {
    const version = result.variant_version;
    
    if (!variantMetrics[version]) {
      variantMetrics[version] = {
        version: version,
        debates_simulated: 0,
        total_votes: 0,
        wins: 0,
        total_mentions: 0,
        votes_by_category: {},
        performance_by_question_type: {}
      };
    }
    
    const metrics = variantMetrics[version];
    metrics.debates_simulated++;
    metrics.total_votes += result.voting.oneseek_votes;
    metrics.wins += result.voting.oneseek_won ? 1 : 0;
    metrics.total_mentions += result.voting.oneseek_mentions;
    
    // Category breakdown
    result.voting.votes
      .filter(v => v.voted_for === 'ONESEEK')
      .forEach(v => {
        metrics.votes_by_category[v.category] = 
          (metrics.votes_by_category[v.category] || 0) + 1;
      });
  }
  
  // Calculate percentages and comparisons
  for (const version in variantMetrics) {
    const m = variantMetrics[version];
    m.win_rate = m.wins / m.debates_simulated;
    m.avg_votes_per_debate = m.total_votes / m.debates_simulated;
    m.avg_mentions_per_debate = m.total_mentions / m.debates_simulated;
  }
  
  return variantMetrics;
}

function selectWinner(variantMetrics, baseline_version) {
  const baseline = variantMetrics[baseline_version];
  let bestVariant = null;
  let bestImprovement = 0;
  
  for (const version in variantMetrics) {
    if (version === baseline_version) continue;
    
    const variant = variantMetrics[version];
    
    // Composite improvement score
    const improvement = 
      (variant.total_votes - baseline.total_votes) / baseline.total_votes * 0.4 +
      (variant.win_rate - baseline.win_rate) / baseline.win_rate * 0.4 +
      (variant.avg_mentions_per_debate - baseline.avg_mentions_per_debate) / baseline.avg_mentions_per_debate * 0.2;
    
    if (improvement > bestImprovement) {
      bestImprovement = improvement;
      bestVariant = variant;
    }
  }
  
  return {
    winner: bestVariant,
    improvement_percentage: (bestImprovement * 100).toFixed(1),
    all_variants: variantMetrics
  };
}
```

---

## 🔌 API Endpoints

### New REST API Routes

#### POST `/api/pes/evolution/start`
Start a new evolution loop

**Request:**
```json
{
  "baseline_prompt_id": "prompt_abc123",
  "debate_count": 15,
  "variant_count": 5,
  "auto_iterate": false
}
```

**Response:**
```json
{
  "evolution_id": "evo_2025-12-18_001",
  "status": "running",
  "estimated_time_minutes": 45,
  "progress_url": "/api/pes/evolution/evo_2025-12-18_001/progress"
}
```

#### GET `/api/pes/evolution/:id/progress`
Get real-time progress of evolution loop

**Response:**
```json
{
  "evolution_id": "evo_2025-12-18_001",
  "status": "simulating",
  "progress": {
    "debates_analyzed": 15,
    "variants_generated": 5,
    "simulations_completed": 47,
    "simulations_total": 75,
    "percentage": 63
  },
  "current_step": "Simulating variant v1.1.0-c on debate 12/15",
  "estimated_time_remaining_minutes": 18
}
```

#### GET `/api/pes/evolution/:id/results`
Get complete results after evolution completes

**Response:**
```json
{
  "evolution_id": "evo_2025-12-18_001",
  "status": "completed",
  "baseline": {
    "version": "v1.0.0",
    "metrics": {...}
  },
  "variants": [
    {
      "version": "v1.1.0-a",
      "hypothesis": "Emphasize data-driven synthesis",
      "metrics": {...},
      "improvement_vs_baseline": "+15%"
    },
    ...
  ],
  "winner": {
    "version": "v1.1.0-c",
    "metrics": {...},
    "improvement_vs_baseline": "+87%",
    "insights": "This variant performed exceptionally well by..."
  }
}
```

---

## 🎯 Key Principles

### 1. Fixed External Responses
- Historical debates provide "ground truth" external AI responses
- Only ONESEEK responses change between variants
- Ensures fair comparison (same context, different prompt)

### 2. AI-Driven Analysis
- LLM analyzes debate data, not heuristics
- Identifies patterns humans might miss
- Generates contextual insights

### 3. Autonomous Variation
- LLM generates prompt variations based on data
- No manual prompt engineering required
- System learns what works through measurement

### 4. Realistic Voting
- Simulated votes use same models as live debates
- Motivations provide qualitative feedback
- Measures actual debate performance, not proxies

### 5. Iterative Improvement
- Winner becomes new baseline
- Next loop builds on previous insights
- Converges toward optimal prompt

---

## 📦 Firebase Schema

### Collection: `evolutions`
```javascript
{
  evolution_id: "evo_2025-12-18_001",
  timestamp: "2025-12-18T10:30:00Z",
  status: "completed", // running | completed | failed
  config: {
    baseline_prompt_id: "prompt_abc123",
    baseline_version: "v1.0.0",
    debate_count: 15,
    variant_count: 5
  },
  debates_used: ["debate_123", "debate_456", ...],
  insights: {
    successful_patterns: [...],
    weaknesses: [...],
    winning_styles: [...]
  },
  variants_tested: [
    {
      version: "v1.1.0-a",
      prompt_text: "...",
      hypothesis: "...",
      metrics: {...}
    },
    ...
  ],
  winner: {
    version: "v1.1.0-c",
    improvement_percentage: 87,
    metrics: {...}
  },
  duration_minutes: 42
}
```

### Collection: `simulation_runs` (detail per debate per variant)
```javascript
{
  simulation_id: "sim_evo001_debate123_v1.1.0-a",
  evolution_id: "evo_2025-12-18_001",
  debate_id: "debate_123",
  variant_version: "v1.1.0-a",
  rounds: [
    {
      round_number: 1,
      external_responses: [...],
      oneseek_response: {...}
    },
    ...
  ],
  voting: {
    votes: [...],
    oneseek_votes: 2,
    oneseek_mentions: 3,
    oneseek_won: true
  }
}
```

---

## 🚀 Implementation Roadmap

### : Core Infrastructure
- [ ] Evolution Orchestrator skeleton
- [ ] Debate Analyzer with LLM integration
- [ ] Firebase schema updates
- [ ] API endpoints (start, progress, results)

### : Simulation Engine
- [ ] Historical Simulator (replay with variants)
- [ ] Voting Simulator with LLM
- [ ] Performance Aggregator
- [ ] Winner selection logic

### : Prompt Generation
- [ ] Prompt Variant Generator with LLM
- [ ] Insight extraction from analysis
- [ ] Template variable substitution
- [ ] Validation and testing

### : Frontend & Polish
- [ ] Evolution dashboard UI
- [ ] Real-time progress display
- [ ] Results visualization
- [ ] Comparison charts
- [ ] Integration testing

---

## 💡 Example Evolution Cycle

**Input:**
- Baseline: v1.0.0 (current MAIN_DEBATE_PROMPT)
- 15 historical debates
- Generate 5 variants

**Process:**
1. Analyze 15 debates → "ONESEEK wins when emphasizing data + synthesis"
2. Generate variants:
   - v1.1.0-a: More data-driven language
   - v1.1.0-b: Stronger synthesis emphasis
   - v1.1.0-c: Both data + synthesis
   - v1.1.0-d: Add meta-commentary
   - v1.1.0-e: Simpler, clearer language

3. Simulate 75 total scenarios (15 debates × 5 variants)
4. Vote simulation across all scenarios
5. Aggregate: v1.1.0-c gets +87% votes vs baseline
6. **Winner: v1.1.0-c**

**Output:**
- New candidate prompt ready for human review
- Data-backed performance improvement
- Clear hypothesis about why it works
- Ready for A/B test in live system

---

## ✅ Success Criteria

A successful Phase 2 implementation means:

1. **Autonomous Operation**: System runs full evolution loop without manual intervention
2. **Data-Driven**: Decisions based on actual debate outcomes, not heuristics
3. **Measurable Improvement**: Winner shows significant (>20%) improvement in votes/wins
4. **Insights Generated**: System explains WHY variants perform better
5. **Reproducible**: Same inputs produce consistent, explainable outputs
6. **Scalable**: Can process 20+ debates with 5+ variants in <1 hour

---

## 🔒 Important Notes

### LLM Costs
- Analysis: ~$0.10 per debate (GPT-4-turbo)
- Variant generation: ~$0.05 per variant
- Voting simulation: ~$0.03 per vote
- **Total per evolution loop: ~$5-10**

### Computational Time
- Single debate simulation: ~30 seconds
- Full loop (15 debates, 5 variants): ~45 minutes
- Consider background processing/queues

### Quality Control
- Human review required before deploying winners to production
- A/B testing recommended: 80% baseline, 20% winner
- Monitor for unexpected behaviors or biases

---

**This specification represents the complete vision for PES Phase 2 as an AI-driven, autonomous prompt evolution system that learns from real debate data and generates measurable improvements.**
