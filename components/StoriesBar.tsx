"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import StoryViewer from "./StoryViewer";

export default function StoriesBar() {
  const { dbUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const uid: string | undefined = dbUser?.firebaseUid;

  const [stories, setStories] = useState<any[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialGroupIndex, setInitialGroupIndex] = useState(0);

  // Login ka result aane ke baad fetch, taaki "liked" states sahi aayein
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function fetchStories() {
      try {
        const res = await fetch("/api/posts?type=story&limit=20", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && data.success) setStories(data.data);
      } catch (error) {
        console.error("Failed to load stories");
      }
    }

    fetchStories();
    return () => { cancelled = true; };
  }, [authLoading, uid]);

  // Ek creator = ek circle. Ek group ke andar purani story pehle, nayi baad me.
  const groups = useMemo(() => {
    const map = new Map<string, any>();
    [...stories].reverse().forEach((story) => {
      const key = story.creatorUid || story.creatorName || story._id;
      if (!map.has(key)) {
        map.set(key, {
          key,
          creatorUid: story.creatorUid,
          creatorName: story.creatorName,
          creatorPhotoURL: story.creatorPhotoURL,
          stories: [],
          latest: 0,
        });
      }
      const group = map.get(key);
      group.stories.push(story);
      group.latest = Math.max(group.latest, new Date(story.createdAt).getTime() || 0);
    });

    const list = Array.from(map.values());
    list.sort((a, b) => {
      const aMine = a.creatorUid && a.creatorUid === uid ? 1 : 0;
      const bMine = b.creatorUid && b.creatorUid === uid ? 1 : 0;
      if (aMine !== bMine) return bMine - aMine; // apni story sabse pehle
      return b.latest - a.latest;
    });
    return list;
  }, [stories, uid]);

  const handleOpen = (index: number) => {
    setInitialGroupIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 p-4">
        <div className="max-w-2xl mx-auto flex gap-4 overflow-x-auto no-scrollbar">
           {/* Add Story Button */}
           <div onClick={() => router.push("/upload")} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
              <div className="w-16 h-16 rounded-full border-2 border-gray-300 dark:border-zinc-700 p-[2px]">
                 <div className="w-full h-full rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-2xl hover:bg-gray-200 dark:hover:bg-zinc-700 transition">
                    <Plus className="w-6 h-6 dark:text-white" />
                 </div>
              </div>
              <span className="text-[11px] font-medium dark:text-gray-300">Your Story</span>
           </div>

           {/* Creator-wise Stories */}
           {groups.map((group, i) => (
             <div key={group.key} onClick={() => handleOpen(i)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                   <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                     <div className="w-full h-full rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                        {group.creatorPhotoURL ? (
                          <img src={group.creatorPhotoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          group.creatorName?.charAt(0) || "U"
                        )}
                     </div>
                   </div>
                </div>
                <span className="text-[11px] font-medium dark:text-gray-300 truncate w-16 text-center">
                  {group.creatorUid && group.creatorUid === uid ? "You" : group.creatorName?.split(" ")[0]}
                </span>
             </div>
           ))}
        </div>
      </div>

      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={Math.min(initialGroupIndex, groups.length - 1)}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}