"use client";

import { useState, useCallback } from "react";
import {
  detectLocation,
  searchAddresses,
  getPlaceDetails,
  validateAndGetPincodeLocation,
  type LocationResult,
  type AddressSuggestion,
} from "./geolocation";

interface UseGeolocationReturn {
  // State
  isDetecting: boolean;
  error: string | null;
  
  // Methods
  detect: () => Promise<LocationResult>;
  searchAddress: (query: string) => Promise<AddressSuggestion[]>;
  selectPlace: (placeId: string) => Promise<LocationResult | null>;
  validatePincode: (pincode: string) => Promise<LocationResult | null>;
  clearError: () => void;
}

/**
 * Custom hook for geolocation functionality
 * Use this in components that need location detection
 */
export function useGeolocation(): UseGeolocationReturn {
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async (): Promise<LocationResult> => {
    setIsDetecting(true);
    setError(null);

    try {
      const result = await detectLocation();
      return result;
    } catch (err: any) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message);
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const searchAddress = useCallback(async (query: string): Promise<AddressSuggestion[]> => {
    if (query.length < 3) return [];
    
    try {
      return await searchAddresses(query);
    } catch (err) {
      console.error("Address search failed:", err);
      return [];
    }
  }, []);

  const selectPlace = useCallback(async (placeId: string): Promise<LocationResult | null> => {
    setIsDetecting(true);
    setError(null);

    try {
      const result = await getPlaceDetails(placeId);
      return result;
    } catch (err: any) {
      setError("Failed to get location details");
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const validatePincode = useCallback(async (pincode: string): Promise<LocationResult | null> => {
    setIsDetecting(true);
    setError(null);

    try {
      const result = await validateAndGetPincodeLocation(pincode);
      if (!result) {
        setError("Invalid pincode");
      }
      return result;
    } catch (err) {
      setError("Failed to validate pincode");
      return null;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDetecting,
    error,
    detect,
    searchAddress,
    selectPlace,
    validatePincode,
    clearError,
  };
}

function getErrorMessage(error: any): string {
  if (error?.code) {
    switch (error.code) {
      case 1:
        return "Location access denied. Please enable location or enter pincode manually.";
      case 2:
        return "Unable to determine location. Please try again or enter pincode.";
      case 3:
        return "Location request timed out. Please try again.";
    }
  }
  return error?.message || "Failed to detect location";
}
