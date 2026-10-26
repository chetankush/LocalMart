"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CircleAlert, CircleCheck, Home, Image as ImageIcon, LayoutList, Search } from "lucide-react";
import { Button, LargeTitle, Notice, Page, StickyBar, StickyBarSpacer } from "@/components/app/ui";
import { ChoiceCard, Field, FormCard, Segmented, inputClass, selectClass } from "@/components/app/form";
import ImageUploader from "@/components/ImageUploader";
import { SHOP_KIND } from "@/lib/landing/shopImages";
import { openRazorpay, type RazorpayCheckout } from "@/lib/payments/razorpay";
import type { AdPlacement } from "@/lib/ads";
import { apiError, areaLabel, shortDate, targetLabel, type AdBookingView } from "@/components/ads/adLabels";

type AreaType = "PINCODE" | "CITY";
type Rates = Record<AdPlacement, Record<AreaType, number[]>>;

interface Options {
  shop: {
    id: string;
    businessName: string;
    businessType: string;
    city: string;
    pincode: string | null;
    canAdvertise: boolean;
  };
  placements: {
    key: AdPlacement;
    title: string;
    description: string;
    allowsCategory: boolean;
    needsKeyword: boolean;
    needsBanner: boolean;
  }[];
  rates: Rates;
  durations: number[];
  positions: number;
  holdMinutes: number;
  today: string;
  pincodes: { code: string; areas: string[] }[];
  paymentsEnabled: boolean;
}

interface Availability {
  endDate: string;
  alreadyBooked: boolean;
  positions: {
    position: number;
    price: number;
    available: boolean;
    yours: boolean;
    freeFrom: string | null;
  }[];
}

const ICONS: Record<AdPlacement, typeof Home> = {
  HOME_FEATURED: Home,
  SHOP_LIST: LayoutList,
  SEARCH: Search,
  HOME_BANNER: ImageIcon,
};

const POSITION_NAME = ["First spot", "Second spot", "Third spot"];

function addDaysTo(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Book an ad: where it shows, which area, for what (shop type or search
 * word), dates and position — then pay on Razorpay. Free positions and
 * prices come from the server as the choices change.
 */
export default function NewAdPage() {
  const router = useRouter();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [placement, setPlacement] = useState<AdPlacement>("SHOP_LIST");
  const [areaType, setAreaType] = useState<AreaType>("PINCODE");
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [days, setDays] = useState(30);
  const [position, setPosition] = useState<number | null>(null);
  const [bannerImage, setBannerImage] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");

  const [availability, setAvailability] = useState<Availability | null>(null);
  const [availError, setAvailError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [booked, setBooked] = useState<AdBookingView | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("storeId");
    const q = id ? `?storeId=${encodeURIComponent(id)}` : "";
    setStoreId(id);
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: Options }>(`/vendor/ads/options${q}`);
        setOptions(res.data);
        setPincode(res.data.shop.pincode ?? res.data.pincodes[0]?.code ?? "");
        setStartDate(res.data.today);
      } catch (err) {
        if (apiError(err).isAuth) {
          router.push("/sign-in");
          return;
        }
        setLoadError(apiError(err).message || "Couldn't load ad prices. Please try again.");
      }
    })();
  }, [router]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedKeyword(keyword.trim()), 400);
    return () => clearTimeout(t);
  }, [keyword]);

  const info = options?.placements.find((p) => p.key === placement);
  const storeQuery = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";

  const checkAvailability = useCallback(async () => {
    if (!options || !info || !startDate) return;
    if (info.needsKeyword && debouncedKeyword.length < 2) {
      setAvailability(null);
      return;
    }
    const params = new URLSearchParams({
      placement,
      areaType,
      startDate,
      days: String(days),
    });
    if (areaType === "PINCODE" && pincode) params.set("pincode", pincode);
    if (info.allowsCategory) params.set("category", category);
    if (info.needsKeyword) params.set("keyword", debouncedKeyword);
    if (storeId) params.set("storeId", storeId);

    const id = ++requestId.current;
    setChecking(true);
    setAvailError(null);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const res = await apiClient.get<{ data: Availability }>(`/vendor/ads/availability?${params}`);
      if (id !== requestId.current) return; // a newer check is on its way
      setAvailability(res.data);
      setPosition((p) => {
        const still = res.data.positions.find((x) => x.position === p && x.available);
        return still ? p : (res.data.positions.find((x) => x.available)?.position ?? null);
      });
    } catch (err) {
      if (id !== requestId.current) return;
      setAvailability(null);
      setAvailError(apiError(err).message || "Couldn't check free spots.");
    } finally {
      if (id === requestId.current) setChecking(false);
    }
  }, [options, info, placement, areaType, pincode, category, debouncedKeyword, startDate, days, storeId]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const chosen = availability?.positions.find((p) => p.position === position && p.available);
  const fromPrice = useCallback(
    (key: AdPlacement) => (options ? Math.min(...options.rates[key].PINCODE) : 0),
    [options],
  );

  const blocker = useMemo(() => {
    if (!options) return null;
    if (!options.paymentsEnabled) return "Online payment is being set up. Please check back soon.";
    if (!options.shop.canAdvertise) return "Add a few products first, so people who tap your ad see something.";
    if (info?.needsKeyword && debouncedKeyword.length < 2) return "Type the word people search.";
    if (info?.needsBanner && !bannerImage) return "Upload your banner picture.";
    if (availability?.alreadyBooked) return "You already have an ad here for these dates.";
    if (availability && !chosen) return "All 3 spots are taken for these dates. Try other dates or another area.";
    return null;
  }, [options, info, debouncedKeyword, bannerImage, availability, chosen]);

  const pay = async () => {
    if (!options || !chosen || blocker) return;
    setPaying(true);
    const { apiClient } = await import("@/lib/api/client");
    let bookingId: string | null = null;
    try {
      const res = await apiClient.post<{
        data: { booking: AdBookingView; checkout: RazorpayCheckout };
      }>(`/vendor/ads/bookings${storeQuery}`, {
        placement,
        areaType,
        pincode: areaType === "PINCODE" ? pincode : undefined,
        category: info?.allowsCategory ? category : undefined,
        keyword: info?.needsKeyword ? keyword.trim() : undefined,
        startDate,
        days,
        position: chosen.position,
        bannerImage: info?.needsBanner ? bannerImage : undefined,
        bannerTitle: info?.needsBanner ? bannerTitle.trim() || undefined : undefined,
      });
      bookingId = res.data.booking.id;
      const result = await openRazorpay(res.data.checkout);
      if (result.status === "paid") {
        try {
          const done = await apiClient.post<{ data: AdBookingView }>(`/vendor/ads/bookings/${bookingId}/verify`, {
            razorpayOrderId: result.response.razorpay_order_id,
            razorpayPaymentId: result.response.razorpay_payment_id,
            razorpaySignature: result.response.razorpay_signature,
          });
          setBooked(done.data);
          toast.success("Payment received. Your ad is booked!");
        } catch {
          // Razorpay also tells our server directly, so the ad still goes live
          toast.success("Payment received. Your ad will show in My ads in a minute.");
          router.push(`/vendor/ads${storeQuery}`);
        }
      } else {
        await apiClient.post(`/vendor/ads/bookings/${bookingId}/cancel`).catch(() => {});
        toast(
          result.lastError ? `Payment didn't go through: ${result.lastError}` : "Payment closed. Nothing was charged.",
        );
        checkAvailability();
      }
    } catch (err) {
      if (bookingId) await apiClient.post(`/vendor/ads/bookings/${bookingId}/cancel`).catch(() => {});
      toast.error(apiError(err).message || "Couldn't book the ad. Please try again.");
      checkAvailability();
    } finally {
      setPaying(false);
    }
  };

  if (loadError) {
    return (
      <Page>
        <LargeTitle title="Book an ad" back={{ href: `/vendor/ads${storeQuery}`, label: "My ads" }} />
        <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
          {loadError}
        </Notice>
      </Page>
    );
  }

  if (!options || !info) {
    return (
      <Page>
        <div className="mb-3 h-6 w-20 rounded-full bg-fill-strong animate-pulse" />
        <div className="mb-6 h-9 w-52 rounded-xl bg-fill-strong animate-pulse" />
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      </Page>
    );
  }

  if (booked) {
    return (
      <Page>
        <LargeTitle title="Ad booked" back={{ href: `/vendor/ads${storeQuery}`, label: "My ads" }} />
        <div className="mb-6 rounded-2xl bg-card p-5 text-center">
          <CircleCheck className="mx-auto h-12 w-12 text-ok" aria-hidden />
          <p className="mt-3 text-[18px] font-semibold text-label">{booked.placementTitle}</p>
          <p className="mt-1 text-[15px] text-label-2">
            {[areaLabel(booked), targetLabel(booked), `Position #${booked.position}`].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-[15px] text-label-2">
            {shortDate(booked.startDate)} – {shortDate(booked.endDate)} · ₹{booked.amount.toLocaleString("en-IN")} paid
          </p>
        </div>
        <Button href={`/vendor/ads${storeQuery}`} full>
          See my ads
        </Button>
      </Page>
    );
  }

  const ownType = SHOP_KIND[options.shop.businessType] ?? "My shop type";
  const endDate = startDate ? addDaysTo(startDate, days - 1) : "";

  return (
    <Page>
      <LargeTitle
        title="Book an ad"
        subtitle="Pick where your shop shows first · विज्ञापन बुक करें"
        back={{ href: `/vendor/ads${storeQuery}`, label: "My ads" }}
      />

      <FormCard title="Where should it show?">
        <div role="radiogroup" aria-label="Where should it show" className="space-y-3">
          {options.placements.map((p) => {
            const Icon = ICONS[p.key];
            return (
              <ChoiceCard
                key={p.key}
                selected={placement === p.key}
                onSelect={() => setPlacement(p.key)}
                icon={<Icon className="h-[22px] w-[22px]" aria-hidden />}
                title={p.title}
                description={`${p.description} From ₹${fromPrice(p.key)} a month.`}
              />
            );
          })}
        </div>
      </FormCard>

      <FormCard title="Which area?" description="Your ad shows to people who are in this area on LocalMart.">
        <Segmented
          label="Area"
          value={areaType}
          onChange={setAreaType}
          options={[
            { value: "PINCODE", label: "One PIN code" },
            { value: "CITY", label: `All of ${options.shop.city}` },
          ]}
        />
        {areaType === "PINCODE" && (
          <Field
            label="PIN code"
            htmlFor="ad-pincode"
            hint="Pick where your customers live. Each PIN code has its own 3 spots."
          >
            <select
              id="ad-pincode"
              className={selectClass}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
            >
              {options.pincodes.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.code}
                  {p.code === options.shop.pincode ? " (your shop)" : ""}
                  {p.areas.length ? ` · ${p.areas.join(", ")}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
      </FormCard>

      {info.allowsCategory && (
        <FormCard
          title="Which list?"
          description="Show at the top of all shops, or only when people pick your kind of shop."
        >
          <Segmented
            label="List"
            value={category}
            onChange={setCategory}
            options={[
              { value: "ALL", label: "All shops" },
              { value: options.shop.businessType, label: ownType },
            ]}
          />
        </FormCard>
      )}

      {info.needsKeyword && (
        <FormCard title="Search word">
          <Field
            label="When people search"
            htmlFor="ad-keyword"
            hint="One or two words. “saree” also shows for “sarees” and “red saree”."
          >
            <input
              id="ad-keyword"
              className={inputClass}
              value={keyword}
              maxLength={40}
              placeholder="e.g. saree"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field>
        </FormCard>
      )}

      {info.needsBanner && (
        <FormCard
          title="Your banner"
          description="A square photo works best (about 1000 × 1000). Keep your saree and faces in the middle. Your headline shows beside the photo, never on it."
        >
          <ImageUploader
            value={bannerImage}
            onChange={setBannerImage}
            uploadType="store"
            previewSize="lg"
            allowUrlInput={false}
            placeholder="Upload banner photo"
          />
          <Field label="Headline" htmlFor="ad-banner-title" optional hint="Short, like a shop board">
            <input
              id="ad-banner-title"
              className={inputClass}
              value={bannerTitle}
              maxLength={60}
              placeholder="e.g. Diwali sale: 20% off silk sarees"
              onChange={(e) => setBannerTitle(e.target.value)}
            />
          </Field>
          {bannerImage && (
            // The same card shoppers see: words beside the photo, nothing on it
            <div>
              <p className="mb-2 text-[13px] font-semibold text-label-2">How shoppers will see it · ग्राहकों को ऐसा दिखेगा</p>
              <div className="flex h-[200px] max-w-[460px] overflow-hidden rounded-3xl bg-[#F6F1EA]">
                <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                  <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-tint">{options.shop.businessName}</p>
                  <p className="mt-1 line-clamp-3 text-[19px] font-bold leading-tight text-label">
                    {bannerTitle.trim() || `Visit ${options.shop.businessName}`}
                  </p>
                  <span className="mt-3 inline-flex h-9 w-fit items-center rounded-full bg-label px-4 text-[13px] font-semibold text-white">
                    Visit shop
                  </span>
                </div>
                <div className="relative w-[52%] shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerImage} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
                </div>
              </div>
            </div>
          )}
        </FormCard>
      )}

      <FormCard title="When?">
        <Field label="Start date" htmlFor="ad-start">
          <input
            id="ad-start"
            type="date"
            className={inputClass}
            value={startDate}
            min={options.today}
            max={addDaysTo(options.today, 60)}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Segmented
          label="How long"
          value={String(days)}
          onChange={(v) => setDays(Number(v))}
          options={options.durations.map((d) => ({
            value: String(d),
            label: `${d} days`,
          }))}
        />
        {endDate && (
          <p className="text-[14px] text-label-2">
            Runs {shortDate(startDate)} – {shortDate(endDate)}
          </p>
        )}
      </FormCard>

      <FormCard
        title="Pick a position"
        description={checking ? "Checking free spots…" : "Number 1 shows first. Each spot goes to one shop only."}
      >
        {availError ? (
          <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
            {availError}
          </Notice>
        ) : availability ? (
          <div role="radiogroup" aria-label="Position" className="space-y-3">
            {availability.positions.map((p) => (
              <div key={p.position} className={p.available ? "" : "opacity-50"}>
                <ChoiceCard
                  selected={position === p.position && p.available}
                  onSelect={() => p.available && setPosition(p.position)}
                  title={`#${p.position} · ${POSITION_NAME[p.position - 1] ?? "Spot"} · ₹${p.price.toLocaleString("en-IN")}`}
                  description={
                    p.available
                      ? `${days} days`
                      : p.yours
                        ? "You already have this spot"
                        : `Taken${p.freeFrom ? ` · free from ${shortDate(p.freeFrom)}` : ""}`
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[15px] text-label-2">
            {info.needsKeyword ? "Type a search word to see free spots." : "Pick a start date to see free spots."}
          </p>
        )}
      </FormCard>

      {blocker && (
        <div className="mb-4">
          <Notice tone="info" icon={<CircleAlert className="h-5 w-5 text-info" aria-hidden />}>
            {blocker}
          </Notice>
        </div>
      )}

      <p className="mb-4 px-1 text-[13px] leading-snug text-label-2">
        We hold your spot for {options.holdMinutes} minutes while you pay. Your ad is marked “Ad” for shoppers.
      </p>

      <StickyBar aboveTabBar>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-label-2">Total</p>
          <p className="text-[20px] font-bold tabular-nums text-label">
            {chosen ? `₹${chosen.price.toLocaleString("en-IN")}` : "–"}
          </p>
        </div>
        <Button onClick={pay} loading={paying} disabled={paying || checking || Boolean(blocker) || !chosen}>
          {paying ? "Opening payment…" : "Pay & book"}
        </Button>
      </StickyBar>
      <StickyBarSpacer />
    </Page>
  );
}
