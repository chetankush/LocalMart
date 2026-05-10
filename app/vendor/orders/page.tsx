import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersList from "./OrdersList";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

async function getVendorOrders(authToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendor/orders`, {
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { notFound: true, orders: [] };
      }
      console.error("Failed to fetch orders:", response.status);
      return { error: true, orders: [] };
    }

    const result = await response.json();

    // Convert Decimal values to numbers for client components
    const orders = (result.data || []).map((order: any) => ({
      ...order,
      subtotal: Number(order.subtotal),
      deliveryFee: Number(order.deliveryFee),
      taxAmount: Number(order.taxAmount),
      discount: Number(order.discount),
      totalAmount: Number(order.totalAmount),
      platformCommission: Number(order.platformCommission),
      vendorPayout: Number(order.vendorPayout),
      items: order.items?.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        product: item.product ? {
          ...item.product,
          price: Number(item.product.price),
        } : null,
      })) || [],
    }));

    return { orders };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return { error: true, orders: [] };
  }
}

export default async function VendorOrdersPage() {
  const user = await requireRole(["VENDOR"]);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    redirect("/sign-in");
  }

  const result = await getVendorOrders(session.access_token);

  if (result.notFound) {
    redirect("/vendor/onboarding");
  }

  if (result.error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-sm text-gray-600">
              Manage and track your orders
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-red-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Orders
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your orders. Please try refreshing the
              page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const orders = result.orders;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600">
            Manage and track your orders ({orders.length} total)
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <OrdersList orders={orders} />
      </div>
    </div>
  );
}
