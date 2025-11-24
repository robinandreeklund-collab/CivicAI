import { useState, useEffect } from 'react';

/**
 * Training Console Component
 * 
 * Real-time console display with model size tracking
 * Shows: Base model size + adapter sizes = Total size with warnings
 */
export default function TrainingConsole({ baseModel, adapters = [], runId }) {
  const [sizeInfo, setSizeInfo] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (baseModel) {
      fetchSizeInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseModel, adapters]);

  useEffect(() => {
    if (runId) {
      fetchTrainingLogs();
      const interval = setInterval(fetchTrainingLogs, 2000);
      return () => clearInterval(interval);
    }
  }, [runId]);

  const fetchSizeInfo = async () => {
    try {
      const adaptersList = adapters.join(',');
      const response = await fetch(`/api/remote/chain/size?baseModel=${baseModel}&adapters=${adaptersList}`);
      if (response.ok) {
        const data = await response.json();
        setSizeInfo(data);
        
        // Add size info to logs
        addLog('info', `Loading chain: Base ${data.formatted.base} + ${data.adapterCount} adapters (${data.formatted.adapters}) = Total ${data.formatted.total}`);
        
        if (data.warning.level === 'warning' || data.warning.level === 'critical') {
          addLog('warn', data.warning.message);
        }
      }
    } catch (error) {
      console.error('Error fetching size info:', error);
    }
  };

  const fetchTrainingLogs = async () => {
    try {
      const response = await fetch(`/api/admin/training/status`);
      if (response.ok) {
        const data = await response.json();
        if (data.logs && data.logs.length > 0) {
          setLogs(data.logs);
        }
      }
    } catch (error) {
      console.error('Error fetching training logs:', error);
    }
  };

  const addLog = (level, message) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level,
      message
    }]);
  };

  const getLogColor = (level) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      case 'success': return 'text-green-400';
      default: return 'text-gray-300';
    }
  };

  const getWarningColor = (level) => {
    switch (level) {
      case 'critical': return 'text-red-500 font-bold';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="border-b border-gray-700 px-4 py-3">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-green-500">▶</span>
          Training Console
        </h3>
      </div>

      {/* Size Info Panel */}
      {sizeInfo && (
        <div className="border-b border-gray-700 px-4 py-3 bg-gray-800">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Base Model:</span>
              <span className="text-white font-mono">{baseModel} ({sizeInfo.formatted.base})</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Adapters ({sizeInfo.adapterCount}):</span>
              <span className="text-white font-mono">{sizeInfo.formatted.adapters}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold border-t border-gray-700 pt-2">
              <span className="text-gray-300">Total Size:</span>
              <span className="text-white font-mono text-lg">{sizeInfo.formatted.total}</span>
            </div>
            {sizeInfo.warning && sizeInfo.warning.level !== 'ok' && (
              <div className={`text-sm ${getWarningColor(sizeInfo.warning.level)} flex items-center gap-2 mt-2`}>
                <span>⚠️</span>
                <span>{sizeInfo.warning.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div className="p-4 bg-black rounded-b-lg">
        <div className="font-mono text-sm space-y-1 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500 italic">Console logs will appear here...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={`${getLogColor(log.level)} flex gap-2`}>
                <span className="text-gray-600">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="font-semibold">[{log.level.toUpperCase()}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Bar (if training) */}
      {runId && (
        <div className="border-t border-gray-700 px-4 py-2 bg-gray-800">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: '0%' }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1 text-center">
            Training in progress...
          </div>
        </div>
      )}
    </div>
  );
}
