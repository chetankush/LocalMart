"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * "Forgot password": the person gives their email and gets a link. The link
 * opens /auth/callback, which signs them in for a moment and sends them to
 * /reset-password to choose a new one. We say the same thing whether or not
 * an account exists, so nobody can use this to find out who is on LocalMart.
 */
function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const expired = params.get("error") === "expired";

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim();
    if (!address) return;
    setLoading(true);
    setError("");
    const { error: err } = await createClient().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    if (err) {
      setError(
        /rate|seconds|limit|too many/i.test(err.message)
          ? "Please wait a minute before asking again."
          : "Couldn't send the email. Check your internet and try again.",
      );
      return;
    }
    setSentTo(address);
  };

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgba(16,24,40,0.06)] sm:p-8">
        {sentTo ? (
          <div role="status">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ok-soft text-ok">
              <MailCheck className="h-7 w-7" aria-hidden />
            </span>
            <h1 className="mt-4 text-[26px] font-bold leading-tight text-label">Check your email</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-label-2">
              If there is an account for <span className="font-semibold text-label">{sentTo}</span>, we have sent a link to choose a new
              password. It can take a minute. Look in spam too.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-label-3">
              Open the link on this phone or computer, in the same browser you used just now.
            </p>
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="mt-5 cursor-pointer text-[15px] font-semibold text-tint hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-[26px] font-bold leading-tight text-label">Forgot your password?</h1>
            <p className="mt-1 text-[15px] text-label-2">Give your email and we will send you a link to choose a new one.</p>

            {expired && (
              <p role="alert" className="mt-4 rounded-xl bg-warn-soft px-3 py-2.5 text-[14px] font-medium text-label">
                That link did not work or has expired. Ask for a new one below.
              </p>
            )}

            <form onSubmit={send} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[14px] font-semibold text-label">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-fill px-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
                  placeholder="you@example.com"
                />
              </label>

              {error && (
                <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2.5 text-[14px] font-medium text-bad">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
                {loading ? "Sending…" : "Send me the link"}
              </button>
            </form>

            <p className="mt-5 text-[14px] leading-relaxed text-label-3">
              Signed up with Google? There is no password to reset: use “Continue with Google” on the sign-in page. Signed in with a mobile
              number and OTP? That needs no password either.
            </p>
          </>
        )}

        <p className="mt-6 text-center text-[15px] text-label-2">
          <Link href="/sign-in" className="font-semibold text-tint hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the App Router
export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[calc(100dvh-120px)] bg-canvas" />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
