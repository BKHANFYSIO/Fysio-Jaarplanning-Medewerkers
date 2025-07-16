import admin from '../firebaseAdmin.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { stringify } from 'csv-stringify/sync';

const db = admin.firestore();

// Middleware wrapper (re-used for consistency)
const applyMiddleware = (handler, middleware) => async (req, res) => {
  middleware(req, res, () => handler(req, res));
};

// Helper functies (hergebruikt uit populateFirestore.js)
function getMonthNumber(monthStr) {
  const months = {
    'jan': 1, 'feb': 2, 'mrt': 3, 'apr': 4, 'mei': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'dec': 12,
    'januari': 1, 'februari': 2, 'maart': 3, 'april': 4, 'juni': 6,
    'juli': 7, 'augustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'december': 12
  };
  return months[monthStr.toLowerCase()] || 0;
}

function formatTimestampToDateString(timestamp) {
  if (!timestamp || !timestamp.toDate) return null; // Controleer of het een Firestore Timestamp is
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Methode niet toegestaan' });
  }

  const { collectionName } = req.query;

  if (!collectionName) {
    return res.status(400).json({ message: 'Collectie naam ontbreekt.' });
  }

  try {
    const snapshot = await db.collection(collectionName).get();
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      // Converteer Timestamps terug naar string-datums voor de CSV
      if (docData.startDate && docData.startDate.toDate) docData.startDate = formatTimestampToDateString(docData.startDate);
      if (docData.endDate && docData.endDate.toDate) docData.endDate = formatTimestampToDateString(docData.endDate);
      if (docData.deadline && docData.deadline.toDate) docData.deadline = formatTimestampToDateString(docData.deadline);
      
      // Speciale behandeling voor booleans in subjects en phases: zet ze om naar 'v' of leeg
      if (docData.subjects) {
        for (const key in docData.subjects) {
          if (typeof docData.subjects[key] === 'boolean') {
            docData.subjects[key] = docData.subjects[key] ? 'v' : '';
          }
        }
      }
      if (docData.phases) {
        for (const key in docData.phases) {
          if (typeof docData.phases[key] === 'boolean') {
            docData.phases[key] = docData.phases[key] ? 'v' : '';
          }
        }
      }
      
      return { id: doc.id, ...docData };
    });

    if (data.length === 0) {
      return res.status(200).send('Geen data gevonden om te exporteren.');
    }

    // Headers voor CSV-conversie
    let columns = [];
    if (collectionName === 'planningItems') {
      // Definieer de kolommen en hun mappings voor PlanningItem
      columns = [
        { key: 'title', header: 'title' },
        { key: 'description', header: 'description' },
        { key: 'link', header: 'link' },
        { key: 'startDate', header: 'startDate' },
        { key: 'endDate', header: 'endDate' },
        { key: 'startTime', header: 'startTime' },
        { key: 'endTime', header: 'endTime' },
        { key: 'deadline', header: 'deadline' },
        // Subjects
        { key: 'subjects.waarderen', header: 'waarderen' },
        { key: 'subjects.juniorstage', header: 'juniorstage' },
        { key: 'subjects.ipl', header: 'ipl' },
        { key: 'subjects.bvp', header: 'bvp' },
        { key: 'subjects.pzw', header: 'pzw' },
        { key: 'subjects.minor', header: 'minor' },
        { key: 'subjects.getuigschriften', header: 'getuigschriften' },
        { key: 'subjects.inschrijven', header: 'inschrijven' },
        { key: 'subjects.overig', header: 'overig' },
        // Phases
        { key: 'phases.p', header: 'p' },
        { key: 'phases.h1', header: 'h1' },
        { key: 'phases.h2h3', header: 'h2h3' }
      ];
    } else if (collectionName === 'weeks') {
      // Definieer de kolommen en hun mappings voor WeekInfo
      columns = [
        { key: 'weekCode', header: 'weekCode' },
        { key: 'weekLabel', header: 'weekLabel' },
        { key: 'startDate', header: 'startDate' },
        { key: 'semester', header: 'semester' },
        { key: 'isVacation', header: 'isVacation' }
      ];
    } else {
      // Als de collectie onbekend is, gebruik alle top-level keys
      columns = Object.keys(data[0]).map(key => ({ key: key, header: key }));
    }

    // Functie om geneste objecten te flattenen voor CSV
    const flattenData = (item) => {
      const flatItem = {};
      for (const col of columns) {
        const keys = col.key.split('.');
        let value = item;
        for (let i = 0; i < keys.length; i++) {
          if (value && typeof value === 'object' && keys[i] in value) {
            value = value[keys[i]];
          } else {
            value = ''; // Zet undefined/null om naar lege string voor CSV
            break;
          }
        }
        flatItem[col.key] = value;
      }
      return flatItem;
    };

    const flatData = data.map(item => flattenData(item));
    const csvString = stringify(flatData, { header: true, columns: columns, delimiter: ';' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${collectionName}_export_${new Date().toISOString().slice(0,10)}.csv`);
    return res.status(200).send(csvString);

  } catch (error) {
    console.error(`Fout bij het exporteren van data uit collectie ${collectionName}:`, error);
    return res.status(500).json({ message: `Fout bij het exporteren van data uit ${collectionName}` });
  }
}

export default applyMiddleware(handler, authenticateToken); 