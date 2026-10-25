"use client";

import { useState, useEffect, useRef } from "react";
import { X, Smile, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function CommentModal({ postId, isOpen, onClose, onCommentAdded }: { postId: string, isOpen: boolean, onClose: () => void, onCommentAdded?: () => void }) {
  const { dbUser, user } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string, userName: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Comment ke liye real account chahiye (guest nahi)
  const canComment = !!dbUser && !user?.isAnonymous;

  useEffect(() => {
    if (isOpen && postId) {
      setError(null);
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) setComments(data.data);
    } catch (err) { console.log(err); }
  };

  const handlePost = async () => {
    if (!newComment.trim() || !canComment || loading) return;
    setLoading(true);
    setError(null);

    const finalText = replyTo ? `@${replyTo.userName} ${newComment}` : newComment;

    try {
      // Naam server khud DB se lagata hai, client se nahi bhejte
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: finalText,
          parentId: replyTo ? replyTo.id : null 
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNewComment("");
        setReplyTo(null);
        setShowEmoji(false);
        await fetchComments();
        if (onCommentAdded) onCommentAdded();
      } else {
        setError(data.error || "Comment post nahi hua.");
      }
    } catch (err) {
      setError("Network error. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleLikeComment = async (commentId: string) => {
    if (!dbUser) return;

    // Optimistic update
    setComments(prev => prev.map(c =>
      c._id === commentId
        ? { ...c, likedByMe: !c.likedByMe, likes: Math.max(0, (c.likes || 0) + (c.likedByMe ? -1 : 1)) }
        : c
    ));

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setComments(prev => prev.map(c =>
          c._id === commentId ? { ...c, likedByMe: data.isLiked, likes: data.likes } : c
        ));
      } else {
        fetchComments();
      }
    } catch (err) {
      fetchComments();
    }
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
    const isLiked = !!c.likedByMe;

    return (
      <div key={c._id} className="flex gap-3 w-full items-start mt-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-yellow-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {c.userName?.charAt(0) || "U"}
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
            <button onClick={() => toggleReplies(rootId)} className="text-xs text-gray-500 mt-2 font-medium hover:text-gray-800 dark:hover:text-gray-300 flex items-center gap-2">
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

          {error && <p className="text-xs text-red-500 font-medium mb-2 px-1">{error}</p>}

          {!canComment && (
            <p className="text-xs text-gray-500 mb-2 px-1">Comment karne ke liye apne account se login karo (guest mode me nahi).</p>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {dbUser?.name?.charAt(0) || "U"}
            </div>
            <div className="flex-1 flex items-center bg-gray-100 dark:bg-zinc-800 rounded-full px-3 py-2 border border-transparent focus-within:border-gray-300 dark:focus-within:border-gray-600 transition">
              <input
                ref={inputRef}
                type="text"
                value={newComment}
                maxLength={450}
                disabled={!canComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePost(); }}
                placeholder={canComment ? "Add a comment..." : "Login to comment"}
                className="flex-1 bg-transparent text-sm text-black dark:text-white outline-none disabled:opacity-60"
              />
              <button onClick={() => setShowEmoji(!showEmoji)} disabled={!canComment} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button onClick={handlePost} disabled={loading || !newComment.trim() || !canComment} className="text-blue-500 font-semibold px-2 disabled:opacity-50">
              {loading ? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}