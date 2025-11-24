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

  const getStatusBadge = (online) => {
    return online ? (
      <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#888] font-mono">ONLINE</span>
    ) : (
      <span className="px-2 py-0.5 text-[10px] border border-[#2a2a2a] text-[#555] font-mono">OFFLINE</span>
    );
  };

  return (
    <div className="border border-[#2a2a2a] bg-[#111] rounded">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-4 py-3">
        <h3 className="text-sm font-mono text-[#eee]">Remote Training Control</h3>
      </div>

      <div className="p-6 space-y-6">
        {/* Desktop Worker Status */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[#eee] font-mono text-xs">Desktop Worker Status</h4>
            <div className="flex items-center gap-2">
              {getStatusBadge(remoteStatus?.worker?.online)}
            </div>
          </div>

          {remoteStatus?.worker && (
            <div className="space-y-2 text-xs font-mono">
              {remoteStatus.worker.hostname && (
                <div className="flex justify-between">
                  <span className="text-[#666]">Hostname:</span>
                  <span className="text-[#888]">{remoteStatus.worker.hostname}</span>
                </div>
              )}
              {remoteStatus.worker.gpuInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#666]">GPU Count:</span>
                    <span className="text-[#888]">{remoteStatus.worker.gpuInfo.count}</span>
                  </div>
                  {remoteStatus.worker.gpuInfo.name && (
                    <div className="flex justify-between">
                      <span className="text-[#666]">GPU Model:</span>
                      <span className="text-[#888]">{remoteStatus.worker.gpuInfo.name}</span>
                    </div>
                  )}
                  {remoteStatus.worker.gpuInfo.memory && (
                    <div className="flex justify-between">
                      <span className="text-[#666]">GPU Memory:</span>
                      <span className="text-[#888]">{remoteStatus.worker.gpuInfo.memory}</span>
                    </div>
                  )}
                </>
              )}
              {remoteStatus.worker.lastPing && (
                <div className="flex justify-between">
                  <span className="text-[#666]">Last Ping:</span>
                  <span className="text-[#888]">
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
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-4">
              <div className="text-[#666] text-xs font-mono mb-1">Queue Length</div>
              <div className="text-lg font-mono text-[#eee]">{remoteStatus.queueLength || 0}</div>
            </div>
            <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-4">
              <div className="text-[#666] text-xs font-mono mb-1">Active Jobs</div>
              <div className="text-lg font-mono text-[#eee]">{remoteStatus.activeJobs || 0}</div>
            </div>
          </div>
        )}

        {/* Training Mode Selection */}
        <div className="space-y-4">
          <h4 className="text-[#eee] font-mono text-xs">Select Training Mode</h4>
          
          {/* Remote Training Button */}
          <button
            onClick={handleSendToDesktop}
            disabled={!remoteStatus?.worker?.online || submitting}
            className={`w-full py-3 px-4 border font-mono text-sm transition-colors ${
              remoteStatus?.worker?.online && !submitting
                ? 'border-[#2a2a2a] bg-[#1a1a1a] text-[#eee] hover:bg-[#2a2a2a]'
                : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#555] cursor-not-allowed'
            }`}
          >
            {submitting ? 'Submitting...' : 'Send to Desktop (2×2080Ti)'}
          </button>

          {!remoteStatus?.worker?.online && (
            <div className="text-[#888] text-xs font-mono flex items-center gap-2">
              <span>⚠</span>
              <span>Desktop worker is offline. Training will fallback to local mode.</span>
            </div>
          )}

          {/* Local Training Button */}
          <button
            onClick={handleLocalTraining}
            disabled={submitting}
            className={`w-full py-3 px-4 border font-mono text-sm transition-colors ${
              !submitting
                ? 'border-[#2a2a2a] bg-[#0a0a0a] text-[#888] hover:bg-[#1a1a1a]'
                : 'border-[#2a2a2a] bg-[#0a0a0a] text-[#555] cursor-not-allowed'
            }`}
          >
            {submitting ? 'Starting...' : 'Train Locally (CPU/Laptop)'}
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-[#0a0a0a] border border-[#2a2a2a] p-4">
          <div className="text-[#888] text-xs font-mono">
            <div className="text-[#eee] mb-2">Training Modes:</div>
            <ul className="space-y-1 ml-4">
              <li><span className="text-[#666]">Remote:</span> Fast training on desktop GPUs (2×2080Ti)</li>
              <li><span className="text-[#666]">Local:</span> Slower training on laptop CPU (fallback)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
