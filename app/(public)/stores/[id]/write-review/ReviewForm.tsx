"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Camera, Loader2, Star, X } from "lucide-react";
import { StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { signInHref } from "@/lib/auth/returnTo";

interface ReviewFormProps {
  vendorId: string;
  vendorName: string;
  existingReview?: { rating?: number; comment?: string | null; images?: string[] | null } | null;
}

// What each star means, in plain words (and Hindi)
const RATING_WORDS: Record<number, { en: string; hi: string; tone: string }> = {
  1: { en: "Bad", hi: "खराब", tone: "text-bad" },
  2: { en: "Not good", hi: "ठीक नहीं", tone: "text-warn" },
  3: { en: "Okay", hi: "ठीक है", tone: "text-warn" },
  4: { en: "Good", hi: "अच्छा", tone: "text-ok" },
  5: { en: "Loved it", hi: "बहुत बढ़िया", tone: "text-ok" },
};

// One-tap phrases, so nobody has to think of what to write
const QUICK_GOOD = ["Good quality", "Fair price", "Fast delivery", "Packed well", "Polite shop owner"];
const QUICK_BAD = ["Late delivery", "Quality not as shown", "Wrong item", "Too costly", "Shop didn't pick up the call"];

const MAX_PHOTOS = 5;

export default function ReviewForm({ vendorId, vendorName, existingReview }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [photos, setPhotos] = useState<string[]>(existingReview?.images ?? []);
  const [uploading, setUploading] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const words = rating ? RATING_WORDS[rating] : null;
  const quick = rating && rating <= 2 ? QUICK_BAD : QUICK_GOOD;

  const addPhrase = (phrase: string) => {
    setComment((c) => {
      if (c.toLowerCase().includes(phrase.toLowerCase())) return c;
      const t = c.trim();
      return t ? `${t.replace(/[.,]?$/, ",")} ${phrase.toLowerCase()}` : phrase;
    });
  };

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // let them pick the same photo again
    if (!files.length) return;
    if (photos.length + uploading + files.length > MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }
    setError("");
    const { apiClient } = await import("@/lib/api/client");
    await Promise.all(
      files.map(async (file) => {
        setUploading((n) => n + 1);
        try {
          const data = await apiClient.uploadReviewImage(file);
          setPhotos((p) => [...p, data.url]);
        } catch (err) {
          setError(err instanceof Error && err.message ? err.message : "Couldn't add that photo. Please try again.");
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError("Tap a star to rate the shop.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { apiClient } = await import("@/lib/api/client");
      const data = await apiClient.createStoreReview({
        vendorId,
        rating,
        comment: comment.trim() || null,
        images: photos.length ? photos : null,
      });
      if (!data.success) throw new Error(data.message || "Couldn't post your review.");
      toast.success(existingReview ? "Review updated. Thank you!" : "Thanks! Your review is live.");
      router.push(`/stores/${vendorId}`);
      router.refresh();
    } catch (err) {
      const e2 = err as Error & { status?: number; isAuthError?: boolean };
      if (e2.status === 401 || e2.isAuthError) {
        router.push(signInHref(`/stores/${vendorId}/write-review`));
        return;
      }
      setError(
        e2.status === 403
          ? e2.message || "You can't rate your own shop."
          : e2.message || "Couldn't post your review. Check your internet and try again.",
      );
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Stars */}
      <section className="rounded-2xl bg-card p-5 text-center">
        <h2 className="text-[17px] font-semibold text-label">How was your experience?</h2>
        <p className="mt-0.5 text-[14px] text-label-3">अनुभव कैसा रहा?</p>
        <div className="mt-4 flex justify-center gap-1.5" role="radiogroup" aria-label={`Rate ${vendorName}`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""} — ${RATING_WORDS[n].en}`}
              onClick={() => {
                setRating(n);
                setError("");
              }}
              className="flex h-14 w-14 items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer"
            >
              <Star
                className={`h-11 w-11 ${n <= rating ? "fill-saffron text-saffron" : "fill-fill text-label/25"}`}
                strokeWidth={1.4}
                aria-hidden
              />
            </button>
          ))}
        </div>
        <p className={`mt-2 h-6 text-[16px] font-semibold ${words?.tone ?? "text-label-3"}`} aria-live="polite">
          {words ? `${words.en} · ${words.hi}` : "Tap a star"}
        </p>
      </section>

      {/* Words (optional) */}
      <section className="mt-3 rounded-2xl bg-card p-5">
        <label htmlFor="review-comment" className="text-[16px] font-semibold text-label">
          Tell others more <span className="font-normal text-label-3">(optional)</span>
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => addPhrase(q)}
              className="min-h-[40px] rounded-full border border-hairline bg-fill px-3.5 text-[14px] font-medium text-label hover:border-label/30 cursor-pointer"
            >
              + {q}
            </button>
          ))}
        </div>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={1000}
          placeholder="What did you buy? How was the quality and delivery?"
          className="mt-3 w-full resize-none rounded-xl border border-hairline bg-fill px-4 py-3 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
        />

        {/* Photos */}
        <p className="mt-4 text-[15px] font-semibold text-label">
          Add photos <span className="font-normal text-label-3">(optional)</span>
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((url, i) => (
            <div key={url} className="relative h-20 w-20">
              <Image src={url} alt={`Your photo ${i + 1}`} fill sizes="80px" className="rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((p) => p.filter((u) => u !== url))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-label text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <div key={`up-${i}`} className="flex h-20 w-20 items-center justify-center rounded-xl bg-fill">
              <Loader2 className="h-6 w-6 animate-spin text-label-3" aria-label="Adding photo" />
            </div>
          ))}
          {photos.length + uploading < MAX_PHOTOS && (
            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-hairline text-label-2 hover:border-label/30">
              <Camera className="h-6 w-6" aria-hidden />
              <span className="text-[12px] font-medium">Add</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handlePhotos} />
            </label>
          )}
        </div>
      </section>

      {error && (
        <p role="alert" className="mt-3 rounded-xl bg-bad-soft px-4 py-3 text-[15px] font-medium text-bad">
          {error}
        </p>
      )}

      <StickyBarSpacer />
      <StickyBar aboveTabBar>
        <button
          type="submit"
          disabled={submitting || uploading > 0}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
          {submitting ? "Posting…" : existingReview ? "Update review" : "Post review"}
        </button>
      </StickyBar>
    </form>
  );
}
