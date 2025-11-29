import { useState, useEffect } from 'react';

/**
 * Integrations Management Component
 * 
 * Manages external API integrations for OneSeek Real-Time Suite:
 * - Swedish Cities (SMHI weather data)
 * - RSS News Feeds
 * - Swedish Open Data APIs (SCB, Riksdagen, Krisinformation, etc.)
 * 
 * All integrations are dashboard-controlled with real-time updates.
 * No server restart required - changes take effect immediately.
 */
export default function IntegrationsManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Swedish Cities state (weather)
  const [swedishCities, setSwedishCities] = useState({});
  const [citiesInput, setCitiesInput] = useState('');
  const [citiesSaving, setCitiesSaving] = useState(false);

  // RSS Feeds state
  const [rssFeeds, setRssFeeds] = useState([]);
  const [rssInput, setRssInput] = useState('');
  const [rssSaving, setRssSaving] = useState(false);

  // Open Data APIs state
  const [openDataApis, setOpenDataApis] = useState([]);
  const [openDataSaving, setOpenDataSaving] = useState(false);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSwedishCities(),
      fetchRssFeeds(),
      fetchOpenDataApis()
    ]);
    setLoading(false);
  };

  // Fetch Swedish Cities
  const fetchSwedishCities = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/swedish-cities');
      } catch {
        response = await fetch('/api/swedish-cities');
      }
      if (response.ok) {
        const data = await response.json();
        const cities = data.cities || {};
        setSwedishCities(cities);
        // Format cities for input
        const cityList = Object.entries(cities).map(([name, coords]) => 
          `${name}:${coords.lat},${coords.lon}`
        ).join('\n');
        setCitiesInput(cityList);
      }
    } catch (err) {
      console.error('Error fetching Swedish cities:', err);
    }
  };

  // Save Swedish Cities
  const handleSaveCities = async () => {
    setCitiesSaving(true);
    try {
      // Parse the input format: "cityname:lat,lon" per line
      const cities = {};
      const lines = citiesInput.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const [name, coords] = line.split(':');
        if (name && coords) {
          const [lat, lon] = coords.split(',').map(c => parseFloat(c.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            cities[name.trim().toLowerCase()] = { lat, lon };
          }
        }
      }

      let response;
      try {
        response = await fetch('http://localhost:5000/api/swedish-cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cities })
        });
      } catch {
        response = await fetch('/api/swedish-cities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cities })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setSwedishCities(data.cities || {});
        setSuccess(`Svenska städer sparade! ${data.count} städer konfigurerade.`);
      } else {
        throw new Error('Failed to save cities');
      }
    } catch (err) {
      console.error('Error saving Swedish cities:', err);
      setError('Kunde inte spara städer');
    } finally {
      setCitiesSaving(false);
    }
  };

  // Fetch RSS Feeds
  const fetchRssFeeds = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/rss-feeds');
      } catch {
        response = await fetch('/api/rss-feeds');
      }
      if (response.ok) {
        const data = await response.json();
        const feeds = data.feeds || [];
        setRssFeeds(feeds);
        // Format feeds for input
        const feedList = feeds.map(f => `${f.name || ''}:${f.url}`).join('\n');
        setRssInput(feedList);
      }
    } catch (err) {
      console.error('Error fetching RSS feeds:', err);
    }
  };

  // Save RSS Feeds
  const handleSaveRss = async () => {
    setRssSaving(true);
    try {
      // Parse the input format: "name:url" per line
      const feeds = [];
      const lines = rssInput.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const name = line.substring(0, colonIdx).trim();
          const url = line.substring(colonIdx + 1).trim();
          if (url.startsWith('http')) {
            feeds.push({ name, url });
          }
        } else if (line.trim().startsWith('http')) {
          // URL only, no name
          feeds.push({ name: '', url: line.trim() });
        }
      }

      let response;
      try {
        response = await fetch('http://localhost:5000/api/rss-feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feeds })
        });
      } catch {
        response = await fetch('/api/rss-feeds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feeds })
        });
      }

      if (response.ok) {
        const data = await response.json();
        setRssFeeds(data.feeds || []);
        setSuccess(`RSS-feeds sparade! ${data.count} feeds konfigurerade.`);
      } else {
        throw new Error('Failed to save feeds');
      }
    } catch (err) {
      console.error('Error saving RSS feeds:', err);
      setError('Kunde inte spara RSS-feeds');
    } finally {
      setRssSaving(false);
    }
  };

  // Fetch Open Data APIs
  const fetchOpenDataApis = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:5000/api/open-data');
      } catch {
        response = await fetch('/api/open-data');
      }
      if (response.ok) {
        const data = await response.json();
        setOpenDataApis(data.apis || []);
      }
    } catch (err) {
      console.error('Error fetching Open Data APIs:', err);
    }
  };

  // Toggle Open Data API enabled status
  const handleToggleOpenDataApi = async (apiId, enabled) => {
    setOpenDataSaving(true);
    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/open-data/${apiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled })
        });
      } catch {
        response = await fetch(`/api/open-data/${apiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !enabled })
        });
      }
      if (response.ok) {
        fetchOpenDataApis();
        setSuccess(`API ${enabled ? 'avaktiverad' : 'aktiverad'}!`);
      }
    } catch (err) {
      console.error('Error toggling Open Data API:', err);
      setError('Kunde inte ändra API-status');
    } finally {
      setOpenDataSaving(false);
    }
  };

  // Save API triggers
  const handleSaveApiTriggers = async (apiId, triggers) => {
    setOpenDataSaving(true);
    try {
      let response;
      try {
        response = await fetch(`http://localhost:5000/api/open-data/${apiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers })
        });
      } catch {
        response = await fetch(`/api/open-data/${apiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ triggers })
        });
      }
      if (response.ok) {
        setSuccess(`Triggers sparade för ${apiId}!`);
      } else {
        throw new Error('Failed to save triggers');
      }
    } catch (err) {
      console.error('Error saving API triggers:', err);
      setError('Kunde inte spara triggers');
    } finally {
      setOpenDataSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[#666] font-mono text-sm">Laddar integrationer...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="border border-purple-500/30 bg-purple-500/5 p-4 rounded">
        <p className="text-purple-300 font-mono text-sm">
          🔌 Hantera externa API-integrationer för OneSeek Real-Time Suite. 
          Alla ändringar aktiveras direkt utan omstart.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded font-mono text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="border border-green-500/30 bg-green-500/10 text-green-400 p-4 rounded font-mono text-sm">
          {success}
        </div>
      )}

      {/* Swedish Cities Section */}
      <div className="border border-cyan-500/30 bg-cyan-500/5 p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#eee] font-mono text-base flex items-center gap-2">
              🌤️ Svenska Städer (Väder)
            </h3>
            <p className="text-[#666] font-mono text-xs mt-1">
              SMHI väderdata för svenska städer. Väder hämtas automatiskt när stad nämns i frågan.
              Format: <code className="text-cyan-300">stadnamn:lat,lon</code> per rad.
            </p>
          </div>
          <span className="px-3 py-1 text-xs bg-cyan-500/20 text-cyan-300 rounded font-mono">
            {Object.keys(swedishCities).length} städer
          </span>
        </div>
        
        <textarea
          value={citiesInput}
          onChange={(e) => setCitiesInput(e.target.value)}
          className="w-full h-40 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-cyan-500/50 resize-y"
          placeholder={`stockholm:59.33,18.07
göteborg:57.71,11.97
malmö:55.61,13.00
uppsala:59.86,17.64
luleå:65.58,22.16`}
        />
        <p className="text-[#555] font-mono text-xs mt-2 mb-3">
          En stad per rad i format: <code>stad:latitud,longitud</code>
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveCities}
            disabled={citiesSaving}
            className="px-6 py-2 bg-cyan-600 text-white text-sm font-mono hover:bg-cyan-700 transition-colors disabled:opacity-50 rounded"
          >
            {citiesSaving ? 'Sparar...' : '💾 Spara Städer'}
          </button>
          <button
            onClick={fetchSwedishCities}
            className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors rounded"
          >
            Återställ
          </button>
        </div>
        
        {/* Preview of current cities */}
        {Object.keys(swedishCities).length > 0 && (
          <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
            <p className="text-[#666] font-mono text-xs mb-2">Konfigurerade städer:</p>
            <div className="flex flex-wrap gap-1">
              {Object.keys(swedishCities).slice(0, 15).map((city, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-cyan-500/10 text-cyan-300 rounded font-mono capitalize">
                  {city}
                </span>
              ))}
              {Object.keys(swedishCities).length > 15 && (
                <span className="px-2 py-0.5 text-xs bg-[#1a1a1a] text-[#666] rounded font-mono">
                  +{Object.keys(swedishCities).length - 15} fler
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* RSS Feeds Section */}
      <div className="border border-orange-500/30 bg-orange-500/5 p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#eee] font-mono text-base flex items-center gap-2">
              📰 RSS Nyhetsfeeds
            </h3>
            <p className="text-[#666] font-mono text-xs mt-1">
              Hämtar senaste nyheter från konfigurerade RSS-feeds. Aktiveras vid nyhetsfrågor.
              Format: <code className="text-orange-300">namn:url</code> per rad.
            </p>
          </div>
          <span className="px-3 py-1 text-xs bg-orange-500/20 text-orange-300 rounded font-mono">
            {rssFeeds.length} feeds
          </span>
        </div>
        
        <textarea
          value={rssInput}
          onChange={(e) => setRssInput(e.target.value)}
          className="w-full h-40 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-orange-500/50 resize-y"
          placeholder={`SVT Nyheter:https://www.svt.se/nyheter/rss.xml
SVT Inrikes:https://www.svt.se/nyheter/inrikes/rss.xml
Omni:https://omni.se/rss
SR Ekot:https://api.sr.se/api/rss/program/83`}
        />
        <p className="text-[#555] font-mono text-xs mt-2 mb-3">
          En feed per rad i format: <code>namn:url</code> (namn är valfritt)
        </p>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveRss}
            disabled={rssSaving}
            className="px-6 py-2 bg-orange-600 text-white text-sm font-mono hover:bg-orange-700 transition-colors disabled:opacity-50 rounded"
          >
            {rssSaving ? 'Sparar...' : '💾 Spara RSS-feeds'}
          </button>
          <button
            onClick={fetchRssFeeds}
            className="px-4 py-2 border border-[#2a2a2a] text-[#888] text-sm font-mono hover:bg-[#1a1a1a] transition-colors rounded"
          >
            Återställ
          </button>
        </div>
        
        {/* Preview of current feeds */}
        {rssFeeds.length > 0 && (
          <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
            <p className="text-[#666] font-mono text-xs mb-2">Konfigurerade feeds:</p>
            <div className="flex flex-wrap gap-1">
              {rssFeeds.map((feed, idx) => (
                <span key={idx} className="px-2 py-0.5 text-xs bg-orange-500/10 text-orange-300 rounded font-mono">
                  {feed.name || new URL(feed.url).hostname}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Swedish Open Data APIs Section */}
      <div className="border border-purple-500/30 bg-purple-500/5 p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#eee] font-mono text-base flex items-center gap-2">
              📊 Svenska Öppna Data APIs
            </h3>
            <p className="text-[#666] font-mono text-xs mt-1">
              Publika svenska API:er - 100% gratis, inga nycklar. Redigera triggers för varje API.
            </p>
          </div>
          <span className="px-3 py-1 text-xs bg-purple-500/20 text-purple-300 rounded font-mono">
            {openDataApis.filter(api => api.enabled).length}/{openDataApis.length} aktiva
          </span>
        </div>
        
        {openDataApis.length > 0 ? (
          <div className="space-y-4">
            {openDataApis.map((api, idx) => (
              <div
                key={idx}
                className={`p-4 rounded border transition-colors ${
                  api.enabled
                    ? 'bg-purple-500/10 border-purple-500/30'
                    : 'bg-[#0a0a0a] border-[#2a2a2a] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleOpenDataApi(api.id, api.enabled)}
                      disabled={openDataSaving}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        api.enabled ? 'bg-green-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${
                        api.enabled ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className="text-[#eee] font-mono text-sm font-medium">
                      {api.name}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 text-xs rounded font-mono ${
                    api.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {api.enabled ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>
                
                <p className="text-[#666] font-mono text-xs mb-3">
                  {api.description}
                </p>
                
                <div className="space-y-2">
                  <label className="text-[#888] font-mono text-xs">Triggers (komma-separerade):</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={(api.triggers || []).join(', ')}
                      onChange={(e) => {
                        const newTriggers = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        const updatedApis = [...openDataApis];
                        updatedApis[idx] = { ...api, triggers: newTriggers };
                        setOpenDataApis(updatedApis);
                      }}
                      className="flex-1 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] font-mono text-xs p-2 rounded focus:outline-none focus:border-purple-500/50"
                      placeholder="trigger1, trigger2, trigger3..."
                    />
                    <button
                      onClick={() => handleSaveApiTriggers(api.id, api.triggers)}
                      disabled={openDataSaving}
                      className="px-4 py-2 bg-purple-600 text-white text-xs font-mono hover:bg-purple-700 transition-colors rounded disabled:opacity-50"
                    >
                      Spara
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#666] font-mono text-sm text-center py-8">
            Inga API:er konfigurerade. Kontrollera att ML-servicen körs på port 5000.
          </div>
        )}
        
        {/* Info about API status */}
        <div className="mt-4 p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
          <p className="text-[#666] font-mono text-xs mb-2">💡 API-information:</p>
          <ul className="text-[#555] font-mono text-xs space-y-1">
            <li>• <span className="text-cyan-300">SCB</span> - Befolkning, ekonomi, statistik från Statistiska Centralbyrån</li>
            <li>• <span className="text-cyan-300">Riksdagen</span> - Voteringar, lagförslag, debatter i realtid</li>
            <li>• <span className="text-cyan-300">Krisinformation</span> - Krislarm, VMA, beredskapsmeddelanden</li>
            <li>• <span className="text-cyan-300">SMHI</span> - Väderdata för alla svenska städer</li>
            <li>• <span className="text-cyan-300">Trafikverket</span> - Trafikflöde, olyckor, kollektivtrafik</li>
          </ul>
          <p className="text-[#555] font-mono text-xs mt-2">
            📌 Alla svar inkluderar nu klickbara källänkar under svaret.
          </p>
        </div>
      </div>

      {/* Time & Date Info */}
      <div className="border border-blue-500/30 bg-blue-500/5 p-4 rounded">
        <h4 className="text-[#eee] font-mono text-sm mb-2 flex items-center gap-2">
          🕐 Alltid aktiva funktioner
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 text-xs bg-blue-500/10 text-blue-300 rounded font-mono">
            📅 Tid & Datum (injiceras alltid)
          </span>
          <span className="px-3 py-1 text-xs bg-blue-500/10 text-blue-300 rounded font-mono">
            🌸 Årstidsmedvetenhet
          </span>
          <span className="px-3 py-1 text-xs bg-green-500/10 text-green-300 rounded font-mono">
            🇸🇪 Force-Svenska (langdetect)
          </span>
        </div>
        <p className="text-[#555] font-mono text-xs mt-2">
          Dessa funktioner är alltid aktiva och kräver ingen konfiguration.
        </p>
      </div>
    </div>
  );
}
