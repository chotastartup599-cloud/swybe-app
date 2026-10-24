import { adminAuth } from "./firebaseAdmin";

const ADMIN_EMAIL = "chotastartup599@gmail.com";

export async function getAuthUser(req) {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.split("Bearer ")[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
}

export async function requireAuth(req) {
  const decoded = await getAuthUser(req);
  if (!decoded) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }
  return { uid: decoded.uid, email: decoded.email };
}

export async function requireAdmin(req) {
  const decoded = await getAuthUser(req);
  if (!decoded) {
    return { error: "Unauthorized. Please log in.", status: 401 };
  }
  if (decoded.email?.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return { error: "Forbidden. Admins only.", status: 403 };
  }
  return { uid: decoded.uid, email: decoded.email };
}