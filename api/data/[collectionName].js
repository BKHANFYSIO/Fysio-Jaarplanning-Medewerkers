import admin from '../firebaseAdmin.js';
import jwt from 'jsonwebtoken'; // Importeer jwt voor directe verificatie

const db = admin.firestore();

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

function parseDateToTimestamp(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return null;
  }
  const day = parseInt(parts[0]);
  const monthNum = getMonthNumber(parts[1]);
  const year = parseInt(parts[2]);

  if (isNaN(day) || isNaN(monthNum) || isNaN(year) || monthNum === 0) {
    return null;
  }

  const date = new Date(year, monthNum - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthNum - 1 || date.getDate() !== day) {
    return null;
  }
  return admin.firestore.Timestamp.fromDate(date);
}

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

// Nieuwe helper functie: Firestore Timestamp naar DD-MMM-YYYY string
function formatTimestampToDateString(timestamp) {
  if (!timestamp || !timestamp.toDate) return null; // Controleer of het een Firestore Timestamp is
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

async function handler(req, res) {
  const { collectionName } = req.query;
  const { id } = req.query; // Voor PUT/DELETE operaties

  if (!collectionName) {
    return res.status(400).json({ message: 'Collectie naam ontbreekt.' });
  }

  // Authenticatiecheck voor POST, PUT, DELETE
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.status(401).json({ message: 'Authenticatie token ontbreekt.' });

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error('Fout: JWT_SECRET is niet ingesteld in de omgevingsvariabelen.');
      return res.status(500).json({ message: 'Server configuratiefout.' });
    }

    try {
      req.user = jwt.verify(token, JWT_SECRET); // Gebruiker info toevoegen aan request
    } catch (err) {
      return res.status(403).json({ message: 'Ongeldig of verlopen authenticatie token.' });
    }
  }

  try {
    switch (req.method) {
      case 'GET':
        const snapshot = await db.collection(collectionName).orderBy('startDate').get(); // orderBy('startDate') hersteld
        const data = snapshot.docs.map(doc => {
          const docData = doc.data();
          // Converteer Timestamps terug naar string-datums voor de frontend
          if (docData.startDate && docData.startDate.toDate) docData.startDate = formatTimestampToDateString(docData.startDate);
          if (docData.endDate && docData.endDate.toDate) docData.endDate = formatTimestampToDateString(docData.endDate);
          if (docData.deadline && docData.deadline.toDate) docData.deadline = formatTimestampToDateString(docData.deadline);
          return {
            id: doc.id,
            ...docData
          };
        });
        return res.status(200).json(data);

      case 'POST':
        if (!req.body) {
          return res.status(400).json({ message: 'Geen data opgegeven om toe te voegen.' });
        }
        let newItem = removeUndefinedProperties(req.body);
        // Datumconversie voor PlanningItem
        if (collectionName === 'planningItems') {
          if (newItem.startDate) newItem.startDate = parseDateToTimestamp(newItem.startDate);
          if (newItem.endDate) newItem.endDate = parseDateToTimestamp(newItem.endDate);
          if (newItem.deadline) newItem.deadline = parseDateToTimestamp(newItem.deadline);
        } else if (collectionName === 'weeks') {
          // Datumconversie voor WeekInfo
          if (newItem.startDate) newItem.startDate = parseDateToTimestamp(newItem.startDate);
        }

        const newDocRef = await db.collection(collectionName).add(newItem);
        return res.status(201).json({ id: newDocRef.id, message: 'Document succesvol toegevoegd.' });

      case 'PUT':
        if (!id) {
          return res.status(400).json({ message: 'Document ID ontbreekt voor update.' });
        }
        if (!req.body) {
          return res.status(400).json({ message: 'Geen data opgegeven om bij te werken.' });
        }
        let updatedItem = removeUndefinedProperties(req.body);
        // Datumconversie voor PlanningItem
        if (collectionName === 'planningItems') {
          if (updatedItem.startDate && typeof updatedItem.startDate === 'string') updatedItem.startDate = parseDateToTimestamp(updatedItem.startDate);
          if (updatedItem.endDate && typeof updatedItem.endDate === 'string') updatedItem.endDate = parseDateToTimestamp(updatedItem.endDate);
          if (updatedItem.deadline && typeof updatedItem.deadline === 'string') updatedItem.deadline = parseDateToTimestamp(updatedItem.deadline);
        } else if (collectionName === 'weeks') {
          // Datumconversie voor WeekInfo
          if (updatedItem.startDate && typeof updatedItem.startDate === 'string') updatedItem.startDate = parseDateToTimestamp(updatedItem.startDate);
        }

        await db.collection(collectionName).doc(id).update(updatedItem);
        return res.status(200).json({ id: id, message: 'Document succesvol bijgewerkt.' });

      case 'DELETE':
        if (!id) {
          return res.status(400).json({ message: 'Document ID ontbreekt voor verwijdering.' });
        }
        await db.collection(collectionName).doc(id).delete();
        return res.status(200).json({ id: id, message: 'Document succesvol verwijderd.' });

      default:
        return res.status(405).json({ message: 'Methode niet toegestaan' });
    }
  } catch (error) {
    console.error(`Fout bij database operatie op collectie ${collectionName}:`, error);
    return res.status(500).json({ message: `Fout bij database operatie op ${collectionName}` });
  }
}

export default handler; 