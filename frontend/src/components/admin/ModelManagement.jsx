import { useState, useEffect } from 'react';

/**
 * Model Management Component
 * 
 * Features:
 * - List all model versions
 * - View model metadata and metrics
 * - Download model weights and LoRA adapters
 * - Compare versions side-by-side
 * - Rollback to previous versions
 */
export default function ModelManagement() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [currentModelId, setCurrentModelId] = useState(null);

  useEffect(() => {
    fetchModels();
    fetchCurrentModel();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch('/api/admin/models');
      if (response.ok) {
        const data = await response.json();
        setModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentModel = async () => {
    try {
      const response = await fetch('/api/models/current');
      if (response.ok) {
        const data = await response.json();
        if (data.currentModel) {
          setCurrentModelId(data.currentModel);
        }
      }
    } catch (error) {
      console.error('Error fetching current model:', error);
    }
  };

  const downloadModel = async (modelId, type = 'weights') => {
    try {
      const response = await fetch(`/api/admin/models/${modelId}/download?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `model-${modelId}-${type}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      alert('Failed to download model');
    }
  };

  const rollbackToModel = async (modelId) => {
    if (!confirm('Are you sure you want to rollback to this model version?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/models/${modelId}/rollback`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Model rollback successful!');
        await fetchModels();
      } else {
        const data = await response.json();
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error rolling back model:', error);
      alert('Rollback failed');
    }
  };

  const setAsCurrentModel = async (modelId) => {
    if (!confirm('Set this model as the active model for OQT Dashboard?\n\nThis will create/update the -CURRENT symlink and ml_service will use this model on next startup.\n\nNote: The symlink points to the base oneseek-7b-zero directory which contains all model weights.')) {
      return;
    }

    try {
      const response = await fetch('/api/models/set-current', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Model version ${modelId} set as current successfully!\n\n${data.note || 'Restart ml_service (python ml_service/server.py) to load this model.'}`);
        setCurrentModelId('oneseek-7b-zero'); // The symlink always points to the base directory
        await fetchModels();
      } else {
        const data = await response.json();
        alert(`Failed to set model: ${data.error}\n\n${data.note || ''}`);
      }
    } catch (error) {
      console.error('Error setting current model:', error);
      alert('Failed to set current model');
    }
  };

  const toggleCompare = (modelId) => {
    if (selectedForCompare.includes(modelId)) {
      setSelectedForCompare(selectedForCompare.filter(id => id !== modelId));
    } else if (selectedForCompare.length < 2) {
      setSelectedForCompare([...selectedForCompare, modelId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#666] font-mono text-sm">Loading models...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Section */}
      <div className="border border-blue-900/30 bg-blue-900/10 p-4 rounded">
        <div className="text-blue-400 font-mono text-sm mb-2">ℹ️ Active Model System</div>
        <div className="text-[#888] font-mono text-xs space-y-1">
          <div>• Click "Set as Active" to make a model the current OQT Dashboard model</div>
          <div>• Active model is stored as symlink: <code className="text-[#aaa]">models/oneseek-certified/OneSeek-7B-Zero-CURRENT</code></div>
          <div>• Restart ml_service to load the active model: <code className="text-[#aaa]">python ml_service/server.py</code></div>
          <div>• OQT Dashboard will always use the active model (homepage/chat-v2 unaffected)</div>
        </div>
      </div>

      {/* Model List */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[#eee] font-mono text-lg">Model Versions</h2>
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-4 py-2 border border-[#2a2a2a] font-mono text-sm transition-colors ${
              compareMode
                ? 'bg-[#1a1a1a] text-[#eee]'
                : 'text-[#888] hover:bg-[#1a1a1a]'
            }`}
          >
            {compareMode ? 'Exit Compare' : 'Compare Versions'}
          </button>
        </div>

        {models.length === 0 ? (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            No models available
          </div>
        ) : (
          <div className="space-y-3">
            {models.map((model) => (
              <div
                key={model.id}
                className={`border border-[#2a2a2a] p-4 rounded transition-colors ${
                  compareMode && selectedForCompare.includes(model.id)
                    ? 'border-[#666] bg-[#1a1a1a]'
                    : 'hover:border-[#444]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {compareMode && (
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(model.id)}
                          onChange={() => toggleCompare(model.id)}
                          disabled={!selectedForCompare.includes(model.id) && selectedForCompare.length >= 2}
                          className="w-4 h-4"
                        />
                      )}
                      <div className="text-[#eee] font-mono text-sm">
                        {model.version || model.id}
                        {(model.isCurrent || model.id === currentModelId) && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] bg-green-900/30 border border-green-700/50 text-green-400 rounded">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* DNA Fingerprint Display */}
                    {model.dna && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-green-900/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-[#666] font-mono text-xs">DNA:</span>
                          <span className="text-green-400 font-mono text-xs break-all">
                            {model.dna}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Adaptive Weights Display */}
                    {model.weights && Object.keys(model.weights).length > 0 && (
                      <div className="mb-2 p-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                        <div className="text-[#666] font-mono text-xs mb-1">Model Weights:</div>
                        {Object.entries(model.weights).map(([modelName, weight]) => {
                          // Normalize weight to percentage (assume 0.0-1.0 range)
                          const weightPercent = weight > 1 ? weight : weight * 100;
                          return (
                            <div key={modelName} className="flex items-center justify-between text-xs font-mono">
                              <span className="text-[#888]">{modelName}</span>
                              <span className="text-[#eee]">{weightPercent.toFixed(1)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <div className="text-[#666] font-mono text-xs space-y-1">
                      <div>Created: {new Date(model.createdAt).toLocaleString()}</div>
                      <div>Type: {model.trainingType || 'Unknown'}</div>
                      <div>Samples: {model.samplesProcessed || 0}</div>
                      {model.training?.autoStopped && (
                        <div className="text-yellow-400">Auto-stopped ⚡</div>
                      )}
                      {model.metrics && (
                        <div className="mt-2 flex items-center space-x-4">
                          <span>Loss: {model.metrics.loss?.toFixed(4) || 'N/A'}</span>
                          <span>Accuracy: {model.metrics.accuracy?.toFixed(2) || 'N/A'}%</span>
                          <span>Fairness: {model.metrics.fairness?.toFixed(2) || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!compareMode && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedModel(model)}
                        className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => downloadModel(model.id, 'weights')}
                        className="px-3 py-1 border border-[#2a2a2a] text-[#888] text-xs font-mono hover:bg-[#1a1a1a] transition-colors"
                      >
                        Download
                      </button>
                      {model.id !== currentModelId && (
                        <button
                          onClick={() => setAsCurrentModel(model.id)}
                          className="px-3 py-1 border border-green-700/50 bg-green-900/20 text-green-400 text-xs font-mono hover:bg-green-900/30 transition-colors"
                        >
                          Set as Active
                        </button>
                      )}
                      {!model.isCurrent && (
                        <button
                          onClick={() => rollbackToModel(model.id)}
                          className="px-3 py-1 border border-[#2a2a2a] text-[#666] text-xs font-mono hover:bg-[#1a1a1a] hover:text-[#888] transition-colors"
                        >
                          Rollback
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {compareMode && selectedForCompare.length === 2 && (
          <div className="mt-4 p-4 border border-[#2a2a2a] bg-[#0a0a0a] rounded">
            <h3 className="text-[#888] font-mono text-sm mb-3">Comparison</h3>
            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              {selectedForCompare.map((modelId) => {
                const model = models.find(m => m.id === modelId);
                return (
                  <div key={modelId} className="space-y-2">
                    <div className="text-[#eee]">{model.version}</div>
                    <div className="text-[#666]">
                      <div>Created: {new Date(model.createdAt).toLocaleDateString()}</div>
                      <div>Samples: {model.samplesProcessed || 0}</div>
                      {model.metrics && (
                        <>
                          <div>Loss: {model.metrics.loss?.toFixed(4) || 'N/A'}</div>
                          <div>Accuracy: {model.metrics.accuracy?.toFixed(2) || 'N/A'}%</div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Model Details Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border border-[#2a2a2a] rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
              <h3 className="text-[#eee] font-mono text-lg">
                Model Details: {selectedModel.version}
              </h3>
              <button
                onClick={() => setSelectedModel(null)}
                className="text-[#666] hover:text-[#888] text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4 font-mono text-sm">
                <div>
                  <div className="text-[#666] text-xs mb-1">Version</div>
                  <div className="text-[#eee]">{selectedModel.version}</div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Created At</div>
                  <div className="text-[#888]">
                    {new Date(selectedModel.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Training Type</div>
                  <div className="text-[#888]">{selectedModel.trainingType || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-[#666] text-xs mb-1">Samples Processed</div>
                  <div className="text-[#888]">{selectedModel.samplesProcessed || 0}</div>
                </div>
                {selectedModel.metrics && (
                  <div>
                    <div className="text-[#666] text-xs mb-1">Metrics</div>
                    <pre className="text-[#888] text-xs bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded">
                      {JSON.stringify(selectedModel.metrics, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedModel.metadata && (
                  <div>
                    <div className="text-[#666] text-xs mb-1">Metadata</div>
                    <pre className="text-[#888] text-xs bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedModel.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-[#2a2a2a] flex justify-end space-x-3">
              <button
                onClick={() => downloadModel(selectedModel.id, 'weights')}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Download Weights
              </button>
              <button
                onClick={() => downloadModel(selectedModel.id, 'lora')}
                className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
              >
                Download LoRA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
