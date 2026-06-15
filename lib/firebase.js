import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPncl_JyCAqseh48kyhUFQa_ckkNie1gc",
  authDomain: "teacher-association.firebaseapp.com",
  projectId: "teacher-association",
  storageBucket: "teacher-association.firebasestorage.app",
  messagingSenderId: "612290403739",
  appId: "1:612290403739:web:42e94018e35cc0e228953e",
  measurementId: "G-1Y868K0FZ8"
};

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
