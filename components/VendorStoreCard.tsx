"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, MapPin, Settings, Store } from "lucide-react";
import { Pill } from "@/components/app/ui";
import { shopStatus } from "@/components/app/seller";

interface VendorStoreCardProps {
  store: {
    id: string;
    businessName: string;
    businessType: string;
    storeDescription?: string | null;
    storeLogo: string | null;
    storeImages?: string[] | null;
    city: string;
    status: string;
    isActive: boolean;
    productCount?: number;
    orderCount?: number;
    pendingOrders?: number;
  };
  isSelected?: boolean;
  onSelect?: (storeId: string) => void;
  showStats?: boolean;
  /** Kept for callers; both card actions always show */
  showManageButton?: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  GROCERY: "Grocery",
  RESTAURANT: "Food",
  PHARMACY: "Medical",
  ELECTRONICS: "Electronics",
  FASHION: "Fashion",
  HOME_SERVICES: "Services",
  OTHER: "Shop",
};

/** One of the seller's shops: photo, name, place, status and two clear actions */
export default function VendorStoreCard({
  store,
  isSelected = false,
  onSelect,
  showStats = false,
}: VendorStoreCardProps) {
  const photo = [store.storeImages?.[0], store.storeLogo].find(Boolean) as string | undefined;
  const status = shopStatus(store.status);

  return (
    <article
      className={`overflow-hidden rounded-3xl bg-card transition-shadow ${
        isSelected ? "ring-2 ring-tint" : ""
      } ${onSelect ? "cursor-pointer" : ""}`}
      onClick={onSelect ? () => onSelect(store.id) : undefined}
    >
      <div className="relative aspect-[16/9] w-full bg-fill">
        {photo ? (
          <Image src={photo} alt={store.businessName} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Store className="h-14 w-14 text-label-3" strokeWidth={1.5} aria-hidden />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[13px] font-semibold text-label">
          {TYPE_LABEL[store.businessType] ?? "Shop"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 text-[18px] font-bold leading-snug text-label line-clamp-2">{store.businessName}</h2>
          <Pill tone={status.tone}>{status.label}</Pill>
        </div>
        {store.storeDescription && (
          <p className="mt-1 text-[15px] leading-snug text-label-2 line-clamp-2">{store.storeDescription}</p>
        )}
        <p className="mt-1.5 flex items-center gap-1 text-[15px] text-label-2">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {store.city}
        </p>

        {showStats && (
          <div className="mt-4 grid grid-cols-3 divide-x divide-hairline rounded-2xl bg-fill py-3 text-center">
            <div>
              <p className="text-[20px] font-bold tabular-nums text-label">{store.productCount || 0}</p>
              <p className="text-[13px] text-label-2">Products</p>
            </div>
            <div>
              <p className="text-[20px] font-bold tabular-nums text-label">{store.orderCount || 0}</p>
              <p className="text-[13px] text-label-2">Orders</p>
            </div>
            <div>
              <p className={`text-[20px] font-bold tabular-nums ${store.pendingOrders ? "text-warn" : "text-label"}`}>
                {store.pendingOrders || 0}
              </p>
              <p className="text-[13px] text-label-2">New</p>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href={`/stores/${store.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-label/20 bg-card text-[15px] font-semibold text-label hover:bg-fill"
          >
            <Eye className="h-[18px] w-[18px]" aria-hidden />
            See shop
          </Link>
          <Link
            href={`/vendor/settings?storeId=${store.id}`}
            onClick={(e) => e.stopPropagation()}
            className="flex h-11 items-center justify-center gap-2 rounded-full bg-label text-[15px] font-semibold text-white hover:bg-navy-2"
          >
            <Settings className="h-[18px] w-[18px]" aria-hidden />
            Manage
          </Link>
        </div>
      </div>
    </article>
  );
}
