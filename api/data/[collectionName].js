import admin from '../firebaseAdmin.js';
import jwt from 'jsonwebtoken'; // Importeer jwt voor directe verificatie

const db = admin.firestore();

// Verwijdert de applyMiddleware wrapper hier, authenticatie wordt nu in de handler beheerd
// const applyMiddleware = (handler, middleware) => async (req, res) => {
//   if (req.method === 'PUT' || req.method === 'POST') {
//     if (!req.body) {
//       let body = '';
//       for await (const chunk of req) {
//         body += chunk;
//       }
//       try {
//         req.body = JSON.parse(body);
//       } catch (e) {
//         return res.status(400).json({ message: 'Ongeldige JSON in de request body.' });
//       }
//     }
//   }
//   middleware(req, res, () => handler(req, res));
// };

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
        const snapshot = await db.collection(collectionName).orderBy('startDate').get();
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return res.status(200).json(data);

      case 'POST':
        if (!req.body) {
          return res.status(400).json({ message: 'Geen data opgegeven om toe te voegen.' });
        }
        const newDocRef = await db.collection(collectionName).add(req.body);
        return res.status(201).json({ id: newDocRef.id, message: 'Document succesvol toegevoegd.' });

      case 'PUT':
        if (!id) {
          return res.status(400).json({ message: 'Document ID ontbreekt voor update.' });
        }
        if (!req.body) {
          return res.status(400).json({ message: 'Geen data opgegeven om bij te werken.' });
        }
        await db.collection(collectionName).doc(id).update(req.body);
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

export default handler; // Exporteer de handler direct, zonder algemene authenticatie 