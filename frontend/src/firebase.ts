// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, type Auth, type User } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Create a mock auth object that prevents crashes when Firebase is not configured
function createMockAuth(): Auth {
  return {
    onAuthStateChanged: (callback: (user: User | null) => void) => {
      callback(null);
      return () => {};
    },
    signOut: async () => {},
    currentUser: null
  } as Auth;
}

// Initialize Firebase with error handling
let auth: Auth;

try {
  // Check if we have a valid API key
  if (import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_API_KEY.trim() !== '') {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase configuration missing - authentication will be disabled');
    auth = createMockAuth();
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  auth = createMockAuth();
}

export { auth };
