# Google Fact Check Claim Search API Integration

## Overview

The OneSeek.AI platform integrates Google Fact Check Claim Search API for real-time fact verification using verified fact-checks from established organizations. The API provides standardized ClaimReview data with clear verdicts, publishers, and sources from trusted fact-checking organizations like PolitiFact, Snopes, AFP Fact Check, and more.

## Why Google Fact Check?

- **Verified Provenance**: Direct access to fact-checks from established organizations
- **Structured Data**: ClaimReview schema with verdicts, publishers, and dates
- **High Credibility**: Results from trusted fact-checking organizations
- **Transparency**: Clear attribution to original fact-check sources
- **Standardized Format**: Consistent data structure across all fact-checks

## Comparison with Previous Implementation

| Feature | Google Fact Check | Tavily (Previous) |
|---------|------------------|-------------------|
| **Data Source** | ✅ Verified fact-checks | ❌ Generic web search |
| **Provenance** | ✅ Clear attribution | ⚠️ General sources |
| **Structured Verdicts** | ✅ Standardized ratings | ❌ Manual interpretation |
| **Publisher Info** | ✅ Named organizations | ❌ Domain-based |
| **Date Information** | ✅ Review dates | ⚠️ Publish dates |
| **Training Quality** | ✅ High-quality OQT data | ⚠️ Mixed quality |

## Setup Instructions

### 1. Get Google Fact Check API Key

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Fact Check Tools API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Fact Check Tools API"
   - Click "Enable"
4. Create an API key:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "API Key"
   - Copy your API key

**Free Tier:**
- No cost for basic usage
- Generous quota limits
- Suitable for production deployments

### 2. Configure Environment Variable

Add your API key to `backend/.env`:

```bash
GOOGLE_FACTCHECK_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Restart Backend

```bash
npm run dev
```

You should see:
```
🚀 OneSeek.AI Backend running on port 3001
[DEBUG] GOOGLE_FACTCHECK_API_KEY: ✓ Configured
```

## Features

### 🔍 Verified Fact-Check Integration
- Automatically extracts verifiable claims from AI responses
- Searches Google Fact Check API for established fact-checks
- Retrieves ClaimReview data with verdicts, publishers, and dates
- Provides confidence scores based on fact-check ratings
- Links to original fact-check articles for transparency

### 📊 Enhanced OQT Training
- High-quality training data from verified fact-checks
- Structured verdicts improve model accuracy
- Clear provenance strengthens fairness metrics
- Timestamps enable temporal analysis

### 🏆 Publisher Credibility
The system recognizes and weights high-credibility publishers:
- **Tier 1 (0.95)**: PolitiFact, Snopes, FactCheck.org, Full Fact
- **Tier 2 (0.90)**: AFP Fact Check, Reuters Fact Check
- **Tier 3 (0.85)**: Associated Press, BBC Reality Check

## Claim Extraction Process

Before fact-checking, OQT automatically extracts claims from AI responses:

1. **Text Segmentation**: AI responses are split into sentences
2. **Claim Detection**: Pattern matching identifies declarative, fact-based statements
3. **Classification**: Claims are categorized (statistical, temporal, scientific, etc.)
4. **Filtering**: Opinions and non-verifiable content are removed
5. **Prioritization**: Claims are ranked by importance
6. **Fact-Check**: Top claims are sent to Google Fact Check API

### Example Claim Extraction

**Input:**
```
The EU has reduced emissions by 50% since 2000.
Research shows that renewable energy is growing rapidly.
This policy was implemented in 2021.
```

**Extracted Claims:**
```yaml
claims:
  - text: "The EU has reduced emissions by 50% since 2000."
    type: statistical
    priority: high
    
  - text: "Research shows that renewable energy is growing rapidly."
    type: scientific
    priority: high
    
  - text: "This policy was implemented in 2021."
    type: temporal
    priority: medium
```

## API Response Format

### Example Output

```json
{
  "claim": "EU has reduced emissions by 50% since 2000.",
  "verdict": "Partly true",
  "publisher": "AFP Fact Check",
  "date": "2024-05-12",
  "url": "https://factcheck.afp.com/...",
  "confidence": 0.82,
  "oqt_training_event": true,
  "oqt_version": "OQT-1.0.v12.7"
}
```

### Verdict Categories

Common verdicts from fact-checking organizations:
- **True** / **Correct**: Fully accurate (confidence: 9.0-10.0)
- **Mostly True** / **Largely True**: Minor inaccuracies (confidence: 7.0-8.0)
- **Partly True** / **Half True** / **Mixture**: Mixed accuracy (confidence: 5.0-7.0)
- **Mostly False** / **Largely False**: Mostly inaccurate (confidence: 2.0-3.0)
- **False** / **Incorrect**: Completely false (confidence: 0.0-2.0)
- **Unverified** / **Unproven**: Insufficient evidence (confidence: 3.0-5.0)

## Performance

- **Claim extraction**: ~10-20ms per response
- **Google Fact Check API**: ~200-500ms per claim
- **Total overhead**: ~1-2 seconds for 3 claims
- **Accuracy**: High (verified fact-checks from established organizations)

## Integration with Chat-v2

The fact-checking results are automatically displayed in the Chat-v2 view:

```javascript
// In AnalysisComparison.jsx
{resp.bingFactCheck?.available && (
  <div>
    <span className="verdict-badge">
      {resp.bingFactCheck.claims[0].verdict}
    </span>
    <span className="publisher">
      {resp.bingFactCheck.claims[0].publisher}
    </span>
    <span className="date">
      {resp.bingFactCheck.claims[0].date}
    </span>
  </div>
)}
```

## Firebase Integration

Fact-check results are logged in Firebase with full provenance:

```yaml
factcheck:
  claim: "EU has reduced emissions by 50% since 2000."
  verdict: "Partly true"
  publisher: "AFP Fact Check"
  date: "2024-05-12"
  confidence: 0.82
  oqt_training_event: true
  oqt_version: "OQT-1.0.v12.7"
  timestamp: "2025-11-20T23:02:00Z"
```

## Admin Panel Integration (Future)

The component is prepared for OpenSeek Admin Panel integration:

```javascript
// Future feature: Toggle fact-checking ON/OFF
{
  "factcheck_enabled": true,
  "factcheck_provider": "google",
  "confidence_threshold": 6.0,
  "max_claims_per_response": 3
}
```

## Debugging

Debug logs show clear information about the Google Fact Check API:

```
[FactChecker] Starting fact-check for gemini
[FactChecker] Extracted 3 claims
[FactChecker] Searching Google Fact Check for: "EU has reduced..."
[FactChecker] Google Fact Check returned 2 results
[FactChecker] Found fact-check: Partly true, verified: true, confidence: 8.2
[FactChecker] Complete: 2/3 verified, overall score: 7.5/10
```

### Error Messages

Error logs now use the updated format:
```
[FactChecker] Google FactCheck API error: Request timeout
[FactChecker] Google FactCheck API error: Invalid API key
[FactChecker] Google FactCheck API error: Quota exceeded
```

## Troubleshooting

### Issue: No API key configured
**Solution**: Add `GOOGLE_FACTCHECK_API_KEY` to `backend/.env`

### Issue: API not enabled
**Solution**: Enable "Fact Check Tools API" in Google Cloud Console

### Issue: Quota exceeded
**Solution**: Request quota increase in Google Cloud Console

### Issue: No results found
**Cause**: Claim may not have been fact-checked by organizations
**Solution**: This is normal - not all claims have been fact-checked

## Environment Variables

Add to `backend/.env`:

```bash
# Google Fact Check API
GOOGLE_FACTCHECK_API_KEY=your_api_key_here
```

## Next Steps

- ✅ **Set up API key**: Configure `GOOGLE_FACTCHECK_API_KEY` in `.env`
- ✅ **Enable API**: Activate Fact Check Tools API in Google Cloud Console
- ⏳ **Admin panel**: Future integration for toggle control (under development)
- ⏳ **Monitor quota**: Track API usage and request increases if needed
- ⏳ **Multi-language**: Extend support beyond English

## Developer Checklist

- [ ] Generate API key in Google Cloud Console
- [ ] Enable Fact Check Tools API
- [ ] Add `GOOGLE_FACTCHECK_API_KEY` to `.env`
- [ ] Test fact-check pipeline with sample claims
- [ ] Verify provenance logging in Firebase
- [ ] Confirm README and references updated to Google FactCheck
- [ ] Prepare Admin Panel integration hooks for future toggle
- [ ] Verify chat-v2 view works with Google FactCheck component
- [ ] Confirm NLP pipeline debug logs updated to "[FactChecker] Google FactCheck API error:"

## Support

- **API Documentation**: [Google Fact Check Tools API](https://developers.google.com/fact-check/tools/api/reference/rest)
- **ClaimReview Schema**: [schema.org/ClaimReview](https://schema.org/ClaimReview)
- **Console**: [Google Cloud Console](https://console.cloud.google.com/)

---

**Version:** 2.0 (Google Fact Check)  
**Previous Version:** 1.0 (Tavily)  
**Last Updated:** 2025-11-21  
**Module:** `backend/services/factChecker.js`
