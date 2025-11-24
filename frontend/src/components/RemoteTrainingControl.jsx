import { useState, useEffect } from 'react';

/**
 * Remote Training Control Component
 * 
 * UI for sending training jobs to remote desktop GPU worker
 * Shows worker status, job queue, and GPU metrics
 */
export default function RemoteTrainingControl({ onSubmit }) {
  const [remoteStatus, setRemoteStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRemoteStatus();
    const interval = setInterval(fetchRemoteStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchRemoteStatus = async () => {
    try {
      const response = await fetch('/api/remote/status');
      if (response.ok) {
        const data = await response.json();
        setRemoteStatus(data);
      }
    } catch (error) {
      console.error('Error fetching remote status:', error);
    }
  };

  const handleSendToDesktop = async () => {
    if (!onSubmit) return;
    
    setSubmitting(true);
    try {
      await onSubmit('remote');
    } catch (error) {
      console.error('Error submitting remote job:', error);
    }
    setSubmitting(false);
  };

  const handleLocalTraining = async () => {
    if (!onSubmit) return;
    
    setSubmitting(true);
    try {
      await onSubmit('local');
    } catch (error) {
      console.error('Error starting local training:', error);
    }
    setSubmitting(false);
  };

  const getStatusColor = (online) => {
    return online ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (online) => {
    return online ? 'Online' : 'Offline';
  };

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>🖥️</span>
          Remote Training Control
        </h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Desktop Worker Status */}
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">Desktop Worker Status</h4>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(remoteStatus?.worker?.online)} animate-pulse`} />
              <span className={`text-sm font-medium ${remoteStatus?.worker?.online ? 'text-green-400' : 'text-red-400'}`}>
                {getStatusText(remoteStatus?.worker?.online)}
              </span>
            </div>
          </div>

          {remoteStatus?.worker && (
            <div className="space-y-2 text-sm">
              {remoteStatus.worker.hostname && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Hostname:</span>
                  <span className="text-white font-mono">{remoteStatus.worker.hostname}</span>
                </div>
              )}
              {remoteStatus.worker.gpuInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">GPU Count:</span>
                    <span className="text-white">{remoteStatus.worker.gpuInfo.count}</span>
                  </div>
                  {remoteStatus.worker.gpuInfo.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPU Model:</span>
                      <span className="text-white">{remoteStatus.worker.gpuInfo.name}</span>
                    </div>
                  )}
                  {remoteStatus.worker.gpuInfo.memory && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">GPU Memory:</span>
                      <span className="text-white">{remoteStatus.worker.gpuInfo.memory}</span>
                    </div>
                  )}
                </>
              )}
              {remoteStatus.worker.lastPing && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Ping:</span>
                  <span className="text-white text-xs">
                    {new Date(remoteStatus.worker.lastPing).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Job Queue Info */}
        {remoteStatus && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Queue Length</div>
              <div className="text-2xl font-bold text-white">{remoteStatus.queueLength || 0}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
              <div className="text-gray-400 text-sm mb-1">Active Jobs</div>
              <div className="text-2xl font-bold text-white">{remoteStatus.activeJobs || 0}</div>
            </div>
          </div>
        )}

        {/* Training Mode Selection */}
        <div className="space-y-4">
          <h4 className="text-white font-semibold">Select Training Mode</h4>
          
          {/* Remote Training Button */}
          <button
            onClick={handleSendToDesktop}
            disabled={!remoteStatus?.worker?.online || submitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              remoteStatus?.worker?.online && !submitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Submitting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>🚀</span>
                Send to Desktop (2×2080Ti)
              </span>
            )}
          </button>

          {!remoteStatus?.worker?.online && (
            <div className="text-yellow-400 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>Desktop worker is offline. Training will fallback to local mode.</span>
            </div>
          )}

          {/* Local Training Button */}
          <button
            onClick={handleLocalTraining}
            disabled={submitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
              !submitting
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                Starting...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>💻</span>
                Train Locally (CPU/Laptop)
              </span>
            )}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-400 text-sm">
            <div className="font-semibold mb-2">ℹ️ Training Modes:</div>
            <ul className="space-y-1 ml-4">
              <li><strong>Remote:</strong> Fast training on desktop GPUs (2×2080Ti)</li>
              <li><strong>Local:</strong> Slower training on laptop CPU (fallback)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
