/**
 * IdeologicalClassificationPanel Component
 * 
 * Displays ideological classification results:
 * - Left-right-center overall score
 * - Dimensional scores (economic, social, authority)
 * - Political markers detected
 * - Party alignment suggestions
 * - Visual score bars
 */

import React, { useState } from 'react';

const IdeologicalClassificationPanel = ({ ideologyData }) => {
  const [showMarkers, setShowMarkers] = useState(false);
  const [showPartyAlignment, setShowPartyAlignment] = useState(false);

  if (!ideologyData || !ideologyData.ideology) {
    return null;
  }

  const { ideology, partyAlignment } = ideologyData;

  // Score to position conversion (for visual bar)
  const scoreToPosition = (score) => {
    // Convert -1 to 1 scale to 0 to 100 for CSS
    return ((score + 1) / 2) * 100;
  };

  // Get color based on classification - using civic colors
  const getClassificationColor = (classification) => {
    const colors = {
      left: 'text-civic-gray-300',
      right: 'text-civic-gray-300',
      center: 'text-civic-gray-400',
      progressive: 'text-civic-gray-300',
      conservative: 'text-civic-gray-300',
      libertarian: 'text-civic-gray-300',
      authoritarian: 'text-civic-gray-300',
      moderate: 'text-civic-gray-400',
      balanced: 'text-civic-gray-400',
    };
    return colors[classification] || 'text-civic-gray-400';
  };

  // Get classification badge - using civic colors
  const getClassificationBadge = (classification) => {
    const badges = {
      left: { text: 'Vänster', color: 'bg-civic-gray-500/20 text-civic-gray-300 border-civic-gray-500/50' },
      right: { text: 'Höger', color: 'bg-civic-gray-500/20 text-civic-gray-300 border-civic-gray-500/50' },
      center: { text: 'Center', color: 'bg-civic-gray-500/20 text-civic-gray-400 border-civic-gray-500/50' },
      far_left: { text: 'Långt Vänster', color: 'bg-civic-gray-600/20 text-civic-gray-300 border-civic-gray-600/50' },
      far_right: { text: 'Långt Höger', color: 'bg-civic-gray-600/20 text-civic-gray-300 border-civic-gray-600/50' },
      progressive_left: { text: 'Progressiv Vänster', color: 'bg-civic-gray-500/20 text-civic-gray-300 border-civic-gray-500/50' },
      conservative_right: { text: 'Konservativ Höger', color: 'bg-civic-gray-500/20 text-civic-gray-300 border-civic-gray-500/50' },
      center_moderate: { text: 'Moderat Center', color: 'bg-civic-gray-500/20 text-civic-gray-400 border-civic-gray-500/50' },
    };
    const badge = badges[classification] || badges.center;
    return (
      <span className={`px-3 py-1 rounded-full text-sm border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🏛️</span>
          Ideologisk Klassificering
        </h3>
        <div className="flex items-center gap-2">
          {getClassificationBadge(ideology.detailedClassification || ideology.classification)}
          <div className="text-sm text-civic-gray-400">
            Säkerhet: {Math.round(ideology.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Overall score bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-civic-gray-400">Vänster</span>
          <span className="text-sm text-white font-medium">
            Score: {ideology.overallScore}
          </span>
          <span className="text-sm text-civic-gray-300">Höger</span>
        </div>
        <div className="relative h-8 bg-gradient-to-r from-civic-gray-600 via-civic-gray-500 to-civic-gray-400 rounded-lg">
          {/* Position indicator */}
          <div
            className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
            style={{ left: `${scoreToPosition(ideology.overallScore)}%` }}
          >
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full"></div>
          </div>
          {/* Center line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30"></div>
        </div>
      </div>

      {/* Dimensional scores */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-semibold text-civic-gray-300">Dimensioner</h4>
        
        {/* Economic dimension */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-civic-gray-400">Ekonomisk</span>
            <span className={`text-sm font-medium ${getClassificationColor(ideology.dimensions.economic.classification)}`}>
              {ideology.dimensions.economic.classification}
            </span>
          </div>
          <div className="h-2 bg-civic-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-civic-gray-600 via-civic-gray-500 to-civic-gray-400"
              style={{ width: '100%' }}
            >
              <div
                className="h-full bg-white/50"
                style={{ width: `${scoreToPosition(ideology.dimensions.economic.score)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-civic-gray-500 mt-1">
            {ideology.dimensions.economic.description}
          </p>
        </div>

        {/* Social dimension */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-civic-gray-400">Social</span>
            <span className={`text-sm font-medium ${getClassificationColor(ideology.dimensions.social.classification)}`}>
              {ideology.dimensions.social.classification}
            </span>
          </div>
          <div className="h-2 bg-civic-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-civic-gray-600 via-civic-gray-500 to-civic-gray-400"
              style={{ width: '100%' }}
            >
              <div
                className="h-full bg-white/50"
                style={{ width: `${scoreToPosition(ideology.dimensions.social.score)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-civic-gray-500 mt-1">
            {ideology.dimensions.social.description}
          </p>
        </div>

        {/* Authority dimension */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-civic-gray-400">Auktoritet</span>
            <span className={`text-sm font-medium ${getClassificationColor(ideology.dimensions.authority.classification)}`}>
              {ideology.dimensions.authority.classification}
            </span>
          </div>
          <div className="h-2 bg-civic-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-civic-gray-600 via-civic-gray-500 to-civic-gray-400"
              style={{ width: '100%' }}
            >
              <div
                className="h-full bg-white/50"
                style={{ width: `${scoreToPosition(ideology.dimensions.authority.score)}%` }}
              ></div>
            </div>
          </div>
          <p className="text-xs text-civic-gray-500 mt-1">
            {ideology.dimensions.authority.description}
          </p>
        </div>
      </div>

      {/* Markers section */}
      <div className="mb-4">
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className="flex items-center justify-between w-full text-left text-sm font-semibold text-civic-gray-300 hover:text-white transition-colors"
        >
          <span>Politiska Markörer ({ideology.markerCount})</span>
          <span className={`transform transition-transform ${showMarkers ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {showMarkers && ideology.markers.length > 0 && (
          <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
            {ideology.markers.slice(0, 20).map((marker, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-civic-gray-400">{marker.keyword}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-civic-gray-500/20 text-civic-gray-300">
                  {marker.orientation}
                </span>
                <span className="text-xs text-civic-gray-500">{marker.dimension}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Party alignment section */}
      {partyAlignment && partyAlignment.suggestedParties.length > 0 && (
        <div>
          <button
            onClick={() => setShowPartyAlignment(!showPartyAlignment)}
            className="flex items-center justify-between w-full text-left text-sm font-semibold text-civic-gray-300 hover:text-white transition-colors"
          >
            <span>Partidöverenstämmelse</span>
            <span className={`transform transition-transform ${showPartyAlignment ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showPartyAlignment && (
            <div className="mt-3 space-y-2">
              {partyAlignment.suggestedParties.map((party, index) => (
                <div key={index} className="bg-civic-dark-900/50 rounded p-3 border border-civic-gray-700">
                  <div className="font-medium text-white">{party.name}</div>
                  <div className="text-xs text-civic-gray-400 mt-1">{party.description}</div>
                </div>
              ))}
              <p className="text-xs text-civic-gray-500 italic mt-2">
                {partyAlignment.disclaimer}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IdeologicalClassificationPanel;
