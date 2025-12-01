/**
 * LanguageToolConfig.jsx
 * Admin-panel för LanguageTool self-hosted server
 * 
 * Funktionalitet:
 * - Visa serverstatus (online/offline)
 * - Starta/stoppa server via Docker
 * - Visa statistik och konfiguration
 * - Testa stavningskontroll
 */

import React, { useState, useEffect, useCallback } from 'react';

const LanguageToolConfig = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testText, setTestText] = useState('Vad är väddret i Hjo imorn?');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  // Hämta serverstatus
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ml/typo/status');
      if (!response.ok) throw new Error('Could not fetch status');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Kunde inte hämta serverstatus');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Uppdatera status var 30:e sekund
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Testa stavningskontroll
  const handleTest = async () => {
    if (!testText.trim()) return;
    
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/ml/typo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: testText, auto_correct: true })
      });
      
      if (!response.ok) throw new Error('Test failed');
      
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: 'Testet misslyckades: ' + err.message });
    } finally {
      setTesting(false);
    }
  };

  // Renderera statusindikator
  const StatusIndicator = ({ online }) => (
    <span 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '20px',
        backgroundColor: online ? '#e6f4ea' : '#fce8e6',
        color: online ? '#1e7e34' : '#c62828',
        fontSize: '14px',
        fontWeight: '500'
      }}
    >
      <span 
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: online ? '#1e7e34' : '#c62828'
        }}
      />
      {online ? 'Online' : 'Offline'}
    </span>
  );

  if (loading) {
    return (
      <div className="languagetool-config" style={{ padding: '20px' }}>
        <h2>🔧 LanguageTool Self-Hosted</h2>
        <p>Laddar...</p>
      </div>
    );
  }

  return (
    <div className="languagetool-config" style={{ padding: '20px' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        🔧 LanguageTool Self-Hosted
        {status && <StatusIndicator online={status.languagetool_available} />}
      </h2>

      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#fce8e6',
          borderRadius: '8px',
          color: '#c62828',
          marginBottom: '20px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Serverinfo */}
      <section style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>📊 Serverstatus</h3>
        
        {status ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LanguageTool Server:</span>
              <StatusIndicator online={status.languagetool_available} />
            </div>
            
            {status.languagetool_status && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>URL:</span>
                  <code style={{ backgroundColor: '#e8e8e8', padding: '2px 8px', borderRadius: '4px' }}>
                    {status.languagetool_status.url || 'http://localhost:8010'}
                  </code>
                </div>
                
                {status.languagetool_status.swedish_supported !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Svenska stöds:</span>
                    <span>{status.languagetool_status.swedish_supported ? '✅ Ja' : '❌ Nej'}</span>
                  </div>
                )}
                
                {status.languagetool_status.languages_count && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Antal språk:</span>
                    <span>{status.languagetool_status.languages_count}</span>
                  </div>
                )}
              </>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fallback aktiv:</span>
              <span>{status.fallback_ready ? '✅ Ja' : '❌ Nej'}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ordlista:</span>
              <span>{status.dictionary_words || 0} ord</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Kända stavfel:</span>
              <span>{status.common_typos || 0} mönster</span>
            </div>
          </div>
        ) : (
          <p>Ingen statusinformation tillgänglig</p>
        )}
        
        <button
          onClick={fetchStatus}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Uppdatera status
        </button>
      </section>

      {/* Docker-instruktioner */}
      <section style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>🐳 Docker-hantering</h3>
        
        <p style={{ marginBottom: '12px' }}>Starta LanguageTool-servern:</p>
        
        <pre style={{
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '13px'
        }}>
{`cd docker/languagetool
docker-compose up -d`}
        </pre>
        
        <p style={{ marginTop: '16px', marginBottom: '12px' }}>Stoppa servern:</p>
        
        <pre style={{
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '13px'
        }}>
{`cd docker/languagetool
docker-compose down`}
        </pre>
        
        <p style={{ marginTop: '16px', marginBottom: '12px' }}>Visa loggar:</p>
        
        <pre style={{
          backgroundColor: '#2d3748',
          color: '#e2e8f0',
          padding: '12px',
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '13px'
        }}>
{`docker-compose logs -f languagetool`}
        </pre>
      </section>

      {/* Testfält */}
      <section style={{
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        padding: '20px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>🧪 Testa stavningskontroll</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            placeholder="Skriv text att kontrollera..."
            style={{
              width: '100%',
              minHeight: '80px',
              padding: '12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: '14px',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>
        
        <button
          onClick={handleTest}
          disabled={testing || !testText.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: testing ? '#ccc' : '#34a853',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            fontSize: '14px'
          }}
        >
          {testing ? '⏳ Testar...' : '✅ Testa'}
        </button>
        
        {testResult && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: testResult.error ? '#fce8e6' : '#e6f4ea',
            borderRadius: '8px'
          }}>
            {testResult.error ? (
              <p style={{ color: '#c62828', margin: 0 }}>❌ {testResult.error}</p>
            ) : (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Original:</strong>
                  <p style={{ margin: '4px 0', fontStyle: 'italic' }}>{testResult.original}</p>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <strong>Korrigerad:</strong>
                  <p style={{ 
                    margin: '4px 0', 
                    color: testResult.is_correct ? '#1e7e34' : '#1a73e8',
                    fontWeight: '500'
                  }}>
                    {testResult.corrected}
                  </p>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <strong>Status:</strong>{' '}
                  {testResult.is_correct ? '✅ Inga fel' : `⚠️ ${testResult.errors_found || 0} fel`}
                </div>
                
                <div>
                  <strong>Metod:</strong>{' '}
                  <code style={{ 
                    backgroundColor: '#e8e8e8', 
                    padding: '2px 8px', 
                    borderRadius: '4px' 
                  }}>
                    {testResult.method || 'unknown'}
                  </code>
                </div>
                
                {testResult.word_results && testResult.word_results.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Korrigeringar:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {testResult.word_results
                        .filter(r => !r.is_correct)
                        .map((r, i) => (
                          <li key={i}>
                            <span style={{ textDecoration: 'line-through', color: '#c62828' }}>
                              {r.original}
                            </span>
                            {' → '}
                            <span style={{ color: '#1e7e34', fontWeight: '500' }}>
                              {r.corrected}
                            </span>
                            {r.suggestions && r.suggestions.length > 1 && (
                              <span style={{ color: '#666', fontSize: '12px' }}>
                                {' '}(alt: {r.suggestions.slice(1, 3).join(', ')})
                              </span>
                            )}
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Fördelar */}
      <section style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#e8f4fd',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px' }}>💡 Fördelar med LanguageTool Self-Hosted</h3>
        
        <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
          <li><strong>🔒 100 % privat:</strong> All data stannar på din egen server</li>
          <li><strong>💰 0 kr för evigt:</strong> Inga API-avgifter eller rate limits</li>
          <li><strong>🇸🇪 Svenska:</strong> Full support för svenska med kontext</li>
          <li><strong>🧠 Kontextförståelse:</strong> "bor i Hjo" korrigeras INTE till "bra i hon"</li>
          <li><strong>⚡ Snabb:</strong> Lokal server = låg latens</li>
        </ul>
      </section>
    </div>
  );
};

export default LanguageToolConfig;
