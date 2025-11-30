/**
 * StavfelEditor - Admin-panel för att granska stavfels-dataset
 * ONESEEK Δ+ Alignment
 * 
 * Funktioner:
 * - Visa alla ogranskade stavfelspar
 * - Godkänn/avvisa par
 * - Exportera för träning
 * - Statistik över dataset
 */

import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api/ml';

// Statusfärger
const STATUS_COLORS = {
  pending: '#ffc107',
  approved: '#28a745',
  rejected: '#dc3545'
};

const StavfelEditor = () => {
  const [pairs, setPairs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'all'
  const [exporting, setExporting] = useState(false);

  // Hämta stavfelspar
  const fetchPairs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stavfel?filter=${filter}&limit=100`);
      if (!response.ok) throw new Error('Kunde inte hämta data');
      const data = await response.json();
      setPairs(data.pairs || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      setError(err.message);
      setPairs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPairs();
  }, [fetchPairs]);

  // Godkänn ett par
  const approvePair = async (original, corrected) => {
    try {
      const response = await fetch(`${API_BASE}/stavfel/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, corrected })
      });
      
      if (!response.ok) throw new Error('Kunde inte godkänna');
      
      // Uppdatera lokalt
      setPairs(prev => prev.map(p => 
        (p.original === original && p.corrected === corrected) 
          ? { ...p, approved: true } 
          : p
      ));
    } catch (err) {
      alert(`Fel: ${err.message}`);
    }
  };

  // Avvisa ett par
  const rejectPair = async (original, corrected) => {
    if (!window.confirm(`Ta bort "${original}" → "${corrected}"?`)) return;
    
    try {
      const response = await fetch(`${API_BASE}/stavfel/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ original, corrected })
      });
      
      if (!response.ok) throw new Error('Kunde inte ta bort');
      
      // Ta bort lokalt
      setPairs(prev => prev.filter(p => 
        !(p.original === original && p.corrected === corrected)
      ));
    } catch (err) {
      alert(`Fel: ${err.message}`);
    }
  };

  // Exportera för träning
  const exportForTraining = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${API_BASE}/stavfel/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'jsonl' })
      });
      
      if (!response.ok) throw new Error('Export misslyckades');
      
      const data = await response.json();
      alert(`Export klar: ${data.file_path}\n${data.count} par exporterade.`);
    } catch (err) {
      alert(`Fel: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  // Godkänn alla synliga
  const approveAll = async () => {
    if (!window.confirm(`Godkänn alla ${pairs.filter(p => !p.approved).length} ogranskade par?`)) return;
    
    const pending = pairs.filter(p => !p.approved);
    for (const pair of pending) {
      await approvePair(pair.original, pair.corrected);
    }
    
    alert(`${pending.length} par godkända!`);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📝 Stavfels-dataset</h2>
        <p style={styles.subtitle}>
          Granska och godkänn stavfelspar för träning av ONESEEK Δ+
        </p>
      </div>

      {/* Statistik */}
      {stats && (
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{stats.total_pairs}</span>
            <span style={styles.statLabel}>Totalt</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: STATUS_COLORS.approved }}>
              {stats.approved}
            </span>
            <span style={styles.statLabel}>Godkända</span>
          </div>
          <div style={styles.statCard}>
            <span style={{ ...styles.statNumber, color: STATUS_COLORS.pending }}>
              {stats.pending}
            </span>
            <span style={styles.statLabel}>Väntar</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{stats.unique_typos}</span>
            <span style={styles.statLabel}>Unika stavfel</span>
          </div>
        </div>
      )}

      {/* Kontroller */}
      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Visa:</label>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={styles.select}
          >
            <option value="pending">Ogranskade</option>
            <option value="approved">Godkända</option>
            <option value="all">Alla</option>
          </select>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={approveAll}
            style={styles.approveAllButton}
            disabled={pairs.filter(p => !p.approved).length === 0}
          >
            ✅ Godkänn alla
          </button>
          <button 
            onClick={exportForTraining}
            style={styles.exportButton}
            disabled={exporting}
          >
            {exporting ? '⏳ Exporterar...' : '📤 Exportera för träning'}
          </button>
          <button 
            onClick={fetchPairs}
            style={styles.refreshButton}
          >
            🔄 Uppdatera
          </button>
        </div>
      </div>

      {/* Felmeddelande */}
      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* Laddning */}
      {loading && (
        <div style={styles.loading}>
          ⏳ Laddar stavfelspar...
        </div>
      )}

      {/* Lista med par */}
      {!loading && pairs.length === 0 && (
        <div style={styles.empty}>
          Inga stavfelspar att visa.
        </div>
      )}

      {!loading && pairs.length > 0 && (
        <div style={styles.pairsList}>
          {pairs.map((pair, index) => (
            <div 
              key={`${pair.original}-${pair.corrected}-${index}`}
              style={{
                ...styles.pairCard,
                borderLeftColor: pair.approved ? STATUS_COLORS.approved : STATUS_COLORS.pending
              }}
            >
              <div style={styles.pairContent}>
                <div style={styles.pairWords}>
                  <span style={styles.originalWord}>{pair.original}</span>
                  <span style={styles.arrow}>→</span>
                  <span style={styles.correctedWord}>{pair.corrected}</span>
                </div>
                
                {pair.context && (
                  <div style={styles.context}>
                    "{pair.context}"
                  </div>
                )}
                
                <div style={styles.metadata}>
                  <span style={styles.source}>{pair.source}</span>
                  <span style={styles.confidence}>
                    Säkerhet: {Math.round((pair.confidence || 0) * 100)}%
                  </span>
                  <span style={styles.timestamp}>
                    {new Date(pair.timestamp).toLocaleDateString('sv-SE')}
                  </span>
                </div>
              </div>

              <div style={styles.pairActions}>
                {!pair.approved && (
                  <>
                    <button 
                      onClick={() => approvePair(pair.original, pair.corrected)}
                      style={styles.approveButton}
                      title="Godkänn för träning"
                    >
                      ✅
                    </button>
                    <button 
                      onClick={() => rejectPair(pair.original, pair.corrected)}
                      style={styles.rejectButton}
                      title="Ta bort (felaktig)"
                    >
                      ❌
                    </button>
                  </>
                )}
                {pair.approved && (
                  <span style={styles.approvedBadge}>✅ Godkänd</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1000px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  header: {
    marginBottom: '24px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '600',
  },
  subtitle: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#f8f9fa',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statNumber: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #ddd',
    fontSize: '14px',
    cursor: 'pointer',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  approveAllButton: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  exportButton: {
    padding: '8px 16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  refreshButton: {
    padding: '8px 16px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    background: '#f8d7da',
    color: '#721c24',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '40px',
    color: '#999',
    fontSize: '14px',
  },
  pairsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pairCard: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    borderLeft: '4px solid',
    padding: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  pairContent: {
    flex: 1,
  },
  pairWords: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  originalWord: {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: '600',
    color: '#dc3545',
    background: '#fff5f5',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  arrow: {
    color: '#666',
    fontSize: '16px',
  },
  correctedWord: {
    fontFamily: 'monospace',
    fontSize: '16px',
    fontWeight: '600',
    color: '#28a745',
    background: '#f0fff0',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  context: {
    fontSize: '13px',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '8px',
    maxWidth: '500px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  metadata: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#999',
  },
  source: {
    background: '#f0f0f0',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  confidence: {
    fontWeight: '500',
  },
  timestamp: {
    color: '#aaa',
  },
  pairActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  approveButton: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #28a745',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  rejectButton: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid #dc3545',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.2s',
  },
  approvedBadge: {
    color: '#28a745',
    fontSize: '14px',
    fontWeight: '500',
  },
};

export default StavfelEditor;
