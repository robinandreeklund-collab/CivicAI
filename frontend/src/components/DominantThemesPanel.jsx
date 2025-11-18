import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * DominantThemesPanel Component
 * Displays dominant themes from training data with trends and bias indicators
 */
export default function DominantThemesPanel({ themes = [], timeRange = '30d' }) {
  const [selectedTheme, setSelectedTheme] = useState(null);

  // Mock data if none provided
  const displayThemes = themes.length > 0 ? themes : [
    {
      name: 'Politics & Governance',
      count: 3450,
      percentage: 28.5,
      trend: 'up',
      bias_score: 0.15,
      sentiment: {
        positive: 35,
        neutral: 45,
        negative: 20
      },
      keywords: ['politik', 'government', 'policy', 'election', 'democracy']
    },
    {
      name: 'Technology & AI',
      count: 2890,
      percentage: 23.9,
      trend: 'up',
      bias_score: 0.08,
      sentiment: {
        positive: 55,
        neutral: 35,
        negative: 10
      },
      keywords: ['ai', 'technology', 'machine learning', 'automation', 'innovation']
    },
    {
      name: 'Healthcare',
      count: 1920,
      percentage: 15.9,
      trend: 'stable',
      bias_score: 0.12,
      sentiment: {
        positive: 40,
        neutral: 50,
        negative: 10
      },
      keywords: ['health', 'medical', 'treatment', 'healthcare', 'patient']
    },
    {
      name: 'Education',
      count: 1560,
      percentage: 12.9,
      trend: 'down',
      bias_score: 0.09,
      sentiment: {
        positive: 45,
        neutral: 45,
        negative: 10
      },
      keywords: ['education', 'school', 'learning', 'student', 'university']
    },
    {
      name: 'Economy & Finance',
      count: 1450,
      percentage: 12.0,
      trend: 'up',
      bias_score: 0.18,
      sentiment: {
        positive: 30,
        neutral: 50,
        negative: 20
      },
      keywords: ['economy', 'finance', 'market', 'investment', 'business']
    },
    {
      name: 'Environment',
      count: 830,
      percentage: 6.8,
      trend: 'up',
      bias_score: 0.11,
      sentiment: {
        positive: 25,
        neutral: 45,
        negative: 30
      },
      keywords: ['climate', 'environment', 'sustainability', 'green', 'pollution']
    }
  ];

  const getTrendIcon = (trend) => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = (trend) => {
    if (trend === 'up') return 'text-green-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-[#888]';
  };

  const getBiasColor = (score) => {
    if (score < 0.1) return 'text-green-400';
    if (score < 0.2) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleThemeClick = (theme) => {
    setSelectedTheme(selectedTheme?.name === theme.name ? null : theme);
  };

  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-2">Dominant Themes</h2>
            <p className="text-sm text-[#888]">
              Top themes from training data • Last {timeRange}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#888]">Total Samples</div>
            <div className="text-lg font-medium text-[#e7e7e7]">
              {displayThemes.reduce((sum, t) => sum + t.count, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Themes grid */}
      <div className="space-y-3">
        {displayThemes.map((theme, index) => (
          <div
            key={theme.name}
            className={`
              border rounded-lg p-4 cursor-pointer transition-all duration-200
              ${selectedTheme?.name === theme.name
                ? 'bg-[#1a1a1a] border-[#e7e7e7]'
                : 'bg-[#0a0a0a] border-[#2a2a2a] hover:border-[#555]'
              }
            `}
            onClick={() => handleThemeClick(theme)}
          >
            {/* Theme header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[#e7e7e7]">
                    {index + 1}. {theme.name}
                  </span>
                  <span className={`text-sm ${getTrendColor(theme.trend)}`}>
                    {getTrendIcon(theme.trend)}
                  </span>
                </div>
                <div className="text-xs text-[#888]">
                  {theme.count.toLocaleString()} samples • {theme.percentage}%
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs text-[#888] mb-1">Bias Score</div>
                <div className={`text-sm font-medium ${getBiasColor(theme.bias_score)}`}>
                  {(theme.bias_score * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#2a2a2a] rounded-full h-2 mb-3">
              <div
                className="bg-gradient-to-r from-[#555] to-[#888] h-2 rounded-full transition-all duration-500"
                style={{ width: `${theme.percentage}%` }}
              ></div>
            </div>

            {/* Sentiment distribution */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-[#151515] rounded p-2">
                <div className="text-xs text-[#888] mb-1">Positive</div>
                <div className="text-sm text-green-400 font-medium">
                  {theme.sentiment.positive}%
                </div>
              </div>
              <div className="bg-[#151515] rounded p-2">
                <div className="text-xs text-[#888] mb-1">Neutral</div>
                <div className="text-sm text-[#aaa] font-medium">
                  {theme.sentiment.neutral}%
                </div>
              </div>
              <div className="bg-[#151515] rounded p-2">
                <div className="text-xs text-[#888] mb-1">Negative</div>
                <div className="text-sm text-red-400 font-medium">
                  {theme.sentiment.negative}%
                </div>
              </div>
            </div>

            {/* Expanded details */}
            {selectedTheme?.name === theme.name && (
              <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                <div className="text-xs text-[#888] mb-2">Top Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {theme.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 bg-[#2a2a2a] text-[#aaa] text-xs rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary insights */}
      <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
        <h3 className="text-sm font-medium text-[#e7e7e7] mb-3">Theme Insights</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
            <div className="text-[#888] mb-1">Most Discussed</div>
            <div className="text-[#e7e7e7] font-medium">{displayThemes[0]?.name}</div>
            <div className="text-[#666] mt-1">
              {displayThemes[0]?.percentage}% of all data
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
            <div className="text-[#888] mb-1">Lowest Bias</div>
            <div className="text-[#e7e7e7] font-medium">
              {[...displayThemes].sort((a, b) => a.bias_score - b.bias_score)[0]?.name}
            </div>
            <div className="text-green-400 mt-1">
              {([...displayThemes].sort((a, b) => a.bias_score - b.bias_score)[0]?.bias_score * 100).toFixed(1)}% bias
            </div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
            <div className="text-[#888] mb-1">Trending Up</div>
            <div className="text-[#e7e7e7] font-medium">
              {displayThemes.filter(t => t.trend === 'up').length} themes
            </div>
            <div className="text-green-400 mt-1">Growing interest</div>
          </div>
          
          <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-3">
            <div className="text-[#888] mb-1">Most Positive</div>
            <div className="text-[#e7e7e7] font-medium">
              {[...displayThemes].sort((a, b) => b.sentiment.positive - a.sentiment.positive)[0]?.name}
            </div>
            <div className="text-green-400 mt-1">
              {[...displayThemes].sort((a, b) => b.sentiment.positive - a.sentiment.positive)[0]?.sentiment.positive}% positive
            </div>
          </div>
        </div>
      </div>

      {/* Distribution chart placeholder */}
      <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
        <h3 className="text-sm font-medium text-[#e7e7e7] mb-3">Theme Distribution</h3>
        <div className="flex items-end gap-2 h-32">
          {displayThemes.slice(0, 6).map((theme, index) => (
            <div key={theme.name} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-[#555] to-[#888] rounded-t transition-all duration-500"
                style={{ height: `${(theme.percentage / displayThemes[0].percentage) * 100}%` }}
              ></div>
              <div className="text-xs text-[#888] mt-2 text-center truncate w-full">
                {theme.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

DominantThemesPanel.propTypes = {
  themes: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    count: PropTypes.number.isRequired,
    percentage: PropTypes.number.isRequired,
    trend: PropTypes.oneOf(['up', 'down', 'stable']),
    bias_score: PropTypes.number.isRequired,
    sentiment: PropTypes.shape({
      positive: PropTypes.number.isRequired,
      neutral: PropTypes.number.isRequired,
      negative: PropTypes.number.isRequired
    }).isRequired,
    keywords: PropTypes.arrayOf(PropTypes.string)
  })),
  timeRange: PropTypes.string
};
