import { Link } from 'react-router-dom';
import { useState } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';
import ModelEvolutionTimeline from '../components/ModelEvolutionTimeline';
import LedgerView from '../components/LedgerView';
import DominantThemesPanel from '../components/DominantThemesPanel';

/**
 * OQT-1.0 Dashboard Page - Kommande Språkmodell
 * Transparent instrumentpanel för Open Quality Transformer-modellen
 */
export default function OQTDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock current model data
  const currentModel = {
    version: '1.2.0',
    status: 'utveckling',
    lastTraining: '2025-03-10T09:15:00Z',
    certification: 'Rättvise-certifierad',
    totalQuestions: 45231,
    totalResponses: 187643,
    avgConsensus: 0.847,
    avgFairness: 0.948
  };

  // Mock demo examples - Swedish
  const demoExamples = [
    {
      id: 1,
      title: 'Hög Konsensus',
      question: 'Vilka fördelar har förnybar energi?',
      consensus: 0.95,
      bias: 0.05,
      description: 'Alla modeller överens om miljöfördelar'
    },
    {
      id: 2,
      title: 'Låg Konsensus - Debatt Utlöst',
      question: 'Hur ska AI regleras?',
      consensus: 0.45,
      bias: 0.18,
      description: 'Olika perspektiv utlöste konsensusdebatt'
    },
    {
      id: 3,
      title: 'Bias Upptäckt & Korrigerad',
      question: 'Vem är bäst lämpade som ledare?',
      consensus: 0.72,
      bias: 0.31,
      description: 'Könsbias upptäckt och flaggad för granskning'
    },
    {
      id: 4,
      title: 'Rättviseförbättring',
      question: 'Utmaningar med tillgång till sjukvård',
      consensus: 0.88,
      bias: 0.08,
      description: 'Rättvisa förbättrad från v1.0 (0.15) till v1.2 (0.08)'
    },
    {
      id: 5,
      title: 'Temautveckling',
      question: 'Framtidens arbete med AI',
      consensus: 0.81,
      bias: 0.12,
      description: 'Tekniktemat visar ökande positiv sentiment'
    }
  ];

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-[#0a0a0a] text-[#e7e7e7]">
      <div className="px-4 py-8">
        <div className="max-w-[1400px] mx-auto pb-8">
          {/* Header */}
          <div className="mb-12">
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
            >
              <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
              <span>Tillbaka</span>
            </Link>

            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[#151515] to-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="inline-block px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] text-xs rounded-full mb-4">
                    🚧 Kommande Språkmodell
                  </div>
                  <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-3 text-[#e7e7e7]">
                    OQT-1.0
                  </h1>
                  <p className="text-xl text-[#888] mb-6 font-light">
                    Open Quality Transformer
                  </p>
                  <p className="text-lg text-[#666] max-w-[700px] font-light leading-relaxed mb-6">
                    Transparent AI, byggd på global konsensus
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] text-[#666] text-sm rounded-lg">
                      ✓ Öppen källkod
                    </span>
                    <span className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] text-[#666] text-sm rounded-lg">
                      ✓ Rättvise-certifierad
                    </span>
                    <span className="px-3 py-1.5 bg-[#0a0a0a] border border-[#1a1a1a] text-[#666] text-sm rounded-lg">
                      ✓ Granskningsbar
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg mb-4">
                    <div className="w-2 h-2 bg-[#666] rounded-full"></div>
                    <span className="text-sm text-[#888]">{currentModel.status.toUpperCase()}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-[#666]">Version</div>
                      <div className="text-[#e7e7e7] font-medium">{currentModel.version}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Senaste Träning</div>
                      <div className="text-[#e7e7e7]">{formatDate(currentModel.lastTraining)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8 border-b border-[#151515]">
            {[
              { id: 'overview', label: 'Översikt', icon: '📊' },
              { id: 'timeline', label: 'Utveckling', icon: '📈' },
              { id: 'ledger', label: 'Granskningslogg', icon: '🔐' },
              { id: 'themes', label: 'Teman', icon: '🏷️' },
              { id: 'demos', label: 'Demos', icon: '🎯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors duration-200
                  ${selectedTab === tab.id
                    ? 'text-[#e7e7e7] border-b-2 border-[#e7e7e7]'
                    : 'text-[#666] hover:text-[#888]'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <>
                {/* Status Overview */}
                <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                  <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Statusöversikt</h2>
                  
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-xs text-[#666] mb-2">Totalt Frågor</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {currentModel.totalQuestions.toLocaleString()}
                      </div>
                      <div className="text-xs text-[#888] mt-1">↑ +2.3k denna vecka</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-xs text-[#666] mb-2">Totalt Svar</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {currentModel.totalResponses.toLocaleString()}
                      </div>
                      <div className="text-xs text-[#888] mt-1">↑ +9.5k denna vecka</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-xs text-[#666] mb-2">Genomsnittlig Konsensus</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {(currentModel.avgConsensus * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#888] mt-1">↑ +1.2%</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-xs text-[#666] mb-2">Rättvisemått</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {(currentModel.avgFairness * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-[#888] mt-1">↑ +0.8%</div>
                    </div>
                  </div>

                  {/* Fairness Metrics */}
                  <h3 className="text-lg font-light text-[#e7e7e7] mb-4">Rättvisemått</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">⚖️ Demografisk Paritet</div>
                      <div className="text-2xl text-[#e7e7e7] mb-2">97.8%</div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div className="bg-[#666] h-2 rounded-full" style={{ width: '97.8%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">🎯 Lika Möjligheter</div>
                      <div className="text-2xl text-[#e7e7e7] mb-2">96.5%</div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div className="bg-[#666] h-2 rounded-full" style={{ width: '96.5%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">📊 Likvärdig Påverkan</div>
                      <div className="text-2xl text-[#e7e7e7] mb-2">98.2%</div>
                      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
                        <div className="bg-[#666] h-2 rounded-full" style={{ width: '98.2%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Bias Trend */}
                  <h3 className="text-lg font-light text-[#e7e7e7] mb-4">Biasutveckling</h3>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-end gap-2 h-32">
                      {[0.18, 0.15, 0.13, 0.11, 0.09, 0.08].map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end">
                          <div className="text-xs text-[#888] mb-1">{(value * 100).toFixed(0)}%</div>
                          <div
                            className="w-full bg-gradient-to-t from-[#555] to-[#888] rounded-t"
                            style={{ height: `${(1 - value) * 100}%` }}
                          ></div>
                          <div className="text-xs text-[#666] mt-2">v1.{index}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#666] mt-4 text-center">
                      Biasmått minskar över versioner (lägre är bättre)
                    </div>
                  </div>
                </div>

                {/* Training Method & Q&A Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Träningsmetod</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#666]">Arkitektur:</span>
                        <span className="text-[#e7e7e7]">Transformer (BERT-baserad)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Träningstyp:</span>
                        <span className="text-[#e7e7e7]">Supervised + RLHF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Senaste Batchstorlek:</span>
                        <span className="text-[#e7e7e7]">22 000 exempel</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Epoker:</span>
                        <span className="text-[#e7e7e7]">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Inlärningshastighet:</span>
                        <span className="text-[#e7e7e7]">2e-5</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Fråge- & Svarsstatistik</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#666]">Frågor/Dag:</span>
                        <span className="text-[#e7e7e7]">~328</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Frågor/Vecka:</span>
                        <span className="text-[#e7e7e7]">~2 300</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Frågor/Månad:</span>
                        <span className="text-[#e7e7e7]">~9 850</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Genomsnittliga Svar/Fråga:</span>
                        <span className="text-[#e7e7e7]">4.15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#666]">Utlösta Debatter:</span>
                        <span className="text-[#888]">234 (5.2%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Evolution Tab */}
            {selectedTab === 'timeline' && (
              <ModelEvolutionTimeline />
            )}

            {/* Ledger Tab */}
            {selectedTab === 'ledger' && (
              <LedgerView onVerify={() => console.log('Verify ledger')} />
            )}

            {/* Themes Tab */}
            {selectedTab === 'themes' && (
              <DominantThemesPanel />
            )}

            {/* Demos Tab */}
            {selectedTab === 'demos' && (
              <div className="bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Demoexempel</h2>
                <div className="space-y-4">
                  {demoExamples.map((demo) => (
                    <div
                      key={demo.id}
                      className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 hover:border-[#2a2a2a] transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-[#e7e7e7] mb-2">
                            {demo.id}. {demo.title}
                          </h3>
                          <p className="text-sm text-[#666] mb-3">{demo.question}</p>
                          <p className="text-xs text-[#888]">{demo.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#151515] rounded p-3">
                          <div className="text-xs text-[#666] mb-1">Konsensusmått</div>
                          <div className={`text-lg font-medium ${
                            demo.consensus >= 0.8 ? 'text-[#e7e7e7]' : 
                            demo.consensus >= 0.6 ? 'text-[#888]' : 'text-[#666]'
                          }`}>
                            {(demo.consensus * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-[#151515] rounded p-3">
                          <div className="text-xs text-[#666] mb-1">Biasmått</div>
                          <div className={`text-lg font-medium ${
                            demo.bias < 0.1 ? 'text-[#e7e7e7]' : 
                            demo.bias < 0.2 ? 'text-[#888]' : 'text-[#666]'
                          }`}>
                            {(demo.bias * 100).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reports & Insights */}
          <div className="mt-8 bg-[#151515] border border-[#1a1a1a] rounded-xl p-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Rapporter & Insikter</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Veckorapport för Träning</h3>
                <p className="text-xs text-[#666] mb-4">
                  Omfattande veckosammanfattning av modellprestanda och förbättringar
                </p>
                <button className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  Ladda ner PDF
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Förklarbarhet Arkiv</h3>
                <p className="text-xs text-[#666] mb-4">
                  SHAP- och LIME-analysrapporter för modellbeslut
                </p>
                <button className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  Visa Arkiv
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Certifieringsmärken</h3>
                <p className="text-xs text-[#666] mb-4">
                  Rättvise-, transparens- och öppen källkod-certifieringar
                </p>
                <button className="w-full px-3 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  Visa Märken
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
