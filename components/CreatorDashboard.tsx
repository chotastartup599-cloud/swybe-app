"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Eye, Heart, Users, BarChart3, PlusSquare, PlaySquare, Image as ImageIcon } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function CreatorDashboard() {
  const { dbUser } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMyPosts() {
      if (!dbUser) return;
      try {
        const res = await fetch(`/api/posts?creatorEmail=${dbUser.email}`);
        const data = await res.json();
        if (data.success) {
          setPosts(data.data);
        }
      } catch (error) {
        console.error("Error fetching creator posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMyPosts();
  }, [dbUser]);

  if (loading) return <div className="text-center p-10 dark:text-white">Loading Studio...</div>;

  const totalLikes = posts.reduce((acc, post) => acc + (post.likes || 0), 0);
  const totalViews = posts.reduce((acc, post) => acc + (post.views || 0), 0);

  // Animation Variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 pt-6 w-full">
      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* --- WELCOME BANNER --- */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <p className="text-sm font-semibold tracking-wider text-purple-200 uppercase mb-2">
                Creator Studio
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
                Welcome back, {dbUser?.name?.split(' ')[0]} 🚀
              </h2>
              <p className="text-purple-100 text-sm sm:text-base">
                Ready to share some knowledge today?
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link href="/upload" className="bg-white text-purple-600 px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-md whitespace-nowrap">
                <PlusSquare className="w-4 h-4" /> Upload New
              </Link>
            </div>
          </div>
        </motion.div>

        {/* --- ANALYTICS CARDS --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalViews}</h3>
            <p className="text-xs text-gray-500 font-medium">Total Views</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{totalLikes}</h3>
            <p className="text-xs text-gray-500 font-medium">Total Likes</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dbUser?.followers?.length || 0}</h3>
            <p className="text-xs text-gray-500 font-medium">Followers</p>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-3">
              <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{dbUser?.profileViews || 0}</h3>
            <p className="text-xs text-gray-500 font-medium">Profile Views</p>
          </div>
        </motion.div>

        {/* --- RECENT CONTENT --- */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-indigo-500" /> Recent Content
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-10 text-center border border-gray-100 dark:border-zinc-800">
              <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold dark:text-white mb-1">No content yet</h3>
              <p className="text-sm text-gray-500 mb-4">Upload your first reel or post to get started.</p>
              <Link href="/upload" className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
                Create Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {posts.slice(0, 8).map((post) => (
                <div key={post._id} className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 shadow-sm group cursor-pointer relative aspect-[4/5]">
                  {post.mediaUrl ? (
                    post.mediaUrl.includes('.mp4') ? (
                      <video src={post.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <img src={post.mediaUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" alt={post.title} />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 bg-gray-50 dark:bg-zinc-800 text-center text-sm text-gray-600 dark:text-gray-300 font-medium">
                      {post.title}
                    </div>
                  )}
                  
                  {/* Overlay stats */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                    <h4 className="text-white font-bold text-sm line-clamp-1">{post.title}</h4>
                    <div className="flex items-center gap-4 text-white text-xs mt-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3 fill-white" /> {post.likes || 0}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {post.views || 0}</span>
                    </div>
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider">
                    {post.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}