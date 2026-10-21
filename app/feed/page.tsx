"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

function FeedContent() {
  const { dbUser, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get("subject");

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useCallback((node: any) => {
    if (loading || loadingMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setSkip(prev => prev + 10);
      }
    });
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  useEffect(() => {
    async function fetchPosts() {
      if (!dbUser) return;
      if (skip === 0) setLoading(true); else setLoadingMore(true);

      try {
        const details = dbUser.learnerDetails || {};
        const interests = [...(details.subjects || []), ...(details.stream || [])].join(',');
        
        let url = `/api/posts?limit=10&skip=${skip}&userId=${dbUser.firebaseUid}`;
        
        if (activeTab === "forYou") {
          url += `&interests=${interests}`;
        } else if (activeTab === "following") {
          url += `&following=true`;
        }

        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        
        if (data.success) {
          let feedPosts = data.data.filter((post: any) => post.type !== 'reel');
          if (subjectFilter) {
            feedPosts = feedPosts.filter((post: any) => post.subject?.toLowerCase() === subjectFilter.toLowerCase());
          }
          
          if (skip === 0) setPosts(feedPosts);
          else setPosts(prev => [...prev, ...feedPosts]);
          
          if (data.data.length < 10) setHasMore(false);
        }
      } catch (error) { console.error(error); } 
      finally {
        setLoading(false);
        setLoadingMore(false);
      }
    }
    fetchPosts();
  }, [dbUser, skip, activeTab, subjectFilter]);

  if (authLoading || !dbUser) {
    return <div className="h-screen flex items-center justify-center dark:text-white">Redirecting...</div>;
  }

  return (
    <div className="w-full max-w-[470px] mx-auto pt-4 px-2 md:px-0">
      <div className="flex justify-center gap-6 mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2">
        <button onClick={() => { setActiveTab("forYou"); setSkip(0); setHasMore(true); }} className={`text-sm font-semibold pb-2 ${activeTab === "forYou" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-gray-500"}`}>For You</button>
        <button onClick={() => { setActiveTab("following"); setSkip(0); setHasMore(true); }} className={`text-sm font-semibold pb-2 ${activeTab === "following" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-gray-500"}`}>Following</button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          {activeTab === "following" ? "You are not following anyone yet or they haven't posted." : "No posts found."}
        </div>
      ) : (
        posts.map((post, index) => {
          if (posts.length === index + 1) {
            return <div ref={lastPostElementRef} key={post._id}><PostCard post={post} /></div>;
          } else {
            return <PostCard key={post._id} post={post} />;
          }
        })
      )}
      {loadingMore && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
    </div>
  );
}

export default function FeedPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 md:pt-0">
      <StoriesBar />
      <Suspense fallback={<div className="text-center mt-10 text-gray-500">Loading Feed...</div>}>
        <FeedContent />
      </Suspense>
    </div>
  );
}