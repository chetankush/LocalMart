import { IndianRupee, MessageCircle, Star, Store, Truck, Wallet, type LucideIcon } from "lucide-react";

/**
 * The "why buy here" strip on a shop page, built only from what is true for
 * this shop — never blanket claims like "Free delivery", "7-day returns" or
 * "100% authentic" that the shop never promised.
 */
export type ShopPromise = { key: string; icon: LucideIcon; title: string; text: string };

type ShopLike = {
  upiId?: string | null;
  canDeliver?: boolean | null;
  maxDeliveryDistance?: number | null;
  city?: string | null;
  locality?: string | null;
  averageRating?: number | string | null;
  reviewCount?: number | null;
};

export function shopPromises(shop: ShopLike, max = 4): ShopPromise[] {
  const list: ShopPromise[] = [{ key: "cod", icon: Wallet, title: "Cash on delivery", text: "Pay when it arrives" }];

  if (shop.canDeliver !== false) {
    list.push({
      key: "delivery",
      icon: Truck,
      title: "Home delivery",
      text: shop.maxDeliveryDistance ? `Within ${shop.maxDeliveryDistance} km` : shop.city ? `In ${shop.city}` : "Near the shop",
    });
  }
  if (shop.upiId) list.push({ key: "upi", icon: IndianRupee, title: "UPI to the shop", text: "Pay the shop directly" });

  const reviews = Number(shop.reviewCount || 0);
  const rating = Number(shop.averageRating || 0);
  if (reviews > 0 && rating > 0) {
    list.push({
      key: "rating",
      icon: Star,
      title: `Rated ${rating.toFixed(1)}`,
      text: `${reviews} review${reviews === 1 ? "" : "s"}`,
    });
  }
  // Every shop can be messaged from LocalMart (the number itself stays private)
  list.push({ key: "message", icon: MessageCircle, title: "Message the shop", text: "Ask before you buy" });
  list.push({ key: "visit", icon: Store, title: "Visit the shop", text: shop.locality || shop.city || "See it in person" });

  return list.slice(0, max);
}
