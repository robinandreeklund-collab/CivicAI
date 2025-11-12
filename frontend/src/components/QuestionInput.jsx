import { useState } from 'react';

/**
 * QuestionInput Component
 * Modern input with animations and visual effects
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim()) {
      await onSubmit(question);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 animate-fade-in-up">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          {/* Floating label */}
          <label 
            htmlFor="question" 
            className={`
              block font-semibold mb-3 transition-all duration-300
              ${isFocused ? 'text-blue-400 scale-105' : 'text-gray-300'}
            `}
          >
            <span className="inline-flex items-center space-x-2">
              <span className="text-2xl">💭</span>
              <span>Ställ din fråga till AI-modellerna</span>
            </span>
          </label>
          
          {/* Text area with glow effect */}
          <div className="relative group">
            <textarea
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="T.ex: Vad är de viktigaste faktorerna för att främja demokrati i ett samhälle?"
              className={`
                input-field min-h-[140px] resize-y
                transition-all duration-300
                ${isFocused ? 'ring-2 ring-blue-500/50' : ''}
              `}
              disabled={isLoading}
            />
            
            {/* Glow effect on focus */}
            {isFocused && (
              <div className="absolute inset-0 -z-10 bg-blue-500/10 blur-xl rounded-xl animate-pulse-slow"></div>
            )}
            
            {/* Character count indicator */}
            {question.length > 0 && (
              <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-civic-dark-800/80 px-2 py-1 rounded-md backdrop-blur-sm">
                {question.length} tecken
              </div>
            )}
          </div>
        </div>
        
        {/* Submit button with modern styling */}
        <div className="flex items-center space-x-4">
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className={`
              btn-primary flex-1 group
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
              ${isLoading ? 'animate-pulse' : ''}
            `}
          >
            <span className="relative z-10 flex items-center justify-center space-x-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Bearbetar...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Skicka fråga</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">→</span>
                </>
              )}
            </span>
          </button>
          
          {/* Clear button */}
          {question.length > 0 && !isLoading && (
            <button
              type="button"
              onClick={() => setQuestion('')}
              className="px-4 py-3 rounded-xl bg-civic-dark-700/50 hover:bg-civic-dark-600 text-gray-400 hover:text-gray-200 transition-all duration-300 hover:scale-105"
              title="Rensa"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick suggestions */}
        {!isLoading && question.length === 0 && (
          <div className="flex flex-wrap gap-2 animate-fade-in">
            {['Demokrati och samhälle', 'Hållbar utveckling', 'AI och etik'].map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setQuestion(`Vad är ${suggestion.toLowerCase()}?`)}
                className="px-4 py-2 text-sm rounded-full bg-civic-dark-700/50 hover:bg-civic-dark-600 text-gray-400 hover:text-gray-200 transition-all duration-300 hover:scale-105 border border-civic-dark-600 hover:border-blue-500/30"
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
