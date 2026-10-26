export const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "okuevkuf";
export const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "swybe_upload";

// Cloudinary free plan ki limits ke hisaab se
export const MAX_IMAGE_MB = 10;
export const MAX_VIDEO_MB = 100;

// Ek file Cloudinary par upload karke uska URL deta hai. Fail hone par saaf error phenkta hai
// (pehle fail hone par chupchaap skip ho jata tha aur post bina media ke ban jati thi).
export async function uploadToCloudinary(file: File): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const isImage = file.type.startsWith("image/");

  if (!isVideo && !isImage) {
    throw new Error(`"${file.name}" supported nahi hai. Sirf image ya video upload karo.`);
  }

  const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
  if (file.size > maxMb * 1024 * 1024) {
    throw new Error(`"${file.name}" ${maxMb}MB se badi hai.`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${isVideo ? "video" : "image"}/upload`,
      { method: "POST", body: formData }
    );
  } catch {
    throw new Error("Network error: upload nahi hua. Internet check karke dobara try karo.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.secure_url) {
    const reason = data?.error?.message;
    throw new Error(reason ? `Upload fail: ${reason}` : "Upload fail ho gaya. Dobara try karo.");
  }

  return data.secure_url as string;
}