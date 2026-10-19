"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { GraduationCap, UserCheck, Mail, Lock, User, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();
  const { loginWithGoogle, loginAsGuest, signupWithEmail, loginWithEmail } = useAuth();
  
  const [role, setRole] = useState<"learner" | "master">("learner");
  const [isLogin, setIsLogin] = useState(false); 
  
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); 
    
    try {
      if (isLogin) {
        await loginWithEmail(formData.email, formData.password);
      } else {
        if (!formData.name) throw new Error("Please enter your full name.");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signupWithEmail(formData.name, formData.email, formData.password);
      }
      
      router.push(role === "master" ? "/onboarding/creator" : "/onboarding/learner"); 
      
    } catch (err: any) {
      let errMsg = err.message.replace("Firebase: ", "");
      if (errMsg.includes("auth/email-already-in-use")) {
        errMsg = "This email is already registered. Please click 'Log In' below.";
      }
      if (errMsg.includes("auth/invalid-credential")) {
        errMsg = "Invalid email or password.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      router.push(role === "master" ? "/onboarding/creator" : "/onboarding/learner");
    } catch (err: any) {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginAsGuest();
      router.push("/onboarding/learner");
    } catch (err: any) {
      setError("Guest login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-gray-100 dark:border-zinc-800">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-black dark:text-white tracking-tight">Swybe</h1>
          <p className="text-sm text-gray-500 mt-2">
            {isLogin ? "Welcome back! Log in to continue." : "Create your account to start learning."}
          </p>
        </div>

        {!isLogin && (
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

        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Full Name" 
                required={!isLogin}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-blue-500 transition text-black dark:text-white"
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
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-blue-500 transition text-black dark:text-white"
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
              className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none focus:border-blue-500 transition text-black dark:text-white"
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

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
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(null); }} 
            className="text-blue-500 font-semibold hover:underline"
          >
            {isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>

      </div>
    </div>
  );
}