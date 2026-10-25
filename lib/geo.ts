/**
 * Places for the shop-location picker:
 *  - searchPlaces: suggestions while typing (Photon, built for type-ahead)
 *  - addressAt:    the address under the pin (Nominatim, ≤ 1 request/second, cached)
 *  - locateMe:     the phone's GPS, waiting a few seconds for a sharp fix
 *
 * Both lookups use free OpenStreetMap data, which is thin in small towns.
 * For production traffic, swap searchPlaces / addressAt for Ola Maps or
 * Google Places — the picker only depends on these shapes.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlaceSuggestion {
  id: string;
  /** "Alpha English School" */
  name: string;
  /** "Dalvi Nagar, Guna, Madhya Pradesh" */
  detail: string;
  lat: number;
  lng: number;
  /** How close to zoom when picked: a shop or landmark closer than a whole area */
  zoom: number;
  distanceKm: number | null;
  /** Street and area of the place, when the map knows them ("Dalvi Nagar") */
  street: string | null;
  area: string | null;
  /** A named place (school, clinic…), not just an area or a road */
  isLandmark: boolean;
}

export interface PinAddress {
  /** "Near Dr J.K. Garg Clinic" / "AB Road" / "Dalvi Nagar" */
  line1: string;
  /** "Dalvi Nagar, Guna, Madhya Pradesh 473001" */
  line2: string;
  road: string | null;
  /** A named place at the pin (clinic, school, temple…) */
  landmark: string | null;
  locality: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
}

/** LocalMart's town for now — where the map starts when we know nothing else */
export const DEFAULT_TOWN = { label: "Guna", at: { lat: 24.6469, lng: 77.3113 } as LatLng };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/** Centre of a PIN code's area (from LocalMart's PIN code list), or null */
export async function pincodeCentre(code: string): Promise<LatLng | null> {
  if (!/^[1-9]\d{5}$/.test(code)) return null;
  try {
    const res = await fetch(`${API_URL}/locations/pincode/${code}`);
    const data = res.ok ? await res.json() : null;
    const lat = Number(data?.data?.latitude);
    const lng = Number(data?.data?.longitude);
    return lat && lng ? { lat, lng } : null;
  } catch {
    return null;
  }
}

const PHOTON_URL = "https://photon.komoot.io/api/";
const PHOTON_REVERSE_URL = "https://photon.komoot.io/reverse";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
/** Suggestions only from around the shop's town, so a tap never jumps to another city */
const NEARBY_KM = 35;

export function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const isPincode = (v: unknown): v is string => typeof v === "string" && /^[1-9]\d{5}$/.test(v.trim());
const uniq = (parts: (string | null | undefined)[]) => {
  const seen = new Set<string>();
  return parts.filter((p): p is string => {
    const k = p?.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

// ── Search ──────────────────────────────────────────────────────────

/** Areas and towns get a wider view; shops, landmarks and streets a close one */
function zoomFor(key: string, value: string) {
  if (key === "place") {
    if (["city", "town", "county", "state", "district", "municipality"].includes(value)) return 14;
    if (["suburb", "village", "neighbourhood", "quarter", "hamlet", "locality"].includes(value)) return 16;
  }
  if (key === "boundary") return 14;
  return 18;
}

export async function searchPlaces(q: string, near: LatLng | null, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({ q: q.trim(), limit: "8", lang: "en" });
  if (near) {
    // Nearest first, and nothing from far-off towns with the same street name
    const dLat = NEARBY_KM / 111;
    const dLng = NEARBY_KM / (111 * Math.cos((near.lat * Math.PI) / 180));
    params.set("lat", String(near.lat));
    params.set("lon", String(near.lng));
    params.set("bbox", [near.lng - dLng, near.lat - dLat, near.lng + dLng, near.lat + dLat].map((n) => n.toFixed(4)).join(","));
  } else {
    params.set("bbox", "68.1,6.5,97.4,35.7"); // India
  }
  const res = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!res.ok) throw new Error("search failed");
  const data = await res.json();
  const out: PlaceSuggestion[] = [];
  const seen = new Set<string>();
  for (const f of data?.features ?? []) {
    const p = f?.properties ?? {};
    const [lng, lat] = f?.geometry?.coordinates ?? [];
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    if (p.countrycode && p.countrycode !== "IN") continue;
    const street = [p.housenumber, p.street].filter(Boolean).join(" ");
    const name: string = p.name || street || p.city || "";
    if (!name) continue;
    const detail = uniq([
      p.name && street ? street : null,
      p.locality,
      p.district,
      p.city,
      p.state,
    ])
      .filter((s) => s.toLowerCase() !== name.toLowerCase())
      .join(", ");
    const key = `${name}|${detail}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: `${p.osm_type ?? ""}${p.osm_id ?? out.length}`,
      name,
      detail,
      lat,
      lng,
      zoom: zoomFor(p.osm_key ?? "", p.osm_value ?? ""),
      distanceKm: near ? distanceKm(near, { lat, lng }) : null,
      street: street || null,
      area: [p.locality, p.district].find((v) => v && v !== p.city && v !== p.name) || null,
      isLandmark: Boolean(p.name) && !["place", "highway", "boundary", "landuse"].includes(p.osm_key),
    });
  }
  return out;
}

// ── Address under the pin ───────────────────────────────────────────

const addressCache = new Map<string, PinAddress | null>();
let lastReverseAt = 0;

/** A named place we already know is near the pin (e.g. what the owner searched for) */
export interface KnownPlace extends LatLng {
  name: string;
  street: string | null;
  area: string | null;
}

/** Within this distance a named place is a fair "Near …" landmark */
const LANDMARK_M = 300;

async function nominatimAt(at: LatLng, signal?: AbortSignal) {
  // Nominatim's fair-use rule: at most one request a second
  const wait = lastReverseAt + 1100 - Date.now();
  if (wait > 0) {
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(resolve, wait);
      signal?.addEventListener("abort", () => {
        clearTimeout(t);
        reject(new DOMException("aborted", "AbortError"));
      });
    });
  }
  lastReverseAt = Date.now();
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(at.lat),
    lon: String(at.lng),
    zoom: "18",
    addressdetails: "1",
    "accept-language": "en",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, { signal });
  if (!res.ok) throw new Error("address lookup failed");
  const data = await res.json();
  return data?.error ? null : data;
}

/** The nearest named places around the pin (shops, clinics, schools…) */
async function namedPlacesNear(at: LatLng, signal?: AbortSignal): Promise<KnownPlace[]> {
  const params = new URLSearchParams({ lat: String(at.lat), lon: String(at.lng), limit: "5", radius: "0.4", lang: "en" });
  const res = await fetch(`${PHOTON_REVERSE_URL}?${params}`, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const out: KnownPlace[] = [];
  for (const f of data?.features ?? []) {
    const p = f?.properties ?? {};
    const [lng, lat] = f?.geometry?.coordinates ?? [];
    if (typeof lat !== "number" || typeof lng !== "number" || !p.name) continue;
    if (["place", "highway", "boundary", "landuse"].includes(p.osm_key)) continue;
    out.push({
      lat,
      lng,
      name: p.name,
      street: p.street || null,
      area: [p.locality, p.district].find((v: string | undefined) => v && v !== p.city) || null,
    });
  }
  return out;
}

/**
 * Address for a spot on the map, or null when the map has nothing there.
 * Small-town streets often have no name on the map, so a named place
 * nearby ("Near Dr J.K. Garg Clinic") — or the place the owner searched
 * for, if the pin is still close to it — fills in as a landmark.
 */
export async function addressAt(at: LatLng, signal?: AbortSignal, known?: KnownPlace | null): Promise<PinAddress | null> {
  // ~10 m grid: small nudges of the pin reuse the last answer
  const key = `${at.lat.toFixed(4)},${at.lng.toFixed(4)}|${known?.name ?? ""}`;
  if (addressCache.has(key)) return addressCache.get(key)!;

  const [data, around] = await Promise.all([
    nominatimAt(at, signal),
    namedPlacesNear(at, signal).catch((e) => {
      if (e?.name === "AbortError") throw e;
      return [] as KnownPlace[];
    }),
  ]);
  const a = data?.address ?? null;
  const closeBy = (p: KnownPlace | null | undefined) => (p && distanceKm(at, p) * 1000 <= LANDMARK_M ? p : null);
  const searched = closeBy(known);
  const nearest = around
    .map((p) => ({ p, d: distanceKm(at, p) }))
    .sort((x, y) => x.d - y.d)
    .map((x) => x.p)
    .find((p) => closeBy(p));
  if (!a && !searched && !nearest) {
    addressCache.set(key, null);
    return null;
  }

  const city: string | null = a ? a.city || a.town || a.village || a.municipality || a.county || null : null;
  // A named place right at the pin, else the one they searched, else the nearest
  const here: string | null = typeof data?.name === "string" && data.name.trim() ? data.name.trim() : null;
  const landmarkPlace = here ? null : searched ?? nearest ?? null;
  const landmark = here ?? landmarkPlace?.name ?? null;
  const road: string | null =
    (a && (a.road || a.pedestrian || a.footway || a.street)) || landmarkPlace?.street || null;
  const locality: string | null =
    (a && [a.neighbourhood, a.suburb, a.quarter, a.residential, a.hamlet, a.city_district, a.village].find(
      (v) => v && v !== city,
    )) ||
    (landmarkPlace?.area && landmarkPlace.area !== city ? landmarkPlace.area : null) ||
    null;
  const state: string | null = a?.state || null;
  const pincode = isPincode(a?.postcode) ? a.postcode.trim() : null;

  const line1 = landmark ? `Near ${landmark}` : road || locality || city || "Pinned location";
  const line2 = uniq([
    landmark ? road : null,
    locality,
    city,
    [state, pincode].filter(Boolean).join(" ") || null,
  ])
    // Don't repeat the first line ("Guna" / "Guna, Madhya Pradesh")
    .filter((part) => part !== line1)
    .join(", ");

  const result: PinAddress = { line1, line2, road, landmark, locality, city, state, pincode };
  addressCache.set(key, result);
  return result;
}

// ── GPS ─────────────────────────────────────────────────────────────

export type LocateError = "unsupported" | "denied" | "unavailable";

export interface LocateResult extends LatLng {
  /** Metres — how far off the phone thinks it might be */
  accuracy: number;
}

/**
 * The phone's position. Phones get sharper over a few seconds (GPS warms
 * up), so keep listening and use the best reading — done early once it's
 * within `goodEnoughM`.
 */
export function locateMe({ goodEnoughM = 25, maxWaitMs = 10000 } = {}): Promise<LocateResult> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      reject("unsupported" satisfies LocateError);
      return;
    }
    let best: GeolocationPosition | null = null;
    let done = false;
    const finish = (error?: LocateError) => {
      if (done) return;
      done = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) resolve({ lat: best.coords.latitude, lng: best.coords.longitude, accuracy: best.coords.accuracy });
      else reject(error ?? ("unavailable" satisfies LocateError));
    };
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
        if (pos.coords.accuracy <= goodEnoughM) finish();
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) finish("denied");
        // Other errors: keep waiting for a reading until the timer runs out
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs },
    );
    const timer = setTimeout(() => finish("unavailable"), maxWaitMs);
  });
}

/** True when the site may already read the location without asking */
export async function locationAllowed(): Promise<boolean> {
  try {
    const status = await navigator.permissions?.query({ name: "geolocation" as PermissionName });
    return status?.state === "granted";
  } catch {
    return false;
  }
}

// ── Filling the address form from the pin ───────────────────────────

export interface AddressFields {
  street: string;
  locality: string;
  pincode: string;
  city?: string;
  state?: string;
}

/**
 * The form's address after a pin is confirmed. Area, town, state and PIN
 * follow the pin (when the map knows them) if the pin moved or the field is
 * empty; the "shop no., street" line is only filled when empty, so what the
 * owner typed is never lost. Returns the names of the fields it changed.
 */
export function fillFromPin<T extends AddressFields>(fields: T, address: PinAddress | null, moved: boolean) {
  const next = { ...fields };
  const filled: (keyof AddressFields)[] = [];
  /** The pin's street line, when the owner had already typed a different one */
  let streetSuggestion: string | null = null;
  if (!address) return { next, filled, streetSuggestion };
  const set = (key: keyof AddressFields, value: string | null, replace: boolean) => {
    if (!value || !(key in next)) return;
    const current = String(next[key] ?? "").trim();
    if (current.toLowerCase() === value.toLowerCase()) return;
    if (current && !replace) return;
    (next as AddressFields)[key] = value;
    filled.push(key);
  };
  const streetLine = [address.road, address.landmark ? `near ${address.landmark}` : null].filter(Boolean).join(", ");
  set("street", streetLine || null, false);
  if (streetLine && !filled.includes("street") && !next.street.toLowerCase().includes(streetLine.toLowerCase())) {
    streetSuggestion = streetLine;
  }
  set("locality", address.locality, moved);
  set("city", address.city, moved);
  set("state", address.state, moved);
  set("pincode", address.pincode, moved);
  return { next, filled, streetSuggestion };
}
