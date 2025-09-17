import { useMemo } from 'react';
import { PlanningItem } from '../types';
import { extractNormalizedRoles } from '../utils/roleUtils';
import { FilterConfig } from '../config/types';
import { doesItemMatchFiltersUnion, ActiveFilters } from '../utils/filterEvaluator';

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
        // Simuleer de selectie van ALLEEN deze optie binnen dezelfde filtergroep
        // (i.p.v. toevoegen aan bestaande selectie). Dit voorkomt dat een optie
        // kunstmatig 'beschikbaar' lijkt door OR-logica met al gekozen opties
        // in dezelfde filtergroep (zoals processen).
        const testFilters = { ...activeFilters } as Record<string, string[]>;
        testFilters[config.id] = [option.value];
        // Voorkom kruisbesmetting tussen studenten- en medewerkerskant bij beschikbaarheid
        if (config.id === 'process') {
          testFilters['subject'] = ['__none__'];
        } else if (config.id === 'subject' || config.id === 'phase') {
          testFilters['process'] = ['__none__'];
        }

        // Filter de items met deze test filters
        const testFilteredItems = planningItems.filter(item => {
          return doesItemMatchFiltersUnion(item, testFilters as ActiveFilters);
        });

        // Als er geen items overblijven met deze combinatie, maak de optie onbeschikbaar
        available[config.id][option.value] = testFilteredItems.length > 0;
      });
    });

    return available;
  }, [planningItems, activeFilters, filterConfig]);
};
