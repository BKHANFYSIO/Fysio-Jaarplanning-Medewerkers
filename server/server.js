require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer'); // Voor het afhandelen van bestandsuploads
const path = require('path'); // Toegevoegd voor padmanipulatie
const fs = require('fs');   // Toegevoegd voor bestandsbewerkingen
const jwt = require('jsonwebtoken'); // Toegevoegd voor JWT
const rateLimit = require('express-rate-limit'); // Toegevoegd voor rate limiting

const app = express();
const PORT = 3000; // Poort voor de backend server
const JWT_SECRET = process.env.JWT_SECRET; // Haal JWT Secret op uit .env

// Zorg ervoor dat JWT_SECRET is ingesteld
if (!JWT_SECRET) {
  console.error('Fout: JWT_SECRET is niet ingesteld in de .env-variabelen.');
  process.exit(1);
}

// Mappen voor uploads en configuratie
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const CONFIG_DIR = path.join(__dirname, 'config');
const DATA_VERSIONS_FILE = path.join(CONFIG_DIR, 'data_versions.json');

// Zorg ervoor dat de mappen bestaan
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(CONFIG_DIR)) fs.mkdirSync(CONFIG_DIR);

// Multer configuratie voor bestandsuploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const originalname = file.originalname.replace(/\s/g, '_'); // spaties vervangen door underscores
    const extension = path.extname(originalname);
    const basename = path.basename(originalname, extension);
    cb(null, `${basename}_${timestamp}${extension}`);
  }
});
const upload = multer({ storage: storage });

// Helper functies voor data_versions.json
const readDataVersions = () => {
  if (!fs.existsSync(DATA_VERSIONS_FILE)) {
    // Als het bestand niet bestaat, initialiseren we het met een lege structuur
    return {
      planning_sem1: { active: null, versions: [] },
      planning_sem2: { active: null, versions: [] },
      week_planning: { active: null, versions: [] }
    };
  }
  const data = fs.readFileSync(DATA_VERSIONS_FILE, 'utf8');
  return JSON.parse(data);
};

const writeDataVersions = (data) => {
  fs.writeFileSync(DATA_VERSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
};

// Middleware
app.use(cors()); // Maakt cross-origin requests mogelijk
app.use(bodyParser.json()); // Ondersteuning voor JSON-gecodeerde bodies
app.use(bodyParser.urlencoded({ extended: true })); // Ondersteuning voor URL-gecodeerde bodies

// Rate limiting voor login pogingen (max 5 pogingen per 15 minuten)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuten
  max: 5, // Maximaal 5 verzoeken per IP in 15 minuten
  message: 'Te veel inlogpogingen vanaf dit IP, probeer het over 15 minuten opnieuw.'
});

// Middleware voor token verificatie
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ message: 'Authenticatie token ontbreekt.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Ongeldig of verlopen authenticatie token.' });
    req.user = user; // Voeg de gebruiker informatie toe aan het request object
    next();
  });
};

// Basis route om te testen of de server werkt
app.get('/', (req, res) => {
  res.send('Backend server draait!');
});

app.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Genereer een JWT
    const user = { name: username }; // Hier kun je meer gebruikersinfo toevoegen indien nodig
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' }); // Token verloopt na 1 uur
    res.json({ message: 'Login succesvol', token: accessToken });
  } else {
    res.status(401).json({ message: 'Ongeldige gebruikersnaam of wachtwoord' });
  }
});

// Pas authenticatie middleware toe op alle admin gerelateerde routes
app.post('/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Geen bestand geüpload.' });
  }

  const { filetype } = req.body; // Verwacht filetype (e.g., 'planning_sem1', 'week_planning')
  const uploadedFilename = req.file.filename;
  const dataVersions = readDataVersions();

  if (dataVersions[filetype]) {
    // Voeg nieuwe versie toe
    dataVersions[filetype].versions.push({
      filename: uploadedFilename,
      uploaded_at: new Date().toISOString()
    });
    // Stel de nieuwe upload in als de actieve versie
    dataVersions[filetype].active = uploadedFilename;
    writeDataVersions(dataVersions);

    res.json({ message: `Bestand ${filetype} succesvol geüpload en geactiveerd.`, filename: uploadedFilename });
  } else {
    // Verwijder het geüploade bestand als het bestandstype ongeldig is
    fs.unlinkSync(path.join(UPLOADS_DIR, uploadedFilename));
    return res.status(400).json({ message: 'Ongeldig bestandstype opgegeven.' });
  }
});

app.get('/download/:filename', authenticateToken, (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(UPLOADS_DIR, filename);

  // Controleer of het bestand bestaat
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error('Fout bij het downloaden van bestand:', err);
        res.status(500).json({ message: 'Fout bij het downloaden van bestand.' });
      }
    });
  } else {
    res.status(404).json({ message: 'Bestand niet gevonden.' });
  }
});

app.get('/files', authenticateToken, (req, res) => {
  try {
    const dataVersions = readDataVersions();
    res.json(dataVersions);
  } catch (error) {
    console.error('Fout bij het ophalen van bestandsversies:', error);
    res.status(500).json({ message: 'Fout bij het ophalen van bestandsversies.' });
  }
});

app.post('/activate-version', authenticateToken, (req, res) => {
  const { filetype, filename } = req.body;
  const dataVersions = readDataVersions();

  if (!dataVersions[filetype]) {
    return res.status(400).json({ message: 'Ongeldig bestandstype.' });
  }

  const versionExists = dataVersions[filetype].versions.some(v => v.filename === filename);

  if (versionExists) {
    dataVersions[filetype].active = filename;
    writeDataVersions(dataVersions);
    res.json({ message: `Versie ${filename} geactiveerd voor ${filetype}.` });
  } else {
    res.status(404).json({ message: `Versie ${filename} niet gevonden voor ${filetype}.` });
  }
});

app.get('/api/data/:filetype', (req, res) => {
  const filetype = req.params.filetype;
  const dataVersions = readDataVersions();

  if (!dataVersions[filetype] || !dataVersions[filetype].active) {
    return res.status(404).json({ message: `Geen actief bestand gevonden voor bestandstype: ${filetype}.` });
  }

  const activeFilename = dataVersions[filetype].active;
  const filePath = path.join(UPLOADS_DIR, activeFilename);

  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    res.set('Content-Type', 'text/csv'); // Zorg ervoor dat de browser het als CSV behandelt
    res.send(fileContent);
  } else {
    res.status(404).json({ message: `Actief bestand niet gevonden op de server: ${activeFilename}.` });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
}); 