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
      case 'error': return 'text-[#888]';
      case 'warn': return 'text-[#888]';
      case 'info': return 'text-[#888]';
      case 'success': return 'text-[#888]';
      default: return 'text-[#666]';
    }
  };

  const getWarningColor = (level) => {
    switch (level) {
      case 'critical': return 'text-[#888] font-mono';
      case 'warning': return 'text-[#888] font-mono';
      case 'info': return 'text-[#888] font-mono';
      default: return 'text-[#666] font-mono';
    }
  };

  return (
    <div className="border border-[#2a2a2a] bg-[#111] rounded">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-4 py-3">
        <h3 className="text-sm font-mono text-[#eee]">
          Training Console
        </h3>
      </div>

      {/* Size Info Panel */}
      {sizeInfo && (
        <div className="border-b border-[#2a2a2a] px-4 py-3 bg-[#0a0a0a]">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#666]">Base Model:</span>
              <span className="text-[#888]">{baseModel} ({sizeInfo.formatted.base})</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#666]">Adapters ({sizeInfo.adapterCount}):</span>
              <span className="text-[#888]">{sizeInfo.formatted.adapters}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono border-t border-[#2a2a2a] pt-2">
              <span className="text-[#666]">Total Size:</span>
              <span className="text-[#eee]">{sizeInfo.formatted.total}</span>
            </div>
            {sizeInfo.warning && sizeInfo.warning.level !== 'ok' && (
              <div className={`text-xs ${getWarningColor(sizeInfo.warning.level)} flex items-center gap-2 mt-2`}>
                <span>⚠</span>
                <span>{sizeInfo.warning.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Console Logs */}
      <div className="p-4 bg-[#0a0a0a]">
        <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-[#555]">Console logs will appear here...</div>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} className={`${getLogColor(log.level)} flex gap-2`}>
                <span className="text-[#555]">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-[#666]">[{log.level.toUpperCase()}]</span>
                <span>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Progress Bar (if training) */}
      {runId && (
        <div className="border-t border-[#2a2a2a] px-4 py-2 bg-[#0a0a0a]">
          <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] h-2">
            <div 
              className="bg-[#333] h-2 transition-all duration-300"
              style={{ width: '0%' }}
            />
          </div>
          <div className="text-xs text-[#666] font-mono mt-1 text-center">
            Training in progress...
          </div>
        </div>
      )}
    </div>
  );
}
