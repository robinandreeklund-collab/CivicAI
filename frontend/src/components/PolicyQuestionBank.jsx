import { useState, useEffect } from 'react';

/**
 * PolicyQuestionBank Component
 * Manage and use policy-related questions
 */
export default function PolicyQuestionBank({ onSelectQuestion }) {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for creating new questions
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    category: '',
    description: '',
    tags: '',
  });

  useEffect(() => {
    if (isExpanded) {
      fetchQuestions();
      fetchCategories();
    }
  }, [isExpanded, selectedCategory, searchTerm]);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      let url = '/api/policy-questions?limit=50';
      if (selectedCategory !== 'all') {
        url += `&category=${selectedCategory}`;
      }
      if (searchTerm.trim()) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching policy questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/policy-questions/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    
    if (!newQuestion.question.trim() || !newQuestion.category) {
      alert('Fråga och kategori är obligatoriska');
      return;
    }

    try {
      const response = await fetch('/api/policy-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: newQuestion.question,
          category: newQuestion.category,
          description: newQuestion.description,
          tags: newQuestion.tags.split(',').map(t => t.trim()).filter(t => t),
        }),
      });

      if (response.ok) {
        setNewQuestion({ question: '', category: '', description: '', tags: '' });
        setShowCreateForm(false);
        fetchQuestions();
      } else {
        alert('Kunde inte skapa frågan');
      }
    } catch (error) {
      console.error('Error creating question:', error);
      alert('Ett fel uppstod');
    }
  };

  const handleUseQuestion = async (question) => {
    // Increment usage count
    try {
      await fetch(`/api/policy-questions/${question.id}/use`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }

    // Call the parent callback
    if (onSelectQuestion) {
      onSelectQuestion(question.question);
    }
  };

  const categoryIcons = {
    democracy: '🏛️',
    environment: '🌍',
    economy: '💰',
    education: '📚',
    healthcare: '🏥',
    security: '🔒',
    technology: '💻',
    social: '👥',
    other: '📌',
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in-up relative overflow-hidden">
      {/* Toggle button when collapsed */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-6 py-4 bg-civic-dark-800/50 hover:bg-civic-dark-700/50 border border-civic-dark-600 rounded-2xl transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-civic-gray-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📋
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-100">Policyfrågebank</h3>
              <p className="text-sm text-gray-400">Använd fördefinierade policyfrågor</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-2xl"></div>

          {/* Main content */}
          <div className="relative backdrop-blur-sm bg-civic-dark-800/50 rounded-2xl border border-civic-gray-500/20 p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-2xl shadow-lg shadow-teal-500/30">
                  📋
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">Policyfrågebank</h2>
                  <p className="text-sm text-gray-400">Välj eller skapa policyfrågor</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search and filter */}
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Sök frågor..."
                className="w-full px-4 py-3 rounded-xl bg-civic-dark-700/50 border-2 border-civic-dark-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500 transition-all duration-300"
              />

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-civic-gray-500 text-white'
                      : 'bg-civic-dark-700/50 text-gray-300 hover:bg-civic-dark-600'
                  }`}
                >
                  Alla
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-civic-gray-500 text-white'
                        : 'bg-civic-dark-700/50 text-gray-300 hover:bg-civic-dark-600'
                    }`}
                  >
                    {categoryIcons[category]} {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Create new question button */}
            <div className="mb-6">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="w-full px-4 py-3 bg-civic-gray-500 hover:bg-civic-gray-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>{showCreateForm ? 'Dölj formulär' : 'Skapa ny fråga'}</span>
              </button>
            </div>

            {/* Create form */}
            {showCreateForm && (
              <form onSubmit={handleCreateQuestion} className="mb-6 p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Fråga *</label>
                  <input
                    type="text"
                    value={newQuestion.question}
                    onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                    placeholder="Skriv din policyfråga..."
                    className="w-full px-4 py-2 rounded-lg bg-civic-dark-600 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategori *</label>
                  <select
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-civic-dark-600 border border-civic-dark-500 text-gray-100 focus:outline-none focus:border-civic-gray-500"
                    required
                  >
                    <option value="">Välj kategori</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {categoryIcons[category]} {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Beskrivning</label>
                  <textarea
                    value={newQuestion.description}
                    onChange={(e) => setNewQuestion({ ...newQuestion, description: e.target.value })}
                    placeholder="Valfri beskrivning..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg bg-civic-dark-600 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Taggar (kommaseparerade)</label>
                  <input
                    type="text"
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                    placeholder="tag1, tag2, tag3"
                    className="w-full px-4 py-2 rounded-lg bg-civic-dark-600 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-civic-gray-500 hover:bg-civic-gray-600 text-white font-medium rounded-lg transition-all duration-200"
                >
                  Skapa fråga
                </button>
              </form>
            )}

            {/* Questions list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Inga frågor hittades</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:bg-civic-dark-700/70 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between space-x-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg">{categoryIcons[question.category]}</span>
                          <span className="text-xs px-2 py-1 rounded bg-civic-dark-600 text-gray-300">
                            {question.category}
                          </span>
                          {question.usageCount > 0 && (
                            <span className="text-xs text-gray-500">
                              Använd {question.usageCount} gånger
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-100 mb-2">{question.question}</p>
                        {question.description && (
                          <p className="text-xs text-gray-400 mb-2">{question.description}</p>
                        )}
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {question.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs px-2 py-0.5 rounded-full bg-civic-gray-500/20 text-gray-400"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleUseQuestion(question)}
                        className="flex-shrink-0 px-4 py-2 bg-civic-gray-500 hover:bg-civic-gray-600 text-white text-sm font-medium rounded-lg transition-all duration-200"
                      >
                        Använd
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
