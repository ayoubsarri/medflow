// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1dIsNoJGxF7yA87uJ8qY-sR8I27biTAI",
  authDomain: "medflow-28c18.firebaseapp.com",
  projectId: "medflow-28c18",
  storageBucket: "medflow-28c18.firebasestorage.app",
  messagingSenderId: "851596041687",
  appId: "1:851596041687:web:b0650a4165daa318447f92",
  measurementId: "G-XGPLR4BRZN"
};

// Initialize Firebase
let app;
let analytics;

if (typeof window !== "undefined") {
  // Only initialize on the client side
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  analytics = getAnalytics(app);
}

export { app, analytics };
