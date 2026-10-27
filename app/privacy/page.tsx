import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Section, P, Ul } from "@/components/LegalPage";
import { SITE } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How Swybe, created by ${SITE.company}, collects, uses and protects your information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          Swybe is a learning platform created and operated by <strong>{SITE.company}</strong>. This Privacy Policy explains what information we collect when you use Swybe at {SITE.url.replace(/^https?:\/\//, "")}, how we use and protect it, and the choices you have. Please read it together with our{" "}
          <Link href="/terms" className="text-blue-600 dark:text-blue-400 underline">Terms of Use</Link> and{" "}
          <Link href="/guidelines" className="text-blue-600 dark:text-blue-400 underline">Community Guidelines</Link>.
        </p>
      }
    >
      <Section id="who" title="1. Who we are">
        <P>
          Swybe is created by {SITE.company}. In this policy, “Swybe”, “we”, “us” and “our” mean {SITE.company}, acting through the Swybe website and app. You can contact us at{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-blue-600 dark:text-blue-400 underline">{SITE.contactEmail}</a>.
        </P>
      </Section>

      <Section id="collect" title="2. Information we collect">
        <P><strong>Account information.</strong></P>
        <Ul
          items={[
            "Your name, email address and profile photo (for example, when you sign in with Google).",
            "If you sign up with email, your password is handled by Firebase Authentication. We never see or store your password.",
            "If you use Guest mode, we create an anonymous account with no email address.",
          ]}
        />
        <P><strong>Profile information you choose to give.</strong></P>
        <Ul
          items={[
            "Bio, Instagram handle and WhatsApp number (optional). If you add them, they appear on your public profile.",
            "Learning details such as class, medium, stream, target exams, subjects, strong and weak subjects, goals and hobbies.",
            "If you apply as an educator (Master): your handle, subject expertise, teaching experience and short bio.",
          ]}
        />
        <P><strong>Content you create.</strong> Posts, reels, stories, quizzes, comments, replies, saved folders and the photos or videos you upload.</P>
        <P><strong>Activity inside Swybe.</strong> Likes, follows, quiz answers and results, XP, streaks, badges, the time you spend watching content by subject, post and profile views, notifications, and the time you were last active.</P>
        <P><strong>Reports and safety.</strong> If you report a post, comment or profile, we store your report (what you reported, the reason you chose, any note you wrote and your account) so our team can review it. We also keep a record of the action we take.</P>
        <P><strong>Technical information.</strong> Our hosting and security providers may log your IP address, device and browser type and basic request details to keep Swybe running and secure. We use browser storage (such as local storage) to keep you signed in and remember your theme. We do not use advertising cookies.</P>
        <P>We do not collect your precise location, government ID numbers or financial information.</P>
      </Section>

      <Section id="use" title="3. How we use your information">
        <Ul
          items={[
            "To create your account and run Swybe, including your feed, reels, quizzes, saved folders and notifications.",
            "To personalise what you see using the class, exams and subjects you chose.",
            "To calculate XP, streaks, badges and the leaderboard, and to keep them fair.",
            "To review educator applications and let approved educators publish content.",
            "To keep Swybe safe: preventing spam, cheating and abuse, reviewing reports, and enforcing our Terms and Community Guidelines.",
            "To understand how Swybe is used (for example, how many people visit and how fast pages load) so we can fix problems and improve it.",
            "To comply with the law and respond to valid legal requests.",
          ]}
        />
        <P>We do not sell your personal information. Swybe does not currently show third-party advertising, and we do not use your information for ad profiling.</P>
      </Section>

      <Section id="public" title="4. What other people can see">
        <Ul
          items={[
            "Public: your name, profile photo, bio, optional Instagram handle and WhatsApp number, follower and following counts, and the posts, reels, stories and comments you publish.",
            "Public on the leaderboard: your name, photo, XP, streak and badges, if you are a learner with a completed profile and some XP.",
            "Private: your email address, notifications, saved folders, quiz answers and watch history are not shown to other users. Reports you send are not shown to the person you reported.",
          ]}
        />
        <P>Anything you post publicly can be seen by other users. Please do not share sensitive personal details such as your home address, school ID or phone number in posts, comments or your bio.</P>
      </Section>

      <Section id="share" title="5. Who we share information with">
        <P>We use trusted service providers to run Swybe. They process information only to provide their service to us:</P>
        <Ul
          items={[
            "Google Firebase: sign-in and authentication.",
            "MongoDB Atlas: database where your account and activity data is stored.",
            "Cloudinary: storage and delivery of photos and videos you upload.",
            "Vercel: hosting of the Swybe website and servers, and privacy-friendly website analytics (page visits and performance, without advertising cookies).",
          ]}
        />
        <P>These providers may process data on servers located outside India. We may also disclose information if the law requires it, to protect the safety of our users, or in connection with a business change such as a merger or transfer of Swybe. We do not sell or rent your personal information.</P>
      </Section>

      <Section id="students" title="6. Students and users under 18">
        <P>Swybe is built for school students, so many of our users are under 18. If you are under 18, please use Swybe with the knowledge and permission of a parent or guardian.</P>
        <Ul
          items={[
            "We do not show third-party ads and we do not sell information about any user, including children.",
            "We use activity data such as XP, streaks, interests and watch time only to run features inside Swybe.",
            "Parents and guardians can contact us to ask about, correct or delete their child’s information.",
          ]}
        />
        <P>If you believe a child has given us information in a way that you are not comfortable with, write to us and we will look into it promptly.</P>
      </Section>

      <Section id="retention" title="7. How long we keep information and how to delete it">
        <P>We keep your information while your account is active.</P>
        <P>
          <strong>You can delete your account yourself:</strong> open your Profile, tap Edit Profile and choose Delete account. You can also email us and ask us to do it. When an account is deleted, we remove the profile and the content and activity linked to it, such as posts, comments, likes, saved folders and follows, and the reports you sent. We also ask our media provider to delete the photos and videos you uploaded, including your profile photo.
        </P>
        <P>Some copies may remain for a limited time in backups and logs. We may keep limited records, such as reports and moderation actions about content, for as long as needed for safety, to deal with abuse or disputes, or where the law requires it.</P>
      </Section>

      <Section id="security" title="8. Security">
        <P>We use industry-standard measures such as encrypted connections (HTTPS), token-based sign-in, access checks and rate limits on our servers. No online service can be completely secure, so please keep your password safe and tell us at once if you think your account has been misused.</P>
      </Section>

      <Section id="rights" title="9. Your choices and rights">
        <Ul
          items={[
            "Access and correct: you can view and edit most of your information from your profile.",
            "Delete: you can delete your account yourself from Edit Profile, or ask us to do it.",
            "Withdraw consent: you can stop using Swybe at any time. You can also remove optional details such as your Instagram handle and WhatsApp number.",
            "Questions or complaints: contact us using the details below. We will reply within a reasonable time.",
          ]}
        />
        <P>Depending on where you live, you may have additional rights under applicable law, including India’s Digital Personal Data Protection Act, 2023. To use any of these rights, email us.</P>
      </Section>

      <Section id="links" title="10. Links to other websites">
        <P>Swybe may link to other websites, for example study resources, Instagram or WhatsApp. We do not control those websites and are not responsible for their privacy practices.</P>
      </Section>

      <Section id="changes" title="11. Changes to this policy">
        <P>We may update this policy from time to time. We will change the “Last updated” date above, and if a change is important we will let you know in the app.</P>
      </Section>

      <Section id="contact" title="12. Contact us">
        <P>
          {SITE.company}<br />
          Email:{" "}
          <a href={`mailto:${SITE.contactEmail}`} className="text-blue-600 dark:text-blue-400 underline">{SITE.contactEmail}</a><br />
          {SITE.grievanceOfficer}
        </P>
        <P>Swybe is created by {SITE.company}.</P>
      </Section>
    </LegalPage>
  );
}