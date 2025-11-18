import { Link } from 'react-router-dom';
import { useState } from 'react';
import FooterDemo4 from '../components/footers/FooterDemo4';
import ModelEvolutionTimeline from '../components/ModelEvolutionTimeline';
import LedgerView from '../components/LedgerView';
import DominantThemesPanel from '../components/DominantThemesPanel';

/**
 * OQT-1.0 Dashboard Page
 * Complete transparency dashboard for Open Quality Transformer model
 */
export default function OQTDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock current model data
  const currentModel = {
    version: '1.2.0',
    status: 'live',
    lastTraining: '2025-03-10T09:15:00Z',
    certification: 'Fairness Certified',
    totalQuestions: 45231,
    totalResponses: 187643,
    avgConsensus: 0.847,
    avgFairness: 0.948
  };

  // Mock demo examples
  const demoExamples = [
    {
      id: 1,
      title: 'High Consensus Example',
      question: 'What are the benefits of renewable energy?',
      consensus: 0.95,
      bias: 0.05,
      description: 'All models agree on environmental benefits'
    },
    {
      id: 2,
      title: 'Low Consensus - Debate Triggered',
      question: 'How should AI be regulated?',
      consensus: 0.45,
      bias: 0.18,
      description: 'Different perspectives triggered consensus debate'
    },
    {
      id: 3,
      title: 'Bias Detected & Corrected',
      question: 'Who makes better leaders?',
      consensus: 0.72,
      bias: 0.31,
      description: 'Gender bias detected and flagged for review'
    },
    {
      id: 4,
      title: 'Fairness Improvement',
      question: 'Healthcare access challenges',
      consensus: 0.88,
      bias: 0.08,
      description: 'Fairness improved from v1.0 (0.15) to v1.2 (0.08)'
    },
    {
      id: 5,
      title: 'Theme Evolution',
      question: 'Future of work with AI',
      consensus: 0.81,
      bias: 0.12,
      description: 'Technology theme showing increasing positive sentiment'
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
            <div className="bg-gradient-to-br from-[#151515] to-[#0a0a0a] border border-[#2a2a2a] rounded-2xl p-8 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-3 text-[#e7e7e7]">
                    OQT-1.0
                  </h1>
                  <p className="text-xl text-[#888] mb-6 font-light">
                    Open Quality Transformer
                  </p>
                  <p className="text-lg text-[#aaa] max-w-[700px] font-light leading-relaxed mb-6">
                    Transparent AI, Built on Global Consensus
                  </p>
                  
                  <div className="flex flex-wrap gap-3 mb-6">
                    <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
                      ✓ Open Source
                    </span>
                    <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm rounded-lg">
                      ✓ Fairness Certified
                    </span>
                    <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-sm rounded-lg">
                      ✓ Auditable
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-[#e7e7e7]">{currentModel.status.toUpperCase()}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <div className="text-[#666]">Version</div>
                      <div className="text-[#e7e7e7] font-medium">{currentModel.version}</div>
                    </div>
                    <div>
                      <div className="text-[#666]">Last Training</div>
                      <div className="text-[#e7e7e7]">{formatDate(currentModel.lastTraining)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mb-8 border-b border-[#2a2a2a]">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'timeline', label: 'Evolution', icon: '📈' },
              { id: 'ledger', label: 'Ledger', icon: '🔐' },
              { id: 'themes', label: 'Themes', icon: '🏷️' },
              { id: 'demos', label: 'Demos', icon: '🎯' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`
                  px-4 py-3 text-sm font-medium transition-colors duration-200
                  ${selectedTab === tab.id
                    ? 'text-[#e7e7e7] border-b-2 border-[#e7e7e7]'
                    : 'text-[#666] hover:text-[#aaa]'
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
                <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                  <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Status Overview</h2>
                  
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                      <div className="text-xs text-[#888] mb-2">Total Questions</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {currentModel.totalQuestions.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-400 mt-1">↑ +2.3k this week</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                      <div className="text-xs text-[#888] mb-2">Total Responses</div>
                      <div className="text-2xl font-medium text-[#e7e7e7]">
                        {currentModel.totalResponses.toLocaleString()}
                      </div>
                      <div className="text-xs text-green-400 mt-1">↑ +9.5k this week</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                      <div className="text-xs text-[#888] mb-2">Avg Consensus</div>
                      <div className="text-2xl font-medium text-green-400">
                        {(currentModel.avgConsensus * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-400 mt-1">↑ +1.2%</div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                      <div className="text-xs text-[#888] mb-2">Fairness Score</div>
                      <div className="text-2xl font-medium text-green-400">
                        {(currentModel.avgFairness * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-green-400 mt-1">↑ +0.8%</div>
                    </div>
                  </div>

                  {/* Fairness Metrics */}
                  <h3 className="text-lg font-light text-[#e7e7e7] mb-4">Fairness Metrics</h3>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">⚖️ Demographic Parity</div>
                      <div className="text-2xl text-green-400 mb-2">97.8%</div>
                      <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '97.8%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">🎯 Equal Opportunity</div>
                      <div className="text-2xl text-green-400 mb-2">96.5%</div>
                      <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '96.5%' }}></div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="text-sm text-[#e7e7e7] mb-2 font-medium">📊 Disparate Impact</div>
                      <div className="text-2xl text-green-400 mb-2">98.2%</div>
                      <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.2%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Bias Trend */}
                  <h3 className="text-lg font-light text-[#e7e7e7] mb-4">Bias Trend</h3>
                  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                    <div className="flex items-end gap-2 h-32">
                      {[0.18, 0.15, 0.13, 0.11, 0.09, 0.08].map((value, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center justify-end">
                          <div className="text-xs text-green-400 mb-1">{(value * 100).toFixed(0)}%</div>
                          <div
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                            style={{ height: `${(1 - value) * 100}%` }}
                          ></div>
                          <div className="text-xs text-[#666] mt-2">v1.{index}</div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-[#888] mt-4 text-center">
                      Bias score decreasing over versions (lower is better)
                    </div>
                  </div>
                </div>

                {/* Training Method & Q&A Stats */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Training Method</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#888]">Architecture:</span>
                        <span className="text-[#e7e7e7]">Transformer (BERT-based)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Training Type:</span>
                        <span className="text-[#e7e7e7]">Supervised + RLHF</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Last Batch Size:</span>
                        <span className="text-[#e7e7e7]">22,000 samples</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Epochs:</span>
                        <span className="text-[#e7e7e7]">5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Learning Rate:</span>
                        <span className="text-[#e7e7e7]">2e-5</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                    <h3 className="text-xl font-light text-[#e7e7e7] mb-4">Q&A Statistics</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#888]">Questions/Day:</span>
                        <span className="text-[#e7e7e7]">~328</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Questions/Week:</span>
                        <span className="text-[#e7e7e7]">~2,300</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Questions/Month:</span>
                        <span className="text-[#e7e7e7]">~9,850</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Avg Responses/Question:</span>
                        <span className="text-[#e7e7e7]">4.15</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#888]">Debates Triggered:</span>
                        <span className="text-yellow-400]">234 (5.2%)</span>
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
              <div className="bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Demo Examples</h2>
                <div className="space-y-4">
                  {demoExamples.map((demo) => (
                    <div
                      key={demo.id}
                      className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#555] transition-colors duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-[#e7e7e7] mb-2">
                            {demo.id}. {demo.title}
                          </h3>
                          <p className="text-sm text-[#888] mb-3">{demo.question}</p>
                          <p className="text-xs text-[#aaa]">{demo.description}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-[#151515] rounded p-3">
                          <div className="text-xs text-[#888] mb-1">Consensus Score</div>
                          <div className={`text-lg font-medium ${
                            demo.consensus >= 0.8 ? 'text-green-400' : 
                            demo.consensus >= 0.6 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {(demo.consensus * 100).toFixed(0)}%
                          </div>
                        </div>
                        <div className="bg-[#151515] rounded p-3">
                          <div className="text-xs text-[#888] mb-1">Bias Score</div>
                          <div className={`text-lg font-medium ${
                            demo.bias < 0.1 ? 'text-green-400' : 
                            demo.bias < 0.2 ? 'text-yellow-400' : 'text-red-400'
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
          <div className="mt-8 bg-[#151515] border border-[#2a2a2a] rounded-xl p-6">
            <h2 className="text-2xl font-light text-[#e7e7e7] mb-6">Reports & Insights</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Weekly Training Report</h3>
                <p className="text-xs text-[#888] mb-4">
                  Comprehensive weekly summary of model performance and improvements
                </p>
                <button className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  Download PDF
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Explainability Archive</h3>
                <p className="text-xs text-[#888] mb-4">
                  SHAP and LIME analysis reports for model decisions
                </p>
                <button className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  View Archive
                </button>
              </div>

              <div className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-4">
                <div className="text-3xl mb-3">🏆</div>
                <h3 className="text-sm font-medium text-[#e7e7e7] mb-2">Certification Badges</h3>
                <p className="text-xs text-[#888] mb-4">
                  Fairness, transparency, and open source certifications
                </p>
                <button className="w-full px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-xs rounded transition-colors duration-200">
                  View Badges
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
