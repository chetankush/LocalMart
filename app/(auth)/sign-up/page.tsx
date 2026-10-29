"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { safeReturnPath, signInHref } from "@/lib/auth/returnTo";

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Where they were going before we asked them to sign in
  const returnTo = safeReturnPath(params.get("redirect") ?? params.get("next"));
  const signInLink = returnTo === "/" ? "/sign-in" : signInHref(returnTo);
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const { error: signUpError, signedIn } = await signUpWithEmail(
      email,
      password,
      fullName
    );

    if (signUpError) {
      setError(
        /already registered/i.test(signUpError.message)
          ? "This email already has an account. Please sign in instead."
          : signUpError.message
      );
      setLoading(false);
    } else if (signedIn) {
      // No email confirmation needed — continue where they were going
      router.replace(returnTo);
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
      // Note: Supabase sends email verification by default
      // User needs to verify email before signing in
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError("");
    await signInWithGoogle(returnTo);
  };

  // Say why we're asking, in the shopper's terms
  const why = returnTo.startsWith("/checkout")
    ? "Create an account to place your order. Your cart is saved."
    : returnTo.startsWith("/become-vendor")
      ? "Create an account to open your shop on LocalMart."
      : /\/write-review/.test(returnTo)
        ? "Create an account to write your review."
        : "It takes less than a minute.";

  if (success) {
    return (
      <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-canvas px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-card p-6 text-center shadow-[0_8px_30px_rgba(16,24,40,0.06)] sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-ok-soft text-ok">
            <MailCheck className="h-7 w-7" aria-hidden />
          </span>
          <h1 className="mt-4 text-[24px] font-bold leading-tight text-label">Check your email</h1>
          <p className="mt-2 text-[16px] text-label-2">
            We sent a link to <span className="font-semibold text-label">{email}</span>. Tap it to confirm your account,
            then sign in.
          </p>
          <Link
            href={signInLink}
            className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgba(16,24,40,0.06)] sm:p-8">
        <h1 className="text-[26px] font-bold leading-tight text-label">Create your account</h1>
        <p className="mt-1 text-[15px] text-label-2">{why}</p>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label hover:border-label/40 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-[13px] text-label-3" aria-hidden>
          <span className="h-px flex-1 bg-hairline" /> or with email <span className="h-px flex-1 bg-hairline" />
        </div>

        <form onSubmit={handleEmailSignUp} className="space-y-4">
          <label className="block">
            <span className="text-[14px] font-semibold text-label">Your name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-fill px-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
              placeholder="e.g. Priya Sharma"
            />
          </label>
          <label className="block">
            <span className="text-[14px] font-semibold text-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-fill px-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <label className="block">
            <span className="text-[14px] font-semibold text-label">Make a password</span>
            <span className="relative mt-1.5 block">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-12 w-full rounded-xl border border-hairline bg-fill px-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none pr-12"
                placeholder="At least 6 letters or numbers"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-label-2 hover:bg-fill-strong cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2.5 text-[14px] font-medium text-bad">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-[15px] text-label-2">
          Already have an account?{" "}
          <Link href={signInLink} className="font-semibold text-tint hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary in the App Router
export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <SignUpForm />
    </Suspense>
  );
}
