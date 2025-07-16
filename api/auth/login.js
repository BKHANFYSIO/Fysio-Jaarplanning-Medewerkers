import jwt from 'jsonwebtoken';

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Methode niet toegestaan' });
  }

  const { username, password } = req.body;
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !JWT_SECRET) {
    return res.status(500).json({ message: 'Server configuratiefout: admin credentials of JWT secret ontbreken.' });
  }

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const user = { name: username };
    const accessToken = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).json({ message: 'Login succesvol', token: accessToken });
  } else {
    return res.status(401).json({ message: 'Ongeldige gebruikersnaam of wachtwoord' });
  }
}; 