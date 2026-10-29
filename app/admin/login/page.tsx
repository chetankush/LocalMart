"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { apiClient } from "@/lib/api/client";
import { Shield, Mail, Lock, ArrowLeft, AlertCircle } from "lucide-react";
import { Button, Notice } from "@/components/app/ui";
import { Field, inputClass } from "@/components/app/form";

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        setError(signInError.message || "Wrong email or password.");
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Failed to sign in");
        setLoading(false);
        return;
      }

      // Check if user is admin via NestJS backend
      const result = await apiClient.checkAdminAuth();

      if (!result.isAdmin) {
        // Sign out if not admin
        await supabase.auth.signOut();
        setError("This account is not an admin account.");
        setLoading(false);
        return;
      }

      // Store admin auth flag for session
      localStorage.setItem("adminAuth", "true");

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err: any) {
      console.error("Admin login error:", err);
      setError(err.message || "Failed to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-3xl bg-card p-6 sm:p-8">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-tint text-white">
          <Shield className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-label">LocalMart admin</h1>
        <p className="mt-1 text-[15px] text-label-2">Sign in with your admin account.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <Field label="Email" htmlFor="admin-email">
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className={`${inputClass} pl-12`}
                placeholder="you@localmart.in"
              />
            </div>
          </Field>

          <Field label="Password" htmlFor="admin-password">
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className={`${inputClass} pl-12`}
                placeholder="Your password"
              />
            </div>
          </Field>

          {error && (
            <Notice tone="bad" icon={<AlertCircle className="h-5 w-5 text-bad" aria-hidden />}>
              {error}
            </Notice>
          )}

          <Button type="submit" full loading={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      <Link
        href="/"
        className="mx-auto mt-6 inline-flex min-h-[44px] items-center gap-1 text-[15px] font-medium text-label-2 hover:text-label"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to LocalMart
      </Link>
    </div>
  );
}
