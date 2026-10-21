"use client";

import dynamic from 'next/dynamic';

// Yahan humne saare client-side hooks wale components ko SSR off karke import kiya hai
const Sidebar = dynamic(() => import('./Sidebar'), { ssr: false });
const BottomNav = dynamic(() => import('./BottomNav'), { ssr: false });
const TopBar = dynamic(() => import('./TopBar'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar (Desktop Only) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 md:ml-[72px] flex flex-col min-h-screen relative pb-14 md:pb-0 transition-all duration-300">
        <TopBar /> {/* Mobile Only */}
        
        <main className="flex-1 w-full pt-14 md:pt-0">
          {children}
        </main>
        
        <BottomNav /> {/* Mobile Only */}
      </div>
    </div>
  );
}