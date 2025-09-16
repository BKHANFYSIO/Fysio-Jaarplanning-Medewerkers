import { useMemo } from 'react';
import { filterConfig } from '../config/filters';
import { useRoles } from './useRoles';
import { useAdminData } from './useAdminData';
import { extractNormalizedRoles, formatRoleLabel, formatIdToLabel, tokenizeRoles } from '../utils/roleUtils';

export const useDynamicFilters = () => {
  const { roles } = useRoles();
  const { items: planningItems } = useAdminData();

  const dynamicFilterConfig = useMemo(() => {
    return filterConfig.map(config => {
      if (config.id === 'role') {
        // Gebruik originele casing zoals in Excel (eerste keer gezien)
        const optionMap = new Map<string, { value: string; label: string; color: string }>();
        roles.forEach(role => {
          const tokens = tokenizeRoles(role.name);
          tokens.forEach(tok => {
            if (!optionMap.has(tok.id)) {
              optionMap.set(tok.id, {
                value: tok.id,
                label: tok.original,
                color: role.color,
              });
            }
          });
        });
        return {
          ...config,
          options: Array.from(optionMap.values()).sort((a,b) => a.label.localeCompare(b.label))
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
          label: 'Onderwerp (alleen met rol Studenten)',
          options: Array.from(keys).sort().map((id, i) => ({
            value: id,
            label: subjectLabelMap[id] ?? (['ipl','bvp','pzw'].includes(id) ? id.toUpperCase() : formatIdToLabel(id)),
            color: palette[i % palette.length],
            isOther: ['overig','other','overige','anders'].includes(id.toLowerCase()),
          }))
        };
      }
      if (config.id === 'process') {
        const palette = ['teal','yellow','pink','purple','green','orange','slate','gray','indigo','blue'];
        const byId = new Map<string, { value: string; label: string; color: string }>();
        planningItems.forEach(item => {
          const proc: any = (item as any).processes || {};
          const labels: any = (item as any).processLabels || {};
          Object.keys(proc).forEach(k => {
            if (!byId.has(k)) {
              const idx = byId.size;
              byId.set(k, {
                value: k,
                label: labels[k] || formatIdToLabel(k),
                color: palette[idx % palette.length],
              });
            }
          });
        });
        return {
          ...config,
          label: 'Onderwerp (medewerkersrollen)',
          options: Array.from(byId.values()).sort((a,b) => a.label.localeCompare(b.label))
        };
      }
      return config;
    });
  }, [roles, planningItems]);

  return { filterConfig: dynamicFilterConfig };
};

