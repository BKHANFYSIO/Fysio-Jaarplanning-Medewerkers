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
        const optionMap = new Map<string, { value: string; label: string; color: string; isOther?: boolean }>();
        roles.forEach(role => {
          const tokens = tokenizeRoles(role.name);
          tokens.forEach(tok => {
            if (!optionMap.has(tok.id)) {
              optionMap.set(tok.id, {
                value: tok.id,
                label: tok.original,
                color: role.color,
                // Markeer studenten als 'andere' groep om rechts te positioneren met scheiding
                isOther: tok.id === 'studenten',
              });
            }
          });
        });
        // Sorteer alfabetisch, maar 'isOther' groep blijft rechts in de UI via bestaande rendering
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
        // Palet zonder grijs (geen slate/grijs)
        const palette = ['orange','pink','indigo','blue','green','yellow','teal','purple','red','emerald'];
        const subjectLabelMap: Record<string, string> = {
          meeloops: 'Meeloopstage',
          inschrijven: 'Inschrijvingen/aanmeldingen',
        };
        return {
          ...config,
          label: 'Onderwerp (werkt alleen met rol Studenten)',
          options: Array.from(keys).sort().map((id, i) => ({
            value: id,
            label: subjectLabelMap[id] ?? (['ipl','bvp','pzw'].includes(id) ? id.toUpperCase() : formatIdToLabel(id)),
            color: palette[i % palette.length],
            isOther: ['overig','other','overige','anders'].includes(id.toLowerCase()),
          }))
        };
      }
      if (config.id === 'process') {
        // Palet zonder grijs (geen slate/grijs)
        const palette = ['teal','yellow','pink','purple','green','orange','indigo','blue','red','emerald'];
        // Verzamel eerst alle originele labels uit alle items om casing exact te behouden
        const labelById = new Map<string, string>();
        planningItems.forEach(item => {
          const labels: any = (item as any).processLabels || {};
          Object.keys(labels).forEach((id) => {
            if (!labelById.has(id)) {
              labelById.set(id, labels[id]);
            }
          });
        });

        // Bouw opties uitsluitend op basis van bekende labels (dus alleen processen die ergens actief zijn)
        const options = Array.from(labelById.entries())
          .map(([id, label], idx) => ({
            value: id,
            label,
            color: palette[idx % palette.length],
            isOther: ['overig','other','overige','anders'].includes(String(id).toLowerCase()),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        return {
          ...config,
          label: 'Onderwerp (medewerkersrollen)',
          options,
        };
      }
      return config;
    });
  }, [roles, planningItems]);

  return { filterConfig: dynamicFilterConfig };
};

