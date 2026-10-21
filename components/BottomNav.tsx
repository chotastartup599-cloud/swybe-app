"use client";

import Link from 'next/link';
import { LayoutDashboard, Home, Search, MessageSquare, Clapperboard, User, Trophy } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  const getIconClass = (path: string) => {
    const isActive = pathname === path;
    return `w-6 h-6 ${isActive ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 z-50 flex justify-around items-center h-14 transition-colors duration-300">
      <Link href="/" className="p-2"><LayoutDashboard className={getIconClass('/')} /></Link>
      <Link href="/feed" className="p-2"><Home className={getIconClass('/feed')} /></Link>
      <Link href="/search" className="p-2"><Search className={getIconClass('/search')} /></Link>
      <Link href="/reels" className="p-2"><Clapperboard className={getIconClass('/reels')} /></Link>
      <Link href="/leaderboard" className="p-2"><Trophy className={getIconClass('/leaderboard')} /></Link>
      <Link href="/profile" className="p-2"><User className={getIconClass('/profile')} /></Link>
    </nav>
  );
}