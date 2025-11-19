/**
 * FirebaseStatusIndicator Component
 * Displays real-time Firebase question processing status with pipeline progress
 * Part of Firebase Integration - Step 2 (Enhanced)
 */

export default function FirebaseStatusIndicator({ 
  status, 
  pipelineProgress = null,
  className = '' 
}) {
  if (!status || status === 'idle') return null;

  const getStatusConfig = (status) => {
    switch (status) {
      case 'received':
        return {
          text: 'Fråga mottagen',
          color: 'text-blue-400',
          bgColor: 'bg-blue-400/10',
          icon: '📥'
        };
      case 'processing':
        return {
          text: pipelineProgress?.currentStep || 'Bearbetning pågår…',
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          icon: '⚙️',
          animate: true
        };
      case 'completed':
        return {
          text: 'Analys färdig',
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          icon: '✅'
        };
      case 'ledger_verified':
        return {
          text: 'Data verifierad',
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-400/10',
          icon: '🔒'
        };
      case 'error':
        return {
          text: 'Ett fel uppstod',
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          icon: '❌'
        };
      default:
        return {
          text: 'Status okänd',
          color: 'text-gray-400',
          bgColor: 'bg-gray-400/10',
          icon: '❓'
        };
    }
  };

  const config = getStatusConfig(status);
  
  // Calculate progress percentage
  const progressPercentage = pipelineProgress?.totalSteps > 0
    ? Math.round((pipelineProgress.stepsCompleted / pipelineProgress.totalSteps) * 100)
    : 0;

  return (
    <div 
      className={`inline-flex flex-col gap-1 px-3 py-2 rounded-lg ${config.bgColor} ${className}`}
      title={`Firebase status: ${status}`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm ${config.animate ? 'animate-spin' : ''}`}>
          {config.icon}
        </span>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
      
      {/* Progress bar for processing state */}
      {status === 'processing' && pipelineProgress && (
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Steg {pipelineProgress.stepsCompleted}/{pipelineProgress.totalSteps}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {/* Status log for debugging (can be toggled) */}
      {pipelineProgress?.statusLog && pipelineProgress.statusLog.length > 0 && (
        <details className="mt-1">
          <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-400">
            Visa logg ({pipelineProgress.statusLog.length} steg)
          </summary>
          <div className="mt-1 space-y-0.5 max-h-32 overflow-y-auto">
            {pipelineProgress.statusLog.map((log, idx) => (
              <div key={idx} className="text-[9px] text-gray-500 font-mono">
                <span className="text-gray-600">{new Date(log.timestamp).toLocaleTimeString('sv-SE')}</span>
                {' → '}
                <span className="text-gray-400">{log.message}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
