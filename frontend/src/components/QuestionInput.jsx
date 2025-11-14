import { useState } from 'react';

/**
 * QuestionInput Component - Improved Design
 * 
 * Features:
 * - Send arrow icon inside textarea at bottom right
 * - Hint text inside textarea with thin white transparent divider
 * - Simplified animation: text slides down to hint area, then animates to filled arrow (white)
 * - Question suggestions only below textarea (not in center/top of dashboard)
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // idle, textDown, arrowFill

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    
    // Phase 1: Text slides down to hint area (400ms)
    setAnimationPhase('textDown');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Phase 2: Arrow fills from gray to white (500ms)
    setAnimationPhase('arrowFill');
    await new Promise(resolve => setTimeout(resolve, 500));
    
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
        {/* Main input area */}
        <div className={`
          transition-opacity duration-300
          ${animationPhase !== 'idle' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}>
          {/* Textarea with arrow icon inside */}
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
              placeholder="Skriv din fråga här..."
              className={`
                w-full min-h-[140px] max-h-[300px] resize-y
                px-4 pt-3 pb-12
                bg-civic-dark-800 text-gray-200
                border-2 rounded-md
                transition-all duration-200
                focus:outline-none
                placeholder-gray-500
                ${isFocused 
                  ? 'border-civic-gray-500 shadow-[0_0_0_3px_rgba(59,130,246,0.15)]' 
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
            
            {/* Thin white transparent divider line */}
            <div className="absolute bottom-10 left-4 right-4 h-px bg-white/10"></div>
            
            {/* Hint text at bottom of textarea */}
            <div className="absolute bottom-3 left-4 right-16 flex items-center">
              <div className="text-xs text-gray-600 italic">
                Tryck Enter för att skicka, Shift+Enter för ny rad
              </div>
            </div>
            
            {/* Send arrow icon - anchored at bottom right inside textarea */}
            <button
              type="submit"
              disabled={isLoading || !question.trim() || isSubmitting}
              className={`
                absolute bottom-2 right-2
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animation area - shown during submission */}
        {animationPhase !== 'idle' && (
          <div className="relative h-40 overflow-visible">
            {/* Phase 1: Question text slides down to hint area */}
            {animationPhase === 'textDown' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 animate-slide-down">
                <div className="bg-civic-gray-600/20 text-gray-200 text-sm px-4 py-2 rounded-md whitespace-nowrap max-w-md overflow-hidden text-ellipsis shadow-lg">
                  {question.substring(0, 50)}{question.length > 50 ? '...' : ''}
                </div>
              </div>
            )}
            
            {/* Phase 2: Arrow fills from gray to white */}
            {animationPhase === 'arrowFill' && (
              <div className="absolute bottom-4 right-12">
                <svg 
                  className="w-10 h-10 text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] transition-all duration-500" 
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Quick suggestions - only below textarea */}
        {!isLoading && !isSubmitting && question.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {['Demokrati och samhälle', 'Hållbar utveckling', 'AI och etik'].map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setQuestion(`Vad är ${suggestion.toLowerCase()}?`)}
                className="
                  px-3 py-1.5 text-xs rounded-full
                  bg-civic-dark-700 hover:bg-civic-dark-600
                  text-gray-400 hover:text-gray-200
                  border border-civic-dark-600 hover:border-civic-gray-500/40
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
