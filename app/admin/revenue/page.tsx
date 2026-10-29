"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IndianRupee } from "lucide-react";
import { Button, rupees } from "@/components/app/ui";
import { SectionHeader, StatGrid, StatTile } from "@/components/app/seller";
import { AdminPage, EmptyBlock, LoadingBlock, statusInfo } from "@/components/app/admin";

interface RevenueDashboard {
  overview: {
    totalOrders: number;
    totalOrdersThisMonth: number;
    totalOrdersThisWeek: number;
    completedOrders: number;
    cancelledOrders: number;
    activeVendors: number;
    totalCustomers: number;
  };
  revenue: {
    totalGMV: number;
    totalCommission: number;
    totalVendorPayouts: number;
    gmvThisMonth: number;
    commissionThisMonth: number;
  };
  ordersByStatus: { status: string; count: number }[];
}

// Bars follow the order's journey, not the database's order
const STATUS_ORDER = [
  "PENDING",
  "PRE_ORDER",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "REJECTED",
  "REFUNDED",
];
const statusRank = (s: string) => {
  const i = STATUS_ORDER.indexOf(s);
  return i === -1 ? STATUS_ORDER.length : i;
};

const count = (n: number) => Number(n || 0).toLocaleString("en-IN");
const share = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : null);

const SUBTITLE = "Sales and commission count delivered orders only.";

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const result = await apiClient.get<any>("/admin/dashboard/revenue");
      setData(result.data || null);
    } catch (error) {
      console.error("Failed to fetch revenue:", error);
      toast.error("Couldn't load the numbers");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminPage title="Revenue" subtitle={SUBTITLE}>
        <LoadingBlock label="Adding up the numbers…" />
      </AdminPage>
    );
  }

  if (!data) {
    return (
      <AdminPage title="Revenue" subtitle={SUBTITLE}>
        <EmptyBlock
          icon={<IndianRupee className="h-7 w-7" aria-hidden />}
          title="Couldn't load the numbers"
          body="Check your connection and try again."
          action={<Button onClick={fetchDashboard}>Try again</Button>}
        />
      </AdminPage>
    );
  }

  const { overview, revenue, ordersByStatus } = data;
  const statuses = [...(ordersByStatus || [])].sort((a, b) => statusRank(a.status) - statusRank(b.status));
  const maxStatusCount = Math.max(...statuses.map((o) => o.count), 1);
  const monthRate = share(revenue.commissionThisMonth, revenue.gmvThisMonth);
  const allRate = share(revenue.totalCommission, revenue.totalGMV);
  const avgOrder = overview.completedOrders > 0 ? revenue.totalGMV / overview.completedOrders : null;
  const cancelShare = share(overview.cancelledOrders, overview.totalOrders);

  return (
    <AdminPage title="Revenue" subtitle={SUBTITLE}>
      <section className="mb-6">
        <SectionHeader title="Last 30 days" />
        <StatGrid>
          <StatTile label="Sales" value={rupees(revenue.gmvThisMonth)} hint="Delivered orders" />
          <StatTile
            label="Our commission"
            value={rupees(revenue.commissionThisMonth)}
            hint={monthRate ? `${monthRate} of sales` : undefined}
          />
          <StatTile label="Orders placed" value={count(overview.totalOrdersThisMonth)} hint="Any status" />
          <StatTile label="Last 7 days" value={count(overview.totalOrdersThisWeek)} hint="Orders placed" />
        </StatGrid>
      </section>

      <section className="mb-6">
        <SectionHeader title="All time" />
        <StatGrid>
          <StatTile label="Sales" value={rupees(revenue.totalGMV)} hint="Delivered orders" />
          <StatTile
            label="Our commission"
            value={rupees(revenue.totalCommission)}
            hint={allRate ? `${allRate} of sales` : undefined}
          />
          <StatTile label="Shop payouts" value={rupees(revenue.totalVendorPayouts)} hint="Shops' share of sales" />
          <StatTile
            label="Delivered orders"
            value={count(overview.completedOrders)}
            hint={avgOrder !== null ? `About ${rupees(Math.round(avgOrder))} each` : undefined}
          />
        </StatGrid>
      </section>

      <section className="mb-6">
        <SectionHeader title="Orders, shops & shoppers" />
        <StatGrid>
          <StatTile label="All orders" value={count(overview.totalOrders)} href="/admin/orders" />
          <StatTile
            label="Cancelled"
            value={count(overview.cancelledOrders)}
            hint={cancelShare ? `${cancelShare} of orders` : undefined}
          />
          <StatTile label="Live shops" value={count(overview.activeVendors)} href="/admin" />
          <StatTile label="Shoppers" value={count(overview.totalCustomers)} href="/admin/users" />
        </StatGrid>
      </section>

      <section className="mb-6">
        <SectionHeader title="Orders by status" />
        <div className="rounded-2xl bg-card p-4 sm:p-5">
          {statuses.length === 0 ? (
            <p className="py-6 text-center text-[15px] text-label-2">No orders yet.</p>
          ) : (
            <ul className="space-y-3.5">
              {statuses.map((item) => {
                const pct = (item.count / maxStatusCount) * 100;
                return (
                  <li
                    key={item.status}
                    className="grid grid-cols-[6.5rem_1fr_3rem] items-center gap-3 sm:grid-cols-[9rem_1fr_4rem]"
                  >
                    <span className="truncate text-[13px] text-label-2">{statusInfo(item.status).label}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-fill" aria-hidden>
                      <span
                        className="block h-full rounded-full bg-tint transition-[width] duration-500"
                        style={{ width: `${item.count > 0 ? Math.max(pct, 2) : 0}%` }}
                      />
                    </span>
                    <span className="text-right text-[15px] font-semibold tabular-nums text-label">{count(item.count)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </AdminPage>
  );
}
