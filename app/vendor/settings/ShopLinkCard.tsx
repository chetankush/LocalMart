"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Copy, Link2, Loader2, QrCode } from "lucide-react";
import { inputClass } from "@/components/app/form";
import { WhatsAppIcon } from "@/components/contact/WhatsAppIcon";
import { apiError } from "@/components/ads/adLabels";

/** "localmart.in" — the site's own address, without https:// */
export function siteHost() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return typeof window !== "undefined" ? window.location.host : "localmart.in";
}

/**
 * The shop's short link (localmart.in/radhe-saree) for an Instagram bio,
 * visiting card or WhatsApp status: copy, share, or change it.
 */
export default function ShopLinkCard({ storeId }: { storeId: string }) {
  const q = `?storeId=${encodeURIComponent(storeId)}`;
  const [handle, setHandle] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [check, setCheck] = useState<{ available: boolean; problem: string | null } | null>(null);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const r = await apiClient.get<{ data: { handle: string | null; suggestion: string | null } }>(`/vendor/shop-link${q}`);
        setHandle(r.data.handle);
        setDraft(r.data.handle ?? r.data.suggestion ?? "");
        if (!r.data.handle) setEditing(true);
      } catch {
        // Card stays hidden
      } finally {
        setLoaded(true);
      }
    });
  }, [q]);

  // Live check while typing (after a short pause)
  useEffect(() => {
    if (!editing) return;
    const h = draft.trim().toLowerCase();
    if (!h || h === handle) {
      setCheck(null);
      return;
    }
    setChecking(true);
    const t = setTimeout(async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const r = await apiClient.get<{ data: { available: boolean; problem: string | null } }>(
          `/vendor/shop-link/check${q}&handle=${encodeURIComponent(h)}`,
        );
        setCheck(r.data);
      } catch {
        setCheck(null);
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draft, editing, handle, q]);

  if (!loaded) return null;

  const link = handle ? `${siteHost()}/${handle}` : null;
  const fullLink = link ? `https://${link}` : null;

  const save = async () => {
    const h = draft.trim().toLowerCase();
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.patch<{ data: { handle: string } }>(`/vendor/shop-link${q}`, { handle: h });
      setHandle(r.data.handle);
      setEditing(false);
      setCheck(null);
      toast.success("Your shop link is ready");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save the link. Try another one.");
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!fullLink) return;
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — press and hold the link to copy it");
    }
  };

  const canSave = !!draft.trim() && draft.trim().toLowerCase() !== handle && check?.available === true && !checking;

  return (
    <section className="mb-6 rounded-2xl bg-card p-4" aria-label="Your shop link">
      <p className="flex items-center gap-2 text-[17px] font-semibold text-label">
        <Link2 className="h-5 w-5 text-tint" aria-hidden /> Your shop link
      </p>
      <p className="mt-0.5 text-[14px] text-label-2">Put it in your Instagram bio, visiting card and WhatsApp status · दुकान का लिंक</p>

      {!editing && link && (
        <>
          <p className="mt-3 break-all rounded-xl bg-fill px-3 py-3 text-[17px] font-semibold text-label">{link}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copy}
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover cursor-pointer"
            >
              {copied ? <Check className="h-5 w-5" aria-hidden /> : <Copy className="h-5 w-5" aria-hidden />}
              {copied ? "Copied" : "Copy link"}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`See my shop on LocalMart: ${fullLink}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[16px] font-semibold text-label"
            >
              <WhatsAppIcon className="h-5 w-5" /> Share
            </a>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-2 min-h-[44px] w-full rounded-full text-[15px] font-medium text-tint hover:bg-tint-soft cursor-pointer"
          >
            Change link
          </button>
          <Link
            href={`/vendor/share-kit${q}`}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-tint hover:bg-tint-soft"
          >
            <QrCode className="h-5 w-5" aria-hidden /> Posters & share images · पोस्टर
          </Link>
        </>
      )}

      {editing && (
        <div className="mt-3">
          <label htmlFor="shop-handle" className="mb-1.5 block text-[15px] font-medium text-label">
            {siteHost()}/
          </label>
          <input
            id="shop-handle"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-{2,}/g, "-").slice(0, 30))}
            className={inputClass}
            placeholder="radhe-saree"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-describedby="shop-handle-help"
          />
          <p id="shop-handle-help" className="mt-1.5 min-h-[20px] text-[14px]" role="status">
            {checking ? (
              <span className="inline-flex items-center gap-1 text-label-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking…
              </span>
            ) : check?.available ? (
              <span className="text-ok">Free — it&apos;s yours if you save</span>
            ) : check?.problem ? (
              <span className="text-bad">{check.problem}</span>
            ) : (
              <span className="text-label-2">Small letters, numbers and dashes — like your shop name</span>
            )}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!canSave || saving}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-50 cursor-pointer"
            >
              {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
              {handle ? "Save new link" : "Get my link"}
            </button>
            {handle && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setDraft(handle);
                  setCheck(null);
                }}
                className="h-12 rounded-full border border-label/20 px-5 text-[16px] font-semibold text-label cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          {handle && <p className="mt-2 text-[13px] text-label-3">The old link stops working once you change it.</p>}
        </div>
      )}
    </section>
  );
}
