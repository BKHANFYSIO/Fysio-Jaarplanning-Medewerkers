import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { PlanningItem } from '../types';

export const useAdminData = () => {
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collectionsToFetch = ['planning-items-sem1', 'planning-items-sem2'];
    const unsubscribes: (() => void)[] = [];
    
    setLoading(true);
    let allItems: PlanningItem[] = [];
    let collectionsLoaded = 0;

    collectionsToFetch.forEach(collectionName => {
      const q = query(collection(db, collectionName));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const semesterItems = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        } as unknown as PlanningItem));

        // This logic merges data from both collections
        allItems = [
          ...allItems.filter(item => item.collection !== collectionName), // Remove old items from this collection
          ...semesterItems.map(item => ({...item, collection: collectionName})) // Add new items
        ];

        setItems(allItems);

        // Only stop loading when all collections are initially loaded
        if (collectionsToFetch.length > collectionsLoaded) {
            collectionsLoaded++;
            if (collectionsLoaded === collectionsToFetch.length) {
                setLoading(false);
            }
        }
        
      }, (err) => {
        console.error(`Error fetching ${collectionName}: `, err);
        setError(`Fout bij het laden van ${collectionName}.`);
        setLoading(false);
      });
      unsubscribes.push(unsubscribe);
    });

    // Cleanup function to unsubscribe from listeners when the component unmounts
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  return { items, loading, error };
};
