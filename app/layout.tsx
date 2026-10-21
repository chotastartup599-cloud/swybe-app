import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import ClientLayout from "@/components/ClientLayout"; // <-- Naya Import

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
            
            {/* Yahan ClientLayout use kiya */}
            <ClientLayout>
              {children}
            </ClientLayout>
            
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}