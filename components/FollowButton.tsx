"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  onFollowChange,
  variant = "overlay",
}: {
  targetUserId?: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  // overlay = reels jaise dark background par, card = normal (white/dark theme) background par
  variant?: "overlay" | "card";
}) {
  const { dbUser, user, refreshUser } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  // dbUser.following se hamesha sync rakho (pehle ye sirf pehli baar set hota tha)
  const followingList = dbUser?.following;
  useEffect(() => {
    if (Array.isArray(followingList) && targetUserId) {
      setIsFollowing(followingList.includes(targetUserId));
    }
  }, [followingList, targetUserId]);

  // Apni hi post/profile hai ya target nahi mila to button hide
  if (!targetUserId) return null;
  if (dbUser?.firebaseUid === targetUserId) return null;

  const handleFollow = async () => {
    if (loading) return;

    if (!dbUser) {
      router.push("/auth");
      return;
    }
    if (user?.isAnonymous) {
      alert("Follow karne ke liye apne account se login karo (guest mode me nahi).");
      return;
    }

    setLoading(true);
    const previous = isFollowing;
    const action = previous ? "unfollow" : "follow";
    const newState = !previous;

    setIsFollowing(newState);
    if (onFollowChange) onFollowChange(newState);

    try {
      const res = await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Follow failed");
      await refreshUser();
    } catch (error: any) {
      console.error(error);
      setIsFollowing(previous);
      if (onFollowChange) onFollowChange(previous);
      alert(error?.message || "Follow nahi ho paya. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const styles =
    variant === "overlay"
      ? isFollowing
        ? "bg-white/20 border border-white/20 text-white"
        : "bg-transparent border border-white text-white hover:bg-white hover:text-black"
      : isFollowing
        ? "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white"
        : "bg-blue-600 text-white hover:bg-blue-700";

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition shrink-0 disabled:opacity-60 ${styles}`}
    >
      {isFollowing ? (
        <><UserCheck className="w-3 h-3" /> Following</>
      ) : (
        <><UserPlus className="w-3 h-3" /> Follow</>
      )}
    </button>
  );
}