import React, { useState } from 'react';
import Papa from 'papaparse';
import { bulkOverwrite } from '../services/firestoreService';
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFeedback('');

    try {
      const fileType = detectFileType(file.name);
      let parsedData: any[];

      if (fileType === 'excel') {
        // Parse Excel bestand
        const excelResult: ExcelParseResult = await parseExcel(file);
        parsedData = excelResult.data;
        console.log('Excel headers:', excelResult.headers);
        console.log('Excel data:', parsedData);
      } else {
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
      }

      const confirmation = window.confirm(
        `Weet je zeker dat je alle bestaande data voor "${collectionName}" wilt vervangen door de inhoud van '${file.name}'? Deze actie kan niet ongedaan worden gemaakt.`
      );

      if (!confirmation) {
        setLoading(false);
        setFeedback('Upload geannuleerd.');
        return;
      }

      // Use custom parser if provided, otherwise use default for activities
      const finalData = customParser 
        ? customParser({ data: parsedData })
        : parsedData.map((row: any) => ({
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
          startDate: row['Startdatum'] || row['startDate'] || '',
          endDate: row['Einddatum'] || row['endDate'] || '',
         startTime: row['Tijd startdatum'] || null,
         endTime: row['Tijd einddatum'] || null,
         deadline: row['Deadline'] || null,
         subjects: {
           waarderen: row['Waarderen'] === 'v' || row['Waarderen'] === true,
           juniorstage: row['Juniorstage'] === 'v' || row['Juniorstage'] === true,
           ipl: row['IPL'] === 'v' || row['IPL'] === true,
           bvp: row['BVP'] === 'v' || row['BVP'] === true,
           pzw: row['PZW'] === 'v' || row['PZW'] === true,
           minor: row['Minor'] === 'v' || row['Minor'] === true,
           getuigschriften: row['Getuigschriften'] === 'v' || row['Getuigschriften'] === true,
           inschrijven: row['Inschrijven/aanmelden'] === 'v' || row['Inschrijven/aanmelden'] === true,
           overig: row['Overig'] === 'v' || row['Overig'] === true,
         },
         phases: {
           p: row['P'] === 'v' || row['P'] === true,
           h1: row['H1'] === 'v' || row['H1'] === true,
           h2h3: row['H2/3'] === 'v' || row['H2/3'] === true,
         },
       })).filter(item => (item as PlanningItem).title); // Filter out items without a title
      
      await bulkOverwrite(collectionName, finalData);
      setFeedback(`'${file.name}' succesvol geüpload! ${finalData.length} items verwerkt.`);
      
    } catch (error) {
      console.error("Error uploading file: ", error);
      setFeedback(`Fout bij het verwerken van '${file.name}': ${error instanceof Error ? error.message : 'Onbekende fout'}`);
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
