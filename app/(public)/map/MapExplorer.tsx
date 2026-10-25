"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { List, LocateFixed, Loader2, MapPin, Search, X } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { Sheet } from "@/components/app/Sheet";
import MapShopCard, { type MapShopDetails } from "@/components/map/MapShopCard";
import { SHOP_TYPES, shopType } from "@/components/map/shopTypes";
import { DEFAULT_TOWN, searchPlaces } from "@/lib/geo";

// Leaflet needs the browser
const ShopMap = dynamic(() => import("@/components/map/ShopMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-fill" />,
});

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const TRY_WORDS = ["saree", "atta", "medicine", "milk", "mobile cover", "chappal"];

const cx = (...p: (string | false | null | undefined)[]) => p.filter(Boolean).join(" ");

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const set = () => setDesktop(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  return desktop;
}

/**
 * Shops near you on the map. Phones: map fills the screen, search on top,
 * swipeable shop cards at the bottom (like Google Maps). Desktop: the list
 * on the left, the map on the right.
 */
export default function MapExplorer({ initialQuery, initialType }: { initialQuery: string; initialType: string | null }) {
  const { location, detectAndSetLocation } = useLocation();
  const desktop = useIsDesktop();
  const [input, setInput] = useState(initialQuery);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<string | null>(initialType);
  const [shops, setShops] = useState<MapShopDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  // A place they searched for ("bus stand", "Civil Lines"): shops nearest to it
  const [place, setPlace] = useState<{ name: string; detail: string; lat: number; lng: number } | null>(null);
  const carousel = useRef<HTMLDivElement>(null);
  const fromCarousel = useRef(false);

  const user = useMemo(
    () =>
      typeof location?.latitude === "number" && typeof location?.longitude === "number"
        ? { lat: location.latitude, lng: location.longitude }
        : null,
    [location?.latitude, location?.longitude],
  );

  // Load shops for the search + where you are (or the place searched for)
  useEffect(() => {
    let live = true;
    setLoading(true);
    setFailed(false);
    const params = new URLSearchParams();
    const from = place ?? user;
    if (from) {
      params.set("lat", String(from.lat));
      params.set("lng", String(from.lng));
    }
    if (query && !place) params.set("q", query);
    fetch(`${API}/public/map?${params}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(async (res) => {
        const list: MapShopDetails[] = res.data?.shops ?? [];
        // No shop sells it or is called that — it may be a place, like Google Maps
        if (query && !place && list.length === 0) {
          const words = query.toLowerCase();
          const found = (await searchPlaces(query, user ?? DEFAULT_TOWN.at).catch(() => [])).find(
            (p) => p.name.toLowerCase().includes(words) || words.includes(p.name.toLowerCase()),
          );
          if (!live) return;
          if (found) {
            setPlace({ name: found.name, detail: found.detail, lat: found.lat, lng: found.lng });
            return; // loads again, around the place
          }
        }
        if (!live) return;
        setShops(list);
        setSelectedId(null);
        setLoading(false);
      })
      .catch(() => {
        if (!live) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [query, user, place]);

  // Keep the search in the address so it can be shared
  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (type) url.searchParams.set("type", type);
    else url.searchParams.delete("type");
    window.history.replaceState(null, "", url.toString());
  }, [query, type]);

  const types = useMemo(() => {
    const present = new Set(shops.map((s) => s.businessType));
    return Object.keys(SHOP_TYPES).filter((t) => present.has(t));
  }, [shops]);
  const shown = useMemo(() => (type ? shops.filter((s) => s.businessType === type) : shops), [shops, type]);

  const search = (word: string) => {
    const w = word.trim();
    setInput(w);
    setPlace(null);
    setQuery(w);
  };

  const locate = async () => {
    setLocating(true);
    try {
      await detectAndSetLocation();
      toast.success("Showing shops nearest to you");
    } catch {
      toast.error("Couldn't find your location. Allow location in your browser and try again.");
    } finally {
      setLocating(false);
    }
  };

  // Tap a pin → its card comes into view
  const selectFromMap = useCallback((id: string) => {
    setSelectedId(id);
    fromCarousel.current = false;
    const card = carousel.current?.querySelector<HTMLElement>(`[data-shop="${id}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  // Swipe the cards → the map follows
  useEffect(() => {
    const root = carousel.current;
    if (!root || desktop) return;
    const io = new IntersectionObserver(
      (entries) => {
        const best = entries.filter((e) => e.isIntersecting && e.intersectionRatio > 0.7)[0];
        const id = best?.target.getAttribute("data-shop");
        if (id) {
          fromCarousel.current = true;
          setSelectedId(id);
        }
      },
      { root, threshold: [0.7] },
    );
    root.querySelectorAll("[data-shop]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [shown, desktop]);

  const n = shown.length;
  const shopsWord = n === 1 ? "shop" : "shops";
  const heading = loading
    ? "Finding shops…"
    : n === 0 && query
      ? `No results for “${query}”`
      : place
      ? `${n} ${shopsWord} near ${place.name}`
      : query
        ? shown.every((s) => s.matchedBy === "items")
          ? `${n} ${n === 1 ? "shop sells" : "shops sell"} “${query}”`
          : shown.every((s) => s.matchedBy === "place")
            ? `${n} ${shopsWord} in “${query}”`
            : `${n} ${shopsWord} for “${query}”`
        : user
        ? `${shown.length} ${shown.length === 1 ? "shop" : "shops"} near you`
        : `${shown.length} ${shown.length === 1 ? "shop" : "shops"} on LocalMart`;

  const searchBox = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        search(input);
      }}
      className="relative"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-label-2" aria-hidden />
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        enterKeyHint="search"
        placeholder="Search items, shops or areas"
        aria-label="Search items, shops or areas"
        className="h-11 w-full rounded-full border border-hairline bg-card pl-10 pr-10 text-[16px] text-label placeholder:text-label-3 outline-none focus:border-tint focus:ring-4 focus:ring-tint/10 lg:h-12"
      />
      {input && (
        <button
          type="button"
          onClick={() => search("")}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-label-2 hover:bg-fill cursor-pointer"
          aria-label="Clear search"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      )}
    </form>
  );

  const chips = (
    <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 scrollbar-hide lg:mx-0 lg:flex-wrap lg:px-0">
      {[null, ...types].map((t) => {
        const on = type === t;
        const meta = t ? shopType(t) : null;
        return (
          <button
            key={t ?? "all"}
            type="button"
            onClick={() => setType(t)}
            aria-pressed={on}
            className={cx(
              "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] shadow-[0_1px_3px_rgba(0,0,0,0.12)] transition-colors cursor-pointer lg:h-9 lg:px-3.5 lg:text-[14px]",
              on ? "bg-label font-semibold text-white" : "bg-card font-medium text-label",
            )}
          >
            {meta && <meta.Icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" style={{ color: on ? "#fff" : meta.color }} aria-hidden />}
            {meta ? meta.label : "All shops"}
          </button>
        );
      })}
    </div>
  );

  const locateButton = !user && (
    <button
      type="button"
      onClick={locate}
      disabled={locating}
      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-info-soft px-3 text-[13px] font-semibold text-info disabled:opacity-60 cursor-pointer lg:h-9 lg:text-[14px]"
    >
      {locating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <LocateFixed className="h-4 w-4" aria-hidden />}
      Use my location
    </button>
  );

  // Searched a place: say so, and offer to clear it
  const placeNote = place && !loading && (
    <div className="flex items-start gap-2.5 rounded-2xl bg-card p-3.5 text-[14px] leading-snug text-label-2 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-label" aria-hidden />
      <p className="min-w-0 flex-1">
        Showing shops nearest to <span className="font-semibold text-label">{place.name}</span>
        {place.detail ? `, ${place.detail}` : ""}.
      </p>
      <button type="button" onClick={() => search("")} className="shrink-0 font-semibold text-tint cursor-pointer">
        Clear
      </button>
    </div>
  );

  const emptyState = !loading && shown.length === 0 && (
    <div className="rounded-2xl bg-card p-5 text-center">
      <MapPin className="mx-auto h-8 w-8 text-label-3" aria-hidden />
      <p className="mt-2 text-[16px] font-semibold text-label">
        {failed ? "Couldn't load the map" : query ? `Nothing found for “${query}” nearby yet` : "No shops here yet"}
      </p>
      <p className="mt-1 text-[14px] text-label-2">
        {failed
          ? "Check your internet and try again."
          : query
            ? "Search an item, a shop's name or an area — or try one of these."
            : "New shops are joining LocalMart every week."}
      </p>
      {query && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {TRY_WORDS.filter((w) => w !== query).map((w) => (
            <button key={w} type="button" onClick={() => search(w)} className="h-9 rounded-full bg-fill px-3.5 text-[14px] font-medium text-label cursor-pointer">
              {w}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden bg-canvas lg:grid lg:grid-cols-[420px_minmax(0,1fr)]"
      style={{
        height: desktop
          ? "calc(100vh - var(--header-h, 64px))"
          : "calc(100dvh - var(--header-h, 112px) - 56px - env(safe-area-inset-bottom, 0px))",
        // The page keeps 76px free for the tab bar; the map runs down to it
        marginBottom: desktop ? undefined : -20,
      }}
    >
      <h1 className="sr-only">Shops near you on the map</h1>

      {/* ── Desktop: list panel ── */}
      <aside className="hidden min-h-0 flex-col border-r border-hairline bg-canvas lg:flex">
        <div className="space-y-3 border-b border-hairline bg-card p-4">
          {searchBox}
          {!query && (
            <div className="flex flex-wrap gap-2">
              {TRY_WORDS.slice(0, 5).map((w) => (
                <button key={w} type="button" onClick={() => search(w)} className="h-8 rounded-full bg-fill px-3 text-[13px] font-medium text-label-2 hover:text-label cursor-pointer">
                  {w}
                </button>
              ))}
            </div>
          )}
          {chips}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-2">
          <p className="text-[15px] font-semibold text-label">{heading}</p>
          {locateButton}
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-6">
          {placeNote}
          {loading
            ? [0, 1, 2].map((i) => <div key={i} className="h-[132px] animate-pulse rounded-2xl bg-card" />)
            : shown.map((shop) => (
                <MapShopCard key={shop.id} shop={shop} selected={shop.id === selectedId} onSelect={() => setSelectedId(shop.id)} />
              ))}
          {emptyState}
        </div>
      </aside>

      {/* ── Map ── */}
      <div className="absolute inset-0 lg:relative lg:inset-auto">
        <ShopMap
          className="h-full w-full"
          shops={shown}
          selectedId={selectedId}
          onSelect={desktop ? setSelectedId : selectFromMap}
          user={user}
          place={place}
          fitKey={`${query}|${type}|${user?.lat ?? ""}|${place?.lat ?? ""}|${shown.length}`}
          padding={desktop ? { top: 64, right: 64, bottom: 64, left: 64 } : { top: 112, bottom: 210, left: 32, right: 32 }}
        />
      </div>

      {/* ── Phone: search + filters over the map ── */}
      <div className="absolute inset-x-0 top-0 z-10 space-y-2 px-3 pt-2.5 lg:hidden">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1 drop-shadow-[0_2px_6px_rgba(0,0,0,0.15)]">{searchBox}</div>
          <button
            type="button"
            onClick={() => setListOpen(true)}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-card px-3.5 text-[14px] font-semibold text-label shadow-[0_2px_6px_rgba(0,0,0,0.15)] cursor-pointer"
          >
            <List className="h-[18px] w-[18px]" aria-hidden />
            List
          </button>
        </div>
        {chips}
      </div>

      {/* ── Phone: shop cards over the bottom of the map ── */}
      <div className="absolute inset-x-0 bottom-0 z-10 pb-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between gap-2 px-3">
          {(loading || n > 0) && (
            <span className="rounded-full bg-card px-3 py-1.5 text-[13px] font-semibold text-label shadow-[0_1px_4px_rgba(0,0,0,0.15)]">
              {heading}
            </span>
          )}
          {locateButton && <span className="shadow-[0_1px_4px_rgba(0,0,0,0.15)] rounded-full">{locateButton}</span>}
        </div>
        {loading ? (
          <div className="px-3">
            <div className="h-[150px] animate-pulse rounded-2xl bg-card" />
          </div>
        ) : shown.length > 0 ? (
          <div ref={carousel} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 scrollbar-hide">
            {shown.map((shop) => (
              <div key={shop.id} data-shop={shop.id} className="w-[86%] max-w-[380px] shrink-0 snap-center">
                <MapShopCard shop={shop} compact selected={shop.id === selectedId} onSelect={() => selectFromMap(shop.id)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-3">{emptyState}</div>
        )}
      </div>

      {/* ── Phone: full list ── */}
      <Sheet open={listOpen} onClose={() => setListOpen(false)} title={heading} wide>
        <div className="space-y-3">
          {placeNote}
          {shown.map((shop) => (
            <MapShopCard
              key={shop.id}
              shop={shop}
              onSelect={() => {
                setListOpen(false);
                selectFromMap(shop.id);
              }}
            />
          ))}
          {emptyState}
        </div>
      </Sheet>
    </div>
  );
}
