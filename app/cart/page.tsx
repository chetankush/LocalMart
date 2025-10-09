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
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            {items.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-red-600 hover:text-red-700 font-medium cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>
          <p className="text-gray-600 mt-2">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.reduce((sum, item) => sum + item.quantity, 0)} items in your cart`}
          </p>
        </div>

        {items.length === 0 ? (
          // Empty Cart State
          <div className="bg-white rounded-lg shadow-md p-16 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 mb-6">
              Add some products to get started!
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              <span>Browse Products</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {Object.entries(itemsByVendor).map(([vendorId, { vendorName, items: vendorItems }]) => (
                <div key={vendorId} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Vendor Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h2 className="font-bold text-gray-900">
                      🏪 {vendorName}
                    </h2>
                  </div>

                  {/* Vendor Items */}
                  <div className="divide-y">
                    {vendorItems.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">
                              Stock: {item.stockQuantity} available
                            </p>

                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-4">
                                <button
                                  onClick={() => dispatch(decrementQuantity(item.id))}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-semibold text-lg min-w-[3rem] text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => dispatch(incrementQuantity(item.id))}
                                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  disabled={item.quantity >= item.stockQuantity}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="text-xl font-bold text-gray-900">
                                  ₹{(item.price * item.quantity).toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  ₹{item.price.toFixed(2)} each
                                </p>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => dispatch(removeFromCart(item.id))}
                              className="mt-4 inline-flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Remove</span>
                            </button>

                            {item.quantity >= item.stockQuantity && (
                              <p className="text-sm text-orange-600 mt-2">
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
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">₹{total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tax (included)</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between text-lg font-bold text-gray-900">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-4 cursor-pointer"
                  onClick={() => router.push('/checkout')}
                >
                  Proceed to Checkout
                </button>

                {/* Continue Shopping */}
                <Link
                  href="/"
                  className="block w-full text-center border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </Link>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Free delivery on all orders</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="text-green-600">✓</span>
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-600">
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
