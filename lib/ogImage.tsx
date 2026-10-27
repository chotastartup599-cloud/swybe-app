import { ImageResponse } from "next/og";
import { SITE } from "@/lib/siteConfig";

// WhatsApp / Instagram / Twitter par link share karne par jo bada preview card dikhta hai.
// Ye code se bana hai, isliye alag se koi image file banane ki zarurat nahi.
export function renderOgImage(width: number, height: number) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #5B73E8 0%, #9B51E0 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", fontSize: 128, fontWeight: 800, letterSpacing: "-4px" }}>
          {SITE.name}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.15 }}>
            {`${SITE.tagline}. Zero distractions.`}
          </div>
          <div style={{ display: "flex", fontSize: 34, marginTop: 20, opacity: 0.9 }}>
            {"Short reels  •  Quizzes  •  Streaks  •  Leaderboard"}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 32, fontWeight: 600 }}>
          <div style={{ display: "flex" }}>{`Created by ${SITE.company}`}</div>
          <div style={{ display: "flex", opacity: 0.9 }}>{SITE.url.replace(/^https?:\/\//, "")}</div>
        </div>
      </div>
    ),
    { width, height }
  );
}