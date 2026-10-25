"use client";

/**
 * Shop page for construction shops: shuttering / centering plates, machines
 * on rent (mixer, vibrator, cutter…) and building material.
 *
 * Built after the big equipment-rental sites (United Rentals, Sunbelt, HSS):
 * a dark "site" hero with a quick-hire bar, plain equipment cards that show
 * the real rate, deposit, operator and transport charges, how renting works,
 * and how to reach the yard. Every claim comes from the shop's own data.
 */

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Barlow_Condensed } from "next/font/google";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock,
  HardHat,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Truck,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import AddStepper from "@/components/cart/AddStepper";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import { imageList } from "@/lib/shop-page";
import { UNIT, rupees, todayIST, type RentUnit } from "@/lib/rentals";

const ShopMap = dynamic(() => import("@/components/map/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#2A2F36]" />,
});

const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], display: "swap" });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Numeric = number | string;

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: Numeric;
  compareAtPrice?: Numeric | null;
  images: unknown;
  stockQuantity: number;
  vendorId: string;
  averageRating?: Numeric | null;
  reviewCount?: number;
  tags?: string[] | null;
  isFeatured?: boolean;
  category?: { name: string; slug?: string } | string | null;
  listingType?: "SALE" | "RENT" | null;
  rentUnit?: RentUnit | null;
  rentUnitLabel?: string | null;
  rentDeposit?: Numeric | null;
  rentMinUnits?: number | null;
  operatorRate?: Numeric | null;
  transportCharge?: Numeric | null;
}

interface Address {
  street?: string;
  landmark?: string;
  zip?: string;
  coordinates?: { lat: number; lng: number };
  coordinatesSource?: string;
}

interface Vendor {
  id: string;
  businessName: string;
  businessType?: string;
  storeDescription?: string | null;
  storeLogo?: string | null;
  storeImages?: unknown;
  contactPhone?: string | null;
  whatsappNumber?: string | null;
  businessAddress?: Address | string | null;
  city?: string | null;
  locality?: string | null;
  pincode?: string | null;
  businessHours?: BusinessHours | null;
  averageRating?: Numeric | null;
  reviewCount?: number;
  canDeliver?: boolean | null;
  maxDeliveryDistance?: number | null;
  upiId?: string | null;
}

interface Props {
  vendor: Vendor;
  products: Product[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const YELLOW = "#FFC21A";
const HAZARD = { backgroundImage: `repeating-linear-gradient(-45deg, ${YELLOW} 0 12px, #121417 12px 24px)` };
const BLUEPRINT = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

const num = (v: Numeric | null | undefined) => (v == null || v === "" ? 0 : Number(v) || 0);
const isRent = (p: Product) => p.listingType === "RENT";
const unitOf = (p: Product): RentUnit => (p.rentUnit ?? "DAY") as RentUnit;

function categoryName(p: Product): string | null {
  const name = typeof p.category === "string" ? p.category : p.category?.name;
  return name?.trim() || null;
}

/** "₹1,200" + "/day · a machine" */
function rateParts(p: Product) {
  const u = UNIT[unitOf(p)];
  return { price: rupees(num(p.price)), per: `${u.per}${p.rentUnitLabel ? ` · a ${p.rentUnitLabel}` : ""}` };
}

const addDays = (d: string, n: number) =>
  new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

/** Indian mobile number → digits for tel: and wa.me */
function phoneDigits(raw?: string | null) {
  const d = (raw || "").replace(/\D/g, "");
  if (!d) return null;
  return d.length === 10 ? `91${d}` : d;
}

function addressOf(v: Vendor): Address {
  return v.businessAddress && typeof v.businessAddress === "object" ? v.businessAddress : {};
}

function addressLine(v: Vendor) {
  const a = addressOf(v);
  const street = typeof v.businessAddress === "string" ? v.businessAddress : a.street;
  const parts: string[] = [];
  for (const p of [street, v.locality, v.city]) {
    if (p && !parts.join(", ").toLowerCase().includes(p.toLowerCase())) parts.push(p);
  }
  return parts.join(", ");
}

/** An exact pin (not one guessed from the PIN code) */
function exactPin(v: Vendor) {
  const a = addressOf(v);
  const c = a.coordinates;
  return c?.lat && c?.lng && a.coordinatesSource !== "pincode" ? c : null;
}

function directionsUrl(v: Vendor) {
  const pin = exactPin(v);
  const query = pin ? `${pin.lat},${pin.lng}` : `${v.businessName}, ${addressLine(v)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function todayHours(hours: BusinessHours | null | undefined): string | null {
  if (!hours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const day = days[new Date().getDay()];
  const t = hours[day] || hours[day.charAt(0).toUpperCase() + day.slice(1)];
  if (!t) return null;
  if (!t.isOpen) return "Closed today";
  const fmt = (hm: string) => {
    const [h, m] = hm.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${ampm}`;
  };
  return `${fmt(t.open)} – ${fmt(t.close)}`;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

function SectionTitle({ kicker, title, hindi, id }: { kicker: string; title: string; hindi?: string; id?: string }) {
  return (
    <div>
      <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#8A6A00]">
        <span className="h-[3px] w-6 rounded-full" style={{ background: YELLOW }} aria-hidden />
        {kicker}
      </p>
      <h2 id={id} className={`${display.className} mt-1.5 text-[32px] font-bold leading-[1.02] text-[#121417] sm:text-[40px]`}>
        {title}
      </h2>
      {hindi && <p className="mt-1 text-[15px] text-[#5C6169]">{hindi}</p>}
    </div>
  );
}

function ProductPhoto({ p, sizes, className = "" }: { p: Product; sizes: string; className?: string }) {
  const src = imageList(p.images)[0];
  if (!src) {
    return (
      <div className={`flex h-full w-full items-center justify-center text-[#A3A7AD] ${className}`}>
        {isRent(p) ? <Wrench className="h-10 w-10" aria-hidden /> : <Package className="h-10 w-10" aria-hidden />}
      </div>
    );
  }
  // Shop photos are usually full-frame phone pictures — fill the tile
  return <Image src={src} alt={p.name} fill sizes={sizes} className={`object-cover ${className}`} />;
}

function Fact({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#F2F1ED] px-2 py-1 text-[12.5px] font-medium text-[#3A3F46]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-[#5C6169]" aria-hidden />
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Equipment card
// ---------------------------------------------------------------------------

function EquipmentCard({ p, vendorName }: { p: Product; vendorName: string }) {
  const rent = isRent(p);
  const href = `/products/${p.id}`;
  const cat = categoryName(p);
  const out = p.stockQuantity <= 0;
  const u = UNIT[unitOf(p)];
  const price = num(p.price);
  const mrp = num(p.compareAtPrice);
  const label = p.rentUnitLabel;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#E3E1DB] transition-shadow hover:shadow-[0_10px_30px_-12px_rgba(18,20,23,0.35)]">
      <Link href={href} className="flex flex-1 gap-3 p-3 sm:flex-col sm:gap-0 sm:p-0">
        <div className="relative aspect-square w-[118px] shrink-0 self-start overflow-hidden rounded-xl bg-[#F2F1ED] sm:aspect-[4/3] sm:w-full sm:rounded-none">
          <ProductPhoto p={p} sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 118px" className="transition-transform duration-300 group-hover:scale-[1.04]" />
          <span
            className={`absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide sm:left-3 sm:top-3 sm:text-[11.5px] ${
              rent ? "bg-[#121417] text-white" : "bg-white text-[#121417] ring-1 ring-[#E3E1DB]"
            }`}
          >
            {rent ? "On rent" : "For sale"}
          </span>
        </div>

        <div className="min-w-0 flex-1 sm:px-4 sm:pt-3.5">
          {cat && !/^on rent$/i.test(cat) && (
            <p className="truncate text-[11.5px] font-bold uppercase tracking-[0.12em] text-[#8A6A00]">{cat}</p>
          )}
          <h3 className={`${display.className} text-[22px] font-bold leading-[1.05] text-[#121417] sm:text-[24px]`}>{p.name}</h3>
          {p.description && <p className="mt-0.5 line-clamp-2 text-[13.5px] leading-snug text-[#5C6169]">{p.description}</p>}

          <p className="mt-2 flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
            {!rent && <span className="sr-only">Price</span>}
            <span className="text-[22px] font-extrabold leading-none text-[#121417]">{rupees(price)}</span>
            {rent ? (
              <span className="text-[13.5px] font-medium text-[#5C6169]">
                {u.per}
                {label ? ` · a ${label}` : ""}
              </span>
            ) : (
              mrp > price && <span className="text-[13.5px] text-[#8D9198] line-through">{rupees(mrp)}</span>
            )}
          </p>

          {rent && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {num(p.rentDeposit) > 0 && <Fact icon={ShieldCheck}>Deposit {rupees(num(p.rentDeposit))}</Fact>}
              {num(p.operatorRate) > 0 && (
                <Fact icon={HardHat}>
                  Operator {rupees(num(p.operatorRate))}
                  {u.per}
                </Fact>
              )}
              {num(p.transportCharge) > 0 && <Fact icon={Truck}>Transport {rupees(num(p.transportCharge))}</Fact>}
              {(p.rentMinUnits ?? 1) > 1 && (
                <Fact icon={CalendarDays}>
                  Min {p.rentMinUnits} {u.many}
                </Fact>
              )}
            </div>
          )}
        </div>
      </Link>

      <div className="mt-auto px-3 pb-3 sm:px-4 sm:pb-4 sm:pt-3">
        {rent ? (
          out ? (
            <p className="flex h-12 items-center justify-center rounded-xl bg-[#F2F1ED] text-[15px] font-semibold text-[#8D9198]">
              Not available now
            </p>
          ) : (
            <Link
              href={href}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#121417] text-[16px] font-bold text-white transition-colors hover:bg-[#2A2F36] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121417]"
            >
              Book · बुक करें
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )
        ) : (
          <AddStepper
            size="lg"
            disabled={out}
            item={{
              id: p.id,
              name: p.name,
              price,
              image: imageList(p.images)[0],
              stockQuantity: p.stockQuantity,
              vendorId: p.vendorId,
              vendorName,
            }}
          />
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Quick hire bar — pick a machine, a date and how long; the booking opens filled in
// ---------------------------------------------------------------------------

function QuickHire({ items }: { items: Product[] }) {
  const [id, setId] = useState(items[0]?.id ?? "");
  const [start, setStart] = useState("");
  const [units, setUnits] = useState(1);
  const item = items.find((i) => i.id === id) ?? items[0];
  const unit = unitOf(item);
  const min = Math.max(1, item.rentMinUnits ?? 1);
  const most = unit === "HOUR" ? 12 : unit === "DAY" ? 90 : unit === "WEEK" ? 26 : 12;

  // Dates depend on the shopper's clock — set after mount so the server render matches
  useEffect(() => setStart(addDays(todayIST(), 1)), []);
  useEffect(() => setUnits((n) => Math.min(Math.max(n, min), most)), [min, most]);

  const today = start ? todayIST() : "";
  const href = `/products/${item.id}?${new URLSearchParams({ ...(start ? { start } : {}), units: String(units) })}`;
  const field = "h-12 w-full rounded-xl border border-[#D9D6CF] bg-white px-3 text-[16px] text-[#121417] outline-none focus:border-[#121417] focus:ring-2 focus:ring-[#121417]/15";

  return (
    <div className="rounded-2xl bg-white p-3 shadow-[0_18px_50px_-20px_rgba(18,20,23,0.55)] ring-1 ring-[#E3E1DB] sm:p-4">
      <p className="mb-2.5 flex items-center gap-2 px-1 text-[13px] font-bold uppercase tracking-[0.12em] text-[#121417]">
        <CalendarDays className="h-4 w-4" aria-hidden /> Quick hire · तुरंत बुक करें
      </p>
      <div className="grid gap-2.5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block px-1 text-[13px] font-semibold text-[#5C6169]">What do you need?</span>
          <span className="relative block">
            <select value={item.id} onChange={(e) => setId(e.target.value)} className={`${field} appearance-none pr-10 font-semibold`}>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} — {rateParts(i).price}
                  {UNIT[unitOf(i)].per}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5C6169]" aria-hidden />
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block px-1 text-[13px] font-semibold text-[#5C6169]">From · कब से</span>
          <input
            type="date"
            value={start}
            min={today || undefined}
            max={today ? addDays(today, 90) : undefined}
            onChange={(e) => e.target.value && setStart(e.target.value)}
            className={field}
          />
        </label>

        <div>
          <span id="qh-units" className="mb-1 block px-1 text-[13px] font-semibold text-[#5C6169]">
            For how many {UNIT[unit].many}
          </span>
          <div className="flex h-12 items-center rounded-xl border border-[#D9D6CF] bg-white" role="group" aria-labelledby="qh-units">
            <button
              type="button"
              onClick={() => setUnits((n) => Math.max(min, n - 1))}
              disabled={units <= min}
              aria-label="Fewer"
              className="flex h-full w-12 items-center justify-center rounded-l-xl text-[#121417] hover:bg-[#F2F1ED] disabled:opacity-30"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span className="flex-1 text-center text-[16px] font-bold tabular-nums text-[#121417]" aria-live="polite">
              {units} {units === 1 ? UNIT[unit].one : UNIT[unit].many}
            </span>
            <button
              type="button"
              onClick={() => setUnits((n) => Math.min(most, n + 1))}
              disabled={units >= most}
              aria-label="More"
              className="flex h-full w-12 items-center justify-center rounded-r-xl text-[#121417] hover:bg-[#F2F1ED] disabled:opacity-30"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <Link
          href={href}
          className="flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[16px] font-bold text-[#121417] transition-[filter] hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121417]"
          style={{ background: YELLOW }}
        >
          Check price
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

type Filter = "all" | "rent" | "sale" | `cat:${string}`;

export default function ConstructionTheme({ vendor, products }: Props) {
  const { setBranding } = useStoreBranding();
  useEffect(() => {
    setBranding({ storeName: vendor.businessName, storeLogo: vendor.storeLogo ?? null, storeId: vendor.id });
    return () => setBranding(null);
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  // Opening time depends on the shopper's clock — only after mount, and only
  // when the owner has set hours
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  const [hoursToday, setHoursToday] = useState<string | null>(null);
  useEffect(() => {
    if (vendor.businessHours) {
      setOpenNow(isStoreOpen(vendor.businessHours));
      setHoursToday(todayHours(vendor.businessHours));
    }
  }, [vendor.businessHours]);

  const rentals = useMemo(() => products.filter(isRent), [products]);
  const forSale = useMemo(() => products.filter((p) => !isRent(p)), [products]);
  const photos = useMemo(() => imageList(vendor.storeImages), [vendor.storeImages]);
  const phone = phoneDigits(vendor.contactPhone);
  const whatsapp = phoneDigits(vendor.whatsappNumber || vendor.contactPhone);
  const pin = exactPin(vendor);
  const place = addressLine(vendor);
  const landmark = addressOf(vendor).landmark;
  const rating = num(vendor.averageRating);
  const reviews = vendor.reviewCount ?? 0;
  const delivers = vendor.canDeliver !== false;

  // What the shop really offers, for the strip under the hero
  const anyDeposit = rentals.some((p) => num(p.rentDeposit) > 0);
  const operatorFrom = Math.min(...rentals.map((p) => num(p.operatorRate)).filter((n) => n > 0));
  const transportFrom = Math.min(...rentals.map((p) => num(p.transportCharge)).filter((n) => n > 0));
  const promises = useMemo(() => {
    const list: { icon: LucideIcon; title: string; text: string }[] = [];
    if (delivers) {
      list.push({
        icon: Truck,
        title: "Delivered to your site",
        text: Number.isFinite(transportFrom)
          ? `Transport from ${rupees(transportFrom)}${vendor.maxDeliveryDistance ? ` · within ${vendor.maxDeliveryDistance} km` : ""}`
          : vendor.maxDeliveryDistance
            ? `Within ${vendor.maxDeliveryDistance} km of the shop`
            : `In ${vendor.city || "town"}`,
      });
    }
    if (Number.isFinite(operatorFrom)) {
      list.push({ icon: HardHat, title: "Operator on request", text: `Someone to run it, from ${rupees(operatorFrom)}/day` });
    }
    if (anyDeposit) list.push({ icon: ShieldCheck, title: "Deposit comes back", text: "Given back when it's returned" });
    list.push(
      rentals.length
        ? { icon: Wallet, title: "Pay at the site", text: "Cash or UPI — no advance online" }
        : { icon: Wallet, title: "Cash on delivery", text: vendor.upiId ? "Or UPI to the shop" : "Pay when it arrives" },
    );
    if (reviews > 0 && rating > 0) {
      list.push({ icon: Star, title: `Rated ${rating.toFixed(1)}`, text: `${reviews} review${reviews === 1 ? "" : "s"}` });
    }
    return list.slice(0, 4);
  }, [delivers, rentals.length, transportFrom, operatorFrom, anyDeposit, vendor.maxDeliveryDistance, vendor.city, vendor.upiId, reviews, rating]);

  // Catalogue filters
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => {
    const set = new Map<string, number>();
    for (const p of products) {
      const c = categoryName(p);
      if (c && !/^(on rent|for sale)$/i.test(c)) set.set(c, (set.get(c) ?? 0) + 1);
    }
    return [...set.entries()].filter(([, n]) => n > 0);
  }, [products]);
  const chips: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "All", count: products.length },
    ...(rentals.length && forSale.length
      ? [
          { key: "rent" as Filter, label: "On rent · किराये पर", count: rentals.length },
          { key: "sale" as Filter, label: "For sale · खरीदें", count: forSale.length },
        ]
      : []),
    ...(categories.length > 1 ? categories.map(([c, n]) => ({ key: `cat:${c}` as Filter, label: c, count: n })) : []),
  ];
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) =>
        filter === "all" ? true : filter === "rent" ? isRent(p) : filter === "sale" ? !isRent(p) : categoryName(p) === filter.slice(4),
      )
      .filter((p) => !q || `${p.name} ${p.description ?? ""} ${categoryName(p) ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(isRent(b)) - Number(isRent(a)) || Number(!!b.isFeatured) - Number(!!a.isFeatured));
  }, [products, filter, query]);

  const catalogueTitle = rentals.length && !forSale.length ? "Machines & rates" : !rentals.length ? "Material & prices" : "What we have";
  const catalogueHindi = rentals.length && !forSale.length ? "मशीनें और किराया" : !rentals.length ? "सामान और दाम" : "किराये और बिक्री का सामान";

  // Hero visual: the shop's own photo, or its equipment on a board
  const boardItems = [...rentals, ...forSale].slice(0, 4);
  const cheapest = rentals.length ? rentals.reduce((a, b) => (num(b.price) < num(a.price) ? b : a)) : null;

  // Three plain numbers under the hero text
  const stats = [
    rentals.length ? { label: "On rent", value: String(rentals.length) } : null,
    forSale.length ? { label: "For sale", value: String(forSale.length) } : null,
    cheapest
      ? { label: "Rent from", value: rupees(num(cheapest.price)), unit: `${cheapest.rentUnitLabel ? `a ${cheapest.rentUnitLabel} ` : ""}${UNIT[unitOf(cheapest)].per}` }
      : null,
    delivers && vendor.maxDeliveryDistance ? { label: "Delivery", value: String(vendor.maxDeliveryDistance), unit: "km" } : null,
  ]
    .filter((x): x is { label: string; value: string; unit?: string } => !!x)
    .slice(0, 3);

  return (
    <div className="bg-[#F6F5F2] text-[#121417]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#121417] text-white" style={BLUEPRINT}>
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-28 lg:pt-16">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              {vendor.storeLogo ? (
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image src={vendor.storeLogo} alt="" fill sizes="48px" className="object-cover" />
                </span>
              ) : (
                <span
                  className={`${display.className} flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-[22px] font-bold text-[#121417]`}
                  style={{ background: YELLOW }}
                  aria-hidden
                >
                  {initials(vendor.businessName) || <HardHat className="h-6 w-6" />}
                </span>
              )}
              <p className="text-[12.5px] font-bold uppercase leading-snug tracking-[0.16em] text-[#FFC21A]">
                {rentals.length ? "Construction · On rent" : "Construction material"}
                {vendor.locality || vendor.city ? (
                  <span className="block font-semibold tracking-[0.12em] text-white/60">{[vendor.locality, vendor.city].filter(Boolean).join(", ")}</span>
                ) : null}
              </p>
            </div>

            <h1 className={`${display.className} mt-5 text-[44px] font-bold uppercase leading-[0.92] tracking-[0.005em] sm:text-[60px] lg:text-[72px]`}>
              {vendor.businessName}
            </h1>
            {vendor.storeDescription && (
              <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-white/75 sm:text-[18px]">{vendor.storeDescription}</p>
            )}

            {/* Status */}
            <div className="mt-5 flex flex-wrap gap-2 text-[14px]">
              {openNow !== null && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  <span className={`h-2 w-2 rounded-full ${openNow ? "bg-[#3DDC84]" : "bg-[#FF6B6B]"}`} aria-hidden />
                  {openNow ? "Open now" : "Closed now"}
                  {hoursToday && <span className="font-normal text-white/60">· {hoursToday}</span>}
                </span>
              )}
              {delivers && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  <Truck className="h-4 w-4 text-[#FFC21A]" aria-hidden />
                  Site delivery{vendor.maxDeliveryDistance ? ` · ${vendor.maxDeliveryDistance} km` : ""}
                </span>
              )}
              {reviews > 0 && rating > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold">
                  <Star className="h-4 w-4 fill-[#FFC21A] text-[#FFC21A]" aria-hidden />
                  {rating.toFixed(1)} <span className="font-normal text-white/60">({reviews})</span>
                </span>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#rates"
                className="inline-flex h-[52px] items-center gap-2 rounded-xl px-6 text-[16px] font-bold text-[#121417] transition-[filter] hover:brightness-95"
                style={{ background: YELLOW }}
              >
                {rentals.length ? "See machines & rates" : "See prices"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              {phone && (
                <a
                  href={`tel:+${phone}`}
                  className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-white/25 px-5 text-[16px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" aria-hidden /> Call shop
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Namaste, I saw ${vendor.businessName} on LocalMart.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-white/25 px-5 text-[16px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                </a>
              )}
            </div>

            {/* Numbers */}
            {stats.length > 0 && (
              <dl className="mt-9 grid max-w-[520px] grid-cols-3 border-t border-white/15 pt-5">
                {stats.map((st, i) => (
                  <div key={st.label} className={i ? "border-l border-white/15 pl-4" : "pr-4"}>
                    <dt className="text-[12.5px] text-white/60">{st.label}</dt>
                    <dd className={`${display.className} text-[30px] font-bold leading-none sm:text-[34px]`}>
                      {st.value}
                      {st.unit && <span className="mt-1 block font-sans text-[12.5px] font-medium leading-tight text-white/60">{st.unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* Visual */}
          {photos[0] ? (
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl ring-1 ring-white/10">
                <Image src={photos[0]} alt={`${vendor.businessName} yard`} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#121417]/70 via-transparent to-transparent" aria-hidden />
              </div>
              {cheapest && (
                <Link
                  href={`/products/${cheapest.id}`}
                  className="absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-[#121417] shadow-xl sm:left-6"
                >
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F2F1ED]">
                    <ProductPhoto p={cheapest} sizes="48px" />
                  </span>
                  <span>
                    <span className="block text-[12px] font-semibold uppercase tracking-wide text-[#5C6169]">On rent from</span>
                    <span className="text-[17px] font-extrabold">
                      {rateParts(cheapest).price}
                      <span className="text-[13px] font-medium text-[#5C6169]">{UNIT[unitOf(cheapest)].per}</span>
                    </span>
                  </span>
                </Link>
              )}
            </div>
          ) : boardItems.length > 0 ? (
            // Desktop only — on a phone the list right below shows the same machines
            <div className="hidden rounded-3xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm lg:block">
              <p className="flex items-center justify-between px-1 pb-3 text-[12.5px] font-bold uppercase tracking-[0.14em] text-white/70">
                <span>{rentals.length ? "On rent today" : "In the shop"}</span>
                <span className="text-[#FFC21A]">{rentals.length ? "आज किराये पर" : "दुकान में"}</span>
              </p>
              <ul className={`grid gap-3 ${boardItems.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {boardItems.map((p) => (
                  <li key={p.id}>
                    <Link href={`/products/${p.id}`} className="group block overflow-hidden rounded-2xl bg-[#F2F1ED] text-[#121417]">
                      <span className="relative block aspect-[4/3]">
                        <ProductPhoto p={p} sizes="(min-width: 1024px) 260px, 45vw" className="transition-transform duration-300 group-hover:scale-[1.05]" />
                      </span>
                      <span className="block bg-white px-3 py-2.5">
                        <span className={`${display.className} block truncate text-[19px] font-bold leading-tight`}>{p.name}</span>
                        <span className="text-[14px] font-extrabold tabular-nums">
                          {rupees(num(p.price))}
                          {isRent(p) && <span className="font-medium text-[#5C6169]">{rateParts(p).per}</span>}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-2" style={HAZARD} aria-hidden />
      </section>

      {/* ── Quick hire + promises ───────────────────────────────────────── */}
      <div className="relative z-10 mx-auto -mt-14 max-w-[1200px] px-4 sm:px-6">
        {rentals.length > 0 && <QuickHire items={rentals} />}
        {promises.length > 0 && (
          <ul
            className={`grid grid-cols-2 gap-2.5 ${promises.length >= 4 ? "lg:grid-cols-4" : promises.length === 3 ? "lg:grid-cols-3" : ""} ${rentals.length ? "mt-4" : ""}`}
          >
            {promises.map((p) => (
              <li key={p.title} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#E3E1DB] sm:p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#FFF3CC" }}>
                  <p.icon className="h-5 w-5 text-[#121417]" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold leading-tight">{p.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-[#5C6169]">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Catalogue ───────────────────────────────────────────────────── */}
      <section id="rates" aria-labelledby="rates-title" className="mx-auto max-w-[1200px] scroll-mt-24 px-4 pb-6 pt-12 sm:px-6 sm:pt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle id="rates-title" kicker={`${products.length} item${products.length === 1 ? "" : "s"}`} title={catalogueTitle} hindi={catalogueHindi} />
          {products.length > 6 && (
            <label className="relative w-full sm:w-[300px]">
              <span className="sr-only">Search this shop</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D9198]" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search machines, plates…"
                className="h-12 w-full rounded-xl border border-[#D9D6CF] bg-white pl-10 pr-10 text-[16px] outline-none focus:border-[#121417]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#5C6169] hover:bg-[#F2F1ED]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </label>
          )}
        </div>

        {chips.length > 1 && (
          <div className="-mx-4 mt-5 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Show">
            <div className="flex w-max gap-2">
              {chips.map((c) => {
                const on = filter === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setFilter(c.key)}
                    className={`inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-semibold transition-colors ${
                      on ? "bg-[#121417] text-white" : "bg-white text-[#121417] ring-1 ring-[#D9D6CF] hover:ring-[#121417]"
                    }`}
                  >
                    {c.label}
                    <span className={`text-[13px] tabular-nums ${on ? "text-white/70" : "text-[#8D9198]"}`}>{c.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {shown.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {shown.map((p) => (
              <EquipmentCard key={p.id} p={p} vendorName={vendor.businessName} />
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-[#E3E1DB]">
            <Package className="mx-auto h-10 w-10 text-[#A3A7AD]" aria-hidden />
            <p className="mt-3 text-[17px] font-semibold">{products.length ? "Nothing matches" : "Nothing listed yet"}</p>
            <p className="mt-1 text-[15px] text-[#5C6169]">
              {products.length ? "Try another word, or call the shop." : "Call the shop to ask what they have."}
            </p>
            {products.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
                className="mt-4 h-11 rounded-xl px-5 text-[15px] font-bold text-[#121417] ring-1 ring-[#121417]"
              >
                Show everything
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── How renting works ───────────────────────────────────────────── */}
      {rentals.length > 0 && (
        <section aria-labelledby="how-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16">
          <SectionTitle id="how-title" kicker="Simple renting" title="How it works" hindi="किराये पर लेने का तरीका" />
          <ol className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: "Pick the machine and dates", h: "मशीन और तारीख चुनें", d: "See the price for your days before you book." },
              { t: "The shop calls to confirm", h: "दुकान फ़ोन करके पक्का करेगी", d: "Nothing to pay online — no advance." },
              {
                t: delivers ? "Delivered to your site" : "Pick it up from the yard",
                h: delivers ? "साइट पर पहुँचेगा" : "दुकान से ले जाएँ",
                d: "Pay the shop there — cash or UPI.",
              },
              {
                t: anyDeposit ? "Return it, get your deposit back" : "Return it when you're done",
                h: anyDeposit ? "वापस करें, जमा राशि वापस" : "काम होने पर वापस करें",
                d: "Need it longer? Call the shop before the last day.",
              },
            ].map((s, i) => (
              <li key={s.t} className="relative overflow-hidden rounded-2xl bg-white p-5 ring-1 ring-[#E3E1DB]">
                <span
                  className={`${display.className} flex h-11 w-11 items-center justify-center rounded-xl text-[24px] font-bold text-[#121417]`}
                  style={{ background: YELLOW }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="mt-4 text-[17px] font-bold leading-snug">{s.t}</p>
                <p className="text-[14px] font-medium text-[#8A6A00]">{s.h}</p>
                <p className="mt-2 text-[14px] leading-snug text-[#5C6169]">{s.d}</p>
                <span className={`${display.className} pointer-events-none absolute -right-2 -top-6 text-[110px] font-bold leading-none text-[#121417]/[0.04]`} aria-hidden>
                  {i + 1}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Photos of the yard and work ─────────────────────────────────── */}
      {photos.length > 1 && (
        <section aria-labelledby="work-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
          <SectionTitle id="work-title" kicker="Photos" title="Our yard & work" hindi="हमारा काम" />
          <ul className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.slice(1, 9).map((src, i) => (
              <li key={src} className={`relative overflow-hidden rounded-2xl bg-[#E3E1DB] ${i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}`}>
                <Image src={src} alt={`${vendor.businessName} photo ${i + 2}`} fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Visit / contact ─────────────────────────────────────────────── */}
      <section aria-labelledby="visit-title" className="relative mt-6 bg-[#121417] text-white" style={BLUEPRINT}>
        <div className="absolute inset-x-0 top-0 h-2" style={HAZARD} aria-hidden />
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.16em] text-[#FFC21A]">
              <span className="h-[3px] w-6 rounded-full" style={{ background: YELLOW }} aria-hidden />
              Visit the yard
            </p>
            <h2 id="visit-title" className={`${display.className} mt-1.5 text-[36px] font-bold leading-[1.02] sm:text-[44px]`}>
              Come and see it before you hire
            </h2>
            <p className="mt-1 text-[15px] text-white/60">दुकान पर आकर देखें</p>

            <dl className="mt-7 space-y-4 text-[16px]">
              {place && (
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC21A]" aria-hidden />
                  <div>
                    <dt className="sr-only">Address</dt>
                    <dd className="font-semibold">{place}</dd>
                    {landmark && <dd className="text-white/60">Near {landmark}</dd>}
                    {!pin && <dd className="text-[14px] text-white/50">Ask the shop for the exact spot</dd>}
                  </div>
                </div>
              )}
              {hoursToday && (
                <div className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC21A]" aria-hidden />
                  <div>
                    <dt className="sr-only">Today</dt>
                    <dd className="font-semibold">Today: {hoursToday}</dd>
                  </div>
                </div>
              )}
              {phone && (
                <div className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-[#FFC21A]" aria-hidden />
                  <div>
                    <dt className="sr-only">Phone</dt>
                    <dd>
                      <a href={`tel:+${phone}`} className="font-semibold tabular-nums underline-offset-4 hover:underline">
                        {vendor.contactPhone}
                      </a>
                    </dd>
                  </div>
                </div>
              )}
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={directionsUrl(vendor)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] items-center gap-2 rounded-xl px-6 text-[16px] font-bold text-[#121417] transition-[filter] hover:brightness-95"
                style={{ background: YELLOW }}
              >
                <Navigation className="h-4 w-4" aria-hidden /> Get directions
              </a>
              {phone && (
                <a
                  href={`tel:+${phone}`}
                  className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-white/25 px-5 text-[16px] font-semibold transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" aria-hidden /> Call
                </a>
              )}
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-white/25 px-5 text-[16px] font-semibold transition-colors hover:bg-white/10"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                </a>
              )}
            </div>
          </div>

          {pin ? (
            <div className="relative h-[300px] overflow-hidden rounded-3xl ring-1 ring-white/10 sm:h-[360px]">
              <ShopMap
                shops={[{ id: vendor.id, businessName: vendor.businessName, businessType: vendor.businessType || "OTHER", lat: pin.lat, lng: pin.lng }]}
                selectedId={vendor.id}
                interactive={false}
                showLabels
                className="h-full w-full"
              />
            </div>
          ) : (
            <a
              href={directionsUrl(vendor)}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-[260px] flex-col items-center justify-center overflow-hidden rounded-3xl bg-white/[0.05] text-center ring-1 ring-white/10 sm:h-[320px]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl text-[#121417]" style={{ background: YELLOW }}>
                <MapPin className="h-8 w-8" aria-hidden />
              </span>
              <span className="mt-4 max-w-[80%] text-[17px] font-semibold">{place || vendor.city}</span>
              <span className="mt-1 inline-flex items-center gap-1 text-[15px] text-white/60 group-hover:text-white">
                Open in Google Maps <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
            </a>
          )}
        </div>
      </section>

      {/* ── Questions ───────────────────────────────────────────────────── */}
      {rentals.length > 0 && (
        <section aria-labelledby="faq-title" className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
          <SectionTitle id="faq-title" kicker="Before you hire" title="Common questions" hindi="आम सवाल" />
          <div className="mt-6 divide-y divide-[#E3E1DB] overflow-hidden rounded-2xl bg-white ring-1 ring-[#E3E1DB]">
            {[
              { q: "Do I pay anything online?", a: "No. You pay the shop at the site when it's delivered — cash or UPI." },
              ...(anyDeposit
                ? [{ q: "Is the deposit given back?", a: "Yes. The shop gives the deposit back when everything is returned in the same condition." }]
                : []),
              ...(Number.isFinite(operatorFrom)
                ? [
                    {
                      q: "Can someone run the machine for me?",
                      a: `Yes. Switch on "Send someone to run it" when you book — from ${rupees(operatorFrom)} a day.`,
                    },
                  ]
                : []),
              ...(delivers
                ? [
                    {
                      q: "How does it reach my site?",
                      a: Number.isFinite(transportFrom)
                        ? `The shop brings it and takes it back. Transport is charged once per booking (from ${rupees(transportFrom)}).`
                        : "The shop brings it to your site. Ask the shop about transport when they call.",
                    },
                  ]
                : []),
              { q: "What if I need it for longer?", a: "Call the shop before the last day and they'll extend your booking." },
            ].map((f) => (
              <details key={f.q} className="group">
                <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-[#5C6169] transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-4 text-[15px] leading-relaxed text-[#5C6169]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
