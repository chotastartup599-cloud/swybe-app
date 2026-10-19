"use client";

import { useState, useEffect, Suspense } from "react"; // <-- Suspense import karo
import PostCard from "@/components/PostCard";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";

// 1. Main component ko alag nikaalo
function FeedContent() {
  const { dbUser } = useAuth();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get("subject");

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!dbUser) return;
      try {
        const details = dbUser.learnerDetails || {};
        const userInterests = [
          ...(details.subjects || []),
          ...(details.stream || []),
          ...(details.targets || []),
          ...(details.hobbies || [])
        ].join(',');

        const res = await fetch(`/api/posts?interests=${userInterests}`, { cache: 'no-store' });
        const data = await res.json();
        
        if (data.success) {
          let feedPosts = data.data.filter((post: any) => post.type !== 'reel');
          if (subjectFilter) {
            feedPosts = feedPosts.filter((post: any) => 
              post.subject?.toLowerCase() === subjectFilter.toLowerCase() ||
              post.tags?.some((tag: string) => tag.toLowerCase() === subjectFilter.toLowerCase())
            );
          }
          setPosts(feedPosts);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [dbUser, subjectFilter]);

  return (
    <div className="max-w-[470px] mx-auto mt-4 px-2 md:px-0">
      {subjectFilter && <div className="mb-4 text-center text-sm font-semibold text-blue-500">Showing results for: {subjectFilter}</div>}
      {loading ? (
        <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
      ) : posts.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">Abhi koi post nahi hai.</div>
      ) : (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      )}
    </div>
  );
}

// 2. Default export me Suspense wrap karo
export default function FeedPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 md:pt-0">
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 py-4">
        {/* Stories Bar */}
      </div>
      <Suspense fallback={<div className="text-center mt-10">Loading Feed...</div>}>
        <FeedContent />
      </Suspense>
    </div>
  );
}