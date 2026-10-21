import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

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
            
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
