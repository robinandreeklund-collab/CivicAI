/**
 * HighlightedText Component
 * 
 * Renders text with highlighted keywords from analysis
 */

import React from 'react';
import { highlightWords, extractHighlightWords } from '../utils/highlightWords.jsx';

const HighlightedText = ({ text, analysisData, enableHighlighting = true }) => {
  if (!text) return null;

  if (!enableHighlighting || !analysisData) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Extract all highlight words from analysis data
  const highlightWordsList = extractHighlightWords(analysisData);

  if (highlightWordsList.length === 0) {
    return <div className="whitespace-pre-wrap">{text}</div>;
  }

  // Split text into paragraphs
  const paragraphs = text.split('\n\n');

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} className="whitespace-pre-wrap leading-relaxed">
          {highlightWords(paragraph, highlightWordsList)}
        </p>
      ))}
      
      {/* Legend showing what highlighting means */}
      {highlightWordsList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-civic-dark-700/50">
          <div className="flex items-center gap-2 text-xs text-civic-gray-400">
            <mark className="bg-civic-gray-600/30 px-1 rounded text-civic-gray-100 font-medium border border-civic-gray-600/50">
              markerade ord
            </mark>
            <span>= identifierade i analysen ({highlightWordsList.length} ord totalt)</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HighlightedText;
