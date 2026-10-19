"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Flame, Target, Zap, ChevronRight, BookOpen, Clock, GraduationCap, Users, Award, Sparkles, Clock3, XCircle } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import CreatorDashboard from "@/components/CreatorDashboard"; // Import Creator Dashboard

export default function Dashboard() {
  const { dbUser, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !dbUser) {
      router.push("/auth");
    } else if (!loading && dbUser && !dbUser.isProfileComplete) {
      router.push("/onboarding");
    }
  }, [dbUser, loading, router]);

  if (loading || !dbUser) {
    return <div className="h-screen flex items-center justify-center dark:text-white">Loading...</div>;
  }

  // 1. MASTER PENDING CHECK
  if (dbUser.role === "master" && dbUser.masterStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-zinc-800">
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock3 className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">Application Under Review</h1>
          <p className="text-gray-500 text-sm mb-8">
            Thank you for applying to be a Master. Our team is reviewing your profile. You will get access within 24-48 hours.
          </p>
          <button onClick={logout} className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white px-6 py-2 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-zinc-700 transition w-full">
            Logout
          </button>
        </div>
      </div>
    );
  }

  // 2. MASTER REJECTED CHECK
  if (dbUser.role === "master" && dbUser.masterStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full text-center shadow-xl border border-gray-100 dark:border-zinc-800">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-black dark:text-white mb-2">Application Rejected</h1>
          <p className="text-gray-500 text-sm mb-8">
            Unfortunately, your application to become a Master was not approved. Please contact support for more details.
          </p>
          <button onClick={() => router.push("/onboarding")} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition w-full">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 3. CREATOR DASHBOARD CHECK (APPROVED MASTER)
  if (dbUser.role === "master" && dbUser.masterStatus === "approved") {
    return <CreatorDashboard />;
  }

  // 4. LEARNER DASHBOARD (Default)
  const details = dbUser.learnerDetails || {};
  
  let displaySubjects: string[] = [];
  if (dbUser.profileType === "school") {
    displaySubjects = details.stream && details.stream.length > 0 ? details.stream : ["General Study"];
  } else {
    displaySubjects = details.subjects && details.subjects.length > 0 ? details.subjects : ["General Study"];
  }

  const hobbies = details.hobbies || [];
  const targets = details.targets || [];
  const allInterests = [...targets, ...hobbies];
  const badges = dbUser.badges || [];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24 pt-6 w-full">
      <motion.div 
        className="max-w-6xl mx-auto px-4 sm:px-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* --- WELCOME BANNER --- */}
        <motion.div variants={itemVariants} className="bg-gradient-to-r from-[#5B73E8] to-[#9B51E0] rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-lg mb-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <p className="text-sm font-semibold tracking-wider text-blue-100 uppercase mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Your Study Hub
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
                Good morning, {dbUser.name?.split(' ')[0] || "Learner"} 👋
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                {dbUser.profileType === "school" 
                  ? `${details.schoolClass || "Class"} • Let's start a streak today.` 
                  : `${details.competitiveExams?.join(", ") || "Exams"} • Let's start a streak today.`}
              </p>
            </div>
            
            <Link href="/feed" className="bg-white text-[#5B73E8] px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition shadow-md whitespace-nowrap">
              Jump back in <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* --- STATS CARDS --- */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-[#FF8A65] to-[#FF5252] rounded-3xl p-6 text-white shadow-md relative overflow-hidden cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">STREAK</span>
            </div>
            <h3 className="text-4xl font-extrabold mb-1">{dbUser.streak || 0}d</h3>
            <p className="text-white/80 text-sm">Start today to keep it up</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-[#4FC3F7] to-[#29B6F6] rounded-3xl p-6 text-white shadow-md relative overflow-hidden cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Zap className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">TOTAL XP</span>
            </div>
            <h3 className="text-4xl font-extrabold mb-1">{dbUser.xp || 0}</h3>
            <p className="text-blue-100 text-sm">Keep learning to earn more</p>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-[#66BB6A] to-[#43A047] rounded-3xl p-6 text-white shadow-md relative overflow-hidden cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Target className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">SUBJECTS</span>
            </div>
            <h3 className="text-4xl font-extrabold mb-1">{displaySubjects.length}</h3>
            <p className="text-white/80 text-sm">Topics to conquer</p>
          </motion.div>
        </motion.div>

        {/* --- INTERESTS (HOBBIES & TARGETS) --- */}
        {allInterests.length > 0 && (
          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" /> Your Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest, idx) => (
                <motion.span 
                  key={idx} 
                  whileHover={{ scale: 1.05 }}
                  className="px-4 py-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl shadow-sm cursor-default"
                >
                  {interest}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- BADGES SECTION --- */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" /> Your Achievements
            </h2>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800">
            {badges.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">Start learning to unlock badges!</p>
            ) : (
              <div className="flex flex-wrap gap-4">
                {badges.map((badge: string, index: number) => (
                  <motion.div 
                    key={index} 
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-300 dark:from-yellow-900/40 dark:to-yellow-600/40 flex items-center justify-center border-2 border-yellow-400 dark:border-yellow-600 shadow-md">
                      <Award className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center max-w-[80px]">{badge}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* --- YOUR SUBJECTS --- */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-pink-500" /> Your Subjects
            </h2>
            <Link href="/onboarding/learner" className="text-sm text-blue-500 font-semibold hover:underline">Edit</Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displaySubjects.map((subject, index) => {
              const colors = ["from-purple-500 to-indigo-500", "from-orange-400 to-red-500", "from-green-400 to-emerald-600", "from-blue-400 to-cyan-500"];
              const color = colors[index % colors.length];
              
              return (
                <motion.div 
                  key={index} 
                  whileHover={{ y: -5, scale: 1.01 }}
                  className="bg-white dark:bg-zinc-900 rounded-2xl p-5 border border-gray-100 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${color}`}></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-inner shrink-0`}>
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg dark:text-white capitalize">{subject}</h3>
                        <p className="text-xs text-gray-500">Ready to learn</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3"/> 0m watched</span>
                    <Link href={`/feed?subject=${subject}`} className="text-blue-500 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Open <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* --- YOUR CLASSES --- */}
        <motion.div variants={itemVariants} className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg dark:text-white">Your classes</h3>
              <p className="text-sm text-gray-500">Join a class to get assignments.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input type="text" placeholder="CLASS CODE" className="flex-1 sm:w-32 px-4 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none dark:text-white" />
            <button className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-600 transition">Join</button>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}