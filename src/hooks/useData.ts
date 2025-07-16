import { useState, useEffect } from 'react';
import { PlanningItem, WeekInfo } from '../types';
import { parsePlanningData, parseWeekData } from '../utils/csvParser';

const API_BASE_URL = 'http://localhost:3000'; // Backend API URL

export function useData() {
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Load planning data for Semester 1
        const planningSem1Response = await fetch(`${API_BASE_URL}/api/data/planning_sem1`);
        let planningSem1Text = '';
        if (planningSem1Response.ok) {
          planningSem1Text = await planningSem1Response.text();
          console.log('Planning Sem1 CSV loaded, length:', planningSem1Text.length);
        } else if (planningSem1Response.status === 404) {
          console.warn('Planning Sem1 bestand nog niet actief of niet gevonden.');
        } else {
          throw new Error(`Kon planning data Semester 1 niet laden: ${planningSem1Response.statusText}`);
        }

        // Load planning data for Semester 2
        const planningSem2Response = await fetch(`${API_BASE_URL}/api/data/planning_sem2`);
        let planningSem2Text = '';
        if (planningSem2Response.ok) {
          planningSem2Text = await planningSem2Response.text();
          console.log('Planning Sem2 CSV loaded, length:', planningSem2Text.length);
        } else if (planningSem2Response.status === 404) {
          console.warn('Planning Sem2 bestand nog niet actief of niet gevonden.');
        } else {
          throw new Error(`Kon planning data Semester 2 niet laden: ${planningSem2Response.statusText}`);
        }

        // Parse and combine planning data
        const planningSem1 = planningSem1Text ? parsePlanningData(planningSem1Text) : [];
        const planningSem2 = planningSem2Text ? parsePlanningData(planningSem2Text) : [];
        const combinedPlanning = [...planningSem1, ...planningSem2];
        console.log('Parsed combined planning items:', combinedPlanning.length);
        
        // Load week data
        const weekResponse = await fetch(`${API_BASE_URL}/api/data/week_planning`);
        if (!weekResponse.ok) {
          throw new Error(`Kon week data niet laden: ${weekResponse.statusText}`);
        }
        const weekText = await weekResponse.text();
        console.log('Week CSV loaded, length:', weekText.length);
        const weekData = parseWeekData(weekText);
        console.log('Parsed weeks:', weekData.length);
        
        setPlanningItems(combinedPlanning);
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