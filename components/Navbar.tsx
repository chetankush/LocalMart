"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import CartIcon from "@/components/cart/CartIcon";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import NotificationBell from "@/components/NotificationBell";
import { useStoreBranding } from "@/context/StoreBrandingContext";
import { preloadCriticalRoutes } from "@/lib/utils/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  HelpCircle,
  Home,
  LogOut,
  MapPin,
  Package,
  Search,
  Store,
  User,
  X,
} from "lucide-react";

// Screens that are a focused task (or have their own navigation): no tab bar
const NO_TAB_BAR = ["/checkout", "/orders/waiting", "/vendor", "/admin", "/sign-in", "/sign-up", "/phone-signin", "/auth"];
// Screens where search is the natural next step
const SHOW_SEARCH = (p: string) => p === "/" || p === "/stores" || p.startsWith("/search");

function locationText(location: { locality?: string; city?: string; pincode?: string } | null) {
  if (!location) return "Choose your area";
  const place = location.locality || location.city || "Your area";
  return location.pincode ? `${place} · ${location.pincode}` : place;
}

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showAccount, setShowAccount] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { location } = useLocation();
  const { branding } = useStoreBranding();
  const router = useRouter();
  const pathname = usePathname();

  const showTabBar = !NO_TAB_BAR.some((p) => pathname.startsWith(p));
  const showSearch = SHOW_SEARCH(pathname);
  // Shop-owner and admin screens: no shopping chrome (area, search, cart)
  const sellerArea = pathname.startsWith("/vendor") || pathname.startsWith("/admin");

  // Is this user an approved vendor, or waiting for approval?
  useEffect(() => {
    if (!user) {
      setIsApprovedVendor(false);
      setVendorStatus(null);
      return;
    }
    import("@/lib/api/client").then(({ apiClient }) => {
      apiClient
        .checkVendor()
        .then((response) => {
          const data = response.data;
          if (!data) {
            setIsApprovedVendor(false);
            setVendorStatus(null);
            return;
          }
          const hasActiveStore = data.stores?.some((s) => s.status === "ACTIVE");
          if (data.hasVendor && hasActiveStore) {
            setIsApprovedVendor(true);
            setVendorStatus(null);
          } else if (data.vendorRequest?.status === "PENDING") {
            setIsApprovedVendor(false);
            setVendorStatus("PENDING");
          } else if (data.hasVendor && data.stores?.every((s) => s.status === "PENDING_APPROVAL")) {
            setIsApprovedVendor(false);
            setVendorStatus("PENDING_APPROVAL");
          } else if (data.hasVendor && data.stores?.length > 0) {
            setIsApprovedVendor(true);
            setVendorStatus(null);
          } else {
            setIsApprovedVendor(false);
            setVendorStatus(null);
          }
        })
        .catch(() => {
          setIsApprovedVendor(false);
          setVendorStatus(null);
        });
    });
  }, [user]);

  useEffect(() => {
    setShowAccount(false);
    setShowSearchResults(false);
  }, [pathname]);

  useEffect(() => {
    const criticalRoutes = ["/", "/stores", "/favorite-stores", "/my-orders", "/profile"];
    criticalRoutes.forEach((route) => router.prefetch(route));
    preloadCriticalRoutes(router, criticalRoutes);
  }, [router]);

  // Live search (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { apiClient } = await import("@/lib/api/client");
        const { data } = await apiClient.search(searchQuery, {
          city: location?.city,
          pincode: location?.pincode,
          lat: location?.latitude,
          lng: location?.longitude,
        });
        setSearchResults(data);
        setShowSearchResults(true);
      } catch {
        setSearchResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, location?.city, location?.pincode, location?.latitude, location?.longitude]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".search-container")) setShowSearchResults(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Lock page scroll while the account sheet is open
  useEffect(() => {
    document.body.style.overflow = showAccount ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAccount]);

  const handleSignOut = async () => {
    setShowAccount(false);
    await signOut();
    router.push("/");
  };

  const goto = (href: string) => {
    setShowSearchResults(false);
    setSearchQuery("");
    router.push(href);
  };

  const sellerLink = isApprovedVendor
    ? { href: "/vendor/dashboard", label: "Seller dashboard", icon: Store }
    : vendorStatus
      ? { href: "/become-vendor", label: "Seller application", note: "Waiting for approval", icon: Clock }
      : { href: "/become-vendor", label: "Sell on LocalMart", icon: Store };

  const searchBox = (id: string) => (
    <div className="search-container relative w-full">
      <label htmlFor={id} className="sr-only">
        Search shops and products
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-label-2" aria-hidden />
      <input
        id={id}
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => searchQuery && setShowSearchResults(true)}
        placeholder="Search shops and products"
        autoComplete="off"
        className="h-11 w-full rounded-xl bg-fill pl-10 pr-10 text-[16px] text-label placeholder:text-label-2 outline-none focus:bg-white focus:ring-2 focus:ring-tint/40"
      />
      {isSearching && (
        <span className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-label-3 border-t-transparent" />
      )}

      {showSearchResults && searchResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-hairline bg-card shadow-xl">
          {searchResults.stores?.length > 0 && (
            <div className="py-2">
              <p className="px-4 pb-1 pt-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Shops</p>
              {searchResults.stores.map((store: any) => (
                <button
                  key={store.id}
                  onClick={() => goto(`/stores/${store.id}`)}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left active:bg-fill hover:bg-canvas"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-saffron-soft">
                    <Store className="h-5 w-5 text-tint" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] text-label">{store.businessName}</span>
                    <span className="block truncate text-[14px] text-label-2">{store.city}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchResults.products?.length > 0 && (
            <div className="border-t border-hairline py-2">
              <p className="px-4 pb-1 pt-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-label-2">Products</p>
              {searchResults.products.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => goto(`/products/${product.id}`)}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left active:bg-fill hover:bg-canvas"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-fill">
                    <Package className="h-5 w-5 text-label-2" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[16px] text-label">{product.name}</span>
                    <span className="block truncate text-[14px] text-label-2">
                      ₹{product.price} · {product.vendor?.businessName}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {!searchResults.stores?.length && !searchResults.products?.length && (
            <div className="px-6 py-8 text-center text-[15px] text-label-2">
              Nothing found for “{searchQuery}”
            </div>
          )}
        </div>
      )}
    </div>
  );

  const locationButton = (
    <button
      onClick={() => setShowLocationModal(true)}
      className="flex min-h-[44px] min-w-0 items-center gap-2 rounded-xl px-1 text-left active:opacity-60 cursor-pointer"
      aria-label={`Delivery area: ${locationText(location)}. Change`}
    >
      <MapPin className="h-5 w-5 shrink-0 text-tint" aria-hidden />
      <span className="min-w-0">
        <span className="block text-[12px] leading-tight text-label-2">{location ? "Delivering to" : "Where should we deliver?"}</span>
        <span className="flex items-center gap-0.5 text-[15px] font-semibold leading-tight text-label">
          <span className="truncate">{locationText(location)}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-label-2" aria-hidden />
        </span>
      </span>
    </button>
  );

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/stores", label: "Shops", icon: Store, active: pathname.startsWith("/stores") },
    { href: "/my-orders", label: "Orders", icon: Package, active: pathname.startsWith("/my-orders") || pathname.startsWith("/orders") },
  ];
  const accountActive = ["/profile", "/favorite-stores", "/notifications"].some((p) => pathname.startsWith(p));

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-hairline bg-white/90 backdrop-blur-xl">
        {/* ── Phone header ── */}
        <div className="lg:hidden">
          <div className="flex h-14 items-center justify-between gap-2 px-3">
            {sellerArea ? (
              <Link href="/vendor/dashboard" className="flex min-h-[44px] items-center gap-2 text-[18px] font-bold tracking-[-0.02em] text-label">
                <span className="h-2.5 w-2.5 rounded-full bg-saffron" aria-hidden />
                LocalMart
                <span className="rounded-md bg-fill px-1.5 py-0.5 text-[12px] font-semibold text-label-2">Seller</span>
              </Link>
            ) : branding ? (
              <div className="flex min-w-0 items-center gap-1">
                <Link
                  href="/stores"
                  aria-label="Back to shops"
                  className="-ml-1 flex h-11 w-11 items-center justify-center rounded-full text-tint active:bg-fill"
                >
                  <ChevronLeft className="h-6 w-6" strokeWidth={2.2} />
                </Link>
                <Link href={`/stores/${branding.storeId}`} className="flex min-w-0 items-center gap-2">
                  {branding.storeLogo && (
                    <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-fill">
                      <Image src={branding.storeLogo} alt="" fill className="object-cover" />
                    </span>
                  )}
                  <span className="truncate text-[17px] font-semibold text-label">{branding.storeName}</span>
                </Link>
              </div>
            ) : (
              locationButton
            )}
            <div className="flex shrink-0 items-center">
              {sellerArea ? (
                <button
                  onClick={() => setShowAccount(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-label active:bg-fill cursor-pointer"
                  aria-label="Account"
                >
                  <User className="h-6 w-6" strokeWidth={1.9} />
                </button>
              ) : (
                <CartIcon />
              )}
            </div>
          </div>
          {showSearch && !branding && !sellerArea && <div className="px-3 pb-3">{searchBox("search-phone")}</div>}
        </div>

        {/* ── Desktop header ── */}
        <div className="mx-auto hidden h-16 max-w-7xl items-center gap-5 px-6 lg:flex">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-[20px] font-bold tracking-[-0.02em] text-label">
            <span className="h-3 w-3 rounded-full bg-saffron" aria-hidden />
            LocalMart
          </Link>
          {sellerArea ? (
            <span className="rounded-md bg-fill px-2 py-0.5 text-[13px] font-semibold text-label-2">Seller</span>
          ) : branding ? (
            <Link href={`/stores/${branding.storeId}`} className="flex min-w-0 items-center gap-2 border-l border-hairline pl-5">
              {branding.storeLogo && (
                <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-fill">
                  <Image src={branding.storeLogo} alt="" fill className="object-cover" />
                </span>
              )}
              <span className="truncate text-[16px] font-semibold text-label">{branding.storeName}</span>
            </Link>
          ) : (
            <div className="max-w-[240px] shrink-0">{locationButton}</div>
          )}
          <div className="mx-auto w-full max-w-md">{!sellerArea && searchBox("search-desktop")}</div>
          <nav className="flex shrink-0 items-center gap-1 text-[15px] font-medium">
            <Link href="/stores" className="rounded-lg px-3 py-2 text-label hover:bg-fill">Shops</Link>
            <Link href="/my-orders" className="rounded-lg px-3 py-2 text-label hover:bg-fill">Orders</Link>
            <Link href="/favorite-stores" className="rounded-lg px-3 py-2 text-label hover:bg-fill">Favourites</Link>
            {user && <NotificationBell />}
            <CartIcon />
            {loading ? (
              <span className="ml-1 h-9 w-9 animate-pulse rounded-full bg-fill" />
            ) : !user ? (
              <Link href="/sign-in" className="ml-1 rounded-xl bg-label px-4 py-2 text-white hover:bg-[#3a3a3c]">
                Sign in
              </Link>
            ) : (
              <button
                onClick={() => setShowAccount(true)}
                className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-saffron-soft text-[15px] font-semibold text-tint cursor-pointer"
                aria-label="Account"
              >
                {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
              </button>
            )}
          </nav>
        </div>

        <LocationSelectorModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
      </header>

      {/* ── Phone tab bar ── */}
      {showTabBar && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto grid h-14 max-w-md grid-cols-4">
            {tabs.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium ${active ? "text-tint" : "text-label-2"}`}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                {label}
              </Link>
            ))}
            <button
              onClick={() => setShowAccount(true)}
              className={`flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium cursor-pointer ${accountActive ? "text-tint" : "text-label-2"}`}
            >
              <User className="h-6 w-6" strokeWidth={accountActive ? 2.3 : 1.8} aria-hidden />
              Account
            </button>
          </div>
        </nav>
      )}

      {/* ── Account sheet (phone: slides up; desktop: panel) ── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-200 ${showAccount ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowAccount(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className={`fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-canvas pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-2xl transition-transform duration-300 ease-out lg:inset-x-auto lg:right-6 lg:top-20 lg:bottom-auto lg:w-[380px] lg:rounded-3xl ${
          showAccount ? "translate-y-0 lg:visible" : "translate-y-full lg:invisible lg:translate-y-0"
        }`}
      >
        <div className="sticky top-0 flex items-center justify-between bg-canvas/95 px-4 pb-2 pt-3 backdrop-blur">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-fill-strong lg:hidden" aria-hidden />
          <button
            onClick={() => setShowAccount(false)}
            className="absolute right-3 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-fill text-label-2 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4">
          <h2 className="pb-4 text-[28px] font-bold tracking-[-0.02em] text-label">Account</h2>

          {user ? (
            <div className="mb-6 flex items-center gap-3 rounded-2xl bg-card p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-saffron-soft text-[20px] font-semibold text-tint">
                {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[17px] font-semibold text-label">{user.email || user.phone}</span>
                <Link href="/profile" className="text-[15px] text-tint">View profile</Link>
              </span>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl bg-card p-4">
              <p className="mb-3 text-[16px] text-label-2">Sign in to order and track your deliveries.</p>
              <Link
                href="/sign-in"
                className="flex h-[52px] w-full items-center justify-center rounded-xl bg-label text-[17px] font-semibold text-white"
              >
                Sign in or create account
              </Link>
            </div>
          )}

          <SheetGroup>
            <SheetRow icon={MapPin} label="Delivery area" value={locationText(location)} onClick={() => { setShowAccount(false); setShowLocationModal(true); }} />
            {user && <SheetRow icon={Package} label="My orders" href="/my-orders" />}
            {user && <SheetRow icon={Heart} label="Favourite shops" href="/favorite-stores" />}
            {user && <SheetRow icon={Bell} label="Notifications" href="/notifications" />}
          </SheetGroup>

          {user && (
            <SheetGroup>
              <SheetRow icon={sellerLink.icon} label={sellerLink.label} value={"note" in sellerLink ? sellerLink.note : undefined} href={sellerLink.href} />
            </SheetGroup>
          )}

          <SheetGroup>
            <SheetRow icon={HelpCircle} label="Help & questions" href="/faq" />
          </SheetGroup>

          {user && (
            <SheetGroup>
              <button
                onClick={handleSignOut}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 text-[16px] font-medium text-bad active:bg-fill cursor-pointer"
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Sign out
              </button>
            </SheetGroup>
          )}
        </div>
      </div>
    </>
  );
};

function SheetGroup({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 overflow-hidden rounded-2xl bg-card divide-y divide-hairline">{children}</div>;
}

function SheetRow({
  icon: Icon,
  label,
  value,
  href,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value?: string;
  href?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-fill">
        <Icon className="h-[18px] w-[18px] text-label" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-label">{label}</span>
        {value && <span className="block truncate text-[14px] text-label-2">{value}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
    </>
  );
  const cls = "flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left active:bg-fill cursor-pointer";
  return href ? (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export default Navbar;
