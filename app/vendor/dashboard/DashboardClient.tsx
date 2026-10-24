"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Layers,
  Megaphone,
  Package,
  Plus,
  ReceiptText,
  Send,
  Share2,
  ShieldAlert,
  Store,
} from "lucide-react";
import ShareStoreModal from "@/components/ShareStoreModal";
import { Button, Notice, Pill, Row, Thumb, formatIST, rupees } from "@/components/app/ui";
import {
  ActionTile,
  IconBox,
  List,
  SectionHeader,
  StatGrid,
  StatTile,
  orderStatus,
  shopStatus,
} from "@/components/app/seller";
import { useApprovals } from "../_approvals/ApprovalsPollerContext";

interface StoreInfo {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
  city: string;
  storeLogo: string | null;
  storeImages?: string[] | null;
  businessType?: string;
  storeDescription?: string | null;
}

interface StoreData {
  id: string;
  businessName: string;
  status: string;
  isActive: boolean;
  city: string;
  storeLogo: string | null;
  products: any[];
  orders: any[];
  stats: {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

interface DashboardClientProps {
  stores: StoreInfo[];
  initialStoreData: StoreData;
  firstName?: string;
}

const firstImage = (images: unknown): string | null =>
  Array.isArray(images) && typeof images[0] === "string" ? images[0] : null;

/**
 * Seller home. Phone first: what needs doing now (new orders, set-up steps),
 * then the shop's numbers, then big one-tap actions, then the latest orders
 * and products. On desktop the lists move into a right-hand column.
 */
export default function DashboardClient({ stores, initialStoreData, firstName }: DashboardClientProps) {
  const [showShareModal, setShowShareModal] = useState(false);
  const { count: waiting } = useApprovals();

  const shop = initialStoreData;
  const stats = shop.stats;
  const storeId = shop.id;
  const status = shopStatus(shop.status);
  const q = `storeId=${storeId}`;

  // Set-up checklist until the shop has products and a first order
  const setupSteps = [
    { done: true, title: "Shop created", body: "Your name and address are saved" },
    {
      done: stats.totalProducts > 0,
      title: "Add your products",
      body: "Photo, name and price — that's all",
      href: `/vendor/products/new?${q}`,
      action: "Add",
    },
    {
      done: stats.totalOrders > 0,
      title: "Share your shop link",
      body: "Send it on WhatsApp to your customers",
      onClick: () => setShowShareModal(true),
      action: "Share",
    },
  ];
  const showSetup = stats.totalProducts === 0 || stats.totalOrders === 0;
  const doneCount = setupSteps.filter((s) => s.done).length;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-4 pb-8 sm:pt-6 lg:max-w-6xl lg:px-8 lg:pt-8">
      {/* ── Greeting + shop ── */}
      <header className="flex flex-wrap items-end justify-between gap-4 pb-5">
        <div className="min-w-0">
          <p className="text-[16px] text-label-2">Namaste{firstName ? `, ${firstName}` : ""}</p>
          <h1 className="mt-0.5 text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-label sm:text-[34px]">
            {shop.businessName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[15px] text-label-2">
            <Pill tone={status.tone}>
              {shop.status === "ACTIVE" && <span className="h-2 w-2 rounded-full bg-ok" aria-hidden />}
              {status.label}
            </Pill>
            {shop.city && <span>{shop.city}</span>}
          </div>
        </div>
        <div className="hidden gap-2 sm:flex">
          <Button href={`/stores/${storeId}`} variant="secondary" size="md">
            <Eye className="h-[18px] w-[18px]" aria-hidden />
            See my shop
          </Button>
          <Button size="md" onClick={() => setShowShareModal(true)}>
            <Share2 className="h-[18px] w-[18px]" aria-hidden />
            Share shop
          </Button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
        <div>
          {/* ── Orders waiting for an OK ── */}
          {waiting > 0 && (
            <Link
              href="/vendor/approvals"
              className="mb-5 flex items-center gap-4 rounded-2xl bg-tint p-4 text-white transition-transform active:scale-[0.99]"
            >
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/15">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20 motion-reduce:hidden" aria-hidden />
                <Bell className="h-6 w-6" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[18px] font-bold leading-tight">
                  {waiting} new order{waiting === 1 ? "" : "s"} waiting
                </span>
                <span className="mt-0.5 block text-[15px] leading-snug text-white/85">
                  Accept within 10 minutes · अभी देखें
                </span>
              </span>
              <ChevronRight className="h-6 w-6 shrink-0" aria-hidden />
            </Link>
          )}

          {/* ── Shop not live yet ── */}
          {shop.status === "PENDING_APPROVAL" && (
            <div className="mb-5">
              <Notice tone="warn" icon={<Clock className="h-5 w-5 text-warn" aria-hidden />}>
                <p className="font-semibold">LocalMart is checking your shop</p>
                <p className="mt-0.5 text-label-2">
                  Add your products now. Customers will see them as soon as your shop is approved.
                </p>
              </Notice>
            </div>
          )}
          {(shop.status === "SUSPENDED" || shop.status === "REJECTED") && (
            <div className="mb-5">
              <Notice tone="bad" icon={<ShieldAlert className="h-5 w-5 text-bad" aria-hidden />}>
                <p className="font-semibold">Customers can&apos;t see your shop right now</p>
                <p className="mt-0.5 text-label-2">Please contact LocalMart support to open it again.</p>
              </Notice>
            </div>
          )}

          {/* ── Set-up checklist ── */}
          {showSetup && (
            <section className="mb-6">
              <SectionHeader title={`Get your shop ready · ${doneCount} of ${setupSteps.length} done`} />
              <div className="overflow-hidden rounded-2xl bg-card">
                <div className="px-4 pt-4 pb-1" aria-hidden>
                  <div className="h-1.5 overflow-hidden rounded-full bg-fill">
                    <div
                      className="h-full rounded-full bg-ok transition-[width] duration-500"
                      style={{ width: `${(doneCount / setupSteps.length) * 100}%` }}
                    />
                  </div>
                </div>
                <ol className="divide-y divide-hairline">
                  {setupSteps.map((step, i) => (
                    <li key={step.title} className="flex min-h-[64px] items-center gap-3 px-4 py-3">
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
                          step.done ? "bg-ok text-white" : "bg-fill text-label-2"
                        }`}
                        aria-hidden
                      >
                        {step.done ? <Check className="h-[18px] w-[18px]" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[16px] font-semibold leading-snug ${
                            step.done ? "text-label-3" : "text-label"
                          }`}
                        >
                          {step.title}
                        </span>
                        {!step.done && <span className="block text-[14px] leading-snug text-label-2">{step.body}</span>}
                      </span>
                      {!step.done &&
                        (step.href ? (
                          <Button href={step.href} size="md" className="shrink-0">
                            {step.action}
                          </Button>
                        ) : (
                          <Button size="md" variant="secondary" className="shrink-0" onClick={step.onClick}>
                            {step.action}
                          </Button>
                        ))}
                    </li>
                  ))}
                </ol>
              </div>
            </section>
          )}

          {/* ── Numbers ── */}
          <section className="mb-6">
            <SectionHeader title="Your shop at a glance" />
            <StatGrid>
              <StatTile
                label="New orders"
                value={stats.pendingOrders}
                hint="Need your OK"
                tone={stats.pendingOrders > 0 ? "warn" : undefined}
                href="/vendor/orders"
              />
              <StatTile label="Delivered" value={stats.completedOrders} hint="All time" tone="ok" href="/vendor/orders" />
              <StatTile label="All orders" value={stats.totalOrders} hint="All time" href="/vendor/orders" />
              <StatTile label="Products" value={stats.totalProducts} hint="In your shop" href="/vendor/products" />
            </StatGrid>
          </section>

          {/* ── One-tap actions ── */}
          <section className="mb-6">
            <SectionHeader title="What do you want to do?" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <ActionTile
                primary
                href={`/vendor/products/new?${q}`}
                icon={<Plus className="h-6 w-6" strokeWidth={2.4} />}
                title="Add a product"
                hindi="नया सामान जोड़ें"
              />
              <ActionTile
                onClick={() => setShowShareModal(true)}
                icon={<Share2 className="h-[22px] w-[22px]" />}
                title="Share my shop"
                hindi="दुकान का लिंक भेजें"
              />
              <ActionTile
                href="/vendor/orders"
                icon={<ReceiptText className="h-[22px] w-[22px]" />}
                title="See orders"
                hindi="ऑर्डर देखें"
              />
              <ActionTile
                href={`/vendor/products/bulk-add?${q}`}
                icon={<Layers className="h-[22px] w-[22px]" />}
                title="Add many at once"
                hindi="एक साथ कई सामान"
              />
              <ActionTile
                href={`/vendor/broadcast?${q}`}
                icon={<Megaphone className="h-[22px] w-[22px]" />}
                title="Send an offer"
                hindi="ग्राहकों को बताएं"
              />
              <ActionTile
                href={`/vendor/products?${q}`}
                icon={<Package className="h-[22px] w-[22px]" />}
                title="My products"
                hindi="मेरा सारा सामान"
              />
            </div>
          </section>
        </div>

        <div>
          {/* ── Latest orders ── */}
          <section className="mb-6">
            <SectionHeader title="Latest orders" href={shop.orders.length > 0 ? "/vendor/orders" : undefined} />
            {shop.orders.length > 0 ? (
              <List>
                {shop.orders.map((order: any) => {
                  const s = orderStatus(order.status);
                  return (
                    <Row
                      key={order.id}
                      href="/vendor/orders"
                      leading={
                        <IconBox tone="neutral" size={40}>
                          <ReceiptText className="h-5 w-5 text-label-2" />
                        </IconBox>
                      }
                      title={<span className="font-semibold tabular-nums">{rupees(Number(order.totalAmount))}</span>}
                      subtitle={formatIST(order.placedAt ?? order.createdAt)}
                      trailing={<Pill tone={s.tone}>{s.label}</Pill>}
                    />
                  );
                })}
              </List>
            ) : (
              <div className="rounded-2xl bg-card px-5 py-6 text-center">
                <p className="text-[17px] font-semibold text-label">No orders yet</p>
                <p className="mx-auto mt-1 max-w-xs text-[15px] leading-snug text-label-2">
                  Share your shop link on WhatsApp to get your first order.
                </p>
                <Button variant="secondary" size="md" className="mt-4" onClick={() => setShowShareModal(true)}>
                  <Share2 className="h-[18px] w-[18px]" aria-hidden />
                  Share my shop
                </Button>
              </div>
            )}
          </section>

          {/* ── Latest products ── */}
          <section className="mb-6">
            <SectionHeader title="Latest products" href={shop.products.length > 0 ? `/vendor/products?${q}` : undefined} />
            {shop.products.length > 0 ? (
              <List>
                {shop.products.map((product: any) => {
                  const stock = Number(product.stockQuantity ?? 0);
                  return (
                    <Row
                      key={product.id}
                      href={`/vendor/products/${product.id}/edit`}
                      leading={<Thumb src={firstImage(product.images)} alt={product.name} size={44} />}
                      title={<span className="line-clamp-1">{product.name}</span>}
                      subtitle={
                        <>
                          <span className="font-medium tabular-nums text-label">{rupees(Number(product.price))}</span>
                          {" · "}
                          <span className={stock === 0 ? "text-bad" : undefined}>
                            {stock === 0 ? "Out of stock" : `${stock} in stock`}
                          </span>
                        </>
                      }
                      trailing={
                        product.isActive ? (
                          <Pill tone="ok">On sale</Pill>
                        ) : (
                          <Pill tone="neutral">Hidden</Pill>
                        )
                      }
                    />
                  );
                })}
              </List>
            ) : (
              <div className="rounded-2xl bg-card px-5 py-6 text-center">
                <p className="text-[17px] font-semibold text-label">No products yet</p>
                <p className="mx-auto mt-1 max-w-xs text-[15px] leading-snug text-label-2">
                  Add a photo, a name and a price. Customers can order right away.
                </p>
                <Button href={`/vendor/products/new?${q}`} size="md" className="mt-4">
                  <Plus className="h-[18px] w-[18px]" aria-hidden />
                  Add your first product
                </Button>
              </div>
            )}
          </section>

          {/* ── Shop settings ── */}
          <section className="mb-6">
            <SectionHeader title="Your shop" />
            <List>
              <Row
                href={`/vendor/settings?${q}`}
                leading={<IconBox tone="brand" size={40}><Store className="h-5 w-5" /></IconBox>}
                title="Shop details & photos"
                subtitle="Name, address, phone, UPI"
                chevron
              />
              <Row
                href={`/stores/${storeId}`}
                leading={<IconBox tone="brand" size={40}><Eye className="h-5 w-5" /></IconBox>}
                title="See my shop"
                subtitle="How customers see it"
                chevron
              />
              <Row
                href="/vendor/telegram"
                leading={<IconBox tone="brand" size={40}><Send className="h-5 w-5" /></IconBox>}
                title="Order alerts on Telegram"
                subtitle="Get a message for every new order"
                chevron
              />
            </List>
          </section>

          {/* ── All shops ── */}
          <section className="mb-6">
            <SectionHeader title={stores.length > 1 ? `Your shops · ${stores.length}` : "More shops"} />
            <List>
              {stores.length > 1 &&
                stores.map((s) => {
                  const st = shopStatus(s.status);
                  return (
                    <Row
                      key={s.id}
                      href={`/vendor/settings?storeId=${s.id}`}
                      leading={<Thumb src={s.storeLogo} alt={s.businessName} size={40} />}
                      title={<span className="line-clamp-1">{s.businessName}</span>}
                      subtitle={s.city}
                      trailing={<Pill tone={st.tone}>{st.label}</Pill>}
                    />
                  );
                })}
              <Row
                href="/become-vendor"
                leading={<IconBox tone="neutral" size={40}><Plus className="h-5 w-5" /></IconBox>}
                title="Open another shop"
                subtitle="Another branch or a new business"
                chevron
              />
            </List>
          </section>
        </div>
      </div>

      <ShareStoreModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        storeId={storeId}
        storeName={shop.businessName}
        storeDescription={null}
      />
    </div>
  );
}
