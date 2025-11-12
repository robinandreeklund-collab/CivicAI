/**
 * CivicAI Animated Logo Component
 * Modern, animated SVG logo with gradient effects
 */
export default function AnimatedLogo({ size = 40, animated = true }) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      {/* Animated glow background */}
      {animated && (
        <div 
          className="absolute inset-0 rounded-xl opacity-40 blur-lg animate-pulse-slow"
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
          }}
        ></div>
      )}
      
      {/* Logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        {/* Background gradient circle */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6">
              {animated && <animate attributeName="stop-color" values="#3b82f6; #8b5cf6; #06b6d4; #3b82f6" dur="4s" repeatCount="indefinite" />}
            </stop>
            <stop offset="50%" stopColor="#8b5cf6">
              {animated && <animate attributeName="stop-color" values="#8b5cf6; #06b6d4; #3b82f6; #8b5cf6" dur="4s" repeatCount="indefinite" />}
            </stop>
            <stop offset="100%" stopColor="#06b6d4">
              {animated && <animate attributeName="stop-color" values="#06b6d4; #3b82f6; #8b5cf6; #06b6d4" dur="4s" repeatCount="indefinite" />}
            </stop>
          </linearGradient>
          
          <linearGradient id="compassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
          </linearGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Background rounded square with gradient */}
        <rect 
          x="5" 
          y="5" 
          width="90" 
          height="90" 
          rx="20" 
          fill="url(#logoGradient)"
          filter="url(#glow)"
        />

        {/* Compass symbol representing navigation and direction */}
        {/* Center circle */}
        <circle 
          cx="50" 
          cy="50" 
          r="8" 
          fill="url(#compassGradient)"
          opacity="0.9"
        >
          {animated && (
            <animate 
              attributeName="r" 
              values="8;9;8" 
              dur="2s" 
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Compass needle (N) - pointing up */}
        <path 
          d="M 50 25 L 45 45 L 50 42 L 55 45 Z" 
          fill="#ef4444"
          opacity="0.95"
        >
          {animated && (
            <>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 50 50"
                to="360 50 50"
                dur="8s"
                repeatCount="indefinite"
              />
              <animate 
                attributeName="opacity" 
                values="0.95;1;0.95" 
                dur="2s" 
                repeatCount="indefinite"
              />
            </>
          )}
        </path>

        {/* Compass needle (S) - pointing down */}
        <path 
          d="M 50 75 L 45 55 L 50 58 L 55 55 Z" 
          fill="url(#compassGradient)"
          opacity="0.7"
        >
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="8s"
              repeatCount="indefinite"
            />
          )}
        </path>

        {/* Outer ring with markers */}
        <circle 
          cx="50" 
          cy="50" 
          r="32" 
          stroke="url(#compassGradient)" 
          strokeWidth="2" 
          fill="none"
          opacity="0.4"
        >
          {animated && (
            <animate 
              attributeName="stroke-dasharray" 
              values="0 200; 200 200" 
              dur="2s" 
              fill="freeze"
            />
          )}
        </circle>

        {/* Cardinal direction markers (N, E, S, W) */}
        {/* North */}
        <circle cx="50" cy="18" r="2" fill="white" opacity="0.8" />
        {/* East */}
        <circle cx="82" cy="50" r="2" fill="white" opacity="0.6" />
        {/* South */}
        <circle cx="50" cy="82" r="2" fill="white" opacity="0.6" />
        {/* West */}
        <circle cx="18" cy="50" r="2" fill="white" opacity="0.6" />

        {/* AI circuit lines representing technology */}
        <g opacity="0.3" stroke="white" strokeWidth="1.5" strokeLinecap="round">
          <path d="M 30 30 L 35 30 L 35 35" />
          <path d="M 70 30 L 65 30 L 65 35" />
          <path d="M 30 70 L 35 70 L 35 65" />
          <path d="M 70 70 L 65 70 L 65 65" />
          <circle cx="35" cy="35" r="1.5" fill="white" />
          <circle cx="65" cy="35" r="1.5" fill="white" />
          <circle cx="35" cy="65" r="1.5" fill="white" />
          <circle cx="65" cy="65" r="1.5" fill="white" />
        </g>
      </svg>
    </div>
  );
}
