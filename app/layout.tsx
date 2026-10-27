import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import AppShell from "@/components/AppShell";
import { SITE } from "@/lib/siteConfig";

const inter = Inter({ subsets: ["latin"] });

const defaultTitle = `${SITE.name} - ${SITE.tagline}`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: defaultTitle,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.company }],
  creator: SITE.company,
  publisher: SITE.company,
  keywords: [
    "Swybe",
    "Chota Startup",
    "study app",
    "Class 9 to 12",
    "JEE preparation",
    "NEET preparation",
    "NDA preparation",
    "UPSC preparation",
    "educational reels",
    "quiz and XP",
    "student community",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_IN",
    title: defaultTitle,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: SITE.description,
  },
  formatDetection: { telephone: false },
  appleWebApp: { capable: true, title: SITE.name, statusBarStyle: "default" },
};

// viewportFit "cover": iPhone ke notch/home-bar ke hisaab se BottomNav sahi baithta hai
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
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
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}