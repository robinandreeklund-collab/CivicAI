import { useState } from 'react';

/**
 * QuestionInput Component - Based on full-ui-demo.html
 * 
 * Features:
 * - Simple, clean input field with send button
 * - Collapses from sides to center after submit
 * - Step-by-step loader showing actual processing times
 * - Expands back smoothly when done
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, collapsing, processing, expanding
  const [processingSteps, setProcessingSteps] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    
    const submittedQuestion = question.trim();
    
    // Phase 1: Collapse animation (600ms)
    setAnimationPhase('collapsing');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Phase 2: Processing with step-by-step loader
    setAnimationPhase('processing');
    setProcessingSteps([]);
    
    // Clear the question input
    setQuestion('');
    
    // Track start time
    const startTime = Date.now();
    
    // Add first step
    setProcessingSteps([{ text: 'Hämtar svar från AI-tjänster', status: 'active' }]);
    
    // Submit the question
    try {
      await onSubmit(submittedQuestion);
      
      // Calculate actual time for fetching
      const fetchTime = Math.round((Date.now() - startTime) / 1000);
      
      // Update first step as complete
      setProcessingSteps([
        { text: 'Hämtar svar från AI-tjänster', status: 'complete', time: `${fetchTime} sekunder` }
      ]);
      
      // Short delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add second step
      const processStart = Date.now();
      setProcessingSteps(prev => [
        ...prev,
        { text: 'Bearbetar svaren', status: 'active' }
      ]);
      
      // Simulate processing time (adjust based on actual processing if needed)
      await new Promise(resolve => setTimeout(resolve, 800));
      const processTime = Math.round((Date.now() - processStart) / 1000);
      
      // Update second step as complete
      setProcessingSteps(prev => [
        prev[0],
        { text: 'Bearbetar svaren', status: 'complete', time: `${processTime} sekunder` }
      ]);
      
      // Short delay before expanding
      await new Promise(resolve => setTimeout(resolve, 400));
      
    } catch (error) {
      console.error('Error during submission:', error);
      // On error, still expand back
    }
    
    // Phase 3: Expand back (600ms)
    setAnimationPhase('expanding');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Reset to idle
    setAnimationPhase('idle');
    setProcessingSteps([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="relative">
        {/* Main search field - from full-ui-demo.html design */}
        <div 
          className={`
            transition-all duration-600 ease-in-out
            ${animationPhase === 'collapsing' ? 'scale-x-0 opacity-0' : ''}
            ${animationPhase === 'expanding' ? 'scale-x-100 opacity-100' : ''}
            ${animationPhase === 'processing' ? 'scale-x-0 opacity-0' : 'scale-x-100 opacity-100'}
          `}
          style={{
            transformOrigin: 'center',
          }}
        >
          <div className="relative">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ställ en fråga till AI-modellerna..."
              rows={1}
              className={`
                w-full
                px-5 py-4 pr-24
                bg-civic-dark-800 text-gray-200
                border border-civic-dark-600 rounded-xl
                transition-all duration-300
                focus:outline-none
                placeholder-gray-600
                resize-none
                ${isFocused 
                  ? 'border-civic-gray-600 bg-civic-dark-750 shadow-[0_4px_12px_rgba(0,0,0,0.3)]' 
                  : 'hover:border-civic-dark-500'
                }
              `}
              style={{
                fontFamily: 'inherit',
                fontSize: '15px',
                lineHeight: '1.5'
              }}
              disabled={isLoading || animationPhase !== 'idle'}
            />
            
            {/* Send button - positioned absolutely inside input */}
            <button
              type="submit"
              disabled={isLoading || !question.trim() || animationPhase !== 'idle'}
              className={`
                absolute right-3 bottom-3
                px-4 py-2 rounded-lg
                transition-all duration-300
                ${question.trim() && !isLoading && animationPhase === 'idle'
                  ? 'bg-gradient-to-br from-civic-gray-700 to-civic-gray-800 hover:from-civic-gray-600 hover:to-civic-gray-700 text-gray-100 border border-civic-gray-600' 
                  : 'bg-civic-dark-700 text-gray-700 cursor-not-allowed border border-civic-dark-600'
                }
              `}
              style={{
                fontSize: '13px',
                fontWeight: 500
              }}
            >
              Skicka
            </button>
          </div>
        </div>

        {/* Processing loader - shown during processing phase */}
        {animationPhase === 'processing' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in">
            {/* Thin line loader */}
            <div className="w-96 h-0.5 bg-civic-dark-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 animate-shimmer" style={{
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite'
              }}></div>
            </div>
            
            {/* Processing steps */}
            <div className="space-y-3 min-h-[80px]">
              {processingSteps.map((step, index) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-3 animate-fade-in"
                >
                  {step.status === 'active' ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4 text-civic-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`text-sm ${step.status === 'active' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {step.text}
                  </span>
                  {step.time && (
                    <span className="text-xs text-gray-600">
                      Färdigt, åtgång: {step.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick suggestions - only when idle and empty */}
        {animationPhase === 'idle' && !isLoading && question.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {['Demokrati och samhälle', 'Hållbar utveckling', 'AI och etik'].map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setQuestion(`Vad är ${suggestion.toLowerCase()}?`)}
                className="
                  px-4 py-2 text-sm rounded-full
                  bg-civic-dark-700 hover:bg-civic-dark-600
                  text-gray-400 hover:text-gray-200
                  border border-civic-dark-600 hover:border-civic-gray-600
                  transition-all duration-200 hover:scale-105
                "
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
