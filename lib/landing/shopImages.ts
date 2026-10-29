/**
 * Pictures for a shop card: the owner's own banner first, else a collage of
 * their latest product photos, else a photo for the kind of shop.
 */
const U = (id: string) => `https://images.unsplash.com/${id}?w=800&h=450&fit=crop`;

const BY_TYPE: Record<string, string> = {
  GROCERY: U("photo-1542838132-92c53300491e"),
  FASHION: U("photo-1610030469983-98e550d6193c"),
  PHARMACY: U("photo-1585435557343-3b092031a831"),
  ELECTRONICS: U("photo-1498049794561-7780e7231661"),
  RESTAURANT: U("photo-1504674900247-0877df9cc836"),
  HOME_SERVICES: U("photo-1556020685-ae41abfc9365"),
};

function firstImage(images: unknown): string | null {
  return Array.isArray(images) && typeof images[0] === "string" ? (images[0] as string) : null;
}

export function shopPictures(v: {
  businessType?: string;
  storeImages?: unknown;
  products?: { images: unknown }[] | null;
}): { banner: string | null; collage: string[]; fallback: string } {
  const banner = firstImage(v.storeImages);
  const collage = (v.products ?? []).map((p) => firstImage(p.images)).filter(Boolean) as string[];
  return {
    banner,
    collage: [...new Set(collage)].slice(0, 3),
    fallback: BY_TYPE[v.businessType ?? ""] ?? U("photo-1604719312566-8912e9227c6a"),
  };
}

export const SHOP_KIND: Record<string, string> = {
  GROCERY: "Grocery & kirana",
  FASHION: "Fashion & sarees",
  PHARMACY: "Medical store",
  ELECTRONICS: "Mobiles & electronics",
  RESTAURANT: "Food & sweets",
  HOME_SERVICES: "Home & kitchen",
  OTHER: "Shop",
};
