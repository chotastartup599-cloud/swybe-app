"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Folder as FolderIcon, Check, Loader2 } from "lucide-react";

export default function SaveModal({ postId, isOpen, onClose }: { postId: string, isOpen: boolean, onClose: () => void }) {
  const { dbUser } = useAuth();
  const [folders, setFolders] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [savedFolderId, setSavedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && dbUser?.firebaseUid) {
      fetchFolders();
    }
  }, [isOpen, dbUser]);

  const fetchFolders = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/folders?userId=${dbUser.firebaseUid}`);
      const data = await res.json();
      if (data.success) setFolders(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !dbUser?.firebaseUid) return;
    setLoading(true);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dbUser.firebaseUid, name: newFolderName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewFolderName("");
        fetchFolders(); // Naya folder list me add karo
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (folderId: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/folders/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId, postId }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedFolderId(folderId);
        setTimeout(() => {
          onClose();
          setSavedFolderId(null);
        }, 1000); // 1 second ke liye tick dikhao phir band kardo
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold dark:text-white">Save to...</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Naya Folder Banane ka Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="New folder name..."
            className="flex-1 bg-gray-100 dark:bg-zinc-800 text-sm text-black dark:text-white rounded-lg px-3 py-2 outline-none border border-transparent focus:border-pink-500 transition"
          />
          <button 
            onClick={handleCreateFolder}
            disabled={loading || !newFolderName.trim()}
            className="bg-pink-500 text-white p-2.5 rounded-lg disabled:opacity-50 hover:bg-pink-600 transition"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Folders List */}
        <div className="max-h-[40vh] overflow-y-auto flex flex-col gap-2">
          {fetching ? (
            <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
          ) : folders.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No folders yet. Create one above!</p>
          ) : (
            folders.map((folder) => (
              <button
                key={folder._id}
                onClick={() => handleSavePost(folder._id)}
                disabled={loading || savedFolderId === folder._id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <FolderIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-semibold text-black dark:text-white">{folder.name}</span>
                </div>
                {savedFolderId === folder._id && <Check className="w-5 h-5 text-green-500" />}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}