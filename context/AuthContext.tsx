"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, provider } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInAnonymously, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  User 
} from "firebase/auth";

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Sirf DB se latest user data laata hai (XP/Streak NAHI badhata)
  const fetchDbUser = async (uid: string) => {
    try {
      const res = await fetch(`/api/users/${uid}`);
      const data = await res.json();
      if (data.success) {
        setDbUser(data.data);
      }
    } catch (error) {
      console.error("Fetch DB User Error:", error);
    }
  };

  // Sync + Create user in DB (sirf login/signup ke time chalta hai)
  const syncUserWithDB = async (firebaseUser: User) => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          name: firebaseUser.displayName || "Guest User",
          email: firebaseUser.email || `guest_${firebaseUser.uid}@swybe.com`,
          photoURL: firebaseUser.photoURL || "",
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setDbUser(data.data);
        
        // Streak/XP sirf ek baar yahan update hota hai (login/app-load ke time)
        const activityRes = await fetch('/api/users/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firebaseUid: firebaseUser.uid })
        });
        const activityData = await activityRes.json();
        if (activityData.success) setDbUser(activityData.data);
      } else {
        console.error("DB Sync Failed:", data.error);
      }
    } catch (error) {
      console.error("DB Sync Error:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncUserWithDB(firebaseUser);
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getToken = async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken();
    } catch (error) {
      console.error("Token fetch error:", error);
      return null;
    }
  };

  // FIX: Ab ye sirf fresh data fetch karta hai, XP/Streak badhाता NAHI
  // Isko follow/unfollow, edit-profile, quiz-answer jaise jagah use karo
  const refreshUser = async () => {
    if (user) await fetchDbUser(user.uid);
  };

  const loginWithGoogle = async () => {
    try { await signInWithPopup(auth, provider); } 
    catch (error) { console.error("Google Login Error:", error); throw error; }
  };

  const loginAsGuest = async () => {
    try { await signInAnonymously(auth); } 
    catch (error) { console.error("Guest Login Error:", error); throw error; }
  };

  const signupWithEmail = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      await syncUserWithDB(userCredential.user);
    } catch (error: any) {
      console.error("Signup Error:", error);
      throw new Error(error.message); 
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error("Login Error:", error);
      throw new Error(error.message); 
    }
  };

  const logout = async () => {
    try { await signOut(auth); setDbUser(null); } 
    catch (error) { console.error("Logout Error:", error); }
  };

  return (
    <AuthContext.Provider value={{ 
      user, dbUser, loading, loginWithGoogle, loginAsGuest, signupWithEmail, loginWithEmail, logout, refreshUser, getToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}