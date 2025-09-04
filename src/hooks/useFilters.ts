import { useState, useCallback, useEffect } from 'react';
import { useDynamicFilters } from './useDynamicFilters';

// Haal de initiële state op uit localStorage of gebruik een leeg object
const getInitialState = () => {
  try {
    const savedFilters = localStorage.getItem('userFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // Behoud alle filters
      return parsedFilters || {};
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
      localStorage.setItem('userFilters', JSON.stringify(activeFilters));
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, [activeFilters]);

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
    // Reset alle filters
    setActiveFilters({});
  }, []);

  return { activeFilters, toggleFilter, resetFilters, filterConfig };
};