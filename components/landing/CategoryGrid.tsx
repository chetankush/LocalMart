/**
 * The kinds of shop LocalMart offers. It starts in Guna with fashion, so
 * there are three: sarees & lehengas, clothes, and footwear. A shop's kind
 * follows its page design (saree / clothes / shoes). Each tile opens the
 * shops of that kind. Shared by the home page's category showcase and hero.
 */

export interface Tile {
  label: string;
  hindi: string;
  slug: string; // /stores?category=<slug>
  type: string; // vendor businessType that serves it
  /** The kind of shop that serves it: see shopKind() */
  kind: ShopKind;
  image: string;
}

export type ShopKind = "SAREE" | "CLOTHING" | "SHOES";

const U = (id: string) => `https://images.unsplash.com/${id}?w=300&h=300&fit=crop`;

// Shared with the home page category showcase
export const GROUPS: { title: string; tiles: Tile[] }[] = [
  {
    title: "Fashion",
    tiles: [
      { label: "Sarees & lehengas", hindi: "साड़ी, लहंगा", slug: "sarees", type: "FASHION", kind: "SAREE", image: U("photo-1610030469983-98e550d6193c") },
      { label: "Clothes", hindi: "कपड़े", slug: "clothes", type: "FASHION", kind: "CLOTHING", image: U("photo-1445205170230-053b83016050") },
      { label: "Footwear", hindi: "जूते, चप्पल", slug: "shoes", type: "FASHION", kind: "SHOES", image: U("photo-1549298916-b41d501d3772") },
    ],
  },
];

/** The /stores?category=<slug> values that pick one kind of shop */
export const KIND_BY_SLUG: Record<string, ShopKind> = { sarees: "SAREE", clothes: "CLOTHING", shoes: "SHOES" };

/**
 * Which kind a shop is, from its page design. A fashion shop with the
 * general design counts as clothes. Anything else (an old non-fashion shop)
 * has no kind and shows only under "All shops".
 */
export function shopKind(shop: { businessType?: string | null; storeTheme?: string | null }): ShopKind | null {
  if (shop.storeTheme === "SAREE") return "SAREE";
  if (shop.storeTheme === "SHOES") return "SHOES";
  if (shop.storeTheme === "CLOTHING") return "CLOTHING";
  return shop.businessType === "FASHION" ? "CLOTHING" : null;
}
