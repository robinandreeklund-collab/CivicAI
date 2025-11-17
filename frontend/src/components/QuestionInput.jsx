import { useState } from 'react';
import { useTypewriter } from '../hooks/useTypewriter';

/**
 * QuestionInput Component - Based on full-ui-demo.html
 * 
 * Features:
 * - Simple, clean input field with send button
 * - Typewriter animation with sample questions
 * - Intentional typos that get corrected
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

  // Sample questions for typewriter animation
  const sampleQuestions = [
    { text: 'Hur säkrar vi tillgång till psykisk vård?' },
    { text: 'Hur gör vi klimatomställningen rättvis?' },
    { text: 'Hur stärker vi ungas demokratiska tänkande?' },
    { 
      text: 'Hur löser vi bostadsbristen för unga?',
      typo: { text: 'Hur löser vi bostadsbresten för unga?' }
    },
    { text: 'Hur skyddar vi digital integritet?' },
    { 
      text: 'Hur minskar vi ekonomisk ojämlikhet?',
      typo: { text: 'Hur minskar vi ekonmisk ojämlikhet?' }
    },
    { text: 'Hur förbättrar vi integration och inkludering?' },
    { 
      text: 'Hur säkrar vi tillgång till kvalitativ utbildning?',
      typo: { text: 'Hur säkrar vi tillgång till kvalitativ utbilding?' }
    },
    { text: 'Hur bekämpar vi desinformation i samhället?' },
    { text: 'Hur stärker vi civilsamhällets inflytande?' }
  ];

  // Enable typewriter only when input is empty, not focused, and not loading
  const typewriterEnabled = !question && !isFocused && animationPhase === 'idle' && !isLoading;
  const { text: typewriterText } = useTypewriter(sampleQuestions, {
    typingSpeed: 80,
    deletingSpeed: 50,
    pauseDuration: 2000,
    pauseBeforeDelete: 800,
    enabled: typewriterEnabled
  });

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
    <div className="w-full max-w-[1080px] mx-auto">
      <style>{`
        .typewriter-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background-color: #888;
          animation: typewriter-blink 1s step-end infinite;
        }
        
        @keyframes typewriter-blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit} className="relative">
        {/* Main search field - matching 01-refined-card-stack.html design */}
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
            {/* Typewriter placeholder overlay - shown when input is empty and not focused */}
            {typewriterEnabled && typewriterText && (
              <div 
                className="absolute inset-0 px-5 py-4 pointer-events-none flex items-center text-[14px] text-[#888]"
                style={{ zIndex: 1 }}
              >
                <span>{typewriterText}</span>
                <span className="typewriter-cursor ml-0.5"></span>
              </div>
            )}

            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ställ en ny fråga..."
              className={`
                w-full
                px-5 pr-[60px]
                py-4
                bg-[#151515] text-[#e7e7e7]
                border rounded-[12px]
                transition-all duration-200
                focus:outline-none
                placeholder-[#666]
                text-[14px]
                ${isFocused 
                  ? 'border-[#3a3a3a] shadow-[0_4px_12px_rgba(0,0,0,0.3)]' 
                  : 'border-[#1a1a1a]'
                }
                relative
                ${typewriterEnabled && typewriterText ? 'placeholder-transparent' : ''}
              `}
              style={{ zIndex: 2, position: 'relative' }}
              disabled={isLoading || animationPhase !== 'idle'}
            />
            
            {/* Send button - icon only, matching reference design */}
            <button
              type="submit"
              disabled={isLoading || !question.trim() || animationPhase !== 'idle'}
              className={`
                absolute right-3 top-1/2 -translate-y-1/2
                w-9 h-9
                rounded-lg
                flex items-center justify-center
                text-base
                transition-all duration-200
                ${question.trim() && !isLoading && animationPhase === 'idle'
                  ? 'bg-[#e7e7e7] hover:bg-white text-[#0a0a0a] hover:scale-105' 
                  : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                }
              `}
            >
              →
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

      </form>
    </div>
  );
}
