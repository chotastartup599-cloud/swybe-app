"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Camera, Loader2 } from "lucide-react";

export default function EditProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { dbUser, refreshUser } = useAuth();
  
  const [name, setName] = useState(dbUser?.name || "");
  const [bio, setBio] = useState(dbUser?.bio || "");
  const [instagram, setInstagram] = useState(dbUser?.socialLinks?.instagram || "");
  const [whatsapp, setWhatsapp] = useState(dbUser?.socialLinks?.whatsapp || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(dbUser?.photoURL || "");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !dbUser) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoURL = dbUser.photoURL;

      // 1. Agar nayi image select ki hai, toh Cloudinary par upload karo
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "swybe_upload"); // Tumhara preset

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/okuevkuf/image/upload`, {
          method: "POST",
          body: formData,
        });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) photoURL = cloudData.secure_url;
      }

      // 2. Database me update karo
      const res = await fetch("/api/users/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: dbUser.firebaseUid,
          name,
          bio,
          photoURL,
          instagram,
          whatsapp
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshUser();
        onClose();
      }
    } catch (error) {
      console.error(error);
      alert("Update failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl p-6 relative shadow-2xl"
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
              <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
            </div>
            <p className="text-xs text-gray-500">Click to change picture</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white resize-none" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Instagram Handle</label>
            <input type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username" className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">WhatsApp Number</label>
            <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91..." className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white" />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition mt-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}