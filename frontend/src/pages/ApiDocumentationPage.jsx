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
      return <span className="px-2 py-1 text-xs bg-green-500/10 text-green-500 rounded">✅ Ready</span>;
    } else if (status === '🔶' || status === 'Partial') {
      return <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded">🔶 Partial</span>;
    } else if (status === '📋' || status === 'Planned') {
      return <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-500 rounded">📋 Planned</span>;
    }
    return <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-500 rounded">⚠️ Unknown</span>;
  };

  const getServiceHealth = (serviceName) => {
    if (loading) return <span className="text-xs text-[#666]">Checking...</span>;
    const isUp = serviceStatus[serviceName]?.status === 'up';
    return (
      <span className={`text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
        {isUp ? '🟢 Up' : '🔴 Down'}
      </span>
    );
  };

  const authEndpoints = [
    { path: '/auth/signup', method: 'POST', status: '🔶', description: 'User registration' },
    { path: '/auth/login', method: 'POST', status: '📋', description: 'User login' },
    { path: '/auth/logout', method: 'POST', status: '📋', description: 'User logout' },
    { path: '/auth/verify', method: 'POST', status: '📋', description: 'Verify authentication token' },
    { path: '/auth/refresh', method: 'POST', status: '📋', description: 'Refresh authentication token' },
  ];

  const aiEndpoints = [
    { path: '/query', method: 'POST', status: '✅', description: 'Submit question to multiple AI models', service: 'query' },
    { path: '/query/:id', method: 'GET', status: '📋', description: 'Get specific query result' },
    { path: '/interactions', method: 'GET', status: '📋', description: 'List user\'s AI interactions' },
    { path: '/interactions/:id', method: 'GET', status: '📋', description: 'Get specific interaction details' },
    { path: '/interactions/:id/export', method: 'GET', status: '✅', description: 'Export interaction (YAML/JSON/PDF)' },
  ];

  const mlEndpoints = [
    { path: '/ml/preprocessing', method: 'POST', status: '✅', description: 'Text preprocessing (spaCy)', service: 'python-ml' },
    { path: '/ml/sentiment', method: 'POST', status: '✅', description: 'Sentiment analysis (TextBlob + VADER)', service: 'python-ml' },
    { path: '/ml/language', method: 'POST', status: '✅', description: 'Language detection (langdetect)', service: 'python-ml' },
    { path: '/ml/toxicity', method: 'POST', status: '✅', description: 'Toxicity detection (Detoxify)', service: 'python-ml' },
    { path: '/ml/ideology', method: 'POST', status: '✅', description: 'Ideological classification (Swedish BERT)', service: 'python-ml' },
    { path: '/ml/topics', method: 'POST', status: '✅', description: 'Topic modeling (BERTopic/Gensim)', service: 'python-ml' },
    { path: '/ml/similarity', method: 'POST', status: '✅', description: 'Text similarity (embeddings)', service: 'python-ml' },
    { path: '/ml/analyze', method: 'POST', status: '✅', description: 'Complete NLP pipeline analysis', service: 'python-ml' },
    { path: '/ml/shap', method: 'POST', status: '✅', description: 'SHAP explainability analysis', service: 'python-ml' },
    { path: '/ml/lime', method: 'POST', status: '✅', description: 'LIME interpretability', service: 'python-ml' },
    { path: '/ml/fairness', method: 'POST', status: '✅', description: 'Fairness metrics (Fairlearn)', service: 'python-ml' },
    { path: '/ml/eda', method: 'POST', status: '📋', description: 'Automated EDA (Sweetviz)', service: 'python-ml' },
    { path: '/ml/viz', method: 'POST', status: '📋', description: 'Interactive visualizations (Lux)', service: 'python-ml' },
    { path: '/ml/health', method: 'GET', status: '✅', description: 'Python ML service health check', service: 'python-ml' },
  ];

  const ledgerEndpoints = [
    { path: '/ledger/blocks', method: 'GET', status: '✅', description: 'Get all ledger blocks' },
    { path: '/ledger/blocks/:hash', method: 'GET', status: '✅', description: 'Get specific block by hash' },
    { path: '/ledger/verify', method: 'POST', status: '✅', description: 'Verify ledger chain integrity' },
    { path: '/ledger/add', method: 'POST', status: '✅', description: 'Add entry to transparency ledger' },
  ];

  const changeDetectionEndpoints = [
    { path: '/change-detection/analyze', method: 'POST', status: '✅', description: 'Analyze text changes', service: 'change-detection' },
    { path: '/change-detection/compare', method: 'POST', status: '✅', description: 'Compare two texts', service: 'change-detection' },
    { path: '/change-detection/timeline', method: 'GET', status: '📋', description: 'Get change timeline' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1400px] mx-auto pb-32">
          {/* Header */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>
            <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-5 text-[#e7e7e7]">
              🔌 API Dokumentation
            </h1>
            <p className="text-lg text-[#888] max-w-[800px] font-light leading-relaxed">
              Komplett endpoint-referens för CivicAI/OpenSeek.AI plattformen.
            </p>
          </div>

          {/* API Base URL */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-light text-[#e7e7e7] mb-4">API Base URL</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-[#666]">Development:</span>
                <code className="bg-[#0a0a0a] px-3 py-1 rounded text-[#e7e7e7]">http://localhost:3001/api</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#666]">Production:</span>
                <code className="bg-[#0a0a0a] px-3 py-1 rounded text-[#888]">TBD</code>
              </div>
            </div>
          </div>

          {/* Status Legend */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-8">
            <h2 className="text-xl font-light text-[#e7e7e7] mb-4">📊 Status Legend</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                {getStatusBadge('✅')}
                <span className="text-[#888]">Fully implemented and tested</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge('🔶')}
                <span className="text-[#888]">Partially implemented</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge('📋')}
                <span className="text-[#888]">Planned, not yet implemented</span>
              </div>
            </div>
          </div>

          {/* Authentication Endpoints */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">🔐 Authentication Endpoints</h2>
            <div className="space-y-4">
              {authEndpoints.map((endpoint, idx) => (
                <div key={idx} className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs bg-blue-500/10 text-blue-400 rounded font-medium">{endpoint.method}</span>
                      <code className="text-sm text-[#e7e7e7]">{endpoint.path}</code>
                    </div>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-sm text-[#888] ml-14">{endpoint.description}</p>
                </div>
              ))}
            </div>
            
            {/* Example */}
            <div className="mt-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">Example: User Signup</div>
              <pre className="text-xs text-[#888] overflow-x-auto">
{`POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}`}
              </pre>
            </div>
          </div>

          {/* AI Interaction Endpoints */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">💬 AI Interaction Endpoints</h2>
            <div className="space-y-4">
              {aiEndpoints.map((endpoint, idx) => (
                <div key={idx} className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        endpoint.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{endpoint.method}</span>
                      <code className="text-sm text-[#e7e7e7]">{endpoint.path}</code>
                    </div>
                    <div className="flex items-center gap-2">
                      {endpoint.service && getServiceHealth(endpoint.service)}
                      {getStatusBadge(endpoint.status)}
                    </div>
                  </div>
                  <p className="text-sm text-[#888] ml-14">{endpoint.description}</p>
                </div>
              ))}
            </div>

            {/* Example */}
            <div className="mt-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">Example: Query Multiple AI Models</div>
              <pre className="text-xs text-[#888] overflow-x-auto">
{`POST /api/query
Content-Type: application/json

{
  "question": "Vad är skillnaden mellan demokrati och autokrati?",
  "includeEnhancedNLP": true
}

Response:
{
  "responses": [
    {
      "agent": "deepseek",
      "response": "...",
      "metadata": { "model": "deepseek-chat", "timestamp": "...", "confidence": 0.85 },
      "analysis": { "tone": {...}, "bias": {...} },
      "pipelineAnalysis": { "timeline": [...], "metadata": {...} }
    }
  ],
  "modelSynthesis": {
    "consensusIndex": 0.78,
    "divergenceMeasure": 0.22,
    "weightedSentiment": {...},
    "ideologicalLeaning": {...}
  }
}`}
              </pre>
            </div>
          </div>

          {/* Python ML Endpoints */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">🐍 Python ML Pipeline Endpoints</h2>
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-[#666]">Service Status:</span>
              {getServiceHealth('python-ml')}
            </div>
            <div className="space-y-4">
              {mlEndpoints.map((endpoint, idx) => (
                <div key={idx} className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        endpoint.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{endpoint.method}</span>
                      <code className="text-sm text-[#e7e7e7]">{endpoint.path}</code>
                    </div>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-sm text-[#888] ml-14">{endpoint.description}</p>
                </div>
              ))}
            </div>

            {/* Example */}
            <div className="mt-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">Example: Complete NLP Analysis</div>
              <pre className="text-xs text-[#888] overflow-x-auto">
{`POST /api/ml/analyze
Content-Type: application/json

{
  "text": "Sverige behöver satsa på hållbar energi och grön omställning."
}

Response:
{
  "timeline": [
    { "step": "preprocessing", "status": "completed", "durationMs": 45 },
    { "step": "sentiment", "status": "completed", "durationMs": 32 },
    { "step": "ideology", "status": "completed", "durationMs": 128 }
  ],
  "sentimentAnalysis": { "classification": "positive", "score": 0.72 },
  "ideologicalClassification": { "primary": "green", "confidence": 0.81 },
  "metadata": { "totalProcessingTimeMs": 482, "pythonMLUsed": true }
}`}
              </pre>
            </div>
          </div>

          {/* Transparency Ledger Endpoints */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">🔗 Transparency Ledger Endpoints</h2>
            <div className="space-y-4">
              {ledgerEndpoints.map((endpoint, idx) => (
                <div key={idx} className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        endpoint.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{endpoint.method}</span>
                      <code className="text-sm text-[#e7e7e7]">{endpoint.path}</code>
                    </div>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-sm text-[#888] ml-14">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Change Detection Endpoints */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">🔍 Change Detection Endpoints</h2>
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-[#666]">Service Status:</span>
              {getServiceHealth('change-detection')}
            </div>
            <div className="space-y-4">
              {changeDetectionEndpoints.map((endpoint, idx) => (
                <div key={idx} className="border border-[#2a2a2a] rounded-lg p-4 hover:border-[#3a3a3a] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        endpoint.method === 'GET' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>{endpoint.method}</span>
                      <code className="text-sm text-[#e7e7e7]">{endpoint.path}</code>
                    </div>
                    {getStatusBadge(endpoint.status)}
                  </div>
                  <p className="text-sm text-[#888] ml-14">{endpoint.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Models Reference */}
          <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">🤖 NLP Models Reference</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-3">Core NLP Models</h3>
                <div className="space-y-2 text-xs text-[#888]">
                  <div>📝 <span className="text-[#aaa]">spaCy 3.7.2</span> - Tokenization, POS, NER</div>
                  <div>💭 <span className="text-[#aaa]">TextBlob 0.17.1</span> - Sentiment analysis</div>
                  <div>🌍 <span className="text-[#aaa]">langdetect</span> - Language detection</div>
                  <div>🛡️ <span className="text-[#aaa]">Detoxify 0.5.2</span> - Toxicity detection</div>
                  <div>🏛️ <span className="text-[#aaa]">Transformers 4.36.2</span> - Swedish BERT ideology</div>
                  <div>📊 <span className="text-[#aaa]">Gensim 4.3.2</span> - Semantic analysis</div>
                  <div>🧠 <span className="text-[#aaa]">BERTopic 0.16.0</span> - Topic modeling</div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-3">Explainability & Quality</h3>
                <div className="space-y-2 text-xs text-[#888]">
                  <div>🔍 <span className="text-[#aaa]">SHAP 0.44.0</span> - Model explainability</div>
                  <div>💡 <span className="text-[#aaa]">LIME</span> - Local interpretability</div>
                  <div>⚖️ <span className="text-[#aaa]">Fairlearn 0.10.0</span> - Fairness metrics</div>
                  <div>📈 <span className="text-[#aaa]">Lux</span> - Interactive visualizations</div>
                  <div>📉 <span className="text-[#aaa]">Sweetviz</span> - Automated EDA</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterDemo4 />
    </div>
  );
}
