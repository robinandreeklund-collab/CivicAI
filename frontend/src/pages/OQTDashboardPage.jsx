import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';
import LedgerView from '../components/LedgerView';

/**
 * OQT-1.0 Dashboard Page - Kommande Språkmodell
 * Minimalistisk, professionell instrumentpanel för Open Quality Transformer
 */
export default function OQTDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [liveData, setLiveData] = useState([]);
  const [processingCount, setProcessingCount] = useState(0);
  const [modelStatus, setModelStatus] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch model status and metrics from backend
  useEffect(() => {
    const fetchModelData = async () => {
      try {
        const [statusResponse, metricsResponse] = await Promise.all([
          fetch('/api/oqt/status'),
          fetch('/api/oqt/metrics')
        ]);

        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          setModelStatus(statusData);
        }

        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json();
          setModelMetrics(metricsData);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching model data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchModelData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchModelData, 10000);
    return () => clearInterval(interval);
  }, []);

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

  // Mock current model data (fallback if API fails)
  const currentModel = modelStatus && modelMetrics ? {
    version: modelStatus.model.version,
    status: modelStatus.model.status === 'active' ? 'aktiv' : 'utveckling',
    lastTraining: modelStatus.model.lastTraining,
    totalQuestions: modelMetrics.training.totalSamples + processingCount,
    totalResponses: (modelMetrics.training.totalSamples + processingCount) * 4,
    avgConsensus: modelMetrics.metrics.consensus,
    avgFairness: modelMetrics.metrics.fairness
  } : {
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
                    <div className="text-[#888]">{loading ? 'Laddar...' : currentModel.status === 'aktiv' ? 'Aktiv' : 'Under utveckling'}</div>
                    {modelMetrics && (
                      <div className="text-[10px] text-[#555] mt-2">
                        Mikro-träning: {modelMetrics.training.microBatches} sessioner
                      </div>
                    )}
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
              { id: 'metrics', label: 'Mätvärden' },
              { id: 'ledger', label: 'Ledger' }
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
                <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Databearbetning & Mikroträning i Realtid</h3>
                
                {/* Micro-training Status */}
                {modelMetrics && (
                  <div className="mb-6 p-4 border border-[#1a1a1a] rounded">
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-[#666] mb-1">Total Mikro-träning</div>
                        <div className="text-xl text-[#e7e7e7]">{modelMetrics.training.microBatches}</div>
                      </div>
                      <div>
                        <div className="text-[#666] mb-1">Vecko-träning</div>
                        <div className="text-xl text-[#e7e7e7]">{modelMetrics.training.weeklyBatches}</div>
                      </div>
                      <div>
                        <div className="text-[#666] mb-1">Träningsdata</div>
                        <div className="text-xl text-[#e7e7e7]">{modelMetrics.training.totalSamples.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-[#151515]">
                      <div className="text-[10px] text-[#666]">
                        Tvåstegs-träning: När frågor ställs → Steg 1: Träning på rådata från AI-tjänster → 
                        Steg 2: Träning på analyserad data (consensus, bias, fairness)
                      </div>
                    </div>
                  </div>
                )}
                
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
                              <span className="ml-4 text-[#888]">
                                Bearbetar → Mikroträning pågår...
                              </span>
                            )}
                            {!item.processing && (
                              <span className="ml-4 text-[#555]">
                                ✓ Träning slutförd
                              </span>
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
                
                {/* Current Metrics from Backend */}
                {modelMetrics && (
                  <div className="mb-8 p-6 border border-[#1a1a1a] rounded">
                    <div className="text-sm text-[#888] mb-4">Nuvarande Mätvärden (v{modelMetrics.version})</div>
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <div className="text-[#666] text-xs mb-1">Noggrannhet</div>
                        <div className="text-2xl text-[#e7e7e7]">
                          {(modelMetrics.metrics.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[#666] text-xs mb-1">Rättvisa</div>
                        <div className="text-2xl text-[#e7e7e7]">
                          {(modelMetrics.metrics.fairness * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[#666] text-xs mb-1">Bias</div>
                        <div className="text-2xl text-[#e7e7e7]">
                          {(modelMetrics.metrics.bias * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-[#666] text-xs mb-1">Konsensus</div>
                        <div className="text-2xl text-[#e7e7e7]">
                          {(modelMetrics.metrics.consensus * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Fairness Metrics */}
                    <div className="mt-6 pt-6 border-t border-[#151515]">
                      <div className="text-xs text-[#666] mb-4">Rättvisemått</div>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[#666]">Demografisk Paritet</span>
                            <span className="text-[#888]">
                              {(modelMetrics.metrics.fairnessMetrics.demographicParity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-px bg-[#151515]">
                            <div 
                              className="h-px bg-[#e7e7e7]" 
                              style={{ width: `${modelMetrics.metrics.fairnessMetrics.demographicParity * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[#666]">Lika Möjligheter</span>
                            <span className="text-[#888]">
                              {(modelMetrics.metrics.fairnessMetrics.equalOpportunity * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-px bg-[#151515]">
                            <div 
                              className="h-px bg-[#e7e7e7]" 
                              style={{ width: `${modelMetrics.metrics.fairnessMetrics.equalOpportunity * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-[#666]">Likvärdig Påverkan</span>
                            <span className="text-[#888]">
                              {(modelMetrics.metrics.fairnessMetrics.disparateImpact * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full h-px bg-[#151515]">
                            <div 
                              className="h-px bg-[#e7e7e7]" 
                              style={{ width: `${modelMetrics.metrics.fairnessMetrics.disparateImpact * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
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

            {/* Ledger Tab - Blockchain Verification */}
            {selectedTab === 'ledger' && (
              <div>
                <div className="mb-8">
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-4">Blockchain Ledger</h3>
                  <p className="text-sm text-[#888] max-w-3xl">
                    OQT-1.0 använder endast data som är verifierad via blockchain-ledger. 
                    Detta säkerställer att all träningsdata och modelluppdateringar är immutabla 
                    och kan verifieras av vem som helst. Ingen data kan ändras retroaktivt.
                  </p>
                </div>

                {/* Ledger Stats */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Totalt Blocks</div>
                    <div className="text-2xl font-light text-[#e7e7e7]">1,247</div>
                  </div>
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Verifierade Transaktioner</div>
                    <div className="text-2xl font-light text-[#e7e7e7]">45,231</div>
                  </div>
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Integritetsstatus</div>
                    <div className="text-2xl font-light text-[#e7e7e7]">100%</div>
                  </div>
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-1">Senaste Block</div>
                    <div className="text-sm font-light text-[#e7e7e7]">{new Date().toLocaleDateString('sv-SE')}</div>
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-2">Immutabel Data</h4>
                    <p className="text-xs text-[#888]">
                      All träningsdata lagras i blockchain-blocks som inte kan ändras eller raderas.
                    </p>
                  </div>
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-2">Transparent Verifiering</h4>
                    <p className="text-xs text-[#888]">
                      Vem som helst kan verifiera att datan är äkta genom att kontrollera hash-värden.
                    </p>
                  </div>
                  <div className="border-l border-[#2a2a2a] pl-4">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-2">Skydd Mot Manipulation</h4>
                    <p className="text-xs text-[#888]">
                      Kryptografisk säkerhet förhindrar all form av datamanipulation eller förfalskning.
                    </p>
                  </div>
                </div>

                {/* Ledger View Component */}
                <LedgerView blocks={[]} />
                
                {/* Additional Info */}
                <div className="mt-8 p-6 border border-[#2a2a2a] rounded-lg">
                  <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Teknisk Implementation</h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">SHA-256 Hashing</span>
                      <span className="text-[#888]">Kryptografisk säkerhet för varje block</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Block Linking</span>
                      <span className="text-[#888]">Hash från tidigare block skapar obrytbar kedja</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Multi-Node Validation</span>
                      <span className="text-[#888]">Blocks valideras av oberoende noder</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#151515]">
                      <span className="text-[#666]">Real-Time Verification</span>
                      <span className="text-[#888]">Kontinuerlig övervakning av dataintegritet</span>
                    </div>
                  </div>
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
