"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, LogIn, Shield, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import { isAdminEmail } from "@/lib/constants";

export default function TopBar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { dbUser, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 z-50 h-14 flex items-center justify-between px-4 transition-colors duration-300">
      <Link href="/" className="text-2xl font-bold tracking-tighter text-black dark:text-white">Swybe</Link>
      
      <div className="flex gap-4 items-center">
        <Link href="/leaderboard" aria-label="Leaderboard" className="p-1 text-gray-600 dark:text-gray-300">
          <Trophy className="w-5 h-5" />
        </Link>

        {isAdminEmail(dbUser?.email) && (
          <Link href="/admin" aria-label="Admin Panel" className="p-1 text-pink-500"><Shield className="w-5 h-5" /></Link>
        )}

        <button onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Toggle theme" className="p-1 text-gray-600 dark:text-gray-300">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {dbUser && <NotificationBell variant="topbar" />}

        {dbUser ? (
          <button onClick={handleLogout} aria-label="Logout" className="text-gray-500 hover:text-red-500 transition">
            <LogOut className="w-5 h-5" />
          </button>
        ) : (
          <Link href="/auth" aria-label="Log in" className="text-blue-500">
            <LogIn className="w-5 h-5" />
          </Link>
        )}
      </div>
    </header>
  );
}