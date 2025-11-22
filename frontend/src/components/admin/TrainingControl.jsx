import { useState, useEffect } from 'react';
import LiveLeaderboard from './LiveLeaderboard';

/**
 * Training Control Component
 * 
 * Features:
 * - Select dataset(s) for training
 * - Configure parameters: epochs, batch size, learning rate
 * - DNA v2 training mode with adaptive weights
 * - Start/stop training sessions
 * - Monitor real-time training metrics
 * - View training logs
 */
export default function TrainingControl() {
  const [datasets, setDatasets] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [discoveredBaseModels, setDiscoveredBaseModels] = useState([]);
  const [selectedBaseModels, setSelectedBaseModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [useDnaV2, setUseDnaV2] = useState(true); // Default to DNA v2
  const [trainingParams, setTrainingParams] = useState({
    epochs: 3,
    batchSize: 8,
    learningRate: 0.0001,
    language: 'en',
    knowledgeSource: '', // Renamed from externalModel
    // DNA v2 specific parameters
    autoStopThreshold: 0.001,
    autoStopPatience: 3,
    seed: 42,
  });
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDatasets();
    fetchAvailableModels();
    fetchDiscoveredBaseModels();
    fetchTrainingStatus();
    
    // Poll for training status every 5 seconds
    const interval = setInterval(fetchTrainingStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch('/api/admin/datasets');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data.datasets || []);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    }
  };

  const fetchAvailableModels = async () => {
    try {
      const response = await fetch('/api/admin/models/available');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching available models:', error);
    }
  };

  const fetchDiscoveredBaseModels = async () => {
    try {
      const response = await fetch('/api/admin/models/discover-base');
      if (response.ok) {
        const data = await response.json();
        setDiscoveredBaseModels(data.models || []);
      }
    } catch (error) {
      console.error('Error fetching discovered base models:', error);
    }
  };

  const fetchTrainingStatus = async () => {
    try {
      const response = await fetch('/api/admin/training/status');
      if (response.ok) {
        const data = await response.json();
        setTrainingStatus(data);
        if (data.logs) {
          setTrainingLogs(data.logs);
        }
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (error) {
      console.error('Error fetching training status:', error);
    }
  };

  const addBaseModel = (modelName) => {
    if (!selectedBaseModels.includes(modelName) && selectedBaseModels.length < 10) {
      setSelectedBaseModels([...selectedBaseModels, modelName]);
    }
  };

  const removeBaseModel = (modelName) => {
    setSelectedBaseModels(selectedBaseModels.filter(m => m !== modelName));
  };

  const startTraining = async () => {
    if (!selectedDataset) {
      alert('Please select a dataset');
      return;
    }

    // Validate base models for DNA v2 mode
    if (useDnaV2 && selectedBaseModels.length === 0) {
      alert('Please select at least one base model for DNA v2 training');
      return;
    }

    try {
      // Choose endpoint based on DNA v2 toggle
      const endpoint = useDnaV2 ? '/api/admin/training/start-dna-v2' : '/api/admin/training/start';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset,
          baseModels: useDnaV2 ? selectedBaseModels : undefined,
          ...trainingParams,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const mode = useDnaV2 ? 'DNA v2 (Adaptive)' : 'Legacy';
        alert(`Training started successfully in ${mode} mode!`);
        await fetchTrainingStatus();
      } else {
        alert(`Failed to start training: ${data.error}`);
      }
    } catch (error) {
      console.error('Error starting training:', error);
      alert('Failed to start training');
    }
  };

  const stopTraining = async () => {
    if (!confirm('Are you sure you want to stop training?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/training/stop', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Training stopped');
        await fetchTrainingStatus();
      }
    } catch (error) {
      console.error('Error stopping training:', error);
    }
  };

  const isTraining = trainingStatus?.status === 'training';

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Training Configuration */}
      <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Configuration</h2>
        
        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
          {/* Dataset Selection */}
          <div>
            <label className="block text-[#888] font-mono text-sm mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              disabled={isTraining}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
            >
              <option value="">-- Select a dataset --</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.entries} entries)
                </option>
              ))}
            </select>
          </div>

          {/* Training Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Epochs
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={trainingParams.epochs}
                onChange={(e) => setTrainingParams({ ...trainingParams, epochs: parseInt(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Batch Size
              </label>
              <input
                type="number"
                min="1"
                max="64"
                value={trainingParams.batchSize}
                onChange={(e) => setTrainingParams({ ...trainingParams, batchSize: parseInt(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.00001"
                max="0.01"
                value={trainingParams.learningRate}
                onChange={(e) => setTrainingParams({ ...trainingParams, learningRate: parseFloat(e.target.value) })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Base Model(s) Selection for DNA v2 */}
          {useDnaV2 && (
            <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 rounded">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[#888] font-mono text-sm">
                  Base Model(s) *
                </label>
                <span className="text-[#555] font-mono text-xs">
                  {selectedBaseModels.length} / 10 selected
                </span>
              </div>
              
              {/* Selected Base Models */}
              {selectedBaseModels.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2 w-full max-w-full">
                  {selectedBaseModels.map((modelName) => (
                    <div
                      key={modelName}
                      className="flex items-center gap-2 bg-[#111] border border-green-900/30 text-green-400 px-3 py-1 rounded font-mono text-xs max-w-full overflow-hidden"
                    >
                      <span className="truncate max-w-[200px] sm:max-w-[300px]" title={modelName}>{modelName}</span>
                      <button
                        onClick={() => removeBaseModel(modelName)}
                        disabled={isTraining}
                        className="text-red-400 hover:text-red-300 disabled:opacity-50 flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Base Model Selector */}
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addBaseModel(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  disabled={isTraining || selectedBaseModels.length >= 10}
                  className="flex-1 bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                >
                  <option value="">-- Add base model --</option>
                  {discoveredBaseModels
                    .filter(model => !selectedBaseModels.includes(model.name))
                    .map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name} ({model.parameters || 'unknown'})
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => setSelectedBaseModels([])}
                  disabled={isTraining || selectedBaseModels.length === 0}
                  className="px-3 py-2 border border-[#2a2a2a] text-[#666] font-mono text-xs hover:bg-[#1a1a1a] disabled:opacity-50 rounded"
                >
                  Clear All
                </button>
              </div>

              <p className="text-[#555] font-mono text-xs mt-2 break-words">
                ✓ Auto-discovered from <code className="break-all">/models/</code> folder
                <br />✓ Supports KB-Llama-3.1-8B-Swedish, Qwen-2.5, Gemma-2, etc.
                <br />✓ Sequential training (no OOM) with adaptive weights
              </p>
            </div>
          )}

          {/* Knowledge Source (formerly External Model) - Optional distillation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Language {!useDnaV2 && '(Legacy Mode)'}
              </label>
              <select
                value={trainingParams.language}
                onChange={(e) => setTrainingParams({ ...trainingParams, language: e.target.value })}
                disabled={isTraining || useDnaV2}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="en">English (OneSeek-7B-Zero.v1.1)</option>
                <option value="sv">Swedish (OneSeek-7B-Zero-SV.v1.1)</option>
              </select>
              {useDnaV2 && (
                <p className="text-[#555] font-mono text-xs mt-1">
                  Not used in DNA v2 mode
                </p>
              )}
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Knowledge Source (Optional)
              </label>
              <select
                value={trainingParams.knowledgeSource}
                onChange={(e) => setTrainingParams({ ...trainingParams, knowledgeSource: e.target.value })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="">-- No knowledge source --</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
              <p className="text-[#555] font-mono text-xs mt-1">
                For optional knowledge distillation
              </p>
            </div>
          </div>

          {/* DNA v2 Mode Toggle */}
          <div className="border-t border-[#2a2a2a] pt-4 mt-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#eee] font-mono text-sm mb-1">
                  🧬 DNA v2 Training Mode
                </h3>
                <p className="text-[#666] font-mono text-xs">
                  Advanced training with adaptive weights, auto-discovery, and cryptographic provenance
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={useDnaV2}
                  onChange={(e) => setUseDnaV2(e.target.checked)}
                  disabled={isTraining}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#2a2a2a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* DNA v2 Specific Parameters */}
            {useDnaV2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4 p-4 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Auto-Stop Threshold
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max="0.01"
                    value={trainingParams.autoStopThreshold}
                    onChange={(e) => setTrainingParams({ ...trainingParams, autoStopThreshold: parseFloat(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Loss change threshold
                  </p>
                </div>

                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Auto-Stop Patience
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={trainingParams.autoStopPatience}
                    onChange={(e) => setTrainingParams({ ...trainingParams, autoStopPatience: parseInt(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Epochs to wait
                  </p>
                </div>

                <div>
                  <label className="block text-[#888] font-mono text-sm mb-2">
                    Random Seed
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="9999"
                    value={trainingParams.seed}
                    onChange={(e) => setTrainingParams({ ...trainingParams, seed: parseInt(e.target.value) })}
                    disabled={isTraining}
                    className="w-full bg-[#111] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
                  />
                  <p className="text-[#555] font-mono text-xs mt-1">
                    Reproducibility
                  </p>
                </div>
              </div>
            )}

            {/* DNA v2 Features Info */}
            {useDnaV2 && (
              <div className="mt-4 p-3 bg-[#0a0a0a] border border-green-900/30 rounded max-w-full overflow-x-hidden">
                <p className="text-green-400 font-mono text-xs mb-2">✅ DNA v2 Features:</p>
                <ul className="text-[#666] font-mono text-xs space-y-1 pl-4 break-words">
                  <li>• Auto-discovers base models from models/ directory</li>
                  <li>• Adaptive weight adjustment (+20-50% best, -30-50% worst)</li>
                  <li>• Confidence-based auto-stop when loss plateaus</li>
                  <li>• SHA-256 DNA fingerprinting with Ed25519 signatures</li>
                  <li>• Immutable ledger entry with dataset hashes</li>
                  <li>• Certified model package with verification script</li>
                </ul>
              </div>
            )}
          </div>

          {/* Control Buttons */}
          <div className="flex items-center space-x-3 pt-2">
            {!isTraining ? (
              <button
                onClick={startTraining}
                disabled={!selectedDataset}
                className="px-6 py-2 bg-[#eee] text-[#0a0a0a] font-mono text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Training
              </button>
            ) : (
              <button
                onClick={stopTraining}
                className="px-6 py-2 border border-[#666] text-[#666] font-mono text-sm hover:bg-[#1a1a1a] transition-colors"
              >
                Stop Training
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Training Status */}
      {trainingStatus && (
        <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Training Status</h2>
          
          <div className="space-y-3 w-full max-w-full overflow-x-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[#666] font-mono text-sm">Status</span>
              <span className={`font-mono text-sm ${
                isTraining ? 'text-[#888]' : 'text-[#666]'
              }`}>
                {trainingStatus.status}
                {trainingStatus.useDnaV2 && <span className="ml-2 text-green-400">🧬 DNA v2</span>}
              </span>
            </div>

            {/* Show DNA if available */}
            {trainingStatus.dna && (
              <div className="p-3 bg-[#0a0a0a] border border-green-900/30 rounded">
                <span className="text-[#666] font-mono text-xs block mb-1">DNA Fingerprint:</span>
                <span className="text-green-400 font-mono text-xs break-all">
                  {trainingStatus.dna}
                </span>
              </div>
            )}

            {metrics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Current Epoch</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.currentEpoch} / {metrics.totalEpochs}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Loss</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.loss?.toFixed(4) || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#666] font-mono text-sm">Progress</span>
                  <span className="text-[#888] font-mono text-sm">
                    {metrics.progress}%
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-[#2a2a2a] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#888] transition-all duration-300"
                    style={{ width: `${metrics.progress}%` }}
                  ></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Live Leaderboard - Show when training with DNA v2 */}
      {trainingStatus && isTraining && trainingStatus.useDnaV2 && trainingStatus.runId && (
        <LiveLeaderboard runId={trainingStatus.runId} />
      )}

      {/* Training Logs */}
      <div className="border border-[#2a2a2a] bg-[#111] p-4 sm:p-6 rounded w-full max-w-full overflow-hidden">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Logs</h2>
        
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4 h-64 overflow-y-auto overflow-x-hidden font-mono text-xs w-full max-w-full">
          {trainingLogs.length === 0 ? (
            <div className="text-[#666]">No logs available</div>
          ) : (
            trainingLogs.map((log, index) => (
              <div key={index} className="text-[#888] mb-1 break-words">
                <span className="text-[#666]">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
