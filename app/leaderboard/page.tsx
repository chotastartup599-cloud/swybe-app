"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Zap, Loader2, Award } from "lucide-react";
import { motion, Variants } from "framer-motion";

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/users/leaderboard");
        const data = await res.json();
        if (data.success) setUsers(data.data);
      } catch (error) {
        console.error("Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20 pt-16 md:pt-6 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white mb-2">Global Leaderboard</h1>
          <p className="text-gray-500">Top learners with the highest XP this week.</p>
        </div>

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex justify-center items-end gap-2 sm:gap-6 mb-12 h-64">
            {/* Rank 2 */}
            {top3[1] && (
              <motion.div variants={itemVariants} className="flex flex-col items-center w-24 sm:w-32">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-200 dark:bg-zinc-800">
                    {top3[1].photoURL ? <img src={top3[1].photoURL} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xl font-bold">{top3[1].name?.charAt(0)}</span>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center font-bold text-white border-2 border-white dark:border-black shadow-lg">2</div>
                </div>
                <h3 className="font-bold text-sm mt-3 dark:text-white text-center truncate w-full">{top3[1].name}</h3>
                <p className="text-xs text-blue-500 font-semibold">{top3[1].xp} XP</p>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-20 rounded-t-lg mt-2 flex justify-center pt-2">
                  <span className="text-2xl">🥈</span>
                </div>
              </motion.div>
            )}

            {/* Rank 1 */}
            {top3[0] && (
              <motion.div variants={itemVariants} className="flex flex-col items-center w-28 sm:w-36 z-10">
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-yellow-400 dark:border-yellow-500 overflow-hidden bg-gray-200 dark:bg-zinc-800 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                    {top3[0].photoURL ? <img src={top3[0].photoURL} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-2xl font-bold">{top3[0].name?.charAt(0)}</span>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-white border-2 border-white dark:border-black shadow-lg text-lg">1</div>
                </div>
                <h3 className="font-bold text-base mt-3 dark:text-white text-center truncate w-full">{top3[0].name}</h3>
                <p className="text-sm text-blue-500 font-semibold">{top3[0].xp} XP</p>
                <div className="w-full bg-yellow-100 dark:bg-yellow-900/30 h-28 rounded-t-lg mt-2 flex justify-center pt-2">
                  <span className="text-3xl">👑</span>
                </div>
              </motion.div>
            )}

            {/* Rank 3 */}
            {top3[2] && (
              <motion.div variants={itemVariants} className="flex flex-col items-center w-24 sm:w-32">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-orange-400 dark:border-orange-500 overflow-hidden bg-gray-200 dark:bg-zinc-800">
                    {top3[2].photoURL ? <img src={top3[2].photoURL} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full text-xl font-bold">{top3[2].name?.charAt(0)}</span>}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center font-bold text-white border-2 border-white dark:border-black shadow-lg">3</div>
                </div>
                <h3 className="font-bold text-sm mt-3 dark:text-white text-center truncate w-full">{top3[2].name}</h3>
                <p className="text-xs text-blue-500 font-semibold">{top3[2].xp} XP</p>
                <div className="w-full bg-orange-100 dark:bg-orange-900/30 h-16 rounded-t-lg mt-2 flex justify-center pt-2">
                  <span className="text-2xl">🥉</span>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Ranks 4-10 */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          {rest.map((user, index) => (
            <motion.div variants={itemVariants} key={user._id} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800/50 last:border-none hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition">
              <div className="flex items-center gap-4">
                <span className="font-bold text-gray-400 w-6 text-center">{index + 4}</span>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 overflow-hidden">
                  {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="flex items-center justify-center h-full font-bold">{user.name?.charAt(0)}</span>}
                </div>
                <div>
                  <h4 className="font-bold text-sm dark:text-white">{user.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" /> {user.streak || 0}d</span>
                  </div>
                </div>
              </div>
              <div className="font-bold text-blue-500 flex items-center gap-1">
                <Zap className="w-4 h-4" /> {user.xp} XP
              </div>
            </motion.div>
          ))}
          {rest.length === 0 && top3.length > 0 && (
            <div className="p-8 text-center text-gray-500">Only 3 users on the leaderboard yet.</div>
          )}
        </motion.div>

      </div>
    </div>
  );
}