"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, UserCheck } from "lucide-react";

export default function FollowButton({ 
  targetUserId, 
  targetUserEmail, 
  initialIsFollowing, 
  onFollowChange 
}: { 
  targetUserId?: string, 
  targetUserEmail?: string, 
  initialIsFollowing: boolean, 
  onFollowChange?: (isFollowing: boolean) => void 
}) {
  const { dbUser, refreshUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!dbUser) return;
    setLoading(true);

    const action = isFollowing ? "unfollow" : "follow";
    const newState = !isFollowing;
    
    setIsFollowing(newState); 
    if (onFollowChange) onFollowChange(newState); 

    try {
      await fetch("/api/users/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentUserId: dbUser.firebaseUid,
          targetUserId: targetUserId,
          targetUserEmail: targetUserEmail, // <-- API ko email bhejo
          action: action
        })
      });
      await refreshUser(); 
    } catch (error) {
      console.error(error);
      setIsFollowing(isFollowing); 
      if (onFollowChange) onFollowChange(isFollowing); 
    } finally {
      setLoading(false);
    }
  };

  // Agar apni hi post hai, toh button hide karo
  if (dbUser?.email === targetUserEmail) return null;

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
        isFollowing
          ? "bg-white/20 border border-white/20 text-white"
          : "bg-transparent border border-white text-white hover:bg-white hover:text-black"
      }`}
    >
      {isFollowing ? (
        <><UserCheck className="w-3 h-3" /> Following</>
      ) : (
        <><UserPlus className="w-3 h-3" /> Follow</>
      )}
    </button>
  );
}