import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

   serverExternalPackages: ["firebase-admin"],
  typescript: {
    // Abhi build tootne se bachane ke liye errors ignore hote hain (jaise pehle).
    // Asli errors dekhne ke liye STRICT_BUILD=true ke saath build chalao (neeche notes me tarika hai).
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
        ],
      },
    ];
  },
};

export default nextConfig;