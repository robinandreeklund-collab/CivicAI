# Fairness & Bias Analysis UI Mockup

## Overview
This document describes the UI components for fairness analysis using Fairlearn.

## Fairness Metrics Panel

### Location
Displayed in PipelineAnalysisPanel.jsx in a new "Fairness" tab, parallel to SHAP/LIME at aggregate level.

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ ⚖️ Fairness Analysis - Demographic Parity                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Overall Fairness Score: 0.08 ✓ FAIR                        │
│ (Lower is better - threshold: 0.10)                         │
│                                                              │
│ ┌─── Selection Rates by Group ──────────────────────────┐  │
│ │                                                         │  │
│ │ Group A (n=45)                                          │  │
│ │ ├─ Left:   22% ██████████████░░░░░░░░░░░░░░░░         │  │
│ │ ├─ Center: 51% ███████████████████████████████░░░░░░   │  │
│ │ └─ Right:  27% ████████████████░░░░░░░░░░░░░░░░░░     │  │
│ │                                                         │  │
│ │ Group B (n=38)                                          │  │
│ │ ├─ Left:   18% ███████████░░░░░░░░░░░░░░░░░░░░░       │  │
│ │ ├─ Center: 56% ████████████████████████████████░░░░░   │  │
│ │ └─ Right:  26% ███████████████░░░░░░░░░░░░░░░░░░░     │  │
│ │                                                         │  │
│ │ Group C (n=52)                                          │  │
│ │ ├─ Left:   24% ██████████████░░░░░░░░░░░░░░░░░░       │  │
│ │ ├─ Center: 48% ██████████████████████████░░░░░░░░░░░   │  │
│ │ └─ Right:  28% ████████████████░░░░░░░░░░░░░░░░░░░    │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Demographic Parity Differences ────────────────────┐   │
│ │                                                         │  │
│ │ Left Classification:   0.06 ✓                          │  │
│ │ (Max difference: 24% - 18% = 6%)                       │  │
│ │                                                         │  │
│ │ Center Classification: 0.08 ✓                          │  │
│ │ (Max difference: 56% - 48% = 8%)                       │  │
│ │                                                         │  │
│ │ Right Classification:  0.02 ✓                          │  │
│ │ (Max difference: 28% - 26% = 2%)                       │  │
│ │                                                         │  │
│ │ ✓ All differences below fairness threshold (0.10)      │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Fairness Indicators ────────────────────────────────┐  │
│ │                                                         │  │
│ │ ✓ Demographic Parity: PASS (0.08 < 0.10)              │  │
│ │ ✓ Equal Opportunity: PASS (calculated on test set)     │  │
│ │ ℹ️ Statistical Parity: 94% (high)                      │  │
│ │ ℹ️ Balanced Accuracy: 87%                              │  │
│ │                                                         │  │
│ │ Recommendation:                                         │  │
│ │ The model shows fair predictions across demographic    │  │
│ │ groups. Continue monitoring with diverse datasets.      │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ [View Detailed Report] [Export Metrics] [Generate PDF]      │
│                                                              │
│ 📊 Provenance: Fairlearn v0.10.0 | Swedish BERT             │
│    Method: Demographic parity and fairness metrics          │
│    Groups: 3 | Total Predictions: 135                       │
│    Timestamp: 2025-11-17 23:05:02 UTC                       │
└─────────────────────────────────────────────────────────────┘
```

## Bias Warning Panel (if unfair)

### Layout when fairness issues detected
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ FAIRNESS ALERT - Bias Detected                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Overall Fairness Score: 0.23 ⚠️ BIASED                     │
│ (Exceeds fairness threshold: 0.10)                          │
│                                                              │
│ ┌─── Issues Detected ────────────────────────────────────┐  │
│ │                                                         │  │
│ │ ⚠️ High disparity in Left classification (0.19)        │  │
│ │    Group A: 35% vs Group C: 16% (19% difference)       │  │
│ │                                                         │  │
│ │ ⚠️ Moderate disparity in Center classification (0.12)  │  │
│ │    Group B: 62% vs Group A: 50% (12% difference)       │  │
│ │                                                         │  │
│ │ ✓ Right classification is fair (0.04)                  │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Recommended Actions ────────────────────────────────┐  │
│ │                                                         │  │
│ │ 1. Review training data for representation balance     │  │
│ │ 2. Consider collecting more diverse examples           │  │
│ │ 3. Apply fairness constraints during model training    │  │
│ │ 4. Use techniques like reweighting or threshold        │  │
│ │    optimization                                         │  │
│ │ 5. Consult fairness documentation for mitigation       │  │
│ │    strategies                                           │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Learn More About Fairness] [View Mitigation Strategies]    │
└─────────────────────────────────────────────────────────────┘
```

## Data Quality Report Integration

### Location
New section in the dashboard, linked as "Data Quality Reports"

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Data Quality Reports - Sweetviz                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── Available Reports ──────────────────────────────────┐  │
│ │                                                         │  │
│ │ 📄 Training Dataset Analysis                           │  │
│ │    Generated: 2025-11-17 22:30:00                      │  │
│ │    Rows: 1,234 | Columns: 15                           │  │
│ │    [View Report] [Download HTML]                       │  │
│ │                                                         │  │
│ │ 📄 Test Dataset Analysis                               │  │
│ │    Generated: 2025-11-17 22:30:15                      │  │
│ │    Rows: 412 | Columns: 15                             │  │
│ │    [View Report] [Download HTML]                       │  │
│ │                                                         │  │
│ │ 📄 Train vs Test Comparison                            │  │
│ │    Generated: 2025-11-17 22:30:30                      │  │
│ │    [View Report] [Download HTML]                       │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌─── Quick Insights ─────────────────────────────────────┐  │
│ │                                                         │  │
│ │ ✓ No missing values detected                           │  │
│ │ ✓ Balanced class distribution                          │  │
│ │ ℹ️ 3 highly correlated features detected               │  │
│ │ ℹ️ 2 features with high cardinality                    │  │
│ │                                                         │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ [Generate New Report] [Configure EDA Settings]              │
└─────────────────────────────────────────────────────────────┘
```

## Lux Interactive Visualizations

### Integration in Analysis Panel
```
┌─────────────────────────────────────────────────────────────┐
│ 📈 Interactive Data Visualizations - Lux                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─── Recommended Visualizations ─────────────────────────┐  │
│ │                                                         │  │
│ │ [Bar Chart] Predictions by Class                       │  │
│ │ [Scatter Plot] Confidence vs Subjectivity              │  │
│ │ [Histogram] Feature Distribution                       │  │
│ │ [Correlation Heatmap] Feature Correlations             │  │
│ │                                                         │  │
│ │ ℹ️ Lux automatically generated 4 visualizations        │  │
│ │    Click any chart to view in full screen              │  │
│ └─────────────────────────────────────────────────────────┘  │
│                                                              │
│ Dataset Summary:                                            │
│ • 135 predictions analyzed                                  │
│ • 12 features tracked                                       │
│ • 3 demographic groups                                      │
│                                                              │
│ [Refresh Visualizations] [Export Charts]                    │
└─────────────────────────────────────────────────────────────┘
```

## Interactive Features

### Fairness Panel
1. **Expandable Groups**: Click to see detailed statistics per group
2. **Metric Tooltips**: Hover to see metric definitions and calculations
3. **Threshold Adjustment**: Slide to adjust fairness threshold
4. **Historical Tracking**: View fairness metrics over time
5. **Export Options**: JSON, CSV, PDF reports

### Data Quality
1. **Interactive Reports**: Click to open Sweetviz HTML reports in new tab
2. **Quick Preview**: Hover over report cards to see summary
3. **Download Options**: HTML, PDF export
4. **Schedule Reports**: Auto-generate reports on schedule

### Lux Visualizations
1. **Interactive Charts**: Zoom, pan, filter
2. **Recommendation Engine**: Auto-suggests best visualizations
3. **Export**: PNG, SVG, interactive HTML
4. **Integration**: Embedded directly in Pandas workflow

## Integration Points

### PipelineAnalysisPanel.jsx
```javascript
// Add new tabs
{ id: 'explainability', label: 'Förklarbarhet', icon: '🔍' },
{ id: 'fairness', label: 'Rättvisa', icon: '⚖️' },

// Fairness tab content
{activeTab === 'fairness' && (
  <FairnessMetricsPanel fairnessData={pipelineAnalysis.fairnessMetrics} />
)}
```

### FeaturesPage.jsx
```javascript
// Add new feature sections
<div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
  <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">
    Model Explainability (SHAP & LIME)
  </h2>
  <p className="mb-4 text-sm text-[#888]">
    Understand how the AI makes decisions with feature importance 
    and local explanations.
  </p>
  ...
</div>

<div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
  <h2 className="text-2xl font-light text-[#e7e7e7] mb-4">
    Fairness & Bias Analysis (Fairlearn)
  </h2>
  <p className="mb-4 text-sm text-[#888]">
    Ensure ethical AI with demographic parity and equal opportunity 
    metrics across groups.
  </p>
  ...
</div>
```

## Data Structures

### Fairness Metrics Response
```json
{
  "selection_rates": {
    "Group A": {
      "left": 0.22,
      "center": 0.51,
      "right": 0.27,
      "total_predictions": 45
    },
    "Group B": {
      "left": 0.18,
      "center": 0.56,
      "right": 0.26,
      "total_predictions": 38
    }
  },
  "demographic_parity": {
    "left": 0.06,
    "center": 0.08,
    "right": 0.02
  },
  "overall_fairness_score": 0.08,
  "fairness_status": "fair",
  "num_groups": 3,
  "total_predictions": 135,
  "provenance": {
    "model": "Fairlearn",
    "version": "0.10.0",
    "method": "Demographic parity and fairness metrics",
    "timestamp": "2025-11-17T23:05:02Z"
  }
}
```

### EDA Report Response
```json
{
  "report_path": "/tmp/data_quality_report.html",
  "report_html": "<html>...</html>",
  "num_rows": 1234,
  "num_columns": 15,
  "columns": ["text", "label", "confidence", ...],
  "provenance": {
    "model": "Sweetviz",
    "version": "2.3.1",
    "method": "Automated EDA report generation",
    "timestamp": "2025-11-17T22:30:00Z"
  }
}
```

## Color Coding

### Fairness Status
- ✓ Green: Fair (< 0.10 difference)
- ⚠️ Yellow: Borderline (0.10 - 0.15)
- ⚠️ Red: Biased (> 0.15)

### Data Quality
- ✓ Green: No issues
- ℹ️ Blue: Information/recommendations
- ⚠️ Yellow: Warnings
- ⚠️ Red: Critical issues

## Accessibility
- All metrics include text descriptions
- Charts have data tables as alternatives
- Keyboard navigation throughout
- ARIA labels for screen readers
- High contrast mode support

## Performance Considerations
- Fairness metrics computed server-side
- Results cached for identical datasets
- Progressive loading for large reports
- Lazy loading for Sweetviz HTML reports
- Compressed data transfer
