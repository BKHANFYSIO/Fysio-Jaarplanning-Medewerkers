import * as XLSX from 'xlsx';

/**
 * Converteer Excel datum serienummer naar leesbare datum string
 * Excel slaat datums op als aantal dagen sinds 1 januari 1900
 */
const convertExcelDate = (excelValue: any): string => {
  // Als het al een string is, return direct
  if (typeof excelValue === 'string') {
    return excelValue;
  }
  
  // Als het een nummer is, converteer naar datum
  if (typeof excelValue === 'number') {
    try {
      // Excel datum is aantal dagen sinds 1 januari 1900
      // Maar Excel heeft een bug: het denkt dat 1900 een schrikkeljaar was
      // Dus we moeten 2 dagen aftrekken voor datums na 28 februari 1900
      const excelEpoch = new Date(1900, 0, 1);
      const daysSinceEpoch = excelValue - 2; // Compensatie voor Excel bug
      
      const date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000);
      
      // Controleer of de datum geldig is
      if (isNaN(date.getTime())) {
        console.warn('Ongeldige Excel datum:', excelValue);
        return excelValue.toString();
      }
      
      // Format als DD-MMM (zoals in de originele app)
      const day = date.getDate();
      const monthNames = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
      const month = monthNames[date.getMonth()];
      
      return `${day}-${month}`;
    } catch (error) {
      console.warn('Kon Excel datum niet converteren:', excelValue, error);
      return excelValue.toString();
    }
  }
  
  // Fallback: converteer naar string
  return String(excelValue);
};

/**
 * Converteer Excel tijd decimale waarde naar leesbare tijd string
 * Excel slaat tijden op als fractie van een dag (bijv. 0.5 = 12:00, 0.25 = 06:00)
 */
const convertExcelTime = (excelValue: any): string => {
  // Als het al een string is, return direct
  if (typeof excelValue === 'string') {
    return excelValue;
  }
  
  // Als het een nummer is, converteer naar tijd
  if (typeof excelValue === 'number') {
    try {
      // Excel tijd is fractie van een dag
      const totalSeconds = Math.round(excelValue * 24 * 60 * 60);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      // Format als HH:MM:SS of HH:MM (afhankelijk van of er seconden zijn)
      if (seconds > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      } else {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    } catch (error) {
      console.warn('Kon Excel tijd niet converteren:', excelValue, error);
      return excelValue.toString();
    }
  }
  
  // Fallback: converteer naar string
  return String(excelValue);
};

export interface ExcelParseResult {
  data: any[];
  headers: string[];
  sheetNames: string[];
}

/**
 * Parse een Excel bestand en retourneer de data
 */
export const parseExcel = (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Neem het eerste werkblad (kan later worden uitgebreid)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Converteer naar JSON met headers
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) {
          reject(new Error('Excel bestand is leeg of bevat geen data'));
          return;
        }
        
        // Eerste rij bevat de headers
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1).filter(row => 
          row.some(cell => cell !== null && cell !== undefined && cell !== '')
        );
        
        // Converteer naar objecten met headers als keys
        const parsedData = dataRows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            if (header && row[index] !== undefined && row[index] !== null) {
              let value = row[index];
              
              // Converteer Excel datums naar leesbare datums
              // Maar sluit tijd kolommen uit (kolommen met "tijd" of "time" in de naam)
              if ((header.toLowerCase().includes('datum') || header.toLowerCase().includes('date')) && 
                  !header.toLowerCase().includes('tijd') && 
                  !header.toLowerCase().includes('time')) {
                value = convertExcelDate(value);
              }
              
              // Converteer Excel tijden naar leesbare tijden
              // Voor kolommen met "tijd" of "time" in de naam
              if (header.toLowerCase().includes('tijd') || header.toLowerCase().includes('time')) {
                value = convertExcelTime(value);
              }
              
              obj[header] = value;
            }
          });
          return obj;
        });
        
        resolve({
          data: parsedData,
          headers: headers,
          sheetNames: workbook.SheetNames
        });
        
      } catch (error) {
        reject(new Error(`Fout bij het parsen van Excel bestand: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Fout bij het lezen van het bestand'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Detecteer het bestandstype op basis van de extensie
 */
export const detectFileType = (fileName: string): 'excel' | 'csv' => {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'xlsx' || extension === 'xls') {
    return 'excel';
  }
  return 'csv';
};

/**
 * Export data naar Excel bestand
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Data') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Download het bestand
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};
