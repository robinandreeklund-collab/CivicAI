import { useState, useEffect } from 'react';

/**
 * Training Control Component
 * 
 * Features:
 * - Select dataset(s) for training
 * - Configure parameters: epochs, batch size, learning rate
 * - Start/stop training sessions
 * - Monitor real-time training metrics
 * - View training logs
 */
export default function TrainingControl() {
  const [datasets, setDatasets] = useState([]);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState('');
  const [trainingParams, setTrainingParams] = useState({
    epochs: 3,
    batchSize: 8,
    learningRate: 0.0001,
    language: 'en',
    externalModel: '',
  });
  const [trainingStatus, setTrainingStatus] = useState(null);
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchDatasets();
    fetchAvailableModels();
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

  const startTraining = async () => {
    if (!selectedDataset) {
      alert('Please select a dataset');
      return;
    }

    try {
      const response = await fetch('/api/admin/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedDataset,
          ...trainingParams,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Training started successfully!');
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
    <div className="space-y-6">
      {/* Training Configuration */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Configuration</h2>
        
        <div className="space-y-4">
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
          <div className="grid grid-cols-3 gap-4">
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

          {/* Language and External Model Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                Language
              </label>
              <select
                value={trainingParams.language}
                onChange={(e) => setTrainingParams({ ...trainingParams, language: e.target.value })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="en">English (OneSeek-7B-Zero.v1.1)</option>
                <option value="sv">Swedish (OneSeek-7B-Zero-SV.v1.1)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#888] font-mono text-sm mb-2">
                External Model (Optional)
              </label>
              <select
                value={trainingParams.externalModel}
                onChange={(e) => setTrainingParams({ ...trainingParams, externalModel: e.target.value })}
                disabled={isTraining}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#888] font-mono text-sm p-2 rounded focus:outline-none focus:border-[#444] disabled:opacity-50"
              >
                <option value="">-- No external model --</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.displayName}
                  </option>
                ))}
              </select>
              <p className="text-[#555] font-mono text-xs mt-1">
                {availableModels.length > 0 
                  ? `${availableModels.length} model(s) found in models directory`
                  : 'Scanning models directory...'}
              </p>
            </div>
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
        <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
          <h2 className="text-[#eee] font-mono text-lg mb-4">Training Status</h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[#666] font-mono text-sm">Status</span>
              <span className={`font-mono text-sm ${
                isTraining ? 'text-[#888]' : 'text-[#666]'
              }`}>
                {trainingStatus.status}
              </span>
            </div>

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

      {/* Training Logs */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded">
        <h2 className="text-[#eee] font-mono text-lg mb-4">Training Logs</h2>
        
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded p-4 h-64 overflow-y-auto font-mono text-xs">
          {trainingLogs.length === 0 ? (
            <div className="text-[#666]">No logs available</div>
          ) : (
            trainingLogs.map((log, index) => (
              <div key={index} className="text-[#888] mb-1">
                <span className="text-[#666]">[{log.timestamp}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
