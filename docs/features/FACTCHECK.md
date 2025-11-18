# Fact-Checking Module Documentation

## Overview

The OneSeek.AI fact-checking module provides automated verification of AI-generated responses using the Tavily Search API. This system extracts verifiable claims from text, searches for external sources, and calculates confidence scores to ensure transparency and accuracy.

## Workflow

The fact-checking process follows these steps:

```
AI Response Text
      ↓
1. Extract & Classify Claims
      ↓
2. Search External Sources (Tavily API)
      ↓
3. Verify Claims (≥2 sources = verified)
      ↓
4. Calculate Confidence Levels
      ↓
5. Generate Overall Score
      ↓
Fact-Check Results
```

### Detailed Steps

#### 1. Claim Extraction and Classification

The system analyzes AI response text and extracts up to **3 verifiable claims**, prioritized by importance. Each claim is classified into one of five types:

| Type | Description | Example Patterns |
|------|-------------|------------------|
| **Statistical** | Percentages, ratios, numeric data | "50%", "3 av 5", "genomsnitt" |
| **Temporal** | Dates, years, time periods | "2023", "senaste året", "sedan 1995" |
| **Scientific** | Research references, studies | "forskning visar", "enligt studier" |
| **Historical** | Historical facts and events | "grundades 1950", "historiskt" |
| **Definitive** | Absolute statements | "är faktiskt", "bevisat att", "alltid" |

**Duplicate Detection:**
- Claims are normalized (lowercase, whitespace removed) to detect duplicates
- Only unique claims are included in the final list

**Prioritization:**
Claims are sorted by type priority:
1. Statistical (highest priority)
2. Scientific
3. Definitive
4. Temporal
5. Historical (lowest priority)

#### 2. External Source Search via Tavily API

For each extracted claim, the system:
- Searches for up to **3 external sources** via Tavily Search API
- Uses `search_depth: 'basic'` for speed (can be set to 'advanced' for thoroughness)
- Timeout: 10 seconds per search
- Returns sources with title, URL, snippet, and relevance score

#### 3. Claim Verification

A claim is marked as **verified** if:
- At least **2 external sources** are found (as per requirements)
- Sources have relevant content matching the claim

#### 4. Confidence Level Calculation

Confidence is calculated based on the number of sources found:

| Sources Found | Confidence Score | Percentage | Status |
|--------------|------------------|------------|--------|
| 0 sources | 0.0 | 0% | Not verified |
| 1 source | 3.3 | 33% | Insufficient |
| 2 sources | 6.7 | 67% | **Verified** ✓ |
| 3+ sources | 10.0 | 100% | Fully verified ✓✓ |

**Formula:**
```javascript
function calculateConfidence(sourceCount) {
  if (sourceCount === 0) return 0;
  if (sourceCount === 1) return 3.3;
  if (sourceCount === 2) return 6.7;
  return 10.0;
}
```

#### 5. Overall Fact-Check Score

The overall score (0-10) is calculated using:
- **50% weight:** Verification rate (verified claims / total claims)
- **50% weight:** Average confidence across all claims

**Formula:**
```javascript
function calculateOverallScore(verificationResults) {
  const verificationRate = verifiedCount / totalClaims;
  const avgConfidence = sum(confidences) / totalClaims;
  
  return (verificationRate * 5) + (avgConfidence * 0.5);
}
```

**Special Case:**
- If no claims are extracted: Overall score = 7 (neutral, no factual claims to verify)

## API Usage

### Environment Configuration

Add to `.env` file:
```env
TAVILY_API_KEY=your_tavily_api_key_here
```

Get your API key from: [Tavily Search API](https://tavily.com/)

### Functions

#### `performFactCheck(responseText, agentName)`

Performs comprehensive fact-checking on a single AI response.

**Parameters:**
- `responseText` (string): The AI response text to fact-check
- `agentName` (string): Name of the AI agent (e.g., 'gpt-3.5', 'gemini')

**Returns:**
```javascript
{
  available: true,           // Whether fact-checking is available
  agent: "gpt-3.5",         // Agent name
  claims: [                  // Array of verified claims
    {
      claim: "50% av svenska...",        // Claim text (max 150 chars)
      claimType: "statistical",          // Claim type
      claimDescription: "Statistiskt påstående",
      verified: true,                    // Verified if ≥2 sources
      confidence: 10.0,                  // Confidence score (0-10)
      sourceCount: 3,                    // Number of sources found
      sources: [                         // Array of sources
        {
          title: "Source Title",
          url: "https://...",
          snippet: "Relevant excerpt...",
          score: 0.95                    // Relevance score (0-1)
        }
      ]
    }
  ],
  overallScore: 8.5,        // Overall fact-check score (0-10)
  verifiedCount: 2,         // Number of verified claims
  totalClaims: 3,           // Total claims extracted
  summary: "2 av 3 påståenden verifierade (67%)",
  timestamp: "2025-11-13T15:32:00.000Z"
}
```

#### `batchFactCheck(responses)`

Performs fact-checking on multiple AI responses in parallel.

**Parameters:**
- `responses` (Array): Array of objects with `{response, agent}` properties

**Returns:**
```javascript
[
  { /* fact-check result for response 1 */ },
  { /* fact-check result for response 2 */ },
  { /* fact-check result for response 3 */ }
]
```

#### `compareFactChecks(factCheckResults)`

Compares fact-check results across multiple AI agents.

**Parameters:**
- `factCheckResults` (Array): Results from `batchFactCheck`

**Returns:**
```javascript
{
  available: true,
  bestAgent: "gemini",              // Agent with highest score
  bestScore: 9.2,                   // Highest score
  worstAgent: "deepseek",           // Agent with lowest score
  worstScore: 6.8,                  // Lowest score
  averageScore: 8.0,                // Average across all agents
  totalClaims: 9,                   // Total claims across all responses
  totalVerified: 7,                 // Total verified claims
  summary: "Bäst: gemini (9.2/10) • Genomsnitt: 8.0/10"
}
```

## Frontend Integration

### Components

#### FactCheckIndicator (AgentBubble)
Displays the old claim detection system (for reference, uses `checkFacts.js` utility).

#### AnalysisComparison (Tavily Fact-Check)
Displays comprehensive Tavily-based fact-checking results:
- Overall score badge (color-coded: green ≥7, yellow ≥4, red <4)
- Summary of verified vs. total claims
- Expandable details showing each claim with sources
- Click-through links to external sources

### Display Logic

```javascript
// In AnalysisComparison.jsx
{resp.bingFactCheck?.available && (
  <div>
    {/* Overall Score */}
    <span className={overallScore >= 7 ? 'green' : 'yellow'}>
      {resp.bingFactCheck.overallScore}/10
    </span>
    
    {/* Summary */}
    <div>{resp.bingFactCheck.summary}</div>
    
    {/* Individual Claims */}
    {resp.bingFactCheck.claims.map(claim => (
      <div className={claim.verified ? 'green' : 'orange'}>
        {claim.verified ? '✓' : '⚠️'} {claim.claim}
        {/* Sources */}
        {claim.sources.map(source => (
          <a href={source.url}>{source.title}</a>
        ))}
      </div>
    ))}
  </div>
)}
```

## Error Handling

The module handles various error scenarios gracefully:

| Scenario | Behavior |
|----------|----------|
| No Tavily API key | Returns `available: false` with message |
| Tavily API timeout | Logs error, returns empty sources for that claim |
| No claims extracted | Returns neutral score (7) with appropriate message |
| Tavily API error | Logs detailed error, continues with other claims |

## Logging

The module provides comprehensive console logging:

```
[FactChecker] Starting fact-check for gpt-3.5
[FactChecker] Extracted 3 claims
[FactChecker] Verifying claim: "50% av svenska..."
[FactChecker] Searching Tavily for: "50% av svenska..." (max 3 sources)
[FactChecker] Tavily returned 3 sources
[FactChecker] Found 3 sources, verified: true, confidence: 10.0
[FactChecker] Complete: 2/3 verified, overall score: 8.5/10
```

## Performance Considerations

- **Claim Extraction:** ~10-50ms (synchronous, pattern-based)
- **Tavily Search:** ~500-2000ms per claim (asynchronous API call)
- **Total Time:** For 3 claims: ~1.5-6 seconds (searches done sequentially)

**Optimization Opportunities:**
- Implement caching for identical claims
- Use parallel searches (currently sequential)
- Adjust `search_depth` based on claim priority

## Best Practices

1. **Always check `available` field** before using results
2. **Handle missing API key gracefully** in production
3. **Display confidence scores** to users for transparency
4. **Provide source links** so users can verify themselves
5. **Log errors** but don't expose sensitive information to users

## Testing

To test the fact-checking module:

```javascript
import { performFactCheck } from './services/factChecker.js';

// Test with a sample response
const testResponse = `
  I Sverige är 85% av befolkningen vaccinerade.
  Forskning visar att vaccin är effektiva.
  Detta beslutades 2021 av regeringen.
`;

const result = await performFactCheck(testResponse, 'test-agent');
console.log(result);
```

Expected output:
```javascript
{
  available: true,
  claims: [
    { claim: "I Sverige är 85% av befolkningen vaccinerade.",
      claimType: "statistical",
      verified: true,
      confidence: 10.0,
      sourceCount: 3,
      sources: [...] }
  ],
  overallScore: 9.5,
  verifiedCount: 1,
  totalClaims: 3
}
```

## Future Enhancements

- [ ] Add claim priority weighting in overall score
- [ ] Implement caching layer for repeated claims
- [ ] Support multiple languages beyond Swedish/English
- [ ] Add ML-based claim extraction (beyond pattern matching)
- [ ] Track fact-check history over time
- [ ] Add user feedback mechanism for claim verification
- [ ] Integrate additional fact-checking APIs (not just Tavily)

## Troubleshooting

### Issue: No claims extracted
**Cause:** Text doesn't match any claim patterns
**Solution:** Review claim patterns in `CLAIM_TYPES` constant

### Issue: All claims have 0 confidence
**Cause:** Tavily API not returning results
**Solution:** Check API key, internet connectivity, and Tavily service status

### Issue: Timeout errors
**Cause:** Tavily API taking too long
**Solution:** Increase timeout value in `searchTavily` function

### Issue: Claims not showing in frontend
**Cause:** Frontend expects `bingFactCheck` property
**Solution:** Verify API response includes `bingFactCheck` field

## Support

For issues or questions:
1. Check console logs for detailed error messages
2. Verify Tavily API key is configured correctly
3. Test with simple claims first
4. Review this documentation for expected behavior

---

**Version:** 1.0  
**Last Updated:** 2025-11-13  
**Module:** `backend/services/factChecker.js`
