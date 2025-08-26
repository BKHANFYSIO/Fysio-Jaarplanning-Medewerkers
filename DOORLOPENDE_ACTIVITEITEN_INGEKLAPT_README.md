# Doorlopende Activiteiten Standaard Ingeklapt - Implementatie Afgerond

## **🎯 Overzicht van de Verbetering**

De doorlopende activiteiten worden nu standaard **ingeklapt** weergegeven in plaats van uitgeklapt, en de instelling wordt **onthouden** voor elke gebruiker via localStorage.

### **Wat is Aangepast:**
1. **Standaard staat**: Doorlopende activiteiten zijn nu standaard ingeklapt
2. **Instelling onthouden**: De keuze van de gebruiker wordt opgeslagen in localStorage
3. **Persistentie**: Bij een volgend bezoek wordt de laatste instelling hersteld
4. **Betere UX**: Minder visuele rommel bij het laden van de pagina

## **🔧 Technische Implementatie**

### **1. State Initialisatie Aangepast**

De `areAllLopendeZakenCollapsed` state wordt nu geïnitialiseerd met de opgeslagen waarde uit localStorage:

```typescript
const [areAllLopendeZakenCollapsed, setAreAllLopendeZakenCollapsed] = useState(() => {
  // Probeer de opgeslagen instelling te laden, standaard op true (ingeklapt)
  const saved = localStorage.getItem('areAllLopendeZakenCollapsed');
  return saved !== null ? saved === 'true' : true;
});
```

**Belangrijke wijzigingen:**
- **Standaard waarde**: `true` (ingeklapt) in plaats van `false` (uitgeklapt)
- **localStorage check**: Eerst kijken of er een opgeslagen waarde is
- **Fallback**: Als geen waarde is opgeslagen, standaard op `true`

### **2. localStorage Persistentie Toegevoegd**

De `toggleAllLopendeZaken` functie slaat nu de instelling op:

```typescript
const toggleAllLopendeZaken = () => {
  saveCurrentScrollPosition();
  const nextState = !areAllLopendeZakenCollapsed;
  setAreAllLopendeZakenCollapsed(nextState);
  
  // Sla de instelling op in localStorage
  localStorage.setItem('areAllLopendeZakenCollapsed', nextState.toString());
  
  // Create a new object where every weekKey is set to the new state
  const newCollapsedSections: Record<string, boolean> = {};
  weeks.forEach(week => {
    const weekKey = `${week.semester}-${week.weekCode}`;
    newCollapsedSections[weekKey] = nextState;
  });
  setCollapsedSections(newCollapsedSections);
};
```

**Nieuwe functionaliteit:**
- **localStorage opslag**: Instelling wordt opgeslagen bij elke wijziging
- **Persistentie**: Instelling blijft bewaard tussen browser sessies
- **Real-time sync**: Alle weken worden direct bijgewerkt

### **3. Automatische Initialisatie Toegevoegd**

Een nieuwe `useLayoutEffect` initialiseert alle weken op basis van de opgeslagen instelling:

```typescript
// Initialiseer collapsedSections op basis van de opgeslagen instelling
useLayoutEffect(() => {
  if (weeks.length > 0) {
    const newCollapsedSections: Record<string, boolean> = {};
    weeks.forEach(week => {
      const weekKey = `${week.semester}-${week.weekCode}`;
      newCollapsedSections[weekKey] = areAllLopendeZakenCollapsed;
    });
    setCollapsedSections(newCollapsedSections);
  }
}, [weeks, areAllLopendeZakenCollapsed]);
```

**Functionaliteit:**
- **Automatische sync**: Alle weken worden gesynchroniseerd met de hoofdinstelling
- **Reactie op wijzigingen**: Bij verandering van de hoofdinstelling worden alle weken bijgewerkt
- **Efficiëntie**: Alleen uitgevoerd wanneer weeks of areAllLopendeZakenCollapsed veranderen

## **🚀 Hoe het nu werkt:**

### **1. Eerste Bezoek (Nieuwe Gebruiker)**
1. **Pagina laadt** zonder opgeslagen instelling
2. **Standaard waarde**: `true` (ingeklapt)
3. **Alle doorlopende activiteiten** worden ingeklapt weergegeven
4. **Instelling wordt opgeslagen** bij eerste gebruik van de knop

### **2. Terugkerende Gebruiker**
1. **Pagina laadt** met opgeslagen instelling uit localStorage
2. **Laatste keuze wordt hersteld** (ingeklapt of uitgeklapt)
3. **Alle weken worden gesynchroniseerd** met de hoofdinstelling
4. **Consistente weergave** in alle secties

### **3. Gebruiker Wijzigt Instelling**
1. **Gebruiker klikt** op "Verberg alle doorlopende activiteiten" of "Toon alle doorlopende activiteiten"
2. **Instelling wordt bijgewerkt** in de state
3. **Instelling wordt opgeslagen** in localStorage
4. **Alle weken worden bijgewerkt** om consistent te zijn
5. **Scroll positie wordt behouden** voor betere gebruikerservaring

## **📊 Visuele Vergelijking**

### **Voor (Oude Gedrag):**
```
[🔽 Toon alle doorlopende activiteiten]  ← Standaard uitgeklapt

Week 1.1 (20-okt-2025)
┌─────────────────────────────────────┐
│ DOORLOPENDE ACTIVITEITEN [2] 🔽    │
│ ┌─────────────────────────────────┐ │
│ │ Activiteit 1                    │ │
│ │ Activiteit 2                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Week 1.2 (27-okt-2025)
┌─────────────────────────────────────┐
│ DOORLOPENDE ACTIVITEITEN [1] 🔽    │
│ ┌─────────────────────────────────┐ │
│ │ Activiteit 3                    │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### **Na (Nieuwe Gedrag):**
```
[🔼 Verberg alle doorlopende activiteiten]  ← Standaard ingeklapt

Week 1.1 (20-okt-2025)
┌─────────────────────────────────────┐
│ DOORLOPENDE ACTIVITEITEN [2] 🔽    │
└─────────────────────────────────────┘

Week 1.2 (27-okt-2025)
┌─────────────────────────────────────┐
│ DOORLOPENDE ACTIVITEITEN [1] 🔽    │
└─────────────────────────────────────┘
```

## **🔧 Technische Details**

### **localStorage Key**
```typescript
localStorage.setItem('areAllLopendeZakenCollapsed', nextState.toString());
```

### **State Synchronisatie**
```typescript
useLayoutEffect(() => {
  if (weeks.length > 0) {
    const newCollapsedSections: Record<string, boolean> = {};
    weeks.forEach(week => {
      const weekKey = `${week.semester}-${week.weekCode}`;
      newCollapsedSections[weekKey] = areAllLopendeZakenCollapsed;
    });
    setCollapsedSections(newCollapsedSections);
  }
}, [weeks, areAllLopendeZakenCollapsed]);
```

### **Knop Tekst Dynamisch**
```typescript
<span>{areAllLopendeZakenCollapsed ? 'Toon alle doorlopende activiteiten' : 'Verberg alle doorlopende activiteiten'}</span>
```

## **🧪 Testen**

### **Wat te testen:**
1. **Eerste bezoek** - controleer of doorlopende activiteiten standaard ingeklapt zijn
2. **Instelling wijzigen** - klik op de knop en controleer of alle weken worden bijgewerkt
3. **Pagina verversen** - controleer of de instelling wordt hersteld
4. **Browser herstarten** - controleer of de instelling persistent is
5. **Scroll positie** - controleer of de scroll positie wordt behouden bij wijzigingen

### **Verwachte resultaten:**
- ✅ **Standaard ingeklapt**: Doorlopende activiteiten zijn standaard ingeklapt
- ✅ **Instelling onthouden**: Keuze wordt opgeslagen in localStorage
- ✅ **Persistentie**: Instelling blijft bewaard tussen sessies
- ✅ **Synchronisatie**: Alle weken worden consistent bijgewerkt
- ✅ **Scroll behoud**: Scroll positie wordt behouden bij wijzigingen

## **🔍 Probleemoplossing**

### **Instelling wordt niet hersteld:**
1. Controleer of localStorage beschikbaar is in de browser
2. Controleer of de localStorage key correct is
3. Controleer browser console voor errors
4. Controleer of de useLayoutEffect correct wordt uitgevoerd

### **Niet alle weken worden bijgewerkt:**
1. Controleer of de weeks array correct wordt geladen
2. Controleer of de weekKey generatie correct is
3. Controleer of de collapsedSections state correct wordt bijgewerkt
4. Valideer de dependency array van useLayoutEffect

### **Scroll positie wordt niet behouden:**
1. Controleer of saveCurrentScrollPosition correct wordt aangeroepen
2. Controleer of de headerRef correct is ingesteld
3. Controleer of de weekRefs correct worden bijgehouden
4. Valideer de scroll restore logica

## **📈 Voordelen van de Verbetering**

✅ **Betere eerste indruk** - minder visuele rommel bij het laden  
✅ **Persoonlijke voorkeur** - gebruiker kan eigen instelling kiezen  
✅ **Persistentie** - instelling blijft bewaard tussen sessies  
✅ **Consistentie** - alle weken hebben dezelfde staat  
✅ **Betere performance** - minder DOM elementen bij standaard ingeklapt  
✅ **Scroll behoud** - gebruiker verliest positie niet bij wijzigingen  
✅ **Intuïtieve UX** - knop tekst past bij de huidige staat  

## **🚀 Volgende Stappen**

De doorlopende activiteiten standaard ingeklapt functionaliteit is volledig afgerond!

**Mogelijke uitbreidingen:**
- **Per week instellingen** - gebruiker kan per week kiezen
- **Bulk acties** - selecteer specifieke weken voor acties
- **Animatie opties** - smooth transitions bij in/uit klappen
- **Keyboard shortcuts** - sneltoetsen voor in/uit klappen

## **🎉 Conclusie**

✅ **Standaard ingeklapt** - Doorlopende activiteiten zijn nu standaard ingeklapt  
✅ **localStorage persistentie** - Instelling wordt onthouden tussen sessies  
✅ **Automatische synchronisatie** - Alle weken worden consistent bijgewerkt  
✅ **Scroll positie behoud** - Gebruiker verliest positie niet bij wijzigingen  
✅ **Betere gebruikerservaring** - Minder visuele rommel bij eerste bezoek  
✅ **Persoonlijke voorkeur** - Gebruiker kan eigen instelling kiezen  
✅ **Backward compatibility** - Bestaande functionaliteit blijft intact  
✅ **Klaar voor productie gebruik**  

De applicatie heeft nu:
- **Standaard ingeklapte doorlopende activiteiten** voor een schonere eerste indruk
- **Persistente instellingen** die worden onthouden tussen browser sessies
- **Consistente weergave** van alle weken op basis van de hoofdinstelling
- **Betere gebruikerservaring** met scroll positie behoud

**Alle gevraagde functionaliteit is succesvol geïmplementeerd!** 🎉
