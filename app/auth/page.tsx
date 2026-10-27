"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { GraduationCap, UserCheck, Mail, Lock, User, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Copy } from "lucide-react";

type PendingMode = "login" | "signupChoice" | "guest" | null;

const friendlyError = (err: any): string => {
  const raw = String(err?.message || err?.code || "");
  if (raw.includes("auth/email-already-in-use")) return "Ye email pehle se registered hai. Neeche 'Log In' par click karo.";
  if (raw.includes("auth/invalid-credential") || raw.includes("auth/wrong-password") || raw.includes("auth/user-not-found")) return "Email ya password galat hai.";
  if (raw.includes("auth/too-many-requests")) return "Bahut zyada koshish ho gayi. Thodi der baad try karo.";
  if (raw.includes("auth/invalid-email")) return "Email sahi nahi hai.";
  if (raw.includes("auth/weak-password")) return "Password kam se kam 6 characters ka rakho.";
  if (raw.includes("auth/network-request-failed")) return "Network error. Internet check karo.";
  return raw.replace("Firebase: ", "") || "Kuch galat ho gaya. Dobara try karo.";
};

export default function AuthPage() {
  const router = useRouter();
  const {
    dbUser, loading: authLoading,
    loginWithGoogle, loginAsGuest, signupWithEmail, loginWithEmail, resetPassword,
  } = useAuth();

  const [role, setRole] = useState<"learner" | "master">("learner");
  const [isLogin, setIsLogin] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  // Login ke baad kahan bhejna hai, ye login shuru karne se PEHLE set hota hai
  // (pehle ye baad me set hota tha aur race ki wajah se kabhi-kabhi user auth page par hi atak jata tha)
  const pendingModeRef = useRef<PendingMode>(null);

  // Instagram / WhatsApp / Facebook jaise in-app browsers me Google login nahi chalta
  useEffect(() => {
    const ua = navigator.userAgent || "";
    setInAppBrowser(/FBAN|FBAV|Instagram|Line\/|MicroMessenger|Snapchat|Twitter|WhatsApp|; wv\)/i.test(ua));
  }, []);

  // Jaise hi DB user ready ho: profile complete => home, warna sahi onboarding.
  // Pehle se logged-in user /auth khole to bhi yahi chalta hai (login form dobara nahi dikhta).
  useEffect(() => {
    if (authLoading || !dbUser) return;

    const mode = pendingModeRef.current;
    pendingModeRef.current = null;

    if (dbUser.isProfileComplete) {
      router.replace("/");
      return;
    }

    if (mode === "signupChoice") {
      router.replace(role === "master" ? "/onboarding/creator" : "/onboarding/learner");
    } else if (mode === "guest") {
      router.replace("/onboarding/learner");
    } else {
      router.replace("/onboarding");
    }
  }, [dbUser, authLoading, router, role]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (isLogin) {
        pendingModeRef.current = "login";
        await loginWithEmail(formData.email.trim(), formData.password);
      } else {
        if (!formData.name.trim()) throw new Error("Please enter your full name.");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters.");
        pendingModeRef.current = "signupChoice";
        await signupWithEmail(formData.name.trim(), formData.email.trim(), formData.password);
      }
    } catch (err: any) {
      pendingModeRef.current = null;
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    pendingModeRef.current = isLogin ? "login" : "signupChoice";
    try {
      await loginWithGoogle();
    } catch (err: any) {
      pendingModeRef.current = null;
      // User ne khud popup band kiya to error dikhane ki zarurat nahi
      if (err?.code !== "auth/popup-closed-by-user" && err?.code !== "auth/cancelled-popup-request") {
        setError(inAppBrowser
          ? "Is in-app browser me Google login nahi chalta. Link copy karke Chrome/Safari me kholo."
          : "Google login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    pendingModeRef.current = "guest";
    try {
      await loginAsGuest();
    } catch (err: any) {
      pendingModeRef.current = null;
      setError("Guest login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!formData.email.trim()) {
      setError("Pehle apna email likho.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(formData.email.trim());
      setInfo("Agar ye email registered hai to password reset ka link bhej diya gaya hai. Inbox (aur spam) check karo.");
    } catch (err: any) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert(window.location.href);
    }
  };

  // Login ho chuka hai ya check ho raha hai: form ki jagah spinner (redirect abhi hoga)
  if (authLoading || dbUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const inputClass = "w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-blue-500 transition text-black dark:text-white";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-zinc-800">
        
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-black dark:text-white tracking-tight">Swybe</Link>
          <p className="text-sm text-gray-500 mt-2">
            {resetMode ? "Apna email daalo, hum reset link bhejenge." : isLogin ? "Welcome back! Log in to continue." : "Create your account to start learning."}
          </p>
        </div>

        {inAppBrowser && (
          <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-medium mb-2">Aap Instagram/WhatsApp jaise app ke andar ho. Yahan Google login nahi chalta.</p>
            <button type="button" onClick={copyLink} className="flex items-center gap-2 font-semibold underline">
              <Copy className="w-4 h-4" /> {copied ? "Link copy ho gaya! Ab Chrome/Safari me kholo" : "Link copy karo aur Chrome/Safari me kholo"}
            </button>
          </div>
        )}

        {!isLogin && !resetMode && (
          <div className="flex gap-3 mb-8">
            <button
              type="button"
              onClick={() => setRole("learner")}
              className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                role === "learner" 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                  : "border-gray-200 dark:border-zinc-700 text-gray-500"
              }`}
            >
              <GraduationCap className="w-6 h-6" />
              <span className="font-semibold text-sm">Learner</span>
            </button>
            
            <button
              type="button"
              onClick={() => setRole("master")}
              className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                role === "master" 
                  ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" 
                  : "border-gray-200 dark:border-zinc-700 text-gray-500"
              }`}
            >
              <UserCheck className="w-6 h-6" />
              <span className="font-semibold text-sm">Master</span>
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {info && (
          <div className="mb-6 p-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-400 font-medium">{info}</p>
          </div>
        )}

        {resetMode ? (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={inputClass}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
            </button>
            <button type="button" onClick={() => { setResetMode(false); setError(null); setInfo(null); }} className="text-sm text-blue-500 font-semibold hover:underline">
              Back to Log In
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
              {!isLogin && (
                <div className="relative">
                  <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required={!isLogin}
                    maxLength={50}
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className={inputClass}
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={inputClass}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password" 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`${inputClass} pr-12`}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {isLogin && (
                <button type="button" onClick={() => { setResetMode(true); setError(null); setInfo(null); }} className="text-xs text-blue-500 font-semibold hover:underline self-end -mt-2">
                  Forgot password?
                </button>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition mt-2 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Log In" : "Sign Up")}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-700"></div>
              <span className="text-xs text-gray-400 font-medium uppercase">or continue with</span>
              <div className="h-[1px] flex-1 bg-gray-200 dark:bg-zinc-700"></div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-black dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition disabled:opacity-70"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Google
              </button>
              
              <button 
                type="button"
                onClick={handleGuestLogin}
                disabled={loading}
                className="w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition disabled:opacity-70"
              >
                Guest Mode
              </button>
              <p className="text-[11px] text-gray-400 text-center -mt-1">Guest mode me comment, follow, story aur XP nahi milta.</p>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={() => { setIsLogin(!isLogin); setError(null); setInfo(null); }} 
                className="text-blue-500 font-semibold hover:underline"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </p>
          </>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-6 leading-relaxed">
          By continuing, you agree to our{" "}
          <Link href="/terms" target="_blank" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms of Use</Link>{" "}and{" "}
          <Link href="/privacy" target="_blank" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</Link>.
          If you are under 18, please use Swybe with a parent or guardian&apos;s permission.
        </p>
        <p className="text-[11px] text-gray-400 text-center mt-2">Created by Chota Startup</p>

      </div>
    </div>
  );
}