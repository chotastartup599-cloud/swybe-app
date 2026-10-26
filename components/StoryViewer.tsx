"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Send, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getMediaList, isVideoUrl, playableVideoUrl } from "@/lib/media";

const IMAGE_DURATION_MS = 5000;

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function StoryViewer({
  groups,
  initialGroupIndex,
  onClose,
}: {
  groups: any[];
  initialGroupIndex: number;
  onClose: () => void;
}) {
  const { dbUser, user } = useAuth();

  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyState, setReplyState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const group = groups[groupIndex];
  const story = group?.stories[storyIndex];
  const media = story ? getMediaList(story)[0] : undefined;
  const isVideo = !!story && !story.isTextPost && !!media && isVideoUrl(media);
  const isOwn = !!dbUser && !!story?.creatorUid && story.creatorUid === dbUser.firebaseUid;
  const canInteract = !!dbUser && !user?.isAnonymous;

  const goNext = () => {
    if (!group) return onClose();
    if (storyIndex < group.stories.length - 1) {
      setStoryIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
    } else {
      onClose();
      return;
    }
    setProgress(0);
  };

  const goPrev = () => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((g) => g - 1);
      setStoryIndex(prevGroup.stories.length - 1);
    }
    setProgress(0);
  };

  // Nayi story: sab kuch reset (like ka asli state server se aayi story me hota hai)
  useEffect(() => {
    setProgress(0);
    setPaused(false);
    setReplyText("");
    setReplyState("idle");
    setIsLiked(!!story?.isLiked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  // Photo / text story: 5 second ka timer (video ka progress video khud chalata hai)
  useEffect(() => {
    if (!story || isVideo || paused) return;
    const step = 50;
    const timer = setInterval(() => {
      setProgress((p) => Math.min(100, p + (step / IMAGE_DURATION_MS) * 100));
    }, step);
    return () => clearInterval(timer);
  }, [story?._id, isVideo, paused]);

  // Progress 100 hote hi agli story
  useEffect(() => {
    if (progress >= 100) goNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  // Video play/pause aur mute
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = muted;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, muted, story?._id]);

  // Tab background me jaye to pause
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPaused(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Keyboard: Esc, left, right
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  // Viewer khula ho to peeche ka page scroll na ho
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  const handleLike = async () => {
    if (!story || !canInteract) return;
    const previous = isLiked;
    setIsLiked(!previous);
    try {
      const res = await fetch(`/api/posts/${story._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setIsLiked(!!data.isLiked);
      story.isLiked = !!data.isLiked;
    } catch (error) {
      console.error("Story like failed");
      setIsLiked(previous);
    }
  };

  // Reply creator ko private notification ke roop me jaata hai (public comment nahi banta)
  const handleReply = async () => {
    if (!story || !replyText.trim() || !canInteract || replyState === "sending") return;
    setReplyState("sending");
    try {
      const res = await fetch(`/api/posts/${story._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: replyText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setReplyText("");
      setReplyState("sent");
      setTimeout(() => setReplyState("idle"), 2000);
    } catch (error) {
      console.error("Reply failed");
      setReplyState("error");
      setTimeout(() => setReplyState("idle"), 2500);
    }
  };

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full sm:h-[85vh] bg-zinc-900 sm:rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Progress Bars (is creator ki saari stories) */}
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {group.stories.map((s: any, idx: number) => (
            <div key={s._id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white"
                style={{ width: idx === storyIndex ? `${progress}%` : idx < storyIndex ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0">
              {group.creatorPhotoURL ? <img src={group.creatorPhotoURL} alt="" className="w-full h-full object-cover" /> : (group.creatorName?.charAt(0) || "U")}
            </div>
            <span className="text-white font-semibold text-sm truncate">{group.creatorName}</span>
            <span className="text-white/60 text-xs shrink-0">{timeAgo(story.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            {isVideo && (
              <button onClick={() => setMuted((m) => !m)} className="text-white hover:text-gray-300">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            )}
            <button onClick={onClose} className="text-white hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation Tap Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer" onClick={goNext} />

        {/* Media/Text Rendering */}
        <div className="flex-1 relative bg-black">
          {story.isTextPost ? (
            <div className={`w-full h-full flex items-center justify-center p-10 text-center ${story.backgroundColor || "bg-black"}`}>
              <h2 className="text-white text-3xl font-bold whitespace-pre-wrap">{story.caption}</h2>
            </div>
          ) : media ? (
            isVideo ? (
              <video
                key={story._id}
                ref={videoRef}
                src={playableVideoUrl(media)}
                autoPlay
                muted
                playsInline
                onTimeUpdate={(e) => {
                  const v = e.currentTarget;
                  if (v.duration) setProgress(Math.min(100, (v.currentTime / v.duration) * 100));
                }}
                onEnded={() => setProgress(100)}
                onError={() => goNext()}
                className="w-full h-full object-cover"
              />
            ) : (
              <img key={story._id} src={media} alt="Story" className="w-full h-full object-cover" />
            )
          ) : null}

          {/* Caption (photo/video story ke saath) */}
          {!story.isTextPost && story.caption && (
            <div className="absolute bottom-20 left-4 right-4 z-10 pointer-events-none">
              <p className="text-white text-sm bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2 line-clamp-3">{story.caption}</p>
            </div>
          )}
        </div>

        {/* BOTTOM ACTIONS (Like & Reply) */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3">
          {!isOwn && (
            <div className="flex-1 flex items-center bg-black/50 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md">
              <input 
                type="text" 
                maxLength={200}
                disabled={!canInteract}
                placeholder={
                  !canInteract ? "Login to reply"
                  : replyState === "sent" ? "Reply sent ✓"
                  : replyState === "error" ? "Reply nahi gaya, dobara try karo"
                  : `Reply to ${group.creatorName}...`
                }
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setPaused(true)}
                onBlur={() => setPaused(false)}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/60 disabled:opacity-60"
              />
            </div>
          )}
          {isOwn && <div className="flex-1" />}
          {!isOwn && (
            <button onClick={handleReply} disabled={!canInteract || !replyText.trim() || replyState === "sending"} className="text-white p-2 disabled:opacity-40">
              <Send className="w-6 h-6" />
            </button>
          )}
          <button onClick={handleLike} disabled={!canInteract} className="text-white p-2 transition-transform active:scale-90 disabled:opacity-40">
            <Heart className={`w-7 h-7 ${isLiked ? "fill-pink-500 text-pink-500" : "fill-transparent"}`} />
          </button>
        </div>

        {/* Desktop Arrows */}
        <button onClick={goPrev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={goNext} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}