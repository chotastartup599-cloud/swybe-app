"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Home, Search, MessageSquare, Clapperboard, PlusSquare, User, Bell, Sun, Moon, Shield, LogOut } from 'lucide-react'; // Imports update kiye
import { useAuth } from '@/context/AuthContext';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const { dbUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // NAYA: Dashboard aur Feed dono add kiye
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/doubts", label: "Doubts", icon: MessageSquare },
    { href: "/reels", label: "Reels", icon: Clapperboard },
    { href: "/upload", label: "Create", icon: PlusSquare },
  ];

  if (!mounted) return null;

  return (
    <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800 z-50 transition-all duration-300 ease-in-out w-[72px] hover:w-64 group overflow-hidden">
      
      <Link href="/" className="flex items-center h-16 px-6 mb-4 mt-2">
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white hidden group-hover:block whitespace-nowrap">Swybe</span>
        <span className="text-2xl font-extrabold tracking-tighter text-black dark:text-white block group-hover:hidden">S</span>
      </Link>

      <nav className="flex flex-col gap-1 px-3 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          
          return (
            <Link key={link.href} href={link.href} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isActive ? 'bg-gray-100 dark:bg-zinc-900 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium'}`}>
              <Icon className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`} />
              <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{link.label}</span>
            </Link>
          );
        })}

        <Link href="/profile" className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${pathname === '/profile' ? 'bg-gray-100 dark:bg-zinc-900 font-bold' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium'}`}>
          <User className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-105 ${pathname === '/profile' ? 'text-black dark:text-white' : 'text-gray-600 dark:text-gray-400'}`} />
          <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Profile</span>
        </Link>

        {dbUser?.email === "chotastartup599@gmail.com" && (
          <Link href="/admin" className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${pathname === '/admin' ? 'bg-pink-50 dark:bg-pink-900/20 font-bold text-pink-600' : 'hover:bg-gray-50 dark:hover:bg-zinc-900/50 font-medium text-pink-500'}`}>
            <Shield className="w-6 h-6 shrink-0 transition-transform group-hover:scale-105" />
            <span className="text-sm hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Admin Panel</span>
          </Link>
        )}
      </nav>

      <div className="flex flex-col gap-1 px-3 mb-2">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
          {theme === 'dark' ? <Sun className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" /> : <Moon className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" />}
          <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Theme</span>
        </button>

        <button className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors relative">
          <Bell className="w-6 h-6 shrink-0 text-gray-600 dark:text-gray-400" />
          <span className="text-sm dark:text-white hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Notifications</span>
          <span className="absolute left-8 top-3 w-2 h-2 bg-pink-500 rounded-full border border-white dark:border-black"></span>
        </button>

        <button onClick={logout} className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500 w-full">
          <LogOut className="w-6 h-6 shrink-0" />
          <span className="text-sm font-semibold hidden group-hover:block whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">Logout</span>
        </button>
      </div>

      {dbUser && (
        <div className="p-3 mb-4 mt-auto">
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