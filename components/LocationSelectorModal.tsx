"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "@/context/LocationContext";
import { useRouter } from "next/navigation";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
}: LocationSelectorModalProps) {
  const { updateLocation, detectAndSetLocation } = useLocation();
  const router = useRouter();

  const [pincode, setPincode] = useState("");
  const [locality, setLocality] = useState("");
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState("");

  const handleManualSubmit = (e: React.FormEvent) => {
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

    updateLocation(pincode, locality);
    onClose();

    // Update URL with pincode parameter
    router.push(`/stores?pincode=${pincode}`);
  };

  const handleDetectLocation = async () => {
    setIsDetecting(true);
    setError("");

    try {
      await detectAndSetLocation();
      onClose();

      // The location context will update, and we'll navigate with the new pincode
      // We'll handle this in the parent component
    } catch (error: any) {
      setError(
        error.message || "Failed to detect location. Please enter manually."
      );
    } finally {
      setIsDetecting(false);
    }
  };

  const handleClose = () => {
    setError("");
    setPincode("");
    setLocality("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
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
              disabled={isDetecting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base"
              type="button"
            >
              {isDetecting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Detecting location...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Use my current location
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 text-center">
              We'll access your location to find stores near you
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Manual entry form */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                type="text"
                placeholder="Enter 6-digit pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6 text-base"
            >
              Save Location
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
