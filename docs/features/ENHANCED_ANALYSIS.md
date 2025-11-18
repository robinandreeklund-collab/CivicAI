# Chat Timeline and Summary System - Enhanced Analysis

This document describes the enhanced chat timeline and summary system implemented in OneSeek.AI, providing data-rich, transparent reporting leveraging multiple NLP models and AI systems.

## Overview

The enhanced system provides advanced analysis of AI responses with full transparency and traceability. Every datapoint includes provenance information showing which model, version, and method was used to calculate it.

## Architecture

### Backend Components

#### 1. NLP Processors (`backend/utils/nlpProcessors.js`)

A comprehensive suite of processors for advanced text analysis:

##### Emotion/Affect Analysis
- **Purpose**: Detects emotions like joy, anger, sadness, fear, surprise, disgust
- **Method**: Keyword-based semantic analysis with emotional lexicons
- **Model**: Custom Emotion Lexicon v1.0.0
- **Output**: Primary emotion, intensity scores, confidence level
- **Provenance**: Full tracking of model, version, method, timestamp

##### Topic Detection & Clustering
- **Purpose**: Identifies main topics and themes in text
- **Method**: NLP-based topic extraction with frequency clustering
- **Model**: compromise.js v14.11.0
- **Output**: Main topics, topic clusters, keyphrases
- **Provenance**: compromise.js metadata

##### Intent Classification
- **Purpose**: Classifies text intent as Task, Opinion, Question, or Statement
- **Method**: Pattern matching + structural analysis
- **Model**: Custom Intent Classifier v1.0.0
- **Output**: Primary intent, confidence, scores per category
- **Provenance**: Full tracking

##### Fact vs Opinion Tagging
- **Purpose**: Tags statements as facts, opinions, or mixed
- **Method**: Linguistic pattern analysis + objectivity scoring
- **Model**: Custom Fact/Opinion Classifier v1.0.0
- **Output**: Sentence-level tags, percentage breakdown
- **Provenance**: Full tracking

##### Named Entity Recognition with Role Mapping
- **Purpose**: Extracts entities and assigns roles/relationships
- **Method**: compromise NLP + context-based role classification
- **Model**: compromise.js + Custom Role Mapper v1.0.0
- **Output**: Entities with types (person, place, org) and roles (speaker, researcher, etc.)
- **Provenance**: Combined model tracking

##### Argumentation/Main Points Extraction
- **Purpose**: Extracts main points ("Huvudpunkter") and supporting arguments
- **Method**: Sentence importance scoring + structural analysis
- **Model**: Custom Argument Extractor v1.0.0
- **Output**: Top 3 main points, supporting arguments
- **Provenance**: Full tracking

##### Counterpoints Detection
- **Purpose**: Identifies contrasting or opposing viewpoints
- **Method**: Contrast marker detection + negation analysis
- **Model**: Custom Counterpoint Detector v1.0.0
- **Output**: Counterpoints with markers ("men", "dock", etc.)
- **Provenance**: Full tracking

##### Response Time Calculation
- **Purpose**: Calculates processing time
- **Method**: Timestamp difference calculation
- **Model**: System Timer v1.0.0
- **Output**: Time in milliseconds and seconds
- **Provenance**: Full tracking

#### 2. Multi-Model Synthesis Service (`backend/services/modelSynthesis.js`)

Synthesizes and compares results from multiple AI models:

##### Model Perspective Cards
- **Purpose**: Creates perspective cards for each AI model
- **Components**:
  - Summary metrics (emotion, tone, intent, factuality)
  - Ratings (confidence, bias, emotion intensity)
  - Highlights (topics, huvudpunkter, entities)
- **Output**: Structured card per model with full metadata

##### Divergence Detection
- **Purpose**: Identifies differences between model responses
- **Types Detected**:
  - Emotion divergence (different emotional tones)
  - Tone divergence (different styles)
  - Bias divergence (significant bias score differences)
  - Factuality divergence (fact percentage differences)
- **Severity Levels**: Low, Medium, High
- **Output**: Divergence list with severity, description, model values

##### Contradiction Detection
- **Purpose**: Finds opposing statements on same topics
- **Method**: Topic overlap analysis + sentiment comparison
- **Output**: Contradictions with topic, type, and model perspectives

##### Consensus Metrics
- **Purpose**: Calculates agreement level across models
- **Metrics**:
  - Overall consensus percentage
  - Per-area consensus (emotion, tone, intent)
  - Dominant value per area
- **Output**: Consensus scores and dominant values

##### Combined Insights
- **Purpose**: Extracts shared insights across models
- **Components**:
  - Consensus topics (topics mentioned by multiple models)
  - Combined huvudpunkter
  - Model coverage metrics
- **Output**: Aggregated insights structure

### Frontend Components

#### 1. EnhancedAnalysisPanel (`frontend/src/components/EnhancedAnalysisPanel.jsx`)

Displays comprehensive enhanced analysis data:

**Features**:
- Collapsible sections for each analysis type
- Color-coded emotion indicators
- Topic tags with frequency counts
- Fact/opinion percentage breakdown
- Entity displays with roles
- Huvudpunkter (main points) list
- Counterpoints with markers
- Provenance tags for transparency

**UI Elements**:
- Emotion badges (color-coded by emotion type)
- Topic tags with frequency indicators
- Intent icons and labels
- Fact/opinion grid with percentages
- Entity chips with type/role info
- Numbered huvudpunkter list
- Counterpoint cards with markers
- Expandable provenance information

#### 2. ProvenanceTag (`frontend/src/components/ProvenanceTag.jsx`)

Shows datapoint source information:

**Displays**:
- Model name
- Version number
- Method description
- Timestamp
- Error information (if applicable)

**Behavior**:
- Collapsible to reduce visual clutter
- Consistent styling across all analysis types
- Always available for transparency

#### 3. ModelDivergencePanel (`frontend/src/components/ModelDivergencePanel.jsx`)

Visualizes differences between AI models:

**Sections**:
- Consensus score display
- Divergence list with severity indicators
- Contradiction alerts
- Combined insights (consensus topics, shared huvudpunkter)

**Visual Elements**:
- Color-coded severity badges (🔴 High, 🟠 Medium, 🟡 Low)
- Consensus percentage display
- Model comparison grids
- Topic frequency visualization

#### 4. ModelPerspectiveCard (`frontend/src/components/ModelPerspectiveCard.jsx`)

Shows individual model perspective:

**Components**:
- Model icon and name
- Summary stats grid (emotion, tone, intent, factuality)
- Rating bars (bias score, confidence)
- Highlights (topics, huvudpunkter, entities)
- Timestamp

**Design**:
- Compact card layout
- Visual progress bars
- Tag-based information display
- Consistent with existing design system

#### 5. Updated AgentBubble

Integrated enhanced analysis:

**New Features**:
- "Visa utökad analys" toggle button
- Collapsible enhanced analysis panel
- Maintains existing analysis features
- Smooth animations

### API Integration

#### Query Dispatcher Updates

Enhanced `/api/query` endpoint response now includes:

```javascript
{
  question: "...",
  responses: [
    {
      agent: "gpt-3.5",
      response: "...",
      analysis: { /* existing */ },
      enhancedAnalysis: {
        emotion: { /* emotion analysis */ },
        topics: { /* topic detection */ },
        intent: { /* intent classification */ },
        factOpinion: { /* fact/opinion tagging */ },
        entities: { /* NER with roles */ },
        argumentation: { /* huvudpunkter */ },
        counterpoints: { /* counterpoint detection */ },
        responseTime: { /* timing */ },
        metadata: { /* processing metadata */ }
      }
    },
    // ... more responses
  ],
  modelSynthesis: {
    modelCards: [ /* perspective cards */ ],
    divergences: { /* divergence analysis */ },
    contradictions: { /* contradiction detection */ },
    consensus: { /* consensus metrics */ },
    insights: { /* combined insights */ },
    metadata: { /* synthesis metadata */ }
  },
  // ... existing fields
}
```

## Data Flow

1. **User submits question** → Frontend sends to `/api/query`
2. **Backend dispatches** → Queries all enabled AI services in parallel
3. **Response processing** → For each AI response:
   - Run existing analyzers (tone, bias, fact check)
   - Run enhanced NLP processors
   - Attach provenance to all datapoints
4. **Model synthesis** → Compare all responses:
   - Create perspective cards
   - Detect divergences
   - Find contradictions
   - Calculate consensus
5. **Return to frontend** → Complete analysis package
6. **Frontend display** → Rich, interactive visualization:
   - Timeline navigator
   - Enhanced analysis panels
   - Model comparison views
   - Provenance transparency

## Transparency & Traceability

### Provenance Tracking

Every datapoint includes:
- **Model**: Name of the model/processor used
- **Version**: Version number for reproducibility
- **Method**: Description of calculation method
- **Timestamp**: When the calculation was performed
- **Error** (optional): Error information if calculation failed

### User-Facing Source Trace

Users can expand provenance information for any datapoint to see:
- Which model produced the data
- What version was used
- How it was calculated
- When it was calculated

This enables:
- Verification of data sources
- Understanding of calculation methods
- Debugging of unexpected results
- Trust through transparency

## Extensibility

### Adding New Processors

To add a new processor to `nlpProcessors.js`:

1. Create processor function following the pattern:
```javascript
export function myNewProcessor(text) {
  // Process text
  const result = /* calculation */;
  
  return {
    // Your data
    result: result,
    provenance: {
      model: 'My Processor',
      version: '1.0.0',
      method: 'Description of method',
      timestamp: new Date().toISOString(),
    },
  };
}
```

2. Add to `performCompleteEnhancedAnalysis`:
```javascript
export function performCompleteEnhancedAnalysis(text, question, startTime) {
  return {
    // ... existing processors
    myNewData: myNewProcessor(text),
    // ...
  };
}
```

3. Update frontend `EnhancedAnalysisPanel` to display the new data.

### Adding to Model Synthesis

To add new comparison metrics to `modelSynthesis.js`:

1. Update `createModelPerspectiveCard` to extract new metrics
2. Add comparison logic to `detectDivergences` or `detectContradictions`
3. Update consensus calculation if needed
4. Update frontend `ModelDivergencePanel` to display new comparisons

## Testing

Tests are provided in `backend/test-nlp-processors.js`:

```bash
cd backend
node test-nlp-processors.js
```

**Test Coverage**:
- ✅ Emotion analysis (joy, anger, etc.)
- ✅ Topic detection and clustering
- ✅ Intent classification (task, opinion, question, statement)
- ✅ Fact vs opinion tagging
- ✅ Entity extraction with role mapping
- ✅ Argumentation extraction (huvudpunkter)
- ✅ Counterpoint detection
- ✅ Response time calculation
- ✅ Complete enhanced analysis
- ✅ Provenance validation

## Performance Considerations

- **Parallel Processing**: All AI services queried in parallel
- **Lightweight NLP**: compromise.js is fast and doesn't require large models
- **Incremental Display**: Frontend shows results as they become available
- **Lazy Loading**: Enhanced analysis panels load on demand

## Future Enhancements

Potential additions to the system:

1. **Timeline Filtering**: Filter events by type, intent, sentiment, topic
2. **Flow Visualizations**: Argument branches, time curves
3. **Challenge Buttons**: Allow users to dispute or debate datapoints
4. **Custom Processors**: User-defined analysis processors
5. **Export with Provenance**: Export includes full source tracing
6. **Historical Comparison**: Compare how analysis changes over time
7. **Multi-Language Support**: Extend processors for other languages
8. **Advanced Synthesis**: ML-based model comparison and consensus

## Conclusion

The enhanced chat timeline and summary system provides unprecedented transparency and depth of analysis for AI responses. Every datapoint is traceable to its source, enabling users to understand, verify, and trust the analysis provided by the platform.
