// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0UECgr9ugPAf72SkwSqrzsRIPZRrEaFo",
  authDomain: "terapiaconect-app.firebaseapp.com",
  projectId: "terapiaconect-app",
  storageBucket: "terapiaconect-app.appspot.com",
  messagingSenderId: "755414531272",
  appId: "1:755414531272:web:93a4ca9d8ee8faa8f66d88",
  measurementId: "G-BCREXTVL34"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 