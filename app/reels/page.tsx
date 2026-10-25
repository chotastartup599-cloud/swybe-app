"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX } from "lucide-react";
import CommentModal from "@/components/CommentModal";
import SaveModal from "@/components/SaveModal";
import FollowButton from "@/components/FollowButton";
import { useAuth } from "@/context/AuthContext";
import { getMediaList, playableVideoUrl } from "@/lib/media";
import "swiper/css";

interface Reel {
  _id: string;
  title: string;
  caption: string;
  mediaUrls?: string[];
  mediaUrl?: string;
  creatorUid?: string | null;
  creatorName: string;
  creatorPhotoURL?: string;
  instagramHandle?: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function ReelsPage() {
  const { dbUser } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);

  // dependency me 'dbUser' (pura object) ki jagah 'dbUser?.firebaseUid' (stable string):
  // follow/like ke baad reels dobara fetch nahi honge. Login hone par liked states aa jaati hain.
  useEffect(() => {
    async function fetchReels() {
      try {
        const res = await fetch(`/api/posts?type=reel`, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) setReels(data.data);
      } catch (error) {
        console.error("Error fetching reels:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchReels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbUser?.firebaseUid]);

  useEffect(() => {
    if (activeCommentPostId || activeSavePostId) {
      document.querySelectorAll('video').forEach(vid => vid.pause());
    } else {
      const activeVideo = document.querySelector('.swiper-slide-active video') as HTMLVideoElement;
      if (activeVideo) activeVideo.play().catch(() => {});
    }
  }, [activeCommentPostId, activeSavePostId]);

  const handleLike = async (id: string, currentLikes: number, isAlreadyLiked: boolean) => {
    if (!dbUser) return;

    setReels((prevReels) => 
      prevReels.map((reel) => 
        reel._id === id ? { ...reel, likes: isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, isLiked: !isAlreadyLiked } : reel
      )
    );

    try {
      const res = await fetch(`/api/posts/${id}/like`, { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Like failed");

      // Server ka sach hi final
      setReels((prev) => prev.map((reel) => reel._id === id ? { ...reel, isLiked: data.isLiked, likes: typeof data.likes === "number" ? data.likes : reel.likes } : reel));
    } catch (error) {
      console.error("Like failed:", error);
      setReels((prev) => prev.map((reel) => reel._id === id ? { ...reel, likes: currentLikes, isLiked: isAlreadyLiked } : reel));
    }
  };

  const handleShare = async (id: string, title: string, caption: string) => {
    const shareUrl = window.location.origin + "/reels?id=" + id;
    if (navigator.share) {
      try { await navigator.share({ title, text: caption, url: shareUrl }); } catch (err) { console.log("Share failed", err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("🔗 Link copied to clipboard!");
    }
  };

  if (loading) return <div className="w-full h-[80vh] bg-black flex items-center justify-center text-white">Loading Reels...</div>;
  if (reels.length === 0) return <div className="w-full h-[80vh] bg-black flex items-center justify-center text-white">No Reels found.</div>;

  return (
    <div className="w-full min-h-screen bg-black flex justify-center pt-16 pb-16">
      <div className="w-full max-w-[420px] h-[calc(100vh-128px)] bg-zinc-950 relative overflow-hidden rounded-xl shadow-2xl border border-zinc-800">
        <Swiper direction={"vertical"} slidesPerView={1} mousewheel={true} modules={[Mousewheel]} className="w-full h-full">
          {reels.map((reel) => {
            const isLiked = reel.isLiked;
            const isMyReel = !!dbUser && !!reel.creatorUid && dbUser.firebaseUid === reel.creatorUid;
            const videoSrc = playableVideoUrl(getMediaList(reel)[0] || "");
            const profileHref = reel.creatorUid ? (isMyReel ? "/profile" : `/profile/${reel.creatorUid}`) : null;
            const avatar = (
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
                {reel.creatorPhotoURL ? <img src={reel.creatorPhotoURL} alt="" className="w-full h-full object-cover" /> : (reel.creatorName?.charAt(0) || 'U')}
              </div>
            );

            return (
              <SwiperSlide key={reel._id} className="relative w-full h-full bg-black flex items-center justify-center">
                {videoSrc ? (
                  <video src={videoSrc} loop playsInline muted={isMuted} autoPlay className="w-full h-full object-cover" />
                ) : (
                  <div className="text-gray-400 text-sm">Video available nahi hai.</div>
                )}

                <button onClick={() => setIsMuted(!isMuted)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full z-10 text-white backdrop-blur-sm hover:bg-black/70 transition">
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>

                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

                <div className="absolute bottom-6 left-4 right-16 z-10 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    {profileHref ? <Link href={profileHref}>{avatar}</Link> : avatar}
                    {profileHref ? (
                      <Link href={profileHref} className="font-semibold text-sm hover:underline truncate">{reel.creatorName}</Link>
                    ) : (
                      <span className="font-semibold text-sm truncate">{reel.creatorName}</span>
                    )}
                    {reel.instagramHandle && (
                      <span className="text-xs text-gray-300 truncate">@{reel.instagramHandle.replace('@', '')}</span>
                    )}
                    
                    {!isMyReel && reel.creatorUid && (
                      <div className="ml-2">
                        <FollowButton targetUserId={reel.creatorUid} variant="overlay" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-bold mb-1">{reel.title}</h3>
                  <p className="text-xs text-gray-200 line-clamp-2">{reel.caption}</p>
                </div>

                <div className="absolute right-2 bottom-6 z-10 flex flex-col items-center gap-6 text-white">
                  <button onClick={() => handleLike(reel._id, reel.likes, !!isLiked)} className="flex flex-col items-center gap-1 group">
                    <Heart size={28} className={isLiked ? "fill-pink-500 text-pink-500 transition" : "group-hover:text-pink-500 transition"} />
                    <span className="text-xs font-semibold">{reel.likes}</span>
                  </button>

                  <button onClick={() => setActiveCommentPostId(reel._id)} className="flex flex-col items-center gap-1 group">
                    <MessageCircle size={28} className="group-hover:text-blue-400 transition" />
                    <span className="text-xs font-semibold">{reel.comments}</span>
                  </button>

                  <button onClick={() => handleShare(reel._id, reel.title, reel.caption)} className="flex flex-col items-center gap-1 group">
                    <Send size={28} className="group-hover:text-green-400 transition" />
                    <span className="text-xs font-semibold">Share</span>
                  </button>
                  
                  <button onClick={() => setActiveSavePostId(reel._id)} className="flex flex-col items-center gap-1 group">
                    <Bookmark size={28} className={reel.isSaved ? "fill-yellow-400 text-yellow-400" : "group-hover:text-yellow-400 transition"} />
                    <span className="text-xs font-semibold">Save</span>
                  </button>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <CommentModal 
        postId={activeCommentPostId || ""} 
        isOpen={!!activeCommentPostId} 
        onClose={() => setActiveCommentPostId(null)} 
        onCommentAdded={() => {
          setReels(prev => prev.map(r => r._id === activeCommentPostId ? { ...r, comments: r.comments + 1 } : r));
        }}
      />
      <SaveModal postId={activeSavePostId || ""} isOpen={!!activeSavePostId} onClose={() => setActiveSavePostId(null)} />
    </div>
  );
}