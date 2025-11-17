# Pipeline UI Mockups

This directory contains UI mockups and design specifications for the explainability and fairness components of the CivicAI NLP pipeline.

## Contents

1. **explainability-mockup.md** - Design specifications for SHAP and LIME integration
2. **fairness-mockup.md** - Design specifications for Fairlearn fairness analysis

## Overview

These mockups demonstrate how transparency, explainability, and fairness features are integrated into the CivicAI platform, completing the visibility chain:

```
Data → Model → Explanations → Fairness → UI
```

## Components

### Explainability (SHAP & LIME)
- **SHAP Feature Importance Panel**: Global model insights showing which features contribute most to each classification
- **LIME Local Explanation Cards**: Individual prediction explanations with word-level contributions

### Fairness (Fairlearn)
- **Fairness Metrics Panel**: Demographic parity and equal opportunity metrics across groups
- **Bias Warning Panel**: Alerts when fairness thresholds are exceeded with recommended actions
- **Data Quality Reports**: Sweetviz-generated HTML reports for dataset analysis

### EDA (Lux & Sweetviz)
- **Lux Interactive Visualizations**: Automatically recommended charts for Pandas DataFrames
- **Sweetviz Reports**: Comprehensive HTML reports for training and test datasets

## Integration Points

### Backend (Python)
- `/explain-shap` - Generate SHAP feature importance
- `/explain-lime` - Generate LIME local explanations
- `/fairness-metrics` - Compute fairness metrics
- `/generate-eda-report` - Create Sweetviz reports
- `/lux-recommendations` - Get Lux visualization recommendations

### Frontend (React)
- `PipelineAnalysisPanel.jsx` - Main analysis panel with new tabs
- `FeaturesPage.jsx` - Feature descriptions and documentation
- New components:
  - `ExplainabilityPanel.jsx` - SHAP and LIME visualizations
  - `FairnessMetricsPanel.jsx` - Fairness indicators and metrics
  - `DataQualityPanel.jsx` - EDA reports and visualizations

## Design Principles

1. **Transparency**: All metrics include provenance (model, version, method, timestamp)
2. **Accessibility**: Color is not the only indicator; includes text alternatives
3. **Interactivity**: Expandable sections, tooltips, and detailed views
4. **Performance**: Lazy loading, caching, and progressive enhancement
5. **Consistency**: Follows existing CivicAI design patterns and color scheme

## Color Scheme

Consistent with CivicAI's dark theme:
- Background: `#0a0a0a`, `#151515`
- Borders: `#2a2a2a`, `#1a1a1a`
- Text: `#e7e7e7`, `#888`, `#666`
- Accents: Civic gray palette

## Status Indicators

- ✓ Green: Positive/Fair/Pass
- ⚠️ Yellow: Warning/Borderline
- ⚠️ Red: Critical/Biased/Fail
- ℹ️ Blue: Information/Note

## Export Options

All panels support multiple export formats:
- JSON: Raw data for programmatic access
- CSV: Tabular data for spreadsheets
- PDF: Formatted reports for sharing
- HTML: Interactive reports (Sweetviz)

## Next Steps

1. Implement React components based on these mockups
2. Connect to Python backend endpoints
3. Add unit tests for new components
4. Update documentation with screenshots
5. Conduct user testing and iterate
