// Media ke helpers: kaun si URL video hai, aur post ki media list kaise nikalni hai

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v", ".ogv", ".avi", ".mkv", ".3gp"];

// Cloudinary ki video URL me "/video/upload/" hota hai, to .mov/.webm bhi sahi pehchane jaate hain
export function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  if (clean.includes("/video/upload/")) return true;
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

// iPhone ke .mov jaise formats Cloudinary se .mp4 me convert hoke aate hain (har browser me chalte hain)
export function playableVideoUrl(url: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) return url;
  return url.replace(/\.(mov|m4v|avi|mkv|3gp|ogv)(\?.*)?$/i, ".mp4$2");
}

// Post ki saari media URLs (naya mediaUrls array, ya purana mediaUrl)
export function getMediaList(post: any): string[] {
  if (!post) return [];
  if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
    return post.mediaUrls.filter((u: any) => typeof u === "string" && u);
  }
  if (typeof post.mediaUrl === "string" && post.mediaUrl) return [post.mediaUrl];
  return [];
}