import { useState, useEffect } from 'react';
import { PlanningItem, WeekInfo } from '../types';
import { parsePlanningData, parseWeekData } from '../utils/csvParser';

export function useData() {
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load planning data
        const planningResponse = await fetch('/data/Sem1 gegevens voor inlezen.csv');
        if (!planningResponse.ok) {
          throw new Error('Kon planning data niet laden');
        }
        const planningText = await planningResponse.text();
        console.log('Planning CSV loaded, length:', planningText.length);
        const planning = parsePlanningData(planningText);
        console.log('Parsed planning items:', planning.length);
        
        // Load week data
        const weekResponse = await fetch('/data/Weekplanning semesters.csv');
        if (!weekResponse.ok) {
          throw new Error('Kon week data niet laden');
        }
        const weekText = await weekResponse.text();
        console.log('Week CSV loaded, length:', weekText.length);
        const weekData = parseWeekData(weekText);
        console.log('Parsed weeks:', weekData.length);
        
        setPlanningItems(planning);
        setWeeks(weekData);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Fout bij het laden van de data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { planningItems, weeks, loading, error };
}