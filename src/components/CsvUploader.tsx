import React, { useState } from 'react';
import Papa from 'papaparse';
import { bulkOverwrite } from '../services/firestoreService';
import { PlanningItem, WeekInfo } from '../types';

interface CsvUploaderProps {
  label: string;
  collectionName: string;
  customParser?: (results: any) => PlanningItem[] | WeekInfo[];
}

export const CsvUploader: React.FC<CsvUploaderProps> = ({ label, collectionName, customParser }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFeedback('');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const confirmation = window.confirm(
          `Weet je zeker dat je alle bestaande data voor "${collectionName}" wilt vervangen door de inhoud van '${file.name}'? Deze actie kan niet ongedaan worden gemaakt.`
        );

        if (!confirmation) {
          setLoading(false);
          setFeedback('Upload geannuleerd.');
          return;
        }

        try {
          // Use custom parser if provided, otherwise use default
          const parsedData = customParser 
            ? customParser(results)
            : results.data.map((row: any) => ({
             title: row['Titel (of wat)'] || '',
             description: row['Extra regel'] || '',
             link: row['link'] || null,
             startDate: row['Startdatum'] || null,
             endDate: row['Einddatum'] || null,
             startTime: row['Tijd startdatum'] || null,
             endTime: row['Tijd einddatum'] || null,
             deadline: row['Deadline'] || null,
             subjects: {
               waarderen: row['Waarderen'] === 'v',
               juniorstage: row['Juniorstage'] === 'v',
               ipl: row['IPL'] === 'v',
               bvp: row['BVP'] === 'v',
               pzw: row['PZW'] === 'v',
               minor: row['Minor'] === 'v',
               getuigschriften: row['Getuigschriften'] === 'v',
               inschrijven: row['Inschrijven/aanmelden'] === 'v',
               overig: row['Overig'] === 'v',
             },
             phases: {
               p: row['P'] === 'v',
               h1: row['H1'] === 'v',
               h2h3: row['H2/3'] === 'v',
             },
          })).filter(item => (item as PlanningItem).title); // Filter out items without a title
          
          await bulkOverwrite(collectionName, parsedData);
          setFeedback(`'${file.name}' succesvol geüpload! ${parsedData.length} items verwerkt.`);
        } catch (error) {
          console.error("Error uploading to Firestore: ", error);
          setFeedback('Er is een fout opgetreden bij het uploaden.');
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV: ", error);
        setFeedback('Fout bij het lezen van het CSV-bestand.');
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-4 border rounded-lg">
      <label className="block mb-2 text-sm font-medium text-gray-700">{label}</label>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        disabled={loading}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {loading && <p className="mt-2 text-sm text-blue-600">Verwerken...</p>}
      {feedback && <p className="mt-2 text-sm text-green-600">{feedback}</p>}
    </div>
  );
};
