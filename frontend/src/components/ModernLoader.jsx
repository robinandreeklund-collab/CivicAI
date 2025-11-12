/**
 * ModernLoader Component
 * Impressive animated loader with multiple visual effects
 */
export default function ModernLoader({ message = "Hämtar svar från AI-modeller..." }) {
  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-8">
        {/* Orbiting circles loader */}
        <div className="relative w-32 h-32">
          {/* Center pulse */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse-slow"></div>
          </div>
          
          {/* Orbiting circles */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s' }}>
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
          </div>
          
          {/* Outer ring */}
          <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute inset-2 border-2 border-purple-500/20 rounded-full animate-pulse-slow" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Typing indicator */}
        <div className="flex items-center space-x-3">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Loading message with shimmer effect */}
        <div className="relative overflow-hidden px-6 py-2 rounded-full bg-civic-dark-800/50 backdrop-blur-sm">
          <p className="text-gray-300 font-medium relative z-10">{message}</p>
          <div className="absolute inset-0 shimmer"></div>
        </div>

        {/* Progress bars */}
        <div className="w-full max-w-md space-y-3">
          <div className="relative h-1 bg-civic-dark-700 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse-slow"
              style={{ 
                width: '70%',
                animation: 'progress 2s ease-in-out infinite'
              }}
            ></div>
          </div>
          <div className="relative h-1 bg-civic-dark-700 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse-slow"
              style={{ 
                width: '50%',
                animation: 'progress 2.5s ease-in-out infinite',
                animationDelay: '0.3s'
              }}
            ></div>
          </div>
        </div>

        <style>{`
          @keyframes progress {
            0%, 100% {
              width: 30%;
              opacity: 0.5;
            }
            50% {
              width: 90%;
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
