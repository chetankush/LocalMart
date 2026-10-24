/**
 * Where to send someone after they sign in. Only paths on this site are
 * allowed ("/stores/abc/write-review"), so a crafted link can't bounce a
 * shopper to another website after login.
 */
export function safeReturnPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (/[\u0000-\u001f]/.test(path)) return fallback;
  // Don't loop back into the sign-in screens themselves
  if (/^\/(sign-in|sign-up|phone-signin|login|signin|auth)(\/|\?|$)/.test(path)) return fallback;
  return path;
}

/** "/sign-in?redirect=…" for the page someone is on now */
export function signInHref(returnTo: string): string {
  return `/sign-in?redirect=${encodeURIComponent(returnTo)}`;
}
