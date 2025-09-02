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
