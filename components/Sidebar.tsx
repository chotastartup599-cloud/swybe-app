"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Home, Search, MessageSquare, Clapperboard, PlusSquare, User, Sun, Moon, Shield, LogOut, LogIn, Trophy, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { isAdminEmail } from "@/lib/constants";

const LINKS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/reels", label: "Reels", icon: Clapperboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/doubts", label: "Doubts", icon: MessageSquare },
  { href: "/upload", label: "Create", icon: PlusSquare },
  { href: "/profile", label: "Profile", icon: User },
];

const labelClass =
  "text-sm dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300";

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { dbUser, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const isActivePath = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 z-50 transition-all duration-300 ease-in-out w-[72px] hover:w-64 group overflow-hidden">
      
      <Link href="/" className="flex items-center h-16 px-6 mb-2 mt-2 shrink-0">
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white hidden group-hover:block whitespace-nowrap">Swybe</span>
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white block group-hover:hidden">S</span>
      </Link>

      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto no-scrollbar">
        {LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = isActivePath(link.href);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-label={link.label}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors shrink-0 ${isActive ? "bg-gray-100 dark:bg-zinc-900 font-bold" : "hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium"}`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${isActive ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"}`} />
              <span className={labelClass}>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 px-3 py-2 mt-auto shrink-0 border-t border-gray-100 dark:border-zinc-800">
        {isAdminEmail(dbUser?.email) && (
          <Link href="/admin" aria-label="Admin Panel" className={`flex items-center gap-4 p-3 rounded-xl transition-colors shrink-0 ${pathname.startsWith("/admin") ? "bg-pink-50 dark:bg-pink-900/20 font-bold text-pink-600" : "hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium text-pink-500"}`}>
            <Shield className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
            <span className="text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Admin Panel</span>
          </Link>
        )}
        
        <button onClick={() => setTheme(isDark ? "light" : "dark")} aria-label="Toggle theme" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
          {isDark ? <Sun className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400" />}
          <span className={labelClass}>Theme</span>
        </button>

        {/* 🟢 NAYA: Help & Legal Section Start */}
        <div className="relative group/help">
          <button aria-label="Help & Legal" className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors w-full">
            <HelpCircle className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400 transition-transform group-hover:scale-105" />
            <span className={labelClass}>Help & Legal</span>
          </button>
          
          {/* Hover Dropdown Menu */}
          <div className="absolute left-[60px] bottom-0 mb-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50 opacity-0 invisible group-hover/help:opacity-100 group-hover/help:visible transition-all duration-200">
            <Link href="/privacy" className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">Privacy Policy</Link>
            <Link href="/terms" className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">Terms of Use</Link>
            <Link href="/guidelines" className="block px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition">Community Guidelines</Link>
          </div>
        </div>
        {/* 🟢 NAYA: Help & Legal Section End */}

        {dbUser && <NotificationBell variant="sidebar" />}

        {dbUser ? (
          <button onClick={handleLogout} aria-label="Logout" className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500 w-full">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Logout</span>
          </button>
        ) : (
          <Link href="/auth" aria-label="Log in" className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-500 w-full">
            <LogIn className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Log in</span>
          </Link>
        )}
      </div>

      {dbUser && (
        <div className="p-3 mb-2 shrink-0">
          <Link href="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
             <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                {dbUser.photoURL ? <img src={dbUser.photoURL} alt="" className="w-full h-full object-cover" /> : dbUser.name?.charAt(0) || "U"}
             </div>
             <div className="flex flex-col whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
               <span className="text-sm font-bold dark:text-white truncate max-w-[120px]">{dbUser.name}</span>
               <span className="text-[10px] text-gray-500">@{dbUser.email?.split("@")[0]}</span>
             </div>
          </Link>
        </div>
      )}
    </aside>
  );
}