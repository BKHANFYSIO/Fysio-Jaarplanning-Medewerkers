import { WeekInfo } from '../types';

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) {
    console.log('parseDate: Empty date string');
    return null;
  }
  
  console.log(`parseDate: Parsing "${dateStr}"`);
  
  // Handle DD-MMM-YYYY format
  const parts = dateStr.split('-');
  console.log(`parseDate: Split into parts:`, parts);
  
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const monthStr = parts[1];
    const year = parseInt(parts[2]);
    
    console.log(`parseDate: Raw parts - day: ${day}, monthStr: "${monthStr}", year: ${year}`);
    
    const month = getMonthNumber(monthStr);
    console.log(`parseDate: Month number: ${month}`);
    
    if (year && month && day && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      console.log(`parseDate: Created date object:`, date);
      console.log(`parseDate: Date is valid:`, !isNaN(date.getTime()));
      return date;
    } else {
      console.log(`parseDate: Invalid parts - day: ${day}, month: ${month}, year: ${year}`);
    }
  } else {
    console.log(`parseDate: Wrong number of parts (${parts.length}), expected 3`);
  }
  
  console.log(`parseDate: Failed to parse "${dateStr}"`);
  return null;
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