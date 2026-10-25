"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { GraduationCap, Video, ChevronRight } from "lucide-react";
import { useEffect } from "react";

export default function OnboardingPage() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && dbUser?.isProfileComplete) {
      router.push("/");
    }
    if (!loading && !dbUser) {
      router.push("/auth");
    }
  }, [dbUser, loading, router]);

  if (loading || !dbUser) return <div className="h-screen flex items-center justify-center dark:text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col p-6 items-center justify-center">
      
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-black dark:text-white mb-2">Welcome to Swybe</h1>
        <p className="text-gray-500">How do you want to use Swybe?</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-4">
        {/* Student Card */}
        <div 
          onClick={() => router.push("/onboarding/learner")}
          className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-pink-500 dark:hover:border-pink-500 transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white group-hover:text-pink-500 transition">I am a Student</h2>
                <p className="text-sm text-gray-500 mt-1">Explore, learn, and solve doubts.</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-pink-500" />
          </div>
        </div>

        {/* Creator Card */}
        <div 
          onClick={() => router.push("/onboarding/creator")}
          className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-black dark:text-white group-hover:text-blue-500 transition">I am an Educator</h2>
                <p className="text-sm text-gray-500 mt-1">Share knowledge, build an audience.</p>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
          </div>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-10 text-center">
        You can always change this later in settings.
      </p>
    </div>
  );
}