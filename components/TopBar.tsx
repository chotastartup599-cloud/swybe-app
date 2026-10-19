"use client";

import Link from 'next/link';
import { Sun, Moon, LogOut, Bell, Shield } from 'lucide-react'; // <-- Shield import kiya
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { user, dbUser, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 z-50 h-14 flex items-center justify-between px-4 transition-colors duration-300">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black dark:text-white">
          Swybe
        </Link>
        
        <div className="flex gap-4 items-center">
          {/* Admin Button for Mobile */}
          {dbUser?.email === "chotastartup599@gmail.com" && (
            <Link href="/admin" className="p-1 text-pink-500">
              <Shield className="w-5 h-5" />
            </Link>
          )}

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1 text-gray-600 dark:text-gray-300">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />

          {user && (
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
    </>
  );
}