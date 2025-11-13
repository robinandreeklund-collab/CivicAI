import { useState } from 'react';

/**
 * QuestionInput Component
 * GitHub-inspired design with stunning submit animations
 * 
 * Features:
 * - GitHub-style textarea with rounded corners and shadows
 * - Shrink animation from top-to-bottom on submit
 * - Arrow icon pops out and flies away
 * - Smooth fade-out transition to loader
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showArrowFlyaway, setShowArrowFlyaway] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim() && !isSubmitting) {
      // Trigger animations
      setIsSubmitting(true);
      setShowArrowFlyaway(true);
      
      // Wait for shrink animation to complete before calling onSubmit
      setTimeout(async () => {
        await onSubmit(question);
        // Reset states after submission completes
        setTimeout(() => {
          setIsSubmitting(false);
          setShowArrowFlyaway(false);
        }, 500);
      }, 600); // Match animation duration
    }
  };

  return (
    <div className={`
      w-full max-w-4xl mx-auto mb-12
      ${!isSubmitting ? 'animate-fade-in-up' : ''}
      ${isSubmitting ? 'animate-fade-out' : ''}
    `}>
      <form onSubmit={handleSubmit} className="relative">
        {/* GitHub-inspired container with shrink animation */}
        <div className={`
          relative
          transition-all duration-600 ease-in-out origin-top
          ${isSubmitting ? 'scale-y-0 opacity-0' : 'scale-y-100 opacity-100'}
        `}>
          {/* Floating label */}
          <label 
            htmlFor="question" 
            className={`
              block font-medium mb-3 transition-all duration-300
              ${isFocused ? 'text-blue-400' : 'text-gray-400'}
              ${isSubmitting ? 'opacity-0' : 'opacity-100'}
            `}
          >
            <span className="inline-flex items-center space-x-2 text-sm">
              <span className="text-xl">💭</span>
              <span>Ställ din fråga till AI-modellerna</span>
            </span>
          </label>
          
          {/* GitHub-style textarea container */}
          <div className="relative group">
            <textarea
              id="question"
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
                border-2 rounded-lg
                transition-all duration-300
                focus:outline-none
                placeholder-gray-500
                ${isFocused 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                  : 'border-civic-dark-600 hover:border-civic-dark-500'
                }
                ${isSubmitting ? 'pointer-events-none' : ''}
              `}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                lineHeight: '1.5'
              }}
              disabled={isLoading || isSubmitting}
            />
            
            {/* Subtle glow effect on focus (GitHub-style) */}
            {isFocused && !isSubmitting && (
              <div className="absolute inset-0 -z-10 bg-blue-500/5 blur-xl rounded-lg"></div>
            )}
            
            {/* Bottom toolbar (GitHub-style) */}
            <div className={`
              flex items-center justify-between
              px-3 py-2
              bg-civic-dark-750 border-t-2 border-civic-dark-600
              rounded-b-lg
              transition-all duration-300
              ${isSubmitting ? 'opacity-0' : 'opacity-100'}
            `}>
              <div className="flex items-center space-x-3 text-xs text-gray-500">
                <span className="inline-flex items-center space-x-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{question.length} tecken</span>
                </span>
              </div>
              
              {/* Submit arrow button (GitHub-style) - pops out on submit */}
              <button
                type="submit"
                disabled={isLoading || !question.trim() || isSubmitting}
                className={`
                  relative
                  px-3 py-1.5 rounded-md
                  bg-blue-600 hover:bg-blue-500
                  text-white text-sm font-medium
                  transition-all duration-300
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600
                  ${!question.trim() ? 'scale-90 opacity-50' : 'scale-100 opacity-100'}
                  hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30
                `}
                title="Skicka fråga (Enter)"
              >
                <span className="inline-flex items-center space-x-1.5">
                  <span>Skicka</span>
                  <svg 
                    className={`
                      w-4 h-4 transition-transform duration-300
                      ${isFocused && question.trim() ? 'translate-x-0.5' : ''}
                    `} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Flying arrow animation (pops out when submitting) */}
        {showArrowFlyaway && (
          <div className="absolute bottom-2 right-4 animate-arrow-flyaway pointer-events-none z-50">
            <div className="text-blue-400 animate-ping-once">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        )}

        {/* Thin line effect after shrink */}
        {isSubmitting && (
          <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse"></div>
        )}

        {/* Quick suggestions (GitHub-style pills) */}
        {!isLoading && !isSubmitting && question.length === 0 && (
          <div className="flex flex-wrap gap-2 mt-4 animate-fade-in">
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
                  transition-all duration-300 hover:scale-105
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
