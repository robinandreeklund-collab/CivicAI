/**
 * PersonalitySelector Component - ONESEEK Δ+ v6.2
 * 
 * Allows manual selection and override of AI personality.
 * Displays current personality and available options.
 */

import React, { useState, useEffect } from 'react';
import { User, RefreshCw, CheckCircle } from 'lucide-react';
import { 
  getCurrentPersonality, 
  overridePersonality, 
  resetPersonality,
  getPersonalityCatalog 
} from '../services/chat';

export default function PersonalitySelector({ 
  onPersonalityChange = null,
  className = '' 
}) {
  const [currentPersonality, setCurrentPersonality] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load current personality and catalog on mount
  useEffect(() => {
    loadCurrentPersonality();
    loadCatalog();
  }, []);

  const loadCurrentPersonality = async () => {
    try {
      const data = await getCurrentPersonality();
      setCurrentPersonality(data);
    } catch (err) {
      console.error('Failed to load current personality:', err);
      setError('Kunde inte ladda personlighet');
    }
  };

  const loadCatalog = async () => {
    try {
      const data = await getPersonalityCatalog();
      setCatalog(data);
    } catch (err) {
      console.error('Failed to load personality catalog:', err);
      setError('Kunde inte ladda katalog');
    }
  };

  const handlePersonalitySelect = async (personalityId) => {
    setLoading(true);
    setError(null);
    
    try {
      await overridePersonality(personalityId);
      await loadCurrentPersonality();
      
      if (onPersonalityChange) {
        onPersonalityChange(personalityId);
      }
      
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to override personality:', err);
      setError('Kunde inte byta personlighet');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await resetPersonality();
      await loadCurrentPersonality();
      
      if (onPersonalityChange) {
        onPersonalityChange(null);
      }
    } catch (err) {
      console.error('Failed to reset personality:', err);
      setError('Kunde inte återställa');
    } finally {
      setLoading(false);
    }
  };

  const personalities = catalog?.personality_catalog || {};
  const currentName = currentPersonality?.personality_name || 'Auto';
  const isManualOverride = currentPersonality?.personality_id !== null;

  return (
    <div className={`relative ${className}`}>
      {/* Current personality display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        disabled={loading}
      >
        <User className="w-4 h-4 text-purple-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {currentName}
        </span>
        {isManualOverride && (
          <CheckCircle className="w-3 h-3 text-green-500" />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              Välj Personlighet
            </div>
            
            {/* Reset option */}
            <button
              onClick={handleReset}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Automatiskt val</span>
              {!isManualOverride && (
                <CheckCircle className="w-3 h-3 ml-auto text-green-500" />
              )}
            </button>

            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

            {/* Personality options */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(personalities).map(([id, personality]) => {
                const isSelected = currentPersonality?.personality_id === id;
                
                return (
                  <button
                    key={id}
                    onClick={() => handlePersonalitySelect(id)}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                      isSelected
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    disabled={loading}
                  >
                    <div className="flex-1 text-left">
                      <div className="font-medium">{personality.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {personality.description}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
