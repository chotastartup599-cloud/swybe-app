import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Section, P, Ul } from "@/components/LegalPage";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The rules for using Swybe, created by ${SITE.company}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro={
        <p>
          Welcome to Swybe, created and operated by <strong>{SITE.company}</strong>. By creating an account, using Guest mode or otherwise using Swybe, you agree to these Terms, our{" "}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-400 underline">Privacy Policy</Link> and our{" "}
          <Link href="/guidelines" className="text-blue-600 dark:text-blue-400 underline">Community Guidelines</Link>. If you do not agree, please do not use Swybe.
        </p>
      }
    >
      <Section id="about" title="1. About Swybe">
        <P>Swybe is an educational platform with short learning content, quizzes, streaks, a leaderboard and a student community. Swybe is created by {SITE.company}. We may add, change or remove features, including features that are marked “coming soon”.</P>
      </Section>

      <Section id="eligibility" title="2. Who can use Swybe and your account">
        <Ul
          items={[
            "Swybe is meant for students and learners. If you are under 18, you must use Swybe with the knowledge and permission of a parent or guardian.",
            "To apply as an educator (Master) you must be 18 or older.",
            "Give accurate information and keep your sign-in details safe. You are responsible for activity on your account.",
            "Guest mode has limits. Guests cannot comment, follow, post stories or earn XP.",
            "Do not create accounts to cheat, spam or evade a suspension.",
          ]}
        />
      </Section>

      <Section id="content" title="3. Your content">
        <P>You own the content you post. By posting on Swybe you give {SITE.company} a worldwide, non-exclusive, royalty-free licence to host, store, display, reproduce and distribute that content within Swybe so that we can run the service. This licence ends when you delete the content or your account, except for copies that remain in backups for a limited time or that others have already shared within Swybe.</P>
        <P>You promise that you have the right to post your content and that it does not break the law or anyone’s rights. Do not post material that belongs to someone else, such as copied coaching notes, paid course videos or leaked question papers.</P>
      </Section>

      <Section id="educators" title="4. Educators (Masters)">
        <Ul
          items={[
            "Educator access is given only after our team reviews your application. We may approve, reject or withdraw access at any time.",
            "You are responsible for the accuracy and quality of what you teach. Educators are not employees or agents of " + SITE.company + ".",
            "Swybe does not currently process payments between students and educators.",
          ]}
        />
      </Section>

      <Section id="xp" title="5. XP, streaks, badges and the leaderboard">
        <P>XP, streaks and badges are for fun and motivation. They have no cash value and cannot be exchanged for money. We may change how they work, and we may adjust or remove XP and rankings that were gained through cheating, automation or by exploiting bugs.</P>
      </Section>

      <Section id="rules" title="6. What you must not do">
        <Ul
          items={[
            "Break any law or post illegal content.",
            "Harass, bully, threaten or hate on others, or share sexual or violent content.",
            "Share personal information of others, or impersonate any person or organisation.",
            "Post spam, scams, fake giveaways or misleading information.",
            "Try to hack, overload or bypass the security of Swybe, or use bots or scrapers to collect data.",
            "Upload viruses or harmful code, or misuse Swybe in any way that harms users or us.",
          ]}
        />
        <P>Our <Link href="/guidelines" className="text-blue-600 dark:text-blue-400 underline">Community Guidelines</Link> explain these rules in more detail.</P>
      </Section>

      <Section id="moderation" title="7. Moderation and enforcement">
        <P>We may remove content, limit features, suspend or delete accounts if we believe these Terms or the Community Guidelines are broken, or to protect users and Swybe. Where possible we will tell you why. If you think we made a mistake, write to us and we will review it.</P>
      </Section>

      <Section id="third" title="8. Third-party services and links">
        <P>Swybe uses services from others, such as Google sign-in, and may link to other websites. Their own terms and privacy policies apply to them, and we are not responsible for them.</P>
      </Section>

      <Section id="education" title="9. Educational content disclaimer">
        <P>Most content on Swybe is created by other users and educators. We do not guarantee that it is complete, correct or suitable for your needs. Swybe is a learning aid and not a replacement for your teachers, textbooks or official exam sources. We do not guarantee any exam result or score.</P>
      </Section>

      <Section id="availability" title="10. Availability">
        <P>We work to keep Swybe available, but it may sometimes be unavailable or contain errors. Swybe is provided “as is” and “as available”.</P>
      </Section>

      <Section id="liability" title="11. Limit of liability">
        <P>To the extent the law allows, {SITE.company} is not liable for indirect or consequential losses, or for loss of data, profits or opportunity arising from your use of Swybe. Nothing in these Terms limits any liability that cannot legally be limited.</P>
      </Section>

      <Section id="termination" title="12. Ending your use">
        <P>You can stop using Swybe or delete your account at any time. We may suspend or end access as explained in section 7. Sections that by their nature should continue after that (such as content licences, disclaimers and limits of liability) will continue to apply.</P>
      </Section>

      <Section id="law" title="13. Governing law">
        <P>These Terms are governed by the laws of India.</P>
      </Section>

      <Section id="changes" title="14. Changes to these Terms">
        <P>We may update these Terms from time to time. We will change the “Last updated” date above, and if a change is important we will let you know in the app. If you keep using Swybe after a change, you accept the updated Terms.</P>
      </Section>

      <Section id="contact" title="15. Contact us">
        <P>
          {SITE.company}<br />
          Email:{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-blue-600 dark:text-blue-400 underline">{SITE.contactEmail}</a>
        </P>
        <P>Swybe is created by {SITE.company}.</P>
      </Section>
    </LegalPage>
  );
}