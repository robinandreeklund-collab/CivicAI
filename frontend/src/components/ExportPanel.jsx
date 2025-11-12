import { useState } from 'react';
import yaml from 'js-yaml';

/**
 * ExportPanel Component
 * Modern export panel with animations and visual feedback
 */
export default function ExportPanel({ question, responses, metadata }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportYAML = async () => {
    if (!responses || responses.length === 0) {
      return;
    }

    setIsExporting(true);

    // Simulate export processing for better UX
    await new Promise(resolve => setTimeout(resolve, 800));

    // Prepare data structure for YAML export
    const exportData = {
      question: question,
      timestamp: new Date().toISOString(),
      responses: responses.map(({ agent, response, metadata }) => ({
        agent: agent,
        model: metadata?.model || agent,
        response: response,
        timestamp: metadata?.timestamp || new Date().toISOString(),
      })),
      metadata: {
        exported_at: new Date().toISOString(),
        version: '0.1.0',
        tool: 'CivicAI',
      }
    };

    // Convert to YAML
    const yamlContent = yaml.dump(exportData, {
      indent: 2,
      lineWidth: -1,
    });

    // Create download link
    const blob = new Blob([yamlContent], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civicai-export-${Date.now()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setIsExporting(false);
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 3000);
  };

  const hasData = responses && responses.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 animate-fade-in-up relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl"></div>
      
      {/* Main content */}
      <div className="relative backdrop-blur-sm bg-civic-dark-800/50 rounded-2xl border border-green-500/20 p-8 shadow-2xl">
        {/* Header with icon */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg shadow-green-500/30 animate-bounce-slow">
            📦
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">Exportera jämförelse</h2>
            <p className="text-sm text-gray-400">Spara dina AI-svar för senare analys</p>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-300 mb-6 leading-relaxed">
          Exportera dina AI-svar och metadata till <span className="font-semibold text-green-400">YAML-format</span> för 
          dokumentation, versionshantering och djupare analys.
        </p>

        {/* Export formats (for future expansion) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600">
            <span className="text-2xl">📄</span>
            <div>
              <p className="text-sm font-semibold text-gray-200">YAML</p>
              <p className="text-xs text-gray-500">Strukturerad data</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-civic-dark-700/30 border border-civic-dark-600 opacity-50">
            <span className="text-2xl">📝</span>
            <div>
              <p className="text-sm font-semibold text-gray-400">Markdown</p>
              <p className="text-xs text-gray-500">Kommer snart</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-civic-dark-700/30 border border-civic-dark-600 opacity-50">
            <span className="text-2xl">📊</span>
            <div>
              <p className="text-sm font-semibold text-gray-400">PDF</p>
              <p className="text-xs text-gray-500">Kommer snart</p>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleExportYAML}
            disabled={!hasData || isExporting}
            className={`
              flex-1 px-6 py-4 font-semibold rounded-xl
              transition-all duration-300 ease-out
              disabled:opacity-50 disabled:cursor-not-allowed
              relative overflow-hidden group
              ${exportSuccess 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'
              }
              ${isExporting ? 'animate-pulse' : 'hover:scale-105 active:scale-95'}
            `}
          >
            <span className="relative z-10 flex items-center justify-center space-x-2 text-white">
              {isExporting ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Förbereder export...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <span className="text-2xl">✓</span>
                  <span>Exporterad!</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Exportera till YAML</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">↓</span>
                </>
              )}
            </span>
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"></div>
            </div>
          </button>
        </div>

        {/* Info message */}
        {!hasData && (
          <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500 animate-fade-in">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Ställ en fråga först för att aktivera export</span>
          </div>
        )}

        {/* Success message */}
        {exportSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-green-500/20 border border-green-500/40 animate-fade-in">
            <p className="text-sm text-green-300 flex items-center space-x-2">
              <span className="text-xl">✓</span>
              <span>Filen har laddats ner till din enhet</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
