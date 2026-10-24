"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ChevronRight, ReceiptText } from "lucide-react";
import { Button, Pill, Row, formatIST, rupees, type Tone } from "@/components/app/ui";
import { List, SectionHeader } from "@/components/app/seller";
import { Sheet } from "@/components/app/Sheet";
import {
  AdminPage,
  Chips,
  Detail,
  DetailGrid,
  EmptyBlock,
  LoadingBlock,
  Pagination,
  StatusPill,
  TableCard,
  Toolbar,
  statusInfo,
  tdClass,
  thClass,
  trClass,
} from "@/components/app/admin";
import { useConfirm } from "@/hooks/useConfirm";

// "ORD-1792827552401-N8QLJCLWD" → "N8QLJCLWD": the full number is in the sheet
const shortOrderNo = (n: string) => n.split("-").pop() || n;

interface StatusEntry {
  status: string;
  timestamp?: string;
  note?: string;
  updatedBy?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  platformCommission: number;
  vendorPayout: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  customer: { id: string; fullName: string; email: string; phone: string };
  vendor: { id: string; businessName: string; city: string };
  items: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
  // Also sent by the API (the whole order row comes back)
  subtotal?: number;
  deliveryFee?: number;
  discount?: number;
  statusHistory?: StatusEntry[] | null;
}

const FILTER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];
const STATUS_FILTERS = [
  { value: "", label: "All" },
  ...FILTER_STATUSES.map((s) => ({ value: s, label: statusInfo(s).label })),
];

// The one step forward an admin can move an order (same steps as before)
const NEXT_STEP: Record<string, { status: string; label: string; short: string }> = {
  PENDING: { status: "ACCEPTED", label: "Accept order", short: "Accept" },
  ACCEPTED: { status: "PREPARING", label: "Start packing", short: "Start packing" },
  PREPARING: { status: "READY", label: "Mark as ready", short: "Mark ready" },
  READY: { status: "OUT_FOR_DELIVERY", label: "Send out for delivery", short: "Send out" },
  OUT_FOR_DELIVERY: { status: "DELIVERED", label: "Mark as delivered", short: "Mark delivered" },
};

const METHOD_LABEL: Record<string, string> = {
  COD: "Cash on delivery",
  CASH: "Cash on delivery",
  UPI: "UPI",
  CARD: "Card",
  ONLINE: "Online",
};
const methodLabel = (m?: string | null) => (m ? METHOD_LABEL[m.toUpperCase()] ?? m : "Not set");

// Payment PENDING means "not paid yet", not "waiting for approval"
const paymentInfo = (s: string): { label: string; tone: Tone } =>
  s === "PENDING" ? { label: "Not paid yet", tone: "warn" } : statusInfo(s);

const toneText: Record<Tone, string> = {
  neutral: "text-label-2",
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
  info: "text-info",
  brand: "text-tint",
};

const WHO: Record<string, string> = { ADMIN: "Admin", CUSTOMER: "Shopper", VENDOR: "Shop", SYSTEM: "LocalMart" };

const itemCount = (o: Order) => o.items?.reduce((n, i) => n + (Number(i.quantity) || 0), 0) ?? 0;

function MoneyRow({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
      <span className={strong ? "font-semibold text-label" : "text-label-2"}>{label}</span>
      <span className={`tabular-nums ${strong ? "text-[17px] font-bold text-label" : "text-label"}`}>{value}</span>
    </div>
  );
}

export default function AdminOrdersPage() {
  const confirm = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  // Which status we're moving to, so the right button spins
  const [updatingTo, setUpdatingTo] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Read from the list so the sheet shows fresh data after a change
  const selected = orders.find((o) => o.id === selectedId) ?? null;

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { apiClient } = await import("@/lib/api/client");
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "20");

      const result = await apiClient.get<any>(`/admin/orders?${params}`);
      setOrders(result.data?.orders || []);
      setTotalPages(result.data?.pagination?.totalPages || 1);
      setTotal(result.data?.pagination?.total || 0);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      toast.error("Couldn't load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (newStatus === "CANCELLED") {
      const ok = await confirm({
        title: "Cancel this order?",
        description: "The items go back into the shop's stock. This can't be undone.",
        confirmLabel: "Cancel order",
        cancelLabel: "Keep order",
        destructive: true,
      });
      if (!ok) return;
    }

    try {
      setUpdatingId(orderId);
      setUpdatingTo(newStatus);
      const { apiClient } = await import("@/lib/api/client");
      await apiClient.patch(`/admin/orders/${orderId}/status`, {
        status: newStatus,
        note: "Updated by admin",
      });
      toast.success(
        `${order ? `Order #${order.orderNumber}` : "Order"} is now “${statusInfo(newStatus).label}”`,
      );
      await fetchOrders();
    } catch (error: any) {
      console.error("Failed to update order:", error);
      toast.error(error?.message || "Couldn't change the order");
    } finally {
      setUpdatingId(null);
      setUpdatingTo(null);
    }
  };

  const changePage = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filterLabel = STATUS_FILTERS.find((f) => f.value === statusFilter)?.label ?? "";
  const next = selected ? NEXT_STEP[selected.status] : undefined;
  const history = selected && Array.isArray(selected.statusHistory) ? [...selected.statusHistory].reverse() : [];

  return (
    <AdminPage title="Orders" subtitle="Every order on LocalMart. Tap one to see the details or move it along.">
      <Toolbar>
        <Chips
          label="Filter orders"
          options={STATUS_FILTERS}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </Toolbar>

      {loading ? (
        <LoadingBlock label="Loading orders…" />
      ) : orders.length === 0 ? (
        <EmptyBlock
          icon={<ReceiptText className="h-7 w-7" aria-hidden />}
          title="No orders here"
          body={statusFilter ? `Nothing under “${filterLabel}” right now.` : "Orders show up here as soon as shoppers place them."}
        />
      ) : (
        <>
          <p className="mb-2 px-1 text-[14px] tabular-nums text-label-2">
            {total} {total === 1 ? "order" : "orders"}
          </p>

          {/* Desktop */}
          <TableCard>
            <thead>
              <tr>
                <th className={thClass}>Order</th>
                <th className={thClass}>Shop</th>
                <th className={thClass}>Customer</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={thClass}>Status</th>
                <th className={`${thClass} text-right`}>Next step</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const step = NEXT_STEP[order.status];
                const pay = paymentInfo(order.paymentStatus);
                const count = itemCount(order);
                return (
                  <tr key={order.id} className={`${trClass} cursor-pointer`} onClick={() => setSelectedId(order.id)}>
                    <td className={tdClass}>
                      <p className="whitespace-nowrap font-semibold text-label" title={order.orderNumber}>
                        #{shortOrderNo(order.orderNumber)}
                      </p>
                      <p className="whitespace-nowrap text-[13px] text-label-2">{formatIST(order.createdAt)}</p>
                    </td>
                    <td className={`${tdClass} min-w-[150px]`}>
                      <p className="line-clamp-2 font-medium">{order.vendor?.businessName}</p>
                      <p className="text-[13px] text-label-2">{order.vendor?.city}</p>
                    </td>
                    <td className={`${tdClass} min-w-[130px]`}>
                      <p>{order.customer?.fullName}</p>
                      <p className="text-[13px] text-label-2">{order.customer?.phone || order.customer?.email}</p>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <p className="whitespace-nowrap font-semibold tabular-nums">{rupees(order.totalAmount)}</p>
                      <p className="whitespace-nowrap text-[13px] text-label-2">
                        {count} {count === 1 ? "item" : "items"}
                      </p>
                    </td>
                    <td className={tdClass}>
                      <StatusPill status={order.status} />
                      <p className="mt-1 whitespace-nowrap text-[13px] text-label-2">
                        {methodLabel(order.paymentMethod)} ·{" "}
                        <span className={`font-medium ${toneText[pay.tone]}`}>{pay.label}</span>
                      </p>
                    </td>
                    <td className={`${tdClass} text-right`}>
                      <div className="flex items-center justify-end gap-2">
                        {step && (
                          <Button
                            variant="secondary"
                            size="md"
                            className="whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(order.id, step.status);
                            }}
                            loading={updatingId === order.id}
                            disabled={!!updatingId}
                          >
                            {step.short}
                          </Button>
                        )}
                        <ChevronRight className="h-5 w-5 shrink-0 text-label-3" aria-hidden />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableCard>

          {/* Phone */}
          <List className="md:hidden">
            {orders.map((order) => {
              const count = itemCount(order);
              return (
                <Row
                  key={order.id}
                  onClick={() => setSelectedId(order.id)}
                  title={<span className="font-semibold">{order.vendor?.businessName}</span>}
                  subtitle={
                    <>
                      <span className="block">
                        #{shortOrderNo(order.orderNumber)} · {order.customer?.fullName}
                      </span>
                      <span className="block">
                        {count} {count === 1 ? "item" : "items"} · {formatIST(order.createdAt)}
                      </span>
                    </>
                  }
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <span className="font-semibold tabular-nums text-label">{rupees(order.totalAmount)}</span>
                      <StatusPill status={order.status} />
                    </span>
                  }
                />
              );
            })}
          </List>

          <Pagination page={page} totalPages={totalPages} onChange={changePage} />
        </>
      )}

      {/* ── Order details ── */}
      <Sheet
        open={!!selected}
        onClose={() => setSelectedId(null)}
        wide
        title={selected ? `Order #${selected.orderNumber}` : undefined}
        description={selected ? `${selected.vendor?.businessName} · ${formatIST(selected.createdAt)}` : undefined}
        footer={
          selected &&
          next &&
          (selected.status === "PENDING" ? (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1 text-bad!"
                onClick={() => handleStatusUpdate(selected.id, "CANCELLED")}
                loading={updatingId === selected.id && updatingTo === "CANCELLED"}
                disabled={!!updatingId}
              >
                Cancel order
              </Button>
              <Button
                className="flex-[1.6]"
                onClick={() => handleStatusUpdate(selected.id, next.status)}
                loading={updatingId === selected.id && updatingTo === next.status}
                disabled={!!updatingId}
              >
                {next.label}
              </Button>
            </div>
          ) : (
            <Button
              full
              onClick={() => handleStatusUpdate(selected.id, next.status)}
              loading={updatingId === selected.id}
              disabled={!!updatingId}
            >
              {next.label}
            </Button>
          ))
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill status={selected.status} />
              <Pill tone={paymentInfo(selected.paymentStatus).tone}>{paymentInfo(selected.paymentStatus).label}</Pill>
              <span className="text-[14px] text-label-2">{methodLabel(selected.paymentMethod)}</span>
            </div>

            <section>
              <SectionHeader title={`Items (${itemCount(selected)})`} />
              <List>
                {selected.items?.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] leading-snug text-label">{item.productName}</p>
                      <p className="mt-0.5 text-[13px] tabular-nums text-label-2">
                        {item.quantity} × {rupees(item.unitPrice)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[15px] tabular-nums text-label">{rupees(item.totalPrice)}</span>
                  </div>
                ))}
              </List>
            </section>

            <section>
              <SectionHeader title="Money" />
              <List>
                {typeof selected.subtotal === "number" && <MoneyRow label="Items" value={rupees(selected.subtotal)} />}
                {typeof selected.deliveryFee === "number" && (
                  <MoneyRow label="Delivery" value={selected.deliveryFee > 0 ? rupees(selected.deliveryFee) : "Free"} />
                )}
                {typeof selected.discount === "number" && selected.discount > 0 && (
                  <MoneyRow label="Discount" value={<span className="text-ok">−{rupees(selected.discount)}</span>} />
                )}
                <MoneyRow label="Order total" value={rupees(selected.totalAmount)} strong />
                <MoneyRow label="LocalMart commission" value={rupees(selected.platformCommission)} />
                <MoneyRow label="Shop gets" value={rupees(selected.vendorPayout)} />
              </List>
            </section>

            <section>
              <SectionHeader title="People" />
              <DetailGrid>
                <Detail label="Customer">{selected.customer?.fullName}</Detail>
                <Detail label="Customer phone">
                  {selected.customer?.phone ? (
                    <a href={`tel:${selected.customer.phone}`} className="text-tint">
                      {selected.customer.phone}
                    </a>
                  ) : (
                    <span className="text-label-3">Not given</span>
                  )}
                </Detail>
                <Detail label="Customer email">
                  {selected.customer?.email || <span className="text-label-3">Not given</span>}
                </Detail>
                <Detail label="Shop">
                  {selected.vendor?.businessName}
                  {selected.vendor?.city && <span className="text-label-2"> · {selected.vendor.city}</span>}
                </Detail>
              </DetailGrid>
            </section>

            {history.length > 0 && (
              <section>
                <SectionHeader title="What happened" />
                <ol className="overflow-hidden rounded-2xl bg-card divide-y divide-hairline">
                  {history.map((entry, i) => {
                    const by = entry.updatedBy ? WHO[entry.updatedBy] ?? entry.updatedBy : null;
                    const note = entry.note && entry.note !== "Updated by admin" ? entry.note : null;
                    return (
                      <li key={`${entry.status}-${entry.timestamp ?? i}`} className="flex gap-3 px-4 py-3">
                        <span
                          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? "bg-tint" : "bg-fill-strong"}`}
                          aria-hidden
                        />
                        <div className="min-w-0">
                          <p className="text-[15px] font-medium leading-snug text-label">{statusInfo(entry.status).label}</p>
                          <p className="text-[13px] text-label-2">
                            {entry.timestamp ? formatIST(entry.timestamp) : ""}
                            {by && `${entry.timestamp ? " · " : ""}by ${by}`}
                          </p>
                          {note && <p className="mt-0.5 text-[14px] leading-snug text-label-2">{note}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}
          </div>
        )}
      </Sheet>
    </AdminPage>
  );
}
