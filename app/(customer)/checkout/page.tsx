'use client';

import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import {
  selectCartItems,
  selectCartTotal,
  clearCart,
} from '@/lib/redux/slices/cartSlice';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { toast } from 'sonner';

type PaymentMethod = 'cod' | 'upi' | 'card' | 'wallet';

interface DeliveryAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user } = useAuth();
  const items = useAppSelector(selectCartItems);
  const total = useAppSelector(selectCartTotal);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [address, setAddress] = useState<DeliveryAddress>({
    fullName: (user as any)?.fullName || (user as any)?.user_metadata?.full_name || '',
    phone: (user as any)?.phone || '',
    street: '',
    city: '',
    state: 'Madhya Pradesh',
    zipCode: '',
  });

  // Redirect if cart is empty
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 lg:p-16 text-center max-w-md w-full">
          <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🛒</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Add some products before checking out!
          </p>
          <Link
            href="/"
            className="inline-block bg-[#FF9933] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#e8872b] transition-colors cursor-pointer"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const deliveryFee = 0;
  const taxAmount = 0;
  const finalTotal = total + deliveryFee + taxAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress({
      ...address,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!address.fullName || !address.phone || !address.street || !address.city || !address.zipCode) {
      toast.error('Please fill in all required fields');
      return false;
    }
    if (address.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    if (!user) {
      toast.error('Please sign in to place an order');
      router.push('/sign-in');
      return;
    }

    setIsProcessing(true);

    try {
      // Create order via API
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.createOrder({
        items: items,
        deliveryAddress: address,
        paymentMethod: paymentMethod,
        totalAmount: finalTotal,
      });

      // Clear cart after successful order
      dispatch(clearCart());

      // Show success message
      toast.success(
        `Order placed! Waiting for ${data.orders.length === 1 ? 'confirmation' : `${data.orders.length} stores`}…`
      );

      // Redirect to waiting room (single vs multi-order)
      if (data.orders.length === 1) {
        router.push(`/orders/waiting/${data.orders[0].id}`);
      } else {
        const ids = data.orders.map((o: any) => o.id).join(',');
        router.push(`/orders/waiting?ids=${ids}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-700 hover:text-orange-500 mb-3 sm:mb-4 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Back to Cart</span>
          </Link>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Complete your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Delivery Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={address.street}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="House no., Building name, Street"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    State *
                  </label>
                  <select
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={address.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="6-digit PIN code"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment Method</h2>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {/* Cash on Delivery */}
                <label
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500"
                  />
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-gray-900">Cash on Delivery</p>
                    <p className="text-xs sm:text-sm text-gray-600">Pay when you receive the order</p>
                  </div>
                </label>

                {/* UPI - Coming Soon */}
                <label
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <Smartphone className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">UPI Payment</p>
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold rounded">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Pay using Google Pay, PhonePe, Paytm</p>
                  </div>
                </label>

                {/* Card Payment - Coming Soon */}
                <label
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">Credit/Debit Card</p>
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold rounded">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Visa, Mastercard, Rupay</p>
                  </div>
                </label>

                {/* Net Banking - Coming Soon */}
                <label
                  className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg opacity-60 cursor-not-allowed"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    disabled
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  />
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <p className="font-semibold text-sm sm:text-base text-gray-900">Net Banking</p>
                      <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs font-semibold rounded">
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">All major banks supported</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">Order Summary</h2>

              {/* Items */}
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-48 sm:max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 sm:gap-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg sm:text-xl">
                          📦
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 sm:pt-4 space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                  <span className="font-semibold">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
                </div>

                <div className="border-t pt-2 sm:pt-3">
                  <div className="flex items-center justify-between text-base sm:text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-colors ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-[#FF9933] hover:bg-[#e8872b] cursor-pointer'
                } text-white`}
              >
                {isProcessing ? 'Processing...' : `Place Order (₹${finalTotal.toFixed(2)})`}
              </button>

              {paymentMethod === 'cod' && (
                <p className="text-[10px] sm:text-xs text-gray-600 mt-2 sm:mt-3 text-center">
                  You will pay ₹{finalTotal.toFixed(2)} when you receive the order
                </p>
              )}

              {/* Security Info */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t space-y-1.5 sm:space-y-2">
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>Easy cancellation</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                  <span className="text-green-600">✓</span>
                  <span>7 days return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
