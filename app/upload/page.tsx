"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, PlaySquare, CheckSquare, Clock, UploadCloud, X, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { uploadToCloudinary, MAX_IMAGE_MB, MAX_VIDEO_MB } from "@/lib/cloudinary";
import { isApprovedCreatorUser } from "@/lib/constants";

type PostType = "feed" | "reel" | "story" | "quiz";

const BG_GRADIENTS = [
  "bg-gradient-to-tr from-pink-500 to-yellow-500",
  "bg-gradient-to-tr from-blue-600 to-purple-600",
  "bg-gradient-to-tr from-green-400 to-blue-500",
  "bg-gradient-to-tr from-orange-400 to-red-500",
  "bg-black",
];

const ALL_TABS: { id: PostType; icon: any; label: string }[] = [
  { id: "feed", icon: ImageIcon, label: "Post" },
  { id: "reel", icon: PlaySquare, label: "Reel" },
  { id: "story", icon: Clock, label: "Story" },
  { id: "quiz", icon: CheckSquare, label: "Test / Quiz" },
];

const isMedia = (f: File) => f.type.startsWith("image/") || f.type.startsWith("video/");

export default function UploadPage() {
  const { dbUser, user, loading } = useAuth();
  const router = useRouter();

  const [postType, setPostType] = useState<PostType>("feed");
  const [isTextPost, setIsTextPost] = useState(false);
  const [textBg, setTextBg] = useState(BG_GRADIENTS[0]);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const previewsRef = useRef<string[]>([]);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [subject, setSubject] = useState("General");
  const [classLevel, setClassLevel] = useState("General");
  const [instaHandle, setInstaHandle] = useState("");
  const instaTouchedRef = useRef(false);

  // Story expiry (sirf creators chun sakte hain; learner ki story hamesha 24h)
  const [storyDuration, setStoryDuration] = useState<"24h" | "7d" | "custom">("24h");
  const [customDays, setCustomDays] = useState(3);

  // Quiz
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({ subjects: [], classes: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreator = isApprovedCreatorUser(dbUser);
  const isGuest = !!user?.isAnonymous;
  const canUseText = postType === "feed" || postType === "story";
  const maxFiles = postType === "feed" ? 10 : 1;

  // Login nahi hai to /auth bhejo (pehle yahan hamesha spinner dikhta tha)
  useEffect(() => {
    if (!loading && !dbUser) router.replace("/auth");
  }, [loading, dbUser, router]);

  // Learner / pending master sirf story bana sakta hai
  useEffect(() => {
    if (dbUser && !isCreator) setPostType("story");
  }, [dbUser, isCreator]);

  // Instagram handle profile se bhar do (agar user ne khud kuch nahi likha)
  useEffect(() => {
    if (dbUser && !instaTouchedRef.current) setInstaHandle(dbUser.socialLinks?.instagram || "");
  }, [dbUser]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.success) setSettings(data.data);
      } catch (err) {
        console.error("Settings load nahi hui");
      }
    }
    fetchSettings();
  }, []);

  // Preview URLs memory me jama na hon, isliye page chhodte hi hata do
  useEffect(() => { previewsRef.current = previews; }, [previews]);
  useEffect(() => () => { previewsRef.current.forEach((u) => URL.revokeObjectURL(u)); }, []);

  const clearMedia = () => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
  };

  const changeType = (t: PostType) => {
    if (loadingSubmit) return;
    setPostType(t);
    setIsTextPost(false);
    setError(null);
    clearMedia();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (picked.length === 0) return;
    setError(null);

    let incoming = picked.filter(isMedia);
    if (postType === "reel") incoming = incoming.filter((f) => f.type.startsWith("video/"));
    if (incoming.length === 0) {
      setError(postType === "reel" ? "Reel ke liye video file chuno." : "Sirf image ya video chuno.");
      return;
    }

    const tooBig = incoming.find((f) => f.size > (f.type.startsWith("video/") ? MAX_VIDEO_MB : MAX_IMAGE_MB) * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" bahut badi hai (image max ${MAX_IMAGE_MB}MB, video max ${MAX_VIDEO_MB}MB).`);
      return;
    }

    // Reel/Story me ek hi file: nayi file purani ko replace karti hai
    const base = maxFiles === 1 ? [] : files;
    const next = [...base, ...incoming].slice(0, maxFiles);
    if (base.length + incoming.length > maxFiles) setError(`Maximum ${maxFiles} file hi allowed hai.`);

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles(next);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!dbUser || loadingSubmit) return;
    setError(null);

    if (isGuest) return setError("Upload ke liye apne account se login karo (guest mode me nahi).");
    if (!title.trim()) return setError("Title zaroori hai.");

    const textMode = isTextPost && canUseText;

    if (postType === "quiz") {
      if (!quizQuestion.trim()) return setError("Quiz ka question likho.");
      if (quizOptions.some((o) => !o.trim())) return setError("Saare 4 options bharo.");
    } else if (textMode) {
      if (!caption.trim()) return setError("Text post me kuch likho.");
    } else if (files.length === 0) {
      return setError("Media chuno ya Text Post par switch karo.");
    }

    setLoadingSubmit(true);
    try {
      // 1) Media upload: koi bhi file fail hui to post banti hi nahi
      const uploadedUrls: string[] = [];
      if (postType !== "quiz" && !textMode) {
        for (let i = 0; i < files.length; i++) {
          setProgressText(`Uploading ${i + 1}/${files.length}...`);
          uploadedUrls.push(await uploadToCloudinary(files[i]));
        }
      }

      // 2) Story expiry (server ise bhi limit me rakhta hai)
      let expiresAt: string | undefined;
      if (postType === "story") {
        let hours = 24;
        if (isCreator) {
          if (storyDuration === "7d") hours = 168;
          if (storyDuration === "custom") hours = Math.min(Math.max(customDays, 1), 30) * 24;
        }
        expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      }

      // 3) Post banao
      setProgressText("Posting...");
      const payload = {
        title: title.trim(),
        caption,
        type: postType,
        isTextPost: textMode,
        backgroundColor: textMode ? textBg : "",
        subject,
        classLevel,
        instagramHandle: instaHandle,
        mediaUrls: uploadedUrls,
        expiresAt,
        quizData: postType === "quiz"
          ? { question: quizQuestion.trim(), options: quizOptions.map((o) => o.trim()), correctOptionIndex: correctOption }
          : undefined,
      };

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Post nahi ho paya. Dobara try karo.");
        return;
      }

      router.push(postType === "reel" ? "/reels" : "/feed");
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Upload failed. Dobara try karo.");
    } finally {
      setLoadingSubmit(false);
      setProgressText("");
    }
  };

  const allowedTabs = isCreator ? ALL_TABS : ALL_TABS.filter((t) => t.id === "story");
  const showMediaSection = postType === "feed" || postType === "reel" || postType === "story";

  if (loading || !dbUser) return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 w-full flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-black dark:text-white mb-2">Login zaroori hai</h1>
          <p className="text-gray-500 text-sm mb-6">Story ya post banane ke liye guest mode se bahar aakar apne account se login karo.</p>
          <Link href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition">Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20 pt-16 w-full">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
              <ChevronLeft className="w-5 h-5 dark:text-white" />
            </Link>
            <h1 className="text-xl font-bold dark:text-white">Create New</h1>
          </div>
          <button onClick={handleSubmit} disabled={loadingSubmit} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
            {loadingSubmit && <Loader2 className="w-4 h-4 animate-spin" />}
            {loadingSubmit ? (progressText || "Posting...") : "Share"}
          </button>
        </div>

        {!isCreator && (
          <p className="text-xs text-gray-500 mb-4">Abhi aap sirf Story bana sakte ho. Post, Reel aur Quiz approved Educators ke liye hain.</p>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {allowedTabs.map(tab => (
            <button key={tab.id} onClick={() => changeType(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${postType === tab.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white text-gray-600 dark:bg-zinc-900 dark:text-gray-400"}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-6">
          
          {showMediaSection && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {postType === "reel" ? "Video" : "Media"}
                  <span className="text-xs text-gray-400 font-normal ml-2">
                    {postType === "feed" ? "max 10 files" : "1 file"} · image {MAX_IMAGE_MB}MB, video {MAX_VIDEO_MB}MB
                  </span>
                </label>
                {canUseText && (
                  <button onClick={() => { setIsTextPost(!isTextPost); clearMedia(); }} className="text-xs text-blue-500 font-semibold hover:underline">
                    {isTextPost ? "Upload Media instead" : "Switch to Text Post"}
                  </button>
                )}
              </div>

              {isTextPost && canUseText ? (
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center p-8 text-center text-white text-2xl font-bold ${textBg}`}>
                  {caption || "Type your text below to see preview"}
                </div>
              ) : (
                <div>
                  {previews.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                      {previews.map((url, i) => (
                        <div key={url} className="relative w-32 h-32 flex-shrink-0">
                           {files[i]?.type.startsWith("video") ? <video src={url} className="w-full h-full object-cover rounded-xl" muted /> : <img src={url} alt="preview" className="w-full h-full object-cover rounded-xl" />}
                           <button onClick={() => removeFile(i)} disabled={loadingSubmit} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                      {postType === "feed" && previews.length < maxFiles && (
                        <button onClick={() => fileInputRef.current?.click()} className="w-32 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                          <UploadCloud className="w-6 h-6" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 font-medium">Click to upload {postType === "reel" ? "video" : "media"}</span>
                    </div>
                  )}
                  <input type="file" multiple={postType === "feed"} accept={postType === "reel" ? "video/*" : "image/*,video/*"} className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              )}
            </div>
          )}

          {isTextPost && canUseText && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Choose Background</label>
              <div className="flex gap-3">
                {BG_GRADIENTS.map((bg) => (
                  <button key={bg} onClick={() => setTextBg(bg)} className={`w-10 h-10 rounded-full ${bg} ${textBg === bg ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''}`} />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Title</label>
            <input type="text" maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your post a title" className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-blue-500" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Description / Caption</label>
            <textarea value={caption} maxLength={2000} onChange={e => setCaption(e.target.value)} placeholder="Write details..." rows={3} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-blue-500 resize-none" />
          </div>

          {postType === "quiz" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex flex-col gap-4 border border-blue-100 dark:border-blue-900/50">
              <div>
                <label className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 block">Question</label>
                <input type="text" maxLength={300} value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)} placeholder="Enter question" className="w-full p-3 rounded-xl border-none outline-none text-sm dark:bg-zinc-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quizOptions.map((opt, i) => (
                  <div key={i} className="relative">
                    <input type="text" maxLength={150} value={opt} onChange={e => {
                        const newOpts = [...quizOptions]; newOpts[i] = e.target.value; setQuizOptions(newOpts);
                      }} placeholder={`Option ${i + 1}`} className="w-full p-3 pr-9 rounded-xl border-none outline-none text-sm dark:bg-zinc-900 dark:text-white" />
                    <button type="button" onClick={() => setCorrectOption(i)} title="Sahi jawab" className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${correctOption === i ? 'bg-green-500 border-green-500' : 'border-gray-400'}`} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Sahi jawab ke option ke saamne wala gola hara karo.</p>
            </div>
          )}

          {postType === "story" && isCreator && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Story Duration</label>
              <div className="flex gap-3 mb-3">
                <button onClick={() => setStoryDuration("24h")} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${storyDuration === "24h" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>24 Hours</button>
                <button onClick={() => setStoryDuration("7d")} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${storyDuration === "7d" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>7 Days</button>
                <button onClick={() => setStoryDuration("custom")} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${storyDuration === "custom" ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-300"}`}>Custom</button>
              </div>
              {storyDuration === "custom" && (
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="1" 
                    max="30" 
                    value={customDays} 
                    onChange={(e) => setCustomDays(Math.min(Math.max(parseInt(e.target.value) || 1, 1), 30))} 
                    className="w-24 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white" 
                  />
                  <span className="text-sm text-gray-500 font-medium">Days (max 30)</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white">
                <option>General</option>
                {(settings.subjects || []).map((s: string) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Class Level</label>
              <select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white">
                <option>General</option>
                {(settings.classes || []).map((c: string) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Instagram Handle (Optional)</label>
            <input type="text" maxLength={40} value={instaHandle} onChange={e => { instaTouchedRef.current = true; setInstaHandle(e.target.value); }} placeholder="@username" className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-pink-500" />
          </div>

        </div>
      </div>
    </div>
  );
}