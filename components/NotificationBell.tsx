"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus, Send, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const keyOf = (n: any) => `${n.createdAt}|${n.type}|${n.message}`;

function timeAgo(date: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(date).toLocaleDateString();
}

function NotificationIcon({ type }: { type?: string }) {
  switch (type) {
    case "like": return <Heart className="w-4 h-4 text-pink-500" />;
    case "comment": return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case "follow": return <UserPlus className="w-4 h-4 text-green-500" />;
    case "story_reply": return <Send className="w-4 h-4 text-purple-500" />;
    case "application": return <Award className="w-4 h-4 text-yellow-500" />;
    default: return <Bell className="w-4 h-4 text-gray-400" />;
  }
}

// variant "sidebar": desktop ke left menu me (label ke saath), "topbar": mobile ke upar (sirf icon)
export default function NotificationBell({ variant }: { variant: "sidebar" | "topbar" }) {
  const { dbUser, refreshUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [freshKeys, setFreshKeys] = useState<Set<string>>(new Set());
  const rootRef = useRef<HTMLDivElement | null>(null);

  const notifications: any[] = dbUser?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Bahar click karne ya Escape dabane par band
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!dbUser) return null;

  const toggle = async () => {
    if (open) { setOpen(false); return; }

    // Kholte waqt yaad rakho kaun si nayi thi, taaki "read" mark hone ke baad bhi highlight dikhe
    setFreshKeys(new Set(notifications.filter((n) => !n.isRead).map(keyOf)));
    setOpen(true);

    if (unreadCount > 0) {
      try {
        await fetch("/api/users/read-notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        await refreshUser();
      } catch (error) {
        console.error("Mark read failed", error);
      }
    }
  };

  // fixed: sidebar ke overflow-hidden se clip nahi hota (pehle desktop par notifications kat jaati thi)
  const panelPlacement =
    variant === "sidebar"
      ? "fixed left-[268px] bottom-4 w-80"
      : "fixed top-14 left-2 right-2 sm:left-auto sm:w-80";

  return (
    <div ref={rootRef} className="relative">
      {variant === "sidebar" ? (
        <button
          onClick={toggle}
          aria-label="Notifications"
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors w-full relative"
        >
          <Bell className="w-5 h-5 shrink-0 text-gray-600 dark:text-gray-400" />
          {unreadCount > 0 && (
            <span className="absolute left-6 top-2 w-2.5 h-2.5 bg-pink-500 rounded-full border-2 border-white dark:border-black"></span>
          )}
          <span className="text-sm dark:text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Notifications
          </span>
        </button>
      ) : (
        <button onClick={toggle} aria-label="Notifications" className="p-1 text-gray-600 dark:text-gray-300 relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`${panelPlacement} bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800 overflow-hidden z-50`}
        >
          <div className="p-3 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="font-semibold text-sm dark:text-white">Notifications</span>
            {freshKeys.size > 0 && <span className="text-xs font-semibold text-pink-500">{freshKeys.size} new</span>}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500">Abhi koi notification nahi hai.</p>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={`${keyOf(n)}-${i}`}
                  className={`flex gap-3 p-3 border-b border-gray-50 dark:border-zinc-800/50 text-sm ${freshKeys.has(keyOf(n)) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                >
                  <div className="mt-0.5 shrink-0"><NotificationIcon type={n.type} /></div>
                  <div className="min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 break-words">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}