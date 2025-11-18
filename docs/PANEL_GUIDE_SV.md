# Hur man ser de nya panelerna i ChatV2

## Översikt

De 5 nya visualiseringspanelerna finns i ChatV2-sidan och visas i **Översikt-läget** när du har skickat en fråga.

## Steg-för-steg guide

### 1. Navigera till ChatV2
- Öppna frontend: `http://localhost:5173`
- Klicka på länken till `/chat-v2` i menyn

### 2. Skicka en fråga
- Skriv en fråga i inputfältet (t.ex., "Vad är Sveriges klimatmål?")
- Klicka på "Analysera" eller tryck Enter
- Vänta medan systemet hämtar svar från API:et

### 3. Se panelerna
Efter att svaret har laddats, scrolla ner på sidan. Du kommer se panelerna i följande ordning:

## Panelernas placering

### Panel 1: Explainability (SHAP/LIME) 🔍
**Rad:** 541-604 i `ChatV2Page.jsx`  
**Villkor:** Visas när `latestAiMessage.explainability` finns  
**Innehåll:**
- SHAP feature importance med contribution bars
- LIME local explanations med word weights
- Color-coded positive/negative contributions

**Placeholder-text när data saknas:**
> "Explainability data kommer vara tillgänglig när backend är implementerat"  
> "TODO: Implementera /ml/shap och /ml/lime endpoints"

---

### Panel 2: Toxicity Analysis (Detoxify) 🛡️
**Rad:** 605-673 i `ChatV2Page.jsx`  
**Villkor:** Visas när `latestAiMessage.toxicity` finns  
**Innehåll:**
- 6 toxicity dimensions:
  - Toxicity (allmän toxicitet)
  - Threat (hot)
  - Insult (förolämpning)
  - Identity Attack (identitetsbaserad attack)
  - Obscene (obscent innehåll)
  - Severe Toxicity (allvarlig toxicitet)
- Color-coded risk indicators (green/yellow/red)
- Overall toxicity assessment med risk level

**Placeholder-text när data saknas:**
> "Toxicitetsanalys kommer vara tillgänglig när backend är implementerat"  
> "TODO: Implementera /ml/toxicity endpoint"

---

### Panel 3: Topic Modeling (BERTopic) 🧠
**Rad:** 674-725 i `ChatV2Page.jsx`  
**Villkor:** Visas när `latestAiMessage.topics` finns  
**Innehåll:**
- BERTopic topic clusters
- Coherence scores för varje topic
- Key terms (nyckelord) per topic
- Probability percentages

**Placeholder-text när data saknas:**
> "Topic modeling kommer vara tillgänglig när backend är implementerat"  
> "TODO: Implementera /ml/topics endpoint med BERTopic"

---

### Panel 4: Bias & Fairness (Fairlearn) ⚖️
**Rad:** 726-814 i `ChatV2Page.jsx`  
**Villkor:** Visas när `latestAiMessage.fairness` finns  
**Innehåll:**
- Demographic Parity metric
- Equalized Odds metric
- Disparate Impact ratio
- Fairness violation warnings (gula varningar)
- Actionable recommendations

**Placeholder-text när data saknas:**
> "Fairness-analys kommer vara tillgänglig när backend är implementerat"  
> "TODO: Implementera /ml/fairness endpoint med Fairlearn"

---

### Panel 5: Fact Checking (Tavily) ✅
**Rad:** 815-893 i `ChatV2Page.jsx`  
**Villkor:** Visas när `latestAiMessage.factCheck` finns  
**Innehåll:**
- Verification status (true/false/partially_true/unverified)
- Confidence score
- Detailed verdict explanation
- Source citations med credibility ratings
- Supporting/contradicting evidence counts
- Clickable source links

**Placeholder-text när data saknas:**
> "Fact checking kommer vara tillgänglig när backend är implementerat"  
> "TODO: Implementera /fact-check/verify endpoint med Tavily API"

---

## Nuvarande status

### Vad fungerar nu:
- ✅ UI-panelerna är implementerade och renderas korrekt
- ✅ Fallback UI visas när data saknas
- ✅ Design följer OneSeek.AI:s grayscale theme
- ✅ Responsiv layout för mobil och desktop

### Vad behövs från backend:
De nya panelerna väntar på data från backend. Backend-teamet behöver implementera följande endpoints:

1. `POST /ml/shap` - SHAP explainability
2. `POST /ml/lime` - LIME interpretability
3. `POST /ml/toxicity` - Detoxify toxicity detection (NU FIXAT: model loading)
4. `POST /ml/topics` - BERTopic topic modeling
5. `POST /ml/fairness` - Fairlearn fairness metrics
6. `POST /fact-check/verify` - Tavily fact checking

### Hur backend integrerar:
Backend lägger till dessa fält i `/api/query` response:

```json
{
  "queryId": "q_abc123",
  "responses": [...],
  "explainability": {
    "shap": { "shapValues": [...], "tokens": [...], "topFeatures": [...] },
    "lime": { "explanation": "...", "weights": [...] }
  },
  "toxicity": {
    "toxicity": 0.08,
    "threat": 0.01,
    "insult": 0.04,
    "identity_attack": 0.015,
    "obscene": 0.02,
    "severe_toxicity": 0.005,
    "overall_toxic": false,
    "risk_level": "low"
  },
  "topics": {
    "topics": [
      {"id": 0, "label": "climate_change", "probability": 0.68, "terms": [...]}
    ]
  },
  "fairness": {
    "demographicParity": 0.92,
    "equalizedOdds": 0.88,
    "disparateImpact": 0.85
  },
  "factCheck": {
    "verificationStatus": "partially_true",
    "confidence": 0.78,
    "verdict": "...",
    "sources": [...]
  }
}
```

---

## Testa med mock data

För att se hur panelerna ser ut med riktigt data, kan du:

1. Öppna browser console
2. Kör följande efter en query:
```javascript
// Simulera data från backend
const mockResponse = {
  explainability: { /* använd data från fixtures */ },
  toxicity: { /* använd data från fixtures */ },
  // etc...
};
```

3. Se fixture-filer i:
   - `frontend/src/fixtures/api_responses/chatv2/shap_example.json`
   - `frontend/src/fixtures/api_responses/chatv2/detoxify_example.json`
   - etc.

---

## Dokumentation

- **Komplett API-guide:** `docs/CHATV2_API_INTEGRATION.md`
- **JSON Schemas:** `frontend/src/schemas/chatv2/*.json`
- **Example Fixtures:** `frontend/src/fixtures/api_responses/chatv2/*.json`

---

## Support

Om du har frågor:
- Frontend: Se `ChatV2Page.jsx` rad 541-893
- Backend: Se `docs/CHATV2_API_INTEGRATION.md`
- Schemas: Se `frontend/src/schemas/chatv2/`
