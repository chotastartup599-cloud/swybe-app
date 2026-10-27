"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Flag, Trash2, Loader2 } from "lucide-react";
import ReportModal from "@/components/ReportModal";

// Post / reel / story ke "..." menu: owner ko Delete, baaki sab ko Report
export default function PostMenu({
  postId,
  isOwner,
  onDeleted,
  variant = "light",
  label = "post",
}: {
  postId: string;
  isOwner: boolean;
  onDeleted?: () => void;
  variant?: "light" | "dark";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const noun = ["reel", "story", "quiz"].includes(label) ? label : "post";

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete nahi hua.");
      setOpen(false);
      onDeleted?.();
    } catch (err: any) {
      setError(err?.message || "Delete nahi hua. Dobara try karo.");
    } finally {
      setDeleting(false);
    }
  };

  const triggerClass =
    variant === "dark"
      ? "text-white hover:text-gray-300"
      : "text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white";

  const sheet = (
    <div
      className="fixed inset-0 z-[250] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { e.stopPropagation(); setOpen(false); }}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {confirmDelete ? (
          <div>
            <p className="font-bold text-lg dark:text-white mb-1">Ye {noun} delete karni hai?</p>
            <p className="text-sm text-gray-500 mb-4">Iske comments, likes aur saves bhi hat jayenge. Ye wapas nahi aayega.</p>
            {error && <p className="text-xs text-red-500 font-medium mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-zinc-800 font-semibold dark:text-white">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {isOwner ? (
              <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10">
                <Trash2 className="w-5 h-5" /> Delete {noun}
              </button>
            ) : (
              <button onClick={() => { setOpen(false); setReportOpen(true); }} className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10">
                <Flag className="w-5 h-5" /> Report {noun}
              </button>
            )}
            <button onClick={() => setOpen(false)} className="px-3 py-3.5 rounded-xl text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-zinc-800 text-left">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="More options" className={`p-1 shrink-0 ${triggerClass}`}>
        <MoreHorizontal className="w-6 h-6" />
      </button>

      {open && typeof document !== "undefined" && createPortal(sheet, document.body)}

      <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} targetType="post" targetId={postId} />
    </>
  );
}