import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBRO_Ln3DW6xyzBN7cH0NJACFFZLYoUQWs",
  authDomain: "founder-feed-2a95a.firebaseapp.com",
  projectId: "founder-feed-2a95a",
  storageBucket: "founder-feed-2a95a.firebasestorage.app", // IMPORTANT
  messagingSenderId: "394704779804",
  appId: "1:394704779804:web:eb4b64b4ca78b0f749fdd9",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);