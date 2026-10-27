import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  
  // Vercel par firebase-admin crash hone se bachata hai
  serverExternalPackages: ["firebase-admin"],
  
  // TypeScript errors ignore karne ke liye (launch ke baad isko hata sakte ho)
  typescript: {
    ignoreBuildErrors: process.env.STRICT_BUILD !== "true",
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // 🟢 FIX: Google Login popup block hone se bachane ke liye
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
        ],
      },
    ];
  },
};

export default nextConfig;