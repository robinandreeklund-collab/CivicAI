/**
 * MTA16ComparisonTable Component
 * 
 * Displays comprehensive side-by-side comparison of MTA-16 analyses
 * organized into 5 categories with scores and highlights for each model.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, AlertTriangle, CheckCircle, Activity, BarChart3 } from 'lucide-react';

/**
 * Category definitions for MTA-16 dimensions
 */
const MTA16_CATEGORIES = {
  contentQuality: {
    name: 'Innehållskvalitet',
    nameEn: 'Content Quality',
    description: 'Vad svaret faktiskt säger',
    icon: CheckCircle,
    dimensions: [
      { key: 'factualAccuracy', label: 'Faktisk noggrannhet', labelEn: 'Factual Accuracy' },
      { key: 'contextualRelevance', label: 'Kontextuell relevans', labelEn: 'Contextual Relevance' },
      { key: 'completenessScore', label: 'Fullständighet', labelEn: 'Completeness Score' },
      { key: 'topicCoherence', label: 'Ämneskoherens', labelEn: 'Topic Coherence' }
    ]
  },
  languageStyle: {
    name: 'Språk och stil',
    nameEn: 'Language & Style',
    description: 'Hur svaret är formulerat',
    icon: Activity,
    dimensions: [
      { key: 'subjectivity', label: 'Subjektivitet', labelEn: 'Subjectivity' },
      { key: 'readability', label: 'Läsbarhet', labelEn: 'Readability' },
      { key: 'confidenceLevel', label: 'Förtroende', labelEn: 'Confidence Level' }
    ]
  },
  ethicsBias: {
    name: 'Etik och bias',
    nameEn: 'Ethics & Bias',
    description: 'Risker och balans',
    icon: AlertTriangle,
    dimensions: [
      { key: 'biasDetection', label: 'Biasdetektering', labelEn: 'Bias Detection' },
      { key: 'toxicityScore', label: 'Toxicitetspoäng', labelEn: 'Toxicity Score' },
      { key: 'ideologicalBalance', label: 'Ideologisk balans', labelEn: 'Ideological Balance' }
    ]
  },
  structureCoverage: {
    name: 'Struktur och täckning',
    nameEn: 'Structure & Coverage',
    description: 'Bredd och djup',
    icon: BarChart3,
    dimensions: [
      { key: 'entityCoverage', label: 'Entitetstäckning', labelEn: 'Entity Coverage' },
      { key: 'sourceAttribution', label: 'Källattribuering', labelEn: 'Source Attribution' }
    ]
  },
  performanceEfficiency: {
    name: 'Prestanda och effektivitet',
    nameEn: 'Performance & Efficiency',
    description: 'Tekniska aspekter',
    icon: TrendingUp,
    dimensions: [
      { key: 'responseTime', label: 'Svarstid', labelEn: 'Response Time' },
      { key: 'tokenEfficiency', label: 'Token-effektivitet', labelEn: 'Token Efficiency' },
      { key: 'languageConsistency', label: 'Språkkonsistens', labelEn: 'Language Consistency' }
    ]
  }
};

/**
 * Parse MTA-16 score from text analysis
 * Primary format: numeric scores (0-100)
 * Fallback: text scores (hög/medium/låg) converted to numeric
 */
function parseScore(text, dimensionLabel, dimensionLabelEn) {
  if (!text) return null;
  
  // Try to find the dimension in the text using both Swedish and English labels
  const labels = [dimensionLabel, dimensionLabelEn].filter(Boolean);
  
  for (const label of labels) {
    // Pattern 1: "Label: 85" or "Label: 85%" (PRIMARY FORMAT)
    // ONESEEK now returns numeric scores directly (0-100)
    const numericPattern = new RegExp(`${label}[:\\s]+([0-9]+)%?`, 'i');
    const numericMatch = text.match(numericPattern);
    if (numericMatch) {
      return parseInt(numericMatch[1], 10);
    }
    
    // Pattern 2: "Label: hög/medium/låg" (FALLBACK for older analyses)
    // Convert text to numeric score for backward compatibility
    const textPattern = new RegExp(`${label}[:\\s]+(hög|medium|låg|high|low)`, 'i');
    const textMatch = text.match(textPattern);
    if (textMatch) {
      const value = textMatch[1].toLowerCase();
      if (value === 'hög' || value === 'high') return 85;
      if (value === 'medium') return 60;
      if (value === 'låg' || value === 'low') return 35;
    }
  }
  
  return null;
}

/**
 * Extract a short highlight/quote from model response
 */
function extractHighlight(response, maxLength = 120) {
  if (!response) return 'N/A';
  
  // Get first sentence or first maxLength chars
  const sentences = response.split(/[.!?]+/);
  const firstSentence = sentences[0]?.trim();
  
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence + '.';
  }
  
  return response.substring(0, maxLength).trim() + '...';
}

/**
 * Score badge component
 */
function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return <span className="text-xs text-[#666]">N/A</span>;
  }
  
  const colorClass = score >= 70 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500';
  const bgClass = score >= 70 ? 'bg-green-900/20' : score >= 50 ? 'bg-yellow-900/20' : 'bg-red-900/20';
  
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${colorClass} ${bgClass}`}>
      {score}%
    </span>
  );
}

/**
 * Category table component
 */
function CategoryTable({ category, externalResponses, expanded, onToggle, whiteMode }) {
  const Icon = category.icon;
  
  return (
    <div className={`rounded-lg border ${
      whiteMode ? 'bg-white border-[#e0e0e0]' : 'bg-[#0a0a0a] border-[#1a1a1a]'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${
          whiteMode ? 'hover:bg-[#f5f5f5]' : 'hover:bg-[#111]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[#646cff]" />
          <div className="text-left">
            <div className={`text-sm font-medium ${whiteMode ? 'text-[#333]' : 'text-[#ddd]'}`}>
              {category.name}
            </div>
            <div className={`text-xs mt-0.5 ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>
              {category.description}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className={`w-5 h-5 ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`} />
        ) : (
          <ChevronDown className={`w-5 h-5 ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`} />
        )}
      </button>
      
      {/* Expanded content */}
      {expanded && (
        <div className={`border-t ${whiteMode ? 'border-[#e0e0e0]' : 'border-[#1a1a1a]'}`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={whiteMode ? 'bg-[#f8f8f8]' : 'bg-[#0d0d0d]'}>
                  <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                    whiteMode ? 'text-[#666]' : 'text-[#888]'
                  }`}>
                    Dimension
                  </th>
                  {externalResponses.map((resp, idx) => (
                    <th 
                      key={idx}
                      className={`px-3 py-2 text-center text-xs font-medium uppercase tracking-wider ${
                        whiteMode ? 'text-purple-600' : 'text-purple-400'
                      }`}
                    >
                      {resp.agent}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {category.dimensions.map((dimension, dimIdx) => (
                  <tr 
                    key={dimension.key}
                    className={dimIdx % 2 === 0 ? (whiteMode ? 'bg-white' : 'bg-[#0a0a0a]') : (whiteMode ? 'bg-[#fafafa]' : 'bg-[#0d0d0d]')}
                  >
                    <td className={`px-3 py-2 text-xs ${whiteMode ? 'text-[#555]' : 'text-[#aaa]'}`}>
                      {dimension.label}
                    </td>
                    {externalResponses.map((resp, respIdx) => {
                      const score = parseScore(resp.mta16Analysis, dimension.label, dimension.labelEn);
                      return (
                        <td key={respIdx} className="px-3 py-2 text-center">
                          <ScoreBadge score={score} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
                
                {/* Highlights row */}
                <tr className={whiteMode ? 'bg-[#f0f0f0]' : 'bg-[#111]'}>
                  <td className={`px-3 py-3 text-xs font-medium ${whiteMode ? 'text-[#555]' : 'text-[#aaa]'}`}>
                    Highlights
                  </td>
                  {externalResponses.map((resp, respIdx) => (
                    <td key={respIdx} className={`px-3 py-3 text-xs italic ${whiteMode ? 'text-[#666]' : 'text-[#888]'}`}>
                      "{extractHighlight(resp.response, 80)}"
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Main MTA16 Comparison Table Component
 */
export default function MTA16ComparisonTable({ externalResponses, whiteMode = false }) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['contentQuality'])); // First category expanded by default
  
  if (!externalResponses || externalResponses.length === 0) {
    return null;
  }
  
  // Filter responses that have MTA-16 analysis
  const responsesWithMTA16 = externalResponses.filter(r => r.mta16Analysis);
  
  // Debug logging
  console.log('[MTA16ComparisonTable] Responses with MTA-16:', responsesWithMTA16.length);
  responsesWithMTA16.forEach((resp, idx) => {
    console.log(`[MTA16ComparisonTable] ${resp.agent} MTA-16 analysis preview:`, 
      resp.mta16Analysis?.substring(0, 200) + '...');
  });
  
  if (responsesWithMTA16.length === 0) {
    return (
      <div className={`p-4 rounded-lg border text-center ${
        whiteMode ? 'bg-[#fafafa] border-[#e0e0e0] text-[#666]' : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#666]'
      }`}>
        <p className="text-sm">Ingen MTA-16 analys tillgänglig</p>
      </div>
    );
  }
  
  const toggleCategory = (categoryKey) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-5 h-5 text-[#646cff]" />
        <h3 className={`text-sm font-medium uppercase tracking-wider ${
          whiteMode ? 'text-[#333]' : 'text-[#ddd]'
        }`}>
          MTA-16 Detaljerad Jämförelse
        </h3>
        <span className={`text-xs ${whiteMode ? 'text-[#666]' : 'text-[#666]'}`}>
          ({responsesWithMTA16.length} modeller)
        </span>
      </div>
      
      {/* Category tables */}
      <div className="space-y-3">
        {Object.entries(MTA16_CATEGORIES).map(([key, category]) => (
          <CategoryTable
            key={key}
            category={category}
            externalResponses={responsesWithMTA16}
            expanded={expandedCategories.has(key)}
            onToggle={() => toggleCategory(key)}
            whiteMode={whiteMode}
          />
        ))}
      </div>
    </div>
  );
}
