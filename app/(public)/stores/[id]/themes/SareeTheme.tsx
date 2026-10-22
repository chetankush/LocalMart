"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import AddToCartButton from "../AddToCartButton";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Store,
  Wallet,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

// Decimal columns can arrive as numbers or strings depending on the endpoint
type Numeric = number | string;

interface Product {
  id: string;
  name: string;
  description: string;
  price: Numeric;
  compareAtPrice?: Numeric | null;
  images: unknown;
  stockQuantity: number;
  vendorId: string;
  averageRating: Numeric | null;
  reviewCount: number;
  createdAt: Date | string;
  tags?: string[];
  isFeatured?: boolean;
  category?: { name: string; slug: string } | null;
}

interface StoreAddress {
  address?: string;
  street?: string;
  landmark?: string;
  coordinates?: { lat: number; lng: number };
}

interface SareeVendor {
  id: string;
  businessName: string;
  storeLogo?: string | null;
  storeImages?: unknown;
  storeDescription?: string | null;
  city?: string | null;
  locality?: string | null;
  pincode?: string | null;
  businessAddress?: string | StoreAddress | null;
  businessHours?: BusinessHours | null;
  whatsappNumber?: string | null;
  contactPhone?: string | null;
  instagramHandle?: string | null;
  averageRating?: Numeric | null;
  reviewCount?: number;
  themeCustomization?: unknown;
}

// Optional per-store overrides stored in vendor.themeCustomization.
// Anything left out falls back to the defaults derived from store data.
interface SareeThemeConfig {
  announcement?: string[];
  hero?: {
    eyebrow?: string;
    title?: string;
    subtitle?: string;
  };
}

interface SareeThemeProps {
  vendor: SareeVendor;
  products: Product[];
}

interface Collection {
  key: string;
  label: string;
  keywords: string[];
}

interface Tile {
  key: string;
  label: string;
  count: number;
  cover: string | null;
  kind: "occasion" | "price";
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const FABRICS: Collection[] = [
  { key: "banarasi", label: "Banarasi", keywords: ["banarasi", "benarasi", "banaras"] },
  {
    key: "kanjivaram",
    label: "Kanjivaram",
    keywords: ["kanjivaram", "kanjeevaram", "kanchipuram", "kancheepuram"],
  },
  { key: "silk", label: "Silk", keywords: ["silk", "pattu"] },
  { key: "cotton", label: "Cotton", keywords: ["cotton"] },
  { key: "georgette", label: "Georgette", keywords: ["georgette"] },
  { key: "chiffon", label: "Chiffon", keywords: ["chiffon"] },
  { key: "organza", label: "Organza & Tissue", keywords: ["organza", "tissue"] },
  { key: "linen", label: "Linen", keywords: ["linen"] },
  {
    key: "fancy",
    label: "Fancy & Designer",
    keywords: ["fancy", "designer", "embroider", "sequin", "stone work"],
  },
];

const OCCASIONS: Collection[] = [
  { key: "wedding", label: "Wedding", keywords: ["wedding", "bridal", "shaadi", "marriage"] },
  {
    key: "festive",
    label: "Festive",
    keywords: ["festive", "festival", "diwali", "puja", "pooja", "navratri"],
  },
  { key: "party", label: "Party Wear", keywords: ["party"] },
  { key: "office", label: "Office Wear", keywords: ["office", "formal", "workwear"] },
  { key: "daily", label: "Daily Wear", keywords: ["daily", "casual", "everyday", "regular"] },
];

// max is exclusive so decimal prices never fall between two ranges
const PRICE_RANGES = [
  { key: "u999", label: "Under ₹999", min: 0, max: 1000 },
  { key: "1000", label: "₹1,000 – ₹1,499", min: 1000, max: 1500 },
  { key: "1500", label: "₹1,500 – ₹2,999", min: 1500, max: 3000 },
  { key: "3000", label: "₹3,000 – ₹4,999", min: 3000, max: 5000 },
  { key: "5000", label: "₹5,000 – ₹9,999", min: 5000, max: 10000 },
  { key: "10000", label: "₹10,000 & above", min: 10000, max: Infinity },
];

const DISCOUNT_OPTIONS = [10, 20, 30, 50];

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Biggest discount", value: "discount" },
  { label: "Top rated", value: "rating" },
];

const NEW_ARRIVAL_DAYS = 30;
const RAIL_SIZE = 8;
// Below this many products the rails would just repeat the catalog
const MIN_PRODUCTS_FOR_RAILS = 8;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Image lists are JSON columns: either an array or a JSON-encoded string
function toImageList(value: unknown): string[] {
  let list = value;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  return Array.isArray(list)
    ? list.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
}

function getConfig(vendor: SareeVendor): SareeThemeConfig {
  const raw = vendor.themeCustomization;
  return raw && typeof raw === "object" && !Array.isArray(raw)
    ? (raw as SareeThemeConfig)
    : {};
}

function calcDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function getSearchText(p: Product): string {
  return [p.name, p.description, p.category?.name, ...(p.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function matchesCollection(text: string, c: Collection): boolean {
  return c.keywords.some((k) => text.includes(k));
}

function isNewArrival(createdAt: Date | string): boolean {
  const age = Date.now() - new Date(createdAt).getTime();
  return age >= 0 && age < NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

function getSeasonEyebrow(): string {
  const month = new Date().getMonth();
  if (month === 9 || month === 10) return "Festive Season Collection";
  if (month === 11 || month <= 1) return "Wedding Season Collection";
  if (month >= 2 && month <= 5) return "Summer Collection";
  return "Monsoon Collection";
}

function getAddressLine(vendor: SareeVendor): string {
  const addr = vendor.businessAddress;
  if (typeof addr === "string") return addr;
  const candidates = [
    addr?.address,
    addr?.street,
    addr?.landmark ? `Near ${addr.landmark}` : null,
    vendor.locality,
    vendor.city,
    vendor.pincode,
  ];
  // Street text often already contains the locality/city; skip repeats
  const parts: string[] = [];
  for (const part of candidates) {
    if (part && !parts.join(", ").toLowerCase().includes(part.toLowerCase())) {
      parts.push(part);
    }
  }
  return parts.join(", ");
}

function getDirectionsUrl(vendor: SareeVendor): string {
  const coords =
    typeof vendor.businessAddress === "object" ? vendor.businessAddress?.coordinates : undefined;
  const query =
    coords?.lat && coords?.lng
      ? `${coords.lat},${coords.lng}`
      : `${vendor.businessName}, ${getAddressLine(vendor)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getTodayHours(hours: BusinessHours | null | undefined): string | null {
  if (!hours) return null;
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const day = days[new Date().getDay()];
  const today = hours[day] || hours[day.charAt(0).toUpperCase() + day.slice(1)];
  if (!today) return null;
  if (!today.isOpen) return "Closed today";
  return `Today ${today.open} – ${today.close}`;
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

function Ornament({ light = false }: { light?: boolean }) {
  const line = light ? "bg-[#E9C979]/60" : "bg-[#B8862B]/50";
  const dot = light ? "bg-[#E9C979]" : "bg-[#B8862B]";
  return (
    <div className="flex items-center justify-center gap-2" aria-hidden="true">
      <span className={`h-px w-10 sm:w-16 ${line}`} />
      <span className={`w-1.5 h-1.5 rotate-45 ${dot}`} />
      <span className={`w-2.5 h-2.5 rotate-45 border ${light ? "border-[#E9C979]" : "border-[#B8862B]"}`} />
      <span className={`w-1.5 h-1.5 rotate-45 ${dot}`} />
      <span className={`h-px w-10 sm:w-16 ${line}`} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="text-center mb-8">
      {eyebrow && (
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#B8862B] mb-2">
          {eyebrow}
        </p>
      )}
      <h2 className={`${serif.className} text-3xl sm:text-4xl font-semibold text-[#4A0D18] mb-3`}>
        {title}
      </h2>
      <Ornament />
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6E1423] hover:text-[#4A0D18] underline-offset-4 hover:underline"
        >
          {action.label}
          <ArrowRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function SareeCard({
  product,
  vendorName,
  whatsappDigits,
  fabricLabel,
}: {
  product: Product;
  vendorName: string;
  whatsappDigits: string | null;
  fabricLabel: string | null;
}) {
  const images = toImageList(product.images);
  const price = Number(product.price);
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : undefined;
  const discount = calcDiscount(price, compareAt);
  const isOutOfStock = product.stockQuantity === 0;
  const isNew = isNewArrival(product.createdAt);

  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hi ${vendorName}, I am interested in "${product.name}" (${formatINR(price)}). Is it available?`
      )}`
    : null;

  return (
    <div className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-[#EADBC8] hover:border-[#B8862B]/60 hover:shadow-[0_8px_30px_rgba(110,20,35,0.12)] transition-all duration-300">
      <Link
        href={`/products/${product.id}`}
        className="relative block overflow-hidden bg-[#F4EBDD]"
        style={{ aspectRatio: "3/4" }}
      >
        {images.length > 0 ? (
          <>
            <Image
              src={images[0]}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${
                images.length > 1 ? "group-hover:opacity-0" : ""
              }`}
            />
            {images.length > 1 && (
              <Image
                src={images[1]}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-[#B8862B]/40" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount > 0 && !isOutOfStock && (
            <span className="bg-[#6E1423] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {isNew && !isOutOfStock && (
            <span className="bg-[#B8862B] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-[#4A0D18] text-white text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full">
              Sold Out
            </span>
          </div>
        )}

        {product.averageRating && Number(product.averageRating) > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-white/95 px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-sm">
            {Number(product.averageRating).toFixed(1)}
            <Star className="w-3 h-3 fill-[#B8862B] text-[#B8862B]" />
          </div>
        )}
      </Link>

      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        {fabricLabel && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8862B] mb-1">
            {fabricLabel}
          </p>
        )}
        <Link href={`/products/${product.id}`} className="flex-1">
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-2 group-hover:text-[#6E1423] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 flex-wrap mb-3">
          <span className="text-base font-bold text-[#4A0D18]">{formatINR(price)}</span>
          {discount > 0 && compareAt && (
            <span className="text-xs text-gray-400 line-through">{formatINR(compareAt)}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <AddToCartButton
              product={product}
              vendorName={vendorName}
              label="Add to Cart"
              className="bg-[#6E1423] text-white hover:bg-[#4A0D18] active:scale-95"
            />
          </div>
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Ask about ${product.name} on WhatsApp`}
              className="flex-shrink-0 w-11 h-11 rounded-full border border-green-600/40 text-green-700 flex items-center justify-center hover:bg-green-50 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SareeTheme({ vendor, products }: SareeThemeProps) {
  const { setBranding } = useStoreBranding();
  const config = useMemo(() => getConfig(vendor), [vendor]);

  // Filters
  const [activeFabric, setActiveFabric] = useState<string | null>(null);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Hero carousel + announcement rotation
  const [slide, setSlide] = useState(0);
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  // Time-dependent values are computed after mount so server (UTC) and
  // browser (IST) renders match during hydration
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  const [todayHours, setTodayHours] = useState<string | null>(null);

  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });
    return () => setBranding(null);
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  useEffect(() => {
    if (vendor.businessHours) {
      setOpenNow(isStoreOpen(vendor.businessHours));
      setTodayHours(getTodayHours(vendor.businessHours));
    }
  }, [vendor.businessHours]);

  const storeImages = useMemo(() => toImageList(vendor.storeImages), [vendor.storeImages]);
  const whatsappDigits = vendor.whatsappNumber
    ? vendor.whatsappNumber.replace(/[^0-9]/g, "")
    : null;
  const phone = vendor.contactPhone || vendor.whatsappNumber || null;
  const addressLine = getAddressLine(vendor);

  useEffect(() => {
    if (storeImages.length < 2) return;
    const timer = setInterval(() => setSlide((s) => (s + 1) % storeImages.length), 5000);
    return () => clearInterval(timer);
  }, [storeImages.length]);

  const announcements = useMemo(() => {
    if (config.announcement && config.announcement.length > 0) return config.announcement;
    return [
      "Cash on Delivery available",
      vendor.city ? `Shop online from our store in ${vendor.city}` : "Shop online from our store",
      whatsappDigits ? "Questions? Chat with us on WhatsApp" : null,
    ].filter(Boolean) as string[];
  }, [config.announcement, vendor.city, whatsappDigits]);

  useEffect(() => {
    if (announcements.length < 2) return;
    const timer = setInterval(
      () => setAnnouncementIdx((i) => (i + 1) % announcements.length),
      3500
    );
    return () => clearInterval(timer);
  }, [announcements.length]);

  // Pre-compute searchable text once per product
  const searchText = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => map.set(p.id, getSearchText(p)));
    return map;
  }, [products]);

  const fabricOf = useCallback(
    (p: Product): string | null => {
      const text = searchText.get(p.id) || "";
      return FABRICS.find((f) => matchesCollection(text, f))?.label ?? null;
    },
    [searchText]
  );

  // Collections that actually have products, with a cover image
  const fabricCollections = useMemo(
    () =>
      FABRICS.map((f) => {
        const matched = products.filter((p) => matchesCollection(searchText.get(p.id) || "", f));
        const cover = matched.map((p) => toImageList(p.images)[0]).find(Boolean) || null;
        return { ...f, count: matched.length, cover };
      }).filter((f) => f.count > 0),
    [products, searchText]
  );

  const occasionTiles = useMemo(() => {
    const coverOf = (list: Product[]) =>
      list.map((p) => toImageList(p.images)[0]).find(Boolean) || null;
    const tiles: Tile[] = OCCASIONS.map((o) => {
      const matched = products.filter((p) => matchesCollection(searchText.get(p.id) || "", o));
      return {
        key: o.key,
        label: o.label,
        count: matched.length,
        cover: coverOf(matched),
        kind: "occasion",
      };
    });
    const budget = products.filter((p) => Number(p.price) < 1000);
    tiles.push({
      key: "u999",
      label: "Under ₹999",
      count: budget.length,
      cover: coverOf(budget),
      kind: "price",
    });
    return tiles.filter((t) => t.count > 0);
  }, [products, searchText]);

  const occasionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    OCCASIONS.forEach((o) => {
      counts[o.key] = products.filter((p) =>
        matchesCollection(searchText.get(p.id) || "", o)
      ).length;
    });
    return counts;
  }, [products, searchText]);

  const newArrivals = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, RAIL_SIZE),
    [products]
  );

  const topPicks = useMemo(() => {
    const featured = products.filter((p) => p.isFeatured);
    const rated = products
      .filter((p) => !p.isFeatured && Number(p.averageRating || 0) > 0)
      .sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
    return [...featured, ...rated].slice(0, RAIL_SIZE);
  }, [products]);

  const showRails = products.length >= MIN_PRODUCTS_FOR_RAILS;

  const activeFilterCount =
    selectedOccasions.length + (selectedPrice ? 1 : 0) + (minDiscount !== null ? 1 : 0);

  const clearFilters = useCallback(() => {
    setActiveFabric(null);
    setSelectedOccasions([]);
    setSelectedPrice(null);
    setMinDiscount(null);
  }, []);

  const toggleOccasion = useCallback((key: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const scrollToCatalog = useCallback(() => {
    document.getElementById("saree-catalog")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const openFabric = useCallback(
    (key: string) => {
      clearFilters();
      setActiveFabric(key);
      scrollToCatalog();
    },
    [clearFilters, scrollToCatalog]
  );

  const openTile = useCallback(
    (tile: Tile) => {
      clearFilters();
      if (tile.kind === "price") setSelectedPrice(tile.key);
      else setSelectedOccasions([tile.key]);
      scrollToCatalog();
    },
    [clearFilters, scrollToCatalog]
  );

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (activeFabric) {
      const fabric = FABRICS.find((f) => f.key === activeFabric);
      if (fabric) {
        result = result.filter((p) => matchesCollection(searchText.get(p.id) || "", fabric));
      }
    }

    if (selectedOccasions.length > 0) {
      const chosen = OCCASIONS.filter((o) => selectedOccasions.includes(o.key));
      result = result.filter((p) =>
        chosen.some((o) => matchesCollection(searchText.get(p.id) || "", o))
      );
    }

    if (selectedPrice) {
      const range = PRICE_RANGES.find((r) => r.key === selectedPrice);
      if (range) {
        result = result.filter((p) => {
          const price = Number(p.price);
          return price >= range.min && price < range.max;
        });
      }
    }

    if (minDiscount !== null) {
      result = result.filter(
        (p) =>
          calcDiscount(
            Number(p.price),
            p.compareAtPrice ? Number(p.compareAtPrice) : undefined
          ) >= minDiscount
      );
    }

    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "discount":
        result.sort(
          (a, b) =>
            calcDiscount(Number(b.price), b.compareAtPrice ? Number(b.compareAtPrice) : undefined) -
            calcDiscount(Number(a.price), a.compareAtPrice ? Number(a.compareAtPrice) : undefined)
        );
        break;
      case "rating":
        result.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [products, searchText, activeFabric, selectedOccasions, selectedPrice, minDiscount, sortBy]);

  const heroEyebrow = config.hero?.eyebrow || getSeasonEyebrow();
  const heroTitle =
    config.hero?.title ||
    (fabricCollections.length >= 2
      ? `${[...fabricCollections]
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")
          .replace(/, ([^,]*)$/, " & $1")} Sarees`
      : "Sarees for Every Occasion");
  const heroSubtitle =
    config.hero?.subtitle ||
    vendor.storeDescription ||
    `Shop online from ${vendor.businessName}${vendor.city ? `, ${vendor.city}` : ""}`;

  const heroProductImages = useMemo(
    () =>
      products
        .map((p) => toImageList(p.images)[0])
        .filter(Boolean)
        .slice(0, 3) as string[],
    [products]
  );

  const renderCard = (product: Product) => (
    <SareeCard
      product={product}
      vendorName={vendor.businessName}
      whatsappDigits={whatsappDigits}
      fabricLabel={fabricOf(product)}
    />
  );

  // ----- Filter panel (shared by desktop sidebar and mobile drawer) -----
  const filterContent = (
    <div className="space-y-7">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4A0D18] mb-3">
          Occasion
        </h4>
        <div className="space-y-2.5">
          {OCCASIONS.map((o) => {
            const checked = selectedOccasions.includes(o.key);
            const count = occasionCounts[o.key] || 0;
            return (
              <label
                key={o.key}
                className={`flex items-center gap-3 group ${count === 0 ? "opacity-40" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={count === 0}
                  onChange={() => toggleOccasion(o.key)}
                />
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    checked
                      ? "bg-[#6E1423] border-[#6E1423]"
                      : "border-gray-300 group-hover:border-[#6E1423]"
                  }`}
                >
                  {checked && <span className="text-white text-[10px] leading-none">&#10003;</span>}
                </span>
                <span className="text-sm text-gray-700 flex-1">{o.label}</span>
                <span className="text-xs text-gray-400">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#EADBC8] pt-6">
        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4A0D18] mb-3">
          Price
        </h4>
        <div className="space-y-2.5">
          {PRICE_RANGES.map((r) => {
            const checked = selectedPrice === r.key;
            return (
              <label key={r.key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="saree-price"
                  className="sr-only"
                  checked={checked}
                  onChange={() => setSelectedPrice(r.key)}
                  onClick={() => checked && setSelectedPrice(null)}
                />
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                    checked ? "border-[#6E1423]" : "border-gray-300 group-hover:border-[#6E1423]"
                  }`}
                >
                  {checked && <span className="w-2 h-2 rounded-full bg-[#6E1423]" />}
                </span>
                <span className="text-sm text-gray-700">{r.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#EADBC8] pt-6">
        <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4A0D18] mb-3">
          Discount
        </h4>
        <div className="flex flex-wrap gap-2">
          {DISCOUNT_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setMinDiscount(minDiscount === d ? null : d)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                minDiscount === d
                  ? "bg-[#6E1423] border-[#6E1423] text-white"
                  : "border-[#EADBC8] text-gray-700 hover:border-[#6E1423]"
              }`}
            >
              {d}%+ off
            </button>
          ))}
        </div>
      </div>

      {(activeFilterCount > 0 || activeFabric) && (
        <button
          onClick={clearFilters}
          className="w-full text-center text-xs font-bold uppercase tracking-[0.18em] text-[#6E1423] hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#FBF6EE] text-gray-800">
      {/* ============================================================== */}
      {/* 1. Announcement bar                                            */}
      {/* ============================================================== */}
      {announcements.length > 0 && (
        <div className="bg-[#4A0D18] text-[#E9C979] text-xs sm:text-[13px] tracking-wide">
          <div className="max-w-7xl mx-auto px-4 py-2 text-center">
            <p className="sm:hidden truncate">{announcements[announcementIdx % announcements.length]}</p>
            <p className="hidden sm:flex items-center justify-center gap-4 flex-wrap">
              {announcements.map((a, i) => (
                <span key={a} className="flex items-center gap-4">
                  {i > 0 && <span aria-hidden="true">&#10022;</span>}
                  {a}
                </span>
              ))}
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. Store identity header                                       */}
      {/* ============================================================== */}
      <header className="bg-[#FFFDF8] border-b border-[#EADBC8]">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 text-center">
          <div className="flex justify-center mb-3">
            {vendor.storeLogo ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-2 ring-[#B8862B] ring-offset-2 ring-offset-[#FFFDF8]">
                <Image src={vendor.storeLogo} alt={vendor.businessName} fill className="object-cover" />
              </div>
            ) : (
              <div
                className={`${serif.className} w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#6E1423] text-[#E9C979] text-3xl sm:text-4xl font-semibold flex items-center justify-center ring-2 ring-[#B8862B] ring-offset-2 ring-offset-[#FFFDF8]`}
              >
                {vendor.businessName?.charAt(0)}
              </div>
            )}
          </div>
          <h1 className={`${serif.className} text-3xl sm:text-5xl font-semibold text-[#4A0D18] leading-tight`}>
            {vendor.businessName}
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm uppercase tracking-[0.3em] text-[#B8862B] font-medium">
            Sarees &amp; Ethnic Wear
          </p>

          <div className="mt-4 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-xs sm:text-sm">
            {(vendor.locality || vendor.city) && (
              <span className="inline-flex items-center gap-1 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-[#B8862B]" />
                {[vendor.locality, vendor.city].filter(Boolean).join(", ")}
              </span>
            )}
            {vendor.averageRating && (vendor.reviewCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#6E1423]/5 border border-[#6E1423]/15 text-[#6E1423] px-2.5 py-1 rounded-full font-semibold">
                <Star className="w-3.5 h-3.5 fill-[#B8862B] text-[#B8862B]" />
                {Number(vendor.averageRating).toFixed(1)}
                <span className="font-normal text-gray-500">({vendor.reviewCount} reviews)</span>
              </span>
            )}
            {openNow !== null && (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                  openNow ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-green-500" : "bg-gray-400"}`} />
                {openNow ? "Open now" : "Closed now"}
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#6E1423]/30 text-[#6E1423] text-sm font-semibold hover:bg-[#6E1423]/5 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
            <a
              href={getDirectionsUrl(vendor)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#6E1423]/30 text-[#6E1423] text-sm font-semibold hover:bg-[#6E1423]/5 transition-colors"
            >
              <Navigation className="w-4 h-4" />
              Directions
            </a>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. Hero                                                        */}
      {/* ============================================================== */}
      <section className="relative w-full h-[360px] sm:h-[420px] md:h-[500px] overflow-hidden bg-[#4A0D18]">
        {storeImages.length > 0 ? (
          storeImages.map((src, i) => (
            <div
              key={`${i}-${src}`}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden={i !== slide}
            >
              <Image
                src={src}
                alt={`${vendor.businessName} collection ${i + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={i === 0}
              />
            </div>
          ))
        ) : (
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, #E9C979 1.5px, transparent 0), radial-gradient(circle at 13px 13px, #E9C979 1px, transparent 0)",
              backgroundSize: "26px 26px",
            }}
            aria-hidden="true"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#2E0710]/90 via-[#4A0D18]/60 to-transparent" />

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-8 flex items-center">
          <div className="max-w-xl">
            <p className="text-[#E9C979] text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] mb-3">
              {heroEyebrow}
            </p>
            <h2 className={`${serif.className} text-white text-4xl sm:text-5xl md:text-6xl font-semibold leading-[1.05]`}>
              {heroTitle}
            </h2>
            <p className="text-white/80 text-sm sm:text-base mt-4 max-w-md line-clamp-2">
              {heroSubtitle}
            </p>
            <div className="mt-7 flex items-center gap-3 flex-wrap">
              <button
                onClick={scrollToCatalog}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E9C979] text-[#4A0D18] text-sm font-bold uppercase tracking-wider hover:bg-[#f2d78f] transition-colors"
              >
                Shop the collection
                <ArrowRight className="w-4 h-4" />
              </button>
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
                    `Hi ${vendor.businessName}, please share your latest saree collection.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-full border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Ask on WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Arched product frames when the store has no banner images */}
          {storeImages.length === 0 && heroProductImages.length > 0 && (
            <div className="hidden lg:flex absolute right-8 bottom-0 items-end gap-4" aria-hidden="true">
              {heroProductImages.map((src, i) => (
                <div
                  key={`${i}-${src}`}
                  className={`relative w-44 rounded-t-full overflow-hidden border-4 border-[#E9C979]/70 border-b-0 ${
                    i === 1 ? "h-[400px]" : "h-[320px]"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="176px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {storeImages.length > 1 && (
          <>
            <button
              onClick={() => setSlide((s) => (s - 1 + storeImages.length) % storeImages.length)}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 text-white items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Previous banner"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSlide((s) => (s + 1) % storeImages.length)}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 text-white items-center justify-center hover:bg-black/50 transition-colors"
              aria-label="Next banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
              {storeImages.map((src, i) => (
                <button
                  key={`${i}-${src}`}
                  onClick={() => setSlide(i)}
                  aria-label={`Show banner ${i + 1}`}
                  className="p-1"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all ${
                      i === slide ? "w-6 bg-[#E9C979]" : "w-1.5 bg-white/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ============================================================== */}
      {/* 4. Shop by occasion                                            */}
      {/* ============================================================== */}
      {occasionTiles.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-14 pb-4">
          <SectionHeading eyebrow="Find the perfect drape" title="Shop by Occasion" />
          <div className="flex sm:justify-center gap-5 sm:gap-8 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
            {occasionTiles.map((tile) => (
              <button
                key={tile.key}
                onClick={() => openTile(tile)}
                className="group flex-shrink-0 w-24 sm:w-32 text-center snap-start"
              >
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden ring-1 ring-[#B8862B]/50 ring-offset-4 ring-offset-[#FBF6EE] bg-[#F4EBDD] group-hover:ring-[#B8862B] transition-all">
                  {tile.cover ? (
                    <Image
                      src={tile.cover}
                      alt={tile.label}
                      fill
                      sizes="128px"
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className={`${serif.className} absolute inset-0 flex items-center justify-center text-3xl text-[#6E1423]`}>
                      {tile.label.charAt(0)}
                    </div>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-[#4A0D18] group-hover:text-[#6E1423]">
                  {tile.label}
                </p>
                <p className="text-[11px] text-gray-500">{tile.count} sarees</p>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. Trending collections (by fabric)                            */}
      {/* ============================================================== */}
      {fabricCollections.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pt-12 pb-4">
          <SectionHeading eyebrow="Woven with tradition" title="Trending Collections" />
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 snap-x lg:grid lg:grid-cols-5 lg:overflow-visible lg:mx-0 lg:px-0">
            {fabricCollections.slice(0, 5).map((f) => (
              <button
                key={f.key}
                onClick={() => openFabric(f.key)}
                className="group flex-shrink-0 w-40 sm:w-48 lg:w-auto snap-start text-left"
              >
                <div className="relative w-full aspect-[3/4] rounded-t-full overflow-hidden border-[3px] border-[#E9C979] bg-[#F4EBDD]">
                  {f.cover ? (
                    <Image
                      src={f.cover}
                      alt={`${f.label} sarees`}
                      fill
                      sizes="(max-width: 1024px) 192px, 20vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-10 h-10 text-[#B8862B]/50" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#2E0710]/85 to-transparent pt-16 pb-4 px-3 text-center">
                    <p className={`${serif.className} text-white text-xl sm:text-2xl font-semibold`}>
                      {f.label}
                    </p>
                    <p className="text-[#E9C979] text-[11px] uppercase tracking-[0.2em] mt-0.5">
                      {f.count} {f.count === 1 ? "saree" : "sarees"}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 6. New arrivals + top picks rails                              */}
      {/* ============================================================== */}
      {showRails && (
        <section className="max-w-7xl mx-auto px-4 pt-14">
          <SectionHeading
            eyebrow="Fresh from the loom"
            title="New Arrivals"
            action={{ label: "View all sarees", onClick: scrollToCatalog }}
          />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
            {newArrivals.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[46%] sm:w-[31%] lg:w-auto snap-start">
                {renderCard(p)}
              </div>
            ))}
          </div>
        </section>
      )}

      {showRails && topPicks.length >= 4 && (
        <section className="max-w-7xl mx-auto px-4 pt-14">
          <SectionHeading eyebrow="Loved by our customers" title="Top Picks" />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
            {topPicks.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[46%] sm:w-[31%] lg:w-auto snap-start">
                {renderCard(p)}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 7. Full catalog with filters                                   */}
      {/* ============================================================== */}
      <section id="saree-catalog" className="max-w-7xl mx-auto px-4 pt-14 pb-10 scroll-mt-20">
        <SectionHeading eyebrow={`${products.length} ${products.length === 1 ? "saree" : "sarees"} in store`} title="All Sarees" />

        {fabricCollections.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4 sm:justify-center">
            {[{ key: null as string | null, label: "All" }, ...fabricCollections].map((f) => (
              <button
                key={f.key ?? "all"}
                onClick={() => setActiveFabric(f.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  activeFabric === f.key
                    ? "bg-[#6E1423] border-[#6E1423] text-white"
                    : "bg-white border-[#EADBC8] text-gray-700 hover:border-[#6E1423]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mb-6 border-y border-[#EADBC8] py-3">
          <p className="text-sm text-gray-600">
            Showing <span className="font-bold text-[#4A0D18]">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "saree" : "sarees"}
          </p>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline text-gray-500">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-[#EADBC8] rounded-full pl-3 pr-8 py-2 text-sm font-medium text-gray-800 focus:outline-none focus:border-[#6E1423]"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden relative flex items-center gap-2 bg-white border border-[#EADBC8] rounded-full px-3 py-2 text-sm font-medium text-gray-800"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#6E1423] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-60 flex-shrink-0 h-fit sticky top-24 bg-white rounded-xl border border-[#EADBC8] p-5">
            <h3 className={`${serif.className} text-xl font-semibold text-[#4A0D18] mb-5`}>Filters</h3>
            {filterContent}
          </aside>

          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-[#FFFDF8] shadow-2xl overflow-y-auto flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-[#EADBC8]">
                  <h3 className={`${serif.className} text-2xl font-semibold text-[#4A0D18]`}>Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-1.5 hover:bg-[#F4EBDD] rounded-full transition-colors"
                    aria-label="Close filters"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 flex-1">{filterContent}</div>
                <div className="sticky bottom-0 bg-[#FFFDF8] border-t border-[#EADBC8] p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 rounded-full bg-[#6E1423] text-white text-sm font-bold uppercase tracking-wider"
                  >
                    Show {filteredProducts.length} sarees
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {filteredProducts.map((p) => (
                  <div key={p.id}>{renderCard(p)}</div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#EADBC8]">
                <Search className="w-14 h-14 text-[#B8862B]/40 mb-4" />
                <h3 className={`${serif.className} text-2xl font-semibold text-[#4A0D18] mb-2`}>
                  {products.length === 0 ? "New collection coming soon" : "No sarees match these filters"}
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                  {products.length === 0
                    ? "The store is adding its sarees. Message them to see what's in stock today."
                    : "Try removing a filter, or ask the store on WhatsApp — they may have it in stock."}
                </p>
                {products.length > 0 ? (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-2.5 rounded-full bg-[#6E1423] text-white text-sm font-semibold hover:bg-[#4A0D18] transition-colors"
                  >
                    Clear all filters
                  </button>
                ) : (
                  whatsappDigits && (
                    <a
                      href={`https://wa.me/${whatsappDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat on WhatsApp
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 8. Why shop with us                                            */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Sparkles, title: "Handpicked Sarees", desc: "Chosen in-store, now online" },
            { icon: Wallet, title: "Cash on Delivery", desc: "Pay when your order arrives" },
            whatsappDigits
              ? { icon: MessageCircle, title: "Ask Before You Buy", desc: "Chat with us on WhatsApp" }
              : { icon: Phone, title: "Ask Before You Buy", desc: "Call the store for details" },
            {
              icon: Store,
              title: "Visit the Store",
              desc: [vendor.locality, vendor.city].filter(Boolean).join(", ") || "See sarees in person",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-4 sm:p-5 bg-white rounded-xl border border-[#EADBC8]"
              >
                <div className="w-11 h-11 rounded-full bg-[#6E1423]/5 border border-[#B8862B]/30 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-[#6E1423]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#4A0D18]">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. About + visit us                                            */}
      {/* ============================================================== */}
      <section className="relative bg-[#4A0D18] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #E9C979 1.5px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 py-14 sm:py-16 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-center md:text-left">
            <p className="text-[#E9C979] text-xs font-semibold uppercase tracking-[0.3em] mb-3">
              Our Story
            </p>
            <h2 className={`${serif.className} text-3xl sm:text-4xl font-semibold mb-4`}>
              About {vendor.businessName}
            </h2>
            <div className="md:hidden mb-4">
              <Ornament light />
            </div>
            <p className="text-white/80 leading-relaxed whitespace-pre-line">
              {vendor.storeDescription ||
                `Welcome to ${vendor.businessName}. Browse our sarees online, ask us anything, and visit the store to see the colours and fabrics in person.`}
            </p>
            <button
              onClick={scrollToCatalog}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#E9C979] text-[#4A0D18] text-sm font-bold uppercase tracking-wider hover:bg-[#f2d78f] transition-colors"
            >
              Shop now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/5 border border-[#E9C979]/30 rounded-2xl p-6 sm:p-8 space-y-5">
            <h3 className={`${serif.className} text-2xl font-semibold text-[#E9C979]`}>Visit Us</h3>
            {addressLine && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#E9C979] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/85">{addressLine}</p>
              </div>
            )}
            {todayHours && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#E9C979] flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/85">{todayHours}</p>
              </div>
            )}
            {phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-[#E9C979] flex-shrink-0 mt-0.5" />
                <a href={`tel:${phone}`} className="text-sm text-white/85 hover:text-white">
                  {phone}
                </a>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-2">
              <a
                href={getDirectionsUrl(vendor)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white text-[#4A0D18] text-sm font-semibold hover:bg-[#FBF6EE] transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get directions
              </a>
              {whatsappDigits && (
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
              {vendor.instagramHandle && (
                <a
                  href={`https://instagram.com/${vendor.instagramHandle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-white/30 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  @{vendor.instagramHandle.replace("@", "")}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
