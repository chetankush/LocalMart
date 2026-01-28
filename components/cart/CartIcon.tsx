'use client';

import { useAppSelector } from '@/lib/redux/hooks';
import { selectCartItemsCount, selectCartItems } from '@/lib/redux/slices/cartSlice';
import { ShoppingCart, X } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CartIcon() {
  const itemsCount = useAppSelector(selectCartItemsCount);
  const cartItems = useAppSelector(selectCartItems);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [prevItemsCount, setPrevItemsCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show mini cart when items are added
  useEffect(() => {
    if (itemsCount > prevItemsCount && itemsCount > 0) {
      setShowMiniCart(true);
      // Auto hide after 5 seconds
      const timer = setTimeout(() => {
        setShowMiniCart(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
    setPrevItemsCount(itemsCount);
  }, [itemsCount, prevItemsCount]);

  // Get last 3 items for preview
  const recentItems = cartItems.slice(-3).reverse();

  return (
    <div
      className="relative"
      onMouseEnter={() => itemsCount > 0 && setShowMiniCart(true)}
      onMouseLeave={() => setShowMiniCart(false)}
    >
      <Link
        href="/cart"
        className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors block"
        aria-label="Shopping cart"
      >
        <ShoppingCart className="w-6 h-6 text-white" />
        {mounted && (
          <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center leading-none">
            {itemsCount > 99 ? '99+' : itemsCount}
          </span>
        )}
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
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
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
              className="block w-full py-2.5 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
