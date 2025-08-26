import { useState, useCallback, useEffect } from 'react';
import { filterConfig } from '../config/filters';

// Haal de initiële state op uit localStorage of gebruik een leeg object
const getInitialState = () => {
  try {
    const savedFilters = localStorage.getItem('userFilters');
    if (savedFilters) {
      const parsedFilters = JSON.parse(savedFilters);
      // We willen alleen de 'phase' filter behouden, de rest resetten.
      return {
        phase: parsedFilters.phase || [],
      };
    }
  } catch (error) {
    console.error("Failed to parse filters from localStorage", error);
  }
  return {};
};


export const useFilters = () => {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(getInitialState());

  // Effect om de 'phase' filter op te slaan wanneer deze wijzigt
  useEffect(() => {
    try {
      const filtersToSave = {
        phase: activeFilters.phase || [],
      };
      localStorage.setItem('userFilters', JSON.stringify(filtersToSave));
    } catch (error) {
      console.error("Failed to save filters to localStorage", error);
    }
  }, [activeFilters.phase]);


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
    // Reset alles behalve de 'phase' filter
    setActiveFilters(prevFilters => ({
      phase: prevFilters.phase || []
    }));
  }, []);

  return { activeFilters, toggleFilter, resetFilters };
};