import Link from "next/link";
import {
  Flame, Zap, Clapperboard, HelpCircle, Bookmark, Trophy, Users, GraduationCap,
  Target, ShieldCheck, Sparkles, CheckCircle2, Video, BarChart3,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE } from "@/lib/siteConfig";

const FEATURES = [
  { icon: Clapperboard, title: "Short-form learning", text: "Bite-sized educational reels and posts from toppers and educators. Learn a concept in a minute, not an hour of scrolling.", color: "from-pink-500 to-orange-400" },
  { icon: HelpCircle, title: "Quizzes that reward you", text: "Answer quick quizzes and earn XP for correct answers. Answers are checked on our server, so the leaderboard stays fair.", color: "from-blue-500 to-cyan-400" },
  { icon: Flame, title: "Streaks and XP", text: "Show up daily to build your streak, collect badges and climb the leaderboard. Small habits, big results.", color: "from-orange-500 to-red-500" },
  { icon: Bookmark, title: "Save to folders", text: "Save notes, reels and quizzes into your own folders so revision is one tap away before exams.", color: "from-purple-500 to-indigo-500" },
  { icon: Target, title: "Made for your goals", text: "Tell us your class, exams and subjects. Your feed and dashboard follow what you are preparing for.", color: "from-green-500 to-emerald-400" },
  { icon: Users, title: "Peers and educators", text: "Follow educators, share stories and learn with students who are on the same journey as you.", color: "from-yellow-500 to-orange-400" },
];

const STEPS = [
  { n: "1", title: "Sign up in seconds", text: "Use Google or email, or just try Swybe as a guest first." },
  { n: "2", title: "Set your goals", text: "Pick your class, target exams and subjects so Swybe can personalise your feed." },
  { n: "3", title: "Learn and earn", text: "Watch, solve quizzes, keep your streak alive and rise on the leaderboard." },
];

const FAQS = [
  { q: "Is Swybe free?", a: "Yes, Swybe is free to join and use right now." },
  { q: "Who is Swybe for?", a: "Students of Class 9 to 12 and aspirants of exams like JEE, NEET, NDA and UPSC. If you want to learn without distractions, Swybe is for you." },
  { q: "Can I try it without an account?", a: "Yes. Guest mode lets you explore the feed, reels and quizzes. To comment, follow, post stories or earn XP on the leaderboard you need a free account." },
  { q: "How do XP and streaks work?", a: "You earn XP for your daily visit, for correct quiz answers and for time spent learning. All limits and checks happen on our server, so every learner competes on equal terms." },
  { q: "How can I become an educator?", a: "Sign up as a Master, fill in a short application and our team reviews it. Once approved you can upload posts, reels and quizzes." },
  { q: "What about community doubts?", a: "Peer-to-peer doubt solving is coming soon. We are building it carefully so it stays helpful and safe." },
  { q: "I am under 18. Can I use Swybe?", a: "Swybe is built for school students. If you are under 18, please use it with the knowledge and permission of a parent or guardian. Read our Privacy Policy to see exactly what we collect." },
];

export default function Landing() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        inLanguage: "en-IN",
      },
      {
        "@type": "Organization",
        name: SITE.name,
        url: SITE.url,
        parentOrganization: { "@type": "Organization", name: SITE.company },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SiteHeader variant="landing" />

      <main>
        {/* HERO */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-4 h-4" /> For Class 9-12 and JEE, NEET, NDA, UPSC aspirants
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
              Learn from toppers and peers.{" "}
              <span className="bg-gradient-to-r from-[#5B73E8] to-[#9B51E0] bg-clip-text text-transparent">Zero distractions.</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              Swybe brings short educational reels, quizzes, streaks and a focused student community into one app, so your screen time turns into study time.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-full text-center transition shadow-lg shadow-blue-600/20">
                Get started free
              </Link>
              <Link href="/auth" className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 font-semibold px-7 py-3.5 rounded-full text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                Try as guest
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-500">Free to join. No ads. Created by {SITE.company}.</p>
          </div>

          {/* Preview card (sirf example, asli data nahi) */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#5B73E8]/30 to-[#9B51E0]/30 blur-2xl rounded-[3rem]" />
            <div className="relative rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl">
              <div className="flex gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full"><Flame className="w-3.5 h-3.5" /> Daily streak</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full"><Zap className="w-3.5 h-3.5" /> Earn XP</span>
              </div>
              <p className="text-xs font-semibold text-pink-500 mb-1">Quick quiz | Physics</p>
              <p className="font-bold text-lg mb-4">Which of these is a vector quantity?</p>
              <div className="flex flex-col gap-2.5">
                {["Speed", "Mass", "Velocity", "Energy"].map((opt) => (
                  <div
                    key={opt}
                    className={`p-3 rounded-xl border text-sm flex justify-between items-center ${opt === "Velocity" ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-semibold" : "border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300"}`}
                  >
                    {opt}
                    {opt === "Velocity" && <CheckCircle2 className="w-5 h-5" />}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-4 text-center">Example preview</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="bg-white dark:bg-black border-y border-gray-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
            <div className="max-w-2xl mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything you need to study smarter</h2>
              <p className="mt-3 text-gray-600 dark:text-gray-300">One focused place for learning, practice and motivation.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{f.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-12">How Swybe works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B73E8] to-[#9B51E0] text-white font-extrabold flex items-center justify-center mb-4">{s.n}</div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EDUCATORS */}
        <section id="educators" className="bg-gradient-to-r from-[#5B73E8] to-[#9B51E0] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold bg-white/20 px-3 py-1.5 rounded-full mb-4"><GraduationCap className="w-4 h-4" /> For educators</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Teach students where they already are</h2>
              <p className="mt-4 text-white/90 max-w-lg">
                Apply as a Master, get reviewed by our team, and share reels, posts and quizzes with students who are actively preparing. Track your views, likes and followers from your Creator Studio.
              </p>
              <Link href="/auth" className="inline-block mt-7 bg-white text-[#5B73E8] font-bold px-7 py-3.5 rounded-full hover:bg-gray-100 transition">
                Apply as an educator
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Video, label: "Reels, posts and quizzes" },
                { icon: BarChart3, label: "Creator analytics" },
                { icon: Users, label: "Followers who learn" },
                { icon: Trophy, label: "Reviewed educators only" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-2xl bg-white/15 backdrop-blur-sm p-5">
                  <Icon className="w-6 h-6 mb-3" />
                  <p className="font-semibold text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TRUST */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 md:p-10 flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-2">Built for students, with care</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base leading-relaxed">
                No ads and we never sell your data. Educators are reviewed by our team before they can post. Our{" "}
                <Link href="/guidelines" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Community Guidelines</Link>{" "}
                keep Swybe respectful, and you can read exactly what we collect in our{" "}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 md:pb-20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-8">Frequently asked questions</h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
                <summary className="cursor-pointer font-semibold list-none flex justify-between items-center gap-4">
                  {item.q}
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="rounded-3xl bg-black dark:bg-zinc-900 text-white p-10 md:p-14 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Ready to make your screen time count?</h2>
            <p className="mt-3 text-gray-300">Join Swybe today. It takes less than a minute.</p>
            <Link href="/auth" className="inline-block mt-7 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-full transition">
              Get started free
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}