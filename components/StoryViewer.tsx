"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Heart, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function StoryViewer({ stories, initialIndex, onClose }: { stories: any[], initialIndex: number, onClose: () => void }) {
  const { dbUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState("");

  const currentStory = stories[currentIndex];

  useEffect(() => {
    // 5 second timer for story progression
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    // Reset states for new story
    setIsLiked(false);
    setReplyText("");

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleLike = async () => {
    if (!dbUser || !currentStory) return;
    setIsLiked(!isLiked);
    
    try {
      await fetch(`/api/posts/${currentStory._id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.firebaseUid })
      });
    } catch (error) {
      console.error("Story like failed");
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !dbUser) return;
    // Simple reply logic: Save as a comment for now
    try {
      await fetch(`/api/posts/${currentStory._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: dbUser.name, text: replyText })
      });
      setReplyText("");
      alert("Reply sent!");
    } catch (error) {
      console.error("Reply failed");
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-md h-full sm:h-[85vh] bg-zinc-900 sm:rounded-xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Progress Bar */}
        <div className="absolute top-4 left-4 right-4 z-30 flex gap-1">
          {stories.map((_, idx) => (
            <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{ width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-8 left-4 right-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-sm">
              {currentStory.creatorName?.charAt(0)}
            </div>
            <span className="text-white font-semibold text-sm">{currentStory.creatorName}</span>
            <span className="text-white/60 text-xs">Just now</span>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tap Areas */}
        <div className="absolute inset-y-0 left-0 w-1/3 z-20 cursor-pointer" onClick={handlePrev} />
        <div className="absolute inset-y-0 right-0 w-2/3 z-20 cursor-pointer" onClick={handleNext} />

        {/* Media/Text Rendering */}
        <div className="flex-1 relative bg-black">
          {currentStory.isTextPost ? (
            <div className={`w-full h-full flex items-center justify-center p-10 text-center ${currentStory.backgroundColor || 'bg-black'}`}>
              <h2 className="text-white text-3xl font-bold whitespace-pre-wrap">{currentStory.caption}</h2>
            </div>
          ) : currentStory.mediaUrls && currentStory.mediaUrls.length > 0 ? (
            currentStory.mediaUrls[0].includes('.mp4') ? (
              <video src={currentStory.mediaUrls[0]} autoPlay muted loop className="w-full h-full object-cover" />
            ) : (
              <img src={currentStory.mediaUrls[0]} alt="Story" className="w-full h-full object-cover" />
            )
          ) : null}
        </div>

        {/* BOTTOM ACTIONS (Like & Reply) */}
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center gap-3">
          <div className="flex-1 flex items-center bg-black/50 border border-white/30 rounded-full px-4 py-2 backdrop-blur-md">
            <input 
              type="text" 
              placeholder={`Reply to ${currentStory.creatorName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/60"
            />
          </div>
          <button onClick={handleReply} className="text-white p-2">
            <Send className="w-6 h-6" />
          </button>
          <button onClick={handleLike} className="text-white p-2 transition-transform active:scale-90">
            <Heart className={`w-7 h-7 ${isLiked ? "fill-pink-500 text-pink-500" : "fill-transparent"}`} />
          </button>
        </div>

        {/* Desktop Arrows */}
        <button onClick={handlePrev} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button onClick={handleNext} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}