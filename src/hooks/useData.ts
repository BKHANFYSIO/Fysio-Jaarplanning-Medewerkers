import { useState, useEffect } from 'react';
import { PlanningItem, WeekInfo } from '../types';
// import { parsePlanningData, parseWeekData } from '../utils/csvParser'; // Niet meer nodig

// const API_BASE_URL = 'http://localhost:3000'; // Niet meer nodig, Vercel routes automatisch

export function useData() {
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        // Load planning data from Firestore via Vercel API
        const planningResponse = await fetch('/api/data/planningItems');
        if (!planningResponse.ok) {
          throw new Error(`Kon planning data niet laden: ${planningResponse.statusText}`);
        }
        const planningData: PlanningItem[] = await planningResponse.json();
        setPlanningItems(planningData);
        console.log('Loaded planning items from Firestore:', planningData.length);
        
        // Load week data from Firestore via Vercel API
        const weekResponse = await fetch('/api/data/weeks');
        if (!weekResponse.ok) {
          throw new Error(`Kon week data niet laden: ${weekResponse.statusText}`);
        }
        const weekData: WeekInfo[] = await weekResponse.json();
        setWeeks(weekData);
        console.log('Loaded week items from Firestore:', weekData.length);
        
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