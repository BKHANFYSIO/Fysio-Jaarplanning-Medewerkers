import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0WZqpVt4zR-6aMqVjspiBv5T4yJSp5WM",
  authDomain: "jaarplanning2526.firebaseapp.com",
  projectId: "jaarplanning2526",
  storageBucket: "jaarplanning2526.firebasestorage.app",
  messagingSenderId: "272834696881",
  appId: "1:272834696881:web:b16cdb4aa2a91e24dc3490",
  measurementId: "G-9QZVFMYZT0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db }; 