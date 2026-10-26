"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AtSign, Briefcase, Info, AlertCircle } from "lucide-react";
import Link from "next/link";

const SUBJECT_OPTIONS = ["Maths", "Physics", "Chemistry", "Biology", "Computer Science", "English", "Other"];

function CreatorOnboardingContent() {
  const { dbUser, user, loading, refreshUser, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reapply = searchParams.get("reapply") === "1";

  const [instagramHandle, setInstagramHandle] = useState("");
  const [subject, setSubject] = useState("");
  const [experience, setExperience] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefilledRef = useRef(false);

  // Form tab khulta hai jab profile abhi complete nahi, ya rejected master dobara apply kar raha ho
  const isRejectedMaster = dbUser?.role === "master" && dbUser?.masterStatus === "rejected";
  const canApply = !!dbUser && (!dbUser.isProfileComplete || (reapply && isRejectedMaster));

  useEffect(() => {
    if (loading) return;
    if (!dbUser) { router.replace("/auth"); return; }
    if (!canApply) router.replace("/");
  }, [dbUser, loading, canApply, router]);

  // Dobara apply: purani details bhar do
  useEffect(() => {
    if (!reapply || !isRejectedMaster || !dbUser || prefilledRef.current) return;
    prefilledRef.current = true;
    const m = dbUser.masterDetails || {};
    setInstagramHandle(m.instagramHandle || "");
    setSubject(m.subject || "");
    setExperience(m.experience || "");
    setBio(m.bio || "");
  }, [reapply, isRejectedMaster, dbUser]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!instagramHandle.trim() || !subject || !experience.trim()) {
      setError("Saari required fields bharo.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "master",
          masterDetails: { instagramHandle, subject, experience, bio }
        })
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Application submit nahi hui. Dobara try karo.");
        return;
      }

      await refreshUser();
      alert("Application submitted successfully! Please wait for Admin approval.");
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Network error. Dobara try karo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !dbUser || !canApply) {
    return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  // Guest account se educator application nahi ho sakti
  if (user?.isAnonymous) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-zinc-800">
          <h1 className="text-xl font-bold text-black dark:text-white mb-2">Educator ke liye real account chahiye</h1>
          <p className="text-gray-500 text-sm mb-6">Guest mode se application nahi ho sakti. Logout karke Email ya Google se signup karo.</p>
          <button
            onClick={async () => { await logout(); router.replace("/auth"); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition w-full"
          >
            Logout & Sign Up
          </button>
        </div>
      </div>
    );
  }

  const subjectOptions = subject && !SUBJECT_OPTIONS.includes(subject) ? [subject, ...SUBJECT_OPTIONS] : SUBJECT_OPTIONS;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 flex flex-col">
      <div className="flex items-center gap-4 mb-8 pt-4 max-w-md mx-auto w-full">
        <Link href={reapply ? "/" : "/auth"} className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">{reapply ? "Apply Again" : "Educator Application"}</h1>
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
            <input type="text" maxLength={40} value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="@yourhandle" className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Subject Expertise <span className="text-red-500">*</span></label>
          <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition">
            <option value="">Select a subject</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Teaching Experience <span className="text-red-500">*</span></label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input type="text" maxLength={60} value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 2 Years" className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition" />
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Short Bio (Optional)</label>
          <textarea value={bio} maxLength={300} onChange={(e) => setBio(e.target.value)} placeholder="Tell students about yourself..." rows={3} className="w-full p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black dark:text-white outline-none focus:border-pink-500 transition resize-none" />
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>

      <div className="max-w-md mx-auto w-full pb-6 mt-auto">
        <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (reapply ? "Submit Again" : "Submit for Verification")}
        </button>
      </div>
    </div>
  );
}

export default function CreatorOnboarding() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
      <CreatorOnboardingContent />
    </Suspense>
  );
}