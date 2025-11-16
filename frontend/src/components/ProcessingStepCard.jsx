/**
 * ProcessingStepCard Component
 * 
 * Displays detailed information about a single processing step including:
 * - Library/method used
 * - Keywords and features identified
 * - Processing time and metadata
 * - Status (Python ML or JavaScript fallback)
 */

import React, { useState } from 'react';

const ProcessingStepCard = ({ step, stepData, stepIndex }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!step) return null;

  // Map step names to Swedish and icons
  const stepInfo = {
    'spacy_preprocessing': { 
      name: 'spaCy Förbehandling', 
      icon: '🔤',
      description: 'Tokenisering och POS-tagging med spaCy'
    },
    'textblob_subjectivity': { 
      name: 'TextBlob Subjektivitet', 
      icon: '📊',
      description: 'Polaritet och subjektivitetsanalys'
    },
    'langdetect_language': { 
      name: 'Språkdetektion', 
      icon: '🌍',
      description: 'Identifiering av språk med langdetect'
    },
    'detoxify_toxicity': { 
      name: 'Detoxify Toxicitet', 
      icon: '🛡️',
      description: 'Toxicitets- och hotdetektion'
    },
    'swedish_bert_ideology': { 
      name: 'Swedish BERT Ideologi', 
      icon: '🏛️',
      description: 'Ideologisk klassificering med KB/bert-base-swedish-cased'
    },
    'preprocessing_javascript': { 
      name: 'Textförbehandling', 
      icon: '📝',
      description: 'Grundläggande textanalys'
    },
    'bias_detection_javascript': { 
      name: 'Biasdetektion', 
      icon: '🎯',
      description: 'Identifiering av olika typer av bias'
    },
    'sentiment_analysis_javascript': { 
      name: 'Sentimentanalys', 
      icon: '💭',
      description: 'VADER sentiment och känslomässig analys'
    },
    'ideology_classification_javascript': { 
      name: 'Ideologiklassificering', 
      icon: '⚖️',
      description: 'Politisk ideologisk positionering'
    },
    'tone_analysis_javascript': { 
      name: 'Tonanalys', 
      icon: '🎵',
      description: 'Analys av textens ton och stil'
    },
    'fact_checking_javascript': { 
      name: 'Faktakontroll', 
      icon: '✅',
      description: 'Identifiering av verifierbara påståenden'
    },
    'enhanced_nlp_javascript': { 
      name: 'Utökad NLP', 
      icon: '🧠',
      description: 'Avancerad språkbehandling'
    },
    'sentence_bias_analysis': { 
      name: 'Meningsnivå Bias', 
      icon: '🔍',
      description: 'Bias-analys per mening'
    },
  };

  const info = stepInfo[step.step] || {
    name: step.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    icon: '⚙️',
    description: 'Analyssteg'
  };

  // Extract keywords/features from step data
  const extractFeatures = () => {
    const features = [];

    // For bias detection, extract detected bias words
    if (step.step.includes('bias') && stepData?.detectedBiases) {
      stepData.detectedBiases.forEach(bias => {
        if (bias.words && bias.words.length > 0) {
          features.push({
            label: `${bias.type} bias`,
            items: bias.words
          });
        }
      });
    }

    // For sentiment, extract key sentiment terms
    if (step.step.includes('sentiment') && stepData?.vaderSentiment) {
      features.push({
        label: 'Sentiment',
        items: [stepData.vaderSentiment.classification]
      });
    }

    // For preprocessing, extract loaded expressions
    if (step.step.includes('preprocessing') && stepData?.loadedExpressions?.loadedExpressions) {
      const expressions = stepData.loadedExpressions.loadedExpressions.slice(0, 5);
      if (expressions.length > 0) {
        features.push({
          label: 'Laddade uttryck',
          items: expressions.map(e => e.expression)
        });
      }
    }

    // For spaCy, extract entities if available
    if (step.step === 'spacy_preprocessing' && stepData?.entities) {
      const entities = stepData.entities.slice(0, 5);
      if (entities.length > 0) {
        features.push({
          label: 'Entiteter',
          items: entities.map(e => `${e.text} (${e.label})`)
        });
      }
    }

    // For ideology, extract classification
    if (step.step.includes('ideology') && stepData?.ideology?.classification) {
      features.push({
        label: 'Klassificering',
        items: [stepData.ideology.classification]
      });
    }

    return features;
  };

  const features = extractFeatures();

  return (
    <div className="bg-civic-dark-800/50 rounded-lg border border-civic-dark-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-civic-dark-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{info.icon}</span>
          <div className="text-left">
            <h4 className="text-white font-medium">{info.name}</h4>
            <p className="text-xs text-civic-gray-400">{info.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {step.usingPython && (
            <span className="px-2 py-1 bg-civic-gray-600/20 text-civic-gray-300 text-xs rounded border border-civic-gray-600/30">
              🐍 Python ML
            </span>
          )}
          <span className="text-xs text-civic-gray-400">{step.durationMs}ms</span>
          <svg
            className={`w-4 h-4 text-civic-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-civic-dark-700 space-y-3">
          {/* Library/Method Information */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-civic-gray-400">Bibliotek/Modell:</span>
              <div className="mt-1 text-white font-medium">{step.model}</div>
            </div>
            <div>
              <span className="text-civic-gray-400">Version:</span>
              <div className="mt-1 text-white">{step.version}</div>
            </div>
            <div className="col-span-2">
              <span className="text-civic-gray-400">Metod:</span>
              <div className="mt-1 text-white text-xs">{step.method}</div>
            </div>
          </div>

          {/* Features/Keywords */}
          {features.length > 0 && (
            <div className="pt-3 border-t border-civic-dark-700/50">
              <div className="text-xs text-civic-gray-400 mb-2">Identifierade features:</div>
              <div className="space-y-2">
                {features.map((feature, idx) => (
                  <div key={idx}>
                    <div className="text-xs text-civic-gray-500 mb-1">{feature.label}:</div>
                    <div className="flex flex-wrap gap-1">
                      {feature.items.map((item, itemIdx) => (
                        <span
                          key={itemIdx}
                          className="px-2 py-1 bg-civic-dark-900/50 text-civic-gray-300 text-xs rounded border border-civic-dark-700"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timing information */}
          <div className="pt-3 border-t border-civic-dark-700/50">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-civic-gray-400">Start:</span>
                <div className="mt-1 text-white">
                  {new Date(step.startTime).toLocaleTimeString('sv-SE')}
                </div>
              </div>
              <div>
                <span className="text-civic-gray-400">Slut:</span>
                <div className="mt-1 text-white">
                  {new Date(step.endTime).toLocaleTimeString('sv-SE')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStepCard;
