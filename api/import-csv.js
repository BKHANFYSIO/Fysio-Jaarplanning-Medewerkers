import admin from '../firebaseAdmin.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { parse } from 'csv-parse';

const db = admin.firestore();

// Middleware wrapper (re-used for consistency)
const applyMiddleware = (handler, middleware) => async (req, res) => {
  // Vercel handles body parsing for multipart/form-data for functions
  middleware(req, res, () => handler(req, res));
};

// Helper functie om maanden te mappen (hergebruikt uit populateFirestore.js)
function getMonthNumber(monthStr) {
  const months = {
    'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4, 'juni': 6,
    'juli': 7, 'augustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
  };
  return months[monthStr.toLowerCase()] || 0;
}

// Helper functie om datumstrings (DD-MMM-YYYY) om te zetten naar Firestore Timestamp (hergebruikt)
function parseDateToTimestamp(dateStr) {
  if (!dateStr) return null; // Firestore accepteert null, niet undefined
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    // console.warn(`Ongeldige datumformaat voor Timestamp conversie: ${dateStr}`);
    return null;
  }
  const day = parseInt(parts[0]);
  const monthNum = getMonthNumber(parts[1]);
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(monthNum) || isNaN(year) || monthNum === 0) {
    // console.warn(`Datum parseerfout voor Timestamp conversie: ${dateStr}`);
    return null;
  }

  const date = new Date(year, monthNum - 1, day); // Maanden zijn 0-indexed in Date object
  if (date.getFullYear() !== year || date.getMonth() !== monthNum - 1 || date.getDate() !== day) {
    // console.warn(`Ongeldige datumwaarde na parsing voor Timestamp: ${dateStr}`);
    return null;
  }
  return admin.firestore.Timestamp.fromDate(date);
}

// Helper functie om datumstrings om te zetten (hergebruikt uit populateFirestore.js)
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

// Helper functie om objecten te filteren om ongedefinieerde eigenschappen te verwijderen (hergebruikt)
function removeUndefinedProperties(obj) {
  const newObj = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  }
  return newObj;
}

// Functie om PlanningData te parsen (aangepast van populateFirestore.js)
async function parsePlanningData(csvContent) {
  const records = await new Promise((resolve, reject) => {
    parse(csvContent, { delimiter: ';', columns: false, from_line: 2 }, (err, records) => {
      if (err) reject(err);
      resolve(records);
    });
  });

  const items = [];
  for (const columns of records) {
    if (columns.length < 20 || !(columns[0] || '').trim() || (columns[0] || '').startsWith(';;;')) continue;

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

// Functie om WeekData te parsen (hergebruikt uit populateFirestore.js)
async function parseWeekData(csvContent) {
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

// Functie om een Firestore collectie te legen (hergebruikt uit populateFirestore.js)
async function clearCollection(collectionRef) {
  const snapshot = await collectionRef.get();
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  await batch.commit();
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode niet toegestaan' });
  }

  const { collectionName, mode } = req.query; // 'mode' is 'merge' or 'overwrite'

  if (!collectionName || !['planningItems', 'weeks'].includes(collectionName)) {
    return res.status(400).json({ message: 'Ongeldige collectie naam.' });
  }
  if (!mode || !['merge', 'overwrite'].includes(mode)) {
    return res.status(400).json({ message: 'Ongeldige import modus. Kies \'merge\' of \'overwrite\'.' });
  }

  const file = req.body.file;
  let csvContent = '';

  if (typeof req.body === 'string') {
    csvContent = req.body;
  } else if (req.body.file && req.body.file.data) {
    csvContent = Buffer.from(req.body.file.data).toString('utf8');
  } else if (file && file.buffer) {
    csvContent = file.buffer.toString('utf8');
  } else {
    return res.status(400).json({ message: 'Geen CSV-inhoud gevonden in request body.' });
  }
  
  if (!csvContent) {
    return res.status(400).json({ message: 'Leeg CSV-bestand of onleesbare inhoud.' });
  }

  try {
    let parsedData = [];
    if (collectionName === 'planningItems') {
      parsedData = await parsePlanningData(csvContent);
    } else if (collectionName === 'weeks') {
      parsedData = await parseWeekData(csvContent);
    }

    if (mode === 'overwrite') {
      await clearCollection(db.collection(collectionName));
      console.log(`Collectie ${collectionName} geleegd voor overschrijven.`);
    }

    const batch = db.batch();
    for (const item of parsedData) {
      const cleanedItem = removeUndefinedProperties(item); // Zorg dat geen undefined waardes in de database komen
      if (mode === 'merge') {
        let docRef;
        if (collectionName === 'planningItems') {
          const existingDocs = await db.collection(collectionName)
            .where('title', '==', cleanedItem.title)
            .where('startDate', '==', cleanedItem.startDate)
            .limit(1).get();
          if (!existingDocs.empty) {
            docRef = existingDocs.docs[0].ref;
          } else {
            docRef = db.collection(collectionName).doc();
          }
        } else if (collectionName === 'weeks') {
          const existingDocs = await db.collection(collectionName)
            .where('weekCode', '==', cleanedItem.weekCode)
            .limit(1).get();
          if (!existingDocs.empty) {
            docRef = existingDocs.docs[0].ref;
          } else {
            docRef = db.collection(collectionName).doc();
          }
        }
        batch.set(docRef, cleanedItem, { merge: true }); // Gebruik merge:true om velden bij te werken zonder te overschrijven
      } else { // overwrite of als geen match in merge
        const docRef = db.collection(collectionName).doc(); // Genereer altijd een nieuwe ID bij overwrite of geen match
        batch.set(docRef, cleanedItem);
      }
    }
    await batch.commit();
    return res.status(200).json({ message: `Succesvol ${parsedData.length} items ${mode}gevoerd in collectie ${collectionName}.` });

  } catch (error) {
    console.error(`Fout bij import operatie voor collectie ${collectionName}:`, error);
    return res.status(500).json({ message: `Fout bij import operatie voor ${collectionName}: ${error.message}` });
  }
}

export default applyMiddleware(handler, authenticateToken); 