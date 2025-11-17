/**
 * ChatViewConcept31: Hierarkisk Layout
 * 
 * Complete data integration with multi-layer hierarchy:
 * - Top level: BERT summary + Model synthesis
 * - Middle layer: Interactive model table with bias indicators
 * - Deep level: Full pipeline analysis per model
 * - Separate: Live consensus debate component
 * 
 * Addresses: Information density, navigability, cognitive load, quick switching between overview and deep analysis
 */

import React, { useState } from 'react';

const ChatViewConcept31 = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [syntesisExpanded, setSyntesisExpanded] = useState(true);
  const [selectedModel, setSelectedModel] = useState(null);
  const [debateActive, setDebateActive] = useState(false);
  const [viewMode, setViewMode] = useState('overview'); // overview | model-detail | pipeline | debate

  // Complete mock data structure matching platform
  const mockData = {
    question: "Vilka är de viktigaste klimatpolitiska åtgärderna för Sverige fram till 2030?",
    bertSummary: "Baserat på analys från flera AI-modeller identifieras elektrifiering av transporter, utbyggnad av förnybar energi, energieffektivisering i byggnader och hållbar industriomställning som de viktigaste klimatåtgärderna för Sverige fram till 2030. Konsensus råder kring behovet av systemförändringar snarare än enstaka åtgärder.",
    
    modelSynthesis: {
      agreementPercentage: 87,
      consensusPoints: [
        "Elektrifiering av transportsektorn",
        "Förnybar energi som huvudfokus",
        "Energieffektivisering i alla sektorer"
      ],
      divergencePoints: [
        {
          topic: "Tidsram för utfasning av fossila bränslen",
          perspectives: [
            { model: "GPT-4", view: "Gradvis utfasning till 2040" },
            { model: "Claude", view: "Snabbare utfasning till 2035" }
          ]
        }
      ],
      overallConfidence: 92
    },

    models: [
      {
        name: "GPT-4",
        version: "gpt-4-turbo",
        response: {
          fullText: "För att Sverige ska nå sina klimatmål till 2030 krävs en kombination av strukturella och sektorsspecifika åtgärder. De viktigaste inkluderar: \n\n1. Elektrifiering av transportsektorn genom infrastruktur för laddning och incitament för elbilar\n2. Utbyggnad av förnybar energi med fokus på vindkraft och solenergi\n3. Energieffektivisering i byggnader genom renovering och smarta system\n4. Hållbar industriomställning med fossilfri stålproduktion\n5. Koldioxidfångst och lagring (CCS) för kvarvarande utsläpp",
          mainPoints: [
            "Elektrifiering av transport",
            "Förnybar energi (vind/sol)",
            "Energieffektivisering byggnader",
            "Fossilfri industri",
            "CCS-teknik"
          ],
          emotion: "Optimistisk",
          tone: "Informativ",
          intent: "Förklara",
          entities: ["Sverige", "Transport", "Vindkraft", "Solenergi", "CCS"]
        },
        biasIndicators: {
          bias: 1.2,
          confidence: 92,
          factuality: 96,
          objectivity: 88
        },
        pipelineAnalysis: {
          preprocessing: {
            wordCount: 87,
            sentenceCount: 6,
            subjectivity: 0.23
          },
          sentimentAnalysis: {
            overall: "Positiv",
            score: 0.72,
            intensity: "Moderat"
          },
          ideologicalClassification: {
            primary: "Progressiv",
            confidence: 0.84,
            indicators: ["miljöfokus", "teknologisk optimism"]
          },
          timeline: [
            { step: "preprocessing", duration: "12ms", model: "JavaScript NLP" },
            { step: "bias_detection", duration: "45ms", model: "Python ML" },
            { step: "sentiment_analysis", duration: "23ms", model: "VADER" },
            { step: "ideology_classification", duration: "67ms", model: "Custom Classifier" }
          ],
          totalProcessingTime: "147ms"
        }
      },
      {
        name: "Claude",
        version: "claude-3-opus",
        response: {
          fullText: "Sveriges klimatpolitiska prioriteringar fram till 2030 bör centreras kring systemförändringar: \n\n1. Kraftig expansion av förnybar energiproduktion\n2. Elektrifiering av personbilstransporter och tunga fordon\n3. Cirkulär ekonomi i byggnadssektorn\n4. Innovation inom grön industri och export av hållbar teknologi\n5. Naturbaserade lösningar som skogsplantering och våtmarksrestaurering",
          mainPoints: [
            "Förnybar energiproduktion",
            "Elektrifiering alla transporter",
            "Cirkulär ekonomi",
            "Grön teknologiexport",
            "Naturbaserade lösningar"
          ],
          emotion: "Entusiastisk",
          tone: "Övertygande",
          intent: "Uppmana",
          entities: ["Sverige", "Förnybar energi", "Cirkulär ekonomi", "Naturlösningar"]
        },
        biasIndicators: {
          bias: 1.8,
          confidence: 89,
          factuality: 94,
          objectivity: 85
        },
        pipelineAnalysis: {
          preprocessing: {
            wordCount: 76,
            sentenceCount: 6,
            subjectivity: 0.31
          },
          sentimentAnalysis: {
            overall: "Positiv",
            score: 0.81,
            intensity: "Hög"
          },
          ideologicalClassification: {
            primary: "Progressiv-Grön",
            confidence: 0.91,
            indicators: ["naturbaserat fokus", "systemtänkande"]
          },
          timeline: [
            { step: "preprocessing", duration: "14ms", model: "JavaScript NLP" },
            { step: "bias_detection", duration: "48ms", model: "Python ML" },
            { step: "sentiment_analysis", duration: "26ms", model: "VADER" },
            { step: "ideology_classification", duration: "71ms", model: "Custom Classifier" }
          ],
          totalProcessingTime: "159ms"
        }
      },
      {
        name: "DeepSeek",
        version: "deepseek-chat",
        response: {
          fullText: "De mest effektiva klimatåtgärderna för Sverige baseras på kostnads-nyttoanalys:\n\n1. Energieffektivisering i befintliga byggnader (högst ROI)\n2. Utbyggnad av förnybar el med smartgrid-integration\n3. Elektrifiering av persontransporter med stöd för laddinfrastruktur\n4. Koldioxidprissättning för att styra industriella investeringar\n5. Forskning och utveckling inom ren energiteknik",
          mainPoints: [
            "Energieffektivisering (högst ROI)",
            "Smartgrid + förnybar el",
            "Laddinfrastruktur",
            "Koldioxidprissättning",
            "Forskning energiteknik"
          ],
          emotion: "Analytisk",
          tone: "Teknisk",
          intent: "Analysera",
          entities: ["Sverige", "ROI", "Smartgrid", "Koldioxidprissättning"]
        },
        biasIndicators: {
          bias: 2.1,
          confidence: 85,
          factuality: 92,
          objectivity: 91
        },
        pipelineAnalysis: {
          preprocessing: {
            wordCount: 72,
            sentenceCount: 6,
            subjectivity: 0.19
          },
          sentimentAnalysis: {
            overall: "Neutral",
            score: 0.52,
            intensity: "Låg"
          },
          ideologicalClassification: {
            primary: "Pragmatisk-Teknokrat",
            confidence: 0.87,
            indicators: ["ekonomisk analys", "ROI-fokus"]
          },
          timeline: [
            { step: "preprocessing", duration: "11ms", model: "JavaScript NLP" },
            { step: "bias_detection", duration: "42ms", model: "Python ML" },
            { step: "sentiment_analysis", duration: "21ms", model: "VADER" },
            { step: "ideology_classification", duration: "65ms", model: "Custom Classifier" }
          ],
          totalProcessingTime: "139ms"
        }
      }
    ],

    historicalQueries: [
      { question: "Vad är de största klimatutmaningarna?", timestamp: "2024-01-15" },
      { question: "Hur kan Sverige minska utsläppen?", timestamp: "2024-01-14" }
    ],

    sources: [
      { title: "Naturvårdsverket - Klimatmål", url: "naturvardsverket.se", verified: true },
      { title: "IEA Energy Report 2024", url: "iea.org", verified: true },
      { title: "IPCC AR6 Summary", url: "ipcc.ch", verified: true }
    ]
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-[#e7e7e7] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#1a1a1a] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-light">OneSeek.AI</h1>
          <div className="h-2 w-2 rounded-full bg-[#888] animate-pulse"></div>
          <span className="text-sm text-[#666]">Analys klar</span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Mode Selector */}
          <div className="flex gap-2 bg-[#151515] rounded-lg p-1">
            {['overview', 'model-detail', 'pipeline', 'debate'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  viewMode === mode
                    ? 'bg-[#e7e7e7] text-[#0a0a0a]'
                    : 'text-[#888] hover:text-[#e7e7e7]'
                }`}
              >
                {mode === 'overview' ? 'Översikt' :
                 mode === 'model-detail' ? 'Modeller' :
                 mode === 'pipeline' ? 'Pipeline' : 'Debatt'}
              </button>
            ))}
          </div>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="px-4 py-2 bg-[#151515] hover:bg-[#1a1a1a] rounded transition-colors"
            >
              Meny
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#151515] border border-[#2a2a2a] rounded-lg shadow-xl z-50">
                {['Hem', 'Analys', 'Historik', 'Källor', 'Inställningar', 'Kontakt'].map(item => (
                  <button
                    key={item}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#1a1a1a] first:rounded-t-lg last:rounded-b-lg"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-32">
        {/* OVERVIEW MODE */}
        {viewMode === 'overview' && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Question Display */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <div className="text-xs text-[#666] uppercase tracking-wide mb-2">Din Fråga</div>
              <h2 className="text-2xl font-light">{mockData.question}</h2>
            </div>

            {/* BERT Summary - Top Level */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="text-xl">📄</div>
                <h3 className="text-lg font-medium">BERT-sammanfattning</h3>
                <div className="ml-auto px-3 py-1 bg-[#1a1a1a] text-xs rounded-full text-[#888]">
                  Kondenserad översikt
                </div>
              </div>
              <p className="text-[#e7e7e7] leading-relaxed">{mockData.bertSummary}</p>
            </div>

            {/* Model Synthesis Panel - Expandable */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg">
              <button
                onClick={() => setSyntesisExpanded(!syntesisExpanded)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="text-xl">🎯</div>
                  <h3 className="text-lg font-medium">Modellsyntes</h3>
                  <div className="ml-4 px-3 py-1 bg-[#1a1a1a] text-xs rounded-full">
                    {mockData.modelSynthesis.agreementPercentage}% konsensus
                  </div>
                </div>
                <div className={`transform transition-transform ${syntesisExpanded ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>

              {syntesisExpanded && (
                <div className="px-6 pb-6 space-y-4">
                  {/* Consensus Points */}
                  <div>
                    <div className="text-sm text-[#888] mb-2">Konsenspunkter</div>
                    <div className="space-y-2">
                      {mockData.modelSynthesis.consensusPoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="text-[#888] mt-0.5">✓</div>
                          <div>{point}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divergence Points */}
                  <div>
                    <div className="text-sm text-[#888] mb-2">Divergenspunkter</div>
                    {mockData.modelSynthesis.divergencePoints.map((div, i) => (
                      <div key={i} className="bg-[#1a1a1a] rounded p-3 space-y-2">
                        <div className="text-sm font-medium">{div.topic}</div>
                        {div.perspectives.map((p, j) => (
                          <div key={j} className="text-xs text-[#888] flex items-start gap-2">
                            <span className="text-[#666]">{p.model}:</span>
                            <span>{p.view}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Overall Confidence */}
                  <div>
                    <div className="text-sm text-[#888] mb-2">Övergripande tillförlitlighet</div>
                    <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#e7e7e7]"
                        style={{ width: `${mockData.modelSynthesis.overallConfidence}%` }}
                      ></div>
                    </div>
                    <div className="text-right text-sm text-[#888] mt-1">
                      {mockData.modelSynthesis.overallConfidence}%
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Model Overview - Table/Cards */}
            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <div className="text-xl">🤖</div>
                  Individuella AI-modeller
                </h3>
                <div className="text-xs text-[#666]">
                  {mockData.models.length} modeller analyserade
                </div>
              </div>

              <div className="space-y-3">
                {mockData.models.map((model, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedModel(model); setViewMode('model-detail'); }}
                    className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg p-4 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-xs text-[#666]">{model.version}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-[#666]">Bias</div>
                          <div className="text-sm">{model.biasIndicators.bias}/10</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#666]">Tillit</div>
                          <div className="text-sm">{model.biasIndicators.confidence}%</div>
                        </div>
                        <div className="text-[#666]">→</div>
                      </div>
                    </div>

                    {/* Bias Indicators Bar */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[#666] mb-1">Faktahalt</div>
                        <div className="h-1.5 bg-[#151515] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#888]"
                            style={{ width: `${model.biasIndicators.factuality}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[#666] mb-1">Objektivitet</div>
                        <div className="h-1.5 bg-[#151515] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#888]"
                            style={{ width: `${model.biasIndicators.objectivity}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="text-[#666] mb-1">Tillit</div>
                        <div className="h-1.5 bg-[#151515] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#888]"
                            style={{ width: `${model.biasIndicators.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setViewMode('model-detail')}
                className="w-full mt-4 px-4 py-2 bg-[#e7e7e7] text-[#0a0a0a] rounded hover:bg-[#fff] transition-colors text-sm font-medium"
              >
                Visa fullständiga resonemang →
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setViewMode('pipeline')}
                className="bg-[#151515] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg p-6 transition-colors text-left"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <div className="font-medium mb-1">Pipeline-analys</div>
                <div className="text-xs text-[#666]">Steg-för-steg insyn</div>
              </button>

              <button
                onClick={() => setViewMode('debate')}
                className="bg-[#151515] border border-[#1a1a1a] hover:border-[#2a2a2a] rounded-lg p-6 transition-colors text-left"
              >
                <div className="text-2xl mb-2">💬</div>
                <div className="font-medium mb-1">Konsensus Live-debatt</div>
                <div className="text-xs text-[#666]">Simulerad realtidsdiskussion</div>
              </button>
            </div>
          </div>
        )}

        {/* MODEL DETAIL MODE */}
        {viewMode === 'model-detail' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => setViewMode('overview')}
              className="text-sm text-[#888] hover:text-[#e7e7e7] flex items-center gap-2"
            >
              ← Tillbaka till översikt
            </button>

            {mockData.models.map((model, i) => (
              <div key={i} className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
                {/* Model Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#1a1a1a]">
                  <div>
                    <h3 className="text-xl font-medium mb-1">{model.name}</h3>
                    <div className="text-sm text-[#666]">{model.version}</div>
                  </div>
                  <div className="flex gap-4 text-right">
                    <div>
                      <div className="text-xs text-[#666]">Emotion</div>
                      <div className="text-sm">{model.response.emotion}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666]">Ton</div>
                      <div className="text-sm">{model.response.tone}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#666]">Syfte</div>
                      <div className="text-sm">{model.response.intent}</div>
                    </div>
                  </div>
                </div>

                {/* Full Response */}
                <div className="mb-4">
                  <div className="text-sm text-[#666] mb-2">Fullständigt resonemang</div>
                  <div className="text-[#e7e7e7] leading-relaxed whitespace-pre-line">
                    {model.response.fullText}
                  </div>
                </div>

                {/* Main Points */}
                <div className="mb-4">
                  <div className="text-sm text-[#666] mb-2">Huvudpunkter</div>
                  <div className="space-y-2">
                    {model.response.mainPoints.map((point, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm">
                        <div className="text-[#666] mt-1">•</div>
                        <div>{point}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bias Indicators */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {Object.entries(model.biasIndicators).map(([key, value]) => (
                    <div key={key}>
                      <div className="text-xs text-[#666] mb-2 capitalize">
                        {key === 'bias' ? 'Bias' :
                         key === 'confidence' ? 'Tillit' :
                         key === 'factuality' ? 'Faktahalt' :
                         'Objektivitet'}
                      </div>
                      <div className="text-lg font-medium mb-1">
                        {typeof value === 'number' && value < 10 ? `${value}/10` : `${value}%`}
                      </div>
                      <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#888]"
                          style={{ width: `${key === 'bias' ? value * 10 : value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Entities */}
                <div>
                  <div className="text-sm text-[#666] mb-2">Identifierade entiteter</div>
                  <div className="flex flex-wrap gap-2">
                    {model.response.entities.map((entity, j) => (
                      <span
                        key={j}
                        className="px-3 py-1 bg-[#1a1a1a] text-xs rounded-full"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pipeline Quick Link */}
                <button
                  onClick={() => { setSelectedModel(model); setViewMode('pipeline'); }}
                  className="w-full mt-4 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] rounded text-sm transition-colors"
                >
                  Visa pipeline-analys för {model.name} →
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PIPELINE MODE */}
        {viewMode === 'pipeline' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => setViewMode('overview')}
              className="text-sm text-[#888] hover:text-[#e7e7e7] flex items-center gap-2"
            >
              ← Tillbaka till översikt
            </button>

            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <h3 className="text-xl font-medium mb-4 flex items-center gap-2">
                <div className="text-2xl">⚙️</div>
                Pipeline-analys
              </h3>

              {/* Model Selector if specific model selected */}
              {selectedModel ? (
                <div className="mb-6 pb-4 border-b border-[#1a1a1a]">
                  <div className="text-sm text-[#666] mb-2">Visar pipeline för</div>
                  <div className="flex items-center justify-between">
                    <div className="text-lg">{selectedModel.name}</div>
                    <button
                      onClick={() => setSelectedModel(null)}
                      className="text-xs text-[#666] hover:text-[#e7e7e7]"
                    >
                      Visa alla modeller
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Pipeline for each model */}
              {(selectedModel ? [selectedModel] : mockData.models).map((model, i) => (
                <div key={i} className="mb-8 last:mb-0">
                  {!selectedModel && (
                    <div className="text-lg font-medium mb-4">{model.name}</div>
                  )}

                  {/* Preprocessing */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium mb-3 flex items-center gap-2">
                      <span>📝</span>
                      Förbearbetning
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[#666]">Ord</div>
                        <div>{model.pipelineAnalysis.preprocessing.wordCount}</div>
                      </div>
                      <div>
                        <div className="text-[#666]">Meningar</div>
                        <div>{model.pipelineAnalysis.preprocessing.sentenceCount}</div>
                      </div>
                      <div>
                        <div className="text-[#666]">Subjektivitet</div>
                        <div>{Math.round(model.pipelineAnalysis.preprocessing.subjectivity * 100)}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Sentiment Analysis */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium mb-3 flex items-center gap-2">
                      <span>💭</span>
                      Sentimentanalys
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[#666]">Övergripande</div>
                        <div>{model.pipelineAnalysis.sentimentAnalysis.overall}</div>
                      </div>
                      <div>
                        <div className="text-[#666]">Score</div>
                        <div>{model.pipelineAnalysis.sentimentAnalysis.score}</div>
                      </div>
                      <div>
                        <div className="text-[#666]">Intensitet</div>
                        <div>{model.pipelineAnalysis.sentimentAnalysis.intensity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Ideological Classification */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4 mb-3">
                    <div className="text-sm font-medium mb-3 flex items-center gap-2">
                      <span>🏛️</span>
                      Ideologisk klassificering
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#666]">Klassificering</span>
                        <span>{model.pipelineAnalysis.ideologicalClassification.primary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Tillit</span>
                        <span>{Math.round(model.pipelineAnalysis.ideologicalClassification.confidence * 100)}%</span>
                      </div>
                      <div>
                        <div className="text-[#666] mb-1">Indikatorer</div>
                        <div className="flex flex-wrap gap-1">
                          {model.pipelineAnalysis.ideologicalClassification.indicators.map((ind, j) => (
                            <span key={j} className="px-2 py-0.5 bg-[#151515] rounded-full">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-[#1a1a1a] rounded-lg p-4">
                    <div className="text-sm font-medium mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span>⏱️</span>
                        Processningssteg
                      </span>
                      <span className="text-xs text-[#666]">
                        Total: {model.pipelineAnalysis.totalProcessingTime}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {model.pipelineAnalysis.timeline.map((step, j) => (
                        <div key={j} className="flex items-center justify-between text-xs bg-[#151515] rounded p-2">
                          <div>
                            <div className="font-medium mb-0.5">
                              {step.step.replace(/_/g, ' ')}
                            </div>
                            <div className="text-[#666]">{step.model}</div>
                          </div>
                          <div className="text-[#666]">{step.duration}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEBATE MODE */}
        {viewMode === 'debate' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <button
              onClick={() => setViewMode('overview')}
              className="text-sm text-[#888] hover:text-[#e7e7e7] flex items-center gap-2"
            >
              ← Tillbaka till översikt
            </button>

            <div className="bg-[#151515] border border-[#1a1a1a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-medium flex items-center gap-2">
                  <div className="text-2xl">💬</div>
                  Konsensus Live-debatt
                </h3>
                <button
                  onClick={() => setDebateActive(!debateActive)}
                  className={`px-4 py-2 rounded transition-colors ${
                    debateActive
                      ? 'bg-[#1a1a1a] text-[#e7e7e7]'
                      : 'bg-[#e7e7e7] text-[#0a0a0a]'
                  }`}
                >
                  {debateActive ? 'Pausa debatt' : 'Starta debatt'}
                </button>
              </div>

              <div className="text-sm text-[#666] mb-6">
                Simulerad realtidsdiskussion mellan AI-modellerna om klimatåtgärder
              </div>

              {/* Debate Thread */}
              <div className="space-y-4">
                {/* GPT-4 */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-xs">
                      G4
                    </div>
                    <div className="font-medium">GPT-4</div>
                    <div className="text-xs text-[#666]">just nu</div>
                  </div>
                  <div className="text-sm">
                    Jag håller med om att elektrifiering är kritisk, men vi måste också fokusera på infrastruktur. Utan tillräcklig laddinfrastruktur kommer övergången att gå långsamt.
                  </div>
                </div>

                {/* Claude */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-xs">
                      C3
                    </div>
                    <div className="font-medium">Claude</div>
                    <div className="text-xs text-[#666]">1 min sedan</div>
                  </div>
                  <div className="text-sm">
                    Infrastruktur är viktigt, men jag menar att naturbaserade lösningar ger snabbare klimateffekt. Skogsplantering och våtmarksrestaurering kan komplettera tekniska lösningar.
                  </div>
                </div>

                {/* DeepSeek */}
                <div className="bg-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-xs">
                      DS
                    </div>
                    <div className="font-medium">DeepSeek</div>
                    <div className="text-xs text-[#666]">2 min sedan</div>
                  </div>
                  <div className="text-sm">
                    Både infrastruktur och natur är viktiga, men vi måste prioritera utifrån kostnads-nytta. Energieffektivisering i byggnader ger högst ROI och bör komma först.
                  </div>
                </div>

                {debateActive && (
                  <div className="flex items-center justify-center gap-2 text-sm text-[#666] py-4">
                    <div className="w-2 h-2 bg-[#888] rounded-full animate-pulse"></div>
                    Modellerna diskuterar...
                  </div>
                )}
              </div>

              {/* Consensus Summary */}
              <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
                <div className="text-sm font-medium mb-3">Konsensus-sammanfattning</div>
                <div className="bg-[#1a1a1a] rounded-lg p-4 text-sm">
                  Modellerna är överens om att en kombination av åtgärder krävs. GPT-4 betonar infrastruktur, Claude lyfter naturbaserade lösningar, och DeepSeek prioriterar kostnadseffektivitet. Alla tre identifierar elektrifiering som central.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom Input */}
      <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <input
            type="text"
            placeholder="Ställ en följdfråga..."
            className="flex-1 bg-[#151515] border border-[#1a1a1a] rounded-lg px-4 py-3 focus:outline-none focus:border-[#2a2a2a]"
          />
          <button className="px-6 py-3 bg-[#e7e7e7] text-[#0a0a0a] rounded-lg hover:bg-[#fff] transition-colors font-medium">
            Skicka
          </button>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-[#1a1a1a] bg-[#0a0a0a] px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[#666]">
          <div className="flex gap-6">
            <button className="hover:text-[#e7e7e7]">Om OneSeek.AI</button>
            <button className="hover:text-[#e7e7e7]">Integritet</button>
            <button className="hover:text-[#e7e7e7]">API</button>
          </div>
          <div className="flex gap-6">
            <button className="hover:text-[#e7e7e7]">Historik</button>
            <button className="hover:text-[#e7e7e7]">Källor</button>
            <button className="hover:text-[#e7e7e7]">Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatViewConcept31;
