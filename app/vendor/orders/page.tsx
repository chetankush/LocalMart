import { requireRole } from "@/src/shared/utils/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OrdersList from "./OrdersList";
import { RefreshCw } from "lucide-react";
import { EmptyState, LargeTitle, Page } from "@/components/app/ui";
import { signInHref } from "@/lib/auth/returnTo";

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
    redirect(signInHref("/vendor/orders"));
  }

  const result = await getVendorOrders(session.access_token);

  if (result.notFound) {
    redirect("/vendor/onboarding");
  }

  if (result.error) {
    return (
      <Page>
        <LargeTitle title="Orders" />
        <EmptyState
          icon={<RefreshCw className="h-8 w-8" aria-hidden />}
          title="Couldn't load your orders"
          body="Check your internet and refresh the page."
        />
      </Page>
    );
  }

  const orders = result.orders;
  const newCount = orders.filter((o: any) => o.status === "PENDING" || o.status === "PRE_ORDER").length;
  const activeCount = orders.filter((o: any) =>
    ["ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status)
  ).length;

  return (
    <Page>
      <LargeTitle
        title="Orders"
        subtitle={
          newCount > 0
            ? `${newCount} new order${newCount === 1 ? "" : "s"} waiting for you`
            : activeCount > 0
              ? `${activeCount} order${activeCount === 1 ? "" : "s"} to pack and deliver`
              : "All caught up"
        }
      />
      <OrdersList orders={orders} />
    </Page>
  );
}
