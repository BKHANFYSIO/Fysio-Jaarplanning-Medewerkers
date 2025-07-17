import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { WeekInfo, PlanningItem } from '../types';
import { getWeeksForDateRange, parseDate, getMonthNumber } from '../utils/dateUtils';

// Custom parser specifically for the Weekplanning CSV structure
const parseWeekPlanning = async (filePath: string): Promise<WeekInfo[]> => {
  const response = await fetch(filePath);
  const text = await response.text();
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const weeks: WeekInfo[] = [];
  let currentSemester: 1 | 2 = 1;

  lines.forEach(line => {
    if (line.includes('Semester 1')) {
      currentSemester = 1;
      return;
    }
    if (line.includes('Semester 2')) {
      currentSemester = 2;
      return;
    }

    const parts = line.split(';');
    if (parts.length >= 2 && parts[0].trim() !== 'Weergave voor in app.') {
      const label = parts[0].trim();
      const dateStr = parts[1].trim();

      if (label && dateStr) {
        const isVacation = label.toLowerCase().includes('vakantie') || label.toLowerCase().includes('afsluiting');
        
        let year = 2025;
        const month = getMonthNumber(dateStr.split('-')[1]);
        if (month >= 1 && month <= 7) {
          year = 2026;
        }

        weeks.push({
          weekCode: label.includes('.') ? label.split(' ')[0] : label,
          weekLabel: label,
          startDate: `${dateStr}-${year}`,
          semester: currentSemester,
          isVacation,
        });
      }
    }
  });
  return weeks;
};

export const useData = () => {
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch week data from local CSV (for now)
        const weekData = await parseWeekPlanning('/data/Weekplanning semesters.csv');
        
        // Fetch planning items from Firestore
        const sem1Snapshot = await getDocs(collection(db, 'planning-items-sem1'));
        const sem2Snapshot = await getDocs(collection(db, 'planning-items-sem2'));
        
        const sem1Items = sem1Snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as PlanningItem));
        const sem2Items = sem2Snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as unknown as PlanningItem));
        
        const allItems = [...sem1Items, ...sem2Items];
        console.log(`Fetched ${allItems.length} items from Firestore.`);
        
        // Enrich planning items with week and semester info
        const enrichedItems = allItems.flatMap(item => {
          const startDate = parseDate(item.startDate);
          const endDate = parseDate(item.endDate);
          if (!startDate || !endDate) return [];

          const relevantWeeks = getWeeksForDateRange(startDate, endDate, weekData);
          return relevantWeeks.map(week => ({
            ...item,
            semester: week.semester,
            weekCode: week.weekCode,
          }));
        });

        setWeeks(weekData);
        setPlanningItems(enrichedItems);
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

  return { weeks, planningItems, loading, error };
};