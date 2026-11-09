"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { createClient } from "@/lib/supabase/client";

const MIN_LENGTH = 6; // same rule as sign-up

/**
 * Choose a new password. Reached from the email link: /auth/callback has
 * already signed the person in with the link's one-time code. With no one
 * signed in (an old or used link), it says so and offers a new link.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) return setError(`Use at least ${MIN_LENGTH} letters or numbers.`);
    if (password !== again) return setError("The two passwords are not the same.");
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) {
      setSaving(false);
      setError(
        /different|same/i.test(err.message)
          ? "Choose a password you have not used before."
          : /weak|short|characters/i.test(err.message)
            ? `Use at least ${MIN_LENGTH} letters or numbers.`
            : "Couldn't change the password. Please ask for a new link and try again.",
      );
      return;
    }
    // Anyone else signed in with the old password is signed out (best effort)
    await supabase.auth.signOut({ scope: "others" }).catch(() => {});
    setSaving(false);
    setDone(true);
  };

  const shell = (children: React.ReactNode) => (
    <div className="flex min-h-[calc(100dvh-120px)] items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-[0_8px_30px_rgba(16,24,40,0.06)] sm:p-8">{children}</div>
    </div>
  );

  if (authLoading) {
    return shell(
      <div className="flex justify-center py-8" role="status" aria-label="Loading">
        <Loader2 className="h-7 w-7 animate-spin text-label-3" aria-hidden />
      </div>,
    );
  }

  if (!user) {
    return shell(
      <>
        <h1 className="text-[26px] font-bold leading-tight text-label">This link has expired</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-label-2">
          Reset links work once, and only for a short time. Ask for a new one and open it in the same browser.
        </p>
        <Link
          href="/forgot-password?error=expired"
          className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
        >
          Get a new link
        </Link>
        <p className="mt-6 text-center text-[15px] text-label-2">
          <Link href="/sign-in" className="font-semibold text-tint hover:underline">
            Back to sign in
          </Link>
        </p>
      </>,
    );
  }

  if (done) {
    return shell(
      <div role="status">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ok-soft text-ok">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="mt-4 text-[26px] font-bold leading-tight text-label">Password changed</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-label-2">You are signed in. Use the new password next time.</p>
        <button
          type="button"
          onClick={async () => {
            // Shop owners go to their dashboard, shoppers home
            let to = "/";
            try {
              const { apiClient } = await import("@/lib/api/client");
              const { data } = await apiClient.checkVendor();
              if (data?.hasVendor && data.stores?.some((s) => s.status === "ACTIVE")) to = "/vendor/dashboard";
            } catch {
              // not a shop owner, or offline: home is fine
            }
            router.replace(to);
            router.refresh();
          }}
          className="mt-6 flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
        >
          Continue
        </button>
      </div>,
    );
  }

  return shell(
    <>
      <h1 className="text-[26px] font-bold leading-tight text-label">Choose a new password</h1>
      <p className="mt-1 text-[15px] text-label-2">
        For <span className="font-semibold text-label">{user.email ?? "your account"}</span>
      </p>

      <form onSubmit={save} className="mt-5 space-y-4">
        <label className="block">
          <span className="text-[14px] font-semibold text-label">New password</span>
          <div className="relative mt-1.5">
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={MIN_LENGTH}
              className="h-12 w-full rounded-xl border border-hairline bg-fill px-4 pr-12 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
              placeholder={`At least ${MIN_LENGTH} letters or numbers`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-label-2 hover:bg-fill"
            >
              {show ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </label>
        <label className="block">
          <span className="text-[14px] font-semibold text-label">Type it again</span>
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={again}
            onChange={(e) => setAgain(e.target.value)}
            required
            className="mt-1.5 h-12 w-full rounded-xl border border-hairline bg-fill px-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
            placeholder="The same password"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-bad-soft px-3 py-2.5 text-[14px] font-medium text-bad">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {saving ? "Saving…" : "Change password"}
        </button>
      </form>
    </>,
  );
}
