"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  detectLocation,
  validateAndGetPincodeLocation,
  clearLocationCache,
  type LocationResult,
} from "@/lib/location/geolocation";

interface LocationData {
  pincode: string;
  locality: string;
  city?: string;
  state?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: 'high' | 'medium' | 'low';
  source?: 'gps' | 'ip' | 'manual';
}

interface LocationContextType {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  updateLocation: (pincode: string, locality: string) => void;
  setLocationFromResult: (result: LocationResult) => void;
  detectAndSetLocation: () => Promise<LocationResult>;
  validatePincode: (pincode: string) => Promise<LocationResult | null>;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const LOCATION_STORAGE_KEY = "user_location_v2";
const AUTO_DETECT_ATTEMPTED_KEY = "location_auto_detect_attempted";
const LOCATION_COOKIE_KEY = "lm_loc";
const LOCATION_COOKIE_MAX_AGE_DAYS = 90;

/**
 * Persist a compact location representation to a cookie so server components
 * (page.tsx) can read it on the next navigation/refresh and fetch location-
 * aware data on the server. Kept small: pincode, lat, lng, city, locality.
 */
function writeLocationCookie(loc: LocationData | null) {
  if (typeof document === "undefined") return;
  if (!loc) {
    document.cookie = `${LOCATION_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }
  const payload = {
    p: loc.pincode || "",
    lat: typeof loc.latitude === "number" ? loc.latitude : undefined,
    lng: typeof loc.longitude === "number" ? loc.longitude : undefined,
    c: loc.city || "",
    l: loc.locality || "",
  };
  try {
    const value = encodeURIComponent(JSON.stringify(payload));
    const maxAge = LOCATION_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${LOCATION_COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* cookie write failures are non-fatal */
  }
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load location from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setLocation(parsed);
      }
    } catch (err) {
      console.error("Failed to parse stored location:", err);
    }
    setIsLoading(false);
  }, []);

  // No silent auto-detect: a guess from the internet connection is often
  // the wrong town (and raced with what the shopper typed). First-time
  // visitors get the "Where should we deliver?" sheet; GPS runs only when
  // they tap "Use my current location".

  // Save location to localStorage and cookie whenever it changes
  useEffect(() => {
    if (location) {
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      } catch (err) {
        console.error("Failed to save location:", err);
      }
      writeLocationCookie(location);
    }
  }, [location]);

  // Save straight away (not only in the effect) so a router.refresh()
  // right after choosing an area already sends the new area to the server
  const choose = useCallback((next: LocationData) => {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage can be blocked; the cookie still works
    }
    writeLocationCookie(next);
    setLocation(next);
    setError(null);
  }, []);

  const updateLocation = useCallback((pincode: string, locality: string) => {
    choose({
      pincode,
      locality,
      source: 'manual',
      accuracy: 'low',
    });
  }, [choose]);

  const setLocationFromResult = useCallback((result: LocationResult) => {
    choose({
      pincode: result.pincode,
      locality: result.locality,
      city: result.city,
      state: result.state,
      fullAddress: result.fullAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: result.accuracy,
      source: result.source,
    });
  }, [choose]);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    localStorage.removeItem(AUTO_DETECT_ATTEMPTED_KEY);
    writeLocationCookie(null);
    clearLocationCache();
  }, []);

  /**
   * Detect location using GPS/IP with Google Maps geocoding
   * This is the main method called by "Use my current location" button
   */
  const detectAndSetLocation = useCallback(async (): Promise<LocationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await detectLocation();

      // A guess from the internet connection is often the wrong town —
      // only accept a real GPS fix here
      if (result.source === 'ip') {
        throw new Error("Couldn't get your exact location. Please type your PIN code.");
      }
      if (!result.pincode) {
        throw new Error("Could not determine pincode. Please enter manually.");
      }

      setLocationFromResult(result);
      return result;
    } catch (err) {
      const errorMessage = getLocationErrorMessage(err as { code?: number; message?: string });
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setLocationFromResult]);

  /**
   * Validate pincode and get location details
   */
  const validatePincode = useCallback(async (pincode: string): Promise<LocationResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await validateAndGetPincodeLocation(pincode);
      
      if (result) {
        setLocationFromResult(result);
      }
      
      return result;
    } catch {
      setError("Failed to validate pincode");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [setLocationFromResult]);

  return (
    <LocationContext.Provider
      value={{
        location,
        isLoading,
        error,
        updateLocation,
        setLocationFromResult,
        detectAndSetLocation,
        validatePincode,
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

/**
 * Convert geolocation errors to user-friendly messages
 */
function getLocationErrorMessage(error: { code?: number; message?: string } | null | undefined): string {
  // Handle GeolocationPositionError
  if (error?.code) {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return "Location access denied. Please enable location in your browser settings or enter your pincode manually.";
      case 2: // POSITION_UNAVAILABLE
        return "Unable to determine your location. Please check your GPS settings or enter pincode manually.";
      case 3: // TIMEOUT
        return "Location request timed out. Please try again or enter your pincode manually.";
    }
  }

  // Handle custom errors
  if (error?.message) {
    return error.message;
  }

  return "Failed to detect location. Please enter your pincode manually.";
}
