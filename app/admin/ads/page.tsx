"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CircleAlert, Gift, Megaphone } from "lucide-react";
import { Button, Notice, Pill } from "@/components/app/ui";
import { Field, inputClass, selectClass, textareaClass } from "@/components/app/form";
import { List, SectionHeader, StatGrid, StatTile } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminPage,
  Chips,
  EmptyBlock,
  LoadingBlock,
  TableCard,
  Toolbar,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import ImageUploader from "@/components/ImageUploader";
import { useConfirm } from "@/hooks/useConfirm";
import { SHOP_KIND } from "@/lib/landing/shopImages";
import type { AdPlacement } from "@/lib/ads";
import {
  adState,
  apiError,
  areaLabel,
  shortDate,
  tapRate,
  targetLabel,
  type AdBookingView,
} from "@/components/ads/adLabels";

type AreaType = "PINCODE" | "CITY";
type Rates = Record<AdPlacement, Record<AreaType, number[]>>;

interface Summary {
  live: number;
  needsRefund: number;
  revenueThisMonth: number;
  totalRevenue: number;
  paymentsEnabled: boolean;
  webhookEnabled: boolean;
}

interface ShopOption {
  id: string;
  businessName: string;
  businessType: string;
  city: string;
  pincode: string | null;
}

const PLACEMENTS: { key: AdPlacement; label: string }[] = [
  { key: "HOME_FEATURED", label: "Home · Featured shops" },
  { key: "SHOP_LIST", label: "Shop list" },
  { key: "SEARCH", label: "Search" },
  { key: "HOME_BANNER", label: "Home · Banner" },
];

const FILTERS = [
  { value: "", label: "All" },
  { value: "ACTIVE", label: "Booked" },
  { value: "PENDING_PAYMENT", label: "Waiting for payment" },
  { value: "PAUSED", label: "Paused" },
  { value: "NEEDS_REFUND", label: "Refund due" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const rupee = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function todayIST() {
  return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** What the admin can do next with an ad */
function actionsFor(ad: AdBookingView): { status: string; label: string; danger?: boolean }[] {
  const list: { status: string; label: string; danger?: boolean }[] = [];
  if (ad.status === "ACTIVE" && ad.state !== "ENDED") list.push({ status: "PAUSED", label: "Pause" });
  if (ad.status === "PAUSED") list.push({ status: "ACTIVE", label: "Resume" });
  if (ad.amount > 0 && ad.paidAt && ["ACTIVE", "PAUSED", "NEEDS_REFUND", "CANCELLED"].includes(ad.status))
    list.push({ status: "REFUNDED", label: "Mark refunded", danger: true });
  if (ad.amount === 0 && ad.state !== "ENDED" && ["ACTIVE", "PAUSED"].includes(ad.status))
    list.push({ status: "CANCELLED", label: "Cancel", danger: true });
  return list;
}

/**
 * Ads: every booked spot with what it earned and how it did, the price list,
 * and free ads for launch offers. Refunds are made in the Razorpay dashboard
 * and then marked here.
 */
export default function AdminAdsPage() {
  const confirm = useConfirm();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [ads, setAds] = useState<AdBookingView[]>([]);
  const [rates, setRates] = useState<Rates | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingRates, setSavingRates] = useState(false);
  const [showFree, setShowFree] = useState(false);
  const [pausing, setPausing] = useState<AdBookingView | null>(null);
  const [pauseReason, setPauseReason] = useState("");

  const load = useCallback(async (status: string) => {
    setLoading(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const q = status ? `?status=${status}` : "";
      const [s, list, r] = await Promise.all([
        apiClient.get<{ data: Summary }>("/admin/ads/summary"),
        apiClient.get<{ data: AdBookingView[] }>(`/admin/ads/bookings${q}`),
        apiClient.get<{ data: Rates }>("/admin/ads/rates"),
      ]);
      setSummary(s.data);
      setAds(list.data ?? []);
      setRates(r.data);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't load ads.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  const changeStatus = async (ad: AdBookingView, status: string, note?: string) => {
    if (status === "REFUNDED") {
      const ok = await confirm({
        title: `Mark ${rupee(ad.amount)} as refunded?`,
        description: `First refund payment ${ad.razorpayPaymentId ?? ""} in the Razorpay dashboard. This only records it here and stops the ad.`,
        confirmLabel: "Mark refunded",
        destructive: true,
      });
      if (!ok) return;
    }
    if (status === "CANCELLED") {
      const ok = await confirm({ title: "Cancel this free ad?", confirmLabel: "Cancel ad", destructive: true });
      if (!ok) return;
    }
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/ads/bookings/${ad.id}`, { status, ...(note ? { note } : {}) });
      toast.success("Updated");
      load(filter);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't update the ad.");
    }
  };

  const saveRates = async () => {
    if (!rates) return;
    setSavingRates(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const body = PLACEMENTS.flatMap(({ key }) =>
        (["PINCODE", "CITY"] as AreaType[]).flatMap((areaType) =>
          rates[key][areaType].map((monthlyPrice, i) => ({ placement: key, areaType, position: i + 1, monthlyPrice })),
        ),
      );
      const res = await apiClient.put<{ data: Rates }>("/admin/ads/rates", { rates: body });
      setRates(res.data);
      toast.success("Prices saved. New bookings use them.");
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save prices.");
    } finally {
      setSavingRates(false);
    }
  };

  const setRate = (key: AdPlacement, areaType: AreaType, i: number, value: string) => {
    if (!rates) return;
    const n = Math.max(0, Math.round(Number(value) || 0));
    setRates({ ...rates, [key]: { ...rates[key], [areaType]: rates[key][areaType].map((v, j) => (j === i ? n : v)) } });
  };

  return (
    <AdminPage
      title="Ads"
      subtitle="Paid spots shops booked, prices, and free ads"
      actions={
        <Button variant="secondary" size="md" onClick={() => setShowFree(true)}>
          <Gift className="h-4 w-4" aria-hidden /> Give a free ad
        </Button>
      }
    >
      {summary && !summary.paymentsEnabled && (
        <div className="mb-4">
          <Notice tone="warn" icon={<CircleAlert className="h-5 w-5 text-warn" aria-hidden />}>
            Online payment is off. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to the API to let shops pay.
          </Notice>
        </div>
      )}
      {summary && summary.paymentsEnabled && !summary.webhookEnabled && (
        <div className="mb-4">
          <Notice tone="warn" icon={<CircleAlert className="h-5 w-5 text-warn" aria-hidden />}>
            Razorpay webhook not set (RAZORPAY_WEBHOOK_SECRET). Payments still work, but if a shop closes the page right
            after paying, its ad waits for a manual check.
          </Notice>
        </div>
      )}

      {summary && (
        <div className="mb-6">
          <StatGrid>
            <StatTile label="Live now" value={summary.live} />
            <StatTile label="This month" value={rupee(summary.revenueThisMonth)} hint="Paid ads" />
            <StatTile label="All time" value={rupee(summary.totalRevenue)} />
            <StatTile
              label="Refunds due"
              value={summary.needsRefund}
              tone={summary.needsRefund > 0 ? "bad" : undefined}
            />
          </StatGrid>
        </div>
      )}

      <Toolbar>
        <Chips label="Filter ads" options={FILTERS} value={filter} onChange={setFilter} />
      </Toolbar>

      {loading ? (
        <LoadingBlock label="Loading ads…" />
      ) : ads.length === 0 ? (
        <EmptyBlock
          icon={<Megaphone className="h-6 w-6" aria-hidden />}
          title="No ads here"
          body="When shops book a spot, it shows here."
        />
      ) : (
        <>
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Shop</th>
                <th className={thClass}>Spot</th>
                <th className={thClass}>Dates</th>
                <th className={thClass}>Paid</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Seen / tapped</th>
                <th className={thClass} />
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const state = adState(ad.state);
                return (
                  <tr key={ad.id} className={trClass}>
                    <td className={tdClass}>
                      <p className="font-semibold">{ad.vendor?.businessName ?? "—"}</p>
                      <p className="text-[13px] text-label-2">{ad.vendor?.city}</p>
                    </td>
                    <td className={tdClass}>
                      <p>{ad.placementTitle}</p>
                      <p className="text-[13px] text-label-2">
                        {[areaLabel(ad), targetLabel(ad), `#${ad.position}`].filter(Boolean).join(" · ")}
                      </p>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>
                      {shortDate(ad.startDate)} – {shortDate(ad.endDate)}
                    </td>
                    <td className={tdClass}>{ad.amount > 0 ? rupee(ad.amount) : "Free"}</td>
                    <td className={tdClass}>
                      <Pill tone={state.tone}>{state.label}</Pill>
                    </td>
                    <td className={`${tdClass} tabular-nums`}>
                      {ad.impressions} / {ad.clicks} <span className="text-label-3">({tapRate(ad)})</span>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex justify-end gap-2">
                        {actionsFor(ad).map((a) => (
                          <Button
                            key={a.status}
                            size="md"
                            variant={a.danger ? "danger" : "secondary"}
                            className="whitespace-nowrap"
                            onClick={() => {
                              if (a.status === "PAUSED") {
                                setPauseReason("");
                                setPausing(ad);
                              } else changeStatus(ad, a.status);
                            }}
                          >
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>

          {/* Phones: one card per ad */}
          <div className="md:hidden">
            <List>
              {ads.map((ad) => {
                const state = adState(ad.state);
                return (
                  <div key={ad.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[16px] font-semibold text-label">{ad.vendor?.businessName}</p>
                        <p className="text-[14px] text-label-2">{ad.placementTitle}</p>
                      </div>
                      <Pill tone={state.tone}>{state.label}</Pill>
                    </div>
                    <p className="mt-1 text-[14px] text-label-2">
                      {[areaLabel(ad), targetLabel(ad), `#${ad.position}`].filter(Boolean).join(" · ")}
                    </p>
                    <p className="mt-1 text-[14px] text-label-2">
                      {shortDate(ad.startDate)} – {shortDate(ad.endDate)} · {ad.amount > 0 ? rupee(ad.amount) : "Free"}{" "}
                      · {ad.impressions} seen · {ad.clicks} tapped
                    </p>
                    {actionsFor(ad).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {actionsFor(ad).map((a) => (
                          <Button
                            key={a.status}
                            size="md"
                            variant={a.danger ? "danger" : "secondary"}
                            className="whitespace-nowrap"
                            onClick={() => {
                              if (a.status === "PAUSED") {
                                setPauseReason("");
                                setPausing(ad);
                              } else changeStatus(ad, a.status);
                            }}
                          >
                            {a.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </List>
          </div>
        </>
      )}

      {rates && (
        <section className="mt-10">
          <SectionHeader title="Prices (₹ for 30 days)" />
          <p className="mb-3 text-[14px] text-label-2">
            Shorter bookings pay for their days (7 days of ₹499 = ₹116). Changes apply to new bookings only.
          </p>
          <div className="overflow-x-auto rounded-2xl bg-card">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr>
                  <th className={thClass}>Spot</th>
                  {[1, 2, 3].map((p) => (
                    <th key={`pin${p}`} className={thClass}>
                      PIN #{p}
                    </th>
                  ))}
                  {[1, 2, 3].map((p) => (
                    <th key={`city${p}`} className={thClass}>
                      City #{p}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLACEMENTS.map(({ key, label }) => (
                  <tr key={key} className={trClass}>
                    <td className={`${tdClass} whitespace-nowrap font-semibold`}>{label}</td>
                    {(["PINCODE", "CITY"] as AreaType[]).flatMap((areaType) =>
                      rates[key][areaType].map((value, i) => (
                        <td key={`${areaType}${i}`} className="px-2 py-2">
                          <input
                            type="number"
                            min={1}
                            inputMode="numeric"
                            aria-label={`${label}, ${areaType === "CITY" ? "city" : "PIN"} position ${i + 1}`}
                            className={`${inputClass} h-10 w-24 px-3`}
                            value={value}
                            onChange={(e) => setRate(key, areaType, i, e.target.value)}
                          />
                        </td>
                      )),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Button onClick={saveRates} loading={savingRates} disabled={savingRates}>
              Save prices
            </Button>
          </div>
        </section>
      )}

      <Sheet
        open={Boolean(pausing)}
        onClose={() => setPausing(null)}
        title="Pause this ad?"
        description="It stops showing to shoppers but keeps its spot. The shop sees the reason."
        footer={
          <Button
            full
            variant="danger"
            onClick={async () => {
              if (!pausing) return;
              await changeStatus(pausing, "PAUSED", pauseReason.trim() || undefined);
              setPausing(null);
            }}
          >
            Pause ad
          </Button>
        }
      >
        <Field
          label="Reason for the shop"
          htmlFor="pause-reason"
          optional
          hint="e.g. Banner photo is not clear, please send a new one"
        >
          <textarea
            id="pause-reason"
            className={textareaClass}
            maxLength={300}
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
          />
        </Field>
      </Sheet>

      <FreeAdSheet
        open={showFree}
        onClose={() => setShowFree(false)}
        onDone={() => {
          setShowFree(false);
          load(filter);
        }}
      />
    </AdminPage>
  );
}

/** A free ad from LocalMart (launch offers, make-goods). Same slot rules as paid ones. */
function FreeAdSheet({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [shops, setShops] = useState<ShopOption[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [placement, setPlacement] = useState<AdPlacement>("SHOP_LIST");
  const [areaType, setAreaType] = useState<AreaType>("PINCODE");
  const [pincode, setPincode] = useState("");
  const [category, setCategory] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(todayIST());
  const [days, setDays] = useState(30);
  const [position, setPosition] = useState(1);
  const [bannerImage, setBannerImage] = useState("");
  const [bannerTitle, setBannerTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || shops.length > 0) return;
    (async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const res = await apiClient.get<{ data: ShopOption[] }>("/vendors");
        setShops(res.data ?? []);
      } catch {
        setShops([]);
      }
    })();
  }, [open, shops.length]);

  const shop = shops.find((s) => s.id === vendorId);

  const submit = async () => {
    setError(null);
    if (!shop) {
      setError("Pick a shop.");
      return;
    }
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post("/admin/ads/free", {
        vendorId,
        placement,
        areaType,
        pincode: areaType === "PINCODE" ? pincode || shop.pincode || undefined : undefined,
        category: placement === "SHOP_LIST" ? category : undefined,
        keyword: placement === "SEARCH" ? keyword : undefined,
        startDate,
        days,
        position,
        bannerImage: placement === "HOME_BANNER" ? bannerImage : undefined,
        bannerTitle: placement === "HOME_BANNER" ? bannerTitle || undefined : undefined,
      });
      toast.success(`Free ad given to ${shop.businessName}`);
      onDone();
    } catch (err) {
      setError(apiError(err).message || "Couldn't give the ad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Give a free ad"
      description="For launch offers or to make up for a problem. It follows the same spot rules as paid ads."
      footer={
        <div className="w-full space-y-3">
          {error && (
            <Notice tone="bad" icon={<CircleAlert className="h-5 w-5 text-bad" aria-hidden />}>
              <span role="alert">{error}</span>
            </Notice>
          )}
          <Button full onClick={submit} loading={saving} disabled={saving}>
            Give free ad
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <Field label="Shop" htmlFor="free-shop">
          <select
            id="free-shop"
            className={selectClass}
            value={vendorId}
            onChange={(e) => {
              setVendorId(e.target.value);
              setPincode(shops.find((s) => s.id === e.target.value)?.pincode ?? "");
              setCategory("ALL");
            }}
          >
            <option value="">Pick a shop</option>
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName} · {s.city}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Where" htmlFor="free-placement">
          <select
            id="free-placement"
            className={selectClass}
            value={placement}
            onChange={(e) => setPlacement(e.target.value as AdPlacement)}
          >
            {PLACEMENTS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Area" htmlFor="free-area">
          <select
            id="free-area"
            className={selectClass}
            value={areaType}
            onChange={(e) => setAreaType(e.target.value as AreaType)}
          >
            <option value="PINCODE">One PIN code</option>
            <option value="CITY">Whole city{shop ? ` (${shop.city})` : ""}</option>
          </select>
        </Field>
        {areaType === "PINCODE" && (
          <Field label="PIN code" htmlFor="free-pin" hint="Must be in the shop's city">
            <input
              id="free-pin"
              className={inputClass}
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            />
          </Field>
        )}
        {placement === "SHOP_LIST" && (
          <Field label="List" htmlFor="free-category">
            <select
              id="free-category"
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All shops</option>
              {shop && <option value={shop.businessType}>{SHOP_KIND[shop.businessType] ?? shop.businessType}</option>}
            </select>
          </Field>
        )}
        {placement === "SEARCH" && (
          <Field label="Search word" htmlFor="free-keyword">
            <input
              id="free-keyword"
              className={inputClass}
              value={keyword}
              maxLength={40}
              placeholder="e.g. saree"
              onChange={(e) => setKeyword(e.target.value)}
            />
          </Field>
        )}
        {placement === "HOME_BANNER" && (
          <>
            <Field label="Banner picture">
              <ImageUploader value={bannerImage} onChange={setBannerImage} uploadType="banners" allowUrlInput={false} />
            </Field>
            <Field label="Headline" htmlFor="free-banner-title" optional>
              <input
                id="free-banner-title"
                className={inputClass}
                value={bannerTitle}
                maxLength={60}
                onChange={(e) => setBannerTitle(e.target.value)}
              />
            </Field>
          </>
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Start" htmlFor="free-start">
            <input
              id="free-start"
              type="date"
              className={inputClass}
              value={startDate}
              min={todayIST()}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </Field>
          <Field label="Days" htmlFor="free-days">
            <select
              id="free-days"
              className={selectClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              {[7, 15, 30].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Position" htmlFor="free-position">
            <select
              id="free-position"
              className={selectClass}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
            >
              {[1, 2, 3].map((p) => (
                <option key={p} value={p}>
                  #{p}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>
    </Sheet>
  );
}
