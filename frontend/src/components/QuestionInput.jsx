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
    
    // Define all processing steps based on comprehensive analysis pipeline
    const steps = [
      { id: 1, text: 'Hämtar svar från AI-tjänster', duration: 0 },
      { id: 2, text: 'Förbearbetar text och extraherar nyckelord', duration: 0 },
      { id: 3, text: 'Analyserar sentiment och emotionell ton', duration: 0 },
      { id: 4, text: 'Detekterar bias-mönster', duration: 0 },
      { id: 5, text: 'Klassificerar ideologisk inriktning', duration: 0 },
      { id: 6, text: 'Genomför GPT metagranskning', duration: 0 },
      { id: 7, text: 'Faktakollar med Tavily Search', duration: 0 },
      { id: 8, text: 'Genererar neutral sammanfattning', duration: 0 },
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
    
    // Submit the question in background
    const submitPromise = onSubmit(submittedQuestion);
    
    // Simulate step progression based on comprehensive analysis pipeline timing
    // Step 1: Fetching AI responses (longest - 8-15 seconds)
    await new Promise(resolve => setTimeout(resolve, 3000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 2: Text preprocessing (fast - 0.5-1 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 800));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 3: Sentiment analysis (fast - 1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 1000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 4: Bias detection (medium - 1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 1200));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 5: Ideological classification (fast - 1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 1000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 6: GPT meta-review (medium-long - 3-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 2000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 7: Tavily fact-checking (medium - 3-4 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    await new Promise(resolve => setTimeout(resolve, 2000));
    stepTimings.push(Math.round((Date.now() - overallStart) / 1000) - stepTimings.reduce((a,b) => a+b, 0));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'complete', duration: stepTimings[stepIndex] } : s
    ));
    stepIndex++;
    
    // Step 8: Generate neutral summary (fast-medium - 1-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 500));
    setProcessingSteps(prev => prev.map((s, i) => 
      i === stepIndex ? { ...s, status: 'active', startTime: Date.now() } : s
    ));
    
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
                px-6 py-5 pr-28
                bg-[#151515] text-[#e7e7e7]
                border-2 rounded-xl
                transition-all duration-300
                focus:outline-none
                placeholder-[#666]
                resize-none
                text-base
                ${isFocused 
                  ? 'border-[#3a3a3a] bg-[#1a1a1a] shadow-[0_8px_24px_rgba(0,0,0,0.4)] scale-[1.01]' 
                  : 'border-[#2a2a2a] hover:border-[#3a3a3a] hover:bg-[#1a1a1a]'
                }
              `}
              style={{
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.6'
              }}
              disabled={isLoading || animationPhase !== 'idle'}
            />
            
            {/* Send button - positioned absolutely inside input */}
            <button
              type="submit"
              disabled={isLoading || !question.trim() || animationPhase !== 'idle'}
              className={`
                absolute right-4 bottom-4
                px-5 py-2.5 rounded-lg
                transition-all duration-300
                font-medium text-sm
                ${question.trim() && !isLoading && animationPhase === 'idle'
                  ? 'bg-[#e7e7e7] hover:bg-white text-[#0a0a0a] border-2 border-[#e7e7e7] hover:shadow-lg hover:scale-105' 
                  : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed border-2 border-[#2a2a2a]'
                }
              `}
            >
              Skicka
            </button>
          </div>
        </div>

        {/* Clean Processing loader - shown during processing phase */}
        {animationPhase === 'processing' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fade-in">
            {/* Thin line loader */}
            <div className="w-96 h-0.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#666] via-[#888] to-[#666]" 
                style={{
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite'
                }}
              ></div>
            </div>
            
            {/* Processing steps - clean one-at-a-time display */}
            <div className="space-y-3 min-h-[80px]">
              {processingSteps.map((step) => {
                const isActive = step.status === 'active';
                
                // Only show the currently active step (one at a time)
                if (!isActive) return null;
                
                return (
                  <div 
                    key={step.id}
                    className="flex items-center space-x-3 animate-fade-in"
                  >
                    <div className="w-4 h-4 border-2 border-[#888] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-[#888]">
                      {step.text}
                    </span>
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
                  bg-[#2a2a2a] hover:bg-[#3a3a3a]
                  text-[#888] hover:text-[#e7e7e7]
                  border border-[#3a3a3a] hover:border-[#4a4a4a]
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
