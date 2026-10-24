"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/app/ui";
import { inputClass } from "@/components/app/form";

interface LocationPickerProps {
  initialLat: number;
  initialLng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationPicker({
  initialLat,
  initialLng,
  onLocationSelect,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const updateMarker = useCallback(
    (lat: number, lng: number) => {
      if (markerRef.current && mapInstanceRef.current) {
        markerRef.current.setLatLng([lat, lng]);
        mapInstanceRef.current.setView([lat, lng]);
        onLocationSelect(lat, lng);
      }
    },
    [onLocationSelect]
  );

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const center: [number, number] = [
      initialLat || 20.5937,
      initialLng || 78.9629,
    ];
    const zoom = initialLat ? 15 : 5;

    // Fix Leaflet default marker icon issue with bundlers
    const defaultIcon = L.icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(center, {
      draggable: true,
      icon: defaultIcon,
    }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onLocationSelect(pos.lat, pos.lng);
    });

    map.on("click", (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [initialLat, initialLng, onLocationSelect]);

  // Update marker when coordinates change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && initialLat && initialLng) {
      markerRef.current.setLatLng([initialLat, initialLng]);
      mapInstanceRef.current.setView([initialLat, initialLng]);
    }
  }, [initialLat, initialLng]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`,
        { headers: { "User-Agent": "LocalMart/1.0" } }
      );
      const data = await res.json();

      if (data.length > 0) {
        const { lat, lon } = data[0];
        updateMarker(parseFloat(lat), parseFloat(lon));
        mapInstanceRef.current?.setZoom(16);
      } else {
        toast.error("Couldn't find that place. Try your area or city name.");
      }
    } catch {
      // Search is a shortcut — the shop can still tap the map
      toast.error("Search isn't working right now. Tap the map at your shop instead.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      {/* Search bar — type="button" + preventDefault so it never submits the settings form */}
      <div className="mb-3 flex gap-2">
        <input
          type="search"
          enterKeyHint="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search your area or street"
          aria-label="Search your area or street"
          className={`${inputClass} min-w-0 flex-1`}
        />
        <Button type="button" variant="secondary" onClick={handleSearch} loading={searching} className="shrink-0">
          {!searching && <Search className="h-[18px] w-[18px]" aria-hidden />}
          Search
        </Button>
      </div>

      {/* Map */}
      <div ref={mapRef} className="relative isolate z-0 h-72 w-full overflow-hidden rounded-2xl bg-fill sm:h-96" />
      <p className="mt-2 text-[14px] leading-snug text-label-2">
        Drag the pin or tap the map at your shop. पिन को अपनी दुकान पर रखें।
      </p>
    </div>
  );
}
