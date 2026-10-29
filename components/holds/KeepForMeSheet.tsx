"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Sheet } from "@/components/app/Sheet";
import { Field, inputClass } from "@/components/app/form";
import { useAuth } from "@/lib/supabase/auth-provider";
import { signInHref } from "@/lib/auth/returnTo";
import { apiError } from "@/components/ads/adLabels";
import type { HoldOptions } from "@/lib/holds";
import { nameWithSize, type Size } from "@/lib/sizes";
import { adThatBrought } from "@/lib/adAttribution";
import { rememberContact, savedContact } from "@/lib/contact";


/**
 * "Keep it for me · मेरे लिए रख दो": the buyer picks a time today, the shop
 * gets a ringing alert and says yes or no within 30 minutes.
 */
export default function KeepForMeSheet({
  open,
  onClose,
  product,
  vendor,
  sizes,
  sizeId: pickedSize,
}: {
  open: boolean;
  onClose: () => void;
  product: { id: string; name: string };
  vendor: { id: string; businessName: string };
  sizes: Size[];
  sizeId: string | null;
}) {
  const { user, loading: authLoading } = useAuth();
  const pathname = usePathname() ?? "/";
  const [options, setOptions] = useState<HoldOptions | null>(null);
  const [hours, setHours] = useState<number | null>(null);
  const [sizeId, setSizeId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ until: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setSent(null);
    setErrors({});
    setNote("");
    setSizeId(pickedSize ?? (sizes.filter((s) => s.isAvailable).length === 1 ? sizes.find((s) => s.isAvailable)!.id : null));
    const saved = savedContact(user?.id);
    setName(saved.name || (user?.user_metadata?.full_name as string) || "");
    setPhone(saved.phone || "");
    setOptions(null);
    let alive = true;
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const r = await apiClient.get<{ data: HoldOptions }>(`/holds/options/${product.id}`);
        if (!alive) return;
        setOptions(r.data);
        setHours(r.data.choices[1]?.hours ?? r.data.choices[0]?.hours ?? null);
      } catch {
        if (alive) setOptions({ shopName: vendor.businessName, choices: [], reason: "Couldn't check the shop's timings. Please try again." });
      }
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const choice = options?.choices.find((c) => c.hours === hours) ?? null;

  const send = async () => {
    const digits = phone.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    const e: Record<string, string> = {};
    if (sizes.length > 0 && !sizeId) e.size = "Pick your size";
    if (!choice) e.time = "Pick a time";
    if (!name.trim()) e.name = "Add your name";
    if (!/^[6-9]\d{9}$/.test(digits)) e.phone = "Add your 10-digit mobile number";
    setErrors(e);
    if (Object.keys(e).length) return;
    setSending(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const adId = adThatBrought(vendor.id);
      const r = await apiClient.post<{ data: { until: string } }>("/holds", {
        items: [{ productId: product.id, ...(sizeId ? { variantId: sizeId } : {}) }],
        hours: choice!.hours,
        name: name.trim(),
        phone: digits,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(adId ? { adId } : {}),
      });
      rememberContact(user?.id, { name: name.trim(), phone: digits });
      setSent({ until: r.data.until });
    } catch (err) {
      setErrors({ form: apiError(err).message || "Couldn't send. Check your internet and try again." });
    } finally {
      setSending(false);
    }
  };

  const size = sizes.find((s) => s.id === sizeId);

  if (sent) {
    return (
      <Sheet
        open={open}
        onClose={onClose}
        title="Request sent"
        footer={
          <div className="flex flex-col gap-2">
            <Link href="/my-holds" className="flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover">
              See my requests
            </Link>
            <button type="button" onClick={onClose} className="h-12 w-full rounded-full border border-hairline bg-card text-[16px] font-semibold text-label cursor-pointer">
              Done
            </button>
          </div>
        }
      >
        <div className="flex flex-col items-center py-4 text-center" role="status">
          <CheckCircle2 className="h-12 w-12 text-ok" aria-hidden />
          <p className="mt-3 text-[17px] font-semibold text-label">{vendor.businessName} got your request</p>
          <p className="mt-1 text-[15px] text-label-2">
            They&apos;ll say yes within 30 minutes — we&apos;ll tell you. Then reach before {choice?.label.replace(/^by /, "") ?? "the time"}.
          </p>
          <p className="mt-1 text-[14px] text-label-3">दुकान 30 मिनट में बताएगी</p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Keep it for me"
      description={`${vendor.businessName} keeps it aside today while you come to see it · मेरे लिए रख दो`}
      footer={
        user ? (
          <button
            type="button"
            onClick={send}
            disabled={sending || !options || options.choices.length === 0}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer"
          >
            {sending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            {sending ? "Sending…" : "Ask the shop to keep it"}
          </button>
        ) : (
          <Link
            href={signInHref(pathname)}
            className="flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
          >
            Sign in to ask the shop
          </Link>
        )
      }
    >
      <div className="space-y-5">
        <p className="rounded-xl bg-fill px-3 py-2.5 text-[15px] text-label">
          {nameWithSize(product.name, size?.label)}
        </p>

        {sizes.length > 0 && (
          <Field label="Your size" error={errors.size}>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={sizeId === s.id}
                  disabled={!s.isAvailable}
                  onClick={() => setSizeId(s.id)}
                  className={`min-h-[44px] min-w-[52px] rounded-xl border px-3 text-[15px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:text-label-3 disabled:line-through ${
                    sizeId === s.id ? "border-tint bg-tint-soft text-tint" : "border-hairline bg-card text-label"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="I'll come" error={errors.time}>
          {!options ? (
            <div className="flex items-center gap-2 text-[15px] text-label-2">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Checking the shop&apos;s timings…
            </div>
          ) : options.choices.length === 0 ? (
            <p className="text-[15px] text-label-2">{options.reason}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Time">
              {options.choices.map((c) => (
                <button
                  key={c.hours}
                  type="button"
                  role="radio"
                  aria-checked={hours === c.hours}
                  onClick={() => setHours(c.hours)}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-2 cursor-pointer ${
                    hours === c.hours ? "border-tint bg-tint-soft text-tint" : "border-hairline bg-card text-label"
                  }`}
                >
                  <span className="flex items-center gap-1 text-[15px] font-semibold">
                    <Clock className="h-4 w-4" aria-hidden /> {c.label}
                  </span>
                  <span className="text-[13px] text-label-2">in {c.hours} hour{c.hours === 1 ? "" : "s"}</span>
                </button>
              ))}
            </div>
          )}
        </Field>

        {user && !authLoading && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Your name" htmlFor="kf-name" error={errors.name}>
                <input id="kf-name" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" maxLength={60} />
              </Field>
              <Field label="Mobile number" htmlFor="kf-phone" error={errors.phone}>
                <input id="kf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} inputMode="tel" autoComplete="tel" placeholder="10-digit number" maxLength={16} />
              </Field>
            </div>
            <Field label="Note for the shop" htmlFor="kf-note" optional>
              <input id="kf-note" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} placeholder="e.g. I'll come with my mother" maxLength={300} />
            </Field>
          </>
        )}

        <p className="text-[14px] leading-snug text-label-3">
          Free. Only for today. If you can&apos;t come, cancel it from “My requests” — shops stop keeping things for people who often don&apos;t turn up.
        </p>
        {errors.form && (
          <p role="alert" className="text-[15px] text-bad">
            {errors.form}
          </p>
        )}
      </div>
    </Sheet>
  );
}
