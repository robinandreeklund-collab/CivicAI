import { useState, useEffect } from 'react';

/**
 * ProcessingLoader Component
 * Sequential step-by-step AI processing with visual feedback
 * Features: three animated dots, sequential steps (no loop), green checkmarks, zoom effect on active step
 */
export default function ProcessingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    'Hämtar svar från AI-tjänster',
    'Analyserar svaren',
    'Faktakollar påståenden',
    'Genomför sentiment-analys',
    'Detekterar bias-mönster',
    'Sammanställer resultat',
    'Databearbetning klar',
  ];

  useEffect(() => {
    // Sequential progress through steps - NO LOOP
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        // Stay on last step when complete
        return prev;
      });
    }, 2000); // Each step takes 2 seconds

    return () => clearInterval(interval);
  }, [steps.length]);


  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Three animated dots - RETAINED as requested */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Processing steps - Text directly under dots, no boxes, grayscale */}
      <div className="w-full max-w-lg space-y-2">
        {steps.map((stepText, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div
              key={index}
              className={`
                relative flex items-center space-x-3 px-2 py-1
                transition-all duration-500 ease-out
                ${isActive ? 'scale-110' : 'scale-100'}
              `}
              style={{
                transformOrigin: 'left center',
              }}
            >
              {/* Checkmark for completed steps */}
              {isCompleted && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-civic-gray-500 flex items-center justify-center animate-scale-in">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Pulsing dot for active step */}
              {isActive && !isCompleted && (
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-civic-gray-400 animate-pulse"></div>
                </div>
              )}

              {/* Empty space for future steps */}
              {!isActive && !isCompleted && (
                <div className="flex-shrink-0 w-6 h-6"></div>
              )}

              {/* Step text - grayscale, no background box */}
              <p
                className={`
                  text-sm transition-all duration-500
                  ${isActive 
                    ? 'text-gray-200 font-semibold animate-pulse' 
                    : isCompleted
                    ? 'text-gray-500'
                    : 'text-gray-600'
                  }
                `}
              >
                {stepText}
              </p>

              {/* Cool zoom/magnifying effect on active step */}
              {isActive && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-civic-gray-400/5 rounded animate-ping"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
