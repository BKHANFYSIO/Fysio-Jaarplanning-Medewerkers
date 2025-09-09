import { useMemo } from 'react';
import { filterConfig } from '../config/filters';
import { useRoles } from './useRoles';
import { useAdminData } from './useAdminData';
import { extractNormalizedRoles, formatRoleLabel, formatIdToLabel } from '../utils/roleUtils';

export const useDynamicFilters = () => {
  const { roles } = useRoles();
  const { items: planningItems } = useAdminData();

  const dynamicFilterConfig = useMemo(() => {
    return filterConfig.map(config => {
      if (config.id === 'role') {
        // Vul de rol filter dynamisch in met rollen uit de data
        // Build options from roles; if any role id/label accidentally contains a delimiter,
        // split it into separate atomic options as a safety net.
        const optionMap = new Map<string, { value: string; label: string; color: string }>();
        roles.forEach(role => {
          const ids = extractNormalizedRoles(role.id) ;
          const labels = ids.length > 1 ? ids.map(id => formatRoleLabel(id)) : [formatRoleLabel(role.name)];
          ids.forEach((id, index) => {
            if (!optionMap.has(id)) {
              optionMap.set(id, {
                value: id,
                label: labels[index] || formatRoleLabel(id),
                color: role.color,
              });
            }
          });
        });

        return {
          ...config,
          options: Array.from(optionMap.values())
        };
      }
      if (config.id === 'subject') {
        const keys = new Set<string>();
        planningItems.forEach(item => {
          const subj: any = (item as any).subjects || {};
          Object.keys(subj).forEach(k => { if (subj[k] === true) keys.add(k); });
        });
        const palette = ['orange','pink','indigo','blue','green','yellow','gray','teal','slate','purple'];
        const subjectLabelMap: Record<string, string> = {
          meeloops: 'Meeloopstage',
          inschrijven: 'Inschrijvingen/aanmeldingen',
        };
        return {
          ...config,
          options: Array.from(keys).sort().map((id, i) => ({
            value: id,
            label: subjectLabelMap[id] ?? (['ipl','bvp','pzw'].includes(id) ? id.toUpperCase() : formatIdToLabel(id)),
            color: palette[i % palette.length],
            isOther: ['overig','other','overige','anders'].includes(id.toLowerCase()),
          }))
        };
      }
      if (config.id === 'process') {
        const keys = new Set<string>();
        planningItems.forEach(item => {
          const proc: any = (item as any).processes || {};
          Object.keys(proc).forEach(k => keys.add(k));
        });
        const palette = ['teal','yellow','pink','purple','green','orange','slate','gray','indigo','blue'];
        return {
          ...config,
          options: Array.from(keys).sort().map((id, i) => ({
            value: id,
            label: formatIdToLabel(id),
            color: palette[i % palette.length],
          }))
        };
      }
      return config;
    });
  }, [roles, planningItems]);

  return { filterConfig: dynamicFilterConfig };
};

