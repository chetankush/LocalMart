"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/supabase/auth-provider";

// Focused task screens don't need a footer
const NO_FOOTER = ["/checkout", "/orders/waiting", "/cart", "/my-orders"];

const Footer = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  if (NO_FOOTER.some((p) => pathname.startsWith(p))) return null;

  return (
    <footer className="hidden border-t border-hairline bg-canvas text-label lg:block">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-bold text-label mb-3 block">
              LocalMart
            </Link>
            <p className="text-label-2 text-sm mb-4">
              Your neighborhood marketplace. Shop local, support local.
            </p>
          </div>

          {/* Customer Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-label">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/stores"
                  className="text-label-2 hover:text-label transition-colors text-sm"
                >
                  Browse Stores
                </Link>
              </li>
              <li>
                <Link
                  href="/stores"
                  className="text-label-2 hover:text-label transition-colors text-sm"
                >
                  All Stores
                </Link>
              </li>
              {user && (
                <>
                  <li>
                    <Link
                      href="/my-orders"
                      className="text-label-2 hover:text-label transition-colors text-sm"
                    >
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/favorite-stores"
                      className="text-label-2 hover:text-label transition-colors text-sm"
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
            <h3 className="text-sm font-semibold mb-3 text-label">Sell</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/become-vendor"
                  className="text-label-2 hover:text-label transition-colors text-sm"
                >
                  Add Your Store
                </Link>
              </li>
              {user && (
                <li>
                  <Link
                    href="/vendor/dashboard"
                    className="text-label-2 hover:text-label transition-colors text-sm"
                  >
                    Seller Dashboard
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-label">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-label-2 hover:text-label transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              {!user && (
                <li>
                  <Link
                    href="/sign-in"
                    className="text-label-2 hover:text-label transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-hairline mt-6 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-label-2 text-xs">
              © {new Date().getFullYear()} LocalMart. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-label-2 text-xs">Secure payments</span>
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
