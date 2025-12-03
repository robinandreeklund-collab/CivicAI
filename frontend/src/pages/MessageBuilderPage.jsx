import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Message Builder Page
 * Standalone fullscreen debugger for real-time prompt structure testing
 * 
 * Clean design matching /api-docs style
 * Now with Live Topic Sidebar for memory testing and intent tracking
 */

// Helper to generate topic ID
const generateTopicId = () => `topic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to try multiple endpoints
const fetchWithFallback = async (path, options = {}) => {
  const endpoints = [
    `/api/ml${path}`,
    `http://localhost:5000/api/ml${path}`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) {
        return response;
      }
    } catch (err) {
      console.log(`Failed: ${endpoint}`);
    }
  }
  throw new Error('All endpoints failed');
};

// Structure templates with full code examples
const TEMPLATES = {
  current: {
    name: "Current (Main)",
    desc: "Aktiva formatet: {system_prompt}\\n\\nAnvändare: {msg}\\n\\nOneSeek:",
    code: `{system_prompt}

Användare: {user_message}

OneSeek:`
  },
  clean: {
    name: "Clean",
    desc: "Minimal: system + user",
    code: `[
  {"role": "system", "content": "{system_prompt}"},
  {"role": "user", "content": "{user_message}"}
]`
  },
  with_memory: {
    name: "With Memory",
    desc: "Inkluderar 5 historiska meddelanden",
    code: `[
  {"role": "system", "content": "{system_prompt}"},
  ...history.slice(-5).map(m => ({"role": m.role, "content": m.content})),
  {"role": "user", "content": "{user_message}"}
]`
  },
  with_context: {
    name: "With Context", 
    desc: "Lägger till tid/datum i system prompt",
    code: `[
  {"role": "system", "content": "{system_prompt}\\n\\n[Aktuell tid] {time_context}"},
  {"role": "user", "content": "{user_message}"}
]`
  },
  swedish_strict: {
    name: "Swedish Strict",
    desc: "Forcerar 100% svenska svar",
    code: `[
  {"role": "system", "content": "Du pratar alltid svenska. Inga engelska ord.\\n\\n{system_prompt}"},
  {"role": "user", "content": "{user_message}"}
]`
  },
  no_tags: {
    name: "No Tags",
    desc: "⚠️ Experimentell - kan orsaka loops",
    code: `{system_prompt}

{user_message}`
  }
};

// Helper to format response text with code blocks
const formatResponseText = (text) => {
  if (!text) return null;
  
  // Split by code blocks (```...```)
  const parts = text.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract language and code
      const match = part.match(/```(\w*)\n?([\s\S]*?)```/);
      if (match) {
        const lang = match[1] || 'code';
        const code = match[2].trim();
        return (
          <div key={index} className="my-3 rounded overflow-hidden">
            <div className="bg-[#1a1a1a] px-3 py-1 text-[10px] font-mono text-[#666] border-b border-[#2a2a2a]">
              {lang}
            </div>
            <pre className="bg-[#141414] p-3 text-xs font-mono text-green-400 overflow-x-auto whitespace-pre">
              {code}
            </pre>
          </div>
        );
      }
    }
    
    // Check for inline code (`...`)
    const inlineParts = part.split(/(`[^`]+`)/g);
    return (
      <span key={index}>
        {inlineParts.map((inline, i) => {
          if (inline.startsWith('`') && inline.endsWith('`')) {
            return (
              <code key={i} className="bg-[#1a1a1a] px-1.5 py-0.5 rounded text-xs font-mono text-purple-400">
                {inline.slice(1, -1)}
              </code>
            );
          }
          return inline;
        })}
      </span>
    );
  });
};

export default function MessageBuilderPage() {
  const [template, setTemplate] = useState('current');
  const [useCustom, setUseCustom] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('Du är OneSeek-7B-Zero, en hjälpsam svensk AI-assistent.');
  const [testQuestion, setTestQuestion] = useState('Vem är du?');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedDefault, setSavedDefault] = useState(null);
  const [results, setResults] = useState([]);
  
  // Topic tracking state
  const [topicId, setTopicId] = useState(generateTopicId());
  const [maintainTopic, setMaintainTopic] = useState(true);
  const [topicHistory, setTopicHistory] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Intent Engine toggle - default to global config
  const [useIntentEngine, setUseIntentEngine] = useState(false); // Start false, will be updated from API
  const [globalIntentEnabled, setGlobalIntentEnabled] = useState(false);

  useEffect(() => {
    fetchDefault();
    fetchActiveFeatures();
  }, []);

  const fetchActiveFeatures = async () => {
    try {
      const res = await fetchWithFallback('/delta-plus/active-features');
      const data = await res.json();
      if (data.active_features) {
        const intentEnabled = data.active_features.intent_engine || false;
        setGlobalIntentEnabled(intentEnabled);
        setUseIntentEngine(intentEnabled); // Default to global config
      }
    } catch (e) {
      console.log('Could not fetch active features, defaulting to disabled');
      setUseIntentEngine(false);
    }
  };

  const fetchDefault = async () => {
    try {
      const res = await fetchWithFallback('/debug/messages/default');
      const data = await res.json();
      if (data.default_structure) {
        setSavedDefault(data.default_structure.name);
      }
    } catch (e) {
      console.log('Could not fetch default');
    }
  };

  const runTest = async () => {
    setLoading(true);
    setError(null);
    const startTime = Date.now();
    
    // Generate new topic if not maintaining
    const currentTopicId = maintainTopic ? topicId : generateTopicId();
    if (!maintainTopic) {
      setTopicId(currentTopicId);
    }
    
    const code = useCustom ? customCode : template;
    const name = useCustom ? 'custom' : template;
    
    try {
      const res = await fetchWithFallback('/debug/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structure_code: code,
          structure_name: name,
          system_prompt: systemPrompt,
          user_message: testQuestion,
          topic_id: currentTopicId,
          use_intent_engine: useIntentEngine,
          history: maintainTopic ? topicHistory.map(h => ({ role: 'user', content: h.question })) : []
        })
      });
      
      const data = await res.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      setResult(data);
      
      if (data.success) {
        // Add to topic history (store full response for YAML export)
        const historyEntry = {
          id: Date.now(),
          question: testQuestion,
          response: data.response || '',  // Full response for YAML export
          responsePreview: data.response?.substring(0, 100) + (data.response?.length > 100 ? '...' : ''),  // Preview for sidebar
          confidence: data.analysis?.estimated_confidence || 0,
          intent: data.intent_info?.intent || 'unknown',
          entity: data.intent_info?.entity || '',
          sources: data.sources_used || [],
          responseTime,
          timestamp: new Date().toISOString(),
          structure: name,
          time_context: data.time_context || '',
          season_context: data.season_context || '',
          api_fetch_log: data.api_fetch_log || [],
          mode: data.api_catalog_info?.mode || 'unknown'
        };
        
        setTopicHistory(prev => [...prev, historyEntry]);
        
        setResults(prev => [
          { template: name, ...data, timestamp: new Date().toISOString(), responseTime },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  
  const resetTopic = () => {
    setTopicId(generateTopicId());
    setTopicHistory([]);
    setResult(null);
  };

  const saveAsDefault = async () => {
    const code = useCustom ? customCode : template;
    const name = useCustom ? 'custom' : template;
    
    try {
      await fetchWithFallback('/debug/messages/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, code })
      });
      setSavedDefault(name);
    } catch (e) {
      setError('Kunde inte spara');
    }
  };

  const clearResults = () => {
    setResults([]);
    setResult(null);
  };

  // State for YAML export modal
  const [showYamlModal, setShowYamlModal] = useState(false);
  const [yamlContent, setYamlContent] = useState('');
  
  // State for API data detail modal
  const [showApiDetailModal, setShowApiDetailModal] = useState(false);
  const [selectedApiLog, setSelectedApiLog] = useState(null);

  // Generate YAML export of the entire session flow
  const generateYamlExport = () => {
    const avgConfidence = topicHistory.length > 0 
      ? Math.round(topicHistory.reduce((a, b) => a + b.confidence, 0) / topicHistory.length)
      : 0;
    
    const totalResponseTime = topicHistory.reduce((a, b) => a + b.responseTime, 0);
    
    // Collect all unique intents and sources used
    const allIntents = [...new Set(topicHistory.map(h => h.intent).filter(Boolean))];
    const allSources = [...new Set(topicHistory.flatMap(h => h.sources || []))];
    
    let yaml = `# ══════════════════════════════════════════════════════════════
# ONESEEK Δ+ MESSAGE BUILDER - SESSION EXPORT
# Generated: ${new Date().toISOString()}
# ══════════════════════════════════════════════════════════════

session:
  topic_id: "${topicId}"
  maintain_topic: ${maintainTopic}
  use_intent_engine: ${useIntentEngine}
  total_questions: ${topicHistory.length}
  avg_confidence: ${avgConfidence}%
  total_response_time: ${totalResponseTime}ms

system_prompt: |
  ${systemPrompt.split('\n').join('\n  ')}

`;

    if (topicHistory.length === 0) {
      yaml += `# Ingen historik ännu - kör ett test för att generera data
flow: []
`;
    } else {
      yaml += `# ══════════════════════════════════════════════════════════════
# CONVERSATION FLOW
# ══════════════════════════════════════════════════════════════

flow:
`;
      topicHistory.forEach((entry, i) => {
        const isIntentMode = entry.mode === 'intent-based' || useIntentEngine;
        const modeLabel = isIntentMode ? 'Intent-Based' : 'Self-Steering (v4.0)';
        
        yaml += `
  - step: ${i + 1}
    timestamp: "${entry.timestamp}"
    structure: "${entry.structure}"
    mode: "${modeLabel}"
    
    question: |
      ${entry.question}
    
${isIntentMode ? `    # Intent Engine Analysis
    intent:
      detected: "${entry.intent || 'unknown'}"
      entity: "${entry.entity || ''}"
      sources_used: [${(entry.sources || []).map(s => `"${s}"`).join(', ')}]
` : `    # Self-Steering Mode (v4.0)
    # Model chooses category and API automatically
    data_sources: [${(entry.sources || []).map(s => `"${s}"`).join(', ') || '"none"'}]
`}
    # API Fetch Log
    api_calls:
${(entry.api_fetch_log || []).length > 0 
  ? entry.api_fetch_log.map(log => `      - api: "${log.api}"
        source: "${log.source}"
        timestamp: "${log.timestamp}"
        duration_ms: ${log.duration_ms}
        status: "${log.status}"
        entity: "${log.entity || ''}"`).join('\n')
  : '      - none'}
    
    response: |
      ${(entry.response || '').split('\n').join('\n      ')}
    
    metrics:
      confidence: ${entry.confidence}%
      response_time: ${entry.responseTime}ms
`;
      });

      // Collect all API calls for summary
      const allApiCalls = topicHistory.flatMap(h => h.api_fetch_log || []);
      const successfulCalls = allApiCalls.filter(c => c.status === 'success').length;
      const failedCalls = allApiCalls.filter(c => c.status === 'error').length;

      // Add summary with intent/source info
      yaml += `
# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════

summary:
  questions_asked: ${topicHistory.length}
  confidence_range:
    min: ${Math.min(...topicHistory.map(h => h.confidence))}%
    max: ${Math.max(...topicHistory.map(h => h.confidence))}%
    avg: ${avgConfidence}%
  response_times:
    min: ${Math.min(...topicHistory.map(h => h.responseTime))}ms
    max: ${Math.max(...topicHistory.map(h => h.responseTime))}ms
    avg: ${Math.round(totalResponseTime / topicHistory.length)}ms
  structures_used:
${[...new Set(topicHistory.map(h => h.structure))].map(s => `    - "${s}"`).join('\n')}

# API Fetch Summary
api_summary:
  total_calls: ${allApiCalls.length}
  successful: ${successfulCalls}
  failed: ${failedCalls}
  apis_used:
${[...new Set(allApiCalls.map(c => c.source))].map(s => `    - "${s}"`).join('\n') || '    - "none"'}

# Mode Summary
mode_analysis:
  global_intent_engine: ${globalIntentEnabled}
  session_mode: "${useIntentEngine ? 'Intent-Based' : 'Self-Steering (v4.0)'}"
  intents_detected:
${allIntents.length > 0 && useIntentEngine ? allIntents.map(i => `    - "${i}"`).join('\n') : '    - "N/A (Self-Steering mode)"'}
  data_sources_used:
${allSources.length > 0 ? allSources.map(s => `    - "${s}"`).join('\n') : '    - "none (model knowledge only)"'}
`;
    }

    setYamlContent(yaml);
    setShowYamlModal(true);
  };

  // Copy YAML to clipboard
  const copyYamlToClipboard = () => {
    navigator.clipboard.writeText(yamlContent);
  };

  // Confidence color helper
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getConfidenceBg = (confidence) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7] flex overflow-x-auto overflow-y-auto">
      
      {/* Live Topic Sidebar */}
      {showSidebar && (
        <div className="w-80 min-w-[320px] border-r border-[#1a1a1a] bg-[#080808] fixed left-0 top-0 bottom-0 overflow-y-auto z-10">
          <div className="p-4">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-[#888]">📍 TOPIC TRACKER</h2>
              <button 
                onClick={() => setShowSidebar(false)}
                className="text-[#555] hover:text-[#888] text-xs"
              >
                ✕
              </button>
            </div>
            
            {/* Topic ID */}
            <div className="mb-4 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded">
              <div className="text-[10px] font-mono text-[#555] mb-1">TOPIC ID</div>
              <div className="text-xs font-mono text-[#e7e7e7] break-all">{topicId}</div>
            </div>
            
            {/* Maintain Topic Checkbox */}
            <label className="flex items-center gap-2 mb-2 p-3 bg-[#0d0d0d] border border-[#2a2a2a] rounded cursor-pointer hover:border-[#3a3a3a]">
              <input
                type="checkbox"
                checked={maintainTopic}
                onChange={(e) => setMaintainTopic(e.target.checked)}
                className="w-4 h-4 rounded border-[#3a3a3a] bg-[#0a0a0a] text-blue-500 focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <div className="text-xs font-mono text-[#e7e7e7]">Behåll samma topic</div>
                <div className="text-[10px] text-[#555]">Testa memory persistence</div>
              </div>
            </label>
            
            {/* Use Intent Engine Checkbox - Shows global config state */}
            <label className={`flex items-center gap-2 mb-4 p-3 bg-[#0d0d0d] border rounded cursor-pointer hover:border-[#3a3a3a] ${
              globalIntentEnabled ? 'border-green-700/30' : 'border-red-700/30'
            }`}>
              <input
                type="checkbox"
                checked={useIntentEngine}
                onChange={(e) => setUseIntentEngine(e.target.checked)}
                className="w-4 h-4 rounded border-[#3a3a3a] bg-[#0a0a0a] text-green-500 focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <div className="text-xs font-mono text-[#e7e7e7]">
                  🔍 Intent Engine {useIntentEngine ? '(ON)' : '(OFF)'}
                </div>
                <div className="text-[10px] text-[#555]">
                  {globalIntentEnabled 
                    ? '✅ Global: ENABLED' 
                    : '❌ Global: DISABLED (v4.0 Self-Steering)'
                  }
                </div>
                {useIntentEngine && !globalIntentEnabled && (
                  <div className="text-[10px] text-orange-400 mt-1">
                    ⚠️ Override: Intent Engine aktiverad lokalt
                  </div>
                )}
              </div>
            </label>
            
            {/* Session Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded">
                <div className="text-[10px] font-mono text-[#555]">FRÅGOR</div>
                <div className="text-lg font-mono text-[#888]">{topicHistory.length}</div>
              </div>
              <div className="p-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded">
                <div className="text-[10px] font-mono text-[#555]">AVG CONF</div>
                <div className={`text-lg font-mono ${getConfidenceColor(
                  topicHistory.length > 0 
                    ? Math.round(topicHistory.reduce((a, b) => a + b.confidence, 0) / topicHistory.length)
                    : 0
                )}`}>
                  {topicHistory.length > 0 
                    ? Math.round(topicHistory.reduce((a, b) => a + b.confidence, 0) / topicHistory.length)
                    : 0}%
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2 mb-4">
              {/* Export YAML Button */}
              <button
                onClick={generateYamlExport}
                className="w-full py-2 px-3 border border-blue-700/50 text-blue-400 text-xs font-mono rounded hover:bg-blue-900/20 transition-all"
              >
                📄 EXPORTERA YAML
              </button>
              
              {/* Reset Button */}
              <button
                onClick={resetTopic}
                className="w-full py-2 px-3 border border-red-900/50 text-red-500 text-xs font-mono rounded hover:bg-red-900/20 transition-all"
              >
                🔄 RESET TOPIC & HISTORIK
              </button>
            </div>
            
            {/* Topic History */}
            <div className="mb-2">
              <div className="text-[10px] font-mono text-[#555] mb-2">HISTORIK</div>
            </div>
            
            {topicHistory.length === 0 ? (
              <div className="p-4 text-center text-[10px] font-mono text-[#555] border border-dashed border-[#2a2a2a] rounded">
                Ingen historik ännu.<br/>Kör ett test för att se resultat.
              </div>
            ) : (
              <div className="space-y-2">
                {topicHistory.map((entry, i) => (
                  <div key={entry.id} className="p-2 bg-[#0d0d0d] border border-[#2a2a2a] rounded hover:border-[#3a3a3a] transition-all">
                    {/* Entry Header */}
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-[#555]">#{i + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-[#555]">{entry.responseTime}ms</span>
                        <div className={`w-2 h-2 rounded-full ${getConfidenceBg(entry.confidence)}`} 
                             title={`Confidence: ${entry.confidence}%`} />
                      </div>
                    </div>
                    
                    {/* Question */}
                    <div className="text-xs text-[#e7e7e7] mb-1 truncate" title={entry.question}>
                      ❓ {entry.question}
                    </div>
                    
                    {/* Intent Info */}
                    {useIntentEngine && entry.intent && entry.intent !== 'unknown' && (
                      <div className="flex items-center gap-2 mb-1 text-[10px] font-mono">
                        <span className="text-blue-400">🎯 {entry.intent}</span>
                        {entry.entity && <span className="text-purple-400">@ {entry.entity}</span>}
                      </div>
                    )}
                    
                    {/* Sources Used */}
                    {useIntentEngine && entry.sources && entry.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {entry.sources.map((src, j) => (
                          <span key={j} className="px-1 bg-green-900/30 text-green-400 text-[8px] font-mono rounded">
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Response preview */}
                    <div className="text-[10px] text-[#666] truncate" title={entry.responsePreview || entry.response?.substring(0, 100)}>
                      💬 {entry.responsePreview || entry.response?.substring(0, 100)}
                    </div>
                    
                    {/* Metrics */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-mono ${getConfidenceColor(entry.confidence)}`}>
                        {entry.confidence}%
                      </span>
                      <span className="text-[10px] font-mono text-[#555]">•</span>
                      <span className="text-[10px] font-mono text-[#555]">{entry.structure}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main Content - shifted when sidebar is visible */}
      <div className={`flex-1 min-w-[600px] ${showSidebar ? 'ml-80' : ''}`}>
        <div className="max-w-[1400px] mx-auto px-6 py-8">
        
        {/* Toggle Sidebar Button (when hidden) */}
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed left-4 top-4 z-20 px-3 py-2 bg-[#1a1a1a] border border-[#3a3a3a] text-[#888] text-xs font-mono rounded hover:bg-[#2a2a2a]"
          >
            📍 TOPIC
          </button>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/admin" 
            className="inline-flex items-center gap-2 text-[#666] text-xs mb-4 hover:text-[#888] font-mono group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            ADMIN
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wide text-[#e7e7e7]">
                Message Builder
              </h1>
              <p className="text-xs text-[#666] mt-1 font-mono">
                Realtids prompt-testning • Jämför strukturer • Spara som default
              </p>
            </div>
            {savedDefault && (
              <div className="text-[10px] font-mono text-[#666] border border-[#2a2a2a] px-3 py-1 rounded">
                DEFAULT: <span className="text-[#888]">{savedDefault}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 border border-red-900/50 bg-red-900/10 rounded text-xs font-mono text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-400">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Input */}
          <div className="space-y-6">
            
            {/* Template Selection */}
            <div>
              <label className="text-[10px] font-mono text-[#666] mb-3 block">STRUKTUR</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => { setTemplate(key); setUseCustom(false); }}
                    className={`text-left px-3 py-2 border rounded transition-all ${
                      !useCustom && template === key
                        ? 'border-[#888] bg-[#1a1a1a] text-[#e7e7e7]'
                        : 'border-[#2a2a2a] text-[#666] hover:border-[#3a3a3a] hover:text-[#888]'
                    }`}
                  >
                    <div className="text-xs font-mono">{t.name}</div>
                    <div className="text-[10px] text-[#555] mt-0.5 truncate">{t.desc}</div>
                  </button>
                ))}
                {/* Custom button */}
                <button
                  onClick={() => setUseCustom(true)}
                  className={`text-left px-3 py-2 border rounded transition-all col-span-2 ${
                    useCustom
                      ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                      : 'border-[#2a2a2a] text-[#666] hover:border-purple-500/50 hover:text-purple-400'
                  }`}
                >
                  <div className="text-xs font-mono">✏️ Custom</div>
                  <div className="text-[10px] text-[#555] mt-0.5">Skriv egen struktur för testning</div>
                </button>
              </div>
            </div>

            {/* Selected Structure Preview - Show for both templates and custom */}
            <div>
              <label className="text-[10px] font-mono text-[#666] mb-2 block">
                {useCustom ? 'CUSTOM STRUKTUR' : `VALD STRUKTUR: ${TEMPLATES[template]?.name || template}`}
              </label>
              <textarea
                value={useCustom ? customCode : (TEMPLATES[template]?.code || '')}
                onChange={(e) => useCustom && setCustomCode(e.target.value)}
                readOnly={!useCustom}
                className={`w-full h-36 bg-[#0d0d0d] border text-xs font-mono p-3 rounded focus:outline-none resize-none ${
                  useCustom 
                    ? 'border-purple-500/30 text-[#e7e7e7] focus:border-purple-500/50' 
                    : 'border-[#2a2a2a] text-[#888] cursor-default'
                }`}
                placeholder={useCustom ? 'Skriv en struktur, t.ex: current, clean, with_memory, eller JSON...' : ''}
              />
              <p className="text-[9px] font-mono text-[#555] mt-1">
                {useCustom 
                  ? 'Tillgängliga: current, clean, with_memory, with_context, swedish_strict, no_tags'
                  : 'Välj "Custom" för att redigera'}
              </p>
            </div>

            {/* System Prompt - Increased height */}
            <div>
              <label className="text-[10px] font-mono text-[#666] mb-2 block">SYSTEM PROMPT</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-40 bg-[#0d0d0d] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono p-3 rounded focus:outline-none focus:border-[#3a3a3a] resize-none"
                placeholder="System prompt..."
              />
            </div>

            {/* Test Question */}
            <div>
              <label className="text-[10px] font-mono text-[#666] mb-2 block">TESTFRÅGA</label>
              <input
                type="text"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                className="w-full bg-[#0d0d0d] border border-[#2a2a2a] text-[#e7e7e7] text-xs font-mono p-3 rounded focus:outline-none focus:border-[#3a3a3a]"
                placeholder="Skriv en testfråga..."
              />
              <div className="flex gap-2 mt-2">
                {['Vem är du?', 'Hur många bor i Stockholm?', 'Vad är väder idag?'].map(q => (
                  <button
                    key={q}
                    onClick={() => setTestQuestion(q)}
                    className="text-[10px] font-mono text-[#555] border border-[#2a2a2a] px-2 py-1 rounded hover:text-[#888] hover:border-[#3a3a3a]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={runTest}
                disabled={loading}
                className="flex-1 py-3 bg-[#1a1a1a] border border-[#3a3a3a] text-[#e7e7e7] text-xs font-mono rounded hover:bg-[#2a2a2a] disabled:opacity-50 transition-all"
              >
                {loading ? '⏳ TESTAR...' : '▶ TESTA'}
              </button>
              <button
                onClick={saveAsDefault}
                disabled={!result?.success}
                className="px-6 py-3 border border-green-700/50 text-green-500 text-xs font-mono rounded hover:border-green-600 hover:bg-green-900/20 disabled:opacity-30 disabled:border-[#2a2a2a] disabled:text-[#666] transition-all"
                title="Aktiverar denna struktur som standard för all inference"
              >
                💾 AKTIVERA
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-3 border border-[#2a2a2a] text-[#555] text-xs font-mono rounded hover:border-[#3a3a3a] hover:text-[#666] transition-all"
              >
                ✕
              </button>
            </div>
            <p className="text-[9px] font-mono text-[#555] mt-2">
              Tryck TESTA för att köra → sen AKTIVERA för att sätta som default struktur
            </p>
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            
            {result ? (
              <>
                {/* Analysis Metrics */}
                {result.analysis && (
                  <div>
                    <label className="text-[10px] font-mono text-[#666] mb-3 block">ANALYS</label>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3">
                        <div className="text-[10px] text-[#555] font-mono">SVENSKA</div>
                        <div className={`text-lg font-mono ${
                          result.analysis.swedish_percentage >= 90 ? 'text-green-500' :
                          result.analysis.swedish_percentage >= 70 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {result.analysis.swedish_percentage}%
                        </div>
                      </div>
                      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3">
                        <div className="text-[10px] text-[#555] font-mono">FÖRTROENDE</div>
                        <div className={`text-lg font-mono ${
                          result.analysis.estimated_confidence >= 80 ? 'text-green-500' :
                          result.analysis.estimated_confidence >= 50 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {result.analysis.estimated_confidence}%
                        </div>
                      </div>
                      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3">
                        <div className="text-[10px] text-[#555] font-mono">LOOPS</div>
                        <div className={`text-lg font-mono ${result.analysis.has_loops ? 'text-red-500' : 'text-green-500'}`}>
                          {result.analysis.has_loops ? 'JA' : 'NEJ'}
                        </div>
                      </div>
                      <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3">
                        <div className="text-[10px] text-[#555] font-mono">ORD</div>
                        <div className="text-lg font-mono text-[#888]">
                          {result.analysis.word_count}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Time & Season Context - Always shown when Intent Engine is enabled */}
                {useIntentEngine && (result.time_context || result.season_context) && (
                  <div>
                    <label className="text-[10px] font-mono text-[#666] mb-2 block">🕐 TID & ÅRSTID</label>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3">
                      <div className="text-xs font-mono text-[#888]">
                        {result.time_context}
                      </div>
                      <div className="text-xs font-mono text-yellow-400 mt-1">
                        {result.season_context}
                      </div>
                    </div>
                  </div>
                )}

                {/* Intent Info Section - Shows when intent engine is enabled */}
                {useIntentEngine && result.intent_info && (
                  <div>
                    <label className="text-[10px] font-mono text-[#666] mb-2 block">🔍 INTENT ENGINE</label>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">INTENT</div>
                          <div className="text-sm font-mono text-blue-400">{result.intent_info?.intent || 'unknown'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">ENTITY</div>
                          <div className="text-sm font-mono text-purple-400">{result.intent_info?.entity || '-'}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">CONFIDENCE</div>
                          <div className={`text-sm font-mono ${getConfidenceColor((result.intent_info?.confidence || 0) * 100)}`}>
                            {Math.round((result.intent_info?.confidence || 0) * 100)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">API</div>
                          <div className="text-sm font-mono text-orange-400">{result.intent_info?.api || 'none'}</div>
                        </div>
                      </div>
                      
                      {/* Sources Used */}
                      {result.sources_used && result.sources_used.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                          <div className="text-[10px] font-mono text-[#555] mb-2">DATAKÄLLOR ANVÄNDA</div>
                          <div className="flex flex-wrap gap-2">
                            {result.sources_used.map((source, i) => (
                              <span key={i} className="px-2 py-1 bg-green-900/30 text-green-400 text-[10px] font-mono rounded">
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Data Context */}
                      {result.data_context && Object.keys(result.data_context).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                          <div className="text-[10px] font-mono text-[#555] mb-2">HÄMTAD DATA</div>
                          <div className="rounded overflow-hidden">
                            <div className="bg-[#1a1a1a] px-3 py-1 text-[10px] font-mono text-[#666] border-b border-[#2a2a2a]">
                              json
                            </div>
                            <pre className="bg-[#141414] p-3 text-[10px] font-mono text-green-400 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(result.data_context, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* API Catalog Info - v4.0 Debug */}
                {result.api_catalog_info && (
                  <div>
                    <label className="text-[10px] font-mono text-[#666] mb-2 block">🔷 API CATALOG v4.0 DEBUG</label>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">MODE</div>
                          <div className={`text-sm font-mono ${result.api_catalog_info.mode === 'self-steering' ? 'text-green-400' : 'text-blue-400'}`}>
                            {result.api_catalog_info.mode === 'self-steering' ? '⚡ Self-Steering' : '🎯 Intent-Based'}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">CATEGORIES</div>
                          <div className="text-sm font-mono text-[#888]">{result.api_catalog_info.categories_available || 0}</div>
                        </div>
                        <div>
                          <div className="text-[10px] font-mono text-[#555] mb-1">INTENT ENGINE</div>
                          <div className={`text-sm font-mono ${result.api_catalog_info.active_features?.intent_engine ? 'text-green-400' : 'text-red-400'}`}>
                            {result.api_catalog_info.active_features?.intent_engine ? '✅ ON' : '❌ OFF'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-[10px] font-mono text-[#555] mb-1">TYPO CHECKER</div>
                            <div className={`text-sm font-mono ${result.api_catalog_info.active_features?.typo_checker ? 'text-green-400' : 'text-red-400'}`}>
                              {result.api_catalog_info.active_features?.typo_checker ? '✅ ON' : '❌ OFF'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-mono text-[#555] mb-1">TIME CONTEXT</div>
                            <div className={`text-sm font-mono ${result.api_catalog_info.active_features?.time_context ? 'text-green-400' : 'text-red-400'}`}>
                              {result.api_catalog_info.active_features?.time_context ? '✅ ALWAYS ON' : '❌ OFF'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* API Fetch Log - Shows all API calls with timestamps - CLICKABLE */}
                {result.api_fetch_log && result.api_fetch_log.length > 0 && (
                  <div>
                    <label className="text-[10px] font-mono text-[#666] mb-2 block">📡 API FETCH LOG <span className="text-[#444]">(klicka för detaljer)</span></label>
                    <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-4">
                      <div className="space-y-2">
                        {result.api_fetch_log.map((log, i) => (
                          <div 
                            key={i} 
                            className="flex items-center justify-between p-2 bg-[#141414] rounded border border-[#1a1a1a] cursor-pointer hover:border-[#3a3a3a] hover:bg-[#1a1a1a] transition-all"
                            onClick={() => {
                              setSelectedApiLog(log);
                              setShowApiDetailModal(true);
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`text-sm font-mono ${log.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                                {log.status === 'success' ? '✓' : '✗'}
                              </span>
                              <div>
                                <div className="text-xs font-mono text-[#e7e7e7]">{log.source}</div>
                                <div className="text-[10px] text-[#555]">{log.entity}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-xs font-mono text-[#888]">{log.duration_ms}ms</div>
                                <div className="text-[10px] text-[#555]">{new Date(log.timestamp).toLocaleTimeString()}</div>
                              </div>
                              <span className="text-[#444] text-xs">→</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-[#1a1a1a] text-[10px] font-mono text-[#555]">
                        {result.api_fetch_log.filter(l => l.status === 'success').length} success / {result.api_fetch_log.filter(l => l.status === 'error').length} error
                      </div>
                    </div>
                  </div>
                )}

                {/* Response - Increased height with code block support */}
                <div>
                  <label className="text-[10px] font-mono text-[#666] mb-2 block">SVAR</label>
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                    <div className="text-sm text-[#e7e7e7] leading-relaxed">
                      {result.response ? formatResponseText(result.response) : 'Inget svar'}
                    </div>
                    {result.tokens && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-[10px] font-mono text-[#555]">
                        {result.tokens} tokens • {result.latency_ms?.toFixed(0)}ms
                      </div>
                    )}
                  </div>
                </div>

                {/* Raw Response Data */}
                <div>
                  <label className="text-[10px] font-mono text-[#666] mb-2 block">RAW DATA</label>
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3 min-h-[120px] max-h-[200px] overflow-y-auto">
                    <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap">
                      {result.response || 'Inget svar'}
                    </pre>
                  </div>
                </div>

                {/* Messages - Increased height */}
                <div>
                  <label className="text-[10px] font-mono text-[#666] mb-2 block">MESSAGES</label>
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                    <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap">
                      {JSON.stringify(result.messages, null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-64 border border-[#1a1a1a] rounded bg-[#0d0d0d]">
                <div className="text-center">
                  <div className="text-2xl mb-2 opacity-20">▶</div>
                  <p className="text-xs font-mono text-[#555]">Välj struktur och klicka TESTA</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        {results.length > 1 && (
          <div className="mt-10 border-t border-[#1a1a1a] pt-8">
            <label className="text-[10px] font-mono text-[#666] mb-4 block">JÄMFÖRELSE ({results.length} tester)</label>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#2a2a2a] text-[#666]">
                    <th className="text-left py-2 px-3">STRUKTUR</th>
                    <th className="text-center py-2 px-3">SVENSKA</th>
                    <th className="text-center py-2 px-3">FÖRTROENDE</th>
                    <th className="text-center py-2 px-3">LOOPS</th>
                    <th className="text-center py-2 px-3">ORD</th>
                    <th className="text-center py-2 px-3">TOKENS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-b border-[#1a1a1a] hover:bg-[#0d0d0d]">
                      <td className="py-2 px-3 text-[#888]">{TEMPLATES[r.template]?.name || r.template}</td>
                      <td className={`py-2 px-3 text-center ${
                        r.analysis?.swedish_percentage >= 90 ? 'text-green-500' :
                        r.analysis?.swedish_percentage >= 70 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {r.analysis?.swedish_percentage}%
                      </td>
                      <td className={`py-2 px-3 text-center ${
                        r.analysis?.estimated_confidence >= 80 ? 'text-green-500' :
                        r.analysis?.estimated_confidence >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {r.analysis?.estimated_confidence}%
                      </td>
                      <td className={`py-2 px-3 text-center ${r.analysis?.has_loops ? 'text-red-500' : 'text-green-500'}`}>
                        {r.analysis?.has_loops ? '⚠️' : '✓'}
                      </td>
                      <td className="py-2 px-3 text-center text-[#666]">{r.analysis?.word_count}</td>
                      <td className="py-2 px-3 text-center text-[#555]">{r.tokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-10 border-t border-[#1a1a1a] pt-6">
          <p className="text-[10px] font-mono text-[#555] max-w-2xl">
            Message Builder testar hur olika prompt-strukturer påverkar modellens svar. 
            "Current (Main)" är det aktiva formatet. Undvik "No Tags" – det orsakade loops i PR #95.
          </p>
        </div>
        </div>
      </div>

      {/* YAML Export Modal */}
      {showYamlModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowYamlModal(false)}>
          <div 
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <div>
                <h3 className="text-sm font-mono text-[#e7e7e7]">📄 SESSION EXPORT - YAML</h3>
                <p className="text-[10px] text-[#555] mt-1">Komplett dataflöde för topic: {topicId.substring(0, 30)}...</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyYamlToClipboard}
                  className="px-3 py-1.5 bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs font-mono rounded hover:bg-blue-900/50 transition-all"
                >
                  📋 KOPIERA
                </button>
                <button
                  onClick={() => setShowYamlModal(false)}
                  className="px-3 py-1.5 border border-[#3a3a3a] text-[#666] text-xs font-mono rounded hover:text-[#888] hover:border-[#4a4a4a] transition-all"
                >
                  ✕ STÄNG
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <pre className="text-xs font-mono text-[#888] whitespace-pre-wrap bg-[#0d0d0d] border border-[#1a1a1a] rounded p-4">
                {yamlContent}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* API Detail Modal - Shows data received from a specific API */}
      {showApiDetailModal && selectedApiLog && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowApiDetailModal(false)}>
          <div 
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
              <div>
                <h3 className="text-sm font-mono text-[#e7e7e7] flex items-center gap-2">
                  <span className={selectedApiLog.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                    {selectedApiLog.status === 'success' ? '✓' : '✗'}
                  </span>
                  📡 API DETAIL: {selectedApiLog.source}
                </h3>
                <p className="text-[10px] text-[#555] mt-1">
                  {selectedApiLog.entity} • {selectedApiLog.duration_ms}ms • {selectedApiLog.mode || 'unknown'}
                </p>
              </div>
              <button
                onClick={() => setShowApiDetailModal(false)}
                className="px-3 py-1.5 border border-[#3a3a3a] text-[#666] text-xs font-mono rounded hover:text-[#888] hover:border-[#4a4a4a] transition-all"
              >
                ✕ STÄNG
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Metadata Section */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">STATUS</div>
                  <div className={`text-sm font-mono ${selectedApiLog.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedApiLog.status === 'success' ? '✓ SUCCESS' : '✗ ERROR'}
                  </div>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">API</div>
                  <div className="text-sm font-mono text-blue-400">{selectedApiLog.api}</div>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">DURATION</div>
                  <div className="text-sm font-mono text-[#888]">{selectedApiLog.duration_ms}ms</div>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">CATEGORY</div>
                  <div className="text-sm font-mono text-purple-400">{selectedApiLog.category || '-'}</div>
                </div>
              </div>

              {/* Timestamp & Entity */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">TIMESTAMP</div>
                  <div className="text-xs font-mono text-[#888]">{selectedApiLog.timestamp}</div>
                </div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded p-3">
                  <div className="text-[10px] text-[#555] font-mono mb-1">ENTITY</div>
                  <div className="text-sm font-mono text-orange-400">{selectedApiLog.entity || '-'}</div>
                </div>
              </div>

              {/* Error Message (if error) */}
              {selectedApiLog.status === 'error' && selectedApiLog.error && (
                <div className="bg-red-900/20 border border-red-700/30 rounded p-3">
                  <div className="text-[10px] text-red-400 font-mono mb-1">ERROR MESSAGE</div>
                  <div className="text-xs font-mono text-red-300">{selectedApiLog.error}</div>
                </div>
              )}

              {/* Data Received - YAML format */}
              <div>
                <div className="text-[10px] text-[#555] font-mono mb-2">📥 DATA RECEIVED</div>
                <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded overflow-hidden">
                  <div className="bg-[#141414] px-3 py-1 text-[10px] font-mono text-[#555] border-b border-[#1a1a1a] flex justify-between items-center">
                    <span>yaml</span>
                    <button
                      onClick={() => {
                        const yamlData = `# API: ${selectedApiLog.source}
# Entity: ${selectedApiLog.entity || '-'}
# Timestamp: ${selectedApiLog.timestamp}
# Duration: ${selectedApiLog.duration_ms}ms
# Status: ${selectedApiLog.status}
# Category: ${selectedApiLog.category || '-'}
# Mode: ${selectedApiLog.mode || '-'}

data:
${selectedApiLog.data ? JSON.stringify(selectedApiLog.data, null, 2).split('\n').map(line => '  ' + line).join('\n') : '  null'}
`;
                        navigator.clipboard.writeText(yamlData);
                      }}
                      className="text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      📋 kopiera
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-green-400 whitespace-pre-wrap overflow-x-auto max-h-[300px] overflow-y-auto">
{selectedApiLog.data ? (
  `# Data from ${selectedApiLog.source}
${JSON.stringify(selectedApiLog.data, null, 2)}`
) : (
  `# No data available
# The API response data was not included in the log.
# This may happen with older log entries.

status: ${selectedApiLog.status}
api: ${selectedApiLog.api}
entity: ${selectedApiLog.entity || 'null'}
timestamp: ${selectedApiLog.timestamp}
duration_ms: ${selectedApiLog.duration_ms}`
)}
                  </pre>
                </div>
              </div>

              {/* Raw Response (if available) */}
              {selectedApiLog.raw_response && (
                <div>
                  <div className="text-[10px] text-[#555] font-mono mb-2">📄 RAW RESPONSE</div>
                  <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded overflow-hidden">
                    <div className="bg-[#141414] px-3 py-1 text-[10px] font-mono text-[#555] border-b border-[#1a1a1a]">
                      raw
                    </div>
                    <pre className="p-3 text-[10px] font-mono text-[#888] whitespace-pre-wrap overflow-x-auto max-h-[200px] overflow-y-auto">
                      {typeof selectedApiLog.raw_response === 'string' 
                        ? selectedApiLog.raw_response 
                        : JSON.stringify(selectedApiLog.raw_response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
