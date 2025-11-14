/**
 * OneSeek.AI Animated Text Logo Component
 * Minimalist, animated text logo with grayscale gradient
 */
export default function AnimatedLogo({ size = 40, animated = true }) {
  // Calculate font size based on container size
  const fontSize = size * 0.35;
  
  return (
    <div 
      className="relative inline-flex items-center justify-center" 
      style={{ height: size }}
    >
      <style>
        {`
          @keyframes gradientShift {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes glowPulse {
            0%, 100% {
              text-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
              opacity: 0.85;
            }
            50% {
              text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
              opacity: 1;
            }
          }
        `}
      </style>
      
      <div
        style={{
          fontSize: `${fontSize}px`,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          background: animated 
            ? 'linear-gradient(90deg, #666 0%, #f5f5f5 50%, #666 100%)'
            : '#f5f5f5',
          backgroundSize: animated ? '200% 100%' : 'auto',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: animated ? 'gradientShift 3s ease-in-out infinite, glowPulse 2s ease-in-out infinite' : 'none',
          whiteSpace: 'nowrap',
        }}
      >
        OneSeek.AI
      </div>
    </div>
  );
}
