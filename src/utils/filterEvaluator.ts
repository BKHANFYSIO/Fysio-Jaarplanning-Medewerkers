import { PlanningItem } from '../types';
import { extractNormalizedRoles } from './roleUtils';

export type ActiveFilters = Record<string, string[]>;

function matchesSemester(item: PlanningItem, activeFilters: ActiveFilters): boolean {
  const selected = activeFilters['semester'];
  if (!selected || selected.length === 0) return true;
  return selected.includes(String(item.semester));
}

function matchesPhases(item: PlanningItem, activeFilters: ActiveFilters): boolean {
  const selected = activeFilters['phase'];
  if (!selected || selected.length === 0) return true;
  const phases: any = (item as any).phases || {};
  const hasAnyPhase = !!(phases.p || phases.h1 || phases.h2h3);
  // OR-logica: item matcht als één van de geselecteerde opties matcht
  // 'algemeen' betekent: geen enkele fase aangevinkt op het item
  const normalSelections = selected.filter(opt => opt !== 'algemeen');
  const wantsAlgemeen = selected.includes('algemeen');

  const matchesAnyNormal = normalSelections.some(opt => !!phases[opt]);
  const matchesAlgemeen = wantsAlgemeen && !hasAnyPhase;

  // Als zowel normaal als algemeen is geselecteerd: match bij een van beide
  // Als alleen normaal geselecteerd is: match bij een van de normale fases
  // Als alleen algemeen geselecteerd is: match wanneer item geen fase heeft
  return matchesAnyNormal || matchesAlgemeen;
}

function matchesSubjects(item: PlanningItem, activeFilters: ActiveFilters): boolean {
  const selected = activeFilters['subject'];
  if (!selected || selected.length === 0) return true;
  const sub: any = (item as any).subjects || {};
  return selected.some(opt => !!sub[opt]);
}

function matchesProcesses(item: PlanningItem, activeFilters: ActiveFilters): boolean {
  const selected = activeFilters['process'];
  if (!selected || selected.length === 0) return true;
  const proc: any = (item as any).processes || {};
  return selected.some(opt => !!proc[opt]);
}

function itemHasRole(item: PlanningItem, roleId: string): boolean {
  const roles = extractNormalizedRoles((item.role || '').toString());
  return roles.includes(roleId);
}

function itemHasAnyRole(item: PlanningItem, roleIds: string[]): boolean {
  if (roleIds.length === 0) return false;
  const roles = extractNormalizedRoles((item.role || '').toString());
  return roleIds.some(id => roles.includes(id));
}

/**
 * Domein-specifieke UNION filtering:
 * - Studenten-pad: rol 'studenten' + (subjects indien geselecteerd)
 * - Medewerkers-pad: een van medewerkersrollen + (processes indien geselecteerd)
 * - Gemeenschappelijke filters: semester, phases
 * - Fallback wanneer geen rollen geselecteerd: pas semester/phases toe; subject negeren; process toepassen indien geselecteerd
 */
export function doesItemMatchFiltersUnion(item: PlanningItem, activeFilters: ActiveFilters): boolean {
  const selectedRoles = (activeFilters['role'] || []).map(r => r.toLowerCase());
  const hasStudentSelected = selectedRoles.includes('studenten');
  const staffRoles = selectedRoles.filter(r => r !== 'studenten');
  const anyStaffSelected = staffRoles.length > 0;

  // Fallback: geen rolfilters actief -> toon geen items (lege staat tot er rollen gekozen zijn)
  if (!hasStudentSelected && !anyStaffSelected) {
    return false;
  }

  // Studenten-branch
  const studentBranch = hasStudentSelected
    && itemHasRole(item, 'studenten')
    && matchesSemester(item, activeFilters)
    && matchesPhases(item, activeFilters)
    && matchesSubjects(item, activeFilters);

  // Medewerkers-branch
  const staffBranch = anyStaffSelected
    && itemHasAnyRole(item, staffRoles)
    && matchesSemester(item, activeFilters)
    && matchesProcesses(item, activeFilters);

  return studentBranch || staffBranch;
}



