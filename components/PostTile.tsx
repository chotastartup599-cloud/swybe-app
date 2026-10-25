import { Play, Heart, HelpCircle, Images } from "lucide-react";
import { getMediaList, isVideoUrl, playableVideoUrl } from "@/lib/media";

// Profile grid / saved folders ka ek tile: image, video, text post ya quiz sab handle karta hai
export default function PostTile({ post, tall = false }: { post: any; tall?: boolean }) {
  const media = getMediaList(post);
  const first = media[0];
  const isVideo = isVideoUrl(first);

  return (
    <div className={`${tall ? "aspect-[9/16]" : "aspect-square"} bg-gray-100 dark:bg-zinc-900 relative overflow-hidden rounded-sm sm:rounded-lg`}>
      {first ? (
        isVideo ? (
          <video src={playableVideoUrl(first)} className="w-full h-full object-cover" muted playsInline preload="metadata" />
        ) : (
          <img src={first} alt={post.title || "post"} className="w-full h-full object-cover" loading="lazy" />
        )
      ) : post.isTextPost ? (
        <div className={`w-full h-full flex items-center justify-center p-3 text-center text-white text-xs font-bold ${post.backgroundColor || "bg-black"}`}>
          <span className="line-clamp-5">{post.caption}</span>
        </div>
      ) : post.type === "quiz" ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-3 text-center bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
          <HelpCircle className="w-6 h-6" />
          <span className="text-xs font-semibold line-clamp-3">{post.title}</span>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-gray-500 line-clamp-4">
          {post.title || post.caption}
        </div>
      )}

      {media.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm"><Images className="w-3 h-3" /></div>
      )}
      {isVideo && !tall && (
        <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-md backdrop-blur-sm"><Play className="w-3 h-3 fill-white" /></div>
      )}
      {tall && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white font-semibold text-xs bg-black/50 px-2 py-1 rounded-md backdrop-blur-sm">
          <Heart className="w-3 h-3 fill-white" /> {post.likes || 0}
        </div>
      )}
    </div>
  );
}