// Firebase Configuration and Initialization
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.apiKey !== 'AIzaSyD_PLACEHOLDER_GET_FROM_FIREBASE' &&
         firebaseConfig.projectId && 
         firebaseConfig.projectId !== 'your-project-id';
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

// Only initialize Firebase if properly configured
if (typeof window !== 'undefined' && isFirebaseConfigured()) {
  try {
    // Initialize Firebase (only if not already initialized)
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    
    // Initialize Firebase services
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.warn('⚠️ Firebase not configured. Please update .env.local with your Firebase credentials.');
  }
} else if (typeof window !== 'undefined') {
  console.warn('⚠️ Firebase not configured. Please update .env.local with your Firebase credentials.');
  console.info('Get your Firebase config from: https://console.firebase.google.com');
}

export { auth, db, googleProvider };
export default app;

