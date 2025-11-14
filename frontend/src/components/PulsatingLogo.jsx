/**
 * PulsatingLogo Component
 * Animated text logo for the empty state - grayscale only
 */
export default function PulsatingLogo({ size = 120 }) {
  const fontSize = size * 0.6;
  
  return (
    <div className="relative inline-flex items-center justify-center animate-fade-in" style={{ height: size }}>
      <style>
        {`
          @keyframes gradientShiftLarge {
            0%, 100% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
          }
          
          @keyframes glowPulseLarge {
            0%, 100% {
              text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
              opacity: 0.8;
            }
            50% {
              text-shadow: 0 0 40px rgba(255, 255, 255, 0.5);
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
          background: 'linear-gradient(90deg, #666 0%, #f5f5f5 30%, #f5f5f5 70%, #666 100%)',
          backgroundSize: '200% 100%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'gradientShiftLarge 3s ease-in-out infinite, glowPulseLarge 2s ease-in-out infinite',
          whiteSpace: 'nowrap',
        }}
      >
        OneSeek.AI
      </div>
    </div>
  );
}
