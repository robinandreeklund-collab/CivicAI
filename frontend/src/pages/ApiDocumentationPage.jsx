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
      status: '✅', 
      desc: 'Text preprocessing (spaCy)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Detta är en mening som behöver analyseras."\n}\n```',
        process: 'Tokenizes text using spaCy → Performs POS tagging → Named entity recognition → Dependency parsing → Returns linguistic features',
        output: '```json\n{\n  "tokens": ["Detta", "är", "en", "mening", "som", "behöver", "analyseras"],\n  "pos": ["PRON", "VERB", "DET", "NOUN", "PRON", "VERB", "VERB"],\n  "entities": [],\n  "dependencies": [...]\n}\n```'
      }
    },
    { 
      path: '/ml/sentiment', 
      method: 'POST', 
      status: '✅', 
      desc: 'Sentiment analysis (TextBlob)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "This is a wonderful day!"\n}\n```',
        process: 'Analyzes text polarity using TextBlob → Calculates subjectivity → Classifies sentiment → Returns scores',
        output: '```json\n{\n  "polarity": 0.85,\n  "subjectivity": 0.65,\n  "sentiment": "positive",\n  "confidence": 0.92\n}\n```'
      }
    },
    { 
      path: '/ml/language', 
      method: 'POST', 
      status: '✅', 
      desc: 'Language detection', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Detta är en svensk mening"\n}\n```',
        process: 'Detects language using langdetect → Calculates confidence → Returns language code',
        output: '```json\n{\n  "language": "sv",\n  "confidence": 0.99,\n  "alternates": [{"lang": "no", "prob": 0.01}]\n}\n```'
      }
    },
    { 
      path: '/ml/toxicity', 
      method: 'POST', 
      status: '✅', 
      desc: 'Toxicity detection (Detoxify)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Your text to analyze for toxicity"\n}\n```',
        process: 'Analyzes text using Detoxify model → Scores toxicity categories → Returns classification',
        output: '```json\n{\n  "toxicity": 0.12,\n  "severe_toxicity": 0.01,\n  "obscene": 0.05,\n  "threat": 0.02,\n  "insult": 0.08,\n  "identity_attack": 0.03\n}\n```'
      }
    },
    { 
      path: '/ml/ideology', 
      method: 'POST', 
      status: '✅', 
      desc: 'Ideological classification (Swedish BERT)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text om miljöpolitik och hållbarhet"\n}\n```',
        process: 'Tokenizes using Swedish BERT → Runs through transformer model → Classifies political leaning → Returns ideology scores',
        output: '```json\n{\n  "ideology": "green",\n  "scores": {\n    "left": 0.15,\n    "center": 0.20,\n    "right": 0.10,\n    "green": 0.55\n  },\n  "confidence": 0.85\n}\n```'
      }
    },
    { 
      path: '/ml/topics', 
      method: 'POST', 
      status: '✅', 
      desc: 'Topic modeling (BERTopic/Gensim)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Long text about climate change and renewable energy..."\n}\n```',
        process: 'Embeds text using sentence transformers → Clusters topics using BERTopic/LDA → Extracts key terms → Returns topic distribution',
        output: '```json\n{\n  "topics": [\n    {"id": 0, "label": "climate_change", "probability": 0.65, "terms": ["climate", "change", "warming"]},\n    {"id": 1, "label": "renewable_energy", "probability": 0.35, "terms": ["solar", "wind", "renewable"]}\n  ]\n}\n```'
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
      status: '✅', 
      desc: 'SHAP explainability', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text to explain",\n  "model": "sentiment"\n}\n```',
        process: 'Generates SHAP values for model prediction → Identifies important features → Returns feature contributions',
        output: '```json\n{\n  "shapValues": [0.15, -0.08, 0.22, ...],\n  "tokens": ["word1", "word2", "word3", ...],\n  "topFeatures": [{"token": "wonderful", "contribution": 0.22}]\n}\n```'
      }
    },
    { 
      path: '/ml/lime', 
      method: 'POST', 
      status: '✅', 
      desc: 'LIME interpretability', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "text": "Text to explain",\n  "model": "ideology"\n}\n```',
        process: 'Generates LIME explanation → Creates local interpretable model → Returns feature weights',
        output: '```json\n{\n  "explanation": "Local explanation text",\n  "weights": [{"word": "policy", "weight": 0.45}],\n  "confidence": 0.88\n}\n```'
      }
    },
    { 
      path: '/ml/fairness', 
      method: 'POST', 
      status: '✅', 
      desc: 'Fairness metrics (Fairlearn)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "predictions": [...],\n  "sensitive_features": [...]\n}\n```',
        process: 'Calculates fairness metrics → Checks for bias → Returns fairness assessment',
        output: '```json\n{\n  "demographicParity": 0.92,\n  "equalizedOdds": 0.88,\n  "biasMitigation": "recommended"\n}\n```'
      }
    },
    { 
      path: '/ml/eda', 
      method: 'POST', 
      status: '📋', 
      desc: 'Automated EDA (Sweetviz)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "dataset": [...]\n}\n```',
        process: 'Generates automated exploratory data analysis → Creates visualizations → Returns HTML report',
        output: '```json\n{\n  "reportUrl": "/reports/eda_abc123.html",\n  "summary": {...}\n}\n```'
      }
    },
    { 
      path: '/ml/viz', 
      method: 'POST', 
      status: '📋', 
      desc: 'Interactive visualizations (Lux)', 
      service: 'python-ml',
      details: {
        input: '```json\n{\n  "dataset": [...],\n  "target": "column_name"\n}\n```',
        process: 'Generates interactive visualizations using Lux → Returns visualization recommendations',
        output: '```json\n{\n  "visualizations": [...],\n  "recommendations": [...]\n}\n```'
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
