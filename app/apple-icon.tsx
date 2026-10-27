import { ImageResponse } from "next/og";

// iPhone ki home screen par "Add to Home Screen" ka icon
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 112,
          fontWeight: 800,
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}