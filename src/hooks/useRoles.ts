import { useState, useEffect } from 'react';
import { useAdminData } from './useAdminData';

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
      if (item.role && item.role.trim() !== '') {
        const roleString = item.role.trim();
        // Ondersteun meerdere rollen gescheiden door komma's
        const roles = roleString.split(',').map(r => r.trim()).filter(r => r.length > 0);
        
        roles.forEach(roleName => {
          const roleKey = roleName.toLowerCase();
          
          if (!uniqueRoles.has(roleKey)) {
            // Genereer een kleur op basis van de rol naam
            const color = generateColorFromString(roleName);
            
            uniqueRoles.set(roleKey, {
              id: roleKey,
              name: roleName,
              color: color,
              active: true
            });
          }
        });
      }
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
