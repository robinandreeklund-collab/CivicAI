import { useState } from 'react';

/**
 * ProvenanceTag Component
 * Displays the provenance (source, model, version, method) of a datapoint
 * for transparency and traceability
 */
export default function ProvenanceTag({ provenance }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!provenance) {
    return null;
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[10px] text-civic-gray-600 hover:text-civic-gray-500 transition-colors"
      >
        <svg 
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span>Källa & Metod</span>
      </button>

      {isExpanded && (
        <div className="mt-2 pl-4 space-y-1 text-[10px] text-civic-gray-600 border-l-2 border-civic-dark-700">
          {provenance.model && (
            <div className="flex gap-2">
              <span className="text-civic-gray-700 font-medium">Modell:</span>
              <span>{provenance.model}</span>
            </div>
          )}
          
          {provenance.version && (
            <div className="flex gap-2">
              <span className="text-civic-gray-700 font-medium">Version:</span>
              <span>{provenance.version}</span>
            </div>
          )}
          
          {provenance.method && (
            <div className="flex gap-2">
              <span className="text-civic-gray-700 font-medium">Metod:</span>
              <span>{provenance.method}</span>
            </div>
          )}
          
          {provenance.timestamp && (
            <div className="flex gap-2">
              <span className="text-civic-gray-700 font-medium">Tidsstämpel:</span>
              <span>{new Date(provenance.timestamp).toLocaleString('sv-SE')}</span>
            </div>
          )}

          {provenance.error && (
            <div className="flex gap-2 text-red-400">
              <span className="text-red-500 font-medium">Fel:</span>
              <span>{provenance.error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
