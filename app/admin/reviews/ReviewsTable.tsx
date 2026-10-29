"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, MessageSquareText, Star, Trash2 } from "lucide-react";
import { Button, Thumb, formatDateIST } from "@/components/app/ui";
import { Chips, EmptyBlock, StatusPill, TableCard, Toolbar, tdClass, thClass, trClass } from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: any;
  isApproved: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    fullName: string;
    email: string | null;
  };
  vendor: {
    id: string;
    businessName: string;
    averageRating: number | null;
    reviewCount: number;
  };
  vendorResponse: string | null;
  vendorRespondedAt: string | null;
}

interface ReviewsTableProps {
  initialReviews: Review[];
  initialTotal: number;
}

type StatusFilter = "all" | "visible" | "hidden";
type RatingFilter = "any" | "low" | "mid" | "high";

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

const matchesRating = (rating: number, f: RatingFilter) =>
  f === "low" ? rating <= 2 : f === "mid" ? rating === 3 : f === "high" ? rating >= 4 : true;

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={cx("h-4 w-4 fill-current", i <= rating ? "text-warn" : "text-fill-strong")}
        />
      ))}
    </span>
  );
}

/** Stars, the comment (3 lines, tap to read all), photos and the shop's reply */
function ReviewBody({ review, open, onToggle }: { review: Review; open: boolean; onToggle: () => void }) {
  const images: string[] = Array.isArray(review.images) ? review.images.filter((i: unknown) => typeof i === "string") : [];
  return (
    <div className="min-w-0">
      <Stars rating={review.rating} />
      {review.comment ? (
        <>
          <p
            className={cx(
              "mt-1.5 whitespace-pre-line break-words text-[15px] leading-snug text-label",
              !open && "line-clamp-3",
            )}
          >
            {review.comment}
          </p>
          {review.comment.length > 140 && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-1 min-h-[32px] text-[14px] font-medium text-tint cursor-pointer"
            >
              {open ? "Show less" : "Show more"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-1.5 text-[15px] text-label-3">No written review</p>
      )}
      {images.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {images.slice(0, 3).map((img, idx) => (
            <a key={idx} href={img} target="_blank" rel="noreferrer" aria-label={`Open photo ${idx + 1}`}>
              <Thumb src={img} alt={`Review photo ${idx + 1}`} size={44} />
            </a>
          ))}
          {images.length > 3 && (
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fill text-[13px] font-semibold text-label-2">
              +{images.length - 3}
            </span>
          )}
        </div>
      )}
      {review.vendorResponse && (
        <p className="mt-2 line-clamp-2 rounded-xl bg-fill px-3 py-2 text-[14px] leading-snug text-label-2">
          <span className="font-semibold text-label">Shop replied: </span>
          {review.vendorResponse}
        </p>
      )}
    </div>
  );
}

function ShopRating({ vendor }: { vendor: Review["vendor"] }) {
  const parts = [
    vendor.averageRating != null ? `${vendor.averageRating.toFixed(1)} average` : null,
    typeof vendor.reviewCount === "number" ? `${vendor.reviewCount} ${vendor.reviewCount === 1 ? "review" : "reviews"}` : null,
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return <p className="text-[13px] tabular-nums text-label-2">{parts.join(" · ")}</p>;
}

export default function ReviewsTable({
  initialReviews,
  initialTotal,
}: ReviewsTableProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  // Which review is being changed, so only its buttons spin
  const [busy, setBusy] = useState<{ id: string; action: "hide" | "delete" } | null>(null);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("any");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  const handleDelete = async (reviewId: string) => {
    const ok = await confirm({
      title: "Delete this review?",
      description: "It is removed for good and the shop's rating is worked out again. This can't be undone.",
      confirmLabel: "Delete review",
      destructive: true,
    });
    if (!ok) return;

    setBusy({ id: reviewId, action: "delete" });
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.deleteAdminStoreReview(reviewId);

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      toast.success("Review deleted");
      // The number tiles above come from the server page — redraw them
      router.refresh();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Couldn't delete the review. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const handleToggleHidden = async (reviewId: string, currentState: boolean) => {
    setBusy({ id: reviewId, action: "hide" });
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.updateAdminStoreReview(reviewId, {
        isHidden: !currentState,
      });

      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, isHidden: !currentState } : r)));
      toast.success(!currentState ? "Review hidden from customers" : "Review is visible again");
      router.refresh();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Couldn't change the review. Try again.");
    } finally {
      setBusy(null);
    }
  };

  const byStatus = reviews.filter((review) => {
    if (filter === "hidden") return review.isHidden;
    if (filter === "visible") return !review.isHidden;
    return true;
  });
  const filteredReviews = byStatus.filter((review) => matchesRating(review.rating, ratingFilter));
  const countRating = (f: RatingFilter) => byStatus.filter((r) => matchesRating(r.rating, f)).length;

  const actions = (review: Review, size: "md" | "lg") => (
    <>
      <Button
        variant="secondary"
        size={size}
        className={size === "lg" ? "flex-1" : undefined}
        onClick={() => handleToggleHidden(review.id, review.isHidden)}
        loading={busy?.id === review.id && busy.action === "hide"}
        disabled={!!busy}
      >
        {!(busy?.id === review.id && busy.action === "hide") &&
          (review.isHidden ? (
            <Eye className="h-[18px] w-[18px]" aria-hidden />
          ) : (
            <EyeOff className="h-[18px] w-[18px]" aria-hidden />
          ))}
        {review.isHidden ? "Show" : "Hide"}
      </Button>
      <Button
        variant="danger"
        size={size}
        className={size === "lg" ? "flex-1" : undefined}
        onClick={() => handleDelete(review.id)}
        loading={busy?.id === review.id && busy.action === "delete"}
        disabled={!!busy}
      >
        {!(busy?.id === review.id && busy.action === "delete") && <Trash2 className="h-[18px] w-[18px]" aria-hidden />}
        Delete
      </Button>
    </>
  );

  return (
    <div>
      <Toolbar>
        <Chips
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All", count: reviews.length },
            { value: "visible", label: "Visible", count: reviews.filter((r) => !r.isHidden).length },
            { value: "hidden", label: "Hidden", count: reviews.filter((r) => r.isHidden).length },
          ]}
        />
        <Chips
          label="Filter by rating"
          value={ratingFilter}
          onChange={setRatingFilter}
          options={[
            { value: "any", label: "Any rating" },
            { value: "low", label: "1–2 stars", count: countRating("low") },
            { value: "mid", label: "3 stars", count: countRating("mid") },
            { value: "high", label: "4–5 stars", count: countRating("high") },
          ]}
        />
      </Toolbar>

      {filteredReviews.length === 0 ? (
        <EmptyBlock
          icon={<MessageSquareText className="h-7 w-7" aria-hidden />}
          title={reviews.length === 0 ? "No shop reviews yet" : "No reviews here"}
          body={
            reviews.length === 0
              ? "When customers review a shop, it shows up here."
              : "No reviews match these filters."
          }
          action={
            reviews.length > 0 && (
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setFilter("all");
                  setRatingFilter("any");
                }}
              >
                Show all reviews
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Review</th>
                <th className={thClass}>Shop</th>
                <th className={thClass}>By</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.id} className={trClass}>
                  <td className={cx(tdClass, "min-w-[260px] max-w-md align-top")}>
                    <ReviewBody
                      review={review}
                      open={expandedReview === review.id}
                      onToggle={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                    />
                  </td>
                  <td className={cx(tdClass, "align-top")}>
                    <Link href={`/stores/${review.vendor.id}`} className="font-semibold text-label hover:text-tint">
                      {review.vendor.businessName}
                    </Link>
                    <ShopRating vendor={review.vendor} />
                  </td>
                  <td className={cx(tdClass, "align-top")}>
                    <p>{review.user.fullName}</p>
                    {review.user.email && (
                      <p className="max-w-[220px] truncate text-[13px] text-label-2">{review.user.email}</p>
                    )}
                    <p className="mt-0.5 whitespace-nowrap text-[13px] text-label-2">{formatDateIST(review.createdAt)}</p>
                  </td>
                  <td className={cx(tdClass, "align-top")}>
                    <StatusPill status={review.isHidden ? "HIDDEN" : "VISIBLE"} />
                  </td>
                  <td className={cx(tdClass, "align-top")}>
                    <div className="flex flex-col gap-1.5">{actions(review, "md")}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableCard>

          {/* Phone */}
          <div className="space-y-3 md:hidden">
            {filteredReviews.map((review) => (
              <article key={review.id} className="rounded-2xl bg-card p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/stores/${review.vendor.id}`}
                      className="block truncate text-[16px] font-semibold text-label"
                    >
                      {review.vendor.businessName}
                    </Link>
                    <p className="text-[14px] text-label-2">
                      {review.user.fullName} · {formatDateIST(review.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={review.isHidden ? "HIDDEN" : "VISIBLE"} />
                </div>
                <ReviewBody
                  review={review}
                  open={expandedReview === review.id}
                  onToggle={() => setExpandedReview(expandedReview === review.id ? null : review.id)}
                />
                <div className="mt-4 flex gap-2">{actions(review, "lg")}</div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
