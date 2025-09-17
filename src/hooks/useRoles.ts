import { useState, useEffect } from 'react';
import { useAdminData } from './useAdminData';
import { extractNormalizedRoles, formatRoleLabel, tokenizeRoles } from '../utils/roleUtils';

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
      const tokens = tokenizeRoles(item.role);
      tokens.forEach(tok => {
        if (!uniqueRoles.has(tok.id)) {
          const displayName = tok.original; // behoud originele casing
          const color = generateColorFromString(displayName);
          uniqueRoles.set(tok.id, {
            id: tok.id,
            name: displayName,
            color: color,
            active: true
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
    // Gebruik een palet zonder grijstinten zodat grijs gereserveerd blijft voor 'geen combinatie'
    const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'indigo', 'yellow', 'red', 'emerald'];
    const hash = str.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  return { roles, loading, error: null };
};
