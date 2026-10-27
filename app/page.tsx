import type { Metadata } from "next";
import HomeGate from "@/components/HomeGate";
import Landing from "@/components/Landing";
import DashboardView from "@/components/DashboardView";
import { SITE } from "@/lib/siteConfig";

const title = `${SITE.name} - ${SITE.tagline} | Created by ${SITE.company}`;

export const metadata: Metadata = {
  title: { absolute: title },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: SITE.name,
    locale: "en_IN",
    title,
    description: SITE.description,
  },
};

export default function HomePage() {
  return (
    <HomeGate landing={<Landing />}>
      <DashboardView />
    </HomeGate>
  );
}