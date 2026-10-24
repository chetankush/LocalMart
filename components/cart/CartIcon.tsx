'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import { selectCartItemsCount, selectCartItems } from '@/lib/redux/slices/cartSlice';
import { ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CartIcon({
  tone = "light",
  showLabel = false,
}: {
  /** "dark" = on the navy header */
  tone?: "light" | "dark";
  showLabel?: boolean;
} = {}) {
  const itemsCount = useAppSelector(selectCartItemsCount);
  const cartItems = useAppSelector(selectCartItems);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Desktop only: hovering the cart previews it. Adding an item never pops
  // anything open — the − 1 + counter and the cart bar already confirm it.
  const canHover = () => typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;

  // Get last 3 items for preview
  const recentItems = cartItems.slice(-3).reverse();

  return (
    <div
      className="relative"
      onMouseEnter={() => itemsCount > 0 && canHover() && setShowMiniCart(true)}
      onMouseLeave={() => setShowMiniCart(false)}
    >
      <Link
        href="/cart"
        className={`relative flex h-11 items-center gap-1 rounded-md px-2 transition-colors ${
          tone === "dark" ? "text-white hover:outline hover:outline-1 hover:outline-white/60" : "text-label hover:bg-fill"
        }`}
        aria-label={`Cart${mounted && itemsCount ? `, ${itemsCount} item${itemsCount === 1 ? '' : 's'}` : ''}`}
      >
        <span className="relative">
          <ShoppingCart className="h-7 w-7" strokeWidth={1.9} />
          {mounted && itemsCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-cta px-1 text-[12px] font-bold leading-none text-white">
              {itemsCount > 99 ? '99+' : itemsCount}
            </span>
          )}
        </span>
        {showLabel && <span className="ml-1 text-[14px] font-bold">Cart</span>}
      </Link>

      {/* Mini Cart Popup */}
      {showMiniCart && itemsCount > 0 && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-slideDown">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              Cart ({itemsCount} {itemsCount === 1 ? 'item' : 'items'})
            </h3>
            <button
              onClick={() => setShowMiniCart(false)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Cart Items - Stacked View */}
          <div className="max-h-80 overflow-y-auto">
            {recentItems.map((item, index) => (
              <div
                key={item.id}
                className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                style={{
                  animation: `slideIn 0.3s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="flex gap-3">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.vendorName}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-semibold text-gray-900">
                        ₹{item.price.toFixed(0)} × {item.quantity}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        ₹{(item.price * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Show more indicator if there are more items */}
            {cartItems.length > 3 && (
              <div className="p-3 text-center text-sm text-gray-500">
                + {cartItems.length - 3} more {cartItems.length - 3 === 1 ? 'item' : 'items'}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Subtotal:</span>
              <span className="text-lg font-bold text-gray-900">
                ₹{cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(0)}
              </span>
            </div>
            <Link
              href="/cart"
              className="block w-full rounded-full bg-cta py-2.5 text-center font-semibold text-white transition-colors hover:bg-cta-hover cursor-pointer"
              onClick={() => setShowMiniCart(false)}
            >
              View Cart
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
