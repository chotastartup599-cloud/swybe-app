"use client";

import { useState, useEffect } from "react";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, UserPlus, UserCheck } from "lucide-react";
import CommentModal from "./CommentModal";
import SaveModal from "./SaveModal";
import { useAuth } from "@/context/AuthContext";

interface Post {
  _id: string;
  title: string;
  caption: string;
  mediaUrl?: string;
  creatorName: string;
  creatorEmail: string;
  likes: number;
  comments: number;
  type: string;
}

export default function PostCard({ post }: { post: Post }) {
  const { dbUser } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  const [likesCount, setLikesCount] = useState(post.likes);
  const [commentsCount, setCommentsCount] = useState(post.comments); // <-- State for real-time update
  const [liked, setLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const savedLikes = JSON.parse(localStorage.getItem("swybe_liked_posts") || "[]");
    if (savedLikes.includes(post._id)) setLiked(true);
  }, [post._id]);

  const handleLike = async () => {
    if (!dbUser) return;

    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    let savedLikes = JSON.parse(localStorage.getItem("swybe_liked_posts") || "[]");
    if (liked) {
      savedLikes = savedLikes.filter((id: string) => id !== post._id);
    } else {
      savedLikes.push(post._id);
    }
    localStorage.setItem("swybe_liked_posts", JSON.stringify(savedLikes));

    try {
      await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.firebaseUid })
      });
    } catch (error) {
      console.error("Like failed", error);
    }
  };

  // SHARE FIX
  const handleShare = async () => {
    const shareUrl = window.location.origin + "/feed?id=" + post._id;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.caption,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share failed", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("🔗 Link copied to clipboard!");
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 pb-4 mb-2">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {post.creatorName?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-black dark:text-white leading-tight">
                {post.creatorName}
              </h3>
              <p className="text-xs text-gray-500">@{post.creatorEmail?.split('@')[0] || 'user'}</p>
            </div>
          </div>
          
          {/* FUNCTIONAL FOLLOW BUTTON (UI Level Fix) */}
          <button 
            onClick={() => setIsFollowing(!isFollowing)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
              isFollowing 
                ? "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isFollowing ? <UserCheck className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>

        {post.mediaUrl && (
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900 relative">
            {post.mediaUrl.includes('.mp4') ? (
              <video src={post.mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md">
              <span className="text-xs font-bold text-white">📚 {post.title || "General"}</span>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-3 pt-3 pb-2">
          <div className="flex gap-4">
            <button onClick={handleLike} className="flex items-center gap-1">
              <Heart className={`w-6 h-6 transition ${liked ? "fill-pink-500 text-pink-500" : "text-black dark:text-white"}`} />
            </button>
            <button onClick={() => setIsCommentOpen(true)} className="flex items-center gap-1">
              <MessageCircle className="w-6 h-6 text-black dark:text-white" />
            </button>
            {/* SHARE BUTTON FIXED */}
            <button onClick={handleShare} className="flex items-center gap-1">
              <Send className="w-6 h-6 text-black dark:text-white" />
            </button>
          </div>
          <button onClick={() => setIsSaveModalOpen(true)}>
            <Bookmark className="w-6 h-6 text-black dark:text-white" />
          </button>
        </div>

        <div className="px-3">
          <p className="text-sm font-semibold text-black dark:text-white mb-1">
            {likesCount} likes
          </p>
          <p className="text-sm text-black dark:text-gray-200">
            <span className="font-semibold mr-2">{post.creatorName}</span>
            {post.caption}
          </p>
          <p onClick={() => setIsCommentOpen(true)} className="text-xs text-gray-500 mt-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            View all {commentsCount} comments
          </p>
        </div>
      </div>

      {/* Pass onCommentAdded to increment count */}
      <CommentModal 
        postId={post._id} 
        isOpen={isCommentOpen} 
        onClose={() => setIsCommentOpen(false)} 
        onCommentAdded={() => setCommentsCount(prev => prev + 1)} 
      />
      <SaveModal postId={post._id} isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} />
    </>
  );
}