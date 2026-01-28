'use client';

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  selectCartTotal,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} from '@/lib/redux/slices/cartSlice';
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  // Group items by vendor
  const itemsByVendor = items.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = {
        vendorName: item.vendorName,
        items: [],
      };
    }
    acc[item.vendorId].items.push(item);
    return acc;
  }, {} as Record<string, { vendorName: string; items: typeof items }>);

  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-700 hover:text-orange-500 mb-3 sm:mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-sm sm:text-base text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.reduce((sum, item) => sum + item.quantity, 0)} items in your cart`}
          </p>
        </div>

        {items.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 lg:p-16 text-center">
            <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Add some products to get started!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-orange-600 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Browse Products</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {Object.entries(itemsByVendor).map(([vendorId, { vendorName, items: vendorItems }]) => (
                <div key={vendorId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Vendor Header */}
                  <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-b">
                    <h2 className="font-bold text-sm sm:text-base text-gray-900">
                       {vendorName}
                    </h2>
                  </div>

                  {/* Vendor Items */}
                  <div className="divide-y">
                    {vendorItems.map((item) => (
                      <div key={item.id} className="p-3 sm:p-4 lg:p-6">
                        <div className="flex gap-3 sm:gap-4 lg:gap-6">
                          {/* Product Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">
                                📦
                              </div>
                            )}
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-0.5 sm:mb-1 line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                              Stock: {item.stockQuantity} available
                            </p>

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 sm:gap-4">
                                <button
                                  onClick={() => dispatch(decrementQuantity(item.id))}
                                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <span className="font-semibold text-base sm:text-lg min-w-[2rem] sm:min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => dispatch(incrementQuantity(item.id))}
                                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  disabled={item.quantity >= item.stockQuantity}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-left sm:text-right">
                                <p className="text-lg sm:text-xl font-bold text-gray-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  ₹{item.price.toFixed(2)} each
                                </p>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => dispatch(removeFromCart(item.id))}
                              className="mt-2 sm:mt-4 inline-flex items-center gap-1.5 sm:gap-2 text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span>Remove</span>
                            </button>

                            {item.quantity >= item.stockQuantity && (
                              <p className="text-xs sm:text-sm text-orange-600 mt-1 sm:mt-2">
                                Maximum stock reached
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Order Summary
                </h2>

                <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                  <div className="flex items-center justify-between text-sm sm:text-base text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm sm:text-base text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm sm:text-base text-gray-600">
                    <span>Tax (included)</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>

                  <div className="border-t pt-3 sm:pt-4">
                    <div className="flex items-center justify-between text-base sm:text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full bg-orange-500 text-white py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-orange-600 transition-colors mb-3 sm:mb-4 cursor-pointer"
                  onClick={() => router.push('/checkout')}
                >
                  Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <Link
                  href="/"
                  className="block w-full text-center border border-gray-300 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </Link>

                {/* Additional Info */}
                <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Free delivery on all orders</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Easy returns within 7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
