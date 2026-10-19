"use client";

import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";

export default function LoginModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { loginWithGoogle, loginAsGuest } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-black dark:hover:text-white">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Welcome to Swybe</h2>
        <p className="text-center text-sm text-gray-500 mb-8">Padhai shuru karne ke liye login karein</p>

        <div className="flex flex-col gap-3">
          <button 
            onClick={async () => { await loginWithGoogle(); onClose(); }}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 text-black dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <button 
            onClick={async () => { await loginAsGuest(); onClose(); }}
            className="w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white font-semibold py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}