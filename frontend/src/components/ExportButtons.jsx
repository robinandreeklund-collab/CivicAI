import { useState } from 'react';
import yaml from 'js-yaml';

/**
 * ExportButtons Component
 * Compact export icons in the header like Copilot/Grok
 */
export default function ExportButtons({ messages }) {
  const [showTooltip, setShowTooltip] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  const handleExportYAML = async () => {
    if (!messages || messages.length === 0) return;

    // Prepare export data from all AI messages
    const exportData = {
      conversations: messages.map(msg => ({
        question: msg.question,
        timestamp: msg.timestamp,
        responses: msg.responses.map(({ agent, response, metadata }) => ({
          agent: agent,
          model: metadata?.model || agent,
          response: response,
          timestamp: metadata?.timestamp || new Date().toISOString(),
        })),
      })),
      metadata: {
        exported_at: new Date().toISOString(),
        version: '0.1.0',
        tool: 'OneSeek.AI',
        total_conversations: messages.length,
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
    a.download = `oneseek-ai-chat-${Date.now()}.yaml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  const handleExportJSON = () => {
    if (!messages || messages.length === 0) return;

    const exportData = {
      conversations: messages.map(msg => ({
        question: msg.question,
        timestamp: msg.timestamp,
        responses: msg.responses,
      })),
      metadata: {
        exported_at: new Date().toISOString(),
        version: '0.1.0',
        tool: 'OneSeek.AI',
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oneseek-ai-chat-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  return (
    <div className="flex items-center space-x-2 animate-fade-in">
      {/* YAML Export */}
      <div className="relative">
        <button
          onClick={handleExportYAML}
          onMouseEnter={() => setShowTooltip('yaml')}
          onMouseLeave={() => setShowTooltip(null)}
          className="w-9 h-9 rounded-lg bg-civic-dark-700/50 hover:bg-civic-dark-600 flex items-center justify-center transition-all duration-200 hover:scale-110 group border border-civic-dark-600 hover:border-blue-500/30"
          title="Exportera som YAML"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
        {showTooltip === 'yaml' && (
          <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-civic-dark-700 text-gray-200 text-xs rounded-md whitespace-nowrap shadow-lg border border-civic-dark-600 animate-fade-in">
            YAML
          </div>
        )}
      </div>

      {/* JSON Export */}
      <div className="relative">
        <button
          onClick={handleExportJSON}
          onMouseEnter={() => setShowTooltip('json')}
          onMouseLeave={() => setShowTooltip(null)}
          className="w-9 h-9 rounded-lg bg-civic-dark-700/50 hover:bg-civic-dark-600 flex items-center justify-center transition-all duration-200 hover:scale-110 group border border-civic-dark-600 hover:border-purple-500/30"
          title="Exportera som JSON"
        >
          <svg className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>
        {showTooltip === 'json' && (
          <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-civic-dark-700 text-gray-200 text-xs rounded-md whitespace-nowrap shadow-lg border border-civic-dark-600 animate-fade-in">
            JSON
          </div>
        )}
      </div>

      {/* Success indicator */}
      {exportSuccess && (
        <div className="absolute top-full mt-2 right-0 px-3 py-2 bg-green-500/20 text-green-300 text-xs rounded-lg border border-green-500/40 animate-fade-in shadow-lg">
          ✓ Exporterad!
        </div>
      )}
    </div>
  );
}
