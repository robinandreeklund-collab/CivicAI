import { useState, useEffect } from 'react';

/**
 * AuditTrailPage
 * Full-page view for audit trail
 */
export default function AuditTrailPage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAuditData();
  }, [filter]);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      // Fetch events
      const eventsUrl = filter === 'all' 
        ? '/api/audit?limit=100' 
        : `/api/audit?type=${filter}&limit=100`;
      
      const eventsResponse = await fetch(eventsUrl);
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      // Fetch stats
      const statsResponse = await fetch('/api/audit/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const eventTypeLabels = {
    question_asked: { label: 'Fråga ställd', icon: '❓', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    export_yaml: { label: 'YAML-export', icon: '📄', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    export_json: { label: 'JSON-export', icon: '📋', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    export_pdf: { label: 'PDF-export', icon: '📊', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    export_readme: { label: 'README-export', icon: '📝', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    vote_cast: { label: 'Röst avlagd', icon: '🗳️', color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    policy_question_created: { label: 'Policyfråga skapad', icon: '➕', color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
    policy_question_updated: { label: 'Policyfråga uppdaterad', icon: '✏️', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
    policy_question_deleted: { label: 'Policyfråga borttagen', icon: '🗑️', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="flex-1 overflow-y-auto relative">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-4xl shadow-lg shadow-indigo-500/30">
                  📚
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-100">Audit Trail</h1>
                  <p className="text-gray-400 mt-1">Historik över frågor och händelser</p>
                </div>
              </div>
              <button
                onClick={fetchAuditData}
                disabled={isLoading}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-civic-dark-600 text-white font-semibold rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Uppdatera</span>
              </button>
            </div>
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-6 rounded-2xl bg-civic-dark-800/50 border border-civic-dark-600">
                <p className="text-sm text-gray-400 mb-1">Totalt händelser</p>
                <p className="text-3xl font-bold text-gray-100">{stats.total}</p>
              </div>
              {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => {
                const typeInfo = eventTypeLabels[type] || { label: type, icon: '📌', color: 'text-gray-400' };
                return (
                  <div key={type} className="p-6 rounded-2xl bg-civic-dark-800/50 border border-civic-dark-600">
                    <p className="text-sm text-gray-400 mb-1">{typeInfo.label}</p>
                    <p className={`text-3xl font-bold ${typeInfo.color}`}>{count}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-indigo-500 text-white shadow-lg'
                  : 'bg-civic-dark-800/50 text-gray-300 hover:bg-civic-dark-700'
              }`}
            >
              Alla
            </button>
            {['question_asked', 'export_yaml', 'export_json', 'export_pdf', 'export_readme', 'vote_cast'].map((type) => {
              const typeInfo = eventTypeLabels[type];
              return (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    filter === type
                      ? 'bg-indigo-500 text-white shadow-lg'
                      : 'bg-civic-dark-800/50 text-gray-300 hover:bg-civic-dark-700'
                  }`}
                >
                  {typeInfo.icon} {typeInfo.label}
                </button>
              );
            })}
          </div>

          {/* Events list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <svg className="animate-spin h-12 w-12 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-xl">Inga händelser hittades</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const typeInfo = eventTypeLabels[event.type] || { label: event.type, icon: '📌', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
                
                return (
                  <div
                    key={event.id}
                    className="p-6 rounded-2xl bg-civic-dark-800/50 border border-civic-dark-600 hover:bg-civic-dark-800/70 hover:border-indigo-500/50 transition-all duration-200"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl ${typeInfo.bgColor} flex items-center justify-center text-2xl flex-shrink-0`}>
                        {typeInfo.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className={`text-lg font-semibold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        {event.data && event.data.question && (
                          <p className="text-sm text-gray-300 mb-2">
                            {event.data.question}
                          </p>
                        )}
                        {event.data && event.data.winnerId && (
                          <p className="text-sm text-gray-300 mb-2">
                            Vinnare: <span className="font-semibold text-orange-400">{event.data.winnerId}</span>
                          </p>
                        )}
                        {event.data && event.data.responseCount && (
                          <p className="text-sm text-gray-400 mb-2">
                            Antal svar: {event.data.responseCount}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Användare: {event.userId}</span>
                          <span>ID: {event.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
