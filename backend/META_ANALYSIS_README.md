# Meta-Analysis System Documentation

## Overview
The OneSeek.AI meta-analysis system provides advanced NLP and sentiment analysis for AI responses using three key technologies:

1. **spaCy-like NLP** (via Compromise.js)
2. **TextBlob-like Sentiment Analysis** (via Sentiment.js)  
3. **GPT-3.5 Meta-Reviewer**

## Technologies Used

### 1. Compromise.js (spaCy-like NLP)
**Purpose**: Natural Language Processing for Swedish text

**Features**:
- Entity extraction (people, places, organizations, dates)
- Part-of-speech tagging (verbs, nouns, adjectives)
- Topic extraction
- Sentence and word counting
- Question detection
- Negation and comparison detection

**Example Output**:
```javascript
{
  sentences: 5,
  words: 142,
  entities: {
    people: ["Stefan Löfven", "Anna Kinberg Batra"],
    places: ["Stockholm", "Sverige"],
    organizations: ["Riksdagen"],
    dates: ["2023"]
  },
  topics: ["demokrati", "politik", "samhälle"],
  verbs: ["säger", "tror", "menar", ...],
  nouns: ["beslut", "regering", "fråga", ...],
  questions: 2,
  hasNegation: true
}
```

### 2. Sentiment.js (TextBlob-like)
**Purpose**: Sentiment analysis with polarity and subjectivity scoring

**Features**:
- Polarity score (-1 to 1)
- Comparative score
- Subjectivity calculation (0 to 1)
- Positive/negative word identification
- Sentiment classification (positive/neutral/negative)

**Example Output**:
```javascript
{
  polarity: 0.45,  // Positive sentiment
  score: 8,
  comparative: 0.056,
  subjectivity: 0.65,  // Somewhat subjective
  positiveWords: ["bra", "bättre", "viktig"],
  negativeWords: [],
  sentiment: "positive"
}
```

### 3. GPT-3.5 Meta-Reviewer
**Purpose**: High-level analysis comparing all AI responses

**Features**:
- Consistency scoring (0-10)
- Overall quality assessment (0-10)
- Bias pattern identification
- Recommended response selection
- Warnings and improvement suggestions
- Comprehensive meta-summary

**Example Output**:
```javascript
{
  available: true,
  reviewer: "GPT-3.5",
  consistency: 8,
  overallQuality: 9,
  biasPatterns: ["Vänsterbenägenhet i alla svar", "Teknisk bias"],
  recommendedAgent: "gemini",
  recommendationReason: "Mest balanserat och välgrundat svar",
  warnings: ["Saknar källor i några påståenden"],
  improvements: ["Lägg till fler konkreta exempel"],
  metaSummary: "Alla svar visar god kvalitet...",
  timestamp: "2025-11-13T13:30:00.000Z"
}
```

## Integration

### Backend (query_dispatcher.js)
The meta-analysis is performed for each AI response:

```javascript
import { 
  performCompleteMetaAnalysis, 
  performGPTMetaReview 
} from '../services/metaAnalysis.js';

// For each response
const metaAnalysis = performCompleteMetaAnalysis(responseText, question);

// After all responses
const gptMetaReview = await performGPTMetaReview(responses, question);
```

### Frontend (AnalysisComparison.jsx)
The meta-analysis data is displayed in the UI:

1. **GPT-3.5 Meta-Review Panel**: Shows overall analysis at the top
2. **Individual Response Cards**: Show NLP and sentiment data for each AI service

## API Response Format

### Enhanced Response Structure
```javascript
{
  question: "Hur fungerar demokrati?",
  responses: [
    {
      agent: "gpt-3.5",
      response: "...",
      analysis: {
        tone: {...},
        bias: {...},
        factCheck: {...}
      },
      metaAnalysis: {
        nlp: {...},  // Compromise NLP data
        sentiment: {...},  // Sentiment analysis
        timestamp: "..."
      },
      metaSummary: "5 meningar, 142 ord • Sentiment: positiv (0.45)"
    },
    ...
  ],
  metaReview: {
    available: true,
    reviewer: "GPT-3.5",
    consistency: 8,
    overallQuality: 9,
    ...
  },
  synthesizedSummary: {...},
  timestamp: "..."
}
```

## Dependencies

### Backend (package.json)
```json
{
  "compromise": "^14.11.0",   // spaCy-like NLP
  "natural": "^6.12.0",        // Additional NLP utilities
  "sentiment": "^5.0.2",       // TextBlob-like sentiment
  "openai": "^4.20.1"          // GPT-3.5 meta-reviewer
}
```

## Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure OpenAI API key in `.env`:
```
OPENAI_API_KEY=your_key_here
```

3. Restart the backend server

## Features

### ✅ Implemented
- [x] spaCy-like NLP analysis (Compromise.js)
- [x] TextBlob-like sentiment analysis (Sentiment.js)
- [x] GPT-3.5 meta-reviewer
- [x] Integration in query dispatcher
- [x] UI display in AnalysisComparison component
- [x] API response format updated
- [x] Error handling for missing API keys

### 🎯 Benefits
1. **Deeper Insights**: NLP analysis reveals entities, topics, and linguistic patterns
2. **Sentiment Understanding**: Polarity and subjectivity scores provide emotional context
3. **Quality Assurance**: GPT-3.5 meta-review ensures response quality and consistency
4. **Transparency**: All analysis visible to users in timeline view
5. **Scalability**: Works seamlessly with 10+ AI services

## Performance

- **NLP Analysis**: ~50-100ms per response
- **Sentiment Analysis**: ~10-30ms per response
- **GPT-3.5 Meta-Review**: ~1-3 seconds for all responses
- **Total Overhead**: ~1-3 seconds per query (mostly GPT-3.5 call)

## Error Handling

- If OpenAI API key is missing, meta-review shows as unavailable
- NLP and sentiment analysis always run (no API dependencies)
- Graceful degradation if any analysis fails
- Error messages displayed in UI

## Future Enhancements

- [ ] Cache GPT-3.5 meta-reviews for identical questions
- [ ] Add more NLP features (dependency parsing, coreference resolution)
- [ ] Support for more languages beyond Swedish/English
- [ ] Real-time sentiment tracking across conversation
- [ ] Machine learning-based bias detection
