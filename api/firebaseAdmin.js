import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (!serviceAccountBase64) {
    console.error('Fout: FIREBASE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
    throw new Error('Firebase Admin SDK credentials not found.');
  }

  try {
    const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Failed to parse Firebase service account JSON:', error);
    throw new Error('Invalid Firebase Admin SDK credentials.');
  }
}

export default admin; 