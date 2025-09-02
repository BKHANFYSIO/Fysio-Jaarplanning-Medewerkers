import { useMemo } from 'react';
import { filterConfig } from '../config/filters';
import { useRoles } from './useRoles';

export const useDynamicFilters = () => {
  const { roles } = useRoles();

  const dynamicFilterConfig = useMemo(() => {
    return filterConfig.map(config => {
      if (config.id === 'role') {
        // Vul de rol filter dynamisch in met rollen uit de data
        return {
          ...config,
          options: roles.map(role => ({
            value: role.name.toLowerCase(),
            label: role.name,
            color: role.color
          }))
        };
      }
      return config;
    });
  }, [roles]);

  return { filterConfig: dynamicFilterConfig };
};

