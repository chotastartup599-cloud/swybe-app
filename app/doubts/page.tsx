"use client";

import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DoubtsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 pt-16">
      <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mb-6">
        <Construction className="w-12 h-12 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-black dark:text-white mb-3 text-center">Community Doubts</h1>
      <p className="text-gray-500 text-center max-w-sm mb-8">
        This feature is currently under development. Soon you will be able to ask doubts and get answers from peers and AI!
      </p>
      <Link href="/" className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 rounded-xl font-bold hover:opacity-80 transition flex items-center gap-2">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>
    </div>
  );
}