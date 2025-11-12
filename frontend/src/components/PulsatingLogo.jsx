/**
 * PulsatingLogo Component
 * Cool pulsating animation for the empty state
 */
export default function PulsatingLogo({ size = 120 }) {
  return (
    <div className="relative inline-block animate-fade-in" style={{ width: size, height: size }}>
      {/* Outer pulsating rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full border-2 border-blue-500/30 animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute w-full h-full rounded-full border-2 border-purple-500/30 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}></div>
        <div className="absolute w-full h-full rounded-full border-2 border-cyan-500/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.6s' }}></div>
      </div>

      {/* Central glowing orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Core with gradient */}
        <div 
          className="relative rounded-full shadow-2xl animate-pulse"
          style={{ 
            width: size * 0.6, 
            height: size * 0.6,
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          
          {/* Compass needle (rotating) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-1 bg-gradient-to-t from-red-500 to-white rounded-full shadow-lg"
              style={{ 
                height: size * 0.35,
                animation: 'spin 8s linear infinite',
                transformOrigin: 'center'
              }}
            ></div>
          </div>

          {/* Center dot */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-xl animate-pulse"
            style={{ width: size * 0.08, height: size * 0.08, animationDelay: '1s' }}
          ></div>
        </div>
      </div>

      {/* Orbiting particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { color: 'bg-blue-400', duration: '4s', delay: '0s', shadow: 'rgba(59, 130, 246, 0.8)' },
          { color: 'bg-purple-400', duration: '3s', delay: '0s', shadow: 'rgba(139, 92, 246, 0.8)', reverse: true },
          { color: 'bg-cyan-400', duration: '3.5s', delay: '0s', shadow: 'rgba(6, 182, 212, 0.8)' }
        ].map((particle, index) => (
          <div
            key={index}
            className={`absolute top-0 left-1/2 w-2 h-2 ${particle.color} rounded-full`}
            style={{
              marginLeft: '-4px',
              animation: `orbit-${size} ${particle.duration} linear infinite ${particle.reverse ? 'reverse' : 'normal'}`,
              boxShadow: `0 0 10px ${particle.shadow}`,
              animationDelay: particle.delay
            }}
          ></div>
        ))}
      </div>

      {/* Inject keyframes animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes orbit-${size} {
            from {
              transform: rotate(0deg) translateX(${size * 0.5}px) rotate(0deg);
            }
            to {
              transform: rotate(360deg) translateX(${size * 0.5}px) rotate(-360deg);
            }
          }
        `
      }} />
    </div>
  );
}
