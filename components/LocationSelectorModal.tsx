"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useLocation } from "@/context/LocationContext";
import { useRouter } from "next/navigation";
import { searchAddresses, getPlaceDetails, type AddressSuggestion } from "@/lib/location/geolocation";
import { apiClient } from "@/lib/api/client";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DetectionState = 'idle' | 'requesting' | 'detecting' | 'success' | 'error';

export default function LocationSelectorModal({
  isOpen,
  onClose,
}: LocationSelectorModalProps) {
  const { updateLocation, detectAndSetLocation, setLocationFromResult, validatePincode } = useLocation();
  const router = useRouter();

  const [pincode, setPincode] = useState("");
  const [locality, setLocality] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [detectionState, setDetectionState] = useState<DetectionState>('idle');
  const [error, setError] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Debounced address search — try DB first, fall back to Nominatim
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Try our DB first for fast, validated results
        const dbResults = await apiClient.searchLocations(searchQuery);
        if (dbResults.success && dbResults.data.length > 0) {
          const mapped: AddressSuggestion[] = dbResults.data.map((item) => ({
            placeId: `db-${item.type}-${item.id}`,
            mainText: item.type === 'city' ? item.name : `${item.pincode} - ${item.name}`,
            secondaryText: [item.city, item.state].filter(Boolean).join(', '),
          }));
          setSuggestions(mapped);
          return;
        }
      } catch {
        // DB search failed, fall through to Nominatim
      }

      // Fall back to external search
      if (searchQuery.length >= 3) {
        const results = await searchAddresses(searchQuery);
        setSuggestions(results);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate pincode (6 digits for Indian pincode)
    if (!/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    if (!locality.trim()) {
      setError("Please enter your locality/area");
      return;
    }

    // Try DB validation first, then fall back to external API
    try {
      const dbResult = await apiClient.validatePincodeFromDB(pincode);
      if (dbResult.success && dbResult.data) {
        updateLocation(pincode, locality || dbResult.data.area || '');
        onClose();
        router.push(`/stores?pincode=${pincode}`);
        return;
      }
    } catch {
      // DB validation failed, try external
    }

    // Fall back to external pincode validation
    const result = await validatePincode(pincode);
    if (result) {
      updateLocation(pincode, locality);
    } else {
      updateLocation(pincode, locality);
    }

    onClose();
    router.push(`/stores?pincode=${pincode}`);
  };

  const handleDetectLocation = async () => {
    setDetectionState('requesting');
    setError("");

    try {
      // Show "requesting permission" state briefly
      await new Promise(resolve => setTimeout(resolve, 500));
      setDetectionState('detecting');

      const result = await detectAndSetLocation();
      setDetectionState('success');
      
      // Brief success state before closing
      await new Promise(resolve => setTimeout(resolve, 800));
      onClose();
      router.push(`/stores?pincode=${result.pincode}`);
    } catch (err: any) {
      setDetectionState('error');
      setError(err.message || "Failed to detect location. Please enter manually.");
    }
  };

  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    try {
      const result = await getPlaceDetails(suggestion.placeId);
      if (result) {
        setLocationFromResult(result);
        onClose();
        router.push(`/stores?pincode=${result.pincode}`);
      }
    } catch (err) {
      setError("Failed to get location details");
    }
  };

  const handleClose = () => {
    setError("");
    setPincode("");
    setLocality("");
    setSearchQuery("");
    setSuggestions([]);
    setDetectionState('idle');
    setShowSearch(false);
    onClose();
  };

  const getDetectionButtonContent = () => {
    switch (detectionState) {
      case 'requesting':
        return (
          <>
            <div className="w-5 h-5 mr-2 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            Requesting permission...
          </>
        );
      case 'detecting':
        return (
          <>
            <div className="w-5 h-5 mr-2 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            Detecting your location...
          </>
        );
      case 'success':
        return (
          <>
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Location detected!
          </>
        );
      case 'error':
        return (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Try again
          </>
        );
      default:
        return (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Use my current location
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-900">Choose your location</DialogTitle>
          <DialogDescription className="text-gray-600">
            Select your delivery location to see stores near you
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-detect location option */}
          <div className="space-y-3">
            <Button
              onClick={handleDetectLocation}
              disabled={detectionState === 'requesting' || detectionState === 'detecting'}
              className={`w-full py-6 text-base transition-all ${
                detectionState === 'success' 
                  ? 'bg-green-100 hover:bg-green-100 text-green-700 border-green-300'
                  : 'bg-[#FF9933] hover:bg-[#e8872b] text-white'
              }`}
              type="button"
            >
              {getDetectionButtonContent()}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              We'll access your location to find stores near you
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Search for area (like Blinkit/Zepto) */}
          {showSearch ? (
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for area, street name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-base pl-10"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.placeId}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="font-medium text-gray-900">{suggestion.mainText}</div>
                      <div className="text-sm text-gray-500">{suggestion.secondaryText}</div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowSearch(false)}
                className="text-sm text-blue-600 hover:underline cursor-pointer"
              >
                Enter pincode manually instead
              </button>
            </div>
          ) : (
            <>
              {/* Manual entry form */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="Enter 6-digit pincode"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locality">Locality / Area</Label>
                  <Input
                    id="locality"
                    type="text"
                    placeholder="e.g., Kotwali, Gandhi Nagar"
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="text-base"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-base"
                >
                  Save Location
                </Button>
              </form>

              {/* Search option */}
              <button
                onClick={() => setShowSearch(true)}
                className="w-full text-sm text-blue-600 hover:underline cursor-pointer"
              >
                Search for area, street name...
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
