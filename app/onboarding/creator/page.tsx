"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, AtSign, Briefcase, Info } from "lucide-react";
import Link from "next/link";

export default function CreatorOnboarding() {
  const { dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [instagramHandle, setInstagramHandle] = useState("");
  const [subject, setSubject] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !dbUser) router.push("/auth");
  }, [dbUser, loading, router]);

  const handleSubmit = async () => {
    if (!instagramHandle || !subject || !experience) {
      return alert("Please fill all the required fields.");
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: dbUser.firebaseUid,
          role: "master", // <-- Perfect Role
          masterDetails: { instagramHandle, subject, experience, bio }
        })
      });
      const data = await res.json();
      
      if (data.success) {
        await refreshUser();
        alert("Application submitted successfully! Please wait for Admin approval.");
        router.push("/"); 
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !dbUser) return <div className="h-screen flex items-center justify-center dark:text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8 pt-4 max-w-md mx-auto w-full">
        <Link href="/auth" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Educator Application</h1>
          <p className="text-sm text-gray-500">Join as a creator on Swybe</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 max-w-md mx-auto w-full pb-10">
        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex gap-3 text-sm">
          <Info className="w-5 h-5 shrink-0" />
          <p>Your profile will be reviewed by the Admin. Once approved, you can upload Reels, Posts, and Tests.</p>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Instagram / YouTube Handle <span className="text-red-500">*</span></label>
          <div className="relative">
            <AtSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="text" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourhandle" className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Subject Expertise <span className="text-red-500">*</span></label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition">
            <option value="">Select a subject</option>
            <option value="Maths">Maths</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology</option>
            <option value="Computer Science">Computer Science</option>
            <option value="English">English</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Teaching Experience <span className="text-red-500">*</span></label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="text" value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 2 Years" className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Short Bio (Optional)</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself..." rows={3} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition resize-none" />
        </div>
      </div>

      <div className="max-w-md mx-auto w-full pb-6 mt-auto">
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}