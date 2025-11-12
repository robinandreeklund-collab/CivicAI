import yaml from 'js-yaml';

/**
 * ExportPanel Component
 * Allows users to export AI comparison data to YAML format
 */
export default function ExportPanel({ question, responses, metadata }) {
  const handleExportYAML = () => {
    if (!responses || responses.length === 0) {
      alert('Inga svar att exportera ännu. Ställ en fråga först.');
      return;
    }

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
      lineWidth: -1, // Don't wrap lines
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
  };

  const hasData = responses && responses.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-civic-dark-800 rounded-lg border border-civic-dark-600">
      <h2 className="text-xl font-semibold text-gray-100 mb-4">Exportera jämförelse</h2>
      <p className="text-gray-400 mb-4 text-sm">
        Exportera dina AI-svar och metadata till YAML-format för dokumentation och analys.
      </p>
      <button
        onClick={handleExportYAML}
        disabled={!hasData}
        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Exportera till YAML
      </button>
      {!hasData && (
        <p className="text-gray-500 text-sm mt-2">
          Ställ en fråga först för att aktivera export.
        </p>
      )}
    </div>
  );
}
