import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Pehle config seedha code me tha. Ab pehle env variables dekhta hai, na mile to wahi purani values chalti hain,
// to deploy me kuch nahi tootega. Baad me Vercel me NEXT_PUBLIC_FIREBASE_* daal ke fallback hata sakte ho.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDsDCy3ZIlB5y2cTe6DcErAM4c4GQnJsKw",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "peertube-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "peertube-app",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "peertube-app.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "536229455386",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:536229455386:web:5682e265e84766750653a3",
};

// Next.js ke liye zaroori check (taaki baar-baar initialize na ho)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Har baar account chunne ka option (pehle ek hi Google account se apne aap login ho jaata tha)
provider.setCustomParameters({ prompt: "select_account" });

export { auth, provider };