"use client";

import { useState, useEffect, useRef } from "react";
import { X, Send, Smile, Heart } from "lucide-react";

export default function CommentModal({ 
  postId, 
  isOpen, 
  onClose,
  onCommentAdded // <-- Naya Prop
}: { 
  postId: string, 
  isOpen: boolean, 
  onClose: () => void,
  onCommentAdded?: () => void 
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  
  const [replyTo, setReplyTo] = useState<{ id: string, userName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [likedComments, setLikedComments] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
      const savedLikes = JSON.parse(localStorage.getItem("swybe_liked_comments") || "[]");
      setLikedComments(savedLikes);
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } catch (error) { console.log(error); }
  };

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setLoading(true);

    const finalText = replyTo ? `@${replyTo.userName} ${newComment}` : newComment;

    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        userName: "Rohan Sah", 
        text: finalText,
        parentId: replyTo ? replyTo.id : null 
      }),
    });

    if (res.ok) {
      setNewComment("");
      setReplyTo(null);
      setShowEmoji(false);
      fetchComments();
      
      // NAYA: Parent ko batao ki naya comment add ho gaya hai
      if (onCommentAdded) onCommentAdded();
    }
    setLoading(false);
  };

  const toggleLikeComment = async (commentId: string) => {
    const isAlreadyLiked = likedComments.includes(commentId);
    let updatedLikes = isAlreadyLiked 
      ? likedComments.filter(id => id !== commentId) 
      : [...likedComments, commentId];
      
    setLikedComments(updatedLikes);
    localStorage.setItem("swybe_liked_comments", JSON.stringify(updatedLikes));
    
    if (!isAlreadyLiked) await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
  };

  const toggleReplies = (commentId: string) => {
    if (expandedReplies.includes(commentId)) {
      setExpandedReplies(expandedReplies.filter(id => id !== commentId));
    } else {
      setExpandedReplies([...expandedReplies, commentId]);
    }
  };

  const formatTime = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (!isOpen) return null;
  
  const mainComments = comments.filter(c => !c.parentId);

  const renderComment = (c: any, rootId: string) => {
    const replies = comments.filter(r => r.parentId === rootId);
    const isMainComment = c._id === rootId;
    const isExpanded = expandedReplies.includes(rootId);
    const isLiked = likedComments.includes(c._id);

    return (
      <div key={c._id} className="flex gap-3 w-full items-start mt-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {c.userName.charAt(0)}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex justify-between items-start w-full">
            <div className="flex flex-col w-full pr-2">
              <span className="text-sm font-semibold text-black dark:text-white">
                {c.userName}
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-300 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                {c.text}
              </span>
            </div>
            
            <button onClick={() => toggleLikeComment(c._id)} className="shrink-0 mt-1">
              <Heart className={`w-4 h-4 transition ${isLiked ? "fill-red-500 text-red-500" : "text-gray-400 hover:text-red-500"}`} />
            </button>
          </div>
          
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 font-medium">
            <span>{formatTime(c.createdAt)}</span>
            <span 
              className="cursor-pointer hover:text-gray-800 dark:hover:text-gray-300" 
              onClick={() => {
                setReplyTo({ id: rootId, userName: c.userName });
                inputRef.current?.focus();
              }}
            >
              Reply
            </span>
            {c.likes > 0 && <span className="text-gray-400">{c.likes} likes</span>}
          </div>

          {isMainComment && replies.length > 0 && (
            <button 
              onClick={() => toggleReplies(rootId)} 
              className="text-xs text-gray-500 mt-2 font-medium hover:text-gray-800 dark:hover:text-gray-300 flex items-center gap-2"
            >
              <div className="w-6 h-[1px] bg-gray-400"></div>
              {isExpanded ? "Hide all replies" : `View ${replies.length} replies`}
            </button>
          )}

          {isMainComment && isExpanded && replies.map(reply => renderComment(reply, rootId))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl h-[75vh] flex flex-col animate-slide-up shadow-2xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="flex flex-col items-center pt-2 pb-3 border-b border-gray-200 dark:border-gray-800">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mb-2"></div>
          <div className="w-full flex justify-between items-center px-4">
            <h3 className="font-bold text-lg dark:text-white">Comments</h3>
            <X className="w-6 h-6 cursor-pointer dark:text-white" onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 pb-10">
          {mainComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p className="text-lg font-semibold mb-1">No comments yet</p>
            </div>
          ) : (
            mainComments.map((c) => renderComment(c, c._id))
          )}
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-zinc-900 relative">
          {showEmoji && (
            <div className="absolute bottom-full left-2 mb-2 bg-gray-100 dark:bg-zinc-800 rounded-2xl p-2 flex gap-3 shadow-lg border border-gray-200 dark:border-gray-700 z-50">
              {["❤️", "🙌", "🔥", "😂", "😮", "😢", "👏", "💯"].map(emoji => (
                <span key={emoji} onClick={() => setNewComment(newComment + emoji)} className="text-2xl cursor-pointer hover:scale-125 transition">
                  {emoji}
                </span>
              ))}
            </div>
          )}

          {replyTo && (
            <div className="bg-gray-100 dark:bg-zinc-800 text-sm px-3 py-2 flex justify-between items-center rounded-t-lg border-b border-gray-200 dark:border-gray-700 mb-2">
              <span className="text-gray-500 dark:text-gray-400">Replying to <span className="font-semibold text-black dark:text-white">@{replyTo.userName}</span></span>
              <X className="w-4 h-4 cursor-pointer text-gray-500" onClick={() => setReplyTo(null)} />
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">R</div>
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full px-3 py-2 border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 transition">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-transparent text-sm text-black dark:text-white outline-none"
              />
              <button onClick={() => setShowEmoji(!showEmoji)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button onClick={handlePost} disabled={loading || !newComment.trim()} className="text-blue-500 font-semibold px-2 disabled:opacity-50">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}