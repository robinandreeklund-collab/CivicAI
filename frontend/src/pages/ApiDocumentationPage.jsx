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
    { path: '/auth/signup', method: 'POST', status: '🔶', desc: 'User registration' },
    { path: '/auth/login', method: 'POST', status: '📋', desc: 'User login' },
    { path: '/auth/logout', method: 'POST', status: '📋', desc: 'User logout' },
    { path: '/auth/verify', method: 'POST', status: '📋', desc: 'Verify token' },
    { path: '/auth/refresh', method: 'POST', status: '📋', desc: 'Refresh token' },
  ];

  const aiEndpoints = [
    { path: '/query', method: 'POST', status: '✅', desc: 'Submit question to multiple AI models', service: 'query' },
    { path: '/query/:id', method: 'GET', status: '📋', desc: 'Get specific query result' },
    { path: '/interactions', method: 'GET', status: '📋', desc: 'List user interactions' },
    { path: '/interactions/:id', method: 'GET', status: '📋', desc: 'Get interaction details' },
    { path: '/interactions/:id/export', method: 'GET', status: '✅', desc: 'Export interaction data' },
  ];

  const mlEndpoints = [
    { path: '/ml/preprocessing', method: 'POST', status: '✅', desc: 'Text preprocessing (spaCy)', service: 'python-ml' },
    { path: '/ml/sentiment', method: 'POST', status: '✅', desc: 'Sentiment analysis (TextBlob)', service: 'python-ml' },
    { path: '/ml/language', method: 'POST', status: '✅', desc: 'Language detection', service: 'python-ml' },
    { path: '/ml/toxicity', method: 'POST', status: '✅', desc: 'Toxicity detection (Detoxify)', service: 'python-ml' },
    { path: '/ml/ideology', method: 'POST', status: '✅', desc: 'Ideological classification (Swedish BERT)', service: 'python-ml' },
    { path: '/ml/topics', method: 'POST', status: '✅', desc: 'Topic modeling (BERTopic/Gensim)', service: 'python-ml' },
    { path: '/ml/similarity', method: 'POST', status: '✅', desc: 'Text similarity analysis', service: 'python-ml' },
    { path: '/ml/analyze', method: 'POST', status: '✅', desc: 'Complete NLP pipeline', service: 'python-ml' },
    { path: '/ml/shap', method: 'POST', status: '✅', desc: 'SHAP explainability', service: 'python-ml' },
    { path: '/ml/lime', method: 'POST', status: '✅', desc: 'LIME interpretability', service: 'python-ml' },
    { path: '/ml/fairness', method: 'POST', status: '✅', desc: 'Fairness metrics (Fairlearn)', service: 'python-ml' },
    { path: '/ml/eda', method: 'POST', status: '📋', desc: 'Automated EDA (Sweetviz)', service: 'python-ml' },
    { path: '/ml/viz', method: 'POST', status: '📋', desc: 'Interactive visualizations (Lux)', service: 'python-ml' },
    { path: '/ml/health', method: 'GET', status: '✅', desc: 'Service health check', service: 'python-ml' },
  ];

  const ledgerEndpoints = [
    { path: '/ledger/blocks', method: 'GET', status: '✅', desc: 'Get all ledger blocks' },
    { path: '/ledger/blocks/:hash', method: 'GET', status: '✅', desc: 'Get specific block by hash' },
    { path: '/ledger/verify', method: 'POST', status: '✅', desc: 'Verify chain integrity' },
    { path: '/ledger/add', method: 'POST', status: '✅', desc: 'Add entry to ledger' },
  ];

  const changeDetectionEndpoints = [
    { path: '/change-detection/analyze', method: 'POST', status: '✅', desc: 'Analyze text changes', service: 'change-detection' },
    { path: '/change-detection/compare', method: 'POST', status: '✅', desc: 'Compare two texts', service: 'change-detection' },
    { path: '/change-detection/timeline', method: 'GET', status: '📋', desc: 'Get change timeline' },
  ];

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
              Komplett endpoint-referens för CivicAI/OpenSeek.AI plattformen
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
            <div className="space-y-px">
              {authEndpoints.map((endpoint, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_auto_80px] gap-3 items-center py-2 border-b border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors text-xs">
                  <span className="font-mono text-[#666]">{endpoint.method}</span>
                  <code className="text-[#888] font-mono">{endpoint.path}</code>
                  <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
                  <div className="text-right">{getStatusBadge(endpoint.status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Interaction Endpoints */}
          <div className="mb-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">AI INTERACTIONS</h2>
            <div className="space-y-px">
              {aiEndpoints.map((endpoint, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_auto_60px_80px] gap-3 items-center py-2 border-b border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors text-xs">
                  <span className="font-mono text-[#666]">{endpoint.method}</span>
                  <code className="text-[#888] font-mono">{endpoint.path}</code>
                  <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
                  <div className="text-right">{endpoint.service && getServiceHealth(endpoint.service)}</div>
                  <div className="text-right">{getStatusBadge(endpoint.status)}</div>
                </div>
              ))}
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
            <div className="space-y-px">
              {mlEndpoints.map((endpoint, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_auto_80px] gap-3 items-center py-2 border-b border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors text-xs">
                  <span className="font-mono text-[#666]">{endpoint.method}</span>
                  <code className="text-[#888] font-mono">{endpoint.path}</code>
                  <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
                  <div className="text-right">{getStatusBadge(endpoint.status)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparency Ledger Endpoints */}
          <div className="mb-8">
            <h2 className="text-sm font-mono text-[#888] mb-4">TRANSPARENCY LEDGER</h2>
            <div className="space-y-px">
              {ledgerEndpoints.map((endpoint, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_auto_80px] gap-3 items-center py-2 border-b border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors text-xs">
                  <span className="font-mono text-[#666]">{endpoint.method}</span>
                  <code className="text-[#888] font-mono">{endpoint.path}</code>
                  <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
                  <div className="text-right">{getStatusBadge(endpoint.status)}</div>
                </div>
              ))}
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
            <div className="space-y-px">
              {changeDetectionEndpoints.map((endpoint, idx) => (
                <div key={idx} className="grid grid-cols-[60px_1fr_auto_80px] gap-3 items-center py-2 border-b border-[#1a1a1a] hover:border-[#2a2a2a] transition-colors text-xs">
                  <span className="font-mono text-[#666]">{endpoint.method}</span>
                  <code className="text-[#888] font-mono">{endpoint.path}</code>
                  <span className="text-[#555] text-[11px]">{endpoint.desc}</span>
                  <div className="text-right">{getStatusBadge(endpoint.status)}</div>
                </div>
              ))}
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
