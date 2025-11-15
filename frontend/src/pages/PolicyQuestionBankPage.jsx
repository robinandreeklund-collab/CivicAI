import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * PolicyQuestionBankPage
 * Full-page view for managing policy questions
 */
export default function PolicyQuestionBankPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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
    fetchQuestions();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

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

    // Navigate to home with the question
    navigate('/', { state: { question: question.question } });
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
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-civic-gray-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-civic-gray-600 to-civic-gray-700 flex items-center justify-center text-4xl shadow-lg shadow-gray-500/30">
                📋
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-100">Policyfrågebank</h1>
                <p className="text-gray-400 mt-1">Välj eller skapa policyfrågor</p>
              </div>
            </div>
          </div>

          {/* Search and filter */}
          <div className="space-y-4 mb-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Sök frågor..."
              className="w-full px-6 py-4 rounded-2xl bg-civic-dark-800/50 border-2 border-civic-dark-600 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500 transition-all duration-300 text-lg"
            />

            {/* Category filter */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-civic-gray-500 text-white shadow-lg'
                    : 'bg-civic-dark-800/50 text-gray-300 hover:bg-civic-dark-700'
                }`}
              >
                Alla
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-civic-gray-500 text-white shadow-lg'
                      : 'bg-civic-dark-800/50 text-gray-300 hover:bg-civic-dark-700'
                  }`}
                >
                  {categoryIcons[category]} {category}
                </button>
              ))}
            </div>
          </div>

          {/* Create new question button */}
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full px-6 py-4 bg-civic-gray-500 hover:bg-civic-gray-600 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-gray-500/50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{showCreateForm ? 'Dölj formulär' : 'Skapa ny fråga'}</span>
            </button>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <form onSubmit={handleCreateQuestion} className="mb-8 p-6 rounded-2xl bg-civic-dark-800/50 border border-civic-dark-600 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Fråga *</label>
                <input
                  type="text"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Skriv din policyfråga..."
                  className="w-full px-4 py-3 rounded-xl bg-civic-dark-700 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Kategori *</label>
                <select
                  value={newQuestion.category}
                  onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-civic-dark-700 border border-civic-dark-500 text-gray-100 focus:outline-none focus:border-civic-gray-500"
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
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-civic-dark-700 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Taggar (kommaseparerade)</label>
                <input
                  type="text"
                  value={newQuestion.tags}
                  onChange={(e) => setNewQuestion({ ...newQuestion, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-4 py-3 rounded-xl bg-civic-dark-700 border border-civic-dark-500 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-civic-gray-500"
                />
              </div>
              <button
                type="submit"
                className="w-full px-6 py-4 bg-civic-gray-500 hover:bg-civic-gray-600 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Skapa fråga
              </button>
            </form>
          )}

          {/* Questions list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-12 w-12 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">Inga frågor hittades</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="p-6 rounded-2xl bg-civic-dark-800/50 border border-civic-dark-600 hover:bg-civic-dark-800/70 hover:border-civic-gray-500/50 transition-all duration-200"
                >
                  <div className="flex items-start justify-between space-x-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{categoryIcons[question.category]}</span>
                        <span className="text-sm px-3 py-1 rounded-full bg-civic-dark-700 text-gray-300">
                          {question.category}
                        </span>
                        {question.usageCount > 0 && (
                          <span className="text-sm text-gray-500">
                            Använd {question.usageCount} gånger
                          </span>
                        )}
                      </div>
                      <p className="text-lg text-gray-100 mb-3">{question.question}</p>
                      {question.description && (
                        <p className="text-sm text-gray-400 mb-3">{question.description}</p>
                      )}
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {question.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-3 py-1 rounded-full bg-civic-gray-500/20 text-gray-400"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleUseQuestion(question)}
                      className="flex-shrink-0 px-6 py-3 bg-civic-gray-500 hover:bg-civic-gray-600 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105"
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
    </div>
  );
}
