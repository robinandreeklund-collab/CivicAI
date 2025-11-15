import { useState, useEffect } from 'react';

/**
 * ProcessingLoader Component
 * Sequential step-by-step analysis pipeline with visual feedback
 * Steps: preprocessing, sentiment analysis, ideological classification
 * Only one textual step visible at a time
 */
export default function ProcessingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  // Updated steps to match comprehensive analysis pipeline
  const steps = [
    'Förbearbetar text och extraherar nyckelord',
    'Analyserar sentiment och emotionell ton',
    'Klassificerar ideologisk inriktning',
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
    }, 2500); // Each step takes 2.5 seconds

    return () => clearInterval(interval);
  }, [steps.length]);


  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      {/* Three animated dots */}
      <div className="flex items-center justify-center space-x-3 mb-8">
        <div className="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Current step text - only one visible at a time */}
      <div className="w-full max-w-lg">
        <div className="relative flex items-center justify-center space-x-3 px-2 py-1">
          {/* Pulsing dot for active step */}
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-civic-gray-400 animate-pulse"></div>
          </div>

          {/* Step text */}
          <p className="text-sm text-gray-200 font-semibold animate-pulse">
            {steps[currentStep]}
          </p>

          {/* Zoom/magnifying effect on active step */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-civic-gray-400/5 rounded animate-ping"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
