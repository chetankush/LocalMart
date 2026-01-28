"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Loader2 } from "lucide-react";

interface NotifyMeButtonProps {
  vendorId: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "compact";
  className?: string;
}

export default function NotifyMeButton({
  vendorId,
  size = "md",
  variant = "default",
  className = "",
}: NotifyMeButtonProps) {
  const router = useRouter();

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handle hydration - only render dynamic content after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check subscription status on mount
  useEffect(() => {
    if (!isMounted) return;

    const checkSubscriptionStatus = async () => {
      try {
        const { apiClient } = await import("@/lib/api/client");
        const result = await apiClient.checkFavoriteStatus(vendorId);

        if (result?.success && result?.data) {
          setIsSubscribed(result.data.isFavorited);
        }
      } catch (error) {
        // Silently fail - user might not be logged in
      } finally {
        setIsChecking(false);
      }
    };

    checkSubscriptionStatus();
  }, [isMounted, vendorId]);

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleClick = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { apiClient } = await import("@/lib/api/client");
      const result = await apiClient.toggleFavorite(vendorId);

      // Handle different response structures from the backend
      if (result?.success) {
        // Check if data exists in the response
        const isFavorited = result?.data?.isFavorited ?? !isSubscribed;
        setIsSubscribed(isFavorited);
        setMessage({
          type: "success",
          text: isFavorited
            ? "Subscribed! You'll get notifications from this store."
            : "Unsubscribed from notifications.",
        });
      } else {
        // API returned success: false
        const errorMsg = result?.error || result?.message || "Failed to update subscription";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      // Handle specific error cases
      if (error?.status === 401 || error?.isAuthError) {
        setMessage({ type: "error", text: "Please sign in to subscribe" });
        // Use current path for redirect
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
        router.push("/sign-in" + (currentPath ? "?redirect=" + encodeURIComponent(currentPath) : ""));
      } else {
        setMessage({
          type: "error",
          text: error?.message || "Something went wrong. Please try again."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-1.5",
    lg: "px-4 py-2.5 text-base gap-2",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  // Show consistent initial state to avoid hydration mismatch
  // On server and initial client render, show "Notify Me" button
  const showLoading = isMounted && isChecking;
  const showSubscribed = isMounted && !isChecking && isSubscribed;

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isLoading || showLoading}
        title={showSubscribed ? "Unsubscribe from notifications" : "Get notified about offers & updates"}
        className={`
          inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200
          ${sizeClasses[size]}
          ${isLoading || showLoading ? "opacity-70 cursor-wait" : "cursor-pointer"}
          ${showSubscribed
            ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200"
            : "bg-orange-500 text-white hover:bg-orange-600"
          }
          ${className}
        `}
      >
        {isLoading || showLoading ? (
          <>
            <Loader2 className={`${iconSizes[size]} animate-spin`} />
            {variant === "default" && <span>{isLoading ? "Please wait..." : "Loading..."}</span>}
          </>
        ) : showSubscribed ? (
          <>
            <BellOff className={iconSizes[size]} />
            {variant === "default" && <span>Subscribed</span>}
          </>
        ) : (
          <>
            <Bell className={iconSizes[size]} />
            {variant === "default" && <span>Notify Me</span>}
          </>
        )}
      </button>

      {/* Toast Message - only show after mount */}
      {isMounted && message && (
        <div
          className={`
            absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-lg text-xs font-medium
            whitespace-nowrap z-50 shadow-lg
            ${message.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
            }
          `}
        >
          {message.text}
          {/* Arrow */}
          <div
            className={`
              absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45
              ${message.type === "success" ? "bg-green-600" : "bg-red-600"}
            `}
          />
        </div>
      )}
    </div>
  );
}
