import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserQuestions, useUserQuestionStats } from '../hooks/useUserQuestions';
import FooterDemo4 from '../components/footers/FooterDemo4';
import ModernLoader from '../components/ModernLoader';

/**
 * User Dashboard Page - Version 2 (Real Firebase Data Integration)
 * Personal dashboard for logged-in users
 * Design matches OQTDashboardPage and ApiDocumentationPage aesthetic
 * Now with real-time Firebase data integration
 */
export default function DashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [notifications] = useState(3);
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [questionTab, setQuestionTab] = useState({}); // Track active tab per question
  const [showSnapshot, setShowSnapshot] = useState(null);
  const { user } = useAuth();
  
  // Get real user ID or use 'anonymous' for non-authenticated users
  const userId = user?.userId || 'anonymous';
  
  // Fetch real user questions and stats from Firebase
  const { questions: recentQuestions, totalCount, loading: questionsLoading } = useUserQuestions(userId, 20);
  const { stats, loading: statsLoading } = useUserQuestionStats(userId);
  
  // Use real stats from Firebase
  const activity = {
    totalQuestions: stats.totalQuestions || 0,
    questionsThisWeek: stats.questionsThisWeek || 0,
    avgConsensus: stats.avgConsensus || 0,
    avgBias: stats.avgBias || 0,
    lastActivity: recentQuestions[0]?.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
  };

  // Mock collaborative notes
  const [notes] = useState([
    {
      id: 1,
      title: 'AI och demokrati - sammanfattning',
      content: 'Viktiga insikter från analysen...',
      lastEdited: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      tags: ['demokrati', 'AI', 'transparens']
    },
    {
      id: 2,
      title: 'Klimatpolitik - åtgärder',
      content: 'Förslag från olika AI-modeller...',
      lastEdited: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      tags: ['klimat', 'politik']
    }
  ]);

  // Mock community trends
  const [trends] = useState([
    { topic: 'AI-etik', count: 234, trend: '+12%' },
    { topic: 'Klimatåtgärder', count: 198, trend: '+8%' },
    { topic: 'Demokrati', count: 176, trend: '+15%' },
    { topic: 'Utbildning', count: 142, trend: '+3%' },
  ]);

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Okänd tid';
    
    let dateObj;
    // Handle Firestore timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else {
      return 'Okänd tid';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Okänd tid';
    
    const now = new Date();
    const diffMs = now - dateObj;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHrs < 1) return 'Nyss';
    if (diffHrs < 24) return `${diffHrs}h sedan`;
    return `${diffDays}d sedan`;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Okänd tid';
    
    let dateObj;
    // Handle Firestore timestamp
    if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
      dateObj = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      dateObj = new Date(timestamp);
    } else {
      return 'Okänd tid';
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) return 'Okänd tid';
    
    return dateObj.toLocaleString('sv-SE');
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    
    return text
      // Replace headers (## Header)
      .replace(/^### (.+)$/gm, '<h4 class="text-sm font-semibold text-[#e7e7e7] mt-3 mb-2">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="text-base font-semibold text-[#e7e7e7] mt-4 mb-2">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="text-lg font-semibold text-[#e7e7e7] mt-4 mb-2">$1</h2>')
      // Replace bold text (**text**)
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-[#e7e7e7]">$1</strong>')
      // Replace italic text (*text*)
      .replace(/\*(.+?)\*/g, '<em class="text-[#aaa]">$1</em>')
      // Replace line breaks
      .replace(/\n/g, '<br/>');
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
            <div className="border-b border-[#151515] pb-8 mb-8">
              <div className="flex items-end justify-between">
                <div className="flex-1">
                  <div className="text-xs text-[#666] uppercase tracking-wider mb-3">
                    Din Dashboard
                  </div>
                  <h1 className="text-5xl md:text-[52px] font-light tracking-wide mb-2 text-[#e7e7e7]">
                    Välkommen tillbaka
                  </h1>
                  <p className="text-sm text-[#666] font-light">
                    {user?.email || 'Användare'} • Medlem sedan {new Date().toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}
                  </p>
                </div>

                <div className="text-right">
                  <div className="space-y-1 text-xs">
                    <div className="text-[#666]">Senaste aktivitet</div>
                    <div className="text-[#888]">{formatTimeAgo(activity.lastActivity)}</div>
                    {notifications > 0 && (
                      <div className="text-[#e7e7e7] flex items-center gap-2 justify-end">
                        <span className="w-2 h-2 bg-[#e7e7e7] rounded-full animate-pulse"></span>
                        <span>{notifications} nya notiser</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-8 mb-12 border-b border-[#151515]">
            {[
              { id: 'overview', label: 'Översikt' },
              { id: 'transparency', label: 'Transparens' },
              { id: 'notes', label: 'Anteckningar' },
              { id: 'settings', label: 'Inställningar' }
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
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-8">
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Frågor</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {activity.totalQuestions}
                    </div>
                    <div className="text-xs text-[#666] mt-1">
                      {activity.questionsThisWeek > 0 ? `+${activity.questionsThisWeek}` : '0'} denna vecka
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Genomsnittlig Konsensus</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {activity.avgConsensus > 0 ? activity.avgConsensus.toFixed(0) : '--'}%
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Bias-nivå</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {activity.avgBias > 0 ? activity.avgBias.toFixed(1) : '0.0'}%
                    </div>
                    <div className={`text-xs mt-1 ${
                      activity.avgBias === 0 ? 'text-[#666]' :
                      activity.avgBias < 2 ? 'text-green-400' :
                      activity.avgBias < 4 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {activity.avgBias === 0 ? 'Ingen data' :
                       activity.avgBias < 2 ? 'Mycket låg' :
                       activity.avgBias < 4 ? 'Låg' :
                       activity.avgBias < 6 ? 'Medel' :
                       'Hög'}
                    </div>
                  </div>
                  
                  <div className="border-l border-[#151515] pl-4">
                    <div className="text-xs text-[#666] uppercase tracking-wider mb-2">Notifikationer</div>
                    <div className="text-3xl font-light text-[#e7e7e7]">
                      {notifications}
                    </div>
                    <div className="text-xs text-[#666] mt-1">Olästa</div>
                  </div>
                </div>

                {/* Recent Questions */}
                <div>
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Senaste Frågor</h3>
                  
                  {questionsLoading || statsLoading ? (
                    <ModernLoader message="Laddar dina frågor från Firebase..." />
                  ) : stats.totalQuestions === 0 ? (
                    <div className="py-12 text-center">
                      <p className="text-[#666]">Inga frågor än. Ställ din första fråga!</p>
                      <Link 
                        to="/chat-v2" 
                        className="inline-block mt-4 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] text-sm rounded-lg transition-colors"
                      >
                        Börja analysera →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentQuestions.map((item) => {
                        // Calculate consensus from responses if available
                        const consensus = item.quality_metrics?.consensus?.overallConsensus || 
                                        (item.analysis?.modelSynthesis?.consensusIndex ? item.analysis.modelSynthesis.consensusIndex * 100 : 85);
                        
                        // Get number of models from raw_responses
                        const modelCount = item.raw_responses?.length || 0;
                        
                        const isExpanded = expandedQuestion === item.id;
                        
                        return (
                          <div
                            key={item.id}
                            className="border-b border-[#151515]"
                          >
                            {/* Question Header - Clickable */}
                            <div
                              className="py-4 hover:bg-[#0f0f0f] transition-colors rounded px-2 cursor-pointer"
                              onClick={() => setExpandedQuestion(isExpanded ? null : item.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="text-sm text-[#e7e7e7] mb-1">{item.question}</div>
                                  <div className="text-xs text-[#666] flex items-center gap-2">
                                    <span>{formatTimeAgo(item.timestamp)}</span>
                                    {modelCount > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{modelCount} modeller</span>
                                      </>
                                    )}
                                    <span>•</span>
                                    <span className={`px-2 py-0.5 rounded ${
                                      item.status === 'completed' || item.status === 'ledger_verified' 
                                        ? 'bg-green-900/20 text-green-400' 
                                        : item.status === 'processing'
                                        ? 'bg-yellow-900/20 text-yellow-400'
                                        : 'bg-red-900/20 text-red-400'
                                    }`}>
                                      {item.status === 'completed' ? 'Klar' : 
                                       item.status === 'ledger_verified' ? 'Verifierad' :
                                       item.status === 'processing' ? 'Bearbetar' :
                                       item.status === 'error' ? 'Fel' : item.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right ml-4 flex items-center gap-4">
                                  <div>
                                    <div className="text-sm text-[#e7e7e7]">{consensus.toFixed(0)}%</div>
                                    <div className="text-xs text-[#666]">Konsensus</div>
                                  </div>
                                  <span className="text-[#555] text-xs font-mono">{isExpanded ? '−' : '+'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Details with Tabs */}
                            {isExpanded && (
                              <div className="bg-[#0d0d0d] border-t border-[#1a1a1a]">
                                {/* Tabs */}
                                <div className="border-b border-[#1a1a1a] px-4">
                                  <div className="flex gap-6">
                                    {['fråga', 'analys', 'faktakollen', 'kvalitetsmått', 'timeline'].map((tab) => {
                                      const currentTab = questionTab[item.id] || 'fråga';
                                      const isActive = currentTab === tab;
                                      return (
                                        <button
                                          key={tab}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setQuestionTab({...questionTab, [item.id]: tab});
                                          }}
                                          className={`py-3 text-xs uppercase tracking-wider border-b-2 transition-colors ${
                                            isActive 
                                              ? 'border-[#e7e7e7] text-[#e7e7e7]' 
                                              : 'border-transparent text-[#666] hover:text-[#888]'
                                          }`}
                                        >
                                          {tab}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Tab Content */}
                                <div className="px-4 py-4">
                                  {/* FRÅGA Tab */}
                                  {(questionTab[item.id] || 'fråga') === 'fråga' && (
                                    <div className="space-y-4">
                                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                        <div className="text-sm text-[#e7e7e7] mb-3">{item.question}</div>
                                        <div className="text-[10px] text-[#666] space-y-1">
                                          <div>Dokument ID: <span className="text-[#888] font-mono">{item.id}</span></div>
                                          <div>Status: <span className="text-[#888]">{item.status}</span></div>
                                          <div>Skapad: <span className="text-[#888]">{formatTimestamp(item.analysis?.created_at || item.created_at || item.timestamp)}</span></div>
                                          {item.analysis?.completed_at && (
                                            <div>Slutförd: <span className="text-[#888]">{formatTimestamp(item.analysis.completed_at)}</span></div>
                                          )}
                                          {item.user_id && <div>User ID: <span className="text-[#888] font-mono">{item.user_id}</span></div>}
                                        </div>
                                      </div>

                                      {/* Meta Summary */}
                                      {item.analysis?.metaSummary && (
                                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                          <div className="text-xs text-[#666] italic leading-relaxed">
                                            {item.analysis.metaSummary}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Link to Chat-V2 */}
                                      <Link
                                        to={`/chat-v2?doc=${item.id}`}
                                        className="inline-block text-xs px-3 py-1.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#e7e7e7] rounded transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        Öppna fullständig analys i Chat-V2 →
                                      </Link>
                                    </div>
                                  )}

                                  {/* ANALYS Tab */}
                                  {(questionTab[item.id] || 'fråga') === 'analys' && (
                                    <div className="space-y-4">
                                      {/* Model Synthesis */}
                                      {item.analysis?.modelSynthesis && (
                                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                          <div className="text-xs text-[#666] uppercase mb-3">Model Synthesis</div>
                                          <div className="text-sm text-[#888] space-y-2">
                                            {item.analysis.modelSynthesis.consensusIndex !== undefined && (
                                              <div className="flex justify-between">
                                                <span>Konsensusindex:</span>
                                                <span className="text-[#e7e7e7]">{(item.analysis.modelSynthesis.consensusIndex * 100).toFixed(1)}%</span>
                                              </div>
                                            )}
                                            {item.analysis.modelSynthesis.divergenceMeasure !== undefined && (
                                              <div className="flex justify-between">
                                                <span>Divergens:</span>
                                                <span className="text-[#e7e7e7]">{(item.analysis.modelSynthesis.divergenceMeasure * 100).toFixed(1)}%</span>
                                              </div>
                                            )}
                                            {item.analysis.modelSynthesis.modelCards && (
                                              <div className="flex justify-between">
                                                <span>Antal modeller:</span>
                                                <span className="text-[#e7e7e7]">{item.analysis.modelSynthesis.modelCards.length}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Bias Detection */}
                                      {item.analysis?.bias && (
                                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                          <div className="text-xs text-[#666] uppercase mb-3">Bias Detection</div>
                                          <div className="text-sm text-[#888] space-y-2">
                                            <div className="flex justify-between">
                                              <span>Bias Score:</span>
                                              <span className="text-[#e7e7e7]">{item.analysis.bias.biasScore || 0}/10</span>
                                            </div>
                                            {item.analysis.bias.overallBias && (
                                              <div className="flex justify-between">
                                                <span>Overall Bias:</span>
                                                <span className="text-[#e7e7e7]">{item.analysis.bias.overallBias}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Synthesized Summary */}
                                      {item.synthesized_summary && (
                                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                          <div className="text-xs text-[#666] uppercase mb-3">Syntetiserat Svar</div>
                                          <div 
                                            className="text-sm text-[#888] leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: formatMarkdown(item.synthesized_summary) }}
                                          />
                                        </div>
                                      )}

                                      {!item.analysis && (
                                        <div className="text-sm text-[#666] text-center py-8">
                                          Ingen analysdata tillgänglig
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* FAKTAKOLLEN Tab */}
                                  {(questionTab[item.id] || 'fråga') === 'faktakollen' && (
                                    <div className="space-y-4">
                                      {item.analysis?.factCheck ? (
                                        <>
                                          {/* Improvement Suggestions */}
                                          {item.analysis.factCheck.improvementSuggestions && item.analysis.factCheck.improvementSuggestions.length > 0 && (
                                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                              <div className="text-xs text-[#666] uppercase mb-3">Förbättringsförslag</div>
                                              <ul className="text-sm text-[#888] space-y-2 list-disc list-inside">
                                                {item.analysis.factCheck.improvementSuggestions.map((suggestion, idx) => (
                                                  <li key={idx}>{suggestion}</li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}

                                          {/* Summary and Neutral Rate */}
                                          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded space-y-3">
                                            {item.analysis.factCheck.summary && (
                                              <div>
                                                <div className="text-xs text-[#666] uppercase mb-2">Summary</div>
                                                <div className="text-sm text-[#888]">{item.analysis.factCheck.summary}</div>
                                              </div>
                                            )}
                                            
                                            {item.analysis.factCheck.neutralRate !== undefined && (
                                              <div>
                                                <div className="text-xs text-[#666] uppercase mb-2">Neutral Rate</div>
                                                <div className="text-sm text-[#e7e7e7]">{item.analysis.factCheck.neutralRate}%</div>
                                              </div>
                                            )}
                                          </div>

                                          {/* Neutral Assessment Reason */}
                                          {item.analysis.factCheck.neutralAssessmentReason && (
                                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                              <div className="text-xs text-[#666] uppercase mb-3">Neutral Assessment Reason</div>
                                              <div className="text-sm text-[#888] leading-relaxed">
                                                {item.analysis.factCheck.neutralAssessmentReason}
                                              </div>
                                            </div>
                                          )}
                                        </>
                                      ) : (
                                        <div className="text-sm text-[#666] text-center py-8">
                                          Ingen faktakollsdata tillgänglig
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* KVALITETSMÅTT Tab */}
                                  {(questionTab[item.id] || 'fråga') === 'kvalitetsmått' && (
                                    <div className="space-y-4">
                                      {item.quality_metrics && Object.keys(item.quality_metrics).length > 0 ? (
                                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                          <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap overflow-x-auto">
                                            {JSON.stringify(item.quality_metrics, null, 2)}
                                          </pre>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-[#666] text-center py-8">
                                          Inga kvalitetsmått tillgängliga
                                        </div>
                                      )}
                                      
                                      {/* Database Snapshot Button */}
                                      <div className="pt-2 border-t border-[#1a1a1a]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setShowSnapshot(showSnapshot === item.id ? null : item.id);
                                          }}
                                          className="text-xs px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#888] rounded transition-colors font-mono"
                                        >
                                          {showSnapshot === item.id ? '− Dölj' : '+ Visa'} Databas Snapshot (JSON)
                                        </button>
                                        
                                        {showSnapshot === item.id && (
                                          <div className="mt-3 bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded max-h-96 overflow-auto">
                                            <pre className="text-[10px] font-mono text-[#888] whitespace-pre-wrap">
                                              {JSON.stringify(item, null, 2)}
                                            </pre>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* TIMELINE Tab */}
                                  {(questionTab[item.id] || 'fråga') === 'timeline' && (
                                    <div className="space-y-4">
                                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-4 rounded">
                                        <div className="text-xs text-[#666] uppercase mb-4">Svar över tid (Timeline)</div>
                                        
                                        {/* Timeline visualization placeholder */}
                                        <div className="space-y-4">
                                          {/* Current question data point */}
                                          <div className="border-l-2 border-[#e7e7e7] pl-4 py-2">
                                            <div className="text-[10px] text-[#666] mb-1">{formatTimestamp(item.analysis?.created_at || item.created_at || item.timestamp)}</div>
                                            <div className="text-sm text-[#e7e7e7] mb-2">{item.question}</div>
                                            <div className="grid grid-cols-2 gap-3 text-xs text-[#888]">
                                              <div>
                                                <div className="text-[#666]">Konsensus</div>
                                                <div className="text-[#e7e7e7]">{consensus.toFixed(0)}%</div>
                                              </div>
                                              <div>
                                                <div className="text-[#666]">Bias</div>
                                                <div className="text-[#e7e7e7]">{item.analysis?.bias?.biasScore || 0}/10</div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Placeholder for historical data */}
                                          <div className="text-sm text-[#666] text-center py-6 border border-dashed border-[#1a1a1a] rounded">
                                            <div className="mb-2">📊 Timeline-spårning</div>
                                            <div className="text-xs">
                                              Visar hur svaren förändras över tid när fler användare<br />
                                              ställer samma eller liknande frågor.
                                            </div>
                                            <div className="text-[10px] mt-3 text-[#555]">
                                              Inkluderar: Konsensusnivå • Bias-förskjutning • Community-trender<br />
                                              Verifieras mot ledgern för transparens
                                            </div>
                                          </div>

                                          {/* Provenance & Ledger info */}
                                          {item.ledger_block_id && (
                                            <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-3 rounded">
                                              <div className="text-[10px] text-[#666] uppercase mb-2">Provenance & Ledger</div>
                                              <div className="text-xs text-[#888] space-y-1">
                                                <div>Block ID: <span className="text-[#e7e7e7] font-mono">{item.ledger_block_id}</span></div>
                                                {item.verified_at && (
                                                  <div>Verifierad: <span className="text-[#e7e7e7]">{new Date(item.verified_at).toLocaleString('sv-SE')}</span></div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {totalCount >= 20 && (
                        <div className="pt-4 text-center">
                          <div className="text-xs text-[#666]">
                            Visar de senaste 20 frågorna av {totalCount}+
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Community Trends */}
                <div>
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Community Trends</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {trends.map((trend, idx) => (
                      <div key={idx} className="border border-[#151515] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-[#e7e7e7]">{trend.topic}</div>
                          <div className="text-xs text-green-400">{trend.trend}</div>
                        </div>
                        <div className="text-xs text-[#666]">{trend.count} diskussioner</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Digest Preview */}
                <div className="border border-[#151515] rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">📬</div>
                    <div>
                      <div className="font-medium text-[#e7e7e7]">Veckans Sammanfattning</div>
                      <div className="text-sm text-[#666]">Personlig insiktsrapport levereras varje måndag</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#888]">
                    Nästa leverans: Måndag 8:00
                  </div>
                </div>
              </>
            )}

            {/* Transparency Tab */}
            {selectedTab === 'transparency' && (
              <>
                <div>
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Transparens & Spårbarhet</h3>
                  
                  {/* Provenance Section */}
                  <div className="mb-8 border border-[#151515] rounded-lg p-6">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Provenance (Ursprungsspårning)</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Totalt spårade frågor</span>
                        <span className="text-[#e7e7e7]">{activity.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Verifierade i ledger</span>
                        <span className="text-[#e7e7e7]">{activity.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-[#151515]">
                        <span className="text-[#666]">Genomsnittlig verifieringstid</span>
                        <span className="text-[#e7e7e7]">142ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Ledger Section */}
                  <div className="border border-[#151515] rounded-lg p-6">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Blockchain Ledger</h4>
                    <div className="space-y-2">
                      <div className="bg-[#0a0a0a] rounded p-3 border border-[#2a2a2a] font-mono text-xs">
                        <div className="text-[#666] mb-1">Block #47231</div>
                        <div className="text-[#888] truncate">hash: 0x4a9f2e...</div>
                        <div className="text-[#666] mt-1">{formatTimeAgo(activity.lastActivity)}</div>
                      </div>
                      {recentQuestions.length > 1 && (
                        <div className="bg-[#0a0a0a] rounded p-3 border border-[#2a2a2a] font-mono text-xs">
                          <div className="text-[#666] mb-1">Block #47230</div>
                          <div className="text-[#888] truncate">hash: 0x8b3c1d...</div>
                          <div className="text-[#666] mt-1">
                            {formatTimeAgo(recentQuestions[1].timestamp?.toDate?.() || new Date(recentQuestions[1].timestamp))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pipeline Timeline Graph Placeholder */}
                <div className="border border-[#151515] rounded-lg p-6">
                  <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Pipeline Timeline</h4>
                  <div className="h-64 bg-[#0a0a0a] rounded border border-[#2a2a2a] flex items-center justify-center">
                    <div className="text-center text-[#666]">
                      <div className="text-4xl mb-2">📊</div>
                      <div className="text-sm">Timeline visualization kommer här</div>
                      <div className="text-xs mt-1">(Implementeras med Firebase integration)</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notes Tab */}
            {selectedTab === 'notes' && (
              <>
                <div>
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Collaborative Notes</h3>
                  
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-[#151515] rounded-lg p-6 hover:border-[#2a2a2a] transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-medium text-[#e7e7e7]">{note.title}</h4>
                          <div className="text-xs text-[#666]">{formatTimeAgo(note.lastEdited)}</div>
                        </div>
                        <p className="text-sm text-[#888] mb-4">{note.content}</p>
                        <div className="flex flex-wrap gap-2">
                          {note.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-[#0a0a0a] text-[#888] text-xs rounded border border-[#2a2a2a]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    <button className="w-full border border-dashed border-[#2a2a2a] rounded-lg p-6 text-[#666] hover:text-[#888] hover:border-[#3a3a3a] transition-colors">
                      + Ny anteckning
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Settings Tab */}
            {selectedTab === 'settings' && (
              <>
                <div>
                  <h3 className="text-xs text-[#666] uppercase tracking-wider mb-6">Inställningar</h3>
                  
                  {/* Service Toggles */}
                  <div className="mb-8 border border-[#151515] rounded-lg p-6">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">AI-tjänster</h4>
                    <div className="space-y-3">
                      {['GPT-3.5', 'Gemini', 'DeepSeek', 'Grok', 'Qwen'].map((service) => (
                        <div key={service} className="flex items-center justify-between py-2 border-b border-[#151515]">
                          <span className="text-sm text-[#e7e7e7]">{service}</span>
                          <label className="relative inline-block w-12 h-6">
                            <input type="checkbox" defaultChecked className="sr-only peer" />
                            <div className="w-full h-full bg-[#2a2a2a] peer-checked:bg-[#e7e7e7] rounded-full transition-colors"></div>
                            <div className="absolute left-1 top-1 w-4 h-4 bg-[#666] peer-checked:bg-[#0a0a0a] peer-checked:translate-x-6 rounded-full transition-transform"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline Profiles */}
                  <div className="mb-8 border border-[#151515] rounded-lg p-6">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Pipeline Profiler</h4>
                    <div className="space-y-2">
                      {['Standard', 'Snabb (färre analyser)', 'Djup (full ML-pipeline)', 'Anpassad'].map((profile, idx) => (
                        <label key={profile} className="flex items-center gap-3 p-3 rounded hover:bg-[#0a0a0a] cursor-pointer transition-colors">
                          <input type="radio" name="pipeline-profile" defaultChecked={idx === 0} className="w-4 h-4" />
                          <span className="text-sm text-[#e7e7e7]">{profile}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Notifications */}
                  <div className="border border-[#151515] rounded-lg p-6">
                    <h4 className="text-sm font-medium text-[#e7e7e7] mb-4">Notifikationer</h4>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between py-2 border-b border-[#151515]">
                        <span className="text-sm text-[#e7e7e7]">Veckans sammanfattning</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                      </label>
                      <label className="flex items-center justify-between py-2 border-b border-[#151515]">
                        <span className="text-sm text-[#e7e7e7]">Community trends</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                      </label>
                      <label className="flex items-center justify-between py-2 border-b border-[#151515]">
                        <span className="text-sm text-[#e7e7e7]">Nya funktioner</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Local Text Analysis Preview */}
                <div className="border border-[#151515] rounded-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-[#2a2a2a] rounded-lg flex items-center justify-center text-lg">🔬</div>
                    <div>
                      <div className="font-medium text-[#e7e7e7]">Lokal Textanalys (Beta)</div>
                      <div className="text-sm text-[#666]">ML-pipeline för lokal bearbetning</div>
                    </div>
                  </div>
                  <div className="text-sm text-[#888] mb-4">
                    Kör analyser lokalt i din webbläsare med ONNX och WebAssembly. Ingen data lämnar din enhet.
                  </div>
                  <button className="text-sm text-[#666] hover:text-[#e7e7e7] border border-[#2a2a2a] px-4 py-2 rounded hover:border-[#3a3a3a] transition-colors">
                    Aktivera lokal analys
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <FooterDemo4 />
    </div>
  );
}
