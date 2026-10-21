"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ChevronLeft, Image as ImageIcon, PlaySquare, CheckSquare, Clock, UploadCloud, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function UploadPage() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();
  
  const [postType, setPostType] = useState<"feed" | "reel" | "story" | "quiz">("feed");
  const [isTextPost, setIsTextPost] = useState(false);
  const [textBg, setTextBg] = useState("bg-gradient-to-tr from-pink-500 to-yellow-500");
  
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [subject, setSubject] = useState("General");
  const [classLevel, setClassLevel] = useState("General");
  const [instaHandle, setInstaHandle] = useState(dbUser?.socialLinks?.instagram || "");
  
  // Story Expiry State
  const [storyDuration, setStoryDuration] = useState<"24h" | "7d" | "custom">("24h");
  const [customDays, setCustomDays] = useState(3);

  // Quiz Data
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);

  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [settings, setSettings] = useState<any>({ subjects: [], classes: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreator = dbUser?.role === "master" || dbUser?.role === "admin";

  useEffect(() => {
    if (dbUser && !isCreator) {
      setPostType("story");
    }
    
    async function fetchSettings() {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) setSettings(data.data);
    }
    fetchSettings();
  }, [dbUser, isCreator]);

  const bgGradients = [
    "bg-gradient-to-tr from-pink-500 to-yellow-500",
    "bg-gradient-to-tr from-blue-600 to-purple-600",
    "bg-gradient-to-tr from-green-400 to-blue-500",
    "bg-gradient-to-tr from-orange-400 to-red-500",
    "bg-black"
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "swybe_upload");
    const isVideo = file.type.startsWith("video/");
    const endpoint = `https://api.cloudinary.com/v1_1/okuevkuf/${isVideo ? 'video' : 'image'}/upload`;
    const res = await fetch(endpoint, { method: "POST", body: formData });
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!dbUser) return;
    if (postType !== 'quiz' && !isTextPost && files.length === 0) return alert("Please select media or switch to text post.");
    if (!title) return alert("Title is required.");

    setLoadingSubmit(true);
    try {
      let uploadedUrls: string[] = [];
      
      if (!isTextPost && files.length > 0) {
        for (const file of files) {
          const url = await uploadToCloudinary(file);
          if (url) uploadedUrls.push(url);
        }
      }
      
      // Story Expiry Logic (Custom Time)
      let expiryDate = null;
      if (postType === 'story') {
        let hours = 24; // Default for learners
        if (isCreator) {
          if (storyDuration === '7d') hours = 168;
          if (storyDuration === 'custom') hours = customDays * 24;
        }
        expiryDate = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
      
      const payload = {
        title, caption, type: postType,
        creatorName: dbUser.name, creatorEmail: dbUser.email,
        instagramHandle: instaHandle, isTextPost, backgroundColor: textBg,
        subject, classLevel, mediaUrls: uploadedUrls,
        expiresAt: expiryDate,
        quizData: postType === 'quiz' ? { question: quizQuestion, options: quizOptions, correctOptionIndex: correctOption } : undefined
      };

      const res = await fetch("/api/posts", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert("Post uploaded successfully!");
        router.push("/feed");
      }
    } catch (error) {
      alert("Upload failed.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  const allTabs = [
    { id: "feed", icon: ImageIcon, label: "Post" },
    { id: "reel", icon: PlaySquare, label: "Reel" },
    { id: "story", icon: Clock, label: "Story" },
    { id: "quiz", icon: CheckSquare, label: "Test / Quiz" },
  ];
  
  const allowedTabs = isCreator ? allTabs : allTabs.filter(t => t.id === "story" || t.id === "quiz");

  if (loading || !dbUser) return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

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
          <button onClick={handleSubmit} disabled={loadingSubmit} className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 transition disabled:opacity-50">
            {loadingSubmit ? "Posting..." : "Share"}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {allowedTabs.map(tab => (
            <button key={tab.id} onClick={() => setPostType(tab.id as any)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${postType === tab.id ? "bg-black text-white dark:bg-white dark:text-black" : "bg-white text-gray-600 dark:bg-zinc-900 dark:text-gray-400"}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col gap-6">
          
          {(postType === "feed" || postType === "reel" || postType === "story") && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Media</label>
                {postType === "feed" && (
                  <button onClick={() => setIsTextPost(!isTextPost)} className="text-xs text-blue-500 font-semibold hover:underline">
                    {isTextPost ? "Upload Media instead" : "Switch to Text Post"}
                  </button>
                )}
              </div>

              {isTextPost ? (
                <div className={`w-full aspect-square rounded-xl flex items-center justify-center p-8 text-center text-white text-2xl font-bold ${textBg}`}>
                  {caption || "Type your text below to see preview"}
                </div>
              ) : (
                <div>
                  {previews.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                      {previews.map((url, i) => (
                        <div key={i} className="relative w-32 h-32 flex-shrink-0">
                           {files[i]?.type.startsWith("video") ? <video src={url} className="w-full h-full object-cover rounded-xl" /> : <img src={url} alt="preview" className="w-full h-full object-cover rounded-xl" />}
                           <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
                      <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500 font-medium">Click to upload media</span>
                    </div>
                  )}
                  <input type="file" multiple accept={postType === "reel" ? "video/*" : "image/*,video/*"} className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                </div>
              )}
            </div>
          )}

          {isTextPost && postType === "feed" && (
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">Choose Background</label>
              <div className="flex gap-3">
                {bgGradients.map((bg, i) => (
                  <button key={i} onClick={() => setTextBg(bg)} className={`w-10 h-10 rounded-full ${bg} ${textBg === bg ? 'ring-2 ring-offset-2 ring-black dark:ring-white' : ''}`} />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your post a title" className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-blue-500" />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Description / Caption</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)} placeholder="Write details..." rows={3} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-blue-500 resize-none" />
          </div>

          {postType === "quiz" && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex flex-col gap-4 border border-blue-100 dark:border-blue-900/50">
              <div>
                <label className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2 block">Question</label>
                <input type="text" value={quizQuestion} onChange={e => setQuizQuestion(e.target.value)} placeholder="Enter question" className="w-full p-3 rounded-xl border-none outline-none text-sm dark:bg-zinc-900 dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quizOptions.map((opt, i) => (
                  <div key={i} className="relative">
                    <input type="text" value={opt} onChange={e => {
                        const newOpts = [...quizOptions]; newOpts[i] = e.target.value; setQuizOptions(newOpts);
                      }} placeholder={`Option ${i + 1}`} className="w-full p-3 rounded-xl border-none outline-none text-sm dark:bg-zinc-900 dark:text-white" />
                    <button onClick={() => setCorrectOption(i)} className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 ${correctOption === i ? 'bg-green-500 border-green-500' : 'border-gray-400'}`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM STORY DURATION */}
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
                    onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)} 
                    className="w-24 p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white" 
                  />
                  <span className="text-sm text-gray-500 font-medium">Days</span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white">
                <option>General</option>
                {settings.subjects.map((s: string) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Class Level</label>
              <select value={classLevel} onChange={e => setClassLevel(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white">
                <option>General</option>
                {settings.classes.map((c: string) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Instagram Handle (Optional)</label>
            <input type="text" value={instaHandle} onChange={e => setInstaHandle(e.target.value)} placeholder="@username" className="w-full p-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-zinc-800 rounded-xl text-sm outline-none dark:text-white focus:border-pink-500" />
          </div>

        </div>
      </div>
    </div>
  );
}