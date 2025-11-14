import { useState } from 'react';

/**
 * EnhancedExportPanel Component
 * Export to PDF, README, YAML, and JSON
 */
export default function EnhancedExportPanel({ question, responses, synthesizedSummary, synthesizedSummaryMetadata, timestamp }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportFormat, setExportFormat] = useState('');

  const handleExport = async (format) => {
    if (!responses || responses.length === 0) {
      alert('Inga svar att exportera');
      return;
    }

    setIsExporting(true);
    setExportFormat(format);

    try {
      const exportData = {
        question,
        responses,
        synthesizedSummary,
        synthesizedSummaryMetadata,
        timestamp: timestamp || new Date().toISOString(),
      };

      let response;
      if (format === 'pdf' || format === 'readme') {
        // Use backend API for PDF and README
        response = await fetch(`/api/export/${format}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(exportData),
        });

        if (!response.ok) {
          throw new Error(`Failed to export as ${format.toUpperCase()}`);
        }

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const extension = format === 'pdf' ? 'pdf' : 'md';
        a.download = `civicai-export-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Client-side export for YAML and JSON
        let content, mimeType, extension;
        
        if (format === 'yaml') {
          // Use js-yaml if available, otherwise use simple format
          const yaml = await import('js-yaml');
          content = yaml.dump(exportData, { indent: 2, lineWidth: -1 });
          mimeType = 'text/yaml';
          extension = 'yaml';
        } else if (format === 'json') {
          content = JSON.stringify(exportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `civicai-export-${Date.now()}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error(`Error exporting as ${format}:`, error);
      alert(`Kunde inte exportera som ${format.toUpperCase()}. Försök igen.`);
    } finally {
      setIsExporting(false);
      setExportFormat('');
    }
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
          Exportera dina AI-svar och metadata till olika format för dokumentation, 
          versionshantering och djupare analys.
        </p>

        {/* Export formats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* YAML */}
          <button
            onClick={() => handleExport('yaml')}
            disabled={!hasData || isExporting}
            className="relative flex flex-col items-center space-y-2 px-4 py-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:border-blue-500/50 hover:bg-civic-dark-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-2xl">📄</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">YAML</p>
              <p className="text-xs text-gray-500">Strukturerad data</p>
            </div>
            {isExporting && exportFormat === 'yaml' && (
              <div className="absolute inset-0 flex items-center justify-center bg-civic-dark-700/80 rounded-xl">
                <svg className="animate-spin h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </button>

          {/* JSON */}
          <button
            onClick={() => handleExport('json')}
            disabled={!hasData || isExporting}
            className="relative flex flex-col items-center space-y-2 px-4 py-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:border-purple-500/50 hover:bg-civic-dark-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-2xl">📋</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">JSON</p>
              <p className="text-xs text-gray-500">API-format</p>
            </div>
            {isExporting && exportFormat === 'json' && (
              <div className="absolute inset-0 flex items-center justify-center bg-civic-dark-700/80 rounded-xl">
                <svg className="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </button>

          {/* README */}
          <button
            onClick={() => handleExport('readme')}
            disabled={!hasData || isExporting}
            className="relative flex flex-col items-center space-y-2 px-4 py-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:border-green-500/50 hover:bg-civic-dark-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-2xl">📝</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">README</p>
              <p className="text-xs text-gray-500">Markdown</p>
            </div>
            {isExporting && exportFormat === 'readme' && (
              <div className="absolute inset-0 flex items-center justify-center bg-civic-dark-700/80 rounded-xl">
                <svg className="animate-spin h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </button>

          {/* PDF */}
          <button
            onClick={() => handleExport('pdf')}
            disabled={!hasData || isExporting}
            className="relative flex flex-col items-center space-y-2 px-4 py-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:border-red-500/50 hover:bg-civic-dark-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <span className="text-2xl">📊</span>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-200">PDF</p>
              <p className="text-xs text-gray-500">Rapport</p>
            </div>
            {isExporting && exportFormat === 'pdf' && (
              <div className="absolute inset-0 flex items-center justify-center bg-civic-dark-700/80 rounded-xl">
                <svg className="animate-spin h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
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
