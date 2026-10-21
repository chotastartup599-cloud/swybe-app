import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react"; // <-- Suspense import karo

export const dynamic = 'force-dynamic'; // <-- Static build rokne ke liye

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Swybe - Learn from Toppers & Peers",
  description: "A unique educational platform for students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 dark:bg-zinc-950 text-black dark:text-white min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>
            
            <div className="flex min-h-screen">
              {/* Sidebar (Desktop Only) ko Suspense me wrap karo */}
              <Suspense fallback={<div className="w-[72px] bg-white dark:bg-black border-r border-gray-200 dark:border-zinc-800" />}>
                <Sidebar />
              </Suspense>

              {/* Main Content Area */}
              <div className="flex-1 md:ml-[72px] flex flex-col min-h-screen relative pb-14 md:pb-0 transition-all duration-300">
                <Suspense fallback={<div className="h-14" />}>
                  <TopBar /> {/* Mobile Only */}
                </Suspense>
                
                <main className="flex-1 w-full pt-14 md:pt-0">
                  {children}
                </main>
                
                {/* BottomNav ko Suspense me wrap karo */}
                <Suspense fallback={<div className="h-14" />}>
                  <BottomNav /> {/* Mobile Only */}
                </Suspense>
              </div>
            </div>
            
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}