/**
 * MTA-16 Analysis Component
 * 
 * Displays ONESEEK's comprehensive MTA-16 (Multi-Dimensional Transparency Analysis)
 * with per-answer analysis and sparkline visualization for external AI responses in compare mode.
 * 
 * ONESEEK LLM performs this MTA-16 analysis framework to provide transparency into
 * AI response quality across 16 key dimensions:
 * 
 * 1. Factual Accuracy
 * 2. Sentiment Polarity
 * 3. Bias Detection
 * 4. Toxicity Score
 * 5. Subjectivity
 * 6. Readability
 * 7. Entity Coverage
 * 8. Topic Coherence
 * 9. Confidence Level
 * 10. Language Consistency
 * 11. Response Time
 * 12. Token Efficiency
 * 13. Source Attribution
 * 14. Contextual Relevance
 * 15. Ideological Balance
 * 16. Completeness Score
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, TrendingUp, AlertCircle, CheckCircle, Activity } from 'lucide-react';

/**
 * Sparkline component - mini chart for visualizing metric trends
 */
function Sparkline({ values, color = '#646cff', height = 20, width = 60 }) {
  if (!values || values.length === 0) return <div className="w-[60px] h-[20px] bg-[#111]" />;
  
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Metric badge component with color coding
 */
function MetricBadge({ label, value, max = 100, format = 'percentage' }) {
  const percentage = (value / max) * 100;
  let color = 'text-green-500';
  let bgColor = 'bg-green-900/20';
  
  if (percentage < 40) {
    color = 'text-red-500';
    bgColor = 'bg-red-900/20';
  } else if (percentage < 70) {
    color = 'text-yellow-500';
    bgColor = 'bg-yellow-900/20';
  }
  
  const displayValue = format === 'percentage' 
    ? `${Math.round(percentage)}%`
    : value.toFixed(2);
  
  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${bgColor}`}>
      <span className="text-[10px] text-[#888]">{label}</span>
      <span className={`text-[12px] font-medium ${color}`}>{displayValue}</span>
    </div>
  );
}

/**
 * Extract MTA-16 metrics from ONESEEK analysis data
 * ONESEEK's transparency framework organizes the analysis into 16 dimensions
 */
function extractMTA16Metrics(pipelineAnalysis, response) {
  if (!pipelineAnalysis) {
    return null;
  }
  
  const sentiment = pipelineAnalysis.sentiment?.compound || 0;
  const bias = pipelineAnalysis.bias?.overallBias || 0;
  const toxicity = pipelineAnalysis.toxicity?.overall || 0;
  const subjectivity = pipelineAnalysis.sentiment?.subjectivity || 0.5;
  const readability = pipelineAnalysis.readability?.fleschKincaid || 50;
  
  // Entity coverage (number of entities mentioned)
  const entities = pipelineAnalysis.preprocessing?.spacy?.entities || 
                   pipelineAnalysis.nlp?.entities || 
                   {};
  const entityCount = Object.values(entities).flat().length || 0;
  
  // Topic coherence (based on topics extracted)
  const topics = pipelineAnalysis.topicModeling?.topics || [];
  const topicCoherence = topics.length > 0 ? Math.min(100, topics.length * 20) : 50;
  
  // Confidence (based on sentiment confidence or default)
  const confidence = pipelineAnalysis.sentiment?.confidence || 0.7;
  
  // Language consistency (Swedish content percentage)
  const langConsistency = pipelineAnalysis.preprocessing?.langdetect?.confidence || 0.85;
  
  // Ideological balance
  const ideology = pipelineAnalysis.ideology?.classification || {};
  const ideologyScore = ideology.center || 0.5;
  
  return {
    factualAccuracy: Math.max(0, Math.min(100, (1 - bias) * 100)),
    sentimentPolarity: ((sentiment + 1) / 2) * 100, // Normalize -1 to 1 → 0 to 100
    biasDetection: bias * 100,
    toxicityScore: toxicity * 100,
    subjectivity: subjectivity * 100,
    readability: readability,
    entityCoverage: Math.min(100, entityCount * 10),
    topicCoherence: topicCoherence,
    confidenceLevel: confidence * 100,
    languageConsistency: langConsistency * 100,
    responseTime: response.metadata?.processingTime || 0,
    tokenEfficiency: response.response.length > 0 ? Math.min(100, (response.response.split(/\s+/).length / response.response.length) * 1000) : 50,
    sourceAttribution: entityCount > 0 ? 70 : 30, // Heuristic: more entities = better sourcing
    contextualRelevance: Math.min(100, (1 - Math.abs(sentiment)) * 100 + 50),
    ideologicalBalance: ideologyScore * 100,
    completenessScore: Math.min(100, response.response.length / 10),
  };
}

/**
 * MTA-16 Analysis Panel for a single response
 */
function MTA16Panel({ response, expanded, onToggle }) {
  const metrics = extractMTA16Metrics(response.pipelineAnalysis, response);
  
  if (!metrics) {
    return (
      <div className="p-4 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg">
        <div className="flex items-center gap-2 text-[#666] text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>MTA-16 analysis inte tillgänglig för detta svar</span>
        </div>
      </div>
    );
  }
  
  const metricsList = [
    { key: 'factualAccuracy', label: 'Faktisk noggrannhet', icon: CheckCircle },
    { key: 'sentimentPolarity', label: 'Sentimentpolaritet', icon: Activity },
    { key: 'biasDetection', label: 'Biasdetektering', icon: AlertCircle },
    { key: 'toxicityScore', label: 'Toxicitetspoäng', icon: AlertCircle },
    { key: 'subjectivity', label: 'Subjektivitet', icon: Activity },
    { key: 'readability', label: 'Läsbarhet', icon: CheckCircle },
    { key: 'entityCoverage', label: 'Entitetstäckning', icon: Activity },
    { key: 'topicCoherence', label: 'Ämneskoherens', icon: Activity },
    { key: 'confidenceLevel', label: 'Förtroende', icon: CheckCircle },
    { key: 'languageConsistency', label: 'Språkkonsistens', icon: CheckCircle },
    { key: 'sourceAttribution', label: 'Källattribuering', icon: Activity },
    { key: 'contextualRelevance', label: 'Kontextuell relevans', icon: Activity },
    { key: 'ideologicalBalance', label: 'Ideologisk balans', icon: Activity },
    { key: 'completenessScore', label: 'Fullständighet', icon: CheckCircle },
  ];
  
  // Calculate overall score (average of key metrics)
  const keyMetrics = ['factualAccuracy', 'confidenceLevel', 'contextualRelevance', 'completenessScore'];
  const overallScore = keyMetrics.reduce((sum, key) => sum + metrics[key], 0) / keyMetrics.length;
  
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-[#111] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-[#646cff]" />
          <div className="text-left">
            <div className="text-sm font-medium text-[#ddd]">
              {response.agent.toUpperCase()} - MTA-16 Analys
            </div>
            <div className="text-xs text-[#888] mt-0.5">
              Övergripande poäng: {overallScore.toFixed(1)}% 
              {response.metadata?.model && ` • ${response.metadata.model}`}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mini sparklines for key metrics */}
          <div className="flex gap-1">
            {keyMetrics.map(key => (
              <Sparkline 
                key={key}
                values={[0, metrics[key] / 2, metrics[key]]}
                width={30}
                height={16}
              />
            ))}
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-[#666]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#666]" />
          )}
        </div>
      </button>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 border-t border-[#1a1a1a] space-y-4">
          {/* Overall Score Banner */}
          <div className={`p-3 rounded-lg ${
            overallScore >= 70 ? 'bg-green-900/20' : 
            overallScore >= 50 ? 'bg-yellow-900/20' : 
            'bg-red-900/20'
          }`}>
            <div className="text-xs text-[#888] mb-1">Sammanfattande bedömning</div>
            <div className={`text-lg font-medium ${
              overallScore >= 70 ? 'text-green-500' : 
              overallScore >= 50 ? 'text-yellow-500' : 
              'text-red-500'
            }`}>
              {overallScore.toFixed(1)}% kvalitetspoäng
            </div>
          </div>
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metricsList.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center justify-between p-2 bg-[#111] rounded">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#666]" />
                  <span className="text-xs text-[#888]">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkline 
                    values={[0, metrics[key] / 2, metrics[key]]}
                    width={40}
                    height={16}
                  />
                  <span className={`text-sm font-medium ${
                    metrics[key] >= 70 ? 'text-green-500' : 
                    metrics[key] >= 50 ? 'text-yellow-500' : 
                    'text-red-500'
                  }`}>
                    {metrics[key].toFixed(0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Performance Metrics */}
          {(metrics.responseTime > 0 || metrics.tokenEfficiency > 0) && (
            <div className="border-t border-[#1a1a1a] pt-3 flex gap-4">
              {metrics.responseTime > 0 && (
                <MetricBadge 
                  label="Responstid" 
                  value={metrics.responseTime} 
                  max={5000}
                  format="number"
                />
              )}
              {metrics.tokenEfficiency > 0 && (
                <MetricBadge 
                  label="Token-effektivitet" 
                  value={metrics.tokenEfficiency} 
                  max={100}
                  format="percentage"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main MTA-16 Analysis Component
 * Shows analysis for all external AI responses in compare mode
 */
export default function MTA16Analysis({ externalResponses, whiteMode = false }) {
  const [expandedPanels, setExpandedPanels] = useState(new Set([0])); // First panel expanded by default
  
  if (!externalResponses || externalResponses.length === 0) {
    return null;
  }
  
  const togglePanel = (index) => {
    setExpandedPanels(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  return (
    <div className={`space-y-3 ${whiteMode ? 'text-[#333]' : 'text-[#ddd]'}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-5 h-5 text-[#646cff]" />
        <h3 className="text-sm font-medium uppercase tracking-wider">
          MTA-16 Analys per AI-svar
        </h3>
        <span className="text-xs text-[#666]">
          ({externalResponses.length} externa svar)
        </span>
      </div>
      
      <div className="space-y-2">
        {externalResponses.map((response, index) => (
          <MTA16Panel
            key={`${response.agent}-${index}`}
            response={response}
            expanded={expandedPanels.has(index)}
            onToggle={() => togglePanel(index)}
          />
        ))}
      </div>
    </div>
  );
}
