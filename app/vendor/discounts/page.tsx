"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Share2, TicketPercent } from "lucide-react";
import { Button, LargeTitle, Notice, Page, Pill, formatDateIST, rupees } from "@/components/app/ui";
import { Field, RupeeInput, Segmented, Toggle, inputClass } from "@/components/app/form";
import { IconBox } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import { ShareLinkSheet } from "@/components/share/ShareLinkSheet";
import { apiError } from "@/components/ads/adLabels";
import { signInHref } from "@/lib/auth/returnTo";
import { CODE_PATTERN, CODE_STATE, MAX_PERCENT, codeShareText, normaliseCode, offerWords } from "@/lib/offers";
import { siteOrigin } from "@/lib/shopHandle";
import type { ShopDiscountCode } from "@/lib/api/client";

type Shop = { id: string; name: string; handle: string | null };

/** Ready-made codes to start from — tap one and change it if you like */
const IDEAS = [
  { code: "INSTA10", kind: "PERCENT" as const, value: 10, why: "For your Instagram followers" },
  { code: "WELCOME50", kind: "FLAT" as const, value: 50, why: "For a first order" },
  { code: "FESTIVE15", kind: "PERCENT" as const, value: 15, why: "For a festival sale" },
];

/**
 * Discount codes: a shop posts INSTA10 on Instagram or its WhatsApp status,
 * buyers type it when ordering. Each code shows how many orders it brought.
 */
export default function DiscountCodesPage() {
  const router = useRouter();
  const [storeQuery, setStoreQuery] = useState("");
  const [shop, setShop] = useState<Shop | null>(null);
  const [codes, setCodes] = useState<ShopDiscountCode[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partial<ShopDiscountCode> | null>(null);
  const [sharing, setSharing] = useState<ShopDiscountCode | null>(null);

  const load = useCallback(async () => {
    const storeId = new URLSearchParams(window.location.search).get("storeId");
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : "";
    setStoreQuery(q);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.get<{ data: { shop: Shop; codes: ShopDiscountCode[] } }>(`/vendor/discount-codes${q}`);
      setShop(r.data.shop);
      setCodes(r.data.codes);
      setError(null);
    } catch (err) {
      if (apiError(err).isAuth) return router.push(signInHref("/vendor/discounts"));
      if ((err as { status?: number })?.status === 403) return setError("This page is for shop owners.");
      setError(apiError(err).message || "Couldn't load your codes. Please try again.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const saved = (c: ShopDiscountCode) =>
    setCodes((prev) => {
      const list = prev ?? [];
      const old = list.find((x) => x.id === c.id);
      // A change keeps the code's order numbers
      const next = old ? { ...c, orders: old.orders, sales: old.sales } : c;
      return old ? list.map((x) => (x.id === c.id ? next : x)) : [next, ...list];
    });

  const toggle = async (c: ShopDiscountCode, on: boolean) => {
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = await apiClient.patch<{ data: ShopDiscountCode }>(`/vendor/discount-codes/${c.id}${storeQuery}`, { isActive: on });
      saved(r.data);
      toast.success(on ? `${c.code} is on` : `${c.code} is off — buyers can't use it`);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't change it. Please try again.");
    }
  };

  const shopUrl = shop ? (shop.handle ? `${siteOrigin()}/${shop.handle}` : `${siteOrigin()}/stores/${shop.id}`) : "";

  return (
    <Page>
      <LargeTitle
        title="Discount codes"
        subtitle="Post a code, get orders · ऑफ़र कोड"
        back={{ href: `/vendor/dashboard${storeQuery}`, label: "Home" }}
      />

      <Button full className="mb-6" onClick={() => setEditing({})} disabled={!shop}>
        <Plus className="h-5 w-5" strokeWidth={2.4} aria-hidden /> New code
      </Button>

      {error && <Notice tone="bad">{error}</Notice>}
      {!codes && !error && (
        <div className="space-y-3" aria-busy="true" aria-label="Loading">
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
          <div className="h-32 animate-pulse rounded-2xl bg-card" />
        </div>
      )}

      {codes && codes.length === 0 && (
        <section className="rounded-2xl bg-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <IconBox tone="brand">
              <TicketPercent className="h-5 w-5" />
            </IconBox>
            <h2 className="text-[17px] font-semibold leading-snug text-label">How codes bring orders</h2>
          </div>
          <p className="text-[15px] leading-snug text-label-2">
            Post a code like <b className="text-label">INSTA10</b> on Instagram or your WhatsApp status. Buyers type it when they order and
            get the discount. You&apos;ll see how many orders each code brought.
          </p>
          <p className="mb-2 mt-5 text-[14px] font-semibold text-label-2">Start with one of these</p>
          <div className="grid gap-2">
            {IDEAS.map((i) => (
              <button
                key={i.code}
                type="button"
                onClick={() => setEditing({ code: i.code, kind: i.kind, value: i.value })}
                className="flex min-h-[56px] items-center gap-3 rounded-xl border border-hairline px-3 text-left active:bg-fill cursor-pointer"
              >
                <span className="font-mono text-[16px] font-bold tracking-wide text-label">{i.code}</span>
                <span className="min-w-0 flex-1 text-[14px] text-label-2">
                  {offerWords(i.kind, i.value)} · {i.why}
                </span>
                <Plus className="h-5 w-5 shrink-0 text-tint" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}

      {codes && codes.length > 0 && (
        <ul className="space-y-3">
          {codes.map((c) => {
            const st = CODE_STATE[c.state];
            const limits = [
              c.minOrder ? `on ₹${c.minOrder}+` : null,
              c.endsAt ? `${c.state === "ENDED" ? "Ended" : "till"} ${formatDateIST(c.endsAt)}` : null,
              c.maxUses ? `${c.usedCount} of ${c.maxUses} used` : null,
              c.oncePerBuyer ? "once per buyer" : null,
            ].filter(Boolean);
            return (
              <li key={c.id} className="rounded-2xl bg-card p-4">
                <div className="flex items-center gap-3">
                  <span className="min-w-0 flex-1 truncate font-mono text-[22px] font-bold tracking-wide text-label">{c.code}</span>
                  <Pill tone={st.tone}>{st.label}</Pill>
                </div>
                <p className="mt-0.5 text-[16px] font-medium text-label">{c.text}</p>
                {limits.length > 0 && <p className="text-[14px] text-label-2">{limits.join(" · ")}</p>}
                <p className={`mt-2 text-[15px] font-semibold tabular-nums ${c.orders > 0 ? "text-ok" : "text-label-3"}`}>
                  {c.orders > 0 ? `${c.orders} order${c.orders > 1 ? "s" : ""} · ${rupees(c.sales)}` : "No orders with it yet"}
                </p>

                <div className="mt-3 border-t border-hairline pt-1">
                  <Toggle
                    checked={c.isActive}
                    onChange={(on) => toggle(c, on)}
                    label={c.isActive ? "Buyers can use it" : "Turned off"}
                    description={c.state === "ENDED" && c.isActive ? "Its end date has passed — change it to use again" : undefined}
                  />
                </div>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSharing(c)}
                    disabled={c.state !== "ON"}
                    className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-tint-soft px-3 text-[15px] font-semibold text-tint cursor-pointer active:opacity-70 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Share2 className="h-4 w-4" aria-hidden /> Share
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(c)}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-fill px-4 text-[15px] font-medium text-label cursor-pointer active:bg-fill-strong"
                  >
                    <Pencil className="h-4 w-4" aria-hidden /> Change
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editing && (
        <CodeSheet
          initial={editing}
          storeQuery={storeQuery}
          onClose={() => setEditing(null)}
          onSaved={(c) => {
            saved(c);
            setEditing(null);
            if (!editing.id) setSharing(c);
          }}
        />
      )}

      {sharing && shop && (
        <ShareLinkSheet
          open
          onClose={() => setSharing(null)}
          title={`Share ${sharing.code}`}
          description="Post it on your status, story or in chats"
          url={shopUrl}
          message={codeShareText({ code: sharing.code, words: sharing.text, minOrder: sharing.minOrder, shopName: shop.name, url: shopUrl })}
          instagram={codeShareText({ code: sharing.code, words: sharing.text, minOrder: sharing.minOrder, shopName: shop.name, url: shopUrl })}
        />
      )}
    </Page>
  );
}

type Ends = "NEVER" | "7" | "30" | "DATE";
type Limit = "NONE" | "LIMIT";

/** "2026-11-07" — a date in India time, so days don't shift near midnight */
const istDate = (d: Date) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10);
/** End of that day in India */
const endOfDayIST = (date: string) => new Date(`${date}T23:59:59+05:30`).toISOString();

/** New code, or change one (everything but the code itself) */
function CodeSheet({
  initial,
  storeQuery,
  onClose,
  onSaved,
}: {
  initial: Partial<ShopDiscountCode>;
  storeQuery: string;
  onClose: () => void;
  onSaved: (c: ShopDiscountCode) => void;
}) {
  const isNew = !initial.id;
  const [code, setCode] = useState(initial.code ?? "");
  const [kind, setKind] = useState<"PERCENT" | "FLAT">(initial.kind ?? "PERCENT");
  const [value, setValue] = useState(initial.value ? String(initial.value) : "");
  const [maxOff, setMaxOff] = useState(initial.maxOff ? String(initial.maxOff) : "");
  const [minOrder, setMinOrder] = useState(initial.minOrder ? String(initial.minOrder) : "");
  const [ends, setEnds] = useState<Ends>(initial.endsAt ? "DATE" : "NEVER");
  const [date, setDate] = useState(initial.endsAt ? istDate(new Date(initial.endsAt)) : "");
  const [limit, setLimit] = useState<Limit>(initial.maxUses ? "LIMIT" : "NONE");
  const [maxUses, setMaxUses] = useState(initial.maxUses ? String(initial.maxUses) : "");
  const [oncePerBuyer, setOncePerBuyer] = useState(initial.oncePerBuyer ?? true);
  const [saving, setSaving] = useState(false);
  const [tried, setTried] = useState(false);

  const n = Number(value) || 0;
  const norm = normaliseCode(code);
  const today = istDate(new Date());
  const problems = {
    code: isNew && !CODE_PATTERN.test(norm) ? "3 to 15 letters or numbers, like INSTA10" : null,
    value: !(n > 0) ? "Enter the discount" : kind === "PERCENT" && n > MAX_PERCENT ? `Up to ${MAX_PERCENT}% only` : null,
    minOrder: kind === "FLAT" && Number(minOrder) > 0 && n >= Number(minOrder) ? "The discount must be less than the minimum order" : null,
    date: ends === "DATE" && (!date || date < today) ? "Pick today or a later date" : null,
    maxUses: limit === "LIMIT" && !(Number(maxUses) > 0) ? "How many orders can use it?" : null,
  };
  const bad = Object.values(problems).some(Boolean);
  const show = (k: keyof typeof problems) => (tried ? problems[k] : null);

  const save = async () => {
    setTried(true);
    if (bad) return;
    const endsAt =
      ends === "NEVER" ? null : ends === "DATE" ? endOfDayIST(date) : endOfDayIST(istDate(new Date(Date.now() + Number(ends) * 86400000)));
    const body = {
      kind,
      value: n,
      maxOff: kind === "PERCENT" && Number(maxOff) > 0 ? Number(maxOff) : null,
      minOrder: Number(minOrder) > 0 ? Number(minOrder) : null,
      endsAt,
      maxUses: limit === "LIMIT" ? Number(maxUses) : null,
      oncePerBuyer,
    };
    setSaving(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      const r = isNew
        ? await apiClient.post<{ data: ShopDiscountCode }>(`/vendor/discount-codes${storeQuery}`, { ...body, code: norm })
        : await apiClient.patch<{ data: ShopDiscountCode }>(`/vendor/discount-codes/${initial.id}${storeQuery}`, body);
      toast.success(isNew ? `${r.data.code} is ready — share it` : `${r.data.code} saved`);
      onSaved(r.data);
    } catch (err) {
      toast.error(apiError(err).message || "Couldn't save the code. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={isNew ? "New discount code" : `Change ${initial.code}`}
      footer={
        <Button full onClick={save} loading={saving} disabled={saving}>
          {isNew ? "Make code" : "Save"}
        </Button>
      }
    >
      <div className="space-y-5">
        {isNew && (
          <Field label="Code" htmlFor="code" error={show("code")} hint="Buyers type this when they order">
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15))}
              placeholder="INSTA10"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={!!show("code")}
              className={`${inputClass} font-mono text-[18px] font-bold tracking-wide`}
            />
          </Field>
        )}

        <div>
          <p className="mb-1.5 text-[15px] font-semibold text-label">Discount</p>
          <Segmented<"PERCENT" | "FLAT">
            label="Kind of discount"
            value={kind}
            onChange={(k) => {
              setKind(k);
              setValue("");
            }}
            options={[
              { value: "PERCENT", label: "% off" },
              { value: "FLAT", label: "₹ off" },
            ]}
          />
          <div className="relative mt-2">
            {kind === "FLAT" && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">₹</span>}
            <input
              inputMode="numeric"
              aria-label={kind === "PERCENT" ? "Percent off" : "Rupees off"}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={kind === "PERCENT" ? "10" : "50"}
              aria-invalid={!!show("value")}
              className={`${inputClass} tabular-nums ${kind === "FLAT" ? "pl-8" : "pr-10"}`}
            />
            {kind === "PERCENT" && <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16px] text-label-2">%</span>}
          </div>
          {show("value") && <p className="mt-1.5 text-[14px] text-bad">{show("value")}</p>}
        </div>

        {kind === "PERCENT" && (
          <Field label="Most it can save" htmlFor="max-off" optional hint={`e.g. 10% off, up to ₹100`}>
            <RupeeInput id="max-off" value={maxOff} onChange={(e) => setMaxOff(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="No limit" />
          </Field>
        )}

        <Field label="Only on orders above" htmlFor="min-order" optional error={show("minOrder")}>
          <RupeeInput id="min-order" value={minOrder} onChange={(e) => setMinOrder(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder="Any order" />
        </Field>

        <div>
          <p className="mb-1.5 text-[15px] font-semibold text-label">Ends</p>
          <Segmented<Ends>
            label="When the code ends"
            value={ends}
            onChange={setEnds}
            options={[
              { value: "NEVER", label: "Never" },
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "DATE", label: "Date" },
            ]}
          />
          {ends === "DATE" && (
            <input
              type="date"
              aria-label="Last day"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!show("date")}
              className={`${inputClass} mt-2`}
            />
          )}
          {show("date") && <p className="mt-1.5 text-[14px] text-bad">{show("date")}</p>}
        </div>

        <div>
          <p className="mb-1.5 text-[15px] font-semibold text-label">How many orders</p>
          <Segmented<Limit>
            label="How many orders can use it"
            value={limit}
            onChange={setLimit}
            options={[
              { value: "NONE", label: "No limit" },
              { value: "LIMIT", label: "First few" },
            ]}
          />
          {limit === "LIMIT" && (
            <input
              inputMode="numeric"
              aria-label="Number of orders"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="e.g. 50"
              aria-invalid={!!show("maxUses")}
              className={`${inputClass} mt-2 tabular-nums`}
            />
          )}
          {show("maxUses") && <p className="mt-1.5 text-[14px] text-bad">{show("maxUses")}</p>}
        </div>

        <Toggle
          checked={oncePerBuyer}
          onChange={setOncePerBuyer}
          label="Once per buyer"
          description="Each buyer can use it one time"
        />

        {n > 0 && !problems.value && (
          <p className="rounded-xl bg-fill px-4 py-3 text-[15px] text-label">
            Buyers see: <b>{isNew ? norm || "CODE" : initial.code}</b> · {offerWords(kind, n, Number(maxOff) || null)}
            {Number(minOrder) > 0 ? ` on ₹${minOrder}+` : ""}
          </p>
        )}
      </div>
    </Sheet>
  );
}
