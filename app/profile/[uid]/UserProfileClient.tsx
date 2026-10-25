"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Grid, ChevronLeft, ShieldCheck, Play, AtSign, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import FollowButton from "@/components/FollowButton";

export default function UserProfileClient({ uid }: { uid: string }) {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"posts" | "reels">("posts");

  const isMyProfile = dbUser?.firebaseUid === uid;
  const isFollowing = dbUser?.following?.includes(uid);

  const handleFollowChange = (isFollowing: boolean) => {
    setUser((prevUser: any) => {
      if (!prevUser) return prevUser;
      return {
        ...prevUser,
        followers: isFollowing 
          ? [...(prevUser.followers || []), dbUser?.firebaseUid] 
          : (prevUser.followers || []).filter((id: string) => id !== dbUser?.firebaseUid)
      };
    });
  };

  useEffect(() => {
    async function fetchData() {
      if (!uid) return;
      try {
        const userRes = await fetch(`/api/users/${uid}`);
        const userData = await userRes.json();
        
        if (userData.success) {
          setUser(userData.data);
          
          const postsRes = await fetch(`/api/posts?creatorEmail=${userData.data.email}`);
          const postsData = await postsRes.json();
          if (postsData.success) {
            setPosts(postsData.data.filter((p: any) => p.type !== "reel"));
            setReels(postsData.data.filter((p: any) => p.type === "reel"));
          }

          if (!isMyProfile) {
            await fetch("/api/users/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetUserId: uid })
            });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [uid, isMyProfile]);

  if (loading || authLoading) return <div className="h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  if (!user) return <div className="h-screen flex items-center justify-center dark:text-white">User not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <button onClick={() => router.back()} className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black dark:hover:text-white transition">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 mb-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-pink-500 p-1 shrink-0 relative">
            <img src={user.photoURL || "https://via.placeholder.com/150"} alt="Profile" className="w-full h-full rounded-full object-cover" />
            {user.role === "master" && user.masterStatus === "approved" && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-black rounded-full p-0.5">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold dark:text-white">{user.name}</h2>
              
              {!isMyProfile && (
                <FollowButton 
                  targetUserId={uid} 
                  initialIsFollowing={!!isFollowing} 
                  onFollowChange={handleFollowChange} 
                />
              )}
              {isMyProfile && (
                <button onClick={() => router.push('/profile')} className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white px-6 py-1.5 rounded-lg font-semibold text-sm hover:bg-gray-300 dark:hover:bg-zinc-700 transition">
                  Edit Profile
                </button>
              )}
            </div>

            <div className="flex justify-center sm:justify-start gap-8 mb-4">
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{posts.length + reels.length}</span>
                <span className="text-sm text-gray-500">Posts</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.followers?.length || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.following?.length || 0}</span>
                <span className="text-sm text-gray-500">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{user.profileViews || 0}</span>
                <span className="text-sm text-gray-500">Views</span>
              </div>
            </div>

            <div className="text-sm">
              <p className="font-semibold text-black dark:text-white mb-1">@{user.email?.split('@')[0]}</p>
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
          {activeTab === "posts" && (
            posts.length === 0 ? <p className="text-center text-gray-500 mt-10">No posts yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {posts.map((post) => (
                  <div key={post._id} className="aspect-square bg-gray-100 dark:bg-zinc-900 relative rounded-sm sm:rounded-lg overflow-hidden">
                    {post.mediaUrl ? <img src={post.mediaUrl} alt="post" className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xs text-gray-500 p-2 text-center">{post.caption}</div>}
                  </div>
                ))}
              </div>
            )
          )}
          {activeTab === "reels" && (
            reels.length === 0 ? <p className="text-center text-gray-500 mt-10">No reels yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {reels.map((reel) => (
                  <div key={reel._id} className="aspect-[9/16] bg-gray-100 dark:bg-zinc-900 relative rounded-sm sm:rounded-lg overflow-hidden">
                    <video src={reel.mediaUrl} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
