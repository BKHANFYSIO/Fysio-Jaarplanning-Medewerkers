import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Firebase Remote Config is now handled by firebase-blocker.ts
// This function is kept for backward compatibility but is no longer needed
const disableFirebaseRemoteConfig = () => {
  // Firebase Remote Config blocking is now handled by firebase-blocker.ts
  // which runs before any Firebase initialization
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // Disable Firebase services that use IndexedDB
  measurementId: undefined, // Disable Analytics
  appCheck: {
    provider: 'debug', // Use debug provider instead of production
  },
};

// Disable Firebase Remote Config before initialization
disableFirebaseRemoteConfig();

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with error handling
let db: any;
try {
  db = getFirestore(app);
  
  // Add error handling for IndexedDB issues
  if (typeof window !== 'undefined') {
    // Check if IndexedDB is available
    if (!window.indexedDB) {
      console.warn('IndexedDB is not available in this browser');
    }
  }
} catch (error) {
  console.error('Failed to initialize Firestore:', error);
  // Fallback: create a mock db object
  db = {
    collection: () => ({
      getDocs: async () => ({ docs: [] }),
      addDoc: async () => ({ id: 'mock-id' }),
      updateDoc: async () => {},
      deleteDoc: async () => {},
    }),
  };
}

export { db };
