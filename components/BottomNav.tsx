"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Home, Search, Clapperboard, User, Trophy, PlusSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNav() {
  const pathname = usePathname() || "/";
  const { user } = useAuth();
  const isGuest = !!user?.isAnonymous;

  // Guest post nahi bana sakta, to uske liye Create ki jagah Leaderboard
  const items = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/feed", label: "Feed", icon: Home },
    isGuest
      ? { href: "/leaderboard", label: "Leaderboard", icon: Trophy }
      : { href: "/upload", label: "Create", icon: PlusSquare },
    { href: "/reels", label: "Reels", icon: Clapperboard },
    { href: "/search", label: "Search", icon: Search },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-zinc-800 z-50 transition-colors duration-300"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex justify-around items-center h-14">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link key={href} href={href} aria-label={label} aria-current={active ? "page" : undefined} className="p-2">
              <Icon className={`w-6 h-6 ${active ? "text-black dark:text-white" : "text-gray-500 dark:text-gray-400"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}