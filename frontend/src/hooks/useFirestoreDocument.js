import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Custom hook to listen to a Firestore document in real-time
 * @param {string} collectionName - The Firestore collection name
 * @param {string} documentId - The document ID to listen to
 * @returns {Object} - { data, loading, error }
 */
export function useFirestoreDocument(collectionName, documentId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!documentId || !db) {
      setLoading(false);
      return;
    }

    console.log(`[useFirestoreDocument] Listening to ${collectionName}/${documentId}`);

    const docRef = doc(db, collectionName, documentId);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const docData = {
            id: docSnapshot.id,
            ...docSnapshot.data()
          };
          console.log(`[useFirestoreDocument] Document updated:`, docData.status);
          setData(docData);
          setError(null);
        } else {
          console.warn(`[useFirestoreDocument] Document does not exist: ${documentId}`);
          setData(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error(`[useFirestoreDocument] Error listening to document:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log(`[useFirestoreDocument] Unsubscribing from ${documentId}`);
      unsubscribe();
    };
  }, [collectionName, documentId]);

  return { data, loading, error };
}
