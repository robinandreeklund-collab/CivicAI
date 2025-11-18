/**
 * ReplayTimeline Component
 * 
 * Displays historical timeline of responses for a specific question and model:
 * - Timeline visualization of all responses
 * - Playback controls
 * - Comparison view between versions
 * - Change metrics at each point
 */

import React, { useState, useEffect } from 'react';

const ReplayTimeline = ({ question, model, onClose }) => {
  const [timeline, setTimeline] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIndex, setCompareIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load timeline data from API
    // In production, this would fetch from backend
    loadTimelineData();
  }, [question, model]);

  const loadTimelineData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      // In production: await fetch(`/api/change-detection/history?question=${encodeURIComponent(question)}&model=${model}`)
      const mockData = [
        {
          timestamp: '2025-10-01T10:00:00Z',
          response: 'Klimatpolitik är viktig för hållbar utveckling.',
          sentiment: 'neutral',
          ideology: 'center',
          version: '2025.10',
        },
        {
          timestamp: '2025-10-15T14:30:00Z',
          response: 'Klimatpolitik är mycket viktig och bör prioriteras.',
          sentiment: 'positiv',
          ideology: 'center',
          version: '2025.10.1',
          changeMetrics: {
            similarity: 0.78,
            severity: 0.35,
          },
        },
        {
          timestamp: '2025-11-17T09:15:00Z',
          response: 'Klimatpolitik är avgörande och bör prioriteras framför ekonomisk tillväxt.',
          sentiment: 'positiv',
          ideology: 'grön',
          version: '2025.11',
          changeMetrics: {
            similarity: 0.62,
            severity: 0.78,
          },
        },
      ];

      setTimeline(mockData);
      setSelectedIndex(mockData.length - 1); // Start with latest
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = () => {
    // Animate through timeline
    let index = 0;
    const interval = setInterval(() => {
      if (index < timeline.length - 1) {
        setSelectedIndex(++index);
      } else {
        clearInterval(interval);
      }
    }, 2000);
  };

  const selectedItem = timeline[selectedIndex];
  const compareItem = compareMode && compareIndex !== null ? timeline[compareIndex] : null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-civic-dark-800 rounded-lg p-8 max-w-4xl w-full mx-4">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Laddar historik...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-civic-dark-800 rounded-lg p-6 max-w-6xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>⏮</span>
            Replay Timeline - {model}
          </h2>
          <button
            onClick={onClose}
            className="text-civic-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Question */}
        <div className="mb-6 bg-civic-dark-900/50 rounded-lg p-4">
          <div className="text-sm text-civic-gray-400 mb-1">Fråga:</div>
          <div className="text-white">{question}</div>
        </div>

        {/* Timeline Visualization */}
        <div className="mb-6">
          <div className="relative">
            {/* Timeline bar */}
            <div className="h-2 bg-civic-gray-700 rounded-full relative">
              <div
                className="h-2 bg-civic-gray-400 rounded-full transition-all duration-300"
                style={{ width: `${((selectedIndex + 1) / timeline.length) * 100}%` }}
              ></div>
            </div>

            {/* Timeline points */}
            <div className="flex justify-between mt-2">
              {timeline.map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setSelectedIndex(idx)}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-all ${
                      idx === selectedIndex
                        ? 'bg-white border-white scale-125'
                        : 'bg-civic-dark-800 border-civic-gray-500 hover:border-white'
                    }`}
                  ></div>
                  <div className={`text-xs mt-2 ${idx === selectedIndex ? 'text-white font-semibold' : 'text-civic-gray-500'}`}>
                    {new Date(item.timestamp).toLocaleDateString('sv-SE')}
                  </div>
                  {item.version && (
                    <div className="text-xs text-civic-gray-600">v{item.version}</div>
                  )}
                  {item.changeMetrics && (
                    <div className="text-xs text-civic-gray-500 mt-1">
                      Δ {Math.round(item.changeMetrics.severity * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setSelectedIndex(Math.max(0, selectedIndex - 1))}
            disabled={selectedIndex === 0}
            className="px-4 py-2 bg-civic-gray-700 hover:bg-civic-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            ◀ Föregående
          </button>
          <button
            onClick={handlePlay}
            className="px-4 py-2 bg-civic-gray-700 hover:bg-civic-gray-600 text-white rounded-lg transition-colors"
          >
            ▶ Spela upp
          </button>
          <button
            onClick={() => setSelectedIndex(Math.min(timeline.length - 1, selectedIndex + 1))}
            disabled={selectedIndex === timeline.length - 1}
            className="px-4 py-2 bg-civic-gray-700 hover:bg-civic-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            Nästa ▶
          </button>
          <button
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode && selectedIndex > 0) {
                setCompareIndex(selectedIndex - 1);
              }
            }}
            className={`px-4 py-2 ${compareMode ? 'bg-civic-gray-600' : 'bg-civic-gray-700'} hover:bg-civic-gray-600 text-white rounded-lg transition-colors ml-auto`}
          >
            {compareMode ? '✓ Jämför' : 'Jämför'}
          </button>
        </div>

        {/* Content Display */}
        {compareMode && compareItem ? (
          /* Compare Mode - Side by side */
          <div className="grid grid-cols-2 gap-4">
            {/* Left: Compare item */}
            <div className="bg-civic-dark-900/50 rounded-lg p-4">
              <div className="text-sm text-civic-gray-400 mb-2">
                {new Date(compareItem.timestamp).toLocaleString('sv-SE')}
              </div>
              <div className="text-white mb-4">{compareItem.response}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-civic-gray-400">Sentiment:</span>
                  <span className="text-white ml-2">{compareItem.sentiment}</span>
                </div>
                <div>
                  <span className="text-civic-gray-400">Ideologi:</span>
                  <span className="text-white ml-2">{compareItem.ideology}</span>
                </div>
              </div>
            </div>

            {/* Right: Selected item */}
            <div className="bg-civic-dark-900/50 rounded-lg p-4 border-2 border-civic-gray-600">
              <div className="text-sm text-civic-gray-400 mb-2">
                {new Date(selectedItem.timestamp).toLocaleString('sv-SE')}
              </div>
              <div className="text-white mb-4">{selectedItem.response}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-civic-gray-400">Sentiment:</span>
                  <span className="text-white ml-2">{selectedItem.sentiment}</span>
                </div>
                <div>
                  <span className="text-civic-gray-400">Ideologi:</span>
                  <span className="text-white ml-2">{selectedItem.ideology}</span>
                </div>
              </div>
              {selectedItem.changeMetrics && (
                <div className="mt-4 pt-4 border-t border-civic-gray-700">
                  <div className="text-xs text-civic-gray-400 mb-2">Förändring:</div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-civic-gray-500">Likhet:</span>
                      <span className="text-white ml-2">{Math.round(selectedItem.changeMetrics.similarity * 100)}%</span>
                    </div>
                    <div>
                      <span className="text-civic-gray-500">Severity:</span>
                      <span className="text-white ml-2">{selectedItem.changeMetrics.severity.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Single View */
          <div className="bg-civic-dark-900/50 rounded-lg p-6">
            <div className="text-sm text-civic-gray-400 mb-2">
              {new Date(selectedItem.timestamp).toLocaleString('sv-SE')}
              {selectedItem.version && <span className="ml-4">Version: {selectedItem.version}</span>}
            </div>
            <div className="text-white text-lg mb-6">{selectedItem.response}</div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-civic-dark-800/50 rounded-lg p-3">
                <div className="text-xs text-civic-gray-400 mb-1">Sentiment</div>
                <div className="text-sm font-medium text-white">{selectedItem.sentiment}</div>
              </div>
              <div className="bg-civic-dark-800/50 rounded-lg p-3">
                <div className="text-xs text-civic-gray-400 mb-1">Ideologi</div>
                <div className="text-sm font-medium text-white">{selectedItem.ideology}</div>
              </div>
              {selectedItem.changeMetrics && (
                <>
                  <div className="bg-civic-dark-800/50 rounded-lg p-3">
                    <div className="text-xs text-civic-gray-400 mb-1">Textlikhet</div>
                    <div className="text-sm font-medium text-white">
                      {Math.round(selectedItem.changeMetrics.similarity * 100)}%
                    </div>
                  </div>
                  <div className="bg-civic-dark-800/50 rounded-lg p-3">
                    <div className="text-xs text-civic-gray-400 mb-1">Severity</div>
                    <div className="text-sm font-medium text-white">
                      {selectedItem.changeMetrics.severity.toFixed(2)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Timeline selector for compare mode */}
        {compareMode && (
          <div className="mt-4">
            <label className="text-sm text-civic-gray-400 block mb-2">
              Välj version att jämföra med:
            </label>
            <select
              value={compareIndex ?? ''}
              onChange={(e) => setCompareIndex(parseInt(e.target.value))}
              className="bg-civic-dark-900 text-white border border-civic-gray-700 rounded-lg px-3 py-2"
            >
              {timeline.map((item, idx) => (
                idx !== selectedIndex && (
                  <option key={idx} value={idx}>
                    {new Date(item.timestamp).toLocaleDateString('sv-SE')} - v{item.version || 'N/A'}
                  </option>
                )
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReplayTimeline;
