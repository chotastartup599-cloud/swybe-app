"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StoryViewer from "./StoryViewer";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StoriesBar() {
  const { dbUser } = useAuth();
  const router = useRouter();
  
  const [stories, setStories] = useState<any[]>([]);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch('/api/posts?type=story');
        const data = await res.json();
        if (data.success) {
          setStories(data.data);
        }
      } catch (error) {
        console.error("Failed to load stories");
      }
    }
    fetchStories();
  }, []);

  const handleStoryClick = (index: number) => {
    setInitialIndex(index);
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

           {/* Real Stories */}
           {stories.map((story, i) => (
             <div key={story._id} onClick={() => handleStoryClick(i)} className="flex flex-col items-center gap-1 cursor-pointer shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[3px]">
                   <div className="w-full h-full rounded-full bg-white dark:bg-black p-[2px]">
                     <div className="w-full h-full rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 overflow-hidden">
                        {story.mediaUrls && story.mediaUrls.length > 0 ? (
                          story.mediaUrls[0].includes('.mp4') ? (
                            <video src={story.mediaUrls[0]} className="w-full h-full object-cover" />
                          ) : (
                            <img src={story.mediaUrls[0]} alt="S" className="w-full h-full object-cover" />
                          )
                        ) : (
                          story.creatorName?.charAt(0)
                        )}
                     </div>
                   </div>
                </div>
                <span className="text-[11px] font-medium dark:text-gray-300 truncate w-16 text-center">{story.creatorName?.split(' ')[0]}</span>
             </div>
           ))}
        </div>
      </div>

      {viewerOpen && (
        <StoryViewer 
          stories={stories} 
          initialIndex={initialIndex} 
          onClose={() => setViewerOpen(false)} 
        />
      )}
    </>
  );
}