/**
 * FirebaseStatusIndicator Component
 * Displays real-time Firebase question processing status
 * Part of Firebase Integration - Step 1
 */

export default function FirebaseStatusIndicator({ status, className = '' }) {
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
          text: 'Bearbetning pågår…',
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

  return (
    <div 
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bgColor} ${className}`}
      title={`Firebase status: ${status}`}
    >
      <span className={`text-sm ${config.animate ? 'animate-spin' : ''}`}>
        {config.icon}
      </span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    </div>
  );
}
