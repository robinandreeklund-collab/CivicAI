import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * ApiDocumentationPage Component
 * Complete API reference with endpoint documentation, examples, and status monitoring
 */
export default function ApiDocumentationPage() {
  const [serviceStatus, setServiceStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedEndpoint, setExpandedEndpoint] = useState(null);

  useEffect(() => {
    // Check service health status
    const checkServiceStatus = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setServiceStatus(data.services || {});
      } catch (error) {
        console.error('Failed to fetch service status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkServiceStatus();
    // Refresh every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    if (status === '✅' || status === 'Ready') {
      return <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#888] rounded font-mono">READY</span>;
    } else if (status === '🔶' || status === 'Partial') {
      return <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#666] rounded font-mono">PARTIAL</span>;
    } else if (status === '📋' || status === 'Planned') {
      return <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#555] rounded font-mono">PLANNED</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#555] rounded font-mono">UNKNOWN</span>;
  };

  const getServiceHealth = (serviceName) => {
    if (loading) return <span className="text-[10px] text-[#666] font-mono">—</span>;
    const isUp = serviceStatus[serviceName]?.status === 'up';
    return (
      <span className={`text-[10px] font-mono ${isUp ? 'text-[#888]' : 'text-[#555]'}`}>
        {isUp ? 'UP' : 'DOWN'}
      </span>
    );
  };

  const authEndpoints = [
    { 
      path: '/auth/signup', 
      method: 'POST', 
      status: '🔶', 
      desc: 'User registration',
      details: {
        input: '```json\n{\n  "email": "user@example.com",\n  "password": "securePassword123",\n  "username": "johndoe"\n}\n```',
        process: 'Validates email format and password strength → Hashes password using bcrypt → Stores user in database → Generates JWT token',
        output: '```json\n{\n  "success": true,\n  "user": {\n    "id": "usr_123",\n    "email": "user@example.com",\n    "username": "johndoe"\n  },\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}\n```'
      }
    },
    { 
      path: '/auth/login', 
      method: 'POST', 
      status: '📋', 
      desc: 'User login',
      details: {
        input: '```json\n{\n  "email": "user@example.com",\n  "password": "securePassword123"\n}\n```',
        process: 'Validates credentials → Compares hashed password → Generates new JWT token → Updates last login timestamp',
        output: '```json\n{\n  "success": true,\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "user": { "id": "usr_123", "email": "user@example.com" }\n}\n```'
      }
    },
    { 
      path: '/auth/logout', 
      method: 'POST', 
      status: '📋', 
      desc: 'User logout',
      details: {
        input: '```json\n{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}\n```',
        process: 'Invalidates JWT token → Adds to blacklist → Clears user session',
        output: '```json\n{\n  "success": true,\n  "message": "Logged out successfully"\n}\n```'
      }
    },
    { 
      path: '/auth/verify', 
      method: 'POST', 
      status: '📋', 
      desc: 'Verify token',
      details: {
        input: '```json\n{\n  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}\n```',
        process: 'Validates JWT signature → Checks expiration → Verifies against blacklist → Returns user data',
        output: '```json\n{\n  "valid": true,\n  "user": { "id": "usr_123", "email": "user@example.com" }\n}\n```'
      }
    },
    { 
      path: '/auth/refresh', 
      method: 'POST', 
      status: '📋', 
      desc: 'Refresh token',
      details: {
        input: '```json\n{\n  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}\n```',
        process: 'Validates refresh token → Generates new access token → Returns updated token pair',
        output: '```json\n{\n  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",\n  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."\n}\n```'
      }
    },
  ];

  const aiEndpoints = [
    { 
      path: '/query', 
      method: 'POST', 
      status: '✅', 
      desc: 'Submit question to multiple AI models', 
      service: 'query',
      details: {
        input: '```json\n{\n  "question": "What are the key environmental policies?",\n  "models": ["gpt-3.5-turbo", "gpt-4", "claude-3"],\n  "options": { "temperature": 0.7 }\n}\n```',
        process: 'Preprocesses question → Runs through NLP pipeline (sentiment, toxicity, ideology) → Dispatches to selected AI models in parallel → Collects responses → Calculates synthesis metrics (consensus, divergence) → Stores in ledger → Returns aggregated results',
        output: '```json\n{\n  "queryId": "q_abc123",\n  "responses": [{\n    "model": "gpt-3.5-turbo",\n    "response": "Environmental policies focus on...",\n    "metadata": { "tokens": 156, "confidence": 0.85 }\n  }],\n  "synthesis": {\n    "consensusIndex": 0.78,\n    "divergence": 0.22,\n    "sentiment": "neutral"\n  },\n  "pipeline": { "steps": [...], "totalTimeMs": 2453 }\n}\n```'
      }
    },
    { 
      path: '/query/:id', 
      method: 'GET', 
      status: '📋', 
      desc: 'Get specific query result',
      details: {
        input: 'URL parameter: `id` (query identifier)',
        process: 'Retrieves query from database → Loads associated responses and metadata → Returns complete query object',
        output: '```json\n{\n  "id": "q_abc123",\n  "question": "What are the key environmental policies?",\n  "responses": [...],\n  "createdAt": "2025-11-18T10:00:00Z"\n}\n```'
      }
    },
    { 
      path: '/interactions', 
      method: 'GET', 
      status: '📋', 
      desc: 'List user interactions',
      details: {
        input: 'Query params: `page`, `limit`, `filter`',
        process: 'Retrieves user interactions from database → Paginates results → Returns list with metadata',
        output: '```json\n{\n  "interactions": [...],\n  "total": 42,\n  "page": 1,\n  "limit": 20\n}\n```'
      }
    },
    { 
      path: '/interactions/:id', 
      method: 'GET', 
      status: '📋', 
      desc: 'Get interaction details',
      details: {
        input: 'URL parameter: `id` (interaction identifier)',
        process: 'Retrieves interaction details → Loads related responses → Returns complete interaction data',
        output: '```json\n{\n  "id": "int_xyz789",\n  "query": {...},\n  "responses": [...],\n  "metadata": {...}\n}\n```'
      }
    },
    { 
      path: '/interactions/:id/export', 
      method: 'GET', 
      status: '✅', 
      desc: 'Export interaction data',
      details: {
        input: 'URL parameter: `id`, Query param: `format` (json/csv/pdf)',
        process: 'Retrieves interaction → Formats according to requested type → Generates export file → Returns download link',
        output: '```json\n{\n  "downloadUrl": "/exports/int_xyz789.json",\n  "expiresAt": "2025-11-18T12:00:00Z"\n}\n```'
      }
    },
  ];

  const mlEndpoints = [
    { 
      path: '/ml/preprocessing', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Text preprocessing with spaCy - tokens, POS tagging, NER, dependency parsing', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Detta är en mening som behöver analyseras.",\n  "language": "sv"\n}\n```',
        process: 'Tokenizes text using spaCy → Performs POS (Part-of-Speech) tagging → Named entity recognition (NER) → Dependency parsing → Extracts linguistic features → Returns structured analysis',
        output: '```json\n{\n  "tokens": ["Detta", "är", "en", "mening", "som", "behöver", "analyseras"],\n  "pos": ["PRON", "VERB", "DET", "NOUN", "PRON", "VERB", "VERB"],\n  "entities": [{"text": "Sverige", "label": "GPE", "start": 10, "end": 17}],\n  "dependencies": [\n    {"token": "är", "dep": "ROOT", "head": "är"},\n    {"token": "Detta", "dep": "nsubj", "head": "är"}\n  ],\n  "lemmas": ["detta", "vara", "en", "mening", "som", "behöva", "analysera"],\n  "metadata": {"model": "sv_core_news_sm", "version": "3.7.2"}\n}\n```'
      }
    },
    { 
      path: '/ml/sentiment', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Sentiment analysis using TextBlob - polarity and subjectivity scores', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "This is a wonderful day!"\n}\n```',
        process: 'Analyzes text polarity using TextBlob → Calculates subjectivity score (0=objective, 1=subjective) → Classifies overall sentiment → Returns detailed scores with confidence',
        output: '```json\n{\n  "polarity": 0.85,\n  "subjectivity": 0.65,\n  "sentiment": "positive",\n  "confidence": 0.92,\n  "magnitude": 0.75,\n  "metadata": {"model": "TextBlob", "version": "0.17.1"}\n}\n```'
      }
    },
    { 
      path: '/ml/language', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Language detection using langdetect - language code with confidence scores', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Detta är en svensk mening"\n}\n```',
        process: 'Detects language using langdetect library → Calculates confidence probability → Identifies alternative language matches → Returns ISO 639-1 language code with probabilities',
        output: '```json\n{\n  "language": "sv",\n  "confidence": 0.99,\n  "alternates": [\n    {"lang": "no", "prob": 0.01},\n    {"lang": "da", "prob": 0.005}\n  ],\n  "metadata": {"detector": "langdetect", "iso_code": "ISO 639-1"}\n}\n```'
      }
    },
    { 
      path: '/ml/toxicity', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Multi-dimensional toxicity detection using Detoxify - toxicity, threat, insult, sexual, identity hate', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Your text to analyze for toxicity"\n}\n```',
        process: 'Analyzes text using Detoxify transformer model → Scores multiple toxicity dimensions → Applies threshold detection → Returns multi-category classification with confidence scores',
        output: '```json\n{\n  "toxicity": 0.12,\n  "severe_toxicity": 0.01,\n  "obscene": 0.05,\n  "threat": 0.02,\n  "insult": 0.08,\n  "identity_attack": 0.03,\n  "sexual_explicit": 0.01,\n  "overall_toxic": false,\n  "risk_level": "low",\n  "metadata": {"model": "unitary/toxic-bert", "version": "0.5.2"}\n}\n```'
      }
    },
    { 
      path: '/ml/ideology', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Ideological classification using Swedish BERT transformers - political leaning with confidence', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text om miljöpolitik och hållbarhet",\n  "language": "sv"\n}\n```',
        process: 'Tokenizes using Swedish BERT tokenizer → Runs through fine-tuned transformer model → Classifies political/ideological leaning → Calculates multi-class probabilities → Returns ideology distribution with confidence',
        output: '```json\n{\n  "ideology": "green",\n  "scores": {\n    "left": 0.15,\n    "center": 0.20,\n    "right": 0.10,\n    "green": 0.55\n  },\n  "confidence": 0.85,\n  "secondary": "center",\n  "metadata": {"model": "KB/bert-base-swedish-cased", "version": "transformers-4.36.2"}\n}\n```'
      }
    },
    { 
      path: '/ml/topics', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Topic modeling using BERTopic and Gensim - topic clusters with key terms', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Long text about climate change and renewable energy...",\n  "num_topics": 5,\n  "method": "bertopic"\n}\n```',
        process: 'Embeds text using sentence transformers → Applies dimensionality reduction (UMAP) → Clusters topics using HDBSCAN → Extracts representative key terms using c-TF-IDF → Returns topic distribution with cluster metadata',
        output: '```json\n{\n  "topics": [\n    {"id": 0, "label": "climate_change", "probability": 0.65, "terms": ["climate", "change", "warming", "global"], "coherence": 0.72},\n    {"id": 1, "label": "renewable_energy", "probability": 0.35, "terms": ["solar", "wind", "renewable", "energy"], "coherence": 0.68}\n  ],\n  "num_topics_found": 2,\n  "outliers": 0.05,\n  "metadata": {"model": "BERTopic", "version": "0.16.0", "embedding_model": "all-MiniLM-L6-v2"}\n}\n```'
      }
    },
    { 
      path: '/ml/similarity', 
      method: 'POST', 
      status: '✅', 
      desc: 'Text similarity analysis', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text1": "First text",\n  "text2": "Second text"\n}\n```',
        process: 'Embeds both texts → Calculates cosine similarity → Returns similarity score',
        output: '```json\n{\n  "similarity": 0.78,\n  "method": "cosine",\n  "threshold": "high"\n}\n```'
      }
    },
    { 
      path: '/ml/analyze', 
      method: 'POST', 
      status: '✅', 
      desc: 'Complete NLP pipeline', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text to analyze"\n}\n```',
        process: 'Runs complete pipeline → Preprocessing → Sentiment → Language → Toxicity → Ideology → Topics → Returns comprehensive analysis',
        output: '```json\n{\n  "preprocessing": {...},\n  "sentiment": {...},\n  "language": {...},\n  "toxicity": {...},\n  "ideology": {...},\n  "topics": {...}\n}\n```'
      }
    },
    { 
      path: '/ml/shap', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'SHAP explainability - global and local feature importance for model predictions', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text to explain",\n  "model": "sentiment",\n  "prediction_class": "positive"\n}\n```',
        process: 'Generates SHAP (SHapley Additive exPlanations) values using TreeExplainer or DeepExplainer → Identifies important features → Calculates feature contributions → Returns both global and local explanations with visualizations',
        output: '```json\n{\n  "shapValues": [0.15, -0.08, 0.22, 0.05, -0.12],\n  "tokens": ["wonderful", "day", "but", "some", "issues"],\n  "baseValue": 0.0,\n  "topFeatures": [\n    {"token": "wonderful", "contribution": 0.22, "direction": "positive"},\n    {"token": "issues", "contribution": -0.12, "direction": "negative"}\n  ],\n  "globalImportance": {"word_sentiment": 0.45, "word_length": 0.15},\n  "visualization": "data:image/png;base64,...",\n  "metadata": {"model": "SHAP", "version": "0.44.0", "explainer_type": "TreeExplainer"}\n}\n```'
      }
    },
    { 
      path: '/ml/lime', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'LIME local interpretability - explains individual predictions with feature weights', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text to explain",\n  "model": "ideology",\n  "num_features": 10,\n  "num_samples": 5000\n}\n```',
        process: 'Generates LIME (Local Interpretable Model-agnostic Explanations) → Perturbs input text → Creates local surrogate model → Calculates feature importance weights → Returns interpretable local explanation',
        output: '```json\n{\n  "explanation": "The model classified this as \'green\' primarily due to environmental policy terms",\n  "weights": [\n    {"word": "miljö", "weight": 0.45, "class": "green"},\n    {"word": "hållbarhet", "weight": 0.38, "class": "green"},\n    {"word": "politik", "weight": 0.12, "class": "center"}\n  ],\n  "prediction": "green",\n  "confidence": 0.88,\n  "intercept": 0.05,\n  "score": 0.72,\n  "metadata": {"model": "LIME", "num_features": 10, "num_samples": 5000}\n}\n```'
      }
    },
    { 
      path: '/ml/fairness', 
      method: 'POST', 
      status: 'Ready', 
      desc: 'Fairness metrics and bias analysis using Fairlearn - demographic parity, equalized odds', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "predictions": [0, 1, 1, 0, 1],\n  "true_labels": [0, 1, 0, 0, 1],\n  "sensitive_features": ["group_a", "group_b", "group_a", "group_b", "group_a"],\n  "feature_names": ["gender"]\n}\n```',
        process: 'Calculates Fairlearn fairness metrics → Computes demographic parity difference → Analyzes equalized odds → Checks disparate impact → Identifies bias patterns → Returns comprehensive fairness assessment with mitigation recommendations',
        output: '```json\n{\n  "demographicParity": 0.92,\n  "demographicParityDifference": 0.08,\n  "equalizedOdds": 0.88,\n  "disparateImpact": 0.85,\n  "biasMitigation": "recommended",\n  "fairnessViolations": ["demographic_parity"],\n  "groupMetrics": {\n    "group_a": {"selection_rate": 0.60, "accuracy": 0.85},\n    "group_b": {"selection_rate": 0.68, "accuracy": 0.82}\n  },\n  "recommendations": ["Apply threshold optimization", "Review sensitive feature impact"],\n  "metadata": {"model": "Fairlearn", "version": "0.10.0"}\n}\n```'
      }
    },
    { 
      path: '/ml/eda', 
      method: 'POST', 
      status: 'Partial', 
      desc: 'Automated EDA using Sweetviz - comprehensive data analysis and visualizations', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "dataset": [\n    {"feature1": 10, "feature2": "category_a", "target": 1},\n    {"feature1": 20, "feature2": "category_b", "target": 0}\n  ],\n  "target_column": "target",\n  "compare_dataset": null\n}\n```',
        process: 'Generates automated exploratory data analysis using Sweetviz → Analyzes distributions → Creates correlation matrices → Identifies missing values → Generates comprehensive visualizations → Returns HTML report with interactive charts',
        output: '```json\n{\n  "reportUrl": "/reports/eda_abc123.html",\n  "summary": {\n    "num_features": 3,\n    "num_observations": 2,\n    "missing_cells": 0,\n    "duplicate_rows": 0,\n    "correlations": {"feature1_target": 0.85}\n  },\n  "statistics": {\n    "feature1": {"mean": 15.0, "std": 7.07, "min": 10, "max": 20}\n  },\n  "metadata": {"model": "Sweetviz", "report_type": "analyze"}\n}\n```'
      }
    },
    { 
      path: '/ml/viz', 
      method: 'POST', 
      status: 'Partial', 
      desc: 'Interactive visualizations using Lux - automatic chart recommendations and insights', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "dataset": [\n    {"x": 10, "y": 20, "category": "A"},\n    {"x": 15, "y": 25, "category": "B"}\n  ],\n  "target": "y",\n  "intent": ["x", "category"]\n}\n```',
        process: 'Generates interactive visualizations using Lux library → Analyzes data patterns → Creates automatic chart recommendations → Identifies interesting correlations → Returns visualization specifications with insights',
        output: '```json\n{\n  "visualizations": [\n    {"type": "scatter", "x": "x", "y": "y", "encoding": {...}, "score": 0.85},\n    {"type": "bar", "x": "category", "y": "y", "encoding": {...}, "score": 0.72}\n  ],\n  "recommendations": [\n    {"type": "Correlation", "description": "Strong positive correlation between x and y"},\n    {"type": "Distribution", "description": "Category A shows higher y values"}\n  ],\n  "insights": ["x and y are highly correlated (r=0.95)"],\n  "metadata": {"model": "Lux", "num_visualizations": 2}\n}\n```'
      }
    },
    { 
      path: '/ml/health', 
      method: 'GET', 
      status: '✅', 
      desc: 'Service health check', 
      service: 'python-ml',
      details: {
        input: 'No input required',
        process: 'Checks Python ML service connectivity → Verifies model loading → Returns health status',
        output: '```json\n{\n  "status": "healthy",\n  "models": {"spacy": "loaded", "textblob": "loaded"},\n  "uptime": 12345\n}\n```'
      }
    },
  ];

  const ledgerEndpoints = [
    { 
      path: '/ledger/blocks', 
      method: 'GET', 
      status: '✅', 
      desc: 'Get all ledger blocks',
      details: {
        input: 'Query params: `limit`, `offset`',
        process: 'Retrieves blocks from transparency ledger → Paginates results → Returns block list',
        output: '```json\n{\n  "blocks": [{\n    "hash": "abc123",\n    "timestamp": "2025-11-18T10:00:00Z",\n    "data": {...}\n  }],\n  "total": 150\n}\n```'
      }
    },
    { 
      path: '/ledger/blocks/:hash', 
      method: 'GET', 
      status: '✅', 
      desc: 'Get specific block by hash',
      details: {
        input: 'URL parameter: `hash` (block hash)',
        process: 'Looks up block by hash → Verifies integrity → Returns block data',
        output: '```json\n{\n  "hash": "abc123",\n  "previousHash": "def456",\n  "timestamp": "2025-11-18T10:00:00Z",\n  "data": {...},\n  "nonce": 12345\n}\n```'
      }
    },
    { 
      path: '/ledger/verify', 
      method: 'POST', 
      status: '✅', 
      desc: 'Verify chain integrity',
      details: {
        input: '```json\n{\n  "fromBlock": 0,\n  "toBlock": 100\n}\n```',
        process: 'Verifies hash chain → Checks block integrity → Validates timestamps → Returns verification result',
        output: '```json\n{\n  "valid": true,\n  "blocksVerified": 100,\n  "issues": []\n}\n```'
      }
    },
    { 
      path: '/ledger/add', 
      method: 'POST', 
      status: '✅', 
      desc: 'Add entry to ledger',
      details: {
        input: '```json\n{\n  "type": "interaction",\n  "data": {...},\n  "metadata": {...}\n}\n```',
        process: 'Validates entry → Calculates hash → Links to previous block → Mines block → Adds to chain',
        output: '```json\n{\n  "blockHash": "xyz789",\n  "blockNumber": 151,\n  "timestamp": "2025-11-18T10:05:00Z"\n}\n```'
      }
    },
  ];

  const changeDetectionEndpoints = [
    { 
      path: '/change-detection/analyze', 
      method: 'POST', 
      status: '✅', 
      desc: 'Analyze text changes', 
      service: 'change-detection',
      details: {
        input: '```json\n{\n  "originalText": "Original version",\n  "modifiedText": "Modified version"\n}\n```',
        process: 'Compares texts → Calculates similarity → Detects sentiment shift → Identifies ideology change → Measures severity → Returns comprehensive analysis',
        output: '```json\n{\n  "similarity": 0.75,\n  "sentimentShift": {"from": "neutral", "to": "positive"},\n  "ideologyShift": {"from": "center", "to": "green"},\n  "severityIndex": 0.42,\n  "changes": [...]\n}\n```'
      }
    },
    { 
      path: '/change-detection/compare', 
      method: 'POST', 
      status: '✅', 
      desc: 'Compare two texts', 
      service: 'change-detection',
      details: {
        input: '```json\n{\n  "text1": "First text",\n  "text2": "Second text"\n}\n```',
        process: 'Performs detailed comparison → Highlights differences → Calculates metrics → Returns diff analysis',
        output: '```json\n{\n  "differences": [...],\n  "metrics": {"wordChanges": 12, "sentenceChanges": 3},\n  "similarity": 0.68\n}\n```'
      }
    },
    { 
      path: '/change-detection/timeline', 
      method: 'GET', 
      status: '📋', 
      desc: 'Get change timeline',
      details: {
        input: 'Query params: `resourceId`, `from`, `to`',
        process: 'Retrieves change history → Orders chronologically → Returns timeline',
        output: '```json\n{\n  "timeline": [{\n    "timestamp": "2025-11-18T10:00:00Z",\n    "change": {...},\n    "severity": 0.35\n  }]\n}\n```'
      }
    },
  ];

  const factCheckEndpoints = [
    { 
      path: '/fact-check/verify', 
      method: 'POST', 
      status: 'Partial', 
      desc: 'Fact verification using Tavily API - verify claims with source citations', 
      service: 'fact-check',
      details: {
        input: '```json\n{\n  "claim": "Sweden has achieved carbon neutrality by 2045",\n  "context": "Optional context text",\n  "max_sources": 5\n}\n```',
        process: 'Submits claim to Tavily API → Searches trusted sources → Analyzes credibility → Extracts supporting/contradicting evidence → Calculates confidence score → Returns verification status with citations',
        output: '```json\n{\n  "verificationStatus": "partially_true",\n  "confidence": 0.75,\n  "verdict": "Sweden has set a goal for carbon neutrality by 2045 but has not yet achieved it",\n  "sources": [\n    {\n      "url": "https://example.com/sweden-climate",\n      "title": "Sweden Climate Goals",\n      "snippet": "Sweden aims to reach net zero emissions by 2045",\n      "credibility": 0.92,\n      "date": "2024-01-15"\n    }\n  ],\n  "supportingEvidence": 3,\n  "contradictingEvidence": 1,\n  "timestamp": "2025-11-18T10:00:00Z",\n  "metadata": {"api": "Tavily", "search_depth": "advanced"}\n}\n```'
      }
    },
    { 
      path: '/fact-check/sources', 
      method: 'POST', 
      status: 'Partial', 
      desc: 'Get credible sources for a topic', 
      service: 'fact-check',
      details: {
        input: '```json\n{\n  "query": "renewable energy statistics 2024",\n  "num_sources": 10,\n  "domain_filter": ["gov", "edu", "org"]\n}\n```',
        process: 'Queries Tavily for credible sources → Filters by domain credibility → Ranks by relevance and trustworthiness → Returns curated source list',
        output: '```json\n{\n  "sources": [\n    {"url": "https://example.gov/renewable", "title": "...", "credibility": 0.95},\n    {"url": "https://example.edu/energy", "title": "...", "credibility": 0.88}\n  ],\n  "total": 10,\n  "metadata": {"query_time_ms": 450}\n}\n```'
      }
    },
  ];

  const firebaseEndpoints = [
    { 
      path: '/firebase/status', 
      method: 'GET', 
      status: '✅', 
      desc: 'Check Firebase availability and configuration status', 
      service: 'firebase',
      details: {
        input: 'No input required',
        process: 'Checks Firebase Admin SDK initialization → Verifies Firestore connection → Returns configuration status with helpful error messages if not configured',
        output: '```json\n{\n  "available": true,\n  "configured": true,\n  "message": "Firebase is configured and ready",\n  "error": null,\n  "timestamp": "2025-11-18T10:00:00.000Z"\n}\n```'
      }
    },
    { 
      path: '/firebase/questions', 
      method: 'POST', 
      status: '✅', 
      desc: 'Store a new question in Firebase Firestore - returns 201 with document ID', 
      service: 'firebase',
      details: {
        input: '```json\n{\n  "question": "Vad är Sveriges klimatpolitik?",\n  "userId": "anonymous",\n  "sessionId": "session-123456"\n}\n```',
        process: 'Validates question (must be non-empty string) → Creates document in ai_interactions collection with status "received" → Generates question hash for ledger → Creates ledger block for "Fråga mottagen" → Returns document ID and status',
        output: '```json\n{\n  "success": true,\n  "docId": "abc123def456",\n  "status": "received",\n  "created_at": "2025-11-18T10:00:00.000Z",\n  "message": "Question stored successfully"\n}\n```'
      }
    },
    { 
      path: '/firebase/questions/:docId', 
      method: 'GET', 
      status: '✅', 
      desc: 'Retrieve a specific question by document ID with current status', 
      service: 'firebase',
      details: {
        input: 'URL parameter: `docId` (Firestore document ID)',
        process: 'Looks up document in ai_interactions collection → Verifies document exists → Returns complete document data including question, status, analysis results',
        output: '```json\n{\n  "success": true,\n  "data": {\n    "docId": "abc123def456",\n    "question": "Vad är Sveriges klimatpolitik?",\n    "status": "completed",\n    "created_at": "2025-11-18T10:00:00.000Z",\n    "completed_at": "2025-11-18T10:05:00.000Z",\n    "pipeline_version": "1.0.0",\n    "analysis": {...}\n  }\n}\n```'
      }
    },
    { 
      path: '/firebase/questions/:docId/status', 
      method: 'POST', 
      status: '✅', 
      desc: 'Update question status - used by ML pipeline to track processing stages', 
      service: 'firebase',
      details: {
        input: '```json\n{\n  "status": "processing",\n  "analysis": null,\n  "completed_at": null\n}\n```',
        process: 'Validates status value (received | processing | completed | ledger_verified | error) → Updates document in Firestore → Creates ledger block for status changes (e.g., "Analys klar" when completed) → Returns updated status',
        output: '```json\n{\n  "success": true,\n  "docId": "abc123def456",\n  "status": "processing",\n  "message": "Status updated successfully"\n}\n```'
      }
    },
    { 
      path: '/firebase/questions', 
      method: 'GET', 
      status: '✅', 
      desc: 'List recent questions with pagination and status filtering', 
      service: 'firebase',
      details: {
        input: 'Query params: `limit` (default 10), `status` (optional filter)',
        process: 'Queries ai_interactions collection → Orders by created_at descending → Applies optional status filter → Paginates results → Returns array of questions',
        output: '```json\n{\n  "success": true,\n  "count": 10,\n  "data": [\n    {\n      "docId": "abc123",\n      "question": "...",\n      "status": "completed",\n      "created_at": "2025-11-18T10:00:00.000Z"\n    }\n  ]\n}\n```'
      }
    },
    { 
      path: '/firebase/questions/:docId', 
      method: 'DELETE', 
      status: '✅', 
      desc: 'Delete a question (GDPR compliance - right to be forgotten)', 
      service: 'firebase',
      details: {
        input: 'URL parameter: `docId` (document to delete)',
        process: 'Validates document exists → Deletes from ai_interactions collection → Returns success confirmation',
        output: '```json\n{\n  "success": true,\n  "message": "Question deleted successfully"\n}\n```'
      }
    },
  ];

  const toggleEndpoint = (key) => {
    setExpandedEndpoint(expandedEndpoint === key ? null : key);
  };

  const renderEndpoint = (endpoint, idx, category) => {
    const key = `${category}-${idx}`;
    const isExpanded = expandedEndpoint === key;

    return (
      <div key={idx} className="border-b border-[#1a1a1a]">
        {/* Endpoint Header */}
        <div 
          className="grid grid-cols-[60px_1fr_auto_80px] gap-3 items-center py-2 hover:border-[#2a2a2a] hover:bg-[#0d0d0d] transition-all cursor-pointer text-xs"
          onClick={() => toggleEndpoint(key)}
        >
          <span className="font-mono text-[#666]">{endpoint.method}</span>
          <code className="text-[#888] font-mono">{endpoint.path}</code>
          <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
          <div className="text-right flex items-center justify-end gap-2">
            {endpoint.service && getServiceHealth(endpoint.service)}
            {getStatusBadge(endpoint.status)}
            <span className="text-[#555] text-[10px] font-mono">{isExpanded ? '−' : '+'}</span>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && endpoint.details && (
          <div className="bg-[#0d0d0d] border-t border-[#1a1a1a] px-4 py-4 space-y-4">
            {/* Input Data */}
            <div>
              <div className="text-[10px] font-mono text-[#666] mb-2">INPUT →</div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
                <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap overflow-x-auto">
                  {endpoint.details.input}
                </pre>
              </div>
            </div>

            {/* Processing */}
            <div>
              <div className="text-[10px] font-mono text-[#666] mb-2">PROCESSING →</div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
                <p className="text-[10px] font-mono text-[#888] leading-relaxed">
                  {endpoint.details.process}
                </p>
              </div>
            </div>

            {/* Output Data */}
            <div>
              <div className="text-[10px] font-mono text-[#666] mb-2">OUTPUT →</div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
                <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap overflow-x-auto">
                  {endpoint.details.output}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1200px] mx-auto pb-32">
          {/* Header */}
          <div className="mb-10">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-xs mb-6 transition-colors duration-200 hover:text-[#888] group font-mono"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>TILLBAKA</span>
            </Link>
            <h1 className="text-4xl font-light tracking-wide mb-3 text-[#e7e7e7]">
              API Dokumentation
            </h1>
            <p className="text-sm text-[#666] max-w-[700px] font-light">
              Komplett endpoint-referens för CivicAI/OpenSeek.AI plattformen. Klicka på en endpoint för detaljer.
            </p>
          </div>

          {/* API Base URL */}
          <div className="border-t border-b border-[#1a1a1a] py-4 mb-8">
            <div className="grid grid-cols-[100px_1fr] gap-4 text-xs">
              <div className="text-[#555] font-mono">Development</div>
              <code className="text-[#888] font-mono">http://localhost:3001/api</code>
              <div className="text-[#555] font-mono">Production</div>
              <code className="text-[#555] font-mono">TBD</code>
            </div>
          </div>

          {/* Status Legend */}
          <div className="border-b border-[#1a1a1a] pb-6 mb-8">
            <div className="flex items-center gap-6 text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="text-[#888]">READY</span>
                <span className="text-[#555]">—</span>
                <span className="text-[#555]">Implemented</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#666]">PARTIAL</span>
                <span className="text-[#555]">—</span>
                <span className="text-[#555]">In progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#555]">PLANNED</span>
                <span className="text-[#555]">—</span>
                <span className="text-[#555]">Not started</span>
              </div>
            </div>
          </div>

          {/* Authentication Endpoints */}
          <div className="mb-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">AUTHENTICATION</h2>
            <div>
              {authEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'auth'))}
            </div>
          </div>

          {/* AI Interaction Endpoints */}
          <div className="mb-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">AI INTERACTIONS</h2>
            <div>
              {aiEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'ai'))}
            </div>
          </div>

          {/* Python ML Endpoints */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-[#888]">PYTHON ML PIPELINE</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#555]">Status:</span>
                {getServiceHealth('python-ml')}
              </div>
            </div>
            <div>
              {mlEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'ml'))}
            </div>
          </div>

          {/* Transparency Ledger Endpoints */}
          <div className="mb-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">TRANSPARENCY LEDGER</h2>
            <div>
              {ledgerEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'ledger'))}
            </div>
          </div>

          {/* Change Detection Endpoints */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-[#888]">CHANGE DETECTION</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#555]">Status:</span>
                {getServiceHealth('change-detection')}
              </div>
            </div>
            <div>
              {changeDetectionEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'change'))}
            </div>
          </div>

          {/* Fact Checking Endpoints */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-[#888]">FACT CHECKING (TAVILY)</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#555]">Status:</span>
                {getServiceHealth('fact-check')}
              </div>
            </div>
            <div>
              {factCheckEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'fact-check'))}
            </div>
          </div>

          {/* Firebase Integration Endpoints */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-[#888]">FIREBASE INTEGRATION</h2>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-[#555]">Status:</span>
                {getServiceHealth('firebase')}
              </div>
            </div>
            <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded px-3 py-2 mb-3">
              <p className="text-[10px] font-mono text-[#666] leading-relaxed">
                Firebase Firestore integration för persistent lagring av användarfrågor och realtidsstatusuppdateringar. 
                Stöder statusflöde: <span className="text-[#888]">received</span> → <span className="text-[#888]">processing</span> → <span className="text-[#888]">completed</span> → <span className="text-[#888]">ledger_verified</span>
              </p>
            </div>
            <div>
              {firebaseEndpoints.map((endpoint, idx) => renderEndpoint(endpoint, idx, 'firebase'))}
            </div>
          </div>

          {/* Models Reference */}
          <div className="border-t border-[#1a1a1a] pt-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">NLP MODELS</h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-1 text-xs">
              <div className="font-mono text-[#666]">spaCy 3.7.2</div>
              <div className="font-mono text-[#666]">SHAP 0.44.0</div>
              <div className="font-mono text-[#666]">TextBlob 0.17.1</div>
              <div className="font-mono text-[#666]">LIME</div>
              <div className="font-mono text-[#666]">langdetect</div>
              <div className="font-mono text-[#666]">Fairlearn 0.10.0</div>
              <div className="font-mono text-[#666]">Detoxify 0.5.2</div>
              <div className="font-mono text-[#666]">Lux</div>
              <div className="font-mono text-[#666]">Transformers 4.36.2</div>
              <div className="font-mono text-[#666]">Sweetviz</div>
              <div className="font-mono text-[#666]">Gensim 4.3.2</div>
              <div></div>
              <div className="font-mono text-[#666]">BERTopic 0.16.0</div>
              <div></div>
            </div>
          </div>
        </div>
      </div>
      <FooterDemo4 />
    </div>
  );
}
