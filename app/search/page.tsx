"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Search as SearchIcon, Loader2, Compass, Hash } from "lucide-react";
import PostCard from "@/components/PostCard";

const PAGE_SIZE = 10;

function SearchContent() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = (searchParams.get("q") || "").trim();
  const uid: string | undefined = dbUser?.firebaseUid;

  const [query, setQuery] = useState(urlQuery);
  const [activeTerm, setActiveTerm] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(false);

  const requestIdRef = useRef(0);
  const loadedCountRef = useRef(0);
  const busyRef = useRef(false);
  const hasMoreRef = useRef(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [blocksRes, settingsRes] = await Promise.all([
          fetch("/api/admin/blocks"),
          fetch("/api/admin/settings"),
        ]);
        const bData = await blocksRes.json();
        const sData = await settingsRes.json();
        if (bData.success) setBlocks(bData.data.filter((b: any) => b.isVisible !== false));
        if (sData.success) setSettings(sData.data);
      } catch (error) {}
    }
    fetchData();
  }, []);

  // Search ek hi jagah se chalta hai: term explicit pass hota hai (pehle purani state ka stale value use hota tha)
  const runSearch = useCallback(async (rawTerm: string, reset: boolean) => {
    const term = rawTerm.trim().slice(0, 50);
    if (!term) return;
    if (!reset && (busyRef.current || !hasMoreRef.current)) return;

    const requestId = ++requestIdRef.current;
    busyRef.current = true;
    const skip = reset ? 0 : loadedCountRef.current;

    if (reset) {
      setLoading(true);
      setFetched(true);
      setError(false);
      setActiveTerm(term);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams({
        search: term,
        excludeTypes: "story",
        limit: String(PAGE_SIZE),
        skip: String(skip),
      });
      const res = await fetch(`/api/posts?${params.toString()}`, { cache: "no-store" });
      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      if (!data.success) throw new Error(data.error || "Search failed");

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
  }, []);

  // URL (?q=) hi sach hai. Auth ka result aane ke baad search, taaki liked/saved states sahi aayein.
  useEffect(() => {
    if (authLoading) return;
    setQuery(urlQuery);
    if (urlQuery) {
      loadedCountRef.current = 0;
      hasMoreRef.current = false;
      runSearch(urlQuery, true);
    } else {
      requestIdRef.current++;
      setFetched(false);
      setPosts([]);
      setActiveTerm("");
    }
  }, [urlQuery, authLoading, uid, runSearch]);

  const goSearch = (term: string) => {
    const clean = term.trim().slice(0, 50);
    if (!clean) return;
    setQuery(clean);
    if (clean === urlQuery) {
      runSearch(clean, true); // URL nahi badlega, to seedha dobara search
    } else {
      router.push(`/search?q=${encodeURIComponent(clean)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    goSearch(query);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 md:pt-6 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <form onSubmit={handleSubmit} className="relative mb-8">
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-2" />
            <input 
              type="text" 
              value={query}
              maxLength={50}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects, creators, or tags..." 
              className="flex-1 bg-transparent border-none outline-none px-4 py-2 text-black dark:text-white text-lg"
            />
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition">
              Search
            </button>
          </div>
        </form>

        {!fetched && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2"><Compass className="w-5 h-5 text-pink-500" /> Explore Topics</h2>
            <div className="flex flex-wrap gap-3">
              {blocks.map((block, idx) => (
                <button 
                  key={block._id || idx} 
                  onClick={() => goSearch(block.title)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-pink-500 transition"
                >
                  <span>{block.icon}</span>
                  <span className="text-sm font-semibold dark:text-white">{block.title}</span>
                </button>
              ))}
              
              {settings?.subjects?.slice(0, 6).map((tag: string) => (
                <button 
                  key={tag} 
                  onClick={() => goSearch(tag)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 transition"
                >
                  <Hash className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold dark:text-white">{tag}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center mt-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : error && posts.length === 0 ? (
          <div className="text-center mt-10">
            <p className="text-gray-500 mb-3">Search nahi ho paya.</p>
            <button onClick={() => runSearch(activeTerm || query, true)} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Retry</button>
          </div>
        ) : fetched && posts.length === 0 ? (
          <div className="text-center mt-10">
            <h2 className="text-xl font-bold dark:text-white mb-2">No results found for "{activeTerm}"</h2>
            <p className="text-gray-500">Try searching for a different subject, creator, or tag.</p>
          </div>
        ) : fetched && (
          <div>
            <h2 className="text-lg font-bold text-black dark:text-white mb-4">Results for "{activeTerm}"</h2>
            <div className="flex flex-col gap-4 max-w-[470px] mx-auto">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button onClick={() => runSearch(activeTerm, false)} disabled={loadingMore} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 text-sm font-semibold text-black dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition disabled:opacity-60">
                  {loadingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <SearchContent />
    </Suspense>
  );
}