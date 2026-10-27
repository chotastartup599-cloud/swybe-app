import Link from "next/link";
import { SITE } from "@/lib/siteConfig";

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row md:justify-between gap-8">
        <div className="max-w-sm">
          <p className="text-2xl font-extrabold tracking-tighter text-black dark:text-white">Swybe</p>
          <p className="text-sm text-gray-500 mt-2">
            {SITE.tagline}. A focused learning app for school students and exam aspirants.
          </p>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4">
            Created by {SITE.company}
          </p>
        </div>

        <div className="flex gap-14 text-sm">
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-black dark:text-white">Swybe</p>
            <Link href="/auth" className="text-gray-500 hover:text-black dark:hover:text-white">Log in</Link>
            <Link href="/auth" className="text-gray-500 hover:text-black dark:hover:text-white">Sign up</Link>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-black dark:text-white">Legal</p>
            <Link href="/privacy" className="text-gray-500 hover:text-black dark:hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-500 hover:text-black dark:hover:text-white">Terms of Use</Link>
            <Link href="/guidelines" className="text-gray-500 hover:text-black dark:hover:text-white">Community Guidelines</Link>
            <a href={`mailto:${SITE.contactEmail}`} className="text-gray-500 hover:text-black dark:hover:text-white">Contact us</a>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-zinc-900">
        <p className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-xs text-gray-400">
          © {year} {SITE.company}. All rights reserved. Swybe is created by {SITE.company}.
        </p>
      </div>
    </footer>
  );
}