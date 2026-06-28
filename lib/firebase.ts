// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, get, child, update, remove, push, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB0pPYdfdbl8MViEA-BWHLtMxDPRU22VRo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "project-ce803549-3eb9-46a9-931.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://project-ce803549-3eb9-46a9-931-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "project-ce803549-3eb9-46a9-931",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "project-ce803549-3eb9-46a9-931.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "272597182388",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:272597182388:web:d4fb7a2c66ad69100c34e1"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const database = getDatabase(app);

// Export everything
export { 
    app, 
    auth, 
    database,
    ref, 
    set, 
    get, 
    child, 
    update, 
    remove, 
    push, 
    onValue 
};