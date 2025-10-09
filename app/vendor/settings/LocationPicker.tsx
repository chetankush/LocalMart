"use client";

import { useEffect, useRef, useState } from "react";

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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Check if Google Maps API key is configured
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      setMapError(true);
      return;
    }

    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => setMapError(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Default to India center if no coordinates provided
    const center = {
      lat: initialLat || 20.5937,
      lng: initialLng || 78.9629,
    };

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: initialLat ? 15 : 5,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapInstanceRef.current = map;

    // Add marker
    const marker = new google.maps.Marker({
      position: center,
      map,
      draggable: true,
      title: "Store Location",
    });

    markerRef.current = marker;

    // Update location when marker is dragged
    marker.addListener("dragend", () => {
      const position = marker.getPosition();
      if (position) {
        onLocationSelect(position.lat(), position.lng());
      }
    });

    // Update location when map is clicked
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        onLocationSelect(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Add search box
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Search for your location...";
    input.className =
      "w-80 px-4 py-2 mt-2 ml-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    const searchBox = new google.maps.places.SearchBox(input);

    map.addListener("bounds_changed", () => {
      searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
    });

    searchBox.addListener("places_changed", () => {
      const places = searchBox.getPlaces();

      if (!places || places.length === 0) return;

      const place = places[0];

      if (!place.geometry || !place.geometry.location) return;

      // Update map view
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      // Update marker position
      marker.setPosition(place.geometry.location);
      onLocationSelect(
        place.geometry.location.lat(),
        place.geometry.location.lng()
      );
    });
  }, [mapLoaded, initialLat, initialLng, onLocationSelect]);

  // Update marker position when coordinates change externally
  useEffect(() => {
    if (markerRef.current && initialLat && initialLng) {
      const newPosition = { lat: initialLat, lng: initialLng };
      markerRef.current.setPosition(newPosition);
      mapInstanceRef.current?.setCenter(newPosition);
    }
  }, [initialLat, initialLng]);

  if (mapError) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex flex-col items-center justify-center p-6">
        <svg
          className="w-16 h-16 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-gray-600 text-center mb-2">
          Google Maps API key not configured
        </p>
        <p className="text-sm text-gray-500 text-center">
          Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment
          variables
        </p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            You can still save your store settings without a map location
          </p>
        </div>
      </div>
    );
  }

  if (!mapLoaded) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div ref={mapRef} className="h-96 w-full rounded-lg shadow-sm" />
      <p className="text-xs text-gray-500 mt-2">
        💡 Tip: Drag the marker or click on the map to set your exact location.
        Use the search box to find your address quickly.
      </p>
    </div>
  );
}
