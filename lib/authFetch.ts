import { auth } from "@/lib/firebase";

let installed = false;

// Browser ke fetch ko ek baar wrap karta hai: har "/api/..." request par
// Firebase ID token apne aap "Authorization: Bearer ..." me laga deta hai.
// (Jis request me Authorization pehle se hai, usse chhedta nahi, jaise admin page.)
export function installAuthFetch() {
  if (typeof window === "undefined" || installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let token: string | null = null;
    let headers: Headers | null = null;

    try {
      let url = "";
      if (typeof input === "string") url = input;
      else if (input instanceof URL) url = input.href;
      else url = input.url;

      const isOwnApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
      const user = auth.currentUser;

      if (isOwnApi && user) {
        headers = new Headers(init?.headers);
        if (!headers.has("Authorization")) {
          token = await user.getIdToken();
        }
      }
    } catch (error) {
      console.error("authFetch token error:", error);
      token = null;
    }

    if (token && headers) {
      headers.set("Authorization", `Bearer ${token}`);
      return originalFetch(input, { ...init, headers });
    }
    return originalFetch(input, init);
  };
}