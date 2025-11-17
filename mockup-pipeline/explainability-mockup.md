# Explainability Components UI Mockup

## Overview
This document describes the UI components for model explainability using SHAP and LIME.

## SHAP Feature Importance Panel

### Location
Displayed in PipelineAnalysisPanel.jsx after model predictions, in a new "Explainability" tab.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Model Explainability - SHAP Feature Importance           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Global Feature Importance (KB/bert-base-swedish-cased)      │
│                                                              │
│ ┌─── Left Classification ────────────────────────────────┐  │
│ │ Feature                        Impact                   │  │
│ │ ─────────────────────────────────────────────────────  │  │
│ │ "välfärd"              ████████████████░░░  +0.45      │  │
│ │ "jämlikhet"            ████████████░░░░░░░  +0.32      │  │
│ │ "kollektiv"            ██████████░░░░░░░░░  +0.28      │  │
│ │ "solidaritet"          ████████░░░░░░░░░░░  +0.21      │  │
│ │ "arbetarrörelsen"      ██████░░░░░░░░░░░░░  +0.16      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Center Classification ──────────────────────────────┐  │
│ │ Feature                        Impact                   │  │
│ │ ─────────────────────────────────────────────────────  │  │
│ │ "balans"               ████████████████░░░  +0.38      │  │
│ │ "kompromiss"           ████████████░░░░░░░  +0.31      │  │
│ │ "pragmatisk"           ██████████░░░░░░░░░  +0.26      │  │
│ │ "reformer"             ████████░░░░░░░░░░░  +0.19      │  │
│ │ "samarbete"            ██████░░░░░░░░░░░░░  +0.15      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Right Classification ───────────────────────────────┐  │
│ │ Feature                        Impact                   │  │
│ │ ─────────────────────────────────────────────────────  │  │
│ │ "marknad"              ████████████████░░░  +0.42      │  │
│ │ "företagande"          ████████████░░░░░░░  +0.34      │  │
│ │ "frihet"               ██████████░░░░░░░░░  +0.29      │  │
│ │ "lägre skatter"        ████████░░░░░░░░░░░  +0.22      │  │
│ │ "tradition"            ██████░░░░░░░░░░░░░  +0.17      │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 📊 Provenance: SHAP v0.44.0 | KB/bert-base-swedish-cased   │
│    Method: Model-agnostic feature importance analysis       │
│    Timestamp: 2025-11-17 23:05:00 UTC                       │
└─────────────────────────────────────────────────────────────┘
```

## LIME Local Explanation Card

### Location
Displayed as clickable insight cards in the analysis panel, one card per prediction.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 💡 Local Explanation - LIME                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Predicted Class: Center (Confidence: 67%)                   │
│                                                              │
│ ┌─── Word-level Contributions ────────────────────────────┐ │
│ │                                                          │ │
│ │ Denna  politik  måste  balansera  olika  intressen      │ │
│ │  ░░░    ░░░     ░░░     ████      ░░░    ░░░           │ │
│ │ +0.02  -0.01   +0.01    +0.35    -0.02   +0.03          │ │
│ │                                                          │ │
│ │ genom  kompromiss  och  reformer  för  samhället        │ │
│ │  ░░░     ████      ░░░    ████     ░░░    ░░░          │ │
│ │ +0.01   +0.28    +0.02   +0.24   +0.01   +0.02          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Top Contributing Features:                                  │
│ • "balansera"       +0.35  (strongly supports Center)       │
│ • "kompromiss"      +0.28  (supports Center)                │
│ • "reformer"        +0.24  (supports Center)                │
│ • "samhället"       +0.02  (weakly supports Center)         │
│                                                              │
│ Alternative Predictions:                                    │
│ • Left:   21% (would need more "välfärd", "jämlikhet")     │
│ • Right:  12% (would need more "marknad", "frihet")        │
│                                                              │
│ [Show Full Analysis] [Export Explanation]                   │
│                                                              │
│ 📊 Provenance: LIME v0.2.0.1 | Swedish BERT                 │
│    Method: Local interpretable model-agnostic explanations  │
│    Samples: 100 | Features: 10                              │
│    Timestamp: 2025-11-17 23:05:01 UTC                       │
└─────────────────────────────────────────────────────────────┘
```

## Interactive Features

### SHAP Panel
1. **Expandable Classes**: Click on each class section to expand/collapse
2. **Feature Details**: Hover over features to see full context and sentence
3. **Color Coding**: 
   - Positive impact (green bars)
   - Negative impact (red bars)
4. **Export**: Button to export SHAP values as JSON/CSV

### LIME Cards
1. **Word Highlighting**: Hover over words to see exact contribution values
2. **Expandable Text**: Click to show full text with annotations
3. **Alternative Scenarios**: Show what would change prediction
4. **Export**: Export local explanation as JSON

## Integration Points

### PipelineAnalysisPanel.jsx
- Add new tab: "Explainability" (🔍)
- Display SHAP panel when global explanations available
- Display LIME cards in scrollable container

### Tab Structure
```javascript
const tabs = [
  { id: 'overview', label: 'Översikt', icon: '📊' },
  { id: 'processing', label: 'Processering', icon: '⚙️' },
  { id: 'sentiment', label: 'Sentiment', icon: '💭' },
  { id: 'ideology', label: 'Ideologi', icon: '🏛️' },
  { id: 'explainability', label: 'Förklarbarhet', icon: '🔍' },  // NEW
  { id: 'fairness', label: 'Rättvisa', icon: '⚖️' },  // NEW
  { id: 'timeline', label: 'Timeline', icon: '⏱️' },
  { id: 'details', label: 'Detaljer', icon: '🔍' },
];
```

## Data Structure

### SHAP Response
```json
{
  "feature_importance": [
    {
      "class": "left",
      "features": [
        ["välfärd", 0.45],
        ["jämlikhet", 0.32]
      ]
    }
  ],
  "explanation_type": "global",
  "model": "KB/bert-base-swedish-cased",
  "provenance": {
    "model": "SHAP",
    "version": "0.44.0",
    "method": "Model-agnostic feature importance analysis",
    "timestamp": "2025-11-17T23:05:00Z"
  }
}
```

### LIME Response
```json
{
  "explanation": [
    ["balansera", 0.35],
    ["kompromiss", 0.28]
  ],
  "prediction": {
    "left": 0.21,
    "center": 0.67,
    "right": 0.12
  },
  "predicted_class": "center",
  "explanation_type": "local",
  "text": "Original text...",
  "provenance": {
    "model": "LIME",
    "version": "0.2.0.1",
    "method": "Local interpretable model-agnostic explanations",
    "timestamp": "2025-11-17T23:05:01Z"
  }
}
```

## Accessibility
- All visualizations include text alternatives
- Color is not the only indicator (also uses symbols and patterns)
- Keyboard navigation for all interactive elements
- Screen reader friendly labels

## Performance Considerations
- SHAP computations cached for identical texts
- LIME explanations computed on-demand
- Lazy loading for detailed views
- Progressive enhancement for visual elements
