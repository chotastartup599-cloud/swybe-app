"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, CheckCircle, XCircle, Loader2, AtSign } from "lucide-react";
import { useRouter } from "next/navigation";

// YAHAN PAR DECLARE KIYA HAI (Ise miss mat karna)
const ADMIN_EMAIL = "chotastartup599@gmail.com";

export default function AdminDashboard() {
  const { dbUser, loading } = useAuth();
  const router = useRouter();
  
  const [creators, setCreators] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Safe check function
  const isAdmin = dbUser?.email?.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!loading && isAdmin) {
      fetchPending();
    }
  }, [dbUser, loading, isAdmin]);

  const fetchPending = async () => {
    try {
      const res = await fetch("/api/admin/creators");
      const data = await res.json();
      if (data.success) setCreators(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleAction = async (uid: string, status: string) => {
    setActionLoading(uid);
    try {
      await fetch("/api/admin/creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUid: uid, status })
      });
      setCreators(creators.filter(c => c.firebaseUid !== uid));
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  };

  // Direct Access Denied UI (Agar admin nahi hai)
  if (loading || !dbUser || !isAdmin) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold text-black dark:text-white mb-2">Access Denied</h1>
        <p className="text-gray-500 mb-6 text-center">You do not have permission to view this page.</p>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-xl mb-6 text-sm text-yellow-800 dark:text-yellow-300">
          Logged in as: {dbUser?.email || "Not logged in"}
        </div>
        <button onClick={() => router.push("/")} className="bg-pink-500 text-white px-6 py-2 rounded-xl font-semibold hover:bg-pink-600 transition">
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 pt-20">
      <div className="max-w-2xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8 bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-black dark:text-white">Admin Control Center</h1>
            <p className="text-sm text-gray-500">Manage creators and platform access</p>
          </div>
        </div>

        <h2 className="text-lg font-bold text-black dark:text-white mb-4">Pending Creator Approvals</h2>

        {fetching ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
        ) : creators.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800">
            <p className="text-gray-500">No pending applications right now.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {creators.map((creator) => (
              <div key={creator._id} className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800">
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {creator.photoURL ? (
                      <img src={creator.photoURL} alt="Avatar" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {creator.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-black dark:text-white">{creator.name}</h3>
                      <p className="text-xs text-gray-500">{creator.email}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md">PENDING</span>
                </div>

                <div className="bg-gray-50 dark:bg-black p-4 rounded-xl mb-4 text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-2">
                  <p><strong>Subject:</strong> {creator.masterDetails?.subject}</p>
                  <p><strong>Experience:</strong> {creator.masterDetails?.experience}</p>
                  <p className="flex items-center gap-2">
                    <strong>Handle:</strong> 
                    <a href={`https://instagram.com/${creator.masterDetails?.instagramHandle?.replace('@','')}`} target="_blank" className="text-blue-500 flex items-center gap-1 hover:underline">
                      <AtSign className="w-4 h-4" /> {creator.masterDetails?.instagramHandle}
                    </a>
                  </p>
                  {creator.masterDetails?.bio && <p><strong>Bio:</strong> {creator.masterDetails?.bio}</p>}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(creator.firebaseUid, 'approved')}
                    disabled={actionLoading === creator.firebaseUid}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    {actionLoading === creator.firebaseUid ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
                  </button>
                  <button
                    onClick={() => handleAction(creator.firebaseUid, 'rejected')}
                    disabled={actionLoading === creator.firebaseUid}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}