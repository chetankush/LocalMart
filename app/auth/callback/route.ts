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
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Back to where the shopper started (only paths on this site)
  const next = safeReturnPath(requestUrl.searchParams.get("next"));
  return NextResponse.redirect(`${origin}${next}`);
}
