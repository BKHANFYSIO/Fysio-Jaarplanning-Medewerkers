import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { WeekInfo, PlanningItem } from '../types';
import { getWeeksForDateRange, parseDate } from '../utils/dateUtils';


export const useData = () => {
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [orphanedItems, setOrphanedItems] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch BOTH weeks and planning items from Firestore
        const weekSnapshot = await getDocs(collection(db, 'week-planning'));
        const sem1Snapshot = await getDocs(collection(db, 'planning-items-sem1'));
        const sem2Snapshot = await getDocs(collection(db, 'planning-items-sem2'));
        
        const weekData = weekSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as unknown as WeekInfo[];
        
        // Sort weeks by start date, same as in useWeekData
        weekData.sort((a, b) => {
          const parseDateString = (dateStr: string) => {
              const parts = dateStr.split('-');
              if (parts.length < 3) return new Date(0); // Invalid date
              const day = parseInt(parts[0]);
              const month = getMonthNumberFromString(parts[1]);
              const year = parseInt(parts[2]);
              return new Date(year, month - 1, day);
          };
          const dateA = parseDateString(a.startDate);
          const dateB = parseDateString(b.startDate);
          return dateA.getTime() - dateB.getTime();
        });

        const sem1Items = sem1Snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as PlanningItem));
        const sem2Items = sem2Snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as PlanningItem));
        
        const allItems = [...sem1Items, ...sem2Items];
        console.log(`Fetched ${allItems.length} items from Firestore.`);
        
        const enrichedItems: PlanningItem[] = [];
        const orphans: PlanningItem[] = [];

        allItems.forEach(item => {
          const startDate = parseDate(item.startDate);
          const endDate = parseDate(item.endDate);
          if (!startDate || !endDate) {
            orphans.push(item);
            return;
          }

          const relevantWeeks = getWeeksForDateRange(startDate, endDate, weekData);
          if (relevantWeeks.length === 0) {
            orphans.push(item);
          } else {
            relevantWeeks.forEach(week => {
              enrichedItems.push({
                ...item,
                semester: week.semester,
                weekCode: week.weekCode,
              });
            });
          }
        });

        setWeeks(weekData);
        setPlanningItems(enrichedItems);
        setOrphanedItems(orphans);
        setError(null);
      } catch (err: any) {
        setError('Fout bij het laden van de data: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { weeks, planningItems, orphanedItems, loading, error };
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