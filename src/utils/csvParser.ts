import { PlanningItem, WeekInfo } from '../types';

export function parseWeekData(csvContent: string): WeekInfo[] {
  console.log('=== PARSING WEEK DATA ===');
  console.log('Raw CSV content:', csvContent.substring(0, 200) + '...');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log('Total lines after filtering:', lines.length);
  
  const weeks: WeekInfo[] = [];
  let currentSemester: 1 | 2 = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    console.log(`Line ${i}: "${line}"`);
    
    const [label, dateStr] = line.split(';');
    console.log(`  -> Split: label="${label}", dateStr="${dateStr}"`);
    
    if (label === 'Semester 1') {
      currentSemester = 1;
      console.log('  -> Set semester to 1');
      continue;
    }
    if (label === 'Semester 2') {
      currentSemester = 2;
      console.log('  -> Set semester to 2');
      continue;
    }
    
    if (label && dateStr && label !== 'Weergave voor in app.' && label.trim() !== '') {
      const isVacation = label.toLowerCase().includes('vakantie') || label.toLowerCase().includes('afsluiting');
      
      // Parse date with year 2025/2026
      let parsedDate = dateStr.trim();
      console.log(`  -> Original date: "${parsedDate}"`);
      
      if (parsedDate && !parsedDate.includes('2025') && !parsedDate.includes('2026')) {
        // Add year based on semester and month
        const monthPart = parsedDate.split('-')[1];
        console.log(`  -> Month part: "${monthPart}"`);
        
        if (monthPart) {
          const monthNum = getMonthNumber(monthPart);
          console.log(`  -> Month number: ${monthNum}`);
          
          // Months 8-12 are 2025, months 1-7 are 2026
          const year = (monthNum >= 8) ? 2025 : 2026;
          parsedDate = `${parsedDate}-${year}`;
          console.log(`  -> Date with year: "${parsedDate}"`);
        }
      }
      
      const weekInfo = {
        weekCode: label.includes('.') ? label.split(' ')[0] : label,
        weekLabel: label,
        startDate: parsedDate,
        semester: currentSemester,
        isVacation
      };
      
      console.log(`  -> Created week:`, weekInfo);
      weeks.push(weekInfo);
    } else {
      console.log(`  -> Skipped line (empty or header)`);
    }
  }
  
  console.log('=== FINAL WEEKS ===');
  console.log('Total weeks parsed:', weeks.length);
  weeks.forEach((week, i) => {
    console.log(`Week ${i}:`, week);
  });
  
  return weeks;
}

function getMonthNumber(monthStr: string): number {
  const months: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4, 'juni': 6,
    'juli': 7, 'augustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
  };
  
  return months[monthStr.toLowerCase()] || 0;
}

export function parsePlanningData(csvContent: string): PlanningItem[] {
  console.log('\n=== PARSING PLANNING DATA ===');
  console.log('Raw CSV content length:', csvContent.length);
  console.log('First 500 chars:', csvContent.substring(0, 500));
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  console.log('Total lines after filtering:', lines.length);
  
  const items: PlanningItem[] = [];
  
  // Log the header row
  if (lines.length > 0) {
    console.log('Header row:', lines[0]);
    const headerColumns = lines[0].split(';');
    console.log('Header columns:', headerColumns.map((col, i) => `${i}: "${col}"`));
  }
  
  // Skip header row and empty lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    console.log(`\n--- Processing line ${i} ---`);
    console.log(`Raw line: "${line}"`);
    
    if (!line.trim() || line.startsWith(';;;')) {
      console.log('Skipping empty or separator line');
      continue;
    }
    
    const columns = line.split(';');
    console.log(`Split into ${columns.length} columns:`, columns.map((col, idx) => `${idx}: "${col}"`));
    
    if (columns.length < 20) {
      console.log(`Skipping line - not enough columns (${columns.length} < 20)`);
      continue;
    }
    
    const title = columns[0]?.trim();
    console.log(`Title: "${title}"`);
    
    if (!title) {
      console.log('Skipping line - no title');
      continue;
    }
    
    // Get raw dates - they should be in DD-MMM format
    let startDate = columns[12]?.trim() || '';
    let endDate = columns[13]?.trim() || '';
    
    console.log(`Original dates: start="${startDate}", end="${endDate}"`);
    
    // Convert DD-MMM format to DD-MMM-YYYY
    if (startDate && !startDate.includes('2025') && !startDate.includes('2026')) {
      const parts = startDate.split('-');
      if (parts.length === 2) {
        const day = parts[0];
        const monthPart = parts[1];
        const monthNum = getMonthNumber(monthPart);
        const year = (monthNum >= 8) ? 2025 : 2026;
        startDate = `${day}-${monthPart}-${year}`;
        console.log(`Start date with year: "${startDate}"`);
      }
    }
    
    if (endDate && !endDate.includes('2025') && !endDate.includes('2026')) {
      const parts = endDate.split('-');
      if (parts.length === 2) {
        const day = parts[0];
        const monthPart = parts[1];
        const monthNum = getMonthNumber(monthPart);
        const year = (monthNum >= 8) ? 2025 : 2026;
        endDate = `${day}-${monthPart}-${year}`;
        console.log(`End date with year: "${endDate}"`);
      }
    }
    
    // Check if we have valid dates
    if (!startDate || !endDate) {
      console.log(`Skipping item "${title}" - missing dates: start="${startDate}", end="${endDate}"`);
      continue;
    }
    
    const item: PlanningItem = {
      title,
      description: columns[1]?.trim() || '',
      link: columns[2]?.trim() || undefined,
      startDate,
      endDate,
      startTime: columns[14]?.trim() || undefined,
      endTime: columns[15]?.trim() || undefined,
      deadline: columns[16]?.trim() || undefined,
      subjects: {
        waarderen: columns[3]?.trim() === 'v',
        juniorstage: columns[4]?.trim() === 'v',
        ipl: columns[5]?.trim() === 'v',
        bvp: columns[6]?.trim() === 'v',
        pzw: columns[7]?.trim() === 'v',
        minor: columns[8]?.trim() === 'v',
        getuigschriften: columns[9]?.trim() === 'v',
        inschrijven: columns[10]?.trim() === 'v',
        overig: columns[11]?.trim() === 'v'
      },
      phases: {
        p: columns[18]?.trim() === 'v',
        h1: columns[19]?.trim() === 'v',
        h2h3: columns[20]?.trim() === 'v'
      }
    };
    
    console.log('✅ Created item:', {
      title: item.title,
      link: item.link,
      startDate: item.startDate,
      endDate: item.endDate,
      subjects: Object.entries(item.subjects).filter(([_, v]) => v).map(([k, _]) => k),
      phases: Object.entries(item.phases).filter(([_, v]) => v).map(([k, _]) => k)
    });
    items.push(item);
  }
  
  console.log('\n=== FINAL PLANNING ITEMS ===');
  console.log('Total items parsed:', items.length);
  items.forEach((item, i) => {
    console.log(`Item ${i}: "${item.title}" - ${item.startDate} to ${item.endDate}${item.link ? ` (link: ${item.link})` : ''}`);
  });
  
  return items;
}