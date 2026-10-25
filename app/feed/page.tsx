"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, X } from "lucide-react";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 10;

function FeedContent() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectFilter = searchParams.get("subject");
  const sharedId = searchParams.get("id");

  const [posts, setPosts] = useState<any[]>([]);
  const [sharedPost, setSharedPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"forYou" | "following">("forYou");

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestIdRef = useRef(0);        // purana (late aaya) jawab ignore karne ke liye
  const loadedCountRef = useRef(0);      // server se ab tak kitni posts aayi (offset)
  const busyRef = useRef(false);
  const hasMoreRef = useRef(true);

  const uid: string | undefined = dbUser?.firebaseUid;
  const details = dbUser?.learnerDetails || {};
  // String key: dbUser ka object badalne par feed dobara fetch nahi hoga, sirf interests badalne par
  const interestsKey = [...(details.subjects || []), ...(details.stream || [])].join(",");

  // Login nahi hai to /auth bhejo (pehle "Redirecting..." par hamesha atka rehta tha)
  useEffect(() => {
    if (!authLoading && !dbUser) router.replace("/auth");
  }, [authLoading, dbUser, router]);

  const fetchPage = useCallback(async (reset: boolean) => {
    if (!uid) return;
    if (!reset && (busyRef.current || !hasMoreRef.current)) return;

    const requestId = ++requestIdRef.current;
    busyRef.current = true;
    const skip = reset ? 0 : loadedCountRef.current;

    if (reset) { setLoading(true); setError(false); } else { setLoadingMore(true); }

    try {
      // Reels/stories aur subject ka filter ab server par hota hai, to har page me poori 10 posts aati hain
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        skip: String(skip),
        excludeTypes: "reel,story",
      });
      if (subjectFilter) params.set("subject", subjectFilter);
      if (activeTab === "following") params.set("following", "true");
      else if (interestsKey) params.set("interests", interestsKey);

      const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (requestId !== requestIdRef.current) return; // tab badal chuka hai, ye jawab purana hai
      if (!data.success) throw new Error(data.error || "Feed load nahi hua");

      const incoming: any[] = data.data;
      loadedCountRef.current = skip + incoming.length;
      hasMoreRef.current = incoming.length === PAGE_SIZE;
      setHasMore(hasMoreRef.current);

      setPosts((prev) => {
        const base = reset ? [] : prev;
        const seen = new Set(base.map((p) => p._id));
        return [...base, ...incoming.filter((p) => !seen.has(p._id))];
      });
    } catch (err) {
      if (requestId === requestIdRef.current) {
        console.error(err);
        setError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        busyRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [uid, activeTab, subjectFilter, interestsKey]);

  // Tab / subject / user badalne par feed shuru se
  useEffect(() => {
    if (!uid) return;
    loadedCountRef.current = 0;
    hasMoreRef.current = true;
    setHasMore(true);
    setPosts([]);
    fetchPage(true);
  }, [fetchPage, uid]);

  // Infinite scroll: neeche ka sentinel dikhte hi agla page
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) fetchPage(false); },
      { rootMargin: "400px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchPage, posts.length, loading, hasMore]);

  // Share link (/feed?id=...): wo post sabse upar dikhao
  useEffect(() => {
    if (!sharedId || !uid) { setSharedPost(null); return; }
    let cancelled = false;
    fetch(`/api/posts?id=${encodeURIComponent(sharedId)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSharedPost(d.success && d.data.length > 0 ? d.data[0] : null); })
      .catch(() => { if (!cancelled) setSharedPost(null); });
    return () => { cancelled = true; };
  }, [sharedId, uid]);

  if (authLoading || !dbUser) {
    return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const visiblePosts = sharedPost ? posts.filter((p) => p._id !== sharedPost._id) : posts;

  return (
    <div className="w-full max-w-[470px] mx-auto pt-4 px-2 md:px-0">
      <div className="flex justify-center gap-6 mb-4 border-b border-gray-200 dark:border-zinc-800 pb-2">
        <button onClick={() => setActiveTab("forYou")} className={`text-sm font-semibold pb-2 ${activeTab === "forYou" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-gray-500"}`}>For You</button>
        <button onClick={() => setActiveTab("following")} className={`text-sm font-semibold pb-2 ${activeTab === "following" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-gray-500"}`}>Following</button>
      </div>

      {subjectFilter && (
        <div className="flex justify-center mb-4">
          <button onClick={() => router.push("/feed")} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold">
            Subject: {subjectFilter} <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {sharedPost && (
        <div className="mb-2">
          <p className="text-xs font-semibold text-pink-500 px-3 mb-1">Shared with you</p>
          <PostCard key={`shared-${sharedPost._id}`} post={sharedPost} />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
      ) : error && visiblePosts.length === 0 ? (
        <div className="text-center mt-10">
          <p className="text-gray-500 mb-3">Feed load nahi ho paya.</p>
          <button onClick={() => fetchPage(true)} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Retry</button>
        </div>
      ) : visiblePosts.length === 0 && !sharedPost ? (
        <div className="text-center text-gray-500 mt-10">
          {activeTab === "following" ? "You are not following anyone yet or they haven't posted." : "No posts found."}
        </div>
      ) : (
        visiblePosts.map((post) => <PostCard key={post._id} post={post} />)
      )}

      {/* Scroll sentinel */}
      {!loading && hasMore && visiblePosts.length > 0 && <div ref={sentinelRef} className="h-10" />}
      {loadingMore && <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}
      {error && visiblePosts.length > 0 && (
        <div className="text-center py-4">
          <button onClick={() => fetchPage(false)} className="text-sm text-blue-500 font-semibold hover:underline">Aur posts load nahi hue, dobara try karo</button>
        </div>
      )}
      {!loading && !hasMore && visiblePosts.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-6">Aap sab dekh chuke ho 🎉</p>
      )}
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