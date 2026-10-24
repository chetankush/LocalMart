"use client";

import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, Trash2 } from "lucide-react";
import { formatDateIST } from "@/components/app/ui";

/**
 * Ratings & reviews in the style Indian shoppers know from Flipkart:
 * a speedometer for the overall score, green/amber/red bars, and a green
 * "4 ★" badge on every review. Shared by product and shop pages.
 */

export interface PanelReview {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: string | Date;
  userName: string;
  verified?: boolean;
  reply?: string | null;
  replyAt?: string | Date | null;
  isMine?: boolean;
}

// Text/badge colours meet contrast with white; bar colours are brighter
const tone = (v: number) =>
  v >= 3 ? { badge: "bg-ok", bar: "#16A34A", label: "text-ok" } : v >= 2 ? { badge: "bg-warn", bar: "#F59E0B", label: "text-warn" } : { badge: "bg-bad", bar: "#EF4444", label: "text-bad" };

const verdict = (v: number) => (v >= 4.5 ? "Excellent" : v >= 4 ? "Very good" : v >= 3 ? "Good" : v >= 2 ? "Average" : "Poor");

export function RatingBadge({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[13px] font-semibold leading-none text-white ${tone(value).badge} ${className}`}
    >
      {Number.isInteger(value) ? value : value.toFixed(1)}
      <Star className="h-3 w-3 fill-white" aria-hidden />
    </span>
  );
}

/** Half-circle speedometer, 0–5 */
function Gauge({ value }: { value: number }) {
  const r = 52;
  const len = Math.PI * r;
  const filled = Math.max(0, Math.min(1, value / 5)) * len;
  return (
    <div className="relative w-[140px] shrink-0" role="img" aria-label={`${value.toFixed(1)} out of 5 — ${verdict(value)}`}>
      <svg viewBox="0 0 128 72" className="w-full">
        <path d="M 12 64 A 52 52 0 0 1 116 64" fill="none" stroke="var(--color-fill-strong)" strokeWidth="11" strokeLinecap="round" />
        <path
          d="M 12 64 A 52 52 0 0 1 116 64"
          fill="none"
          stroke={tone(value).bar}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${len}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-[30px] font-bold leading-none tabular-nums text-label">
          {value.toFixed(1)}
          <Star className="ml-0.5 inline h-5 w-5 -translate-y-1 fill-label text-label" aria-hidden />
        </p>
      </div>
    </div>
  );
}

export default function ReviewsPanel({
  title,
  average,
  ratingsCount,
  distribution,
  reviews,
  writeHref,
  writeLabel,
  emptyHint,
  seeAllHref,
  totalReviews,
  onDelete,
  deletingId,
}: {
  title: string;
  average: number;
  ratingsCount: number;
  distribution: Record<number, number>;
  reviews: PanelReview[];
  writeHref: string;
  writeLabel: string;
  emptyHint: string;
  seeAllHref?: string;
  totalReviews?: number;
  onDelete?: (id: string) => void;
  deletingId?: string | null;
}) {
  const total = Object.values(distribution).reduce((a, b) => a + (b || 0), 0) || ratingsCount;
  const has = total > 0 || reviews.length > 0;
  const photos = reviews.flatMap((r) => r.images).slice(0, 8);

  return (
    <section id="reviews" className="scroll-mt-28 rounded-2xl border border-hairline bg-card p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[20px] font-bold text-label">{title}</h2>
        {has && (
          <Link
            href={writeHref}
            className="shrink-0 rounded-full border border-label/20 px-4 py-2 text-[14px] font-semibold text-label hover:border-label/40"
          >
            {writeLabel}
          </Link>
        )}
      </div>

      {!has ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-fill p-4">
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-label">No ratings yet</p>
            <p className="text-[14px] leading-snug text-label-2">{emptyHint}</p>
          </div>
          <Link
            href={writeHref}
            className="shrink-0 rounded-full bg-cta px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-cta-hover"
          >
            {writeLabel}
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div className="text-center">
              <Gauge value={average} />
              <p className={`mt-1 text-[15px] font-semibold ${tone(average).label}`}>{verdict(average)}</p>
              <p className="text-[13px] text-label-2">
                {total.toLocaleString("en-IN")} {total === 1 ? "rating" : "ratings"}
                {reviews.length > 0 && ` · ${(totalReviews ?? reviews.length).toLocaleString("en-IN")} ${(totalReviews ?? reviews.length) === 1 ? "review" : "reviews"}`}
              </p>
            </div>
            <div className="w-full flex-1 space-y-2">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = distribution[n] || 0;
                const pct = total ? (count / total) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2 text-[13px]">
                    <span className="flex w-7 items-center justify-end gap-0.5 font-semibold text-label">
                      {n}
                      <Star className="h-3 w-3 fill-label text-label" aria-hidden />
                    </span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-fill">
                      <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${pct}%`, background: tone(n).bar }} />
                    </span>
                    <span className="w-8 text-right tabular-nums text-label-2">{count.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {photos.length > 0 && (
            <div className="mt-5">
              <h3 className="text-[15px] font-semibold text-label">Photos from customers</h3>
              <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 scrollbar-hide sm:mx-0 sm:px-0">
                {photos.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-fill">
                    <Image src={src} alt={`Customer photo ${i + 1}`} fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <ul className="mt-5 divide-y divide-hairline border-t border-hairline">
              {reviews.map((r) => (
                <li key={r.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <RatingBadge value={r.rating} />
                        <span className="text-[13px] text-label-2">{formatDateIST(r.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[14px] font-semibold text-label">
                        {r.userName}
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium text-label-2">
                            <BadgeCheck className="h-3.5 w-3.5 text-ok" aria-hidden /> Bought from this shop
                          </span>
                        )}
                      </p>
                    </div>
                    {r.isMine && onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-bad hover:bg-bad-soft disabled:opacity-50 cursor-pointer"
                        aria-label="Delete your review"
                      >
                        {deletingId === r.id ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-bad border-t-transparent" aria-hidden />
                        ) : (
                          <Trash2 className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    )}
                  </div>
                  {r.comment && <p className="mt-2 text-[15px] leading-relaxed text-label">{r.comment}</p>}
                  {r.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {r.images.map((src, i) => (
                        <div key={`${src}-${i}`} className="relative h-16 w-16 overflow-hidden rounded-lg bg-fill">
                          <Image src={src} alt={`Photo ${i + 1} from ${r.userName}`} fill sizes="64px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                  {r.reply && (
                    <div className="mt-3 rounded-xl bg-fill p-3">
                      <p className="text-[13px] font-semibold text-label">
                        Reply from the shop
                        {r.replyAt && <span className="font-normal text-label-2"> · {formatDateIST(r.replyAt)}</span>}
                      </p>
                      <p className="mt-1 text-[14px] text-label">{r.reply}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {seeAllHref && (totalReviews ?? 0) > reviews.length && (
            <Link
              href={seeAllHref}
              className="mt-1 flex h-11 items-center justify-center rounded-full border border-label/20 text-[15px] font-semibold text-label hover:border-label/40"
            >
              See all {totalReviews} reviews
            </Link>
          )}
        </>
      )}
    </section>
  );
}
