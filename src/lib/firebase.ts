import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCQisrcK22Z6XHKqY3s9LejDHV1k7dw6s",
  authDomain: "hotel-scarton.firebaseapp.com",
  projectId: "hotel-scarton",
  storageBucket: "hotel-scarton.firebasestorage.app",
  messagingSenderId: "984024525291",
  appId: "1:984024525291:web:ea21cde7580e44d19b91ae",
  measurementId: "G-1VLMNRJD6B"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;