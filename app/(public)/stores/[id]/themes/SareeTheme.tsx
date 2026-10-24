"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cormorant_Garamond } from "next/font/google";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import { isStoreOpen, type BusinessHours } from "@/lib/landing/distance";
import AddStepper from "@/components/cart/AddStepper";
import StoreHeroCarousel, { type HeroSlide } from "./StoreHeroCarousel";
import {
  ArrowRight,
  Clock,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  PhoneCall,
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
    <div className="group flex flex-col h-full bg-white rounded-xl overflow-hidden border border-[#EADBC8] hover:border-[#B8862B]/60 transition-colors">
      <div className="relative">
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
        <div className="absolute bottom-2 right-2">
          <AddStepper
            disabled={isOutOfStock}
            item={{
              id: product.id,
              name: product.name,
              price,
              image: images[0],
              stockQuantity: product.stockQuantity,
              vendorId: product.vendorId,
              vendorName,
            }}
          />
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        {fabricLabel && (
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8862B] mb-1">
            {fabricLabel}
          </p>
        )}
        <Link href={`/products/${product.id}`} className="flex-1">
          <h3 className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 mb-1 group-hover:text-[#6E1423] transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 flex-wrap mb-1">
          <span className="text-base font-bold text-[#4A0D18]">{formatINR(price)}</span>
          {discount > 0 && compareAt && (
            <span className="text-xs text-gray-400 line-through">{formatINR(compareAt)}</span>
          )}
        </div>

        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask about ${product.name} on WhatsApp`}
            className="mt-auto inline-flex items-center gap-1.5 self-start py-1 text-[13px] font-semibold text-green-700 hover:underline"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Ask on WhatsApp
          </a>
        )}
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

  // Only claim "open"/"closed" when the owner has set opening hours
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


  // The owner's own offer line (set in shop settings), shown in the shop card
  const ownerNote = config.announcement?.find((a) => a && a.trim()) ?? null;

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



  // Hero: the owner's own banners first, then featured and newest products.
  // A new product shows up here by itself — nothing extra for the owner to do.
  const heroSlides = useMemo<HeroSlide[]>(() => {
    const banners: HeroSlide[] = storeImages.slice(0, 3).map((src, i) => ({
      key: `banner-${i}`,
      image: src,
      kind: "banner",
      title: vendor.businessName,
      cta: "Shop now",
      onClick: () => document.getElementById("saree-catalog")?.scrollIntoView({ behavior: "smooth" }),
    }));
    const newest = [...products].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const picks = [...newest.filter((p) => p.isFeatured), ...newest.filter((p) => !p.isFeatured)]
      .filter((p) => p.stockQuantity > 0 && toImageList(p.images).length > 0)
      .slice(0, Math.max(0, 5 - banners.length));
    const productSlides: HeroSlide[] = picks.map((p) => {
      const price = Number(p.price);
      const off = calcDiscount(price, p.compareAtPrice ? Number(p.compareAtPrice) : undefined);
      return {
        key: p.id,
        image: toImageList(p.images)[0],
        kind: "product",
        eyebrow: p.isFeatured ? "Featured" : "New arrival",
        title: p.name,
        price: off > 0 ? `${formatINR(price)} · ${off}% off` : formatINR(price),
        cta: "Shop now",
        href: `/products/${p.id}`,
      };
    });
    return [...banners, ...productSlides];
  }, [storeImages, products, vendor.businessName]);

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

  // Sudathi-style collection grid: occasions first, then fabrics
  const bento = [
    ...occasionTiles.map((t) => ({ key: `o-${t.key}`, label: t.label, count: t.count, cover: t.cover, open: () => openTile(t) })),
    ...fabricCollections.map((f) => ({ key: `f-${f.key}`, label: f.label, count: f.count, cover: f.cover, open: () => openFabric(f.key) })),
  ]
    .filter((t) => t.cover)
    .slice(0, 4);

  const budget = products.filter((p) => p.stockQuantity > 0 && Number(p.price) < 1000);

  // Best-rated, then featured, then newest — for "Loved by our customers"
  const loved = [...products]
    .filter((p) => p.stockQuantity > 0 && toImageList(p.images).length > 0)
    .sort(
      (a, b) =>
        Number(b.averageRating || 0) - Number(a.averageRating || 0) ||
        Number(!!b.isFeatured) - Number(!!a.isFeatured) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);

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
      {/* 1. Hero: carousel of the shop's banners + newest products,     */}
      {/*    then the shop's key details in one card                     */}
      {/* ============================================================== */}
      <StoreHeroCarousel
        slides={heroSlides}
        titleClassName={serif.className}
        palette={{ band: "#4A0D18", bandText: "#FFFFFF", eyebrow: "#E9C979", button: "#E9C979", buttonText: "#2E0710" }}
      />

      <header className={`relative z-10 mx-auto max-w-7xl px-4 ${heroSlides.length > 0 ? "-mt-5 sm:mt-4" : "pt-4"}`}>
        <div className="rounded-2xl border border-[#EADBC8] bg-white p-4 shadow-[0_8px_24px_rgba(74,13,24,0.10)] sm:flex sm:items-center sm:gap-6 sm:p-6">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {vendor.storeLogo ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-[#B8862B]">
                <Image src={vendor.storeLogo} alt="" fill className="object-cover" />
              </div>
            ) : (
              <div className={`${serif.className} flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6E1423] text-2xl font-semibold text-[#E9C979] ring-2 ring-[#B8862B]`}>
                {vendor.businessName?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className={`${serif.className} text-[26px] font-semibold leading-tight text-[#4A0D18] sm:text-4xl`}>
                {vendor.businessName}
              </h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B8862B]">Sarees &amp; ethnic wear</p>
              {addressLine && (
                <p className="mt-1.5 flex items-start gap-1 text-[14px] leading-snug text-gray-700">
                  <MapPin className="mt-[3px] h-4 w-4 shrink-0 text-[#B8862B]" aria-hidden />
                  {addressLine}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px] font-semibold">
                {openNow !== null && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${openNow ? "bg-green-50 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${openNow ? "bg-green-600" : "bg-gray-500"}`} aria-hidden />
                    {openNow ? "Open now" : "Closed now"}
                    {todayHours && <span className="font-normal">· {todayHours}</span>}
                  </span>
                )}
                <span className="rounded-full bg-[#F4EBDD] px-2.5 py-1 text-[#4A0D18]">Cash on delivery</span>
                {vendor.averageRating && (vendor.reviewCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4EBDD] px-2.5 py-1 text-[#4A0D18]">
                    <Star className="h-3.5 w-3.5 fill-[#B8862B] text-[#B8862B]" aria-hidden />
                    {Number(vendor.averageRating).toFixed(1)} ({vendor.reviewCount})
                  </span>
                )}
              </div>
            </div>
          </div>

          {ownerNote && (
            <p className="mt-3 flex items-start gap-1.5 rounded-xl bg-[#FFF6E0] px-3 py-2 text-[14px] font-medium text-[#4A0D18] sm:hidden">
              <Sparkles className="mt-[2px] h-4 w-4 shrink-0 text-[#B8862B]" aria-hidden />
              {ownerNote}
            </p>
          )}
          <div className={`mt-4 grid gap-2 sm:mt-0 sm:w-[360px] sm:shrink-0 ${[phone, true, whatsappDigits].filter(Boolean).length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {phone && (
              <a href={`tel:${phone}`} className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#6E1423]/30 text-[14px] font-semibold text-[#6E1423] hover:bg-[#6E1423]/5">
                <Phone className="h-4 w-4" aria-hidden /> Call
              </a>
            )}
            <a
              href={getDirectionsUrl(vendor)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#6E1423]/30 text-[14px] font-semibold text-[#6E1423] hover:bg-[#6E1423]/5"
            >
              <Navigation className="h-4 w-4" aria-hidden /> Directions
            </a>
            {whatsappDigits && (
              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center gap-1.5 rounded-full bg-green-700 text-[14px] font-semibold text-white hover:bg-green-800"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* Promise strip (Sudathi's USP row, in the shop's own words)       */}
      {/* ============================================================== */}
      <section className="mx-auto max-w-7xl px-4 pt-5">
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {[
            { icon: Wallet, title: "Cash on delivery", text: "Pay when it arrives" },
            { icon: IndianRupee, title: "UPI to the shop", text: "Pay us directly" },
            { icon: PhoneCall, title: "We call first", text: "Confirm colour & size" },
            { icon: Store, title: "Visit the shop", text: vendor.locality || vendor.city || "See it in person" },
          ].map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex min-w-[46%] shrink-0 items-center gap-2.5 rounded-xl border border-[#EADBC8] bg-white px-3 py-2.5 sm:min-w-0"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6E1423]/5 text-[#6E1423]">
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-tight text-[#4A0D18]">{title}</span>
                <span className="block truncate text-[12px] leading-tight text-gray-600">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ============================================================== */}
      {/* 5. Trending collections (by fabric)                            */}
      {/* ============================================================== */}
      {fabricCollections.length >= 2 && (
        <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
          <SectionHeading eyebrow="Woven with tradition" title="Shop by Fabric" />
          <div className="flex gap-4 sm:gap-5 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide lg:justify-center lg:overflow-visible lg:mx-0 lg:px-0">
            {fabricCollections.slice(0, 5).map((f) => (
              <button
                key={f.key}
                onClick={() => openFabric(f.key)}
                className="group flex-shrink-0 w-40 sm:w-48 lg:w-56 snap-start text-left"
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
      {/* 4. "The Saree Store" — Sudathi-style photo grid of collections */}
      {/* ============================================================== */}
      {bento.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
          <SectionHeading eyebrow="Find the perfect drape" title="The Saree Store" />
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:h-[560px] lg:grid-cols-3 lg:grid-rows-2">
            {bento.map((t, i) => {
              const shape =
                i === 0
                  ? "row-span-2 aspect-[3/5] lg:aspect-auto"
                  : i === 3
                    ? "col-span-2 aspect-[2/1] lg:col-span-1 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:aspect-auto"
                    : "aspect-[4/3] lg:aspect-auto";
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={t.open}
                  className={`group relative overflow-hidden rounded-2xl bg-[#F4EBDD] text-left cursor-pointer ${shape}`}
                >
                  {t.cover && (
                    <Image
                      src={t.cover}
                      alt=""
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-4 pt-16 text-center">
                    <span className="block text-[18px] font-extrabold uppercase leading-tight tracking-wide text-[#F3D27A] sm:text-[24px]">
                      {t.label}
                    </span>
                    <span className="mt-0.5 block text-[12px] font-medium text-white/85">
                      {t.count} {t.count === 1 ? "saree" : "sarees"}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* "Loved by our customers" — wide banner + tall saree tiles */}
      {loved.length >= 3 && (
        <section className="max-w-7xl mx-auto px-4 pt-12 pb-2">
          <div className="relative flex min-h-[180px] overflow-hidden rounded-2xl bg-[#4A0D18] sm:min-h-[240px]">
            <div className="relative z-10 flex flex-1 flex-col justify-center px-6 py-6 sm:px-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E9C979]">
                {vendor.city ? `Loved in ${vendor.city}` : "Customer favourites"}
              </p>
              <h2 className={`${serif.className} mt-1 text-[30px] font-semibold leading-[1.05] text-white sm:text-[48px]`}>
                Loved by our <span className="text-[#F3D27A]">customers</span>
              </h2>
              <p className="mt-2 text-[14px] text-white/80 sm:text-[16px]">
                {(vendor.reviewCount ?? 0) > 0 && vendor.averageRating
                  ? `★ ${Number(vendor.averageRating).toFixed(1)} from ${vendor.reviewCount} ${vendor.reviewCount === 1 ? "review" : "reviews"}`
                  : "The sarees our shoppers pick most"}
              </p>
            </div>
            {toImageList(loved[0].images)[0] && (
              <div className="relative w-[42%] shrink-0 sm:w-[38%]">
                <Image
                  src={toImageList(loved[0].images)[0]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 42vw, 480px"
                  className="object-cover object-top"
                />
              </div>
            )}
          </div>
          <div className="-mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-1 snap-x snap-mandatory scrollbar-hide lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
            {loved.map((p) => {
              const img = toImageList(p.images)[0];
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group relative aspect-[3/4.4] w-[42%] shrink-0 snap-start overflow-hidden rounded-2xl bg-[#F4EBDD] sm:w-[30%] lg:w-auto"
                >
                  {img && (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      sizes="(max-width: 1024px) 42vw, 16vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 pb-3 pt-14 text-center">
                    <span className="line-clamp-2 block text-[14px] font-extrabold uppercase leading-tight tracking-wide text-white">
                      {p.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-semibold text-[#F3D27A]">{formatINR(Number(p.price))}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 6. Trending now + budget collection                            */}
      {/* ============================================================== */}
      {newArrivals.length >= 4 && (
        <section className="max-w-7xl mx-auto px-4 pt-12">
          <SectionHeading eyebrow="Fresh from the loom" title="Trending Now" />
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
            {newArrivals.slice(0, 8).map((p) => (
              <div key={p.id} className="flex-shrink-0 w-[46%] sm:w-[31%] lg:w-auto snap-start">
                {renderCard(p)}
              </div>
            ))}
          </div>
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={scrollToCatalog}
              className="h-12 rounded-full bg-[#4A0D18] px-10 text-[14px] font-bold uppercase tracking-[0.18em] text-white hover:bg-[#6E1423] cursor-pointer"
            >
              View all
            </button>
          </div>
        </section>
      )}

      {budget.length >= 2 && (
        <section className="max-w-7xl mx-auto px-4 pt-12">
          <button
            type="button"
            onClick={() => {
              clearFilters();
              setSelectedPrice("u999");
              scrollToCatalog();
            }}
            className="relative flex min-h-[150px] w-full overflow-hidden rounded-2xl bg-[#2E0710] text-left cursor-pointer sm:min-h-[200px]"
          >
            <span className="relative z-10 flex flex-1 flex-col justify-center px-6 py-6 sm:px-10">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[#E9C979]">Everyday sarees</span>
              <span className={`${serif.className} mt-1 block text-[30px] font-semibold leading-[1.05] text-white sm:text-[46px]`}>
                Under <span className="text-[#F3D27A]">₹999</span>
              </span>
              <span className="mt-3 inline-flex w-fit items-center rounded-md bg-[#E9C979] px-4 py-2 text-[13px] font-bold uppercase tracking-wide text-[#2E0710]">
                Shop now
              </span>
            </span>
            {toImageList(budget[0].images)[0] && (
              <span className="relative block w-[40%] shrink-0 sm:w-[34%]">
                <Image src={toImageList(budget[0].images)[0]} alt="" fill sizes="(max-width: 640px) 40vw, 440px" className="object-cover object-top" />
              </span>
            )}
          </button>
          <div className="mt-3 flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:mx-0 lg:px-0">
            {budget.slice(0, 8).map((p) => (
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
      <section id="saree-catalog" className="max-w-7xl mx-auto px-4 pt-10 pb-10 scroll-mt-28">
        <SectionHeading eyebrow={`${products.length} ${products.length === 1 ? "saree" : "sarees"} in store`} title="All Sarees" />

        {/* Fabric chips + sort stay pinned under the header while scrolling */}
        <div
          className="sticky z-30 -mx-4 mb-6 border-b border-[#EADBC8] bg-[#FBF6EE]/95 px-4 pt-3 backdrop-blur"
          style={{ top: "var(--header-h, 112px)" }}
        >
        {fabricCollections.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide sm:justify-center">
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

        <div className="flex items-center justify-between gap-3 border-t border-[#EADBC8] py-2.5">
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
        </div>

        <div className="flex gap-8">
          <aside
            className="hidden lg:block w-60 flex-shrink-0 h-fit sticky bg-white rounded-xl border border-[#EADBC8] p-5"
            style={{ top: "calc(var(--header-h, 112px) + 128px)" }}
          >
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
