import { ImageResponse } from "next/og";

// Browser tab ka icon aur app icon. Code se banta hai, koi image file nahi chahiye.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #5B73E8 0%, #9B51E0 100%)",
          color: "#ffffff",
          fontSize: 320,
          fontWeight: 800,
          borderRadius: 112,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}