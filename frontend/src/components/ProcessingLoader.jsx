import { useState, useEffect } from 'react';

/**
 * ProcessingLoader Component
 * Shows step-by-step AI processing with visual feedback
 */
export default function ProcessingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { id: 0, text: 'Hämtar svar från AI-tjänster', icon: '🤖', color: 'blue' },
    { id: 1, text: 'Jämför svaren', icon: '⚖️', color: 'purple' },
    { id: 2, text: 'Analyserar ton och stil', icon: '💬', color: 'cyan' },
    { id: 3, text: 'Analyserar bias-detektion', icon: '🎯', color: 'orange' },
    { id: 4, text: 'Genomför faktakontroll', icon: '🔍', color: 'green' },
    { id: 5, text: 'Sammanställer svar', icon: '📊', color: 'indigo' },
    { id: 6, text: 'Utför syntetiserad sammanfattning', icon: '✨', color: 'emerald' },
  ];

  useEffect(() => {
    // Progress through steps
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return 0; // Loop back
      });
    }, 800); // Change step every 800ms

    return () => clearInterval(interval);
  }, [steps.length]);

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-400',
        border: 'border-blue-500',
        shadow: 'shadow-blue-500/50',
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-400',
        border: 'border-purple-500',
        shadow: 'shadow-purple-500/50',
      },
      cyan: {
        bg: 'bg-cyan-500',
        text: 'text-cyan-400',
        border: 'border-cyan-500',
        shadow: 'shadow-cyan-500/50',
      },
      orange: {
        bg: 'bg-orange-500',
        text: 'text-orange-400',
        border: 'border-orange-500',
        shadow: 'shadow-orange-500/50',
      },
      green: {
        bg: 'bg-green-500',
        text: 'text-green-400',
        border: 'border-green-500',
        shadow: 'shadow-green-500/50',
      },
      indigo: {
        bg: 'bg-indigo-500',
        text: 'text-indigo-400',
        border: 'border-indigo-500',
        shadow: 'shadow-indigo-500/50',
      },
      emerald: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-400',
        border: 'border-emerald-500',
        shadow: 'shadow-emerald-500/50',
      },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="max-w-4xl mx-auto py-12 animate-fade-in">
      <div className="flex flex-col items-center space-y-8">
        {/* Animated dots loader */}
        <div className="flex items-center space-x-3">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>

        {/* Processing steps */}
        <div className="w-full max-w-2xl space-y-3">
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const colors = getColorClasses(step.color);

            return (
              <div
                key={step.id}
                className={`
                  relative flex items-center space-x-4 p-4 rounded-xl
                  transition-all duration-300 ease-out
                  ${isActive 
                    ? `bg-civic-dark-700/80 border-2 ${colors.border} scale-105 shadow-lg ${colors.shadow}` 
                    : isCompleted
                    ? 'bg-civic-dark-800/50 border border-civic-dark-600 opacity-50'
                    : 'bg-civic-dark-800/30 border border-civic-dark-700 opacity-30'
                  }
                `}
              >
                {/* Step icon */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                    transition-all duration-300
                    ${isActive 
                      ? `${colors.bg} shadow-lg ${colors.shadow} animate-bounce-slow` 
                      : isCompleted
                      ? 'bg-civic-dark-700'
                      : 'bg-civic-dark-800'
                    }
                  `}
                >
                  {step.icon}
                </div>

                {/* Step text */}
                <div className="flex-1">
                  <p
                    className={`
                      font-medium transition-all duration-300
                      ${isActive 
                        ? `${colors.text} text-base` 
                        : isCompleted
                        ? 'text-gray-500 text-sm'
                        : 'text-gray-600 text-sm'
                      }
                    `}
                  >
                    {step.text}
                  </p>
                </div>

                {/* Status indicator */}
                {isActive && (
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${colors.bg} animate-pulse`}></div>
                  </div>
                )}

                {isCompleted && (
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Shimmer effect for active step */}
                {isActive && (
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div className="absolute inset-0 shimmer"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="w-full max-w-2xl">
          <div className="relative h-2 bg-civic-dark-800 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            ></div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-gray-500">
            <span>Bearbetning pågår...</span>
            <span>{currentStep + 1} / {steps.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
