/**
 * useQuestionStatus Hook
 * Manages Firebase real-time status updates for questions
 * Part of Firebase Integration - Step 1
 */

import { useState, useEffect } from 'react';

/**
 * Hook to manage question status in Firebase with real-time updates
 * @param {string} docId - Firebase document ID (optional for creation)
 * @returns {Object} Question state and methods
 */
export function useQuestionStatus(docId = null) {
  const [status, setStatus] = useState('idle'); // idle, received, processing, completed, ledger_verified, error
  const [questionData, setQuestionData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /**
   * Create a new question in Firebase
   * @param {string} question - The question text
   * @param {Object} options - Optional parameters (userId, sessionId)
   * @returns {Promise<Object>} Created question data
   */
  const createQuestion = async (question, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/firebase/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userId: options.userId,
          sessionId: options.sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create question');
      }

      const data = await response.json();
      
      if (data.success) {
        setStatus(data.status);
        setQuestionData(data);
        return data;
      } else {
        throw new Error(data.error || 'Failed to create question');
      }
    } catch (err) {
      console.error('[useQuestionStatus] Error creating question:', err);
      setError(err.message);
      setStatus('error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch question data from Firebase
   * @param {string} id - Document ID
   */
  const fetchQuestion = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/firebase/questions/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch question');
      }

      const result = await response.json();
      
      if (result.success) {
        setQuestionData(result.data);
        setStatus(result.data.status);
      } else {
        throw new Error(result.error || 'Failed to fetch question');
      }
    } catch (err) {
      console.error('[useQuestionStatus] Error fetching question:', err);
      setError(err.message);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Poll for status updates
   * This is a fallback when Firebase Web SDK is not configured
   */
  useEffect(() => {
    if (!docId) return;

    // Initial fetch
    fetchQuestion(docId);

    // Poll every 2 seconds for status updates
    const pollInterval = setInterval(() => {
      fetchQuestion(docId);
    }, 2000);

    return () => {
      clearInterval(pollInterval);
    };
  }, [docId]);

  /**
   * Get status display message
   * @returns {string} User-friendly status message
   */
  const getStatusMessage = () => {
    switch (status) {
      case 'received':
        return 'Fråga mottagen';
      case 'processing':
        return 'Bearbetning pågår…';
      case 'completed':
        return 'Analys färdig';
      case 'ledger_verified':
        return 'Data verifierad';
      case 'error':
        return 'Ett fel uppstod';
      case 'idle':
      default:
        return 'Väntar…';
    }
  };

  /**
   * Get status color for UI
   * @returns {string} Tailwind color class
   */
  const getStatusColor = () => {
    switch (status) {
      case 'received':
        return 'text-blue-400';
      case 'processing':
        return 'text-yellow-400';
      case 'completed':
        return 'text-green-400';
      case 'ledger_verified':
        return 'text-emerald-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  return {
    status,
    questionData,
    error,
    loading,
    createQuestion,
    fetchQuestion,
    getStatusMessage,
    getStatusColor,
  };
}

export default useQuestionStatus;
