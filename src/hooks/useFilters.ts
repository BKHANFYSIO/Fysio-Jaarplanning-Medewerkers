import { useState, useCallback, useEffect } from 'react';
import { useDynamicFilters } from './useDynamicFilters';

// Haal de initiële state op uit localStorage of gebruik een leeg object
const getInitialState = () => {
  try {
    const savedFilters = localStorage.getItem('userFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Behoud phase en role filters
      return {
        phase: parsedFilters.phase || [],
        role: parsedFilters.role || [],
      };
    }
  } catch (error) {
    console.error("Failed to parse filters from localStorage", error);
  }
  return {};
};

export const useFilters = () => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(getInitialState());
  const { filterConfig } = useDynamicFilters();

  // Effect om de filters op te slaan wanneer deze wijzigen
  useEffect(() => {
    try {
      const filtersToSave = {
        phase: activeFilters.phase || [],
        role: activeFilters.role || [],
      };
      localStorage.setItem('userFilters', JSON.stringify(filtersToSave));
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, [activeFilters.phase, activeFilters.role]);

  const toggleFilter = useCallback((configId: string, optionValue: string) => {
    setActiveFilters(prevFilters => {
      const currentSelection = prevFilters[configId] || [];
      const newSelection = currentSelection.includes(optionValue)
        ? currentSelection.filter(item => item !== optionValue)
        : [...currentSelection, optionValue];
      
      return {
        ...prevFilters,
        [configId]: newSelection
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    // Reset alles behalve de 'phase' en 'role' filters
    setActiveFilters(prevFilters => ({
      phase: prevFilters.phase || [],
      role: prevFilters.role || []
    }));
  }, []);

  return { activeFilters, toggleFilter, resetFilters, filterConfig };
};