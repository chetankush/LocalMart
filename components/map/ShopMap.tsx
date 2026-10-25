"use client";

/**
 * The shop map — Google-Maps-like: street map, a coloured pin for each shop
 * (icon by kind of shop, name next to it), a blue dot for "you".
 * Uses Leaflet with free OpenStreetMap/CARTO tiles, so no API key needed.
 */
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Map as LeafletMap, Marker, LayerGroup } from "leaflet";
import { shopType } from "./shopTypes";

export interface MapShop {
  id: string;
  businessName: string;
  businessType: string;
  lat: number;
  lng: number;
  /** Pin placed from the PIN code, not the seller's exact spot */
  approximate?: boolean;
}

interface Props {
  shops: MapShop[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  user?: { lat: number; lng: number } | null;
  /** A place the shopper searched for ("Civil Lines") — a dark pin with its name */
  place?: { lat: number; lng: number; name: string } | null;
  /** Drag, zoom and tap — off for small previews */
  interactive?: boolean;
  /** Shop names next to the pins */
  showLabels?: boolean;
  /** Change it to zoom the map to fit all pins again */
  fitKey?: string;
  /** Room kept free around the pins (px) for panels drawn over the map */
  padding?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
}

const INDIA: [number, number] = [22.6, 78.9];
const LABEL_ZOOM = 15;

// Street map tiles. OpenStreetMap needs no key; for heavy traffic point
// NEXT_PUBLIC_MAP_TILES_URL at a paid provider (MapTiler, Stadia, Google…).
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILES_URL || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_TILES_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const iconSvg = new Map<string, string>();
function svgFor(type: string) {
  if (!iconSvg.has(type)) {
    const { Icon } = shopType(type);
    iconSvg.set(type, renderToStaticMarkup(<Icon size={13} strokeWidth={2.5} color="#fff" aria-hidden />));
  }
  return iconSvg.get(type)!;
}

function pinHtml(shop: MapShop, selected: boolean, showLabel: boolean) {
  const { color } = shopType(shop.businessType);
  return `<div class="lmpin${selected ? " is-sel" : ""}${shop.approximate ? " is-approx" : ""}" style="--c:${color}">
    <span class="lmpin-head"><span class="lmpin-ic">${svgFor(shop.businessType)}</span></span>
    ${showLabel ? `<span class="lmpin-label">${escapeHtml(shop.businessName)}</span>` : ""}
  </div>`;
}

export default function ShopMap({
  shops,
  selectedId = null,
  onSelect,
  user = null,
  place = null,
  interactive = true,
  showLabels = true,
  fitKey = "",
  padding,
  className,
}: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const markers = useRef(new Map<string, Marker>());
  const userMarker = useRef<Marker | null>(null);
  const placeMarker = useRef<Marker | null>(null);
  const resizeObs = useRef<ResizeObserver | null>(null);
  const shopsRef = useRef(shops);
  const onSelectRef = useRef(onSelect);
  const selectedRef = useRef(selectedId);
  shopsRef.current = shops;
  onSelectRef.current = onSelect;

  const pad = {
    top: padding?.top ?? 48,
    right: padding?.right ?? 48,
    bottom: padding?.bottom ?? 48,
    left: padding?.left ?? 48,
  };

  // Zoom to show every pin (and you)
  const fit = () => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    let points: [number, number][] = shopsRef.current.map((s) => [s.lat, s.lng]);
    if (place) {
      // Around a searched place: it and the shops closest to it
      points = [[place.lat, place.lng], ...points.slice(0, 6)];
    } else if (user) points.push([user.lat, user.lng]);
    if (points.length === 0) {
      map.setView(INDIA, 5);
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: [pad.left, pad.top],
        paddingBottomRight: [pad.right, pad.bottom],
        maxZoom: 16,
      });
    }
  };

  const fitRef = useRef(fit);
  fitRef.current = fit;

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: interactive,
        touchZoom: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        boxZoom: false,
        keyboard: interactive,
      });
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map);
      if (interactive) L.control.zoom({ position: "bottomright" }).addTo(map);
      map.attributionControl.setPrefix(false);
      layer.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      // Like Google Maps: names only once you're zoomed in (the chosen shop always)
      const labels = () => el.current?.classList.toggle("lm-nolabels", map.getZoom() < LABEL_ZOOM);
      map.on("zoomend", labels);
      labels();
      drawShops();
      drawUser();
      drawPlace();
      fit();
      // The box can change size after the map is made (layout, fonts):
      // re-measure, and for still previews fit the pins again
      let last = `${el.current.clientWidth}x${el.current.clientHeight}`;
      resizeObs.current = new ResizeObserver(() => {
        if (!el.current || !mapRef.current) return;
        const size = `${el.current.clientWidth}x${el.current.clientHeight}`;
        if (size === last) return;
        last = size;
        mapRef.current.invalidateSize();
        if (!interactive) fitRef.current();
      });
      resizeObs.current.observe(el.current);
    })();
    return () => {
      cancelled = true;
      resizeObs.current?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      markers.current.clear();
      userMarker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawShops = () => {
    const L = LRef.current;
    if (!L || !layer.current) return;
    layer.current.clearLayers();
    markers.current.clear();
    for (const shop of shopsRef.current) {
      const selected = shop.id === selectedRef.current;
      const marker = L.marker([shop.lat, shop.lng], {
        icon: L.divIcon({ className: "lmpin-wrap", html: pinHtml(shop, selected, showLabels), iconSize: [32, 40], iconAnchor: [16, 40] }),
        keyboard: interactive,
        title: shop.businessName,
        zIndexOffset: selected ? 1000 : 0,
        interactive,
      });
      marker.on("click", () => onSelectRef.current?.(shop.id));
      marker.addTo(layer.current);
      markers.current.set(shop.id, marker);
    }
  };

  const drawUser = () => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    userMarker.current?.remove();
    userMarker.current = null;
    if (!user) return;
    userMarker.current = L.marker([user.lat, user.lng], {
      icon: L.divIcon({ className: "lmpin-wrap", html: '<div class="lmme"><span></span></div>', iconSize: [22, 22], iconAnchor: [11, 11] }),
      interactive: false,
      zIndexOffset: 500,
    }).addTo(map);
  };

  const drawPlace = () => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    placeMarker.current?.remove();
    placeMarker.current = null;
    if (!place) return;
    placeMarker.current = L.marker([place.lat, place.lng], {
      icon: L.divIcon({
        className: "lmpin-wrap",
        html: `<div class="lmplace"><span class="lmplace-dot"></span><span class="lmplace-label">${escapeHtml(place.name)}</span></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      }),
      interactive: false,
      zIndexOffset: 400,
    }).addTo(map);
  };

  useEffect(() => {
    drawPlace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.lat, place?.lng, place?.name]);

  // Pins follow the list (search, filters)
  useEffect(() => {
    drawShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, showLabels]);

  useEffect(() => {
    drawUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.lat, user?.lng]);

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Highlight the chosen shop and bring it into view
  useEffect(() => {
    const L = LRef.current;
    const prev = selectedRef.current;
    selectedRef.current = selectedId;
    if (!L) return;
    for (const id of [prev, selectedId]) {
      if (!id) continue;
      const shop = shopsRef.current.find((s) => s.id === id);
      const marker = markers.current.get(id);
      if (!shop || !marker) continue;
      const on = id === selectedId;
      marker.setIcon(L.divIcon({ className: "lmpin-wrap", html: pinHtml(shop, on, showLabels), iconSize: [32, 40], iconAnchor: [16, 40] }));
      marker.setZIndexOffset(on ? 1000 : 0);
    }
    const shop = shopsRef.current.find((s) => s.id === selectedId);
    const map = mapRef.current;
    if (shop && map && interactive) {
      // Keep the pin clear of the panels drawn over the map
      const target = map.project([shop.lat, shop.lng], map.getZoom());
      const offset = L.point((pad.left - pad.right) / 2, (pad.top - pad.bottom) / 2);
      map.panTo(map.unproject(target.subtract(offset), map.getZoom()), { animate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <>
      <style>{PIN_CSS}</style>
      {/* isolate: Leaflet's own layers (z-index 400+) stay inside the map */}
      <div ref={el} className={className} style={{ isolation: "isolate", zIndex: 0 }} role="region" aria-label="Map of shops" />
    </>
  );
}

const PIN_CSS = `
.lmpin-wrap{background:none;border:0}
.lmpin{position:relative;width:32px;height:40px;cursor:pointer;transform-origin:16px 40px;transition:transform .15s ease}
.lmpin-head{position:absolute;left:3px;top:6px;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:var(--c);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center}
.lmpin-ic{transform:rotate(45deg);display:flex}
.lmpin.is-approx .lmpin-head{border-style:dashed}
.lmpin-label{position:absolute;left:31px;top:9px;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:600 12px/1.3 var(--font-system,system-ui);color:#202124;text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff,0 0 3px #fff}
.lm-nolabels .lmpin:not(.is-sel) .lmpin-label{display:none}
.lmpin.is-sel{transform:scale(1.15);z-index:2}
.lmpin.is-sel .lmpin-label{background:#fff;text-shadow:none;padding:2px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.25);top:7px}
.lmplace{position:relative;width:20px;height:20px}
.lmplace-dot{position:absolute;inset:2px;border-radius:50%;background:#202124;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)}
.lmplace-label{position:absolute;left:24px;top:-1px;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;background:#202124;color:#fff;font:600 12px/1.3 var(--font-system,system-ui);padding:3px 8px;border-radius:999px;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.lmme{position:relative;width:22px;height:22px}
.lmme span{position:absolute;inset:3px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)}
.lmme:before{content:"";position:absolute;inset:-14px;border-radius:50%;background:rgba(26,115,232,.18);animation:lmme 2s ease-out infinite}
@keyframes lmme{0%{transform:scale(.4);opacity:1}100%{transform:scale(1.2);opacity:0}}
@media (prefers-reduced-motion:reduce){.lmme:before{animation:none}}
.leaflet-container{font-family:var(--font-system,system-ui);background:#E8EAED}
.leaflet-control-zoom a{width:40px!important;height:40px!important;line-height:40px!important;font-size:20px!important;color:#3c4043!important}
.leaflet-bar{border:0!important;box-shadow:0 1px 4px rgba(0,0,0,.3)!important;border-radius:10px!important;overflow:hidden}
`;
