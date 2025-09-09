import { useMemo } from 'react';
import { filterConfig } from '../config/filters';
import { useRoles } from './useRoles';
import { extractNormalizedRoles, formatRoleLabel } from '../utils/roleUtils';

export const useDynamicFilters = () => {
  const { roles } = useRoles();

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
      return config;
    });
  }, [roles]);

  return { filterConfig: dynamicFilterConfig };
};

