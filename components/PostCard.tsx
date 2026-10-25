"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import CommentModal from "./CommentModal";
import SaveModal from "./SaveModal";
import FollowButton from "./FollowButton";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { getMediaList, isVideoUrl, playableVideoUrl } from "@/lib/media";
import { useWatchTracker } from "@/lib/useWatchTracker";

function timeAgo(dateString?: string) {
  if (!dateString) return "";
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return new Date(dateString).toLocaleDateString();
}

export default function PostCard({ post }: { post: any }) {
  const { dbUser, refreshUser } = useAuth();
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  
  const [likesCount, setLikesCount] = useState<number>(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState<number>(post.comments || 0); 
  const [isExpanded, setIsExpanded] = useState(false); 
  const [liked, setLiked] = useState(post.isLiked || false);
  const [saved, setSaved] = useState(post.isSaved || false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHeart, setShowHeart] = useState(false);

  // QUIZ: pehle se jawab diya ho to server se aaya attempt dikhao (page refresh par bhi)
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(post.quizAttempt ? post.quizAttempt.selectedIndex : null);
  const [correctQuizIndex, setCorrectQuizIndex] = useState<number | null>(post.quizAttempt ? post.quizAttempt.correctOptionIndex : null);
  const [quizResult, setQuizResult] = useState<"correct" | "wrong" | null>(post.quizAttempt ? (post.quizAttempt.isCorrect ? "correct" : "wrong") : null);
  const [quizXP, setQuizXP] = useState<number>(post.quizAttempt?.xpAwarded || 0);
  const [quizSubmitting, setQuizSubmitting] = useState(false);

  // Post jab screen par dikhti hai (50%+), tab ka time ginte hain
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.5 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useWatchTracker(post._id, visible, !!dbUser);

  const mediaList = getMediaList(post);

  // Creator ki profile: apni post ho to /profile, warna /profile/[uid]
  const isOwnPost = !!dbUser && !!post.creatorUid && post.creatorUid === dbUser.firebaseUid;
  const profileHref = post.creatorUid ? (isOwnPost ? "/profile" : `/profile/${post.creatorUid}`) : null;

  const handleLike = async () => {
    if (!dbUser) return;
    const wasLiked = liked;
    const previousCount = likesCount;

    // Optimistic update
    setLiked(!wasLiked);
    setLikesCount(wasLiked ? Math.max(0, previousCount - 1) : previousCount + 1);

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Like failed");

      // Server ka sach hi final
      setLiked(data.isLiked);
      if (typeof data.likes === "number") setLikesCount(data.likes);
    } catch (error) {
      console.error("Like failed", error);
      setLiked(wasLiked);
      setLikesCount(previousCount);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
  };

  const handleShare = async () => {
    const path = post.type === "reel" ? "/reels?id=" : "/feed?id=";
    const shareUrl = window.location.origin + path + post._id;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.caption, url: shareUrl });
      } catch (err) { console.log("Share failed", err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert("🔗 Link copied to clipboard!");
    }
  };

  const handleQuizSubmit = async (index: number) => {
    if (!dbUser || selectedQuizOption !== null || quizSubmitting) return;
    setQuizSubmitting(true);

    try {
      const res = await fetch(`/api/posts/${post._id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedIndex: index })
      });
      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Quiz submit nahi hua. Dobara try karo.");
        return;
      }

      setSelectedQuizOption(typeof data.selectedIndex === "number" ? data.selectedIndex : index);
      setCorrectQuizIndex(data.correctOptionIndex);
      setQuizResult(data.isCorrect ? "correct" : "wrong");
      setQuizXP(data.xpAwarded || 0);

      if (data.xpAwarded > 0) await refreshUser();
    } catch (error) {
      console.error("Quiz submit failed", error);
      alert("Quiz submit nahi hua. Dobara try karo.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = Math.abs(offset.x) * velocity.x;
    if (swipe < -10000) { if (currentIndex < mediaList.length - 1) setCurrentIndex(prev => prev + 1); } 
    else if (swipe > 10000) { if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }
  };

  const cleanInstaHandle = post.instagramHandle ? post.instagramHandle.replace('@', '') : null;

  const avatar = (
    <div className="w-9 h-9 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
      {post.creatorPhotoURL ? (
        <img src={post.creatorPhotoURL} alt="" className="w-full h-full object-cover" />
      ) : (
        post.creatorName?.charAt(0) || 'U'
      )}
    </div>
  );

  return (
    <>
      <div ref={cardRef} id={`post-${post._id}`} className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 pb-4 mb-2 w-full">
        
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3 min-w-0">
            {profileHref ? <Link href={profileHref} className="shrink-0">{avatar}</Link> : avatar}
            <div className="overflow-hidden">
              <h3 className="text-sm font-semibold text-black dark:text-white leading-tight flex items-center gap-1 truncate">
                {profileHref ? (
                  <Link href={profileHref} className="hover:underline truncate">{post.creatorName}</Link>
                ) : (
                  post.creatorName
                )}
                {cleanInstaHandle && (<a href={`https://instagram.com/${cleanInstaHandle}`} target="_blank" rel="noreferrer" className="text-[11px] text-pink-500 font-medium hover:underline ml-1">@{cleanInstaHandle}</a>)}
                <span className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-500 font-normal ml-1 shrink-0">{post.subject || "General"}</span>
              </h3>
              <p className="text-xs text-gray-500 truncate">{timeAgo(post.createdAt)}</p>
            </div>
          </div>

          {post.creatorUid && !isOwnPost && post.type !== "story" && (
            <FollowButton targetUserId={post.creatorUid} variant="card" />
          )}
        </div>

        {post.isTextPost ? (
          <div className={`w-full aspect-square flex items-center justify-center p-8 text-center ${post.backgroundColor || 'bg-black'}`} onDoubleClick={handleDoubleTap}>
            <h2 className="text-white text-2xl font-bold whitespace-pre-wrap">{post.caption}</h2>
          </div>
        ) : post.type === 'quiz' && post.quizData ? (
          <div className="w-full bg-gray-50 dark:bg-zinc-900 p-6 flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-4 dark:text-white">{post.quizData.question}</h3>
            <div className="flex flex-col gap-3">
              {post.quizData.options.map((opt: string, i: number) => {
                const isSelected = selectedQuizOption === i;
                const isCorrect = correctQuizIndex !== null && i === correctQuizIndex;
                let btnClass = "p-3 rounded-xl border border-gray-200 dark:border-zinc-700 text-left dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition flex justify-between items-center";
                if (selectedQuizOption !== null) {
                  if (isCorrect) btnClass = "p-3 rounded-xl border border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-left font-semibold flex justify-between items-center";
                  else if (isSelected) btnClass = "p-3 rounded-xl border border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-left flex justify-between items-center";
                  else btnClass = "p-3 rounded-xl border border-gray-200 dark:border-zinc-800 opacity-50 text-left dark:text-white flex justify-between items-center";
                }
                return (
                  <button key={i} onClick={() => handleQuizSubmit(i)} disabled={selectedQuizOption !== null || quizSubmitting} className={btnClass}>
                    {opt}
                    {selectedQuizOption !== null && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                    {selectedQuizOption !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
            {quizResult && (
              <div className={`mt-4 text-center font-bold ${quizResult === 'correct' ? 'text-green-500' : 'text-red-500'}`}>
                {quizResult === 'correct' ? `Correct!${quizXP > 0 ? ` +${quizXP} XP` : ''}` : 'Wrong answer.'}
              </div>
            )}
          </div>
        ) : mediaList.length > 0 ? (
          <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900 relative group overflow-hidden" onDoubleClick={handleDoubleTap}>
            <motion.div className="flex h-full w-full cursor-grab active:cursor-grabbing" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd} animate={{ x: `-${currentIndex * 100}%` }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              {mediaList.map((url: string, index: number) => (
                <div key={index} className="w-full h-full flex-shrink-0 snap-center pointer-events-none">
                  {isVideoUrl(url) ? (
                    <video src={playableVideoUrl(url)} controls playsInline preload="metadata" className="w-full h-full object-cover pointer-events-auto" />
                  ) : (
                    <img src={url} alt="Post" className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
              ))}
            </motion.div>

            <AnimatePresence>
              {showHeart && (
                <motion.div initial={{ scale: 0, opacity: 0, rotate: -15 }} animate={{ scale: [0, 1.3, 1, 1.2, 0], opacity: [0, 1, 1, 1, 0], rotate: [-15, 0, 0, 15, 0] }} transition={{ duration: 0.8, ease: "easeInOut", times: [0, 0.2, 0.5, 0.8, 1] }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart className="w-28 h-28 fill-pink-500 text-pink-500 drop-shadow-2xl" />
                </motion.div>
              )}
            </AnimatePresence>

            {mediaList.length > 1 && (
              <>
                {currentIndex > 0 && <button onClick={() => setCurrentIndex(prev => prev - 1)} className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition z-10 hover:bg-black/70"><ChevronLeft className="w-5 h-5" /></button>}
                {currentIndex < mediaList.length - 1 && <button onClick={() => setCurrentIndex(prev => prev + 1)} className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition z-10 hover:bg-black/70"><ChevronRight className="w-5 h-5" /></button>}
              </>
            )}
            {mediaList.length > 1 && <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md z-10 backdrop-blur-sm">{currentIndex + 1}/{mediaList.length}</div>}
          </div>
        ) : null}

        <div className="flex justify-between items-center px-3 pt-3 pb-2">
          <div className="flex gap-4">
            <button onClick={handleLike} className="flex items-center gap-1"><Heart className={`w-6 h-6 transition ${liked ? "fill-pink-500 text-pink-500" : "text-black dark:text-white"}`} /></button>
            <button onClick={() => setIsCommentOpen(true)} className="flex items-center gap-1"><MessageCircle className="w-6 h-6 text-black dark:text-white" /></button>
            <button onClick={handleShare} className="flex items-center gap-1"><Send className="w-6 h-6 text-black dark:text-white" /></button>
          </div>
          <button onClick={() => setIsSaveModalOpen(true)}><Bookmark className={`w-6 h-6 ${saved ? "fill-black dark:fill-white text-black dark:text-white" : "text-black dark:text-white"}`} /></button>
        </div>

        <div className="px-3">
          <p className="text-sm font-semibold text-black dark:text-white mb-1">{likesCount} likes</p>
          {!post.isTextPost && (
             <div className="text-sm text-black dark:text-gray-200">
               <span className="font-semibold mr-2">{post.creatorName}</span>
               <span className={!isExpanded && post.caption?.length > 80 ? "line-clamp-2" : ""}>{post.caption}</span>
               {post.caption?.length > 80 && (<button onClick={() => setIsExpanded(!isExpanded)} className="text-gray-500 ml-1 font-medium hover:underline">{isExpanded ? "less" : "more"}</button>)}
             </div>
          )}
          <p onClick={() => setIsCommentOpen(true)} className="text-xs text-gray-500 mt-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">View all {commentsCount} comments</p>
        </div>
      </div>

      <CommentModal postId={post._id} isOpen={isCommentOpen} onClose={() => setIsCommentOpen(false)} onCommentAdded={() => setCommentsCount((prev: number) => prev + 1)} />
      <SaveModal postId={post._id} isOpen={isSaveModalOpen} onClose={() => setIsSaveModalOpen(false)} onSavedChange={setSaved} />
    </>
  );
}