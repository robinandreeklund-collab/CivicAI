import { useState } from 'react';

/**
 * CharacterSelector Component
 * Allows users to select different OneSeek personas/character cards
 * with preview and smooth UX
 */
export default function CharacterSelector({ selectedPersona, onPersonaChange }) {
  const [isOpen, setIsOpen] = useState(false);

  // Available personas
  const personas = [
    {
      id: 'oneseek-medveten',
      name: 'OneSeek-7B-Zero (Medveten)',
      file: 'OneSeek-Medveten.yaml',
      description: 'Sveriges första kontinuerliga civic-AI',
      icon: '🧠'
    },
    {
      id: 'oneseek-expert',
      name: 'OneSeek-Expert',
      file: 'OneSeek-Expert.yaml',
      description: 'Expertversion för myndigheter',
      icon: '👔'
    },
    {
      id: 'oneseek-vanlig',
      name: 'OneSeek-Vänlig',
      file: 'OneSeek-Vänlig.yaml',
      description: 'Pedagogisk version för lärande',
      icon: '🎓'
    }
  ];

  const handleSelect = (persona) => {
    onPersonaChange(persona);
    setIsOpen(false);
  };

  const currentPersona = personas.find(p => p.id === selectedPersona) || personas[0];

  return (
    <div className="relative w-full max-w-md">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:border-gray-400 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{currentPersona?.icon}</span>
          <div className="text-left">
            <div className="font-medium text-gray-900">{currentPersona?.name}</div>
            <div className="text-sm text-gray-500">{currentPersona?.description}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute z-20 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-auto">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handleSelect(persona.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3 border-b last:border-b-0 ${
                  persona.id === selectedPersona ? 'bg-blue-50' : ''
                }`}
              >
                <span className="text-2xl">{persona.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{persona.name}</div>
                  <div className="text-sm text-gray-500">{persona.description}</div>
                </div>
                {persona.id === selectedPersona && (
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
