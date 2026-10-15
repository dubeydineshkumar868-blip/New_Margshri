import { initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIhHdQLY4187bNJyP6tPYFZoG9eOwaMmc",
  authDomain: "margshri.in", // login runs on margshri.in (proxied to Firebase via vercel.json)
  projectId: "margshri-ef82b",
  storageBucket: "margshri-ef82b.firebasestorage.app",
  messagingSenderId: "832248851426",
  appId: "1:832248851426:web:79df750c71956b1cb4e7bb",
};

const app = initializeApp(firebaseConfig);

// Speed: keep a copy of rides/requests on the phone, so the app shows them instantly
// when reopened and only downloads what changed. Falls back to normal mode if the
// browser doesn't allow it (e.g. some private/incognito windows).
let firestore;
try {
  firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  firestore = getFirestore(app);
}

export const db = firestore;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
