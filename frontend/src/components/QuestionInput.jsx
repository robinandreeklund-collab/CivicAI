import { useState } from 'react';

/**
 * QuestionInput Component - Based on full-ui-demo.html
 * 
 * Features:
 * - Simple, clean input field with send button
 * - Collapses from sides to center after submit
 * - Advanced step-by-step loader showing all actual processing steps
 * - Completed steps fade and move up, active step prominent
 * - Expands back smoothly when done
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, collapsing, processing, expanding
  const [processingSteps, setProcessingSteps] = useState([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

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
    setActiveStepIndex(0);
    
    // Clear the question input
    setQuestion('');
    
    // Define all processing steps based on actual backend flow
    const steps = [
      { id: 1, text: 'Hämtar svar från AI-tjänster', duration: 0 },
      { id: 2, text: 'Analyserar ton och sentiment', duration: 0 },
      { id: 3, text: 'Detekterar bias-mönster', duration: 0 },
      { id: 4, text: 'Genomför GPT metagranskning', duration: 0 },
      { id: 5, text: 'Faktakollar med Tavily Search', duration: 0 },
      { id: 6, text: 'Genererar BERT-sammanfattning', duration: 0 },
    ];
    
    // Initialize steps
    setProcessingSteps(steps.map(s => ({ ...s, status: 'pending' })));
    
    // Track overall start time
    const overallStart = Date.now();
    
    // Start first step
    let stepIndex = 0;
    const stepTimings = [];
    
    // Activate first step immediately
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    
    // Submit the question in background
    const submitPromise = onSubmit(submittedQuestion);
    
    // Simulate step progression based on realistic timing
    // Step 1: Fetching AI responses (longest - 8-15 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 2: Tone analysis (fast - 1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    await new Promise(resolve => setTimeout(resolve, 1000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 3: Bias detection (medium - 2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    await new Promise(resolve => setTimeout(resolve, 1500));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 4: GPT meta-review (medium-long - 3-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    await new Promise(resolve => setTimeout(resolve, 2000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 5: Tavily fact-checking (medium - 3-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    await new Promise(resolve => setTimeout(resolve, 2000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 6: BERT summarization (fast-medium - 1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    setActiveStepIndex(stepIndex);
    
    // Wait for actual submission to complete
    try {
      await submitPromise;
      stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
      setProcessingSteps(prev => prev.map((s, i) => 
        i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
      ));
    } catch (error) {
      console.error('Error during submission:', error);
    }
    
    // Short delay before expanding
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Phase 3: Expand back (600ms)
    setAnimationPhase('expanding');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Reset to idle
    setAnimationPhase('idle');
    setProcessingSteps([]);
    setActiveStepIndex(0);
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

        {/* Advanced Processing loader - shown during processing phase */}
        {animationPhase === 'processing' && (
          <div className="flex flex-col items-center justify-center space-y-6 py-8 animate-fade-in">
            {/* Thin line loader */}
            <div className="w-96 h-0.5 bg-civic-dark-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600" 
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
            </div>
            
            {/* Processing steps with visual hierarchy */}
            <div className="space-y-1 min-h-[200px] w-full max-w-md">
              {processingSteps.map((step, index) => {
                const isActive = step.status === 'active';
                const isComplete = step.status === 'complete';
                const isPending = step.status === 'pending';
                
                return (
                  <div 
                    key={step.id}
                    className={`
                      flex items-center justify-between px-4 py-2.5 rounded-lg
                      transition-all duration-500 ease-out
                      ${isActive ? 'bg-civic-dark-700/50 scale-105 shadow-lg' : ''}
                      ${isComplete ? 'bg-transparent scale-95 opacity-40' : ''}
                      ${isPending ? 'opacity-30' : ''}
                    `}
                    style={{
                      transform: isActive 
                        ? 'translateY(0) scale(1.05)' 
                        : isComplete 
                        ? 'translateY(-8px) scale(0.95)' 
                        : 'translateY(0)',
                      transformOrigin: 'center',
                    }}
                  >
                    {/* Icon/Status */}
                    <div className="flex items-center space-x-3 flex-1">
                      {isComplete && (
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-civic-gray-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      
                      {isActive && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      
                      {isPending && (
                        <div className="flex-shrink-0 w-5 h-5"></div>
                      )}
                      
                      {/* Step text */}
                      <span 
                        className={`
                          text-sm transition-all duration-500
                          ${isActive ? 'text-gray-100 font-semibold' : ''}
                          ${isComplete ? 'text-gray-600 font-normal' : ''}
                          ${isPending ? 'text-gray-700' : ''}
                        `}
                      >
                        {step.text}
                      </span>
                    </div>
                    
                    {/* Duration - only for completed steps */}
                    {isComplete && step.duration > 0 && (
                      <span className="text-xs text-gray-600 ml-3">
                        {step.duration}s
                      </span>
                    )}
                  </div>
                );
              })}
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
