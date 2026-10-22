"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { Search as SearchIcon, Loader2, Compass, Hash } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useSearchParams } from "next/navigation";

function SearchContent() {
  const { dbUser } = useAuth();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [blocksRes, settingsRes] = await Promise.all([
          fetch("/api/admin/blocks"),
          fetch("/api/admin/settings")
        ]);
        const bData = await blocksRes.json();
        const sData = await settingsRes.json();
        if (bData.success) setBlocks(bData.data);
        if (sData.success) setSettings(sData.data);
      } catch (error) {}
    }
    fetchData();
  }, []);

  const performSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setFetched(true);
    
    try {
      const res = await fetch(`/api/posts?search=${encodeURIComponent(query)}&userId=${dbUser?.firebaseUid}`);
      const data = await res.json();
      if (data.success) setPosts(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) performSearch();
  }, [initialQuery]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 md:pt-6 w-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <form onSubmit={performSearch} className="relative mb-8">
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 transition">
            <SearchIcon className="w-6 h-6 text-gray-400 ml-2" />
            <input 
              type="text" 
              value={query}
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
            <h2 className="text-lg font-bold text-black dark:text-white mb-4 flex items-center gap-2"><Compass className="w-5 h-5 text-pink-500" /> Trending Topics</h2>
            <div className="flex flex-wrap gap-3">
              {blocks.map((block, idx) => (
                <button 
                  key={idx} 
                  onClick={() => { setQuery(block.title); setTimeout(() => performSearch(), 100); }}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-pink-500 transition"
                >
                  <span>{block.icon}</span>
                  <span className="text-sm font-semibold dark:text-white">{block.title}</span>
                </button>
              ))}
              
              {settings?.subjects?.slice(0, 4).map((tag: string) => (
                <button 
                  key={tag} 
                  onClick={() => { setQuery(tag); setTimeout(() => performSearch(), 100); }}
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
        ) : fetched && posts.length === 0 ? (
          <div className="text-center mt-10">
            <h2 className="text-xl font-bold dark:text-white mb-2">No results found for "{query}"</h2>
            <p className="text-gray-500">Try searching for a different subject, creator, or tag.</p>
          </div>
        ) : fetched && (
          <div>
            <h2 className="text-lg font-bold text-black dark:text-white mb-4">Search Results</h2>
            <div className="flex flex-col gap-4 max-w-[470px] mx-auto">
              {posts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
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