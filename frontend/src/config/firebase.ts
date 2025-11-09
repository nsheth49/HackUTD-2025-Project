// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBfcjLOLlk66oX3lxGwK3uoI6OomIXtb6c",
  authDomain: "hackutd-2025-de096.firebaseapp.com",
  projectId: "hackutd-2025-de096",
  storageBucket: "hackutd-2025-de096.firebasestorage.app",
  messagingSenderId: "293973453167",
  appId: "1:293973453167:web:971d5aea8d94c9bec1609a",
  measurementId: "G-72KYFXN2BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Analytics (only in browser environment)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;

