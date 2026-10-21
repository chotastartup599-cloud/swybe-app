"use client";

import Link from 'next/link';
import { Sun, Moon, LogOut, Bell, Shield } from 'lucide-react'; 
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from "@/context/AuthContext";

export default function TopBar() {
  const { theme, setTheme } = useTheme();
  const { user, dbUser, logout, refreshUser } = useAuth(); // <-- refreshUser import kiya
  const [mounted, setMounted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const notifications = dbUser?.notifications || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m";
    return Math.floor(seconds) + "s";
  };

  // Mark all as read
  const handleOpenNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      await fetch("/api/users/read-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: dbUser.firebaseUid })
      });
      await refreshUser();
    }
  };

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/90 dark:bg-black/90 backdrop-blur-md border-b border-gray-200 dark:border-zinc-800 z-50 h-14 flex items-center justify-between px-4 transition-colors duration-300">
        <Link href="/" className="text-2xl font-bold tracking-tighter text-black dark:text-white">Swybe</Link>
        
        <div className="flex gap-4 items-center">
          {dbUser?.email === "chotastartup599@gmail.com" && (
            <Link href="/admin" className="p-1 text-pink-500"><Shield className="w-5 h-5" /></Link>
          )}

          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1 text-gray-600 dark:text-gray-300">
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <div className="relative">
            <button onClick={handleOpenNotifications} className="p-1 text-gray-600 dark:text-gray-300 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-pink-500 rounded-full border border-white dark:border-black"></span>}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 dark:border-zinc-800 font-semibold text-sm dark:text-white flex justify-between items-center">
                  <span>Notifications</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500">No new notifications</p>
                  ) : (
                    notifications.map((notif: any, i: number) => (
                      <div key={i} className="p-3 border-b border-gray-50 dark:border-zinc-800/50 text-sm">
                        <p className="text-gray-800 dark:text-gray-200">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)} ago</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {user && <button onClick={logout} className="text-gray-500 hover:text-red-500 transition"><LogOut className="w-5 h-5" /></button>}
        </div>
      </header>
    </>
  );
}