"use client";

/**
 * "Set your shop location" — the Uber / Swiggy way:
 *  1. Search a nearby place, or tap "Use my current location"
 *  2. Move the map until the pin (always in the middle) sits on the shop
 *  3. Check the address under the pin → Confirm
 *
 * Full screen on phones, a large window on desktop. The phone's back
 * button closes it instead of leaving the form.
 */
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer, Circle } from "leaflet";
import {
  AlertTriangle,
  ArrowLeft,
  Layers,
  Loader2,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  Search,
  X,
  ZoomIn,
} from "lucide-react";
import {
  addressAt,
  distanceKm,
  locateMe,
  searchPlaces,
  type KnownPlace,
  type LatLng,
  type LocateError,
  type PinAddress,
  type PlaceSuggestion,
} from "@/lib/geo";

export interface PickedLocation extends LatLng {
  address: PinAddress | null;
}

const INDIA: LatLng = { lat: 22.6, lng: 78.9 };
/** Closer than this and the pin can't be put on one shop */
const EXACT_ZOOM = 17;
/** Further than this from the shop's town → "is your shop really here?" */
const FAR_KM = 40;

const STREET_TILES = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const STREET_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
// Rooftops make it easy to spot your own shop where street maps are empty
const SATELLITE_TILES =
  process.env.NEXT_PUBLIC_MAP_SATELLITE_URL ||
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION = "Imagery &copy; Esri, Maxar, Earthstar Geographics";

const LOCATE_ERRORS: Record<LocateError, string> = {
  denied:
    "Location is blocked for this website. Tap the lock icon next to the website address, allow Location, and try again. Or search your area above.",
  unavailable: "Couldn't find your location. Turn on Location (GPS) on your phone and try again, or search your area above.",
  unsupported: "This browser can't share your location. Search your area above instead.",
};

export default function LocationPinPicker({
  initial,
  near,
  nearLabel,
  autoLocate = false,
  onConfirm,
  onClose,
}: {
  /** The pin already saved, if any */
  initial: LatLng | null;
  /** Where to start without a pin: the town or PIN code centre */
  near: LatLng | null;
  /** "Guna" — for search hints and the "far away" check */
  nearLabel?: string;
  /** Opened from "Use my current location": find the phone straight away */
  autoLocate?: boolean;
  onConfirm: (picked: PickedLocation) => void;
  onClose: () => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const tiles = useRef<{ street: TileLayer; satellite: TileLayer; labels: TileLayer } | null>(null);
  const accuracyCircle = useRef<Circle | null>(null);

  const start = initial ?? near ?? INDIA;
  const [center, setCenter] = useState<LatLng>(start);
  const [zoom, setZoom] = useState(initial ? 18 : near ? 15 : 5);
  const [moving, setMoving] = useState(false);
  const [satellite, setSatellite] = useState(false);
  // "Move the map…" until they've moved it or picked something
  const [touched, setTouched] = useState(Boolean(initial));

  const [address, setAddress] = useState<PinAddress | null>(null);
  const [addressState, setAddressState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  // The place they picked from search: a landmark for the address while the pin stays near it
  const [searchedPlace, setSearchedPlace] = useState<KnownPlace | null>(null);

  // ── Back button closes the picker, not the form ──
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    let pushed = false;
    // Next tick, so React's dev double-mount doesn't add two entries
    const t = setTimeout(() => {
      window.history.pushState({ ...window.history.state, lmPicker: true }, "");
      pushed = true;
    }, 0);
    const onPop = () => {
      pushed = false;
      onCloseRef.current();
    };
    window.addEventListener("popstate", onPop);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      window.removeEventListener("popstate", onPop);
      document.body.style.overflow = prevOverflow;
      // Closed with a button: take back the history entry we added
      if (pushed) window.history.back();
    };
  }, []);

  // ── Map ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
        // Zoom around the pin, so pinching never moves it off the shop
        touchZoom: "center",
        scrollWheelZoom: "center",
        doubleClickZoom: "center",
        boxZoom: false,
        bounceAtZoomLimits: false,
        // Only a short glide after a swipe, so a quick flick can't throw the pin streets away
        inertiaMaxSpeed: 600,
        inertiaDeceleration: 5000,
        minZoom: 4,
        maxZoom: 19,
      });
      map.attributionControl.setPrefix(false);
      tiles.current = {
        street: L.tileLayer(STREET_TILES, { maxZoom: 19, attribution: STREET_ATTRIBUTION }),
        satellite: L.tileLayer(SATELLITE_TILES, { maxZoom: 19, maxNativeZoom: 18, attribution: SATELLITE_ATTRIBUTION }),
        labels: L.tileLayer(SATELLITE_LABELS, { maxZoom: 19, maxNativeZoom: 18 }),
      };
      tiles.current.street.addTo(map);
      map.setView([start.lat, start.lng], initial ? 18 : near ? 15 : 5);

      map.on("movestart", () => setMoving(true));
      map.on("moveend", () => {
        const c = map.getCenter().wrap();
        setMoving(false);
        setCenter({ lat: c.lat, lng: c.lng });
        setZoom(map.getZoom());
      });
      map.on("dragstart zoomstart", () => setTouched(true));
      // Tap a spot → the map glides so the pin lands there
      map.on("click", (e) => map.panTo(e.latlng));
      mapRef.current = map;
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const t = tiles.current;
    if (!map || !t) return;
    if (satellite) {
      map.removeLayer(t.street);
      t.satellite.addTo(map);
      t.labels.addTo(map);
    } else {
      map.removeLayer(t.satellite);
      map.removeLayer(t.labels);
      t.street.addTo(map);
    }
  }, [satellite]);

  const flyTo = useCallback((at: LatLng, z: number) => {
    mapRef.current?.setView([at.lat, at.lng], z, { animate: true });
  }, []);

  // ── Address under the pin (after the map settles) ──
  useEffect(() => {
    if (moving || !touched) return;
    const ctrl = new AbortController();
    setAddressState("loading");
    const t = setTimeout(() => {
      addressAt(center, ctrl.signal, searchedPlace)
        .then((a) => {
          setAddress(a);
          setAddressState("done");
        })
        .catch((e) => {
          if (e?.name !== "AbortError") setAddressState("error");
        });
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [center, moving, touched, searchedPlace]);

  // ── GPS ──
  const locate = useCallback(async () => {
    setLocateError(null);
    setLocating(true);
    setSearchOpen(false);
    try {
      const here = await locateMe();
      setTouched(true);
      setQ("");
      setSearchedPlace(null);
      setGpsAccuracy(here.accuracy);
      flyTo(here, here.accuracy > 300 ? 16 : 18);
      const L = LRef.current;
      const map = mapRef.current;
      if (L && map) {
        accuracyCircle.current?.remove();
        accuracyCircle.current = L.circle([here.lat, here.lng], {
          radius: here.accuracy,
          color: "#1A73E8",
          weight: 1,
          fillColor: "#1A73E8",
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(map);
      }
    } catch (e) {
      setLocateError(LOCATE_ERRORS[(e as LocateError) in LOCATE_ERRORS ? (e as LocateError) : "unavailable"]);
    } finally {
      setLocating(false);
    }
  }, [flyTo]);

  // Opened with "Use my current location" → find the phone straight away.
  // ("Find on map" never jumps to the phone: they may not be at the shop.)
  useEffect(() => {
    if (autoLocate) locate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Search ──
  useEffect(() => {
    const text = q.trim();
    if (text.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchFailed(false);
      return;
    }
    const ctrl = new AbortController();
    setSearching(true);
    const t = setTimeout(() => {
      searchPlaces(text, near ?? initial, ctrl.signal)
        .then((r) => {
          setResults(r);
          setSearchFailed(false);
          setSearching(false);
        })
        .catch((e) => {
          if (e?.name === "AbortError") return;
          setResults([]);
          setSearchFailed(true);
          setSearching(false);
        });
    }, 300);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const pick = (p: PlaceSuggestion) => {
    setQ(p.name);
    setSearchedPlace(p.isLandmark ? { lat: p.lat, lng: p.lng, name: p.name, street: p.street, area: p.area } : null);
    setSearchOpen(false);
    searchInput.current?.blur();
    setTouched(true);
    setGpsAccuracy(null);
    accuracyCircle.current?.remove();
    flyTo(p, p.zoom);
  };

  // Esc: close the suggestions first, then the picker
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (searchOpen) {
        setSearchOpen(false);
        searchInput.current?.blur();
      } else onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  const farKm = near && touched ? distanceKm(near, center) : 0;
  const zoomedIn = zoom >= EXACT_ZOOM;
  const confirm = () => {
    if (!zoomedIn) {
      flyTo(center, 18);
      return;
    }
    onConfirm({ lat: center.lat, lng: center.lng, address: addressState === "done" ? address : null });
  };

  const showSuggestions = searchOpen && (q.trim().length >= 2 || !touched);

  return (
    <div className="fixed inset-0 z-[85] flex items-stretch justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="pin-picker-title">
      <div className="absolute inset-0 hidden bg-black/45 sm:block" onClick={onClose} aria-hidden />
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-canvas sm:h-[min(820px,100%)] sm:max-w-3xl sm:rounded-3xl sm:shadow-2xl">
        {/* ── Top: title + search ── */}
        <div className="relative z-20 shrink-0 bg-card px-3 pb-3 pt-[max(0.5rem,env(safe-area-inset-top))] shadow-[0_1px_0_var(--color-hairline)] sm:px-4 sm:pt-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="-ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label active:bg-fill cursor-pointer"
            >
              <ArrowLeft className="h-6 w-6" aria-hidden />
            </button>
            <div className="min-w-0">
              <h2 id="pin-picker-title" className="text-[18px] font-bold leading-tight text-label">
                Set your shop location
              </h2>
              <p className="text-[13px] leading-tight text-label-2">दुकान की सही जगह चुनें</p>
            </div>
          </div>

          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-label-2" aria-hidden />
            <input
              ref={searchInput}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              enterKeyHint="search"
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) {
                  e.preventDefault();
                  pick(results[0]);
                }
              }}
              placeholder={nearLabel ? `Search area or landmark in ${nearLabel}` : "Search area, street or landmark"}
              aria-label="Search your shop's area, street or a landmark"
              autoComplete="off"
              autoCorrect="off"
              className="h-12 w-full rounded-xl bg-fill pl-11 pr-11 text-[16px] text-label outline-none placeholder:text-label-3 focus:bg-card focus:ring-2 focus:ring-tint"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  searchInput.current?.focus();
                }}
                aria-label="Clear search"
                className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-label-2 active:bg-fill-strong cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            )}
          </div>
        </div>

        {/* ── Map with the pin always in the middle ── */}
        <div className="relative min-h-0 flex-1">
          <div ref={mapEl} className="absolute inset-0" style={{ isolation: "isolate", zIndex: 0 }} />

          {/* The pin: lifts while the map moves, drops back when it stops */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2" style={{ marginTop: -56 }} aria-hidden>
            {!moving && (
              <div className="absolute bottom-[66px] left-1/2 w-max max-w-[240px] -translate-x-1/2 rounded-xl bg-[#1F1F1F] px-3.5 py-2 text-center shadow-lg">
                <p className="text-[14px] font-semibold leading-tight text-white">
                  {touched ? "Your shop is here" : "Move the map to your shop"}
                </p>
                <p className="mt-0.5 text-[12px] leading-tight text-white/75">
                  {touched ? "दुकान यहाँ है · map खिसकाकर बदलें" : "मैप खिसकाकर पिन दुकान पर रखें"}
                </p>
                <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#1F1F1F]" />
              </div>
            )}
            <svg
              width="44"
              height="56"
              viewBox="0 0 44 56"
              className="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.35)] transition-transform duration-150"
              style={{ transform: moving ? "translateY(-12px)" : "none" }}
            >
              <path d="M22 0C9.85 0 0 9.6 0 21.44 0 37.5 22 56 22 56s22-18.5 22-34.56C44 9.6 34.15 0 22 0Z" fill="#D61F45" />
              <circle cx="22" cy="21" r="8" fill="#fff" />
            </svg>
          </div>
          {/* Shadow on the ground = the exact spot */}
          <span
            className={`pointer-events-none absolute left-1/2 top-1/2 z-[9] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/35 transition-all duration-150 ${
              moving ? "h-1.5 w-3 opacity-60" : "h-2 w-2 opacity-100"
            }`}
            aria-hidden
          />

          {/* Map / Satellite */}
          <button
            type="button"
            onClick={() => setSatellite((s) => !s)}
            aria-pressed={satellite}
            className="absolute right-3 top-3 z-10 flex h-10 items-center gap-1.5 rounded-full bg-card px-3.5 text-[14px] font-semibold text-label shadow-[0_1px_6px_rgba(0,0,0,0.25)] active:bg-fill cursor-pointer"
          >
            <Layers className="h-4 w-4" aria-hidden />
            {satellite ? "Map view" : "Satellite view"}
          </button>

          {/* Zoom */}
          <div className="absolute right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col overflow-hidden rounded-xl bg-card shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              aria-label="Zoom in"
              className="flex h-11 w-11 items-center justify-center text-label active:bg-fill cursor-pointer"
            >
              <Plus className="h-5 w-5" aria-hidden />
            </button>
            <span className="mx-2 h-px bg-hairline" aria-hidden />
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              aria-label="Zoom out"
              className="flex h-11 w-11 items-center justify-center text-label active:bg-fill cursor-pointer"
            >
              <Minus className="h-5 w-5" aria-hidden />
            </button>
          </div>

          {/* Use my current location */}
          <div className="absolute inset-x-3 bottom-3 z-10 flex justify-center">
            <button
              type="button"
              onClick={locate}
              disabled={locating}
              className="flex h-11 items-center gap-2 rounded-full border border-tint/25 bg-card px-4 text-[15px] font-semibold text-tint shadow-[0_1px_6px_rgba(0,0,0,0.25)] active:bg-fill disabled:opacity-80 cursor-pointer"
            >
              {locating ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LocateFixed className="h-5 w-5" aria-hidden />}
              {locating ? "Finding you…" : "Use my current location"}
            </button>
          </div>

          {/* Search suggestions over the map */}
          {showSuggestions && (
            <div className="absolute inset-0 z-20 overflow-y-auto bg-card">
              <ul className="divide-y divide-hairline">
                <li>
                  <button
                    type="button"
                    onClick={locate}
                    className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill cursor-pointer"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint/10 text-tint">
                      <LocateFixed className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[16px] font-semibold text-tint">Use my current location</span>
                      <span className="block text-[13px] text-label-2">Best when you are at your shop · दुकान पर हों तो</span>
                    </span>
                  </button>
                </li>
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => pick(r)}
                      className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-fill hover:bg-fill/60 cursor-pointer"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fill text-label-2">
                        <MapPin className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-semibold text-label">{r.name}</span>
                        {r.detail && <span className="block truncate text-[13px] text-label-2">{r.detail}</span>}
                      </span>
                      {r.distanceKm !== null && (
                        <span className="shrink-0 text-[13px] tabular-nums text-label-3">
                          {r.distanceKm < 1 ? `${Math.round(r.distanceKm * 1000)} m` : `${r.distanceKm.toFixed(1)} km`}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              {searching && results.length === 0 && (
                <p className="flex items-center gap-2 px-4 py-4 text-[15px] text-label-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching…
                </p>
              )}
              {!searching && q.trim().length >= 2 && results.length === 0 && (
                <div className="px-4 py-4">
                  <p className="text-[15px] font-semibold text-label">
                    {searchFailed ? "Search isn't working right now" : `No match${nearLabel ? ` in ${nearLabel}` : ""} for “${q.trim()}”`}
                  </p>
                  <p className="mt-1 text-[14px] leading-snug text-label-2">
                    Try a well-known place near your shop — a school, temple, hospital, bank or chowk. Then move the map to your shop.
                  </p>
                </div>
              )}
              {q.trim().length < 2 && (
                <p className="px-4 py-4 text-[14px] leading-snug text-label-2">
                  Type your area, or a well-known place near your shop — a school, temple, hospital or bank.
                  <span className="mt-1 block">पास की कोई जानी-पहचानी जगह लिखें।</span>
                </p>
              )}
              <div className="sticky bottom-0 border-t border-hairline bg-card p-3">
                <button
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    searchInput.current?.blur();
                  }}
                  className="h-11 w-full rounded-xl bg-fill text-[15px] font-semibold text-label active:bg-fill-strong cursor-pointer"
                >
                  Show map
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom: address under the pin + confirm (hidden while picking from the list, for the keyboard) ── */}
        <div className={`relative z-20 shrink-0 ${showSuggestions ? "hidden" : ""} rounded-t-3xl bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:rounded-none sm:px-5`}>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tint/10 text-tint">
              <MapPin className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-h-[44px] min-w-0 flex-1" aria-live="polite">
              {!touched ? (
                <>
                  <p className="text-[16px] font-semibold leading-snug text-label">Where is your shop?</p>
                  <p className="text-[14px] leading-snug text-label-2">
                    Tap “Use my current location” if you are at the shop, or search above.
                  </p>
                </>
              ) : moving ? (
                <>
                  <p className="text-[16px] font-semibold leading-snug text-label-2">Moving the pin…</p>
                  <p className="text-[14px] leading-snug text-label-3">Let go to see the address</p>
                </>
              ) : addressState === "loading" || addressState === "idle" ? (
                <>
                  <p className="flex items-center gap-2 text-[16px] font-semibold leading-snug text-label-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Finding the address…
                  </p>
                  <span className="mt-1.5 block h-3.5 w-3/4 animate-pulse rounded bg-fill" aria-hidden />
                </>
              ) : address ? (
                <>
                  <p className="line-clamp-1 text-[16px] font-semibold leading-snug text-label">{address.line1}</p>
                  <p className="line-clamp-2 text-[14px] leading-snug text-label-2">{address.line2}</p>
                </>
              ) : (
                <>
                  <p className="text-[16px] font-semibold leading-snug text-label">Pin placed</p>
                  <p className="text-[14px] leading-snug text-label-2">
                    {addressState === "error" ? "Couldn't load the address name" : "This spot has no address on the map"} — that's okay,
                    you'll type it on the next screen.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Warnings */}
          {locateError && <Warning onDismiss={() => setLocateError(null)}>{locateError}</Warning>}
          {!locateError && gpsAccuracy !== null && gpsAccuracy > 40 && !moving && (
            <Warning onDismiss={() => setGpsAccuracy(null)}>
              Your phone&apos;s location may be off by about {gpsAccuracy >= 1000 ? `${(gpsAccuracy / 1000).toFixed(1)} km` : `${Math.round(gpsAccuracy / 10) * 10} m`}. Move the
              map so the pin sits exactly on your shop.
            </Warning>
          )}
          {!locateError && farKm > FAR_KM && !moving && (
            <Warning>
              This pin is {Math.round(farKm)} km from {nearLabel || "your town"}. Is your shop really here?
            </Warning>
          )}

          <button
            type="button"
            onClick={confirm}
            disabled={!touched || moving}
            className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-cta text-[17px] font-semibold text-white transition-colors hover:bg-cta-hover active:scale-[0.99] disabled:bg-fill-strong disabled:text-label-3 cursor-pointer disabled:cursor-not-allowed"
          >
            {touched && !zoomedIn ? (
              <>
                <ZoomIn className="h-5 w-5" aria-hidden /> Zoom in to place the pin exactly
              </>
            ) : (
              "Confirm location · पक्का करें"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Warning({ children, onDismiss }: { children: React.ReactNode; onDismiss?: () => void }) {
  return (
    <div className="mt-3 flex items-start gap-2 rounded-xl bg-warn-soft px-3 py-2.5 text-[14px] leading-snug text-label">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" aria-hidden />
      <p className="min-w-0 flex-1">{children}</p>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 p-1 text-label-2 cursor-pointer">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
