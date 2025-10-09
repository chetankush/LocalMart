"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/supabase/auth-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import CartIcon from "@/components/cart/CartIcon";

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isApprovedVendor, setIsApprovedVendor] = useState(false);
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
    <header className="bg-gray-950 text-white">
      <div className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
        <Link href="/" className="text-2xl font-bold text-white">
          LocalMart
        </Link>
        <div className="flex gap-4 items-center">
          <Link
            href="/stores"
            className="hover:text-blue-400 transition-colors text-white"
          >
            Browse Stores
          </Link>

          {!loading && user && (
            <Link
              href="/my-orders"
              className="hover:text-blue-400 transition-colors cursor-pointer text-white"
            >
              My Orders
            </Link>
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
    </header>
  );
};

export default Navbar;
