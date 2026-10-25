"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Grid, ChevronLeft, ShieldCheck, Play, AtSign, Phone } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import FollowButton from "@/components/FollowButton";
import ProfileGrid from "@/components/ProfileGrid";

export default function UserProfilePage() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const params = useParams();
  const uid = params.uid as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");
  const viewedRef = useRef<string | null>(null);

  const isMyProfile = !!dbUser && dbUser.firebaseUid === uid;

  // Apni profile ke liye /profile wala page hai (edit, saved folders ke saath)
  useEffect(() => {
    if (isMyProfile) router.replace("/profile");
  }, [isMyProfile, router]);

  // Profile data: sirf uid badalne par fetch hota hai (pehle dbUser load hone par dobara fetch hota tha)
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/${uid}`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) setUser(data.success ? data.data : null);
      } catch (error) {
        console.error(error);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUser();
    return () => { cancelled = true; };
  }, [uid]);

  // Profile view: login ke baad, ek page-visit par sirf ek baar, apni profile ka nahi
  useEffect(() => {
    if (!dbUser || !user || isMyProfile || viewedRef.current === uid) return;
    viewedRef.current = uid;
    fetch("/api/users/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: uid })
    }).catch(() => {});
  }, [dbUser, user, isMyProfile, uid]);

  const handleFollowChange = (isFollowing: boolean) => {
    setUser((prev: any) => {
      if (!prev) return prev;
      const current = prev.followersCount || 0;
      return { ...prev, followersCount: Math.max(0, current + (isFollowing ? 1 : -1)) };
    });
  };

  if (loading || authLoading || isMyProfile) return <div className="h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  if (!user) return <div className="h-screen flex items-center justify-center dark:text-white">User not found.</div>;

  const isCreator = user.role === "master" && user.masterStatus === "approved";
  const totalPosts = (user.postCount || 0) + (user.reelCount || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-pink-500 p-1 shrink-0 relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-pink-500 flex items-center justify-center text-white text-4xl font-bold">
                {user.name?.charAt(0) || "U"}
              </div>
            )}
            {isCreator && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-black rounded-full p-0.5">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
              <FollowButton
                targetUserId={uid}
                initialIsFollowing={!!dbUser?.following?.includes(uid)}
                onFollowChange={handleFollowChange}
                variant="card"
              />
            </div>

            <div className="flex justify-center sm:justify-start gap-8 mb-4">
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{totalPosts}</span>
                <span className="text-sm text-gray-500">Posts</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.followersCount || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.followingCount || 0}</span>
                <span className="text-sm text-gray-500">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.profileViews || 0}</span>
                <span className="text-sm text-gray-500">Views</span>
              </div>
            </div>

            <div className="text-sm">
              <p className="font-semibold text-black dark:text-white mb-1">{isCreator ? "Educator" : "Learner"}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-3">{user.bio}</p>
              
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-blue-500 font-medium">
                {user.socialLinks?.instagram && (
                  <a href={`https://instagram.com/${user.socialLinks.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <AtSign className="w-4 h-4" /> Instagram
                  </a>
                )}
                {user.socialLinks?.whatsapp && (
                  <a href={`https://wa.me/${user.socialLinks.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center border-t border-gray-200 dark:border-zinc-800 pt-4">
          <button onClick={() => setActiveTab("posts")} className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold border-b-2 transition ${activeTab === "posts" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}>
            <Grid className="w-4 h-4" /> POSTS
          </button>
          <button onClick={() => setActiveTab("reels")} className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold border-b-2 transition ${activeTab === "reels" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}>
            <Play className="w-4 h-4" /> REELS
          </button>
        </div>

        <div className="mt-2">
          <ProfileGrid uid={uid} kind={activeTab} />
        </div>
      </div>
    </div>
  );
}