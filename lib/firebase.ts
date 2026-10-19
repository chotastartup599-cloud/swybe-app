import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Tumhara purana config
const firebaseConfig = {
  apiKey: "AIzaSyDsDCy3ZIlB5y2cTe6DcErAM4c4GQnJsKw",
  authDomain: "peertube-app.firebaseapp.com",
  projectId: "peertube-app",
  storageBucket: "peertube-app.firebasestorage.app",
  messagingSenderId: "536229455386",
  appId: "1:536229455386:web:5682e265e84766750653a3"
};

// Next.js ke liye zaroori check (taaki baar-baar initialize na ho)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };