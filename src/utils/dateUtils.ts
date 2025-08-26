import { WeekInfo } from '../types';

/**
 * Converteer Excel datum serienummer naar leesbare datum string
 * Excel slaat datums op als aantal dagen sinds 1 januari 1900
 */
function convertExcelDateToString(excelValue: number): string {
  try {
    // Excel datum is aantal dagen sinds 1 januari 1900
    // Maar Excel heeft een bug: het denkt dat 1900 een schrikkeljaar was
    // Dus we moeten 2 dagen aftrekken voor datums na 28 februari 1900
    const excelEpoch = new Date(1900, 0, 1);
    const daysSinceEpoch = excelValue - 2; // Compensatie voor Excel bug
    
    const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
    
    // Format als DD-MM-YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.warn('Kon Excel datum niet converteren:', excelValue, error);
    return excelValue.toString();
  }
}

export function parseDate(dateStr: string | number): Date | null {
  if (!dateStr) {
    console.log('parseDate: Empty date string');
    return null;
  }
  
  console.log(`parseDate: Parsing "${dateStr}" (type: ${typeof dateStr})`);
  
  // Als het een nummer is (Excel datum), converteer naar string
  if (typeof dateStr === 'number') {
    console.log(`parseDate: Converting Excel date number ${dateStr} to string`);
    dateStr = convertExcelDateToString(dateStr);
    console.log(`parseDate: Converted to "${dateStr}"`);
  }
  
  // Als het nog steeds geen string is, return null
  if (typeof dateStr !== 'string' || dateStr.trim() === '') {
    console.log(`parseDate: Invalid or empty date string`);
    return null;
  }
  
  // Maak de string consistent: vervang '/', '.' of ' ' met '-'
  const normalizedDateStr = dateStr.trim().replace(/[/.\s]/g, '-');
  
  const parts = normalizedDateStr.split('-');
  
  if (parts.length !== 3) {
    console.log(`parseDate: Failed to parse "${normalizedDateStr}" - incorrect number of parts.`);
    return null;
  }
  
  let day, month, year;
  
  // Poging 1: DD-MM-YYYY
  day = parseInt(parts[0]);
  month = getMonthNumber(parts[1]);
  year = parseInt(parts[2]);
  
  // Poging 2: YYYY-MM-DD (als jaar vooraan staat)
  if (parts[0].length === 4 && !isNaN(parseInt(parts[0]))) {
      year = parseInt(parts[0]);
      month = getMonthNumber(parts[1]);
      day = parseInt(parts[2]);
  }
  
  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
      console.log(`parseDate: Failed to parse "${normalizedDateStr}" - invalid numeric parts.`);
      return null;
  }

  // Eenvoudige validatie
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      console.log(`parseDate: Failed to parse "${normalizedDateStr}" - date out of realistic range.`);
      return null;
  }

  try {
    const date = new Date(Date.UTC(year, month - 1, day));
    
    // Controleer of de datum geldig is (bijv. 30 feb wordt 2 mrt, dat willen we niet)
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
        console.log(`parseDate: Invalid date created for "${normalizedDateStr}" (e.g., day 31 in a 30-day month).`);
        return null;
    }
    
    console.log(`parseDate: Successfully parsed "${normalizedDateStr}" to`, date.toISOString());
    return date;
  } catch (e) {
      console.error(`parseDate: Error creating date object for "${normalizedDateStr}"`, e);
      return null;
  }
}

export function getMonthNumber(monthStr: string): number {
  if (!monthStr) return 0;
  // First check if it's a numeric month
  const numericMonth = parseInt(monthStr);
  if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
    console.log(`getMonthNumber: "${monthStr}" (numeric) -> ${numericMonth}`);
    return numericMonth;
  }
  
  // Otherwise check month names
  const months: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4, 'juni': 6,
    'juli': 7, 'augustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
  };
  
  const result = months[monthStr.toLowerCase()] || 0;
  console.log(`getMonthNumber: "${monthStr}" (text) -> ${result}`);
  return result;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short'
  });
}

export function isDateInWeek(date: Date, weekStart: Date): boolean {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const result = date >= weekStart && date <= weekEnd;
  console.log(`isDateInWeek: ${date.toDateString()} in week starting ${weekStart.toDateString()}? ${result}`);
  return result;
}

export function getWeeksForDateRange(startDate: Date, endDate: Date, weeks: WeekInfo[]): WeekInfo[] {
  const relevantWeeks: WeekInfo[] = [];
  
  console.log(`\ngetWeeksForDateRange: Finding weeks for range ${startDate.toDateString()} to ${endDate.toDateString()}`);
  console.log(`getWeeksForDateRange: Available weeks: ${weeks.length}`);
  
  for (const week of weeks) {
    if (week.isVacation) {
      console.log(`getWeeksForDateRange: Skipping vacation week: ${week.weekLabel}`);
      continue;
    }
    
    const weekStartDate = parseDate(week.startDate);
    if (!weekStartDate) {
      console.log(`getWeeksForDateRange: Week ${week.weekLabel} has invalid start date: ${week.startDate}`);
      continue;
    }
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    console.log(`getWeeksForDateRange: Checking week ${week.weekLabel} (${weekStartDate.toDateString()} to ${weekEndDate.toDateString()})`);
    
    // Check if there's any overlap between the date range and this week
    const hasOverlap = startDate <= weekEndDate && endDate >= weekStartDate;
    console.log(`getWeeksForDateRange: Overlap check:`);
    console.log(`  startDate (${startDate.toDateString()}) <= weekEndDate (${weekEndDate.toDateString()}): ${startDate <= weekEndDate}`);
    console.log(`  endDate (${endDate.toDateString()}) >= weekStartDate (${weekStartDate.toDateString()}): ${endDate >= weekStartDate}`);
    console.log(`  hasOverlap: ${hasOverlap}`);
    
    if (hasOverlap) {
      console.log(`getWeeksForDateRange: ✅ MATCH! Adding week ${week.weekLabel}`);
      relevantWeeks.push(week);
    } else {
      console.log(`getWeeksForDateRange: ❌ No match for week ${week.weekLabel}`);
    }
  }
  
  console.log(`getWeeksForDateRange: Found ${relevantWeeks.length} relevant weeks:`, relevantWeeks.map(w => w.weekLabel));
  return relevantWeeks;
}

export function shouldShowDateDetails(startDate: Date, endDate: Date, weekStart: Date): {
  showStartDate: boolean;
  showEndDate: boolean;
  startDateStr?: string;
  endDateStr?: string;
} {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const showStartDate = startDate > weekStart;
  const showEndDate = endDate < weekEnd;
  
  return {
    showStartDate,
    showEndDate,
    startDateStr: showStartDate ? formatDate(startDate) : undefined,
    endDateStr: showEndDate ? formatDate(endDate) : undefined
  };
}