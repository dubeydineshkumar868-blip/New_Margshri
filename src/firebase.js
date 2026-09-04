import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIhHdQLY4187bNJyP6tPYFZoG9eOwaMmc",
  authDomain: "margshri-ef82b.firebaseapp.com",
  projectId: "margshri-ef82b",
  storageBucket: "margshri-ef82b.firebasestorage.app",
  messagingSenderId: "832248851426",
  appId: "1:832248851426:web:79df750c71956b1cb4e7bb",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
