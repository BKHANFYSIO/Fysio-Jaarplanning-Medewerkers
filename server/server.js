require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const admin = require('firebase-admin');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify/sync');

// Initialize Firebase Admin SDK for local server
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error('Fout: FIREBASE_SERVICE_ACCOUNT_PATH is niet ingesteld of het bestand bestaat niet.');
  }
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Fout bij het initialiseren van Firebase Admin SDK:', error);
  process.exit(1);
}
const db = admin.firestore();

const app = express();
const PORT = 3000;

// CORS configuratie
const corsOptions = {
  origin: 'http://localhost:5173'
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// --- Helper Functies ---
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
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0]);
  const monthNum = getMonthNumber(parts[1]);
  const year = parseInt(parts[2]);
  if (isNaN(day) || isNaN(monthNum) || isNaN(year) || monthNum === 0) return null;
  const date = new Date(year, monthNum - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== monthNum - 1 || date.getDate() !== day) return null;
  return admin.firestore.Timestamp.fromDate(date);
}

function formatTimestampToDateString(timestamp) {
  if (!timestamp || !timestamp.toDate) return null;
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'][date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function removeUndefinedProperties(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => removeUndefinedProperties(item));
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

// --- Middleware ---
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Te veel inlogpogingen vanaf dit IP, probeer het over 15 minuten opnieuw.'
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.status(401).json({ message: 'Authenticatie token ontbreekt.' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Ongeldig of verlopen authenticatie token.' });
    req.user = user;
    next();
  });
};

// --- Routes ---
app.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const user = { name: username };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login succesvol', token: accessToken });
  } else {
    res.status(401).json({ message: 'Ongeldige gebruikersnaam of wachtwoord' });
  }
});

// GET data (publiek)
app.get('/api/data/:collectionName', async (req, res) => {
  const { collectionName } = req.params;
  try {
    const snapshot = await db.collection(collectionName).orderBy('startDate').get();
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      if (docData.startDate) docData.startDate = formatTimestampToDateString(docData.startDate);
      if (docData.endDate) docData.endDate = formatTimestampToDateString(docData.endDate);
      if (docData.deadline) docData.deadline = formatTimestampToDateString(docData.deadline);
      return { id: doc.id, ...docData };
    });
    res.status(200).json(data);
  } catch (error) {
    console.error(`Fout bij het ophalen van data uit collectie ${collectionName}:`, error);
    res.status(500).json({ message: `Fout bij het ophalen van data uit ${collectionName}` });
  }
});

// POST data (beveiligd)
app.post('/api/data/:collectionName', authenticateToken, async (req, res) => {
  const { collectionName } = req.params;
  let newItem = removeUndefinedProperties(req.body);
  if (collectionName === 'planningItems') {
    if (newItem.startDate) newItem.startDate = parseDateToTimestamp(newItem.startDate);
    if (newItem.endDate) newItem.endDate = parseDateToTimestamp(newItem.endDate);
    if (newItem.deadline) newItem.deadline = parseDateToTimestamp(newItem.deadline);
  } else if (collectionName === 'weeks') {
    if (newItem.startDate) newItem.startDate = parseDateToTimestamp(newItem.startDate);
  }
  try {
    const newDocRef = await db.collection(collectionName).add(newItem);
    res.status(201).json({ id: newDocRef.id, message: 'Document succesvol toegevoegd.' });
  } catch (error) {
    res.status(500).json({ message: 'Fout bij toevoegen van document.' });
  }
});

// PUT data (beveiligd)
app.put('/api/data/:collectionName/:id', authenticateToken, async (req, res) => {
  const { collectionName, id } = req.params;
  let updatedItem = removeUndefinedProperties(req.body);
  if (collectionName === 'planningItems') {
    if (updatedItem.startDate && typeof updatedItem.startDate === 'string') updatedItem.startDate = parseDateToTimestamp(updatedItem.startDate);
    if (updatedItem.endDate && typeof updatedItem.endDate === 'string') updatedItem.endDate = parseDateToTimestamp(updatedItem.endDate);
    if (updatedItem.deadline && typeof updatedItem.deadline === 'string') updatedItem.deadline = parseDateToTimestamp(updatedItem.deadline);
  } else if (collectionName === 'weeks') {
    if (updatedItem.startDate && typeof updatedItem.startDate === 'string') updatedItem.startDate = parseDateToTimestamp(updatedItem.startDate);
  }
  try {
    await db.collection(collectionName).doc(id).update(updatedItem);
    res.status(200).json({ id: id, message: 'Document succesvol bijgewerkt.' });
  } catch (error) {
    res.status(500).json({ message: 'Fout bij bijwerken van document.' });
  }
});

// DELETE data (beveiligd)
app.delete('/api/data/:collectionName/:id', authenticateToken, async (req, res) => {
  const { collectionName, id } = req.params;
  try {
    await db.collection(collectionName).doc(id).delete();
    res.status(200).json({ id: id, message: 'Document succesvol verwijderd.' });
  } catch (error) {
    res.status(500).json({ message: 'Fout bij verwijderen van document.' });
  }
});

// TODO: Implementeer /api/import-csv en /api/export-csv op een vergelijkbare manier

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
}); 