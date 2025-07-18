import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { WeekInfo, PlanningItem } from '../types';
import { getWeeksForDateRange, parseDate } from '../utils/dateUtils';

const processSeries = (items: PlanningItem[], weeks: WeekInfo[]): PlanningItem[] => {
  // 1. Create a map for quick week lookup by weekCode, containing index and vacation status
  const weekMap = new Map<string, { index: number; isVacation: boolean }>();
  weeks.forEach((week, index) => {
    weekMap.set(week.weekCode, { index, isVacation: week.isVacation });
  });

  // 2. Sort all items primarily by their week's index to ensure chronological order
  const sortedItems = [...items].sort((a, b) => {
    const weekA = weekMap.get(a.weekCode ?? '');
    const weekB = weekMap.get(b.weekCode ?? '');
    if (weekA && weekB && weekA.index !== weekB.index) {
      return weekA.index - weekB.index;
    }
    // Fallback sort for items in the same week
    return (a.title > b.title) ? 1 : -1;
  });

  // 3. Group items by title
  const groupedByTitle = sortedItems.reduce((acc, item) => {
    if (!acc[item.title]) {
      acc[item.title] = [];
    }
    acc[item.title].push(item);
    return acc;
  }, {} as { [key:string]: PlanningItem[] });
  
  const finalResult: PlanningItem[] = [];

  // 4. Process each group to find CONSECUTIVE sub-series
  for (const title in groupedByTitle) {
    const series = groupedByTitle[title];
    if (series.length === 0) continue;

    let currentSubSeries: PlanningItem[] = [series[0]];

    for (let i = 0; i < series.length - 1; i++) {
      const currentItem = series[i];
      const nextItem = series[i + 1];
      
      const currentWeek = weekMap.get(currentItem.weekCode ?? '');
      const nextWeek = weekMap.get(nextItem.weekCode ?? '');

      let isConsecutive = false;
      if (currentWeek && nextWeek) {
        // Find all weeks between the two items
        const weeksBetween = weeks.slice(currentWeek.index + 1, nextWeek.index);
        // If all weeks in between are vacation weeks, they are consecutive
        if (weeksBetween.every(w => w.isVacation)) {
          isConsecutive = true;
        }
      }

      if (isConsecutive) {
        // If consecutive, add the next item to the current sub-series
        currentSubSeries.push(nextItem);
      } else {
        // If not consecutive, the sub-series is broken. Process it.
        const subSeriesLength = currentSubSeries.length;
        currentSubSeries.forEach((item, index) => {
          finalResult.push({
            ...item,
            seriesLength: subSeriesLength,
            isFirstInSeries: index === 0,
            isLastInSeries: index === subSeriesLength - 1,
          });
        });
        // Start a new sub-series with the next item
        currentSubSeries = [nextItem];
      }
    }

    // Process the last sub-series after the loop finishes
    const subSeriesLength = currentSubSeries.length;
    currentSubSeries.forEach((item, index) => {
      finalResult.push({
        ...item,
        seriesLength: subSeriesLength,
        isFirstInSeries: index === 0,
        isLastInSeries: index === subSeriesLength - 1,
      });
    });
  }

  // Restore original sorting order for display
  return finalResult.sort((a, b) => {
      const weekA = weekMap.get(a.weekCode ?? '');
      const weekB = weekMap.get(b.weekCode ?? '');
      if (weekA && weekB && weekA.index !== weekB.index) {
          return weekA.index - weekB.index;
      }
      return (a.title > b.title) ? 1 : -1;
  });
};

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
        
        // Fetch BOTH weeks and activities from Firestore
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
        
        // Process for series detection
        const processedItems = processSeries(enrichedItems, weekData);
        
        setPlanningItems(processedItems);
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