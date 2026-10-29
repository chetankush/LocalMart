"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Clock, Loader2, ShieldCheck, X } from "lucide-react";
import { Button, Notice } from "@/components/app/ui";
import { Field, inputClass } from "@/components/app/form";
import { apiError } from "@/components/ads/adLabels";
import { useConfirm } from "@/hooks/useConfirm";
import { HANDLOOM_TYPES, type HandloomProofView, type HandloomType } from "@/lib/handloom";
import { refreshShopPage } from "@/lib/refreshShopPage";

const MAX_PROOF = 4;

/**
 * "Real handloom?" on the seller's item page: pick the weave, add photos of
 * the proof (Handloom Mark, Silk Mark, GI label, the weaver's bill, the loom)
 * and send it. LocalMart checks; buyers then see "Verified Chanderi handloom".
 */
export default function HandloomProofCard({ productId, vendorId }: { productId: string; vendorId?: string }) {
  const confirm = useConfirm();
  const [view, setView] = useState<HandloomProofView | null>(null);
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<HandloomType | "">("");
  const [images, setImages] = useState<string[]>([]);
  const [weaverName, setWeaverName] = useState("");
  const [weaverPlace, setWeaverPlace] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fill = (v: HandloomProofView) => {
    setView(v);
    setType(v.type ?? "");
    setImages(v.images);
    setWeaverName(v.weaverName ?? "");
    setWeaverPlace(v.weaverPlace ?? "");
  };

  useEffect(() => {
    import("@/lib/api/client").then(async ({ apiClient }) => {
      try {
        const r = await apiClient.get<{ data: HandloomProofView }>(`/vendor/products/${productId}/handloom`);
        fill(r.data);
      } catch {
        // Card stays hidden
      }
    });
  }, [productId]);

  if (!view || view.forThisShop === false) return null;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > MAX_PROOF) return toast.error(`Up to ${MAX_PROOF} proof photos`);
    setUploading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const urls = await Promise.all(
        Array.from(files).map(async (f) => {
          if (!f.type.startsWith("image/")) throw new Error("Please pick a photo (JPG or PNG)");
          if (f.size > 5 * 1024 * 1024) throw new Error("Each photo must be smaller than 5 MB");
          const r = await apiClient.vendorUpload(f, "products");
          return r.url;
        }),
      );
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      toast.error((err as Error).message || "Couldn't upload the photo. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const send = async () => {
    if (!type) return toast.error("Pick which weave it is");
    if (images.length === 0) return toast.error("Add at least one photo of the proof");
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.put<{ data: HandloomProofView }>(`/vendor/products/${productId}/handloom`, {
        type,
        images,
        weaverName: weaverName.trim() || undefined,
        weaverPlace: weaverPlace.trim() || undefined,
      });
      fill(r.data);
      setEditing(false);
      toast.success("Sent — LocalMart will check it soon");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't send. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    const ok = await confirm({
      title: "Remove the handloom claim?",
      description: "The badge comes off this item. You can send proof again later.",
      confirmLabel: "Remove",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.delete<{ data: HandloomProofView }>(`/vendor/products/${productId}/handloom`);
      fill(r.data);
      setEditing(false);
      void refreshShopPage(vendorId, productId);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't remove it. Please try again.");
    }
  };

  const showForm = editing || view.status === "NONE";

  return (
    // Bottom margin: clear of the page's sticky Save bar
    <section id="handloom" className="mb-28 mt-6 scroll-mt-20 rounded-2xl bg-card p-4 sm:p-5" aria-labelledby="handloom-title">
      <h2 id="handloom-title" className="flex items-center gap-2 text-[17px] font-semibold text-label">
        <ShieldCheck className="h-5 w-5 text-ok" aria-hidden /> Real handloom or pure silk?
      </h2>
      <p className="mt-0.5 text-[14px] leading-snug text-label-2">
        Show proof once — buyers see a &ldquo;Verified&rdquo; badge. Fake Chanderi is everywhere; this tells buyers yours is real. · असली होने का सबूत
      </p>

      {view.status === "VERIFIED" && !editing && (
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-ok-soft p-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ok" aria-hidden />
          <p className="flex-1 text-[15px] font-semibold text-ok">{view.badge} — buyers see this badge</p>
        </div>
      )}
      {view.status === "PENDING" && !editing && (
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-fill p-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-label-2" aria-hidden />
          <p className="flex-1 text-[15px] text-label">
            <b>{view.typeName}</b> — LocalMart is checking your proof. You&apos;ll get a message.
          </p>
        </div>
      )}
      {view.status === "REJECTED" && !editing && (
        <div className="mt-3">
          <Notice tone="warn">Couldn&apos;t verify yet: {view.reviewNote}</Notice>
        </div>
      )}

      {!showForm && (
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={() => setEditing(true)}>
            {view.status === "REJECTED" ? "Add proof and send again" : "Change proof"}
          </Button>
          <Button variant="plain" size="md" onClick={withdraw}>
            Remove
          </Button>
        </div>
      )}

      {showForm && (
        <div className="mt-4 space-y-5">
          <div>
            <p className="mb-1.5 text-[15px] font-semibold text-label">Which weave?</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Which weave">
              {(Object.keys(HANDLOOM_TYPES) as HandloomType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={type === k}
                  onClick={() => setType(k)}
                  className={`min-h-[44px] rounded-xl border px-3 text-[15px] font-medium cursor-pointer ${
                    type === k ? "border-tint bg-tint text-white" : "border-hairline text-label"
                  }`}
                >
                  {HANDLOOM_TYPES[k]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[15px] font-semibold text-label">Photos of the proof</p>
            <p className="mb-2 text-[14px] leading-snug text-label-2">
              The Handloom Mark or Silk Mark tag, the GI label, the weaver&apos;s bill, or the saree on the loom. Up to {MAX_PROOF}.
            </p>
            <div className="flex flex-wrap gap-2">
              {images.map((u) => (
                <span key={u} className="relative h-20 w-20 overflow-hidden rounded-xl bg-fill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="Proof" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((x) => x !== u))}
                    aria-label="Remove this photo"
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </span>
              ))}
              {images.length < MAX_PROOF && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hairline text-[12px] font-medium text-label-2 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Camera className="h-5 w-5" aria-hidden />}
                  {uploading ? "Uploading" : "Add photo"}
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weaver's name" htmlFor={`weaver-${productId}`} optional>
              <input id={`weaver-${productId}`} className={inputClass} value={weaverName} onChange={(e) => setWeaverName(e.target.value.slice(0, 60))} placeholder="e.g. Ramesh Koli" />
            </Field>
            <Field label="Village / town" htmlFor={`place-${productId}`} optional>
              <input id={`place-${productId}`} className={inputClass} value={weaverPlace} onChange={(e) => setWeaverPlace(e.target.value.slice(0, 60))} placeholder="e.g. Chanderi" />
            </Field>
          </div>

          <div className="flex gap-2">
            <Button onClick={send} loading={saving} className="flex-1">
              Send for check
            </Button>
            {editing && (
              <Button variant="plain" onClick={() => (view ? (fill(view), setEditing(false)) : null)}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
