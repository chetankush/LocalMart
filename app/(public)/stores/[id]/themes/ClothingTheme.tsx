"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import AddToCartButton from "../AddToCartButton";
import {
  Star,
  ChevronDown,
  X,
  ShoppingBag,
  MapPin,
  Truck,
  Search,
  SlidersHorizontal,
  Package,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  name: string;
  description: string;
  price: any;
  compareAtPrice?: any;
  images: any;
  stockQuantity: number;
  vendorId: string;
  averageRating: any;
  reviewCount: number;
  createdAt: Date;
}

interface ClothingThemeProps {
  vendor: any;
  products: Product[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACCENT = "#ff3f6c";

const CATEGORIES = [
  "All",
  "Men",
  "Women",
  "Kids",
  "Accessories",
  "Ethnic Wear",
  "Western Wear",
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Rating", value: "rating" },
  { label: "Popularity", value: "popularity" },
];

const GENDER_OPTIONS = ["Men", "Women", "Kids", "Unisex"];

const PRICE_RANGES = [
  { label: "Under \u20B9500", min: 0, max: 500 },
  { label: "\u20B9500 - \u20B91,000", min: 500, max: 1000 },
  { label: "\u20B91,000 - \u20B92,000", min: 1000, max: 2000 },
  { label: "\u20B92,000 - \u20B95,000", min: 2000, max: 5000 },
  { label: "Above \u20B95,000", min: 5000, max: Infinity },
];

const DISCOUNT_OPTIONS = [
  { label: "10% and above", min: 10 },
  { label: "20% and above", min: 20 },
  { label: "30% and above", min: 30 },
  { label: "50% and above", min: 50 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getProductImages(images: any): string[] {
  if (Array.isArray(images)) return images as string[];
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getStoreImages(vendor: any): string[] {
  if (!vendor.storeImages) return [];
  if (Array.isArray(vendor.storeImages)) return vendor.storeImages;
  if (typeof vendor.storeImages === "string") {
    try {
      const parsed = JSON.parse(vendor.storeImages);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function calcDiscount(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ClothingTheme({ vendor, products }: ClothingThemeProps) {
  const { setBranding } = useStoreBranding();

  // State
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<number | null>(null);

  // Branding
  useEffect(() => {
    setBranding({
      storeName: vendor.businessName,
      storeLogo: vendor.storeLogo,
      storeId: vendor.id,
    });
    return () => setBranding(null);
  }, [vendor.businessName, vendor.storeLogo, vendor.id, setBranding]);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!showSortDropdown) return;
    const handler = () => setShowSortDropdown(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showSortDropdown]);

  // Store images
  const storeImages = useMemo(() => getStoreImages(vendor), [vendor]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedGenders.length > 0) count += selectedGenders.length;
    if (selectedPriceRange !== null) count += 1;
    if (selectedDiscount !== null) count += 1;
    return count;
  }, [selectedGenders, selectedPriceRange, selectedDiscount]);

  // Toggle gender filter
  const toggleGender = useCallback((g: string) => {
    setSelectedGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedGenders([]);
    setSelectedPriceRange(null);
    setSelectedDiscount(null);
    setActiveCategory("All");
  }, []);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
          p.description.toLowerCase().includes(activeCategory.toLowerCase())
      );
    }

    // Gender filter
    if (selectedGenders.length > 0) {
      result = result.filter((p) =>
        selectedGenders.some(
          (g) =>
            p.name.toLowerCase().includes(g.toLowerCase()) ||
            p.description.toLowerCase().includes(g.toLowerCase())
        )
      );
    }

    // Price range filter
    if (selectedPriceRange !== null) {
      const range = PRICE_RANGES[selectedPriceRange];
      result = result.filter((p) => {
        const price = Number(p.price);
        return price >= range.min && price < (range.max === Infinity ? 1e9 : range.max);
      });
    }

    // Discount filter
    if (selectedDiscount !== null) {
      const minDisc = DISCOUNT_OPTIONS[selectedDiscount].min;
      result = result.filter((p) => {
        const disc = calcDiscount(Number(p.price), p.compareAtPrice ? Number(p.compareAtPrice) : undefined);
        return disc >= minDisc;
      });
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "rating":
        result.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
        break;
      case "popularity":
        result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return result;
  }, [products, activeCategory, selectedGenders, selectedPriceRange, selectedDiscount, sortBy]);

  // Seasonal tagline
  const tagline = useMemo(() => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "Spring Collection is Here";
    if (month >= 5 && month <= 7) return "Summer Styles, Cool Prices";
    if (month >= 8 && month <= 9) return "Festive Season Favourites";
    return "Winter Wardrobe Essentials";
  }, []);

  // ----- Filter sidebar content (shared between desktop and mobile) -----
  const filterContent = (
    <div className="space-y-6">
      {/* Gender */}
      <div>
        <h4 className="text-sm font-bold uppercase text-gray-700 mb-3">Gender</h4>
        <div className="space-y-2">
          {GENDER_OPTIONS.map((g) => (
            <label key={g} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 border rounded flex items-center justify-center transition-colors ${
                  selectedGenders.includes(g)
                    ? "border-[#ff3f6c] bg-[#ff3f6c]"
                    : "border-gray-300 group-hover:border-[#ff3f6c]"
                }`}
              >
                {selectedGenders.includes(g) && (
                  <span className="text-white text-xs leading-none">&#10003;</span>
                )}
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{g}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold uppercase text-gray-700 mb-3">Price Range</h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((range, idx) => (
            <label key={range.label} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 border rounded-full flex items-center justify-center transition-colors ${
                  selectedPriceRange === idx
                    ? "border-[#ff3f6c] bg-[#ff3f6c]"
                    : "border-gray-300 group-hover:border-[#ff3f6c]"
                }`}
              >
                {selectedPriceRange === idx && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                {range.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Discount */}
      <div className="border-t border-gray-100 pt-6">
        <h4 className="text-sm font-bold uppercase text-gray-700 mb-3">Discount</h4>
        <div className="space-y-2">
          {DISCOUNT_OPTIONS.map((opt, idx) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-4 h-4 border rounded-full flex items-center justify-center transition-colors ${
                  selectedDiscount === idx
                    ? "border-[#ff3f6c] bg-[#ff3f6c]"
                    : "border-gray-300 group-hover:border-[#ff3f6c]"
                }`}
              >
                {selectedDiscount === idx && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                )}
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900">
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Clear all */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full text-center text-sm font-bold uppercase tracking-wider text-[#ff3f6c] hover:underline pt-2"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800">
      {/* ============================================================== */}
      {/* 1. Store Header Bar                                            */}
      {/* ============================================================== */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Logo + name */}
          <div className="flex items-center gap-3">
            {vendor.storeLogo ? (
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                <Image
                  src={vendor.storeLogo}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">
                {vendor.businessName}
              </h1>
              {vendor.city && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {vendor.city}
                </p>
              )}
            </div>
          </div>

          {/* Right: Rating + delivery */}
          <div className="flex items-center gap-4">
            {vendor.averageRating && vendor.reviewCount > 0 && (
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                <Star className="w-3.5 h-3.5 text-green-600 fill-green-600" />
                <span className="text-sm font-bold text-green-700">
                  {Number(vendor.averageRating).toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({vendor.reviewCount})
                </span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-500">
              <Truck className="w-3.5 h-3.5" />
              <span>Free Delivery</span>
            </div>
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 2. Hero Banner                                                 */}
      {/* ============================================================== */}
      <section className="relative w-full h-[220px] sm:h-[300px] md:h-[380px] overflow-hidden">
        {storeImages.length > 0 ? (
          <>
            <Image
              src={storeImages[0]}
              alt={vendor.businessName}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff3f6c] via-rose-400 to-pink-300" />
        )}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-center">
          <p className="text-white/80 text-sm sm:text-base font-medium uppercase tracking-widest mb-2">
            {tagline}
          </p>
          <h2 className="text-white text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight max-w-lg drop-shadow-lg">
            {vendor.businessName}
          </h2>
          {vendor.storeDescription && (
            <p className="text-white/80 text-sm sm:text-base mt-3 max-w-md line-clamp-2">
              {vendor.storeDescription}
            </p>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. Category Navigation                                          */}
      {/* ============================================================== */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide border-b-[3px] transition-colors whitespace-nowrap ${
                  activeCategory === cat
                    ? "border-[#ff3f6c] text-[#ff3f6c]"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ============================================================== */}
      {/* 4. Sort & Filter Controls + Product Grid                       */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-4 py-6">
        {/* Top bar: result count, sort, mobile filter toggle */}
        <div className="flex items-center justify-between mb-6 gap-3">
          <p className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{filteredProducts.length}</span>{" "}
            {filteredProducts.length === 1 ? "product" : "products"} found
            {activeCategory !== "All" && (
              <span>
                {" "}
                in <span className="font-semibold text-gray-700">{activeCategory}</span>
              </span>
            )}
          </p>

          <div className="flex items-center gap-3">
            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSortDropdown((prev) => !prev);
                }}
                className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
              >
                <span className="hidden sm:inline">Sort by:</span>
                <span className="text-gray-900">
                  {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSortDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-40 min-w-[200px] py-1">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setShowSortDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                        sortBy === opt.value
                          ? "text-[#ff3f6c] font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors relative"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#ff3f6c] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* ----- Desktop Filter Sidebar ----- */}
          <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-14 h-fit pr-6 border-r border-gray-100">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-base uppercase tracking-wide">Filters</h3>
              {activeFilterCount > 0 && (
                <span className="text-xs font-bold text-[#ff3f6c] bg-pink-50 px-2 py-0.5 rounded-full">
                  {activeFilterCount} active
                </span>
              )}
            </div>
            {filterContent}
          </aside>

          {/* ----- Mobile Filter Drawer ----- */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setShowMobileFilters(false)}
              />
              {/* Drawer */}
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[90vw] bg-white shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4">{filterContent}</div>
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-3 rounded-lg font-bold text-white text-sm uppercase tracking-wider"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Show {filteredProducts.length} Results
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. Product Grid                                              */}
          {/* ============================================================ */}
          <div className="flex-1 min-w-0">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-6">
                {filteredProducts.map((product) => {
                  const images = getProductImages(product.images);
                  const firstImage = images.length > 0 ? images[0] : null;
                  const price = Number(product.price);
                  const compareAt = product.compareAtPrice
                    ? Number(product.compareAtPrice)
                    : undefined;
                  const discount = calcDiscount(price, compareAt);
                  const isOutOfStock = product.stockQuantity === 0;

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col bg-white rounded-lg overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300"
                    >
                      {/* Image container */}
                      <Link
                        href={`/products/${product.id}`}
                        className="relative block overflow-hidden"
                        style={{ aspectRatio: "3/4" }}
                      >
                        <div className="relative w-full h-full bg-gray-100">
                          {firstImage ? (
                            <Image
                              src={firstImage}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                              <Package className="w-12 h-12 text-gray-300" />
                            </div>
                          )}

                          {/* Out of stock overlay */}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                              <span className="bg-gray-900 text-white text-xs font-bold uppercase px-3 py-1.5 rounded">
                                Out of Stock
                              </span>
                            </div>
                          )}

                          {/* Discount badge */}
                          {discount > 0 && !isOutOfStock && (
                            <div className="absolute top-2 left-2 bg-orange-500 text-white text-[11px] font-bold px-2 py-1 rounded">
                              {discount}% OFF
                            </div>
                          )}

                          {/* Add to cart overlay on hover */}
                          {!isOutOfStock && (
                            <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                              <div className="bg-white rounded-lg shadow-lg p-2">
                                <AddToCartButton
                                  product={product}
                                  vendorName={vendor.businessName}
                                />
                              </div>
                            </div>
                          )}

                          {/* Rating badge */}
                          {product.averageRating && Number(product.averageRating) > 0 && (
                            <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1 shadow-sm group-hover:opacity-0 transition-opacity duration-300">
                              <span>{Number(product.averageRating).toFixed(1)}</span>
                              <Star className="w-3 h-3 fill-[#ff3f6c] text-[#ff3f6c]" />
                              <span className="text-gray-400 border-l border-gray-300 pl-1 ml-0.5 font-normal">
                                {product.reviewCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product info */}
                      <div className="p-3 flex-1 flex flex-col">
                        <Link href={`/products/${product.id}`} className="flex-1">
                          <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 mb-1.5">
                            {product.name}
                          </h3>
                        </Link>

                        <div className="flex items-center gap-2 flex-wrap mt-auto">
                          <span className="text-sm font-bold text-gray-900">
                            &#8377;{price.toFixed(0)}
                          </span>
                          {discount > 0 && compareAt && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                &#8377;{compareAt.toFixed(0)}
                              </span>
                              <span className="text-xs font-bold text-orange-500">
                                ({discount}% OFF)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ======================================================== */
              /* 6. Empty State                                            */
              /* ======================================================== */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="w-16 h-16 text-gray-200 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  No products found
                </h3>
                <p className="text-sm text-gray-500 max-w-sm mb-6">
                  We couldn&apos;t find any products matching your current filters. Try
                  adjusting your selections or browse all products.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* Bottom Trust Bar                                                */}
      {/* ============================================================== */}
      <section className="bg-gray-50 border-t border-gray-200 py-10 mt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: "Free Delivery",
                desc: "On orders above \u20B9499",
                color: "text-[#ff3f6c]",
                bg: "bg-pink-50",
              },
              {
                icon: Package,
                title: "Easy Returns",
                desc: "7-day return policy",
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: ShoppingBag,
                title: "100% Authentic",
                desc: "Quality guaranteed",
                color: "text-green-600",
                bg: "bg-green-50",
              },
              {
                icon: Star,
                title: "Top Rated",
                desc: "Trusted by customers",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-100"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
