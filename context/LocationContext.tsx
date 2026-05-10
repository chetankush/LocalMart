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

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

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
    setHasInitialized(true);
  }, []);

  // Auto-detect location on first visit (if no location saved)
  useEffect(() => {
    if (!hasInitialized) return;

    // Skip if location already exists
    if (location) return;

    // Check if we've already attempted auto-detection
    const alreadyAttempted = localStorage.getItem(AUTO_DETECT_ATTEMPTED_KEY);
    if (alreadyAttempted) return;

    // Mark that we've attempted auto-detection
    localStorage.setItem(AUTO_DETECT_ATTEMPTED_KEY, "true");

    // Auto-detect location silently
    const autoDetect = async () => {
      try {
        setIsLoading(true);
        const result = await detectLocation();

        if (result?.pincode) {
          setLocation({
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
        }
      } catch (err) {
        // Silently fail - user can manually set location
        console.log("Auto-detect location failed:", err);
      } finally {
        setIsLoading(false);
      }
    };

    autoDetect();
  }, [hasInitialized, location]);

  // Save location to localStorage whenever it changes
  useEffect(() => {
    if (location) {
      try {
        localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
      } catch (err) {
        console.error("Failed to save location:", err);
      }
    }
  }, [location]);

  const updateLocation = useCallback((pincode: string, locality: string) => {
    setLocation({
      pincode,
      locality,
      source: 'manual',
      accuracy: 'low',
    });
    setError(null);
  }, []);

  const setLocationFromResult = useCallback((result: LocationResult) => {
    setLocation({
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
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    localStorage.removeItem(LOCATION_STORAGE_KEY);
    localStorage.removeItem(AUTO_DETECT_ATTEMPTED_KEY);
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
      
      if (!result.pincode) {
        throw new Error("Could not determine pincode. Please enter manually.");
      }

      setLocationFromResult(result);
      return result;
    } catch (err: any) {
      const errorMessage = getLocationErrorMessage(err);
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
    } catch (err: any) {
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
function getLocationErrorMessage(error: any): string {
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
