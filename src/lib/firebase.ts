// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  "projectId": "sahayak-ai-teaching-assi-mo174",
  "appId": "1:258415528074:web:5d8aecd79e768ef8fa4573",
  "storageBucket": "sahayak-ai-teaching-assi-mo174.firebasestorage.app",
  "apiKey": "AIzaSyAwSa3mrujlQqdcqUu8wWXDbxYi-GnMQH0",
  "authDomain": "sahayak-ai-teaching-assi-mo174.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "258415528074"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
