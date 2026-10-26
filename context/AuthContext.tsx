"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, provider } from "@/lib/firebase";
import { installAuthFetch } from "@/lib/authFetch";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
  signInAnonymously, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User 
} from "firebase/auth";

// Module load hote hi install ho jaye, taaki koi bhi component ki request token ke bina na jaye
if (typeof window !== "undefined") {
  installAuthFetch();
}

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  signupWithEmail: (name: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
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

  // Sync + Create user in DB (login/signup/app-load par chalta hai)
  const syncUserWithDB = async (firebaseUser: User) => {
    try {
      const res = await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: firebaseUser.displayName || "Guest User",
        }),
      });
      const data = await res.json();

      // Email conflict: is email se pehle se alag account hai aur email verified nahi hai
      if (res.status === 409) {
        alert(data.error);
        await signOut(auth);
        setDbUser(null);
        return;
      }
      
      if (data.success) {
        setDbUser(data.data);
        
        // Streak/XP: server din me sirf ek baar hi badhata hai
        const activityRes = await fetch('/api/users/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
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

  // Sirf fresh data fetch karta hai, XP/Streak nahi badhata
  const refreshUser = async () => {
    if (user) await fetchDbUser(user.uid);
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      // Popup block ho gaya (mobile / kuch browsers): redirect se try karo
      if (
        error?.code === "auth/popup-blocked" ||
        error?.code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, provider);
        return;
      }
      console.error("Google Login Error:", error);
      throw error;
    }
  };

  const loginAsGuest = async () => {
    try { await signInAnonymously(auth); } 
    catch (error) { console.error("Guest Login Error:", error); throw error; }
  };

  const signupWithEmail = async (name: string, email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });

      // Verification email (fail ho to signup nahi rukta)
      try { await sendEmailVerification(userCredential.user); } catch (error) { console.error("Verification email error:", error); }

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

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    try { await signOut(auth); setDbUser(null); } 
    catch (error) { console.error("Logout Error:", error); }
  };

  return (
    <AuthContext.Provider value={{ 
      user, dbUser, loading, loginWithGoogle, loginAsGuest, signupWithEmail, loginWithEmail, resetPassword, logout, refreshUser, getToken 
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