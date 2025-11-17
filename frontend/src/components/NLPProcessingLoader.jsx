import { useState, useEffect } from 'react';

/**
 * NLPProcessingLoader Component
 * Centered loader with rotating spinner and descriptive NLP processing steps
 * Shows one step at a time with detailed explanation
 */
export default function NLPProcessingLoader() {
  const [currentStep, setCurrentStep] = useState(0);

  // NLP processing steps with detailed descriptions
  const steps = [
    {
      title: 'Tokenisering',
      description: 'Delar upp din text i meningsfulla enheter - ord, meningar och fraser för djupare analys'
    },
    {
      title: 'Entitetsigenkänning',
      description: 'Identifierar viktiga element som namn, platser, organisationer och begrepp i din fråga'
    },
    {
      title: 'Sentimentanalys',
      description: 'Analyserar den känslomässiga tonen - positiv, negativ eller neutral inställning'
    },
    {
      title: 'Semantisk analys',
      description: 'Förstår innebörden och sammanhanget genom att analysera relationer mellan ord och begrepp'
    },
    {
      title: 'Sammanställning',
      description: 'Kombinerar alla analyser för att skapa ett intelligent och sammanhängande svar'
    }
  ];

  useEffect(() => {
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
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in text-center">
      {/* Rotating half-circle spinner */}
      <div 
        className="w-12 h-12 border-3 border-[#1a1a1a] border-t-[#888] rounded-full mb-8"
        style={{
          borderWidth: '3px',
          animation: 'spin 1s linear infinite'
        }}
      ></div>

      {/* Current step display - centered */}
      <div className="max-w-lg px-4">
        <div className="mb-3">
          <h3 className="text-lg text-[#e7e7e7] font-medium">
            {steps[currentStep].title}
          </h3>
        </div>
        <p className="text-sm text-[#888] leading-relaxed">
          {steps[currentStep].description}
        </p>
      </div>
    </div>
  );
}
