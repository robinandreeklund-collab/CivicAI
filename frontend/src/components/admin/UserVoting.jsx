import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * User Voting on Control Questions
 * 
 * PoW-protected voting interface to prevent bot attacks
 */
export default function UserVoting() {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [vote, setVote] = useState(null);
  const [powNonce, setPowNonce] = useState(null);
  const [solving, setSolving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    fetchControlQuestions();
  }, []);
  
  const fetchControlQuestions = async () => {
    try {
      const response = await fetch('/api/autonomy/control-questions');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching control questions:', error);
    }
  };
  
  const solveProofOfWork = async (difficulty = 4) => {
    setSolving(true);
    
    try {
      // Simple PoW: find nonce where hash starts with N zeros
      const target = '0'.repeat(difficulty);
      const challenge = `${selectedQuestion.id}-${user?.uid}-${Date.now()}`;
      
      let nonce = 0;
      let hash = '';
      
      const startTime = Date.now();
      
      while (!hash.startsWith(target)) {
        nonce++;
        const data = challenge + nonce;
        hash = await sha256(data);
        
        // Prevent UI freeze
        if (nonce % 10000 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const endTime = Date.now();
      console.log(`PoW solved in ${endTime - startTime}ms with nonce ${nonce}`);
      
      setPowNonce({ nonce, hash, challenge });
      return { nonce, hash, challenge };
    } finally {
      setSolving(false);
    }
  };
  
  const sha256 = async (message) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };
  
  const submitVote = async () => {
    if (!powNonce) {
      await solveProofOfWork();
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/autonomy/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQuestion.id,
          vote,
          pow: powNonce,
        }),
      });
      
      if (response.ok) {
        alert('Vote submitted successfully!');
        setPowNonce(null);
        setVote(null);
        setSelectedQuestion(null);
        await fetchControlQuestions();
      } else {
        const error = await response.json();
        alert(`Vote failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      alert('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-[#eee] text-lg font-mono font-semibold mb-2">
          Community Voting
        </h3>
        <p className="text-[#666] text-sm font-mono">
          Vote on control questions (PoW-protected against bots)
        </p>
      </div>
      
      {/* Questions List */}
      {!selectedQuestion ? (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
          <span className="text-[#eee] text-sm font-mono block mb-3">
            Active Questions
          </span>
          
          {questions.length === 0 ? (
            <p className="text-[#666] text-sm font-mono">No active questions</p>
          ) : (
            <div className="space-y-3">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#0a0a0a] border border-[#2a2a2a] p-3 rounded"
                >
                  <div className="mb-2">
                    <span className="text-[#eee] text-sm font-mono block mb-1">
                      {q.question}
                    </span>
                    <span className="text-[#666] text-xs font-mono">
                      {q.votes || 0} votes
                    </span>
                  </div>
                  
                  <button
                    onClick={() => setSelectedQuestion(q)}
                    className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2a2a2a] text-[#eee] text-sm font-mono hover:bg-[#1a1a1a] transition-colors"
                  >
                    Vote
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#eee] text-sm font-mono">Your Vote</span>
            <button
              onClick={() => {
                setSelectedQuestion(null);
                setVote(null);
                setPowNonce(null);
              }}
              className="text-[#888] text-xs font-mono hover:text-[#eee]"
            >
              Back
            </button>
          </div>
          
          <div className="mb-4">
            <span className="text-[#eee] text-sm font-mono block mb-2">
              {selectedQuestion.question}
            </span>
            <p className="text-[#666] text-xs font-mono">
              {selectedQuestion.description}
            </p>
          </div>
          
          <div className="space-y-3 mb-4">
            {selectedQuestion.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => setVote(option.id)}
                className={`w-full px-4 py-3 text-left border rounded transition-colors ${
                  vote === option.id
                    ? 'bg-blue-900/20 border-blue-700 text-blue-400'
                    : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#eee] hover:bg-[#1a1a1a]'
                }`}
              >
                <span className="text-sm font-mono block mb-1">{option.label}</span>
                <span className="text-xs font-mono text-[#666]">
                  {option.votes || 0} votes
                </span>
              </button>
            ))}
          </div>
          
          {/* PoW Status */}
          {solving && (
            <div className="mb-4 bg-yellow-900/20 border border-yellow-700 p-3 rounded">
              <p className="text-yellow-500 text-sm font-mono">
                🔒 Solving Proof-of-Work puzzle to prevent bot voting...
              </p>
            </div>
          )}
          
          {powNonce && !solving && (
            <div className="mb-4 bg-green-900/20 border border-green-700 p-3 rounded">
              <p className="text-green-500 text-sm font-mono">
                ✓ PoW verified (nonce: {powNonce.nonce})
              </p>
            </div>
          )}
          
          {/* Submit Button */}
          <button
            onClick={powNonce ? submitVote : solveProofOfWork}
            disabled={!vote || solving || submitting}
            className="w-full px-4 py-2 bg-blue-900/20 border border-blue-700 text-blue-400 text-sm font-mono hover:bg-blue-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {solving ? 'Solving PoW...' :
             submitting ? 'Submitting...' :
             powNonce ? 'Submit Vote' : 'Solve PoW & Vote'}
          </button>
          
          <p className="text-[#666] text-xs font-mono mt-3">
            Proof-of-Work protection ensures only real humans can vote
          </p>
        </div>
      )}
      
      {/* Info */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded">
        <span className="text-[#eee] text-sm font-mono block mb-2">
          How it works
        </span>
        <ul className="text-[#666] text-xs font-mono space-y-1">
          <li>• Select your preferred option</li>
          <li>• Solve a computational puzzle (PoW)</li>
          <li>• Submit your vote securely</li>
          <li>• Bot attacks prevented by PoW difficulty</li>
        </ul>
      </div>
    </div>
  );
}
