/**
 * MTA-DO Longitudinal Analysis Visualization Component
 * 
 * Displays MTA-DO quality metrics across all debate rounds:
 * - Sparkline visualizations for 6 dimensions
 * - Longitudinal table showing trends
 * - Per-round averages and best/weakest dimensions
 * 
 * Used in main debate view (SevenBZeroPage) to show analysis trends
 */

import React from 'react';

const MTALongitudinalView = ({ mtaData, whiteMode = false }) => {
  console.log('[MTALongitudinalView] Rendering with data:', mtaData);
  
  if (!mtaData || mtaData.length === 0) {
    return (
      <div className={`mt-6 p-4 rounded-lg border ${
        whiteMode ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-[#333]'
      }`}>
        <h4 className={`text-sm font-semibold mb-2 ${
          whiteMode ? 'text-gray-900' : 'text-[#ddd]'
        }`}>
          📊 MTA-DO Longitudinal Analysis
        </h4>
        <p className={`text-xs ${whiteMode ? 'text-gray-600' : 'text-[#999]'}`}>
          Ingen MTA-DO data tillgänglig än. Data visas efter analys är klar.
        </p>
      </div>
    );
  }

  const dimensions = [
    { key: 'relevans', label: 'Relevans' },
    { key: 'argumentdjup', label: 'Argumentdjup' },
    { key: 'faktaforankring', label: 'Faktaförankring' },
    { key: 'klarhet', label: 'Klarhet' },
    { key: 'logisk_koherens', label: 'Logisk koherens' },
    { key: 'risk_hallucination', label: 'Risk/Hallucination' }
  ];

  // Calculate sparkline data for each dimension
  const dimensionData = dimensions.map(dim => {
    const scores = mtaData.map(roundData => {
      // Extract scores from all agents in this round
      const agentScores = [];
      Object.keys(roundData).forEach(key => {
        if (key !== 'round' && roundData[key]?.analysis) {
          const analysis = roundData[key].analysis;
          if (analysis.dimensions && analysis.dimensions[dim.key]) {
            agentScores.push(parseFloat(analysis.dimensions[dim.key].score) || 0);
          }
        }
      });
      return agentScores.length > 0 
        ? agentScores.reduce((a, b) => a + b, 0) / agentScores.length 
        : 0;
    });

    const avgScore = scores.length > 0 
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '0.0';

    return {
      ...dim,
      scores,
      avgScore
    };
  });

  // Generate sparkline SVG
  const generateSparkline = (scores) => {
    if (scores.length === 0) return null;
    
    const width = 60;
    const height = 20;
    const max = Math.max(...scores, 1);
    const points = scores.map((score, i) => {
      const x = (i / (scores.length - 1 || 1)) * width;
      const y = height - (score / max) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={whiteMode ? '#4a90e2' : '#6b9bd1'}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  // Calculate per-round statistics
  const roundStats = mtaData.map((roundData, idx) => {
    const dimScores = dimensionData.map(d => d.scores[idx]).filter(s => s > 0);
    const avgScore = dimScores.length > 0
      ? (dimScores.reduce((a, b) => a + b, 0) / dimScores.length).toFixed(1)
      : '0.0';
    
    // Find best and weakest dimensions for this round
    const validDims = dimensionData
      .map(d => ({ label: d.label, score: d.scores[idx] }))
      .filter(d => d.score > 0);
    
    const bestDim = validDims.length > 0
      ? validDims.reduce((a, b) => a.score > b.score ? a : b).label
      : 'N/A';
    
    const weakDim = validDims.length > 0
      ? validDims.reduce((a, b) => a.score < b.score ? a : b).label
      : 'N/A';

    return {
      round: roundData.round || (idx + 1),
      avgScore,
      bestDim: bestDim.substring(0, 10), // Truncate for display
      weakDim: weakDim.substring(0, 10)
    };
  });

  return (
    <div className={`mt-6 p-4 rounded-lg border ${
      whiteMode ? 'bg-white border-gray-200' : 'bg-[#1a1a1a] border-[#333]'
    }`}>
      <h4 className={`text-sm font-semibold mb-4 ${
        whiteMode ? 'text-gray-900' : 'text-[#ddd]'
      }`}>
        📊 MTA-DO Longitudinal Analysis
      </h4>

      {/* Sparklines for each dimension */}
      <div className="mb-4 space-y-1">
        {dimensionData.map(dim => (
          <div key={dim.key} className="flex items-center gap-2 text-xs">
            <span className={`w-32 ${whiteMode ? 'text-gray-700' : 'text-[#aaa]'}`}>
              {dim.label}
            </span>
            {generateSparkline(dim.scores)}
            <span className={`font-mono ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
              {dim.avgScore}/10
            </span>
          </div>
        ))}
      </div>

      {/* Longitudinal table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className={whiteMode ? 'border-b border-gray-200' : 'border-b border-[#333]'}>
              <th className={`text-left py-2 px-2 ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
                Runda
              </th>
              <th className={`text-left py-2 px-2 ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
                Avg Score
              </th>
              <th className={`text-left py-2 px-2 ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
                Best Dim
              </th>
              <th className={`text-left py-2 px-2 ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
                Weak Dim
              </th>
            </tr>
          </thead>
          <tbody>
            {roundStats.map(stat => (
              <tr key={stat.round} className={whiteMode ? 'border-b border-gray-100' : 'border-b border-[#222]'}>
                <td className={`py-2 px-2 ${whiteMode ? 'text-gray-800' : 'text-[#bbb]'}`}>
                  {stat.round}
                </td>
                <td className={`py-2 px-2 font-mono ${whiteMode ? 'text-gray-900' : 'text-[#ddd]'}`}>
                  {stat.avgScore}
                </td>
                <td className={`py-2 px-2 ${whiteMode ? 'text-green-700' : 'text-[#0a0]'}`}>
                  {stat.bestDim}
                </td>
                <td className={`py-2 px-2 ${whiteMode ? 'text-red-700' : 'text-[#f66]'}`}>
                  {stat.weakDim}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={`text-[10px] mt-3 ${whiteMode ? 'text-gray-500' : 'text-[#666]'}`}>
        * Visar genomsnittliga MTA-DO-poäng över alla AI-agenter per runda
      </p>
    </div>
  );
};

export default MTALongitudinalView;
