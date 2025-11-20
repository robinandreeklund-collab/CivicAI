import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to fetch user's question history from Firestore in real-time
 * @param {string} userId - The user ID to fetch questions for
 * @param {number} maxQuestions - Maximum number of questions to fetch (default: 20)
 * @returns {Object} - { questions, totalCount, loading, error }
 */
export function useUserQuestions(userId, maxQuestions = 20) {
  const [questions, setQuestions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    console.log(`[useUserQuestions] Fetching questions for user: ${userId}`);

    // Query to get user's questions ordered by timestamp (most recent first)
    const q = query(
      collection(db, 'ai_interactions'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(maxQuestions)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedQuestions = [];
        querySnapshot.forEach((doc) => {
          fetchedQuestions.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`[useUserQuestions] Fetched ${fetchedQuestions.length} questions`);
        setQuestions(fetchedQuestions);
        setTotalCount(fetchedQuestions.length); // This is approximate, as we're limited to maxQuestions
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useUserQuestions] Error fetching questions:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log(`[useUserQuestions] Unsubscribing from user questions`);
      unsubscribe();
    };
  }, [userId, maxQuestions]);

  return { questions, totalCount, loading, error };
}

/**
 * Custom hook to get statistics about user's questions
 * @param {string} userId - The user ID
 * @returns {Object} - { stats, loading, error }
 */
export function useUserQuestionStats(userId) {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    questionsThisWeek: 0,
    questionsThisMonth: 0,
    averageResponseTime: 0,
    mostCommonStatus: 'completed',
    successRate: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    console.log(`[useUserQuestionStats] Fetching stats for user: ${userId}`);

    // Query all user's questions
    const q = query(
      collection(db, 'ai_interactions'),
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        let totalQuestions = 0;
        let questionsThisWeek = 0;
        let questionsThisMonth = 0;
        let totalResponseTime = 0;
        let completedQuestions = 0;
        const statusCounts = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          totalQuestions++;
          
          // Count by time period
          const timestamp = data.timestamp?.toDate?.() || new Date(data.timestamp);
          if (timestamp >= oneWeekAgo) {
            questionsThisWeek++;
          }
          if (timestamp >= oneMonthAgo) {
            questionsThisMonth++;
          }
          
          // Calculate response times
          if (data.processing_times?.total) {
            totalResponseTime += data.processing_times.total;
            completedQuestions++;
          }
          
          // Count statuses
          const status = data.status || 'unknown';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        // Calculate averages and most common status
        const averageResponseTime = completedQuestions > 0 
          ? Math.round(totalResponseTime / completedQuestions) 
          : 0;
          
        const mostCommonStatus = Object.entries(statusCounts).reduce(
          (max, [status, count]) => count > max.count ? { status, count } : max,
          { status: 'completed', count: 0 }
        ).status;
        
        const successRate = totalQuestions > 0
          ? Math.round(((statusCounts['completed'] || 0) + (statusCounts['ledger_verified'] || 0)) / totalQuestions * 100)
          : 100;
        
        const calculatedStats = {
          totalQuestions,
          questionsThisWeek,
          questionsThisMonth,
          averageResponseTime,
          mostCommonStatus,
          successRate
        };
        
        console.log(`[useUserQuestionStats] Stats:`, calculatedStats);
        setStats(calculatedStats);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error(`[useUserQuestionStats] Error fetching stats:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log(`[useUserQuestionStats] Unsubscribing from user stats`);
      unsubscribe();
    };
  }, [userId]);

  return { stats, loading, error };
}
