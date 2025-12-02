import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/**
 * Message Builder Page
 * Standalone fullscreen debugger for real-time prompt structure testing
 * 
 * Clean design matching /api-docs style
 */

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

// Structure templates
const TEMPLATES = {
  current: {
    name: "Current (Main)",
    desc: "Aktiva formatet: {system_prompt}\\n\\nAnvändare: {msg}\\n\\nOneSeek:"
  },
  clean: {
    name: "Clean",
    desc: "Minimal: system + user"
  },
  with_memory: {
    name: "With Memory",
    desc: "Inkluderar 5 historiska meddelanden"
  },
  with_context: {
    name: "With Context", 
    desc: "Lägger till tid/datum i system prompt"
  },
  swedish_strict: {
    name: "Swedish Strict",
    desc: "Forcerar 100% svenska svar"
  },
  no_tags: {
    name: "No Tags",
    desc: "⚠️ Experimentell - kan orsaka loops"
  }
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

  useEffect(() => {
    fetchDefault();
  }, []);

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
          history: []
        })
      });
      
      const data = await res.json();
      setResult(data);
      
      if (data.success) {
        setResults(prev => [
          { template: name, ...data, timestamp: new Date().toISOString() },
          ...prev.slice(0, 9)
        ]);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        
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

            {/* Custom Code Field - Only show when Custom is selected */}
            {useCustom && (
              <div>
                <label className="text-[10px] font-mono text-[#666] mb-2 block">CUSTOM STRUKTUR</label>
                <textarea
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  className="w-full h-40 bg-[#0d0d0d] border border-purple-500/30 text-[#e7e7e7] text-xs font-mono p-3 rounded focus:outline-none focus:border-purple-500/50 resize-none"
                  placeholder='Skriv en struktur, t.ex: current, clean, with_memory, eller JSON...'
                />
                <p className="text-[9px] font-mono text-[#555] mt-1">
                  Tillgängliga: current, clean, with_memory, with_context, swedish_strict, no_tags
                </p>
              </div>
            )}

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
                className="px-6 py-3 border border-[#2a2a2a] text-[#666] text-xs font-mono rounded hover:border-[#3a3a3a] hover:text-[#888] disabled:opacity-30 transition-all"
              >
                💾 SPARA
              </button>
              <button
                onClick={clearResults}
                className="px-4 py-3 border border-[#2a2a2a] text-[#555] text-xs font-mono rounded hover:border-[#3a3a3a] hover:text-[#666] transition-all"
              >
                ✕
              </button>
            </div>
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

                {/* Response - Increased height */}
                <div>
                  <label className="text-[10px] font-mono text-[#666] mb-2 block">SVAR</label>
                  <div className="bg-[#0d0d0d] border border-[#2a2a2a] rounded p-4 min-h-[160px]">
                    <p className="text-sm text-[#e7e7e7] leading-relaxed">
                      {result.response || 'Inget svar'}
                    </p>
                    {result.tokens && (
                      <div className="mt-3 pt-3 border-t border-[#1a1a1a] text-[10px] font-mono text-[#555]">
                        {result.tokens} tokens • {result.latency_ms?.toFixed(0)}ms
                      </div>
                    )}
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
  );
}
