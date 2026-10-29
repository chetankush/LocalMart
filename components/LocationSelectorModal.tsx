"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Loader2, LocateFixed, MapPin, Search, X } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { searchAddresses, getPlaceDetails, type AddressSuggestion } from "@/lib/location/geolocation";
import { apiClient } from "@/lib/api/client";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PincodeRow = {
  code?: string;
  pincode?: string;
  area?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | { name?: string; state?: { name?: string } | string };
  state?: string;
};

/**
 * "Where should we deliver?" — a bottom sheet on phones, a small card on
 * desktop. One clear path: type your 6-digit PIN code (or use GPS, or
 * search an area name). Saves the PIN *with* city and map position so
 * distances and "Popular in Guna" work everywhere.
 */
export default function LocationSelectorModal({ isOpen, onClose }: LocationSelectorModalProps) {
  const { detectAndSetLocation, setLocationFromResult, validatePincode } = useLocation();
  const router = useRouter();
  const pathname = usePathname();
  const pinRef = useRef<HTMLInputElement>(null);

  const [pincode, setPincode] = useState("");
  const [mode, setMode] = useState<"pin" | "search">("pin");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [busy, setBusy] = useState<null | "pin" | "gps" | "search">(null);
  const [error, setError] = useState("");

  // Pages that follow the chosen area stay put and redraw (a search keeps its
  // words); the shop list gets the new PIN; anywhere else shows that area's shops
  const goAfterPick = (pin: string) => {
    const stay = ["/", "/search", "/map", "/cart", "/checkout"].includes(pathname) || /^\/(products|stores)\/[^/]+/.test(pathname);
    if (stay) router.refresh();
    else if (pathname === "/stores") {
      const params = new URLSearchParams(window.location.search);
      params.set("pincode", pin);
      router.push(`/stores?${params.toString()}`);
    } else router.push(`/stores?pincode=${pin}`);
  };

  const reset = () => {
    setPincode("");
    setQuery("");
    setSuggestions([]);
    setBusy(null);
    setError("");
    setMode("pin");
  };
  const close = () => {
    reset();
    onClose();
  };

  // Escape closes; lock page scroll while open; focus the PIN field
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => pinRef.current?.focus(), 150);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Area-name search: our own PIN list first, then OpenStreetMap
  useEffect(() => {
    if (mode !== "search" || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setBusy("search");
      try {
        const db = await apiClient.searchLocations(query.trim());
        if (db.success && db.data.length > 0) {
          setSuggestions(
            db.data.map((item) => {
              const mainText = item.type === "city" ? item.name : `${item.pincode} · ${item.name}`;
              const secondaryText = [item.city, item.state].filter(Boolean).join(", ");
              return { placeId: `db-${item.type}-${item.id}`, mainText, secondaryText, description: `${mainText}, ${secondaryText}` };
            }),
          );
          return;
        }
      } catch {
        // fall through
      } finally {
        setBusy(null);
      }
      if (query.trim().length >= 3) setSuggestions(await searchAddresses(query.trim()));
    }, 300);
    return () => clearTimeout(t);
  }, [query, mode]);

  const savePin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    if (!/^\d{6}$/.test(pincode)) {
      setError("PIN code has 6 digits, like 473001.");
      return;
    }
    setBusy("pin");
    try {
      // Our PIN list knows the area, city and map position
      const db = await apiClient.validatePincodeFromDB(pincode).catch(() => null);
      const row = (db?.success ? db.data : null) as PincodeRow | null;
      if (row) {
        const cityName = typeof row.city === "string" ? row.city : row.city?.name ?? "";
        const stateName =
          typeof row.city === "object" && row.city?.state
            ? typeof row.city.state === "string"
              ? row.city.state
              : row.city.state.name ?? ""
            : row.state ?? "";
        setLocationFromResult({
          pincode,
          locality: row.area || cityName,
          city: cityName,
          state: stateName,
          latitude: row.latitude ?? 0,
          longitude: row.longitude ?? 0,
          fullAddress: [row.area, cityName, stateName, pincode].filter(Boolean).join(", "),
          accuracy: "medium",
          source: "manual",
        });
      } else {
        // Not in our list yet — ask India Post
        const found = await validatePincode(pincode);
        if (!found) {
          setError(`We couldn't find PIN ${pincode}. Please check the number.`);
          setBusy(null);
          return;
        }
        setLocationFromResult(found);
      }
      close();
      goAfterPick(pincode);
    } catch {
      setError("Couldn't check this PIN code. Check your internet and try again.");
      setBusy(null);
    }
  };

  const useGps = async () => {
    setError("");
    setBusy("gps");
    try {
      const result = await detectAndSetLocation();
      close();
      goAfterPick(result.pincode);
    } catch (err) {
      setBusy(null);
      setError(
        err instanceof Error && /denied|permission/i.test(err.message)
          ? "Location is blocked for this site. Type your PIN code instead."
          : "Couldn't find your location. Type your PIN code instead.",
      );
    }
  };

  const pickSuggestion = async (s: AddressSuggestion) => {
    setError("");
    try {
      const result = await getPlaceDetails(s.placeId);
      if (result) {
        setLocationFromResult(result);
        close();
        goAfterPick(result.pincode);
      }
    } catch {
      setError("Couldn't open that place. Try another or type your PIN code.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" role="presentation">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="loc-title"
        className="relative w-full max-w-md rounded-t-3xl bg-card px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl sm:rounded-3xl sm:pb-6"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-fill-strong sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="loc-title" className="text-[22px] font-bold leading-tight text-label">
              Where should we deliver?
            </h2>
            <p className="mt-0.5 text-[15px] text-label-2">डिलीवरी कहाँ चाहिए? We&apos;ll show shops near you.</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-2 hover:bg-fill cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {mode === "pin" ? (
          <>
            <form onSubmit={savePin} className="mt-5">
              <label htmlFor="pin" className="text-[14px] font-semibold text-label">
                Your PIN code
              </label>
              <div className="mt-1.5 flex gap-2">
                <input
                  ref={pinRef}
                  id="pin"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="473001"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? "loc-error" : undefined}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-hairline bg-fill px-4 text-[20px] font-semibold tracking-[0.15em] text-label placeholder:font-normal placeholder:tracking-[0.15em] placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={pincode.length !== 6 || busy !== null}
                  className="flex h-12 shrink-0 items-center justify-center rounded-xl bg-cta px-5 text-[16px] font-semibold text-white hover:bg-cta-hover disabled:bg-fill-strong disabled:text-label-3 cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy === "pin" ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Checking" /> : "Continue"}
                </button>
              </div>
            </form>

            {error && (
              <p id="loc-error" role="alert" className="mt-2 text-[14px] font-medium text-bad">
                {error}
              </p>
            )}

            <div className="my-4 flex items-center gap-3 text-[13px] text-label-3" aria-hidden>
              <span className="h-px flex-1 bg-hairline" /> or <span className="h-px flex-1 bg-hairline" />
            </div>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={useGps}
                disabled={busy !== null}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-label/20 text-[16px] font-semibold text-label hover:bg-fill disabled:opacity-60 cursor-pointer"
              >
                {busy === "gps" ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <LocateFixed className="h-5 w-5" aria-hidden />}
                {busy === "gps" ? "Finding you…" : "Use my current location"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("search");
                  setError("");
                }}
                className="flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-label-2 hover:bg-fill cursor-pointer"
              >
                <Search className="h-4 w-4" aria-hidden /> Don&apos;t know the PIN? Search your area
              </button>
            </div>
          </>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setMode("pin")}
              className="-ml-2 flex h-10 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-label-2 hover:bg-fill cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden /> Type PIN code instead
            </button>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-label-3" aria-hidden />
              <input
                autoFocus
                type="search"
                placeholder="Area or city, e.g. Banskhedi, Guna"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-hairline bg-fill pl-11 pr-4 text-[16px] text-label placeholder:text-label-3 focus:border-label/40 focus:bg-card focus:outline-none"
              />
            </div>
            {error && (
              <p role="alert" className="mt-2 text-[14px] font-medium text-bad">
                {error}
              </p>
            )}
            <ul className="mt-2 max-h-[40vh] divide-y divide-hairline overflow-y-auto">
              {busy === "search" && suggestions.length === 0 && (
                <li className="flex items-center gap-2 py-3 text-[14px] text-label-2">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Searching…
                </li>
              )}
              {suggestions.map((s) => (
                <li key={s.placeId}>
                  <button
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="flex w-full items-start gap-3 py-3 text-left hover:bg-fill cursor-pointer"
                  >
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-label-2" aria-hidden />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-label">{s.mainText}</span>
                      <span className="block truncate text-[13px] text-label-2">{s.secondaryText}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
