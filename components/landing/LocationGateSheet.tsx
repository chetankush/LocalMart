"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/context/LocationContext";
import { apiClient } from "@/lib/api/client";
import { Locate, MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Store the user just tapped on, for context in the prompt. */
  store?: { businessName: string; city: string; locality?: string | null };
}

/**
 * When a user in explore mode taps a cross-city popular store, this sheet
 * intercepts the navigation and asks them to set a location first. They can:
 *   - Type their own pincode (most common)
 *   - Use current location (GPS)
 *   - Switch to the store's city (still requires a pincode entry for clarity)
 */
export default function LocationGateSheet({ open, onClose, store }: Props) {
  const router = useRouter();
  const { detectAndSetLocation, updateLocation } = useLocation();
  const [pincode, setPincode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(pincode)) {
      setError("Enter a valid 6-digit pincode");
      return;
    }
    setSubmitting(true);
    try {
      const dbResult = await apiClient.validatePincodeFromDB(pincode);
      if (dbResult?.success && dbResult.data) {
        updateLocation(pincode, dbResult.data.area || dbResult.data.city || "");
      } else {
        updateLocation(pincode, "");
      }
      onClose();
      router.refresh();
    } catch {
      updateLocation(pincode, "");
      onClose();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDetect = async () => {
    setError(null);
    setDetecting(true);
    try {
      await detectAndSetLocation();
      onClose();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't detect your location";
      setError(msg);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-ink">
            {store ? `${store.businessName} delivers in ${store.city}` : "Set your location"}
          </DialogTitle>
          <DialogDescription className="text-ink-2">
            {store
              ? "Enter your pincode to see if they deliver to you — or browse stores in your area instead."
              : "Tell us where you are so we can show what's deliverable to you."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 mt-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" aria-hidden />
            <Input
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="Enter your pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="pl-9 h-11"
              aria-label="Pincode"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || pincode.length !== 6}
            className="w-full h-11 bg-ink hover:bg-ink/90 text-white"
          >
            {submitting ? "Finding shops..." : "Continue"}
          </Button>
        </form>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-sand" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-ink-2">or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDetect}
          disabled={detecting}
          className="w-full inline-flex items-center justify-center gap-2 h-11 rounded-md border border-sand bg-white text-ink font-medium hover:bg-ivory disabled:opacity-60"
        >
          <Locate className="w-4 h-4" aria-hidden />
          {detecting ? "Detecting..." : "Use my current location"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-laal mt-2">
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
