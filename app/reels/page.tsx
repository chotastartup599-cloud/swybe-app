"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Mousewheel } from "swiper/modules";
import { Heart, MessageCircle, Send, Bookmark, Volume2, VolumeX, Play } from "lucide-react";
import CommentModal from "@/components/CommentModal";
import SaveModal from "@/components/SaveModal";
import FollowButton from "@/components/FollowButton";
import { useAuth } from "@/context/AuthContext";
import { getMediaList, playableVideoUrl } from "@/lib/media";
import { useWatchTracker } from "@/lib/useWatchTracker";
import "swiper/css";

const PAGE_SIZE = 8;

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

// Ek reel ki poori slide. Video sirf active (aur uske aas-paas ki) slide par load hota hai,
// aur sirf active slide chalti hai (pehle saari reels ek saath chalti thi, awaaz bhi).
function ReelSlide({
  reel, isActive, isNear, muted, onToggleMute, paused, canTrack, isMine,
  onLike, onComment, onShare, onSave,
}: {
  reel: Reel;
  isActive: boolean;
  isNear: boolean;
  muted: boolean;
  onToggleMute: () => void;
  paused: boolean;
  canTrack: boolean;
  isMine: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const src = playableVideoUrl(getMediaList(reel)[0] || "");
  const shouldPlay = isActive && !paused && !userPaused;

  // Reel jitni der sach me chali, utna time ginta hai
  useWatchTracker(reel._id, shouldPlay, canTrack);

  useEffect(() => { if (!isActive) setUserPaused(false); }, [isActive]);

  // React ka `muted` prop baad me update nahi hota, isliye seedha video par set karte hain
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted, isNear]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) {
      v.play().catch(() => {});
    } else {
      v.pause();
      if (!isActive) { try { v.currentTime = 0; } catch {} }
    }
  }, [shouldPlay, isActive, isNear]);

  const profileHref = reel.creatorUid ? (isMine ? "/profile" : `/profile/${reel.creatorUid}`) : null;
  const avatar = (
    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shrink-0">
      {reel.creatorPhotoURL ? <img src={reel.creatorPhotoURL} alt="" className="w-full h-full object-cover" /> : (reel.creatorName?.charAt(0) || "U")}
    </div>
  );

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      {!src ? (
        <div className="text-gray-400 text-sm">Video available nahi hai.</div>
      ) : isNear ? (
        <video
          ref={videoRef}
          src={src}
          loop
          playsInline
          muted
          preload="auto"
          onClick={() => setUserPaused((p) => !p)}
          className="w-full h-full object-cover cursor-pointer"
        />
      ) : null}

      {userPaused && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/50 p-4 rounded-full"><Play className="w-10 h-10 text-white fill-white" /></div>
        </div>
      )}

      <button onClick={onToggleMute} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full z-10 text-white backdrop-blur-sm hover:bg-black/70 transition">
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
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
            <span className="text-xs text-gray-300 truncate">@{reel.instagramHandle.replace("@", "")}</span>
          )}
          {!isMine && reel.creatorUid && (
            <div className="ml-2">
              <FollowButton targetUserId={reel.creatorUid} variant="overlay" />
            </div>
          )}
        </div>
        <h3 className="text-sm font-bold mb-1">{reel.title}</h3>
        <p className="text-xs text-gray-200 line-clamp-2">{reel.caption}</p>
      </div>

      <div className="absolute right-2 bottom-6 z-10 flex flex-col items-center gap-6 text-white">
        <button onClick={onLike} className="flex flex-col items-center gap-1 group">
          <Heart size={28} className={reel.isLiked ? "fill-pink-500 text-pink-500 transition" : "group-hover:text-pink-500 transition"} />
          <span className="text-xs font-semibold">{reel.likes}</span>
        </button>

        <button onClick={onComment} className="flex flex-col items-center gap-1 group">
          <MessageCircle size={28} className="group-hover:text-blue-400 transition" />
          <span className="text-xs font-semibold">{reel.comments}</span>
        </button>

        <button onClick={onShare} className="flex flex-col items-center gap-1 group">
          <Send size={28} className="group-hover:text-green-400 transition" />
          <span className="text-xs font-semibold">Share</span>
        </button>

        <button onClick={onSave} className="flex flex-col items-center gap-1 group">
          <Bookmark size={28} className={reel.isSaved ? "fill-yellow-400 text-yellow-400" : "group-hover:text-yellow-400 transition"} />
          <span className="text-xs font-semibold">Save</span>
        </button>
      </div>
    </div>
  );
}

function ReelsContent() {
  const { dbUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const sharedId = searchParams.get("id");
  const uid: string | undefined = dbUser?.firebaseUid;

  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [pageHidden, setPageHidden] = useState(false);

  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [activeSavePostId, setActiveSavePostId] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadedCountRef = useRef(0);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(true);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (authLoading) return;
    if (!reset && (busyRef.current || !hasMoreRef.current)) return;

    const requestId = ++requestIdRef.current;
    busyRef.current = true;
    const skip = reset ? 0 : loadedCountRef.current;
    if (reset) { setLoading(true); setError(false); }

    try {
      const res = await fetch(`/api/posts?type=reel&limit=${PAGE_SIZE}&skip=${skip}`, { cache: "no-store" });
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      if (!data.success) throw new Error(data.error || "Reels load nahi hue");

      const incoming: Reel[] = data.data;

      // Share link (/reels?id=...): wo reel sabse pehle
      let shared: Reel | null = null;
      if (reset && sharedId) {
        try {
          const sRes = await fetch(`/api/posts?type=reel&id=${encodeURIComponent(sharedId)}`, { cache: "no-store" });
          const sData = await sRes.json();
          if (sData.success && sData.data.length > 0) shared = sData.data[0];
        } catch {}
        if (requestId !== requestIdRef.current) return;
      }

      loadedCountRef.current = skip + incoming.length;
      hasMoreRef.current = incoming.length === PAGE_SIZE;

      setReels((prev) => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map((r) => r._id));
        const list = shared ? [shared, ...incoming.filter((r) => r._id !== shared!._id)] : incoming;
        return [...base, ...list.filter((r) => !seen.has(r._id))];
      });
    } catch (err) {
      if (requestId === requestIdRef.current) {
        console.error("Error fetching reels:", err);
        setError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        busyRef.current = false;
        setLoading(false);
      }
    }
  }, [authLoading, uid, sharedId]);

  // Auth ka result aane ke baad ek hi baar fetch (pehle login hone par dobara fetch hota tha)
  useEffect(() => {
    if (authLoading) return;
    loadedCountRef.current = 0;
    hasMoreRef.current = true;
    setReels([]);
    setActiveIndex(0);
    fetchPage(true);
  }, [fetchPage, authLoading]);

  // Aakhri 3 reels bachne par agli reels load
  useEffect(() => {
    if (reels.length > 0 && activeIndex >= reels.length - 3) fetchPage(false);
  }, [activeIndex, reels.length, fetchPage]);

  // Tab background me jaye to video pause
  useEffect(() => {
    const onVisibility = () => setPageHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const handleLike = async (id: string, currentLikes: number, isAlreadyLiked: boolean) => {
    if (!dbUser) return;

    setReels((prev) =>
      prev.map((reel) =>
        reel._id === id ? { ...reel, likes: isAlreadyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1, isLiked: !isAlreadyLiked } : reel
      )
    );

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Like failed");

      setReels((prev) => prev.map((reel) => reel._id === id ? { ...reel, isLiked: data.isLiked, likes: typeof data.likes === "number" ? data.likes : reel.likes } : reel));
    } catch (error) {
      console.error("Like failed:", error);
      setReels((prev) => prev.map((reel) => reel._id === id ? { ...reel, likes: currentLikes, isLiked: isAlreadyLiked } : reel));
    }
  };

  const handleShare = async (reel: Reel) => {
    const shareUrl = window.location.origin + "/reels?id=" + reel._id;
    if (navigator.share) {
      try { await navigator.share({ title: reel.title, text: reel.caption, url: shareUrl }); } catch (err) { console.log("Share failed", err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("🔗 Link copied to clipboard!");
    }
  };

  if (loading || authLoading) return <div className="w-full h-[80vh] bg-black flex items-center justify-center text-white">Loading Reels...</div>;

  if (reels.length === 0) {
    return (
      <div className="w-full h-[80vh] bg-black flex flex-col items-center justify-center text-white gap-3">
        <p>{error ? "Reels load nahi ho paye." : "No Reels found."}</p>
        {error && <button onClick={() => fetchPage(true)} className="px-5 py-2 rounded-xl bg-blue-600 text-sm font-semibold hover:bg-blue-700 transition">Retry</button>}
      </div>
    );
  }

  const paused = !!activeCommentPostId || !!activeSavePostId || pageHidden;

  return (
    <div className="w-full min-h-screen bg-black flex justify-center pt-16 pb-16">
      <div className="w-full max-w-[420px] h-[calc(100dvh-128px)] bg-zinc-950 relative overflow-hidden rounded-xl shadow-2xl border border-zinc-800">
        <Swiper
          direction="vertical"
          slidesPerView={1}
          mousewheel={true}
          modules={[Mousewheel]}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className="w-full h-full"
        >
          {reels.map((reel, index) => (
            <SwiperSlide key={reel._id} className="w-full h-full">
              <ReelSlide
                reel={reel}
                isActive={index === activeIndex}
                isNear={Math.abs(index - activeIndex) <= 1}
                muted={isMuted}
                onToggleMute={() => setIsMuted((m) => !m)}
                paused={paused}
                canTrack={!!dbUser}
                isMine={!!dbUser && !!reel.creatorUid && dbUser.firebaseUid === reel.creatorUid}
                onLike={() => handleLike(reel._id, reel.likes, !!reel.isLiked)}
                onComment={() => setActiveCommentPostId(reel._id)}
                onShare={() => handleShare(reel)}
                onSave={() => setActiveSavePostId(reel._id)}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <CommentModal
        postId={activeCommentPostId || ""}
        isOpen={!!activeCommentPostId}
        onClose={() => setActiveCommentPostId(null)}
        onCommentAdded={() => {
          setReels((prev) => prev.map((r) => r._id === activeCommentPostId ? { ...r, comments: r.comments + 1 } : r));
        }}
      />
      <SaveModal
        postId={activeSavePostId || ""}
        isOpen={!!activeSavePostId}
        onClose={() => setActiveSavePostId(null)}
        onSavedChange={(saved) => {
          setReels((prev) => prev.map((r) => r._id === activeSavePostId ? { ...r, isSaved: saved } : r));
        }}
      />
    </div>
  );
}

export default function ReelsPage() {
  return (
    <Suspense fallback={<div className="w-full h-[80vh] bg-black flex items-center justify-center text-white">Loading Reels...</div>}>
      <ReelsContent />
    </Suspense>
  );
}