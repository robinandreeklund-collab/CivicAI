# Calibration Playbook: When and How to Validate

## Overview

Real voting validation is the **ground truth** for PES. It compares simulated votes with actual external AI votes to measure and improve simulation accuracy. However, validation has a cost (~$0.75 per run), so use it strategically.

This playbook tells you **when** to validate, **how** to interpret results, and **what actions** to take based on findings.

---

## When to Validate

### 1. Initial Baseline (Mandatory)

**Timing:** After first 3-5 successful evolutions

**Purpose:** Establish baseline simulation accuracy

**What to Look For:**
- Overall accuracy score
- Which dimensions are well-predicted
- Which dimensions have large deltas

**Action:**
- Document baseline accuracy (e.g., 72%)
- Note categories with poorest performance
- Set target improvement goal (e.g., reach 85%)

---

### 2. After Major Changes (Required)

Validate after any of these:

#### A. Weight Adjustments
**Trigger:** You manually adjusted category weights

**Why:** Verify adjustments improved accuracy

**Example:**
```
Made change: Increased ekonomi/konkret_praktisk from 0.9 → 1.0
Validate to check: Did this improve economics performance?
```

#### B. New Categories Emerge
**Trigger:** Debates now include topics you haven't validated

**Why:** Default weights may not work for new categories

**Example:**
```
First debates about "säkerhet/cyber" appeared
Validate to check: Are default security weights appropriate?
```

#### C. Prompt Strategy Changes
**Trigger:** Winner prompt uses fundamentally different approach

**Why:** New strategy may shift which dimensions matter

**Example:**
```
New winner: Emphasizes questioning assumptions over synthesis
Validate to check: Did dimension priorities shift?
```

---

### 3. Periodic Calibration (Recommended)

**Frequency:** Every 5-10 evolutions OR monthly

**Purpose:** Catch drift in simulation accuracy over time

**Why It's Needed:**
- External AI models may update their behavior
- Debate topics evolve
- Weights may need periodic adjustment

**Process:**
1. Run evolution loop normally
2. Check if it's been 5+ evolutions since last validation
3. If yes, validate the winner
4. Apply any needed weight adjustments

---

### 4. Low Confidence Signals (Automatic Triggers)

The system can suggest validation based on these signals:

#### A. High Variance in Results
```javascript
{
  variance: 0.35,  // >0.30 is high
  consistency_score: 0.52  // <0.60 is low
}
→ TRIGGER: Validate to identify source of inconsistency
```

#### B. Unexpected Winner
```javascript
{
  expected_winner: "v1.1.0-a",
  actual_winner: "v1.1.0-c",  // Different!
  confidence: 0.58  // <0.65
}
→ TRIGGER: Validate to check if simulation accurate
```

#### C. Large Improvement Claims
```javascript
{
  improvement_percentage: 65%  // >50% is suspicious
}
→ TRIGGER: Validate to confirm dramatic improvement is real
```

---

### 5. Performance Issues (Troubleshooting)

Validate when you see:

#### A. Declining Win Rates
```
Evolution 1-5:  Win rate = 45%
Evolution 6-10: Win rate = 32%  // Declining trend
```
**Action:** Validate to see if weights are drifting

#### B. Category Under-Performance
```
Overall win rate: 60%
Ekonomi win rate: 25%  // Much lower
```
**Action:** Validate specifically on economics debates

#### C. User Reports Mismatch
```
User: "Winner prompt doesn't feel better than baseline"
```
**Action:** Validate to check if simulation is accurate

---

## How to Validate

### Step 1: Select Evolution to Validate

**Best Candidates:**
- Completed successfully
- Used diverse debate topics
- Winner has clear improvement over baseline
- Representative of typical performance

**Avoid:**
- Failed or partial evolutions
- Evolutions with errors
- Tiny datasets (<5 debates)

### Step 2: Trigger Validation

#### Via UI:
1. Go to Evolution Results page
2. Scroll to "Real-World Validation" section
3. Click "Validate with Real Voting" button
4. Confirm cost warning ($0.75)
5. Wait 30-60 seconds for results

#### Via API:
```javascript
POST /api/pes/evolution/{evolutionId}/validate
```

### Step 3: Monitor Progress

Watch for:
- API calls to external services (GPT, Gemini, DeepSeek, Grok)
- Vector extraction from real votes
- Comparison calculations
- Cost confirmation

**Typical Time:** 30-90 seconds

---

## Interpreting Results

### Accuracy Scores

#### Overall Accuracy Score
```javascript
accuracy_score: 0.82  // 82%
```

**Rating:**
- **85%+**: Excellent - simulation is highly accurate
- **75-84%**: Good - minor adjustments may help
- **65-74%**: Fair - significant tuning needed
- **<65%**: Poor - major recalibration required

#### Vote Accuracy
```javascript
vote_accuracy: 0.88  // 88%
```

**What It Means:**
- How often simulated votes match real votes
- >85% = simulation correctly predicts who wins

#### Vector Delta
```javascript
average_delta: 0.12  // 12%
```

**What It Means:**
- Average difference across all 8 dimensions
- <10% = excellent alignment
- 10-15% = good alignment  
- >15% = significant misalignment

---

### Dimension Deltas

```javascript
dimension_deltas: {
  "syntesförmåga": +0.05,      // Real votes value this 5% more
  "konkret_praktisk": +0.18,   // Real votes value this 18% more ⚠️
  "utmanar_premiss": -0.12     // Real votes value this 12% less ⚠️
}
```

**How to Read:**
- **Positive delta (+)**: Real voters value this MORE than simulation predicts
  - → **Increase weight** for this dimension
- **Negative delta (-)**: Real voters value this LESS than simulation predicts
  - → **Decrease weight** for this dimension

**Priorities:**
- |Delta| > 0.15: **High priority** - adjust immediately
- |Delta| 0.10-0.15: **Medium priority** - adjust if consistent
- |Delta| < 0.10: **Low priority** - monitor, may not need change

---

### Calibration Recommendations

```javascript
recommendations: [
  {
    dimension: "konkret_praktisk",
    issue: "under-predicted",
    magnitude: "0.18",
    suggestion: "Increase weight for konkret_praktisk to better capture importance"
  }
]
```

**Action Items:**
1. Review each recommendation
2. Prioritize by magnitude
3. Check if consistent with previous validations
4. Apply weight adjustments
5. Document changes

---

## Action Matrix

### Based on Overall Accuracy

| Accuracy | Action | Timeline |
|----------|--------|----------|
| 85%+ | No action, continue monitoring | Next validation in 10 evolutions |
| 75-84% | Minor tuning, validate in 3-5 evolutions | Within 1-2 weeks |
| 65-74% | Significant tuning needed, validate after changes | Within 3-5 days |
| <65% | Major recalibration, may need expert review | Immediately |

### Based on Dimension Deltas

| Delta | Action | Weight Adjustment |
|-------|--------|-------------------|
| >0.20 | Critical - adjust immediately | ±0.15 |
| 0.15-0.20 | High - adjust soon | ±0.10 |
| 0.10-0.15 | Medium - consider adjustment | ±0.05 |
| <0.10 | Low - monitor for patterns | No change |

---

## Example Validation Scenarios

### Scenario 1: Good Accuracy, Minor Tuning

**Results:**
```javascript
{
  accuracy_score: 0.81,
  vote_accuracy: 0.85,
  dimension_deltas: {
    konkret_praktisk: +0.11,
    balans_neutralitet: -0.08
  }
}
```

**Interpretation:**
- Overall good accuracy (81%)
- One medium delta (konkret_praktisk)
- Action: Small weight adjustment

**Actions:**
1. Increase ekonomi/konkret_praktisk: 0.9 → 0.95
2. Validate again in 5 evolutions
3. Target: 85% accuracy

---

### Scenario 2: Poor Accuracy, Major Issues

**Results:**
```javascript
{
  accuracy_score: 0.62,
  vote_accuracy: 0.68,
  dimension_deltas: {
    konkret_praktisk: +0.22,
    originalitet: +0.19,
    utmanar_premiss: -0.17
  }
}
```

**Interpretation:**
- Low accuracy (62%) ⚠️
- Multiple large deltas ⚠️
- Weights significantly miscalibrated

**Actions:**
1. **Immediate adjustments:**
   - konkret_praktisk: +0.15
   - originalitet: +0.15
   - utmanar_premiss: -0.15
2. Run 2-3 evolutions with new weights
3. Validate again within 2-3 days
4. Review prompt strategy (may need changes)

---

### Scenario 3: Category-Specific Issue

**Results:**
```javascript
{
  overall_accuracy: 0.79,
  category_performance: {
    "ekonomi": { accuracy: 0.58 },  // ⚠️ Low
    "filosofi": { accuracy: 0.88 },  // ✓ Good
    "etik": { accuracy: 0.82 }      // ✓ Good
  }
}
```

**Interpretation:**
- Overall decent (79%)
- Economics specifically problematic
- Other categories fine

**Actions:**
1. Focus on ekonomi weights only
2. Review ekonomi dimension deltas
3. Adjust ekonomi weights
4. Validate with economics debates specifically
5. Don't touch other category weights

---

## Cost Management

### Validation Budget

**Recommended Budget:** $20-50/month

**Breakdown:**
- Initial baseline: 3 validations × $0.75 = $2.25
- Periodic (monthly): 2 validations × $0.75 = $1.50
- After changes: 2-3 validations × $0.75 = $1.50-2.25
- Troubleshooting: 1-2 validations × $0.75 = $0.75-1.50

**Total:** ~$6-8/month typical, $15-20/month during intensive tuning

### Cost Optimization

1. **Batch validations**: Wait until you have 2-3 changes to validate together
2. **Target evolutions**: Validate representative evolutions, not every one
3. **Use categories**: Focus validation on problem categories only
4. **Trust simulation**: After 85% accuracy, validate less frequently

---

## Validation Checklist

Before each validation:

- [ ] Evolution completed successfully
- [ ] Status = "completed"
- [ ] Winner selected
- [ ] Budget approved (~$0.75)
- [ ] Ready to act on results

After each validation:

- [ ] Results documented
- [ ] Accuracy score recorded
- [ ] Dimension deltas analyzed
- [ ] Adjustments identified
- [ ] Changes applied (if needed)
- [ ] Next validation scheduled

---

## Troubleshooting

### Validation Fails

**Error:** "No responses available in debate"

**Cause:** Debate missing round data

**Fix:** Select different evolution to validate

---

**Error:** "External API call failed"

**Cause:** API key issue or service down

**Fix:** Check backend logs, verify API keys, retry

---

**Error:** "Cost estimation failed"

**Cause:** Service connection issue

**Fix:** Ensure backend and external services accessible

---

### Unexpected Results

**Issue:** Accuracy score much lower than expected

**Possible Causes:**
1. External AI behavior changed
2. Debate topics shifted
3. Prompt strategy fundamentally different

**Investigation:**
1. Check when last validated (>1 month ago?)
2. Review evolution debate topics vs validation debate
3. Check if external AI models updated recently

---

## Best Practices

1. **Validate Early**: Establish baseline in first week
2. **Validate Often (Initially)**: Every 3-5 evolutions during setup
3. **Validate Less (Later)**: Every 10 evolutions once calibrated
4. **Document Everything**: Track accuracy trends over time
5. **Act on Results**: Don't validate if you won't use the data
6. **Budget Wisely**: Plan $20-50/month for validation costs
7. **Trust the Process**: Accuracy improves over time with tuning

---

## Summary

**Validation Frequency:**
- Initial: 3 times (baseline)
- After changes: Always
- Periodic: Every 5-10 evolutions
- Triggered: When confidence signals low
- Troubleshooting: As needed

**Target Accuracy:** 85%+

**Cost:** $0.75 per validation, $20-50/month budget

**ROI:** 50% accuracy improvement → 30-40% fewer evolutions needed → System pays for itself
