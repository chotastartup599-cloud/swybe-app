import { renderOgImage } from "@/lib/ogImage";

export const alt = "Swybe - Learn from toppers & peers. Created by Chota Startup";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderOgImage(size.width, size.height);
}