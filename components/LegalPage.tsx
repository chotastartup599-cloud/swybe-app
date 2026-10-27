import { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { SITE } from "@/lib/siteConfig";

// Privacy / Terms / Guidelines ka common layout
export default function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-black dark:text-white flex flex-col">
      <SiteHeader variant="legal" />

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h1>
        <p className="text-sm text-gray-500 mt-2">Last updated: {SITE.legalUpdated}</p>
        {intro && <div className="mt-5 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{intro}</div>}
        <div className="mt-8 flex flex-col gap-8">{children}</div>
      </main>

      <SiteFooter />
    </div>
  );
}

export function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id}>
      <h2 className="text-xl font-bold mb-3">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-gray-700 dark:text-gray-300">{children}</div>
    </section>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p>{children}</p>;
}

export function Ul({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}