"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Settings, Grid, Bookmark, ChevronLeft, ShieldCheck, Play, AtSign, Phone, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import EditProfileModal from "@/components/EditProfileModal";

export default function ProfilePage() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"posts" | "reels" | "saved">("posts");
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myReels, setMyReels] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<any | null>(null);
  const [fetching, setFetching] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!loading && !dbUser) router.push("/auth");
  }, [dbUser, loading, router]);

  useEffect(() => {
    async function fetchProfileData() {
      if (!dbUser) return;
      try {
        // Fetch Posts & Reels
        const res = await fetch(`/api/posts?creatorEmail=${dbUser.email}`);
        const data = await res.json();
        if (data.success) {
          setMyPosts(data.data.filter((p: any) => p.type === "feed"));
          setMyReels(data.data.filter((p: any) => p.type === "reel"));
        }

        // Fetch Folders
        const foldersRes = await fetch(`/api/folders?userId=${dbUser.firebaseUid}`);
        const foldersData = await foldersRes.json();
        if (foldersData.success) setFolders(foldersData.data);

        // Record Profile View (Khud ki profile view nahi badhni chahiye, par abhi ke liye skip kar rahe hain)
        // await fetch("/api/users/view", { method: "POST", body: JSON.stringify({ targetUserId: dbUser.firebaseUid }) });

      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    }
    fetchProfileData();
  }, [dbUser]);

  if (loading || fetching) return <div className="h-screen flex items-center justify-center dark:text-white">Loading Profile...</div>;
  if (!dbUser) return null;

  const isVerified = dbUser.role === "master" && dbUser.masterStatus === "approved";

  // Folder view
  if (selectedFolder) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 p-4 pt-20">
        <div className="flex items-center gap-3 mb-6 max-w-4xl mx-auto">
          <button onClick={() => setSelectedFolder(null)} className="p-2 bg-gray-100 dark:bg-zinc-900 rounded-full">
            <ChevronLeft className="w-5 h-5 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">{selectedFolder.name}</h1>
        </div>
        
        <div className="max-w-4xl mx-auto">
          {selectedFolder.posts.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">This folder is empty.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedFolder.posts.map((post: any) => (
                <div key={post._id} className="aspect-square bg-gray-200 dark:bg-zinc-800 relative rounded-lg overflow-hidden">
                  {post.mediaUrl ? (
                    post.mediaUrl.includes('.mp4') ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <img src={post.mediaUrl} className="w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-gray-500 p-2 text-center line-clamp-3">{post.caption}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-10 mb-8">
          {/* Profile Pic */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-pink-500 p-1 shrink-0 relative">
            <img src={dbUser.photoURL || "https://via.placeholder.com/150"} alt="Profile" className="w-full h-full rounded-full object-cover" />
            {isVerified && (
              <div className="absolute bottom-1 right-1 bg-white dark:bg-black rounded-full p-0.5">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
              </div>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center sm:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold dark:text-white">{dbUser.name}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white px-6 py-1.5 rounded-lg font-semibold text-sm hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center sm:justify-start gap-8 mb-4">
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{myPosts.length}</span>
                <span className="text-sm text-gray-500">Posts</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{dbUser.followers?.length || 0}</span>
                <span className="text-sm text-gray-500">Followers</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{dbUser.following?.length || 0}</span>
                <span className="text-sm text-gray-500">Following</span>
              </div>
              <div className="text-center sm:text-left">
                <span className="font-bold text-black dark:text-white block text-lg">{dbUser.profileViews || 0}</span>
                <span className="text-sm text-gray-500">Views</span>
              </div>
            </div>

            {/* Bio & Links */}
            <div className="text-sm">
              <p className="font-semibold text-black dark:text-white mb-1">@{dbUser.email?.split('@')[0]}</p>
              <p className="text-gray-600 dark:text-gray-300 mb-3">{dbUser.bio}</p>
              
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start text-blue-500 font-medium">
                {dbUser.socialLinks?.instagram && (
                  <a href={`https://instagram.com/${dbUser.socialLinks.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <AtSign className="w-4 h-4" /> Instagram
                  </a>
                )}
                {dbUser.socialLinks?.whatsapp && (
                  <a href={`https://wa.me/${dbUser.socialLinks.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center border-t border-gray-200 dark:border-zinc-800 pt-4">
          <button onClick={() => setActiveTab("posts")} className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold border-b-2 transition ${activeTab === "posts" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}>
            <Grid className="w-4 h-4" /> POSTS
          </button>
          <button onClick={() => setActiveTab("reels")} className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold border-b-2 transition ${activeTab === "reels" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}>
            <Play className="w-4 h-4" /> REELS
          </button>
          <button onClick={() => setActiveTab("saved")} className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold border-b-2 transition ${activeTab === "saved" ? "border-black dark:border-white text-black dark:text-white" : "border-transparent text-gray-500"}`}>
            <Bookmark className="w-4 h-4" /> SAVED
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === "posts" && (
            myPosts.length === 0 ? <p className="text-center text-gray-500 mt-10">No posts yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {myPosts.map((post) => (
                  <div key={post._id} className="aspect-square bg-gray-100 dark:bg-zinc-900 relative group cursor-pointer overflow-hidden rounded-sm sm:rounded-lg">
                    {post.mediaUrl ? (
                      post.mediaUrl.includes('.mp4') ? <video src={post.mediaUrl} className="w-full h-full object-cover" /> : <img src={post.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xs text-gray-500 p-2 text-center">{post.caption}</div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "reels" && (
            myReels.length === 0 ? <p className="text-center text-gray-500 mt-10">No reels yet.</p> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2">
                {myReels.map((reel) => (
                  <div key={reel._id} className="aspect-[9/16] bg-gray-100 dark:bg-zinc-900 relative group cursor-pointer overflow-hidden rounded-sm sm:rounded-lg">
                    <video src={reel.mediaUrl} className="w-full h-full object-cover" />
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white font-semibold text-xs bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
                      <Play className="w-3 h-3 fill-white" /> {reel.likes}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "saved" && (
            <div className="p-3 grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {folders.length === 0 ? (
                <p className="text-center text-gray-500 col-span-2 mt-10">No saved folders yet.</p>
              ) : (
                folders.map((folder) => (
                  <div 
                    key={folder._id} 
                    onClick={() => setSelectedFolder(folder)}
                    className="bg-white dark:bg-zinc-900 rounded-xl p-4 cursor-pointer hover:shadow-md transition border border-gray-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                      <Bookmark className="w-6 h-6 text-pink-500" />
                    </div>
                    <p className="font-semibold text-black dark:text-white text-sm text-center">{folder.name}</p>
                    <p className="text-xs text-gray-500">{folder.posts.length} items</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
    </div>
  );
}