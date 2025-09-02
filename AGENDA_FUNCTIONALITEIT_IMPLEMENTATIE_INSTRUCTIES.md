# Agenda Export Functionaliteit - Volledige Implementatie Instructies

## **🎯 Overzicht**

Deze instructies laten je de agenda export functionaliteit toevoegen aan een kopie van de Fysio Jaarplanning app. De functionaliteit bestaat uit:
- Agenda knop in elke activiteitenkaart
- ICS bestand generatie voor universele agenda import
- Waarschuwingsmodal met import instructies
- Slimme deadline/tijd verwerking

## **📁 Stap 1: ICS Generator Utility Aanmaken**

Maak bestand: `src/utils/icsGenerator.ts`

```typescript
import { PlanningItem } from '../types';

/**
 * Converteer een datum string naar ICS formaat (YYYYMMDDTHHMMSSZ)
 */
const formatDateForICS = (dateString: string, timeString?: string): string => {
  try {
    // Parse de datum string (verwacht formaat: dd-mm-yyyy)
    const dateParts = dateString.split('-');
    if (dateParts.length !== 3) {
      throw new Error('Invalid date format');
    }
    
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // JavaScript maanden zijn 0-indexed
    const year = parseInt(dateParts[2], 10);
    
    let date = new Date(year, month, day);
    
    // Voeg tijd toe als beschikbaar (verwacht formaat: HH:MM)
    if (timeString && timeString.trim() !== '') {
      const timeParts = timeString.split(':');
      if (timeParts.length === 2) {
        const hours = parseInt(timeParts[0], 10);
        const minutes = parseInt(timeParts[1], 10);
        date.setHours(hours, minutes, 0, 0);
      }
    } else {
      // Standaard tijd: 09:00 voor start, 17:00 voor eind
      date.setHours(9, 0, 0, 0);
    }
    
    // Converteer naar UTC en formatteer voor ICS
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (error) {
    console.error('Error formatting date for ICS:', error);
    // Fallback naar huidige datum
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
};

/**
 * Escape speciale karakters voor ICS formaat
 */
const escapeICSText = (text: string): string => {
  return text
    .replace(/\\/g, '\\\\')  // Backslash escape
    .replace(/;/g, '\\;')    // Semicolon escape
    .replace(/,/g, '\\,')    // Comma escape
    .replace(/\n/g, '\\n')   // Newline escape
    .replace(/\r/g, '');     // Remove carriage returns
};

/**
 * Genereer een unieke UID voor het agenda item
 */
const generateUID = (item: PlanningItem): string => {
  const timestamp = Date.now();
  const itemId = item.id || item.title.replace(/\s+/g, '-').toLowerCase();
  return `${itemId}-${timestamp}@fysio-jaarplanning.nl`;
};

/**
 * Genereer ICS bestand inhoud voor een planning item
 */
export const generateICSContent = (item: PlanningItem): string => {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Bepaal start en eind tijden
  let startDateTime: string;
  let endDateTime: string;
  
  try {
    // Check of dit een deadline item is
    const isDeadline = (item.deadline || '').trim().toLowerCase() === 'v';
    
    if (isDeadline) {
      // Voor deadline items: gebruik einddatum als deadline datum
      if (item.endTime && item.endTime.trim() !== '') {
        // Als er een tijd is opgegeven, maak het item enkele uren voor de deadline
        const deadlineDate = formatDateForICS(item.endDate, item.endTime);
        const deadline = new Date(deadlineDate.replace('Z', '').replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
        
        // Start 2 uur voor de deadline
        const startDate = new Date(deadline.getTime() - (2 * 60 * 60 * 1000));
        startDateTime = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        endDateTime = deadlineDate;
      } else {
        // Geen tijd opgegeven: maak het een hele werkdag (8:00-17:00)
        startDateTime = formatDateForICS(item.endDate, '08:00');
        endDateTime = formatDateForICS(item.endDate, '17:00');
      }
    } else {
      // Normale activiteit: gebruik start- en einddatum
      if (!item.startTime && !item.endTime) {
        // Geen tijden opgegeven: maak het een werkdag (8:00-17:00)
        startDateTime = formatDateForICS(item.startDate, '08:00');
        endDateTime = formatDateForICS(item.endDate, '17:00');
      } else {
        // Gebruik opgegeven tijden
        startDateTime = formatDateForICS(item.startDate, item.startTime);
        endDateTime = formatDateForICS(item.endDate, item.endTime || item.startTime);
        
        // Als alleen starttijd is opgegeven, maak het een 1-uur event
        if (item.startTime && !item.endTime) {
          const startDate = new Date(startDateTime.replace('Z', '').replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
          const endDate = new Date(startDate.getTime() + (60 * 60 * 1000)); // +1 uur
          endDateTime = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        }
      }
    }
  } catch (error) {
    console.error('Error parsing dates:', error);
    // Fallback naar huidige tijd
    const fallbackNow = new Date();
    const later = new Date(fallbackNow.getTime() + (60 * 60 * 1000));
    startDateTime = fallbackNow.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    endDateTime = later.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  
  // Bouw beschrijving
  let description = '';
  
  // Check of dit een deadline item is en voeg context toe
  const isDeadline = (item.deadline || '').trim().toLowerCase() === 'v';
  if (isDeadline) {
    if (item.endTime && item.endTime.trim() !== '') {
      description += `⚠️ DEADLINE: ${item.endTime} op ${item.endDate}\\n`;
      description += `Dit agenda-item is ingepland van 2 uur voor de deadline tot de deadline.\\n\\n`;
    } else {
      description += `⚠️ DEADLINE: ${item.endDate}\\n`;
      description += `Dit agenda-item is ingepland als werkdag (8:00-17:00) op de deadline datum.\\n\\n`;
    }
  } else {
    description += `📅 Activiteit periode: ${item.startDate} - ${item.endDate}\\n\\n`;
  }
  
  if (item.description && item.description.trim() !== '') {
    description += `${escapeICSText(item.description)}\\n\\n`;
  }
  
  // Voeg rol toe als beschikbaar
  if (item.role && item.role.trim() !== '') {
    description += `Rol: ${escapeICSText(item.role)}\\n\\n`;
  }
  
  // Voeg instructies toe als beschikbaar
  if (item.instructions && item.instructions.trim() !== '') {
    description += `Instructies: ${escapeICSText(item.instructions)}\\n\\n`;
  }
  
  // Voeg links toe als beschikbaar
  if (item.links && item.links.length > 0) {
    description += 'Links:\\n';
    item.links.forEach((link, index) => {
      if (link.trim() !== '') {
        description += `${index + 1}. ${escapeICSText(link)}\\n`;
      }
    });
    description += '\\n';
  }
  
  description += 'BELANGRIJK: Dit item wordt niet automatisch gesynchroniseerd. Wijzigingen in de app worden niet doorgevoerd in jouw agenda.';
  
  // Bepaal titel met context
  let title = item.title;
  if (isDeadline) {
    title = `⚠️ DEADLINE: ${item.title}`;
  }
  
  // Genereer ICS inhoud
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fysio Jaarplanning//Docenten App//NL
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${generateUID(item)}
DTSTAMP:${now}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${escapeICSText(title)}
DESCRIPTION:${description}
CATEGORIES:Fysio Jaarplanning${isDeadline ? ',Deadline' : ''}
PRIORITY:${isDeadline ? '1' : '5'}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  return icsContent;
};

/**
 * Download een ICS bestand voor een planning item
 */
export const downloadICSFile = (item: PlanningItem): void => {
  try {
    const icsContent = generateICSContent(item);
    
    // Maak een veilige bestandsnaam
    const safeTitle = item.title
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Verwijder speciale karakters
      .replace(/\s+/g, '-') // Vervang spaties door streepjes
      .substring(0, 50); // Beperk lengte
    
    const fileName = `${safeTitle}-${item.startDate.replace(/\//g, '-')}.ics`;
    
    // Maak en download het bestand
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    console.log(`ICS file generated and downloaded: ${fileName}`);
  } catch (error) {
    console.error('Error generating ICS file:', error);
    alert('Er is een fout opgetreden bij het genereren van het agenda bestand. Controleer de datum- en tijdgegevens.');
  }
};
```

## **📱 Stap 2: Waarschuwingsmodal Component Aanmaken**

Maak bestand: `src/components/CalendarWarningModal.tsx`

```typescript
import React from 'react';
import { AlertTriangle, Calendar, Download } from 'lucide-react';

interface CalendarWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  activityTitle: string;
}

export const CalendarWarningModal: React.FC<CalendarWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  activityTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0 p-2 bg-amber-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Agenda Export
            </h3>
            <p className="text-sm text-gray-600">
              {activityTitle}
            </p>
          </div>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h4 className="flex items-center font-semibold text-amber-800 mb-2">
            <AlertTriangle size={16} className="mr-2" />
            Belangrijke Informatie
          </h4>
          <div className="text-sm text-amber-700 space-y-2">
            <p>
              <strong>Geen Synchronisatie:</strong> Dit agenda-item wordt niet automatisch gesynchroniseerd met de app. Wijzigingen in de app worden niet doorgevoerd in jouw agenda.
            </p>
            <p>
              <strong>Eigen Verantwoordelijkheid:</strong> Je bent zelf verantwoordelijk voor het bijhouden en bijwerken van agenda-items.
            </p>
            <p>
              <strong>Eenmalige Export:</strong> Dit is een momentopname. Voor updates moet je opnieuw exporteren.
            </p>
          </div>
        </div>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="flex items-center font-semibold text-blue-800 mb-2">
            <Download size={16} className="mr-2" />
            Wat Gebeurt Er?
          </h4>
          <div className="text-sm text-blue-700">
            <p>
              Er wordt een <strong>.ics bestand</strong> gedownload dat je kunt importeren in:
            </p>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>Microsoft Outlook (werk/privé)</li>
              <li>Google Calendar</li>
              <li>Apple Calendar</li>
              <li>Andere agenda applicaties</li>
            </ul>
          </div>
        </div>

        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <h4 className="flex items-center font-semibold text-green-800 mb-2">
            <Calendar size={16} className="mr-2" />
            Hoe Importeren?
          </h4>
          <div className="text-sm text-green-700 space-y-2">
            <div>
              <strong>Automatisch (aanbevolen):</strong>
              <p>Dubbelklik op het gedownloade .ics bestand - je standaard agenda opent automatisch.</p>
            </div>
            <div>
              <strong>Handmatig importeren:</strong>
              <ul className="ml-4 list-disc space-y-1 mt-1">
                <li><strong>Outlook:</strong> Bestand → Openen & Exporteren → Agenda importeren</li>
                <li><strong>Google Calendar:</strong> Instellingen → Importeren & exporteren → Importeren</li>
                <li><strong>Apple Calendar:</strong> Bestand → Importeren → Selecteer .ics bestand</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white pt-4 mt-6 border-t">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Annuleren
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Calendar size={16} />
              Download Agenda Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## **🔧 Stap 3: PlanningCard Component Bijwerken**

In bestand: `src/components/PlanningCard.tsx`

### **3.1 Imports toevoegen (bovenaan bestand)**

```typescript
// Voeg deze imports toe aan de bestaande imports
import { CalendarWarningModal } from './CalendarWarningModal';
import { downloadICSFile } from '../utils/icsGenerator';
```

### **3.2 State toevoegen (in component functie)**

```typescript
// Voeg deze state toe bij de andere useState declarations
const [isCalendarWarningOpen, setIsCalendarWarningOpen] = useState(false);
```

### **3.3 Handler functies toevoegen**

```typescript
// Voeg deze functies toe na de andere handler functies
const handleCalendarClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  setIsCalendarWarningOpen(true);
};

const handleCalendarConfirm = () => {
  setIsCalendarWarningOpen(false);
  downloadICSFile(item);
};
```

### **3.4 Agenda knop toevoegen in Actions sectie**

Zoek naar de `{/* Actions */}` sectie en voeg dit toe **VOOR** de Instructies knop:

```typescript
{/* Agenda knop */}
<div className="relative group">
  <button 
    onClick={handleCalendarClick}
    className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-300 hover:text-green-700 dark:hover:text-green-200 hover:scale-105 transition-all duration-200 cursor-pointer"
    title="Toevoegen aan agenda"
  >
    <Calendar className="w-4 h-4" />
    <span>Agenda</span>
  </button>
  
  {/* Tooltip */}
  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 bg-gray-800 text-white text-xs font-medium rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
    Zet activiteit in je eigen agenda
    <br />
    <span className="text-yellow-300">⚠️ Wordt niet gesynchroniseerd</span>
    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
  </div>
</div>
```

### **3.5 Modal toevoegen aan return statement**

Voeg dit toe aan het einde van de return statement (na de InstructionTextModal):

```typescript
<CalendarWarningModal
  isOpen={isCalendarWarningOpen}
  onClose={() => setIsCalendarWarningOpen(false)}
  onConfirm={handleCalendarConfirm}
  activityTitle={item.title}
/>
```

## **✅ Stap 4: Verificatie**

### **4.1 Build testen**

```bash
npm run build
```

### **4.2 Functionaliteit controleren**

1. **Agenda knop zichtbaar**: Groene knop met Calendar icoon
2. **Tooltip werkt**: Mouse-over toont "Zet activiteit in je eigen agenda"
3. **Modal opent**: Klik opent waarschuwingsmodal
4. **ICS download**: Bevestigen downloadt .ics bestand
5. **Import werkt**: Dubbelklik op .ics opent agenda applicatie

### **4.3 Test verschillende scenario's**

- **Normale activiteit**: 8:00-17:00 werkdag
- **Activiteit met tijd**: Gebruikt opgegeven tijden
- **Deadline zonder tijd**: 8:00-17:00 op deadline datum
- **Deadline met tijd**: 2 uur voor deadline tot deadline

## **🎯 Verwacht Resultaat**

Na implementatie heb je:

- ✅ **Agenda knop** in elke activiteitenkaart
- ✅ **Informatieve tooltip** bij hover
- ✅ **Waarschuwingsmodal** met uitgebreide instructies
- ✅ **ICS bestand download** functionaliteit
- ✅ **Slimme datum/tijd verwerking** voor deadlines
- ✅ **Universele agenda compatibiliteit**

## **🔍 Troubleshooting**

### **Import Errors**
- Controleer of alle imports correct zijn
- Zorg dat lucide-react icons beschikbaar zijn

### **Build Errors**
- Controleer TypeScript types
- Zorg dat PlanningItem interface de juiste velden heeft

### **Modal niet zichtbaar**
- Controleer z-index (z-50)
- Controleer of modal state correct wordt beheerd

### **ICS bestand niet werkend**
- Test met verschillende agenda applicaties
- Controleer datum formaten in console

## **📋 Checklist**

- [ ] `src/utils/icsGenerator.ts` aangemaakt
- [ ] `src/components/CalendarWarningModal.tsx` aangemaakt  
- [ ] PlanningCard imports bijgewerkt
- [ ] PlanningCard state toegevoegd
- [ ] PlanningCard handlers toegevoegd
- [ ] Agenda knop toegevoegd in Actions sectie
- [ ] Modal toegevoegd aan return statement
- [ ] Build test succesvol
- [ ] Functionaliteit getest in browser
- [ ] ICS import getest in agenda applicatie

## **🎉 Klaar!**

De agenda export functionaliteit is nu volledig geïmplementeerd en werkt exact hetzelfde als in de originele app!

