// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC34EYcGSNQZdcvodDEUBipP1v2Qei_hGY",
  authDomain: "webhook-monitor-e835f.firebaseapp.com",
  projectId: "webhook-monitor-e835f",
  storageBucket: "webhook-monitor-e835f.appspot.com",
  messagingSenderId: "798006979132",
  appId: "1:798006979132:web:91ad1b96b80715db28f139",
  measurementId: "G-FJ77HL8PEL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
