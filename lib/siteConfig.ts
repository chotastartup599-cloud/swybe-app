// Site ki saari common details ek hi jagah. Kuch badalna ho (email, naam) to bas yahin badlo.
export const SITE = {
  name: "Swybe",
  tagline: "Learn from toppers & peers",
  description:
    "Swybe is a focused learning app for Class 9-12 students and JEE, NEET, NDA and UPSC aspirants: short educational reels, quizzes, streaks and a distraction-free community. Created by Chota Startup.",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://swybe.ctup.in").replace(/\/$/, ""),
  company: "Chota Startup",
  // TODO: jab dedicated support email ban jaye (jaise support@ctup.in), to sirf yahan badal dena
  contactEmail: "chotastartup599@gmail.com",
  grievanceOfficer: "Grievance Officer, Chota Startup",
  legalUpdated: "26 October 2026",
};