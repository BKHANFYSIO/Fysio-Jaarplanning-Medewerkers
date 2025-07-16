import { useState, useEffect } from 'react';
import { PlanningItem, WeekInfo } from '../types';
import { Timestamp } from 'firebase/firestore'; // Importeer Timestamp

// De basis URL voor je lokale backend server
const API_BASE_URL = 'http://localhost:3000';

// Helper functie om een Firestore Timestamp om te zetten naar een DD-MMM-YYYY string
export const formatTimestampToDateString = (timestamp: Timestamp | null): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

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
        
        // Load planning data from Firestore via local backend server
        const planningResponse = await fetch(`${API_BASE_URL}/api/data/planningItems`);
        if (!planningResponse.ok) {
          throw new Error(`Kon planning data niet laden: ${planningResponse.statusText}`);
        }
        const planningData: PlanningItem[] = await planningResponse.json();
        setPlanningItems(planningData);
        console.log('Loaded planning items from Firestore:', planningData.length);
        
        // Load week data from Firestore via local backend server
        const weekResponse = await fetch(`${API_BASE_URL}/api/data/weeks`);
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