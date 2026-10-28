"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { useRouter, usePathname } from "next/navigation";
import CartIcon from "@/components/cart/CartIcon";
import CartBar from "@/components/cart/CartBar";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import NotificationBell from "@/components/NotificationBell";
import SearchOverlay from "@/components/search/SearchOverlay";
import { preloadCriticalRoutes } from "@/lib/utils/navigation";
import { signInHref } from "@/lib/auth/returnTo";
import { useOpenShopTypes } from "@/hooks/useOpenShopTypes";
import {
  Bell,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock,
  CalendarCheck,
  Heart,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  Map as MapIcon,
  MapPin,
  Mic,
  Package,
  Search,
  Store,
  User,
  X,
} from "lucide-react";

// Screens that are a focused task (or have their own navigation)
const NO_TAB_BAR = ["/checkout", "/orders/waiting", "/vendor", "/admin", "/sign-in", "/sign-up", "/phone-signin", "/auth"];
const FOCUSED = ["/checkout", "/orders/waiting"];

// Desktop category strip → shop list filtered by category. A category
// shows only once a shop of that kind is open (no links to empty pages).
const CATEGORIES: { label: string; href: string; type?: string }[] = [
  { label: "Shops on map", href: "/map" },
  { label: "All shops", href: "/stores" },
  { label: "Sarees & Fashion", href: "/stores?category=clothing", type: "FASHION" },
  { label: "Groceries", href: "/stores?category=grocery", type: "GROCERY" },
  { label: "Pharmacy", href: "/stores?category=medical", type: "PHARMACY" },
  { label: "Electronics", href: "/stores?category=electronics", type: "ELECTRONICS" },
  { label: "Home & Kitchen", href: "/stores?category=home-kitchen", type: "HOME_SERVICES" },
];
const SEARCH_HINTS = ["saree", "doodh", "atta", "medicine", "kurti", "mobile cover", "chawal"];

function placeText(location: { locality?: string; city?: string; pincode?: string } | null) {
  if (!location) return null;
  const place = location.locality || location.city || "your area";
  return location.pincode ? `${place} ${location.pincode}` : place;
}

/** LocalMart wordmark — always takes you home */
function Logo({ onHome }: { onHome: () => void }) {
  return (
    <Link
      href="/"
      onClick={onHome}
      aria-label="LocalMart home"
      className="flex shrink-0 items-baseline rounded-md py-1 text-[22px] font-extrabold leading-none tracking-[-0.03em] text-label focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tint"
    >
      Local<span className="text-coral">Mart</span>
    </Link>
  );
}

function hasVoice() {
  if (typeof window === "undefined") return false;
  const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showAccount, setShowAccount] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [vendorStatus, setVendorStatus] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const openTypes = useOpenShopTypes();
  const [search, setSearch] = useState<{ open: boolean; voice: boolean }>({ open: false, voice: false });
  const [voiceOk, setVoiceOk] = useState(false);
  const { location } = useLocation();
  const router = useRouter();
  const pathname = usePathname();

  const showTabBar = !NO_TAB_BAR.some((p) => pathname.startsWith(p));
  const focused = FOCUSED.some((p) => pathname.startsWith(p));
  // Shop-owner and admin screens: no shopping chrome (area, search, cart)
  const adminArea = pathname.startsWith("/admin");
  const sellerArea = pathname.startsWith("/vendor") || adminArea;
  const authPage = ["/sign-in", "/sign-up", "/phone-signin"].some((p) => pathname.startsWith(p));
  const shopping = !sellerArea && !focused && !authPage;
  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0];

  useEffect(() => setVoiceOk(hasVoice()), []);

  // Once the shopper scrolls, fold the header down to just what's needed:
  // phones keep the search bar, desktop drops the category row
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        setCompact((c) => (c ? y > 40 : y > 140));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Publish the header's height (--header-h) so bars like a shop's filter
  // chips can stick right under it on any screen size
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const set = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Rotating search hint, like the big grocery apps — shows what you can type
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((i) => (i + 1) % SEARCH_HINTS.length), 2800);
    return () => clearInterval(t);
  }, []);

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
    setSearch({ open: false, voice: false });
  }, [pathname]);

  useEffect(() => {
    const criticalRoutes = ["/", "/stores", "/favorite-stores", "/my-orders", "/profile"];
    criticalRoutes.forEach((route) => router.prefetch(route));
    preloadCriticalRoutes(router, criticalRoutes);
  }, [router]);

  // "/" opens search on desktop, like most shops
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        setSearch({ open: true, voice: false });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock page scroll while the account sheet is open
  useEffect(() => {
    if (!showAccount) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAccount]);

  const handleSignOut = async () => {
    setShowAccount(false);
    await signOut();
    // A full load to home: drops anything private kept in memory, and wins over
    // a signed-in-only page (like Orders) that would send them to sign-in
    window.location.assign("/");
  };

  // Tapping the logo on the home page takes you back to the top
  const onHome = () => {
    if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const sellerLink = isApprovedVendor
    ? { href: "/vendor/dashboard", label: "Seller dashboard", icon: Store }
    : vendorStatus
      ? { href: "/become-vendor", label: "Seller application", note: "Waiting for approval", icon: Clock }
      : { href: "/become-vendor", label: "Sell on LocalMart", icon: Store };

  const openSearch = (voice = false) => setSearch({ open: true, voice });

  const searchTrigger = (desktop: boolean) => (
    <div className={`relative flex w-full items-center ${desktop ? "h-11" : "h-11"}`}>
      <button
        type="button"
        onClick={() => openSearch(false)}
        className="flex h-full min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-hairline bg-fill pl-3.5 pr-12 text-left text-[15px] text-label-3 cursor-text hover:border-label/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-tint"
        aria-label="Search shops and products"
      >
        <Search className="h-5 w-5 shrink-0 text-label-2" aria-hidden />
        <span className="truncate">
          Search for <span key={hint} className="animate-[hintIn_300ms_ease-out] text-label-2 motion-reduce:animate-none">&ldquo;{SEARCH_HINTS[hint]}&rdquo;</span>
        </span>
      </button>
      {voiceOk && (
        <button
          type="button"
          onClick={() => openSearch(true)}
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-label hover:bg-fill-strong cursor-pointer"
          aria-label="Search by voice"
        >
          <Mic className="h-5 w-5" />
        </button>
      )}
    </div>
  );

  const place = placeText(location);

  const locationButton = (
    <button
      onClick={() => setShowLocationModal(true)}
      className="flex min-w-0 flex-1 flex-col items-start border-l border-hairline pl-3 text-left cursor-pointer lg:w-full lg:border-l-0 lg:pl-0"
      aria-label={place ? `Delivering to ${place}. Change area` : "Choose your area"}
    >
      <span className="text-[12px] leading-tight text-label-2">Deliver to</span>
      <span className="flex max-w-full items-center gap-0.5 text-[15px] font-bold leading-tight text-label">
        <span className="truncate">{place ?? "Choose area"}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      </span>
    </button>
  );

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/stores", label: "Shops", icon: Store, active: pathname.startsWith("/stores") },
    { href: "/map", label: "Map", icon: MapIcon, active: pathname.startsWith("/map") },
    { href: "/my-orders", label: "Orders", icon: Package, active: pathname.startsWith("/my-orders") || pathname.startsWith("/orders") },
  ];
  const accountActive = ["/profile", "/favorite-stores", "/notifications"].some((p) => pathname.startsWith(p));

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 border-b border-hairline bg-white">
        {/* ── Phone header: logo + delivery area, then search ── */}
        <div className="lg:hidden">
          <div className={`h-14 items-center gap-3 px-4 ${compact && shopping ? "hidden" : "flex"}`}>
            <Logo onHome={onHome} />
            {shopping ? (
              locationButton
            ) : (
              <div className="flex min-w-0 flex-1 items-center">
                {sellerArea && <span className="rounded-md bg-tint-soft px-2 py-0.5 text-[13px] font-semibold text-tint">{adminArea ? "Admin" : "Seller"}</span>}
                {focused && (
                  <span className="flex items-center gap-1 text-[14px] font-semibold text-label-2">
                    <Lock className="h-4 w-4" aria-hidden /> Secure checkout
                  </span>
                )}
              </div>
            )}
            <div className="flex shrink-0 items-center">
              {!focused && (
                <button
                  onClick={() => (user || loading ? setShowAccount(true) : router.push(signInHref(pathname)))}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-label hover:bg-fill cursor-pointer"
                  aria-label={user ? "Account" : "Sign in"}
                >
                  <User className="h-6 w-6" strokeWidth={1.9} aria-hidden />
                </button>
              )}
              {!sellerArea && !focused && <CartIcon />}
            </div>
          </div>
          {/* The map has its own search box */}
          {shopping && !pathname.startsWith("/map") && (
            <div className={`flex gap-2 px-4 pb-3 ${compact ? "pt-2" : ""}`}>
              <div className="min-w-0 flex-1">{searchTrigger(false)}</div>
              {/* The shop map, one tap from anywhere */}
              <Link
                href="/map"
                aria-label="Shops on the map"
                className="flex h-11 shrink-0 flex-col items-center justify-center rounded-xl border border-hairline bg-fill px-2.5 text-label hover:border-label/25 active:bg-fill-strong"
              >
                <MapIcon className="h-[18px] w-[18px] text-tint" strokeWidth={2.2} aria-hidden />
                <span className="text-[11px] font-semibold leading-none">Map</span>
              </Link>
            </div>
          )}
        </div>

        {/* ── Desktop header ── */}
        <div className="mx-auto hidden h-16 max-w-[1400px] items-center gap-6 px-8 lg:flex">
          <Logo onHome={onHome} />
          {sellerArea && <span className="rounded-md bg-tint-soft px-2 py-0.5 text-[13px] font-semibold text-tint">{adminArea ? "Admin" : "Seller"}</span>}
          {shopping && <div className="w-[220px] shrink-0">{locationButton}</div>}
          <div className="flex-1">{shopping && searchTrigger(true)}</div>
          <nav className="flex shrink-0 items-center gap-1 text-label">
            {user && <NotificationBell />}
            {loading ? (
              <span className="h-10 w-24 animate-pulse rounded-lg bg-fill" />
            ) : (
              <button
                onClick={() => (user ? setShowAccount(true) : router.push(signInHref(pathname)))}
                className="flex h-11 items-center gap-2 rounded-lg px-3 text-[15px] font-medium hover:bg-fill cursor-pointer"
              >
                <User className="h-5 w-5" aria-hidden />
                {user ? firstName ?? "Account" : "Sign in"}
              </button>
            )}
            {!sellerArea && (
              <Link href="/my-orders" className="flex h-11 items-center gap-2 rounded-lg px-3 text-[15px] font-medium hover:bg-fill">
                <Package className="h-5 w-5" aria-hidden /> Orders
              </Link>
            )}
            {!sellerArea && <CartIcon showLabel />}
          </nav>
        </div>

        {/* ── Desktop category strip (folds away once you scroll) ── */}
        {shopping && !compact && (
          <nav aria-label="Categories" className="hidden border-t border-hairline lg:block">
            <div className="mx-auto flex h-11 max-w-[1400px] items-center gap-1 overflow-x-auto px-6 text-[14px] scrollbar-hide">
              {CATEGORIES.filter((c) => !c.type || openTypes?.has(c.type)).map((c) => (
                <Link key={c.href} href={c.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 font-medium text-label-2 hover:bg-fill hover:text-label">
                  {c.label}
                </Link>
              ))}
              <Link href={sellerLink.href} className="ml-auto whitespace-nowrap rounded-lg px-3 py-1.5 font-semibold text-tint hover:bg-tint-soft">
                {sellerLink.label}
              </Link>
            </div>
          </nav>
        )}

        <LocationSelectorModal isOpen={showLocationModal} onClose={() => setShowLocationModal(false)} />
      </header>

      <SearchOverlay
        open={search.open}
        startWithVoice={search.voice}
        onClose={() => setSearch({ open: false, voice: false })}
      />

      {/* Product pages have their own buy bar */}
      <CartBar
        visible={shopping && !["/cart", "/products/", "/become-vendor", "/map"].some((p) => pathname.startsWith(p))}
        aboveTabBar={showTabBar}
      />

      {/* ── Phone tab bar ── */}
      {showTabBar && (
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-white pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_8px_rgba(15,17,17,0.06)] lg:hidden"
        >
          <div className="mx-auto grid h-14 max-w-md grid-cols-5">
            {tabs.map(({ href, label, icon: Icon, active }) => (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 text-[12px] ${
                  active ? "font-bold text-tint" : "font-medium text-label-2"
                }`}
              >
                {active && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-tint" aria-hidden />}
                <Icon className="h-6 w-6" strokeWidth={active ? 2.3 : 1.8} aria-hidden />
                {label}
              </Link>
            ))}
            <button
              onClick={() => (user || loading ? setShowAccount(true) : router.push(signInHref(pathname)))}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[12px] cursor-pointer ${
                accountActive ? "font-bold text-tint" : "font-medium text-label-2"
              }`}
            >
              {accountActive && <span className="absolute top-0 h-[3px] w-10 rounded-b bg-tint" aria-hidden />}
              <User className="h-6 w-6" strokeWidth={accountActive ? 2.3 : 1.8} aria-hidden />
              {user ? "Account" : "Sign in"}
            </button>
          </div>
        </nav>
      )}

      {/* ── Account sheet (phone: slides up; desktop: panel) ── */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${showAccount ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setShowAccount(false)}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className={`fixed inset-x-0 bottom-0 z-[70] max-h-[88vh] overflow-y-auto rounded-t-2xl bg-canvas pb-[calc(16px+env(safe-area-inset-bottom,0px))] shadow-2xl transition-transform duration-300 ease-out lg:inset-x-auto lg:right-6 lg:top-[68px] lg:bottom-auto lg:w-[380px] lg:rounded-2xl ${
          showAccount ? "translate-y-0 lg:visible" : "translate-y-full lg:invisible lg:translate-y-0"
        }`}
      >
        <div className="flex items-center justify-between rounded-t-2xl bg-navy px-4 py-4 text-white">
          <div className="min-w-0">
            <p className="text-[13px] text-white/70">{user ? "Signed in as" : "Welcome to LocalMart"}</p>
            <p className="truncate text-[18px] font-bold">{user ? user.email || user.phone : "Shop from shops near you"}</p>
          </div>
          <button
            onClick={() => setShowAccount(false)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-2 text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pt-4">
          {!user && (
            <div className="mb-5 rounded-xl bg-card p-4">
              <Link
                href={signInHref(pathname)}
                className="flex h-12 w-full items-center justify-center rounded-full bg-cta text-[16px] font-semibold text-white hover:bg-cta-hover"
              >
                Sign in or create account
              </Link>
            </div>
          )}

          <SheetGroup>
            <SheetRow icon={MapPin} label="Delivery area" value={place ?? "Choose your area"} onClick={() => { setShowAccount(false); setShowLocationModal(true); }} />
            {user && <SheetRow icon={Package} label="Your orders" href="/my-orders" />}
            {user && <SheetRow icon={CalendarClock} label="My rentals" href="/my-rentals" />}
            {user && <SheetRow icon={Clock} label="Kept for me" href="/my-holds" />}
            {user && <SheetRow icon={CalendarCheck} label="Your shop visits" href="/my-visits" />}
            {user && <SheetRow icon={Heart} label="Favourite shops" href="/favorite-stores" />}
            {user && <SheetRow icon={Bell} label="Notifications" href="/notifications" />}
            {user && <SheetRow icon={User} label="Your profile" href="/profile" />}
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
  return <div className="mb-4 overflow-hidden rounded-xl border border-hairline bg-card divide-y divide-hairline">{children}</div>;
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
      <Icon className="h-5 w-5 shrink-0 text-label-2" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] text-label">{label}</span>
        {value && <span className="block truncate text-[14px] text-label-2">{value}</span>}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
    </>
  );
  const cls = "flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left active:bg-fill hover:bg-fill cursor-pointer";
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
