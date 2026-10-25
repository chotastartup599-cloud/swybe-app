import { NextResponse } from "next/server";
import { adminAuth } from "./firebaseAdmin";
import connectDB from "./db";
import User from "@/models/User";

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "chotastartup599@gmail.com").trim().toLowerCase();

// Request se Firebase token verify karke decoded token deta hai (nahi mila to null)
export async function getAuthUser(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];
  if (!token) return null;

  try {
    return await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

function toAuthInfo(decoded) {
  const provider = decoded.firebase?.sign_in_provider || "";
  return {
    uid: decoded.uid,
    email: decoded.email || null,
    emailVerified: decoded.email_verified === true,
    isAnonymous: provider === "anonymous",
    provider,
    decoded,
  };
}

// Login zaroori. allowAnonymous: false matlab guest block.
export async function requireAuth(req, options = {}) {
  const { allowAnonymous = true } = options;
  const decoded = await getAuthUser(req);
  if (!decoded) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }
  const info = toAuthInfo(decoded);
  if (info.isAnonymous && !allowAnonymous) {
    return { error: "Ye kaam karne ke liye guest nahi, real account se login karo.", status: 403 };
  }
  return info;
}

// Sirf admin email, aur email/password wale admin ke liye email verified hona zaroori
export async function requireAdmin(req) {
  const decoded = await getAuthUser(req);
  if (!decoded) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }
  const info = toAuthInfo(decoded);

  if (!info.email || info.email.trim().toLowerCase() !== ADMIN_EMAIL) {
    return { error: "Forbidden. Admins only.", status: 403 };
  }

  const allowUnverified = process.env.ADMIN_ALLOW_UNVERIFIED === "true";
  if (info.provider === "password" && !info.emailVerified && !allowUnverified) {
    return { error: "Admin email verified nahi hai. Google se login karo.", status: 403 };
  }
  return info;
}

// Login + DB user dono chahiye (jaise post banana, comment karna)
export async function requireDbUser(req, options = {}) {
  const auth = await requireAuth(req, options);
  if (auth.error) return auth;

  await connectDB();
  const user = await User.findOne({ firebaseUid: auth.uid });
  if (!user) {
    return { error: "User profile nahi mila. Dobara login karo.", status: 404 };
  }
  return { ...auth, user };
}

// Approved master ya admin hi content (feed/reel/quiz) bana sakta hai
export function isApprovedCreator(user) {
  if (!user) return false;
  if (user.email && user.email.trim().toLowerCase() === ADMIN_EMAIL) return true;
  if (user.role === "admin") return true;
  return user.role === "master" && user.masterStatus === "approved";
}

export function authErrorResponse(auth) {
  return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
}

// Production me asli error client ko nahi jaata, sirf Vercel logs me dikhta hai
export function serverError(error, label = "API") {
  console.error(`${label} error:`, error);
  const message =
    process.env.NODE_ENV === "production" ? "Server error. Please try again." : error.message;
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

// Text saaf karo: type check, trim, max length. multiline true ho to new lines rehti hain.
export function cleanText(value, max = 100, multiline = false) {
  if (typeof value !== "string") return "";
  const text = multiline ? value.trim() : value.replace(/\s+/g, " ").trim();
  return text.slice(0, max);
}

// String array saaf karo: duplicates hatao, limit lagao
export function cleanList(value, maxItems = 30, maxLen = 50) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const item of value) {
    const text = cleanText(item, maxLen);
    if (text && !out.includes(text)) out.push(text);
    if (out.length >= maxItems) break;
  }
  return out;
}