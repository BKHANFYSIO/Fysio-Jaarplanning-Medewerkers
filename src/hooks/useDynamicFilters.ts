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
        // Extra bescherming: split labels die alsnog een separator bevatten
        const uniqueOptions = new Map<string, { value: string; label: string; color: string }>();

        roles.forEach(role => {
          const parts = extractNormalizedRoles(role.name);
          if (parts.length === 0) return;
          parts.forEach(part => {
            const key = part.toLowerCase();
            if (!uniqueOptions.has(key)) {
              uniqueOptions.set(key, {
                value: key,
                label: formatRoleLabel(part),
                color: role.color,
              });
            }
          });
        });

        const options = Array.from(uniqueOptions.values()).sort((a, b) => a.label.localeCompare(b.label));

        return {
          ...config,
          options,
        };
      }
      return config;
    });
  }, [roles]);

  return { filterConfig: dynamicFilterConfig };
};

