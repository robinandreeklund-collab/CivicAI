# ChatV2 ML Panel Location Guide

## 🎯 Where to Find the New ML Visualization Panels

All 5 new ML panels are now **ALWAYS VISIBLE** in the ChatV2 Overview tab.

### Access Instructions

1. **Navigate to ChatV2**
   - URL: `/chat-v2` in your frontend application
   - Or click "ChatV2" in the navigation menu

2. **Submit a Query**
   - Type any question in the input field
   - Example: "Vad är Sveriges klimatmål för 2045?"
   - Click "Skicka" or press Enter

3. **View the Panels in Översikt Tab**
   - After receiving AI responses, the **Översikt (Overview)** tab is selected by default
   - Scroll down below the main AI responses to see all 5 panels

---

## 📊 The 5 ML Panels

### Panel 1: Explainability (SHAP/LIME) 🔍
**Location:** Overview tab, first ML panel  
**What it shows:**
- SHAP feature importance with contribution bars
- LIME local interpretability with word weights
- Positive/negative contribution indicators

**Data source:** `response.explainability`  
**Backend endpoints:**
- `POST /api/ml/shap` - SHAP analysis
- `POST /api/ml/lime` - LIME analysis

**Current state:** Shows placeholder text until integrated into query flow

---

### Panel 2: Toxicity Analysis (Detoxify) 🛡️
**Location:** Overview tab, second ML panel  
**What it shows:**
- 6 toxicity dimensions with color-coded risk levels:
  - Toxicity (overall)
  - Threat
  - Insult
  - Identity Attack
  - Obscene
  - Severe Toxicity
- Visual risk indicators (green/yellow/red)
- Overall toxicity assessment

**Data source:** `response.toxicity`  
**Backend endpoint:** `POST /api/ml/toxicity`

**Current state:** Shows placeholder text until integrated into query flow

---

### Panel 3: Topic Modeling (BERTopic & Gensim) 🧠
**Location:** Overview tab, third ML panel  
**What it shows:**
- **BERTopic topics** with:
  - Topic labels and IDs
  - Probability percentages
  - Coherence scores
  - Key terms visualization
- **Gensim LDA topics** (when using `method="both"`) with:
  - Same structure as BERTopic
  - Separate section with green indicator

**Data source:** `response.topics`  
**Backend endpoint:** `POST /api/ml/topics`  
**Special feature:** Supports parallel analysis
```json
{
  "text": "Your text here",
  "method": "both"  // Returns both BERTopic and Gensim results
}
```

**Current state:** Shows placeholder text until integrated into query flow  
**Note:** Panel now supports displaying both BERTopic and Gensim results simultaneously

---

### Panel 4: Bias & Fairness (Fairlearn) ⚖️
**Location:** Overview tab, fourth ML panel  
**What it shows:**
- 3 fairness metrics:
  - Demographic Parity
  - Equalized Odds
  - Disparate Impact
- Fairness violation warnings
- Actionable recommendations
- Historical bias drift visualization (when available)

**Data source:** `response.fairness`  
**Backend endpoint:** `POST /api/ml/fairness`

**Current state:** Shows placeholder text until integrated into query flow

---

### Panel 5: Fact Checking (Tavily) ✅
**Location:** Overview tab, fifth ML panel  
**What it shows:**
- Verification status (true/false/partially_true/unverified)
- Confidence scores
- Source citations with:
  - Credibility ratings
  - URLs
  - Supporting/contradicting evidence counts
- Verdict summary

**Data source:** `response.factCheck`  
**Backend endpoints:**
- `POST /api/fact-check/verify` - Main verification
- `POST /api/fact-check/sources` - Source search

**Configuration required:** Set `TAVILY_API_KEY` environment variable  
**Current state:** Shows placeholder text until integrated into query flow

---

## 🔗 How to See Real Data

The panels currently show placeholder text with TODO messages. To populate them with real data:

### Option 1: Quick Test (Manual API Calls)
Use the backend endpoints directly:

```bash
# Test toxicity
curl -X POST http://localhost:3001/api/ml/toxicity \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text to analyze"}'

# Test topics (parallel BERTopic + Gensim)
curl -X POST http://localhost:3001/api/ml/topics \
  -H "Content-Type: application/json" \
  -d '{"text": "Long text about a topic...", "method": "both"}'

# Test fact checking
curl -X POST http://localhost:3001/api/fact-check/verify \
  -H "Content-Type: application/json" \
  -d '{"claim": "Sweden aims for carbon neutrality by 2045"}'
```

### Option 2: Integrate into Query Flow (Recommended)

Update the `/api/query` backend endpoint to automatically include ML analysis:

1. **Edit:** `backend/api/query.js` or your query dispatcher
2. **Add parallel ML calls after getting AI responses:**

```javascript
// In query endpoint, after getting AI responses
const synthesizedResponse = aiMessage.responses[0]?.response || '';

// Fetch ML analysis in parallel
const [toxicity, topics, factCheck] = await Promise.allSettled([
  fetch('http://localhost:3001/api/ml/toxicity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: synthesizedResponse })
  }).then(r => r.json()),
  
  fetch('http://localhost:3001/api/ml/topics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text: synthesizedResponse,
      method: 'both'  // Get both BERTopic and Gensim
    })
  }).then(r => r.json()),
  
  fetch('http://localhost:3001/api/fact-check/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      claim: question,
      context: synthesizedResponse 
    })
  }).then(r => r.json()),
]);

// Add to response
return {
  ...existingResponse,
  toxicity: toxicity.status === 'fulfilled' ? toxicity.value : null,
  topics: topics.status === 'fulfilled' ? topics.value : null,
  factCheck: factCheck.status === 'fulfilled' ? factCheck.value : null,
};
```

3. **Frontend automatically displays the data** once it's in the response

---

## 🎨 Visual Indicators

Each panel has:
- **Emoji icon** identifying the panel type
- **Title and description** explaining the analysis
- **Placeholder text** when data is not available (shows TODO messages)
- **Real data visualization** when backend data is integrated

---

## 📍 Summary

**To see the panels NOW:**
1. Go to `/chat-v2`
2. Submit any query
3. Look in the **Översikt tab** (selected by default)
4. Scroll down below AI responses
5. You'll see 5 panels with placeholder text

**To see REAL data in the panels:**
- Either test endpoints manually with curl
- Or integrate ML endpoint calls into the `/api/query` backend flow

All backend endpoints are fully implemented and working! They just need to be integrated into the main query flow or called from the frontend.
