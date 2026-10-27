import type { MetadataRoute } from "next";
import { SITE } from "@/lib/siteConfig";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacy", "/terms", "/guidelines"],
        // Login ke peeche wale ya private pages Google par index nahi hone chahiye
        disallow: ["/api/", "/admin", "/upload", "/onboarding", "/profile", "/feed", "/reels", "/search"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}