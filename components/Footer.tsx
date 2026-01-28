"use client";

import Link from "next/link";
import { useAuth } from "@/lib/supabase/auth-provider";

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-white mb-3 block">
              NearStore
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Your neighborhood marketplace. Shop local, support local.
            </p>
          </div>

          {/* Customer Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stores"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Browse Stores
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  All Products
                </Link>
              </li>
              {user && (
                <>
                  <li>
                    <Link
                      href="/my-orders"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/favorite-stores"
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      Favorites
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Business Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Sell</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/become-vendor"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Add Your Store
                </Link>
              </li>
              {user && (
                <li>
                  <Link
                    href="/vendor/dashboard"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Seller Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              {!user && (
                <li>
                  <Link
                    href="/sign-in"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} NearStore. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-xs">Secure payments</span>
              <div className="flex gap-1">
                <span className="text-sm">💳</span>
                <span className="text-sm">🏦</span>
                <span className="text-sm">📱</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
