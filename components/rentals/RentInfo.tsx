"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, ChevronRight, Loader2, MapPin, Minus, Phone, Plus, ShieldCheck, Store, Truck, Wallet } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useLocation } from "@/context/LocationContext";
import { Field, Toggle, inputClass } from "@/components/app/form";
import { StickyBar } from "@/components/app/ui";
import { signInHref } from "@/lib/auth/returnTo";
import { apiError } from "@/components/ads/adLabels";
import { shopAddress } from "@/app/(public)/products/[id]/ProductInfo";
import { UNIT, pieces, rateText, rupees, todayIST, unitCount, type RentQuote, type RentUnit } from "@/lib/rentals";

type Numeric = number | string;

interface Props {
  product: {
    id: string;
    name: string;
    price: Numeric;
    stockQuantity: number;
    averageRating: Numeric | null;
    reviewCount: number;
    rentUnit?: RentUnit | null;
    rentUnitLabel?: string | null;
    rentDeposit?: number | null;
    rentMinUnits?: number | null;
    operatorRate?: number | null;
    transportCharge?: number | null;
  };
  vendor: Parameters<typeof shopAddress>[0] & { contactPhone?: string | null };
}

const DRAFT_KEY = "lm_rent_draft";
const addDays = (d: string, n: number) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

/** − 300 + : big buttons for thumbs, and you can type a number */
function Stepper({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  id: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  const set = (n: number) => onChange(Math.min(max, Math.max(min, Math.round(n) || min)));
  return (
    <div className="flex h-12 items-center rounded-xl border border-hairline bg-fill">
      <button
        type="button"
        onClick={() => set(value - step)}
        disabled={value <= min}
        aria-label="Less"
        className="flex h-12 w-12 items-center justify-center text-label disabled:opacity-30 cursor-pointer"
      >
        <Minus className="h-5 w-5" aria-hidden />
      </button>
      <input
        id={id}
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")))}
        className="h-12 min-w-0 flex-1 bg-transparent text-center text-[18px] font-semibold tabular-nums text-label focus:outline-none"
      />
      <button
        type="button"
        onClick={() => set(value + step)}
        disabled={value >= max}
        aria-label="More"
        className="flex h-12 w-12 items-center justify-center text-label disabled:opacity-30 cursor-pointer"
      >
        <Plus className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

/**
 * Product page for something you rent (plates, a cutter, a mixer): pick the
 * dates and how many, see what's free and the full price, then ask the shop.
 */
export default function RentInfo({ product, vendor }: Props) {
  const address = shopAddress(vendor);
  const router = useRouter();
  const { user } = useAuth();
  const { location } = useLocation();
  const unit = (product.rentUnit ?? "DAY") as RentUnit;
  const u = UNIT[unit];
  const label = product.rentUnitLabel || null;
  const rate = Number(product.price);
  const minUnits = Math.max(1, product.rentMinUnits ?? 1);
  const owned = Math.max(1, product.stockQuantity);
  const big = owned >= 50; // plates and the like come in hundreds

  const [startDate, setStartDate] = useState(() => addDays(todayIST(), 1));
  const [units, setUnits] = useState(minUnits);
  const [quantity, setQuantity] = useState(big ? Math.min(100, owned) : 1);
  const [withOperator, setWithOperator] = useState(false);
  const [site, setSite] = useState({ fullName: "", phone: "", street: "", landmark: "", city: "", pincode: "" });
  const [note, setNote] = useState("");
  const [quote, setQuote] = useState<RentQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const restored = useRef(false);

  // Coming back from sign-in: put back what they had chosen. Otherwise take
  // the date and length picked on the shop page (?start=YYYY-MM-DD&units=N)
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      const d = raw ? JSON.parse(raw) : null;
      if (!d || d.productId !== product.id) {
        const q = new URLSearchParams(window.location.search);
        const start = q.get("start");
        if (start && /^\d{4}-\d{2}-\d{2}$/.test(start) && start >= todayIST() && start <= addDays(todayIST(), 90)) {
          setStartDate(start);
        }
        const n = Number(q.get("units"));
        const most = unit === "HOUR" ? 12 : unit === "DAY" ? 90 : unit === "WEEK" ? 26 : 12;
        if (Number.isInteger(n) && n > 0) setUnits(Math.min(Math.max(n, minUnits), most));
        return;
      }
      sessionStorage.removeItem(DRAFT_KEY);
      if (d.startDate >= todayIST()) setStartDate(d.startDate);
      setUnits(d.units);
      setQuantity(d.quantity);
      setWithOperator(!!d.withOperator);
      setSite(d.site);
      setNote(d.note ?? "");
    } catch {
      // nothing saved
    }
    // Runs once (the ref guards it); minUnits and unit come from the product
  }, [product.id, minUnits, unit]);

  // Fill in what we know, without overwriting what they typed
  useEffect(() => {
    setSite((s) => ({
      ...s,
      fullName: s.fullName || (user?.user_metadata?.full_name as string) || "",
      city: s.city || location?.city || vendor.city || "",
      pincode: s.pincode || location?.pincode || "",
    }));
  }, [user, location, vendor.city]);

  // Live price and free pieces for the chosen dates
  useEffect(() => {
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const q = new URLSearchParams({ startDate, units: String(units), quantity: String(quantity), withOperator: String(withOperator) });
        const res = await apiClient.get<{ data: RentQuote }>(`/rentals/items/${product.id}/quote?${q}`);
        setQuote(res.data);
        setQuoteError(null);
      } catch (err) {
        setQuote(null);
        setQuoteError(apiError(err).message || "Couldn't check these dates.");
      } finally {
        setChecking(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [product.id, startDate, units, quantity, withOperator]);

  const free = quote?.free ?? null;
  const enough = quote ? quote.enough : false;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!site.fullName.trim()) e.fullName = "Add your name";
    if (!/^[6-9]\d{9}$/.test(site.phone)) e.phone = "Add a 10-digit mobile number";
    if (!site.street.trim()) e.street = "Add the site address";
    if (!site.city.trim()) e.city = "Add the town";
    if (!/^\d{6}$/.test(site.pincode)) e.pincode = "Add a 6-digit PIN code";
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) document.getElementById(`rent-${first}`)?.focus();
    return !first;
  };

  const request = async () => {
    if (!quote || !enough) return;
    if (!user) {
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ productId: product.id, startDate, units, quantity, withOperator, site, note }));
      } catch {
        // private mode — they'll just pick again
      }
      toast("Sign in to book — your choices are saved");
      router.push(signInHref(`/products/${product.id}`));
      return;
    }
    if (!validate()) return;
    setSending(true);
    try {
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.post(`/rentals/bookings`, {
        productId: product.id,
        startDate,
        units,
        quantity,
        withOperator,
        siteAddress: { ...site, landmark: site.landmark || undefined },
        note: note.trim() || undefined,
      });
      toast.success("Booking sent to the shop · बुकिंग भेज दी");
      router.push("/my-rentals");
    } catch (err) {
      const e = apiError(err);
      if (e.isAuth) {
        router.push(signInHref(`/products/${product.id}`));
        return;
      }
      toast.error(e.message || "Couldn't send the booking. Please try again.");
      setSending(false);
    }
  };

  const price = quote?.price;
  const rating = product.averageRating ? Number(product.averageRating) : 0;
  const action = (
    <button
      type="button"
      onClick={request}
      disabled={!quote || !enough || sending}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
    >
      {sending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
      {sending ? "Sending…" : "Request booking"}
    </button>
  );

  const field = (key: keyof typeof site, labelText: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field label={labelText} htmlFor={`rent-${key}`} error={errors[key]} optional={key === "landmark"}>
      <input
        id={`rent-${key}`}
        value={site[key]}
        onChange={(e) => setSite((s) => ({ ...s, [key]: e.target.value }))}
        className={inputClass}
        {...props}
      />
    </Field>
  );

  const facts = useMemo(
    () =>
      [
        product.rentDeposit ? { icon: ShieldCheck, title: `Deposit ${rupees(product.rentDeposit)}${label ? ` a ${label}` : ""}`, text: "Given back when everything is returned" } : null,
        { icon: Truck, title: product.transportCharge ? `Transport ${rupees(product.transportCharge)}` : "Transport: ask the shop", text: product.transportCharge ? "Brought to your site and taken back" : "Call the shop for delivery to your site" },
        { icon: Wallet, title: "Pay the shop at the site", text: "Cash or UPI when it's delivered — no advance online" },
      ].filter(Boolean) as { icon: typeof Truck; title: string; text: string }[],
    [product.rentDeposit, product.transportCharge, label],
  );

  return (
    <div className="px-4 pt-4 lg:px-0 lg:pt-0">
      <Link href={`/stores/${vendor.id}`} className="inline-flex max-w-full items-center gap-1 text-[14px] font-medium text-label-2 hover:text-label">
        <Store className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate">{vendor.businessName}</span>
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>

      <p className="mt-2 inline-flex rounded-full bg-tint-soft px-2.5 py-1 text-[12px] font-semibold text-tint">On rent · किराये पर</p>
      <h1 className="mt-1.5 text-[22px] font-bold leading-snug text-label sm:text-[28px]">{product.name}</h1>
      {rating > 0 && product.reviewCount > 0 && (
        <a href="#reviews" className="mt-1 inline-flex items-center gap-1 text-[14px] text-label-2 hover:underline">
          <span className="rounded-md bg-ok px-1.5 py-0.5 text-[13px] font-semibold text-white">{rating.toFixed(1)} ★</span>
          {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
        </a>
      )}

      <p className="mt-3 text-[26px] font-bold tabular-nums text-label">{rateText(rate, unit, label)}</p>
      <p className="text-[14px] text-label-2">
        {owned.toLocaleString("en-IN")} {label ? (owned === 1 ? label : `${label}s`) : "available"} with the shop
        {minUnits > 1 ? ` · at least ${unitCount(minUnits, unit)}` : ""}
        {product.operatorRate ? ` · operator ${rupees(product.operatorRate)}${u.per}` : ""}
      </p>

      {/* Booking */}
      <section className="mt-5 space-y-4 rounded-2xl border border-hairline p-4">
        <h2 className="flex items-center gap-2 text-[17px] font-bold text-label">
          <CalendarDays className="h-5 w-5 text-tint" aria-hidden /> Book it · बुक करें
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" htmlFor="rent-start">
            <input
              id="rent-start"
              type="date"
              value={startDate}
              min={todayIST()}
              max={addDays(todayIST(), 90)}
              onChange={(e) => e.target.value && setStartDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label={`How many ${u.many}`} htmlFor="rent-units">
            <Stepper id="rent-units" value={units} onChange={setUnits} min={minUnits} max={unit === "HOUR" ? 12 : unit === "DAY" ? 90 : unit === "WEEK" ? 26 : 12} />
          </Field>
        </div>
        <Field
          label={label ? `How many ${label}s` : "How many"}
          htmlFor="rent-qty"
          hint={
            checking ? "Checking…" : free !== null ? (
              <span className={enough ? "text-ok" : "text-bad"}>
                {free === 0 ? "None free on these dates" : `${pieces(free, label)} free on these dates`}
                {quote && ` · ${quote.firstDay === quote.lastDay ? `on ${quote.firstDay.split("-").reverse().join("/")}` : `till ${quote.lastDay.split("-").reverse().join("/")}`}`}
              </span>
            ) : quoteError ? <span className="text-bad">{quoteError}</span> : undefined
          }
        >
          <Stepper id="rent-qty" value={quantity} onChange={setQuantity} min={1} max={owned} step={big ? 10 : 1} />
        </Field>
        {product.operatorRate ? (
          <Toggle
            checked={withOperator}
            onChange={setWithOperator}
            label="Send someone to run it"
            description={`Operator ${rupees(product.operatorRate)}${u.per} for each machine`}
          />
        ) : null}

        {price && (
          <dl className="space-y-1.5 rounded-xl bg-fill p-3 text-[15px]">
            <div className="flex justify-between gap-3">
              <dt className="text-label-2">
                Rent · {pieces(quantity, label)} × {unitCount(units, unit)}
              </dt>
              <dd className="tabular-nums text-label">{rupees(price.rent)}</dd>
            </div>
            {price.operator > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-label-2">Operator</dt>
                <dd className="tabular-nums text-label">{rupees(price.operator)}</dd>
              </div>
            )}
            {price.transport > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-label-2">Transport</dt>
                <dd className="tabular-nums text-label">{rupees(price.transport)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-hairline pt-1.5 font-bold">
              <dt className="text-label">To pay the shop</dt>
              <dd className="tabular-nums text-label">{rupees(price.total)}</dd>
            </div>
            {price.deposit > 0 && (
              <div className="flex justify-between gap-3 text-[14px]">
                <dt className="text-label-2">+ Deposit, given back after return</dt>
                <dd className="tabular-nums text-label-2">{rupees(price.deposit)}</dd>
              </div>
            )}
          </dl>
        )}
      </section>

      {/* Where to deliver */}
      <section className="mt-4 space-y-3 rounded-2xl border border-hairline p-4">
        <h2 className="text-[17px] font-bold text-label">Site address · साइट का पता</h2>
        {field("fullName", "Your name", { autoComplete: "name", placeholder: "e.g. Ravi Kushwah" })}
        {field("phone", "Mobile number", { inputMode: "numeric", autoComplete: "tel-national", maxLength: 10, placeholder: "10-digit mobile number" })}
        {field("street", "Site address", { placeholder: "Plot no., street, area" })}
        {field("landmark", "Landmark", { placeholder: "e.g. Near Hanuman Mandir" })}
        <div className="grid grid-cols-2 gap-3">
          {field("city", "Town")}
          {field("pincode", "PIN code", { inputMode: "numeric", maxLength: 6 })}
        </div>
        <Field label="Anything the shop should know" htmlFor="rent-note" optional>
          <input
            id="rent-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="e.g. 2nd floor slab, call before coming"
          />
        </Field>
      </section>

      {/* Desktop: ask right here. Phones use the bar at the bottom. */}
      <div className="mt-4 hidden lg:block">{action}</div>
      <p className="mt-2 text-[13px] text-label-2">The shop calls you to confirm. Nothing to pay now.</p>

      <ul className="mt-5 divide-y divide-hairline rounded-2xl border border-hairline">
        {facts.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3 p-4">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-label" aria-hidden />
            <span>
              <span className="block text-[15px] font-semibold text-label">{title}</span>
              <span className="block text-[14px] text-label-2">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      {/* The shop */}
      <div className="mt-4 rounded-2xl bg-fill p-4">
        <p className="text-[13px] text-label-2">Rented out by</p>
        <Link href={`/stores/${vendor.id}`} className="mt-2 flex items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card">
            {vendor.storeLogo ? <Image src={vendor.storeLogo} alt="" fill sizes="48px" className="object-cover" /> : <Store className="h-5 w-5 text-label-2" aria-hidden />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-label">{vendor.businessName}</span>
            {address && (
              <span className="mt-0.5 flex items-start gap-1 text-[13px] text-label-2">
                <MapPin className="mt-[2px] h-3.5 w-3.5 shrink-0" aria-hidden />
                {address}
              </span>
            )}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
        </Link>
        {vendor.contactPhone && (
          <a
            href={`tel:${vendor.contactPhone}`}
            className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label"
          >
            <Phone className="h-4 w-4" aria-hidden /> Call shop
          </a>
        )}
      </div>

      <div className="lg:hidden">
        <StickyBar aboveTabBar>
          <div className="min-w-0 shrink-0">
            <p className="text-[18px] font-bold leading-tight tabular-nums text-label">{price ? rupees(price.total) : "—"}</p>
            <p className="text-[12px] text-label-2">{price && price.deposit > 0 ? `+ ${rupees(price.deposit)} deposit` : "pay at the site"}</p>
          </div>
          <div className="min-w-0 flex-1">{action}</div>
        </StickyBar>
      </div>
    </div>
  );
}
