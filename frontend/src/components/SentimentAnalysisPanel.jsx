/**
 * SentimentAnalysisPanel Component
 * 
 * Displays comprehensive sentiment analysis:
 * - VADER sentiment scores with visual breakdown
 * - Sarcasm detection indicators
 * - Aggression detection indicators
 * - Empathy detection indicators
 * - Overall emotional tone
 */

import React from 'react';

const SentimentAnalysisPanel = ({ sentimentData }) => {
  if (!sentimentData) {
    return null;
  }

  const {
    vaderSentiment,
    sarcasmDetection,
    aggressionDetection,
    empathyDetection,
    overallTone,
  } = sentimentData;

  // Get sentiment color
  const getSentimentColor = (classification) => {
    const colors = {
      positive: 'text-green-400',
      negative: 'text-red-400',
      neutral: 'text-gray-400',
    };
    return colors[classification] || 'text-gray-400';
  };

  // Get intensity badge
  const getIntensityBadge = (intensity) => {
    const badges = {
      high: { text: 'Hög', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      medium: { text: 'Medel', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      low: { text: 'Låg', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
    };
    const badge = badges[intensity] || badges.low;
    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // Get level badge
  const getLevelBadge = (level) => {
    const badges = {
      high: { text: 'Hög', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
      medium: { text: 'Medel', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' },
      low: { text: 'Låg', color: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
      none: { text: 'Ingen', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
    };
    const badge = badges[level] || badges.none;
    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>💭</span>
          Sentimentanalys
        </h3>
        <div className="text-sm text-gray-400">
          Övergripande ton: <span className="text-white font-medium">{overallTone}</span>
        </div>
      </div>

      {/* VADER Sentiment Scores */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3">VADER Sentiment</h4>
        
        {/* Classification */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-400">Klassificering:</span>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${getSentimentColor(vaderSentiment.classification)}`}>
              {vaderSentiment.classification === 'positive' ? 'Positiv' :
               vaderSentiment.classification === 'negative' ? 'Negativ' : 'Neutral'}
            </span>
            {getIntensityBadge(vaderSentiment.intensity)}
          </div>
        </div>

        {/* Score bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1 text-xs">
            <span className="text-red-400">Negativ</span>
            <span className="text-gray-400">Comparative: {vaderSentiment.comparative.toFixed(3)}</span>
            <span className="text-green-400">Positiv</span>
          </div>
          <div className="relative h-6 bg-gray-700 rounded-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-gray-600 to-green-600"></div>
            {/* Position indicator */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
              style={{ left: `${((vaderSentiment.comparative + 1) / 2) * 100}%` }}
            >
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-green-500/10 rounded p-2 border border-green-500/30">
            <div className="text-xs text-gray-400">Positiv</div>
            <div className="text-lg font-semibold text-green-400">
              {Math.round(vaderSentiment.positiveScore * 100)}%
            </div>
          </div>
          <div className="bg-gray-500/10 rounded p-2 border border-gray-500/30">
            <div className="text-xs text-gray-400">Neutral</div>
            <div className="text-lg font-semibold text-gray-400">
              {Math.round(vaderSentiment.neutralScore * 100)}%
            </div>
          </div>
          <div className="bg-red-500/10 rounded p-2 border border-red-500/30">
            <div className="text-xs text-gray-400">Negativ</div>
            <div className="text-lg font-semibold text-red-400">
              {Math.round(vaderSentiment.negativeScore * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Emotional Indicators */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-300">Känslomässiga Indikatorer</h4>

        {/* Sarcasm */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">😏</span>
              <span className="text-sm font-medium text-white">Sarkasm</span>
            </div>
            <div className="flex items-center gap-2">
              {sarcasmDetection.isSarcastic && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 px-2 py-0.5 rounded">
                  Detekterat
                </span>
              )}
              <span className="text-xs text-gray-400">
                Säkerhet: {Math.round(sarcasmDetection.confidence * 100)}%
              </span>
            </div>
          </div>
          {sarcasmDetection.isSarcastic && sarcasmDetection.sarcasticIndicators.length > 0 && (
            <div className="mt-2 text-xs text-gray-400">
              Indikatorer: {sarcasmDetection.sarcasticIndicators.map(i => i.type).join(', ')}
            </div>
          )}
        </div>

        {/* Aggression */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">😠</span>
              <span className="text-sm font-medium text-white">Aggression</span>
            </div>
            <div className="flex items-center gap-2">
              {getLevelBadge(aggressionDetection.level)}
              <span className="text-xs text-gray-400">
                Poäng: {aggressionDetection.score}
              </span>
            </div>
          </div>
          {aggressionDetection.isAggressive && aggressionDetection.aggressiveIndicators.length > 0 && (
            <div className="mt-2 space-y-1">
              {aggressionDetection.aggressiveIndicators.slice(0, 3).map((indicator, index) => (
                <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className={`px-1 rounded ${
                    indicator.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                    indicator.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {indicator.type}
                  </span>
                  <span>{indicator.keyword}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empathy */}
        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">💚</span>
              <span className="text-sm font-medium text-white">Empati</span>
            </div>
            <div className="flex items-center gap-2">
              {getLevelBadge(empathyDetection.level)}
              <span className="text-xs text-gray-400">
                Poäng: {empathyDetection.score}
              </span>
            </div>
          </div>
          {empathyDetection.isEmpathetic && empathyDetection.empatheticIndicators.length > 0 && (
            <div className="mt-2 space-y-1">
              {empathyDetection.empatheticIndicators.slice(0, 3).map((indicator, index) => (
                <div key={index} className="text-xs text-gray-400 flex items-center gap-2">
                  <span className="px-1 rounded bg-green-500/20 text-green-400">
                    {indicator.type}
                  </span>
                  <span>{indicator.keyword}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SentimentAnalysisPanel;
