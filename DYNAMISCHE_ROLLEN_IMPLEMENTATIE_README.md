# Dynamische Rollen Implementatie - Implementatie Afgerond

## **🎯 Overzicht van Nieuwe Functionaliteit**

De hardgecodeerde rollen ("Student", "Docent", "Medewerker", "Overig") zijn vervangen door dynamisch geladen rollen uit de bestaande planning data. Dit maakt het systeem flexibeler en aanpasbaar aan de werkelijke organisatiestructuur zonder extra database collecties.

## **🔧 Geïmplementeerde Wijzigingen**

### **1. Nieuwe useRoles Hook**
- **Bestand**: `src/hooks/useRoles.ts`
- **Functionaliteit**: Haalt rollen dynamisch op uit de bestaande planning data
- **Features**:
  - Automatische detectie van rollen uit geüploade Excel/CSV bestanden
  - Dynamische kleur generatie op basis van rol naam
  - Alleen unieke rollen worden getoond
  - Automatische sortering op naam
  - Real-time updates wanneer nieuwe data wordt geüpload

### **2. Nieuwe useDynamicFilters Hook**
- **Bestand**: `src/hooks/useDynamicFilters.ts`
- **Functionaliteit**: Vult de filter configuratie dynamisch in met rollen uit de data
- **Features**:
  - Integreert rollen uit data in de bestaande filter structuur
  - Behoud van alle bestaande filter functionaliteit
  - Automatische update van rol filter opties

### **3. Bijgewerkte EditItemModal**
- **Bestand**: `src/components/EditItemModal.tsx`
- **Wijzigingen**:
  - **Vervangen van hardgecodeerde checkbox rollen door dynamische dropdown**
  - Gebruik van `useRoles` hook voor real-time rol data
  - Verbeterde gebruikerservaring met loading states
  - **Uitsluiting van rol uit checkbox weergave om duplicatie te voorkomen**
  - **Consistente UI**: Alle bewerkingsvelden zijn nu input velden (geen checkboxes)

### **4. Bijgewerkte PlanningCard**
- **Bestand**: `src/components/PlanningCard.tsx`
- **Wijzigingen**:
  - Dynamische rol styling op basis van gegenereerde kleuren
  - Gebruik van `useRoles` hook voor consistente rol weergave
  - Verbeterde iconen en styling

### **5. Bijgewerkte Filter Configuratie**
- **Bestand**: `src/config/filters.ts`
- **Wijzigingen**:
  - Hersteld rol filter met dynamische opties
  - Behoud van phase en subject filters
  - Nieuwe types structuur in `src/config/types.ts`

### **6. Bijgewerkte useFilters Hook**
- **Bestand**: `src/hooks/useFilters.ts`
- **Wijzigingen**:
  - Ondersteuning voor rol filter naast phase filter
  - Lokale opslag van rol filter voorkeuren
  - Integratie met dynamische filter configuratie

## **📊 Hoe Het Werkt**

### **Automatische Rol Detectie**
1. **Excel/CSV Upload**: Wanneer een bestand wordt geüpload, worden alle unieke waarden uit de "rol" kolom geëxtraheerd
2. **Dynamische Generatie**: Voor elke unieke rol wordt automatisch een kleur gegenereerd
3. **Filter Integratie**: De rollen verschijnen automatisch in de rol filter van de app
4. **Real-time Updates**: Nieuwe rollen zijn direct beschikbaar zonder herstart

### **Kleur Generatie**
```typescript
const generateColorFromString = (str: string): string => {
  const colors = ['blue', 'green', 'purple', 'orange', 'teal', 'pink', 'indigo', 'yellow', 'red', 'emerald'];
  const hash = str.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};
```

### **Data Flow**
```
Excel/CSV Upload → useAdminData → useRoles → useDynamicFilters → Filter UI
                    ↓
              Planning Items met rollen → Unieke rollen extractie → Kleur generatie
```

## **🎨 UI Verbeteringen**

### **EditItemModal - Rol Selectie**
- **Voor**: 4 hardgecodeerde checkbox rollen + duplicatie in filter sectie
- **Na**: **Eén dynamische dropdown voor rol selectie**
- **Voordelen**:
  - **Geen duplicatie**: Rol wordt alleen getoond als dropdown, niet als checkboxes
  - **Consistentie**: Alle bewerkingsvelden zijn input velden (titel, beschrijving, instructies, links, datums, rol)
  - **Flexibeler en schaalbaarder**
  - **Betere gebruikerservaring**
  - **Real-time updates**

### **PlanningCard**
- **Voor**: Statische kleuren voor hardgecodeerde rollen
- **Na**: Dynamische kleuren op basis van gegenereerde kleuren
- **Voordelen**:
  - Consistente styling
  - Unieke kleuren per rol
  - Betere visuele hiërarchie

### **Filter Systeem**
- **Voor**: Alleen hardgecodeerde filters
- **Na**: Dynamische rol filter naast bestaande filters
- **Voordelen**:
  - Automatische rol detectie
  - Behoud van alle bestaande functionaliteit
  - Lokale opslag van voorkeuren

## **🔍 Technische Details**

### **useRoles Hook**
```typescript
export const useRoles = () => {
  const { items: planningItems, loading: planningLoading } = useAdminData();
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    if (planningLoading) return;

    // Haal unieke rollen op uit de bestaande planning data
    const uniqueRoles = new Map<string, Role>();
    
    planningItems.forEach(item => {
      if (item.role && item.role.trim() !== '') {
        const roleName = item.role.trim();
        const roleKey = roleName.toLowerCase();
        
        if (!uniqueRoles.has(roleKey)) {
          const color = generateColorFromString(roleName);
          uniqueRoles.set(roleKey, {
            id: roleKey,
            name: roleName,
            color: color,
            active: true
          });
        }
      }
    });

    const rolesArray = Array.from(uniqueRoles.values());
    rolesArray.sort((a, b) => a.name.localeCompare(b.name));
    
    setRoles(rolesArray);
    setLoading(false);
  }, [planningItems, planningLoading]);

  return { roles, loading, error: null };
};
```

### **useDynamicFilters Hook**
```typescript
export const useDynamicFilters = () => {
  const { roles } = useRoles();

  const dynamicFilterConfig = useMemo(() => {
    return filterConfig.map(config => {
      if (config.id === 'role') {
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
```

### **Duplicatie Opgelost**
```typescript
// In EditItemModal: Rol dropdown (boven)
<div>
  <label htmlFor="role" className="block text-sm font-medium">Rol</label>
  <select name="role" value={formData.role || ''} onChange={handleChange}>
    <option value="">Selecteer een rol</option>
    {roles.map((role) => (
      <option key={role.id} value={role.name.toLowerCase()}>
        {role.name}
      </option>
    ))}
  </select>
</div>

// In EditItemModal: Filter sectie (onder) - rol uitgesloten
{filterConfig.filter(c => c.id !== 'semester' && c.id !== 'role').map(config => (
  // Alleen phase en subject filters worden getoond
))}
```

## **🚀 Voordelen van de Nieuwe Implementatie**

✅ **Geen Extra Database**: Rollen worden automatisch gedetecteerd uit bestaande data  
✅ **Automatische Updates**: Nieuwe rollen verschijnen automatisch na upload  
✅ **Flexibiliteit**: Onbeperkt aantal rollen mogelijk zonder configuratie  
✅ **Consistentie**: Alle componenten gebruiken dezelfde rol data  
✅ **Efficiëntie**: Geen dubbele data opslag  
✅ **Onderhoud**: Geen handmatige rol beheer nodig  
✅ **Real-time**: Rollen zijn direct beschikbaar na upload  
✅ **Geen Duplicatie**: Rol wordt alleen als dropdown getoond, niet als checkboxes  
✅ **Betere UX**: Consistente interface met alle andere bewerkingsvelden  

## **🔮 Toekomstige Uitbreidingen**

- **Rol Templates**: Vooraf gedefinieerde rol sets voor nieuwe projecten
- **Rol Statistieken**: Gebruik analytics per rol
- **Rol Groepering**: Categorisering van rollen (bijv. "Docent", "Stagebegeleider")
- **Rol Permissies**: Verschillende rechten per rol
- **Rol Hiërarchie**: Ouder-kind relaties tussen rollen

## **📋 Implementatie Checklist**

- [x] **useRoles hook** aangemaakt voor dynamische rol extractie
- [x] **useDynamicFilters hook** aangemaakt voor filter integratie
- [x] **EditItemModal** bijgewerkt voor dynamische rollen
- [x] **Duplicatie opgelost**: Rol alleen als dropdown, niet als checkboxes
- [x] **PlanningCard** bijgewerkt voor dynamische styling
- [x] **Filter configuratie** hersteld met dynamische rollen
- [x] **useFilters hook** bijgewerkt voor rol ondersteuning
- [x] **Types structuur** verbeterd
- [x] **Build validatie** succesvol
- [x] **Documentatie** bijgewerkt

## **Conclusie**

✅ **Dynamische rollen zijn volledig geïmplementeerd**  
✅ **Hardgecodeerde rollen zijn vervangen**  
✅ **Duplicatie is opgelost**  
✅ **Systeem is nu flexibeler en schaalbaarder**  
✅ **Betere gebruikerservaring**  
✅ **Geen extra database collectie nodig**  
✅ **Automatische rol detectie uit uploads**  
✅ **Consistente UI**: Alle bewerkingsvelden zijn input velden  

De applicatie gebruikt nu dynamisch gedetecteerde rollen uit de bestaande planning data. Dit maakt het systeem veel flexibeler en efficiënter - rollen worden automatisch gedetecteerd en toegevoegd zonder handmatige configuratie! 🎉

**De dropdown implementatie is gekozen omdat deze consistent is met de rest van de bewerkingsinterface en een betere gebruikerservaring biedt.**
