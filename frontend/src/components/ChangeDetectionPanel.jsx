/**
 * ChangeDetectionPanel Component
 * 
 * Displays change detection analysis directly in chat view:
 * - Model and version information
 * - Text similarity score
 * - Sentiment and ideology shifts
 * - Change severity index with visual indicator
 * - Bias drift tracking
 * - Explainability delta
 * - Dominant themes
 * - Ethical impact tagging
 * - Link to transparency ledger block
 * - Replay timeline button
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ChangeDetectionPanel = ({ changeData, onOpenLedger, onOpenReplay, firebaseDocId }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (!changeData) {
    return null;
  }

  const {
    model,
    model_version,
    previous_response,
    current_response,
    change_metrics,
    ledger_block_id,
  } = changeData;

  const {
    text_similarity,
    sentiment_shift,
    ideology_shift,
    severity_index,
    bias_drift,
    dominant_themes,
    explainability_delta,
    ethical_tag,
  } = change_metrics || {};

  // Get severity badge color and text
  const getSeverityBadge = () => {
    if (severity_index >= 0.7) {
      return {
        color: 'bg-red-500/20 text-red-400 border-red-500/50',
        icon: '🔴',
        text: 'Stor förändring',
      };
    } else if (severity_index >= 0.4) {
      return {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        icon: '🟡',
        text: 'Måttlig förändring',
      };
    } else {
      return {
        color: 'bg-green-500/20 text-green-400 border-green-500/50',
        icon: '🟢',
        text: 'Mindre förändring',
      };
    }
  };

  const severityBadge = getSeverityBadge();

  // Get ethical tag color
  const getEthicalTagColor = () => {
    switch (ethical_tag) {
      case 'Etiskt relevant':
        return 'text-red-400';
      case 'Risk för bias':
        return 'text-yellow-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📊</span>
          Förändringsanalys upptäckt
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm border ${severityBadge.color} flex items-center gap-1`}>
            <span>{severityBadge.icon}</span>
            {severityBadge.text}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-civic-gray-400 hover:text-white transition-colors"
          >
            {expanded ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {/* Model Info */}
      <div className="mb-4">
        <div className="text-sm text-civic-gray-400">
          <strong className="text-white">Modell:</strong> {model}
          {model_version && (
            <span className="ml-2 text-civic-gray-500">v{model_version}</span>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {/* Text Similarity */}
        <div className="bg-civic-dark-900/50 rounded-lg p-3">
          <div className="text-xs text-civic-gray-400 mb-1">Textlikhet</div>
          <div className="text-xl font-bold text-white">
            {Math.round(text_similarity * 100)}%
          </div>
        </div>

        {/* Severity Index */}
        <div className="bg-civic-dark-900/50 rounded-lg p-3">
          <div className="text-xs text-civic-gray-400 mb-1">Severity Index</div>
          <div className="text-xl font-bold text-white">
            {severity_index?.toFixed(2)}
          </div>
        </div>

        {/* Sentiment Shift */}
        <div className="bg-civic-dark-900/50 rounded-lg p-3">
          <div className="text-xs text-civic-gray-400 mb-1">Sentiment</div>
          <div className="text-sm font-medium text-white">
            {sentiment_shift}
          </div>
        </div>

        {/* Ideology Shift */}
        <div className="bg-civic-dark-900/50 rounded-lg p-3">
          <div className="text-xs text-civic-gray-400 mb-1">Ideologi</div>
          <div className="text-sm font-medium text-white">
            {ideology_shift}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="space-y-4 mt-4 pt-4 border-t border-civic-gray-700">
          {/* Previous vs Current Response */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Tidigare svar ({previous_response?.timestamp?.slice(0, 10)}):
              </div>
              <div className="bg-civic-dark-900/50 rounded-lg p-3 text-sm text-civic-gray-300 max-h-32 overflow-y-auto">
                {previous_response?.text}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Nuvarande svar ({current_response?.timestamp?.slice(0, 10)}):
              </div>
              <div className="bg-civic-dark-900/50 rounded-lg p-3 text-sm text-civic-gray-300 max-h-32 overflow-y-auto">
                {current_response?.text}
              </div>
            </div>
          </div>

          {/* Bias Drift */}
          {bias_drift && (
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Bias Drift:
              </div>
              <div className="text-sm text-white">{bias_drift}</div>
            </div>
          )}

          {/* Explainability Delta */}
          {explainability_delta && explainability_delta.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Explainability Delta:
              </div>
              <ul className="list-disc list-inside text-sm text-white space-y-1">
                {explainability_delta.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Dominant Themes */}
          {dominant_themes && dominant_themes.length > 0 && (
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Dominant Themes:
              </div>
              <div className="flex flex-wrap gap-2">
                {dominant_themes.map((theme, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-civic-gray-700/50 text-civic-gray-300 rounded-full text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ethical Tag */}
          {ethical_tag && (
            <div>
              <div className="text-sm font-semibold text-civic-gray-400 mb-2">
                Ethical Impact:
              </div>
              <div className={`text-sm font-medium ${getEthicalTagColor()}`}>
                {ethical_tag}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {ledger_block_id !== undefined && (
              <button
                onClick={() => {
                  // Navigate to dedicated ledger page
                  if (firebaseDocId) {
                    navigate(`/ledger?doc=${firebaseDocId}&block=${ledger_block_id}`);
                  } else if (onOpenLedger) {
                    onOpenLedger(ledger_block_id);
                  }
                }}
                className="px-4 py-2 bg-civic-gray-700 hover:bg-civic-gray-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <span>🔗</span>
                Visa i Ledger
              </button>
            )}
            {onOpenReplay && (
              <button
                onClick={() => onOpenReplay(changeData)}
                className="px-4 py-2 bg-civic-gray-700 hover:bg-civic-gray-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <span>⏮</span>
                Replay Historik
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeDetectionPanel;
