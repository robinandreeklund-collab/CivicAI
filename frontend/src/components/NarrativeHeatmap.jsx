/**
 * NarrativeHeatmap Component
 * 
 * Visualizes narrative shifts over time using a heatmap:
 * - X-axis: Time periods
 * - Y-axis: Different narrative dimensions (sentiment, ideology, themes)
 * - Color intensity: Degree of change
 */

import React, { useState, useEffect } from 'react';

const NarrativeHeatmap = ({ question, models = [] }) => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState('sentiment');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHeatmapData();
  }, [question, models]);

  const loadHeatmapData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      // In production: await fetch(`/api/change-detection/heatmap?question=${encodeURIComponent(question)}`)
      const mockData = {
        timePeriods: [
          '2025-10-01',
          '2025-10-15',
          '2025-11-01',
          '2025-11-17',
        ],
        dimensions: {
          sentiment: {
            label: 'Sentiment',
            models: {
              'Grok': [0.0, 0.3, 0.5, 0.8],
              'GPT-4': [0.2, 0.2, 0.4, 0.6],
              'Gemini': [0.1, 0.4, 0.5, 0.7],
            },
          },
          ideology: {
            label: 'Ideologi',
            models: {
              'Grok': [0.0, 0.2, 0.6, 0.9],
              'GPT-4': [0.1, 0.3, 0.4, 0.5],
              'Gemini': [0.0, 0.3, 0.5, 0.6],
            },
          },
          themes: {
            label: 'Tematiska skiften',
            models: {
              'Grok': [0.0, 0.4, 0.6, 0.7],
              'GPT-4': [0.2, 0.3, 0.5, 0.6],
              'Gemini': [0.1, 0.2, 0.4, 0.8],
            },
          },
        },
      };

      setHeatmapData(mockData);
    } catch (error) {
      console.error('Failed to load heatmap data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorForValue = (value) => {
    // Convert 0-1 value to color intensity
    // 0 = green (no change), 1 = red (high change)
    if (value >= 0.7) {
      return 'bg-red-500 text-white';
    } else if (value >= 0.5) {
      return 'bg-orange-500 text-white';
    } else if (value >= 0.3) {
      return 'bg-yellow-500 text-black';
    } else if (value >= 0.1) {
      return 'bg-lime-500 text-black';
    } else {
      return 'bg-green-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Laddar heatmap...</p>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return null;
  }

  const currentDimensionData = heatmapData.dimensions[selectedDimension];

  return (
    <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🔥</span>
          Narrativ Heatmap
        </h3>
        <select
          value={selectedDimension}
          onChange={(e) => setSelectedDimension(e.target.value)}
          className="bg-civic-dark-900 text-white border border-civic-gray-700 rounded-lg px-3 py-2 text-sm"
        >
          {Object.entries(heatmapData.dimensions).map(([key, dim]) => (
            <option key={key} value={key}>
              {dim.label}
            </option>
          ))}
        </select>
      </div>

      {/* Question */}
      <div className="mb-4 text-sm text-civic-gray-400">
        <strong className="text-white">Fråga:</strong> {question}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Time period headers */}
          <div className="flex mb-2">
            <div className="w-32 flex-shrink-0"></div>
            {heatmapData.timePeriods.map((period, idx) => (
              <div
                key={idx}
                className="flex-1 min-w-24 text-center text-xs text-civic-gray-400 px-2"
              >
                {new Date(period).toLocaleDateString('sv-SE', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            ))}
          </div>

          {/* Model rows */}
          {Object.entries(currentDimensionData.models).map(([model, values]) => (
            <div key={model} className="flex mb-2">
              {/* Model label */}
              <div className="w-32 flex-shrink-0 text-sm text-white font-medium flex items-center">
                {model}
              </div>

              {/* Heatmap cells */}
              {values.map((value, idx) => (
                <div
                  key={idx}
                  className="flex-1 min-w-24 px-2"
                >
                  <div
                    className={`rounded-lg p-3 text-center transition-all hover:scale-105 ${getColorForValue(value)}`}
                    title={`${model} - ${heatmapData.timePeriods[idx]}: ${value.toFixed(2)}`}
                  >
                    <div className="text-sm font-bold">
                      {value.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-civic-gray-700">
        <div className="text-xs text-civic-gray-400 mb-2">Förändringsskala:</div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span className="text-xs text-civic-gray-400">0.0-0.1</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-lime-500 rounded"></div>
            <span className="text-xs text-civic-gray-400">0.1-0.3</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <span className="text-xs text-civic-gray-400">0.3-0.5</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <span className="text-xs text-civic-gray-400">0.5-0.7</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span className="text-xs text-civic-gray-400">0.7-1.0</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-4 bg-civic-dark-900/50 rounded-lg p-4">
        <div className="text-sm text-civic-gray-400 mb-2">📊 Insikter:</div>
        <ul className="text-sm text-white space-y-1 list-disc list-inside">
          <li>
            Högsta förändring: {Math.max(...Object.values(currentDimensionData.models).flat()).toFixed(2)}
          </li>
          <li>
            Mest stabila modellen:{' '}
            {Object.entries(currentDimensionData.models).reduce((a, b) =>
              Math.max(...a[1]) < Math.max(...b[1]) ? a : b
            )[0]}
          </li>
          <li>
            Mest föränderliga perioden:{' '}
            {heatmapData.timePeriods[
              Object.values(currentDimensionData.models)[0].indexOf(
                Math.max(
                  ...Object.values(currentDimensionData.models)
                    .map((vals, idx) => vals.reduce((sum, v) => sum + v, 0))
                )
              )
            ]}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default NarrativeHeatmap;
