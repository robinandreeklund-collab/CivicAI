# ONESEEK Data Reasoning Implementation

## Overview

This document describes the implementation of the **Data Reasoning step** for ONESEEK in AI debates. This feature was added to enhance ONESEEK's debate contributions with real-time fact-checking and data-driven insights using the Tavily search API.

## Purpose

ONESEEK becomes:
- **Överlägset faktabaserad** - Superior fact-based argumentation
- **Trovärdig** - Credible with cited sources
- **Dynamisk** - Can fetch own data and fact-check others
- **Verklighetförankrad** - Reality-anchored in every contribution

## Architecture

### Flow Overview

```
Debate Round Start
    ↓
External AI Responses (GPT, Gemini, DeepSeek, Grok)
    ↓
[NEW] DATA REASONING STEP ← Identifies data needs
    ↓
[NEW] Tavily Search Execution ← Fetches real-time data
    ↓
[NEW] Data Injection ← Adds to main prompt
    ↓
ONESEEK Main Contribution ← Uses real-time data
    ↓
Round Complete
```

### Components

#### 1. Data Reasoning Prompt (80-120 words)

Located in: `ml_service/server.py` (lines ~13660-13750)

**Purpose:**
- Analyze debate context
- Extract data claims from other AIs
- Identify fact-checking needs
- Request explicit Tavily searches

**Key Features:**
- Always runs before main contribution
- Works in all rounds (1-3)
- Context-aware (previous rounds + current round)
- Structured output with search queries

**Example Output:**
```
GPT påstår att arbetskraftsbristen i vården är 50%, men ingen källa anges.
Gemini nämner befolkningsökning men utan siffror.

Tavily-sökning: Senaste SCB-statistik arbetskraftsbrist vård Sverige 2025

Detta behövs för att faktakolla GPT:s påstående och ge konkret data till debatten.
```

#### 2. Query Extraction

Located in: `ml_service/tavily_search.py` (`extract_tavily_queries()`)

**Purpose:**
- Parse reasoning text for search queries
- Support multiple query patterns
- Clean and validate queries

**Supported Patterns:**
```python
# Pattern 1: "Tavily-sökning: <query>"
Tavily-sökning: Senaste befolkningsstatistik Stockholm 2025 SCB

# Pattern 2: "Sök: <query>"
Sök: arbetskraftsbrist vård Sverige 2024

# Pattern 3: Quoted queries
query: "klimatförändring Sverige statistik"
```

**Features:**
- Handles Swedish and English syntax
- Stops at newlines and periods
- Removes duplicates
- Minimum 10 characters per query

#### 3. Tavily Integration

Located in: `ml_service/server.py` (lines ~13750-13800)

**Configuration:**
- Max 3 searches per round (token management)
- Search depth: "advanced"
- Max results: 4 per query
- Language: Swedish (`language="sv"`)

**Priority Domains:**
```python
SWEDISH_PRIORITY_DOMAINS = [
    "scb.se",           # Statistics Sweden
    "smhi.se",          # Weather
    "riksdagen.se",     # Parliament
    "regeringen.se",    # Government
    "1177.se",          # Healthcare
    "krisinformation.se", # Crisis info
    ...
]
```

**Search Execution:**
```python
result = tavily_search(
    query=query,
    max_results=4,
    search_depth="advanced",
    include_answer=True
)
```

#### 4. Data Injection

Located in: `ml_service/server.py` (lines ~13900-13920)

**Format:**
```
**REALTIDSDATA FRÅN TAVILY:**

**Sökning 1:** Senaste SCB-statistik arbetskraftsbrist vård Sverige 2025
**Sammanfattning:** Enligt SCB är arbetskraftsbristen i vård...

**Källor:**
1. [SCB - Arbetsmarknadsstatistik](https://scb.se/...)
   Arbetskraftsbristen inom vård och omsorg ökade...

2. [Regeringen - Vårdreform](https://regeringen.se/...)
   Nya åtgärder för att möta bristen...

**ANVÄND REALTIDSDATA:**
- Stödja din ståndpunkt med fakta och källhänvisningar från ovan
- Bemöta eller nyansera andras påståenden med faktadata
- Inkludera minst en verklighetsanknytning med källreferens i ditt bidrag
```

#### 5. WebSocket Events

**New Events:**

1. **`data_reasoning`**
   ```json
   {
     "type": "data_reasoning",
     "round": 1,
     "message": "Analyserar data-påståenden...",
     "data": {
       "reasoning": "GPT påstår att..."
     },
     "sequence": 5
   }
   ```

2. **`tavily_data`**
   ```json
   {
     "type": "tavily_data",
     "round": 1,
     "message": "✓ Hämtade 2 datakällor via Tavily",
     "data": {
       "results": [...],
       "count": 2
     },
     "sequence": 6
   }
   ```

## Usage Example

### 1. User asks debate question:
```
[debatt] Hur kan Sverige lösa arbetskraftsbristen i vården?
```

### 2. External AIs respond with claims:
- **GPT**: "Arbetskraftsbristen är 50%..."
- **Gemini**: "Befolkningen ökar snabbt..."

### 3. Data Reasoning activates:
```
GPT påstår 50% brist utan källa.
Gemini nämner befolkningsökning utan siffror.

Tavily-sökning: SCB arbetskraftsbrist vård Sverige 2025
Tavily-sökning: befolkningsstatistik Sverige 2024
```

### 4. Tavily searches execute:
- Fetches SCB data on healthcare workforce
- Fetches population statistics
- Summarizes results with sources

### 5. ONESEEK uses data in contribution:
```
Enligt SCB:s senaste statistik (Q3 2024) är arbetskraftsbristen 
i vård och omsorg 37%, inte 50% som GPT påstår [källa: scb.se/...].

Befolkningen växer med 0.8% årligen enligt SCB, vilket betyder 
cirka 83,000 nya invånare per år [källa: scb.se/...].

Detta innebär att vi behöver utbilda 4,200 nya vårdpersonal 
per år bara för att hålla jämna steg med befolkningsökningen...
```

## Configuration

### Environment Variables

```bash
# Required for Tavily integration
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxx
```

### Temperature Settings

Located in: `datasets/debate_prompts/temperatures.json`

```json
{
  "data_reasoning": 0.75  // New: Controls Data Reasoning creativity
}
```

### Prompt Templates

Located in: `datasets/debate_prompts/prompts.json`

Can override the hardcoded Data Reasoning prompt:
```json
{
  "data_reasoning": "Du är ONESEEK - analysera databehov..."
}
```

## Testing

### Manual Test

```bash
cd /home/runner/work/CivicAI/CivicAI/ml_service

# Test query extraction
python3 -c "
from tavily_search import extract_tavily_queries

test_text = '''
GPT påstår 50% utan källa.
Tavily-sökning: SCB arbetskraftsbrist vård 2025
Sök: befolkning Sverige statistik
'''

queries = extract_tavily_queries(test_text)
print('Queries:', queries)
"

# Test Tavily search
python3 tavily_search.py
```

### Integration Test

Run a debate with `[debatt]` prefix:
```
[debatt] Hur löser Sverige klimatutmaningen?
```

Check logs for:
```
[WS-Debate] DATA REASONING: Starting data analysis step...
[WS-Debate] DATA REASONING: Found 2 Tavily queries to execute
[WS-Debate] Executing Tavily search: ...
[WS-Debate] Tavily search successful for: ...
[WS-Debate] DATA REASONING: Injected 2 Tavily results into main prompt
```

## Performance Considerations

### Token Management
- Data Reasoning: ~300-400 tokens
- Tavily results: ~500-1000 tokens per search
- Max 3 searches: ~1500-3000 tokens total
- Total overhead: ~2000-3500 tokens per round

### Latency
- Data Reasoning generation: ~2-3 seconds
- Tavily searches (3x): ~3-6 seconds
- Total added time: ~5-9 seconds per round

### Rate Limits
- Tavily API: Check your plan limits
- Recommended: Monitor usage per debate
- Fallback: Graceful degradation if quota exceeded

## Error Handling

### No API Key
```python
if not TAVILY_API_KEY:
    logger.warning("[TAVILY] No API key - skipping searches")
    # Continue without data
```

### Search Failures
```python
except Exception as e:
    logger.error(f"[WS-Debate] Error executing Tavily searches: {e}")
    injected_data = ""
    # Continue with empty data
```

### Extraction Failures
```python
if not queries:
    logger.info("DATA REASONING: No queries extracted")
    # No data needed or extraction failed
```

## Future Enhancements

### Potential Improvements

1. **Adaptive Search Depth**
   - Use "basic" for simple claims
   - Use "advanced" for complex topics

2. **Domain Specialization**
   - Healthcare debates → prioritize health.se, 1177.se
   - Economics → prioritize scb.se, ekonomifakta.se

3. **Fact-Check Confidence**
   - Score each claim's verification level
   - Display confidence meters in UI

4. **Historical Data Caching**
   - Cache common queries
   - Reduce API calls for repeated topics

5. **Multi-Source Synthesis**
   - Combine multiple sources automatically
   - Resolve conflicting data

## Troubleshooting

### Issue: No queries extracted
**Cause:** ONESEEK didn't format queries correctly
**Solution:** Improve prompt to emphasize exact format

### Issue: Tavily timeout
**Cause:** Network latency or API overload
**Solution:** Increase timeout, add retry logic

### Issue: Irrelevant data
**Cause:** Query too broad or ambiguous
**Solution:** Refine Data Reasoning prompt for specificity

### Issue: Swedish sources missing
**Cause:** Priority domains not working
**Solution:** Check Tavily language setting ("sv")

## Related Documentation

- `ONESEEK_DEBATE_ENHANCEMENTS.md` - PR #128 debate changes
- `DEBATE_IMPLEMENTATION.md` - Overall debate architecture
- `tavily_search.py` - Tavily integration code
- `server.py` - Main debate logic

## Contact & Support

For issues or questions:
1. Check logs in `ml_service/server.py`
2. Verify Tavily API key configuration
3. Test query extraction separately
4. Review WebSocket events in browser console

---

**Version:** 1.0  
**Date:** 2025-12-24  
**Author:** GitHub Copilot (via robinandreeklund-collab)
