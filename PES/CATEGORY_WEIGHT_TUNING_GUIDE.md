# Category Weight Tuning Guide

## Overview

This guide explains how to tune category-specific vector weights to optimize PES performance for different debate topics. Category weights determine how much each of the 8 dimensions (syntesförmåga, originalitet, etc.) contributes to the overall score for debates in a specific category.

---

## Understanding Category Weights

### The 8 Dimensions

Each dimension represents a quality that voters value in responses:

1. **syntesförmåga** (Synthesis ability) - Integrating multiple perspectives
2. **originalitet** (Originality) - Novel insights and creativity
3. **konkret_praktisk** (Concrete & Practical) - Actionable suggestions
4. **tydlig_ställning** (Clear Position) - Decisive stance
5. **balans_neutralitet** (Balance & Neutrality) - Fair consideration
6. **djup_fakta** (Depth & Facts) - Thorough research
7. **utmanar_premiss** (Challenges Assumptions) - Questions underlying assumptions
8. **personlighet_engagemang** (Personality & Engagement) - Writing style and rhetorical effectiveness

### Weight Values

- Weights range from **0.5 to 1.0**
- **1.0** = Maximum importance for this category
- **0.5** = Minimum importance (but still considered)
- Values between indicate relative importance

---

## Default Category Profiles

### Ekonomi (Economics)
```javascript
{
  syntesförmåga: 0.8,
  originalitet: 0.6,
  konkret_praktisk: 1.0,    // ← HIGH: Practical solutions critical
  tydlig_ställning: 0.8,
  balans_neutralitet: 0.7,
  djup_fakta: 0.9,          // ← HIGH: Data and evidence crucial
  utmanar_premiss: 0.5,     // ← LOW: Less valued in economics
  personlighet_engagemang: 0.6
}
```
**Why:** Economics debates value concrete, data-driven proposals with clear implementation paths.

### Filosofi (Philosophy)
```javascript
{
  syntesförmåga: 0.9,
  originalitet: 1.0,        // ← HIGH: Novel thinking highly valued
  konkret_praktisk: 0.6,    // ← LOW: Abstract thinking preferred
  tydlig_ställning: 0.8,
  balans_neutralitet: 0.8,
  djup_fakta: 0.7,
  utmanar_premiss: 1.0,     // ← HIGH: Questioning assumptions crucial
  personlighet_engagemang: 0.8
}
```
**Why:** Philosophy debates reward original thinking and challenging fundamental assumptions.

### Etik (Ethics)
```javascript
{
  syntesförmåga: 0.9,
  originalitet: 0.9,
  konkret_praktisk: 0.7,
  tydlig_ställning: 0.8,
  balans_neutralitet: 1.0,  // ← HIGH: Fairness critical
  djup_fakta: 0.8,
  utmanar_premiss: 0.9,
  personlighet_engagemang: 0.7
}
```
**Why:** Ethics debates require balanced consideration of multiple moral perspectives.

---

## When to Tune Weights

### Indicators You Need Tuning

1. **Low Accuracy After Validation**
   - Simulated vs real vote accuracy < 75%
   - Large vector deltas in calibration report

2. **Category-Specific Poor Performance**
   - Low win rates in specific categories
   - Consistent under-performance on certain topics

3. **Vector Insights Mismatch**
   - Strongest dimensions don't align with winning patterns
   - Winners have low scores in dimensions you know are important

4. **After 5-10 Validations**
   - You have enough data to identify patterns
   - Calibration reports show consistent direction of error

---

## Tuning Process

### Step 1: Analyze Current Performance

```javascript
// Get category statistics
const response = await fetch('/api/pes/categories');
const data = await response.json();

// Look for categories with poor performance
data.categories.forEach(cat => {
  if (cat.avg_performance.win_rate < 0.5) {
    console.log(`Low performance in ${cat.category}:`, cat.avg_performance);
  }
});
```

### Step 2: Review Validation Results

Check calibration reports from real voting validations:

```javascript
// In validation results:
calibration_report.dimension_deltas
// Example:
{
  "konkret_praktisk": +0.15,  // Under-predicted importance
  "utmanar_premiss": -0.10    // Over-predicted importance
}
```

### Step 3: Adjust Weights

**Rule of Thumb:**
- If dimension was **under-predicted** (+delta): **Increase weight**
- If dimension was **over-predicted** (-delta): **Decrease weight**

**Adjustment Size:**
- Small adjustment: ±0.05
- Medium adjustment: ±0.10
- Large adjustment: ±0.15

### Step 4: Apply Changes

Currently, weights are in `PES/config/category-weights.js`:

```javascript
// Edit the file
export const CATEGORY_WEIGHTS = {
  ekonomi: {
    // ... adjust values
    konkret_praktisk: 1.0 + 0.05, // Increase if under-predicted
    // ...
  }
};
```

**Note:** In production, use the API:

```javascript
// Update weights via API (future feature)
await fetch('/api/pes/weights/ekonomi', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    weights: {
      syntesförmåga: 0.8,
      // ... updated values
    }
  })
});
```

### Step 5: Validate Changes

Run 2-3 evolutions with the new weights and compare:

```javascript
// Before tuning
{
  category: "ekonomi",
  avg_votes: 2.1,
  win_rate: 0.45
}

// After tuning
{
  category: "ekonomi",
  avg_votes: 2.8,
  win_rate: 0.62
}
```

---

## Tuning Examples

### Example 1: Economics Under-Performing

**Problem:** Economics debates show low scores despite good practical content

**Analysis:**
```javascript
calibration_report: {
  dimension_deltas: {
    konkret_praktisk: +0.20,  // Real votes valued this much more
    djup_fakta: +0.15
  }
}
```

**Action:** Increase weights for practical and factual dimensions

```javascript
// Before
ekonomi: {
  konkret_praktisk: 1.0,
  djup_fakta: 0.9
}

// After
ekonomi: {
  konkret_praktisk: 1.0,  // Already at max
  djup_fakta: 0.95        // Increase +0.05
}
```

**Result:** Economics win rate improved from 45% → 58%

### Example 2: Philosophy Over-Emphasizing Practical

**Problem:** Philosophy debates favor overly concrete responses

**Analysis:**
```javascript
calibration_report: {
  dimension_deltas: {
    konkret_praktisk: -0.18,  // Over-valued
    originalitet: +0.12,      // Under-valued
    utmanar_premiss: +0.15
  }
}
```

**Action:** Decrease concrete, increase abstract dimensions

```javascript
// Before
filosofi: {
  konkret_praktisk: 0.7,
  originalitet: 1.0,
  utmanar_premiss: 1.0
}

// After
filosofi: {
  konkret_praktisk: 0.55,   // Decrease -0.15
  originalitet: 1.0,        // Keep at max
  utmanar_premiss: 1.0      // Keep at max
}
```

**Result:** Philosophy responses more abstract, win rate 25% → 42%

---

## Best Practices

### 1. Make Small Changes
- Adjust by 0.05-0.10 at a time
- Test after each change
- Avoid changing too many weights at once

### 2. Keep Weights in Range
- Minimum: 0.5
- Maximum: 1.0
- Don't set everything to 1.0 (no differentiation)
- Don't set everything to 0.5 (same as default)

### 3. Maintain Category Character
- Ekonomi should emphasize **practical** and **factual**
- Filosofi should emphasize **original** and **challenging**
- Etik should emphasize **balance** and **fairness**

### 4. Validate Frequently
- Run real validation every 5-10 evolutions
- Track accuracy trends over time
- Document changes and their effects

### 5. Use Calibration Reports
- Primary source of truth for tuning
- Compare simulated vs real deltas
- Prioritize dimensions with large deltas (>0.15)

---

## Troubleshooting

### High Variance in Results

**Problem:** Inconsistent performance in same category

**Cause:** Subcategory differences
- "ekonomi-välfärd" vs "ekonomi-handel" may need different weights

**Solution:** Consider subcategory-specific weights (future feature)

### Weights Not Affecting Results

**Problem:** Changing weights doesn't change scores

**Cause:** 
- All weights too similar
- Vector extraction not working properly

**Solution:**
- Check vector extraction logs
- Ensure weights have clear high/low distinction
- Verify categoryWeights passed to aggregator

### Calibration Shows No Clear Pattern

**Problem:** Dimension deltas are all small (<0.10)

**Cause:** Weights are already well-calibrated!

**Solution:** No action needed, maintain current weights

---

## Monitoring Performance

### Track These Metrics

1. **Category Win Rate Trend**
```
ekonomi:  45% → 52% → 58% (improving ✓)
filosofi: 25% → 42% → 38% (needs review)
```

2. **Calibration Accuracy Trend**
```
Validation 1: 72%
Validation 2: 78%
Validation 3: 84% (improving ✓)
```

3. **Dimension Delta Reduction**
```
Round 1: konkret_praktisk delta = +0.20
Round 2: konkret_praktisk delta = +0.12
Round 3: konkret_praktisk delta = +0.06 (improving ✓)
```

---

## Advanced Tuning

### Learning from Multiple Validations

Aggregate deltas across multiple validations:

```python
# Average deltas from last 5 validations
avg_deltas = {
  "syntesförmåga": +0.03,
  "originalitet": -0.02,
  "konkret_praktisk": +0.14,  # Consistent under-prediction
  # ...
}

# Apply proportional adjustment
new_weight = old_weight * (1 + avg_delta * learning_rate)
```

### Confidence-Weighted Tuning

Give more weight to high-confidence validations:

```javascript
adjustment = delta * confidence * learning_rate

// High confidence validation
delta = +0.15, confidence = 0.92
→ adjustment = +0.15 * 0.92 * 0.1 = +0.0138

// Low confidence validation  
delta = +0.15, confidence = 0.65
→ adjustment = +0.15 * 0.65 * 0.1 = +0.0098
```

---

## Summary Checklist

- [ ] Analyze current category performance
- [ ] Review validation calibration reports
- [ ] Identify dimensions with large deltas (>0.15)
- [ ] Make small weight adjustments (0.05-0.10)
- [ ] Test changes with 2-3 evolutions
- [ ] Validate with real voting
- [ ] Document changes and results
- [ ] Iterate until accuracy > 80%

---

**Remember:** Weight tuning is iterative. Make small changes, validate frequently, and track trends over time for best results.
