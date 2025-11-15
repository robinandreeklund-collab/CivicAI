/**
 * CivicAI Pipeline Configuration
 * 
 * This configuration defines the complete analysis pipeline structure
 * with all steps, tools, and descriptions as specified in the requirements.
 * 
 * The pipeline follows the workflow:
 * Input → Preprocess → Bias Detection → Sentiment → Ideology → Topic Modeling → Output
 * 
 * Every step includes transparency metadata for full audit trail.
 */

export const PIPELINE_CONFIG = {
  version: '1.0.0',
  description: 'Komplett analysepipeline för transparenta AI-svar med bias-detektion, sentiment och ideologisk klassificering',
  
  workflow: {
    input: 'Användarens fråga',
    steps: [
      'preprocess',
      'bias_detection',
      'sentiment_analysis',
      'ideology_classification',
      'topic_modeling'
    ],
    output: 'Best Answer + BERT-sammanfattning',
    timeline: 'Visar alla steg med insyn'
  },

  steps: {
    preprocess: {
      name: 'Förbearbetning',
      description: 'Förbered texten för analys',
      order: 1,
      tools: [
        {
          name: 'spaCy-equivalent',
          actualImplementation: 'compromise.js',
          version: '14.11.0',
          capabilities: [
            'Tokenisering',
            'POS-tagging',
            'Dependency parsing (basic)'
          ],
          method: 'JavaScript-based NLP processing',
          note: 'compromise.js provides similar functionality to spaCy for tokenization and POS-tagging'
        },
        {
          name: 'TextBlob-equivalent',
          actualImplementation: 'sentiment library + custom analysis',
          version: '5.0.2',
          capabilities: [
            'Polaritet',
            'Subjektivitet'
          ],
          method: 'Lexicon-based sentiment and subjectivity analysis',
          note: 'Custom implementation provides polarity and subjectivity similar to TextBlob'
        },
        {
          name: 'Polyglot-equivalent',
          actualImplementation: 'Built-in language detection',
          version: '1.0.0',
          capabilities: [
            'Språkdetektion',
            'Multispråkstöd (svenska/engelska)'
          ],
          method: 'Pattern-based language detection',
          note: 'Basic language detection for Swedish/English content'
        }
      ],
      outputs: [
        'tokenization',
        'posTagging',
        'subjectivityAnalysis',
        'languageDetection',
        'loadedExpressions',
        'noiseAnalysis'
      ]
    },

    bias_detection: {
      name: 'Bias-detektion',
      description: 'Identifiera bias och laddade uttryck',
      order: 2,
      tools: [
        {
          name: 'BiasCheck-equivalent',
          actualImplementation: 'Custom bias detector',
          version: '1.0.0',
          capabilities: [
            'Politisk bias (vänster/höger)',
            'Kulturell bias (västerländsk/icke-västerländsk)',
            'Kommersiell bias',
            'Bekräftelsebias',
            'Recency bias'
          ],
          method: 'Keyword-based semantic analysis with bias lexicons',
          note: 'Comprehensive bias detection across multiple dimensions'
        },
        {
          name: 'Detoxify-equivalent',
          actualImplementation: 'Custom toxicity & aggression detector',
          version: '1.0.0',
          capabilities: [
            'Toxicitet',
            'Extremism',
            'Aggressivitet'
          ],
          method: 'Keyword and pattern matching for aggressive/toxic language',
          note: 'Part of sentiment analysis - detects aggression and hostile language'
        }
      ],
      outputs: [
        'biasScore',
        'detectedBiases',
        'sentenceBiasAnalysis',
        'flaggedTerms',
        'aggressionDetection',
        'toxicityIndicators'
      ]
    },

    sentiment_analysis: {
      name: 'Sentimentanalys',
      description: 'Analysera ton och laddning',
      order: 3,
      tools: [
        {
          name: 'VADER',
          actualImplementation: 'sentiment library',
          version: '5.0.2',
          capabilities: [
            'Sociala medier och korta texter',
            'Positiv/negativ/neutral klassificering',
            'Intensity scores'
          ],
          method: 'VADER lexicon-based sentiment analysis',
          note: 'Optimized for social media and short texts'
        },
        {
          name: 'TextBlob-equivalent (Sentiment)',
          actualImplementation: 'Custom sentiment analyzer',
          version: '1.0.0',
          capabilities: [
            'Polaritet (-1 till +1)',
            'Subjektivitet (0 till 1)',
            'Sarcasm detection',
            'Empathy detection'
          ],
          method: 'Extended sentiment analysis with emotion detection',
          note: 'Provides polarity and subjectivity similar to TextBlob with additional features'
        }
      ],
      outputs: [
        'vaderSentiment',
        'polarity',
        'subjectivity',
        'sarcasmDetection',
        'aggressionDetection',
        'empathyDetection',
        'emotionalProfile'
      ]
    },

    ideology_classification: {
      name: 'Ideologisk klassificering',
      description: 'Klassificera politisk lutning',
      order: 4,
      tools: [
        {
          name: 'Hugging Face Transformers-equivalent',
          actualImplementation: 'Custom ideological classifier',
          version: '1.0.0',
          capabilities: [
            'PoliticalBERT-style classification',
            'Left-right-center scoring',
            'Multi-dimensional analysis'
          ],
          method: 'Keyword-based ideological classification with Swedish political lexicons',
          note: 'Future: Can be enhanced with fine-tuned BERT models (PoliticalBERT/RoBERTa)'
        },
        {
          name: 'SHAP-equivalent',
          actualImplementation: 'Custom explainability',
          version: '1.0.0',
          capabilities: [
            'Förklarar vilka ord som påverkar klassificeringen',
            'Keyword influence tracking',
            'Transparency in classification'
          ],
          method: 'Keyword tracking and contribution analysis',
          note: 'Tracks which keywords triggered ideological classification'
        },
        {
          name: 'Gensim-equivalent',
          actualImplementation: 'Semantic analysis (planned)',
          version: '1.0.0',
          capabilities: [
            'Semantisk närhetsanalys mellan politiska begrepp',
            'Word relationships',
            'Conceptual clustering'
          ],
          method: 'Keyword co-occurrence and semantic relationships',
          note: 'Future: Can implement Word2Vec/FastText for better semantic analysis'
        }
      ],
      outputs: [
        'ideology',
        'dimensions',
        'partyAlignment',
        'confidence',
        'keywordInfluence',
        'semanticRelationships'
      ]
    },

    topic_modeling: {
      name: 'Topic Modeling',
      description: 'Identifiera dominerande teman',
      order: 5,
      tools: [
        {
          name: 'BERTopic-equivalent',
          actualImplementation: 'Custom topic detector',
          version: '1.0.0',
          capabilities: [
            'Transformer-style topic modeling',
            'Main topic extraction',
            'Topic clustering'
          ],
          method: 'NLP-based topic extraction with frequency analysis',
          note: 'Future: Can integrate BERTopic for advanced transformer-based modeling'
        },
        {
          name: 'Gensim-equivalent (Topic)',
          actualImplementation: 'Custom topic clustering',
          version: '1.0.0',
          capabilities: [
            'LDA-style topic modeling',
            'Word2Vec-style clustering',
            'Tematiska kluster'
          ],
          method: 'Keyword clustering and co-occurrence analysis',
          note: 'Future: Can implement Gensim LDA/Word2Vec for advanced topic modeling'
        }
      ],
      outputs: [
        'mainTopics',
        'topicClusters',
        'keyPhrases',
        'topicFrequency',
        'semanticGroups'
      ]
    }
  },

  transparency_layer: {
    name: 'Transparency Layer',
    description: 'Visualisera och förklara varje steg',
    components: [
      {
        name: 'CivicAI Timeline',
        implementation: 'TimelineNavigator component',
        capabilities: [
          'Klickbar sekvens av alla steg',
          'Visa processtid per steg',
          'Expanderbar metadata',
          'Step-by-step navigation'
        ],
        status: 'implemented'
      },
      {
        name: 'AuditTrailViewer',
        implementation: 'Audit Trail API + frontend',
        capabilities: [
          'Loggar faktiska tider',
          'Källspårning',
          'Analyshistorik',
          'Provenance tracking'
        ],
        status: 'implemented'
      },
      {
        name: 'ExportPanel',
        implementation: 'EnhancedExportPanel component',
        capabilities: [
          'Export till YAML',
          'Export till README',
          'Export till PDF',
          'Export till JSON'
        ],
        status: 'implemented'
      }
    ]
  },

  integration_points: {
    query_dispatcher: {
      description: 'Main API endpoint integrating all pipeline steps',
      endpoint: '/api/query',
      method: 'POST',
      pipeline_execution: 'Runs complete pipeline for each AI response',
      data_attached: [
        'analysis',
        'enhancedAnalysis',
        'pipelineAnalysis'
      ]
    },
    
    analysis_pipeline_api: {
      description: 'Dedicated pipeline analysis endpoint',
      endpoint: '/api/analysis-pipeline/analyze',
      method: 'POST',
      pipeline_execution: 'Standalone pipeline execution for any text',
      data_returned: 'Complete pipeline results with timeline'
    },

    frontend_views: {
      ai_answers: {
        component: 'AgentBubble',
        displays: [
          'Basic analysis (tone, bias, fact-check)',
          'Enhanced analysis (emotion, topics, intent, etc.)',
          'Pipeline analysis (complete pipeline results)',
          'Timeline navigation'
        ]
      },
      
      model_synthesis: {
        component: 'ModelDivergencePanel',
        displays: [
          'Model perspective cards',
          'Divergence detection',
          'Contradiction analysis',
          'Consensus metrics',
          'Combined insights'
        ]
      },
      
      complete_pipeline_analysis: {
        component: 'PipelineAnalysisPanel',
        displays: [
          'Overview tab',
          'Sentiment tab',
          'Ideology tab',
          'Timeline tab',
          'Details tab with all pipeline steps'
        ]
      },
      
      export_views: {
        component: 'EnhancedExportPanel',
        exports: [
          'YAML with complete pipeline data',
          'JSON with all analysis',
          'PDF with formatted results',
          'README markdown with analysis summary'
        ]
      }
    }
  },

  data_visibility: {
    description: 'All pipeline step data is visible across the application',
    locations: [
      {
        view: 'Individual AI Answer',
        access: 'response.analysis, response.enhancedAnalysis, response.pipelineAnalysis',
        visibility: 'All pipeline steps visible through expandable panels'
      },
      {
        view: 'Modellsyntes (Model Synthesis)',
        access: 'modelSynthesis object with all model perspectives',
        visibility: 'Divergences, contradictions, consensus from all pipeline data'
      },
      {
        view: 'Komplett Pipeline-analys',
        access: 'Complete pipelineAnalysis object',
        visibility: 'All steps, timeline, insights, quality indicators'
      },
      {
        view: 'Export (YAML/JSON/PDF/README)',
        access: 'Full response object with all analysis',
        visibility: 'Complete pipeline data in all export formats'
      }
    ]
  },

  provenance_tracking: {
    description: 'Every datapoint includes full provenance information',
    metadata_included: [
      'model - Name of tool/model used',
      'version - Version number',
      'method - Description of calculation method',
      'timestamp - When analysis was performed'
    ],
    purpose: 'Enable full transparency and reproducibility of all analysis results'
  }
};

/**
 * Get pipeline step configuration by name
 */
export function getPipelineStep(stepName) {
  return PIPELINE_CONFIG.steps[stepName] || null;
}

/**
 * Get all pipeline steps in order
 */
export function getPipelineStepsInOrder() {
  return PIPELINE_CONFIG.workflow.steps
    .map(stepName => ({
      name: stepName,
      ...PIPELINE_CONFIG.steps[stepName]
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Get transparency layer components
 */
export function getTransparencyComponents() {
  return PIPELINE_CONFIG.transparency_layer.components;
}

/**
 * Generate pipeline metadata for a response
 */
export function generatePipelineMetadata() {
  return {
    pipelineVersion: PIPELINE_CONFIG.version,
    pipelineDescription: PIPELINE_CONFIG.description,
    workflowSteps: PIPELINE_CONFIG.workflow.steps,
    timestamp: new Date().toISOString(),
  };
}

export default PIPELINE_CONFIG;
