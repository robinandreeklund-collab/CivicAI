import { useState } from 'react';

/**
 * QuestionInput Component
 * Handles user input and triggers API calls to get AI responses
 */
export default function QuestionInput({ onSubmit, isLoading }) {
  const [question, setQuestion] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (question.trim()) {
      await onSubmit(question);
      // Optionally clear the input after submission
      // setQuestion('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-gray-300 mb-2">
            Ställ din fråga till AI-modellerna
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="T.ex: Vad är de viktigaste faktorerna för att främja demokrati i ett samhälle?"
            className="input-field min-h-[120px] resize-y"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Hämtar svar...' : 'Skicka fråga'}
        </button>
      </form>
    </div>
  );
}
