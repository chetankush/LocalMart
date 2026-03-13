"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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
      }
    } catch {
      // Silently fail — user can still click map
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search for your location..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2 bg-[#FF9933] text-white rounded-lg hover:bg-[#e8872b] disabled:opacity-50 text-sm font-medium"
        >
          {searching ? "..." : "Search"}
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} className="h-96 w-full rounded-lg shadow-sm z-0" />
      <p className="text-xs text-gray-500 mt-2">
        Drag the marker or click on the map to set your exact location. Use the
        search box to find your address quickly.
      </p>
    </div>
  );
}
