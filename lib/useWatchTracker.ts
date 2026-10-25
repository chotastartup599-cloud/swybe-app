"use client";

import { useEffect, useRef } from "react";

const FLUSH_EVERY_MS = 15000;     // har 15 sec me server ko batao
const MIN_SECONDS_PERIODIC = 10;  // beech me tabhi bhejo jab 10 sec jama ho gaye
const MIN_SECONDS_FINAL = 2;      // 2 sec se kam dekha = view/watch-time nahi ginte

// Jab `active` true hai (post screen par dikh rahi hai / reel chal rahi hai),
// tab ka time jodta hai aur /api/posts/[id]/track par bhejta hai.
// Tab background me jaye to ginti ruk jaati hai.
export function useWatchTracker(postId: string, active: boolean, enabled: boolean = true) {
  const sinceRef = useRef<number | null>(null);
  const pendingRef = useRef(0);

  useEffect(() => {
    if (!enabled || !postId) return;

    const bank = () => {
      if (sinceRef.current !== null) {
        pendingRef.current += (Date.now() - sinceRef.current) / 1000;
        sinceRef.current = null;
      }
    };

    const send = (final: boolean) => {
      const seconds = Math.floor(pendingRef.current);
      if (seconds < (final ? MIN_SECONDS_FINAL : MIN_SECONDS_PERIODIC)) return;
      pendingRef.current -= seconds;
      fetch(`/api/posts/${postId}/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeSpent: Math.min(seconds, 120) }),
        keepalive: true,
      }).catch(() => {});
    };

    const start = () => {
      if (sinceRef.current === null && !document.hidden) sinceRef.current = Date.now();
    };

    if (active) start();

    const onVisibility = () => {
      if (document.hidden) {
        bank();
        send(true);
      } else if (active) {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const timer = setInterval(() => {
      if (sinceRef.current !== null) {
        bank();
        start();
      }
      send(false);
    }, FLUSH_EVERY_MS);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      bank();
      send(true);
      pendingRef.current = 0;
    };
  }, [postId, active, enabled]);
}