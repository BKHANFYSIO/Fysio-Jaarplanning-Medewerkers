import { useState, useMemo } from 'react';
import { PlanningItem, SubjectFilter, PhaseFilter } from '../types';

export function useFilters(items: PlanningItem[]) {
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all');

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Phase filter
      if (phaseFilter !== 'all') {
        const phaseKey = phaseFilter === 'h2h3' ? 'h2h3' : phaseFilter;
        if (!item.phases[phaseKey as keyof typeof item.phases]) {
          return false;
        }
      }

      // Subject filter
      if (subjectFilter !== 'all') {
        if (!item.subjects[subjectFilter]) {
          return false;
        }
      }

      return true;
    });
  }, [items, subjectFilter, phaseFilter]);

  const resetFilters = () => {
    setSubjectFilter('all');
    setPhaseFilter('all');
  };

  return {
    filteredItems,
    subjectFilter,
    phaseFilter,
    setSubjectFilter,
    setPhaseFilter,
    resetFilters
  };
}