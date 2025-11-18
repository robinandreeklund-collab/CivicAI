import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';

/**
 * OQT-1.0 Dashboard Page - Kommande Språkmodell
 * Minimalistisk, professionell instrumentpanel för Open Quality Transformer
 */
export default function OQTDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [liveData, setLiveData] = useState([]);
  const [processingCount, setProcessingCount] = useState(0);

  // Simulate live data processing
  useEffect(() => {
    const questions = [
      'Hur kan vi förbättra demokratin?',
      'Klimatpolitikens framtid?',
      'AI och arbetsmarknaden',
      'Utbildningssystemets utveckling',
      'Hälsovårdens digitalisering'
    ];

    const interval = setInterval(() => {
      const newEntry = {
        id: Date.now(),
        question: questions[Math.floor(Math.random() * questions.length)],
        timestamp: new Date().toLocaleTimeString('sv-SE'),
        consensus: (0.7 + Math.random() * 0.25).toFixed(2),
        processing: true
      };

      setLiveData(prev => [newEntry, ...prev.slice(0, 4)]);
      setProcessingCount(c => c + 1);

      // Mark as processed after 2 seconds
      setTimeout(() => {
        setLiveData(prev => prev.map(item => 
          item.id === newEntry.id ? { ...item, processing: false } : item
        ));
      }, 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Mock current model data
  const currentModel = {
    version: '1.2.0',
    status: 'utveckling',
    lastTraining: '2025-03-10T09:15:00Z',
    totalQuestions: 45231 + processingCount,
    totalResponses: 187643 + (processingCount * 4),
    avgConsensus: 0.847,
    avgFairness: 0.948
  };

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

            {/* Hero Section - Ultra minimal */}
            <div className="border-b border-[#151515] pb-8 mb-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="text-xs text-[#666] uppercase tracking-wider mb-3">
                    Kommande Språkmodell
                  </div>
                  <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-2 text-[#e7e7e7]">
                    OQT-1.0
                  </h1>
                  <p className="text-sm text-[#666] font-light">
                    Open Quality Transformer — Transparent AI byggd på global konsensus
                  </p>
                </div>

                <div className="text-right">
                  <div className="space-y-1 text-xs">
                    <div className="text-[#666]">Version {currentModel.version}</div>
                    <div className="text-[#666]">{formatDate(currentModel.lastTraining)}</div>
                    <div className="text-[#888]">Under utveckling</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Minimal */}
          <div className="flex gap-8 mb-12 border-b border-[#151515]">
            {[
              { id: 'overview', label: 'Översikt' },
              { id: 'activity', label: 'Aktivitet' },
              { id: 'metrics', label: 'Mätvärden' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  pb-3 text-sm font-light transition-colors duration-200
                  ${selectedTab === tab.id
                    ? 'text-[#e7e7e7] border-b border-[#e7e7e7]'
                    : 'text-[#666] hover:text-[#888]'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-12">
            {/* Overview Tab */}
            {selectedTab === 'overview' && (
              <>
                {/* Stats Grid - Minimal */}
                <div className="grid grid-cols-4 gap-8">
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Frågor</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {currentModel.totalQuestions.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Svar</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {currentModel.totalResponses.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Konsensus</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {(currentModel.avgConsensus * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Rättvisa</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {(currentModel.avgFairness * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Training Info - Clean Layout */}
                <div className="grid grid-cols-2 gap-16 pt-8 border-t border-[#151515]">
                  <div>
                    <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Träningskonfiguration</h3>
                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Arkitektur</span>
                        <span className="text-[#e7e7e7]">Transformer</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Metod</span>
                        <span className="text-[#e7e7e7]">Supervised + RLHF</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Dataset</span>
                        <span className="text-[#e7e7e7]">22 000 exempel</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Epoker</span>
                        <span className="text-[#e7e7e7]">5</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Rättvisemått</h3>
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-[#666]">Demografisk Paritet</span>
                          <span className="text-[#e7e7e7]">97.8%</span>
                        </div>
                        <div className="w-full h-px bg-[#151515]">
                          <div className="h-px bg-[#e7e7e7]" style={{ width: '97.8%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-[#666]">Lika Möjligheter</span>
                          <span className="text-[#e7e7e7]">96.5%</span>
                        </div>
                        <div className="w-full h-px bg-[#151515]">
                          <div className="h-px bg-[#e7e7e7]" style={{ width: '96.5%' }}></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-2 text-sm">
                          <span className="text-[#666]">Likvärdig Påverkan</span>
                          <span className="text-[#e7e7e7]">98.2%</span>
                        </div>
                        <div className="w-full h-px bg-[#151515]">
                          <div className="h-px bg-[#e7e7e7]" style={{ width: '98.2%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Activity Tab - Live Feed */}
            {selectedTab === 'activity' && (
              <div>
                <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Databearbetning Realtid</h3>
                
                <div className="space-y-1">
                  {liveData.length === 0 && (
                    <div className="py-12 text-center text-[#666] text-sm">
                      Väntar på data...
                    </div>
                  )}
                  
                  {liveData.map((item) => (
                    <div 
                      key={item.id}
                      className={`
                        py-4 border-b border-[#151515] transition-opacity duration-500
                        ${item.processing ? 'opacity-50' : 'opacity-100'}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-[#e7e7e7] mb-1">{item.question}</div>
                          <div className="text-xs text-[#666]">
                            {item.timestamp}
                            {item.processing && (
                              <span className="ml-4 text-[#888]">Bearbetar...</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-sm text-[#e7e7e7]">{(item.consensus * 100).toFixed(0)}%</div>
                          <div className="text-xs text-[#666]">Konsensus</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Tab - Historical Data */}
            {selectedTab === 'metrics' && (
              <div>
                <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Utveckling över tid</h3>
                
                {/* Version History - Minimal */}
                <div className="space-y-8">
                  {[
                    { version: '1.2.0', date: '10 mar 2025', accuracy: 90.5, fairness: 94.8, bias: 8.2 },
                    { version: '1.1.0', date: '1 feb 2025', accuracy: 89.2, fairness: 93.5, bias: 9.8 },
                    { version: '1.0.0', date: '15 jan 2025', accuracy: 87.6, fairness: 91.2, bias: 12.3 }
                  ].map((v) => (
                    <div key={v.version} className="border-l-2 border-[#151515] pl-6">
                      <div className="flex items-baseline gap-4 mb-4">
                        <div className="text-lg text-[#e7e7e7]">v{v.version}</div>
                        <div className="text-xs text-[#666]">{v.date}</div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-8 text-sm">
                        <div>
                          <div className="text-[#666] mb-1">Noggrannhet</div>
                          <div className="text-[#e7e7e7]">{v.accuracy}%</div>
                        </div>
                        <div>
                          <div className="text-[#666] mb-1">Rättvisa</div>
                          <div className="text-[#e7e7e7]">{v.fairness}%</div>
                        </div>
                        <div>
                          <div className="text-[#666] mb-1">Bias</div>
                          <div className="text-[#e7e7e7]">{v.bias}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
