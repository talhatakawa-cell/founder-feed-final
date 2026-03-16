// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRO_Ln3DW6xyZBN7cH0NJACfFZlYoUQWs",
  authDomain: "founder-feed-2a95a.firebaseapp.com",
  projectId: "founder-feed-2a95a",
  storageBucket: "founder-feed-2a95a.firebasestorage.app",
  messagingSenderId: "394704779804",
  appId: "1:394704779804:web:22200ca4ba0fffff49fdd9",
  measurementId: "G-623CR1HEFX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);