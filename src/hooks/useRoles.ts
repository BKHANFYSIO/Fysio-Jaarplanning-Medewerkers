import { useState, useEffect } from 'react';
import { useAdminData } from './useAdminData';
import { extractNormalizedRoles, formatRoleLabel } from '../utils/roleUtils';

export interface Role {
  id: string;
  name: string;
  color: string;
  active: boolean;
}

export const useRoles = () => {
  const { items: planningItems, loading: planningLoading } = useAdminData();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planningLoading) return;

    // Haal unieke rollen op uit de bestaande planning data
    const uniqueRoles = new Map<string, Role>();
    
    planningItems.forEach(item => {
      const roles = extractNormalizedRoles(item.role);
      roles.forEach(roleKey => {
        if (!uniqueRoles.has(roleKey)) {
          const label = formatRoleLabel(roleKey);
          const color = generateColorFromString(label);
          uniqueRoles.set(roleKey, {
            id: roleKey,
            name: label,
            color,
            active: true,
          });
        }
      });
    });

    // Converteer naar array en sorteer op naam
    const rolesArray = Array.from(uniqueRoles.values());
    rolesArray.sort((a, b) => a.name.localeCompare(b.name));
    
    setRoles(rolesArray);
    setLoading(false);
  }, [planningItems, planningLoading]);

  // Helper functie om een kleur te genereren op basis van een string
  const generateColorFromString = (str: string): string => {
    const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'indigo', 'yellow', 'red', 'emerald'];
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return { roles, loading, error: null };
};
