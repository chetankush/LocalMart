"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, Eye, Hand, Megaphone, MessageCircle, Plus, ShoppingBag } from "lucide-react";
import { Button, EmptyState, LargeTitle, Notice, Page, Pill, Section } from "@/components/app/ui";
import { SectionHeader } from "@/components/app/seller";
import {
  adState,
  apiError,
  areaLabel,
  shortDate,
  tapRate,
  targetLabel,
  type AdBookingView,
} from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";

interface Options {
  shop: { businessName: string; city: string; canAdvertise: boolean };
  paymentsEnabled: boolean;
}

function AdCard({ ad }: { ad: AdBookingView }) {
  const state = adState(ad.state);
  const target = targetLabel(ad);
  const showStats = !["PENDING_PAYMENT", "CANCELLED", "NEEDS_REFUND"].includes(ad.state);
  return (
    <article className="rounded-2xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[16px] font-semibold leading-snug text-label">{ad.placementTitle}</h3>
          <p className="mt-0.5 text-[14px] text-label-2">
            {[areaLabel(ad), target, `Position #${ad.position}`].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Pill tone={state.tone}>{state.label}</Pill>
      </div>

      {ad.bannerImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ad.bannerImage}
          alt=""
          className="mt-3 aspect-square w-40 rounded-xl bg-fill object-cover"
          loading="lazy"
        />
      )}

      <p className="mt-2 text-[14px] text-label-2">
        {shortDate(ad.startDate)} – {shortDate(ad.endDate)} · {ad.days} days ·{" "}
        {ad.amount > 0 ? `₹${ad.amount.toLocaleString("en-IN")}` : "Free from LocalMart"}
      </p>

      {ad.state === "PAUSED" && (
        <p className="mt-2 text-[14px] text-warn">
          Paused by LocalMart{ad.note ? `: ${ad.note}` : ""}. Call or WhatsApp LocalMart to restart it.
        </p>
      )}
      {ad.state === "PENDING_PAYMENT" && (
        <p className="mt-2 text-[14px] text-warn">Not paid yet. If you don&apos;t pay, the spot is freed for others.</p>
      )}
      {ad.state === "NEEDS_REFUND" && (
        <p className="mt-2 text-[14px] text-bad">
          The payment came in after the spot was taken. LocalMart will refund you.
        </p>
      )}

      {showStats && (
        <dl className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-fill px-3 py-2.5 text-center sm:grid-cols-4">
          <div>
            <dt className="flex items-center justify-center gap-1 text-[12px] text-label-2">
              <Eye className="h-3.5 w-3.5" aria-hidden /> Seen
            </dt>
            <dd className="text-[18px] font-bold tabular-nums text-label">{ad.impressions.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-1 text-[12px] text-label-2">
              <Hand className="h-3.5 w-3.5" aria-hidden /> Tapped
            </dt>
            <dd className="text-[18px] font-bold tabular-nums text-label">{ad.clicks.toLocaleString("en-IN")}</dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-1 text-[12px] text-label-2">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden /> Contacted
            </dt>
            <dd className="text-[18px] font-bold tabular-nums text-ok">
              {((ad.whatsappTaps ?? 0) + (ad.callTaps ?? 0)).toLocaleString("en-IN")}
            </dd>
          </div>
          <div>
            <dt className="flex items-center justify-center gap-1 text-[12px] text-label-2">
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden /> Orders
            </dt>
            <dd className="text-[18px] font-bold tabular-nums text-ok">{(ad.orders ?? 0).toLocaleString("en-IN")}</dd>
          </div>
        </dl>
      )}
      {showStats && (
        <p className="mt-2 text-[13px] text-label-2">
          {tapRate(ad)} of people who saw it tapped · {ad.whatsappTaps ?? 0} WhatsApp · {ad.callTaps ?? 0} calls
          {ad.orders ? ` · ${ad.orders} orders worth ₹${(ad.orderValue ?? 0).toLocaleString("en-IN")}` : ""} from people
          who came through this ad
        </p>
      )}
    </article>
  );
}

/**
 * "Promote my shop": the shop's paid spots (home, shop list, search,
 * banner) with how many people saw and tapped each, and a button to book.
 */
export default function VendorAdsPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [options, setOptions] = useState<Options | null>(null);
  const [ads, setAds] = useState<AdBookingView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read from the URL here, so the page needs no Suspense boundary
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const [opt, list] = await Promise.all([
          apiClient.get<{ data: Options }>(`/vendor/ads/options${q}`),
          apiClient.get<{ data: AdBookingView[] }>(`/vendor/ads/bookings${q}`),
        ]);
        setOptions(opt.data);
        setAds(list.data ?? []);
      } catch (err) {
        if (apiError(err).isAuth) {
          router.push(signInHref("/vendor/ads"));
          return;
        }
        setError(apiError(err).message || "Couldn't load your ads. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const newHref = `/vendor/ads/new${storeQuery}`;

  return (
    <Page>
      <LargeTitle
        title="Promote my shop"
        subtitle="Be the first shop people see near you · अपनी दुकान सबसे ऊपर दिखाएं"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-12 rounded-full bg-fill-strong animate-pulse" />
          <div className="h-36 rounded-2xl bg-card animate-pulse" />
          <div className="h-36 rounded-2xl bg-card animate-pulse" />
        </div>
      ) : error ? (
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {error}
        </Notice>
      ) : (
        <>
          {options && !options.paymentsEnabled && (
            <div className="mb-4">
              <Notice tone="warn" icon={<CircleAlert className="h-5 w-5 text-warn" aria-hidden />}>
                Online payment is being set up. You can see prices and free spots now, and book soon.
              </Notice>
            </div>
          )}
          {options && !options.shop.canAdvertise && (
            <div className="mb-4">
              <Notice tone="info" icon={<CircleAlert className="h-5 w-5 text-info" aria-hidden />}>
                Add a few products first, so people who tap your ad see something to buy.
              </Notice>
            </div>
          )}

          <div className="mb-6">
            <Button href={newHref} full>
              <Plus className="h-5 w-5" aria-hidden /> Book a new ad
            </Button>
          </div>

          {ads.length > 0 ? (
            <section className="mb-6">
              <SectionHeader title="My ads" />
              <div className="space-y-3">
                {ads.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={<Megaphone className="h-8 w-8" aria-hidden />}
              title="No ads yet"
              body={`Book a spot on the home page, the shop list or search — for one PIN code or all of ${options?.shop.city ?? "your city"}.`}
            />
          )}

          <Section title="How it works">
            <div className="px-4 py-3.5 text-[15px] text-label">
              <b>1.</b> Pick where your shop shows, the area, dates and position.
            </div>
            <div className="px-4 py-3.5 text-[15px] text-label">
              <b>2.</b> Pay online. Your ad starts on the date you picked.
            </div>
            <div className="px-4 py-3.5 text-[15px] text-label">
              <b>3.</b> See here how many people saw and tapped your shop.
            </div>
          </Section>
        </>
      )}
    </Page>
  );
}
