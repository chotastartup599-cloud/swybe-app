import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Section, P, Ul } from "@/components/LegalPage";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: `How to keep Swybe a safe and focused place to learn. Swybe is created by ${SITE.company}.`,
  alternates: { canonical: "/guidelines" },
};

export default function GuidelinesPage() {
  return (
    <LegalPage
      title="Community Guidelines"
      intro={
        <p>
          Swybe is a place for students to learn together, and many of our members are school students. These guidelines help keep it respectful, safe and focused. They apply to everything you post, comment and share. Swybe is created by {SITE.company}.
        </p>
      }
    >
      <Section id="do" title="What we love to see">
        <Ul
          items={[
            "Helpful, accurate learning content: concepts, tricks, notes, quizzes and exam tips.",
            "Respectful discussion, even when you disagree.",
            "Giving credit when you share someone else’s idea or work.",
            "Encouraging other learners.",
          ]}
        />
      </Section>

      <Section id="dont" title="What is not allowed">
        <Ul
          items={[
            "Bullying, harassment, threats or hate towards any person or group.",
            "Sexual, violent, graphic or otherwise unsafe content. This is a space for students.",
            "Sharing anyone’s private information, or asking children for personal details, photos or private chats.",
            "Content that promotes self-harm, drugs, gambling or dangerous challenges.",
            "Cheating help: leaked papers, exam answers shared during exams, or paid content copied without permission.",
            "Spam, scams, fake giveaways, or advertising that is not related to learning.",
            "Impersonating other people, teachers or organisations.",
            "Fake or misleading educational information shared on purpose.",
            "Cheating the system, for example bots, multiple accounts or exploiting bugs to gain XP.",
          ]}
        />
      </Section>

      <Section id="report" title="Reporting a problem">
        <P>If you see something that breaks these guidelines, use the Report option on a post, comment or profile, or email us at{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-blue-600 dark:text-blue-400 underline">{SITE.contactEmail}</a>. Please include a link or a short description so we can find it quickly.
        </P>
      </Section>

      <Section id="enforcement" title="What happens if the rules are broken">
        <P>Depending on how serious it is, we may remove content, take away features, remove XP gained unfairly, or suspend or delete an account. You can find more in our{" "}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 underline">Terms of Use</Link>.
        </P>
      </Section>

      <Section id="help" title="If you need help">
        <P>If you or someone you know is in danger or feeling overwhelmed, please talk to a parent, teacher or another trusted adult. In an emergency in India, call 112. For mental health support in India you can also call Tele-MANAS at 14416.</P>
      </Section>
    </LegalPage>
  );
}