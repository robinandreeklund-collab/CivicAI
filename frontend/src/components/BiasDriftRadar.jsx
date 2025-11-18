/**
 * BiasDriftRadar Component
 * 
 * Visualizes bias drift over time using a radar chart:
 * - Multiple bias dimensions (positivity, normative language, political leaning)
 * - Comparison across different time periods
 * - Multi-model comparison
 */

import React, { useState, useEffect } from 'react';

const BiasDriftRadar = ({ question, model }) => {
  const [radarData, setRadarData] = useState(null);
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRadarData();
  }, [question, model]);

  const loadRadarData = async () => {
    setIsLoading(true);
    try {
      // Mock data for demonstration
      // In production: await fetch(`/api/change-detection/bias-drift?question=${encodeURIComponent(question)}&model=${model}`)
      const mockData = {
        dimensions: [
          'Positivitet',
          'Normativ',
          'Vänster',
          'Höger',
          'Grön',
          'Emotionell',
        ],
        periods: [
          {
            label: '2025-10-01',
            timestamp: '2025-10-01T10:00:00Z',
            values: [0.3, 0.2, 0.4, 0.3, 0.2, 0.2],
          },
          {
            label: '2025-10-15',
            timestamp: '2025-10-15T14:30:00Z',
            values: [0.5, 0.4, 0.5, 0.3, 0.4, 0.3],
          },
          {
            label: '2025-11-17',
            timestamp: '2025-11-17T09:15:00Z',
            values: [0.7, 0.6, 0.6, 0.2, 0.7, 0.5],
          },
        ],
      };

      setRadarData(mockData);
      // Select first and last by default
      setSelectedPeriods([0, mockData.periods.length - 1]);
    } catch (error) {
      console.error('Failed to load radar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const generateRadarPath = (values, centerX, centerY, maxRadius) => {
    const numPoints = values.length;
    const angleStep = 360 / numPoints;

    const points = values.map((value, idx) => {
      const angle = idx * angleStep;
      const radius = value * maxRadius;
      return polarToCartesian(centerX, centerY, radius, angle);
    });

    // Create SVG path
    const pathData = points
      .map((point, idx) => `${idx === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ') + ' Z';

    return pathData;
  };

  const getPeriodColor = (index) => {
    const colors = [
      { fill: 'rgba(59, 130, 246, 0.3)', stroke: 'rgb(59, 130, 246)' }, // blue
      { fill: 'rgba(239, 68, 68, 0.3)', stroke: 'rgb(239, 68, 68)' }, // red
      { fill: 'rgba(34, 197, 94, 0.3)', stroke: 'rgb(34, 197, 94)' }, // green
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          <p>Laddar bias drift...</p>
        </div>
      </div>
    );
  }

  if (!radarData) {
    return null;
  }

  const svgSize = 400;
  const centerX = svgSize / 2;
  const centerY = svgSize / 2;
  const maxRadius = svgSize / 2 - 60;

  return (
    <div className="bg-civic-dark-800/50 rounded-lg p-6 border border-civic-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>📡</span>
          Bias Drift Radar - {model}
        </h3>
      </div>

      {/* Question */}
      <div className="mb-4 text-sm text-civic-gray-400">
        <strong className="text-white">Fråga:</strong> {question}
      </div>

      {/* Radar Chart */}
      <div className="flex justify-center mb-6">
        <svg width={svgSize} height={svgSize} className="overflow-visible">
          {/* Background circles */}
          {[0.25, 0.5, 0.75, 1.0].map((scale) => (
            <circle
              key={scale}
              cx={centerX}
              cy={centerY}
              r={maxRadius * scale}
              fill="none"
              stroke="rgba(156, 163, 175, 0.2)"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          {radarData.dimensions.map((dimension, idx) => {
            const angle = (idx * 360) / radarData.dimensions.length;
            const point = polarToCartesian(centerX, centerY, maxRadius, angle);
            return (
              <g key={dimension}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={point.x}
                  y2={point.y}
                  stroke="rgba(156, 163, 175, 0.3)"
                  strokeWidth="1"
                />
                <text
                  x={point.x + (point.x - centerX) * 0.15}
                  y={point.y + (point.y - centerY) * 0.15}
                  textAnchor="middle"
                  fill="white"
                  fontSize="12"
                  className="select-none"
                >
                  {dimension}
                </text>
              </g>
            );
          })}

          {/* Data polygons */}
          {selectedPeriods.map((periodIdx) => {
            const period = radarData.periods[periodIdx];
            const color = getPeriodColor(selectedPeriods.indexOf(periodIdx));
            const path = generateRadarPath(
              period.values,
              centerX,
              centerY,
              maxRadius
            );

            return (
              <g key={periodIdx}>
                <path
                  d={path}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth="2"
                />
                {/* Data points */}
                {period.values.map((value, idx) => {
                  const angle = (idx * 360) / radarData.dimensions.length;
                  const radius = value * maxRadius;
                  const point = polarToCartesian(centerX, centerY, radius, angle);
                  return (
                    <circle
                      key={idx}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill={color.stroke}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <div className="text-sm text-civic-gray-400 mb-2">Välj perioder att jämföra:</div>
        <div className="space-y-2">
          {radarData.periods.map((period, idx) => {
            const isSelected = selectedPeriods.includes(idx);
            const color = isSelected
              ? getPeriodColor(selectedPeriods.indexOf(idx))
              : null;

            return (
              <label
                key={idx}
                className="flex items-center gap-2 cursor-pointer hover:bg-civic-dark-900/50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      if (selectedPeriods.length < 3) {
                        setSelectedPeriods([...selectedPeriods, idx]);
                      }
                    } else {
                      setSelectedPeriods(selectedPeriods.filter((i) => i !== idx));
                    }
                  }}
                  className="w-4 h-4"
                />
                {isSelected && color && (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color.stroke }}
                  ></div>
                )}
                <span className="text-white text-sm">
                  {new Date(period.timestamp).toLocaleDateString('sv-SE')}
                </span>
              </label>
            );
          })}
        </div>
        <div className="text-xs text-civic-gray-500 mt-2">
          Välj upp till 3 perioder
        </div>
      </div>

      {/* Bias Analysis */}
      {selectedPeriods.length >= 2 && (
        <div className="bg-civic-dark-900/50 rounded-lg p-4">
          <div className="text-sm text-civic-gray-400 mb-3">📊 Bias Drift Analys:</div>
          <div className="space-y-2">
            {radarData.dimensions.map((dimension, dimIdx) => {
              const firstPeriod = radarData.periods[selectedPeriods[0]];
              const lastPeriod = radarData.periods[selectedPeriods[selectedPeriods.length - 1]];
              const change = lastPeriod.values[dimIdx] - firstPeriod.values[dimIdx];
              const changePercent = Math.round(change * 100);

              return (
                <div key={dimension} className="flex justify-between items-center">
                  <span className="text-sm text-white">{dimension}:</span>
                  <span
                    className={`text-sm font-medium ${
                      change > 0.2
                        ? 'text-red-400'
                        : change > 0.1
                        ? 'text-yellow-400'
                        : change < -0.1
                        ? 'text-blue-400'
                        : 'text-green-400'
                    }`}
                  >
                    {change > 0 ? '+' : ''}
                    {changePercent}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-civic-gray-700 text-sm text-civic-gray-300">
            {(() => {
              const firstPeriod = radarData.periods[selectedPeriods[0]];
              const lastPeriod = radarData.periods[selectedPeriods[selectedPeriods.length - 1]];
              const avgChange =
                lastPeriod.values.reduce((sum, val, idx) => sum + (val - firstPeriod.values[idx]), 0) /
                radarData.dimensions.length;

              if (avgChange > 0.2) {
                return '⚠️ Signifikant ökning i bias över tid';
              } else if (avgChange > 0.1) {
                return '⚡ Måttlig ökning i bias';
              } else if (avgChange < -0.1) {
                return '✅ Bias har minskat över tid';
              } else {
                return '✓ Stabila bias-mått över tid';
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default BiasDriftRadar;
