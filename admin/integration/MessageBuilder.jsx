/**
 * Message Builder Debugger for ONESEEK Δ+
 * Real-time prompt optimization and testing
 * 
 * Solves problems from PR #95:
 * - Self-referential loops ("Användare: / OneSeek:"-tags)
 * - Identity confusion
 * - Mixed language responses
 * 
 * Features:
 * - Build and test messages-structures in real-time
 * - Compare structures (clean vs with_memory)
 * - View raw model output
 * - Save best structure as default
 */

import React, { useState, useEffect, useCallback } from 'react';

// Helper to try multiple endpoints (proxy and direct)
const fetchWithFallback = async (path, options = {}) => {
  const endpoints = [
    `/api/ml${path}`,                    // Vite proxy
    `http://localhost:5000/api/ml${path}` // Direct ML service
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, options);
      if (response.ok) {
        return response;
      }
    } catch (err) {
      console.log(`Failed to fetch from ${endpoint}:`, err.message);
    }
  }
  throw new Error('All endpoints failed');
};

// Pre-defined structure templates
// "current" matches the active format in main branch
const STRUCTURE_TEMPLATES = {
  current: {
    name: "Current (Main)",
    description: "Aktiva formatet från main: {system_prompt}\\n\\nAnvändare: {user_message}\\n\\nOneSeek:",
    code: `current`,
    isDefault: true
  },
  clean: {
    name: "Clean",
    description: "Minimal structure without memory - pure system + user",
    code: `clean`
  },
  with_memory: {
    name: "With Memory",
    description: "Includes 5 previous messages from conversation history",
    code: `with_memory`
  },
  with_context: {
    name: "With Context",
    description: "Adds time, date, and season context to system prompt",
    code: `with_context`
  },
  no_tags: {
    name: "No Tags (Experimental)",
    description: "Plain text - WARNING: May cause model confusion (PR #95 issue)",
    code: `no_tags`
  },
  swedish_strict: {
    name: "Swedish Strict",
    description: "Forces Swedish-only responses with strict prompt",
    code: `swedish_strict`
  }
};

/**
 * MessageBuilder Component
 * Admin debugger for real-time prompt structure testing
 */
export default function MessageBuilder() {
  // State - "current" is the default (matches main branch format)
  const [selectedTemplate, setSelectedTemplate] = useState('current');
  const [customCode, setCustomCode] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [testQuestion, setTestQuestion] = useState('Vem är du?');
  const [systemPrompt, setSystemPrompt] = useState('Du är OneSeek-7B-Zero, en hjälpsam svensk AI-assistent.');
  const [history, setHistory] = useState([]);
  
  // Results state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [savedStructure, setSavedStructure] = useState(null);
  
  // Comparison state
  const [comparisonResults, setComparisonResults] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Load saved default structure on mount
  useEffect(() => {
    fetchDefaultStructure();
  }, []);

  const fetchDefaultStructure = async () => {
    try {
      const response = await fetchWithFallback('/debug/messages/default');
      const data = await response.json();
      if (data.default_structure) {
        setSavedStructure(data.default_structure);
      }
    } catch (err) {
      console.log('Could not fetch default structure:', err.message);
    }
  };

  // Test the current structure
  const handleTest = async () => {
    setLoading(true);
    setError(null);
    
    const code = useCustom ? customCode : STRUCTURE_TEMPLATES[selectedTemplate].code;
    
    try {
      const response = await fetchWithFallback('/debug/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structure_code: code,
          structure_name: useCustom ? 'custom' : selectedTemplate,
          system_prompt: systemPrompt,
          user_message: testQuestion,
          history: history
        })
      });
      
      const data = await response.json();
      setResult(data);
      
      // Add to comparison results
      if (data.success) {
        setComparisonResults(prev => [
          ...prev.filter(r => r.structure_name !== (useCustom ? 'custom' : selectedTemplate)),
          {
            structure_name: useCustom ? 'custom' : selectedTemplate,
            response: data.response,
            analysis: data.analysis,
            messages: data.messages,
            tokens: data.tokens,
            latency_ms: data.latency_ms
          }
        ]);
      }
    } catch (err) {
      setError(`Test failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save current structure as default
  const handleSaveAsDefault = async () => {
    const code = useCustom ? customCode : STRUCTURE_TEMPLATES[selectedTemplate].code;
    const name = useCustom ? 'custom' : selectedTemplate;
    
    try {
      const response = await fetchWithFallback('/debug/messages/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          code: code
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setSavedStructure(data.default_structure);
        setError(null);
      }
    } catch (err) {
      setError(`Could not save: ${err.message}`);
    }
  };

  // Clear comparison results
  const handleClearComparison = () => {
    setComparisonResults([]);
    setShowComparison(false);
  };

  // Render analysis metrics
  const renderAnalysis = (analysis) => {
    if (!analysis) return null;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3 bg-slate-700 rounded">
          <div className="text-xs text-slate-400">Svenska %</div>
          <div className={`text-lg font-bold ${analysis.swedish_percentage >= 90 ? 'text-green-400' : analysis.swedish_percentage >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {analysis.swedish_percentage}%
          </div>
        </div>
        <div className="p-3 bg-slate-700 rounded">
          <div className="text-xs text-slate-400">Förtroende</div>
          <div className={`text-lg font-bold ${analysis.estimated_confidence >= 80 ? 'text-green-400' : analysis.estimated_confidence >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
            {analysis.estimated_confidence}%
          </div>
        </div>
        <div className="p-3 bg-slate-700 rounded">
          <div className="text-xs text-slate-400">Loops?</div>
          <div className={`text-lg font-bold ${analysis.has_loops ? 'text-red-400' : 'text-green-400'}`}>
            {analysis.has_loops ? '⚠️ JA' : '✅ NEJ'}
          </div>
        </div>
        <div className="p-3 bg-slate-700 rounded">
          <div className="text-xs text-slate-400">Ord</div>
          <div className="text-lg font-bold text-blue-400">
            {analysis.word_count}
          </div>
        </div>
      </div>
    );
  };

  // Find best structure from comparison
  const getBestStructure = () => {
    if (comparisonResults.length === 0) return null;
    return comparisonResults.reduce((best, current) => {
      const bestConf = best.analysis?.estimated_confidence || 0;
      const currConf = current.analysis?.estimated_confidence || 0;
      return currConf > bestConf ? current : best;
    });
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🔧 Message Builder Debugger
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Testa och optimera messages-strukturer i realtid
          </p>
        </div>
        {savedStructure && (
          <div className="px-3 py-1 bg-green-900/30 border border-green-500/30 rounded text-green-400 text-xs">
            Default: {savedStructure.name}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500/30 rounded">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-300 text-sm underline mt-1"
          >
            Stäng
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left panel: Structure selection */}
        <div className="space-y-4">
          {/* Template selector */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Struktur
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STRUCTURE_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => { setSelectedTemplate(key); setUseCustom(false); }}
                  className={`px-3 py-2 rounded text-sm transition ${
                    !useCustom && selectedTemplate === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={template.description}
                >
                  {template.name}
                </button>
              ))}
              <button
                onClick={() => setUseCustom(true)}
                className={`px-3 py-2 rounded text-sm transition ${
                  useCustom
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                ✏️ Custom
              </button>
            </div>
          </div>

          {/* Structure description */}
          {!useCustom && (
            <div className="p-3 bg-slate-700/50 rounded text-sm text-slate-300">
              {STRUCTURE_TEMPLATES[selectedTemplate].description}
            </div>
          )}

          {/* Custom code editor */}
          {useCustom && (
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Custom kod (Python/JSON)
              </label>
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="w-full h-40 bg-slate-900 border border-slate-600 text-slate-200 font-mono text-sm p-3 rounded focus:outline-none focus:border-indigo-500"
                placeholder={STRUCTURE_TEMPLATES.clean.code}
              />
            </div>
          )}

          {/* System prompt */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="w-full h-24 bg-slate-900 border border-slate-600 text-slate-200 font-mono text-sm p-3 rounded focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Test question */}
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Testfråga
            </label>
            <input
              type="text"
              value={testQuestion}
              onChange={(e) => setTestQuestion(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 text-slate-200 font-mono text-sm p-3 rounded focus:outline-none focus:border-indigo-500"
              placeholder="Vem är du?"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {['Vem är du?', 'Hur många bor i Stockholm?', 'Vad är väder idag?'].map(q => (
                <button
                  key={q}
                  onClick={() => setTestQuestion(q)}
                  className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? '⏳ Testar...' : '🧪 Testa'}
            </button>
            <button
              onClick={handleSaveAsDefault}
              disabled={!result || !result.success}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition disabled:opacity-50"
              title="Spara som standardstruktur"
            >
              💾 Spara som default
            </button>
          </div>
        </div>

        {/* Right panel: Results */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Messages preview */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  📨 Messages ({result.messages?.length || 0})
                </h3>
                <div className="bg-slate-900 rounded p-3 max-h-40 overflow-y-auto">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {JSON.stringify(result.messages, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Model response */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  🤖 Modellsvar
                </h3>
                <div className="bg-slate-900 rounded p-3">
                  <p className="text-slate-200 whitespace-pre-wrap">
                    {result.response || 'Inget svar'}
                  </p>
                </div>
                {result.tokens && (
                  <div className="text-xs text-slate-400 mt-1">
                    Tokens: {result.tokens} | Latens: {result.latency_ms?.toFixed(0)}ms
                  </div>
                )}
              </div>

              {/* Analysis metrics */}
              {result.analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    📊 Analys
                  </h3>
                  {renderAnalysis(result.analysis)}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🧪</div>
                <p>Välj en struktur och klicka "Testa"</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison section */}
      {comparisonResults.length > 1 && (
        <div className="mt-6 border-t border-slate-600 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              📊 Jämförelse ({comparisonResults.length} strukturer)
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowComparison(!showComparison)}
                className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
              >
                {showComparison ? 'Dölj' : 'Visa'}
              </button>
              <button
                onClick={handleClearComparison}
                className="px-3 py-1 bg-red-900/30 text-red-400 rounded text-sm hover:bg-red-900/50"
              >
                Rensa
              </button>
            </div>
          </div>

          {showComparison && (
            <div className="space-y-4">
              {/* Best recommendation */}
              {getBestStructure() && (
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded">
                  <p className="text-green-400">
                    ✅ <strong>Rekommendation:</strong> Använd "{getBestStructure().structure_name}" 
                    (Förtroende: {getBestStructure().analysis?.estimated_confidence}%, 
                    Svenska: {getBestStructure().analysis?.swedish_percentage}%)
                  </p>
                </div>
              )}

              {/* Results table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left p-2 text-slate-300">Struktur</th>
                      <th className="text-center p-2 text-slate-300">Svenska %</th>
                      <th className="text-center p-2 text-slate-300">Förtroende</th>
                      <th className="text-center p-2 text-slate-300">Loops</th>
                      <th className="text-center p-2 text-slate-300">Ord</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResults.map((r, idx) => (
                      <tr key={idx} className="border-b border-slate-700">
                        <td className="p-2 text-white">{r.structure_name}</td>
                        <td className={`p-2 text-center ${
                          r.analysis?.swedish_percentage >= 90 ? 'text-green-400' : 
                          r.analysis?.swedish_percentage >= 70 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {r.analysis?.swedish_percentage}%
                        </td>
                        <td className={`p-2 text-center ${
                          r.analysis?.estimated_confidence >= 80 ? 'text-green-400' : 
                          r.analysis?.estimated_confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {r.analysis?.estimated_confidence}%
                        </td>
                        <td className={`p-2 text-center ${r.analysis?.has_loops ? 'text-red-400' : 'text-green-400'}`}>
                          {r.analysis?.has_loops ? '⚠️' : '✅'}
                        </td>
                        <td className="p-2 text-center text-slate-300">{r.analysis?.word_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info footer */}
      <div className="mt-6 p-4 bg-slate-700/30 rounded text-xs text-slate-400">
        <p>
          💡 <strong>Tips:</strong> Testa flera strukturer och jämför resultaten. 
          Strukturen "Clean" fungerar bäst för enkla frågor, medan "With Memory" är bättre 
          för uppföljningsfrågor. Undvik "No Tags" då det kan orsaka modellförvirring (PR #95).
        </p>
      </div>
    </div>
  );
}
