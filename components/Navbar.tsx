"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import CartIcon from "@/components/cart/CartIcon";
import { useLocation } from "@/context/LocationContext";
import LocationSelectorModal from "@/components/LocationSelectorModal";

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { location } = useLocation();
  const router = useRouter();

  // Check if user is an approved vendor
  useEffect(() => {
    if (user) {
      fetch("/api/check-vendor")
        .then((res) => res.json())
        .then((data) => {
          setIsApprovedVendor(data.isVendor && data.hasVendor);
        })
        .catch(() => {
          setIsApprovedVendor(false);
        });
    } else {
      setIsApprovedVendor(false);
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="bg-gray-950 text-white sticky top-0 z-50 shadow-md">
      <div className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-2xl font-bold text-white">
            NearStore
          </Link>

          {/* Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
          >
            <svg
              className="w-4 h-4"
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
            <div className="flex flex-col items-start">
              <span className="text-xs text-gray-400">
                {location ? "Deliver to" : "Select location"}
              </span>
              <span className="text-sm font-semibold text-white">
                {location
                  ? `${location.locality} ${location.pincode}`
                  : "Choose area"}
              </span>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        <div className="flex gap-4 items-center">
          {/* Mobile Location Selector */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
            title={location ? `${location.locality} ${location.pincode}` : "Select location"}
          >
            <svg
              className="w-4 h-4"
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
            <span className="text-xs font-medium">
              {location ? location.pincode : "Location"}
            </span>
          </button>

          <Link
            href="/stores"
            className="hover:text-blue-400 transition-colors text-white hidden sm:block"
          >
            Browse Stores
          </Link>

          {!loading && user && (
            <>
              <Link
                href="/favorite-stores"
                className="hover:text-blue-400 transition-colors cursor-pointer text-white flex items-center gap-1"
              >
                Favorites
              </Link>
              <Link
                href="/my-orders"
                className="hover:text-blue-400 transition-colors cursor-pointer text-white"
              >
                My Orders
              </Link>
            </>
          )}

          <Link
            href="/become-vendor"
            className="px-3 py-1.5 bg-transparent border border-green-600 text-green-600 rounded-full text-sm font-medium hover:bg-green-600 hover:text-white transition-colors"
          >
            Add Your Store
          </Link>

          <CartIcon />

          {!loading && (
            <>
              {!user ? (
                <Link href="/sign-in">
                  <Button>Sign In</Button>
                </Link>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.email?.[0]?.toUpperCase() || user.phone?.[0] || "U"}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-700">
                      <div className="px-4 py-2 border-b border-gray-700">
                        <p className="text-sm font-medium text-white truncate">
                          {user.email || user.phone}
                        </p>
                      </div>
                      <Link
                        href="/favorite-stores"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                        onClick={() => setShowDropdown(false)}
                      >
                        ❤️ Favorite Stores
                      </Link>
                      {isApprovedVendor ? (
                        <Link
                          href="/vendor/dashboard"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          Vendor Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/become-vendor"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                          onClick={() => setShowDropdown(false)}
                        >
                          Become a Vendor
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </header>
  );
};

export default Navbar;
