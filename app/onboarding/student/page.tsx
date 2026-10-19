"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import Link from "next/link";

export default function StudentOnboarding() {
  const { dbUser, loading, refreshUser } = useAuth();
  const router = useRouter();

  const [classes, setClasses] = useState<string[]>([]);
  const [exams, setExams] = useState<string[]>([]);
  const [language, setLanguage] = useState("Hinglish");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agar user logged in nahi hai toh wapas bhej do
  useEffect(() => {
    if (!loading && !dbUser) router.push("/");
  }, [dbUser, loading, router]);

  const toggleClass = (cls: string) => {
    setClasses(prev => prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]);
  };

  const toggleExam = (exam: string) => {
    setExams(prev => prev.includes(exam) ? prev.filter(e => e !== exam) : [...prev, exam]);
  };

  const handleSubmit = async () => {
    if (classes.length === 0) return alert("Please select at least one class.");
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: dbUser.firebaseUid,
          role: "student",
          studentDetails: { classes, exams, language }
        })
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser(); // AuthContext me naya data update karo
        router.push("/"); // Home page par bhej do
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
    <div className="min-h-screen bg-gray-50 dark:bg-black p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pt-4">
        <Link href="/onboarding" className="p-2 bg-white dark:bg-zinc-900 rounded-full shadow-sm">
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-white">Student Profile</h1>
          <p className="text-sm text-gray-500">Tell us about your studies</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-8 max-w-md mx-auto w-full">
        
        {/* Class Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Which class are you in?</h2>
          <div className="grid grid-cols-2 gap-3">
            {["Class 9", "Class 10", "Class 11", "Class 12", "Dropper"].map((cls) => (
              <button
                key={cls}
                onClick={() => toggleClass(cls)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-between
                  ${classes.includes(cls) 
                    ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" 
                    : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400"}`}
              >
                {cls}
                {classes.includes(cls) && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Exam Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Target Exams (Optional)</h2>
          <div className="flex flex-wrap gap-2">
            {["JEE", "NEET", "NDA", "UPSC", "SSC", "Boards", "Others"].map((exam) => (
              <button
                key={exam}
                onClick={() => toggleExam(exam)}
                className={`px-4 py-2 rounded-full border text-sm font-medium transition-all
                  ${exams.includes(exam) 
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                    : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400"}`}
              >
                {exam}
              </button>
            ))}
          </div>
        </div>

        {/* Language Selection */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Preferred Language</h2>
          <div className="flex gap-3">
            {["Hindi", "English", "Hinglish"].map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`flex-1 p-3 rounded-xl border text-sm font-medium transition-all
                  ${language === lang 
                    ? "border-green-500 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400" 
                    : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400"}`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Submit Button */}
      <div className="mt-8 pt-4 max-w-md mx-auto w-full pb-6">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || classes.length === 0}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Setup & Explore"}
        </button>
      </div>
    </div>
  );
}