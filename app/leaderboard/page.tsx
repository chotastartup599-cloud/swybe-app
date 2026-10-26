"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Flame, Zap, Loader2 } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const PODIUM = {
  1: { box: "w-28 sm:w-36 z-10", avatar: "w-20 h-20 sm:w-24 sm:h-24 border-yellow-400 dark:border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]", badge: "w-10 h-10 bg-yellow-400 text-lg", base: "h-28 bg-yellow-100 dark:bg-yellow-900/30", icon: "👑", name: "text-base", xp: "text-sm" },
  2: { box: "w-24 sm:w-32", avatar: "w-16 h-16 sm:w-20 sm:h-20 border-gray-300 dark:border-gray-600", badge: "w-8 h-8 bg-gray-300 dark:bg-gray-600", base: "h-20 bg-gray-200 dark:bg-zinc-800", icon: "🥈", name: "text-sm", xp: "text-xs" },
  3: { box: "w-24 sm:w-32", avatar: "w-16 h-16 sm:w-20 sm:h-20 border-orange-400 dark:border-orange-500", badge: "w-8 h-8 bg-orange-400", base: "h-16 bg-orange-100 dark:bg-orange-900/30", icon: "🥉", name: "text-sm", xp: "text-xs" },
} as const;

function Avatar({ user, className }: { user: any; className: string }) {
  return (
    <div className={`rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-800 shrink-0 ${className}`}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="flex items-center justify-center h-full font-bold dark:text-white">{user.name?.charAt(0) || "U"}</span>
      )}
    </div>
  );
}

function PodiumItem({ user, rank, myUid }: { user: any; rank: 1 | 2 | 3; myUid?: string }) {
  const s = PODIUM[rank];
  const isMe = !!myUid && user.firebaseUid === myUid;
  const href = isMe ? "/profile" : `/profile/${user.firebaseUid}`;

  return (
    <motion.div variants={itemVariants} className={`flex flex-col items-center ${s.box}`}>
      <Link href={href} className="flex flex-col items-center w-full">
        <div className="relative">
          <Avatar user={user} className={`border-4 ${s.avatar}`} />
          <div className={`absolute -bottom-2 -right-2 rounded-full flex items-center justify-center font-bold text-white border-2 border-white dark:border-black shadow-lg ${s.badge}`}>{rank}</div>
        </div>
        <h3 className={`font-bold mt-3 dark:text-white text-center truncate w-full ${s.name}`}>{user.name}{isMe && " (You)"}</h3>
        <p className={`text-blue-500 font-semibold ${s.xp}`}>{user.xp} XP</p>
      </Link>
      <div className={`w-full rounded-t-lg mt-2 flex justify-center pt-2 ${s.base}`}>
        <span className="text-2xl">{s.icon}</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { user, dbUser, loading: authLoading } = useAuth();
  const uid: string | undefined = dbUser?.firebaseUid;

  const [users, setUsers] = useState<any[]>([]);
  const [me, setMe] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Login ka result aane ke baad fetch, taaki apna rank bhi aaye
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function fetchLeaderboard() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch("/api/users/leaderboard", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setUsers(data.data);
          setMe(data.me);
        } else {
          setError(true);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaderboard();
    return () => { cancelled = true; };
  }, [authLoading, uid]);

  if (loading || authLoading) {
    return <div className="h-screen flex items-center justify-center dark:text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);
  const podiumOrder: (1 | 2 | 3)[] = [2, 1, 3];
  const isGuest = !!user?.isAnonymous;
  const meInList = !!me?.eligible && me.rank !== null && me.rank <= users.length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20 pt-6 w-full">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white mb-2">Global Leaderboard</h1>
          <p className="text-gray-500">Top learners, total XP ke hisaab se (all-time).</p>
        </div>

        {error && (
          <div className="text-center mb-8">
            <p className="text-gray-500 mb-3">Leaderboard load nahi ho paya.</p>
            <button onClick={() => window.location.reload()} className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">Retry</button>
          </div>
        )}

        {/* Apna rank (agar top list me nahi hai ya list chhoti hai) */}
        {dbUser && !error && (
          <div className="mb-8">
            {isGuest ? (
              <p className="text-center text-sm text-gray-500">Guest mode me XP leaderboard me nahi ginta. Apna account banao aur rank paao!</p>
            ) : me?.eligible ? (
              !meInList && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-2xl p-4 text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Aapka rank: #{me.rank} • {me.xp} XP</p>
                </div>
              )
            ) : dbUser.role === "learner" ? (
              <p className="text-center text-sm text-gray-500">Quiz solve karo aur videos dekho, XP kamaoge to yahan aapka naam aayega.</p>
            ) : null}
          </div>
        )}

        {/* Top 3 Podium */}
        {top3.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex justify-center items-end gap-2 sm:gap-6 mb-12">
            {podiumOrder.map((rank) => {
              const u = top3[rank - 1];
              return u ? <PodiumItem key={u.firebaseUid} user={u} rank={rank} myUid={uid} /> : null;
            })}
          </motion.div>
        )}

        {/* Ranks 4+ */}
        {rest.length > 0 && (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {rest.map((u, index) => {
              const isMe = !!uid && u.firebaseUid === uid;
              return (
                <motion.div key={u.firebaseUid} variants={itemVariants}>
                  <Link
                    href={isMe ? "/profile" : `/profile/${u.firebaseUid}`}
                    className={`flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800/50 last:border-none hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition ${isMe ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-bold text-gray-400 w-6 text-center">{index + 4}</span>
                      <Avatar user={u} className="w-10 h-10" />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm dark:text-white truncate">{u.name}{isMe && " (You)"}</h4>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5"><Flame className="w-3 h-3 text-orange-500" /> {u.streak || 0}d</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-blue-500 flex items-center gap-1 shrink-0">
                      <Zap className="w-4 h-4" /> {u.xp} XP
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {!error && users.length === 0 && (
          <p className="text-center text-gray-500 py-10">Abhi leaderboard khali hai. Pehle XP kamao aur #1 bano! 🚀</p>
        )}
        {!error && users.length > 0 && users.length <= 3 && (
          <p className="text-center text-gray-500 mt-6 text-sm">Abhi sirf {users.length} learner{users.length > 1 ? "s" : ""} leaderboard par {users.length > 1 ? "hain" : "hai"}.</p>
        )}

      </div>
    </div>
  );
}