import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';
import { WeekInfo } from '../types';

export const useWeekData = () => {
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'week-planning'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedWeeks = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      } as unknown as WeekInfo));
      
      // Sort weeks by start date
      fetchedWeeks.sort((a, b) => {
        // Helper to parse dd-mmm-yyyy format
        const parseDateString = (dateStr: string) => {
            const parts = dateStr.split('-');
            const day = parseInt(parts[0]);
            const month = getMonthNumberFromString(parts[1]);
            const year = parseInt(parts[2]);
            return new Date(year, month - 1, day);
        };
        const dateA = parseDateString(a.startDate);
        const dateB = parseDateString(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });

      setWeeks(fetchedWeeks);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching week data: ", err);
      setError("Fout bij het laden van de weekplanning.");
      setLoading(false);
    });

    // Cleanup function to unsubscribe
    return () => unsubscribe();
  }, []);

  return { weeks, loading, error };
};

const monthMap: { [key: string]: number } = {
  'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
  'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12
};

const getMonthNumberFromString = (monthStr: string): number => {
    if (!monthStr) return 0;
    const lowerMonth = monthStr.toLowerCase().substring(0, 3);
    return monthMap[lowerMonth] || 0;
};
