/**
 * Auth Callback Route
 * Handles OAuth redirects from Supabase
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { safeReturnPath } from "@/lib/auth/returnTo";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Redirect to the site's own address (NEXT_PUBLIC_APP_URL), not whatever host the request claims:
  // behind a proxy or in dev the request's origin can differ, and the new login cookie would not follow.
  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || requestUrl.origin;

  // Back to where the shopper started (only paths on this site)
  const next = safeReturnPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // A password-reset link that did not work (old, already used, or opened in another
    // browser): say so on the page that asks for a new one, not on a form that can't save.
    if (error && next.startsWith("/reset-password")) {
      return NextResponse.redirect(`${origin}/forgot-password?error=expired`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
