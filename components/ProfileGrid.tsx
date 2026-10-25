"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import PostTile from "@/components/PostTile";

const PAGE_SIZE = 12;

export default function ProfileGrid({ uid, kind }: { uid: string; kind: "posts" | "reels" }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);

  const urlFor = (skip: number) => {
    const base = `/api/posts?creatorUid=${encodeURIComponent(uid)}&limit=${PAGE_SIZE}&skip=${skip}`;
    return kind === "reels" ? `${base}&type=reel` : `${base}&excludeTypes=reel,story`;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadFirst() {
      setLoading(true);
      setError(false);
      setItems([]);
      try {
        const res = await fetch(urlFor(0), { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setItems(data.data);
          setHasMore(data.data.length === PAGE_SIZE);
        } else {
          setError(true);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (uid) loadFirst();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, kind]);

  const loadMore = async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(urlFor(items.length), { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p._id));
          return [...prev, ...data.data.filter((p: any) => !seen.has(p._id))];
        });
        setHasMore(data.data.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="flex justify-center mt-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (error) return <p className="text-center text-gray-500 mt-10">Load nahi ho paya. Page refresh karke dekho.</p>;
  if (items.length === 0) return <p className="text-center text-gray-500 mt-10">{kind === "reels" ? "No reels yet." : "No posts yet."}</p>;

  return (
    <div>
      <div className={`grid gap-1 sm:gap-2 ${kind === "reels" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
        {items.map((post) => (
          <PostTile key={post._id} post={post} tall={kind === "reels"} />
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button onClick={loadMore} disabled={loadingMore} className="px-6 py-2 rounded-xl bg-gray-200 dark:bg-zinc-800 text-sm font-semibold text-black dark:text-white hover:bg-gray-300 dark:hover:bg-zinc-700 transition disabled:opacity-60">
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
    </div>
  );
}