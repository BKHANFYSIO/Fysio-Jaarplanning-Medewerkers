import { useMemo } from 'react';
import { PlanningItem } from '../types';
import { FilterConfig } from '../config/types';
import { ActiveFilters, doesItemMatchFiltersUnion } from '../utils/filterEvaluator';

export type OptionCounts = Record<string, Record<string, number>>;

export const useOptionCounts = (
  planningItems: PlanningItem[],
  activeFilters: Record<string, string[]>,
  filterConfig: FilterConfig[]
): OptionCounts => {
  return useMemo(() => {
    const counts: OptionCounts = {};
    filterConfig.forEach(config => {
      counts[config.id] = {};
      config.options.forEach(option => {
        const testFilters: Record<string, string[]> = { ...activeFilters };
        // Toon de impact van alléén deze optie binnen de groep
        testFilters[config.id] = [option.value];
        // Zorg dat we alleen de relevante branch tellen:
        // - voor 'process' blokkeer studenten-branch door een "onmogelijke" subject te selecteren
        // - voor 'subject' en 'phase' blokkeer medewerkers-branch door een "onmogelijke" process te selecteren
        if (config.id === 'process') {
          testFilters['subject'] = ['__none__'];
        } else if (config.id === 'subject' || config.id === 'phase') {
          testFilters['process'] = ['__none__'];
        }
        const matched = planningItems.filter(item => doesItemMatchFiltersUnion(item, testFilters as ActiveFilters));
        // Tel unieke activiteiten: alleen eerste in de serie telt mee
        const uniqueCount = matched.reduce((acc, it) => acc + (it.isFirstInSeries ? 1 : 0), 0);
        counts[config.id][option.value] = uniqueCount;
      });
    });
    return counts;
  }, [planningItems, activeFilters, filterConfig]);
};


