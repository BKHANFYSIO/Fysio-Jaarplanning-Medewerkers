import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ message: 'Authenticatie token ontbreekt.' });
  }

  // JWT_SECRET moet beschikbaar zijn als Vercel omgevingsvariabele
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    console.error('Fout: JWT_SECRET is niet ingesteld in de omgevingsvariabelen.');
    return res.status(500).json({ message: 'Server configuratiefout.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Ongeldig of verlopen authenticatie token.' });
    }
    req.user = user; // Voeg de gebruiker informatie toe aan het request object
    next();
  });
}; 