import { useState } from 'react';

/**
 * DevResetTab Component
 * 
 * Development Reset functionality for the Admin Dashboard.
 * Allows admins to:
 * - Purge Firebase collections (oqt_* and delta_*)
 * - Purge prepared datasets
 * - Purge training temp files
 * - Reset memory context
 * 
 * WARNING: Only for development environments!
 */
export default function DevResetTab() {
  // Reset options state
  const [options, setOptions] = useState({
    purgeFirebase: true,
    purgePreparedDatasets: true,
    purgeTrainingTemp: true,
    resetMemoryContext: true,
  });
  
  // Confirmation state
  const [confirmText, setConfirmText] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  
  // Loading/results state
  const [loading, setLoading] = useState(false);
  const [memoryResetLoading, setMemoryResetLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [memoryResults, setMemoryResults] = useState(null);
  const [error, setError] = useState(null);

  const CONFIRM_TEXT = 'RESET DEV DATA';

  // Handle checkbox changes
  const handleOptionChange = (option) => {
    setOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Handle confirmation text change
  const handleConfirmTextChange = (e) => {
    const value = e.target.value;
    setConfirmText(value);
    setIsConfirmed(value === CONFIRM_TEXT);
  };

  // Perform dev reset
  const handleDevReset = async () => {
    if (!isConfirmed) {
      setError('Du måste skriva "RESET DEV DATA" för att bekräfta.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/admin/dev-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purgeFirebase: options.purgeFirebase,
          purgePreparedDatasets: options.purgePreparedDatasets,
          purgeTrainingTemp: options.purgeTrainingTemp,
          resetMemoryContext: options.resetMemoryContext,
          keepModels: true, // Always keep models
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data);
        setConfirmText('');
        setIsConfirmed(false);
      } else {
        setError(data.error || 'Dev reset misslyckades');
        if (data.code === 'DEV_RESET_DISABLED') {
          setError('Dev reset är inte tillåtet i denna miljö. Sätt NODE_ENV=development eller ALLOW_DEV_RESET=true.');
        }
      }
    } catch (err) {
      console.error('Dev reset error:', err);
      setError(`Fel vid reset: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Reset memory context only
  const handleMemoryReset = async () => {
    setMemoryResetLoading(true);
    setMemoryResults(null);

    try {
      const response = await fetch('/api/memory/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        setMemoryResults(data);
      } else {
        setError(data.error || 'Memory reset misslyckades');
      }
    } catch (err) {
      console.error('Memory reset error:', err);
      setError(`Fel vid memory reset: ${err.message}`);
    } finally {
      setMemoryResetLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="border-2 border-red-500/50 bg-red-900/10 p-4 rounded-lg">
        <h3 className="text-red-400 font-mono text-sm font-bold mb-2">
          ⚠️ Varning: Destruktiv Operation
        </h3>
        <p className="text-red-300/80 font-mono text-xs leading-relaxed">
          Dev Reset tar permanent bort data från Firebase-kollektioner och lokala filer. 
          Denna funktion är endast avsedd för utvecklings- och testmiljöer. 
          I produktionsmiljöer är denna endpoint blockerad om inte ALLOW_DEV_RESET=true är satt.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 p-4 rounded font-mono text-sm">
          ❌ {error}
        </div>
      )}

      {/* Options Form */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded-lg">
        <h4 className="text-[#eee] font-mono text-sm font-bold mb-4">Reset-alternativ</h4>
        
        <div className="space-y-4">
          {/* Firebase Purge */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.purgeFirebase}
              onChange={() => handleOptionChange('purgeFirebase')}
              className="mt-1 w-4 h-4 accent-red-500"
            />
            <div>
              <span className="text-[#eee] font-mono text-sm group-hover:text-white">
                🔥 Rensa Firebase (oqt_* och delta_*)
              </span>
              <p className="text-[#666] font-mono text-xs mt-0.5">
                Tar bort alla dokument från kollektioner: oqt_queries, oqt_metrics, oqt_training_events, 
                oqt_ledger, delta_topics, delta_messages, etc.
              </p>
            </div>
          </label>

          {/* Prepared Datasets */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.purgePreparedDatasets}
              onChange={() => handleOptionChange('purgePreparedDatasets')}
              className="mt-1 w-4 h-4 accent-orange-500"
            />
            <div>
              <span className="text-[#eee] font-mono text-sm group-hover:text-white">
                📁 Rensa förberedda datasets
              </span>
              <p className="text-[#666] font-mono text-xs mt-0.5">
                Tar bort innehållet i ml/data/prepared/
              </p>
            </div>
          </label>

          {/* Training Temp */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.purgeTrainingTemp}
              onChange={() => handleOptionChange('purgeTrainingTemp')}
              className="mt-1 w-4 h-4 accent-yellow-500"
            />
            <div>
              <span className="text-[#eee] font-mono text-sm group-hover:text-white">
                🧹 Rensa tränings-temp
              </span>
              <p className="text-[#666] font-mono text-xs mt-0.5">
                Tar bort training.log, temp-mappar och checkpoints
              </p>
            </div>
          </label>

          {/* Memory Reset */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={options.resetMemoryContext}
              onChange={() => handleOptionChange('resetMemoryContext')}
              className="mt-1 w-4 h-4 accent-blue-500"
            />
            <div>
              <span className="text-[#eee] font-mono text-sm group-hover:text-white">
                🧠 Återställ minneskontext
              </span>
              <p className="text-[#666] font-mono text-xs mt-0.5">
                Rensar in-memory caches, konversationshistorik och inference-cache
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Confirmation Input */}
      <div className="border border-[#2a2a2a] bg-[#111] p-6 rounded-lg">
        <h4 className="text-[#eee] font-mono text-sm font-bold mb-3">Bekräfta Reset</h4>
        <p className="text-[#888] font-mono text-xs mb-4">
          Skriv <code className="text-red-400 bg-red-500/10 px-1 py-0.5 rounded">{CONFIRM_TEXT}</code> för att aktivera reset-knappen:
        </p>
        
        <input
          type="text"
          value={confirmText}
          onChange={handleConfirmTextChange}
          placeholder={CONFIRM_TEXT}
          className={`w-full bg-[#0a0a0a] border ${
            isConfirmed ? 'border-green-500/50' : 'border-[#2a2a2a]'
          } text-[#eee] font-mono text-sm p-3 rounded focus:outline-none focus:border-red-500/50`}
        />
        
        {isConfirmed && (
          <p className="text-green-400 font-mono text-xs mt-2">
            ✓ Bekräftelse accepterad. Reset-knappen är nu aktiv.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleDevReset}
          disabled={!isConfirmed || loading}
          className={`px-6 py-3 font-mono text-sm rounded transition-all ${
            isConfirmed && !loading
              ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
              : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
          }`}
        >
          {loading ? '⏳ Resettar...' : '🔄 Utför Dev Reset'}
        </button>

        <button
          onClick={handleMemoryReset}
          disabled={memoryResetLoading}
          className="px-6 py-3 bg-blue-600 text-white font-mono text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {memoryResetLoading ? '⏳ Rensar...' : '🧠 Endast Memory Reset'}
        </button>
      </div>

      {/* Results Display */}
      {results && (
        <div className="border border-green-500/30 bg-green-500/5 p-6 rounded-lg">
          <h4 className="text-green-400 font-mono text-sm font-bold mb-4">
            ✅ Dev Reset Resultat
          </h4>
          
          <div className="space-y-4 font-mono text-xs">
            {/* Firebase Results */}
            {results.firebase && (
              <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <h5 className="text-[#aaa] mb-2">🔥 Firebase:</h5>
                {results.firebase.error && results.firebase.error.includes('not configured') ? (
                  <p className="text-yellow-400">⚠️ Firebase inte konfigurerat - hoppades över</p>
                ) : (
                  <>
                    <p className="text-[#888]">
                      Kollektioner rensade: {results.firebase.collections?.length || 0}
                    </p>
                    <p className="text-[#888]">
                      Dokument raderade: {results.firebase.totalDocumentsDeleted || 0}
                    </p>
                    {results.firebase.collections?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {results.firebase.collections.map((col, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-red-500/10 text-red-300 rounded">
                            {col.name}: {col.documentsDeleted} docs
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Files Results */}
            {results.filesRemoved && (
              <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <h5 className="text-[#aaa] mb-2">📁 Filer:</h5>
                {results.filesRemoved.prepared && (
                  <p className="text-[#888]">
                    Förberedda datasets: {results.filesRemoved.prepared.filesRemoved || 0} filer, {results.filesRemoved.prepared.directoriesRemoved || 0} mappar
                  </p>
                )}
                {results.filesRemoved.temp && (
                  <p className="text-[#888]">
                    Temp-filer: {results.filesRemoved.temp.filesRemoved || 0} borttagna
                  </p>
                )}
              </div>
            )}

            {/* Memory Results */}
            {results.memoryReset && (
              <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded">
                <h5 className="text-[#aaa] mb-2">🧠 Minneskontext:</h5>
                <p className="text-[#888]">
                  Rensade komponenter: {results.memoryReset.clearedComponents?.join(', ') || 'Inga'}
                </p>
                {results.memoryReset.warnings?.length > 0 && (
                  <p className="text-yellow-400 mt-1">
                    ⚠️ Varningar: {results.memoryReset.warnings.join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Errors */}
            {results.errors?.length > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                <h5 className="text-red-400 mb-2">⚠️ Fel:</h5>
                {results.errors.map((err, idx) => (
                  <p key={idx} className="text-red-300">
                    {err.step}: {err.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Reset Results */}
      {memoryResults && (
        <div className="border border-blue-500/30 bg-blue-500/5 p-6 rounded-lg">
          <h4 className="text-blue-400 font-mono text-sm font-bold mb-4">
            ✅ Memory Reset Resultat
          </h4>
          
          <div className="font-mono text-xs">
            <p className="text-[#888] mb-2">
              Rensade komponenter:
            </p>
            <div className="flex flex-wrap gap-1">
              {memoryResults.clearedComponents?.map((comp, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 rounded">
                  {comp}
                </span>
              ))}
            </div>
            {memoryResults.warnings?.length > 0 && (
              <p className="text-yellow-400 mt-2">
                ⚠️ Varningar: {memoryResults.warnings.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="border border-[#2a2a2a] bg-[#0a0a0a] p-4 rounded">
        <h5 className="text-[#888] font-mono text-xs mb-2">ℹ️ Information:</h5>
        <ul className="text-[#666] font-mono text-xs space-y-1">
          <li>• Firebase-kollektioner som rensas: oqt_queries, oqt_metrics, oqt_training_events, oqt_ledger, oqt_provenance, delta_topics, delta_messages</li>
          <li>• Modeller i /models/oneseek-certified/ bevaras alltid</li>
          <li>• Basmodeller i /models/base_models/ bevaras alltid</li>
          <li>• Alla operationer loggas i backend/logs/dev-reset-audit.jsonl</li>
        </ul>
      </div>
    </div>
  );
}
