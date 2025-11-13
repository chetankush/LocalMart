'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, Truck, Home, ArrowLeft } from 'lucide-react';

// Loading Spinner Component
const LoadingSpinner = ({ size = "sm" }: { size?: "sm" | "md" }) => {
  const sizeClass = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  return (
    <div className={`${sizeClass} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
};

interface OrderItem {
  id: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  deliveryAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  vendor: {
    businessName: string;
    contactPhone: string;
    city: string;
    state: string;
  };
  items: OrderItem[];
}

const statusConfig = {
  PENDING: { label: 'Pending', icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
  ACCEPTED: { label: 'Accepted', icon: CheckCircle, color: 'text-orange-600 bg-orange-100' },
  PREPARING: { label: 'Preparing', icon: Package, color: 'text-orange-600 bg-orange-100' },
  READY: { label: 'Ready', icon: Package, color: 'text-orange-600 bg-orange-100' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', icon: Truck, color: 'text-orange-600 bg-orange-100' },
  DELIVERED: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600 bg-green-100' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-100' },
  REFUNDED: { label: 'Refunded', icon: XCircle, color: 'text-gray-600 bg-gray-100' },
};

export default function MyOrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingLink, setLoadingLink] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Optimized navigation handler for instant navigation
  const handleNavigation = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    // If we're already on this page, do a full page refresh (like e-commerce sites)
    if (pathname === href) {
      // Do a full hard refresh to get fresh data from server
      window.location.href = href;
      return;
    }

    // Set loading state immediately
    setLoadingLink(href);
    setIsNavigating(true);

    // Navigate
    startTransition(() => {
      router.push(href);
    });
  };

  // Clear loading state ONLY when pathname actually changes (navigation complete)
  useEffect(() => {
    setLoadingLink(null);
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
      return;
    }

    if (user) {
      fetchOrders();
    }
  }, [user, loading, router]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={(e) => handleNavigation("/", e)}
            className="inline-flex items-center gap-2 text-gray-700 hover:text-orange-500 mb-4 cursor-pointer transition-colors bg-transparent border-none"
          >
            {loadingLink === "/" && <LoadingSpinner size="sm" />}
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">
            {!orders || orders.length === 0
              ? 'You haven\'t placed any orders yet'
              : `${orders.length} order${orders.length > 1 ? 's' : ''} found`}
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-16 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start shopping to place your first order!
            </p>
            <button
              onClick={(e) => handleNavigation("/", e)}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors cursor-pointer"
            >
              {loadingLink === "/" && <LoadingSpinner size="sm" />}
              Browse Products
            </button>
          </div>
        ) : (
          // Orders List
          <div className="space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-4">Items Ordered</h4>
                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                              <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">
                                    📦
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{item.productName}</h5>
                                <p className="text-sm text-gray-600 mt-1">
                                  Quantity: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                                </p>
                                <p className="font-semibold text-gray-900 mt-1">
                                  ₹{Number(item.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Vendor Info */}
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold text-gray-900 mb-2">Vendor</h4>
                          <div className="flex items-start gap-2">
                            <Home className="w-5 h-5 text-gray-400 mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-900">{order.vendor.businessName}</p>
                              <p className="text-sm text-gray-600">
                                {order.vendor.city}, {order.vendor.state}
                              </p>
                              <p className="text-sm text-gray-600">
                                {order.vendor.contactPhone}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Order Summary</h4>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total Amount</span>
                              <span className="font-semibold text-gray-900">
                                ₹{Number(order.totalAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Method</span>
                              <span className="font-medium text-gray-900">
                                {order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Payment Status</span>
                              <span className={`font-medium ${
                                order.paymentStatus === 'COMPLETED' ? 'text-green-600' :
                                order.paymentStatus === 'FAILED' ? 'text-red-600' :
                                'text-yellow-600'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                          </div>

                          {/* Delivery Address */}
                          <div className="pt-4 border-t">
                            <h5 className="font-semibold text-gray-900 mb-2 text-sm">Delivery Address</h5>
                            <div className="text-sm text-gray-600">
                              <p className="font-medium text-gray-900">{order.deliveryAddress.fullName}</p>
                              <p>{order.deliveryAddress.street}</p>
                              <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                              <p>{order.deliveryAddress.zipCode}</p>
                              <p className="mt-1">Phone: {order.deliveryAddress.phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
