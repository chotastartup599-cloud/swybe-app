"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { X, Camera, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { uploadToCloudinary, MAX_IMAGE_MB } from "@/lib/cloudinary";
import { isAdminEmail } from "@/lib/constants";

export default function EditProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { dbUser, refreshUser, logout } = useAuth();
  
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account delete
  const [showDelete, setShowDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Modal har baar khulne par taaza profile data se shuru hota hai
  useEffect(() => {
    if (!isOpen || !dbUser) return;
    setName(dbUser.name || "");
    setBio(dbUser.bio || "");
    setInstagram(dbUser.socialLinks?.instagram || "");
    setWhatsapp(dbUser.socialLinks?.whatsapp || "");
    setFile(null);
    setPreview(dbUser.photoURL || "");
    setError(null);
    setShowDelete(false);
    setDeleteText("");
    setDeleteError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Blob preview memory se hatao
  useEffect(() => {
    return () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); };
  }, [preview]);

  if (!isOpen || !dbUser) return null;

  const isMainAdmin = isAdminEmail(dbUser.email);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    e.target.value = "";
    if (!picked) return;

    if (!picked.type.startsWith("image/")) {
      setError("Sirf image file chuno.");
      return;
    }
    if (picked.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Photo ${MAX_IMAGE_MB}MB se chhoti honi chahiye.`);
      return;
    }

    setError(null);
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!name.trim()) {
      setError("Naam khali nahi ho sakta.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let photoURL: string | undefined;

      // Nayi photo chuni hai to hi upload karo
      if (file) {
        photoURL = await uploadToCloudinary(file);
      }

      const res = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          instagram,
          whatsapp,
          ...(photoURL ? { photoURL } : {}),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Update nahi hua. Dobara try karo.");
        return;
      }

      await refreshUser();
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Update failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteText !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Account delete nahi hua. Dobara try karo.");

      try { await logout(); } catch {}
      // Poora page reload: koi purani state na bache
      window.location.assign("/");
    } catch (err: any) {
      console.error(err);
      setDeleteError(err?.message || "Account delete nahi hua. Dobara try karo.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Edit Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-pink-500 group cursor-pointer">
              {preview ? (
                <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-pink-500 flex items-center justify-center text-white text-3xl font-bold">
                  {name?.charAt(0) || "U"}
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-xs text-gray-500">Click to change picture (max {MAX_IMAGE_MB}MB)</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Name</label>
            <input type="text" maxLength={50} value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio ({bio.length}/200)</label>
            <textarea value={bio} maxLength={200} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Instagram Handle</label>
            <input type="text" maxLength={40} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp Number</label>
            <input type="tel" maxLength={16} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="91XXXXXXXXXX" className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
            <p className="text-[11px] text-gray-400 mt-1">Country code ke saath likho (jaise 919876543210), + ke bina. Ye aapki public profile par dikhta hai.</p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || deleting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition mt-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </button>
        </form>

        {/* Delete account */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-zinc-800">
          <h3 className="text-sm font-bold text-red-600 mb-1">Delete account</h3>

          {isMainAdmin ? (
            <p className="text-xs text-gray-500">Admin account yahan se delete nahi ho sakta.</p>
          ) : !showDelete ? (
            <>
              <p className="text-xs text-gray-500 mb-3">Aapka profile, posts, comments, likes aur saved folders hamesha ke liye hat jayenge. Ye wapas nahi aayega.</p>
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="text-sm font-semibold text-red-600 border border-red-300 dark:border-red-500/40 rounded-xl px-4 py-2 hover:bg-red-50 dark:hover:bg-red-500/10 transition flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete my account
              </button>
            </>
          ) : (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
              <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-3">
                Confirm karne ke liye neeche <span className="font-extrabold">DELETE</span> likho.
              </p>
              <input
                type="text"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder="DELETE"
                autoCapitalize="characters"
                className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-500/30 rounded-xl text-sm outline-none dark:text-white mb-3"
              />
              {deleteError && <p className="text-xs text-red-600 font-medium mb-3">{deleteError}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDelete(false); setDeleteText(""); setDeleteError(null); }}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm font-semibold dark:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteText !== "DELETE" || deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete forever"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Legal links */}
        <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
          <Link href="/privacy" target="_blank" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" target="_blank" className="hover:underline">Terms</Link>
          <Link href="/guidelines" target="_blank" className="hover:underline">Guidelines</Link>
        </div>
        <p className="text-[11px] text-gray-400 text-center mt-1">Swybe is created by Chota Startup</p>
      </div>
    </div>
  );
}