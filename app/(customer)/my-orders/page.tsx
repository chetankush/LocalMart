'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-provider';
import { useRouter, usePathname } from 'next/navigation';
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
    storeLogo: string | null;
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
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

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

    // Navigate
    router.push(href);
  };

  // Clear loading state ONLY when pathname actually changes (navigation complete)
  useEffect(() => {
    setLoadingLink(null);
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
      
      // Ensure session is ready before making API call
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // Try to refresh the session
        const { data: refreshData } = await supabase.auth.refreshSession();
        if (!refreshData.session) {
          router.push('/sign-in');
          return;
        }
      }
      
      const { apiClient } = await import('@/lib/api/client');
      const data = await apiClient.getOrders();
      setOrders(data.orders || []);
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      // Check if it's an auth error
      if (error instanceof Error && (error as Error & { isAuthError?: boolean }).isAuthError) {
        router.push('/sign-in');
        return;
      }
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <button
            onClick={(e) => handleNavigation("/", e)}
            className="inline-flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base text-gray-700 hover:text-orange-500 mb-3 sm:mb-4 cursor-pointer transition-colors bg-transparent border-none"
          >
            {loadingLink === "/" && <LoadingSpinner size="sm" />}
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Back to Home</span>
          </button>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
            {!orders || orders.length === 0
              ? 'You haven\'t placed any orders yet'
              : `${orders.length} order${orders.length > 1 ? 's' : ''} found`}
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-lg shadow-md p-8 sm:p-12 lg:p-16 text-center">
            <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              No orders yet
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Start shopping to place your first order!
            </p>
            <button
              onClick={(e) => handleNavigation("/", e)}
              className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-orange-600 transition-colors cursor-pointer"
            >
              {loadingLink === "/" && <LoadingSpinner size="sm" />}
              Browse Products
            </button>
          </div>
        ) : (
          // Orders List
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.PENDING;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={order.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Order Header */}
                  <div className="bg-gray-50 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-gray-900">
                          Order #{order.orderNumber}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${statusInfo.color}`}>
                          <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          {statusInfo.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-3 sm:p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Items */}
                      <div className="lg:col-span-2">
                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Items Ordered</h4>
                        <div className="space-y-3 sm:space-y-4">
                          {order.items?.map((item) => (
                            <div key={item.id} className="flex gap-3 sm:gap-4">
                              <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl sm:text-2xl">
                                    📦
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-medium text-sm sm:text-base text-gray-900 line-clamp-2">{item.productName}</h5>
                                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                                  Quantity: {item.quantity} × ₹{Number(item.unitPrice).toFixed(2)}
                                </p>
                                <p className="font-semibold text-sm sm:text-base text-gray-900 mt-0.5 sm:mt-1">
                                  ₹{Number(item.totalPrice).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Vendor Info */}
                        {order.vendor && (
                          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                            <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">Vendor</h4>
                            <div className="flex items-start gap-2 sm:gap-3">
                              {order.vendor.storeLogo ? (
                                <img 
                                  src={order.vendor.storeLogo} 
                                  alt={order.vendor.businessName}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-sm sm:text-base text-gray-900">{order.vendor.businessName}</p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {order.vendor.city}, {order.vendor.state}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {order.vendor.contactPhone}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Order Summary */}
                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Order Summary</h4>

                          <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">Total Amount</span>
                              <span className="font-semibold text-gray-900">
                                ₹{Number(order.totalAmount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">Payment Method</span>
                              <span className="font-medium text-gray-900">
                                {order.paymentMethod}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs sm:text-sm">
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
                          {order.deliveryAddress && (
                            <div className="pt-3 sm:pt-4 border-t">
                              <h5 className="font-semibold text-gray-900 mb-1.5 sm:mb-2 text-xs sm:text-sm">Delivery Address</h5>
                              <div className="text-xs sm:text-sm text-gray-600">
                                <p className="font-medium text-gray-900">{order.deliveryAddress.fullName}</p>
                                <p>{order.deliveryAddress.street}</p>
                                <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                                <p>{order.deliveryAddress.zipCode}</p>
                                <p className="mt-1">Phone: {order.deliveryAddress.phone}</p>
                              </div>
                            </div>
                          )}
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
