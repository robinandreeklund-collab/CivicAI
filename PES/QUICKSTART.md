# PES Quick Start Guide

Get started with the Prompt Evolution System in 5 minutes.

## Prerequisites

1. **Firebase configured** with environment variables:
   ```bash
   export FIREBASE_PROJECT_ID="your-project-id"
   export FIREBASE_CLIENT_EMAIL="your-email"
   export FIREBASE_PRIVATE_KEY="your-key"
   ```

2. **ONESEEK service running** on port 5000:
   ```bash
   curl http://localhost:5000/
   # Should return: {"status": "running"}
   ```

3. **Some debates logged** in Firebase (run a few live debates first)

## Step 1: Verify Setup

Test that PES can access debates:

```javascript
import { getDebates } from './PES/services/pesFirebaseService.js';

// Check if debates are available
const debates = await getDebates({ limit: 5 });
console.log(`Found ${debates.length} debates`);
```

## Step 2: Create Your First Prompt

```javascript
import { createAndTestPromptVersion } from './PES/core/orchestrator.js';

const result = await createAndTestPromptVersion({
  promptText: `Du är ONESEEK-7B-Zero, en objektiv AI-assistent.

Din uppgift är att analysera och jämföra olika AI-perspektiv på en fråga.
Var koncis, objektiv och transparent i din analys.`,
  version: 'v1.0.0',
  topic: 'general',
  metadata: {
    author: 'Your Name',
    description: 'First test prompt'
  }
}, true); // true = run simulation immediately

console.log('Prompt ID:', result.promptVersion.id);
console.log('Average Score:', result.simulation.performanceMetrics.averageScore);
```

## Step 3: Analyze Results

```javascript
import { analyzePromptPerformance } from './PES/core/analyzer.js';

const analysis = await analyzePromptPerformance('your-prompt-id');

console.log('Simulations run:', analysis.simulationCount);
console.log('Average score:', analysis.metrics.averageScore);
console.log('Success rate:', analysis.metrics.successRate);

// Review insights
analysis.insights.forEach(insight => {
  console.log(`[${insight.type}] ${insight.message}`);
});
```

## Step 4: Compare Prompts (Optional)

If you have multiple prompts:

```javascript
import { compareAndRecommend } from './PES/core/orchestrator.js';

const comparison = await compareAndRecommend('prompt-id-1', 'prompt-id-2');

console.log('Winner:', comparison.winner);
console.log('Recommendation:', comparison.recommendation);
console.log('Score difference:', comparison.differences.percentageScoreDiff + '%');
```

## Step 5: Get Best Prompt

Find the best performing prompt for a topic:

```javascript
import { getRecommendedPrompt } from './PES/core/orchestrator.js';

const recommended = await getRecommendedPrompt('general');

if (recommended.hasRecommendation) {
  console.log('Best prompt:', recommended.recommended.version);
  console.log('Average score:', recommended.metrics.averageScore);
} else {
  console.log('Not enough data yet');
}
```

## Common Commands

### Run Integration Tests
```bash
cd /home/runner/work/CivicAI/CivicAI
node PES/tests/test-pes-integration.js
```

### Run Usage Examples
```bash
node PES/examples/basic-usage.js
```

### Check Syntax
```bash
find PES -name "*.js" | xargs node --check
```

## Quick Reference

### Import Everything
```javascript
import PES from './PES/index.js';

// Or import specific functions
import {
  createAndTestPromptVersion,
  runSimulationForPrompt,
  analyzePromptPerformance,
  getRecommendedPrompt
} from './PES/index.js';
```

### Main Functions

| Function | Purpose |
|----------|---------|
| `createAndTestPromptVersion()` | Create new prompt and optionally test |
| `runSimulationForPrompt()` | Run simulation for existing prompt |
| `analyzePromptPerformance()` | Analyze a prompt's performance |
| `compareAndRecommend()` | Compare two prompts |
| `getRecommendedPrompt()` | Get best prompt for topic |
| `generatePerformanceReport()` | Generate full report |

### Configuration

Edit `PES/config/pesConfig.js` to adjust:
- Number of debates per simulation
- Performance thresholds
- Timeout settings
- Metric weights

## Troubleshooting

### "No debates available"
**Solution:** Run some live debates first to populate the database.

### "Firebase not initialized"
**Solution:** Check environment variables are set correctly.

### "ONESEEK inference error"
**Solution:** Ensure ml_service is running on port 5000.

### Simulation taking too long
**Solution:** Increase `inferenceTimeout` in `pesConfig.js`.

## Next Steps

1. **Run multiple simulations** to gather data
2. **Compare prompt versions** to find best performer
3. **Iterate on prompts** based on metrics and insights
4. **Monitor trends** over time

## Learn More

- **Full Documentation:** [PES/README.md](README.md)
- **Integration Guide:** [PES/INTEGRATION.md](INTEGRATION.md)
- **Implementation Summary:** [PES/SUMMARY.md](SUMMARY.md)
- **Usage Examples:** [PES/examples/basic-usage.js](examples/basic-usage.js)

## Support

For questions or issues:
- Check the documentation in `/PES`
- Review example code
- Contact development team

---

**Ready to start?** Run the integration tests first:
```bash
node PES/tests/test-pes-integration.js
```

Then try creating your first prompt with the examples above! 🚀
