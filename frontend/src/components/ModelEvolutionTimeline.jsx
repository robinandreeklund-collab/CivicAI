import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * ModelEvolutionTimeline Component
 * Displays the evolution of OQT-1.0 model versions over time
 */
export default function ModelEvolutionTimeline({ versions = [] }) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Mock data if none provided
  const displayVersions = versions.length > 0 ? versions : [
    {
      version: '1.0.0',
      timestamp: '2025-01-15T10:00:00Z',
      metrics: {
        validation_accuracy: 0.876,
        fairness_score: 0.912,
        bias_score: 0.123
      },
      fairness_metrics: {
        demographic_parity: 0.945,
        equal_opportunity: 0.928
      },
      training_config: {
        dataset_size: 10000,
        epochs: 3
      }
    },
    {
      version: '1.1.0',
      timestamp: '2025-02-01T14:30:00Z',
      metrics: {
        validation_accuracy: 0.892,
        fairness_score: 0.935,
        bias_score: 0.098
      },
      fairness_metrics: {
        demographic_parity: 0.967,
        equal_opportunity: 0.952
      },
      training_config: {
        dataset_size: 15000,
        epochs: 4
      }
    },
    {
      version: '1.2.0',
      timestamp: '2025-03-10T09:15:00Z',
      metrics: {
        validation_accuracy: 0.905,
        fairness_score: 0.948,
        bias_score: 0.082
      },
      fairness_metrics: {
        demographic_parity: 0.978,
        equal_opportunity: 0.965
      },
      training_config: {
        dataset_size: 22000,
        epochs: 5
      }
    }
  ];

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('sv-SE', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMetricColor = (value, reverse = false) => {
    if (reverse) {
      // For bias (lower is better)
      if (value < 0.1) return 'text-green-400';
      if (value < 0.2) return 'text-yellow-400';
      return 'text-red-400';
    } else {
      // For accuracy/fairness (higher is better)
      if (value >= 0.9) return 'text-green-400';
      if (value >= 0.8) return 'text-yellow-400';
      return 'text-red-400';
    }
  };

  return (
    <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
      <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Model Evolution Timeline</h2>
      
      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-[#2a2a2a]"></div>
        
        {/* Version entries */}
        <div className="space-y-6">
          {displayVersions.map((version, index) => (
            <div key={version.version} className="relative pl-20">
              {/* Timeline dot */}
              <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-[#e7e7e7] border-4 border-[#151515] z-10"></div>
              
              {/* Version card */}
              <div 
                className={`
                  bg-[#0a0a0a] border rounded-lg p-4 cursor-pointer transition-all duration-200
                  ${selectedVersion === version.version 
                    ? 'border-[#e7e7e7] shadow-lg' 
                    : 'border-[#2a2a2a] hover:border-[#555]'
                  }
                `}
                onClick={() => setSelectedVersion(
                  selectedVersion === version.version ? null : version.version
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-[#e7e7e7]">
                      Version {version.version}
                    </h3>
                    <p className="text-xs text-[#888] mt-1">
                      {formatDate(version.timestamp)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#888]">Dataset Size</div>
                    <div className="text-sm text-[#e7e7e7] font-medium">
                      {version.training_config.dataset_size.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Key metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#151515] rounded p-2">
                    <div className="text-xs text-[#888] mb-1">Accuracy</div>
                    <div className={`text-sm font-medium ${getMetricColor(version.metrics.validation_accuracy)}`}>
                      {(version.metrics.validation_accuracy * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[#151515] rounded p-2">
                    <div className="text-xs text-[#888] mb-1">Fairness</div>
                    <div className={`text-sm font-medium ${getMetricColor(version.metrics.fairness_score)}`}>
                      {(version.metrics.fairness_score * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-[#151515] rounded p-2">
                    <div className="text-xs text-[#888] mb-1">Bias</div>
                    <div className={`text-sm font-medium ${getMetricColor(version.metrics.bias_score, true)}`}>
                      {(version.metrics.bias_score * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {selectedVersion === version.version && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                    <div>
                      <div className="text-xs text-[#888] mb-2">Fairness Metrics</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#aaa]">Demographic Parity:</span>
                          <span className="text-[#e7e7e7]">
                            {(version.fairness_metrics.demographic_parity * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#aaa]">Equal Opportunity:</span>
                          <span className="text-[#e7e7e7]">
                            {(version.fairness_metrics.equal_opportunity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-[#888] mb-2">Training Config</div>
                      <div className="text-xs text-[#aaa]">
                        {version.training_config.epochs} epochs • 
                        {' '}{version.training_config.dataset_size.toLocaleString()} samples
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Improvement summary */}
      {displayVersions.length > 1 && (
        <div className="mt-6 pt-6 border-t border-[#2a2a2a]">
          <h3 className="text-sm font-medium text-[#e7e7e7] mb-3">Overall Progress</h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[#888] mb-1">Accuracy Improvement</div>
              <div className="text-green-400 font-medium">
                +{((displayVersions[displayVersions.length - 1].metrics.validation_accuracy - 
                    displayVersions[0].metrics.validation_accuracy) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[#888] mb-1">Fairness Improvement</div>
              <div className="text-green-400 font-medium">
                +{((displayVersions[displayVersions.length - 1].metrics.fairness_score - 
                    displayVersions[0].metrics.fairness_score) * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-[#888] mb-1">Bias Reduction</div>
              <div className="text-green-400 font-medium">
                -{((displayVersions[0].metrics.bias_score - 
                    displayVersions[displayVersions.length - 1].metrics.bias_score) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ModelEvolutionTimeline.propTypes = {
  versions: PropTypes.arrayOf(PropTypes.shape({
    version: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    metrics: PropTypes.object.isRequired,
    fairness_metrics: PropTypes.object.isRequired,
    training_config: PropTypes.object.isRequired
  }))
};
