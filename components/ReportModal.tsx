"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const REASONS = [
  { value: "spam", label: "Spam ya scam" },
  { value: "harassment", label: "Bullying ya harassment" },
  { value: "hate", label: "Hate ya bhedbhav" },
  { value: "inappropriate", label: "Sexual ya unsafe content" },
  { value: "unsafe", label: "Self-harm, nasha ya khatarnak cheezein" },
  { value: "misinformation", label: "Galat ya jhooti jaankari" },
  { value: "copyright", label: "Kisi aur ka content (copyright)" },
  { value: "other", label: "Kuch aur" },
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
}: {
  isOpen: boolean;
  onClose: () => void;
  targetType: "post" | "comment" | "user";
  targetId: string;
}) {
  const { dbUser, user } = useAuth();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  // Har baar khulne par form saaf
  useEffect(() => {
    if (isOpen) {
      setReason("");
      setDetails("");
      setError(null);
      setDoneMessage(null);
    }
  }, [isOpen, targetId]);

  if (!isOpen || typeof document === "undefined") return null;

  const canReport = !!dbUser && !user?.isAnonymous;
  const what = targetType === "post" ? "post" : targetType === "comment" ? "comment" : "profile";

  const submit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Report nahi ho payi.");
      setDoneMessage(data.already ? "Aap ise pehle hi report kar chuke ho. Hamari team review kar rahi hai." : "Shukriya! Hamari team ise review karegi.");
    } catch (err: any) {
      setError(err?.message || "Report nahi ho payi. Dobara try karo.");
    } finally {
      setSubmitting(false);
    }
  };

  const modal = (
    <div
      className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold dark:text-white">Report {what}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-500 hover:text-black dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {doneMessage ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-5">{doneMessage}</p>
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 rounded-xl transition">Done</button>
          </div>
        ) : !canReport ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">Report karne ke liye apne account se login karo (guest mode me nahi).</p>
            <button onClick={onClose} className="bg-gray-200 dark:bg-zinc-800 text-black dark:text-white font-semibold px-8 py-2.5 rounded-xl">Close</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">Is {what} me kya galat hai? Aapki report private rehti hai.</p>

            <div className="flex flex-col gap-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${reason === r.value ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400" : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <textarea
              value={details}
              maxLength={300}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Aur batana chaho to yahan likho (optional)"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-sm outline-none dark:text-white resize-none mb-4"
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={submit}
              disabled={!reason || submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Report"}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}