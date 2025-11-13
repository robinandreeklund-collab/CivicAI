import { useState, useEffect } from 'react';

/**
 * AuditTrailViewer Component
 * Displays history of questions and export events
 */
export default function AuditTrailViewer() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      fetchAuditData();
    }
  }, [isExpanded, filter]);

  const fetchAuditData = async () => {
    setIsLoading(true);
    try {
      // Fetch events
      const eventsUrl = filter === 'all' 
        ? '/api/audit?limit=50' 
        : `/api/audit?type=${filter}&limit=50`;
      
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
    question_asked: { label: 'Fråga ställd', icon: '❓', color: 'text-blue-400' },
    export_yaml: { label: 'YAML-export', icon: '📄', color: 'text-green-400' },
    export_json: { label: 'JSON-export', icon: '📋', color: 'text-green-400' },
    export_pdf: { label: 'PDF-export', icon: '📊', color: 'text-red-400' },
    export_readme: { label: 'README-export', icon: '📝', color: 'text-purple-400' },
    vote_cast: { label: 'Röst avlagd', icon: '🗳️', color: 'text-orange-400' },
    policy_question_created: { label: 'Policyfråga skapad', icon: '➕', color: 'text-cyan-400' },
    policy_question_updated: { label: 'Policyfråga uppdaterad', icon: '✏️', color: 'text-yellow-400' },
    policy_question_deleted: { label: 'Policyfråga borttagen', icon: '🗑️', color: 'text-red-400' },
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 animate-fade-in-up relative overflow-hidden">
      {/* Toggle button when collapsed */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-6 py-4 bg-civic-dark-800/50 hover:bg-civic-dark-700/50 border border-civic-dark-600 rounded-2xl transition-all duration-300 flex items-center justify-between group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              📚
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-100">Audit Trail</h3>
              <p className="text-sm text-gray-400">Visa historik och händelser</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-gray-400 group-hover:text-gray-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {/* Expanded view */}
      {isExpanded && (
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl"></div>

          {/* Main content */}
          <div className="relative backdrop-blur-sm bg-civic-dark-800/50 rounded-2xl border border-indigo-500/20 p-8 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30">
                  📚
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-100">Audit Trail</h2>
                  <p className="text-sm text-gray-400">Historik över frågor och händelser</p>
                </div>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600">
                  <p className="text-sm text-gray-400">Totalt händelser</p>
                  <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
                </div>
                {Object.entries(stats.byType).slice(0, 3).map(([type, count]) => {
                  const typeInfo = eventTypeLabels[type] || { label: type, icon: '📌', color: 'text-gray-400' };
                  return (
                    <div key={type} className="p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600">
                      <p className="text-sm text-gray-400">{typeInfo.label}</p>
                      <p className={`text-2xl font-bold ${typeInfo.color}`}>{count}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === 'all'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-civic-dark-700/50 text-gray-300 hover:bg-civic-dark-600'
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
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === type
                        ? 'bg-indigo-500 text-white'
                        : 'bg-civic-dark-700/50 text-gray-300 hover:bg-civic-dark-600'
                    }`}
                  >
                    {typeInfo.icon} {typeInfo.label}
                  </button>
                );
              })}
            </div>

            {/* Events list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>Inga händelser hittades</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {events.map((event) => {
                  const typeInfo = eventTypeLabels[event.type] || { label: event.type, icon: '📌', color: 'text-gray-400' };
                  
                  return (
                    <div
                      key={event.id}
                      className="p-4 rounded-xl bg-civic-dark-700/50 border border-civic-dark-600 hover:bg-civic-dark-700/70 transition-all duration-200"
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{typeInfo.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-semibold ${typeInfo.color}`}>
                              {typeInfo.label}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          {event.data && event.data.question && (
                            <p className="text-sm text-gray-300 mt-1 truncate">
                              {event.data.question}
                            </p>
                          )}
                          {event.data && event.data.winnerId && (
                            <p className="text-sm text-gray-300 mt-1">
                              Vinnare: <span className="font-semibold">{event.data.winnerId}</span>
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Användare: {event.userId}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Refresh button */}
            <div className="mt-6">
              <button
                onClick={fetchAuditData}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-civic-dark-600 text-white font-medium rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isLoading ? 'Uppdaterar...' : 'Uppdatera'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
