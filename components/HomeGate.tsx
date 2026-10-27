"use client";

import { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// "/" par: logged-in user => Dashboard (children), logged-out => Landing page.
// Landing ka HTML pehle se server se aata hai (Google ko dikhta hai).
// Login check hote waqt wo chhupa rehta hai, taaki logged-in user ko landing ka flash na dikhe.
export default function HomeGate({ landing, children }: { landing: ReactNode; children: ReactNode }) {
  const { dbUser, loading } = useAuth();

  if (!loading && dbUser) return <>{children}</>;

  return (
    <>
      <div className={loading ? "invisible" : undefined} aria-hidden={loading}>
        {landing}
      </div>
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      )}
    </>
  );
}