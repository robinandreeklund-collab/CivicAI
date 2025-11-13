# Bing Search API Fact-Checking Integration

## Overview

The CivicAI platform integrates Microsoft's Bing Search API for real-time fact verification against web sources. This provides dynamic, up-to-date fact-checking as part of the platform's analysis engine.

## Features

### 🔍 Real-Time Fact Verification
- Automatically extracts verifiable claims from AI responses
- Searches Bing for relevant sources to verify each claim
- Provides confidence scores based on source availability
- Links to original sources for transparency

### 📊 Cross-Service Comparison
- Compares fact-check scores across all AI services
- Identifies which AI service provides the most verifiable information
- Calculates overall verification rates

### 🌐 Reliable Web Sources
- Uses Bing Search API to find reputable sources
- Filters results for quality and relevance
- Provides source metadata (title, URL, snippet, publish date)

## Architecture

### Backend Service: `factChecker.js`

**Key Functions:**
- `performFactCheck(responseText, agentName)` - Fact-checks a single AI response
- `batchFactCheck(responses)` - Fact-checks multiple responses in parallel
- `compareFactChecks(factCheckResults)` - Compares results across AI services

**Claim Extraction:**
The service automatically extracts factual claims from AI responses by:
- Identifying sentences with numbers, dates, or specific entities
- Filtering out questions
- Prioritizing statements with factual indicators (percentages, currency, years)

**Verification Process:**
1. Extract up to 3 key claims from each AI response
2. Search Bing for each claim (3 sources per claim)
3. Calculate confidence based on number of sources found
4. Mark claim as verified if at least 2 sources are found
5. Calculate overall score (0-10) based on verification rate

### API Integration

**Endpoint:** `POST /api/query`

The fact-checker is automatically invoked for all queries and results are included in the response:

```javascript
{
  responses: [{
    agent: "gpt-3.5",
    response: "...",
    analysis: {...},
    bingFactCheck: {
      available: true,
      agent: "gpt-3.5",
      claims: [{
        claim: "Sverige har cirka 10 miljoner invånare",
        verified: true,
        confidence: 10,
        sources: [{
          title: "Sveriges befolkning",
          url: "https://...",
          snippet: "..."
        }],
        sourceCount: 3
      }],
      overallScore: 8.5,
      verifiedCount: 2,
      totalClaims: 3,
      summary: "2 av 3 påståenden verifierade (67%)"
    }
  }],
  factCheckComparison: {
    available: true,
    bestAgent: "gpt-3.5",
    bestScore: 8.5,
    worstAgent: "deepseek",
    worstScore: 6.2,
    averageScore: 7.4,
    totalClaims: 9,
    totalVerified: 7,
    summary: "Bäst: gpt-3.5 (8.5/10) • Genomsnitt: 7.4/10"
  }
}
```

## Setup

### 1. Get Bing Search API Key

1. Go to [Azure Portal](https://portal.azure.com/)
2. Create a Bing Search resource
3. Navigate to "Keys and Endpoint"
4. Copy one of the API keys

### 2. Configure Environment Variable

Add to `backend/.env`:
```bash
BING_SEARCH_API_KEY=your_bing_search_api_key_here
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

The `axios` package (used for HTTP requests) will be installed automatically.

## Usage

### Automatic Integration

Fact-checking is automatically performed for all queries. No additional configuration needed once the API key is set.

### Graceful Degradation

If the Bing Search API key is not configured:
- The system continues to work normally
- Fact-check results show: `"Bing Search API-nyckel saknas - faktakoll ej tillgänglig"`
- All other analysis (NLP, sentiment, GPT meta-review) continues to function

## Frontend Display

### Analysis Comparison Component

The fact-check results are displayed in the `AnalysisComparison` component:

**Global Comparison:**
- Shows best-performing AI service for fact verification
- Displays average fact-check score across all services
- Shows total verification rate

**Per-Response Details:**
- Overall fact-check score (0-10) with color coding:
  - Green (7-10): High verification
  - Yellow (4-6): Moderate verification
  - Red (0-3): Low verification
- Expandable details showing:
  - Individual claims
  - Verification status (✓ verified, ⚠️ unverified)
  - Source links for each claim
  - Warnings if no sources found

## Performance

**Typical Response Times:**
- Claim extraction: ~10-20ms
- Bing Search per claim: ~200-500ms
- Total overhead for 3 claims: ~1-2 seconds

**Optimization:**
- Parallel searching for multiple claims
- Limited to 3 key claims per response
- 5-second timeout per search request
- Caching could be added for frequent claims

## Error Handling

**Common Issues:**

1. **API Key Missing:**
   ```
   {available: false, message: "Bing Search API-nyckel saknas"}
   ```

2. **Rate Limiting:**
   ```
   {available: false, error: "Rate limit exceeded"}
   ```

3. **Network Error:**
   ```
   {available: false, error: "Request timeout"}
   ```

All errors are logged but don't crash the application. Users see clear error messages.

## Limitations

### Current Implementation

1. **Claim Extraction:** Uses pattern-based extraction (can be enhanced with advanced NLP)
2. **Swedish Focus:** Optimized for Swedish text and questions
3. **Source Count:** Limited to 3 sources per claim to reduce API costs
4. **No Caching:** Each query makes new API calls (caching could reduce costs)

### API Constraints

- **Bing Search Free Tier:** 1,000 queries/month
- **Bing Search S1 Tier:** 1,000 queries/month (paid)
- Consider cost implications for high-traffic applications

## Future Enhancements

### Short-Term
- [ ] Add caching for frequently verified claims
- [ ] Implement more sophisticated claim extraction using NLP
- [ ] Add source credibility scoring
- [ ] Support multiple languages

### Long-Term
- [ ] Integration with fact-checking databases (Snopes, FactCheck.org)
- [ ] Machine learning model for claim importance ranking
- [ ] Historical trend analysis for evolving facts
- [ ] User feedback mechanism for verification accuracy

## Security & Privacy

**Data Handling:**
- No user data is stored by Bing Search API
- Search queries are anonymized
- Results are temporary (not persisted)
- Links to external sources are provided but not tracked

**API Key Security:**
- Store API key in `.env` file (never commit to git)
- Use environment variables in production
- Rotate keys regularly
- Monitor usage in Azure Portal

## Testing

### Manual Testing

Test with various question types:

```javascript
// Factual question
"Vad är Sveriges huvudstad?"
// Expected: High verification rate

// Opinion question
"Varför är demokrati viktigt?"
// Expected: Lower verification rate (fewer verifiable claims)

// Mixed question
"Hur många invånare har Sverige och varför är det viktigt?"
// Expected: Partial verification (first part verifiable)
```

### API Testing

Test Bing Search directly:
```bash
curl -H "Ocp-Apim-Subscription-Key: YOUR_KEY" \
  "https://api.bing.microsoft.com/v7.0/search?q=Sverige+befolkning&count=3"
```

## Support

### Documentation
- [Bing Web Search API Documentation](https://docs.microsoft.com/en-us/bing/search-apis/bing-web-search/overview)
- [Azure Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/)

### Troubleshooting

**Issue: "Bing Search API error: 401 Unauthorized"**
- Solution: Check API key is correct in `.env`
- Verify key is active in Azure Portal

**Issue: "No sources found for verification"**
- This is normal for some claims
- Try more specific or well-known facts
- Check if Bing Search is available in your region

**Issue: "Request timeout"**
- Network connectivity issues
- Bing API temporary overload
- Try increasing timeout in `factChecker.js`

## License

This integration uses Microsoft Bing Search API. Ensure compliance with [Microsoft API Terms of Use](https://www.microsoft.com/en-us/legal/terms-of-use).
