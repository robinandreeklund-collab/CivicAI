/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grayscale theme colors - minimalist and clean
        'civic-dark': {
          950: '#0a0a0a',
          900: '#1a1a1a',
          800: '#2a2a2a',
          750: '#3a3a3a',
          700: '#4a4a4a',
          600: '#505050',
          500: '#666666',
        },
        // Grayscale accents for different UI states
        'civic-gray': {
          100: '#f5f5f5',
          200: '#e0e0e0',
          300: '#c0c0c0',
          400: '#a0a0a0',
          500: '#888888',
          600: '#666666',
          700: '#505050',
          800: '#3a3a3a',
          900: '#2a2a2a',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'fade-out': 'fadeOut 0.6s ease-in forwards',
        'fade-in-scale': 'fadeInScale 0.5s ease-out',
        'slide-in': 'slideIn 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'scale-in': 'scaleIn 0.4s ease-out',
        'wiggle': 'wiggle 1s ease-in-out',
        'wheelbarrow-move': 'wheelbarrowMove 1s ease-in-out forwards',
        'arrow-flyaway': 'arrowFlyaway 0.8s ease-in-out forwards',
        'ping-once': 'pingOnce 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(60px)', opacity: '0.3' },
        },
        wheelbarrowMove: {
          '0%': { transform: 'translateX(0)', opacity: '0' },
          '20%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 255, 255, 0.2), 0 0 10px rgba(255, 255, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.4), 0 0 30px rgba(255, 255, 255, 0.2)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 255, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 30px rgba(255, 255, 255, 0.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-1deg)' },
          '75%': { transform: 'rotate(1deg)' },
        },
        arrowFlyaway: {
          '0%': { 
            transform: 'translateX(0) translateY(0) scale(1)', 
            opacity: '1' 
          },
          '50%': { 
            transform: 'translateX(40px) translateY(-20px) scale(1.5)', 
            opacity: '0.8' 
          },
          '100%': { 
            transform: 'translateX(100px) translateY(-50px) scale(0.5)', 
            opacity: '0' 
          },
        },
        pingOnce: {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '1' 
          },
          '50%': { 
            transform: 'scale(1.5)', 
            opacity: '0.5' 
          },
          '100%': { 
            transform: 'scale(1)', 
            opacity: '0' 
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
