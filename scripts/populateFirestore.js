import { config } from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';

config({ path: path.resolve(process.cwd(), 'server', '.env') });

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('Fout: FIREBASE_SERVICE_ACCOUNT_PATH is niet ingesteld of het bestand bestaat niet.');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      firestore: {
        ignoreUndefinedProperties: true // Voeg deze regel toe om undefined waarden te negeren
      }
    });
  }
} catch (error) {
  console.error('Fout bij het initialiseren van Firebase Admin SDK:', error);
  console.error('Controleer of de FIREBASE_SERVICE_ACCOUNT_PATH correct is en het JSON-bestand geldig is.');
  process.exit(1);
}

const db = admin.firestore();

// Pad naar de originele CSV-bestanden
const PUBLIC_DATA_DIR = path.join(process.cwd(), 'public', 'data');
const PLANNING_CSV_PATH_SEM1 = path.join(PUBLIC_DATA_DIR, 'Sem1 gegevens voor inlezen.csv');
const WEEK_PLANNING_CSV_PATH = path.join(PUBLIC_DATA_DIR, 'Weekplanning semesters.csv');

// Helper functie om maanden te mappen (hergebruikt uit csvParser.ts)
function getMonthNumber(monthStr) {
  const months = {
    'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4, 'juni': 6,
    'juli': 7, 'augustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
  };
  return months[monthStr.toLowerCase()] || 0;
}

// Helper functie om datumstrings (DD-MMM-YYYY) om te zetten naar Firestore Timestamp
function parseDateToTimestamp(dateStr) {
  if (!dateStr) return null; // Firestore accepteert null, niet undefined
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.warn(`Ongeldige datumformaat voor Timestamp conversie: ${dateStr}`);
    return null; // Of gooi een fout
  }
  const day = parseInt(parts[0]);
  const monthNum = getMonthNumber(parts[1]);
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(monthNum) || isNaN(year) || monthNum === 0) {
    console.warn(`Datum parseerfout voor Timestamp conversie: ${dateStr}`);
    return null;
  }

  const date = new Date(year, monthNum - 1, day); // Maanden zijn 0-indexed in Date object
  // Controleer op ongeldige datums (bijv. 31 februari)
  if (date.getFullYear() !== year || date.getMonth() !== monthNum - 1 || date.getDate() !== day) {
    console.warn(`Ongeldige datumwaarde na parsing voor Timestamp: ${dateStr}`);
    return null;
  }
  return admin.firestore.Timestamp.fromDate(date);
}

// Helper functie om datumstrings om te zetten (hergebruikt uit csvParser.ts)
// Deze functie is nu alleen voor het normaliseren van de jaar, nog niet voor de Timestamp conversie
function formatCsvDateForParsing(dateStr) {
  if (!dateStr) return '';
  let parsedDate = dateStr.trim();
  if (parsedDate && !parsedDate.includes('2025') && !parsedDate.includes('2026')) {
    const parts = parsedDate.split('-');
    if (parts.length === 2) {
      const day = parts[0];
      const monthPart = parts[1];
      const monthNum = getMonthNumber(monthPart);
      const year = (monthNum >= 8) ? 2025 : 2026;
      parsedDate = `${day}-${monthPart}-${year}`;
    }
  }
  return parsedDate;
}

// Functie om PlanningData te parsen (aangepast van src/utils/csvParser.ts)
async function parsePlanningData(csvFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const records = await new Promise((resolve, reject) => {
    parse(csvContent, { delimiter: ';', columns: false, from_line: 2 }, (err, records) => {
      if (err) reject(err);
      resolve(records);
    });
  });

  const items = [];
  for (const columns of records) {
    if (columns.length < 20 || !(columns[0] || '').trim() || (columns[0] || '').startsWith(';;;')) continue; // Skip header, empty or separator lines

    const item = {
      title: (columns[0] || '').trim() || '',
      description: (columns[1] || '').trim() || '',
      link: (columns[2] || '').trim() || null,
      startDate: parseDateToTimestamp(formatCsvDateForParsing(columns[12])),
      endDate: parseDateToTimestamp(formatCsvDateForParsing(columns[13])),
      startTime: (columns[14] || '').trim() || null,
      endTime: (columns[15] || '').trim() || null,
      deadline: (columns[16] || '').trim() || null,
      subjects: {
        waarderen: (columns[3] || '').trim() === 'v',
        juniorstage: (columns[4] || '').trim() === 'v',
        ipl: (columns[5] || '').trim() === 'v',
        bvp: (columns[6] || '').trim() === 'v',
        pzw: (columns[7] || '').trim() === 'v',
        minor: (columns[8] || '').trim() === 'v',
        getuigschriften: (columns[9] || '').trim() === 'v',
        inschrijven: (columns[10] || '').trim() === 'v',
        overig: (columns[11] || '').trim() === 'v'
      },
      phases: {
        p: (columns[18] || '').trim() === 'v',
        h1: (columns[19] || '').trim() === 'v',
        h2h3: (columns[20] || '').trim() === 'v'
      }
    };
    items.push(item);
  }
  return items;
}

// Functie om WeekData te parsen (aangepast van src/utils/csvParser.ts)
async function parseWeekData(csvFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, 'utf8');
  const records = await new Promise((resolve, reject) => {
    parse(csvContent, { delimiter: ';', columns: false, from_line: 1 }, (err, records) => {
      if (err) reject(err);
      resolve(records);
    });
  });

  const weeks = [];
  let currentSemester = 1;

  for (const columns of records) {
    const label = (columns[0] || '').trim();
    const dateStr = (columns[1] || '').trim();
    if (label === 'Semester 1') {
      currentSemester = 1;
      continue;
    }
    if (label === 'Semester 2') {
      currentSemester = 2;
      continue;
    }
    if (label && dateStr && label !== 'Weergave voor in app.' && label.trim() !== '') {
      const isVacation = label.toLowerCase().includes('vakantie') || label.toLowerCase().includes('afsluiting');
      const weekInfo = {
        weekCode: label.includes('.') ? label.split(' ')[0] : label,
        weekLabel: label,
        startDate: parseDateToTimestamp(formatCsvDateForParsing(dateStr)),
        semester: currentSemester,
        isVacation
      };
      weeks.push(weekInfo);
    }
  }
  return weeks;
}

// Functie om undefined properties uit een object te verwijderen
function removeUndefinedProperties(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefinedProperties(item));
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = removeUndefinedProperties(value);
      }
    }
  }
  return newObj;
}

// Functie om een Firestore collectie te legen
async function clearCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log(`Collectie ${collectionRef.id} geleegd.`);
}

// Hoofd Populier functie
async function populateFirestore() {
  console.log('Starten met het populeren van Firestore...');

  try {
    // Leeg bestaande collecties
    await clearCollection(db.collection('planningItems'));
    await clearCollection(db.collection('weeks'));

    // Planning items importeren
    if (fs.existsSync(PLANNING_CSV_PATH_SEM1)) {
      const planningDataSem1 = await parsePlanningData(PLANNING_CSV_PATH_SEM1);
      const planningBatch = db.batch();
      planningDataSem1.forEach(item => {
        const cleanedItem = removeUndefinedProperties(item); // Verwijder undefined properties

        // Controleer of startDate een geldig Timestamp is
        if (!(cleanedItem.startDate instanceof admin.firestore.Timestamp)) {
          console.warn(`Ongeldige of ontbrekende startDate voor item: ${cleanedItem.title}. Item wordt overgeslagen.`);
          return; // Sla dit item over
        }

        console.log("Cleaned Item before Firestore:");
        console.log(JSON.stringify(cleanedItem, null, 2));

        const docRef = db.collection('planningItems').doc(); // Genereer een unieke ID
        planningBatch.set(docRef, cleanedItem);
      });
      await planningBatch.commit();
      console.log(`Succesvol ${planningDataSem1.length} planning items (Semester 1) toegevoegd aan Firestore.`);
    } else {
      console.warn(`Waarschuwing: Bestand niet gevonden: ${PLANNING_CSV_PATH_SEM1}. Planning items voor Semester 1 niet geladen.`);
    }

    // Week data importeren
    if (fs.existsSync(WEEK_PLANNING_CSV_PATH)) {
      const weekData = await parseWeekData(WEEK_PLANNING_CSV_PATH);
      const weekBatch = db.batch();
      weekData.forEach(item => {
        // Controleer of startDate een geldig Timestamp is
        if (!(item.startDate instanceof admin.firestore.Timestamp)) {
          console.warn(`Ongeldige of ontbrekende startDate voor week: ${item.weekLabel}. Item wordt overgeslagen.`);
          return; // Sla dit item over
        }
        
        const docRef = db.collection('weeks').doc(); // Genereer een unieke ID
        weekBatch.set(docRef, item);
      });
      await weekBatch.commit();
      console.log(`Succesvol ${weekData.length} week items toegevoegd aan Firestore.`);
    } else {
      console.warn(`Waarschuwing: Bestand niet gevonden: ${WEEK_PLANNING_CSV_PATH}. Week items niet geladen.`);
    }

    console.log('Firestore populatie voltooid!');
  } catch (error) {
    console.error('Fout tijdens het populeren van Firestore:', error);
  }
}

populateFirestore(); 