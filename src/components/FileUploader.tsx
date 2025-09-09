import React, { useState } from 'react';
import Papa from 'papaparse';
import { bulkOverwrite } from '../services/firestoreService';
import { normalizeHeaderToId } from '../utils/roleUtils';
import { PlanningItem, WeekInfo } from '../types';
import { parseExcel, detectFileType, ExcelParseResult } from '../utils/excelParser';

/**
 * Parse de links kolom met titel:URL format
 * Bijv: "Inschrijflijst stage: https://example.com, KNGF site: https://defysiotherapeut.com/"
 * Retourneert array van strings in "Titel: URL" formaat
 */
const parseLinksColumn = (linksText: string): string[] => {
  if (!linksText || typeof linksText !== 'string') return [];
  
  // Zoek naar URL's (http:// of https://) en split de tekst op basis daarvan.
  // Dit is robuuster dan splitsen op komma's of newlines.
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = linksText.split(urlRegex);
  
  const result: string[] = [];
  
  // De `split` met een regex geeft ons [tekst, url, tekst, url, ...].
  // We moeten deze weer combineren tot "Titel: URL".
  for (let i = 0; i < parts.length - 1; i += 2) {
    const rawTitle = parts[i];
    // Verwijder eventuele leidende scheidingstekens en spaties (komma, puntkomma, streepje, pipe)
    const title = rawTitle
      .replace(/^[\s,;|\-]+/, '')
      .replace(/:$/, '')
      .trim();
    const url = parts[i + 1];
    if (title && url) {
      result.push(`${title}: ${url}`);
    }
  }
  
  // Als er geen URL's zijn gevonden, maar wel tekst, behandel de hele tekst als één item (fallback)
  if (result.length === 0 && linksText.trim()) {
    return [linksText.trim()];
  }
  
  return result;
};

interface FileUploaderProps {
  label: string;
  collectionName: string;
  customParser?: (results: any) => PlanningItem[] | WeekInfo[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({ label, collectionName, customParser }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Helper functie voor uitgebreide validatie
  const validateFile = (file: File): string | null => {
    // Controleer bestandsgrootte (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return '❌ Fout: Bestand is te groot (maximaal 10MB toegestaan).';
    }
    
    // Controleer bestandsextensie
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      return `❌ Fout: Ongeldig bestandsformaat. Ondersteunde formaten: ${validExtensions.join(', ')}.`;
    }
    
    return null; // Geen fout
  };

  // Helper functie voor header validatie
  const validateHeaders = (headers: string[]): { isValid: boolean; missingColumns: string[]; message: string } => {
    const missingColumns: string[] = [];
    
    // Controleer of er een titel kolom is
    const hasTitleColumn = headers.some(header => 
      header === 'Wat?' || header === 'Titel (of wat)'
    );
    
    if (!hasTitleColumn) {
      missingColumns.push('Wat? of Titel (of wat)');
    }
    
    // Controleer of er een startdatum kolom is
    const hasStartDateColumn = headers.some(header => 
      header === 'Startdatu' || header === 'Startdatum' || header === 'startDate'
    );
    
    if (!hasStartDateColumn) {
      missingColumns.push('Startdatu of Startdatum');
    }
    
    // Controleer of er een einddatum kolom is
    const hasEndDateColumn = headers.some(header => 
      header === 'Einddatur' || header === 'Einddatum' || header === 'endDate'
    );
    
    if (!hasEndDateColumn) {
      missingColumns.push('Einddatur of Einddatum');
    }
    
    // Controleer of er een rol kolom is
    const hasRoleColumn = headers.some(header => 
      header.toLowerCase() === 'rol' || header.toLowerCase() === 'role'
    );
    
    if (!hasRoleColumn) {
      missingColumns.push('Rol');
    }
    
    const isValid = missingColumns.length === 0;
    const message = isValid 
      ? '✅ Alle verplichte kolommen zijn aanwezig.'
      : `❌ Fout: Het bestand mist verplichte kolommen: ${missingColumns.join(', ')}.`;
    
    return { isValid, missingColumns, message };
  };

  // Helper functie voor data validatie
  const validateData = (data: any[]): { isValid: boolean; message: string; validRows: number } => {
    if (!data || data.length === 0) {
      return { 
        isValid: false, 
        message: '❌ Fout: Het bestand bevat geen data of alleen lege rijen.',
        validRows: 0
      };
    }
    
    // Tel rijen met ten minste een titel
    const rowsWithTitle = data.filter(row => {
      const title = row['Wat?'] || row['Titel (of wat)'];
      return title && title.toString().trim() !== '';
    });
    
    if (rowsWithTitle.length === 0) {
      return {
        isValid: false,
        message: '❌ Fout: Alle rijen zijn weggefilterd omdat ze geen geldige titel hebben.',
        validRows: 0
      };
    }
    
    if (rowsWithTitle.length < data.length) {
      return {
        isValid: true,
        message: `⚠️ Waarschuwing: ${data.length - rowsWithTitle.length} van de ${data.length} rijen hebben geen geldige titel en worden overgeslagen.`,
        validRows: rowsWithTitle.length
      };
    }
    
    return {
      isValid: true,
      message: `✅ ${rowsWithTitle.length} geldige rijen gevonden.`,
      validRows: rowsWithTitle.length
    };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFeedback('');

    try {
      // Pre-upload validatie
      const fileValidationError = validateFile(file);
      if (fileValidationError) {
        setFeedback(fileValidationError);
        setLoading(false);
        return;
      }

      const fileType = detectFileType(file.name);
      let parsedData: any[];
      let headers: string[] = [];

      if (fileType === 'excel') {
        try {
          // Parse Excel bestand
          const excelResult: ExcelParseResult = await parseExcel(file);
          parsedData = excelResult.data;
          headers = excelResult.headers;
          console.log('Excel headers:', excelResult.headers);
          console.log('Excel data:', parsedData);
        } catch (excelError) {
          setFeedback('❌ Fout: Excel bestand kan niet worden gelezen. Controleer of het bestand niet beschadigd is.');
          setLoading(false);
          return;
        }
      } else {
        try {
          // Parse CSV bestand (bestaande functionaliteit)
          const csvResult = await new Promise<any[]>((resolve, reject) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                resolve(results.data);
              },
              error: (error) => {
                reject(error);
              }
            });
          });
          parsedData = csvResult;
          // Voor CSV bestanden halen we de headers uit de eerste rij
          if (parsedData.length > 0) {
            headers = Object.keys(parsedData[0]);
          }
        } catch (csvError) {
          setFeedback('❌ Fout: CSV bestand kan niet worden gelezen. Controleer of het bestand niet beschadigd is.');
          setLoading(false);
          return;
        }
      }

      // Header validatie
      const headerValidation = validateHeaders(headers);
      if (!headerValidation.isValid) {
        setFeedback(headerValidation.message);
        setLoading(false);
        return;
      }

      // Data validatie
      const dataValidation = validateData(parsedData);
      if (!dataValidation.isValid) {
        setFeedback(dataValidation.message);
        setLoading(false);
        return;
      }

      // Toon waarschuwing als er rijen worden overgeslagen
      if (dataValidation.message.includes('Waarschuwing')) {
        setFeedback(dataValidation.message);
        // Wacht even zodat gebruiker de waarschuwing kan lezen
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      const confirmation = window.confirm(
        `Weet je zeker dat je alle bestaande data voor "${collectionName}" wilt vervangen door de inhoud van '${file.name}'? Deze actie kan niet ongedaan worden gemaakt.\n\n${dataValidation.message}`
      );

      if (!confirmation) {
        setLoading(false);
        setFeedback('Upload geannuleerd.');
        return;
      }

      // Bepaal dynamisch welke headers bij Onderwerp en welke bij Processen horen
      const roleIdx = headers.findIndex(h => normalizeHeaderToId(h) === 'rol');
      const skipNormalized = new Set([
        'wat', 'titel_of_wat', 'extra_regel', 'instructies', 'links', 'startdatu', 'startdatum', 'startdate', 'einddatur', 'einddatum', 'enddate',
        'tijd_starto', 'tijd_startdatum', 'tijd_eindd', 'tijd_einddatum', 'deadline', 'status', 'gewijzigd_door', 'opmerkingen',
        'p', 'h1', 'h2_3'
      ]);
      const subjectHeaders: { header: string; id: string }[] = [];
      const processHeaders: { header: string; id: string }[] = [];
      headers.forEach((header, idx) => {
        const id = normalizeHeaderToId(header);
        if (!id || skipNormalized.has(id)) return;
        if (roleIdx >= 0 && idx > roleIdx) {
          processHeaders.push({ header, id });
        } else {
          subjectHeaders.push({ header, id });
        }
      });

      // Use custom parser if provided, otherwise use default for activities
      const finalData = customParser 
        ? customParser({ data: parsedData })
        : parsedData.map((row: any) => {
        const processes: Record<string, boolean> = {};
        const subjects: Record<string, boolean> = {};

        // Vul subjects o.b.v. subjectHeaders (links van Rol)
        subjectHeaders.forEach(({ header, id }) => {
          const raw = row[header];
          const isTrue = raw === 'v' || raw === true || String(raw).toLowerCase() === 'v';
          if (!id) return;
          // Normaliseer varianten: bijvoorbeeld inschrijven/aanmelden -> inschrijven_aanmelden
          subjects[id] = !!isTrue;
        });

        // Vul processes o.b.v. processHeaders (rechts van Rol), maar sluit onderwerpen uit die rechts van Rol staan
        const subjectLike = new Set(['waarderen','juniorstage','ipl','bvp','pzw','minor','getuigschriften','inschrijven','inschrijven_aanmelden','overig','meeloopstage','meeloops','meelopen','meeloop']);
        processHeaders.forEach(({ header, id }) => {
          if (!id || subjectLike.has(id)) return;
          const raw = row[header];
          const isTrue = raw === 'v' || raw === true || String(raw).toLowerCase() === 'v';
          processes[id] = !!isTrue;
        });

        return ({
        title: row['Wat?'] || row['Titel (of wat)'] || '', // Support both column names
        description: row['Extra regel'] || '',
                  instructions: row['Instructies'] || row['link'] || null, // Nieuwe instructies kolom
         links: parseLinksColumn(row['Links'] || ''), // Gebruik de nieuwe, robuuste parser
         // Verwijder de oude 'link' toewijzing om dubbele data te voorkomen
         role: (() => {
           const raw = (row['rol'] ?? row['Rol'] ?? row['gebruiker'] ?? row['Gebruiker'] ?? '').toString().trim();
           if (!raw) return null; // nooit undefined schrijven
           return raw.toLowerCase();
         })(),
         startDate: row['Startdatu'] || row['Startdatum'] || row['startDate'] || '',
         endDate: row['Einddatur'] || row['Einddatum'] || row['endDate'] || '',
        startTime: row['Tijd starto'] || row['Tijd startdatum'] || null,
        endTime: row['Tijd eindd'] || row['Tijd einddatum'] || null,
        deadline: row['Deadline'] || null,
        subjects: {
          waarderen: subjects['waarderen'] || false,
          juniorstage: subjects['juniorstage'] || false,
          ipl: subjects['ipl'] || false,
          bvp: subjects['bvp'] || false,
          pzw: subjects['pzw'] || false,
          minor: subjects['minor'] || false,
          getuigschriften: subjects['getuigschriften'] || false,
          inschrijven: subjects['inschrijven'] || subjects['inschrijven_aanmelden'] || false,
          overig: subjects['overig'] || false,
          meeloops: subjects['meeloopstage'] || subjects['meeloops'] || subjects['meelopen'] || subjects['meeloop'] || false,
        },
        phases: {
          p: row['P'] === 'v' || row['P'] === true,
          h1: row['H1'] === 'v' || row['H1'] === true,
          h2h3: row['H2/3'] === 'v' || row['H2/3'] === true,
        },
        status: row['Status'] || '',
        gewijzigdDoor: row['Gewijzigd door'] || '',
        opmerkingen: row['Opmerkingen'] || '',
        processes,
      })}).filter(item => (item as PlanningItem).title); // Filter out items without a title

      // Post-processing validatie
      if (finalData.length === 0) {
        setFeedback('❌ Fout: Na het verwerken van de data zijn er geen geldige items over. Controleer de kolomnamen en data inhoud.');
        setLoading(false);
        return;
      }
      
      await bulkOverwrite(collectionName, finalData);
      setFeedback(`✅ '${file.name}' succesvol geüpload! ${finalData.length} items verwerkt.`);
      
    } catch (error) {
      console.error("Error uploading file: ", error);
      setFeedback(`❌ Fout bij het verwerken van '${file.name}': ${error instanceof Error ? error.message : 'Onbekende fout'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p className="mt-1 text-xs text-gray-500">
        Ondersteunde formaten: CSV, Excel (.xlsx, .xls)
      </p>
      {loading && <p className="mt-2 text-sm text-blue-600">Verwerken...</p>}
      {feedback && (
        <p className={`mt-2 text-sm ${feedback.includes('Fout') ? 'text-red-600' : 'text-green-600'}`}>
          {feedback}
        </p>
      )}
    </div>
  );
};
