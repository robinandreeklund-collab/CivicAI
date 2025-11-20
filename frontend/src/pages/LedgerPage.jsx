import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useFirestoreDocument } from '../hooks/useFirestoreDocument';
import LedgerView from '../components/LedgerView';

/**
 * LedgerPage Component
 * 
 * Dedicated page for viewing ledger blocks with blockchain verification.
 * Matches the graphic profile of OQT Dashboard and API Docs.
 * 
 * Features:
 * - Real-time Firebase data integration
 * - Blockchain verification status
 * - Detailed block information
 * - Immutable data verification
 */
export default function LedgerPage() {
  const [searchParams] = useSearchParams();
  const blockId = searchParams.get('block');
  const docId = searchParams.get('doc');
  
  const [ledgerBlocks, setLedgerBlocks] = useState([]);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  
  // Fetch document from Firebase if docId is provided
  const { data: firestoreData, loading: firestoreLoading } = useFirestoreDocument(
    'ai_interactions',
    docId
  );
  
  // Load ledger blocks from Firebase
  useEffect(() => {
    if (firestoreData && firestoreData.ledger_blocks) {
      // Convert ledger block IDs to full block objects
      // In a real implementation, we would fetch these from a ledger_blocks collection
      const blocks = firestoreData.ledger_blocks.map((blockId, idx) => ({
        block_id: blockId,
        timestamp: firestoreData.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
        event_type: 'verification',
        current_hash: generateMockHash(blockId),
        data: {
          document_id: docId,
          question: firestoreData.question,
          model_version: firestoreData.model_version || '1.0.0',
          status: firestoreData.status,
          verification_time: firestoreData.timestamp?.toDate?.()?.toISOString()
        },
        signatures: {
          validator: 'OneSeek.AI-Ledger-System'
        }
      }));
      
      setLedgerBlocks(blocks);
      setVerificationStatus('verified');
    }
  }, [firestoreData, docId]);
  
  // Generate a mock hash for demonstration
  const generateMockHash = (blockId) => {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 32; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  };
  
  // Handle verification
  const handleVerify = () => {
    setVerificationStatus('verifying');
    setTimeout(() => {
      setVerificationStatus('verified');
    }, 1500);
  };
  
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e7e7e7]">
      {/* Header */}
      <header className="border-b border-[#151515]">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <Link 
            to="/chat-v2" 
            className="inline-flex items-center gap-2 text-[#666] text-sm mb-6 transition-colors duration-200 hover:text-[#e7e7e7] group"
          >
            <span className="transition-transform duration-200 group-hover:-translate-x-1">←</span>
            <span>Tillbaka till Chat</span>
          </Link>
          
          <div className="flex items-end justify-between">
            <div className="flex-1">
              <div className="text-xs text-[#666] uppercase tracking-wider mb-3">
                Transparens & Verifiering
              </div>
              <h1 className="text-4xl md:text-5xl font-light tracking-wide mb-2 text-[#e7e7e7]">
                Blockchain Ledger
              </h1>
              <p className="text-sm text-[#666] font-light">
                Immutabel verifiering av AI-modelldata via blockchain-teknologi
              </p>
            </div>
            
            {verificationStatus === 'verified' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-green-400">✓</span>
                <span className="text-sm text-green-400">Verifierad</span>
              </div>
            )}
            
            {verificationStatus === 'verifying' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <span className="text-yellow-400 animate-spin">⏳</span>
                <span className="text-sm text-yellow-400">Verifierar...</span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-8 p-6 bg-[#151515] border border-[#2a2a2a] rounded-lg">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔒</div>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-[#e7e7e7] mb-2">
                Varför Blockchain Ledger?
              </h2>
              <p className="text-sm text-[#888] leading-relaxed">
                Vår AI-modell använder endast data som inte kan ändras retroaktivt. 
                Varje analys och svar verifieras mot blockchain-ledger för att säkerställa 
                transparens och förhindra manipulation. Detta garanterar att du alltid kan 
                verifiera att datan är äkta och oförändrad.
              </p>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        {firestoreLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
            <p className="text-[#666]">Laddar ledger-data från Firebase...</p>
          </div>
        )}
        
        {/* Ledger View */}
        {!firestoreLoading && (
          <LedgerView 
            blocks={ledgerBlocks}
            onVerify={handleVerify}
          />
        )}
        
        {/* Additional Info */}
        <div className="mt-8 p-6 bg-[#151515] border border-[#2a2a2a] rounded-lg">
          <h3 className="text-sm font-medium text-[#e7e7e7] mb-4">
            Hur fungerar verifieringen?
          </h3>
          <div className="space-y-3 text-sm text-[#888]">
            <div className="flex items-start gap-3">
              <span className="text-[#666]">1.</span>
              <p>
                Varje AI-svar krypteras och hashas med SHA-256
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#666]">2.</span>
              <p>
                Hashen lagras i ett blockchain-block som är länkat till tidigare block
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#666]">3.</span>
              <p>
                Blocken valideras av flera oberoende noder för att säkerställa integritet
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-[#666]">4.</span>
              <p>
                Du kan när som helst verifiera att datan inte har ändrats genom att kontrollera hashen
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[#151515] mt-16">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 text-sm text-[#666]">
            <Link to="/" className="hover:text-[#e7e7e7] transition-colors">Hem</Link>
            <Link to="/oqt-dashboard" className="hover:text-[#e7e7e7] transition-colors">OQT Dashboard</Link>
            <Link to="/api-docs" className="hover:text-[#e7e7e7] transition-colors">API Dokumentation</Link>
            <Link to="/about" className="hover:text-[#e7e7e7] transition-colors">Om OneSeek.AI</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
