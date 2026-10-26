"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";

// In pages par Sidebar / TopBar / BottomNav nahi dikhte (login aur setup ke screen)
const BARE_PREFIXES = ["/auth", "/onboarding"];
const FOCUS_REFRESH_MS = 60_000;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { dbUser, refreshUser } = useAuth();
  const hasUser = !!dbUser;

  const refreshRef = useRef(refreshUser);
  refreshRef.current = refreshUser;
  const lastRefreshRef = useRef(Date.now());

  // Tab wapas khulne par (max 1 minute me ek baar) taaza data: nayi notifications, followers
  useEffect(() => {
    if (!hasUser) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastRefreshRef.current < FOCUS_REFRESH_MS) return;
      lastRefreshRef.current = Date.now();
      refreshRef.current();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [hasUser]);

  const isBare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (isBare) return <>{children}</>;

  // Reels page apni padding khud sambhalta hai (full-screen video)
  const isReels = pathname === "/reels" || pathname.startsWith("/reels/");

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 min-w-0 md:ml-[72px] flex flex-col min-h-screen relative">
        <TopBar />

        <main className={`flex-1 w-full ${isReels ? "" : "shell-pad"}`}>
          {children}
        </main>

        <BottomNav />
      </div>
    </div>
  );
}