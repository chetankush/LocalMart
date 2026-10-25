/**
 * Shop page photo spots — shared by the seller's "Design my shop page"
 * screen and the shop page itself, so both agree on which tiles exist.
 *
 * A seller's own photos are saved in vendor.themeCustomization.pageImages
 * as { "fabric:silk": url, "occasion:wedding": url, ... }. A tile without
 * one keeps using a photo from the seller's products.
 */

export interface Collection {
  key: string;
  label: string;
  keywords: string[];
}

export const SAREE_FABRICS: Collection[] = [
  { key: "banarasi", label: "Banarasi", keywords: ["banarasi", "benarasi", "banaras"] },
  {
    key: "kanjivaram",
    label: "Kanjivaram",
    keywords: ["kanjivaram", "kanjeevaram", "kanchipuram", "kancheepuram"],
  },
  { key: "silk", label: "Silk", keywords: ["silk", "pattu"] },
  { key: "cotton", label: "Cotton", keywords: ["cotton"] },
  { key: "georgette", label: "Georgette", keywords: ["georgette"] },
  { key: "chiffon", label: "Chiffon", keywords: ["chiffon"] },
  { key: "organza", label: "Organza & Tissue", keywords: ["organza", "tissue"] },
  { key: "linen", label: "Linen", keywords: ["linen"] },
  {
    key: "fancy",
    label: "Fancy & Designer",
    keywords: ["fancy", "designer", "embroider", "sequin", "stone work"],
  },
];

export const SAREE_OCCASIONS: Collection[] = [
  { key: "wedding", label: "Wedding", keywords: ["wedding", "bridal", "shaadi", "marriage"] },
  {
    key: "festive",
    label: "Festive",
    keywords: ["festive", "festival", "diwali", "puja", "pooja", "navratri"],
  },
  { key: "party", label: "Party Wear", keywords: ["party"] },
  { key: "office", label: "Office Wear", keywords: ["office", "formal", "workwear"] },
  { key: "daily", label: "Daily Wear", keywords: ["daily", "casual", "everyday", "regular"] },
];

/** Key of a tile's photo in pageImages */
export const fabricSpot = (key: string) => `fabric:${key}`;
export const occasionSpot = (key: string) => `occasion:${key}`;

/** The seller's own photos, from vendor.themeCustomization */
export function pageImagesOf(themeCustomization: unknown): Record<string, string> {
  const custom =
    themeCustomization && typeof themeCustomization === "object" && !Array.isArray(themeCustomization)
      ? (themeCustomization as { pageImages?: unknown })
      : {};
  const raw = custom.pageImages;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).filter(
      (e): e is [string, string] => typeof e[1] === "string" && e[1].length > 0,
    ),
  );
}

/** A product's photos as a clean list (the API sends JSON or an array) */
export function imageList(value: unknown): string[] {
  let list = value;
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      return [];
    }
  }
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string" && x.length > 0) : [];
}

type Searchable = {
  name: string;
  description?: string | null;
  category?: { name?: string | null } | null;
  tags?: string[] | null;
};

/** The words a product is matched on (name, description, category, tags) */
export const searchTextOf = (p: Searchable) =>
  [p.name, p.description, p.category?.name, ...(p.tags || [])].filter(Boolean).join(" ").toLowerCase();

export const matchesCollection = (text: string, c: Collection) => c.keywords.some((k) => text.includes(k));
