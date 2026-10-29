import { Home, Pill, Shirt, ShoppingBasket, Smartphone, Store, UtensilsCrossed, type LucideIcon } from "lucide-react";

/**
 * How each kind of shop looks on the map: a plain-words name, a pin colour
 * (like Google Maps — green for groceries, red for health, blue for
 * electronics) and an icon.
 */
export interface ShopTypeMeta {
  label: string;
  color: string;
  Icon: LucideIcon;
}

export const SHOP_TYPES: Record<string, ShopTypeMeta> = {
  FASHION: { label: "Sarees & fashion", color: "#C2185B", Icon: Shirt },
  GROCERY: { label: "Kirana & dairy", color: "#0B8043", Icon: ShoppingBasket },
  PHARMACY: { label: "Medicines", color: "#D93025", Icon: Pill },
  ELECTRONICS: { label: "Mobiles & electronics", color: "#1A73E8", Icon: Smartphone },
  RESTAURANT: { label: "Food & sweets", color: "#E8710A", Icon: UtensilsCrossed },
  HOME_SERVICES: { label: "Home & kitchen", color: "#8E24AA", Icon: Home },
  OTHER: { label: "Shop", color: "#5F6368", Icon: Store },
};

export const shopType = (type: string | null | undefined): ShopTypeMeta => SHOP_TYPES[type ?? ""] ?? SHOP_TYPES.OTHER;

/** "350 m" / "1.2 km" */
export function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined) return null;
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Google Maps directions to a shop — opens their app on phones */
export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
