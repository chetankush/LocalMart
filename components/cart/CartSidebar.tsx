'use client';

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  selectCartTotal,
  selectIsCartOpen,
  closeCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
} from '@/lib/redux/slices/cartSlice';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CartSidebar() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);
  const isOpen = useAppSelector(selectIsCartOpen);

  // Auto-close cart after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        dispatch(closeCart());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, dispatch]);

  if (!isOpen) return null;

  return (
    <>

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Shopping Cart</h2>
          <button
            onClick={() => dispatch(closeCart())}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-lg font-medium">Your cart is empty</p>
              <p className="text-sm mt-2">Add items to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 bg-gray-50 p-4 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
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
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.vendorName}
                    </p>
                    <p className="text-lg font-bold text-gray-900 mt-2">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      ₹{item.price.toFixed(2)} each
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => dispatch(decrementQuantity(item.id))}
                        className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => dispatch(incrementQuantity(item.id))}
                        className="p-1 hover:bg-gray-200 rounded transition-colors cursor-pointer"
                        disabled={item.quantity >= item.stockQuantity}
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => dispatch(removeFromCart(item.id))}
                        className="ml-auto p-1 hover:bg-red-100 text-red-600 rounded transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {item.quantity >= item.stockQuantity && (
                      <p className="text-xs text-orange-600 mt-1">
                        Max stock reached
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            {/* View Cart Button */}
            <button
              className="w-full bg-[#FF9933] text-white py-3 rounded-full font-semibold hover:bg-[#e8872b] transition-colors cursor-pointer"
              onClick={() => {
                dispatch(closeCart());
                router.push('/cart');
              }}
            >
              View Cart
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => dispatch(closeCart())}
              className="w-full border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
