import { useState, useCallback } from 'react';
import { filterConfig } from '../config/filters';

// The state will be an object where keys are filter IDs (e.g., 'phase')
// and values are arrays of selected option values (e.g., ['p', 'h1']).
type ActiveFiltersState = Record<string, string[]>;

const initialState: ActiveFiltersState = filterConfig.reduce((acc, filter) => {
  acc[filter.id] = [];
  return acc;
}, {} as ActiveFiltersState);

export const useFilters = () => {
  const [activeFilters, setActiveFilters] = useState<ActiveFiltersState>(initialState);

  const toggleFilter = useCallback((filterId: string, value: string) => {
    setActiveFilters(prevState => {
      const currentFilterValues = prevState[filterId] || [];
      const newFilterValues = currentFilterValues.includes(value)
        ? currentFilterValues.filter(v => v !== value)
        : [...currentFilterValues, value];
      
      return {
        ...prevState,
        [filterId]: newFilterValues,
      };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setActiveFilters(initialState);
  }, []);

  return { activeFilters, toggleFilter, resetFilters };
};