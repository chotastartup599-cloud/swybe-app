"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Folder as FolderIcon, Check, Loader2 } from "lucide-react";

export default function SaveModal({
  postId,
  isOpen,
  onClose,
  onSavedChange,
}: {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  // Post kisi folder me saved hai ya nahi, ye parent ko batata hai (bookmark icon ke liye)
  onSavedChange?: (saved: boolean) => void;
}) {
  const { dbUser } = useAuth();
  const uid = dbUser?.firebaseUid;

  const [folders, setFolders] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [fetching, setFetching] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyFolderId, setBusyFolderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containsPost = (folder: any) => (folder.posts || []).map(String).includes(postId);

  useEffect(() => {
    if (!isOpen || !uid || !postId) return;
    let cancelled = false;

    async function fetchFolders() {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch("/api/folders?light=1", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (data.success) {
          setFolders(data.data);
          onSavedChange?.(data.data.some(containsPost));
        } else {
          setError(data.error || "Folders load nahi hue.");
        }
      } catch (err) {
        if (!cancelled) setError("Network error. Dobara try karo.");
      } finally {
        if (!cancelled) setFetching(false);
      }
    }

    fetchFolders();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, uid, postId]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newFolderName }),
      });
      const data = await res.json();
      if (data.success) {
        setNewFolderName("");
        setFolders((prev) => [{ ...data.data, posts: [] }, ...prev]);
      } else {
        setError(data.error || "Folder nahi bana.");
      }
    } catch (err) {
      setError("Network error. Dobara try karo.");
    } finally {
      setCreating(false);
    }
  };

  // Folder par tap: save, aur pehle se saved hai to unsave
  const handleToggleSave = async (folder: any) => {
    if (busyFolderId) return;
    const alreadySaved = containsPost(folder);
    setBusyFolderId(folder._id);
    setError(null);

    try {
      const res = await fetch("/api/folders/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId: folder._id, postId, action: alreadySaved ? "remove" : "save" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Save nahi hua.");

      const nextFolders = folders.map((f) =>
        f._id === folder._id
          ? { ...f, posts: alreadySaved ? (f.posts || []).filter((p: any) => String(p) !== postId) : [...(f.posts || []), postId] }
          : f
      );
      setFolders(nextFolders);
      onSavedChange?.(nextFolders.some(containsPost));

      if (!alreadySaved) setTimeout(onClose, 700);
    } catch (err: any) {
      setError(err?.message || "Save nahi hua.");
    } finally {
      setBusyFolderId(null);
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

        {!uid ? (
          <p className="text-sm text-gray-500 text-center py-6">Save karne ke liye pehle login karo.</p>
        ) : (
          <>
            {/* Naya Folder Banane ka Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newFolderName}
                maxLength={40}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); }}
                placeholder="New folder name..."
                className="flex-1 bg-gray-100 dark:bg-zinc-800 text-sm text-black dark:text-white rounded-lg px-3 py-2 outline-none border border-transparent focus:border-pink-500 transition"
              />
              <button
                onClick={handleCreateFolder}
                disabled={creating || !newFolderName.trim()}
                className="bg-pink-500 text-white p-2.5 rounded-lg disabled:opacity-50 hover:bg-pink-600 transition"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            {error && <p className="text-xs text-red-500 font-medium mb-3">{error}</p>}

            {/* Folders List */}
            <div className="max-h-[40vh] overflow-y-auto flex flex-col gap-2">
              {fetching ? (
                <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin text-pink-500" /></div>
              ) : folders.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No folders yet. Create one above!</p>
              ) : (
                folders.map((folder) => {
                  const saved = containsPost(folder);
                  return (
                    <button
                      key={folder._id}
                      onClick={() => handleToggleSave(folder)}
                      disabled={!!busyFolderId}
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 transition text-left disabled:opacity-70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FolderIcon className="w-5 h-5 text-gray-400 shrink-0" />
                        <span className="text-sm font-semibold text-black dark:text-white truncate">{folder.name}</span>
                      </div>
                      {busyFolderId === folder._id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : saved ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-green-500"><Check className="w-4 h-4" /> Saved</span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>

            {folders.some(containsPost) && (
              <p className="text-[11px] text-gray-400 mt-3 text-center">Saved folder par dobara tap karoge to post hat jayegi.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}