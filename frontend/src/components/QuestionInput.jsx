import { useState } from 'react';

/**
 * QuestionInput Component - GitHub Comment Box Style
 * 
 * Design mimics GitHub's "submitting will post a pull request comment" textarea
 * with a small gray arrow icon in the bottom-right corner.
 * 
 * Animation flow:
 * 1. Question text slides down to wheelbarrow area
 * 2. Grayscale wheelbarrow man delivers question to arrow
 * 3. Arrow fills from gray to white as it loads the question
 * 4. Arrow flies away with smooth animation → transition to loader
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, textDown, wheelbarrow, arrowFill, flyaway

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    
    // Phase 1: Text slides down (400ms)
    setAnimationPhase('textDown');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Phase 2: Wheelbarrow man moves to arrow (1000ms)
    setAnimationPhase('wheelbarrow');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Phase 3: Arrow fills from gray to white (500ms)
    setAnimationPhase('arrowFill');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Phase 4: Arrow flies away (800ms)
    setAnimationPhase('flyaway');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Submit the question
    await onSubmit(question);
    
    // Reset
    setQuestion('');
    setAnimationPhase('idle');
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <form onSubmit={handleSubmit} className="relative">
        {/* Main input area - fades out during animation */}
        <div className={`
          transition-opacity duration-300
          ${animationPhase !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}>
          {/* GitHub-style textarea */}
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
              placeholder="Skriv din fråga här... (Tryck Enter för att skicka, Shift+Enter för ny rad)"
              className={`
                w-full min-h-[120px] max-h-[300px] resize-y
                px-4 py-3
                bg-civic-dark-800 text-gray-200
                border-2 rounded-md
                transition-all duration-200
                focus:outline-none
                placeholder-gray-500
                ${isFocused 
                  ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' 
                  : 'border-civic-dark-600 hover:border-civic-dark-500'
                }
              `}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              disabled={isLoading || isSubmitting}
            />
          </div>
          
          {/* Bottom area - GitHub style "submitting will post..." text + arrow icon */}
          <div className="flex items-center justify-between mt-2 px-2">
            {/* Left side text (like GitHub) */}
            <div className="text-xs text-gray-600 italic">
              Tryckning på Enter kommer att skicka frågan till AI-modellerna
            </div>
            
            {/* Right side: Small gray arrow icon (no text, no button styling) */}
            <button
              type="submit"
              disabled={isLoading || !question.trim() || isSubmitting}
              className={`
                p-2 rounded-md
                transition-all duration-200
                ${question.trim() && !isLoading && !isSubmitting
                  ? 'text-gray-500 hover:text-white hover:bg-civic-dark-700' 
                  : 'text-gray-700 cursor-not-allowed'
                }
              `}
              title="Skicka fråga (Enter)"
              aria-label="Skicka fråga"
            >
              {/* Simple arrow/send icon */}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animation area - shown during submission */}
        {animationPhase !== 'idle' && (
          <div className="relative h-40 overflow-visible">
            {/* Phase 1: Question text slides down */}
            {animationPhase === 'textDown' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-slide-down">
                <div className="bg-blue-600/20 text-blue-200 text-sm px-4 py-2 rounded-md whitespace-nowrap max-w-md overflow-hidden text-ellipsis shadow-lg">
                  {question.substring(0, 50)}{question.length > 50 ? '...' : ''}
                </div>
              </div>
            )}
            
            {/* Phase 2 & 3: Wheelbarrow man delivers question to arrow (grayscale) */}
            {(animationPhase === 'wheelbarrow' || animationPhase === 'arrowFill') && (
              <div className="absolute bottom-12 left-0 animate-wheelbarrow-move">
                <div className="flex items-center space-x-2">
                  {/* Grayscale man with wheelbarrow */}
                  <span className="text-4xl grayscale opacity-60">🚶</span>
                  <span className="text-3xl grayscale opacity-60">��</span>
                  <div className="bg-blue-600/30 text-blue-300 text-xs px-2 py-1 rounded shadow">
                    ��
                  </div>
                </div>
              </div>
            )}
            
            {/* Phase 3 & 4: Arrow - fills from gray to white, then flies away */}
            {(animationPhase === 'wheelbarrow' || animationPhase === 'arrowFill' || animationPhase === 'flyaway') && (
              <div className={`
                absolute bottom-4 right-12
                transition-all duration-500
                ${animationPhase === 'flyaway' ? 'animate-arrow-flyaway' : ''}
              `}>
                <svg 
                  className={`
                    w-10 h-10 transition-all duration-500
                    ${animationPhase === 'arrowFill' || animationPhase === 'flyaway' 
                      ? 'text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)]' 
                      : 'text-gray-600'
                    }
                  `} 
                  fill={animationPhase === 'arrowFill' || animationPhase === 'flyaway' ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={animationPhase === 'arrowFill' || animationPhase === 'flyaway' ? 0 : 2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Quick suggestions - NO character counter */}
        {!isLoading && !isSubmitting && question.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {['Demokrati och samhälle', 'Hållbar utveckling', 'AI och etik'].map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setQuestion(`Vad är ${suggestion.toLowerCase()}?`)}
                className="
                  px-3 py-1.5 text-xs rounded-full
                  bg-civic-dark-700 hover:bg-civic-dark-600
                  text-gray-400 hover:text-gray-200
                  border border-civic-dark-600 hover:border-blue-500/40
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
