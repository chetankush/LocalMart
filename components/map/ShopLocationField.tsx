"use client";

/**
 * The shop's map pin inside a form: a big "Set location on map" card,
 * then a small map with the pin + address and a "Change" button.
 * Opens LocationPinPicker full screen.
 */
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, LocateFixed, MapPin, Pencil } from "lucide-react";
import type { LatLng } from "@/lib/geo";
import type { PickedLocation } from "./LocationPinPicker";

const LocationPinPicker = dynamic(() => import("./LocationPinPicker"), { ssr: false });

export default function ShopLocationField({
  value,
  onChange,
  near,
  nearLabel,
  addressText,
  error,
  id,
}: {
  value: LatLng | null;
  onChange: (picked: PickedLocation) => void;
  /** Where the picker starts without a pin: the town or PIN code centre */
  near: LatLng | null;
  /** "Guna" */
  nearLabel?: string;
  /** Address to show under the small map (e.g. what the owner typed) */
  addressText?: string;
  error?: string;
  id?: string;
}) {
  // "map" = open the picker; "gps" = open it and find the phone straight away
  const [open, setOpen] = useState<false | "map" | "gps">(false);
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const label = [picked?.address?.line1, picked?.address?.line2].filter(Boolean).join(", ") || addressText;

  return (
    <div id={id}>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-hairline bg-card">
          <button
            type="button"
            onClick={() => setOpen("map")}
            aria-label="Change shop location on the map"
            className="relative block h-40 w-full cursor-pointer sm:h-48"
          >
            <PinPreview at={value} />
          </button>
          <div className="flex items-center gap-3 p-3.5">
            <CheckCircle2 className="h-6 w-6 shrink-0 text-ok" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold leading-snug text-label">Shop location is set</p>
              {label && <p className="line-clamp-2 text-[13px] leading-snug text-label-2">{label}</p>}
            </div>
            <button
              type="button"
              onClick={() => setOpen("map")}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-label/20 px-3.5 text-[14px] font-semibold text-label active:bg-fill cursor-pointer"
            >
              <Pencil className="h-4 w-4" aria-hidden />
              Change
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`rounded-2xl border-2 border-dashed p-4 ${
            error ? "border-bad bg-bad-soft/40" : "border-tint/35 bg-tint/[0.04]"
          }`}
        >
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-tint text-white shadow-sm">
              <MapPin className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold leading-snug text-label">Put your shop on the map</p>
              <p className="mt-0.5 text-[14px] leading-snug text-label-2">
                So customers find you exactly · मैप पर दुकान की जगह चुनें
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setOpen("gps")}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-cta px-4 text-[16px] font-semibold text-white hover:bg-cta-hover active:scale-[0.99] cursor-pointer"
            >
              <LocateFixed className="h-5 w-5" aria-hidden />
              Use my current location
            </button>
            <button
              type="button"
              onClick={() => setOpen("map")}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-label/20 bg-card px-4 text-[16px] font-semibold text-label active:bg-fill cursor-pointer"
            >
              <MapPin className="h-5 w-5" aria-hidden />
              Find on map
            </button>
          </div>
          <p className="mt-2.5 text-[13px] leading-snug text-label-2">
            At your shop right now? Use your current location. Not at the shop? Find it on the map.
          </p>
        </div>
      )}
      {error && !value && <p className="mt-2 text-[14px] font-medium text-bad">{error}</p>}

      {open && (
        <LocationPinPicker
          initial={value}
          near={near}
          nearLabel={nearLabel}
          autoLocate={open === "gps"}
          onClose={() => setOpen(false)}
          onConfirm={(p) => {
            setPicked(p);
            setOpen(false);
            onChange(p);
          }}
        />
      )}
    </div>
  );
}

/** Small still map with the pin in the middle */
function PinPreview({ at }: { at: LatLng }) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(el.current, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          touchZoom: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          boxZoom: false,
          keyboard: false,
        });
        L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      mapRef.current.setView([at.lat, at.lng], 17, { animate: false });
    })();
    return () => {
      cancelled = true;
    };
  }, [at.lat, at.lng]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    [],
  );

  return (
    <>
      <div ref={el} className="pointer-events-none absolute inset-0 bg-fill" style={{ isolation: "isolate", zIndex: 0 }} aria-hidden />
      <svg
        width="34"
        height="44"
        viewBox="0 0 44 56"
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 drop-shadow-[0_2px_3px_rgba(0,0,0,0.35)]"
        style={{ marginTop: -44 }}
        aria-hidden
      >
        <path d="M22 0C9.85 0 0 9.6 0 21.44 0 37.5 22 56 22 56s22-18.5 22-34.56C44 9.6 34.15 0 22 0Z" fill="#D61F45" />
        <circle cx="22" cy="21" r="8" fill="#fff" />
      </svg>
      <span className="absolute bottom-2 right-2 z-10 rounded-full bg-card/95 px-2.5 py-1 text-[12px] font-semibold text-label shadow-sm">
        Tap to change
      </span>
    </>
  );
}
