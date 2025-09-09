import { useMemo } from 'react';
import { PlanningItem } from '../types';
import { extractNormalizedRoles } from '../utils/roleUtils';
import { FilterConfig } from '../config/types';

interface AvailableOptions {
  [filterId: string]: {
    [optionValue: string]: boolean;
  };
}

export const useAvailableFilterOptions = (
  planningItems: PlanningItem[],
  activeFilters: Record<string, string[]>,
  filterConfig: FilterConfig[]
): AvailableOptions => {
  return useMemo(() => {
    const available: AvailableOptions = {};

    // Initialiseer alle opties als beschikbaar
    filterConfig.forEach(config => {
      available[config.id] = {};
      config.options.forEach(option => {
        available[config.id][option.value] = true;
      });
    });

    // Voor elke filter configuratie, bepaal welke opties nog beschikbaar zijn
    filterConfig.forEach(config => {
      config.options.forEach(option => {
        // Simuleer wat er zou gebeuren als deze optie geselecteerd zou worden
        const testFilters = { ...activeFilters };
        const currentSelection = testFilters[config.id] || [];
        
        // Voeg deze optie toe aan de test filters
        if (!currentSelection.includes(option.value)) {
          testFilters[config.id] = [...currentSelection, option.value];
        }

        // Filter de items met deze test filters
        const testFilteredItems = planningItems.filter(item => {
          return filterConfig.every(cfg => {
            const selectedOptions = testFilters[cfg.id];
            if (!selectedOptions || selectedOptions.length === 0) {
              return true;
            }
            
            if (cfg.dataKey === 'semester') {
              return selectedOptions.includes(String(item.semester));
            } else if (cfg.dataKey === 'role') {
              const roles = extractNormalizedRoles(item.role);
              return selectedOptions.some(selectedRole => roles.includes(selectedRole));
            } else if (cfg.dataKey === 'phases') {
              const phases: any = (item as any).phases || {};
              const hasAnyPhase = !!(phases.p || phases.h1 || phases.h2h3);
              return selectedOptions.every(option => {
                if (option === 'algemeen') {
                  return !hasAnyPhase;
                }
                return !!phases[option];
              });
            } else {
              const subObject = (item as any)[cfg.dataKey];
              if (subObject && typeof subObject === 'object') {
                return selectedOptions.some(opt => (subObject as any)[opt]);
              }
              return false;
            }
          });
        });

        // Als er geen items overblijven met deze combinatie, maak de optie onbeschikbaar
        available[config.id][option.value] = testFilteredItems.length > 0;
      });
    });

    return available;
  }, [planningItems, activeFilters, filterConfig]);
};
