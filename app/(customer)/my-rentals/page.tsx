"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, CircleAlert, Package, Phone } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Button, EmptyState, LargeTitle, Notice, Page, Pill, Thumb } from "@/components/app/ui";
import { useConfirm } from "@/hooks/useConfirm";
import { signInHref } from "@/lib/auth/returnTo";
import { apiError } from "@/components/ads/adLabels";
import { STATUS, dayText, pieces, rupees, unitCount, type RentalBookingView } from "@/lib/rentals";

function RentalCard({ b, onCancel }: { b: RentalBookingView; onCancel: (b: RentalBookingView) => void }) {
  const s = STATUS[b.status];
  const canCancel = b.status === "REQUESTED" || b.status === "CONFIRMED";
  return (
    <article className="overflow-hidden rounded-2xl bg-card">
      <div className="flex gap-3 p-4">
        <Link href={`/products/${b.productId}`} className="shrink-0">
          <Thumb src={b.item.image} alt={b.item.name} size={64} />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 text-[16px] font-semibold leading-snug text-label">{b.item.name}</h2>
            <Pill tone={s.tone}>{s.label}</Pill>
          </div>
          <p className="mt-0.5 text-[14px] text-label-2">{b.shop.name}</p>
          <p className="mt-1 flex items-center gap-1 text-[14px] text-label">
            <CalendarDays className="h-4 w-4 shrink-0 text-label-2" aria-hidden />
            {dayText(b.startsAt)}
            {b.unit !== "HOUR" && ` – ${dayText(b.lastDay)}`} · {pieces(b.quantity, b.item.unitLabel)} · {unitCount(b.units, b.unit)}
          </p>
        </div>
      </div>

      {b.shopNote && (
        <p className={`mx-4 mb-3 rounded-xl px-3 py-2 text-[14px] ${b.status === "REJECTED" ? "bg-bad-soft text-bad" : "bg-fill text-label"}`}>
          {b.status === "REJECTED" ? "The shop said: " : "Note from the shop: "}
          {b.shopNote}
        </p>
      )}

      <dl className="mx-4 mb-3 space-y-1 rounded-xl bg-fill p-3 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-label-2">To pay the shop</dt>
          <dd className="font-semibold tabular-nums text-label">{rupees(b.totalAmount)}</dd>
        </div>
        {b.deposit > 0 && (
          <div className="flex justify-between">
            <dt className="text-label-2">Deposit (comes back)</dt>
            <dd className="tabular-nums text-label">{rupees(b.deposit)}</dd>
          </div>
        )}
        {b.extraCharge ? (
          <div className="flex justify-between">
            <dt className="text-label-2">Extra charge at return</dt>
            <dd className="tabular-nums text-bad">{rupees(b.extraCharge)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between text-[13px] text-label-3">
          <dt>Booking</dt>
          <dd>{b.bookingNumber}</dd>
        </div>
      </dl>

      <div className="flex gap-3 border-t border-hairline p-4">
        {b.shop.phone && (
          <Button href={`tel:${b.shop.phone}`} variant="secondary" size="md" className="flex-1">
            <Phone className="h-[18px] w-[18px]" aria-hidden /> Call shop
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" size="md" className="flex-1 bg-bad-soft" onClick={() => onCancel(b)}>
            Cancel
          </Button>
        )}
      </div>
    </article>
  );
}

/** Things this person rented: plates, machines… and where each booking is */
export default function MyRentalsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const confirm = useConfirm();
  const [rentals, setRentals] = useState<RentalBookingView[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.get<{ data: RentalBookingView[] }>("/rentals/bookings/mine");
      setRentals(res.data ?? []);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) {
        router.push(signInHref("/my-rentals"));
        return;
      }
      setError("Couldn't load your rentals. Check your internet and try again.");
    }
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push(signInHref("/my-rentals"));
      return;
    }
    load();
  }, [user, loading, router, load]);

  const cancel = async (b: RentalBookingView) => {
    const ok = await confirm({
      title: "Cancel this booking?",
      description: `${b.item.name} from ${b.shop.name}. The shop will be told.`,
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep it",
      destructive: true,
    });
    if (!ok) return;
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/rentals/bookings/${b.id}/cancel`);
      toast.success("Booking cancelled");
      load();
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't cancel. Please call the shop.");
    }
  };

  return (
    <Page>
      <LargeTitle title="My rentals" subtitle="Plates, machines and more you booked · मेरी किराये की बुकिंग" />
      {error ? (
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {error}
        </Notice>
      ) : rentals === null ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-40 animate-pulse rounded-2xl bg-card" />
          <div className="h-40 animate-pulse rounded-2xl bg-card" />
        </div>
      ) : rentals.length === 0 ? (
        <EmptyState
          icon={<Package className="h-8 w-8" aria-hidden />}
          title="No rentals yet"
          body="Shuttering plates, cutters, mixers and more — book from shops near you."
          action={<Button href="/search?q=rent">Find things to rent</Button>}
        />
      ) : (
        <div className="space-y-3">
          {rentals.map((b) => (
            <RentalCard key={b.id} b={b} onCancel={cancel} />
          ))}
        </div>
      )}
    </Page>
  );
}
