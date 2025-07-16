import admin from '../firebaseAdmin.js';
import { authenticateToken } from '../middleware/authenticate.js';
import { stringify } from 'csv-stringify/sync';

const db = admin.firestore();

// Middleware wrapper for serverless functions
const applyMiddleware = (handler, middleware) => async (req, res) => {
  middleware(req, res, () => handler(req, res));
};

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
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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
        { key: 'subjects.waarderen', header: 'subjects.waarderen' },
        { key: 'subjects.juniorstage', header: 'subjects.juniorstage' },
        { key: 'subjects.ipl', header: 'subjects.ipl' },
        { key: 'subjects.bvp', header: 'subjects.bvp' },
        { key: 'subjects.pzw', header: 'subjects.pzw' },
        { key: 'subjects.minor', header: 'subjects.minor' },
        { key: 'subjects.getuigschriften', header: 'subjects.getuigschriften' },
        { key: 'subjects.inschrijven', header: 'subjects.inschrijven' },
        { key: 'subjects.overig', header: 'subjects.overig' },
        // Phases
        { key: 'phases.p', header: 'phases.p' },
        { key: 'phases.h1', header: 'phases.h1' },
        { key: 'phases.h2h3', header: 'phases.h2h3' }
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