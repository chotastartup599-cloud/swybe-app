"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Search, MessageSquare, Clapperboard, PlusSquare, User, Bell, Sun, Moon, Shield, LogOut, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { dbUser, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => setMounted(true), []);

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/doubts", label: "Doubts", icon: MessageSquare },
    { href: "/reels", label: "Reels", icon: Clapperboard },
    { href: "/upload", label: "Create", icon: PlusSquare },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const unreadCount = dbUser?.notifications?.filter((n: any) => !n.isRead).length || 0;

  const handleOpenNotifs = async () => {
    setShowNotifs(!showNotifs);
    if (!showNotifs && unreadCount > 0) {
      await fetch("/api/users/read-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: dbUser.firebaseUid })
      });
      await refreshUser();
    }
  };

  if (!mounted) return null;

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 z-50 transition-all duration-300 ease-in-out w-[72px] hover:w-64 group overflow-hidden">
      
      <Link href="/" className="flex items-center h-16 px-6 mb-2 mt-2 shrink-0">
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white hidden group-hover:block whitespace-nowrap">Swybe</span>
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white block group-hover:hidden">S</span>
      </Link>

      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto no-scrollbar">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-4 p-3 rounded-xl transition-colors shrink-0 ${isActive ? 'bg-gray-100 dark:bg-zinc-900 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium'}`}>
              <Icon className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{link.label}</span>
            </Link>
          );
        })}

        {dbUser?.email === "chotastartup599@gmail.com" && (
          <Link href="/admin" className={`flex items-center gap-4 p-3 rounded-xl transition-colors shrink-0 ${pathname === '/admin' ? 'bg-pink-50 dark:bg-pink-900/20 font-bold text-pink-600' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium text-pink-500'}`}>
            <Shield className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105" />
            <span className="text-sm hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Admin Panel</span>
          </Link>
        )}
      </nav>

      <div className="flex flex-col gap-1 px-3 py-2 mt-auto shrink-0 border-t border-gray-100 dark:border-zinc-800">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
          {theme === 'dark' ? <Sun className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" /> : <Moon className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" />}
          <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Theme</span>
        </button>

        {/* NOTIFICATION DROPDOWN */}
        <div className="relative">
          <button onClick={handleOpenNotifs} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors w-full relative">
            <Bell className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && <span className="absolute left-6 top-2 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-white dark:border-black"></span>}
            <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Notifications</span>
          </button>

          {showNotifs && (
            <div className="absolute left-[70px] bottom-0 mb-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50">
               <div className="p-3 border-b border-gray-100 dark:border-zinc-800 font-semibold text-sm dark:text-white">Notifications</div>
               <div className="max-h-64 overflow-y-auto">
                  {(dbUser?.notifications || []).length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
                  ) : (
                    dbUser.notifications.map((n: any, i: number) => (
                      <div key={i} className="p-3 border-b border-gray-50 dark:border-zinc-800/50 text-sm">
                        <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        <button onClick={logout} className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500 w-full">
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="text-sm font-semibold hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Logout</span>
        </button>
      </div>

      {dbUser && (
        <div className="p-3 mb-2 shrink-0">
          <Link href="/profile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer">
             <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                {dbUser.photoURL ? <img src={dbUser.photoURL} alt="P" className="w-full h-full object-cover" /> : dbUser.name?.charAt(0) || "U"}
             </div>
             <div className="flex flex-col hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
               <span className="text-sm font-bold dark:text-white truncate max-w-[120px]">{dbUser.name}</span>
               <span className="text-xs text-gray-500">@{dbUser.email?.split('@')[0]}</span>
             </div>
          </Link>
        </div>
      )}
    </aside>
  );
}