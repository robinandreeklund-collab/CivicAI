import { useState } from 'react';

/**
 * AI Service Toggle Component
 * Allows users to enable/disable which AI services to query
 * Replaces the "Tänk Hårdare" button concept
 */
export default function AIServiceToggle({ services, onServicesChange }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleService = (serviceId) => {
    const updatedServices = services.map(service => 
      service.id === serviceId 
        ? { ...service, enabled: !service.enabled }
        : service
    );
    onServicesChange(updatedServices);
  };

  const enabledCount = services.filter(s => s.enabled).length;

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-civic-dark-800/50 border border-civic-dark-600 hover:border-blue-500/30 text-gray-300 hover:text-gray-100 transition-all duration-200 hover:scale-105"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-medium">
          AI-tjänster ({enabledCount}/{services.length})
        </span>
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Services Panel */}
      {isExpanded && (
        <div className="absolute top-full mt-2 right-0 w-72 bg-civic-dark-800 rounded-lg shadow-xl border border-civic-dark-700 overflow-hidden animate-fade-in z-50">
          <div className="p-3 border-b border-civic-dark-700">
            <h3 className="text-sm font-semibold text-gray-200">Välj AI-tjänster</h3>
            <p className="text-xs text-gray-500 mt-1">
              Aktivera de modeller du vill inkludera i svaret
            </p>
          </div>
          
          <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`
                  w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200
                  ${service.enabled 
                    ? 'bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30' 
                    : 'bg-civic-dark-900/50 border border-civic-dark-700 hover:bg-civic-dark-900'
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center text-lg
                    ${service.enabled ? service.iconBg : 'bg-civic-dark-700'}
                  `}>
                    {service.icon}
                  </div>
                  <div className="text-left">
                    <div className={`text-sm font-medium ${service.enabled ? 'text-gray-100' : 'text-gray-400'}`}>
                      {service.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {service.description}
                    </div>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <div className={`
                  relative w-11 h-6 rounded-full transition-colors duration-200
                  ${service.enabled ? 'bg-blue-500' : 'bg-civic-dark-700'}
                `}>
                  <div className={`
                    absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                    ${service.enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}></div>
                </div>
              </button>
            ))}
          </div>

          {enabledCount === 0 && (
            <div className="p-3 bg-amber-500/10 border-t border-amber-500/20">
              <p className="text-xs text-amber-400 flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Minst en tjänst måste vara aktiverad</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
