"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LocationData {
  pincode: string;
  locality: string;
}

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  updateLocation: (pincode: string, locality: string) => void;
  detectAndSetLocation: () => Promise<void>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

const LOCATION_STORAGE_KEY = "user_location";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load location from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLocation(parsed);
      } catch (error) {
        console.error("Failed to parse stored location:", error);
      }
    }
    setIsLoading(false);
  }, []);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    }
  }, [location]);

  const updateLocation = (pincode: string, locality: string) => {
    setLocation({ pincode, locality });
  };

  const clearLocation = () => {
    setLocation(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
  };

  // Detect location using browser's Geolocation API
  const detectAndSetLocation = async (): Promise<void> => {
    setIsLoading(true);
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
        }
      );

      const { latitude, longitude } = position.coords;
      console.log("Current coordinates:", { latitude, longitude });

      // Try multiple geocoding services for better accuracy
      let pincode = "";
      let locality = "";

      // Method 1: Try BigDataCloud API (free, good for Indian locations)
      try {
        const bdcResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );

        if (bdcResponse.ok) {
          const bdcData = await bdcResponse.json();
          console.log("BigDataCloud response:", bdcData);

          pincode = bdcData.postcode || "";
          locality = bdcData.locality || bdcData.city || bdcData.principalSubdivision || "";

          if (pincode && locality) {
            console.log("Location found via BigDataCloud:", { pincode, locality });
            setLocation({ pincode, locality });
            return;
          }
        }
      } catch (error) {
        console.warn("BigDataCloud API failed, trying fallback...", error);
      }

      // Method 2: Try OpenStreetMap Nominatim as fallback
      try {
        const osmResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "NearStore-App",
            },
          }
        );

        if (osmResponse.ok) {
          const osmData = await osmResponse.json();
          console.log("OpenStreetMap response:", osmData);

          pincode = osmData.address?.postcode || "";
          locality =
            osmData.address?.suburb ||
            osmData.address?.neighbourhood ||
            osmData.address?.city_district ||
            osmData.address?.town ||
            osmData.address?.city ||
            "";

          if (pincode && locality) {
            console.log("Location found via OpenStreetMap:", { pincode, locality });
            setLocation({ pincode, locality });
            return;
          }
        }
      } catch (error) {
        console.warn("OpenStreetMap API failed", error);
      }

      // Method 3: Try Geocode.xyz as final fallback
      try {
        const geocodeResponse = await fetch(
          `https://geocode.xyz/${latitude},${longitude}?json=1&region=IN`
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          console.log("Geocode.xyz response:", geocodeData);

          pincode = geocodeData.postal || "";
          locality = geocodeData.city || geocodeData.region || "";

          if (pincode && locality) {
            console.log("Location found via Geocode.xyz:", { pincode, locality });
            setLocation({ pincode, locality });
            return;
          }
        }
      } catch (error) {
        console.warn("Geocode.xyz API failed", error);
      }

      // If all methods fail
      throw new Error(
        "Could not determine your pincode accurately. Please enter it manually for better results."
      );
    } catch (error) {
      console.error("Location detection failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        updateLocation,
        detectAndSetLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
