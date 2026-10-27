import Link from "next/link";

// variant "landing": home page ka header (menu + Log in + Get started)
// variant "legal": Privacy/Terms jaise pages ka simple header
export default function SiteHeader({ variant }: { variant: "landing" | "legal" }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-black/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-between">
        <Link href="/" className="text-2xl font-extrabold tracking-tighter text-black dark:text-white">
          Swybe
        </Link>

        {variant === "landing" ? (
          <nav className="flex items-center gap-4 sm:gap-6">
            <a href="#features" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">Features</a>
            <a href="#how" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">How it works</a>
            <a href="#educators" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">For educators</a>
            <a href="#faq" className="hidden md:block text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white">FAQ</a>
            <Link href="/auth" className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:underline">
              Log in
            </Link>
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-full transition">
              Get started
            </Link>
          </nav>
        ) : (
          <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-full transition">
            Open Swybe
          </Link>
        )}
      </div>
    </header>
  );
}